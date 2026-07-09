## The problem: two tools that both handle "async"

```swift
let data = try await api.fetchProfile()
```

```swift
api.profilePublisher()
    .sink { profile in self.show(profile) }
    .store(in: &cancellables)
```

Both of these fetch a profile asynchronously. Neither is wrong. Since Swift added `async`/`await` and `AsyncSequence`, a lot of what Combine used to be the only answer for now has a native alternative — and picking between them, or moving code from one to the other, is a real day-to-day decision, not a theoretical one.

## Streams vs single values

`async`/`await` is built around getting *one* value, once:

```swift
func fetchProfile() async throws -> Profile
```

Call it, and you get exactly one `Profile` or one thrown error, then the function is done. There's no way for an `async` function to hand you a second value later — the shape doesn't allow it.

A `Publisher` is built around the opposite case: a value, or several, arriving *over time*:

```swift
func locationUpdates() -> AnyPublisher<Location, Never>
```

Every time the device moves, another `Location` comes through the same publisher, for as long as something stays subscribed. That's not a shape `async`/`await` alone can express — a single `await` call can't "keep returning" values.

Swift does have a native answer for that second shape too: **`AsyncSequence`**, the `for await` loop from its own lesson. `AsyncSequence` and `Publisher` solve the same problem — a sequence of values that isn't available all at once — from two different framework families:

```swift
for await location in locationStream {
    print(location)
}
```

So the real comparison isn't "Combine vs async/await" — it's Combine's `Publisher` vs Swift's `AsyncSequence`, with plain `async`/`await` covering the single-value case that neither of them is really needed for.

## Bridging: .values turns a publisher into a sequence

You don't have to choose sides inside one function. Combine ships a bridge:

```swift
for await profile in profilePublisher.values {
    print(profile)
}
```

Every `Publisher` gets a `.values` property that returns an `AsyncSequence` — the publisher's Combine values are handed to you through a `for await` loop instead of a `sink` closure. Under the hood, `.values` subscribes to the publisher, and the loop's demand for the next element becomes the subscriber's request for more — the same demand mechanism from the basics lesson, just hidden behind `for await` instead of a `Subscriber` implementation.

Predict: what happens to the loop if the underlying publisher sends a `.failure` completion?

```swift
for try await value in errorProne.values {
    print(value)
}
```

Answer: the loop exits by *throwing* — you need `for try await`, and the thrown error is whatever the publisher's `Failure` completion carried. If `Failure` is `Never`, plain `for await` is enough, since the compiler can prove no error can occur.

Cancellation travels the same bridge in reverse: cancelling the surrounding `Task` cancels the underlying Combine subscription, exactly like calling `.cancel()` on its `AnyCancellable` would.

## Wrapping a single async call as a publisher

The bridge works the other way too, for the times a Combine pipeline needs to call into `async` code:

```swift
func profilePublisher() -> AnyPublisher<Profile, Error> {
    Deferred {
        Future { promise in
            Task {
                do {
                    let profile = try await api.fetchProfile()
                    promise(.success(profile))
                } catch {
                    promise(.failure(error))
                }
            }
        }
    }
    .eraseToAnyPublisher()
}
```

This is the same `Deferred`-wrapping-`Future` pattern from the basics lesson — it exists so the `async` call runs fresh, per subscriber, instead of once eagerly at creation time. The `Task {}` bridges into `async` context since a `Future`'s closure itself isn't `async`.

## When to choose each

Reach for plain `async`/`await` when the operation genuinely produces one result: a single network fetch, a single disk read, a one-shot computation. It's the simplest tool, reads top-to-bottom like ordinary code, and needs no subscription bookkeeping.

Reach for `AsyncSequence` (`for await`) when you have a genuine stream of values and nothing about Combine's operator library — `combineLatest`, `debounce`, `merge`, `retry` — is doing real work for you. It composes naturally with structured concurrency: a `for await` loop lives inside a `Task`, and cancelling that task tears the whole thing down without a separate cancellable to manage.

Reach for Combine's `Publisher` when the stream needs Combine's specific operators — multiple publishers combined with `combineLatest`, a UI text field debounced before triggering search, retry-with-backoff on failure — because those operators are declarative and composable in a way that hand-rolling the same logic in a `for await` loop generally isn't. Combine also remains the natural fit anywhere you're already deep in an existing Combine-based codebase, or bridging to UIKit/AppKit KVO-style APIs that Combine has ready-made wrappers for.

## Migration strategy

Rewriting an entire Combine codebase in one pass is rarely realistic. The practical path is incremental, boundary by boundary.

Start at the leaves — functions that currently return `AnyPublisher<Value, Error>` but only ever emit one value and finish, like most network calls. Those convert cleanly to plain `async throws -> Value`, since they were never using Combine's multi-value behavior anyway:

```swift
// before
func fetchProfile() -> AnyPublisher<Profile, Error>
// after
func fetchProfile() async throws -> Profile
```

Where a genuine stream has to stay Combine-shaped for now — because the call site composes it with `combineLatest` or `debounce` — leave the publisher in place and bridge at the *call site* with `.values`, rather than rewriting the producer:

```swift
Task {
    for try await profile in fetchProfilePublisher().values {
        update(profile)
    }
}
```

This lets call sites migrate to `for await` loops one at a time without waiting for every producer in the codebase to change first. Over time, as producers get rewritten to `async`/native `AsyncSequence`, the `.values` bridges at their call sites just get deleted — the call site code barely changes, since it was already a `for await` loop.

The one place to be careful: operators with no direct `AsyncSequence` equivalent yet — `combineLatest`, `zip`, `debounce`, `retry` with custom strategies — are worth keeping in Combine rather than hand-rolling with `Task`s and manual state, at least until the call site's logic is simple enough to not need them.

## Common pitfalls

- **Reaching for Combine when the real need is one value.** `async throws -> Value` is simpler than a `Publisher` for anything that isn't actually a stream.
- **Forgetting `try` when bridging a failable publisher with `.values`.** Its failure completion surfaces as a thrown error, not a silent stop.
- **Rewriting producers before call sites are ready.** Bridge with `.values` at call sites first; convert producers once nothing downstream still needs Combine's operators on that stream.
- **Hand-rolling `combineLatest`/`debounce` logic with raw `Task`s.** Composable time-based and multi-stream operators are exactly where Combine still earns its keep.

## Interview lens

If asked "why would you still use Combine when we have async/await," the sharp answer is: async/await gives you one value; Combine's `Publisher` and Swift's own `AsyncSequence` both give you a stream, and Combine additionally ships a large, composable operator library — `combineLatest`, `debounce`, `merge`, `retry` — that isn't fully replicated by hand-rolled `for await` loops. Reach for Combine specifically when those operators are doing real work.

If asked how to call an `async` function from Combine or vice versa, name the two bridges: wrap `async` work in `Deferred { Future { ... } }` with a `Task {}` inside to go async-to-Combine, and use a publisher's `.values` property inside a `for await` (or `for try await`) loop to go Combine-to-async.

If asked about migration strategy specifically, the strong answer avoids "rewrite everything at once." Convert single-value producers to `async throws` first since they were never using Combine's multi-value behavior; leave genuine streams in Combine and bridge at call sites with `.values`; only rewrite a stream's producer once nothing downstream needs Combine-specific operators on it anymore. That incremental, boundary-first approach is what a team actually does in a large codebase.
