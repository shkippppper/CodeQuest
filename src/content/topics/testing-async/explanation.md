## The problem: a test that finishes before the code does

A normal XCTest method runs top to bottom, synchronously, and the test framework considers it done the moment the method returns. That's a problem the instant the code under test uses `async`/`await` — an already-covered topic, but worth a reminder here: an `async` function can suspend and hand control back to the caller before it's actually finished.

```swift
func test_fetchUser_returnsName() {
    var name: String?
    userService.fetchUser(id: 1) { user in
        name = user.name
    }
    XCTAssertEqual(name, "Ada")   // fails — the callback hasn't run yet
}
```

The test method returns and XCTest checks the assertion before `fetchUser`'s completion handler ever fires. This is the exact problem async test support exists to solve.

## Testing async functions directly

Swift Testing's `@Test` functions and XCTest's `test`-prefixed methods can both be marked `async`, and the test runner will `await` them properly before deciding pass or fail:

```swift
func test_fetchUser_returnsName() async throws {
    let user = try await userService.fetchUser(id: 1)
    XCTAssertEqual(user.name, "Ada")
}
```

Because the test function itself is `async`, `await userService.fetchUser(id: 1)` genuinely suspends the test until the real work finishes, and the assertion only runs afterward. No callback, no race — the test's own control flow is now synchronized with the async code it's testing.

The same works with Swift Testing's `#expect`:

```swift
@Test func fetchUser_returnsName() async throws {
    let user = try await userService.fetchUser(id: 1)
    #expect(user.name == "Ada")
}
```

This covers the common case cleanly, but it only works when you can `await` the exact call under test directly. Two situations still need more: code that schedules work for *later* (a timer, a retry delay), and code that runs *concurrently* rather than sequentially.

## Controlling time instead of waiting for it

Suppose the code under test retries a failed request after a delay:

```swift
func fetchWithRetry() async throws -> User {
    do {
        return try await api.fetchUser()
    } catch {
        try await Task.sleep(for: .seconds(2))
        return try await api.fetchUser()
    }
}
```

A test that exercises the retry path really would sit there for two real seconds — correct, but slow, and multiplied across a whole suite of retry tests it adds up fast. Worse, a hardcoded delay baked into your production code is untestable without actually waiting.

The fix is to stop hardcoding *how* time passes, and inject it instead:

```swift
protocol Clock {
    func sleep(for duration: Duration) async throws
}

struct RealClock: Clock {
    func sleep(for duration: Duration) async throws {
        try await Task.sleep(for: duration)
    }
}
```

```swift
final class TestClock: Clock {
    private(set) var sleptDurations: [Duration] = []
    func sleep(for duration: Duration) async throws {
        sleptDurations.append(duration)   // records the request, doesn't actually wait
    }
}
```

The production `fetchWithRetry` now takes a `Clock` instead of calling `Task.sleep` directly, and the test passes a `TestClock` that returns instantly while still recording *that* a two-second sleep was requested:

```swift
func test_fetchWithRetry_sleepsBeforeSecondAttempt() async throws {
    let clock = TestClock()
    let sut = RetryingUserService(api: failingThenSucceedingAPI, clock: clock)

    _ = try await sut.fetchWithRetry()

    XCTAssertEqual(clock.sleptDurations, [.seconds(2)])
}
```

The test now runs in milliseconds and still verifies the *intent* — "it waits 2 seconds before retrying" — without the test suite actually waiting 2 seconds. Swift's own `Clock` protocol (with `ContinuousClock` as the real implementation) follows exactly this same shape, and `swift-testing`'s `#expect` macros work with either.

## Testing actors

An **actor**, covered in an earlier lesson, protects its mutable state by only letting one task touch it at a time — every access from outside has to go through `await`. Testing one looks almost identical to testing any other async API, because the actor boundary already forces `await` at every call site:

```swift
actor RequestCounter {
    private var count = 0
    func increment() { count += 1 }
    var current: Int { count }
}

func test_requestCounter_incrementsAcrossConcurrentCalls() async {
    let counter = RequestCounter()

    await withTaskGroup(of: Void.self) { group in
        for _ in 0..<100 {
            group.addTask { await counter.increment() }
        }
    }

    let result = await counter.current
    XCTAssertEqual(result, 100)
}
```

This is actually a meaningful concurrency test, not a formality: it fires 100 concurrent `increment()` calls at the actor and checks the final count is exactly 100. If `RequestCounter` were a plain class with an `Int` instead of an actor, this same test would be **flaky** — sometimes 100, sometimes less, depending on how the unprotected `count += 1` operations interleaved. Passing reliably here is itself evidence the actor is doing its job.

