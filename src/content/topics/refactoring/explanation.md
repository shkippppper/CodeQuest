## The problem: code that works but hurts to touch

Look at this method:

```swift
func priceLabel(for order: Order) -> String {
    var total = order.subtotal
    if order.customer.tier == .gold {
        total *= 0.9
    } else if order.customer.tier == .silver {
        total *= 0.95
    }
    return "$\(total)"
}
```

Nothing here is *broken*. It compiles, it passes its tests, it returns the right number. But every time a new discount rule shows up, someone adds another `if` to this function, and six months from now it's forty lines deep and nobody wants to touch it. Imagine two more rules bolted on: a bulk-order discount, and a free-shipping label past $100. Same shape, more branches, same growing discomfort.

That discomfort has a name: a **code smell** — a pattern in working code that signals a design problem, even though nothing is currently failing. And the disciplined response to a smell is **refactoring**: changing the code's internal structure without changing what it does. Same inputs, same outputs, different shape.

This lesson is about recognizing the smells and applying the fix safely.

## Common smells

Smells aren't bugs — they're friction you feel while reading or changing code. Four show up constantly:

```swift
func priceLabel(for order: Order) -> String { /* 40 lines */ }
```

A function that keeps growing every time a new case appears is a **long method** — reading it means holding too much in your head at once.

```swift
if order.customer.tier == .gold {
    total *= 0.9
} else if order.customer.tier == .silver {
    total *= 0.95
} else if order.customer.tier == .silver { // copy-pasted, wrong condition
    total *= 0.97
}
```

Near-identical blocks repeated with small variations are **duplicated code** — and duplication is dangerous specifically because a fix applied to one copy is easy to forget in the others (notice the bug hiding in that last `else if`).

```swift
struct OrderSummaryView {
    func render(_ order: Order) -> String {
        // reaches directly into order.customer.address.city.postalCode
    }
}
```

A method that pulls most of its data from *another* object instead of its own is **feature envy** — it's doing work that arguably belongs on the object it keeps reaching into.

```swift
func process(type: String, amount: Double, isRefund: Bool, notify: Bool, retries: Int) { }
```

A parameter list that keeps accumulating flags and unrelated values is a **long parameter list** — every new caller has to understand five loosely related inputs instead of one cohesive one.

None of these four crash your app. All four make the next change slower and riskier — which is exactly the cost refactoring pays down.

## Safe refactoring with tests

Before touching the `priceLabel` function, you need a way to know you didn't break it. That's what a test gives you:

```swift
func test_goldCustomer_getsTenPercentOff() {
    let order = Order(subtotal: 100, customer: .gold, itemCount: 1)
    XCTAssertEqual(priceLabel(for: order), "$90.0")
}
```

This test doesn't care *how* `priceLabel` computes its answer — only that gold customers see `$90.0`. That's the whole point: refactoring is only safe when a test locks down *behavior* while you're free to change *structure*.

