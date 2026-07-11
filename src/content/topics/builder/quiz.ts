import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "builder-intent",
    type: "mcq",
    prompt: "What is the builder pattern's intent?",
    options: [
      "Separate assembling a complex object step by step from the object's final, immutable shape",
      "Guarantee only one instance of a type ever exists",
      "Convert one interface into another that a caller expects",
      "Add behavior to an object without subclassing",
    ],
    answer: 0,
    explanation:
      "A builder collects settings incrementally through a mutable intermediate type, then produces a final, typically immutable result — separating the messy process of assembly from the finished object's shape.",
  },
  {
    id: "builder-fluent-predict",
    type: "predict",
    prompt: "What does `self.method = method; return self` inside a builder method enable at the call site?",
    code: `RequestBuilder(url: url)\n    .method("POST")\n    .header("Authorization", "Bearer abc123")\n    .build()`,
    options: [
      "Chaining another method call directly on the result, forming a fluent interface",
      "Nothing — `return self` is required by the compiler for all methods",
      "Automatically calling `.build()` at the end",
      "Making the builder thread-safe",
    ],
    answer: 0,
    explanation:
      "Returning `self` from each builder method is exactly what lets the next line call another method on the result without a temporary variable — that chaining style is called a **fluent interface**.",
  },
  {
    id: "builder-fluent-fill",
    type: "fill",
    prompt: "A builder whose methods mutate state and `return self`, allowing calls to be chained one after another, is called a ___ interface.",
    answers: ["fluent"],
    hint: "Describes code that reads almost like a sentence.",
    explanation:
      "Fluent interfaces chain method calls by having each one return `self`, letting `.method(...).header(...).build()` read as one continuous statement.",
  },
  {
    id: "builder-resultbuilder-mcq",
    type: "mcq",
    prompt: "What compiler feature lets you write `VStack { Text(\"Hi\"); Image(...) }` as plain statements instead of an array literal?",
    options: [
      "Result builders (`@resultBuilder`), via a `buildBlock` method that combines the statements",
      "Property wrappers",
      "Generics",
      "Protocol extensions",
    ],
    answer: 0,
    explanation:
      "`@resultBuilder` lets a function parameter be written as a block of statements, which the compiler passes to methods like `buildBlock` to combine into one value — the exact mechanism SwiftUI uses for view builders.",
  },
  {
    id: "builder-conditional-predict",
    type: "predict",
    prompt: "A result builder type defines only `buildBlock`. What happens if you write `if someCondition { MenuItem(...) }` inside a block that type builds?",
    code: `@resultBuilder\nstruct MenuBuilder {\n    static func buildBlock(_ items: MenuItem...) -> [MenuItem] { items }\n}\n// inside a block:\nif someCondition {\n    MenuItem(name: "Coffee", price: 3.5)\n}`,
    options: [
      "It fails to compile — conditionals need `buildEither`/`buildOptional`, which this builder doesn't implement",
      "It compiles and skips the item silently when `someCondition` is false",
      "It compiles and always includes the item regardless of the condition",
      "It compiles because `buildBlock` handles conditionals automatically",
    ],
    answer: 0,
    explanation:
      "`buildBlock` alone only knows how to combine a fixed sequence of statements. Conditional branches need the result builder to also implement `buildEither(first:)`/`buildEither(second:)` or `buildOptional(_:)` so the compiler knows how to combine a branch that might not run.",
  },
  {
    id: "builder-vs-default-args-multi",
    type: "multi",
    prompt: "Select **all** situations where a builder earns its complexity over plain default arguments.",
    options: [
      "Setting one property's value depends on another property already being set, in a specific order",
      "The object is assembled incrementally across several different functions before being finalized",
      "An initializer simply has three optional parameters with sensible defaults",
      "You want to reuse a partially-configured builder as a template for several similar objects",
    ],
    answers: [0, 1, 3],
    explanation:
      "Order-dependent steps, multi-site incremental assembly, and reusable partial templates are all cases a plain initializer with default arguments can't express. \"A few optional parameters\" is exactly the case default arguments already solve with less code.",
  },
  {
    id: "builder-build-call-fill",
    type: "fill",
    prompt: "Unlike a struct literal, a fluent builder only produces its final object when you explicitly call ___ — a builder that's configured but never has this called on it is just discarded state.",
    answers: [".build()", "build()", "build"],
    hint: "The method name used throughout this lesson's examples.",
    explanation:
      "A builder's mutable state doesn't become the finished object automatically — you have to explicitly call `.build()` (or whatever the finalizing method is named) to produce it.",
  },
  {
    id: "builder-shared-mutation-senior",
    type: "mcq",
    prompt: "You pass the same `RequestBuilder` instance into two different configuration functions, and both call `.method(...)` with different values before either sees the other's call. What happens?",
    options: [
      "Whichever `.method(...)` call happens last silently overwrites the earlier one — a fluent builder's mutable state is shared, not isolated per call path",
      "Swift throws a runtime error for double-mutation",
      "Both values are kept and merged automatically",
      "The builder becomes immutable after the first `.method()` call",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A class-based fluent builder is reference-typed mutable state. If it's shared between two configuration paths, there's no isolation — the last mutation wins silently, which is why a builder should generally be treated as owned by a single assembly path at a time.",
  },
  {
    id: "builder-flashcard",
    type: "flashcard",
    prompt:
      "Explain the builder pattern, how a result-builder DSL differs from a plain fluent builder, and when default arguments are the better choice. Answer aloud, then reveal.",
    modelAnswer:
      "A **builder** separates the step-by-step process of assembling a complex object from its final, usually immutable, shape: a mutable builder type exposes chainable methods (a **fluent interface**, each returning `self`) that accumulate configuration, and a final `.build()` call produces the finished object. **Result builders** (`@resultBuilder`) are a more powerful, compiler-level version of the same idea — instead of chaining method calls, you write plain statements inside a block, and the compiler passes them to methods like `buildBlock` (and `buildEither`/`buildOptional` for conditionals) to combine into one value; this is the exact mechanism behind SwiftUI's `VStack { ... }`. Neither is worth reaching for when Swift's plain **default arguments** already solve the problem — 'this initializer has a few optional parameters' needs nothing more than defaults. A builder earns its complexity when construction has real *steps* (one property's value depends on another already being set), is assembled incrementally across multiple places in the code before finalizing, or needs to be reused as a partially-configured template for several similar objects.",
    keyPoints: [
      "Builder: mutable step-by-step assembly type + immutable final object via .build()",
      "Fluent interface: chainable methods that mutate state and return self",
      "Result builders (@resultBuilder + buildBlock/buildEither) are the compiler-level DSL version — same idea SwiftUI uses",
      "Default arguments already solve 'a few optional parameters' with far less code",
      "Builder earns its keep for ordered steps, multi-site assembly, or reusable partial templates",
    ],
    explanation:
      "A senior answer connects fluent builders and result-builder DSLs as two levels of the same idea, and can articulate specifically when a builder is worth the extra type versus when default arguments are simply the right tool.",
  },
];

export default quiz;
