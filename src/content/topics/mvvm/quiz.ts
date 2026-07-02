import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "viewmodel-role",
    type: "mcq",
    prompt: "What is the ViewModel's job in MVVM?",
    options: [
      "Hold presentation state/logic and expose display-ready data — with no UI dependency",
      "Render the views directly",
      "Store the app's persisted data",
      "Manage the navigation stack",
    ],
    answer: 0,
    explanation:
      "The ViewModel turns Model data into display-ready state (formatted strings, flags) and exposes intents, without referencing any view. That UI-independence is what makes it unit-testable.",
  },
  {
    id: "mvvm-testability",
    type: "mcq",
    prompt: "Why is a ViewModel easier to unit test than a UIKit view controller?",
    options: [
      "It has no UI dependency — you feed input and assert on its output state",
      "It runs on a background thread",
      "It has fewer lines of code",
      "XCTest only supports ViewModels",
    ],
    answer: 0,
    explanation:
      "Because the ViewModel doesn't import UIKit or hold views, you can instantiate it, call methods, and assert on its published state — no view hierarchy needed.",
  },
  {
    id: "mvvm-binding-fill",
    type: "fill",
    prompt: "The mechanism that keeps the View in sync with the ViewModel's state automatically is called ___.",
    answers: ["binding", "data binding"],
    hint: "You 'bind' the view to the view model.",
    explanation:
      "Binding propagates ViewModel changes to the View. SwiftUI provides it (`ObservableObject`/`@Published`/`@Observable`); UIKit requires manual binding (Combine, closures, or delegates).",
  },
  {
    id: "swiftui-vs-uikit-binding",
    type: "mcq",
    prompt: "How does MVVM binding differ between SwiftUI and UIKit?",
    options: [
      "SwiftUI provides binding via ObservableObject/@Published; UIKit requires manual wiring",
      "UIKit binds automatically; SwiftUI is manual",
      "Neither supports binding",
      "They are identical",
    ],
    answer: 0,
    explanation:
      "SwiftUI's data-flow tools *are* the binding layer, so MVVM is nearly free. In UIKit you wire it yourself with Combine sinks, closures, or delegate callbacks updating outlets.",
  },
  {
    id: "fat-viewmodel",
    type: "mcq",
    prompt: "What is the 'Massive View Model' anti-pattern?",
    options: [
      "Piling networking, business rules, and navigation into the ViewModel until it's the new dumping ground",
      "A ViewModel with too few properties",
      "Using more than one ViewModel per screen",
      "A ViewModel written in SwiftUI",
    ],
    answer: 0,
    explanation:
      "MVVM relocates bloat rather than preventing it. Keep the ViewModel to **presentation** logic; push business logic to services/models and navigation to a coordinator, or it becomes as unmanageable as a Massive View Controller.",
  },
  {
    id: "mvvm-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about MVVM.",
    options: [
      "The ViewModel should not import UIKit or reference a view",
      "MVVM adds a dedicated home for presentation logic that MVC lacked",
      "The ViewModel is responsible for rendering pixels",
      "In SwiftUI, ObservableObject/@Observable can serve as the binding layer",
    ],
    answers: [0, 1, 3],
    explanation:
      "A UI-free ViewModel, a home for presentation logic, and SwiftUI's built-in binding are all correct. Rendering is the **View's** job — the ViewModel never touches pixels (option 3 is false).",
  },
  {
    id: "vm-imports-uikit-senior",
    type: "predict",
    prompt: "🧠 Trick question — a teammate imports UIKit into the ViewModel to format a color. What have they broken?",
    code: `import UIKit
final class VM {
    var badgeColor: UIColor { .systemRed }   // UIKit in the ViewModel
}`,
    options: [
      "Testability & separation — the ViewModel now depends on UIKit, defeating MVVM's core benefit",
      "Nothing — ViewModels can use UIKit freely",
      "Compilation — UIKit can't be imported",
      "Performance only",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The ViewModel's value is being UI-framework-agnostic and testable. Importing UIKit couples it to the platform (can't run in a pure test target, can't reuse across UIKit/SwiftUI/watchOS). Expose a semantic value (an enum/case, or a design token) and let the View map it to `UIColor`.",
  },
  {
    id: "navigation-in-vm-senior",
    type: "mcq",
    prompt: "Where should navigation decisions ideally live in a well-structured MVVM app?",
    options: [
      "Outside the ViewModel — delegated to a coordinator/router",
      "Inside the ViewModel, pushing view controllers directly",
      "In the Model",
      "In the AppDelegate",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Putting navigation in the ViewModel recouples it to flow and often to UIKit. Delegating navigation to a **coordinator/router** keeps the ViewModel focused on presentation and independently testable — MVVM and the Coordinator pattern compose well.",
  },
  {
    id: "swiftui-view-is-viewmodel-senior",
    type: "mcq",
    prompt: "What's a legitimate critique of always using a separate ViewModel class in SwiftUI?",
    options: [
      "A SwiftUI View is already a value-type description of UI with its own state, so a separate class can be redundant boilerplate for simple screens",
      "SwiftUI can't use ViewModels at all",
      "ViewModels break SwiftUI previews",
      "SwiftUI forbids ObservableObject",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Some argue SwiftUI's declarative `View` (with `@State`/`@Observable` models) already fills much of the ViewModel role, so a mandatory VM class adds ceremony for simple screens. It's a real, nuanced debate — VMs still shine for complex, testable presentation logic, but they aren't always necessary in SwiftUI.",
  },
  {
    id: "mvvm-flashcard",
    type: "flashcard",
    prompt:
      "Explain MVVM: the roles, how binding works, and the main pitfall. Answer aloud, then reveal.",
    modelAnswer:
      "**MVVM** adds a **ViewModel** between Model and View. The **Model** is data/business logic; the **View** (UIKit VC+views, or SwiftUI `View`) is thin — it renders state and forwards user actions; the **ViewModel** transforms Model data into **display-ready state** (formatted strings, enabled flags, derived values) and exposes intents, with **no UI dependency**, which makes it **unit-testable** (the thing MVC lacked). The View and ViewModel stay in sync via **binding**: SwiftUI provides it (`ObservableObject`/`@Published`/`@Observable`), UIKit requires manual wiring (Combine/closures/delegates). Main pitfall: the **Massive View Model** — piling networking, business rules, and navigation into it. Keep the ViewModel presentation-only; push business logic to services/models and navigation to a coordinator. Also never import UIKit into the ViewModel, or you lose the testability that justifies it.",
    keyPoints: [
      "ViewModel = presentation state/logic, no UI dependency → testable",
      "View is thin: binds to state, forwards actions",
      "Binding: SwiftUI automatic, UIKit manual (Combine/closures/delegates)",
      "Pitfall: Massive View Model — keep it presentation-only",
      "Never import UIKit into the ViewModel; push navigation to a coordinator",
    ],
    explanation:
      "Senior answers stress UI-independence → testability, contrast SwiftUI vs UIKit binding, and name the Massive-View-Model pitfall plus keeping navigation/business logic out.",
  },
];

export default quiz;
