## The problem: writing the implementation first hides bad design

Try this experiment. Write the implementation for a shopping cart discount calculator first, then write tests for it afterward. You'll usually find the tests are awkward to write — you need to reach into private state, stub out three collaborators just to check one number, or the method signature doesn't give you what you need to assert on.

**Test-driven development** (TDD) flips the order: write a failing test that describes the behavior you want, then write just enough code to make it pass. The test is written *before* the code exists, so the code has no choice but to be shaped in a way that's easy to call and easy to check.

This lesson walks through a real cycle, then looks at how that ordering changes the design you end up with, when it's worth the overhead, and the two schools of thought on where to start.

## The cycle: red, green, refactor

Start with a test for code that doesn't exist yet:

```swift
func test_totalWithNoDiscount() {
    let cart = ShoppingCart()
    cart.add(price: 10.0)
    cart.add(price: 25.0)
    XCTAssertEqual(cart.total(), 35.0)
}
```

This doesn't even compile — there's no `ShoppingCart` type. That's **red**: the first phase of the cycle, where the test fails (or doesn't build) because the behavior doesn't exist yet.

Write the smallest thing that makes it pass:

```swift
struct ShoppingCart {
    private var prices: [Double] = []
    mutating func add(price: Double) {
        prices.append(price)
    }
    func total() -> Double {
        prices.reduce(0, +)
    }
}
```

Run the test again. It passes — that's **green**. Notice what you did *not* write: no discount logic, no currency formatting, nothing the test didn't ask for. Green means "just enough code," not "all the code you can think of."

With the test passing, look at the code with fresh eyes. Is `prices.reduce(0, +)` the clearest way to sum an array? Yes — nothing to change here, so this cycle's **refactor** step is a no-op. Refactoring only happens when there's something worth cleaning up, and it's safe to do because the test is still there watching for regressions.

### Growing the example: a second test drives new behavior

Add a test for a discount:

```swift
func test_totalWithTenPercentDiscount() {
    var cart = ShoppingCart()
    cart.add(price: 100.0)
    cart.applyDiscount(percent: 10)
    XCTAssertEqual(cart.total(), 90.0)
}
```

Red again — `applyDiscount` doesn't exist. What's the minimal code to go green? Predict it before reading on: does it need a whole `DiscountPolicy` type, or something simpler?

```swift
struct ShoppingCart {
    private var prices: [Double] = []
    private var discountPercent: Double = 0

    mutating func add(price: Double) {
        prices.append(price)
    }
    mutating func applyDiscount(percent: Double) {
        discountPercent = percent
    }
    func total() -> Double {
        let subtotal = prices.reduce(0, +)
        return subtotal * (1 - discountPercent / 100)
    }
}
```

A single stored property and one line in `total()` — nothing more. TDD resists the urge to build a discount *framework* before a second test proves you need one.

### Refactor step: this time there's actually something to clean

Now a third test arrives for a flat-amount discount, like a $5-off coupon:

```swift
func test_totalWithFlatDiscount() {
    var cart = ShoppingCart()
    cart.add(price: 20.0)
    cart.applyFlatDiscount(5.0)
    XCTAssertEqual(cart.total(), 15.0)
}
```

Making this pass with a second `discountAmount` property works, but now `total()` has two unrelated discount code paths tangled together, and nothing stops both being set at once. This is the moment refactor earns its keep: three tests are green, so you can restructure freely and know immediately if you broke something.

```swift
protocol Discount {
    func apply(to subtotal: Double) -> Double
}
struct PercentDiscount: Discount {
    let percent: Double
    func apply(to subtotal: Double) -> Double { subtotal * (1 - percent / 100) }
}
struct FlatDiscount: Discount {
    let amount: Double
    func apply(to subtotal: Double) -> Double { subtotal - amount }
}
```

All three tests still pass after this change — they never had to know a `Discount` protocol was introduced, because they only ever asserted on `total()`. That's the payoff: refactoring is safe precisely because the tests describe *behavior*, not implementation.

## Designing through tests

Look back at that `Discount` protocol. It wasn't planned up front — it fell out of trying to keep `total()` readable once a second discount test showed up. This is TDD's real design contribution: the test forces you to decide the *shape* of an API before you decide how it works inside.

Watch it happen on a smaller scale. Suppose the next requirement is "some discounts should be logged for analytics." Write the test first:

```swift
func test_discountIsReported() {
    let spy = DiscountReporterSpy()
    var cart = ShoppingCart(reporter: spy)
    cart.add(price: 100.0)
    cart.applyDiscount(PercentDiscount(percent: 10))
    _ = cart.total()
    XCTAssertEqual(spy.reportedAmounts, [10.0])
}
```

