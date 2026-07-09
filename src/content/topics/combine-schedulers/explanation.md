## The problem: values that show up on the wrong thread

```swift
apiPublisher
    .sink { data in
        self.label.text = String(data: data, encoding: .utf8)   // crash risk
    }
```

`URLSession`'s publishers deliver on a background queue. That `sink` closure runs on whatever thread produced the value — here, not the main thread — and touching UIKit or SwiftUI state off the main thread is undefined behavior, sometimes a visible glitch, sometimes a hard crash.

Combine doesn't pick threads for you. Every publisher and every operator runs on whatever thread called it, unless you explicitly say otherwise. The tool for saying otherwise is a **scheduler** — an object that knows how to run a piece of work at a particular time, on a particular thread or queue.

## receive(on:): choosing where downstream runs

```swift
apiPublisher
    .receive(on: DispatchQueue.main)
    .sink { data in
        self.label.text = String(data: data, encoding: .utf8)   // safe now
    }
```

`receive(on:)` inserts a hop: everything *after* it in the chain — later operators, and the final subscriber's `receive(_:)` — runs on the scheduler you pass in, here the main queue. Everything *before* it still runs wherever it was already running.

Position matters. Move `receive(on:)` earlier and more of the chain moves to the main thread with it:

```swift
apiPublisher
    .receive(on: DispatchQueue.main)
    .map { parse($0) }          // now runs ON the main thread
    .sink { self.label.text = $0.title }
```

If `parse` is expensive, that's a mistake — you've dragged real work onto the UI thread just by placing the hop too early. The fix is to keep `receive(on:)` as late as possible, right before the point that actually needs the specific thread.

## subscribe(on:): choosing where the work starts

`receive(on:)` moves *delivery*. It doesn't move where the publisher itself does its work. For that, there's a second operator:

```swift
Deferred {
    Future<Data, Error> { promise in
        let data = try! Data(contentsOf: someFileURL)   // blocking disk read
        promise(.success(data))
    }
}
.subscribe(on: DispatchQueue.global())
.receive(on: DispatchQueue.main)
.sink { data in self.label.text = "\(data.count) bytes" }
```

`subscribe(on:)` controls where the *subscription itself* happens — the moment `sink` attaches, and with it any synchronous work the publisher does at subscription time, like that blocking file read inside `Future`. Put that work on a background queue with `subscribe(on:)`, then hop back to the main queue with `receive(on:)` for the UI update.

Unlike `receive(on:)`, where you place `subscribe(on:)` in the chain doesn't change what it affects — it always controls the upstream subscription work, regardless of position. The two operators answer two different questions: `subscribe(on:)` is "where does the producer run?"; `receive(on:)` is "where does the consumer receive values?"

Predict: in the chain above, if `subscribe(on:)` were deleted, which thread would the blocking `Data(contentsOf:)` read run on?

Answer: whatever thread called `.sink` — often the main thread, meaning that "blocking disk read" would freeze the UI. `subscribe(on:)` is what moves it off.

## Available schedulers

Any type conforming to Combine's `Scheduler` protocol can be passed to `receive(on:)` or `subscribe(on:)`. The common ones:

| Scheduler | Runs on |
|---|---|
| `DispatchQueue.main` | The main thread — required before touching UI |
| `DispatchQueue.global()` (or a custom `DispatchQueue`) | A GCD queue, serial or concurrent |
| `RunLoop.main` | The main run loop — used by some older UIKit-adjacent APIs |
| `OperationQueue` | A queue of `Operation`s, useful when you need cancellation or dependencies between units of work |
| `ImmediateScheduler.shared` | Runs synchronously, right now, on the calling thread — mostly useful in tests |

They're interchangeable at the call site because they all conform to the same protocol — swapping `DispatchQueue.main` for `RunLoop.main` in `receive(on:)` doesn't change anything else about the pipeline.

## Threading mistakes

The most common one is the one this lesson opened with: forgetting `receive(on: DispatchQueue.main)` before a UI-touching `sink` or `assign`. Combine won't warn you — the closure just runs on whatever thread delivered the value.

The second is misplacing `receive(on:)` upstream of expensive operators, pulling background work onto the main thread by accident, as shown above.

The third is assuming `subscribe(on:)` does what `receive(on:)` does. Adding only `subscribe(on:)` to the API chain moves where the network call *starts*, but delivery to `sink` still happens whichever thread the publisher completes on — for `URLSession`, that's still a background thread. Both operators are usually needed together: `subscribe(on:)` for where work happens, `receive(on:)` for where results land.

A fourth, subtler mistake: calling `receive(on:)` more than once thinking it "resets" the thread each time. It doesn't reset anything — each `receive(on:)` just adds another hop for everything downstream of it, so a chain can legitimately cross threads multiple times if that's genuinely needed, but doing it without a reason just adds queue-hopping overhead.

## Testing with virtual time

Operators like `debounce`, `delay`, and `throttle` are built on schedulers too — they ask the scheduler to run a block "after 0.5 seconds", for instance. Test that with a real `DispatchQueue` and your test either sleeps for real time (slow, flaky under load) or races the async work (flaky the other way).

Because schedulers are just implementations of the `Scheduler` protocol, they're swappable. A **test scheduler** — a scheduler backed by a virtual clock you advance manually in code, instead of real wall-clock time — lets a test say "advance time by 0.5 seconds" as a single synchronous call and get deterministic results with no real waiting. Apple's Combine doesn't ship one, but this is exactly the gap the widely-used community package `CombineSchedulers` fills with its `TestScheduler`; the pattern is common enough that senior interviewers expect you to know *why* it's needed even if you haven't used that exact library.

The design lesson underneath: anywhere your production code takes a `Scheduler` as a parameter (injected, not hardcoded to `DispatchQueue.main`), your tests can substitute a virtual one. Hardcode `DispatchQueue.main` inside a pipeline and you've made that pipeline untestable without real delays.

## Common pitfalls

- **Forgetting `receive(on: .main)` before a UI update.** The closure runs on whatever thread produced the value — often not the main thread.
- **Placing `receive(on:)` too early.** Everything downstream of it runs on that scheduler, including operators that didn't need to move.
- **Expecting `subscribe(on:)` to control delivery.** It only controls where the subscription/upstream work happens; add `receive(on:)` separately for delivery.
- **Hardcoding `DispatchQueue.main` inside a pipeline.** Makes the code impossible to test without real time delays — inject the scheduler instead.

## Interview lens

If asked to explain `receive(on:)` vs `subscribe(on:)` in one sentence each: `receive(on:)` changes where *downstream* values are delivered (position-sensitive, everything after it moves); `subscribe(on:)` changes where the *subscription and upstream production* happen (position-insensitive, always affects the source side). Most real chains that touch both networking and UI need both.

If asked "why doesn't Combine just default to the main thread," the answer is that Combine is general-purpose — plenty of pipelines are pure data transformation with no UI involved, and forcing everything onto one queue would be a performance regression for those. Explicit scheduling is the trade-off for that generality.

If the conversation turns to testing, name the actual pain point — `debounce`/`delay` tests with a real scheduler are slow or flaky — and the fix: depend on the `Scheduler` protocol rather than a concrete queue, so a virtual-time test scheduler can replace it in tests. Mentioning dependency injection of the scheduler, not just the concept of testing, is what separates a theoretical answer from one that shows you've actually had to make Combine code testable.
