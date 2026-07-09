## The problem: values that arrive over time

Here's a search screen the old-fashioned way:

```swift
func textFieldDidChange(_ text: String) {
    api.search(for: text) { results in
        DispatchQueue.main.async {
            self.results = results
        }
    }
}
```

One callback for the text change. Another callback for the network response. A hop to the main queue. And this is the *simple* version — add "wait until the user stops typing" and "cancel the previous request" and the code sprawls across flags and stored state.

The underlying problem: a lot of app code is about **values that arrive over time** — keystrokes, network responses, timer ticks, notification broadcasts. Callbacks, delegates, and notifications each handle one flavor, each with different plumbing.

Combine is Apple's framework that gives all of these one common shape. A source of values over time is a *publisher*; the code that reacts is a *subscriber*; and a toolbox of operators transforms values in between. This lesson builds that shape from the ground up.

## A publisher and a subscriber, smallest possible

```swift
import Combine

let publisher = Just(5)
```

`Just` is the simplest publisher in the framework: it emits one value — here `5` — and then finishes. Nothing has happened yet, though. A publisher on its own is just a description of values that *could* be delivered.

To make values flow, attach a subscriber:

```swift
Just(5)
    .sink { value in
        print("got \(value)")     // prints: got 5
    }
```

`sink` is the everyday subscriber: you hand it a closure, and the closure runs for every value the publisher emits. The moment `sink` attaches, `Just` delivers its value and finishes.

A **publisher** is any type that can deliver a sequence of values over time to whoever subscribes. A **subscriber** is the thing at the end of the chain that receives those values and does something real with them.

## Every publisher declares two types

Look at the full type of `Just(5)`:

```swift
let publisher: Just<Int> = Just(5)
// Publisher protocol: associatedtype Output, associatedtype Failure: Error
```

Every publisher declares an `Output` type — what kind of values it emits — and a `Failure` type — what kind of error it can end with. For `Just<Int>`, `Output` is `Int` and `Failure` is `Never`.

`Never` is a Swift type with no possible values, so a `Failure` of `Never` is the type system saying: this publisher *cannot fail*. The compiler holds you to it — some APIs only accept never-failing publishers, and the mismatch is a compile error, not a runtime surprise.

## The grammar: values, then one ending

A publisher isn't limited to one value. Take an array's built-in publisher:

```swift
[1, 2, 3].publisher
    .sink(
        receiveCompletion: { completion in print("done: \(completion)") },
        receiveValue: { value in print("value: \(value)") }
    )
```

This prints:

```swift
// value: 1
// value: 2
// value: 3
// done: finished
```

Every publisher in existence follows the same strict grammar:

- zero or more values, then
- at most one **completion event** — either `.finished` (a normal ending) or `.failure(error)` (an error ending).

After the completion event, the publisher is done forever. No more values can arrive. This one rule is the spine of the whole framework: whatever exotic pipeline you build, its output obeys *values… then one ending*.

Notice `sink` grew a second closure — `receiveCompletion` — for that ending. When `Failure` is `Never` you're allowed to omit it, which is why the earlier `Just` example used the one-closure form.

## Keeping the subscription alive

Try this in a real app and something odd happens:

```swift
func startListening() {
    timerPublisher
        .sink { print("tick: \($0)") }
    // return — and the ticks never print
}
```

What went wrong? `sink` *returns* a value, and we threw it away:

```swift
let cancellable: AnyCancellable = timerPublisher
    .sink { print("tick: \($0)") }
```

That return value is an `AnyCancellable` — a token representing the live subscription. When the token is deallocated, the subscription is torn down automatically. In the broken version the token died at the end of the function, killing the subscription before a single tick.

So the rule: store the cancellable somewhere that lives as long as you want to keep receiving values — typically a property. Memory management in Combine has its own lesson later; for now, "keep the token or lose the stream" is enough.

There's a second built-in subscriber worth knowing:

```swift
let cancellable = namePublisher
    .assign(to: \.text, on: nameLabel)
```

`assign` writes each incoming value straight into a property using a key path — no closure needed. It only accepts publishers whose `Failure` is `Never`, because there's no closure in which to handle an error.

## The handshake underneath: the Subscription contract

`sink` hides a three-step handshake that interviewers love to probe. Here it is in slow motion.

Step 1 — the subscriber attaches:

```swift
publisher.subscribe(subscriber)
// internally the publisher calls: subscriber.receive(subscription:)
```

The publisher responds by handing the subscriber a `Subscription` object — a small control handle representing this one connection.

Step 2 — the subscriber asks for values:

```swift
subscription.request(.max(3))   // "send me up to 3 values"
```

This is the surprising part: publishers don't push values whenever they feel like it. The subscriber *requests* a number of values, and the publisher may not exceed that number. The request amount is called **demand**.

Step 3 — values flow, within the demand:

```swift
// publisher calls, up to 3 times:
subscriber.receive(value)        // each call can return additional demand
// and eventually:
subscriber.receive(completion:)  // .finished or .failure
```

Each time the subscriber receives a value, it returns how many *more* values it wants. Demand only accumulates — a subscriber can ask for more, never take back what it asked for.

## Watch demand control the flow

You can implement the `Subscriber` protocol yourself and see the contract run:

```swift
final class TwoAtMost: Subscriber {
    typealias Input = Int
    typealias Failure = Never

    func receive(subscription: Subscription) {
        subscription.request(.max(2))       // opening demand: 2 values
    }
    func receive(_ input: Int) -> Subscribers.Demand {
        print("value: \(input)")
        return .none                        // no ADDITIONAL demand
    }
    func receive(completion: Subscribers.Completion<Never>) {
        print("done")
    }
}
```

