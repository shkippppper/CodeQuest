import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "di-definition",
    type: "mcq",
    prompt: "What is dependency injection?",
    options: [
      "Providing a type's dependencies from outside instead of constructing them internally",
      "Injecting code at runtime with method swizzling",
      "A way to speed up allocations",
      "Storing dependencies in global singletons",
    ],
    answer: 0,
    explanation:
      "DI means a type receives its dependencies (ideally as protocols) from outside — via init, property, or method — rather than creating concrete ones itself. That's what enables testing and swapping.",
  },
  {
    id: "constructor-injection-preferred",
    type: "mcq",
    prompt: "Why is constructor (initializer) injection usually preferred?",
    options: [
      "Dependencies are required, immutable, and explicit, and the object is always fully formed",
      "It's the only kind Swift supports",
      "It avoids using protocols",
      "It makes dependencies optional",
    ],
    answer: 0,
    explanation:
      "Passing deps in `init` makes them required and `let` (immutable), documents what the type needs, and guarantees the object is valid immediately — no nil window like property injection.",
  },
  {
    id: "di-testability",
    type: "predict",
    prompt: "What does injecting `APIClient` as a protocol enable in tests?",
    code: `protocol APIClient { func load() async throws -> [Post] }
final class Feed { init(api: APIClient) { /* ... */ } }`,
    options: [
      "Passing a mock APIClient for deterministic, network-free tests",
      "Nothing — you still need the real network",
      "Faster production performance only",
      "Automatic UI testing",
    ],
    answer: 0,
    explanation:
      "Because `Feed` depends on the `APIClient` **protocol**, a test injects a `MockAPI` returning canned data — no network, no flakiness. That testability is the primary reason to inject.",
  },
  {
    id: "service-locator-fill",
    type: "fill",
    prompt: "Fetching dependencies from a global registry (instead of receiving them) is the ___ locator anti-pattern.",
    answers: ["service"],
    hint: "'___ locator' — it locates services globally.",
    explanation:
      "The **service locator** hides dependencies behind a global lookup, reintroducing global state and making tests harder. DI pushes deps in; a locator makes objects pull them out of a global.",
  },
  {
    id: "property-injection-use",
    type: "mcq",
    prompt: "When is property injection a reasonable choice over constructor injection?",
    options: [
      "When you don't control construction (e.g. storyboard-instantiated view controllers) or the dependency is optional",
      "Always — it's strictly better",
      "When you want the dependency to be immutable",
      "Never — it's not valid Swift",
    ],
    answer: 0,
    explanation:
      "Property injection sets a dependency after init — handy when a framework constructs the object for you (storyboards) or the dependency is genuinely optional. The trade-off is a window where it's nil.",
  },
  {
    id: "di-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about dependency injection.",
    options: [
      "Injecting protocols (not concrete types) lets you swap implementations",
      "A DI container can reduce manual wiring boilerplate",
      "The service locator pattern makes dependencies explicit and is best practice",
      "Manual constructor injection at a composition root gives compile-time safety",
    ],
    answers: [0, 1, 3],
    explanation:
      "Protocol injection, containers reducing boilerplate, and compile-safe manual DI are all correct. The service locator **hides** dependencies and is an anti-pattern (option 3 is false).",
  },
  {
    id: "runtime-container-risk-senior",
    type: "predict",
    prompt: "🧠 Trick question — a runtime DI container is asked to resolve `APIClient`, but nobody registered it. When do you find out?",
    code: `let api = container.resolve(APIClient.self)  // never registered`,
    options: [
      "At runtime — it fails/crashes when resolved, not at compile time",
      "At compile time — the build fails",
      "Never — it returns a default",
      "The app refuses to launch and shows a warning dialog",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Runtime containers resolve by type lookup, so a missing registration surfaces as a **runtime** failure (often a crash) — possibly deep in a flow. Manual constructor injection or a compile-time DI framework catches the missing dependency at **build time** instead, which is a key trade-off when choosing an approach.",
  },
  {
    id: "di-vs-dip-senior",
    type: "mcq",
    prompt: "How does dependency injection relate to the Dependency Inversion Principle (DIP)?",
    options: [
      "DI is a technique that helps achieve DIP — depend on abstractions and have them supplied from outside",
      "They are the same thing",
      "DIP forbids dependency injection",
      "DI only applies to UI code",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "DIP is the *principle* (high-level code depends on abstractions, not concretions). DI is a common *mechanism* to realize it: inject protocol-typed dependencies so the concrete implementation is decided and provided externally.",
  },
  {
    id: "composition-root-senior",
    type: "mcq",
    prompt: "What is a 'composition root'?",
    options: [
      "The single place near app startup where the object graph is assembled and dependencies are wired together",
      "The root view controller of the app",
      "A global singleton holding all services",
      "The Core Data persistent container",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The **composition root** is where you construct and connect your dependencies (often at app launch / scene setup). Concentrating wiring there keeps the rest of the code free of construction concerns and enables compile-time-checked manual DI.",
  },
  {
    id: "di-flashcard",
    type: "flashcard",
    prompt:
      "Explain dependency injection, its forms, and why the service locator is an anti-pattern. Answer aloud, then reveal.",
    modelAnswer:
      "**Dependency injection** means a type receives its dependencies — ideally as **protocols** — from outside, instead of constructing concrete ones itself. Benefits: **testability** (inject mocks), **decoupling** (swap implementations), **flexibility** (per-environment config), and **explicit** dependencies. Forms, best-first: **constructor injection** (required, immutable, explicit — preferred), **property injection** (set after init; for storyboard-created objects or optional deps, with a nil window), and **method injection** (a one-off dependency to a single method). A **DI container** registers/resolves dependencies to cut wiring boilerplate, but runtime containers surface missing registrations as **runtime** failures — whereas **manual constructor injection at a composition root** (or a compile-time framework) is compiler-verified. The **service locator** — objects pulling dependencies from a global registry — is an **anti-pattern**: it hides dependencies (the init no longer says what's needed) and reintroduces global state, hurting testability. DI is the technique that realizes SOLID's **Dependency Inversion**.",
    keyPoints: [
      "Inject dependencies (as protocols) from outside, don't construct internally",
      "Constructor injection preferred; property (storyboards/optional); method (one-off)",
      "Enables mock-based, network-free tests",
      "Service locator = anti-pattern (hides deps + global state)",
      "Containers cut boilerplate but risk runtime errors; composition root = compile-time DI",
    ],
    explanation:
      "Senior answers rank the injection forms, flag the service locator as hiding dependencies, and contrast runtime containers vs compile-time/manual DI at a composition root — tying it to DIP.",
  },
];

export default quiz;
