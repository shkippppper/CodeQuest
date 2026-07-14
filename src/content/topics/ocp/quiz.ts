import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ocp-definition",
    type: "mcq",
    prompt: "What does the Open/Closed Principle say?",
    options: [
      "A type should be open for extension but closed for modification — new behavior shouldn't require editing existing, working code",
      "A type should always be marked `final` so no subclass can accidentally override its carefully tested behavior and introduce hard-to-find regressions",
      "A type should never be extended after it's written",
      "A type's properties should always be private",
    ],
    answer: 0,
    explanation:
      "OCP asks for a seam where new behavior can be added (open for extension) without editing the logic that already handles existing cases (closed for modification).",
  },
  {
    id: "ocp-smell-mcq",
    type: "mcq",
    prompt: "Which pattern is the classic giveaway that code violates OCP?",
    options: [
      "A growing if/else or switch chain that branches on 'what kind of thing is this'",
      "A struct that conforms to Codable and auto-synthesizes both encoding and decoding from its stored properties",
      "A function with more than one parameter",
      "Using `let` instead of `var`",
    ],
    answer: 0,
    explanation:
      "Branching on type identity inside shared logic means every new case requires editing that shared function — the opposite of closed for modification.",
  },
  {
    id: "ocp-predict-bogo",
    type: "predict",
    prompt: "PriceCalculator.finalPrice takes a DiscountStrategy protocol. A new BOGODiscount type is added that conforms to it. Does finalPrice's code need to change?",
    code: `protocol DiscountStrategy {
    func apply(to subtotal: Decimal) -> Decimal
}
struct PriceCalculator {
    func finalPrice(for order: Order, discount: DiscountStrategy) -> Decimal {
        discount.apply(to: order.subtotal)
    }
}
struct BOGODiscount: DiscountStrategy {
    func apply(to subtotal: Decimal) -> Decimal { subtotal }
}`,
    options: [
      "No — finalPrice already works with any DiscountStrategy, including ones written after it",
      "Yes — a new case must be added to a switch inside finalPrice to handle the new discount type",
      "Yes — Swift requires re-declaring the protocol for each new conformer",
      "It depends on whether BOGODiscount is a class or a struct",
    ],
    answer: 0,
    explanation:
      "finalPrice depends only on the DiscountStrategy protocol, not on any concrete type, so a brand-new conforming type plugs in with zero changes to finalPrice — this is OCP in action.",
  },
  {
    id: "ocp-strategy-fill",
    type: "fill",
    prompt: "Swapping an algorithm's behavior by handing in a different object conforming to a shared protocol, instead of branching on a type flag, is a design pattern called the ___ pattern.",
    answers: ["strategy", "Strategy"],
    hint: "Same name as the lesson section that introduces it.",
    explanation:
      "Strategy is the common implementation vehicle for OCP in Swift: define a protocol for the varying operation, give each variant its own conforming type.",
  },
  {
    id: "ocp-multi-truths",
    type: "multi",
    prompt: "Select all true statements about OCP and its trade-offs.",
    options: [
      "A switch over a closed, genuinely fixed enum gets free exhaustiveness checking from the compiler",
      "OCP means every type in a codebase must use protocols instead of concrete types",
      "A protocol with only one conforming type added purely 'for OCP's sake' is premature abstraction",
      "OCP is most valuable when the set of cases is open-ended and other code may need to add new ones",
    ],
    answers: [0, 2, 3],
    explanation:
      "Exhaustiveness checking is a real advantage of switch/enum for closed sets, and adding a protocol before a second case exists is premature. OCP is not a blanket rule to protocol-ify everything (option 1 is false) — it's for open-ended extension points.",
  },
  {
    id: "ocp-enum-vs-protocol-mcq",
    type: "mcq",
    prompt: "When is a switch over an enum often clearer than an OCP-style protocol hierarchy?",
    options: [
      "When the set of cases is genuinely fixed and closed, e.g. the four seasons or a small set of HTTP methods you support",
      "Never — protocols are always strictly better than enums because they allow external conformances and open-ended extensibility",
      "Only when there is exactly one case",
      "Only in unit tests",
    ],
    answer: 0,
    explanation:
      "For a truly closed case set, the compiler's exhaustiveness checking on a switch is a feature, not a limitation — OCP's extensibility isn't needed if nothing new is ever going to be added.",
  },
  {
    id: "ocp-shape-fill",
    type: "fill",
    prompt: "Pushing area calculation onto each Shape type itself, instead of a central switch, is an example of ___ — calling the same method name on different concrete types and getting each type's own behavior.",
    answers: ["polymorphism"],
    hint: "The general OOP mechanism that makes Strategy and OCP possible.",
    explanation:
      "Polymorphism lets `shape.area` resolve to the right calculation for whichever concrete Shape was passed in, without the caller branching on type.",
  },
  {
    id: "ocp-senior-hidden-branch",
    type: "predict",
    prompt: "🧠 A team applies OCP with a DiscountStrategy protocol, but a teammate later adds `if order.total > 1000 { discount = VIPDiscount() } else { discount = discount }` deep inside checkout business logic to \"just handle this one case.\" What's the concern?",
    code: `// deep inside checkout logic, far from where discounts are normally chosen
if order.total > 1000 {
    discount = VIPDiscount()
}`,
    options: [
      "The type-branching OCP was designed to eliminate has crept back in, just relocated to a place with less visibility and testing than before",
      "This is fine — DiscountStrategy's protocol dispatch already handles the VIP total threshold automatically without any manual branching in checkout",
      "This is a compile error because VIPDiscount doesn't conform to DiscountStrategy",
      "OCP forbids using if statements anywhere in the codebase",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "OCP moves the decision of *which* strategy to use out of the shared logic, but something still has to make that decision. If it sneaks back in as an ad hoc if-statement buried in business logic instead of living in configuration/DI/a factory, you've quietly recreated the exact problem OCP was meant to solve.",
  },
  {
    id: "ocp-flashcard",
    type: "flashcard",
    prompt: "Explain the Open/Closed Principle, how Strategy implements it in Swift, and when a switch/enum is the better choice instead. Answer aloud, then reveal.",
    modelAnswer:
      "**OCP** says a type should be **open for extension** (new behavior can be added) but **closed for modification** (adding it doesn't require editing code that already works). The classic violation is a growing `if/else` or `switch` chain that branches on *what kind of thing* something is — every new case means reopening and re-testing shared logic. The fix is **polymorphism** via a narrow **protocol**: define the one operation that varies, give each variant its own conforming type, and have shared logic depend only on the protocol. This is the **Strategy pattern** — swapping behavior by injecting a different conforming object rather than branching on a type flag. The trade-off: a `switch` over a genuinely closed `enum` gets free **exhaustiveness checking** from the compiler, which is actually preferable when the case set truly won't grow (e.g. days of the week). OCP earns its complexity specifically when the case set is **open-ended**, especially when code outside your control needs to add new cases without touching your shared logic. A protocol added before a second implementation exists is premature abstraction — and OCP doesn't disappear the decision of which concrete type to use, it just relocates it to configuration/DI, so watch for it sneaking back in as a hidden if-statement deep in business logic.",
    keyPoints: [
      "Open for extension, closed for modification — precise two-part definition",
      "Smell: branching on type identity in shared logic (if/else or switch chain)",
      "Fix: narrow protocol + polymorphism = Strategy pattern",
      "Switch/enum wins when the case set is genuinely closed (exhaustiveness checking)",
      "OCP relocates the 'which concrete type' decision — watch for it creeping back as a hidden branch",
    ],
    explanation:
      "A senior answer states both halves precisely, names Strategy explicitly, and can argue the enum/switch counter-case rather than treating OCP as an absolute rule.",
  },
];

export default quiz;
