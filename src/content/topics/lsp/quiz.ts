import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "lsp-definition",
    type: "mcq",
    prompt: "What does the Liskov Substitution Principle require?",
    options: [
      "A subtype must be usable anywhere the base type is expected without changing the program's correctness — behavioral, not just structural, compatibility",
      "A subtype must override every method of its base type",
      "A subtype must have fewer methods than its base type",
      "A subtype must always be a struct, never a class",
    ],
    answer: 0,
    explanation:
      "LSP is about behavioral subtyping: compiling with the right method signatures isn't enough — the subtype must honor the base type's behavioral promises too.",
  },
  {
    id: "lsp-predict-square",
    type: "predict",
    prompt: "What does this print?",
    code: `class Rectangle {
    var width: Double
    var height: Double
    init(width: Double, height: Double) {
        self.width = width; self.height = height
    }
}
class Square: Rectangle {
    override var width: Double { didSet { height = width } }
    override var height: Double { didSet { width = height } }
}
func doubleWidth(of rect: Rectangle) { rect.width *= 2 }

let square = Square(width: 4, height: 4)
doubleWidth(of: square)
print(square.width, square.height)`,
    options: [
      "8, 8 — Square's own invariant forces height to follow width, silently breaking doubleWidth's assumption",
      "8, 4 — height is untouched as doubleWidth intends",
      "Compile error — Square cannot override var properties",
      "4, 4 — width never actually changes",
    ],
    answer: 0,
    explanation:
      "Square keeps width and height equal via didSet, so doubling width also silently doubles height — violating the implicit contract that doubleWidth relied on (that height stays independent).",
  },
  {
    id: "lsp-precondition-fill",
    type: "fill",
    prompt: "A subtype may only ___ preconditions — accepting everything the base type accepted, and optionally more.",
    answers: ["weaken"],
    hint: "The opposite of 'strengthen'.",
    explanation:
      "Preconditions may only be weakened (relaxed) in a subtype. A subtype that rejects inputs the base type accepted breaks LSP.",
  },
  {
    id: "lsp-postcondition-mcq",
    type: "mcq",
    prompt: "Per LSP's design-by-contract rules, what may a subtype do to the base type's postconditions?",
    options: [
      "Only strengthen or preserve them — never guarantee less than the base type promised",
      "Only weaken them, to be more flexible",
      "Remove them entirely as long as the method still compiles",
      "Postconditions don't apply to subtypes, only preconditions do",
    ],
    answer: 0,
    explanation:
      "Postconditions may only be strengthened or kept the same. A subtype that promises less — like UnsortedList.add() no longer keeping the list sorted — violates LSP even though it compiles.",
  },
  {
    id: "lsp-penguin-multi",
    type: "multi",
    prompt: "Select all the ways the Penguin/Bird example below violates LSP.",
    options: [
      "Penguin.fly() strengthens the precondition by adding a hidden 'don't call this on a penguin' requirement",
      "Penguin.fly() weakens the postcondition — the base type promised flight would happen, and it no longer does",
      "Code written against Bird has no way to know to avoid calling fly() on a Penguin",
      "This is not an LSP issue because Penguin still compiles as a valid Bird subclass",
    ],
    answers: [0, 1, 2],
    explanation:
      "Penguin adds an undocumented requirement (precondition strengthening) and fails to deliver on the promise of flight (postcondition weakening), both invisible to callers coding against Bird. Compiling fine is exactly why LSP violations are dangerous (option 3 is false as a defense).",
  },
  {
    id: "lsp-fix-mcq",
    type: "mcq",
    prompt: "What's the recommended fix for the classic Rectangle/Square LSP violation?",
    options: [
      "Stop modeling Square as a Rectangle subclass; give both their own type conforming to a shared protocol like HasArea that only promises what's actually declared",
      "Add a runtime check inside Square that throws if width and height ever differ",
      "Make Rectangle's width and height properties private so Square can't override them",
      "There is no fix; Square and Rectangle must never coexist in the same codebase",
    ],
    answer: 0,
    explanation:
      "The is-a relationship holds geometrically but not behaviorally, so inheritance is the wrong tool. A protocol that only promises area avoids ever implying width/height independence, so no conformance can violate a promise that was never made.",
  },
  {
    id: "lsp-protocols-apply-fill",
    type: "fill",
    prompt: "LSP applies not only to class inheritance but to any protocol ___ — a conforming type can still break the protocol's implicit behavioral promises even while matching every method signature.",
    answers: ["conformance", "conformances"],
    hint: "The relationship a type has to a protocol it implements.",
    explanation:
      "Swift's protocol-oriented style means LSP violations often show up in protocol conformances, not just class hierarchies — as BrokenCache demonstrates by compiling cleanly while breaking the store/value contract.",
  },
  {
    id: "lsp-brokencache-senior",
    type: "predict",
    prompt: "🧠 BrokenCache conforms to `Cache` (store/value) but value(for:) returns storage.randomElement()?.value instead of the value for the given key. Why is this dangerous specifically as an LSP violation rather than a simple bug?",
    code: `protocol Cache {
    func store(_ value: String, for key: String)
    func value(for key: String) -> String?
}
class BrokenCache: Cache {
    private var storage: [String: String] = [:]
    func store(_ value: String, for key: String) { storage[key] = value }
    func value(for key: String) -> String? {
        storage.randomElement()?.value
    }
}`,
    options: [
      "It type-checks perfectly and conforms to Cache with correct signatures, so the type checker and a superficial review can't catch it — only behavioral testing can",
      "It fails to compile because randomElement() isn't allowed in protocol conformances",
      "It's not actually an LSP issue since Cache is a protocol, not a class",
      "Swift automatically detects postcondition violations for Dictionary-backed types",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "This is the core danger of LSP violations: they're invisible to the compiler and to signature-level review. BrokenCache satisfies Cache's shape perfectly while breaking the behavioral promise that store-then-value round-trips correctly — only a test that checks actual behavior catches it.",
  },
  {
    id: "lsp-flashcard",
    type: "flashcard",
    prompt: "Explain the Liskov Substitution Principle, the rectangle/square trap, and the precondition/postcondition rules. Answer aloud, then reveal.",
    modelAnswer:
      "**LSP** requires that a subtype be substitutable for its base type anywhere the base type is used, without breaking the program's correctness — this is **behavioral subtyping**, stronger than merely matching method signatures, which is why violations still compile. The classic example is **Square inheriting from Rectangle**: `Square` compiles fine but breaks `Rectangle`'s implicit contract that width and height vary independently, because a square must keep them equal. The fix isn't a cleverer subclass — it's recognizing the is-a relationship is geometric, not behavioral, and modeling shared capability with a **protocol** (like `HasArea`) that only promises what it explicitly declares. The precise rules, from design-by-contract: a subtype may only **weaken preconditions** (accept everything the base type accepted, or more) and must **strengthen or preserve postconditions** (guarantee everything the base type guaranteed, or more) — never the reverse. `Penguin.fly()` fatal-erroring strengthens a precondition invisibly; `UnsortedList.add()` no longer keeping order weakens a postcondition. Both compile cleanly. LSP violations aren't caught by the type checker, only by testing actual behavior against the contract callers assumed — this applies just as much to protocol conformances (like a cache that returns wrong data) as to class inheritance.",
    keyPoints: [
      "Substitutability is behavioral, not just structural (signature-matching)",
      "Rectangle/Square: is-a holds geometrically, fails behaviorally — fix with a protocol, not a subclass",
      "Preconditions may only weaken; postconditions may only strengthen/stay the same",
      "Violations compile cleanly — only behavioral testing catches them",
      "Applies to protocol conformances too, not just class inheritance",
    ],
    explanation:
      "A senior answer states the precondition/postcondition rule precisely, explains why the type checker can't catch violations, and extends LSP beyond class inheritance to protocol conformance.",
  },
];

export default quiz;
