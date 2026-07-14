import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "protocol-any-type",
    type: "mcq",
    prompt: "Which kinds of types can conform to a Swift protocol?",
    options: [
      "Structs, enums, classes, and actors",
      "Only classes, because protocol dispatch requires a vtable that only reference types can provide",
      "Only reference types, since value-type copies would each hold a different witness table and lose identity",
      "Only types with a superclass, because protocol conformance is inherited from the base class entry in the vtable",
    ],
    answer: 0,
    explanation:
      "Any type can conform — that's a key advantage over class inheritance: value types (structs/enums) and actors get polymorphism too, not just classes.",
  },
  {
    id: "default-impl",
    type: "mcq",
    prompt: "How do you give conforming types default behavior for a protocol?",
    options: [
      "Provide the implementation in a protocol extension",
      "Add a stored property directly to the protocol body, which conformers inherit like a base-class ivar",
      "Subclass the protocol — protocols support inheritance, and the child protocol inherits default method bodies",
      "You can't — the Swift compiler requires every conforming type to implement every requirement explicitly",
    ],
    answer: 0,
    explanation:
      "A **protocol extension** supplies default implementations. Conformers get them for free and may override. This is how POP shares implementation horizontally without a base class.",
  },
  {
    id: "protocol-composition-fill",
    type: "fill",
    prompt: "Require conformance to two protocols at once with the ___ operator: `Drawable ___ Codable`.",
    answers: ["&"],
    hint: "A single symbol used for composition.",
    explanation:
      "`Drawable & Codable` is protocol composition — demand multiple capabilities without creating a combined protocol or class hierarchy.",
  },
  {
    id: "pop-vs-oop",
    type: "mcq",
    prompt: "What's the core idea of protocol-oriented programming vs class inheritance?",
    options: [
      "Model capabilities as protocols and share defaults via extensions, favoring composition over deep inheritance",
      "Never use structs — all polymorphic types must be classes that share a base-class implementation",
      "Always subclass a base class and override methods to vary behavior, keeping one hierarchy per abstraction",
      "Avoid polymorphism entirely by duplicating logic in each type so the compiler can optimize each independently",
    ],
    answer: 0,
    explanation:
      "POP composes small protocols and shares implementation through extensions, working across all type kinds — avoiding the one-superclass and fragile-base-class problems of OOP inheritance.",
  },
  {
    id: "property-requirement",
    type: "predict",
    prompt: "Is this a valid protocol requirement?",
    code: `protocol HasArea {
    var area: Double { get }
}`,
    options: [
      "Yes — a read-only property requirement; conformers must provide `area`",
      "No — protocols can't have properties; only methods and initializer requirements are allowed in a protocol body",
      "No — it needs a stored value because { get } requirements can only be satisfied by a stored property, not computed ones",
      "Only if HasArea is a class protocol restricted with `AnyObject`, since property requirements need reference-type semantics",
    ],
    answer: 0,
    explanation:
      "Protocols declare property requirements with `{ get }` (readable) or `{ get set }` (read-write). They specify capability, not storage — a conformer can satisfy `{ get }` with a stored or computed property.",
  },
  {
    id: "protocols-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about protocols.",
    options: [
      "Protocol extensions can add methods conformers didn't declare",
      "A generic constraint `<T: P>` is generally faster than an existential `any P`",
      "Protocols can require methods, properties, and initializers",
      "Only classes can adopt protocols",
    ],
    answers: [0, 1, 2],
    explanation:
      "Extension bonus methods, generic-constraint performance, and varied requirements are correct. **Any** type can adopt a protocol, not only classes (option 3 is false).",
  },
  {
    id: "static-dispatch-extension-senior",
    type: "predict",
    prompt: "🧠 Trick question — what prints?",
    code: `protocol Greeter {}
extension Greeter {
    func hi() { print("protocol") }   // extension-only, NOT a requirement
}
struct A: Greeter {
    func hi() { print("A") }
}
let g: Greeter = A()
g.hi()`,
    options: [
      "protocol — extension-only methods use static dispatch by the declared type (Greeter)",
      "A — the concrete struct always wins at runtime because Swift picks the most derived implementation available",
      "Compile error — a method that appears in both the extension and the conforming type creates an ambiguity the compiler rejects",
      "Both are printed in order: first the extension version, then the conforming type's override via dynamic dispatch",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`hi()` exists only in the extension, not as a protocol requirement, so it's dispatched **statically** by the variable's declared type `Greeter` — printing `protocol`. To get `A` (dynamic dispatch), declare `func hi()` in the protocol body as a requirement.",
  },
  {
    id: "constraint-vs-existential-senior",
    type: "mcq",
    prompt: "When should you use a generic constraint `<T: P>` instead of an existential `any P`?",
    options: [
      "When a call site works with a single concrete type — it enables static dispatch/specialization and avoids boxing",
      "When you need a heterogeneous array of different conformers stored together in a single collection at runtime",
      "Never — existentials are always better because they defer the concrete type decision until runtime for maximum flexibility",
      "Only for class-bound protocols, since generic constraints on value types cause excessive copy overhead in specializations",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A generic constraint keeps the concrete type known at compile time (faster, specializable, no box). Use an **existential (`any P`)** only when you truly need a mixed collection of different conforming types, accepting dynamic dispatch and boxing overhead.",
  },
  {
    id: "requirement-for-dynamic-senior",
    type: "mcq",
    prompt: "You want a conformer's override of a protocol method to be called even through a protocol-typed variable. What must you do?",
    options: [
      "Declare the method as a requirement in the protocol body (not only in an extension)",
      "Mark the extension method `final` to force the compiler to always bind to the conformer's version at compile time",
      "Use a class-only protocol (`AnyObject`), since class types always get dynamic dispatch for protocol methods",
      "Nothing — extension methods always dispatch dynamically, so the conformer's override is always picked automatically",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Only methods that are **protocol requirements** get a witness-table entry and thus dynamic dispatch through the protocol type. A method living solely in an extension is statically dispatched by declared type, so the conformer's version is ignored via a `P` reference.",
  },
  {
    id: "protocols-flashcard",
    type: "flashcard",
    prompt:
      "Explain protocol-oriented programming, default implementations, and the dispatch/constraint gotchas. Answer aloud, then reveal.",
    modelAnswer:
      "**Protocols** are contracts (method/property/init/associated-type requirements) any type — struct, enum, class, actor — can adopt, so value types get polymorphism too. **Protocol extensions** supply **default implementations**, letting POP share behavior **horizontally** across unrelated types without a base class (the core of protocol-oriented programming: compose small protocols, favor composition over deep inheritance). Compose capabilities with **`&`** (`Drawable & Codable`). Two senior gotchas: **dispatch** — a method that's a **protocol requirement** is dynamically dispatched (conformer's override wins), but a method that lives **only in an extension** (not a requirement) is **statically** dispatched by the variable's *declared type*, so a conformer's 'override' is ignored through a protocol-typed reference (declare it as a requirement to fix). And **protocol as constraint vs existential**: a generic constraint `<T: P>` keeps the concrete type known at compile time (fast, specializable, no boxing) — prefer it; an existential **`any P`** boxes a value for **heterogeneous** use with dynamic dispatch — use only when you need a mixed collection.",
    keyPoints: [
      "Protocols = contracts adoptable by any type (value types included)",
      "Protocol extensions provide default implementations (horizontal reuse)",
      "Compose with & ; POP favors composition over inheritance",
      "Requirement → dynamic dispatch; extension-only method → static dispatch by declared type",
      "Constraint <T:P> (fast, compile-time) vs existential any P (boxed, heterogeneous)",
    ],
    explanation:
      "Senior answers nail the extension-only static-dispatch gotcha and the generic-constraint-vs-existential trade-off, not just 'protocols are interfaces'.",
  },
];

export default quiz;
