## The problem: the same operation, several different ways to do it

A shopping cart needs to compute a total price, but *how* it discounts depends on the customer:

```swift
class Cart {
    var subtotal: Decimal = 100

    func total() -> Decimal {
        // regular customer: no discount
        // member: 10% off
        // VIP: 20% off, free shipping
        // ...which one, and how do we add a fourth later?
    }
}
```

Stuffing all three rules into `total()` with an `if/else` chain works until a fourth pricing rule shows up, or until you need to test the VIP discount in isolation without dragging the whole `Cart` class into the test. Every new rule means editing `Cart` again.

## Intent: pull the "how" out into its own swappable piece

The **strategy pattern** takes the varying part of an algorithm — here, "how to compute a discount" — and moves it out into its own interchangeable object. `Cart` keeps the part that never changes (add up items, apply *a* discount) and holds a reference to whichever discount strategy it's been given.

```swift
protocol DiscountStrategy {
    func apply(to subtotal: Decimal) -> Decimal
}
```

One protocol, one method: given a subtotal, return the discounted price. `Cart` doesn't know or care which discount rule it's holding — only that it conforms to `DiscountStrategy`.

## Protocol-based strategies

Write each pricing rule as its own type conforming to the protocol:

```swift
struct NoDiscount: DiscountStrategy {
    func apply(to subtotal: Decimal) -> Decimal { subtotal }
}

struct MemberDiscount: DiscountStrategy {
    func apply(to subtotal: Decimal) -> Decimal { subtotal * 0.9 }
}

struct VIPDiscount: DiscountStrategy {
    func apply(to subtotal: Decimal) -> Decimal { subtotal * 0.8 }
}
```

Now give `Cart` a strategy property instead of a hardcoded rule:

```swift
class Cart {
    var subtotal: Decimal = 100
    var discountStrategy: DiscountStrategy = NoDiscount()

    func total() -> Decimal {
        discountStrategy.apply(to: subtotal)
    }
}
```

`Cart` calls `discountStrategy.apply(to:)` and never asks "which kind of discount is this?" — that's the whole point. Swap the strategy at runtime and the same `total()` call behaves differently:

```swift
let cart = Cart()
cart.discountStrategy = MemberDiscount()
print(cart.total())     // 90

cart.discountStrategy = VIPDiscount()
print(cart.total())     // 80
```

Predict: to add a "holiday sale, flat $15 off" rule next month, how many lines of `Cart` need to change?

Answer: zero. You add one new `struct HolidayDiscount: DiscountStrategy` and assign it — `Cart` and `total()` are untouched. That's the payoff: new behavior is *added*, not edited in.

## Closures as strategies

A protocol with a single method is doing a lot of ceremony for what's really just "a function that transforms a `Decimal`." Swift lets you skip the protocol entirely and store the strategy as a **closure** — a self-contained block of code you can pass around and call like a value:

```swift
class Cart {
    var subtotal: Decimal = 100
    var discountStrategy: (Decimal) -> Decimal = { $0 }   // NoDiscount, as a closure

    func total() -> Decimal {
        discountStrategy(subtotal)
    }
}

let cart = Cart()
cart.discountStrategy = { $0 * 0.9 }   // MemberDiscount, as a closure
print(cart.total())                     // 90
```

Same behavior, no `NoDiscount`/`MemberDiscount` types needed. This trims boilerplate when a strategy really is a single pure function with no state of its own to carry around. It stops being a good fit the moment a strategy needs *its own* properties or several related methods — `VIPDiscount` deciding both the discount percentage *and* whether shipping is free needs more than one function's worth of behavior, and a protocol expresses that naturally where a single closure type does not.

```swift
protocol DiscountStrategy {
    func apply(to subtotal: Decimal) -> Decimal
    var freeShipping: Bool { get }
}

struct VIPDiscount: DiscountStrategy {
    let freeShipping = true
    func apply(to subtotal: Decimal) -> Decimal { subtotal * 0.8 }
}
```

## Choosing the strategy at runtime

The strategy doesn't have to be picked by hand — it's just as often computed from data:

```swift
func strategy(for customer: Customer) -> DiscountStrategy {
    switch customer.tier {
    case .regular: return NoDiscount()
    case .member:  return MemberDiscount()
    case .vip:     return VIPDiscount()
    }
}

let cart = Cart()
cart.discountStrategy = strategy(for: currentCustomer)
```

Notice the `switch` didn't go away — it moved. It used to live inside `total()`, deciding what math to run. Now it lives in one small **factory function** — a function whose only job is constructing and returning the right object — and `total()` itself has no branching at all. That's the trade the pattern makes: the *decision* of which algorithm to use still has to happen somewhere, but the algorithms themselves are isolated, independently testable, and don't leak into the object using them.

## Examples elsewhere in Swift

You've likely used strategy without the name. `Array`'s `sorted(by:)` takes a comparison strategy as a closure:

```swift
let names = ["Charlie", "alice", "Bob"]
names.sorted(by: { $0.lowercased() < $1.lowercased() })
```

`URLSession`'s retry/caching policies, `Codable`'s custom `JSONEncoder.dateEncodingStrategy`, and SwiftUI's `ButtonStyle` are all the same idea: an interchangeable object (or closure) plugged into a fixed algorithm skeleton, swappable without touching the type that uses it.

```swift
let encoder = JSONEncoder()
encoder.dateEncodingStrategy = .iso8601   // swap the "how to encode a date" strategy
```

## Common pitfalls

- **Reaching for strategy when there's really only one algorithm.** If a rule never varies and never will, a plain function is simpler than a protocol with one conformer.
- **Choosing closures for a strategy that needs to hold state or multiple methods.** A closure captures values but doesn't give you named properties or several coordinated methods the way a struct or class conforming to a protocol does.
- **Letting the "which strategy" decision leak back into the consumer.** If `Cart` itself grows a `switch customer.tier` to pick a strategy, the abstraction you built is being bypassed — keep that decision in one small factory, not scattered through the codebase.

## Interview lens

If asked "what is the strategy pattern," describe the shape: an algorithm is split into a fixed skeleton and a swappable piece behind a shared interface, so new behavior is added by writing a new conformer, not by editing existing code.

If asked "protocol or closure," the answer is about *state and method count*, not taste: closures are lighter weight for a single stateless function, protocols win once a strategy needs its own stored properties or more than one related method.

If asked to name real Swift examples, `sorted(by:)`, `dateEncodingStrategy`, and SwiftUI `ButtonStyle`/`ViewModifier` all show you recognize the pattern in the standard library, not just in a hand-drawn UML diagram — that's usually the strongest signal in this question.
