## The problem: values that arrive over time

`async`/`await` gets you exactly one value, once, later:

```swift
let data = try await fetchData()
```

But plenty of real sources don't stop at one value — they keep producing: lines streaming out of a downloading file, a phone's location updating as you walk, messages arriving on a socket. You could model that with callbacks or with Combine, but neither one gives you a plain `for` loop.

**`AsyncSequence`** is Swift's answer: the async cousin of the `Sequence` protocol you already know from `for x in array`. It lets you write `for await value in stream` and receive each value as it shows up, with cancellation and error handling built into the loop itself.

## The `AsyncSequence` protocol

Here's the shape of it in practice:

```swift
for await line in url.lines {
    print(line)
}
```

`url.lines` is a value conforming to `AsyncSequence` — Apple ships one on `URL` that reads a file or network resource line by line. The loop uses **`for await`**, a variant of `for` that expects each element to arrive asynchronously.

If producing an element can fail, the sequence's `next()` is allowed to `throw`, and you consume it with **`for try await`** instead:

```swift
for try await event in eventStream {
    handle(event)
}
```

Under the hood, `AsyncSequence` mirrors `Sequence`: instead of a plain "give me the next element" function, its iterator's `next()` is `async` (and possibly throwing). That's the whole shape of the protocol — everything else in this lesson builds on that one difference.

## `for try await` loops

Each time the loop asks for the next element, it **suspends** — pauses without blocking the thread — until that element is ready, then resumes. Predict: if the producer is slow, does the loop spin checking for a value, or does it sleep until one arrives?

Answer: it suspends, using no CPU while it waits — the same suspension mechanism as a plain `await`. The loop naturally paces itself to however fast the producer makes values available.

The sequence ends the ordinary way: when the iterator returns `nil`, the `for await` loop exits, just like a regular `for` loop running out of elements.

Because the loop is a suspension point, it lives inside an async context and honors **cancellation**: if the surrounding task is cancelled, a well-behaved async sequence notices and stops, often by throwing `CancellationError` out of the loop.

You also get the familiar toolbox in async form. `AsyncSequence` ships `map`, `filter`, `prefix`, `reduce`, and friends as async algorithms:

```swift
let firstThree = url.lines.prefix(3)
for try await line in firstThree { print(line) }
```

`prefix(3)` here doesn't wait for the whole file — it takes the first three lines and stops asking for more.

## `AsyncStream` and continuations

Implementing `AsyncSequence` by hand — writing your own iterator type — is rare. Almost always you reach for **`AsyncStream`**, a ready-made type for *producing* one.

Start with the smallest version:

```swift
let stream = AsyncStream<Int> { continuation in
    continuation.yield(1)
    continuation.yield(2)
    continuation.finish()
}
```

The closure you pass in receives a **continuation** — a handle you push values into. Calling `yield(_:)` sends one value to whoever is iterating the stream; calling `finish()` ends the sequence, the same as an iterator returning `nil`.

Consume it exactly like any other async sequence:

```swift
for await n in stream { print(n) }   // prints 1, then 2
```

If the source can fail, swap in **`AsyncThrowingStream`**, whose continuation adds `finish(throwing:)` to end the sequence with an error instead of cleanly. One detail that matters in practice: the continuation is `Sendable`, so you're free to capture it inside a callback that fires from any thread — which is exactly what the next section builds on.

## Backpressure

A producer can generate values faster than the consumer reads them. What should happen to the values that pile up in between?

`AsyncStream` makes you choose, via a **buffering policy** set at creation — this is Swift's answer to **backpressure**, the general problem of a fast producer overwhelming a slow consumer:

```swift
AsyncStream<Int>(bufferingPolicy: .bufferingNewest(10)) { continuation in
    // if the consumer falls behind, only the 10 most recent values survive
}
```

Three policies are available: `.unbounded` keeps every value no matter how far the consumer falls behind (simple, but risks unbounded memory growth), `.bufferingNewest(n)` keeps only the most recent `n` and silently drops older ones, and `.bufferingOldest(n)` keeps the first `n` and drops anything after.

Predict: with `.bufferingNewest(2)`, if the producer yields `1, 2, 3, 4` before the consumer reads anything, what does the consumer eventually see?

Answer: `3, 4`. The buffer only ever holds the 2 newest values, so `1` and `2` are overwritten before they're ever read.

`yield` itself returns a result telling you whether your value was enqueued or dropped, so a producer can react if it needs to. Note what backpressure does *not* mean here: true backpressure — pausing the producer until the consumer catches up — isn't automatic. Choosing a bounded policy is how you trade completeness for a memory ceiling on a high-rate source.

## Bridging delegates and notifications to streams

The reason `AsyncStream` exists is this exact use case: wrapping an old delegate-based or callback-based API so the rest of your code gets a clean `for await` loop instead.

```swift
func locationUpdates() -> AsyncStream<CLLocation> {
    AsyncStream { continuation in
        let delegate = LocationDelegate { location in
            continuation.yield(location)      // callback → stream
        }
        delegate.start()
        continuation.onTermination = { _ in
            delegate.stop()                    // clean up on cancel/finish
        }
    }
}
```

Every time the old delegate callback fires, it calls `continuation.yield` — that's the bridge from callback-land into `AsyncSequence`-land. **`onTermination`** is the other half: it runs when the consumer stops iterating, whether because the task was cancelled or the stream finished normally, and it's where you tear down the delegate so it stops firing into a stream nobody's listening to anymore.

This adapter pattern — wrap the callback API, yield into the continuation, clean up in `onTermination` — is the standard way to modernize an imperative event source for `async`/`await`.

## Common pitfalls

- **Forgetting `onTermination`.** The underlying delegate or observer keeps running — and leaking work — even after the consumer walks away from the loop.
- **Using `.unbounded` on a genuinely fast source.** Values pile up forever if the consumer can't keep pace; pick a bounded policy unless you're certain the source is slow.
- **Expecting cancellation to be automatic.** A hand-rolled `AsyncSequence` has to check for cancellation itself; only the well-behaved standard ones (and `AsyncStream`, via `onTermination`) do it for you.

## Interview lens

If asked "when do you reach for `AsyncSequence` instead of plain `async`/`await`?", the answer is about cardinality: `await` hands you one value, once; `AsyncSequence` — consumed with `for await` or `for try await` — models many values arriving over time, in a loop that suspends between each one and honors cancellation automatically.

The senior-level follow-up is about production, not consumption: say that `AsyncStream` is how you *make* an async sequence — push values with `continuation.yield`, end it with `finish`, and clean up in `onTermination` — and that this makes it the standard tool for bridging an old delegate or callback API into async code.

If backpressure comes up, be precise: it's handled by a buffering policy (`.bufferingNewest(n)`, `.bufferingOldest(n)`, `.unbounded`) chosen when the stream is created, not by pausing the producer. An unbounded buffer on a fast source is a memory leak waiting to happen. For a bonus point, contrast with Combine: both model streams of values, but async sequences integrate directly with structured concurrency and task cancellation.
