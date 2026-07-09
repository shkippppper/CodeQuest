## The problem: nothing to turn into a publisher

Every publisher so far has had a source to wrap — an array, a one-shot value, a callback closure. But some values don't come from anywhere like that. A button tap, a value typed into a legacy delegate method, a notification callback you don't control the shape of:

```swift
@objc func buttonTapped() {
    // a Combine pipeline needs a value RIGHT HERE, from imperative code
}
```

There's no sequence to call `.publisher` on and no async closure to wrap in `Future`. You need something you can hold onto and call `.send(value)` on whenever your imperative code decides a new value exists. That something is a **subject**.

## PassthroughSubject: push values by hand

```swift
import Combine

let taps = PassthroughSubject<Void, Never>()

let cancellable = taps.sink { print("tapped") }

taps.send(())     // prints: tapped
taps.send(())     // prints: tapped
```

`PassthroughSubject` is a publisher, and it's also its own imperative trigger — calling `.send(value)` pushes that value to every current subscriber immediately. Wire it into the delegate callback from before:

```swift
let taps = PassthroughSubject<Void, Never>()

@objc func buttonTapped() {
    taps.send(())
}
```

Now the imperative UIKit world and the Combine pipeline world meet at one object. This is the standard way to **bridge imperative code** — anything event-driven that isn't already a publisher — into Combine.

A subject can also end the stream, just like any publisher:

```swift
taps.send(completion: .finished)
taps.send(())   // too late — nothing happens, the subject is done
```

Once `.send(completion:)` fires, the subject follows the same *values, then one ending* grammar every publisher obeys — no more values can flow, even though `taps` is still a live object you could call `.send` on.

## Late subscribers miss everything

Try subscribing after some sends already happened:

```swift
let taps = PassthroughSubject<Int, Never>()
taps.send(1)
taps.send(2)

let late = taps.sink { print("late got \($0)") }
taps.send(3)   // prints: late got 3
```

`PassthroughSubject` has no memory. A subscriber only sees values sent *after* it attaches — 1 and 2 are gone forever by the time `late` shows up. That's fine for events like taps, where "the last tap" isn't meaningful. It's the wrong tool when a subscriber needs to know the *current* value immediately on attaching.

## CurrentValueSubject: remembering the latest value

```swift
let status = CurrentValueSubject<String, Never>("idle")

status.sink { print("status: \($0)") }
// prints immediately: status: idle
```

`CurrentValueSubject` is the same push-by-hand idea, plus one difference: it's constructed with a starting value, it always holds the most recent one, and every new subscriber receives that current value the instant it attaches — no waiting for the next `.send`.

```swift
status.send("loading")   // prints: status: loading
status.send("done")      // prints: status: done

print(status.value)      // "done" — read the current value without subscribing
```

That `.value` property is the other thing `PassthroughSubject` doesn't have: a synchronous, always-up-to-date read of the latest value, no subscription required. This makes `CurrentValueSubject` a natural fit for state — the thing a screen needs to know right now, not just changes as they happen.

Predict: two subscribers attach to the same `CurrentValueSubject<Int, Never>(0)` one after another, with a `.send(5)` in between. What does the second subscriber see first?

```swift
let counter = CurrentValueSubject<Int, Never>(0)
let a = counter.sink { print("a: \($0)") }
counter.send(5)
let b = counter.sink { print("b: \($0)") }
```

Answer: `a: 0`, `a: 5`, then `b: 5`. Subscriber `b` attaches after the send, so its "current value on attach" is already 5 — it never sees 0.

## Cold pipelines re-run per subscriber

Recall from the basics lesson that most publishers are cold: every subscriber restarts the whole pipeline from scratch. Watch that cost stack up:

```swift
let pipeline = urlPublisher
    .map { url -> Data in
        print("fetching…")     // expensive work
        return download(url)
    }

let a = pipeline.sink { _ in }
let b = pipeline.sink { _ in }
// prints "fetching…" TWICE — once per subscriber
```

Two subscribers, two independent downloads of the same URL. Nobody wanted that — both subscribers should be looking at the *same* piece of work in flight.

## Multicasting with share()

