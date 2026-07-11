import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "xctest-aaa",
    type: "mcq",
    prompt: "What does the AAA pattern in a unit test stand for?",
    options: [
      "Arrange, Act, Assert",
      "Assert, Act, Arrange",
      "Allocate, Assign, Assert",
      "Arrange, Assert, Assign",
    ],
    answer: 0,
    explanation:
      "AAA is Arrange (set up the objects and inputs), Act (call the one thing under test), Assert (check the outcome). Keeping the three steps visually separate makes a failing test easy to read.",
  },
  {
    id: "xctest-discovery",
    type: "mcq",
    prompt: "How does XCTest know which methods in an XCTestCase subclass are tests to run?",
    options: [
      "The method name must start with 'test' and take no parameters",
      "Every method in the class is run automatically",
      "You must list them in an @Suite annotation",
      "The method must return a Bool",
    ],
    answer: 0,
    explanation:
      "The XCTest runner discovers test methods by naming convention: a no-argument instance method whose name starts with 'test' on an XCTestCase subclass.",
  },
  {
    id: "xctest-assert-error-predict",
    type: "predict",
    prompt: "Does this test pass?",
    code: "enum PricingError: Error { case invalidDiscount }\n\nfunc finalPrice(discountPercent: Double) throws -> Double {\n    guard (0...100).contains(discountPercent) else {\n        throw PricingError.invalidDiscount\n    }\n    return 100 - discountPercent\n}\n\nfunc test_rejectsBadDiscount() {\n    XCTAssertThrowsError(try finalPrice(discountPercent: 150)) { error in\n        XCTAssertEqual(error as? PricingError, .invalidDiscount)\n    }\n}",
    options: [
      "Yes — the call throws invalidDiscount, and the closure confirms it's that specific case",
      "No — XCTAssertThrowsError requires a do/catch block instead",
      "No — the closure argument is invalid syntax",
      "It crashes instead of failing",
    ],
    answer: 0,
    explanation:
      "XCTAssertThrowsError passes when the expression throws, and passes the thrown error into the trailing closure so you can assert on its exact case rather than just 'something was thrown'.",
  },
  {
    id: "xctest-setup-fill",
    type: "fill",
    prompt: "The XCTestCase override that runs before every single test method to prepare shared state is called ___WithError().",
    answers: ["setUp", "setup"],
    hint: "Runs before each test; there's a matching tearDown counterpart.",
    explanation:
      "setUpWithError() runs fresh before each test method, and its counterpart tearDownWithError() runs after each test, regardless of pass or fail.",
  },
  {
    id: "xctest-teardown-predict",
    type: "predict",
    prompt: "A test method fails an XCTAssertEqual partway through its body. Does tearDownWithError() still run afterward?",
    code: "override func tearDownWithError() throws {\n    print(\"cleanup\")\n}\n\nfunc test_something() {\n    XCTAssertEqual(1, 2) // fails here\n    print(\"never reached\")\n}",
    options: [
      "Yes — tearDown always runs after the test body finishes, pass or fail",
      "No — a failed assertion skips tearDown entirely",
      "Only if the test throws an uncaught error, not on assertion failure",
      "Only if you call it manually inside the test",
    ],
    answer: 0,
    explanation:
      "tearDownWithError() runs unconditionally after each test finishes, the same way a defer block always runs, so it's the right place to release resources no matter what the test discovers.",
  },
  {
    id: "xctest-what-to-test-multi",
    type: "multi",
    prompt: "Select all that are generally worth writing dedicated unit tests for.",
    options: [
      "Edge cases like zero, negative numbers, or empty collections",
      "Every private helper method's internal call count",
      "Error paths where the code should throw under specific conditions",
      "Boundary conditions like a value exactly at a limit",
    ],
    answers: [0, 2, 3],
    explanation:
      "Good unit tests target observable behavior: edge cases, error paths, and boundary conditions. Asserting on private implementation details like an internal call count couples the suite to code that's free to change and makes tests fail on harmless refactors.",
  },
  {
    id: "xctest-async-await-fill",
    type: "fill",
    prompt: "For a function that uses Swift's async/await instead of a completion handler, you test it by marking the test method itself ___ and using await directly, without needing XCTestExpectation.",
    answers: ["async"],
    hint: "The same keyword you'd put on the function under test.",
    explanation:
      "XCTest recognizes an async test method and suspends it properly, resuming assertions once the awaited work finishes — no XCTestExpectation required for pure async/await code.",
  },
  {
    id: "xctest-expectation-senior",
    type: "mcq",
    prompt: "A test using XCTestExpectation hangs until it times out and then fails, even though the async work under test actually completes correctly. What's the most likely cause?",
    options: [
      "The completion handler never calls expectation.fulfill() on the success path",
      "wait(for:timeout:) was called before creating the expectation",
      "XCTAssertEqual was used instead of XCTAssertTrue",
      "The test method is marked async",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "wait(for:timeout:) blocks until every expectation is fulfilled or the timeout elapses. If fulfill() is missing on some code path — commonly an early-return or error branch that skips it — the test hangs to the timeout and fails even though the work itself is fine.",
  },
  {
    id: "xctest-flashcard",
    type: "flashcard",
    prompt:
      "Explain how XCTest structures a test (AAA), how setUp/tearDown provide isolation, and how it handles asynchronous code. Answer aloud, then reveal.",
    modelAnswer:
      "A test method lives in an XCTestCase subclass and follows **Arrange, Act, Assert**: build the inputs, call the one thing under test, then assert on the outcome with functions like XCTAssertEqual, XCTAssertTrue, XCTAssertNil, and XCTAssertThrowsError (which hands you the thrown error to check its exact case). XCTest creates a fresh instance of the test class for every test method and calls setUpWithError() before each one and tearDownWithError() after each one — pass or fail — so shared state never leaks between tests; there's also a once-per-class variant for expensive read-only setup. For asynchronous work, completion-handler and delegate-based APIs are tested with an XCTestExpectation: create it, fulfill() it inside the callback, and call wait(for:timeout:) to pause the test until it's fulfilled or the timeout elapses. Code written with async/await needs none of that — mark the test method async and await the call directly, and XCTest suspends and resumes it properly. Good tests assert on observable behavior (what a type returns or does) rather than implementation details (which private method ran), since implementation tests break on harmless refactors.",
    keyPoints: [
      "AAA: Arrange, Act, Assert as three visually distinct steps",
      "XCTAssertEqual/True/Nil/ThrowsError and friends check different kinds of outcomes",
      "setUp/tearDown run per test (fresh instance each time) for isolation; a class-level variant runs once",
      "XCTestExpectation + fulfill() + wait(for:timeout:) for completion handlers; async test methods for async/await",
      "Test behavior, not implementation, so refactors don't break unrelated tests",
    ],
    explanation:
      "A senior-level answer covers all three pillars — AAA structure, isolation via setUp/tearDown, and both async testing mechanisms — and explicitly distinguishes behavior from implementation as what deserves coverage.",
  },
];

export default quiz;
