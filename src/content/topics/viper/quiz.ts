import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "viper-acronym",
    type: "mcq",
    prompt: "Which role in VIPER holds the business logic for the use case and is UIKit-free?",
    options: ["Interactor", "View", "Router", "Presenter"],
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
      "Formatting data for display",
      "Storing entities to disk",
      "Rendering the views",
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
      "Executes SQL queries",
      "Owns the UIWindow",
      "Defines the Entity types",
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
      "The Singleton pattern",
      "Reactive programming",
      "Server-driven UI",
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
      "Cleaner, simpler code than any alternative",
      "It won't compile",
      "The toggle will be faster",
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
      "SwiftUI can't navigate",
      "SwiftUI has no data layer",
      "VIPER requires Objective-C",
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
      "Tiny prototype apps",
      "Any app, always",
      "Only games",
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
