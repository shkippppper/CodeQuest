## The problem: work that takes time

Run this:

```swift
let data = downloadFile()   // takes 3 seconds
print("done")
```

If `downloadFile()` simply runs until the download finishes, the thread it's on is stuck for 3 seconds. On the main thread, that's a frozen app — no scrolling, no taps, nothing.

The classic fix, from the GCD lesson, is to hand the work a closure to call when it's done:

```swift
downloadFile { data in
    print("done")           // runs 3 seconds later
}
```

That closure is a **completion handler** — a function you pass in, to be called later with the result. It unfreezes the app, but watch what happens when steps start to chain.

## Watch callbacks turn into a pyramid

Two steps: fetch data, then decode it. Each step is asynchronous, so each needs its own completion handler:

```swift
fetchData { data in
    decode(data) { user in
        print(user.name)
    }
}
```

Already one level of nesting. Now add error handling, the way real code must:

```swift
func loadUser(completion: @escaping (Result<User, Error>) -> Void) {
    fetchData { result in
        switch result {
        case .success(let data):
            decode(data) { user in
                completion(.success(user))
            }
        case .failure(let error):
            completion(.failure(error))
        }
    }
}
```

Look closely at the `.success` branch. If you forget that one `completion(.success(user))` line, the function compiles fine — and the caller waits forever. The compiler cannot check that you call the completion handler exactly once on every path.

So callbacks have three built-in problems: they nest deeper with every step, forgetting to call them is a silent bug, and errors have to be hand-carried through every layer.

## The same logic, written straight down

Here is `loadUser` again, using Swift 5.5's `async`/`await`:

```swift
func loadUser() async throws -> User {
    let data = try await fetchData()
    let user = try await decode(data)
    return user
}
```

It reads top to bottom, like ordinary synchronous code. Errors use the ordinary `throws` machinery from the error-handling lesson. And the compiler now *enforces* that every path returns a `User` or throws — the "forgot to call completion" bug is impossible.

The `async` keyword on the function means: this function is allowed to pause partway through and continue later. Each pause-and-resume spot is marked with `await`.

## What actually happens at an `await`

Zoom in on one line:

```swift
let data = try await fetchData()   // may pause here
```

The `await` marks a **suspension point** — a place where the function may pause, hand its thread back to the system, and resume when the result is ready.

Here's the question interviewers use to separate people who've read about this from people who understand it. While `loadUser` is suspended waiting for the network, what is its thread doing?

Answer: anything *except* waiting. A suspended function occupies *no thread at all*. The thread is released and free to run other work — drawing UI, running other tasks. Compare that with a blocking call, where the thread sits parked and useless for the whole 3 seconds.

Two more details of the mental model:

- When the awaited work finishes, the function resumes — *possibly on a different thread* than the one it started on.
- `await` means the function *might* pause there. If the result is already available, it may not pause at all.

One syntax rule: when a call is both throwing and async, the keywords always come in the order `try await`.

## Where you're allowed to write `await`

Try to `await` inside a button handler:

```swift
Button("Load") {
    let user = try await loadUser()   // ❌ won't compile
}
```

The handler is a synchronous function — it has no ability to suspend. `await` is only legal in an asynchronous context: inside another `async` function, or inside a `Task`. To bridge from the synchronous world, you wrap the work in one:

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

A `Task` is a unit of asynchronous work. It starts running immediately when created — no `.start()` call — and by default it inherits the current actor and the current priority. Actors get their own lesson soon; for now, read "inherits the current actor" as "if you create it from main-thread UI code, it stays on the main thread."

## Two awaits run one after another

Suppose each image takes 2 seconds to fetch. Predict the total time:

```swift
let first  = await fetchImage(1)
let second = await fetchImage(2)
```

Answer: about 4 seconds. Each `await` waits for its line to fully finish before the next line starts. Two sequential awaits means the times *add*.

That's correct when line two needs line one's result. But these two fetches are independent — running them one at a time is pure waste.

## Starting both at once with `async let`

Change `let` to `async let`:

```swift
async let first  = fetchImage(1)   // starts running NOW
async let second = fetchImage(2)   // also starts NOW, in parallel
let images = await [first, second] // suspend until both are done
```

An `async let` starts the work immediately as a *child task* — a separate piece of concurrent work owned by this function. The function only suspends later, at the point where it actually `await`s the values. Total time: about 2 seconds — the *maximum* of the two, not the sum.

