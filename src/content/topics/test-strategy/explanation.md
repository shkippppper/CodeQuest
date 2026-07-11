## The problem: more tests isn't automatically a better suite

Picture two apps. App A has 2,000 tests and takes 45 minutes to run in CI; half the team ignores failures because "it's always something flaky." App B has 400 tests, runs in 4 minutes, and a red run means someone drops what they're doing. App B has the better test suite, even though it has a fifth as many tests.

Test strategy is the set of decisions that get you to App B: not just "write tests," but *what kind*, *how many of each kind*, and *what you deliberately leave untested*.

## The testing pyramid: not all tests should cost the same

Compare two ways of testing the same behavior — a shopping cart's total price calculation:

```swift
// Unit test: calls one function directly, no app, no network, no disk
func test_cartTotal_sumsLineItems() {
    let cart = Cart(items: [Item(price: 10, qty: 2), Item(price: 5, qty: 1)])
    XCTAssertEqual(cart.total, 25)
}
```

```swift
// UI test: launches the real app, taps through adding two items to a real cart screen
func test_addingTwoItems_showsCorrectTotal() {
    let app = XCUIApplication()
    app.launch()
    CartScreen(app: app).addItem("Widget").addItem("Widget")
    XCTAssertTrue(app.staticTexts["$20.00"].waitForExistence(timeout: 5))
}
```

Both check real behavior, but they're wildly different in cost. The unit test runs in microseconds, needs no simulator, and — because it isolates one function — a failure points at exactly one place. The UI test takes seconds, needs a booted simulator, exercises the entire app stack (layout, navigation, the real `Cart` type, view rendering), and a failure could mean *any* of those broke, not necessarily the price math.

The **testing pyramid** is the mental model for combining both: many fast, narrow unit tests at the base; fewer, broader integration tests in the middle (testing a few components wired together — say, a view model plus a real, un-mocked cache); fewer still, slow UI tests at the top, reserved for the critical paths a user actually walks through end to end.

```
        UI tests            ← few — slow, broad, end-to-end confidence
     Integration tests       ← some — a few real components wired together
   Unit tests (the base)      ← many — fast, narrow, pinpoint failures
```

The shape matters more than any specific ratio: each layer up costs more to run and tells you less about *where* the bug is, so you want most of your confidence coming from the cheap, precise layer at the bottom. A suite shaped like an inverted pyramid — mostly slow UI tests, few unit tests — is the single most common reason a team ends up with App A: a 45-minute CI run that everyone dreads and half-ignores.

## What to test, and what not to

Given limited time, not every line deserves a test. Compare these two:

```swift
struct DiscountCalculator {
    // Business rule: full-price members get no discount below $50
    func discount(for total: Decimal, memberTier: MemberTier) -> Decimal {
        guard memberTier == .premium, total >= 50 else { return 0 }
        return total * 0.10
    }
}
```

```swift
struct Item {
    let name: String
    let price: Decimal
}   // a plain data holder — nothing to get wrong
```

`DiscountCalculator.discount` encodes a real business rule with edge cases (a threshold, a tier check) — exactly the kind of logic that silently breaks when someone "simplifies" it later, and a unit test pins it down cheaply. `Item` is a struct with no logic at all; a test that constructs one and asserts its properties round-trip is testing that Swift's compiler works, not that your code works.

The general filter: test logic that branches, that encodes a business rule, or that you've been burned by before (a regression test for a real past bug is almost always worth writing). Skip trivial pass-through code, generated code, and framework internals you don't own — testing `UILabel.text = "hi"; XCTAssertEqual(label.text, "hi")` verifies UIKit, not your app.

The same filter applies one level up: a UI test for "can a user complete checkout" earns its slow, expensive place because that path is critical and end-to-end confidence genuinely matters there. A UI test for "does the settings screen's third toggle have the right accessibility label" almost never does — a much cheaper test at a lower layer of the pyramid can check that just as well.

## Coverage is a signal, not a goal

**Code coverage** is the percentage of your code's lines (or branches) that get executed by at least one test. It's tempting to treat "we're at 85% coverage" as the goal itself — but coverage measures whether a line *ran* during a test, not whether anything meaningful was *asserted* about it.

```swift
func test_discount_runsWithoutCrashing() {
    let calculator = DiscountCalculator()
    _ = calculator.discount(for: 100, memberTier: .premium)
    // no assertion at all
}
```

This test executes every line of `discount`, so a coverage tool marks the function 100% covered. It also verifies literally nothing — if the discount math were wrong, this test would still pass, forever. Coverage percentage went up; test suite quality did not move at all.

