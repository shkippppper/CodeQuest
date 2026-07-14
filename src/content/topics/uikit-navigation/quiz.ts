import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "push-vs-present",
    type: "mcq",
    prompt: "When do you push onto a UINavigationController vs present modally?",
    options: [
      "Push for hierarchical drill-down (back button); present for a self-contained temporary task (dismiss)",
      "Push is the correct choice for modals like login or compose sheets; present is for navigating deeper into a content hierarchy",
      "They are functionally identical — UIKit routes both through the same internal transition engine with the same animations and lifecycle callbacks",
      "Always use present for every transition; push is deprecated and removed in iOS 17 and later",
    ],
    answer: 0,
    explanation:
      "`pushViewController` adds to the nav stack for drill-down flows with a back button. `present` shows a modal interruption (compose, login, picker) you `dismiss`. Choose by whether it's part of a hierarchy or a temporary task.",
  },
  {
    id: "nav-stack",
    type: "mcq",
    prompt: "What does a UINavigationController manage?",
    options: [
      "A stack of view controllers with a nav bar and automatic back button",
      "A scrollable grid of cells and supplementary views, backed by a UICollectionViewLayout that handles positioning",
      "The system keyboard input pipeline, routing key events from the hardware layer to the first responder in the view hierarchy",
      "A single view controller at any given time, swapping it out entirely rather than stacking multiple controllers",
    ],
    answer: 0,
    explanation:
      "It owns a `viewControllers` stack; pushing adds a VC (with a back button), popping removes it. `popToRootViewController` returns to the first.",
  },
  {
    id: "prepare-forward",
    type: "mcq",
    prompt: "With storyboard segues, where do you pass data to the destination VC?",
    options: [
      "`prepare(for:sender:)` — configure `segue.destination` before the transition",
      "In viewDidLoad of the source view controller, by accessing the storyboard segue destination through a stored reference set at segue creation time",
      "In the AppDelegate's application(_:didFinishLaunchingWithOptions:) method, by storing data in a shared singleton the destination reads on load",
      "You cannot pass data at all with storyboard segues — programmatic navigation with pushViewController is required for any data-passing flow",
    ],
    answer: 0,
    explanation:
      "`prepare(for:sender:)` runs just before the segue's transition; cast `segue.destination` and set its properties to pass data forward.",
  },
  {
    id: "data-back-delegate",
    type: "mcq",
    prompt: "What's the clean way to return a result from a pushed VC back to the one that presented it?",
    options: [
      "A delegate protocol or closure callback the parent provides",
      "Have the child import and set properties on its parent directly",
      "A global variable",
      "reloadData on the parent",
    ],
    answer: 0,
    explanation:
      "The child should know only an abstraction (a delegate protocol or a closure the parent set), not its concrete caller. It calls back on save/cancel. This keeps the child reusable across flows.",
  },
  {
    id: "weak-delegate-fill",
    type: "fill",
    prompt: "Declare a view controller's `delegate` property as ___ to avoid a retain cycle with its owner.",
    answers: ["weak"],
    hint: "The reference qualifier that doesn't retain.",
    explanation:
      "`weak var delegate: ...` prevents the child from strongly retaining its parent (which typically owns the child) — otherwise they'd keep each other alive.",
  },
  {
    id: "uikitnav-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about UIKit navigation.",
    options: [
      "Passing data forward is done by setting properties on the destination before showing it",
      "A presented modal can contain its own UINavigationController",
      "Passing data back should use a delegate/closure, not direct parent access",
      "`present` adds the VC to the navigation stack with a back button",
    ],
    answers: [0, 1, 2],
    explanation:
      "Forward via properties, modals can embed a nav controller, and data-back via delegate/closure are correct. `present` shows a **modal** (no nav-stack back button) — option 3 is false.",
  },
  {
    id: "delegate-retain-cycle-senior",
    type: "predict",
    prompt: "🧠 Trick question — a pushed VC declares `var delegate: EditDelegate?` (strong) and the parent is the delegate. What's the risk?",
    code: `final class EditVC: UIViewController {
    var delegate: EditDelegate?   // strong!
}
// parent: editVC.delegate = self`,
    options: [
      "A retain cycle — the parent owns the child (nav stack) and the child strongly holds the parent as delegate",
      "Nothing at all — UIKit automatically breaks delegate retain cycles at deallocation time, so a strong delegate reference is perfectly safe in practice",
      "The delegate callbacks silently never fire because UIKit skips calling a delegate stored as a strong reference, only invoking weak delegates",
      "A compile-time error, because Swift's type system rejects any delegate property declaration that is not explicitly marked weak or unowned",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The parent typically retains the child (it's on the nav stack or held during presentation), and a **strong** delegate makes the child retain the parent back — a cycle that leaks both. Declare the delegate `weak`.",
  },
  {
    id: "programmatic-vs-segue-senior",
    type: "mcq",
    prompt: "Why do many teams prefer programmatic navigation over storyboard segues at scale?",
    options: [
      "It's more explicit/testable, avoids storyboard merge conflicts, and composes with coordinators",
      "Storyboard segues were removed from the UIKit API surface in iOS 16 and are no longer supported on modern OS versions",
      "Programmatic pushViewController or present calls are the only mechanism UIKit offers for passing data forward to the destination view controller",
      "Storyboard segues cannot perform custom animated transitions and always fall back to the default non-animated instantaneous swap between screens",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Programmatic navigation keeps flow in code (testable, refactor-friendly, no big-storyboard merge conflicts) and pairs with the coordinator pattern. Segues are convenient for small storyboard screens but get unwieldy in large apps.",
  },
  {
    id: "coordinator-extract-senior",
    type: "mcq",
    prompt: "How does the Coordinator pattern relate to UIKit navigation?",
    options: [
      "It extracts push/present calls out of view controllers into a coordinator, so VCs report events and stay reusable",
      "It replaces UINavigationController entirely with a custom coordinator-owned navigation stack that manages memory and transitions independently",
      "It is exclusively a SwiftUI pattern and has no applicability to UIKit-based apps using view controllers",
      "It forces every view controller to explicitly know and import its next destination screen in order to trigger the correct coordinator transition",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Putting `pushViewController`/`present` in VCs couples them to a specific flow. A coordinator owns navigation; VCs emit events (delegate/closure) and the coordinator decides where to go — centralizing flow and keeping controllers flow-agnostic and reusable.",
  },
  {
    id: "uikit-navigation-flashcard",
    type: "flashcard",
    prompt:
      "Explain UIKit navigation mechanisms and the pass-data-back pattern. Answer aloud, then reveal.",
    modelAnswer:
      "UIKit navigation is imperative. **`UINavigationController`** manages a **push/pop stack** with a nav bar and back button for **hierarchical drill-down** (`pushViewController`/`popViewController`). **Modal presentation** (`present`/`dismiss`, styled via `modalPresentationStyle`) is for a **self-contained interruption** (compose, login, picker) — a modal can embed its own nav controller. You wire transitions via **segues** (storyboard; configure the destination in **`prepare(for:sender:)`**) or **programmatically** in code (more explicit/testable, avoids storyboard merge conflicts, pairs with coordinators). **Passing data forward** is easy: set properties on the destination before showing it. **Passing data back** is the tricky part: use a **delegate protocol** or a **closure** the parent provides — and declare the delegate **`weak`** to avoid a retain cycle (the parent owns the child, so a strong back-reference leaks both). The child should never import/reach into its concrete parent, only the abstraction, so it stays reusable. As flows grow, the **Coordinator pattern** extracts push/present out of VCs so navigation lives in one place.",
    keyPoints: [
      "UINavigationController = push/pop stack (drill-down); present/dismiss = modal",
      "Segue (prepare(for:)) vs programmatic (code); teams often prefer programmatic",
      "Forward: set destination properties; Back: delegate protocol or closure",
      "Delegate must be weak → avoid retain cycle with owner",
      "Coordinator pattern extracts navigation out of VCs for reuse",
    ],
    explanation:
      "Senior answers separate push vs present, nail data-back via weak delegate/closure (not direct parent access), and mention coordinators for scaling.",
  },
];

export default quiz;
