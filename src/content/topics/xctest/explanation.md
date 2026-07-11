## The problem: how do you know your code still works?

You write this function:

```swift
struct DiscountCalculator {
    func finalPrice(subtotal: Double, discountPercent: Double) -> Double {
        subtotal - (subtotal * discountPercent / 100)
    }
}
```

It looks right. You run the app, punch in some numbers by hand, see `$90` where you expected `$90`, and move on. Three weeks later a teammate "simplifies" the formula and nobody notices that discounts above 100% now produce negative prices — because nobody ran your manual check again.

**XCTest** is Apple's framework for writing code that checks your code, automatically, every time. Instead of eyeballing the app, you write a small function that calls `finalPrice` and fails loudly if the answer is wrong. Run it once, run it forever.

## Anatomy of a test: Arrange, Act, Assert

Here's the smallest possible XCTest test for `DiscountCalculator`:

```swift
import XCTest
@testable import ShopKit

final class DiscountCalculatorTests: XCTestCase {
    func test_finalPrice_appliesPercentDiscount() {
        let calculator = DiscountCalculator()
        let result = calculator.finalPrice(subtotal: 100, discountPercent: 10)
        XCTAssertEqual(result, 90)
    }
}
```

Every test method lives inside a class that inherits from `XCTestCase`, and its name must start with `test` — that's how the runner discovers it. `@testable import` gives the test target access to `internal` types from your app, not just `public` ones.

Look at the three lines inside the method. They map to a pattern called **AAA — Arrange, Act, Assert**:

```swift
let calculator = DiscountCalculator()                              // Arrange
let result = calculator.finalPrice(subtotal: 100, discountPercent: 10) // Act
XCTAssertEqual(result, 90)                                          // Assert
```

**Arrange** builds the objects and inputs the test needs. **Act** calls the one thing you're actually testing. **Assert** checks the outcome matches what you expected. Keeping these three steps visually separate — even with a blank line between them — makes a failing test easy to read months later: you can tell at a glance what was set up versus what was actually being checked.

## Assertions: the vocabulary of "checking"

`XCTAssertEqual` is one of many assertion functions; each expresses a different kind of expectation.

```swift
XCTAssertEqual(result, 90)                 // are these two values equal?
XCTAssertTrue(result > 0)                  // is this condition true?
XCTAssertFalse(calculator.hasError)        // is this condition false?
XCTAssertNil(calculator.lastError)         // is this optional nil?
XCTAssertNotNil(calculator.lastRun)        // is this optional non-nil?
XCTAssertGreaterThan(result, 0)            // is this greater than that?
```

Each one takes an optional trailing message, shown only if the assertion fails:

```swift
XCTAssertEqual(result, 90, "10% off $100 should be $90")
```

Add that message and a failure reads as your own sentence in the test log, not just "XCTAssertEqual failed: 90 != 89.99" — worth doing whenever the numbers alone wouldn't explain what went wrong.

Errors get their own assertion. Say `finalPrice` now validates its input:

```swift
enum PricingError: Error { case invalidDiscount }

struct DiscountCalculator {
    func finalPrice(subtotal: Double, discountPercent: Double) throws -> Double {
        guard (0...100).contains(discountPercent) else {
            throw PricingError.invalidDiscount
        }
        return subtotal - (subtotal * discountPercent / 100)
    }
}
```

What should this test check?

```swift
func test_finalPrice_rejectsDiscountOver100() {
    let calculator = DiscountCalculator()
    XCTAssertThrowsError(try calculator.finalPrice(subtotal: 100, discountPercent: 150)) { error in
        XCTAssertEqual(error as? PricingError, .invalidDiscount)
    }
}
```

`XCTAssertThrowsError` passes only if the expression *does* throw; the trailing closure hands you the thrown error so you can assert it's the *specific* error you expected, not just "some error." A test that only checks "it threw something" would still pass if you accidentally threw the wrong case.

## Setup and teardown: not repeating yourself

Once a test file has several tests, they usually share the same "Arrange" step. Watch the duplication:

```swift
func test_finalPrice_appliesPercentDiscount() {
    let calculator = DiscountCalculator()
    XCTAssertEqual(try! calculator.finalPrice(subtotal: 100, discountPercent: 10), 90)
}

func test_finalPrice_zeroDiscountReturnsSubtotal() {
    let calculator = DiscountCalculator()
    XCTAssertEqual(try! calculator.finalPrice(subtotal: 100, discountPercent: 0), 100)
}
```

`XCTestCase` gives you a hook that runs before every single test method, so the shared setup only has to be written once:

```swift
final class DiscountCalculatorTests: XCTestCase {
    var calculator: DiscountCalculator!

    override func setUpWithError() throws {
        calculator = DiscountCalculator()
    }

    func test_finalPrice_appliesPercentDiscount() {
        XCTAssertEqual(try! calculator.finalPrice(subtotal: 100, discountPercent: 10), 90)
    }

    func test_finalPrice_zeroDiscountReturnsSubtotal() {
        XCTAssertEqual(try! calculator.finalPrice(subtotal: 100, discountPercent: 0), 100)
    }
}
```

`setUpWithError()` runs fresh before *each* test method, and XCTest creates a brand-new instance of `DiscountCalculatorTests` for every test too — so `calculator` never leaks state from one test into the next. There's a matching `tearDownWithError()` that runs after each test, useful for closing files or invalidating timers you opened in setup.

Predict: does `tearDown` run if the test method itself throws or fails an assertion partway through?

