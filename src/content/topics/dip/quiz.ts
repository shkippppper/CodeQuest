import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "dip-what",
    type: "mcq",
    prompt: "What does the Dependency Inversion Principle say?",
    options: [
      "High-level modules shouldn't depend on low-level modules — both should depend on abstractions",
      "Always inject dependencies through an initializer",
      "Never let a class have more than one dependency",
      "Low-level modules should depend directly on high-level modules",
    ],
    answer: 0,
    explanation:
      "DIP states that high-level modules (business rules) shouldn't depend on low-level modules (details) — both should depend on abstractions, and abstractions shouldn't depend on details.",
  },
  {
    id: "dip-high-low",
    type: "mcq",
    prompt: "In an order-processing app, which is the high-level module and which is low-level?",
    code: `final class OrderProcessor { ... }   // decides what happens on order completion
final class MySQLDatabase { ... }    // opens sockets, writes bytes`,
    options: [
      "OrderProcessor is high-level (business rule); MySQLDatabase is low-level (mechanical detail)",
      "MySQLDatabase is high-level because it does more work",
      "They're both low-level since neither has UI code",
      "Whichever class is larger is high-level",
    ],
    answer: 0,
    explanation:
      "High-level modules encode business decisions; low-level modules do mechanical, replaceable work like talking to a specific database. OrderProcessor is the policy, MySQLDatabase is the detail.",
  },
  {
    id: "dip-owner-fill",
    type: "fill",
    prompt: "The abstraction (protocol) in a DIP relationship should be owned by the ___-level module, not the low-level one.",
    answers: ["high"],
    hint: "The module that defines what it needs, not the one that fulfills it.",
    explanation:
      "The protocol belongs with the high-level module because that module defines what it needs. If the protocol lives with the low-level module, the high-level code still has to import the low-level module to see it — nothing is inverted.",
  },
  {
    id: "dip-swap-predict",
    type: "predict",
    prompt: "OrderProcessor depends on the OrderStore protocol, not on MySQLDatabase directly. A new PostgresDatabase: OrderStore is written and swapped in via init. How many lines of OrderProcessor need to change?",
    code: `protocol OrderStore { func save(_ order: Order) throws }

final class OrderProcessor {
    private let store: OrderStore
    init(store: OrderStore) { self.store = store }
    func complete(_ order: Order) throws { try store.save(order) }
}

final class PostgresDatabase: OrderStore {
    func save(_ order: Order) throws { /* ... */ }
}`,
    options: ["Zero", "One line, the init signature", "Every method that calls store", "It won't compile"],
    answer: 0,
    explanation:
      "OrderProcessor only ever references the OrderStore abstraction. Any conforming type — MySQLDatabase, PostgresDatabase, a test fake — slots in through init without touching OrderProcessor's code at all.",
  },
  {
    id: "dip-vs-di-multi",
    type: "multi",
    prompt: "Select all statements that correctly distinguish DIP from dependency injection (DI).",
    options: [
      "DIP is a design rule about depending on abstractions; DI is a mechanism for passing dependencies in",
      "You can use DI (pass a concrete type through init) without applying DIP at all",
      "DIP and DI are two names for the exact same technique",
      "DI is about how an instance arrives (initializer/property); DIP is about what type you depend on",
    ],
    answers: [0, 1, 3],
    explanation:
      "DIP concerns the *shape* of the dependency (an abstraction, not a concrete type); DI concerns *how* an instance is delivered. Injecting a concrete type is DI without DIP — they are related but distinct.",
  },
  {
    id: "dip-injection-not-inverted",
    type: "mcq",
    prompt: "Is this class an example of the Dependency Inversion Principle?",
    code: `final class OrderProcessor {
    private let db: MySQLDatabase
    init(db: MySQLDatabase) { self.db = db }
}`,
    options: [
      "No — the dependency is injected, but the parameter type is still the concrete MySQLDatabase, so nothing is inverted",
      "Yes — passing db through init is exactly what DIP requires",
      "Yes — because MySQLDatabase is a class, not a struct",
      "No — because init should never take parameters",
    ],
    answer: 0,
    explanation:
      "This is dependency injection without dependency inversion. The concrete type still leaks into OrderProcessor's dependency list. DIP requires the parameter's type to be an abstraction (a protocol).",
  },
  {
    id: "dip-where-boundary",
    type: "mcq",
    prompt: "Where is it most worth applying DIP?",
    options: [
      "At boundaries — networking, persistence, payment providers, and other volatile or external dependencies",
      "On every single type in the codebase, including simple value types like Money",
      "Only inside unit test files",
      "Only on types marked final",
    ],
    answer: 0,
    explanation:
      "DIP pays off at boundaries: places where you'll want to swap implementations or fake them in tests. Wrapping stable, dependency-free value types in protocols adds indirection with no payoff.",
  },
  {
    id: "dip-arrows-senior",
    type: "predict",
    prompt: "A team says they've \"inverted\" their persistence layer, but OrderStore is declared inside the SQLDatabase.swift file, and the business-logic module imports the persistence module to use it. Have they actually applied DIP?",
    code: `// Persistence module
protocol OrderStore { func save(_ order: Order) throws }
final class MySQLDatabase: OrderStore { ... }

// Business module (imports Persistence)
final class OrderProcessor { let store: OrderStore ... }`,
    options: [
      "No — the abstraction still lives on the low-level side, so the high-level module still depends downward on the persistence module",
      "Yes — using a protocol at all satisfies DIP regardless of where it's declared",
      "Yes — because OrderProcessor never references MySQLDatabase by name",
      "No — because OrderStore should be a class, not a protocol",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Using a protocol is necessary but not sufficient. The direction of the *module* dependency matters: if the business module must import the persistence module just to see the abstraction, the dependency still points from high-level to low-level — DIP asks the persistence module to depend on the business module's abstraction, not the reverse.",
  },
  {
    id: "dip-flashcard",
    type: "flashcard",
    prompt:
      "Explain the Dependency Inversion Principle, why the arrow direction matters, and how it differs from dependency injection. Answer aloud, then reveal.",
    modelAnswer:
      "The **Dependency Inversion Principle** says high-level modules (business rules) and low-level modules (mechanical details like databases or network clients) should both depend on an **abstraction** — a protocol — rather than the high-level module depending directly on the low-level one. Without it, the arrow points from policy down to detail, so changing the detail (or testing the policy) forces changes to the policy code. With it, the protocol is owned by the **high-level module** and the low-level type conforms to it, so the dependency arrow flips: the detail depends upward on the abstraction, and the policy stays ignorant of which concrete implementation it's using. This is distinct from **dependency injection**, which is the mechanical act of passing a dependency in through an initializer or property rather than constructing it internally — you can inject a concrete type without inverting anything, and DIP is what makes the injected type an abstraction instead. DIP is worth applying at **boundaries** — networking, persistence, third-party SDKs — not on stable, dependency-free value types, where it just adds indirection.",
    keyPoints: [
      "High-level and low-level modules both depend on an abstraction (protocol)",
      "The abstraction is owned by the high-level module, not the low-level one",
      "DIP (what you depend on) vs DI (how the instance arrives) are different concerns",
      "Injecting a concrete type is DI without DIP",
      "Apply at boundaries (networking, persistence, external SDKs), not everywhere",
    ],
    explanation:
      "A senior answer distinguishes DIP from DI explicitly and can point out that ownership of the protocol — not just its existence — determines whether the dependency has actually been inverted.",
  },
];

export default quiz;
