## The problem: "why did my state reset / my view not update?"

SwiftUI has no `viewDidLoad`. Views are value types created and destroyed constantly, so "lifecycle" isn't about object creation — it's about **identity**: SwiftUI decides whether a view in a new render is "the same" view as before (keep its `@State`) or a "different" one (reset it). Most confusing SwiftUI bugs — state resetting unexpectedly, or *not* resetting when you wanted — are identity misunderstandings.

## Structural vs explicit identity

SwiftUI tracks each view's identity two ways:

- **Structural identity** — a view's place in the view tree. Two views in different branches of an `if`/`else` are *different* identities, even if they look identical; SwiftUI uses the structure of your code to tell views apart.
- **Explicit identity** — an id you assign with **`.id(value)`** (or that `ForEach` derives from `Identifiable`). This overrides structure: change the id and it's a *new* view.

```swift
if isEditing {
    ProfileView()        // structural identity A
} else {
    ProfileView()        // structural identity B — DIFFERENT view to SwiftUI
}
```

Because those are two structural identities, toggling `isEditing` **destroys one and creates the other**, resetting any `@State` — a classic surprise.

## `@State` lifetime

`@State` storage is tied to a view's **identity**, not its struct instances. As long as SwiftUI considers the view "the same identity," it **preserves** the `@State` across the countless struct re-creations. When identity **changes**, SwiftUI discards the old storage and **re-initializes** `@State`.

Consequences:
- Same identity across updates → state persists (what you usually want).
- **Changing `.id(...)`** → state resets (accidental data loss, or a deliberate "reset this subview" trick).
- Moving a view between `if` branches → new structural identity → state resets.

## How SwiftUI decides to redraw

SwiftUI recomputes a view's `body` when something it **depends on** changes: its `@State`/`@Observable` reads, `@Binding`, observed objects, or environment values it uses. It then **diffs** the new body against the old and updates only what differs in the real render tree. Views whose inputs didn't change aren't recomputed (with `@Observable`, tracking is per-property). This is why keeping `body` a pure function of its inputs matters — SwiftUI relies on that to diff correctly.

## `onAppear` / `onDisappear`

These fire when a view **enters/leaves the view hierarchy** — the closest thing to appearance callbacks:

```swift
.onAppear { analytics.log("shown") }
.onDisappear { timer.invalidate() }
```

Caveats: `onAppear` can fire **more than once** (e.g. returning to a screen), it's **not** a one-time "did load," and its timing relative to animations/lazy containers can surprise you. It's synchronous — for async work, prefer `.task`.

## The `task` modifier

**`.task`** is the modern hook for async work tied to a view's lifetime:

```swift
.task {
    await viewModel.load()      // runs when the view appears
}
.task(id: userID) {
    await viewModel.load(userID) // re-runs whenever userID changes
}
```

Two big wins over `onAppear` + a manual `Task`: it **automatically cancels** the work when the view disappears (cooperative cancellation, no leaks), and the **`id:` variant** restarts the task when a value changes. Use `.task` for "load data when shown"; use `onAppear` for lightweight synchronous side effects.

## The interview lens

Frame lifecycle as **identity**: SwiftUI has no `viewDidLoad`; it decides if a view is "the same" (keep `@State`) or "new" (reset it) via **structural identity** (position in the view tree — e.g. the two branches of an `if` are different identities) and **explicit identity** (`.id(...)` / `ForEach` ids, which override structure). So **`@State` lifetime follows identity**: unchanged identity preserves state; a changed `.id` or a move across an `if` branch **resets** it — the cause of both accidental state loss and the deliberate reset trick.

For "lifecycle" hooks: **`onAppear`/`onDisappear`** fire on entering/leaving the hierarchy (can fire multiple times, not a one-time load), while **`.task`** is the modern async hook that **auto-cancels on disappear** and (with `id:`) **restarts on change** — the right tool for "load when shown." Close with **how redraws work**: `body` recomputes when its dependencies change, then SwiftUI diffs and updates minimally.
