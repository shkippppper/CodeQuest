import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "generics-vs-any",
    type: "mcq",
    prompt: "What do generics give you over using `Any`?",
    options: [
      "Reuse without losing type information — the compiler keeps the concrete type known and type-safe",
      "Faster compile times, since generic code skips type checking entirely at build time",
      "Automatic memory management, because every generic value is boxed on the heap and reference-counted",
      "Nothing meaningful — `Any` and a generic parameter compile down to identical code",
    ],
    answer: 0,
    explanation:
      "Generics parameterize by type, so the concrete type is preserved and checked at compile time. `Any` erases the type, forcing casts and pushing errors to runtime.",
  },
  {
    id: "generic-function",
    type: "predict",
    prompt: "What is `T` inferred as in `swap(&x, &y)` where x and y are Int?",
    code: `func swap<T>(_ a: inout T, _ b: inout T) { let t = a; a = b; b = t }
var x = 1, y = 2
swap(&x, &y)`,
    options: ["Int", "Any", "Numeric", "T stays a placeholder at runtime"],
    answer: 0,
    explanation:
      "The type parameter `T` is unified from the arguments — both `Int`, so `T == Int`. Generics resolve to concrete types at compile time.",
  },
  {
    id: "constraint-unlocks",
    type: "mcq",
    prompt: "Why does `func max2<T: Comparable>(_ a: T, _ b: T)` need the `: Comparable` constraint?",
    options: [
      "Without it, `T` supports only universal operations; the constraint unlocks `>` / `<`",
      "It makes the function run faster by skipping runtime witness-table lookups entirely",
      "`Comparable` is mandatory on every generic type parameter you declare in Swift",
      "It lets the function take more than two arguments of the same type `T`",
    ],
    answer: 0,
    explanation:
      "A bare `T` can only be assigned/passed. Constraining `T: Comparable` guarantees comparison operators exist, so the body can use `>`. Constraints keep generics flexible yet able to call type-specific methods safely.",
  },
  {
    id: "where-clause-fill",
    type: "fill",
    prompt: "Refine a generic's associated-type constraints with a ___ clause, e.g. `func f<C: Collection>(_ c: C) ___ C.Element: Equatable`.",
    answers: ["where"],
    hint: "Same keyword used in switch patterns.",
    explanation:
      "A `where` clause expresses richer constraints — on associated types (`C.Element: Equatable`) or same-type requirements (`T == U`) — beyond the simple `<T: P>` form.",
  },
  {
    id: "generic-type",
    type: "mcq",
    prompt: "What is `Stack<Element>`?",
    options: [
      "A generic type — Stack<Int> and Stack<String> are distinct, fully type-checked types",
      "A protocol that any stack-like type can conform to, dispatched dynamically at runtime",
      "A single concrete type that stores all of its elements as `Any` values",
      "Just a typealias for `Array<Element>` under a different name",
    ],
    answer: 0,
    explanation:
      "Types can be generic. `Stack<Element>` produces a separate, type-safe type per element type (`Stack<Int>` ≠ `Stack<String>`), just like `Array<Element>`.",
  },
  {
    id: "generics-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about generics.",
    options: [
      "The compiler can specialize a generic into concrete, inlined code",
      "Conditional conformance makes a generic type conform only when its parameter does",
      "A bare unconstrained `T` can call any method of its concrete type",
      "`Array`, `Dictionary`, and `Optional` are generic types",
    ],
    answers: [0, 1, 3],
    explanation:
      "Specialization, conditional conformance, and the generic stdlib types are correct. A bare `T` can only do **universal** operations — you must constrain it to call type-specific methods (option 3 is false).",
  },
  {
    id: "conditional-conformance-senior",
    type: "predict",
    prompt: "🧠 Trick question — given `extension Stack: Equatable where Element: Equatable`, is `Stack<() -> Void>` Equatable?",
    code: `extension Stack: Equatable where Element: Equatable {
    static func == (l: Stack, r: Stack) -> Bool { l.items == r.items }
}`,
    options: [
      "No — function types aren't `Equatable`, so the conformance doesn't apply here",
      "Yes — every `Stack` is `Equatable` no matter what its `Element` type is",
      "Yes — Swift automatically synthesizes `Equatable` conformance for function types",
      "No — it compiles, but comparing two of these stacks traps at runtime",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Conditional conformance means `Stack` is `Equatable` **only when `Element` is**. Function types aren't `Equatable`, so `Stack<() -> Void>` doesn't get the conformance — and comparing two would be a compile error. This is exactly why `[Int]` is Equatable but `[() -> Void]` isn't.",
  },
  {
    id: "specialization-senior",
    type: "mcq",
    prompt: "How can a generic function run as fast as hand-written type-specific code?",
    options: [
      "The optimizer specializes it into a concrete, inlined version for that type",
      "Generic code runs through a runtime interpreter, so it never matches concrete code",
      "By boxing every value into an existential container before each call",
      "They can't — generic code is inherently slower than hand-written concrete code",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Swift **specializes** generics: it emits a dedicated version for a concrete type, inlining and stripping abstraction. This works best when the optimizer sees the call site (same module, or `@inlinable` across modules). Unspecialized generics use witness tables — still far cheaper than existential boxing.",
  },
  {
    id: "generics-vs-existential-senior",
    type: "mcq",
    prompt: "For calling code that works with a single concrete type, prefer a generic constraint or an existential (`any P`)?",
    options: [
      "Generic constraint — compile-time-known type, specializable, no boxing",
      "Existential (`any P`) — dynamic dispatch always beats a generic call",
      "They perform identically — the compiler treats `any P` and generics the same way",
      "Neither — use `Any` and cast at each use site",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A generic constraint keeps the type known and lets the compiler specialize (no box, static/devirtualized dispatch). An existential `any P` boxes the value and dispatches dynamically — reserve it for genuinely heterogeneous collections.",
  },
  {
    id: "generics-flashcard",
    type: "flashcard",
    prompt:
      "Explain generics: what they solve, constraints, conditional conformance, and performance. Answer aloud, then reveal.",
    modelAnswer:
      "**Generics** let you write an algorithm/type **once, parameterized by type**, keeping full type safety — unlike `Any`, which erases type info and forces casts. You get **generic functions** (`func swap<T>(...)`, where `T` is unified from the call) and **generic types** (`Stack<Element>`, `Array<Element>` — distinct type per parameter). A bare `T` supports only universal operations, so you add **constraints** (`<T: Comparable>`) — refined by a **`where` clause** for associated types (`C.Element: Equatable`) or same-type requirements (`T == U`) — to call type-specific methods safely. **Conditional conformance** makes a generic type conform to a protocol only when its parameter does (`extension Stack: Equatable where Element: Equatable`) — why `[Int]` is Equatable but `[() -> Void]` isn't. Performance: the optimizer **specializes** generics into concrete, inlined code (fast, especially within a module or with `@inlinable`; otherwise a witness-table version), whereas **existentials (`any P`) box and dynamically dispatch** — so prefer a generic constraint for a single concrete type per call and reserve `any` for heterogeneous collections.",
    keyPoints: [
      "Write-once, type-safe reuse (vs Any's casts/runtime errors)",
      "Generic functions & types; T unified at the call site",
      "Constraints (<T: P>) + where clauses unlock type-specific ops",
      "Conditional conformance: conform only when the parameter does",
      "Specialization makes generics fast; existentials box/dynamic-dispatch",
    ],
    explanation:
      "Senior answers cover constraints/where, conditional conformance (the [Int] vs [closure] example), and specialization vs existential boxing.",
  },
];

export default quiz;
