## The problem: old code speaks in callbacks

Here's how most existing iOS code — and plenty of Apple's own APIs — delivers a result:

```swift
legacyLoad { data in
    print("got \(data.count) bytes")
}
```

`legacyLoad` takes a closure and calls it later, when the data is ready. That closure is a **completion handler** — a function you hand over so the API can "complete" by calling it.

Now try to use that from modern async code:

```swift
func loadData() async -> Data {
    legacyLoad { data in
        // the data arrives HERE... but how do I return it?
    }
    // ??? nothing to return yet
}
```

You're stuck. `await` only works on `async` functions, and `legacyLoad` isn't one. The data shows up inside a closure, long after `loadData` would have already returned.

Swift's bridge for this gap is the **continuation** — a small handle that can pause an async function and resume it later, from inside any callback.

## Wrap one callback in an async function

Start with the skeleton:

```swift
func loadData() async -> Data {
    await withCheckedContinuation { continuation in
        // old-style code goes here
    }
}
```

`withCheckedContinuation` does two things. It **suspends** the current task — pauses it without blocking a thread — and it hands your closure a `continuation` object that can un-pause it.

Now call the legacy API inside:

```swift
func loadData() async -> Data {
    await withCheckedContinuation { continuation in
        legacyLoad { data in
            continuation.resume(returning: data)   // un-pause, deliver the value
        }
    }
}
```

Walk the timeline. `loadData` is called, reaches the `await`, and suspends. Sometime later `legacyLoad` finishes and calls its completion handler. The handler calls `resume(returning: data)` — and the suspended `loadData` wakes up, with `data` as the result of the whole `await` expression.

To callers, the ugly callback has vanished:

```swift
let data = await loadData()   // just a normal async call
```

That's the entire pattern: call the continuation function, invoke the old API inside, resume from the callback.

## Callbacks that can fail

Real callbacks usually deliver a value *or* an error. The common shape is a `Result`:

```swift
legacyFetch { (result: Result<Data, Error>) in ... }
```

For those, use the throwing variant, which lets you resume with either outcome:

```swift
func fetch() async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
        legacyFetch { result in
            switch result {
            case .success(let data):  continuation.resume(returning: data)
            case .failure(let error): continuation.resume(throwing: error)
            }
        }
    }
}
```

`resume(returning:)` makes the `await` produce a value. `resume(throwing:)` makes it throw — the caller catches the error exactly as if `fetch` had thrown it directly.

There's a shortcut when you already have a `Result` or something you can build one from:

```swift
continuation.resume(with: result)                          // Result in, done
continuation.resume(with: Result { try validate(value, error) })   // the (T?, Error?) shape
```

That second line handles the old Objective-C convention of passing *two* optionals — a maybe-value and a maybe-error — by folding the validation into a `Result`.

So: `withCheckedContinuation` for callbacks that always succeed, `withCheckedThrowingContinuation` for callbacks that can fail.

## The one iron law: resume exactly once

Every continuation must be resumed **exactly once**. Not zero times. Not twice. This rule is the whole topic's danger zone, so let's break both directions.

### Resuming twice crashes

```swift
legacyLoad { data in
    continuation.resume(returning: data)
    continuation.resume(returning: data)   // 💥 crash (checked variant traps here)
}
```

A continuation represents *one* pending `await`. Once resumed, the task has already moved on — there is nothing left to resume. The second call is a hard runtime error.

The sneaky version is a callback that fires more than once — say, a handler that reports progress repeatedly, or an API where both a success handler *and* a timeout handler can fire. Each firing calls `resume`, and the second one crashes.

### Never resuming hangs forever

Now predict: what happens to the code below if `data` comes back `nil`?

```swift
legacyLoad { data in
    guard let data else { return }          // bail out early
    continuation.resume(returning: data)
}
```

Answer: nothing crashes — and nothing ever runs again. The `guard` returns without resuming, so the awaiting task stays suspended *forever*. No error, no log, just a code path that silently never continues. This is the classic continuation bug, and it's worse than a crash because nothing tells you.

The fix is to make *every* path resume:

```swift
legacyLoad { data in
    guard let data else {
        continuation.resume(throwing: LoadError.noData)   // error path resumes too
        return
    }
    continuation.resume(returning: data)
}
```

Audit the callback like a bookkeeper: each way out must resume exactly once.

## What "checked" buys you

The word **checked** in `withCheckedContinuation` means Swift adds runtime bookkeeping to catch violations of the iron law:

- Resume twice → it traps immediately with a clear message pointing at the double resume.
- Drop the continuation without ever resuming → it logs a warning that a continuation leaked.

There's a sibling, `withUnsafeContinuation`, that skips those checks for a tiny performance win:

```swift
await withUnsafeContinuation { continuation in ... }   // no safety net
```

With the unsafe variant, a double resume is undefined behavior instead of a clean trap. The sane workflow: develop and test with the checked version, and only consider the unsafe one in a proven-hot path after the code is verified correct. Most code never needs it.

## Which thread resumes the task

One more mechanic worth knowing: `resume` can be called from *any* thread.

```swift
legacyLoad { data in
    // this callback might run on some random background queue
    continuation.resume(returning: data)   // still fine
}
```

Calling `resume` doesn't run the awaiting code right there on the callback's thread. It just *schedules* the suspended task to continue on whatever executor it belongs to — an executor being the thing responsible for running a task, like the main actor for UI code. You don't need to hop threads before resuming.

## A continuation is for one result only

A continuation models a single answer to a single question. Some callback APIs don't fit that shape — they fire repeatedly:

```swift
locationManager.onUpdate { location in
    continuation.resume(returning: location)   // 💥 crashes on the SECOND update
}
```

A stream of values needs a different bridge: `AsyncStream`, which lets a callback *yield* many values into a `for await` loop. It has its own lesson — here, the takeaway is just the boundary. One-shot callback → continuation. Repeating callback → `AsyncStream`.

## Common pitfalls

- **An early `return` or `guard` that skips `resume`.** The task hangs forever, silently. Every path through the callback must resume — error paths resume with `throwing:`.
- **Wrapping a callback that fires more than once.** Second fire = second resume = crash. Use `AsyncStream` for multi-value sources.
- **Two handlers racing to resume** — e.g. a success handler and a timeout handler that can both fire. Design so only one path can resume, or guard with a flag.
- **Reaching for `withUnsafeContinuation` by default.** The checked variant's traps and leak warnings are how you *find* these bugs. Go unsafe only after correctness is proven, and only if profiling justifies it.

## Interview lens

The core question is "how do you wrap a completion-handler API in async/await?" Answer with the pattern: `withCheckedContinuation` for callbacks that can't fail, `withCheckedThrowingContinuation` for the `Result` or value-plus-error shape — call the legacy API inside the closure, and call `continuation.resume(returning:)` or `resume(throwing:)` from the callback.

The senior signal they're fishing for is the resume-exactly-once rule. Say it explicitly: resuming twice crashes, never resuming leaves the task suspended forever — and the "checked" variant exists precisely to trap the double resume and log the leaked one, unlike the faster `withUnsafeContinuation`.

If they push further, name the classic hang — a `guard` or error path that returns without resuming — and the boundary case: a continuation is for a single result, so a callback that fires repeatedly should be bridged with `AsyncStream` instead. Knowing that `resume` can be called from any thread, because it merely schedules the task on its executor, rounds out the answer.
