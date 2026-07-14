import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "strategy-intent",
    type: "mcq",
    prompt: "What is the core intent of the strategy pattern?",
    options: [
      "Split an algorithm into a fixed skeleton and a swappable piece behind a shared interface, so new behavior is added without editing existing code",
      "Ensure only one instance of a class ever exists, so every caller in the app shares the same mutable global state throughout the entire app lifetime",
      "Notify a registered list of listeners whenever a subject's state changes, broadcasting each event to every observer in the order they subscribed",
      "Wrap an incompatible legacy interface behind one that matches what a client expects, translating old method signatures without altering the underlying implementation",
    ],
    answer: 0,
    explanation:
      "Strategy isolates the *varying* part of a computation (the algorithm) behind a common interface, so the consuming code stays untouched when a new variant is added.",
  },
  {
    id: "strategy-predict-swap",
    type: "predict",
    prompt: "What does this print?",
    code: `protocol DiscountStrategy { func apply(to subtotal: Decimal) -> Decimal }
struct NoDiscount: DiscountStrategy { func apply(to subtotal: Decimal) -> Decimal { subtotal } }
struct MemberDiscount: DiscountStrategy { func apply(to subtotal: Decimal) -> Decimal { subtotal * 0.9 } }

class Cart {
    var subtotal: Decimal = 100
    var discountStrategy: DiscountStrategy = NoDiscount()
    func total() -> Decimal { discountStrategy.apply(to: subtotal) }
}

let cart = Cart()
cart.discountStrategy = MemberDiscount()
print(cart.total())`,
    options: ["90", "100", "0.9", "Compile error"],
    answer: 0,
    explanation:
      "Swapping `discountStrategy` to `MemberDiscount` changes what `total()` computes without any change to `Cart` itself: 100 * 0.9 = 90.",
  },
  {
    id: "strategy-closure-fill",
    type: "fill",
    prompt: "When a strategy is really just a single stateless function, Swift lets you skip the protocol entirely and store the strategy as a ___ instead.",
    answers: ["closure"],
    hint: "A block of code you can store in a variable and call later.",
    explanation:
      "A closure works well as a lightweight strategy when there's no state to hold and only one operation to perform — no protocol/conformer boilerplate needed.",
  },
  {
    id: "strategy-protocol-vs-closure-mcq",
    type: "mcq",
    prompt: "When should you prefer a protocol-based strategy over a closure-based one?",
    options: [
      "When the strategy needs its own stored properties or more than one related method",
      "Always — protocols are strictly better than closures because they provide stronger type constraints and better compiler diagnostics",
      "Never — closures are always sufficient for strategy, and protocols just add unnecessary conformance boilerplate around a single function",
      "Only when the strategy needs to be Codable, because closures cannot conform to Codable and serializing them requires a named type",
    ],
    answer: 0,
    explanation:
      "A closure captures values but can't expose multiple named methods or several stored properties the way a struct/class conforming to a protocol can — e.g. a strategy that needs both a discount percentage and a `freeShipping` flag.",
  },
  {
    id: "strategy-add-new-rule-predict",
    type: "predict",
    prompt: "A new 'HolidayDiscount: flat $15 off' rule needs to be added to the Cart from the lesson's protocol-based example. How many lines inside Cart's total() method need to change?",
    code: `class Cart {
    var subtotal: Decimal = 100
    var discountStrategy: DiscountStrategy = NoDiscount()
    func total() -> Decimal { discountStrategy.apply(to: subtotal) }
}`,
    options: [
      "Zero — add a new struct conforming to DiscountStrategy and assign it",
      "One line, to add a new case to a switch inside total() mapping the new tier to its discount logic",
      "Two lines, to add both the new case to the switch and the arithmetic calculation beneath it",
      "total() needs a full rewrite because the discount logic is entangled with Cart's subtotal property"
    ],
    answer: 0,
    explanation:
      "That's the payoff of strategy: total() has no branching logic to edit. A brand-new HolidayDiscount type is added alongside the others and total() is untouched.",
  },
  {
    id: "strategy-truths-multi",
    type: "multi",
    prompt: "Select all statements that are true of the strategy pattern in Swift.",
    options: [
      "Array's sorted(by:) accepting a comparison closure is a real-world example of strategy",
      "The decision of which strategy to use still has to happen somewhere, usually in a small factory function",
      "Strategy requires the varying algorithms to be classes, never structs",
      "JSONEncoder's dateEncodingStrategy is another real-world example of the pattern",
    ],
    answers: [0, 1, 3],
    explanation:
      "Strategies are commonly structs (they're often stateless value types). sorted(by:) and dateEncodingStrategy are both genuine strategy-pattern examples in the standard library/Foundation.",
  },
  {
    id: "strategy-vs-observer-senior",
    type: "mcq",
    prompt: "How does strategy differ from observer in what problem it solves?",
    options: [
      "Strategy swaps which algorithm runs for a single call; observer broadcasts an event to many listeners after something happens",
      "They solve the same problem with different syntax — both let you vary behavior at runtime, just naming the participants differently",
      "Strategy is always implemented with NotificationCenter, while observer uses a direct protocol-delegation approach instead",
      "Observer requires a protocol; strategy never does and always relies on a closure or enum switch inside the host type",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Strategy is about *how* a single operation computes its result — one active implementation at a time. Observer is about *notifying* possibly many listeners that something already happened. Different shapes for different problems.",
  },
  {
    id: "strategy-leak-senior",
    type: "predict",
    prompt: "🧠 A teammate 'simplifies' Cart by adding this. What design problem does it reintroduce?",
    code: `class Cart {
    var subtotal: Decimal = 100
    var customerTier: CustomerTier = .regular

    func total() -> Decimal {
        switch customerTier {
        case .regular: return subtotal
        case .member: return subtotal * 0.9
        case .vip: return subtotal * 0.8
        }
    }
}`,
    options: [
      "It brings the branching logic back inside Cart, defeating the point of extracting strategies — every new tier now requires editing total() again",
      "Nothing — this is fully equivalent to the strategy version because a switch and a protocol dispatch compile down to the same machine instructions",
      "It's a compile error because CustomerTier hasn't been defined as a protocol-backed type that Cart can switch over",
      "It only affects performance, not design, since the switch is marginally faster than a dynamic protocol dispatch through a stored property"
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "This collapses the abstraction: the whole reason to extract DiscountStrategy conformers was so Cart never has to change when a new pricing rule appears. Inlining the switch back into total() reintroduces the original problem.",
  },
  {
    id: "strategy-flashcard",
    type: "flashcard",
    prompt: "Explain the strategy pattern, how protocol- and closure-based strategies differ, and give real Swift examples. Answer aloud, then reveal.",
    modelAnswer:
      "The **strategy pattern** splits an algorithm into a fixed skeleton (the part that never changes) and a swappable piece (the part that varies) behind a shared interface — usually a protocol with one core method. The consuming type holds a reference to a strategy and calls it without knowing which concrete implementation it has, so adding a new variant means writing a new conformer, not editing existing code. In Swift, a strategy can be a **protocol conformer** (a struct/class implementing the protocol) when it needs its own state or multiple related methods, or a **closure** when it's really just a single stateless function — trading a bit of boilerplate for flexibility. The decision of *which* strategy to use still has to happen somewhere, typically in one small factory function, rather than being scattered as branching logic through the consumer. Real Swift/Foundation examples: `Array.sorted(by:)` takes a comparison closure as a sort strategy, `JSONEncoder.dateEncodingStrategy` swaps date-encoding behavior, and SwiftUI's `ButtonStyle` swaps rendering behavior — all interchangeable algorithms plugged into a fixed skeleton.",
    keyPoints: [
      "Fixed skeleton + swappable algorithm behind a shared interface",
      "New behavior added via new conformer, no edits to existing code",
      "Protocol strategy for stateful/multi-method behavior; closure for single stateless function",
      "The 'which strategy' decision moves to one factory, not scattered branching",
      "Real examples: sorted(by:), dateEncodingStrategy, ButtonStyle",
    ],
    explanation:
      "A senior answer connects the pattern to concrete standard-library usage and explains the protocol-vs-closure trade-off in terms of state and method count, not preference.",
  },
];

export default quiz;