The discipline is: **red-green-refactor**, run backwards. You already have green (the tests pass on today's code). Now you refactor in small steps, rerunning the tests after each one:

```swift
// step 1: extract the discount math — rerun tests, still green
// step 2: extract the shipping label — rerun tests, still green
// step 3: replace the if-chain with a lookup — rerun tests, still green
```

If a step ever turns a test red, you know *exactly* which small change broke behavior, because you only changed one thing since the last green run. Refactor without tests and you're just hoping — you have no signal that you preserved behavior, only that the code still compiles.

## Extract method: giving a block of code a name

The first and most common refactoring move is pulling a chunk of logic out into its own, well-named function. Start with the discount block:

```swift
if order.customer.tier == .gold {
    total *= 0.9
} else if order.customer.tier == .silver {
    total *= 0.95
}
```

This is math about *loyalty discounts*, buried inside a function about *labels*. Pull it out:

```swift
func loyaltyDiscount(for tier: CustomerTier) -> Double {
    switch tier {
    case .gold: return 0.9
    case .silver: return 0.95
    case .none: return 1.0
    }
}
```

Now `priceLabel` reads as a sequence of named steps instead of a wall of arithmetic:

```swift
func priceLabel(for order: Order) -> String {
    var total = order.subtotal * loyaltyDiscount(for: order.customer.tier)
    if order.itemCount > 10 { total *= 0.98 }
    return total > 100 ? "$\(total) (free shipping)" : "$\(total)"
}
```

This is **extract method**: take a block of code, give it a name that describes *what* it does (not *how*), and call it from where it used to live inline. The behavior is identical — you can prove that with the same test from before — but the reader now sees intent (`loyaltyDiscount`) instead of implementation (a chain of comparisons).

The sibling move is **extract type**. Once you notice that `tier`, `discount rate`, and `free shipping threshold` are all facts *about a customer's relationship to pricing*, that's a signal they belong together:

```swift
struct PricingPolicy {
    let discount: (CustomerTier) -> Double
    let freeShippingThreshold: Double
}
```

Extract method pulls behavior into a function; extract type pulls related data and behavior into a new home. Both refactorings answer the same question — "does this thing have its own name and place?" — at different scales.

## Replace conditionals with polymorphism

Now look at what's left: a growing `if/else if` chain keyed on `order.customer.tier`. Every time the business adds a new tier, someone has to remember to update this exact function — and every other function that happens to branch on tier.

Predict: what happens to `loyaltyDiscount` when a new `.platinum` tier is added, but the developer forgets to update this one function while updating three others that also switch on tier?

Answer: `.platinum` silently falls through to whatever the `default`/`none` case does — often the *no discount* branch — and nobody notices until a platinum customer complains they were overcharged. That's the real cost of scattering the same conditional across a codebase: each copy is a place the next tier can be forgotten.

The fix is to stop asking "what tier is this?" everywhere, and instead let each tier answer for itself:

```swift
protocol CustomerTier {
    var discountRate: Double { get }
    var freeShippingThreshold: Double { get }
}

struct GoldTier: CustomerTier {
    let discountRate = 0.9
    let freeShippingThreshold = 75.0
}

struct SilverTier: CustomerTier {
    let discountRate = 0.95
    let freeShippingThreshold = 100.0
}
```

Now `priceLabel` never mentions a tier by name again:

```swift
func priceLabel(for order: Order) -> String {
    let total = order.subtotal * order.customer.tier.discountRate
    let freeShip = total > order.customer.tier.freeShippingThreshold
    return freeShip ? "$\(total) (free shipping)" : "$\(total)"
}
```

Adding `PlatinumTier` means writing one new struct that conforms to `CustomerTier` — there is no `if/else` chain left to forget to update, because the chain doesn't exist. This is **replace conditionals with polymorphism**: instead of one function asking "what type are you?" and branching, each type carries the answer as its own behavior.

This trade isn't free. A single `if/else` is easier to scan in one glance than five separate conforming types spread across files. Reach for this refactoring when the *same* conditional on the *same* type keeps reappearing in multiple places — that's the sign the branching logic itself, not just one function, needs a home.

## Common pitfalls

- **Refactoring and adding a feature in the same commit.** Mixing "reshape the code" with "change behavior" means a red test can't tell you which change caused it. Keep them in separate commits.
- **Refactoring without a safety net.** No tests means no proof that behavior survived — you're just rewriting code and hoping it still works.
- **Reaching for polymorphism too early.** One `if/else` with two branches that will never grow doesn't need a protocol hierarchy — that's over-engineering the fix for a smell that isn't there yet.

## Interview lens

If asked "what's the difference between refactoring and rewriting," say refactoring preserves external behavior — same inputs, same outputs — while only the internal structure changes; you'd reach for tests as proof, not just "the code looks cleaner now."

If asked to name smells, don't just list them — tie each to *why* it hurts: long methods overload working memory, duplication multiplies the cost of a fix, feature envy signals a method living in the wrong place, and long parameter lists hide which inputs actually belong together.

If given a growing `if/else` chain that switches on a type or category, mention **replace conditionals with polymorphism** by name and explain the trade-off honestly: it removes the "forgot to update one branch" bug class, at the cost of spreading logic across more files — worth it once the same conditional is duplicated in multiple places, not for a single two-branch `if`.
