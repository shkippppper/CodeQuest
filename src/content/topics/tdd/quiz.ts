import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "tdd-cycle-mcq",
    type: "mcq",
    prompt: "What are the three steps of the TDD cycle, in order?",
    options: [
      "Red (write a failing test), green (write the minimal code to pass), refactor (clean up with tests still passing)",
      "Design, implement, test",
      "Green, red, refactor",
      "Write all tests, then write all implementation code",
    ],
    answer: 0,
    explanation:
      "Red-green-refactor: write a test that fails first, write the smallest code that makes it pass, then clean up the code while the passing test protects you from regressions.",
  },
  {
    id: "tdd-green-meaning",
    type: "mcq",
    prompt: "What does \"green\" mean in the red-green-refactor cycle?",
    options: [
      "The smallest amount of code that makes the current failing test pass — nothing extra",
      "The final, fully-featured implementation",
      "All tests in the suite are passing",
      "The code has been refactored and optimized",
    ],
    answer: 0,
    explanation:
      "Green means just enough code to satisfy the one test you're working on right now. Writing extra behavior the test didn't ask for defeats the point of letting the test drive the design.",
  },
  {
    id: "tdd-red-predict",
    type: "predict",
    prompt: "You write this test before ShoppingCart exists. What happens when you run it?",
    code: `func test_totalWithNoDiscount() {\n    let cart = ShoppingCart()\n    cart.add(price: 10.0)\n    cart.add(price: 25.0)\n    XCTAssertEqual(cart.total(), 35.0)\n}`,
    options: [
      "It fails to compile / build, since ShoppingCart doesn't exist yet — this is the red step",
      "It passes automatically because XCTest infers the type",
      "It runs but is skipped",
      "It throws a runtime exception only, compiling fine",
    ],
    answer: 0,
    explanation:
      "With no ShoppingCart type defined, the test target won't even build. That build failure is still \"red\" — the test is failing for the expected reason, which you confirm before writing any implementation.",
  },
  {
    id: "tdd-seam-fill",
    type: "fill",
    prompt: "Needing to construct a fake collaborator to write a test exposes a ___ — the point where one piece of code can be swapped out from another.",
    answers: ["seam"],
    hint: "One word, used earlier in the lesson's \"designing through tests\" section.",
    explanation:
      "A seam is the boundary where a real dependency can be substituted with a test double. Writing the test first tends to put seams exactly where the design needs them, because the test author must decide the boundary before the implementation exists.",
  },
  {
    id: "tdd-good-fit-multi",
    type: "multi",
    prompt: "Select all scenarios where TDD tends to pay off.",
    options: [
      "Business logic with clearly known rules, like discount or pricing math",
      "Reproducing and fixing a reported bug",
      "A quick UI layout spike where you're still exploring the visual design",
      "A public API another team will call",
    ],
    answers: [0, 1, 3],
    explanation:
      "TDD earns its keep where the desired behavior is knowable up front: clear business rules, a bug you can reproduce, or an API whose calling code you write as the test. An exploratory spike has no known shape yet, so tests written first just get rewritten as the design churns.",
  },
  {
    id: "tdd-design-through-tests-senior",
    type: "mcq",
    prompt: "How does writing the test first influence the design of the code under test?",
    options: [
      "It forces you to decide the shape of the API — parameters, return values, collaborators — before deciding how it works internally",
      "It has no effect on design; design and testing are unrelated concerns",
      "It only affects naming conventions",
      "It guarantees the code will need fewer classes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Because the test is the first piece of calling code, it forces early decisions about the API's shape — including any collaborators, like the DiscountReporter protocol the lesson's spy test forced into existence — well before the implementation details are settled.",
  },
  {
    id: "tdd-outside-in-vs-inside-out-senior",
    type: "mcq",
    prompt: "What distinguishes outside-in (London school) TDD from inside-out (Detroit school) TDD?",
    options: [
      "Outside-in starts from an acceptance test at the user-facing boundary and stubs collaborators with doubles as it discovers them; inside-out starts from small low-level units and composes them upward using mostly real objects",
      "Outside-in never uses test doubles at all",
      "Inside-out always starts with UI tests",
      "They are two names for the exact same practice",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "London-school/outside-in TDD drives design from an outer acceptance test downward, stubbing out collaborators as the outer test demands them. Detroit-school/inside-out TDD builds and tests small units first, then composes them upward with real objects rather than doubles.",
  },
  {
    id: "tdd-overengineering-senior",
    type: "predict",
    prompt: "A team practicing strict TDD ends up with a protocol abstraction that only ever has one real implementation, adding indirection nobody needed. What's the most likely cause?",
    code: `// one production implementation, one protocol, no second conformer in sight`,
    options: [
      "The test author guessed at flexibility that wasn't needed yet, rather than writing the minimal code to go green and refactoring toward simplicity",
      "TDD always produces exactly this outcome and can't be avoided",
      "The test was written after the implementation",
      "XCTest requires all types to be protocols",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "This is TDD's most common critique in practice: without discipline about writing only the minimal code each cycle and refactoring toward simplicity, it's easy to over-abstract in anticipation of flexibility the tests never actually demanded.",
  },
  {
    id: "tdd-flashcard",
    type: "flashcard",
    prompt:
      "Explain the red-green-refactor cycle, how test-first changes design, and the difference between outside-in and inside-out TDD. Answer aloud, then reveal.",
    modelAnswer:
      "**Test-driven development** follows a three-step loop: **red** — write a test for behavior that doesn't exist yet, and confirm it fails (or fails to compile) for the expected reason; **green** — write the smallest possible code to make that one test pass, resisting the urge to add anything the test didn't ask for; **refactor** — with the test passing, clean up duplication or awkward structure, relying on the test suite to catch any regression. Writing the test first shapes the design because the test is the first piece of calling code against the API — it forces decisions about parameters, return values, and collaborators before the internals are written, and often exposes a **seam** (a swappable boundary) that a test double can stand in for. TDD pays off for business logic with known rules, bug reproduction, and public APIs, but is overhead for exploratory spikes, thin glue code, or fast-churning requirements — and undisciplined TDD can over-abstract toward flexibility nobody asked for. **Outside-in** (London school) TDD starts from an acceptance test at the user-facing boundary and stubs out collaborators with test doubles as the outer test demands them. **Inside-out** (Detroit/classic school) TDD starts from small low-level units, tests them directly, and composes them upward using real objects rather than doubles.",
    keyPoints: [
      "Red: failing test for the reason you expect, before any implementation",
      "Green: minimal code to pass, nothing extra",
      "Refactor: clean up while the passing test protects against regressions",
      "Test-first exposes API shape and seams (swappable collaborator boundaries) before internals exist",
      "Pays off: clear business rules, bug fixes, public APIs; overhead: spikes, thin glue, churning requirements",
      "Outside-in/London: acceptance test down, doubles for collaborators; inside-out/Detroit: units up, real objects",
    ],
    explanation:
      "A senior answer names all three cycle steps precisely, explains *why* test-first changes design (seams and API shape, not just \"tests exist\"), and can contrast outside-in against inside-out by name and by where each starts.",
  },
];

export default quiz;
