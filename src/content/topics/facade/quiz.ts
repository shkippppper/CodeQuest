import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "facade-what",
    type: "mcq",
    prompt: "What does the facade pattern provide?",
    options: [
      "A single, simple entry point that internally coordinates calls to several independent subsystems in the correct order",
      "A way to make a class impossible to subclass",
      "A caching layer for network requests only",
      "A protocol with no methods",
    ],
    answer: 0,
    explanation:
      "A facade is one type with a simplified interface that hides the coordination complexity of multiple subsystems behind a single method call.",
  },
  {
    id: "facade-hides-what",
    type: "mcq",
    prompt: "In the CheckoutFacade example, what does `placeOrder(cart:user:)` actually eliminate for callers?",
    options: [
      "The need for every call site to know the correct order to call inventory, pricing, payment, shipping, and notifications",
      "The need for InventoryService and PaymentGateway to exist at all",
      "The need for error handling anywhere in the app",
      "The need for a network connection",
    ],
    answer: 0,
    explanation:
      "The underlying subsystems still exist and do their own jobs. The facade's value is knowing (once, in one place) the correct sequence to call them in, instead of every call site duplicating that ordering logic.",
  },
  {
    id: "facade-fill",
    type: "fill",
    prompt: "The word facade comes from the front ___ of a building — you see one clean face, not the wiring and plumbing behind it.",
    answers: ["face", "wall"],
    hint: "What you literally see when you look at a building from outside.",
    explanation:
      "Facade means the front face of a building. The pattern's type plays the same role: one clean face in front of a messier set of subsystems.",
  },
  {
    id: "facade-vs-api-layer",
    type: "mcq",
    prompt: "What distinguishes a facade from a plain API layer (e.g. a `UserAPI` wrapping one network call)?",
    options: [
      "A facade coordinates multiple independent subsystems; an API layer typically translates the format of a single subsystem",
      "A facade is always a struct, an API layer is always a class",
      "There is no difference, they're the same pattern",
      "A facade must be a singleton",
    ],
    answer: 0,
    explanation:
      "An API layer usually wraps one subsystem and does format translation. A facade specifically earns its value from coordinating several independent subsystems' calls in the right order.",
  },
  {
    id: "facade-predict",
    type: "predict",
    prompt: "A second screen (\"reorder last purchase\") also needs to place an order. Does it need to know inventory must be reserved before the card is charged?",
    code: `let order = try await checkoutFacade.placeOrder(cart: cart, user: user)`,
    options: [
      "No — it just calls placeOrder, and the facade enforces the ordering internally",
      "Yes — every call site must replicate the reserve-before-charge order manually",
      "The order doesn't matter for correctness",
      "It must call PaymentGateway directly first",
    ],
    answer: 0,
    explanation:
      "The whole point of the facade is that the sequencing knowledge lives in one place. Callers don't need to know or replicate it.",
  },
  {
    id: "facade-truths-multi",
    type: "multi",
    prompt: "Select all true statements about the facade pattern.",
    options: [
      "A facade can expose only a subset of an underlying subsystem's full capabilities",
      "A facade must replace the subsystems it coordinates",
      "URLSession's data(from:) is a small facade in front of connection pooling, TLS, and redirect handling",
      "Deleting a facade should still leave a caller able to get the same result manually, just with more code",
    ],
    answers: [0, 2, 3],
    explanation:
      "A facade can be partial (option 0), and URLSession is a genuine real-world example (option 2). A real facade is pure convenience/coordination over subsystems that could still be called directly (option 3) — it does not replace the subsystems (option 1 is false).",
  },
  {
    id: "facade-god-object-senior",
    type: "mcq",
    prompt: "What's the risk of continuously adding unrelated methods to an existing facade over time?",
    options: [
      "It turns into a god object that no longer represents one coordinated workflow, undermining the reason it existed",
      "It becomes faster automatically",
      "Swift will refuse to compile it past a method count limit",
      "It automatically becomes thread-safe",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A facade should stay scoped to one coordinated workflow. Piling on unrelated responsibilities turns it into a god object — the same anti-pattern facades are supposed to help avoid at the subsystem level.",
  },
  {
    id: "facade-error-senior",
    type: "predict",
    prompt: "🧠 A facade catches every subsystem error and rethrows one generic `OrderFailed`, with no detail about which subsystem failed. What's the practical cost?",
    code: `func placeOrder(cart: Cart, user: User) async throws -> Order {
    do {
        // ... calls inventory, pricing, paymentGateway, shipping, notifications ...
    } catch {
        throw OrderFailed()   // swallows the real error
    }
}`,
    options: [
      "Debugging becomes much harder — callers and logs lose which subsystem actually failed and why",
      "Nothing changes, error handling is purely cosmetic",
      "It makes the facade faster",
      "It becomes impossible to call placeOrder at all",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A facade should still surface which subsystem failed and why. Swallowing every error into one generic type makes production debugging much harder — you lose exactly the information you need to fix the real problem.",
  },
  {
    id: "facade-flashcard",
    type: "flashcard",
    prompt: "Explain the facade pattern: what it is, what it hides, and how it differs from a plain API wrapper. Answer aloud, then reveal.",
    modelAnswer:
      "A **facade** is a single type that sits in front of several independent subsystems and exposes one simple method that internally does the coordinating — calling each subsystem in the correct order — so callers don't need to know that order themselves. The subsystems it wraps (inventory, pricing, payment, shipping, notifications, etc.) still exist and do their own work unchanged; the facade adds no new business logic of its own beyond sequencing and, ideally, meaningful error translation. It differs from a plain **API layer**, which usually wraps a single subsystem and does format translation (JSON to struct) rather than coordinating multiple independent systems — the test is whether deleting the wrapper would still let a caller get the same result manually (facade) versus whether the wrapper is the only way to get the result at all (API layer, often necessary). Pitfalls: letting a facade grow into a god object with unrelated responsibilities, and swallowing subsystem errors into one generic error that hides which subsystem actually failed.",
    keyPoints: [
      "One entry point coordinating multiple independent subsystems in the right order",
      "Subsystems still exist unchanged; facade adds sequencing, not new logic",
      "Facade (coordinates many) vs API layer (translates one)",
      "Pitfalls: god object scope creep, swallowed/generic error handling",
    ],
    explanation:
      "A senior answer distinguishes facade from API layer precisely and names the scope-creep and error-swallowing pitfalls, not just the basic definition.",
  },
];

export default quiz;
