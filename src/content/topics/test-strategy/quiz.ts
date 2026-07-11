import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "test-strategy-pyramid-mcq",
    type: "mcq",
    prompt: "What does the testing pyramid recommend about the relative number of each test type?",
    options: [
      "Many fast, narrow unit tests at the base; fewer integration tests in the middle; a small number of slow UI tests at the top for critical paths",
      "An equal number of unit, integration, and UI tests",
      "Mostly UI tests, since they give the most end-to-end confidence",
      "Only unit tests — integration and UI tests are redundant if unit tests pass",
    ],
    answer: 0,
    explanation:
      "Each layer up costs more to run and pinpoints failures less precisely, so most confidence should come from the cheap, precise base layer, with UI tests reserved for a small set of critical end-to-end paths.",
  },
  {
    id: "test-strategy-inverted-predict",
    type: "predict",
    prompt:
      "A team's suite is mostly UI tests with very few unit tests, and CI takes 45 minutes. A bug ships anyway because a UI test failure was dismissed as 'probably flaky.' What's the root strategic problem?",
    code: `// Suite shape: 1800 UI tests, 200 unit tests`,
    options: [
      "An inverted pyramid — slow, broad tests dominate, so failures are hard to localize and the team stops trusting red runs",
      "The team needs to delete all UI tests immediately",
      "XCTest doesn't support this many UI tests",
      "The bug is unrelated to test strategy and purely a code review failure",
    ],
    answer: 0,
    explanation:
      "An inverted pyramid produces slow, low-signal failures. When failures are frequent and hard to attribute to a specific cause, teams start ignoring red CI runs — the exact mechanism by which real regressions slip through.",
  },
  {
    id: "test-strategy-what-to-test-mcq",
    type: "mcq",
    prompt: "Which is the best candidate for a dedicated unit test?",
    options: [
      "A discount calculation with a tier check and a threshold edge case",
      "A plain struct with two stored properties and no logic",
      "A UILabel's text being set and immediately read back",
      "Generated code from a framework you don't own",
    ],
    answer: 0,
    explanation:
      "Logic that branches or encodes a business rule is exactly what silently breaks during future changes — a cheap unit test pins it down. Trivial data holders and framework internals don't need dedicated tests.",
  },
  {
    id: "test-strategy-coverage-fill",
    type: "fill",
    prompt:
      "Code coverage should be treated as a ___ that flags untested files or sudden drops, not as a target to maximize for its own sake.",
    answers: ["signal"],
    hint: "The opposite of a goal — something you use to notice a problem, not something you optimize directly.",
    explanation:
      "Coverage tells you a line executed, not that anything meaningful was verified. Treating it as a target rewards hollow tests with no real assertions; treating it as a signal makes it useful for spotting untested paths.",
  },
  {
    id: "test-strategy-hollow-test-predict",
    type: "predict",
    prompt: "What does this test do to the file's coverage percentage, and what does it actually verify?",
    code: `func test_discount_runsWithoutCrashing() {
    let calculator = DiscountCalculator()
    _ = calculator.discount(for: 100, memberTier: .premium)
}`,
    options: [
      "Coverage goes up because every line executes, but it verifies nothing — a wrong discount value would still pass",
      "Coverage stays the same because there's no assertion",
      "It fails to compile because there's no XCTAssert call",
      "Coverage goes up and it fully verifies the discount logic",
    ],
    answer: 0,
    explanation:
      "Coverage tools only track whether a line ran, not whether it was checked. This test executes `discount` fully but asserts nothing, so it's a hollow test that inflates the coverage number without adding safety.",
  },
  {
    id: "test-strategy-ci-multi",
    type: "multi",
    prompt: "Select **all** practices that keep a CI-integrated test suite trustworthy over time.",
    options: [
      "Blocking merge on any red test rather than allowing known-flaky tests to fail silently",
      "Running the full slow UI-test layer on every single push regardless of duration",
      "Treating flaky tests as a first-class problem to fix, not background noise to ignore",
      "Splitting fast unit/integration layers from slower layers so speed doesn't bottleneck every PR",
    ],
    answers: [0, 2, 3],
    explanation:
      "Blocking on red, treating flakiness seriously, and splitting fast from slow layers all keep a suite trustworthy. Forcing every slow UI test onto every push regardless of cost undermines exactly the speed that keeps a suite usable.",
  },
  {
    id: "test-strategy-maintenance-mcq",
    type: "mcq",
    prompt: "A test asserts `mockRepository.fetchCallCount == 3` instead of checking the resulting data the view model exposes. What's the risk?",
    options: [
      "It's brittle — a refactor of how data is fetched can break the test even when observable behavior is unchanged",
      "It runs slower than an assertion on observable behavior",
      "It can never be written using XCTest",
      "It provides stronger correctness guarantees than asserting on outcomes",
    ],
    answer: 0,
    explanation:
      "Asserting on an internal call count couples the test to implementation details. A test that instead checks what the caller actually observes (e.g. `viewModel.items.count`) survives implementation changes as long as behavior stays correct.",
  },
  {
    id: "test-strategy-senior-tradeoff",
    type: "predict",
    prompt:
      "Senior-level: a team is deciding whether a new 'can complete checkout' flow should get a UI test, given the pyramid's guidance to keep UI tests few. What's the right call and why?",
    code: `// Checkout is the app's single highest-value, most-trafficked user flow`,
    options: [
      "Yes — it's exactly the kind of critical, end-to-end path the pyramid reserves its small UI-test budget for, unlike a minor screen's third settings toggle",
      "No — the pyramid says UI tests should never be written",
      "Yes — every flow in the app deserves an equal number of UI tests",
      "No — checkout should only ever be tested manually since it involves payment",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The pyramid doesn't forbid UI tests — it says spend the expensive top layer deliberately. A critical, high-traffic end-to-end path like checkout is precisely where that cost is justified; a low-stakes UI detail usually isn't.",
  },
  {
    id: "test-strategy-flashcard",
    type: "flashcard",
    prompt:
      "Explain the testing pyramid, how to decide what deserves a test, why coverage is a signal not a goal, and how to keep a suite healthy long-term. Answer aloud, then reveal.",
    modelAnswer:
      "The **testing pyramid** says shape a suite with many fast, narrow unit tests at the base (cheap, pinpoint failures), fewer integration tests wiring a few real components together in the middle, and a small number of slow UI tests at the top reserved for genuinely critical end-to-end paths — because cost and blast radius of a failure both grow as you move up. An 'inverted pyramid' (mostly slow, broad tests) makes CI slow and failures hard to localize, which trains teams to ignore red runs. Deciding what to test: prioritize logic that branches, encodes a business rule, or has caused a real past bug (a regression test); skip trivial pass-through code, plain data holders, and framework internals you don't own. **Code coverage** (percent of lines executed by tests) is a **signal**, not a goal — a sudden drop or a 0%-covered critical file is worth investigating, but chasing a coverage number rewards hollow tests that execute code with no real assertions, since coverage only tracks execution, not verification; 100% coverage is neither achievable nor desirable. A trustworthy suite is wired into **CI** so red blocks every merge (not just 'most' merges), with known-flaky tests treated as a real problem to fix rather than background noise, and slow layers split from fast ones so speed doesn't bottleneck every PR. Long-term maintenance means deleting tests for removed features (that's healthy, not a coverage loss) and preferring assertions on observable outcomes (what a caller sees) over internal implementation details (like mock call counts), so refactors that don't change behavior don't needlessly break the suite.",
    keyPoints: [
      "Pyramid: many unit, fewer integration, few UI tests reserved for critical paths",
      "Test logic/business rules/past bugs; skip trivial or framework-owned code",
      "Coverage is a signal for gaps, not a target — chasing it produces hollow tests",
      "CI should block merge on any red test; flaky tests are a first-class problem",
      "Delete obsolete tests; assert on observable behavior, not implementation details",
    ],
    explanation:
      "A senior answer explicitly separates 'coverage as diagnostic signal' from 'coverage as target,' and connects suite shape to the real organizational failure mode: teams learning to ignore red CI.",
  },
];

export default quiz;
