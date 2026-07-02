import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "any-existential",
    type: "mcq",
    prompt: "What is `any P` (an existential)?",
    options: [
      "A box that can hold any value conforming to P, hiding the concrete type behind dynamic dispatch",
      "A compile-time-only type with no runtime cost",
      "A generic type parameter",
      "The same as `some P`",
    ],
    answer: 0,
    explanation:
      "`any P` is an existential container storing some conforming value plus a witness table for dynamic dispatch. Its strength is heterogeneity — different concrete types in one array — at a boxing/dispatch cost.",
  },
  {
    id: "some-opaque",
    type: "mcq",
    prompt: "What does `some P` mean as a return type?",
    options: [
      "One specific concrete type conforming to P, hidden from the caller but known to the compiler",
      "Any of several types, chosen at runtime",
      "A boxed existential",
      "A type the caller picks",
    ],
    answer: 0,
    explanation:
      "`some P` is an opaque type: the implementation returns a single fixed concrete type it doesn't name. The caller sees only 'some P', but the compiler knows the exact type — enabling static dispatch and no boxing.",
  },
  {
    id: "some-same-type",
    type: "predict",
    prompt: "🧠 Trick question — does this compile?",
    code: `func make(_ flag: Bool) -> some Shape {
    if flag { return Circle() }
    else    { return Square() }
}`,
    options: [
      "No — a `some` return must be the SAME concrete type on every path; use `any Shape` for different types",
      "Yes — some allows different types per branch",
      "Yes, but only if Circle and Square are classes",
      "No — functions can't return protocols",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`some Shape` is one fixed hidden type, so every return must be identical. Returning `Circle` vs `Square` needs `-> any Shape` (an existential that can box different types). This is the core distinction between the two.",
  },
  {
    id: "heterogeneous-fill",
    type: "fill",
    prompt: "To store different concrete Shape types in one array, use `[___ Shape]`.",
    answers: ["any"],
    hint: "The existential keyword.",
    explanation:
      "`[any Shape]` is a heterogeneous array of boxed existentials. `[some Shape]` isn't what you want for mixed types (and each `some` is one fixed type).",
  },
  {
    id: "reverse-generic",
    type: "mcq",
    prompt: "Why is `some P` called a 'reverse generic'?",
    options: [
      "A normal generic lets the caller pick the type; `some` lets the implementation pick and hide it",
      "It reverses the order of type parameters",
      "It runs generics backwards at runtime",
      "It's a deprecated form of generics",
    ],
    answer: 0,
    explanation:
      "With `<T: P>` the caller chooses `T`. With `-> some P` the callee chooses the concrete type and hides it; the caller only knows 'some P'. The compiler still tracks the fixed identity — the inverse direction of a normal generic.",
  },
  {
    id: "someany-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements.",
    options: [
      "`some P` avoids boxing and uses static dispatch",
      "`any P` can hold different concrete types over time / in a collection",
      "SwiftUI's `body: some View` works because body is always one concrete type",
      "`any P` is generally faster than `some P`",
    ],
    answers: [0, 1, 2],
    explanation:
      "Opaque static dispatch, existential heterogeneity, and the body rationale are correct. `any P` is generally **slower** (boxing + dynamic dispatch) than `some P` (option 3 is false).",
  },
  {
    id: "performance-senior",
    type: "mcq",
    prompt: "In a performance-sensitive return type where only one concrete type is produced, which do you choose?",
    options: [
      "`some P` — no boxing, static/devirtualized dispatch, specializable",
      "`any P` — flexibility is always worth it",
      "It makes no difference",
      "Return `Any`",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`some P` keeps the concrete type known to the compiler, so there's no box and calls can be inlined/specialized. `any P` boxes and dispatches dynamically. Prefer `some` (or a generic) unless you truly need heterogeneity.",
  },
  {
    id: "param-some-generic-senior",
    type: "mcq",
    prompt: "What is `func f(_ x: some P)` shorthand for?",
    options: [
      "A generic function `func f<T: P>(_ x: T)` — the concrete type is known at the call site",
      "A function taking a boxed existential",
      "A function that returns P",
      "An @escaping closure parameter",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`some P` in **parameter** position is sugar for a generic constraint `<T: P>` — the concrete argument type is statically known (fast). `any P` in parameter position instead accepts a boxed existential (dynamic).",
  },
  {
    id: "explicit-any-senior",
    type: "mcq",
    prompt: "Why did Swift 5.7 start requiring the explicit `any` keyword for existentials?",
    options: [
      "To make the boxing/dynamic-dispatch cost of existentials visible at the use site",
      "To deprecate protocols",
      "Because existentials were removed",
      "To speed up compilation only",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Previously `let x: P` silently created an existential with hidden costs. Requiring `any P` surfaces that you're choosing a boxed, dynamically-dispatched value — nudging developers toward `some`/generics when heterogeneity isn't needed.",
  },
  {
    id: "someany-flashcard",
    type: "flashcard",
    prompt:
      "Contrast some vs any: semantics, performance, and when to use each. Answer aloud, then reveal.",
    modelAnswer:
      "**`any P`** is an **existential** — a box holding *any* conforming value, hiding its concrete type behind a **witness table (dynamic dispatch)** and **boxing** (inline if small, else heap). Its power is **heterogeneity**: `[any Shape]` can hold `Circle` and `Square` together. **`some P`** is an **opaque type** — **one specific concrete type**, hidden from the caller but **known to the compiler**, so you get **static dispatch, no boxing**, and specialization. The catch: a `some P` return must be the **same concrete type on every path** (why SwiftUI's `body: some View` works and can't switch types per branch — use `any` for that). `some` is a **reverse generic**: a normal generic lets the **caller** pick the type, while `-> some P` lets the **implementation** pick and hide it. Guidance: **prefer `some` (or a generic constraint) for performance and type info; use `any` only when you genuinely need mixed types.** In parameter position, `some P` is sugar for `<T: P>`. Swift 5.7 requires the explicit **`any`** keyword to make the existential cost visible.",
    keyPoints: [
      "any P = existential box: heterogeneous, boxed, dynamic dispatch",
      "some P = opaque: one hidden concrete type, static dispatch, no box",
      "some return must be the SAME type on every path (body: some View)",
      "some = reverse generic (implementation picks & hides the type)",
      "Prefer some/generics for perf; use any only for mixed types; explicit `any` (5.7)",
    ],
    explanation:
      "Senior answers nail the same-type-per-path rule for `some`, the boxing/dynamic-dispatch cost of `any`, the reverse-generic framing, and the choose-some-unless-heterogeneous guidance.",
  },
];

export default quiz;
