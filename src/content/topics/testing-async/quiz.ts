import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "testing-async-why-fails",
    type: "predict",
    prompt: "What happens when this test runs?",
    code: `func test_fetchUser_returnsName() {
    var name: String?
    userService.fetchUser(id: 1) { user in
        name = user.name
    }
    XCTAssertEqual(name, "Ada")
}`,
    options: [
      "It fails — the synchronous test method returns and asserts before the completion handler has run",
      "It passes reliably every time, because XCTest's run loop keeps the process alive until all pending callbacks complete",
      "It throws a compile error because a function returning void cannot accept a trailing completion-handler closure that takes a User argument",
      "It hangs indefinitely waiting for the callback because the run loop spins without ever scheduling the completion handler",
    ],
    answer: 0,
    explanation:
      "XCTest considers a synchronous test method done the moment it returns. The assertion runs immediately, before the completion handler has had any chance to fire, so `name` is still `nil`.",
  },
  {
    id: "testing-async-fix-mcq",
    type: "mcq",
    prompt: "What's the correct fix for a test that needs to wait on an `async` function under test?",
    options: [
      "Mark the test function itself `async` and `await` the call directly",
      "Call the function on a background queue and sleep for a fixed duration",
      "Wrap the call in `DispatchQueue.main.async` inside the test",
      "Convert the async function to a synchronous one just for testing",
    ],
    answer: 0,
    explanation:
      "Marking the test `async` and awaiting the call directly synchronizes the test's control flow with the real completion of the async work — no callback, no polling, no race.",
  },
  {
    id: "testing-async-clock-fill",
    type: "fill",
    prompt:
      "To test retry/debounce logic without the suite actually waiting real seconds, you abstract time behind an injectable ___ protocol and pass a test double that records requested delays instead of sleeping.",
    answers: ["clock", "Clock"],
    hint: "Swift's real implementation for this is ContinuousClock.",
    explanation:
      "Injecting a `Clock` abstraction lets production code use a real clock while tests use a fake one that returns instantly but records what was asked of it — the test stays fast and deterministic.",
  },
  {
    id: "testing-async-actor-predict",
    type: "predict",
    prompt:
      "This test fires 100 concurrent increments at RequestCounter. If `RequestCounter` were changed from an `actor` to a plain `class` with the same code otherwise, what would likely happen to this test?",
    code: `actor RequestCounter {
    private var count = 0
    func increment() { count += 1 }
    var current: Int { count }
}
// test fires 100 concurrent await counter.increment() calls,
// then asserts counter.current == 100`,
    options: [
      "It would become flaky, occasionally reporting a count below 100 due to a data race on unsynchronized state",
      "It would fail to compile, because the compiler requires actor isolation to be declared on any type receiving concurrent await calls",
      "It would still always pass, since Swift's ARC automatically serializes access to class-stored properties when they are mutated concurrently",
      "It would deadlock every single run because multiple tasks awaiting the same class method acquire an implicit lock that never releases",
    ],
    answer: 0,
    explanation:
      "A plain class doesn't serialize access to `count`. Two tasks can read the same value before either writes back its increment, losing updates — a data race that shows up as an intermittently wrong, flaky count.",
  },
  {
    id: "testing-async-flake-sources-multi",
    type: "multi",
    prompt: "Select **all** practices that make async/concurrent tests flaky.",
    options: [
      "Using `Task.sleep` with a fixed real duration to wait out a debounce or retry delay",
      "Firing a detached `Task { }` in code under test without awaiting it anywhere",
      "Marking the test function `async` and awaiting the call under test directly",
      "Testing mutable shared state through a plain class instead of an actor under concurrent access",
    ],
    answers: [0, 1, 3],
    explanation:
      "Fixed real sleeps, un-awaited detached tasks, and unsynchronized shared mutable state are all classic sources of flakiness. Awaiting the async call directly is the fix, not a flake source.",
  },
  {
    id: "testing-async-determinism-mcq",
    type: "mcq",
    prompt: "In the context of testing async code, what does 'determinism' mean?",
    options: [
      "The test produces the same result every run, regardless of machine speed or scheduling",
      "The test always finishes in under one second, since only fast tests with sub-second run times qualify as deterministic",
      "The code under test is written without any async or concurrent constructs, so timing can never affect its output",
      "The test exclusively uses synchronous XCTest APIs and avoids all async/await keywords in both the test body and the code under test",
    ],
    answer: 0,
    explanation:
      "Determinism means outcome doesn't depend on timing or scheduling luck. Injected clocks, structured concurrency, and actor isolation are all techniques in service of this one property.",
  },
  {
    id: "testing-async-senior-detached-task",
    type: "predict",
    prompt:
      "Senior-level: this test passes in CI, but a bug it should catch sometimes slips through undetected. What's the likely cause?",
    code: `func test_uploadPhoto_marksComplete() async {
    sut.uploadPhoto()   // internally does: Task { await self.doUpload() }
    XCTAssertTrue(sut.isComplete)
}`,
    options: [
      "`uploadPhoto()` fires an un-awaited detached Task; the test can finish and assert before that task — and any assertion failure inside it — has run",
      "XCTAssertTrue cannot be used inside an async test function and always produces a warning that is silently treated as a pass instead of a failure",
      "sut.isComplete is a computed property, and XCTAssertTrue is not permitted to assert on computed properties — only stored properties are valid targets",
      "Task { } always runs synchronously on the calling thread before returning, so isComplete is guaranteed to be set before XCTAssertTrue executes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Unstructured concurrency (a bare `Task { }` nobody awaits) can outlive the test. The test moves on and asserts `isComplete` before the upload task has necessarily finished, so the check is racing the very work it's supposed to verify — structured concurrency (`async let`, `withTaskGroup`) would force the await instead.",
  },
  {
    id: "testing-async-flashcard",
    type: "flashcard",
    prompt:
      "Explain how to test async functions, time-dependent code, and actors deterministically, and name the two biggest sources of concurrent-test flakiness. Answer aloud, then reveal.",
    modelAnswer:
      "For plain `async` functions, mark the test method itself `async` and `await` the call directly — this synchronizes the test's completion with the real completion of the work, unlike a synchronous test racing a completion-handler callback. For time-dependent code (retries, debouncing), don't hardcode `Task.sleep` in production code; inject a **`Clock`** abstraction so tests can pass a test double that returns instantly while recording what delay was requested, keeping the test both fast and deterministic. For **actors**, testing looks like any other async API since the actor forces `await` at every boundary — firing many concurrent tasks at an actor and asserting the final state is correct is a real concurrency test: if the type were a plain class instead, unsynchronized concurrent access would cause a **data race**, making the same test **flaky** (an intermittently wrong final count). The two biggest flake sources beyond that are: real, fixed-duration sleeps used to 'wait out' async work instead of controlled/injected time, and unstructured concurrency — a bare `Task { }` fired and never awaited, whose side effects (and assertion failures) can finish after the test has already reported success. Preferring structured concurrency (`async let`, `withTaskGroup`) in both production and test code avoids that because it forces every child task to be awaited before moving on. All of this is in service of **determinism**: the test produces the same result regardless of machine speed, which is what makes a red CI run trustworthy instead of something the team learns to just rerun.",
    keyPoints: [
      "async test functions + await the call directly, not sync test + callback",
      "Inject a Clock/scheduler abstraction to avoid real sleeps in tests",
      "Testing actors under concurrent load is a real correctness check, not a formality",
      "Data race on a non-actor type shows up as flakiness under the same test",
      "Un-awaited detached Tasks and fixed sleeps are the two biggest flake sources",
      "The end goal is determinism — same result regardless of timing/scheduling",
    ],
    explanation:
      "A senior answer explicitly ties actor testing to what would break without the actor (data race), and names unstructured concurrency as a flake source distinct from just 'bad waits'.",
  },
];

export default quiz;
