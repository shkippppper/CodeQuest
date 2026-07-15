import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "vg-problem",
    type: "mcq",
    prompt: "What problem do parameter packs solve that ordinary generics could not?",
    options: [
      "Writing one generic that works over any NUMBER of type parameters, instead of hand-writing a separate overload per arity",
      "Allowing a generic function to accept arguments whose concrete types are only ever discovered later at runtime through reflection",
      "Letting a single generic parameter secretly hold two unrelated types so one function body can satisfy two different callers at once",
      "Removing the requirement that every generic type parameter be constrained to at least one protocol before it can be used at all",
    ],
    answer: 0,
    explanation:
      "Ordinary generics fix the *count* of type parameters. `func f<A, B>` always takes two. Parameter packs let one definition span any number of type parameters, so you stop copy-pasting an overload per arity.",
  },
  {
    id: "vg-each-meaning",
    type: "mcq",
    prompt: "In the declaration `func f<each T>(...)`, what does `each T` mean?",
    options: [
      "A type parameter pack — a bundle standing for zero or more types at once, filled in from the call's arguments",
      "A special generic parameter that must be given exactly one type, but that type is required to conform to the Equatable protocol",
      "A macro-like directive instructing the compiler to iterate over the members of T and generate one overload of f for each member",
      "A runtime array of type metadata objects that the function can inspect and enumerate while it is actually executing on device",
    ],
    answer: 0,
    explanation:
      "`each T` declares a **type parameter pack**: a list of types, zero or more, determined by how many arguments the caller passes. It is the core building block of variadic generics.",
  },
  {
    id: "vg-value-pack-fill",
    type: "fill",
    prompt:
      "To accept one value for every type in the pack `T`, a parameter is written `_ items: ___ each T`.",
    answers: ["repeat"],
    hint: "The same keyword that also drives expansion.",
    explanation:
      "`repeat each T` is a **value pack**: one value per type in the pack. If the type pack is `Int, String`, then `items` carries an `Int` and a `String`.",
  },
  {
    id: "vg-expansion-count",
    type: "predict",
    prompt: "How many `print` calls does this produce for a 3-element pack?",
    code: "func printAll<each T>(_ items: repeat each T) {\n    repeat print(each item)\n}\nprintAll(1, \"hi\", true)",
    options: [
      "Three — `repeat` unrolls the expression once for every element in the pack, so a 3-element pack yields three print calls",
      "One, because `repeat` compiles down to a single call that internally forwards the whole packed tuple to print in one shot",
      "Zero, since `repeat each item` describes a type-level construct only and generates no executable statements at runtime",
      "It fails to compile, on the grounds that you may never call a plain function like print from inside a repeat expansion",
    ],
    answer: 0,
    explanation:
      "`repeat` is compile-time unrolling: the expression is stamped out once per element. A 3-element pack expands to `print(item0); print(item1); print(item2)` — three calls.",
  },
  {
    id: "vg-repeat-mental-model",
    type: "mcq",
    prompt: "Which is the best mental model for `repeat operation(each item)`?",
    options: [
      "Map over the pack, unrolled by the compiler — the expression is repeated once per element, each seeing its own element",
      "A runtime for-loop with a hidden index that you can break out of early or skip with continue whenever a condition is met",
      "A recursive call that peels one element off the front of the pack and re-invokes the enclosing function on the shorter tail",
      "A lazy sequence that defers running operation on each element until some later code actually demands the produced values",
    ],
    answer: 0,
    explanation:
      "Think of `repeat` as compile-time map-over-the-pack. The expression is expanded once per element — no runtime index, no `break`/`continue`, no laziness.",
  },
  {
    id: "vg-type-pack-multi",
    type: "multi",
    prompt: "Select **all** true statements about parameter packs.",
    options: [
      "A struct can be generic over a pack, like `struct Bundle<each T>`, giving one type for every arity",
      "A constraint such as `<each T: Equatable>` applies to every single element type in the pack",
      "A pack is allowed to be empty, so a call passing no arguments produces a zero-length pack",
      "A `repeat` expansion is an ordinary runtime loop that supports `break`, `continue`, and an index",
    ],
    answers: [0, 1, 2],
    explanation:
      "Types can be pack-generic, constraints distribute over every element, and packs may be empty — all true. But `repeat` is compile-time unrolling, not a runtime loop, so option 4 is false.",
  },
  {
    id: "vg-tupleview-senior",
    type: "mcq",
    prompt: "Why was SwiftUI's `ViewBuilder` historically capped at 10 child views?",
    options: [
      "Its arities were hand-written as separate overloads up to ten, so nobody wrote an eleventh — packs remove that ceiling",
      "The layout engine physically cannot measure and position more than ten sibling views inside a single container in one pass",
      "Swift's type checker imposes a hard language rule forbidding any generic type from declaring more than ten parameters total",
      "Rendering more than ten views required diffing that grew too slow, so Apple deliberately blocked the eleventh at compile time",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The cap was purely mechanical: `ViewBuilder` had `buildBlock` overloads for 2, 3… up to 10 arguments, hand-written and stopped at ten. Parameter packs express all arities with one definition, removing the ceiling.",
  },
  {
    id: "vg-lockstep-senior",
    type: "predict",
    prompt: "What does this print?",
    code: "func equalPairs<each T: Equatable>(\n    _ lhs: repeat each T,\n    _ rhs: repeat each T\n) -> Bool {\n    var result = true\n    repeat result = result && (each lhs == each rhs)\n    return result\n}\nprint(equalPairs(1, \"hi\", 2, \"hi\"))",
    options: [
      "false — the two packs expand in lockstep and the first pair (1 vs 2) is unequal, which short-circuits result to false",
      "true, because the second pair \"hi\" == \"hi\" holds and the && expansion keeps the earlier false comparison from mattering",
      "It fails to compile since two independent value packs can never be compared element-by-element within one repeat expansion",
      "It traps at runtime because comparing an Int element against a String element violates the Equatable constraint on the pack",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Both parameters share the pack `T`, so they expand in lockstep: `1 == 2` (false) then `\"hi\" == \"hi\"` (true). `result` becomes `true && false && true` → `false`.",
  },
  {
    id: "vg-return-tuple-senior",
    type: "mcq",
    prompt: "In `func tuple<each T>(_ items: repeat each T) -> (repeat each T)`, what is the return type?",
    options: [
      "A tuple with one slot per element in the pack, each slot keeping its exact static type — no `Any`, no erasure",
      "An array of `Any` holding every argument, since a single return type cannot vary its shape with the pack length",
      "A single opaque `some Equatable` value that packages all the elements behind one existential box for the caller",
      "A closure that, when invoked by the caller, lazily produces each element of the pack one at a time on demand",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`(repeat each T)` is a tuple type whose slots mirror the pack element-for-element, preserving each concrete static type. `tuple(1, \"hi\")` returns `(Int, String)` — fully typed, no `Any`.",
  },
  {
    id: "vg-flashcard",
    type: "flashcard",
    prompt:
      "Explain variadic generics: the problem they solve, the three keywords (each / repeat each / repeat expansion), packs in types, and constraints. Answer aloud, then reveal.",
    modelAnswer:
      "**Variadic generics** (parameter packs) let you write one generic that works over **any number** of type parameters, instead of hand-writing a separate overload per arity. Before them you wrote `zip<A,B>`, `zip<A,B,C>`, … and capped out — exactly why SwiftUI's `ViewBuilder`/`TupleView` stopped at 10 child views. Three keywords: (1) `each T` in the generic clause declares a **type parameter pack** — zero or more types at once, filled from the call's arguments; (2) `repeat each T` as a parameter or return type is a **value pack** — one value per type in the pack, and `(repeat each T)` is a tuple with one slot per element; (3) `repeat someExpr(each x)` is **expansion** — the compiler unrolls the expression once per element, the mental model being map-over-the-pack at compile time (not a runtime loop, no index or break). Types can be pack-generic too: `struct Bundle<each T>` is one definition covering every arity. Constraints distribute: `<each T: Equatable>` requires every element to conform, and two packs that share the same pack name expand in **lockstep** so you can combine them element-wise. Results keep their exact static types — `tuple(1, \"hi\")` returns `(Int, String)`, no `Any`.",
    keyPoints: [
      "One generic over any number of type parameters — replaces per-arity overloads",
      "`each T` declares a type parameter pack (zero or more types)",
      "`repeat each T` is a value pack: one value per type; also the return tuple shape",
      "`repeat expr(each x)` is compile-time expansion — map over the pack, not a runtime loop",
      "Types can be pack-generic: `struct Bundle<each T>`",
      "Constraints apply per element (`each T: Equatable`); shared packs expand in lockstep",
    ],
    explanation:
      "A senior answer names the problem (per-arity overloads, the ViewBuilder-10 cap), nails all three keywords with the compile-time-expansion mental model, mentions pack-generic types, and covers per-element constraints plus lockstep expansion with static types preserved.",
  },
];

export default quiz;
