## The problem: one change, many interested parties

A shopping cart changes:

```swift
class Cart {
    var items: [String] = []
}
```

When `items` changes, the badge icon needs to update its count, the checkout button needs to enable itself, and an analytics logger wants to record the event. None of these three should have to be hand-wired into `Cart` — and `Cart` shouldn't need to know any of them exist.

## Intent: decouple "something happened" from "who cares"

The **observer pattern** solves this by having a subject (the thing that changes) keep a list of observers (the things that react) and notify all of them whenever a change happens, without the subject knowing what any observer actually does with that information.

```swift
protocol CartObserver: AnyObject {
    func cartDidChange(itemCount: Int)
}

class Cart {
    private var observers: [CartObserver] = []
    var items: [String] = [] {
        didSet { observers.forEach { $0.cartDidChange(itemCount: items.count) } }
    }

    func addObserver(_ observer: CartObserver) {
        observers.append(observer)
    }
}
```

This looks like the delegate pattern from the previous lesson, but notice the shape: `observers` is an **array**, not a single property. Delegation is one-to-one — one delegate answers questions for one delegating object. Observation is one-to-*many* — any number of listeners can subscribe to the same event, and the subject never needs to be told how many there are.

Swift gives you three ready-built ways to do this without hand-rolling an observer array: `NotificationCenter`, `KVO`, and Combine/Observation. Each trades off differently.

## NotificationCenter: broadcast by name, no direct reference needed

```swift
NotificationCenter.default.post(name: .cartDidChange, object: nil)
```

Posting a notification doesn't require the poster to know who — or whether anyone — is listening. Any object anywhere in the app can register interest by name:

```swift
extension Notification.Name {
    static let cartDidChange = Notification.Name("cartDidChange")
}

NotificationCenter.default.addObserver(
    forName: .cartDidChange, object: nil, queue: .main
) { notification in
    print("cart changed")
}
```

This is the loosest possible coupling — poster and listener don't even need to import the same module, only agree on the notification name string. That looseness is also the weakness: there's no compiler check that a `.cartDidChange` name is spelled the same on both ends, and no compile-time guarantee about what's inside `notification.userInfo`.

```swift
NotificationCenter.default.post(
    name: .cartDidChange,
    object: nil,
    userInfo: ["itemCount": items.count]
)
```

Reading `userInfo["itemCount"] as? Int` on the listening side is a runtime cast — get the key or type wrong and you silently get `nil` instead of a compile error.

## KVO: observing a property directly, by key path

**Key-Value Observing (KVO)** watches a specific property on a specific `NSObject` subclass and fires a callback whenever it changes — no notification name, no manual `didSet` broadcasting:

```swift
class Cart: NSObject {
    @objc dynamic var itemCount: Int = 0
}

let cart = Cart()
let token = cart.observe(\.itemCount, options: [.new]) { cart, change in
    print("count is now \(change.newValue ?? 0)")
}
```

`observe(_:options:)` returns an `NSKeyValueObservation` token — hold onto it (usually as a stored property) for as long as you want to keep observing; when the token deallocates, the observation stops automatically. The `@objc dynamic` on `itemCount` is required: KVO works by intercepting property access through the Objective-C runtime, so the property has to be exposed to that runtime and use dynamic dispatch instead of Swift's usual direct method calls.

That requirement is KVO's real limitation. It only works on classes inheriting from `NSObject`, and only on properties marked `@objc dynamic` — plain Swift structs, enums, and pure Swift classes can't be observed this way at all. It was the standard way to watch a property before Swift-native tools existed, and you'll still meet it in older UIKit and AppKit codebases (animation completion, scroll offset, etc.), but new code rarely reaches for it first.

## Combine and Observation: the Swift-native observer

**Combine** models "this value changes over time" as a `Published` property with a stream you can subscribe to — no `NSObject`, no key path magic, works on any class:

```swift
class Cart: ObservableObject {
    @Published var items: [String] = []
}

let cart = Cart()
let cancellable = cart.$items
    .sink { items in print("count is now \(items.count)") }
```

This lesson assumes you've already seen `@Published`, `sink`, and `ObservableObject` in the Combine lessons — the point here is just to recognize this *as* an observer: `cart` is the subject, the `sink` closure is the observer, and `cancellable` (like KVO's token) has to be retained or the subscription stops.

The newer **Observation** framework (`@Observable`) goes further: it tracks which properties a SwiftUI view actually reads and only redraws that view when one of *those* properties changes, instead of every subscriber redrawing on every change like `@Published` does. Both are covered in their own lessons — here, the point is that they're the modern, type-safe, compiler-checked version of the same observer idea NotificationCenter and KVO were solving with strings and runtime magic.

## Trade-offs: picking the right one

Predict: you're building a cross-cutting "user logged out" event that a dozen unrelated screens, none of which know about each other, need to react to. Which of the four tools fits best?

Answer: `NotificationCenter`. The screens are unrelated and numerous — a shared, loosely-typed broadcast by name is exactly what it's built for. Passing a direct reference to every one of a dozen screens just to call a method on each would be far more coupling than the problem needs.

Now the opposite case: a `PasswordField` view needs to react precisely to its own `viewModel.isValid` boolean, with full type safety and no stringly-typed keys. Combine's `@Published` (or `@Observable` in SwiftUI-only code) is the better fit — one specific typed property, one specific typed subscriber.

| | NotificationCenter | KVO | Combine / Observation |
|---|---|---|---|
| Coupling | Loosest — string name only | Tied to `NSObject` + key path | Typed, compile-checked |
| Works on | Any object | `NSObject` subclasses, `@objc dynamic` props | Any class (Combine), `@Observable` classes |
| Payload safety | `userInfo` dictionary, runtime cast | Typed via key path | Fully typed |
| Best for | App-wide, many unrelated listeners | Legacy UIKit/AppKit property watching | New Swift code, typed reactive state |

## Common pitfalls

- **Forgetting to remove a NotificationCenter observer** added with the block-based API before iOS 9 auto-removal — on older deployment targets this leaks; even on modern targets, an observer added on `self` that outlives `self`'s intended lifecycle can fire on a half-torn-down object.
- **Letting a KVO or Combine token deallocate too early.** Both `NSKeyValueObservation` and Combine's `AnyCancellable` stop observing the instant nothing retains them — store them, don't let them go out of scope after one line.
- **Reaching for NotificationCenter when a typed Combine publisher would do.** String-keyed `userInfo` gives up all compile-time safety for a decoupling benefit you don't need when publisher and subscriber already share a module.

## Interview lens

If asked "what is the observer pattern," describe the shape first: a subject keeps a list of observers and notifies all of them on a change, without knowing what any observer does — and contrast it with delegation's one-to-one relationship.

If asked to compare NotificationCenter, KVO, and Combine, lead with coupling and type safety: NotificationCenter is loosest (string names, runtime-cast payloads, works across modules with zero shared types), KVO sits in the middle (typed key paths but requires `NSObject` + `@objc dynamic`), and Combine/Observation are the tightest and safest (fully typed, compiler-checked, no runtime string matching).

If pushed on when you'd still use NotificationCenter today, say it's still the right tool for app-wide events with many unrelated, decoupled listeners — logout, background/foreground transitions, memory warnings — where loose coupling is a feature, not a bug.