Predict: what would happen if you removed `actor` and made `RequestCounter` a plain `class`, keeping everything else the same?

Answer: the test would still *compile* — nothing forces you to protect shared mutable state — but it would become flaky, occasionally reporting a count below 100 because two tasks read the same `count` value before either had written back its increment. That's a **data race**: unsynchronized concurrent access to the same mutable state, and it's exactly what actors exist to prevent.

## Avoiding flakiness in concurrent tests

The retry-clock and actor-counter examples share one design principle worth naming directly: don't let a test's correctness depend on *how fast* something runs.

```swift
func test_debouncedSearch_firesOnce() async throws {
    let sut = SearchViewModel()
    sut.updateQuery("a")
    sut.updateQuery("ab")
    sut.updateQuery("abc")
    try await Task.sleep(for: .milliseconds(500))   // hoping debounce fired by now
    XCTAssertEqual(sut.searchCallCount, 1)
}
```

This guesses at timing the same way `sleep()` did in UI tests: on a loaded CI runner, 500ms might not be enough, and the test fails for a reason that has nothing to do with the debounce logic being wrong. The fix is the same one used above — inject a `Clock` (or a scheduler abstraction) the test controls, so "time passing" is something the test asserts on directly instead of waiting for:

```swift
func test_debouncedSearch_firesOnce() async throws {
    let clock = TestClock()
    let sut = SearchViewModel(clock: clock)
    sut.updateQuery("a")
    sut.updateQuery("ab")
    sut.updateQuery("abc")

    await clock.advance(by: .milliseconds(300))   // explicitly moves virtual time forward

    XCTAssertEqual(sut.searchCallCount, 1)
}
```

`clock.advance(by:)` on a proper test clock (Swift's `Clock` protocol supports this pattern via test doubles built for it) deterministically fast-forwards virtual time rather than waiting for real time, so the test is both instant and immune to CI load.

The other big flakiness source is unstructured concurrency: firing a `Task { ... }` and not `await`-ing it anywhere. If a test finishes before that detached task runs, its side effects — and any assertion failures inside it — may never be observed at all, silently. Prefer structured concurrency (`async let`, `withTaskGroup`) in both production and test code specifically because it forces you to `await` every child task before moving on, which is what makes the test's completion mean "the work actually finished."

## Determinism as the real goal

Every technique above — `async` test functions, injected clocks, actor isolation, structured concurrency — is really in service of one property: **determinism**, meaning the test produces the same result every time it runs, regardless of machine speed or scheduling luck.

A non-deterministic concurrent test is worse than useless: it fails randomly enough to train the team to ignore red CI ("oh, that one's just flaky, rerun it"), which is exactly the moment a *real* regression starts sneaking through unnoticed. A test suite's value is proportional to how much you trust a single red run — and concurrency is the single easiest place to accidentally destroy that trust.

## Common pitfalls

- **Testing async code with a synchronous test method and a completion-handler callback.** Mark the test `async` and `await` the call directly instead.
- **Using `Task.sleep` in tests to wait out a delay.** Inject a controllable clock/scheduler instead, so the wait is virtual, not real.
- **Firing a detached `Task { }` in code under test and not awaiting it anywhere.** Its assertions and side effects may finish after the test has already reported success.
- **Assuming a passing concurrent test once means it always passes.** Race conditions can hide for many runs before timing exposes them — run concurrency tests repeatedly (Xcode's "Run Repeatedly" or `-repeat-count` in CI) when suspicious.

## Interview lens

If asked how you test an `async` function, the answer is simple but precise: mark the test itself `async` and `await` the call directly — that keeps the test's control flow synchronized with the code's real completion, no callbacks or polling needed.

If asked how you'd test time-dependent behavior like retries or debouncing without making the suite slow, the strong answer is dependency injection: abstract time behind a `Clock` protocol, inject a real implementation in production and a controllable test double in tests, and assert on *what the code requested* (a 2-second sleep, a debounce fire) rather than actually waiting for it.

If asked how you'd test an actor for thread safety, describe firing many concurrent tasks at it (`withTaskGroup`) and asserting the final state is exactly what it should be — and be ready to explain *why* that test would flake if the type weren't actually an actor: unsynchronized reads and writes racing each other is a data race, and a passing count under concurrent load is real evidence the actor's isolation is working, not a formality.
