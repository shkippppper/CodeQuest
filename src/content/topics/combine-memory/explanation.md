## The problem: a subscription needs an owner

```swift
func startListening() {
    somePublisher.sink { print($0) }
}   // nothing prints, ever
```

Nothing here is wrong syntactically, but it silently does nothing. `sink` hands back a token, and this code throws it away — so the subscription dies at the end of the function, before a single value can arrive. Combine subscriptions need something to own them for as long as you want values to keep flowing. Getting that ownership right, without accidentally creating a leak in the process, is what this lesson covers.

## AnyCancellable: the token that owns the subscription

```swift
class ViewModel {
    var token: AnyCancellable?

    func startListening() {
        token = somePublisher.sink { print($0) }
    }
}
```

`AnyCancellable` is the value `sink` and `assign` return — a small object that represents the live subscription. As long as something holds a strong reference to it, the subscription stays active. The moment the token is deallocated, its `deinit` automatically calls `cancel()` for you, tearing the subscription down. Storing it on `self` here, in a property, is what keeps `startListening` from being pointless.

## store(in:): collecting many cancellables at once

A view model rarely has just one subscription:

```swift
class ViewModel {
    var searchToken: AnyCancellable?
    var statusToken: AnyCancellable?
    var errorToken: AnyCancellable?
    // one property per subscription — this doesn't scale
}
```

Combine gives every `AnyCancellable` a `store(in:)` method that inserts it into a collection you keep instead:

```swift
class ViewModel {
    var cancellables = Set<AnyCancellable>()

    func startListening() {
        searchPublisher
            .sink { print($0) }
            .store(in: &cancellables)

        statusPublisher
            .sink { print($0) }
            .store(in: &cancellables)
    }
}
```

One `Set<AnyCancellable>` property replaces however many individual tokens the view model needs. When `cancellables` itself deallocates — when the view model dies — every subscription inside it is cancelled together. This is the standard pattern in real Combine code; a lone `var token: AnyCancellable?` is really just the one-subscription special case of this.

## Retain cycles in sinks

Storing the token on `self` solves one problem and can quietly create another:

```swift
class ViewModel {
    var cancellables = Set<AnyCancellable>()
    var results: [String] = []

    func startListening() {
        searchPublisher
            .sink { value in
                self.results.append(value)   // captures self strongly
            }
            .store(in: &cancellables)
    }
}
```

Follow the references: `self` (the view model) strongly owns `cancellables`, `cancellables` strongly owns the `AnyCancellable`, and the `AnyCancellable` strongly owns the `sink` closure — which just captured `self`. That's a loop: `self → cancellables → AnyCancellable → closure → self`. This is the same **retain cycle** shape from the ARC lesson, just built out of Combine's plumbing instead of two custom classes.

Predict: with this cycle in place, if every other reference to this `ViewModel` goes away — the screen is dismissed, the parent releases it — does `deinit` run?

Answer: no. The cycle keeps the view model's count above zero forever, even though nothing outside can reach it anymore. `searchPublisher` keeps delivering into a `ViewModel` that's supposed to be gone, silently leaking memory for the life of the app — the same telltale sign from the ARC lesson: a `deinit` that never fires.

## Breaking it with [weak self]

The fix is the same tool from the ARC lesson, used inside the closure:

```swift
searchPublisher
    .sink { [weak self] value in
        guard let self else { return }
        self.results.append(value)
    }
    .store(in: &cancellables)
```

`[weak self]` captures `self` without incrementing its reference count, so the closure no longer keeps the view model alive. `guard let self else { return }` unwraps the now-optional weak reference — if the view model has already been deallocated by the time a value arrives, the closure just exits instead of touching freed memory.

The rule of thumb: any closure that's both stored *on* `self` (directly, or via a cancellables set that's a property of `self`) and captures `self` needs `[weak self]`. A closure that captures a different object, or isn't retained by that same object, doesn't have this problem — the cycle only forms when the ownership loops back to where it started.

## [weak self] in operators, not just the terminal sink

The cycle risk isn't limited to `sink`. Any operator in the middle of a chain that takes a closure can capture `self` just as strongly:

```swift
searchPublisher
    .map { text in self.normalize(text) }        // captures self strongly too
    .filter { self.isValid($0) }                  // and here
    .sink { [weak self] value in
        self?.results.append(value)
    }
    .store(in: &cancellables)
```

Marking only the `sink` closure `[weak self]` doesn't help — `map` and `filter` still hold `self` strongly, and the whole pipeline (including those operators) is retained by the `AnyCancellable` stored on `self`. The cycle survives through the middle of the chain. Every closure in the pipeline that captures `self` and is itself retained by `self` needs the same treatment:

```swift
searchPublisher
    .map { [weak self] text in self?.normalize(text) ?? text }
    .filter { [weak self] in self?.isValid($0) ?? false }
    .sink { [weak self] value in
        self?.results.append(value)
    }
    .store(in: &cancellables)
```

It's more ceremony, but the underlying check is simple: trace the chain of strong ownership from `self` down to the closure, and if it loops back to `self`, that specific capture needs to be weak.

## Cancellation

Retain cycles aside, subscriptions also need to be torn down on purpose sometimes — a search should stop the in-flight request when the user types again, not just when the view model dies.

```swift
var searchToken: AnyCancellable?

func search(for text: String) {
    searchToken?.cancel()   // stop the previous search
    searchToken = api.search(text)
        .sink { self.results = $0 }
}
```

Calling `.cancel()` explicitly ends the subscription immediately — no more values, no completion — the same as what happens automatically when an `AnyCancellable` deallocates. Reassigning `searchToken` here does the cancel implicitly too: the old `AnyCancellable` is dropped, its `deinit` cancels it, and the new subscription takes over.

One detail worth knowing: cancelling a subscriber's `AnyCancellable` only cancels *that* subscription. If the upstream publisher came from `.share()`, other subscribers still attached keep receiving values — cancellation doesn't reach back and tear down shared upstream work for everyone, only for the one subscriber that cancelled.

## Common pitfalls

- **Discarding the return value of `sink`/`assign`.** No owner means the subscription is cancelled before it does anything.
- **A `sink` closure capturing `self` while stored on `self`.** Classic Combine retain cycle — fix with `[weak self]` and a `guard let`.
- **Fixing only the terminal `sink` and missing `map`/`filter`/`handleEvents` closures upstream.** Any closure in the chain that captures `self` and is retained by `self` needs the same weak treatment.
- **Expecting cancelling one subscriber to stop a shared publisher.** With `.share()`, other subscribers keep running until they cancel too.

## Interview lens

If asked "why doesn't my sink ever fire," the answer to reach for is a discarded `AnyCancellable` — the subscription was torn down the instant the token deallocated, because nothing kept a strong reference to it.

If asked about memory leaks in Combine, walk the cycle explicitly: `self` owns the cancellables collection, the collection owns the `AnyCancellable`, the `AnyCancellable` owns the closure, and if the closure captures `self` strongly, that's a loop — the same retain-cycle shape from ARC, just expressed through Combine's storage instead of two custom classes referencing each other. The fix is `[weak self]` plus a `guard let` (or optional chaining) inside the closure.

The follow-up senior interviewers like to ask: "does marking only the final `sink` weak fix it?" The correct answer is no — every closure between the source and the point where the chain is retained needs the same treatment, because the cycle runs through the whole pipeline, not just its last link.

If asked how to verify there's no leak, mention the same tool from the ARC lesson: a `deinit` on the owning class that never prints is the tell, and the Memory Graph Debugger will show the exact strong-reference path — often visibly passing through the Combine pipeline's internal storage.
