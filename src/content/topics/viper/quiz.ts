import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "viper-acronym",
    type: "mcq",
    prompt: "Which role in VIPER holds the business logic for the use case and is UIKit-free?",
    options: ["Interactor", "View — the passive display layer", "Router — the navigation coordinator", "Presenter — the UI mediator"],
    answer: 0,
    explanation:
      "The **Interactor** contains the business logic (fetching, saving, rules) and knows nothing about UIKit. The Presenter mediates, the View displays, the Router navigates, the Entity is the data.",
  },
  {
    id: "viper-router",
    type: "mcq",
    prompt: "What is the Router (Wireframe) responsible for in VIPER?",
    options: [
      "Navigation between modules and assembling/wiring the module's components",
      "Formatting raw data from the Interactor into display-ready strings and view models for the View",
      "Persisting entities to disk and managing the local data store for the current module",
      "Rendering all visual content by drawing directly into the view's CALayer backing store",
    ],
    answer: 0,
    explanation:
      "The Router handles **navigation** and builds the module (wiring View/Interactor/Presenter/Router + dependencies). Extracting navigation into its own object is one of VIPER's best ideas, echoing the Coordinator pattern.",
  },
  {
    id: "viper-presenter",
    type: "mcq",
    prompt: "What does the Presenter do in VIPER?",
    options: [
      "Receives view events, asks the Interactor for data, formats it, and tells the View and Router what to do",
      "Executes SQL queries directly and manages the local database connection on behalf of the current VIPER module's persistence needs",
      "Owns the UIWindow instance and coordinates the root view controller assignment for the entire application at launch time",
      "Defines the Entity data types and enforces their structural validation rules before any data is passed to the Interactor for business logic",
    ],
    answer: 0,
    explanation:
      "The Presenter is the mediator: it turns view events into Interactor calls, formats the results into display-ready form for the View, and triggers navigation via the Router. It contains no UIKit and no business logic.",
  },
  {
    id: "viper-protocols-fill",
    type: "fill",
    prompt: "VIPER connects its roles through ___ so each component depends on an abstraction and can be mocked in tests.",
    answers: ["protocols", "protocol"],
    hint: "Swift's contract abstraction.",
    explanation:
      "Every boundary in VIPER is a protocol, which is what makes each of the five roles independently testable with mocks.",
  },
  {
    id: "viper-clean",
    type: "mcq",
    prompt: "VIPER is often described as which broader idea applied per screen?",
    options: [
      "Clean Architecture (Uncle Bob) mapped onto a per-screen module",
      "The Singleton pattern, where each role holds a shared instance accessible across screens",
      "Reactive programming, where the View subscribes to Interactor data streams via Combine or RxSwift",
      "Server-driven UI, where the backend determines which VIPER components to instantiate per screen",
    ],
    answer: 0,
    explanation:
      "VIPER is essentially **Clean Architecture** at the module level: the Interactor/Entity are the inner use-case/entity layers, the Presenter/View are interface adapters, and dependencies point inward via protocols.",
  },
  {
    id: "viper-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about VIPER.",
    options: [
      "It splits a screen into five single-responsibility roles",
      "The Interactor is decoupled from UIKit",
      "It requires little boilerplate — usually one file per screen",
      "The Router both navigates and assembles the module",
    ],
    answers: [0, 1, 3],
    explanation:
      "Five roles, a UIKit-free Interactor, and a navigating/assembling Router are all correct. VIPER is notorious for **heavy** boilerplate (five types + protocols per screen), so option 3 is false.",
  },
  {
    id: "viper-boilerplate-senior",
    type: "predict",
    prompt: "🧠 Trick question — a team adopts VIPER for a settings screen with a single toggle. Likely outcome?",
    code: `// One toggle. Five roles + ~5 protocols to wire it up.`,
    options: [
      "Massive over-engineering — the boilerplate dwarfs the feature; VIPER isn't justified for trivial screens",
      "Cleaner, simpler code than any other architecture; the extra files pay off immediately regardless of screen complexity",
      "It won't compile because VIPER requires at least three data-flow paths, which a toggle can't provide",
      "The toggle will render faster because VIPER's protocol boundaries eliminate UIKit overhead at runtime",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "VIPER's cost is fixed per screen (five types + protocols + wiring), so on a one-toggle screen the ceremony vastly outweighs the benefit. VIPER earns its keep on **complex screens in large team codebases**; blanket-applying it is a classic over-engineering mistake.",
  },
  {
    id: "viper-swiftui-senior",
    type: "mcq",
    prompt: "Why does VIPER fit SwiftUI poorly?",
    options: [
      "SwiftUI's declarative, state-driven, value-type views clash with VIPER's imperative view protocol and long-lived object graph",
      "SwiftUI lacks NavigationStack and sheet modifiers and therefore cannot implement the VIPER Router's imperative push/pop navigation model at all",
      "SwiftUI has no data persistence or networking layer of its own; it fully depends on UIKit's underlying URLSession and Core Data stacks to fetch or store data",
      "VIPER's inter-role communication relies on Objective-C runtime features like associated objects and dynamic method resolution, which are unavailable in a pure Swift project",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "VIPER assumes a retained View object the Presenter calls imperatively and a Router that pushes view controllers. SwiftUI re-renders value-type views from state and navigates declaratively, so the imperative View/Router model is an awkward fit — SwiftUI apps usually prefer MVVM/observation or a lighter Clean split.",
  },
  {
    id: "viper-when-senior",
    type: "mcq",
    prompt: "When is VIPER most justified?",
    options: [
      "Large, long-lived apps with big teams and complex screens where consistency and testability outweigh the boilerplate",
      "Tiny prototype apps, where VIPER's strict role separation speeds up scaffold generation and lets new engineers onboard without reading existing code",
      "Any app of any size, always — VIPER's per-screen overhead is negligible and the testability and separation-of-concerns benefits apply universally across all project scales",
      "Only game apps, because SpriteKit and SceneKit game scenes map cleanly onto VIPER modules with the Interactor handling game-loop physics and collision logic",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The trade-off favors VIPER when the app is large and complex, many engineers benefit from a consistent structure, and screens are non-trivial. For small apps or simple screens, the indirection and boilerplate cost more than they return.",
  },
  {
    id: "viper-flashcard",
    type: "flashcard",
    prompt:
      "Name VIPER's five roles and give the honest trade-off. Answer aloud, then reveal.",
    modelAnswer:
      "**VIPER** = **View** (passive UI, forwards events), **Interactor** (business logic for the use case, UIKit-free), **Presenter** (mediator: turns view events into Interactor calls, formats results, drives View + Router), **Entity** (plain models), **Router/Wireframe** (navigation + assembles/wires the module). Every boundary is a **protocol**, so each role is independently mockable and testable; it's essentially **Clean Architecture per screen**, and its dedicated Router (like a Coordinator) keeps navigation out of the view/presenter. The trade-off: extreme separation and testability at the cost of **heavy boilerplate** (five types + several protocols per screen, often needing code generation) and lots of indirection. It's justified in **large, long-lived apps with big teams and complex screens**, and overkill for small apps, simple screens, or SwiftUI (whose declarative model fits VIPER's imperative view/router poorly).",
    keyPoints: [
      "View / Interactor / Presenter / Entity / Router — one job each",
      "Interactor = business logic (no UIKit); Router = nav + module assembly",
      "Protocol boundaries → highly testable; = Clean Architecture per screen",
      "Cost: heavy boilerplate + indirection (often code-generated)",
      "Justified for large teams/complex screens; overkill for small apps & SwiftUI",
    ],
    explanation:
      "Senior answers name all five roles crisply AND weigh the boilerplate honestly (justified only when scale/complexity earns it), rather than presenting VIPER as universally good.",
  },
];

export default quiz;
