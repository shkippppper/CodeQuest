import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ci-composition-definition",
    type: "mcq",
    prompt: "What is composition, as an alternative to inheritance?",
    options: [
      "Building a type's behavior by combining smaller, independent objects it holds, instead of subclassing a parent",
      "Writing every method inline in one giant class",
      "Using generics instead of protocols",
      "Overriding every method a superclass defines",
    ],
    answer: 0,
    explanation:
      "Composition means a type *has* objects that implement capabilities (and delegates to them) rather than *inheriting* those capabilities from a superclass.",
  },
  {
    id: "ci-single-parent-fill",
    type: "fill",
    prompt: "Swift classes can only inherit from a single ___, which is why combining several independent abilities through subclassing forces a combinatorial explosion of subclasses.",
    answers: ["parent", "superclass", "class"],
    hint: "The one-branch limitation of class inheritance.",
    explanation:
      "A class has exactly one superclass. When multiple independent abilities need combining, a single-parent tree needs a new subclass for every combination — protocols don't have this limit.",
  },
  {
    id: "ci-hasa-isa",
    type: "mcq",
    prompt: "A `Dragon` holds a `Wings` object that implements flying, rather than subclassing a `FlyingCharacter`. What relationship is this?",
    options: [
      "Has-a — Dragon has a flying capability, it isn't defined by it",
      "Is-a — Dragon is a kind of Wings",
      "Neither — this isn't a real relationship",
      "Is-a — Dragon is a kind of FlyingCharacter",
    ],
    answer: 0,
    explanation:
      "Has-a relationships (composition) fit when a type merely uses or contains a capability that could plausibly vary or be shared by unrelated types — flying isn't Dragon's identity, it's one thing Dragon does.",
  },
  {
    id: "ci-lsp-predict",
    type: "predict",
    prompt: "A function is written to accept a `FlyingCharacter` and calls `character.attack()`, expecting weapon-swinging behavior. A `FireBreathingFlyingCharacter` subclass overrides `attack()` to breathe fire instead. What happens when that subclass is passed in?",
    code: `func startBattle(_ character: FlyingCharacter) {
    character.attack()   // caller expects "swings a weapon" behavior
}`,
    options: [
      "The caller's assumption silently breaks — the override changed what attack() means, violating the Liskov Substitution Principle",
      "It's a compile error, since the override changes behavior",
      "Nothing changes — attack() always means the same thing regardless of override",
      "Swift automatically warns at runtime whenever a subclass overrides a method",
    ],
    answer: 0,
    explanation:
      "The subclass changed what `attack()` means without the caller knowing. A subclass should be substitutable anywhere its parent is expected without surprising the caller — this exact failure mode is why deep inheritance trees make Liskov substitution hard to guarantee.",
  },
  {
    id: "ci-protocol-default-fill",
    type: "fill",
    prompt: "In Swift, a protocol combined with an ___ can supply a default implementation for its requirements, so conforming types get working behavior for free instead of just a method signature.",
    answers: ["extension"],
    hint: "The mechanism used to attach a default implementation to a protocol.",
    explanation:
      "Extensions on a protocol can provide default implementations, so any conforming type automatically picks up that behavior without writing it itself — no subclassing required.",
  },
  {
    id: "ci-truths-multi",
    type: "multi",
    prompt: "Select all statements that are true about composition and protocol-oriented design in Swift.",
    options: [
      "A type can conform to many protocols at once, unlike inheriting from many superclasses",
      "Composition lets unrelated types (e.g. Dragon and Mermaid) reuse the same capability implementation without a shared class ancestor",
      "Composition means a type can never expose any behavior of the objects it holds",
      "Protocol extensions can supply default implementations that conforming types get automatically",
    ],
    answers: [0, 1, 3],
    explanation:
      "A type conforms to as many protocols as it needs, and different types can share the exact same capability implementation without inheriting from a common class. Option 2 is false — composed types routinely expose or delegate to the behavior they hold, that's the whole point of composition.",
  },
  {
    id: "ci-when-isa-fits-senior",
    type: "mcq",
    prompt: "When does inheritance (is-a) genuinely remain the right choice over composition?",
    options: [
      "When a subtype really behaves like a more specific version of its parent in every context the parent is used, e.g. a Square really is a Shape for every Shape operation",
      "Never — composition should always replace inheritance",
      "Whenever two types share even one method name",
      "Only for value types like structs",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Inheritance is appropriate when the is-a relationship holds without exception across every use of the parent type. It becomes a problem specifically when it's used to model a *capability* (something a type can do) rather than a true identity relationship.",
  },
  {
    id: "ci-tight-coupling-senior",
    type: "predict",
    prompt: "🧠 A team has a five-level-deep class hierarchy: Character → FlyingCharacter → FireBreathingFlyingCharacter → ArmoredFireBreathingFlyingCharacter → BossDragon. A bug fix changes a method on Character. What's the realistic risk, and what does composition avoid here?",
    code: `// five levels of subclassing, one change at the root`,
    options: [
      "The fix can ripple unpredictably through four subclasses that override or depend on it — tight coupling that composition avoids by keeping capabilities in small, independent, separately-testable objects",
      "Nothing — Swift guarantees subclass behavior is unaffected by superclass changes",
      "The compiler blocks the change until every subclass is manually reviewed",
      "Composition has the exact same risk, so there's no benefit either way",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Deep hierarchies create tight coupling — a base class change can silently affect behavior several layers down, especially where subclasses override methods. Composition sidesteps this: each capability (Flying, Attacking, Swimming) is a separate, independently testable object, so a change to one doesn't ripple through an inheritance chain that doesn't exist.",
  },
  {
    id: "ci-flashcard",
    type: "flashcard",
    prompt:
      "Explain the core problems with deep inheritance hierarchies and how composition with protocols addresses them in Swift. Answer aloud, then reveal.",
    modelAnswer:
      "**Inheritance** models 'what a thing is' as one fixed line of ancestry, which breaks down once a type needs multiple independent capabilities: Swift classes allow only a single superclass, so combining N independent abilities can force up to 2^N subclasses — the **combinatorial explosion** problem. Deep hierarchies also make it easy to violate the **Liskov Substitution Principle**: a subclass overriding a method can silently change what callers expect that method to mean, and a base-class change can ripple unpredictably through many subclasses (**tight coupling**). **Composition** fixes this by modeling 'what a thing can do' as small, independent objects a type *holds* and delegates to (a **has-a** relationship) instead of inherits (an **is-a** relationship). In Swift, capabilities are expressed as protocols, and **protocol-oriented composition** lets a type conform to as many protocols as it needs — with no single-parent ceiling — while protocol extensions supply default implementations so conforming types get working behavior for free. Unrelated types can then reuse the exact same capability implementation without sharing a class ancestor. Inheritance still fits when a subtype is genuinely a more specific version of its parent in every context; the mistake is defaulting to inheritance for capabilities rather than reaching for composition.",
    keyPoints: [
      "Inheritance: single-parent limit forces a combinatorial explosion when combining independent abilities",
      "Overriding in deep hierarchies risks violating Liskov substitution and creates tight coupling",
      "Composition: hold small objects that implement capabilities (has-a) instead of subclassing (is-a)",
      "Swift protocols + extensions give default implementations with no single-parent ceiling",
      "Is-a still fits genuine subtype relationships; the mistake is using inheritance to model capabilities",
    ],
    explanation:
      "A senior answer names the specific failure modes (combinatorial explosion, Liskov violations, tight coupling) rather than vaguely saying 'inheritance is bad', and states clearly when is-a still applies.",
  },
];

export default quiz;
