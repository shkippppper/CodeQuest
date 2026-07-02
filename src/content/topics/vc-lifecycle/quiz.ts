import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "viewdidload-once",
    type: "mcq",
    prompt: "How many times does `viewDidLoad` run for a view controller?",
    options: [
      "Once — when its view is first loaded into memory",
      "Every time the view appears",
      "On every layout pass",
      "Once per app launch, for all VCs",
    ],
    answer: 0,
    explanation:
      "`viewDidLoad` runs **once** per VC lifetime, after the view loads. Do one-time setup there. `viewWillAppear`/`viewDidAppear` run on **every** appearance.",
  },
  {
    id: "lifecycle-order",
    type: "predict",
    prompt: "What's the correct call order when a VC is presented?",
    code: `// pick the order of:
// viewDidAppear, viewDidLoad, viewWillAppear`,
    options: [
      "viewDidLoad → viewWillAppear → viewDidAppear",
      "viewWillAppear → viewDidLoad → viewDidAppear",
      "viewDidAppear → viewDidLoad → viewWillAppear",
      "viewDidLoad → viewDidAppear → viewWillAppear",
    ],
    answer: 0,
    explanation:
      "The view loads first (`viewDidLoad`), then is about to show (`viewWillAppear`), then is on screen (`viewDidAppear`). Disappearance mirrors it: viewWillDisappear → viewDidDisappear.",
  },
  {
    id: "willappear-refresh",
    type: "mcq",
    prompt: "Where should you refresh data that may have changed while the user was on another screen?",
    options: [
      "`viewWillAppear` — it runs every time the view appears, including on return",
      "`viewDidLoad` — it runs once",
      "`loadView`",
      "`didReceiveMemoryWarning`",
    ],
    answer: 0,
    explanation:
      "`viewWillAppear` fires on every appearance, including returning from a pushed screen, so it's the place to refresh possibly-stale UI/data. `viewDidLoad` runs only once and would miss later changes.",
  },
  {
    id: "layout-in-didload-senior",
    type: "predict",
    prompt: "🧠 Trick question — why is reading `view.bounds` for layout math in `viewDidLoad` unreliable?",
    code: `override func viewDidLoad() {
    super.viewDidLoad()
    let w = view.bounds.width   // used to size a subview
}`,
    options: [
      "The view doesn't have its final size yet in viewDidLoad — use viewDidLayoutSubviews",
      "bounds is always nil in viewDidLoad",
      "It crashes",
      "bounds is fine there; this is correct",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "In `viewDidLoad` the view's size is still the placeholder/estimated value from the nib — not the final laid-out size. Frame-dependent math belongs in **`viewDidLayoutSubviews`**, which runs once the real bounds are known (and again on size changes).",
  },
  {
    id: "loadview-purpose",
    type: "mcq",
    prompt: "When do you override `loadView()`?",
    options: [
      "Only when building the entire view hierarchy in code and assigning a custom root view",
      "Every time, to set up subviews",
      "To refresh data on appearance",
      "To handle memory warnings",
    ],
    answer: 0,
    explanation:
      "`loadView` creates the controller's `view`. Storyboard/xib VCs get it for free; you override it only for a fully code-built root view. Ordinary setup goes in `viewDidLoad`.",
  },
  {
    id: "vclifecycle-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about the VC lifecycle.",
    options: [
      "`viewDidLoad` runs once; `viewWillAppear` runs on every appearance",
      "`viewDidLayoutSubviews` is where the view has its real size",
      "`viewDidLoad` is the right place for frame-dependent layout math",
      "`viewWillDisappear`/`viewDidDisappear` are good for stopping timers and saving state",
    ],
    answers: [0, 1, 3],
    explanation:
      "Once-vs-every, layout in `viewDidLayoutSubviews`, and cleanup on disappear are correct. Frame-dependent math should NOT go in `viewDidLoad` (no final size) — option 3 is false.",
  },
  {
    id: "containment-api-senior",
    type: "mcq",
    prompt: "You add a child view controller but its `viewWillAppear` never fires. What did you likely skip?",
    options: [
      "The containment API — `addChild(_:)` and `didMove(toParent:)` around adding the child's view",
      "Calling super.viewDidLoad()",
      "Setting the child's frame",
      "Registering a cell",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Just adding `child.view` as a subview isn't enough. You must call `addChild(child)`, add the view, then `child.didMove(toParent: self)` (and the mirror on removal). Skipping it means the child doesn't get appearance/rotation events.",
  },
  {
    id: "memory-warning-senior",
    type: "mcq",
    prompt: "What should you do in `didReceiveMemoryWarning()`?",
    options: [
      "Release recreatable resources like caches and offscreen data",
      "Deallocate the view controller",
      "Call viewDidLoad again",
      "Nothing — iOS unloads offscreen views for you",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Free resources you can rebuild (caches, large offscreen buffers). On modern iOS, offscreen views are **not** auto-unloaded (the old `viewDidUnload` was deprecated), so managing heavy memory is on you.",
  },
  {
    id: "didappear-work-senior",
    type: "mcq",
    prompt: "Where is the best place to start an entrance animation or begin analytics timing?",
    options: [
      "`viewDidAppear` — the view is actually on screen",
      "`viewDidLoad` — before it's visible",
      "`loadView`",
      "`viewWillDisappear`",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`viewDidAppear` means the view is fully on screen and the appearance transition finished — the right moment to kick off animations, expensive work, or a 'screen viewed' timer. Starting them earlier can conflict with the presentation animation.",
  },
  {
    id: "vclifecycle-flashcard",
    type: "flashcard",
    prompt:
      "Walk through the UIViewController lifecycle and where each kind of work belongs. Answer aloud, then reveal.",
    modelAnswer:
      "Order on presentation: **`loadView`** (creates `view`; override only for a fully code-built root) → **`viewDidLoad`** (runs **once** — one-time setup: subviews, data sources, observers) → **`viewWillAppear`** (every appearance — refresh possibly-stale data/UI) → **`viewDidAppear`** (on screen — start animations, expensive work, analytics timing). Leaving mirrors it: **`viewWillDisappear`** → **`viewDidDisappear`** (stop timers, save state). Layout has its own hook: **`viewDidLayoutSubviews`** is where the view has its **real size**, so frame-dependent math goes there — **not** in `viewDidLoad`, where the size is still a placeholder. Handle low memory in **`didReceiveMemoryWarning`** by freeing recreatable resources (offscreen views aren't auto-unloaded on modern iOS). For **container VCs**, use the containment API — `addChild` + `didMove(toParent:)` (and `willMove(toParent: nil)` + `removeFromParent()`) — or child appearance/rotation events won't fire. Rule of thumb: one-time setup in `viewDidLoad`, per-appearance refresh in `viewWillAppear`, layout in `viewDidLayoutSubviews`.",
    keyPoints: [
      "loadView → viewDidLoad (once) → viewWillAppear/viewDidAppear (every time)",
      "One-time setup in viewDidLoad; per-appearance refresh in viewWillAppear",
      "Frame math in viewDidLayoutSubviews (real size), not viewDidLoad",
      "Cleanup (timers/state) on viewWillDisappear/viewDidDisappear",
      "Container VCs need addChild + didMove(toParent:) or child events break",
    ],
    explanation:
      "Senior answers get the once-vs-every distinction, the viewDidLoad-lacks-final-size layout gotcha, and the containment API for child VCs.",
  },
];

export default quiz;
