import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "presenter-vs-viewmodel",
    type: "mcq",
    prompt: "What's the key difference between a Presenter (MVP) and a ViewModel (MVVM)?",
    options: [
      "The Presenter holds a reference to the view and calls it imperatively; the ViewModel exposes observable state the view binds to",
      "The Presenter renders pixels directly by calling Core Graphics APIs; the ViewModel only manages data transformations and never touches the drawing layer",
      "The ViewModel holds a strong reference to the view and calls display methods on it; the Presenter never references the view and only emits state changes",
      "They implement the same pattern under different names — both hold a view reference and drive it imperatively through a protocol contract",
    ],
    answer: 0,
    explanation:
      "MVP is push/command: the Presenter drives a view it references (via a protocol). MVVM is pull/observe: the ViewModel exposes state and doesn't know the view exists.",
  },
  {
    id: "passive-view",
    type: "mcq",
    prompt: "What does 'passive view' mean in MVP?",
    options: [
      "The view contains no presentation logic — it just forwards actions and displays what the presenter tells it",
      "The view is entirely read-only and cannot be mutated after it is first rendered by the presenter during setup",
      "The view executes all display work on a dedicated background thread so the presenter never blocks the main run loop",
      "The view accepts no user interaction and is updated exclusively through data pushed from a server subscription",
    ],
    answer: 0,
    explanation:
      "A passive view is dumb: it forwards user events to the presenter and exposes simple display methods (`showTitle`) the presenter calls. All logic lives in the presenter.",
  },
  {
    id: "mvp-contract-fill",
    type: "fill",
    prompt: "MVP connects the presenter and view through a pair of ___ (the 'contract') so the presenter never touches a concrete view.",
    answers: ["protocols", "protocol"],
    hint: "Swift's abstraction for a contract of methods.",
    explanation:
      "The contract is two protocols: one the view implements (what the presenter can tell it) and one the presenter implements (what the view can tell it). This abstraction is what enables mocking in tests.",
  },
  {
    id: "mvp-test-style",
    type: "mcq",
    prompt: "How do you typically unit-test an MVP presenter?",
    options: [
      "Inject a mock view and assert which view methods were called (interaction testing)",
      "Assert on the presenter's published ObservableObject state properties using Combine expectations",
      "Capture a pixel snapshot of the rendered UI and compare it against a stored reference image",
      "Run UI tests through XCUITest, tapping buttons and asserting on accessibility labels in the full app",
    ],
    answer: 0,
    explanation:
      "Since the presenter talks to the view only through a protocol, you supply a **mock view** and verify the interactions (e.g. `showTitle` was called with `\"Ada\"`). That's interaction-based testing.",
  },
  {
    id: "mvp-weak-view",
    type: "mcq",
    prompt: "Why should a presenter hold its view reference as `weak`?",
    options: [
      "The view controller owns the presenter; a strong back-reference would create a retain cycle",
      "Weak references allow the runtime to skip retain-count bookkeeping and therefore execute property accesses faster than strong references",
      "Declaring the view weak allows it to be nil during the launch sequence before the window has been assigned a root view controller",
      "The Swift compiler requires any property whose type is a protocol to be declared weak, otherwise the module will not compile",
    ],
    answer: 0,
    explanation:
      "Typically the view (controller) owns the presenter. If the presenter held the view **strongly**, they'd keep each other alive — a retain cycle / leak. `weak var view` breaks it.",
  },
  {
    id: "mvp-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about MVP.",
    options: [
      "The presenter drives the view via method calls through a protocol",
      "MVP does not require a reactive/binding layer",
      "The view holds the business logic",
      "MVP fits UIKit well; MVVM fits SwiftUI's declarative binding better",
    ],
    answers: [0, 1, 3],
    explanation:
      "Imperative protocol-driven updates, no binding requirement, and the UIKit-vs-SwiftUI fit are all true. The **view holds no logic** in MVP (option 3 is false) — the presenter does.",
  },
  {
    id: "mvp-swiftui-fit-senior",
    type: "mcq",
    prompt: "Why is classic MVP an awkward fit for SwiftUI?",
    options: [
      "SwiftUI is declarative and binding-first, whereas MVP relies on imperatively calling view methods on a retained view reference",
      "SwiftUI cannot use protocols at all, so the view-protocol contract that MVP depends on cannot be expressed in a SwiftUI project",
      "SwiftUI views receive no user input directly; all gestures are routed through the system and cannot be forwarded to a presenter",
      "Apple explicitly bans the MVP pattern in SwiftUI apps and rejects them during App Store review if a presenter holds a view reference",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "SwiftUI views are value types re-rendered from state; there's no long-lived view object to hold a `weak` reference to and call `showTitle` on. That imperative, retained-view model clashes with SwiftUI's declarative binding — which is why SwiftUI apps lean MVVM/observation instead.",
  },
  {
    id: "mvp-interaction-vs-state-senior",
    type: "predict",
    prompt: "🧠 Trick question — a test asserts `mockView.showLoading` was called with `true` then `false`. Which architecture's test style is this?",
    code: `XCTAssertEqual(mockView.loadingStates, [true, false])`,
    options: [
      "MVP — interaction testing (verifying calls to the view via its protocol)",
      "MVVM — state testing against the view model's published isLoading property using XCTestExpectation",
      "MVC — controller testing by asserting on the UIViewController's internal state after invoking its lifecycle methods",
      "A UI snapshot test capturing the rendered pixels of the loading indicator at both states for visual regression comparison",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Asserting on **which view methods were called** (via a mock conforming to the view protocol) is interaction-based testing — MVP's natural style. MVVM instead asserts on the ViewModel's observable **state** (e.g. `vm.isLoading`). Same goal, different verification approach.",
  },
  {
    id: "mvp-presenter-no-uikit-senior",
    type: "mcq",
    prompt: "For the presenter to stay testable, what must it avoid?",
    options: [
      "Importing UIKit or referencing concrete view types — it should depend only on the view protocol",
      "Having any public methods, because a testable presenter must expose all behavior through the view protocol rather than through its own interface",
      "Using the Model directly; a testable presenter must always retrieve data through a repository protocol injected at initialization time",
      "Being declared as a class rather than a struct, because class-based presenters create strong reference cycles that prevent the mock view from being deallocated between test runs",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The presenter's testability depends on it referencing the view only through the abstract `View` protocol. The moment it imports UIKit or touches a concrete `UILabel`, you can't substitute a mock — the same rule that keeps a ViewModel UI-free.",
  },
  {
    id: "mvp-flashcard",
    type: "flashcard",
    prompt:
      "Explain MVP and how it compares to MVVM. Answer aloud, then reveal.",
    modelAnswer:
      "**MVP** splits into **Model** (data/business), a **passive View** (no logic — forwards user actions and exposes dumb display methods), and a **Presenter** that holds the view via a **protocol contract** and drives it **imperatively** (`view.showTitle(...)`, `view.showLoading(true)`). The contract is a pair of protocols (view-facing and presenter-facing), and the presenter's view reference is **`weak`** to avoid a retain cycle with the owning view controller. Testing is **interaction-based**: inject a mock view and assert which methods were called — no UIKit, no binding. Versus **MVVM**: MVP *pushes* via method calls and needs no reactive layer, while MVVM exposes **observable state** the view *binds* to and is tested by asserting state. MVP fits **UIKit** (testability without a reactive stack); MVVM fits **SwiftUI**'s declarative binding, where MVP's retained-view/imperative model is awkward.",
    keyPoints: [
      "Passive View + Presenter that drives it via a protocol (imperative)",
      "Contract = pair of protocols; presenter holds view weakly",
      "Tested by mocking the view (interaction testing)",
      "No binding/reactive layer required (unlike MVVM)",
      "MVP → UIKit; MVVM → SwiftUI declarative binding",
    ],
    explanation:
      "The senior signal is framing MVP vs MVVM as imperative-push (mock the view, interaction tests) vs observable-state (bind, state tests), and knowing MVP's SwiftUI mismatch plus the weak-view retain-cycle detail.",
  },
];

export default quiz;