Answer: yes. `tearDownWithError()` always runs after the test body finishes, pass or fail, the same way a `defer` block always runs — so it's the right place to release resources no matter what the test discovers.

Both hooks also have a class-level variant, reached through `override class func setUp()`, which runs once for the whole class rather than once per test. Reach for it only for expensive, read-only setup like spinning up an in-memory database schema — anything mutable shared across tests reintroduces the state-leaking problem `setUp` was solving.

## Organizing a test suite

A few conventions keep a growing test suite navigable:

- Naming: `test_methodUnderTest_condition_expectedResult`, e.g. `test_finalPrice_negativeSubtotal_throws`. Reading the name alone should tell you what broke, before you open the file.
- One test file per production type: `DiscountCalculator` gets `DiscountCalculatorTests`, mirroring the app's folder structure inside the test target.
- Test targets: unit tests live in a separate target, commonly `<AppName>Tests`, that depends on the app target via `@testable import`, so tests compile and run independently of the app's UI. UI tests get their own target too, `<AppName>UITests`, because they drive the app through the accelerator rather than calling code directly.
- Grouping with extensions: once a test class covers multiple behaviors, splitting it into `// MARK:`-separated sections or per-behavior extensions keeps related tests visually together without inventing more classes.

## Waiting for async work

Tests run synchronously by default: XCTest calls your test method and expects it to return. That breaks the moment you're testing something that finishes on another queue:

```swift
final class PriceFetcher {
    func fetchLatestPrice(completion: @escaping (Double) -> Void) {
        DispatchQueue.global().asyncAfter(deadline: .now() + 0.1) {
            completion(42.0)
        }
    }
}
```

A test that just calls `fetchLatestPrice` and asserts immediately would finish — and pass or fail meaninglessly — before the completion handler ever runs. XCTest solves this with an **XCTestExpectation**, an object you fulfill when the async work actually completes:

```swift
func test_fetchLatestPrice_returnsPrice() {
    let expectation = expectation(description: "price fetched")
    var receivedPrice: Double?

    PriceFetcher().fetchLatestPrice { price in
        receivedPrice = price
        expectation.fulfill()
    }

    wait(for: [expectation], timeout: 1.0)
    XCTAssertEqual(receivedPrice, 42.0)
}
```

`wait(for:timeout:)` pauses the test method — without blocking the queue the async work needs — until every expectation in the array is fulfilled or the timeout elapses. Miss the timeout and the test fails with a clear "Asynchronous wait failed" message instead of hanging forever.

If the code under test uses `async`/`await` instead of a completion handler, you don't need `XCTestExpectation` at all — mark the test method itself `async` and `await` directly:

```swift
final class PriceFetcher {
    func fetchLatestPrice() async -> Double {
        try? await Task.sleep(nanoseconds: 100_000_000)
        return 42.0
    }
}

func test_fetchLatestPrice_returnsPrice_async() async {
    let price = await PriceFetcher().fetchLatestPrice()
    XCTAssertEqual(price, 42.0)
}
```

XCTest recognizes an `async` test method and suspends it properly, resuming your assertions once the awaited work finishes — no expectation object required.

## What to test — and what not to

Tests should verify **behavior**: given these inputs, what does the public API produce? Not **implementation**: which private helper method got called, or how many lines the function has internally.

```swift
// Good: tests the observable result
XCTAssertEqual(calculator.finalPrice(subtotal: 100, discountPercent: 10), 90)

// Fragile: tests an internal detail that could change without breaking behavior
XCTAssertEqual(calculator.roundingStrategyUsedInternally, .bankers)
```

The fragile version fails the moment someone refactors `roundingStrategyUsedInternally` away, even if `finalPrice` still returns the exact right number — that's a test actively punishing a harmless refactor.

Worth deliberate coverage:

- Edge cases: zero, negative numbers, empty collections, the maximum and minimum values a type allows, discount exactly at 0 or 100.
- Error paths: every `throw` site deserves at least one test proving it actually throws under the right condition.
- Boundary conditions: off-by-one spots like "exactly 100" versus "100.0001."

Usually not worth testing directly:

- Third-party frameworks and the standard library — trust that `Array.sorted()` sorts.
- Simple property getters/setters with no logic.
- Private implementation details reachable only through the public behavior you already test — testing them couples your suite to code that's free to change.

## Common pitfalls

- Asserting on the wrong thing after `wait(for:)`. Read `receivedPrice` or similar captured state *after* the wait call, never before — the fetch hasn't happened yet.
- Shared mutable state across tests. Storing a calculator as a `static var` instead of resetting it in `setUp` lets one test's leftover state quietly change another test's result depending on run order.
- Testing implementation instead of behavior. A test that breaks on every refactor, even correct ones, actively discourages cleaning up code.

## Interview lens

If asked to describe a good unit test, lead with AAA: arrange the inputs, act by calling the one thing under test, assert on the outcome — and say each test should check one behavior, not several unrelated ones bundled together.

If asked why `setUp`/`tearDown` matter, the answer is test isolation: a fresh instance of the test class per test method plus `setUp` resetting shared objects means one test's failure or leftover state can never leak into the next test's result.

If asked about testing async code, mention both mechanisms and when each applies: `XCTestExpectation` with `wait(for:timeout:)` for completion-handler and delegate-based APIs, and plain `async` test methods with `await` for Swift concurrency — and note that a missing `fulfill()` call is the classic bug, since the test just times out instead of failing fast.

If asked what *not* to test, say behavior over implementation: assert on what a type returns or does, not on which private method it happened to call, so refactors don't break tests that never should have cared.
