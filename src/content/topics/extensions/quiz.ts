import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "extension-purpose",
    type: "mcq",
    prompt: "What can an extension do?",
    options: [
      "Add methods, computed properties, subscripts, initializers, and protocol conformances to an existing type",
      "Only add stored properties, since extensions have their own backing storage that is associated with each instance via reference counting",
      "Only work on your own types — you cannot extend types defined in the standard library or in third-party frameworks you don't own",
      "Replace a type's existing methods with updated implementations, as long as the replacement has an identical signature and return type",
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
      "Yes — extensions can add any property type, since the extension's backing storage is automatically allocated alongside the original type's memory",
      "Yes, but only for value types, because the compiler can reserve extra space in the struct's inline storage when an extension adds a new field",
      "Only if String were a class, because reference types can use associated object storage to attach new ivars from outside the original declaration",
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
      "It's the only place conformance is allowed — the compiler rejects protocol conformances listed directly in the main type declaration",
      "It makes the type a class, enabling dynamic dispatch for the newly conformed protocol's requirements across the inheritance hierarchy",
      "It avoids implementing the requirements, because the extension provides stubs that automatically satisfy the protocol without any real method bodies",
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
      "Extensions are the only place inits are allowed for structs, since the main declaration is reserved for property definitions and protocol conformances",
      "It makes the init failable automatically, returning nil whenever the custom logic determines the arguments don't produce a valid instance",
      "It converts the struct to a class internally, enabling the custom initializer to call super.init() up the inheritance chain before setting its own stored properties",
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
      "Conforming your own type to your own protocol via extension rather than in the main declaration — always safe and the standard organization idiom",
      "Removing a conformance at runtime by casting the type to a narrower protocol that omits the requirement you want to suppress",
      "A deprecated Swift feature removed in Swift 5 in favor of conditional conformance with explicit where clauses that scope the conformance precisely",
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
      "To make types private by placing them inside an extension that has a narrower access control level than the main declaration",
      "To reduce binary size, because the linker can strip an entire extension block if none of its members are referenced from other modules",
      "To disable methods conditionally by wrapping the extension in a compile-time flag, so the methods vanish entirely in release builds",
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
      "Yes — extensions override existing members freely, and the new implementation silently shadows the original for all call sites in the same module",
      "Yes, but only computed properties can be overridden via an extension; stored properties and methods retain the original type's implementation",
      "Only for classes, since class extensions participate in the vtable and can replace method dispatch entries that subclasses then inherit",
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
