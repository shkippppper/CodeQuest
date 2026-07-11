## The problem: a test framework built for Swift, not bolted onto it

Here's a whole test, start to finish:

```swift
import Testing

@Test func addingTwoNumbers() {
    #expect(2 + 2 == 4)
}
```

No subclass, no `test` prefix, no importing `XCTest`. Just a free function marked `@Test` and a check marked `#expect`. This is **Swift Testing** — the framework Apple introduced at WWDC 2024, imported with `import Testing` instead of `import XCTest`.

You already know XCTest's shape: subclass `XCTestCase`, name methods `testSomething`, call `XCTAssertEqual`. Swift Testing keeps the same job — running checks and reporting failures — but every piece of that ceremony is replaced by a Swift macro. This lesson walks through what's actually new.

## @Test: any function can be a test

Drop the `@Test` attribute on a function and it becomes a test, anywhere — top-level, in a struct, in an enum:

```swift
@Test func discountIsApplied() {
    let price = applyDiscount(to: 100, percent: 10)
    #expect(price == 90)
}
```

There's no `test` prefix requirement, because the compiler already knows this is a test — the attribute says so. You can also give a test a human-readable name that shows up in results instead of the function name:

```swift
@Test("Discount reduces price by the given percent")
func discountIsApplied() {
    #expect(applyDiscount(to: 100, percent: 10) == 90)
}
```

That string is a **display name** — purely cosmetic, shown in Xcode's test navigator and CI logs, and handy when the function name alone doesn't read well as a sentence.

## #expect: a check that keeps going and tells you why

`#expect` plays the same role `XCTAssertEqual`, `XCTAssertTrue`, and friends played in XCTest — record a failure but let the test keep running so you see every problem in one pass, not just the first.

```swift
@Test func expectShowsTheRealValues() {
    let price = applyDiscount(to: 100, percent: 10)
    #expect(price == 95)   // fails: price is actually 90
}
```

You didn't write `XCTAssertEqual(price, 95)` — you wrote a plain Swift boolean expression, `price == 95`. That's the point of `#expect` being a **macro**: code that runs at compile time to rewrite your expression into something richer. It inspects `price == 95` before compiling, so when it fails it can print both sides: "expected 95, got 90" — without you ever naming a `XCTAssertEqual`-style function for that specific comparison.

That means one `#expect` call replaces `XCTAssertEqual`, `XCTAssertTrue`, `XCTAssertNil`, `XCTAssertGreaterThan`, and the rest — the expression itself tells `#expect` what kind of check it is.

```swift
#expect(user.name == "Ada")
#expect(cart.items.isEmpty)
#expect(discount > 0)
```

## #require: stop the test when continuing is pointless

Sometimes a failed check makes every later line meaningless — unwrapping an optional that turned out to be `nil`, for example. For that, Swift Testing has **`#require`**, the throwing sibling of `#expect`.

```swift
@Test func userHasAValidEmail() throws {
    let user = try #require(fetchUser(id: 1))
    #expect(user.email.contains("@"))
}
```

If `fetchUser(id: 1)` returns `nil`, `#require` throws right there and the test stops — the second `#expect` never runs on a value that doesn't exist. This is the direct replacement for `XCTUnwrap`: same job, but as a macro that also works on plain boolean conditions, not just optionals.

```swift
try #require(cart.items.count > 0)   // throws and stops if false
```

Because `#require` can throw, the test function needs `throws` in its signature — the compiler enforces this, so you can't forget it.

## Traits: attaching metadata to a test

A **trait** is a modifier you attach to `@Test` in parentheses, changing how that test is treated without touching its body. Three you'll reach for constantly:

```swift
@Test(.tags(.networking))
func fetchesUserProfile() async throws {
    let user = try await api.fetchUser(id: 1)
    #expect(user.id == 1)
}
```

`.tags(...)` labels a test so you can filter — run only `.networking` tests, or exclude a slow group — from Xcode's test navigator or the command line.

```swift
@Test(.disabled("Backend endpoint not deployed yet"))
func fetchesOrderHistory() async throws {
    let orders = try await api.fetchOrders()
    #expect(!orders.isEmpty)
}
```

`.disabled("reason")` skips the test but still shows it in results as skipped, with your reason attached — a big improvement over commenting out an XCTest method, since the intent to re-enable it stays visible.

```swift
@Test(.timeLimit(.minutes(1)))
func syncsLargeDataset() async throws {
    try await syncEngine.runFullSync()
}
```

`.timeLimit(...)` fails the test automatically if it runs longer than the given duration — useful for catching a hang in CI instead of watching the whole suite time out.

Traits combine by listing them together: `@Test(.tags(.networking), .timeLimit(.minutes(1)))`.

## Parameterized tests: one test body, many inputs

XCTest testing the same logic against five inputs usually meant five near-identical test methods, or a hand-rolled `for` loop inside one method that silently stops at the first failure. Swift Testing has a direct answer: pass a collection to `@Test(arguments:)`.

```swift
@Test(arguments: [10, 25, 50, 100])
func discountNeverExceedsOriginalPrice(percent: Int) {
    let price = applyDiscount(to: 100, percent: percent)
    #expect(price <= 100)
}
```

Swift Testing runs `discountNeverExceedsOriginalPrice` four times, once per element in the array, and reports each run as its own result. If the run for `percent: 100` fails, you see exactly which input failed — the other three still ran and reported independently.

