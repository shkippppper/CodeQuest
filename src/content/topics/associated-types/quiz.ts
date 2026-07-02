import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "associatedtype-purpose",
    type: "mcq",
    prompt: "What does `associatedtype Item` in a protocol do?",
    options: [
      "Declares a type placeholder each conformer fills in, making the protocol generic",
      "Creates a stored property",
      "Requires the conformer to be a class",
      "Defines a default implementation",
    ],
    answer: 0,
    explanation:
      "An `associatedtype` is a per-conformer type placeholder. `IntStack` sets `Item = Int`; `Sequence` uses `Element`. It makes the protocol itself generic over that type.",
  },
  {
    id: "pat-canonical",
    type: "mcq",
    prompt: "Which standard protocol is a classic example of a protocol with an associated type?",
    options: [
      "`Sequence` (associated type `Element`)",
      "`CustomStringConvertible`",
      "`AnyObject`",
      "`Void`",
    ],
    answer: 0,
    explanation:
      "`Sequence`/`IteratorProtocol` (`Element`), `Collection`, and `Identifiable` (`ID`) all have associated types. `CustomStringConvertible` does not.",
  },
  {
    id: "pat-limitation",
    type: "predict",
    prompt: "🧠 Trick question — why does this classically fail to compile?",
    code: `protocol Container { associatedtype Item; var count: Int { get } }
let c: Container = someContainer`,
    options: [
      "A protocol with an associated type (or Self requirement) can't be used as a plain existential — the box hides Item",
      "Container isn't a real protocol",
      "someContainer isn't initialized",
      "count must be a var",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The classic error: 'can only be used as a generic constraint because it has Self or associated type requirements.' An existential `Container` would hide *which* `Item` it uses, so the compiler can't type-check requirements. Use it as a constraint (`<C: Container>`) or erase it. (Modern `any Container<Int>` relaxes this.)",
  },
  {
    id: "pat-as-constraint",
    type: "mcq",
    prompt: "What's the idiomatic way to accept any `Container` in a function?",
    options: [
      "A generic constraint: `func f<C: Container>(_ c: C)`",
      "`func f(_ c: Container)`",
      "`func f(_ c: Any)`",
      "You can't accept a Container at all",
    ],
    answer: 0,
    explanation:
      "Use a generic constraint so the concrete `C` and its `Item` are known at compile time. Add `where C.Item == Int` to constrain the associated type further.",
  },
  {
    id: "type-eraser-fill",
    type: "fill",
    prompt: "The standard-library type eraser that wraps any Sequence as one concrete type is `Any___<Element>`.",
    answers: ["Sequence", "AnySequence"],
    hint: "Any____ — hides the concrete Sequence type.",
    explanation:
      "`AnySequence<Element>` erases the underlying sequence's concrete type. Other erasers: `AnyIterator`, `AnyHashable`, SwiftUI's `AnyView`, Combine's `AnyPublisher`.",
  },
  {
    id: "associated-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements.",
    options: [
      "A protocol becomes 'PAT/Self-constrained' if it has an associatedtype or a Self requirement",
      "Type erasure lets you store a PAT value as a concrete, storable type",
      "AnyView is a type eraser used in SwiftUI",
      "You can freely use any PAT as a plain existential type with no restrictions (pre-any)",
    ],
    answers: [0, 1, 2],
    explanation:
      "Associated-type/Self requirements, erasure for storability, and AnyView are correct. Historically you could NOT use a PAT as a plain existential — that's the whole reason erasers exist (option 3 is false).",
  },
  {
    id: "self-requirement-senior",
    type: "mcq",
    prompt: "Besides `associatedtype`, what other kind of requirement makes a protocol unusable as a plain existential (classically)?",
    options: [
      "A requirement that uses `Self` (e.g. Equatable's `static func == (Self, Self) -> Bool`)",
      "Any method requirement",
      "A read-only property",
      "A default implementation",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Self` requirements (like `Equatable`/`Comparable`) have the same issue: an existential can't guarantee two boxes hold the *same* concrete type, so `==` isn't well-typed. Hence `Equatable` was constraint-only classically (and `AnyHashable` exists to erase `Hashable`).",
  },
  {
    id: "eraser-mechanism-senior",
    type: "mcq",
    prompt: "How does a hand-rolled type eraser typically work?",
    options: [
      "A concrete wrapper stores closures capturing the underlying conformer's methods, exposing only the associated types you need",
      "It subclasses the protocol",
      "It uses runtime reflection to copy methods",
      "It converts the value to a String",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The classic pattern: `AnyContainer<Item>` stores closures like `_subscriptAt = { base[$0] }` capturing the base conformer, forwarding calls while hiding the concrete type. This yields a storable, homogeneous-`Item` value you can put in arrays or return.",
  },
  {
    id: "modern-any-senior",
    type: "mcq",
    prompt: "How has modern Swift reduced the need for custom type erasers?",
    options: [
      "`any Protocol<PrimaryAssociatedType>` (e.g. `any Collection<Int>`) lets you use constrained existentials directly",
      "It removed associated types entirely",
      "It made all protocols classes",
      "It auto-generates erasers for every protocol",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "With **primary associated types**, you can write `any Collection<Int>` — a constrained existential that specifies the associated type — so many cases that once required a hand-rolled eraser now work with `any`. Erasers are still useful for older protocols or closure-capturing needs.",
  },
  {
    id: "associated-flashcard",
    type: "flashcard",
    prompt:
      "Explain associated types, the existential limitation, and type erasure. Answer aloud, then reveal.",
    modelAnswer:
      "An **`associatedtype`** is a **type placeholder** that makes a protocol generic — each conformer supplies the concrete type (`Sequence.Element`, `Identifiable.ID`). A protocol with an associated type **or a `Self` requirement** (like `Equatable`'s `==(Self, Self)`) classically **can't be used as a plain existential type** — an existential box would hide *which* associated/Self type it holds, so the compiler can't type-check the requirements. The idiomatic uses are as a **generic constraint** (`func f<C: Container>(_ c: C)`, refined with `where C.Item == Int`). When you must **store or return** such a value as one concrete type (heterogeneous collections, hiding an iterator/view type), you use **type erasure**: a concrete wrapper conforming to the protocol that forwards to any underlying conformer (typically by capturing it in closures), exposing only the associated types you need. The stdlib ships `AnySequence`/`AnyIterator`/`AnyHashable`, SwiftUI has `AnyView`, Combine has `AnyPublisher`. Modern Swift's **`any Protocol<PrimaryAssociatedType>`** (e.g. `any Collection<Int>`) relaxes the old restriction and reduces the need for hand-rolled erasers.",
    keyPoints: [
      "associatedtype = per-conformer type placeholder (makes protocol generic)",
      "PAT / Self-requirement protocols can't be plain existentials (classically)",
      "Use as a generic constraint (<C: P>, where C.Assoc == …)",
      "Type erasure wraps a conformer in a concrete type (AnySequence, AnyView…)",
      "Hand-rolled eraser captures base in closures; modern any P<T> relaxes it",
    ],
    explanation:
      "Senior answers connect the existential limitation (Self/associated type) to why erasers exist, describe the closure-capturing eraser, and mention modern any-with-primary-associated-types.",
  },
];

export default quiz;
