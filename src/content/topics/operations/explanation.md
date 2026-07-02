## The problem: GCD closures can't be managed

A GCD block, once dispatched, is fire-and-forget — you can't cancel it, you can't say "run B only after A finishes," and you can't easily reuse it. **Operations** (`Operation` + `OperationQueue`) are a higher-level, object-oriented layer *built on top of GCD* that add exactly those capabilities: cancellation, dependencies, priorities, and reusable units of work you can subclass and test.

## `Operation` vs GCD

GCD is lightweight and closure-based; Operations are heavier objects with lifecycle and state. Reach for Operations when you need **management**, not just execution.

```swift
let queue = OperationQueue()

let op = BlockOperation {
    print("doing work")
}
queue.addOperation(op)
```

`BlockOperation` wraps a closure (like GCD), but because it's an object you can now cancel it, give it dependencies, set its priority, and observe its state.

## `OperationQueue`

An `OperationQueue` runs the operations you add to it, managing threads for you (it sits on GCD). You control how much runs at once:

```swift
let queue = OperationQueue()
queue.maxConcurrentOperationCount = 1   // serial
queue.qualityOfService = .userInitiated
```

Set `maxConcurrentOperationCount = 1` to make it **serial**; leave it at the default for concurrent. `OperationQueue.main` runs operations on the main thread.

## Dependencies

The headline feature: express **"run B after A"** declaratively, even across queues.

```swift
let download = BlockOperation { /* fetch */ }
let decode = BlockOperation { /* parse */ }

decode.addDependency(download)          // decode waits for download
queue.addOperations([download, decode], waitUntilFinished: false)
```

An operation won't start until **all** its dependencies have finished. This builds a small task graph without nested completion handlers ("callback pyramid"). Just don't create a **dependency cycle** — that deadlocks the graph.

## Cancellation

Every operation has an `isCancelled` flag and a `cancel()` method. Crucially, **cancellation is cooperative**: calling `cancel()` only sets the flag — your operation must *check it* and stop.

```swift
let op = BlockOperation()
op.addExecutionBlock {
    for item in items {
        if op.isCancelled { return }    // you must check
        process(item)
    }
}
queue.addOperation(op)
// later:
op.cancel()          // sets isCancelled; work stops only if it checks
queue.cancelAllOperations()
```

A cancelled operation that hasn't started yet simply never runs. One already running keeps going until it notices the flag.

## Custom async operations

`BlockOperation` finishes when its closure returns — fine for synchronous work. But for **asynchronous** work (a network call with a completion handler), you subclass `Operation`, override `isAsynchronous` to `true`, and manage the KVO-compliant `isExecuting`/`isFinished` state yourself, only marking `isFinished` when the async work truly completes.

```swift
final class AsyncOp: Operation {
    override var isAsynchronous: Bool { true }
    // manually manage isExecuting / isFinished with KVO notifications,
    // flipping isFinished = true only in the async completion callback.
}
```

This boilerplate (a "concurrent operation") is the price of composing async work with dependencies — and a big reason structured concurrency (`Task`/`TaskGroup`) is now often preferred for new code.

## When to prefer Operations

- You need **dependencies** between units of work.
- You need **cancellation** of in-flight or queued work.
- You want **reusable, testable** work objects (subclasses), or to observe progress.
- You're in an existing UIKit codebase already using them.

For brand-new async code, **structured concurrency** usually expresses the same ideas (`async let`, `TaskGroup`, automatic cancellation) with far less boilerplate — but Operations remain common and interview-relevant.

## The interview lens

The core question: *"Operations vs GCD — when and why?"* GCD is lightweight fire-and-forget; Operations add **cancellation, dependencies, priorities, and reusable/observable work objects** on top of GCD. Name the killer feature — **dependencies** (`addDependency`) for ordering work without nested callbacks — and the gotcha that **cancellation is cooperative** (`cancel()` only sets `isCancelled`; the work must check it).

A senior follow-up: *"How do you make an Operation that wraps an async call?"* — subclass `Operation`, set `isAsynchronous = true`, and manually drive the KVO `isExecuting`/`isFinished` state, flipping `isFinished` only when the async work completes. Mentioning that this boilerplate motivates modern structured concurrency shows perspective.