Predict: what happens if you pass two arrays instead of one?

```swift
@Test(arguments: [10, 25, 50], ["USD", "EUR"])
func discountAppliesPerCurrency(percent: Int, currency: String) {
    // ...
}
```

Answer: Swift Testing runs every combination — the *cartesian product* — so this runs 3 × 2 = 6 times, once for each `(percent, currency)` pair.

## Suites: grouping tests in a struct

XCTestCase grouped related tests as methods on a subclass. Swift Testing groups them as a **`@Suite`** — usually a plain `struct`:

```swift
@Suite("Discount calculations")
struct DiscountTests {
    @Test func tenPercentOff() {
        #expect(applyDiscount(to: 100, percent: 10) == 90)
    }

    @Test func zeroPercentOff() {
        #expect(applyDiscount(to: 100, percent: 0) == 100)
    }
}
```

You don't strictly need `@Suite` — any type containing `@Test` functions is treated as a suite automatically — but adding it lets you give the group a display name, the same way `@Test("...")` names a single test.

### init and deinit replace setUp and tearDown

XCTestCase used `setUp()` before each test and `tearDown()` after. A struct-based suite uses its own initializer and deinitializer instead:

```swift
@Suite struct CartTests {
    let cart: Cart

    init() {
        cart = Cart()             // fresh state before each test
    }

    @Test func startsEmpty() {
        #expect(cart.items.isEmpty)
    }

    @Test func addingAnItemIncreasesCount() {
        cart.add(Item(name: "Book"))
        #expect(cart.items.count == 1)
    }
}
```

Because it's a plain Swift `struct`, Swift Testing creates a **new instance for every single `@Test`** in the suite — `init()` runs fresh each time, so `startsEmpty` and `addingAnItemIncreasesCount` each get their own untouched `cart`. That's the same isolation `setUp` gave you, but it falls out of ordinary struct semantics instead of a lifecycle method you had to remember to call.

## Async tests, natively

XCTest could test async code, but it needed extra ceremony — expectations, or an `async` test method that still felt bolted on. In Swift Testing, `async` is just part of the function signature, exactly like any other Swift function:

```swift
@Test func fetchingUserSucceeds() async throws {
    let user = try await api.fetchUser(id: 1)
    #expect(user.id == 1)
}
```

`#expect` and `#require` both work directly on `async` and `throws` expressions, so you can await inside the check itself:

```swift
@Test func fetchingMissingUserThrows() async {
    await #expect(throws: APIError.notFound) {
        try await api.fetchUser(id: 999)
    }
}
```

`#expect(throws:)` runs the closure and checks that it throws the given error — replacing `XCTAssertThrowsError`, but now able to `await` inside the closure because the whole check understands `async`.

## Migrating from XCTest

| XCTest | Swift Testing |
|---|---|
| `class MyTests: XCTestCase` | `struct MyTests` (optionally `@Suite`) |
| `func testDiscount()` | `@Test func discount()` — no `test` prefix needed |
| `setUp()` / `tearDown()` | `init()` / `deinit` |
| `XCTAssertEqual(a, b)` | `#expect(a == b)` |
| `XCTAssertTrue(x)` / `XCTAssertFalse(x)` | `#expect(x)` / `#expect(!x)` |
| `XCTAssertNil(x)` | `#expect(x == nil)` |
| `XCTUnwrap(x)` | `try #require(x)` |
| `XCTAssertThrowsError(try f())` | `#expect(throws: MyError.self) { try f() }` |

Test methods and `@Test` functions can live side by side in the same target during a migration — you don't have to convert an entire XCTestCase subclass in one sitting. Both frameworks can run in the same test bundle, so the transition is incremental.

## Common pitfalls

- **Forgetting `throws` on a function that uses `try #require`.** The compiler catches it immediately, but the fix is just adding `throws` to the test's signature.
- **Assuming suite state is shared like a subclass's instance variables.** A `struct` suite gets a fresh `init()` per test — if you need one piece of state to persist *across* tests, Swift Testing isn't the place for it; that's a sign the tests aren't truly independent.
- **Not expecting parallel execution.** Swift Testing runs tests concurrently by default, unlike XCTest's mostly-serial default. Tests that quietly relied on running in a fixed order, or that touch shared global mutable state, can fail intermittently until you either fix the shared state or mark the suite `.serialized`.

## Interview lens

If asked "what's new in Swift Testing versus XCTest," lead with the shape change: tests are plain functions marked `@Test`, not methods on an `XCTestCase` subclass, and checks are macros — `#expect` and `#require` — that read your actual boolean expression instead of requiring a specific `XCTAssert*` function per check type.

If asked to justify `#require` versus `#expect`, say `#expect` records a failure and keeps running so you see every problem in one pass, while `#require` throws and stops immediately — use it exactly where continuing would be meaningless, like an unwrapped optional the rest of the test depends on.

If the interviewer pushes on parameterized tests, mention `@Test(arguments:)` runs the body once per element (or once per combination, for multiple arrays) and reports each run separately — a real gap XCTest never closed cleanly. And if they ask about test isolation, point out that struct-based suites get a fresh instance per test automatically, which is why `init`/`deinit` replaced `setUp`/`tearDown` — it's not a new lifecycle to memorize, it's just how structs already behave.