Now feed it a publisher that has five values to give. Predict: what prints?

```swift
[1, 2, 3, 4, 5].publisher.subscribe(TwoAtMost())
```

Answer:

```swift
// value: 1
// value: 2
// — and nothing else. No 3, no "done".
```

The subscriber asked for two values, then returned `.none` each time — no extra demand. The publisher delivered exactly two and then had no permission to send more. "done" never prints either: a sequence publisher only finishes after delivering its last value, and it never got permission to reach it.

This subscriber-driven flow control is called **backpressure**: the downstream end signals how much it can handle, and the upstream end must respect it. Most day-to-day code never touches it, because `sink` and `assign` open with a demand of `.unlimited` — "send everything, forever". But the mechanism is always there underneath, and it resurfaces in the subjects lesson.

## Just, Future, and Deferred

Three small publishers cover the most common "I have one value" situations. `Just` you've met. The second wraps callback-based async work:

```swift
let future = Future<Data, URLError> { promise in
    legacyAPI.fetch { data, error in
        if let data { promise(.success(data)) }
        else        { promise(.failure(error)) }
    }
}
```

`Future` runs the closure you give it, and you fulfill the `promise` exactly once — with a value or an error. Subscribers then receive that single result and a completion.

Now the trap. Predict: when does "starting fetch…" print?

```swift
let future = Future<Int, Never> { promise in
    print("starting fetch…")
    promise(.success(42))
}
// no subscriber attached yet
```

Answer: *immediately, on the line where the `Future` is created.* Unlike almost every other publisher, `Future` does not wait for a subscriber — it starts its work the moment it's initialized. And it runs that work exactly once: the result is cached, and every subscriber, including ones that attach much later, gets the same stored result replayed.

Sometimes that's what you want. When it isn't — when the work should start *on subscription*, freshly, per subscriber — wrap it in `Deferred`:

```swift
let lazyFuture = Deferred {
    Future<Int, Never> { promise in
        print("starting fetch…")      // now runs per subscription
        promise(.success(42))
    }
}
```

`Deferred` holds a closure that builds a publisher, and it runs that closure each time a subscriber attaches. Each subscriber gets its own brand-new `Future`, and no work happens before the first subscription.

## Cold by default: the lifecycle

`Future`'s eagerness is the exception. The general rule:

```swift
let pipeline = [1, 2, 3].publisher
    .map { heavyWork($0) }
// nothing has executed — this is a recipe, not a running process
```

Most publishers are **cold**: they do nothing until a subscriber attaches, and each subscriber triggers a fresh, independent run of the whole pipeline. Two `sink`s on the pipeline above means `heavyWork` runs six times, not three.

The full life of a subscription, start to finish:

1. A subscriber attaches; the publisher hands back a subscription.
2. The subscriber requests demand; values flow within it.
3. The subscription ends in exactly one of three ways: the publisher sends `.finished`, the publisher sends `.failure`, or the subscriber side *cancels* — explicitly via `cancellable.cancel()`, or implicitly when the `AnyCancellable` deallocates.

Once ended — by any of the three — that subscription can never emit again.

One last everyday tool. Real pipelines produce gnarly nested types like `Publishers.Map<Publishers.Filter<Just<Int>>, String>`, which you don't want in a function signature. So you erase them:

```swift
func namePublisher() -> AnyPublisher<String, Never> {
    Just("Ada")
        .map { $0.uppercased() }
        .eraseToAnyPublisher()
}
```

`AnyPublisher` is a type-erased wrapper — it hides the concrete pipeline type behind a plain "publisher of `String`, never fails" interface, exactly like the type erasure you met in the associated-types lesson. It's the standard return type for any publisher that crosses an API boundary.

## Common pitfalls

- **Discarding the `AnyCancellable`.** The subscription cancels instantly and the sink never fires. Fix: store the token in a property (details in the Combine memory lesson).
- **Expecting a `Future` to be lazy.** It runs its closure at creation time and replays one cached result to everyone. Fix: wrap it in `Deferred` for per-subscriber, on-subscription work.
- **Assuming a cold publisher does work once.** Every new subscriber re-runs the pipeline from scratch. Fix: share the subscription (the subjects lesson covers `share()`).
- **Fighting the `Failure` type.** `assign` and several SwiftUI-facing APIs require `Failure == Never`; a failing publisher won't compile there. Fix: handle errors upstream first (the operators lesson covers `catch` and friends).

## Interview lens

If asked "what is a publisher?", give the grammar, not a vibe: a publisher emits zero or more values and then at most one completion — finished or failure — and declares both its `Output` and `Failure` types statically. Mentioning that `Failure == Never` means "provably cannot fail" shows you understand why the types are there.

If asked how subscription actually works, walk the handshake: subscriber attaches, publisher returns a `Subscription`, subscriber requests demand, values flow only within that demand. The word to land is *demand* — Combine is pull-driven at the contract level, and `sink` merely hides that by requesting unlimited. That one detail separates people who've used Combine from people who've read about it.

The `Future` question is a favorite: interviewers ask when its work executes. Say it's eager — it runs at creation, once, and caches the result for all subscribers — and that `Deferred` is the wrapper that makes it lazy and per-subscriber. Pair it with the general rule: most publishers are cold and re-run per subscriber.

And if asked why a sink "never fired", the answer they're fishing for is the discarded `AnyCancellable` — the subscription was torn down when the token deallocated.
