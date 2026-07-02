## The problem: UIKit and SwiftUI are not thread-safe

Apple's UI frameworks assume all their work happens on the **main thread**. Touch a `UILabel`'s text or a SwiftUI `@State` from a background thread and you get flickering, corrupted layout, or a crash — often intermittently. The old advice was "remember to `DispatchQueue.main.async` around UI code," but *remembering* is exactly what humans fail at. **`@MainActor`** turns that convention into a compiler-enforced guarantee.

## Why UI is main-thread only

The rendering system, the run loop, and view state were designed as single-threaded to avoid the cost and complexity of locking every UI property. So there's one rule: **all UI updates run on the main thread.** The consequences of breaking it are undefined-behavior bugs that are painful to reproduce.

## `@MainActor` on functions and types

`@MainActor` is the built-in **global actor** representing the main thread. Annotate a declaration and its code is guaranteed to run on main.

```swift
@MainActor
func updateLabel(_ text: String) {
    label.text = text          // guaranteed on main
}

@MainActor
final class ViewModel: ObservableObject {   // every member is main-isolated
    @Published var title = ""
}
```

Applied to a **type**, every method and property becomes main-actor-isolated. Calling a `@MainActor` member from *off* the main actor requires `await` (you may need to hop to main), just like any actor.

```swift
func background() async {
    await updateLabel("hi")    // await: hop to the main actor
}
```

## `MainActor.run`

When you're in a non-isolated async context and need a slice of main-actor work without annotating a whole function, use `MainActor.run`:

```swift
func process() async {
    let result = await heavyWork()          // off main
    await MainActor.run {
        self.label.text = result            // run this block on main
    }
}
```

There's also `MainActor.assumeIsolated { }` for asserting you're *already* on main (synchronous, traps if you're wrong) — useful bridging from callbacks known to fire on main.

## Inheriting isolation

Isolation flows in helpful ways:

- A method on a `@MainActor` type is main-isolated automatically.
- SwiftUI's `View.body` is `@MainActor`, so view code is already on main — that's why you rarely annotate SwiftUI views.
- A child `Task { }` created from main-actor context **inherits** the main actor, so `Task { self.label.text = "x" }` inside a `@MainActor` type stays on main (no `await` needed for the hop). `Task.detached` does **not** inherit it.

## Common threading bugs

- **Updating UI from a background completion handler.** `URLSession`'s legacy completion runs on a background queue; touching UI there is the classic crash. Fix: `@MainActor` on the update, or `await MainActor.run`.
- **Assuming `Task { }` runs off-main.** Inside a `@MainActor` type, an inherited `Task { }` runs on **main** — putting heavy work there freezes the UI. Use `Task.detached` or call an async function that suspends onto a background executor.
- **Forgetting the hop for delegate callbacks** that fire on arbitrary threads.

## The interview lens

Expect *"how do you make sure UI code runs on the main thread — and why does it matter?"* Because UIKit/SwiftUI are **not thread-safe** (single-threaded by design), UI work must be on main; `@MainActor` (the built-in global actor for the main thread) makes that a **compile-time guarantee** instead of a `DispatchQueue.main.async` you might forget. Applied to a type, it isolates every member; calling from off-main requires `await`.

Senior nuance: **isolation inheritance** — `View.body` is `@MainActor`, and a `Task { }` spawned in main-actor context **inherits** main (so it stays on main, which can accidentally freeze the UI if you do heavy work there), whereas `Task.detached` does not. Knowing `MainActor.run` for ad-hoc main work rounds it out.
