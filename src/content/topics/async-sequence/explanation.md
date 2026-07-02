## The problem: values that arrive over time

`async`/`await` gives you *one* value later. But lots of things produce *many* values over time — lines of a downloading file, location updates, notifications, socket messages. Callbacks and Combine can model that, but they don't fit the clean `for` loop. **`AsyncSequence`** does: it's the async cousin of `Sequence`, letting you write `for await value in stream` and get each value as it arrives, with cancellation and error handling built in.

## The `AsyncSequence` protocol

`AsyncSequence` mirrors `Sequence`, but producing the next element is `async` (and may `throw`). You consume it with **`for await`** (or `for try await` if it can throw):

```swift
for await line in url.lines {          // URL.lines is an AsyncSequence
    print(line)
}

for try await event in eventStream {   // throwing variant
    handle(event)
}
```

Each iteration **suspends** until the next element is ready, then resumes — the loop naturally paces itself to the producer. The sequence ends when the iterator returns `nil`. Standard async sequences ship on `URL.lines`, `FileHandle.bytes`, `NotificationCenter.notifications(named:)`, and more.

## `for try await` loops

The loop is a suspension point, so it lives inside an async context and honors cancellation: if the surrounding task is cancelled, a well-behaved async sequence stops and the loop exits (often by throwing `CancellationError`). You get the same operators as sync sequences in async form — `map`, `filter`, `prefix`, `reduce` — via the `AsyncSequence` algorithms.

```swift
let firstThree = url.lines.prefix(3)
for try await line in firstThree { print(line) }
```

## `AsyncStream` & continuations

You rarely implement `AsyncSequence` by hand. **`AsyncStream`** is the ready-made way to *produce* one: you get a **continuation** you push values into with `yield`, and `finish` when done.

```swift
let stream = AsyncStream<Int> { continuation in
    continuation.yield(1)
    continuation.yield(2)
    continuation.finish()          // ends the sequence
}

for await n in stream { print(n) } // 1, 2
```

Use `AsyncThrowingStream` when the source can fail (`continuation.finish(throwing:)`). The continuation is `Sendable`, so you can capture it in callbacks fired from anywhere.

## Backpressure

A producer can outrun a slow consumer. `AsyncStream` handles this with a **buffering policy** you choose at creation:

```swift
AsyncStream<Int>(bufferingPolicy: .bufferingNewest(10)) { continuation in
    // if the consumer lags, only the 10 newest values are kept
}
```

Options include `.unbounded` (keep everything — risk unbounded memory), `.bufferingNewest(n)`, and `.bufferingOldest(n)`. `yield` returns a result telling you whether the value was enqueued or dropped. Choosing the policy is how you trade memory against completeness — true backpressure (blocking the producer) isn't automatic, so pick a bounded policy for high-rate sources.

## Bridging delegates & notifications to streams

The killer use case: wrap an old-style delegate or callback API as an `AsyncStream`, so consumers get a clean `for await` loop.

```swift
func locationUpdates() -> AsyncStream<CLLocation> {
    AsyncStream { continuation in
        let delegate = LocationDelegate { location in
            continuation.yield(location)          // callback → stream
        }
        continuation.onTermination = { _ in
            delegate.stop()                        // clean up on cancel/finish
        }
        delegate.start()
    }
}
```

`onTermination` runs when the consumer stops iterating or the task is cancelled — the hook where you tear down the underlying source. This adapter pattern is how you modernize imperative event sources for `async`/`await`.

## The interview lens

The framing: *"When do you use `AsyncSequence` vs `async`/`await`?"* — `await` returns a single value; `AsyncSequence` (consumed with **`for await`** / `for try await`) models **many values over time**, with built-in cancellation and error propagation, in a plain loop.

The senior depth is production: **`AsyncStream`** is how you *make* one — push values via the `continuation.yield`, `finish` to end, set `onTermination` to clean up — which makes it the standard tool to **bridge delegate/callback APIs** into async code. Know that **backpressure** is handled by a **buffering policy** (`.bufferingNewest(n)` etc.), not by blocking the producer, so an unbounded buffer on a fast source can blow memory. Bonus: contrast with Combine (both are streams; async sequences integrate with structured concurrency and cancellation).