This is why coverage is best used as a **signal**, not a target: a sudden drop, or a critical file sitting at 0%, is worth investigating — it usually means an entire path has zero tests watching it. But chasing a coverage number as an end in itself rewards exactly the test above: hollow tests that execute code without checking anything, written purely to make a dashboard number go up. Treat 100% coverage as neither achievable nor desirable — plenty of code (trivial getters, `@main` entry points, `fatalError()` branches) isn't worth the cost of testing, and forcing coverage there just produces more hollow tests.

## Making tests part of CI, not an afterthought

A test suite that only runs on a developer's machine, occasionally, by choice, catches bugs *sometimes* — which is close to catching them never, because the one time someone skips it is the one time it would have mattered.

```yaml
# .github/workflows/ci.yml (conceptual shape)
on: [pull_request]
jobs:
  test:
    steps:
      - run: xcodebuild test -scheme MyApp -destination "platform=iOS Simulator,name=iPhone 15"
```

Wiring the suite into **CI** — an automated pipeline that runs on every pull request — turns "tests exist" into "tests are actually enforced": nobody merges code where the suite is red, because the pipeline blocks the merge rather than relying on a human remembering to run tests locally first.

A few practical CI decisions shape whether this stays trustworthy:
- **Split slow layers from fast ones.** Run unit and integration tests on every push (they're cheap), but consider running the full UI-test layer less often — nightly, or only against `main` — if it's slow enough to bottleneck every PR. Speed protects the habit of actually watching the results.
- **Fail the build on any red test**, not just some. A CI pipeline that lets "known flaky" tests fail without blocking merge quietly trains the team to ignore red altogether — the exact failure mode from the App A example at the top.
- **Track flaky tests as a first-class problem**, not background noise. A test that fails ~5% of the time for no code reason erodes trust in every other test in the suite, because nobody can tell a real failure from noise anymore.

## Maintaining a suite over time

A test suite isn't something you write once and leave — code under test keeps changing, and tests that don't keep up become a liability instead of an asset.

```swift
// This test still passes, but it's asserting behavior nobody relies on anymore —
// the feature it covers was removed from the UI two releases ago.
func test_legacyPromoBanner_showsForNewUsers() { ... }
```

A test like this costs CI time every run and adds noise for anyone reading the suite, for zero remaining benefit. Deleting a test that no longer protects real behavior is a legitimate, healthy maintenance action — it isn't "reducing coverage," it's removing dead weight.

The opposite failure is just as real: tests so tightly coupled to implementation details that any refactor — even one that changes no observable behavior — breaks a pile of tests that then all need updating in lockstep.

```swift
// Brittle: asserts on private call counts, not observable behavior
XCTAssertEqual(mockRepository.fetchCallCount, 3)
```

```swift
// Sturdier: asserts on what the user/caller actually observes
XCTAssertEqual(viewModel.items.count, 3)
```

The second version survives a refactor of *how* the view model fetches items, as long as *what it produces* stays correct — which is usually the property you actually care about. Favoring assertions on observable outcomes over internal implementation details is what keeps a large suite refactor-friendly instead of refactor-hostile.

## Common pitfalls

- **An inverted pyramid.** Mostly slow UI/integration tests and few unit tests makes CI slow and failures hard to localize — push confidence down to the cheapest layer that can carry it.
- **Chasing a coverage percentage.** Produces hollow tests that execute code without asserting anything meaningful.
- **Letting known-flaky tests stay red without blocking merge.** Trains the team to ignore CI failures generally, including real ones.
- **Never deleting obsolete tests.** A suite that only grows accumulates dead weight that slows CI and confuses new readers.
- **Asserting on implementation details instead of observable behavior.** Makes every refactor break tests that add no real safety.

## Interview lens

If asked to describe your testing strategy, lead with the pyramid shape and *why*: many fast unit tests for pinpoint confidence, fewer integration tests for a few real components wired together, and a small set of UI tests reserved for critical end-to-end paths — because cost and blast radius of a failure both grow as you move up.

If asked about coverage, be ready to push back on the premise a little: coverage is a useful signal for finding untested files or paths, but 100% coverage isn't the goal, and a coverage number can be gamed by tests with no real assertions. What matters is whether tests verify meaningful behavior, not whether every line executed once.

If asked how you'd keep a large suite healthy long-term, mention CI enforcement (red blocks merge, no silently-ignored flaky tests), deleting tests for removed features, and preferring assertions on observable behavior over internal implementation details so refactors don't cause needless test churn.
