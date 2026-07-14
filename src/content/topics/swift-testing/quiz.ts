import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "st-what-is-test",
    type: "mcq",
    prompt: "What marks a function as a test in Swift Testing?",
    options: [
      "The @Test attribute — no class, no 'test' prefix required",
      "Subclassing XCTestCase and placing the function anywhere inside that class's body",
      "A function name starting with 'test', which the runner discovers at launch via Objective-C reflection",
      "Conforming to the Testable protocol and implementing its required run() method for the framework to invoke",
    ],
    answer: 0,
    explanation:
      "Swift Testing marks any function with the **@Test** attribute — a free function, a struct method, anywhere. There's no subclassing and no naming convention required.",
  },
  {
    id: "st-expect-vs-require-predict",
    type: "predict",
    prompt: "What happens when the #require line fails here?",
    code: `@Test func userLookup() throws {
    let user = try #require(fetchUser(id: 99))
    #expect(user.email.contains("@"))
    print("done")
}`,
    options: [
      "The test stops immediately at #require — the #expect and print never run",
      "The test records a failure and continues to the #expect line, which also runs and may record a second independent failure",
      "It compiles but crashes at runtime with no failure recorded, because #require produces a precondition rather than a test assertion",
      "#require is ignored unless wrapped in #expect, since the outer macro is what actually communicates with the test runner",
    ],
    answer: 0,
    explanation:
      "#require throws when its condition is false or its optional is nil, so the test function exits right there. Unlike #expect, execution does not continue past a failed #require.",
  },
  {
    id: "st-trait-fill",
    type: "fill",
    prompt: "The ___ attached to @Test(.tags(...), .timeLimit(...)) are modifiers that change how a test is run or reported without touching its body.",
    answers: ["traits", "trait"],
    hint: "Same word used for .tags, .disabled, and .timeLimit.",
    explanation:
      "A trait is a modifier passed inside @Test(...) — .tags for filtering, .disabled for skipping with a reason, and .timeLimit for failing on a timeout.",
  },
  {
    id: "st-migration-multi",
    type: "multi",
    prompt: "Select all correct XCTest-to-Swift-Testing mappings.",
    options: [
      "XCTAssertEqual(a, b) maps to #expect(a == b)",
      "setUp()/tearDown() map to init()/deinit",
      "XCTUnwrap(x) maps to try #require(x)",
      "XCTestCase subclassing is still required for every suite",
    ],
    answers: [0, 1, 2],
    explanation:
      "#expect(a == b) replaces XCTAssertEqual, init/deinit replace setUp/tearDown, and try #require(x) replaces XCTUnwrap. Swift Testing suites are plain structs (optionally marked @Suite) — no XCTestCase subclass needed.",
  },
  {
    id: "st-parameterized-predict",
    type: "predict",
    prompt: "How many times does this test run?",
    code: `@Test(arguments: [10, 20], ["USD", "EUR", "GBP"])
func appliesDiscount(percent: Int, currency: String) {
    // ...
}`,
    options: ["6, one for every (percent, currency) combination", "2, once per element in the first array only", "3, once per currency in the second array only", "1, since @Test runs the body once regardless of argument count"],
    answer: 0,
    explanation:
      "Passing two argument collections to @Test(arguments:) runs the test once per combination — the cartesian product. 2 percents x 3 currencies = 6 runs, each reported independently.",
  },
  {
    id: "st-suite-isolation-mcq",
    type: "mcq",
    prompt: "In a struct-based @Suite, why doesn't shared mutable state persist between two @Test functions?",
    options: [
      "Swift Testing creates a fresh struct instance, running init() again, for every single @Test",
      "Swift Testing resets all global variables after each test by scanning the module for stored properties and zeroing them out",
      "Each @Test runs in its own process, so memory is wiped between tests just as it would be after an app relaunch",
      "It does persist by default; you must opt into isolation with a trait like .serialized or a custom isolation modifier",
    ],
    answer: 0,
    explanation:
      "A struct suite gets a brand-new instance per @Test, so init() runs fresh each time. That's why init/deinit give the same isolation setUp/tearDown gave in XCTest, without a separate lifecycle API.",
  },
  {
    id: "st-async-mcq",
    type: "mcq",
    prompt: "How does Swift Testing support async test functions compared to XCTest?",
    options: [
      "async is just part of the function signature; #expect and #require work directly on async/throwing expressions",
      "Async tests require a completion-handler-based expectation object, just like XCTestExpectation, that you fulfill inside a Task closure",
      "Swift Testing cannot run async tests at all and falls back to XCTest infrastructure when it detects an async function signature",
      "Async tests must be wrapped in a synchronous bridge function first, which calls Task and waits with a semaphore for completion",
    ],
    answer: 0,
    explanation:
      "Swift Testing treats async test functions like any other async Swift function. #expect(throws:) and #require can await inside their checks directly, with none of XCTest's expectation-object ceremony.",
  },
  {
    id: "st-parallel-senior-mcq",
    type: "mcq",
    prompt: "A suite of tests that passed reliably under XCTest starts failing intermittently after being migrated to Swift Testing, with no code changes to the logic under test. What's the most likely cause?",
    options: [
      "Swift Testing runs tests in parallel by default, exposing shared mutable state or ordering assumptions that XCTest's mostly-serial execution hid",
      "Swift Testing macros are intentionally non-deterministic and deliberately evaluate assertion conditions in a randomized order each run to stress-test the logic under test",
      "#expect silently discards failure records when the expression contains optional chaining, producing no output in the test report for those cases",
      "Struct-based @Suite types cannot run more than one @Test function per session without adding an explicit .parallel trait to the suite declaration",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Swift Testing's default is concurrent execution across tests. Tests that quietly depended on running serially, or that touched shared global state, can now interleave and fail intermittently. The fix is removing the shared state or marking the suite serialized.",
  },
  {
    id: "st-flashcard",
    type: "flashcard",
    prompt:
      "Explain how Swift Testing differs from XCTest: the core macros, suites, and execution model. Answer aloud, then reveal.",
    modelAnswer:
      "**Swift Testing** replaces XCTestCase subclassing with plain functions marked **@Test** — no 'test' prefix, no class required. Checks use the **#expect** macro instead of the XCTAssert* family: it reads your actual boolean expression (or throwing/async expression) and reports both sides on failure, recording the failure but letting the test keep running. **#require** is the throwing counterpart — it stops the test immediately, replacing XCTUnwrap and any assertion where continuing would be meaningless. **Traits** attach behavior in parentheses after @Test: .tags for filtering, .disabled(\"reason\") for skipping with an explanation still visible in results, .timeLimit for failing on a timeout. @Test(arguments:) runs one test body across a whole collection of inputs (or the cartesian product of multiple collections), reporting each run separately instead of stopping at the first failure in a hand-rolled loop. Suites are plain structs, optionally marked **@Suite** for a display name; because it's a struct, Swift Testing creates a fresh instance and reruns init() for every single @Test, which is why init()/deinit replace setUp()/tearDown() without needing a separate lifecycle API. Tests run **concurrently** by default, unlike XCTest's mostly-serial default, so shared mutable state between tests becomes a real hazard after migrating.",
    keyPoints: [
      "@Test replaces XCTestCase subclassing; #expect replaces XCTAssert*",
      "#require throws and stops the test; #expect records and continues",
      "Traits (.tags, .disabled, .timeLimit) attach metadata/behavior to @Test",
      "@Test(arguments:) runs one body across inputs, including combinations across multiple arrays",
      "Struct @Suite gives fresh init() per test — replaces setUp/tearDown",
      "Tests run in parallel by default, unlike XCTest's serial default",
    ],
    explanation:
      "A senior answer connects struct semantics to test isolation (why init/deinit works) and flags parallel-by-default execution as the migration gotcha most teams hit first.",
  },
];

export default quiz;
