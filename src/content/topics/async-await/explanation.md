## The problem with callbacks

Before Swift 5.5, asynchronous code meant completion handlers. They nest, they're easy to forget to call, and error handling is bolted on:

```swift
func loadUser(completion: @escaping (Result<User, Error>) -> Void) {
    fetchData { result in
        switch result {
        case .success(let data):
            decode(data) { decoded in
                completion(.success(decoded)) // easy to forget on some path
            }
        case .failure(let error):
            completion(.failure(error))
        }
    }
}
```

`async`/`await` lets you write the same logic as straight-line code that *reads* synchronous but *runs* asynchronously.

## `async` functions and `await`

Marking a function `async` means it can **suspend** — pause partway through, give the thread back to the system, and resume later. You call such a function with `await`, which marks the **suspension point**.

```swift
func loadUser() async throws -> User {
    let data = try await fetchData()   // may suspend here
    let user = try await decode(data)  // and here
    return user
}
```

At each `await`, the function may suspend. While suspended it occupies **no thread** — the thread is free to do other work. When the awaited operation finishes, the function resumes (possibly on a different thread). This is the key mental model: `await` is a point where the function *might* pause, not a blocking call.

`async` and `throws` compose; the order in a call is always `try await`.

## Where can you call async code?

You can only `await` from an asynchronous context: another `async` function, or a `Task`. You can't just call `await` from `main()` or a synchronous button handler. To bridge from sync to async, you create a `Task`:

```swift
Button("Load") {
    Task {
        do {
            let user = try await loadUser()
            print(user.name)
        } catch {
            print("Failed: \(error)")
        }
    }
}
```

A `Task` is a unit of asynchronous work that starts running immediately on creation. It inherits the current actor and priority by default.

## Sequential vs. parallel

A common interview trap. Each `await` runs **sequentially** — the next line waits for the previous to finish:

```swift
// Sequential: total time ≈ A + B
let first = await fetchImage(1)
let second = await fetchImage(2)
```

If the two operations are independent, that's wasteful. Use `async let` to start them **concurrently** and await the results later:

```swift
// Parallel: total time ≈ max(A, B)
async let first = fetchImage(1)
async let second = fetchImage(2)
let images = await [first, second] // both already running
```

`async let` is a *child task* that begins immediately. You only suspend when you actually `await` its value. For a dynamic number of parallel tasks, use a `TaskGroup`:

```swift
let images = try await withThrowingTaskGroup(of: UIImage.self) { group in
    for id in ids {
        group.addTask { try await fetchImage(id) }
    }
    var result: [UIImage] = []
    for try await image in group {
        result.append(image)
    }
    return result
}
```

## Structured concurrency

`async let` and task groups are **structured**: child tasks are bound to the scope that created them. The parent cannot return until its children finish, and if the parent is cancelled, cancellation propagates to the children automatically. This guarantees no task outlives its scope by accident — a huge reliability win over free-floating threads.

A standalone `Task { }` is **unstructured** — it's not tied to the surrounding scope and you're responsible for its lifetime (you can hold its handle to `await` or `.cancel()` it).

## Cancellation is cooperative

Cancelling a task doesn't forcibly stop it. It sets a flag; your code must check it and stop voluntarily.

```swift
for id in ids {
    try Task.checkCancellation()   // throws CancellationError if cancelled
    await process(id)
}
```

Many built-in async APIs (like `URLSession`) already check cancellation for you and throw. Long custom loops should call `Task.checkCancellation()` or read `Task.isCancelled`.

## MainActor and UI updates

UI must be touched on the main thread. The `@MainActor` attribute guarantees code runs there. Mark a function, type, or property, and the compiler enforces it:

```swift
@MainActor
func updateLabel(_ text: String) {
    label.text = text // guaranteed on the main thread
}
```

Inside an async function you can also hop explicitly with `await MainActor.run { ... }`. This replaces the old `DispatchQueue.main.async`.

## The interview lens

Be ready to contrast **sequential `await`** with **`async let`/`TaskGroup`** for parallelism — interviewers love handing you two independent network calls and asking how to halve the latency. Also know that `await` is a *suspension point* (the thread is released, not blocked), that structured concurrency ties child task lifetimes to their parent, and that cancellation is **cooperative**, not preemptive.
