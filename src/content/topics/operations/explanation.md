## The problem: a dispatched GCD block can't be managed

Dispatch a block with GCD and it starts running — that's the whole interface.

```swift
DispatchQueue.global().async {
    print("doing work")
}
```

Once that block is queued, there's no handle back to it. You can't cancel it, you can't tell it "wait until this other block finishes first," and you can't ask whether it's still running. For simple fire-and-forget work that's fine. For work you need to *manage*, it isn't enough.

## `Operation` vs GCD

`Operation` and `OperationQueue` are a layer built on top of GCD that wraps each unit of work in an object, which means that object can be held onto, inspected, and controlled.

```swift
let queue = OperationQueue()

let op = BlockOperation {
    print("doing work")
}
queue.addOperation(op)
```

This looks almost identical to the GCD version, but `op` is now a value you keep. Because it's an object rather than a bare closure, you can cancel it, give it dependencies, set its priority, and check its state — none of which was possible with the dispatched block above.

## `OperationQueue`

An `OperationQueue` runs whatever operations you add to it, using GCD threads underneath — you don't manage threads directly either way.

```swift
let queue = OperationQueue()
queue.maxConcurrentOperationCount = 1
```

Setting `maxConcurrentOperationCount = 1` makes the queue **serial** — one operation finishes before the next starts. Leave it at the default and the queue runs operations **concurrently**, deciding how many to run at once based on system resources.

```swift
queue.qualityOfService = .userInitiated
```

`qualityOfService` sets the priority for everything on this queue, same idea as GCD's QoS classes. And if you specifically need work on the main thread, `OperationQueue.main` is a special queue that always runs its operations there.

## Dependencies

This is the feature GCD has no equivalent for: telling one operation to wait for another.

```swift
let download = BlockOperation { /* fetch data */ }
let decode = BlockOperation { /* parse data */ }

decode.addDependency(download)
```

`decode.addDependency(download)` means `decode` will not start until `download` has finished — regardless of which queue either one runs on.

```swift
queue.addOperations([download, decode], waitUntilFinished: false)
```

Both operations go on the queue at once, but the queue itself enforces the ordering. This replaces what would otherwise be a nested completion handler — "when download finishes, kick off decode" — with a single declarative line. One thing to watch: if `download` ends up depending on `decode` too, directly or through a longer chain, neither can ever start. That's a **dependency cycle**, and it deadlocks the graph.

## Cancellation

Every operation carries an `isCancelled` flag and a `cancel()` method — but calling `cancel()` doesn't stop anything by itself.

```swift
let op = BlockOperation()
op.addExecutionBlock {
    for item in items {
        if op.isCancelled { return }
        process(item)
    }
}
```

Predict: if you call `op.cancel()` while this loop is midway through, does `process(item)` stop immediately?

Answer: no — not unless the code checks `isCancelled` itself, which is exactly what the `if op.isCancelled { return }` line does here. Cancellation in `Operation` is **cooperative**: `cancel()` only flips a flag, and it's the operation's own code that has to notice the flag and bail out. Without that check, a cancelled operation just keeps running to completion.

```swift
op.cancel()                    // sets isCancelled — work stops only if it checks
queue.cancelAllOperations()    // sets isCancelled on every queued operation
```

An operation that hasn't started yet and gets cancelled simply never runs at all — the cooperative-checking problem only applies to work that's already executing.

## Custom async operations

`BlockOperation` assumes its closure is synchronous — the operation is considered finished the moment the closure returns. That breaks down for something like a network call with a completion handler, where the closure returns immediately but the real work is still in flight.

```swift
final class AsyncOp: Operation {
    override var isAsynchronous: Bool { true }
}
```

Overriding `isAsynchronous` to `true` tells the queue "don't assume I'm done when my method returns." From there you're responsible for manually managing two more properties, `isExecuting` and `isFinished`, sending KVO notifications when each changes, and only setting `isFinished = true` inside the actual async completion callback — not before.

This is real boilerplate for what sounds like a simple idea, and it's one of the main reasons structured concurrency (`Task`, `TaskGroup`) is often reached for instead in new code — `async`/`await` gets you cancellation and sequencing without hand-rolling KVO state.

## When to prefer Operations

- You need real **dependencies** between units of work, not just sequential code.
- You need to **cancel** work that's queued or already running.
- You want **reusable, testable** units of work as subclasses, or the ability to observe progress.
- You're already in a UIKit codebase that uses `Operation` throughout, and consistency matters more than a rewrite.

For new asynchronous code without those specific needs, structured concurrency usually expresses the same ideas — `async let`, `TaskGroup`, automatic cancellation propagation — with much less boilerplate. `Operation` hasn't disappeared, though, and it's common enough in existing codebases that interviewers still expect you to know it.

## Interview lens

If asked "Operations vs GCD, when and why," the short version: GCD dispatches a fire-and-forget closure, while `Operation` wraps that work in an object you can cancel, sequence with dependencies, prioritize, and observe. Lead with **dependencies** (`addDependency`) as the standout feature — it replaces nested completion handlers with a declarative "run B after A."

Be ready for the cancellation gotcha: `cancel()` only sets `isCancelled` to `true`. It's cooperative, meaning the operation's own code has to check that flag and stop itself — cancellation doesn't interrupt running code on its own.

If asked how to wrap an asynchronous call in an `Operation`, describe subclassing `Operation`, overriding `isAsynchronous` to `true`, and manually driving `isExecuting`/`isFinished` with KVO notifications, setting `isFinished` only once the async work truly completes. Mentioning that this exact boilerplate is why structured concurrency is now preferred for new code shows you understand the trade-off, not just the mechanics.
