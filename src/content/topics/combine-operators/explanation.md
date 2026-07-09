## Operators: what sits between publisher and subscriber

The basics lesson ended every pipeline the same way — a publisher wired straight into a `sink`:

```swift
[1, 2, 3].publisher
    .sink { print($0) }     // 1, 2, 3
```

Real values rarely arrive in the shape you need. Insert one call between the two:

```swift
[1, 2, 3].publisher
    .map { $0 * 10 }
    .sink { print($0) }     // 10, 20, 30
```

`map` is an **operator**: a method on a publisher that returns a *new* publisher wrapping the old one. Values flow in from upstream, get transformed, and flow out downstream. Because every operator returns a publisher, they chain — and a chain of operators is where most real Combine code lives.

This lesson tours the operators interviews actually ask about: transforming, filtering, combining multiple streams, handling errors, and taming time.

## Transforming values

`map` you just saw — it's the same idea as `map` on arrays, applied to values as they stream past. Two siblings handle the awkward cases:

```swift
["1", "2", "oops", "3"].publisher
    .compactMap { Int($0) }
    .sink { print($0) }      // 1, 2, 3 — "oops" silently dropped
```

`compactMap` transforms and drops any `nil` results in one move — the standard tool for "parse this, skip failures".

```swift
urlStrings.publisher
    .tryMap { string in
        guard let url = URL(string: string) else { throw AppError.badURL }
        return url
    }
```

`tryMap` is `map` for throwing closures. If the closure throws, the pipeline terminates with that error — the thrown error becomes the publisher's failure. Most operators have a `try` twin (`tryFilter`, `tryCompactMap`, …) with the same rule.

## flatMap: when the transform is itself a publisher

Here's where `map` stops being enough. Say each incoming value triggers a network request:

```swift
userIDs.publisher
    .map { id in api.fetchUser(id) }    // Output: AnyPublisher<User, Error>  😬
```

Now the pipeline emits *publishers*, not users — a publisher of publishers, which no `sink` wants. `flatMap` fixes exactly this:

```swift
userIDs.publisher
    .flatMap { id in api.fetchUser(id) }
    .sink { user in print(user.name) }   // Output: User ✅
```

`flatMap` subscribes to each inner publisher it produces and merges all their values into one flat downstream stream. It's the operator for "each value kicks off async work".

Two senior details hide in that sentence. First, *merges* means interleaved: if the request for user 2 finishes before the request for user 1, user 2 arrives first. `flatMap` does not preserve input order.

Second, by default `flatMap` runs *all* inner publishers at once. A thousand IDs means a thousand simultaneous requests. The `maxPublishers` parameter applies backpressure — the demand mechanism from the basics lesson — to cap it:

```swift
.flatMap(maxPublishers: .max(2)) { id in api.fetchUser(id) }
// at most 2 inner publishers live at a time; the rest wait their turn
```

## Filtering the stream

Dropping values you don't want is a one-liner each:

```swift
numbers.publisher
    .filter { $0.isMultiple(of: 2) }   // keep only matches
    .removeDuplicates()                // drop values equal to the PREVIOUS one
    .prefix(3)                         // take 3, then finish the stream
```

Two of these deserve a closer look. `removeDuplicates` only compares each value to the one immediately before it — the stream `1, 1, 2, 1` becomes `1, 2, 1`, not `1, 2`. It suppresses *consecutive* repeats, not all repeats.

And `prefix(3)` doesn't just stop forwarding after three values — it sends `.finished` downstream and cancels the upstream subscription. Operators can end pipelines, not just pass values through. `first()` is the same idea with a count of one.

The mirror images exist too: `dropFirst(2)` skips the first two values, `drop(while:)` skips until a condition first fails.

## Combining two streams: merge, zip, combineLatest

So far one pipeline, one source. Real screens combine several — a username field and a password field feeding one "enable the login button?" decision. Combine gives three strategies, and telling them apart is a classic interview question.

