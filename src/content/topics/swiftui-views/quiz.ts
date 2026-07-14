import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "view-body-requirement",
    type: "mcq",
    prompt: "What is the single requirement of the SwiftUI `View` protocol?",
    options: [
      "A `body` computed property that returns some View",
      "A custom `init()` that constructs and positions all subviews imperatively",
      "A `render()` method called by the framework on every display frame to produce output",
      "A `UIView` backing store that SwiftUI reads to produce its native render tree",
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
      "SwiftUI performs the exact same imperative UIView object mutations as UIKit, powered by a faster internal diffing engine",
      "SwiftUI is completely stateless at every layer — all property values are recomputed from absolute scratch with no persistence between frames",
      "They are functionally identical under the hood; SwiftUI is purely a syntactic wrapper layered on top of the same UIKit mutation APIs",
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
      "They must be subclassed to introduce reusable behavior and shared styling, just like UIView subclasses in UIKit",
      "They automatically persist every plain var property to disk across struct re-creations using built-in persistent storage",
      "Their body computed property always executes on a dedicated background thread to keep the main run loop fully unblocked",
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
      "Yes — SwiftUI modifiers are fully commutative and always yield the identical visual result regardless of the chain order",
      "No — the second form is a compile error because SwiftUI's type system requires background to always precede padding in the chain",
      "Yes — the background color always renders visually behind all padding layers, no matter where background appears in the modifier chain",
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
      "`body` is syntactically restricted by the @ViewBuilder result-builder and cannot contain any arbitrary function call expressions",
      "Swift structs ban all networking-related APIs at the language level so URLSession is completely unavailable inside any struct",
      "Placing any async code inside body implicitly and silently converts the entire view struct to a class reference type at compile time",
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
      "It increments and the displayed value persists correctly across re-renders because SwiftUI automatically detects all plain var properties and stores them in external stable storage",
      "It increments the counter value correctly on every single tap but SwiftUI purposefully batches and defers re-renders so the visible displayed count only visually updates every other tap",
      "It silently decrements from zero because the button's escaping closure captures an independent copy of self and decrements only that locally captured value instead of the actual struct",
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
      "The identical original view struct instance with only the padding-related property mutated in place",
      "A UIView subclass instance with the requested padding amount applied via UIKit's Auto Layout constraint system",
      "Void — the modifier registers its effect as a mutation on a process-shared display command list and returns nothing",
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