```swift
let pipeline = urlPublisher
    .map { url -> Data in
        print("fetching…")
        return download(url)
    }
    .share()

let a = pipeline.sink { _ in }
let b = pipeline.sink { _ in }
// prints "fetching…" ONCE
```

`share()` turns a cold publisher into a hot one: instead of giving each subscriber a fresh private run, it runs the upstream pipeline once and **multicasts** — broadcasts — each value to every current subscriber at the same time. This is the fix whenever a side effect (a network call, a heavy computation, a subject wired to hardware) must not repeat per subscriber.

One catch: `share()` doesn't remember anything either, the same way `PassthroughSubject` doesn't. A subscriber that attaches after values already flowed just misses them. When late subscribers also need the most recent value, Combine offers `multicast(subject:)` paired with a `CurrentValueSubject`, so the shared pipeline replays the latest value the same way the subject does on its own.

## Backpressure considerations

Recall that ordinary publishers are pull-driven: a subscriber requests a demand — `.max(2)`, `.unlimited` — and the publisher may never send more values than were requested. Subjects break that discipline.

```swift
final class OnlyOne: Subscriber {
    typealias Input = Int
    typealias Failure = Never
    func receive(subscription: Subscription) { subscription.request(.max(1)) }
    func receive(_ input: Int) -> Subscribers.Demand {
        print("got \(input)")
        return .none
    }
    func receive(completion: Subscribers.Completion<Never>) {}
}

let subject = PassthroughSubject<Int, Never>()
subject.subscribe(OnlyOne())
subject.send(1)   // fine — within the requested demand of 1
subject.send(2)   // subject.send doesn't wait for demand — it delivers anyway
```

A subject's `.send(_:)` is a synchronous, fire-and-forget call from imperative code — it has no way to pause and wait for a subscriber to request more room. Combine's actual behavior here is to let the send through and hand the subscriber's `receive(_:)` return value back as demand bookkeeping; in practice, backpressure becomes the subscriber's problem to handle, not the subject's to enforce. A slow or unlimited-demand subscriber (like `sink`, which always requests `.unlimited`) works fine. A subscriber that intentionally throttles demand can still be handed values faster than it asked for.

The practical rule: treat subjects as a way to opt *out* of Combine's pull-based flow control. If you need real backpressure — a producer that genuinely waits for the consumer to be ready — a subject alone won't give you that; you're back to designing around demand at the `Subscriber` level, or accepting that the imperative caller of `.send` controls the pace instead.

## Common pitfalls

- **Expecting a `PassthroughSubject` to replay history.** It has no memory — late subscribers only see future sends. Use `CurrentValueSubject` when "the current value" matters.
- **Subscribing to a cold pipeline twice and being surprised work repeats.** Add `.share()` once you have more than one subscriber on the same expensive pipeline.
- **Assuming `share()` replays the last value to late subscribers.** It doesn't — pair it with `multicast(subject:)` and a `CurrentValueSubject` when that's needed.
- **Treating a subject as backpressure-safe.** `.send()` doesn't check subscriber demand; it's on you to keep the pace or the consumer reasonable.

## Interview lens

If asked to compare the two subjects, lead with the one behavioral difference: `CurrentValueSubject` always holds and replays the latest value (and exposes `.value` synchronously); `PassthroughSubject` has no memory and only forwards values sent after subscription. Then connect it to a real choice — `CurrentValueSubject` for state a screen reads right now, `PassthroughSubject` for one-off events like taps.

If asked how to bridge UIKit or any callback-based API into Combine, say: create a subject, call `.send()` from the imperative callback, expose the subject as `AnyPublisher` at the API boundary. That's the standard adapter pattern, and subjects are usually the only clean way to do it.

The `share()` question tests whether you understand cold publishers. Explain that without it, every subscriber re-runs the whole upstream pipeline — including side effects like network calls — and `share()` fixes that by running the pipeline once and multicasting the result. Mention `multicast(subject:)` if pushed further, since it's the version that also gives late subscribers the current value.

On backpressure, the senior answer is that subjects sidestep Combine's demand system rather than honoring it — `.send()` fires regardless of what the subscriber requested. That's the trade-off for being able to push values from ordinary imperative code in the first place.
