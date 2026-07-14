import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "viewmodel-role",
    type: "mcq",
    prompt: "What is the ViewModel's job in MVVM?",
    options: [
      "Hold presentation state/logic and expose display-ready data — with no UI dependency",
      "Render the views directly by calling UIKit drawing APIs and updating outlet references on every state change",
      "Store the app's persisted data in Core Data or another on-disk backing store so the view has access to it",
      "Manage the navigation stack by pushing and popping view controllers in response to user actions routed through the binding layer",
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
      "It always runs its update logic on a dedicated background thread so tests never block the main queue",
      "It has fewer lines of code than a UIViewController so the test surface is proportionally smaller",
      "XCTest only supports testing plain Swift objects like ViewModels, and cannot test UIViewController subclasses",
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
      "UIKit binds to the ViewModel automatically through KVO on all properties; SwiftUI requires explicit @Published annotations to participate in the binding system",
      "Neither SwiftUI nor UIKit supports any form of binding; all ViewModel-to-View synchronization must be done through explicit delegate callbacks",
      "They are identical — both frameworks use @Published and sink to propagate ViewModel changes to the view layer without additional wiring",
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
      "A ViewModel with too few properties to fully represent the screen state, forcing the view to compute derived values on its own",
      "Using more than one ViewModel per screen, creating duplicate state that can diverge and cause consistency bugs across the two models",
      "A ViewModel that is written as a SwiftUI View struct rather than a separate class, blurring the boundary between presentation and display layers",
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
      "Nothing — ViewModels can use UIKit freely as long as they do not subclass UIView or UIViewController directly",
      "Compilation — UIKit cannot be imported into a file that also conforms to ObservableObject because of a Swift concurrency isolation conflict",
      "Performance only — UIKit types in a ViewModel cause redundant retain cycles that slow down property access but do not affect testability",
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
      "Inside the ViewModel, which should push view controllers directly onto the navigation stack when business logic determines a transition is needed",
      "In the Model layer, since navigation decisions are a function of application state and belong alongside the data that drives them",
      "In the AppDelegate, which acts as the single global coordinator for all scene transitions throughout the app lifecycle",
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
      "SwiftUI cannot use ViewModels at all because its rendering pipeline only accepts value types and rejects class-based observable objects entirely",
      "ViewModels break SwiftUI previews because Xcode cannot instantiate a class that conforms to ObservableObject without a running simulator",
      "SwiftUI forbids ObservableObject conformance on any type that also declares @Published properties on stored class members",
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
