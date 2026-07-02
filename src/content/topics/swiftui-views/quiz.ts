import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "view-body-requirement",
    type: "mcq",
    prompt: "What is the single requirement of the SwiftUI `View` protocol?",
    options: [
      "A `body` computed property that returns some View",
      "An `init()` that builds subviews",
      "A `render()` method",
      "A `UIView` backing store",
    ],
    answer: 0,
    explanation:
      "`View` requires a `body` computed property describing the UI. SwiftUI calls `body` to render; you compose smaller views inside it.",
  },
  {
    id: "declarative-vs-imperative",
    type: "mcq",
    prompt: "How does SwiftUI's declarative model differ from UIKit's imperative one?",
    options: [
      "You describe the UI as a function of state; the framework diffs descriptions and updates the render tree — you don't mutate view objects",
      "SwiftUI mutates UIViews faster",
      "SwiftUI has no state",
      "They are the same, just different syntax",
    ],
    answer: 0,
    explanation:
      "In SwiftUI `body` returns a fresh description of the UI for the current state; SwiftUI computes minimal updates. You never hold and mutate view objects the way you do with UIKit's `label.text = ...`.",
  },
  {
    id: "some-view-fill",
    type: "fill",
    prompt: "The return type of `body`, written `___ View`, is an opaque type hiding the complex generic view type.",
    answers: ["some"],
    hint: "A keyword introduced for opaque return types.",
    explanation:
      "`some View` says 'one specific concrete View type, unnamed'. It spares you writing the huge nested generic that `body` actually produces.",
  },
  {
    id: "views-are-structs",
    type: "mcq",
    prompt: "SwiftUI views are value types (structs). What follows from that?",
    options: [
      "They're cheap, disposable descriptions recreated on each update — so mutable state can't be a plain `var`",
      "They must be subclassed to reuse",
      "They persist their state automatically as plain vars",
      "They run on a background thread",
    ],
    answer: 0,
    explanation:
      "Because the struct is recreated constantly, a plain `var` would reset each update. Mutable UI state needs a wrapper like `@State` that SwiftUI stores outside the transient struct.",
  },
  {
    id: "modifier-order-predict",
    type: "predict",
    prompt: "Do these two produce the same result?",
    code: `Text("Hi").padding().background(.blue)
Text("Hi").background(.blue).padding()`,
    options: [
      "No — modifier order matters; the first pads then colors around the padding, the second colors a tight box then pads outside it",
      "Yes — modifiers are commutative",
      "No — the second won't compile",
      "Yes — background always wins",
    ],
    answer: 0,
    explanation:
      "Each modifier wraps the previous view, so order changes the result. `.padding().background()` extends the blue behind the padding; `.background().padding()` colors a tight box, then adds transparent padding around it.",
  },
  {
    id: "views-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about SwiftUI views.",
    options: [
      "`body` may be called very often, so it should be cheap and side-effect-free",
      "Modifiers return a new wrapped view rather than mutating the original",
      "Views are reference types you mutate in place",
      "`@ViewBuilder` lets you list child views without commas and use simple `if`/`switch`",
    ],
    answers: [0, 1, 3],
    explanation:
      "Cheap side-effect-free `body`, wrapping modifiers, and `@ViewBuilder` composition are all correct. Views are **value types (structs)**, not mutable reference types (option 3 is false).",
  },
  {
    id: "body-side-effects-senior",
    type: "mcq",
    prompt: "Why is putting a network call directly in `body` a mistake?",
    options: [
      "`body` runs whenever SwiftUI re-renders (potentially very often), so the call would fire unpredictably and repeatedly",
      "`body` can't contain function calls",
      "Networking is banned in structs",
      "It would make the view a class",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`body` is a pure description recomputed on every state change/re-render — you can't predict how often. Side effects belong in lifecycle hooks like `.task`/`.onAppear`, not `body`.",
  },
  {
    id: "plain-var-state-senior",
    type: "predict",
    prompt: "🧠 Trick question — what happens to `count` when the view re-renders?",
    code: `struct Counter: View {
    var count = 0                 // plain var, no @State
    var body: some View {
        Button("Count: \\(count)") { count += 1 }
    }
}`,
    options: [
      "It won't compile — you can't mutate a plain `var` from a view's button closure (self is immutable), and even if you could it'd reset each render",
      "It increments and persists fine",
      "It increments but only every other tap",
      "It counts down",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A `View` struct is immutable in its `body`, so `count += 1` in the closure doesn't compile (mutating captured `self`). Conceptually it also couldn't work: the struct is recreated each render, resetting a plain `var`. Mutable state must use `@State`, which SwiftUI stores outside the struct — the whole reason that wrapper exists.",
  },
  {
    id: "modifier-wraps-senior",
    type: "mcq",
    prompt: "What does applying a modifier like `.padding()` actually return?",
    options: [
      "A new view value that wraps the original (e.g. a modified-content type), not a mutated original",
      "The same view instance, mutated in place",
      "A UIView with padding",
      "Void — it modifies by side effect",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Modifiers are functions returning a new wrapped view (`ModifiedContent`/opaque type). Nothing is mutated — which is exactly why order matters and why you can chain them into a fresh description each render.",
  },
  {
    id: "swiftui-views-flashcard",
    type: "flashcard",
    prompt:
      "Explain SwiftUI's view model: declarative, value types, body, modifiers. Answer aloud, then reveal.",
    modelAnswer:
      "SwiftUI is **declarative**: a `View`'s **`body`** is a function of state that *describes* the UI for the current moment; the framework diffs successive descriptions and updates the real render tree it manages — you never hold or mutate view objects like in UIKit. Views are **cheap value-type structs**, created and discarded constantly, which is why mutable UI state can't be a plain `var` (it'd reset each render, and `self` is immutable in `body`) — it needs a wrapper like `@State` stored outside the struct. `body` returns **`some View`** (an opaque type hiding the huge generic), should be **cheap and side-effect-free** (it runs often — do I/O in `.task`/`.onAppear`, not `body`). You style/layout via **modifiers**, which each return a **new wrapped view**, so **order matters** (`.padding().background()` ≠ `.background().padding()`). Children are composed with **`@ViewBuilder`** (comma-free lists, simple `if`/`switch`), and cheap value-type views make **previews** trivial.",
    keyPoints: [
      "Declarative: body = function of state; framework diffs & updates",
      "Views are value-type structs, recreated constantly → need @State for mutable state",
      "some View = opaque return type; body must be cheap/side-effect-free",
      "Modifiers return new wrapped views → order matters",
      "@ViewBuilder composes children; previews are trivial",
    ],
    explanation:
      "Senior answers connect value-type views to why @State exists and why body must be side-effect-free, plus the modifier-order consequence of wrapping.",
  },
];

export default quiz;
