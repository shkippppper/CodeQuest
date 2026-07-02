## The problem: a sea of completion handlers

Most existing iOS code — and plenty of system APIs — report results through **completion handlers**: `func load(_ completion: @escaping (Result<Data, Error>) -> Void)`. You can't `await` those directly. **Continuations** are the bridge: they let you suspend an async function, hand a callback the ability to resume it with a value, and thereby wrap any callback-based API as a clean `async` function.

## Bridging callbacks to async

The pattern: call `withCheckedContinuation`, invoke the old callback API inside, and **resume** the continuation from the callback with the result.

```swift
func loadData() async -> Data {
    await withCheckedContinuation { continuation in
        legacyLoad { data in
            continuation.resume(returning: data)   // callback → resumes await
        }
    }
}
```

`await withCheckedContinuation { ... }` suspends the calling task; the closure gets a `continuation`; when `resume` is called, the awaiting code continues with that value. To the caller, `loadData()` is just a normal `async` function.

## `withCheckedContinuation`

Use `withCheckedContinuation` for callbacks that **can't fail** (they always deliver a value). It gives you a `CheckedContinuation` with `resume(returning:)`.

## `withCheckedThrowingContinuation`

For callbacks that can deliver **either a value or an error** (the common `Result` or `(T?, Error?)` shape), use the throwing variant and resume accordingly:

```swift
func fetch() async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
        legacyFetch { result in
            switch result {
            case .success(let data): continuation.resume(returning: data)
            case .failure(let error): continuation.resume(throwing: error)
            }
        }
    }
}

// The (value?, error?) shape:
continuation.resume(with: Result { try validate(value, error) })
```

## The resume-exactly-once rule

The iron law: a continuation **must be resumed exactly once** — no more, no less.

- **Resume more than once** → runtime crash (or undefined behavior with the unsafe variant). Callbacks that fire multiple times (e.g. a repeating handler) are a common cause.
- **Never resume** → the awaiting task is **suspended forever** — a leak that hangs that code path silently.

The **"checked"** continuation exists precisely to catch these: it detects a double-resume (traps with a clear message) and logs if a continuation is discarded without being resumed. `withUnsafeContinuation` skips those checks for a tiny performance win — use it only after you've verified correctness with the checked version.

## Pitfalls

- **Early returns / error paths that skip `resume`.** If a `guard` bails out of the callback before resuming, the task hangs. Make sure *every* path through the callback resumes exactly once.
- **Callbacks that fire repeatedly.** A continuation models a *single* result. For a source that emits many values, use `AsyncStream`, not a continuation.
- **Capturing the continuation and calling it twice** (e.g. both a success and a timeout handler fire). Guard against it or design so only one path resumes.
- **Resuming on the wrong assumptions about threading.** `resume` can be called from any thread; it just schedules the awaiting task to continue on its executor.

## The interview lens

The core question: *"How do you wrap a completion-handler API in `async`/`await`?"* — `withCheckedContinuation` (non-throwing) or `withCheckedThrowingContinuation` (Result/error), calling the legacy API inside and invoking `continuation.resume(returning:)` / `resume(throwing:)` from the callback.

The senior emphasis is the **resume-exactly-once** invariant: resuming twice **crashes**, never resuming **leaks/hangs the task forever**, and the **checked** variant is what surfaces both bugs (vs the faster-but-unsafe `withUnsafeContinuation`). Bonus: know that a continuation is for a **single** result — a callback that fires repeatedly should be bridged with `AsyncStream` instead — and that missing a `resume` on an error/`guard` path is the classic hang.
