import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "no-viewdidload",
    type: "mcq",
    prompt: "Why is there no `viewDidLoad` in SwiftUI?",
    options: [
      "Views are value types created/destroyed constantly; 'lifecycle' is about identity, not object creation",
      "SwiftUI hides it behind a private API",
      "Views never load",
      "It's called `bodyDidLoad` instead",
    ],
    answer: 0,
    explanation:
      "SwiftUI views are ephemeral structs, so there's no single 'load' moment. What matters is **identity** — whether SwiftUI treats a view across renders as the same (keep state) or new (reset state).",
  },
  {
    id: "structural-identity",
    type: "predict",
    prompt: "🧠 Trick question — what happens to `ProfileView`'s @State when `isEditing` toggles?",
    code: `if isEditing {
    ProfileView()
} else {
    ProfileView()
}`,
    options: [
      "It resets — the two branches are different structural identities, so toggling destroys one view and creates the other",
      "It persists across the toggle",
      "It crashes",
      "Nothing renders",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Even though both are `ProfileView()`, they occupy different branches of the `if`, so SwiftUI gives them **different structural identities**. Toggling destroys one and creates the other, re-initializing `@State`. To preserve state, hoist the view out of the conditional or give it a stable `.id`.",
  },
  {
    id: "id-resets-state",
    type: "mcq",
    prompt: "What happens to a view's `@State` when you change its `.id(...)`?",
    options: [
      "SwiftUI treats it as a new view and resets the @State to its initial value",
      "The @State is preserved",
      "The view is removed permanently",
      ".id has no effect on state",
    ],
    answer: 0,
    explanation:
      "`.id(...)` sets explicit identity. Changing it makes SwiftUI consider the view brand new, discarding old `@State`. This is the deliberate 'change the id to reset a subview' technique — and an accidental-reset footgun.",
  },
  {
    id: "task-cancel-fill",
    type: "fill",
    prompt: "The `.___` modifier runs async work when a view appears and automatically cancels it when the view disappears.",
    answers: ["task"],
    hint: "Four letters — the modern async lifecycle hook.",
    explanation:
      "`.task { await ... }` ties an async operation to the view's lifetime, cancelling cooperatively on disappear. `.task(id:)` also restarts when the id changes.",
  },
  {
    id: "onappear-multiple",
    type: "mcq",
    prompt: "Which is true about `onAppear`?",
    options: [
      "It can fire more than once and is not a one-time 'did load' callback",
      "It fires exactly once per app launch",
      "It runs on a background thread",
      "It's guaranteed before the view is created",
    ],
    answer: 0,
    explanation:
      "`onAppear` fires whenever the view enters the hierarchy — potentially multiple times (e.g. navigating back). Don't treat it as a one-shot load; for async work with cancellation, prefer `.task`.",
  },
  {
    id: "lifecycle-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about SwiftUI view lifecycle & identity.",
    options: [
      "`@State` lifetime follows the view's identity",
      "Views in different `if`/`else` branches have different structural identities",
      "`.task` auto-cancels its work when the view disappears",
      "`onAppear` is guaranteed to fire only once ever",
    ],
    answers: [0, 1, 2],
    explanation:
      "State-follows-identity, branch-based structural identity, and `.task` auto-cancellation are correct. `onAppear` can fire **multiple** times (option 3 is false).",
  },
  {
    id: "redraw-decision-senior",
    type: "mcq",
    prompt: "When does SwiftUI recompute a view's `body`?",
    options: [
      "When a dependency it reads changes (@State/@Observable/@Binding/environment), after which it diffs and updates minimally",
      "On every frame, unconditionally",
      "Only when the app returns from background",
      "Never — body runs once",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`body` recomputes when an input it depends on changes; SwiftUI then diffs the new body against the old and updates only what differs. Views whose inputs didn't change aren't recomputed — which is why `body` must be a pure function of its inputs.",
  },
  {
    id: "task-id-senior",
    type: "predict",
    prompt: "What does `.task(id: userID)` do when `userID` changes?",
    code: `.task(id: userID) {
    await load(userID)
}`,
    options: [
      "Cancels the running task and starts a new one for the new userID",
      "Ignores the change until the view reappears",
      "Runs both the old and new tasks concurrently",
      "Nothing — id has no effect on task",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`.task(id:)` restarts whenever the id value changes: it cancels the in-flight task and launches a fresh one. This is the clean way to reload when a parameter changes — no manual observation or cancellation code.",
  },
  {
    id: "deliberate-reset-senior",
    type: "mcq",
    prompt: "You want to fully reset a subview (clear its @State) when the user taps 'New'. What's the idiomatic way?",
    options: [
      "Change the subview's `.id(...)` to a new value, forcing SwiftUI to recreate it",
      "Call a private reset() on the view",
      "Set every @State back to default manually from the parent",
      "Remove and re-add it with animation",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Because `@State` is keyed to identity, assigning a new `.id(...)` makes SwiftUI treat the subview as brand new, reinitializing all its `@State`. It's the canonical 'reset a subtree' technique — the same mechanism that causes *accidental* resets.",
  },
  {
    id: "lifecycle-flashcard",
    type: "flashcard",
    prompt:
      "Explain SwiftUI identity/lifecycle: structural vs explicit identity, @State lifetime, and onAppear vs task. Answer aloud, then reveal.",
    modelAnswer:
      "SwiftUI has no `viewDidLoad` — views are ephemeral value types, so lifecycle is about **identity**: does SwiftUI treat a view across renders as the **same** (keep `@State`) or **new** (reset it)? Two kinds: **structural identity** (position in the view tree — e.g. the two branches of an `if`/`else` are *different* identities, so toggling resets state) and **explicit identity** via **`.id(...)`** or `ForEach` ids (overrides structure — change the id and it's a new view). Therefore **`@State` lifetime follows identity**: unchanged identity preserves state across the many struct re-creations; a changed `.id` or a move across an `if` branch **resets** it — the cause of accidental state loss and the deliberate 'change id to reset' trick. **Redraws**: `body` recomputes when a dependency it reads changes, then SwiftUI diffs and updates minimally. **Hooks**: `onAppear`/`onDisappear` fire on entering/leaving the hierarchy (can fire multiple times, not a one-time load, synchronous), while **`.task`** runs async work on appear, **auto-cancels on disappear**, and with **`.task(id:)`** restarts when a value changes — the right tool for 'load when shown.'",
    keyPoints: [
      "No viewDidLoad; lifecycle = identity (same → keep state, new → reset)",
      "Structural identity (if/else branches differ) vs explicit .id(...)",
      "@State lifetime follows identity; change .id to reset (or accidental loss)",
      "body recomputes on dependency change, then diffs minimally",
      "onAppear (may fire repeatedly) vs .task (auto-cancel, id: restarts)",
    ],
    explanation:
      "Senior answers center on identity driving @State lifetime (structural vs explicit), the if/else reset gotcha, and .task's auto-cancel/id-restart over onAppear.",
  },
];

export default quiz;
