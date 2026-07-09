## The problem: UI has exactly one thread

Here's a bug that ships to production every week, somewhere:

```swift
URLSession.shared.dataTask(with: url) { data, _, _ in
    label.text = decode(data)    // ❌ background thread touching UI
}.resume()
```

The completion handler of the legacy `dataTask` API runs on a background queue. Setting `label.text` there *sometimes* works, *sometimes* draws garbage, and *sometimes* crashes — intermittently, which is what makes it so nasty to track down.

The rule it breaks: UIKit and SwiftUI are not thread-safe. Every UI read or write — a label's text, a SwiftUI `@State` value — must happen on the **main thread**, the one thread the system dedicates to the interface.

## Why one thread?

The rendering system, the run loop that processes touches, and all view state were designed single-threaded on purpose. The alternative — a lock around every property of every view — would make UI code slow and deadlock-prone. So the frameworks made a simpler deal: everything happens on one thread, and no locks are needed.

The deal only works if *you* keep your side of it. For years, keeping it meant remembering to write:

```swift
DispatchQueue.main.async {
    label.text = text    // manually hopping to main
}
```

Remembering is exactly what humans fail at. The modern approach turns the convention into something the compiler checks.

## `@MainActor`: the rule becomes a guarantee

From the actors lesson you know what a global actor is: one shared actor whose isolation you apply by attribute. `@MainActor` is the built-in global actor whose executor is the main thread. Annotate a function, and its body is guaranteed to run there:

```swift
@MainActor
func updateLabel(_ text: String) {
    label.text = text    // compiler-guaranteed: main thread
}
```

Annotate a whole type, and *every* method and property becomes main-actor-isolated:

```swift
@MainActor
final class ViewModel: ObservableObject {
    @Published var title = ""       // only touchable on main
    func refresh() { title = "…" }  // runs on main
}
```

This is the modern default for view models: the type's state can never be mutated from a background thread, because the compiler rejects the attempt.

## Calling in from off the main actor

`@MainActor` code follows normal actor rules. From outside the main actor, calling in requires `await` — you might have to wait for the hop:

```swift
func background() async {
    await updateLabel("hi")    // suspends, resumes on the main actor
}
```

That one `await` replaces the entire `DispatchQueue.main.async` ritual — and unlike the ritual, forgetting it is a compile error, not a runtime roulette.

## `MainActor.run`: a slice of main, on demand

Sometimes only three lines of a long background function belong on main. Rather than annotating the whole function, hop for just a block:

```swift
func process() async {
    let result = await heavyWork()   // off main — good, it's heavy
    await MainActor.run {
        label.text = result          // this block runs on main
    }
}
```

There's also a sharper tool for bridging old APIs. When a callback is *documented* to fire on the main thread but the compiler can't know that, `MainActor.assumeIsolated { }` asserts it: the block runs synchronously, no `await` — and if you were wrong and you're *not* on main, it traps immediately instead of corrupting UI quietly.

## Isolation is inherited

You rarely write `@MainActor` on SwiftUI views. Why not? Because `View.body` is already declared `@MainActor` by the framework — view code is born on the main actor, so calls to other main-actor code need no hop.

The subtler inheritance is `Task { }`. Recall from structured concurrency: an unstructured `Task` inherits the actor context where it's created. So inside a `@MainActor` type:

```swift
@MainActor
final class ViewModel: ObservableObject {
    @Published var items: [Item] = []

    func load() {
        Task {
            items = parseHugeFile()   // predict: which thread?
        }
    }
}
```

Predict: does `parseHugeFile()` run in the background?

Answer: no — it runs on the main thread. The `Task` was created in main-actor context, so it *inherits* the main actor. The assignment to `items` is conveniently legal without `await`, but the expensive parse now blocks the main thread, and the UI freezes. `Task { }` is not "run this in the background"; it's "run this async, in the same actor context I'm in".

To actually get off main, either call an `async` function that does its work elsewhere and suspends, or use `Task.detached` — which inherits *nothing*, including the main actor:

```swift
Task.detached {
    let parsed = parseHugeFile()          // truly off main
    await MainActor.run { self.items = parsed }   // hop back to publish
}
```

## Common threading bugs

- **UI from a background completion handler.** The opener: legacy `URLSession` callbacks arrive on a background queue. Fix: make the update path `@MainActor`, or wrap it in `await MainActor.run { }`.
- **Assuming `Task { }` means background.** In main-actor context it stays on main; heavy work inside it freezes the UI. Move the work into a detached task or a suspending async function, then hop back for the UI update.
- **Delegate callbacks on arbitrary threads.** Many system and third-party delegates don't promise a thread. Treat every delegate method as off-main until proven otherwise, and hop before touching UI.
- **`assumeIsolated` on a hunch.** It traps at runtime if you're wrong. Use it only where the API documents main-thread delivery.

## Interview lens

If asked "why must UI run on the main thread?", give the design reason, not just the rule: the frameworks are single-threaded by choice — one thread, no locks on view state — so the price is that all UI access goes through that thread, and violations are intermittent corruption or crashes.

Then contrast eras: the old way was `DispatchQueue.main.async`, a convention you had to remember; `@MainActor` — the built-in global actor for the main thread — makes it a compile-time guarantee. On a type it isolates every member, and off-main callers must `await` the hop.

The senior nuance interviewers fish for is inheritance: `View.body` is already `@MainActor` (why SwiftUI views need no annotation), and a `Task { }` created in main-actor context *stays on the main actor* — so heavy work inside it freezes the UI. Saying "`Task { }` is not a background thread" out loud, then offering `Task.detached` or a suspending async call as the fix, is exactly the answer they want. Knowing `MainActor.run` for ad-hoc hops and `assumeIsolated` for callbacks documented to be on main rounds it out.
