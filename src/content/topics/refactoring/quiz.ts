import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "refactoring-definition",
    type: "mcq",
    prompt: "What is refactoring?",
    options: [
      "Changing a program's internal structure without changing its external behavior",
      "Adding new features while cleaning up old code",
      "Rewriting a module from scratch in a new language",
      "Fixing a bug found in production",
    ],
    answer: 0,
    explanation:
      "Refactoring means the same inputs produce the same outputs — only the internal shape of the code changes. Adding features or fixing bugs is a separate kind of change and should happen in a separate commit.",
  },
  {
    id: "refactoring-smell-definition",
    type: "fill",
    prompt: "A pattern in working, non-broken code that signals an underlying design problem is called a code ___.",
    answers: ["smell"],
    hint: "It doesn't crash anything, but it 'smells' wrong when you read it.",
    explanation:
      "A code smell isn't a bug — it's a friction signal (long methods, duplication, feature envy, long parameter lists) that the design could be improved.",
  },
  {
    id: "refactoring-feature-envy",
    type: "mcq",
    prompt: "A method on `OrderSummaryView` reaches deep into `order.customer.address.city.postalCode` to do most of its work. What smell is this?",
    options: [
      "Feature envy — the method is more interested in another object's data than its own",
      "Long parameter list",
      "Duplicated code",
      "Dead code",
    ],
    answer: 0,
    explanation:
      "**Feature envy** is when a method uses another object's data more than its own — a signal the logic may belong closer to the data it's reaching for.",
  },
  {
    id: "refactoring-tests-predict",
    type: "predict",
    prompt: "You refactor `priceLabel` in three small steps, rerunning this test after each step. Step 2 turns it red. What do you know?",
    code: `func test_goldCustomer_getsTenPercentOff() {
    let order = Order(subtotal: 100, customer: .gold, itemCount: 1)
    XCTAssertEqual(priceLabel(for: order), "$90.0")
}`,
    options: [
      "Step 2 is the one that changed behavior, since step 1 was still green",
      "One of all three steps broke it, but you can't tell which",
      "The test itself is broken",
      "Nothing — refactoring can't be verified by tests",
    ],
    answer: 0,
    explanation:
      "Because you reran the test after every small step and it was still green after step 1, the regression must have been introduced in step 2. This is exactly why refactoring proceeds in small, individually-verified steps.",
  },
  {
    id: "refactoring-extract-method-fill",
    type: "fill",
    prompt: "Pulling a block of inline logic out into its own well-named function, without changing what it does, is called extract ___.",
    answers: ["method"],
    hint: "The most common refactoring move — it names a chunk of behavior.",
    explanation:
      "Extract method takes a block of code and gives it a name describing what it does, so the caller reads as a sequence of intents instead of raw implementation.",
  },
  {
    id: "refactoring-polymorphism-multi",
    type: "multi",
    prompt: "Select all statements that are true about replacing conditionals with polymorphism.",
    options: [
      "It removes the risk of forgetting to update one branch of a repeated if/else chain when a new case is added",
      "Adding a new case becomes: write one new conforming type, no existing conditional to edit",
      "It's always the right choice for any if/else statement, no matter how small",
      "It trades a single glanceable branch for logic spread across multiple types",
    ],
    answers: [0, 1, 3],
    explanation:
      "Polymorphism shines when the *same* conditional recurs across a codebase — a new case becomes a new conforming type instead of edits scattered everywhere. But it's not free: logic spreads across files, so a single two-branch `if` that will never grow doesn't need this treatment (option 2 is false).",
  },
  {
    id: "refactoring-workflow-senior",
    type: "mcq",
    prompt: "What is the safest order of operations when you want to both refactor a function and add a new feature to it?",
    options: [
      "Refactor first in its own commit with tests green throughout, then add the feature in a separate commit",
      "Do both at once to save time, since the tests will catch anything",
      "Add the feature first, then refactor around it in the same commit",
      "Skip tests since refactoring doesn't change behavior anyway",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Mixing structural change with behavioral change in one commit destroys your ability to isolate a regression's cause. Refactor with tests green, commit, then add the feature as its own separately-reviewable change.",
  },
  {
    id: "refactoring-catalog-senior",
    type: "predict",
    prompt: "🧠 A `process(type: String, amount: Double, isRefund: Bool, notify: Bool, retries: Int)` function keeps growing new boolean flags for every new use case. What's the underlying smell, and what catalog move addresses it best long-term?",
    code: `func process(type: String, amount: Double, isRefund: Bool, notify: Bool, retries: Int) { }`,
    options: [
      "Long parameter list — extract the related flags/values into a small type (e.g. a ProcessRequest struct) that groups what belongs together",
      "Feature envy — move the function into another class",
      "Duplicated code — copy the function and split it in two",
      "Nothing is wrong; more parameters just mean more flexibility",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A parameter list that keeps accumulating loosely related values is the **long parameter list** smell. The fix is usually extract type: bundle the related parameters into a struct so callers pass one cohesive value instead of five independent ones, and new fields don't ripple through every call site's signature.",
  },
  {
    id: "refactoring-flashcard",
    type: "flashcard",
    prompt:
      "Explain what refactoring is, how tests make it safe, and when you'd reach for replace-conditionals-with-polymorphism over extract method. Answer aloud, then reveal.",
    modelAnswer:
      "**Refactoring** changes a program's internal structure while preserving its external behavior — same inputs, same outputs. It's the disciplined response to a **code smell**: a pattern (long method, duplicated code, feature envy, long parameter list) that signals a design problem even though nothing is currently broken. Refactoring is only safe with a passing **test suite locking down behavior** first — you proceed in small steps, rerunning tests after each one, so a regression can be traced to the exact step that caused it (red-green-refactor run backwards). **Extract method** is the everyday move: pull a block of logic into a well-named function, changing nothing about what it does. **Replace conditionals with polymorphism** is a bigger structural move reserved for when the *same* `if/else` or `switch` on a type keeps reappearing across the codebase — each conforming type then answers for itself, so adding a new case means writing one new type instead of editing every duplicated conditional and risking a forgotten branch. It trades glanceability (one `if` you can see in one place) for scalability (logic spread across files but each case self-contained) — not worth it for a single small conditional that won't grow.",
    keyPoints: [
      "Refactoring preserves behavior; only structure changes",
      "Code smells (long method, duplication, feature envy, long parameter list) signal design problems, not bugs",
      "Tests + small steps make refactoring provably safe and let you localize a regression",
      "Extract method: name a block of logic without changing it",
      "Replace conditionals with polymorphism: use when the same conditional recurs across the codebase; trades glanceability for eliminating forgotten-branch bugs",
    ],
    explanation:
      "A senior answer connects each refactoring move to the specific pain it removes, and is honest about the trade-offs rather than presenting polymorphism as a universal upgrade.",
  },
];

export default quiz;