`merge` is the simple one — it needs both publishers to have the same `Output`, and it interleaves them into a single stream in arrival order:

```swift
manualRefresh.merge(with: timerRefresh)
    .sink { _ in reload() }     // reload on EITHER trigger
```

`zip` pairs values up by position, like a zipper's teeth — first with first, second with second:

```swift
names.zip(ages)
    .sink { name, age in print("\(name) is \(age)") }
```

`zip` waits until it has one value from *each* side before emitting the pair. If one side runs ahead, its extra values queue up until the slower side catches up.

`combineLatest` emits the *latest* value from each side, every time *either* side emits — after both have emitted at least once:

```swift
username.combineLatest(password)
    .map { user, pass in user.count >= 3 && pass.count >= 8 }
    .assign(to: \.isEnabled, on: loginButton)
```

That "after both have emitted at least once" clause bites people constantly — until the password field emits its first value, the button gets *nothing*, no matter how much the username changes.

Time to test the difference. Two publishers emit in this order — `letters` sends `A`, then `numbers` sends `1`, then `letters` sends `B`, then `numbers` sends `2`. Predict the output of `zip` versus `combineLatest`:

```swift
letters.zip(numbers).sink { print("zip: \($0)\($1)") }
letters.combineLatest(numbers).sink { print("latest: \($0)\($1)") }
```

Answer:

```swift
// zip:    A1, B2          — strict positional pairs
// latest: A1, B1, B2      — every emission re-pairs with the other side's latest
```

`zip` produced two pairs because there were two complete positions. `combineLatest` produced three, because `B` arriving re-emitted with the then-latest number `1`. Rule of thumb: `zip` for "these belong together as a matched set", `combineLatest` for "recompute whenever any input changes" — which is why form validation is always `combineLatest`.

## When the stream fails: catch and retry

Recall the grammar: a failure is a *terminal* event. Once a publisher fails, that pipeline is dead. Error operators exist to intercept the failure before it reaches — and kills — your sink.

The gentlest is a transform:

```swift
api.fetchUser(id)
    .mapError { NetworkError.wrapping($0) }   // change the error's TYPE only
```

`mapError` doesn't recover from anything — it converts the failure type, which you need when two pipeline stages disagree about their `Failure`.

Actual recovery is `catch`:

```swift
api.fetchUser(id)
    .catch { _ in Just(User.placeholder) }    // failure → swap in a new publisher
    .sink { user in show(user) }
```

When the upstream fails, `catch` swallows the error and *replaces the upstream* with the publisher you return — here a `Just` that supplies a fallback value and finishes. The downstream never learns a failure happened. `replaceError(with:)` is shorthand for exactly this `catch`-a-`Just` pattern.

Note what "replaces the upstream" implies: the original publisher is gone. If it was a long-lived stream, no more of its values will ever arrive — you traded the live stream for the fallback. That has a big consequence we'll hit in a moment.

`retry` re-subscribes instead of replacing:

```swift
api.fetchUser(id)
    .retry(2)                                 // on failure: resubscribe, up to 2 times
    .catch { _ in Just(User.placeholder) }    // still failing after retries? fall back
```

On failure, `retry(2)` silently starts the upstream over from scratch, up to two extra attempts, and only propagates the failure if the final attempt also fails. Because it re-runs the whole upstream, any side effects re-run too — a retried POST request is *sent again*, which is exactly what you want for a flaky GET and exactly what you don't for a payment.

## The catch-kills-the-stream trap

Now the consequence. Here's a search pipeline that looks reasonable:

```swift
searchText
    .flatMap { text in api.search(text) }
    .catch { _ in Just([]) }                  // on error, show empty results
    .sink { results in show(results) }
```

Predict: the user types "swift", the request fails, `catch` supplies `[]`. Then the user types "combine". What happens?

