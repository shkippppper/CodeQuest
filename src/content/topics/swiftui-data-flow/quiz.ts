import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "observableobject-published",
    type: "mcq",
    prompt: "How do you mark properties of an `ObservableObject` so their changes update observing views?",
    options: ["`@Published`", "`@State`, storing the value inside SwiftUI's external graph", "`@Observed`, the ObservableObject equivalent of the @Observable macro", "`@Binding`, forwarding write-back to the object's owning view"],
    answer: 0,
    explanation:
      "`@Published` properties emit `objectWillChange` when they change, re-rendering any view observing the object. `ObservableObject` must be a class (reference type).",
  },
  {
    id: "stateobject-vs-observed",
    type: "mcq",
    prompt: "What's the key difference between `@StateObject` and `@ObservedObject`?",
    options: [
      "`@StateObject` means the view creates & owns the object (kept alive across re-renders); `@ObservedObject` observes one owned elsewhere",
      "`@ObservedObject` is faster because it skips SwiftUI's internal lifetime management overhead and lets the object live directly on the heap",
      "`@StateObject` is only for value types, and you must use `@ObservedObject` any time the model is declared as a reference-type class",
      "They are completely interchangeable — both wrappers keep the object alive across re-renders and update the view on every @Published change",
    ],
    answer: 0,
    explanation:
      "`@StateObject` = ownership: SwiftUI instantiates it once and persists it. `@ObservedObject` = borrowing: the object is created/owned elsewhere and passed in; SwiftUI won't manage its lifetime.",
  },
  {
    id: "observed-recreate-bug",
    type: "predict",
    prompt: "🧠 Trick question — what's wrong with this?",
    code: `struct Screen: View {
    @ObservedObject var model = ViewModel()   // created here
    var body: some View { /* ... */ }
}`,
    options: [
      "The model is re-created every time the parent re-renders, silently resetting its state — use @StateObject",
      "Nothing — this is correct; @ObservedObject can manage the object's lifetime when it's initialized inline just as well as @StateObject can",
      "@ObservedObject can't hold a class because it is designed exclusively for value types that conform to ObservableObject",
      "It won't compile because creating an ObservableObject inline in a property declaration requires the @StateObject wrapper instead",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`@ObservedObject` doesn't own the object's lifetime, so creating it inline means it's rebuilt on every re-render of `Screen`, resetting all its state. When a view **creates** the model, use **`@StateObject`**; use `@ObservedObject` only for a model passed in from outside.",
  },
  {
    id: "environmentobject-inject-fill",
    type: "fill",
    prompt: "To make an ObservableObject available to all descendants implicitly, inject it with the `.___(_:)` modifier and read it with `@EnvironmentObject`.",
    answers: ["environmentObject"],
    hint: "`.___(session)` — same word as the wrapper minus '@' and 'Object' style.",
    explanation:
      "`.environmentObject(session)` injects the object into the environment; descendants read it via `@EnvironmentObject var session: Session` without explicit passing.",
  },
  {
    id: "environmentobject-crash",
    type: "mcq",
    prompt: "What happens if a view uses `@EnvironmentObject` but no ancestor injected that object?",
    options: [
      "The app crashes at runtime when the view appears",
      "It silently uses a default instance constructed by calling the type's no-argument initializer, so no injection is strictly required",
      "A compile error, because the compiler enforces that every @EnvironmentObject type must be injected somewhere in the view hierarchy",
      "The view is skipped entirely and rendered as an empty rectangle until an ancestor provides the required environment object",
    ],
    answer: 0,
    explanation:
      "`@EnvironmentObject` is resolved at runtime; a missing injection is a **runtime crash**. That's the trade-off for the convenience of implicit propagation — use it for genuinely app-wide models.",
  },
  {
    id: "environment-value",
    type: "mcq",
    prompt: "What does `@Environment(\\.colorScheme)` read?",
    options: [
      "A built-in environment VALUE (light/dark), by key path — distinct from @EnvironmentObject",
      "A shared ObservableObject injected into the environment via the .environmentObject modifier",
      "A value parsed from the app's Info.plist, which SwiftUI exposes through the environment for convenience",
      "The current device orientation, and only that — it cannot read any other environment value from a key path",
    ],
    answer: 0,
    explanation:
      "`@Environment(\\.key)` reads environment **values** (colorScheme, dismiss, locale, size class, or custom ones via `EnvironmentKey`). `@EnvironmentObject` is the separate wrapper for injected reference-type `ObservableObject`s.",
  },
  {
    id: "dataflow-truths-multi",
    type: "multi",
    prompt: "Select **all** correct statements.",
    options: [
      "`ObservableObject` must be a class (reference type)",
      "You create/own a model with `@StateObject` and observe an external one with `@ObservedObject`",
      "`@EnvironmentObject` is resolved at compile time, so a missing injection is a build error",
      "`@Environment(\\.key)` reads values, not injected objects",
    ],
    answers: [0, 1, 3],
    explanation:
      "Class-based ObservableObject, the StateObject/ObservedObject ownership split, and `@Environment` reading values are correct. `@EnvironmentObject` is resolved at **runtime** and crashes if missing (option 3 is false).",
  },
  {
    id: "object-level-observation-senior",
    type: "mcq",
    prompt: "With `ObservableObject`/`@Published`, if a view reads only `model.name` but `model.age` changes, what happens?",
    options: [
      "The view still re-renders — ObservableObject observation is object-level, not property-level",
      "Nothing — only views that explicitly access `age` in their body re-render when that specific property changes",
      "It crashes with a precondition failure because SwiftUI detects the view read a stale property after objectWillChange fired",
      "Only the individual Text or Label views that display `age` update their content, leaving the rest of the view unchanged",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Classic `ObservableObject` fires `objectWillChange` for **any** `@Published` change, so every observing view re-renders regardless of which property it reads. The `@Observable` macro (next topic) fixes this with **fine-grained, per-property** tracking.",
  },
  {
    id: "choosing-wrapper-senior",
    type: "mcq",
    prompt: "A deeply-nested view needs the app-wide `Session` model without threading it through every initializer. Best tool?",
    options: [
      "`@EnvironmentObject` (inject once at the top, read anywhere below)",
      "`@State` declared independently in each view, storing a separate copy of the session in every level of the hierarchy",
      "Pass it explicitly through every intermediate view's init as an @ObservedObject parameter, regardless of how many layers there are",
      "A global singleton referenced directly inside each view's body, bypassing SwiftUI's observation and dependency tracking entirely",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`@EnvironmentObject` is designed for app-wide models shared across many layers: inject once with `.environmentObject`, read implicitly in any descendant. Manual passing is tedious; a global singleton bypasses SwiftUI's observation and testability.",
  },
  {
    id: "dataflow-flashcard",
    type: "flashcard",
    prompt:
      "Explain ObservableObject and the StateObject/ObservedObject/EnvironmentObject/Environment choices. Answer aloud, then reveal.",
    modelAnswer:
      "For **reference-type models** shared across views, conform a class to **`ObservableObject`** and mark update-triggering properties **`@Published`** (any published change fires `objectWillChange`, re-rendering observers — note this is **object-level**, not per-property; the `@Observable` macro adds fine-grained tracking). Choose the wrapper by **ownership**: **`@StateObject`** when the view **creates and owns** the model (SwiftUI instantiates once and keeps it alive across re-renders); **`@ObservedObject`** when the model is **owned elsewhere and passed in**. The classic bug is creating a model with `@ObservedObject`, which re-creates it on every parent re-render and resets state — so **create with `@StateObject`, receive with `@ObservedObject`.** **`@EnvironmentObject`** injects a shared `ObservableObject` implicitly (`.environmentObject(...)` once, read by any descendant) for app-wide models — but it's **resolved at runtime and crashes if not provided**. Separately, **`@Environment(\\.key)`** reads environment **values** (colorScheme, dismiss, locale, custom keys), not injected objects.",
    keyPoints: [
      "ObservableObject (class) + @Published; observation is object-level",
      "@StateObject = create/own (persists); @ObservedObject = observe external",
      "Bug: @ObservedObject-created model resets each re-render → use @StateObject",
      "@EnvironmentObject = implicit shared object; crashes if not injected",
      "@Environment(\\.key) reads environment VALUES, not objects",
    ],
    explanation:
      "Senior answers nail the StateObject/ObservedObject ownership bug, note object-level vs fine-grained observation, and separate @EnvironmentObject (objects, runtime crash) from @Environment (values).",
  },
];

export default quiz;
