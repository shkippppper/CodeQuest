import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "equatable-synth",
    type: "mcq",
    prompt: "For which types does Swift synthesize `Equatable` when you declare conformance?",
    options: [
      "Structs whose stored properties are all Equatable, and enums whose associated values are all Equatable",
      "Only classes",
      "Any type, unconditionally",
      "Only types with an `id`",
    ],
    answer: 0,
    explanation:
      "Declaring `Equatable` synthesizes `==` for structs (all members Equatable) and enums (all associated values Equatable). Classes and mismatched members require a hand-written `==`.",
  },
  {
    id: "hashable-contract",
    type: "mcq",
    prompt: "What is the core contract between `Hashable` and `Equatable`?",
    options: [
      "If `a == b`, then `a` and `b` must produce the same hash",
      "Every value must have a unique hash",
      "Hashes must be sorted",
      "`==` must ignore all properties",
    ],
    answer: 0,
    explanation:
      "Equal values MUST hash equally, or a `Set`/`Dictionary` can fail to find an element it contains. Collisions (different values, same hash) are allowed; uniqueness is not required.",
  },
  {
    id: "comparable-not-synth",
    type: "mcq",
    prompt: "Is `Comparable` synthesized for structs?",
    options: [
      "No — you implement `<` yourself (enums without associated values get case-order synthesis)",
      "Yes, always",
      "Only for classes",
      "Only if the struct is Hashable",
    ],
    answer: 0,
    explanation:
      "Structs don't get a synthesized `<` — you write it (often via tuple comparison). Enums **without** associated values, however, synthesize `Comparable` based on case declaration order.",
  },
  {
    id: "identifiable-fill",
    type: "fill",
    prompt: "`Identifiable` requires a stable, unique `___` property that SwiftUI's List/ForEach use to track items.",
    answers: ["id"],
    hint: "Two letters.",
    explanation:
      "`Identifiable` requires an `id` (a `Hashable` `ID`). A `let id` satisfies it automatically. The id must be stable across updates and unique so SwiftUI diffs rows correctly.",
  },
  {
    id: "custom-string-convertible",
    type: "mcq",
    prompt: "What does conforming to `CustomStringConvertible` control?",
    options: [
      "The `description` string used by print, String(describing:), and interpolation",
      "JSON encoding",
      "Sort order",
      "Equality",
    ],
    answer: 0,
    explanation:
      "`description` is what `print(x)` and `\\(x)` use. Adopt it for a clean, human-readable representation instead of the default reflection dump. `debugDescription` (CustomDebugStringConvertible) is for the debugger.",
  },
  {
    id: "conformances-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements.",
    options: [
      "`Hashable` requires `Equatable`",
      "`Comparable` requires `Equatable` and provides `<`",
      "A `let id` can satisfy `Identifiable` automatically",
      "`Comparable` is synthesized for all structs",
    ],
    answers: [0, 1, 2],
    explanation:
      "Hashable:Equatable, Comparable:Equatable+`<`, and automatic Identifiable via `id` are correct. `Comparable` is **not** synthesized for structs — you write `<` (option 3 is false).",
  },
  {
    id: "closure-kills-synthesis-senior",
    type: "predict",
    prompt: "🧠 Trick question — why won't this struct get synthesized Equatable?",
    code: `struct Handler: Equatable {
    let name: String
    let onTap: () -> Void
}`,
    options: [
      "A closure (function type) isn't Equatable, and one non-Equatable stored property disables synthesis for the whole type",
      "Structs can't be Equatable",
      "`name` must be a var",
      "It compiles fine",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Synthesis requires **every** stored property to be Equatable. Function types aren't Equatable, so `onTap` breaks it. You must hand-write `==` (comparing only `name`) — and then you own the contract.",
  },
  {
    id: "custom-equality-hash-senior",
    type: "predict",
    prompt: "🧠 Trick question — a type's `==` compares only `id`, but `hash(into:)` hashes `id` AND `name`. What breaks?",
    code: `static func == (l: T, r: T) -> Bool { l.id == r.id }
func hash(into h: inout Hasher) { h.combine(id); h.combine(name) }`,
    options: [
      "The Hashable/Equatable contract — two equal values (same id, different name) hash differently, so a Set can lose them",
      "Nothing — this is fine",
      "It won't compile",
      "Sorting breaks",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Two values equal by `==` (same `id`) but with different `name` produce different hashes — violating 'equal values hash equally'. A `Set`/`Dictionary` may then fail to find an element it contains. Hash exactly the fields `==` compares (here, just `id`).",
  },
  {
    id: "when-custom-senior",
    type: "mcq",
    prompt: "When should you write a custom `Equatable` instead of using synthesis?",
    options: [
      "When equality shouldn't compare every field — e.g. two records are equal if their `id`s match, ignoring caches/derived data",
      "Always — synthesis is unreliable",
      "Never — synthesis covers every case",
      "Only for classes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Synthesis compares all stored properties. Go custom when that's wrong — identity-based equality (compare `id` only), ignoring transient/derived fields — but then keep `hash(into:)` consistent with your `==`.",
  },
  {
    id: "protocol-conformances-flashcard",
    type: "flashcard",
    prompt:
      "Summarize Equatable/Hashable/Comparable/Identifiable/CustomStringConvertible: capability, synthesis, and contracts. Answer aloud, then reveal.",
    modelAnswer:
      "**`Equatable`** gives `==` (value equality) — **synthesized** for structs/enums whose members are all Equatable; contract: reflexive/symmetric/transitive. **`Hashable`** (requires Equatable) enables `Set`/`Dictionary` keys — also synthesized — with the **iron contract that equal values must hash equally** (hash the same fields `==` uses, or a Set loses elements; collisions are fine). **`Comparable`** (requires Equatable) gives `<` for sorting/ranges — **not synthesized for structs** (you write `<`, often via tuple comparison), though payload-free enums synthesize case-declaration order. **`Identifiable`** requires a **stable, unique `id`** (a `let id` satisfies it automatically) that SwiftUI's `List`/`ForEach` use to diff. **`CustomStringConvertible`** provides `description` for `print`/interpolation. Prefer **synthesis** (correct and free), but write **custom** implementations when defaults are wrong (equality by `id` only, a domain order, a formatted description) — then you own the invariants. Gotcha: **one non-Equatable/Hashable stored property (like a closure) disables synthesis** for the whole type, forcing a hand-written implementation.",
    keyPoints: [
      "Equatable (==) & Hashable (Set/Dict keys) synthesized; equal ⇒ same hash",
      "Comparable (<) NOT synthesized for structs (write it); enums get case order",
      "Identifiable needs a stable, unique id (let id auto-satisfies) for SwiftUI",
      "CustomStringConvertible = description for print/interpolation",
      "Custom when defaults wrong (equality by id); closure/non-conforming prop kills synthesis",
    ],
    explanation:
      "Senior answers stress the equal-values-hash-equally contract, that Comparable isn't synthesized for structs, and that a non-conforming stored property disables synthesis.",
  },
];

export default quiz;