To write this test at all, you had to invent `DiscountReporterSpy` and decide `ShoppingCart` takes a `reporter` — which means there's a `DiscountReporter` protocol boundary between the cart and whatever logs analytics, discovered before a single line of the real reporter exists:

```swift
protocol DiscountReporter {
    func report(amount: Double)
}
```

If you'd written the implementation first, it's easy to reach for a global analytics singleton instead — it works, it's less typing, and nothing forces you to notice it's untestable until much later. Needing to construct a fake collaborator up front is what exposes the **seam**: the point in the code where one piece can be swapped out from another. Writing the test first puts that seam exactly where the design needs it.

## TDD trade-offs

TDD isn't free, and pretending otherwise is how teams abandon it. It pays off clearly in a few situations:

- Business logic with clear rules — discount math, parsers, state machines. The rules are known up front, so writing them as tests first is natural and the tests double as living documentation.
- Bug fixes — write a failing test that reproduces the bug before touching the fix. It proves the bug existed, proves the fix works, and stops it from silently coming back.
- APIs other teams will call — being forced to write the calling code (the test) before the implementation catches awkward signatures early.

It's overhead, or actively counterproductive, in others:

- Exploratory or throwaway code — spiking a UI layout or trying three different approaches to a graphics algorithm. You don't know the shape of the solution yet, so writing tests first means rewriting them constantly as the design churns.
- Code with high test cost, low logic complexity — thin view-layer glue that just forwards calls has little behavior worth locking down, and the test often just re-describes the implementation line by line.
- Requirements that are still shifting hour to hour. Tests written against a moving target become a maintenance tax, not a safety net.

The most common critique of strict TDD is that it can produce over-engineered abstractions — a protocol for something that only ever needed one implementation — because the test author guessed at flexibility that was never needed. The discipline that keeps this in check is writing only the minimal code to go green each cycle, and refactoring toward simplicity, not just toward "more testable."

## Outside-in vs inside-out

The cart example above started at the smallest unit — `ShoppingCart.total()` — and built outward. That's one of two schools of TDD, and the other one starts from the opposite end.

**Outside-in** TDD, also called the London school, starts with a test for the outermost behavior the user actually triggers — an **acceptance test** like "checking out an empty cart shows an error" — and only writes lower-level unit tests as that outer test forces new collaborators into existence. Each collaborator gets stubbed out with a test double first, then implemented once the outer test demands it. The `DiscountReporterSpy` example above is outside-in flavored: the need for a reporter was discovered from a test written at the cart's boundary, not invented ahead of time.

**Inside-out** TDD, also called the classic or Detroit school, starts where this lesson's worked example started: small, low-level units like `ShoppingCart.total()`, built and tested first, then composed upward into larger behaviors once the pieces exist. There's less use of test doubles — real objects are composed together — and the design emerges bottom-up rather than being dictated by an outer acceptance test.

Neither is strictly correct. Outside-in is stronger when the external contract (an API shape, a user flow) is the part you're least sure about and needs to be nailed down first. Inside-out is stronger when the core logic is well understood and complex enough that get it right in isolation matters more than any particular caller's shape. Many teams mix both: an acceptance test at the top of a feature, written outside-in, with the algorithmic pieces underneath built inside-out.

## Common pitfalls

- Writing the whole implementation, then a test that just confirms it. That's not TDD — the test never got to shape anything because it arrived after the design was already fixed. Confirm the test fails first, for the reason you expect, before writing the fix.
- Skipping refactor because green feels like "done." Duplication and awkward names that survive one cycle compound over ten. The safety net only helps if you actually use it.
- Over-mocking in outside-in style. Stubbing every single collaborator can produce tests that pass even when the real objects, wired together, would fail. Keep a handful of tests that exercise real collaborators end to end.

## Interview lens

If asked to describe TDD, give the three-step cycle by name — red, green, refactor — and be specific about what "green" means: the smallest code that passes, not the most complete code you can imagine. That distinction is what separates people who've actually practiced TDD from people who've read about it.

If asked to demonstrate it live, narrate a real red-green-refactor loop on a small example, the way the shopping cart walk did here: show the test failing first, write the minimal pass, then explain what you'd refactor and why it's safe to do so with the test in place.

If asked about trade-offs, don't just say "TDD is good." Say where it earns its keep — logic with clear rules, bug reproduction, public APIs — and where it's a poor fit — exploratory spikes, thin glue code, fast-churning requirements. That balance reads as senior judgment rather than dogma.

If asked outside-in versus inside-out, tie it to a concrete choice: outside-in when the external contract is the unknown and you want an acceptance test driving collaborators into existence with doubles; inside-out when the core algorithm is the hard part and you'd rather nail it in isolation before composing it upward. Mentioning the London school and Detroit school by name signals you've seen this debate before, not just guessed at an answer.
