import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "mvc-roles",
    type: "mcq",
    prompt: "In MVC, which component holds the data and business logic and knows nothing about the UI?",
    options: ["Model", "View", "Controller", "Coordinator"],
    answer: 0,
    explanation:
      "The **Model** owns data and business logic and is UI-agnostic. The View displays; the Controller mediates between them.",
  },
  {
    id: "cocoa-mvc-controller",
    type: "mcq",
    prompt: "In Cocoa (UIKit) MVC, how do the Model and View communicate?",
    options: [
      "Through the Controller — they don't talk to each other directly",
      "The View mutates the Model directly",
      "The Model owns and updates the View",
      "They share global state",
    ],
    answer: 0,
    explanation:
      "In Cocoa MVC the `UIViewController` sits in the middle: Model and View are kept apart and communicate via the controller, which owns the views. (Classic Smalltalk MVC differs — there the Model notifies the View directly.)",
  },
  {
    id: "massive-vc-fill",
    type: "fill",
    prompt: "iOS developers call the anti-pattern where the view controller accumulates far too many responsibilities the '___ View Controller'.",
    answers: ["Massive", "massive"],
    hint: "Starts with M — it means 'huge'.",
    explanation:
      "The 'Massive View Controller' problem: networking, data sources, formatting, navigation, and business logic all pile into one controller, making it huge and untestable.",
  },
  {
    id: "mvc-testability",
    type: "mcq",
    prompt: "Why is logic inside a UIKit view controller hard to unit test?",
    options: [
      "It's entangled with UIKit — you'd need a live view hierarchy to exercise it",
      "Swift can't test classes",
      "Controllers are private by default",
      "XCTest doesn't support MVC",
    ],
    answer: 0,
    explanation:
      "The controller imports UIKit and mixes presentation/business logic with view lifecycle, so the logic can't be tested in isolation without instantiating views. Extracting logic into a UIKit-free object (ViewModel/Presenter) is what restores testability.",
  },
  {
    id: "mvc-reaction",
    type: "mcq",
    prompt: "What do MVVM, MVP, and Coordinators all have in common relative to MVC?",
    options: [
      "They extract responsibilities out of the view controller to reduce coupling and improve testability",
      "They eliminate the Model",
      "They remove the need for views",
      "They only work in SwiftUI",
    ],
    answer: 0,
    explanation:
      "Each pattern pulls specific jobs out of the controller: MVVM/MVP extract presentation logic into a testable object, Coordinators extract navigation. They're all reactions to MVC's over-stuffed controller.",
  },
  {
    id: "mvc-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about MVC on iOS.",
    options: [
      "The Model should be independent of the UI",
      "Cocoa MVC tightly couples the View and Controller by design",
      "MVC is always the wrong choice for any screen",
      "'Massive View Controller' comes from too many responsibilities landing in one place",
    ],
    answers: [0, 1, 3],
    explanation:
      "Model independence, View↔Controller coupling, and responsibility overload are all accurate. MVC is **not** always wrong — it's fine for simple screens (option 3 is false).",
  },
  {
    id: "mvc-vs-smalltalk-senior",
    type: "mcq",
    prompt: "How does classic Smalltalk MVC differ from Apple's Cocoa MVC?",
    options: [
      "In Smalltalk MVC the Model notifies the View directly; in Cocoa MVC everything routes through the Controller",
      "Smalltalk MVC has no Model",
      "Cocoa MVC has no Controller",
      "They are identical",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Classic MVC decouples View and Model, with the Model notifying the View of changes (observer). Cocoa reworked this so the Controller owns the View and mediates all Model↔View communication — which is what concentrates responsibility in the controller.",
  },
  {
    id: "mvc-not-bad-senior",
    type: "predict",
    prompt: "🧠 Trick question — 'MVC inevitably produces untestable Massive View Controllers.' True or false, and why?",
    code: `// Consider a simple settings screen: one toggle, one label.`,
    options: [
      "False — MVC doesn't force logic into the controller; the anti-pattern comes from misuse, and MVC is fine for simple screens",
      "True — every MVC controller becomes massive",
      "True — UIKit forbids extracting logic",
      "False — because MVC has no controller",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The 'Massive View Controller' is a *misuse* symptom, not a mandate: nothing in MVC says networking/formatting/navigation must live in the controller — it just doesn't provide dedicated homes, so undisciplined code accumulates there. For a simple screen, plain MVC is the right, low-ceremony choice. The senior take is nuanced, not dogmatic.",
  },
  {
    id: "presentation-logic-home-senior",
    type: "mcq",
    prompt: "Which responsibility does classic MVC lack a dedicated home for, pushing it into the controller?",
    options: [
      "Presentation logic (e.g. formatting a date, computing a button's enabled state) and navigation",
      "Storing raw data",
      "Rendering pixels",
      "Handling memory allocation",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "MVC has Model (data/business) and View (display) but no explicit layer for **presentation logic** or **navigation** — so both default into the controller. MVVM adds a ViewModel for the former; Coordinators handle the latter.",
  },
  {
    id: "mvc-flashcard",
    type: "flashcard",
    prompt:
      "Explain MVC on iOS: the roles, why controllers get massive, and how other architectures respond. Answer aloud, then reveal.",
    modelAnswer:
      "**MVC** splits an app into **Model** (data + business logic, UI-agnostic), **View** (display + report input), and **Controller** (mediator). In **Cocoa MVC**, the `UIViewController` owns the views and all Model↔View communication routes through it (unlike classic Smalltalk MVC, where the Model notifies the View directly). The problem: the controller is the only thing wired to both sides, and MVC offers **no dedicated home for presentation logic or navigation**, so networking, data sources, formatting, navigation, and business rules all pile into it — the untestable **Massive View Controller**, made worse by tight coupling to UIKit (you can't test the logic without a view hierarchy). Other architectures are reactions: **MVVM/MVP** extract presentation logic into a testable object, **Coordinators** extract navigation, **VIPER/Clean** split further. MVC isn't inherently bad — it's the right low-ceremony choice for simple screens; the trouble is only unmanaged responsibility growth.",
    keyPoints: [
      "Model (data/logic) / View (display) / Controller (mediator)",
      "Cocoa MVC: controller owns views, mediates all comms",
      "No home for presentation logic or navigation → controller bloat",
      "Massive View Controller = untestable, UIKit-coupled",
      "MVVM/MVP/Coordinator/VIPER extract responsibilities in response",
    ],
    explanation:
      "Strong answers are nuanced: name the specific responsibilities that pile up and the UIKit coupling, note Cocoa vs Smalltalk MVC, and resist 'MVC bad' dogma — it's fine for simple screens.",
  },
];

export default quiz;
