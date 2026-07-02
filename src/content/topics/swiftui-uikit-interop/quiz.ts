import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "representable-purpose",
    type: "mcq",
    prompt: "What does conforming to `UIViewRepresentable` let you do?",
    options: [
      "Wrap a UIKit `UIView` so it can be used as a SwiftUI view",
      "Convert a SwiftUI view into a UIView permanently",
      "Run SwiftUI on the web",
      "Replace @State with UIKit state",
    ],
    answer: 0,
    explanation:
      "`UIViewRepresentable` bridges a `UIView` into SwiftUI. `UIViewControllerRepresentable` does the same for a whole `UIViewController`. Both put UIKit *inside* SwiftUI.",
  },
  {
    id: "make-vs-update",
    type: "mcq",
    prompt: "What's the difference between `makeUIView` and `updateUIView`?",
    options: [
      "`makeUIView` creates the view once; `updateUIView` runs whenever SwiftUI state changes, to sync it into UIKit",
      "`makeUIView` runs every frame; `updateUIView` runs once",
      "They are called in random order",
      "Only one of them is required",
    ],
    answer: 0,
    explanation:
      "`makeUIView` is called **once** to build the UIKit view. `updateUIView` is called on relevant state changes — the place to push SwiftUI data into the UIKit object. Don't recreate the view in `update`.",
  },
  {
    id: "coordinator-purpose",
    type: "mcq",
    prompt: "Why do you need a Coordinator in a Representable?",
    options: [
      "UIKit communicates via delegate/target-action objects, but the Representable is a value type — the Coordinator (a class) acts as the delegate and forwards events back to SwiftUI",
      "To speed up rendering",
      "To store the UIView",
      "To replace @Binding",
    ],
    answer: 0,
    explanation:
      "A `struct` Representable can't be a UIKit delegate. The Coordinator is a class you create in `makeCoordinator()` that becomes the delegate/target and pushes UIKit events back into SwiftUI (bindings/closures).",
  },
  {
    id: "hostingcontroller-fill",
    type: "fill",
    prompt: "To embed a SwiftUI view inside a UIKit app, wrap it in a UI___Controller and push/present it.",
    answers: ["Hosting", "HostingController"],
    hint: "UI____Controller(rootView:).",
    explanation:
      "`UIHostingController(rootView:)` wraps a SwiftUI view in a `UIViewController` — the standard way to adopt SwiftUI incrementally inside an existing UIKit codebase.",
  },
  {
    id: "data-up-binding",
    type: "mcq",
    prompt: "How does a UIKit event (e.g. an image was picked) get back into SwiftUI's state?",
    options: [
      "The Coordinator (delegate) writes to a `@Binding` or calls a closure, updating the SwiftUI source of truth",
      "SwiftUI polls the UIView every frame",
      "Through a global variable",
      "It can't — data only flows down",
    ],
    answer: 0,
    explanation:
      "Data flows up through the Coordinator: it receives the delegate callback and writes to a `@Binding` (or invokes a closure), so SwiftUI's state updates and re-renders.",
  },
  {
    id: "interop-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about SwiftUI ↔ UIKit interop.",
    options: [
      "`UIViewControllerRepresentable` wraps a whole UIViewController for use in SwiftUI",
      "`UIHostingController` hosts SwiftUI inside a UIKit hierarchy",
      "`makeUIView` runs on every state change",
      "Data flows down via representable properties and up via the Coordinator",
    ],
    answers: [0, 1, 3],
    explanation:
      "Controller wrapping, hosting SwiftUI in UIKit, and the down/up data flow are correct. `makeUIView` runs **once** (it's `updateUIView` that runs on state changes) — option 3 is false.",
  },
  {
    id: "update-heavy-work-senior",
    type: "predict",
    prompt: "🧠 Trick question — a teammate creates the WKWebView inside `updateUIView`. What goes wrong?",
    code: `func updateUIView(_ v: WKWebView, context: Context) {
    let web = WKWebView()   // creating it here!
    web.load(URLRequest(url: url))
}`,
    options: [
      "updateUIView runs repeatedly, so a new view is built each time (wasteful/broken) — creation belongs in makeUIView",
      "Nothing — this is the correct place",
      "It won't compile",
      "It permanently caches the page",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`updateUIView` fires on every relevant state change, so allocating a fresh `WKWebView` there wastes work and discards the passed-in view. Create the UIKit object once in `makeUIView`; use `updateUIView` only to sync state onto the existing instance.",
  },
  {
    id: "coordinator-context-senior",
    type: "mcq",
    prompt: "How does the Representable get its Coordinator to set as the UIKit view's delegate?",
    options: [
      "SwiftUI creates it via `makeCoordinator()` and provides it as `context.coordinator` inside make/update",
      "You instantiate it globally",
      "It's injected via @Environment automatically",
      "UIKit creates it for you",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "SwiftUI calls `makeCoordinator()` and passes the result through `context.coordinator` in `makeUIView(Controller)`/`updateUIView(Controller)`, where you assign it as the delegate/data source of the UIKit object.",
  },
  {
    id: "incremental-adoption-senior",
    type: "mcq",
    prompt: "A UIKit app wants to add one new screen written in SwiftUI. What's the standard approach?",
    options: [
      "Build the screen in SwiftUI and push a `UIHostingController(rootView:)` from the existing UIKit flow",
      "Rewrite the entire app in SwiftUI first",
      "Use UIViewRepresentable to wrap the SwiftUI view",
      "It's impossible to mix them",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`UIHostingController` hosts SwiftUI inside UIKit, so you can add SwiftUI screens one at a time and push/present them from existing UIKit navigation — the normal path for incremental adoption. (Representable goes the *other* direction: UIKit inside SwiftUI.)",
  },
  {
    id: "interop-flashcard",
    type: "flashcard",
    prompt:
      "Explain the SwiftUI↔UIKit bridges and the Coordinator's role. Answer aloud, then reveal.",
    modelAnswer:
      "Two directions. **UIKit inside SwiftUI**: conform to **`UIViewRepresentable`** (wrap a `UIView`) or **`UIViewControllerRepresentable`** (wrap a `UIViewController`) — implement **`make…`** (create the UIKit object **once**) and **`update…`** (push SwiftUI state into it whenever dependencies change; don't recreate it here). **SwiftUI inside UIKit**: **`UIHostingController(rootView:)`** wraps a SwiftUI view in a `UIViewController` you push/present/embed — the standard path for **incremental SwiftUI adoption**. The **Coordinator** solves the callback problem: UIKit communicates via **delegate/target-action objects**, but a Representable is a value type, so you create a Coordinator **class** in `makeCoordinator()` (delivered as `context.coordinator`) to be the delegate and forward UIKit events **back into SwiftUI** by writing to a **`@Binding`** or calling a closure. Data flow: **down** via the representable's properties applied in `update…`, **up** via the Coordinator into a binding.",
    keyPoints: [
      "UIViewRepresentable / UIViewControllerRepresentable: UIKit → SwiftUI",
      "make… creates once; update… syncs SwiftUI state on change (don't recreate)",
      "UIHostingController: SwiftUI → UIKit (incremental adoption)",
      "Coordinator (class via makeCoordinator) bridges delegate/target-action back to SwiftUI",
      "Data down via properties/update…, up via Coordinator → @Binding",
    ],
    explanation:
      "Senior answers name both directions, the make-once/update-often rule, and the Coordinator's job of turning UIKit delegate callbacks into SwiftUI binding updates.",
  },
];

export default quiz;