Answer: *nothing, forever.* The failure travelled up from inside `flatMap` and terminated everything above the `catch` — including the subscription to `searchText` itself. `catch` replaced all of it with `Just([])`, which emitted and finished. The pipeline is complete; later keystrokes have no one listening.

The fix is to catch *inside* the `flatMap`, so only the inner request-publisher gets replaced and the outer keystroke stream stays alive:

```swift
searchText
    .flatMap { text in
        api.search(text)
            .catch { _ in Just([]) }          // sacrifice only THIS request
    }
    .sink { results in show(results) }
```

Failures now die one request at a time. This inner-`catch` placement is probably the single most-asked Combine error-handling question.

## Taming time: debounce and throttle

Back to the search field. Firing a request per keystroke is wasteful — you want to wait until the user pauses:

```swift
searchText
    .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
    .sink { text in search(text) }
```

`debounce` starts a timer on every value and only emits when the timer completes *without another value arriving*. Type "swift" quickly and nothing flows until 300 ms after the final "t" — one emission, the latest value, per burst of activity.

`throttle` paces differently:

```swift
scrollOffsets
    .throttle(for: .seconds(1), scheduler: DispatchQueue.main, latest: true)
    .sink { offset in updateMinimap(offset) }
```

`throttle` guarantees at most one emission per interval, *even if values never stop coming*. With `latest: true` it emits the newest value seen in the window; `latest: false` emits the first. That's the difference to keep straight: under a continuous firehose, `debounce` stays silent forever — the quiet gap never comes — while `throttle` keeps delivering once per interval. Debounce for "wait until they stop typing", throttle for "update the UI at a sane rate while it streams".

Both operators take a `scheduler` argument — the machinery that decides which thread and queue the timer and delivery run on. Schedulers get their own lesson next; `DispatchQueue.main` is the usual choice for UI-bound pipelines.

## Common pitfalls

- **Catching outside a `flatMap`.** One inner failure kills the outer stream permanently. Fix: `.catch` on the inner publisher, inside the `flatMap` closure.
- **Retrying non-idempotent work.** `retry` re-runs the upstream's side effects — fine for reads, dangerous for writes. Fix: only retry requests that are safe to repeat.
- **Expecting `flatMap` to preserve order.** Inner publishers race; results interleave by completion time. Fix: if order matters, constrain with `maxPublishers: .max(1)`.
- **Waiting on a `combineLatest` that never starts.** It emits nothing until every input has emitted once. Fix: seed inputs with an initial value (the subjects lesson's `CurrentValueSubject` is built for this).
- **`zip` buffering unboundedly.** If one side emits far faster than the other, its backlog of unpaired values grows without limit. Fix: rethink whether positional pairing is really the semantics you want.
- **Debouncing a firehose that never pauses.** No quiet gap means no emissions at all. Fix: use `throttle` when values stream continuously.

## Interview lens

If asked the difference between `map` and `flatMap`, anchor it in types: `map` transforms a value into a value; `flatMap` transforms a value into a *publisher*, subscribes to it, and merges the results into one stream. Then volunteer the two gotchas — results interleave out of order, and unlimited concurrency unless you set `maxPublishers` — because that's the follow-up anyway.

The `zip` vs `combineLatest` vs `merge` question is nearly guaranteed. Say: `merge` interleaves same-typed streams, `zip` pairs strictly by position and waits for both, `combineLatest` re-emits the latest from each whenever either fires — and that form validation wants `combineLatest`, not `zip`.

For error handling, the point they're probing is that failure is terminal. Explain that `catch` replaces the dead upstream with a fallback publisher, and then — unprompted — describe the inner-`flatMap` placement that keeps a long-lived stream alive through individual request failures. That one paragraph is often the whole reason the question was asked.

For `debounce` vs `throttle`, give the firehose test: continuous input silences `debounce` but not `throttle`. Search-as-you-type is debounce; scroll-driven UI updates are throttle.
