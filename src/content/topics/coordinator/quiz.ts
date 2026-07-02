import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "coordinator-purpose",
    type: "mcq",
    prompt: "What problem does the Coordinator pattern primarily solve?",
    options: [
      "It removes navigation/flow logic from view controllers, making them flow-agnostic and reusable",
      "It speeds up view rendering",
      "It replaces the Model layer",
      "It manages memory automatically",
    ],
    answer: 0,
    explanation:
      "Coordinators own app flow, so a view controller no longer knows which screen comes next — it just reports events. That decouples screens and centralizes navigation logic.",
  },
  {
    id: "vc-reports-event",
    type: "mcq",
    prompt: "In the Coordinator pattern, how does a view controller trigger navigation?",
    options: [
      "It reports an event (via delegate/closure); the coordinator decides the destination",
      "It pushes the next view controller itself",
      "It calls the AppDelegate",
      "It mutates global navigation state directly",
    ],
    answer: 0,
    explanation:
      "The controller exposes something like `onSelectProfile` and stays ignorant of the next screen. The coordinator wires that event to an actual navigation action — keeping the controller reusable.",
  },
  {
    id: "child-retain-fill",
    type: "fill",
    prompt: "A parent coordinator must ___ its child coordinators (typically in an array) so they aren't deallocated mid-flow.",
    answers: ["retain", "keep", "hold", "store"],
    hint: "Keep a strong reference to them.",
    explanation:
      "Coordinators are plain objects with no view lifecycle keeping them alive, so the parent holds children in a `childCoordinators` array — and removes them when the flow finishes.",
  },
  {
    id: "coordinator-leak",
    type: "mcq",
    prompt: "What's the classic memory bug with child coordinators?",
    options: [
      "Forgetting to remove a finished child from the parent's array, so it leaks",
      "Retaining the navigation controller weakly",
      "Using closures for callbacks",
      "Creating too few coordinators",
    ],
    answer: 0,
    explanation:
      "If the parent never removes a child after its flow ends, the child (and everything it holds) leaks. The fix: on the child's `onFinish`, remove it from `childCoordinators`.",
  },
  {
    id: "data-flow-direction",
    type: "mcq",
    prompt: "How does data typically flow with coordinators?",
    options: [
      "Down via initializers/parameters when building a screen; up via closures/delegates when a screen reports an event",
      "Only through global singletons",
      "Only downward, never back up",
      "Through NotificationCenter exclusively",
    ],
    answer: 0,
    explanation:
      "The coordinator injects data **down** into the screens it builds, and screens send events **up** via closures/delegates. Coordinators coordinate with each other through `onFinish`-style callbacks.",
  },
  {
    id: "coordinator-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about the Coordinator pattern.",
    options: [
      "It makes view controllers reusable across different flows",
      "Nested flows can each have their own child coordinator",
      "It requires the view controller to know its next screen",
      "VIPER's Router is essentially a coordinator",
    ],
    answers: [0, 1, 3],
    explanation:
      "Reusable controllers, nested child coordinators, and the VIPER-Router relationship are all true. The whole point is that the controller **does not** know its next screen (option 3 is false).",
  },
  {
    id: "coordinator-swiftui-senior",
    type: "mcq",
    prompt: "How does the coordinator idea map onto SwiftUI's navigation?",
    options: [
      "A Router/coordinator owns a NavigationPath as observable state; views append typed routes instead of pushing controllers",
      "SwiftUI can't keep navigation out of views",
      "You must drop coordinators entirely in SwiftUI",
      "Coordinators become UIViewControllers",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "SwiftUI navigation is state-driven, so the coordinator becomes a `Router` object owning a `NavigationPath`. Views append typed `Route` values; a `NavigationStack(path:)` with `.navigationDestination(for:)` renders them — same principle (navigation outside the view), declarative shape.",
  },
  {
    id: "coordinator-weak-callback-senior",
    type: "predict",
    prompt: "🧠 Trick question — a child coordinator's `onFinish` closure captures `self` (the parent) strongly, and the parent retains the child. What's the risk?",
    code: `child.onFinish = { self.removeChild(child) }   // strong self + parent holds child`,
    options: [
      "A retain cycle — parent → child (array) and child → parent (closure) keep each other alive",
      "Nothing — this is correct",
      "The child never starts",
      "A compile error",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The parent strongly holds the child in `childCoordinators`, and the child's closure strongly captures the parent — a **retain cycle**. Even after removal logic runs, the strong capture can keep things alive incorrectly. Capture `[weak self]` (and often `[weak child]`) in the callback to break it.",
  },
  {
    id: "coordinator-mvvm-compose-senior",
    type: "mcq",
    prompt: "How does the Coordinator pattern relate to MVVM?",
    options: [
      "They compose — MVVM handles presentation while the coordinator handles navigation the ViewModel delegates out",
      "They are mutually exclusive",
      "Coordinators replace ViewModels",
      "MVVM already includes coordinators by definition",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A common, clean setup: ViewModels own presentation and, instead of navigating, emit an intent the coordinator acts on. This keeps ViewModels testable and navigation centralized — the two patterns complement each other.",
  },
  {
    id: "coordinator-flashcard",
    type: "flashcard",
    prompt:
      "Explain the Coordinator pattern, the child-coordinator lifetime gotcha, and its SwiftUI form. Answer aloud, then reveal.",
    modelAnswer:
      "The **Coordinator pattern** pulls navigation/flow out of view controllers into dedicated **coordinator** objects. A controller becomes **flow-agnostic**: it reports events (via delegate/closure like `onSelectProfile`) and the coordinator decides the destination and builds the next screen — so controllers are reusable and flow logic lives in one changeable place. Nested flows (onboarding, checkout) get **child coordinators**; the parent must **retain children in a `childCoordinators` array and remove them when their flow finishes**, because coordinators have no view lifecycle to keep them alive — forgetting to remove a finished child is the classic **leak**, and strong `self`/`child` captures in `onFinish` closures cause **retain cycles** (use `[weak self]`). Data flows **down** via initializers and **up** via closures/delegates. In **SwiftUI**, the coordinator becomes a `Router` owning a `NavigationPath` as observable state; views append typed routes and a `NavigationStack` renders them. It composes with MVVM (ViewModel presents; coordinator navigates) and is essentially VIPER's Router.",
    keyPoints: [
      "Navigation lives in coordinators; VCs report events, stay flow-agnostic",
      "Parent retains child coordinators; remove on finish or leak",
      "Watch retain cycles in onFinish closures ([weak self])",
      "Data down via init, up via closures/delegates",
      "SwiftUI: Router owns NavigationPath; composes with MVVM (= VIPER Router)",
    ],
    explanation:
      "Senior answers stress child-coordinator lifetime management (retain + remove, weak captures) and the SwiftUI NavigationPath mapping, not just 'move navigation out of VCs'.",
  },
];

export default quiz;
