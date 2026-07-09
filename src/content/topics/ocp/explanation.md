## The problem: every new case means editing old code

Here's a discount calculator for an e-commerce checkout:

```swift
struct PriceCalculator {
    func finalPrice(for order: Order, discountType: String) -> Decimal {
        if discountType == "none" {
            return order.subtotal
        } else if discountType == "percentage" {
            return order.subtotal * 0.9
        } else {
            return order.subtotal
        }
    }
}
```

It works for two discount types. Now product wants a third: "buy one get one free." You open `PriceCalculator` and add another `else if`:

```swift
} else if discountType == "bogo" {
    return order.subtotal - order.cheapestItemPrice
}
```

Every new discount type means reopening this same function and adding another branch. That's risky by itself — a typo in the new branch can break the `"percentage"` case that was already working and already tested — but it also means every team that ever wants a new discount rule has to touch this one shared file, fighting over the same lines in code review.

## Open for extension, closed for modification

The **Open/Closed Principle** (OCP) says: a type should be **open for extension** but **closed for modification**. New behavior should be addable without editing code that already works.

"Closed for modification" doesn't mean the file is frozen forever — it means adding a new case shouldn't require changing the logic that handles the existing cases. "Open for extension" means there's a seam where new behavior plugs in from the outside.

The `if/else` chain violates both halves: every new discount type modifies the existing function body, and there's no seam — the only way in is editing that same `if`.

## Protocols & polymorphism

Swift's seam for this is a **protocol** — a contract that says "any type conforming to me guarantees these methods exist," without saying anything about *how*. Define one method the calculator actually needs:

```swift
protocol DiscountStrategy {
    func apply(to subtotal: Decimal) -> Decimal
}
```

Each discount type becomes its own small type conforming to it:

```swift
struct NoDiscount: DiscountStrategy {
    func apply(to subtotal: Decimal) -> Decimal { subtotal }
}

struct PercentageDiscount: DiscountStrategy {
    func apply(to subtotal: Decimal) -> Decimal { subtotal * 0.9 }
}
```

`PriceCalculator` now depends only on the protocol, never on a specific discount type:

```swift
struct PriceCalculator {
    func finalPrice(for order: Order, discount: DiscountStrategy) -> Decimal {
        discount.apply(to: order.subtotal)
    }
}
```

This works because of **polymorphism** — the ability to call the same method name (`apply`) on different concrete types and get each type's own behavior, decided at the call site by which type was actually passed in. `finalPrice` doesn't know or care whether `discount` is `NoDiscount` or `PercentageDiscount`; it just calls `apply`.

Predict: to add the "buy one get one free" discount now, does `PriceCalculator` need to change at all?

Answer: no. Add a new type:

```swift
struct BOGODiscount: DiscountStrategy {
    func apply(to subtotal: Decimal) -> Decimal {
        subtotal // simplified — real logic would subtract the cheapest item
    }
}
```

`PriceCalculator.finalPrice` is untouched. It was already written to work with *any* `DiscountStrategy`, including ones that don't exist yet. That's the principle in action: the function is closed for modification (nobody edits it to add BOGO) but open for extension (a new conforming type is all BOGO needs).

## Strategy as OCP

The `DiscountStrategy` pattern above has a name: the **Strategy pattern** — swapping out an algorithm's behavior by handing in a different object that conforms to a shared interface, instead of branching on a type flag inside one function. OCP is the principle; Strategy is one common way to implement it in Swift.

Strategy also composes well with dependency injection. The concrete discount doesn't have to be chosen inside `PriceCalculator` at all — it can be decided by whatever code assembles the order:

```swift
let calculator = PriceCalculator()
let total = calculator.finalPrice(for: order, discount: PercentageDiscount())
```

Swap `PercentageDiscount()` for `BOGODiscount()` and nothing else in the call site or in `PriceCalculator` needs to know. Closures work too for very small strategies — `(Decimal) -> Decimal` is a valid stand-in for a one-method protocol — but a named protocol type reads better once a strategy needs more than one operation or carries its own state (e.g. a `MinimumSpendDiscount` that stores a threshold).

## Examples & smells

The giveaway that code violates OCP is a **type-checking switch** — code that branches on *what kind* of thing something is, rather than asking the thing to behave correctly on its own:

```swift
func area(of shape: Shape) -> Double {
    switch shape.kind {
    case .circle: return .pi * shape.radius * shape.radius
    case .square: return shape.side * shape.side
    case .triangle: return 0.5 * shape.base * shape.height
    }
}
```

Every new shape means editing `area(of:)`. The OCP fix pushes the calculation onto each shape itself, through a protocol:

```swift
protocol Shape {
    var area: Double { get }
}

struct Circle: Shape {
    var radius: Double
    var area: Double { .pi * radius * radius }
}

struct Square: Shape {
    var side: Double
    var area: Double { side * side }
}
```

Now `area(of:)` disappears entirely — callers just read `shape.area`, and a new `Triangle` type slots in without anyone editing existing shapes.

Swift's `enum` with `switch` is not automatically an OCP violation, though — it's a trade-off. A `switch` over an `enum` gives you **exhaustiveness checking**: the compiler forces every `switch` in the codebase to handle a new case the moment you add one, which is exactly what you want when the set of cases is genuinely fixed and closed (e.g. the four seasons, HTTP methods you support). OCP's protocol approach is for the opposite situation: an open-ended set of cases that outside code — including code in other modules you don't control — needs to keep adding to.

## Common pitfalls

- Reaching for OCP when the case set is truly closed. If "these are the only three shapes this app will ever have," a `switch` with exhaustiveness checking is often clearer than a protocol hierarchy.
- A protocol with only one conforming type "for OCP's sake." That's premature abstraction — add the seam when a second case actually shows up, not before.
- Forgetting the caller still needs to construct the right concrete type somewhere. OCP moves the branching out of the shared logic, but *something* still decides which `DiscountStrategy` to use — that decision just moves to configuration, dependency injection, or a factory, and shouldn't sneak back in as a hidden `if` deep inside business logic.

## Interview lens

If asked to define OCP, give both halves precisely: open for extension — new behavior can be added — and closed for modification — adding it doesn't require editing code that already works and is already tested.

If asked to fix an `if/else` or `switch` chain that keeps growing, name the smell (branching on "what kind of thing is this") and show the protocol-based fix: define a narrow protocol for the operation that varies, give each case its own conforming type, and have the shared function depend only on the protocol. Mention Strategy by name — interviewers often want to hear you connect the principle to the pattern.

If pushed on "when would you *not* do this," give the honest trade-off: `switch` over a closed `enum` gets free exhaustiveness checking from the compiler, which is valuable when the case set genuinely won't grow. OCP earns its complexity when the set of cases is open-ended and other code — possibly code you don't own — needs to add new ones without your permission.
