import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "extension-purpose",
    type: "mcq",
    prompt: "What can an extension do?",
    options: [
      "Add methods, computed properties, subscripts, initializers, and protocol conformances to an existing type",
      "Only add stored properties",
      "Only work on your own types",
      "Replace a type's existing methods",
    ],
    answer: 0,
    explanation:
      "Extensions add functionality to any existing type (yours, the stdlib's, third-party) without subclassing — methods, computed properties, subscripts, inits, and conformances. They can't replace existing methods.",
  },
  {
    id: "no-stored-props",
    type: "predict",
    prompt: "🧠 Trick question — does this compile?",
    code: `extension String {
    var cachedLength: Int = 0   // stored property in an extension
}`,
    options: [
      "No — extensions cannot add stored properties (only computed ones)",
      "Yes — extensions can add any property",
      "Yes, but only for value types",
      "Only if String were a class",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Extensions have no storage of their own, so a **stored** property is a compile error. You can add a **computed** property (`var isEmpty2: Bool { isEmpty }`). Class stored-state workarounds use associated objects (a code smell).",
  },
  {
    id: "conformance-via-extension",
    type: "mcq",
    prompt: "Why add protocol conformance in an extension rather than the main declaration?",
    options: [
      "It groups the conformance and its methods together, improving organization (and can conform types you don't own)",
      "It's the only place conformance is allowed",
      "It makes the type a class",
      "It avoids implementing the requirements",
    ],
    answer: 0,
    explanation:
      "Conforming via extension keeps each protocol's implementation in its own focused block, and you can even conform types you don't own (`extension Int: MyProtocol`). It's an idiomatic organization pattern.",
  },
  {
    id: "constrained-extension-fill",
    type: "fill",
    prompt: "Add methods to a generic type only when its parameter qualifies using a ___ clause: `extension Array ___ Element: Numeric`.",
    answers: ["where"],
    hint: "Same keyword as generic constraints.",
    explanation:
      "A **constrained extension** (`extension Array where Element: Numeric`) exposes members only when the constraint holds — the mechanism behind conditional conformance.",
  },
  {
    id: "struct-init-extension",
    type: "mcq",
    prompt: "Why put a custom initializer for a struct in an extension?",
    options: [
      "It adds the custom init while preserving the compiler-synthesized memberwise initializer",
      "Extensions are the only place inits are allowed",
      "It makes the init failable automatically",
      "It converts the struct to a class",
    ],
    answer: 0,
    explanation:
      "Adding a custom init in the struct's main declaration suppresses the memberwise init; putting it in an **extension** keeps both — a handy trick for adding conveniences without losing `Point(x:y:)`.",
  },
  {
    id: "extensions-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about extensions.",
    options: [
      "Extensions can add computed properties and methods",
      "You can extend types you don't own (like String or Int)",
      "Constrained extensions add members only when a generic constraint holds",
      "Extensions can add stored properties",
    ],
    answers: [0, 1, 2],
    explanation:
      "Computed members, extending foreign types, and constrained extensions are correct. Extensions **cannot** add stored properties (option 3 is false).",
  },
  {
    id: "retroactive-conformance-senior",
    type: "mcq",
    prompt: "What is 'retroactive conformance' and why is it discouraged?",
    options: [
      "Conforming a type you don't own to a protocol you don't own — risky because two modules could add conflicting conformances",
      "Conforming your own type to your own protocol — always safe",
      "Removing a conformance at runtime",
      "A deprecated Swift feature",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Retroactive conformance (e.g. conforming `Foundation.Date` to a third-party protocol) is allowed but risky: if two modules both add it, there's a conflict with no clear winner. Prefer wrapping in your own type when you need the conformance.",
  },
  {
    id: "extension-organization-senior",
    type: "mcq",
    prompt: "How are extensions commonly used purely for organization?",
    options: [
      "Split a large type into focused extensions (one per protocol conformance or concern), often across files",
      "To make types private",
      "To reduce binary size",
      "To disable methods conditionally",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A standard idiom: keep `UITableViewDataSource`/`Delegate` conformances and grouped helpers in separate extensions (often in `Type+Feature.swift` files), so a big type stays readable with each concern isolated.",
  },
  {
    id: "extension-override-senior",
    type: "predict",
    prompt: "🧠 Trick question — can an extension override an existing method of the type?",
    code: `extension Array {
    func count() -> Int { 42 }   // trying to 'override' count
}`,
    options: [
      "No — extensions add new members but cannot override/replace a type's existing declarations",
      "Yes — extensions override freely",
      "Yes, but only computed properties",
      "Only for classes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Extensions are additive: they can't override or replace a type's existing members (and here `count` is a property, so `count()` is just a different, confusing new method). Overriding is a class-inheritance feature, not something extensions do.",
  },
  {
    id: "extensions-flashcard",
    type: "flashcard",
    prompt:
      "Explain extensions: what they add, the key limitation, and constrained/organizational uses. Answer aloud, then reveal.",
    modelAnswer:
      "**Extensions** add functionality to **any existing type** — your own, the standard library's, or third-party — **without subclassing** and without the original source. They can add **methods, computed properties, subscripts, initializers, nested types, and protocol conformances** (conforming via extension groups each conformance's methods together and even lets you conform types you don't own). The **cardinal limitation: extensions cannot add stored properties** (they have no storage — only computed properties/methods). **Constrained extensions** on generic types add members **only when a `where` constraint holds** (`extension Array where Element: Numeric`) — the mechanism behind conditional conformance. **Retroactive conformance** (conforming a foreign type to a foreign protocol) is allowed but discouraged due to cross-module conflicts. Extensions are also a core **organization** idiom: split a large type into focused extensions (one per conformance/concern, often across files), e.g. isolating `UITableViewDataSource` conformance. They're additive — they can't override/replace existing members. (For structs, a custom init in an extension preserves the memberwise init.)",
    keyPoints: [
      "Add methods/computed props/subscripts/inits/conformances to any existing type",
      "Cannot add stored properties (no storage) — computed only",
      "Constrained extensions (where) → members only when constraint holds",
      "Retroactive conformance allowed but risky; extensions are additive (no override)",
      "Organization idiom: one extension per conformance/concern, across files",
    ],
    explanation:
      "Senior answers stress the no-stored-properties rule, constrained extensions (→ conditional conformance), retroactive-conformance risk, and extension-based organization.",
  },
];

export default quiz;