## A dynamic number of parallel fetches

`async let` needs you to know at compile time how many tasks there are. For "one task per element of this array", use a task group:

```swift
try await withThrowingTaskGroup(of: UIImage.self) { group in
    for id in ids {
        group.addTask { try await fetchImage(id) }   // one child per id
    }
    // ...
}
```

Each `addTask` starts a child task immediately, all running in parallel. Then, still inside the same closure, you collect the results as they finish:

```swift
    var result: [UIImage] = []
    for try await image in group {   // suspends until the next child finishes
        result.append(image)
    }
    return result
```

Note the results arrive in *completion* order, not the order you added them.

## Child tasks can't outlive their parent

`async let` and task groups share a property worth naming: the child tasks are bound to the scope that created them. The parent function cannot return until every child has finished. And if the parent is cancelled, the cancellation flows down to the children automatically.

This discipline — every task lives inside a parent scope, forming a tree — is called **structured concurrency**. Its guarantee: no task ever accidentally outlives the code that started it. That's a major reliability win over GCD, where a dispatched block floats free with no owner. It gets its own full lesson next.

A bare `Task { }` is the exception — it's *unstructured*. It isn't tied to the scope that created it, so you manage its lifetime yourself, usually by keeping its handle:

```swift
let handle = Task { await doWork() }
// later:
handle.cancel()
```

## Cancellation is a request, not a kill switch

What does `handle.cancel()` actually do to a running task? It does not stop it. It sets a flag on the task — nothing more. The task must notice the flag and stop *itself*:

```swift
for id in ids {
    try Task.checkCancellation()   // throws CancellationError if the flag is set
    await process(id)
}
```

This is called **cooperative cancellation** — the task cooperates by checking. Two ways to check: `Task.checkCancellation()` throws a `CancellationError`, or read the plain `Task.isCancelled` flag and bail out however you like.

Apple's async APIs — `URLSession`, `Task.sleep` — already check the flag internally and throw when cancelled. It's your own long loops and CPU-heavy work that need explicit checks; forget them and `cancel()` silently does nothing.

## Getting back to the main thread

UI must only be touched from the main thread — but you just learned an async function can resume on *any* thread. The modern guarantee is the `@MainActor` attribute:

```swift
@MainActor
func updateLabel(_ text: String) {
    label.text = text   // compiler guarantees: main thread
}
```

Mark a function, type, or property `@MainActor` and the compiler ensures it runs on the main thread — callers from elsewhere must `await` the hop. For a one-off block inside an async function, there's also:

```swift
await MainActor.run {
    label.text = "done"
}
```

Both replace the old `DispatchQueue.main.async`. The full story — including how tasks inherit main-actor context — has its own lesson.

## Common pitfalls

- **Sequential awaits on independent work.** `await a(); await b()` adds the times. If `b` doesn't need `a`'s result, use `async let` to overlap them.
- **Thinking `await` blocks the thread.** It doesn't — the function suspends and the thread is released. That's the whole point.
- **Calling `cancel()` and assuming work stopped.** Cancellation only sets a flag; loops that never check `Task.isCancelled` run to completion anyway.
- **Errors vanishing inside `Task { }`.** A throw inside a bare `Task` goes nowhere unless you `catch` it in the task or keep the handle and `try await handle.value`.

## Interview lens

If asked "what does `await` do?", don't say "it waits". Say it marks a suspension point: the function may pause there, the thread is *released* (not blocked), and the function resumes later — possibly on a different thread. Interviewers are listening for the released-thread part.

The classic practical question is two independent network calls: "how do you halve the latency?" Sequential `await`s add the durations; `async let` (fixed number of tasks) or a `TaskGroup` (dynamic number) run them in parallel, so total time is the max, not the sum.

Expect "how does cancellation work?" The answer is one word plus an explanation: *cooperative*. Cancelling sets a flag; the task must check it via `Task.checkCancellation()` or `Task.isCancelled`. Built-in APIs like `URLSession` check for you; your own loops must do it explicitly.

Finally, know the structured/unstructured split: `async let` and task groups create child tasks bound to their parent scope — the parent waits for them and cancellation propagates automatically — while a bare `Task { }` is unstructured and its lifetime is your problem.
