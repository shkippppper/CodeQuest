import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "rb-what",
    type: "mcq",
    prompt: "What does a `@resultBuilder` do?",
    options: [
      "Defines static methods the compiler uses to fold the statements of a marked closure into a single value",
      "Runs code on a background thread",
      "Generates equality automatically",
      "Caches expensive computations",
    ],
    answer: 0,
    explanation:
      "A result builder's static methods (`buildBlock`, etc.) are called by the compiler, which rewrites a builder closure's statements into a single combined result value.",
  },
  {
    id: "rb-buildblock",
    type: "mcq",
    prompt: "Which method is required for a result builder?",
    options: ["`buildBlock`", "`buildOptional`", "`buildFinalResult`", "`buildArray`"],
    answer: 0,
    explanation:
      "`buildBlock` (combine sibling statements) is required. The others (`buildOptional`, `buildEither`, `buildArray`, …) are optional and enable specific syntax like `if`, `if/else`, and `for`.",
  },
  {
    id: "rb-greeting-predict",
    type: "predict",
    prompt: "What does `greeting()` return?",
    code: `@resultBuilder enum SB {
    static func buildBlock(_ parts: String...) -> String { parts.joined(separator: " ") }
}
@SB func greeting() -> String {
    "Hello"
    "world"
}`,
    options: ["Hello world", "Helloworld", "Hello\\nworld", "Compile error"],
    answer: 0,
    explanation:
      "The two string statements aren't separate returns — the compiler passes them to `buildBlock`, which joins with a space, so `greeting()` is `\"Hello world\"`.",
  },
  {
    id: "rb-if-fill",
    type: "fill",
    prompt: "An `if` WITHOUT an `else` inside a builder closure is handled by the `build___(_:)` method.",
    answers: ["Optional", "buildOptional"],
    hint: "The value might be nil.",
    explanation:
      "`buildOptional(_:)` handles an `if` with no `else` (the result may be nil). `if/else` and `switch` use `buildEither(first:)`/`buildEither(second:)`.",
  },
  {
    id: "rb-viewbuilder",
    type: "mcq",
    prompt: "What is SwiftUI's `@ViewBuilder`?",
    options: [
      "A result builder that combines child views (into TupleView, _ConditionalContent, etc.)",
      "A protocol all views conform to",
      "A property wrapper",
      "A UIKit bridge",
    ],
    answer: 0,
    explanation:
      "`@ViewBuilder` is a result builder: `buildBlock` makes a `TupleView`, `buildEither`/`buildOptional` make `_ConditionalContent`/optional views. That's why `VStack { }` accepts comma-free statements and limited `if`/`switch`.",
  },
  {
    id: "rb-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about result builders.",
    options: [
      "The compiler rewrites the builder closure's body into calls to the builder's methods",
      "`buildArray` enables writing a `for` loop in the builder",
      "`if/else` branches map to `buildEither(first:)`/`buildEither(second:)`",
      "A result builder can be used to write a `guard` inside the closure",
    ],
    answers: [0, 1, 2],
    explanation:
      "Body rewriting, `buildArray` for loops, and `buildEither` for `if/else` are correct. `guard` (and arbitrary early returns) are **not** part of the result-builder transform (option 3 is false).",
  },
  {
    id: "rb-missing-method-senior",
    type: "predict",
    prompt: "🧠 Trick question — a custom builder implements only `buildBlock`. Why won't a `for` loop compile in its closure?",
    code: `@resultBuilder enum B { static func buildBlock(_ xs: Int...) -> Int { xs.reduce(0,+) } }
@B func f() -> Int {
    for i in 1...3 { i }   // for loop, but no buildArray
}`,
    options: [
      "A `for` loop requires `buildArray(_:)`; without it the syntax is disallowed",
      "for loops are never allowed in builders",
      "It compiles and returns 6",
      "You must use while instead",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Each control-flow form maps to a builder method: `for` needs `buildArray(_:)`. If the builder doesn't implement it, that syntax isn't available — which is why some DSLs support loops and others don't.",
  },
  {
    id: "rb-conditionalcontent-senior",
    type: "mcq",
    prompt: "In @ViewBuilder, why can the two branches of an `if/else` be different view types?",
    options: [
      "`buildEither` wraps each branch in `_ConditionalContent`, so both branches unify to one type",
      "SwiftUI erases them to AnyView automatically",
      "Views are all the same type",
      "It doesn't — they must match exactly",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`buildEither(first:)`/`buildEither(second:)` produce a `_ConditionalContent<TrueContent, FalseContent>`, a single type that can hold either branch. That's how `if Text() else Image()` type-checks in a `@ViewBuilder` without `AnyView`.",
  },
  {
    id: "rb-buildexpression-senior",
    type: "mcq",
    prompt: "What does implementing `buildExpression(_:)` let a builder do?",
    options: [
      "Transform each individual expression before combining — e.g. accept several input types and normalize them",
      "Skip buildBlock",
      "Run expressions in parallel",
      "Disable type checking",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`buildExpression(_:)` is called on each expression first, so you can accept multiple input types (overload it) and convert them into the builder's common `Component` type before `buildBlock` folds them. It's how DSLs accept flexible element inputs.",
  },
  {
    id: "result-builders-flashcard",
    type: "flashcard",
    prompt:
      "Explain result builders: what they do, the key methods, and how ViewBuilder uses them. Answer aloud, then reveal.",
    modelAnswer:
      "A **`@resultBuilder`** is a type whose **static methods the compiler calls** to fold the statements inside a marked closure/function into a **single value** — the compiler *rewrites* the body so each expression becomes an argument to the builder's methods. **`buildBlock`** (combine sibling statements) is required; optional methods enable richer syntax: **`buildOptional`** (`if` without `else`), **`buildEither(first:)`/`buildEither(second:)`** (`if/else`, `switch`), **`buildArray`** (`for` loops), **`buildExpression`** (transform each expression / accept multiple input types), **`buildFinalResult`** (final transform), **`buildLimitedAvailability`** (`if #available`). If a builder doesn't implement a control-flow method, that syntax is **disallowed** (no `buildArray` → no `for`); `guard` and arbitrary returns aren't part of the transform. **SwiftUI's `@ViewBuilder` is a result builder**: `buildBlock` makes a `TupleView`, `buildEither`/`buildOptional` make `_ConditionalContent`/optional views (why `if`/`else` branches can be different view types without `AnyView`) — exactly why `VStack { }` accepts comma-free statements with limited conditionals. You build your own DSLs (HTML, tests, regex) by implementing just the methods your syntax needs.",
    keyPoints: [
      "@resultBuilder: compiler folds closure statements into one value",
      "buildBlock required; buildOptional/buildEither/buildArray enable if/else/for",
      "Missing method → that syntax disallowed; no guard/arbitrary returns",
      "@ViewBuilder is a result builder (TupleView / _ConditionalContent)",
      "Custom DSLs implement only the needed build methods",
    ],
    explanation:
      "Senior answers map control-flow to specific build methods, explain _ConditionalContent (different if/else view types), and identify @ViewBuilder as a result builder.",
  },
];

export default quiz;
