import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "observable-fine-grained",
    type: "mcq",
    prompt: "What's the main improvement of `@Observable` over `ObservableObject`?",
    options: [
      "Fine-grained tracking — a view re-renders only when a property it actually read changes",
      "It runs its observation callbacks on a dedicated background thread to avoid blocking the main run loop",
      "It works exclusively with value types and cannot be applied to class-based models that require reference semantics",
      "It removes the need for a body property by synthesizing the view hierarchy from the observable model's property names",
    ],
    answer: 0,
    explanation:
      "`ObservableObject` is object-level (any `@Published` change re-renders all observers). `@Observable` tracks per-property reads, so a view updates only when the specific properties it used change — less wasted rendering.",
  },
  {
    id: "observable-no-published",
    type: "predict",
    prompt: "Does this need `@Published` on its properties?",
    code: `@Observable
final class Model {
    var name = ""
    var age = 0
}`,
    options: [
      "No — @Observable tracks plain stored properties automatically",
      "Yes — every stored property still needs @Published so SwiftUI knows which changes should trigger a view update",
      "Only `name` needs @Published because String properties require explicit annotation while Int properties are tracked implicitly",
      "It will not compile without also declaring ObservableObject conformance, since @Observable is just syntactic sugar over the existing protocol",
    ],
    answer: 0,
    explanation:
      "The `@Observable` macro automatically tracks plain `var` properties — no `@Published`, no `ObservableObject` conformance. That's a big part of the reduced boilerplate.",
  },
  {
    id: "observable-state-fill",
    type: "fill",
    prompt: "With Observation, a view that CREATES and owns an @Observable model declares it with the ___ wrapper (not @StateObject).",
    answers: ["@State", "State"],
    hint: "The same wrapper used for local value state.",
    explanation:
      "With `@Observable`, `@State` now holds owned reference models too. `@StateObject`/`@ObservedObject` are the older ObservableObject-era wrappers.",
  },
  {
    id: "observable-child-let",
    type: "mcq",
    prompt: "How does a read-only child view receive an `@Observable` model in iOS 17+?",
    options: [
      "As a plain `let` property — no @ObservedObject needed",
      "As @ObservedObject, because SwiftUI still requires the explicit wrapper to register the view as a subscriber for property change notifications",
      "As @Binding, so that the child view can write mutations back to the parent's copy of the model through a two-way reference",
      "As @Published, applied to the property declaration inside the child view to opt that specific property into the observation system",
    ],
    answer: 0,
    explanation:
      "Because Observation tracks reads directly, a child can take the model as a plain `let` and still update when the properties it reads change. `@ObservedObject` is no longer required.",
  },
  {
    id: "bindable-purpose",
    type: "mcq",
    prompt: "What is `@Bindable` used for?",
    options: [
      "To get `$` two-way bindings into an @Observable model's properties (e.g. for a TextField) when the model was passed in",
      "To make a class observable by synthesizing the required tracking accessors and conforming it to the Observable protocol",
      "To persist state to disk between app launches by serializing the annotated model to UserDefaults automatically",
      "To run async work in a structured concurrency context that is scoped to the lifetime of the annotated SwiftUI view",
    ],
    answer: 0,
    explanation:
      "`@Bindable` exposes `$` projections for an `@Observable` model you received (or read from the environment), so you can bind controls like `TextField(text: $model.note)`. A `@State`-owned observable already offers `$`.",
  },
  {
    id: "observation-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about the Observation framework.",
    options: [
      "`@Observable` classes need no `@Published` annotations",
      "A view re-renders only for properties it read",
      "`@Observable` requires iOS 17+",
      "You must still use `@StateObject` to own an @Observable model",
    ],
    answers: [0, 1, 2],
    explanation:
      "No `@Published`, per-property tracking, and iOS 17+ are all correct. You own an `@Observable` model with **`@State`**, not `@StateObject` (option 3 is false).",
  },
  {
    id: "observable-vs-object-render-senior",
    type: "predict",
    prompt: "🧠 Trick question — a view's body reads only `model.total`. With `@Observable`, does mutating `model.items` re-render it?",
    code: `@Observable final class Cart { var items: [Int] = []; var total = 0 }
// TotalView.body reads only cart.total`,
    options: [
      "No — it never read `items`, so fine-grained tracking skips the re-render (unlike ObservableObject, which would re-render it)",
      "Yes — any mutation to any property on the observed object triggers a full re-render of every view that holds a reference to that object",
      "Only if items becomes empty, because @Observable treats an empty array as a structural change that invalidates all dependent views",
      "It crashes with a Swift runtime error because modifying items while total is being observed by a view violates the Observation framework's mutation rules",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Observation records that the view read `total` only, so changing `items` doesn't invalidate it. With `ObservableObject`/`@Published`, `objectWillChange` fires for any published change, re-rendering `TotalView` needlessly — the exact over-rendering `@Observable` eliminates.",
  },
  {
    id: "migration-map-senior",
    type: "mcq",
    prompt: "Migrating ObservableObject → @Observable, what does `@EnvironmentObject` become?",
    options: [
      "`@Environment(Type.self)`, injected with `.environment(_:)`",
      "It stays `@EnvironmentObject` because the Observation framework is backward compatible and reuses existing property wrappers without modification",
      "`@State`, because migrating to @Observable means the environment model is now treated as locally owned value state in every view that reads it",
      "`@Published`, applied directly to the property inside the view that needs access to the environment model",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The environment mapping changes: inject with `.environment(model)` and read with `@Environment(Model.self)`. Alongside `@StateObject`→`@State` and `@ObservedObject`→plain `let`/`@Bindable`, this is the standard migration.",
  },
  {
    id: "observation-incremental-senior",
    type: "mcq",
    prompt: "Can you adopt `@Observable` gradually in an existing app?",
    options: [
      "Yes — migrate model by model; pre-iOS-17 code stays on ObservableObject",
      "No — it is an all-or-nothing migration; mixing @Observable and ObservableObject in the same app causes SwiftUI to skip updates on the unconverted models",
      "Only in a brand-new project, because existing ObservableObject conformances create a linker conflict with the Observation module's synthesized accessors",
      "Only for value types, because @Observable cannot be applied to reference types that already inherit from a class with ObservableObject conformance",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Observation coexists with `ObservableObject`, so you can convert one model at a time. The main constraint is the **iOS 17+** deployment target for the `@Observable` models you migrate.",
  },
  {
    id: "observation-flashcard",
    type: "flashcard",
    prompt:
      "Explain the Observation framework: what it fixes, the macro, and the wrapper mapping. Answer aloud, then reveal.",
    modelAnswer:
      "The **Observation framework** (iOS 17+) replaces `ObservableObject` with the **`@Observable`** macro. It fixes two things: **fine-grained tracking** — SwiftUI records which properties a view's `body` **reads** and re-renders it only when *those* change (vs `ObservableObject`'s **object-level** invalidation that re-renders every observer on any `@Published` change) — and **boilerplate** (no `@Published`, no `ObservableObject` conformance; plain `var`s are tracked). Wrapper mapping for iOS 17+: **own** a model with **`@State`** (not `@StateObject`); pass it to read-only children as a **plain `let`** (not `@ObservedObject`); use **`@Bindable`** to get `$` two-way bindings from a passed-in or environment model; and use `@Environment(Type.self)` with `.environment(_:)` for the environment. It's the recommended default for new SwiftUI, adoptable **incrementally** (model by model), with pre-17 code staying on `ObservableObject`.",
    keyPoints: [
      "@Observable = fine-grained, per-property-read tracking (less over-rendering)",
      "No @Published / ObservableObject conformance needed",
      "Own with @State; read-only child takes plain let",
      "@Bindable for $ bindings from a passed-in/environment model",
      "iOS 17+; adopt incrementally; @EnvironmentObject → @Environment(Type.self)",
    ],
    explanation:
      "Senior answers contrast object-level vs per-property observation, give the concrete wrapper migration, and note @Bindable plus incremental/iOS-17 adoption.",
  },
];

export default quiz;
