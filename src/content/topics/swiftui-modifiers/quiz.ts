import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "viewmodifier-purpose",
    type: "mcq",
    prompt: "What does a custom `ViewModifier` let you do?",
    options: [
      "Package a reusable view transformation (via body(content:)) you can apply anywhere",
      "Subclass a SwiftUI view",
      "Run code on a background thread",
      "Store global app state",
    ],
    answer: 0,
    explanation:
      "A `ViewModifier` bundles a transformation in `body(content:)`, so shared styling (padding/background/shadow) lives in one place and is applied via `.modifier(...)` or a wrapping `View` extension.",
  },
  {
    id: "modifier-extension",
    type: "mcq",
    prompt: "Why wrap a custom modifier in a `View` extension (e.g. `func cardStyle()`)?",
    options: [
      "So it reads like a built-in modifier (`Text(...).cardStyle()`) — clean and discoverable",
      "It's required for the modifier to compile",
      "To make it run faster",
      "To convert the view to a class",
    ],
    answer: 0,
    explanation:
      "The extension gives your modifier a first-class call site (`.cardStyle()`), matching built-in modifiers. It's the idiomatic way to expose design-system components.",
  },
  {
    id: "viewbuilder-fill",
    type: "fill",
    prompt: "Mark a helper function/property with `@___` so it can return multiple views and use if/switch like `body`.",
    answers: ["ViewBuilder", "@ViewBuilder"],
    hint: "The result builder used by containers like VStack.",
    explanation:
      "`@ViewBuilder` lets a function/property compose several child views (and use `if`/`switch`). It's also how you accept view content as a parameter in custom containers.",
  },
  {
    id: "preferencekey-direction",
    type: "mcq",
    prompt: "What problem does `PreferenceKey` solve?",
    options: [
      "Passing data UP the view tree, from children to an ancestor",
      "Passing data down via the environment",
      "Persisting data to disk",
      "Animating a view",
    ],
    answer: 0,
    explanation:
      "Environment flows **down**; `PreferenceKey` flows **up**. Children set a preference value, `reduce` combines them, and an ancestor reads it via `.onPreferenceChange`. SwiftUI uses this for `navigationTitle` and anchor overlays.",
  },
  {
    id: "preferencekey-reduce",
    type: "mcq",
    prompt: "What is the `reduce` function of a `PreferenceKey` for?",
    options: [
      "Combining the values contributed by multiple children into one",
      "Reducing memory usage",
      "Removing duplicate views",
      "Shrinking the view",
    ],
    answer: 0,
    explanation:
      "When several children set the same preference, `reduce(value:nextValue:)` merges them (e.g. `max`, sum, collect into an array) so the ancestor receives a single combined value.",
  },
  {
    id: "modifiers-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements.",
    options: [
      "A `ViewModifier` can hold its own @State and @Environment",
      "`@ViewBuilder` can be used on functions and stored-content parameters, not just `body`",
      "PreferenceKey passes data down from parent to child",
      "Exposing a modifier via a View extension improves call-site readability",
    ],
    answers: [0, 1, 3],
    explanation:
      "Modifiers can own state, `@ViewBuilder` works on functions/params, and extensions improve readability. `PreferenceKey` passes data **up** (children→ancestor), not down (option 3 is false).",
  },
  {
    id: "conditional-identity-senior",
    type: "predict",
    prompt: "🧠 Trick question — a `.if(flag) { $0.background(.blue) }` helper is applied to a stateful view. What's the risk?",
    code: `SomeStatefulView()
    .if(isHighlighted) { $0.background(.blue) }`,
    options: [
      "It can produce different branch types, changing the view's structural identity and resetting its @State",
      "Nothing — it's always safe",
      "It won't compile",
      "It permanently caches the background",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A conditional-modifier helper returns different concrete types on the two branches, which can change structural identity and **reset the view's @State** when `isHighlighted` flips. Prefer identity-preserving modifiers (`.background(isHighlighted ? .blue : .clear)`, `.opacity`, `.disabled`) over branching whole views.",
  },
  {
    id: "preference-vs-environment-senior",
    type: "mcq",
    prompt: "Environment vs PreferenceKey — which direction does each carry data?",
    options: [
      "Environment flows down (ancestor → descendants); PreferenceKey flows up (descendants → ancestor)",
      "Both flow down",
      "Both flow up",
      "Environment flows up; PreferenceKey flows down",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`@Environment`/`.environment(...)` injects values downward to descendants. `PreferenceKey` collects values from descendants and surfaces them to an ancestor (`.onPreferenceChange`). Together they let data move both ways through the tree.",
  },
  {
    id: "navigationtitle-preference-senior",
    type: "mcq",
    prompt: "How is `.navigationTitle(\"X\")`, set deep inside a child, able to affect the navigation bar owned by an ancestor?",
    options: [
      "It's implemented with the preference system — the child sets a title preference the NavigationStack reads",
      "It uses a global variable",
      "It reaches up and mutates the parent directly",
      "It posts a Notification",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`navigationTitle` is built on preferences: the child publishes a title preference that flows up to the `NavigationStack`, which renders it. This is the canonical real-world use of `PreferenceKey` — child-to-ancestor communication without direct references.",
  },
  {
    id: "modifiers-flashcard",
    type: "flashcard",
    prompt:
      "Explain reuse in SwiftUI (ViewModifier, @ViewBuilder) and how PreferenceKey passes data up. Answer aloud, then reveal.",
    modelAnswer:
      "For **reuse**, a **`ViewModifier`** packages a view transformation in `body(content:)` (it can hold its own parameters, `@State`, `@Environment`); you usually expose it through a **`View` extension** (`func cardStyle()`) so it reads like a built-in modifier — the idiomatic way to build a design system. **`@ViewBuilder`** functions/computed-properties (and content parameters) let you factor out or accept multi-view content with `if`/`switch`, just like `body`. Watch the **conditional-view identity trap**: an `if` (or a `.if {}` helper) creates different structural identities per branch, which can **reset `@State`** — prefer identity-preserving modifiers (`opacity`, `disabled`, ternary values) over branching whole views. Finally, data normally flows **down** via environment/parameters, but **`PreferenceKey`** flows data **up**: children set a preference, its `reduce` combines multiple children's values, and an ancestor reads it with `.onPreferenceChange`. That's how SwiftUI implements `navigationTitle` and anchor-based overlays — environment down, preferences up.",
    keyPoints: [
      "ViewModifier: reusable body(content:) transform, exposed via View extension",
      "@ViewBuilder for multi-view helpers/params (if/switch)",
      "Conditional if/.if{} can change identity & reset @State — prefer non-branching modifiers",
      "PreferenceKey passes data UP (children → ancestor) via reduce + onPreferenceChange",
      "Environment down, preferences up; navigationTitle uses preferences",
    ],
    explanation:
      "Senior answers pair the reuse tools with the conditional-identity trap and correctly describe PreferenceKey as up-the-tree data flow (with navigationTitle as the canonical example).",
  },
];

export default quiz;
