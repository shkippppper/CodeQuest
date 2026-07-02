import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "state-purpose",
    type: "mcq",
    prompt: "What does `@State` do?",
    options: [
      "Declares state a view owns, stored outside the struct so it survives re-renders and triggers updates",
      "Marks a property as read-only",
      "Shares a reference-type model across many views",
      "Runs code on a background thread",
    ],
    answer: 0,
    explanation:
      "`@State` gives a view its own persistent, observable storage (kept by SwiftUI outside the recreated struct). Changing it re-renders the view. It's for local, private, value-type UI state.",
  },
  {
    id: "binding-purpose",
    type: "mcq",
    prompt: "What is `@Binding` for?",
    options: [
      "A two-way reference to state owned elsewhere — read and write without duplicating it",
      "Creating brand-new state in the child",
      "Persisting state to disk",
      "Making a property constant",
    ],
    answer: 0,
    explanation:
      "`@Binding` borrows read/write access to a source of truth owned by another view. Writes flow back to the owner, avoiding a second, drift-prone copy.",
  },
  {
    id: "projected-value-fill",
    type: "fill",
    prompt: "You pass a binding to a child or control using the ___ prefix on a @State property (e.g. `TextField(text: ___name)`).",
    answers: ["$"],
    hint: "A single symbol — the projected value prefix.",
    explanation:
      "`$name` is the projected value of `@State var name`, which is a `Binding<String>`. `name` is the plain value; `$name` is the binding you hand to controls or children.",
  },
  {
    id: "state-binding-predict",
    type: "predict",
    prompt: "The child toggles `isOn`. What does the parent's label show after a tap?",
    code: `struct Child: View {
    @Binding var isOn: Bool
    var body: some View { Button("toggle") { isOn.toggle() } }
}
struct Parent: View {
    @State private var isOn = false
    var body: some View {
        VStack { Text(isOn ? "ON" : "OFF"); Child(isOn: $isOn) }
    }
}`,
    options: ["ON", "OFF", "It doesn't change", "Compile error"],
    answer: 0,
    explanation:
      "`$isOn` passes a binding to the parent's source of truth. The child's `isOn.toggle()` writes back to the parent's `@State`, flipping it to `true`, so the label re-renders to `ON`.",
  },
  {
    id: "source-of-truth",
    type: "mcq",
    prompt: "What is the 'single source of truth' principle?",
    options: [
      "Each piece of mutable state has exactly one owner; everything else references or derives it (never duplicates)",
      "All state must live in one global object",
      "State can only be read, never written",
      "Every view must have its own copy of the state",
    ],
    answer: 0,
    explanation:
      "One owner per piece of state. `@State` creates a source of truth; `@Binding` points at one. Duplicating state into separate copies that can drift is the root of most SwiftUI state bugs.",
  },
  {
    id: "state-truths-multi",
    type: "multi",
    prompt: "Select **all** correct statements.",
    options: [
      "`@State` should be `private` and hold value types for local UI state",
      "`$state` gives you a `Binding` to that state",
      "`@Binding` creates its own independent copy of the value",
      "SwiftUI stores `@State` outside the view struct so it survives re-creation",
    ],
    answers: [0, 1, 3],
    explanation:
      "Private value-type `@State`, `$`-projected bindings, and external storage are all correct. `@Binding` does **not** copy — it references the owner's source of truth (option 3 is false).",
  },
  {
    id: "state-identity-reset-senior",
    type: "predict",
    prompt: "🧠 Trick question — what happens to a row's `@State` when its `.id(...)` changes?",
    code: `ForEach(items) { item in
    RowView()            // RowView has its own @State
        .id(item.version)  // id changes when item updates
}`,
    options: [
      "SwiftUI treats it as a new view and resets the row's @State to its initial value",
      "The @State is preserved across the id change",
      "It crashes",
      "The id has no effect on @State",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`@State` is tied to a view's **identity**. Changing `.id(...)` makes SwiftUI consider it a *different* view, discarding the old storage and re-initializing `@State`. This is both a cause of accidental state loss and the deliberate trick to reset a subview's state.",
  },
  {
    id: "state-let-child-senior",
    type: "mcq",
    prompt: "A child view needs to display (not modify) a value the parent owns. What should it use?",
    options: [
      "A plain `let` property — no binding needed for read-only data",
      "@State — to own its own copy",
      "@Binding — always required to pass data down",
      "@EnvironmentObject",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "If the child only reads, pass a **plain value** (`let`). Use `@Binding` only when the child must **write back**. Overusing `@Binding`/`@State` for read-only data adds needless coupling — pass immutable values down, bindings only for two-way needs.",
  },
  {
    id: "state-object-vs-state-senior",
    type: "mcq",
    prompt: "When is `@State` the wrong tool, requiring `@StateObject`/`@Observable` instead?",
    options: [
      "When the state is a reference-type model shared across views, not a local value type",
      "When the value is an Int",
      "When the view has a body",
      "When you use previews",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`@State`/`@Binding` are for **local value** state. A **reference-type** model observed by multiple views needs `@StateObject`/`@ObservedObject` (ObservableObject) or the `@Observable` macro. Using `@State` for a shared class won't give you the observation semantics you need.",
  },
  {
    id: "swiftui-state-flashcard",
    type: "flashcard",
    prompt:
      "Explain @State, @Binding, the $ projected value, source of truth, and the identity gotcha. Answer aloud, then reveal.",
    modelAnswer:
      "Views are immutable structs recreated each render, so mutable state lives in wrappers SwiftUI stores externally. **`@State`** declares state a view **owns** — private, value-type, local UI state (a toggle, text, selection) — stored outside the struct so it survives re-creation and triggers re-render on change. **`@Binding`** is a **two-way reference** to state owned elsewhere: the child reads/writes it and changes flow back to the owner, so there's no duplicate copy. You pass one with the **`$` projected value**: for `@State`/`@Binding`, `$value` **is a `Binding`** (e.g. `TextField(text: $name)`). The guiding rule is a **single source of truth**: one owner per piece of state; derive or reference it, never duplicate. Gotcha: `@State` is tied to the view's **identity**, so changing a view's `.id(...)` (or moving it across an `if` branch) makes SwiftUI treat it as new and **reset the `@State`** — a cause of accidental loss and the deliberate 'change id to reset' trick. `@State`/`@Binding` are for *local value* state; shared *reference* models use `@StateObject`/`@Observable`.",
    keyPoints: [
      "@State = view-owned local value state, stored outside the struct",
      "@Binding = two-way reference to state owned elsewhere (no copy)",
      "$value = the Binding projected value passed to children/controls",
      "Single source of truth: one owner, reference/derive don't duplicate",
      "@State keyed to identity → changing .id resets it; reference models use @StateObject/@Observable",
    ],
    explanation:
      "Senior answers stress single-source-of-truth, the identity→reset behavior, using plain `let` for read-only data, and when to graduate from @State to @StateObject/@Observable.",
  },
];

export default quiz;
