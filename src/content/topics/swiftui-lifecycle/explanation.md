## The problem: "why did my state reset?"

Run this innocent-looking screen:

```swift
struct CounterView: View {
    @State private var count = 0
    var body: some View {
        Button("Count: \(count)") { count += 1 }
    }
}
```

Tap the button five times. Now the parent view re-renders for some unrelated reason — and suddenly the counter shows 0 again. You changed nothing about `CounterView`. What happened?

SwiftUI has no `viewDidLoad`, no "view object" that lives on screen. Your view structs are values — SwiftUI creates and throws them away constantly, sometimes many times per second. So "lifecycle" in SwiftUI is not about object creation and destruction.

It's about **identity**: on every render, SwiftUI decides whether a view is "the same one as before" or "a brand new one". Same identity — keep its `@State`. New identity — reset it. Almost every confusing SwiftUI bug, including the counter above, is an identity misunderstanding.

## How SwiftUI tells views apart by position

Look at this code:

```swift
if isEditing {
    ProfileView()   // branch A
} else {
    ProfileView()   // branch B
}
```

Both branches build a `ProfileView` that looks identical. To SwiftUI, they are two *different* views.

Why? SwiftUI identifies each view by its position in the view tree — which branch, which slot, which child of which parent. This position-based identity is called **structural identity**: the structure of your code *is* the view's identity card.

The `ProfileView` in branch A lives at position "the if-true slot". The one in branch B lives at "the if-false slot". Different positions, different identities.

### Predict: what happens to state when the branch flips?

Suppose `ProfileView` has a `@State` text field the user typed into. Then `isEditing` toggles. Does the typed text survive?

Answer: no. Toggling `isEditing` destroys the branch-A view and creates a fresh branch-B view. Fresh identity means fresh `@State` — the text is gone. This is the classic identity surprise, and it is exactly what reset the counter in the opening example.

## Overriding identity with .id

Sometimes you want to control identity yourself. That's what the `.id(_:)` modifier does:

```swift
ProfileView()
    .id(selectedUserID)
```

This assigns **explicit identity** — an identity you name with a value, which overrides the position-based default. As long as `selectedUserID` stays the same, it's the same view. The moment `selectedUserID` changes, SwiftUI treats it as a *new* view: old one destroyed, new one created, all `@State` re-initialized.

`ForEach` does the same thing for you: it derives each row's explicit identity from `Identifiable` or the `id:` key path you pass it.

Explicit identity cuts both ways:

- Change an `.id` you didn't realize mattered — accidental data loss.
- Change an `.id` on purpose — a deliberate "reset this whole subview" trick. Handy for clearing a form when the user switches records.

## Where @State actually lives

Here's the mental shift: `@State` storage does not live inside your struct.

```swift
struct CounterView: View {
    @State private var count = 0   // NOT stored in this struct
    ...
}
```

The struct is recreated constantly, so if `count` lived in it, it would reset on every render. Instead, SwiftUI keeps the storage in its own tree, filed under the view's *identity*.

That gives you three rules, all consequences of one fact — *`@State` lifetime follows identity*:

- Identity unchanged across updates → state persists, no matter how many times the struct is rebuilt. This is the normal case.
- `.id(...)` value changes → state resets.
- View moves between `if`/`else` branches → new structural identity → state resets.

## How SwiftUI decides to redraw

Start with a view that reads one piece of state:

```swift
struct PriceLabel: View {
    let model: CartModel        // @Observable model
    var body: some View {
        Text("\(model.total)")  // body READS model.total
    }
}
```

SwiftUI recomputes a view's `body` when something it *depends on* changes. Dependencies are whatever the body reads: `@State` values, `@Binding`s, observed model properties, environment values.

With an `@Observable` model, that tracking is per-property. `PriceLabel` read only `total` — so changing `model.itemCount` does not recompute it. Views whose inputs didn't change are simply skipped.

When a body *is* recomputed, SwiftUI doesn't rebuild the screen. It **diffs** the new body against the old one — compares them and applies only the actual differences to the real render tree.

This is why `body` must stay a pure function of its inputs: same inputs, same output, no side effects. SwiftUI's diffing relies on that. Sneak side effects into `body` and the whole model breaks down.

## onAppear and onDisappear

The closest thing SwiftUI has to appearance callbacks:

```swift
DetailView()
    .onAppear    { analytics.log("shown") }
    .onDisappear { timer.invalidate() }
```

`onAppear` fires when the view enters the view hierarchy; `onDisappear` fires when it leaves. Simple — but three caveats matter.

First, `onAppear` can fire more than once. Navigate away and come back, and it fires again. It is *not* a one-time "did load".

Second, its timing can surprise you. Inside lazy containers or during animations, "appears" may happen earlier or later than you'd guess.

Third, it's synchronous. You *can* spawn a `Task` inside it for async work — but there's a better tool.

## The task modifier

Here's the modern way to tie async work to a view's lifetime:

```swift
DetailView()
    .task {
        await viewModel.load()   // starts when the view appears
    }
```

The closure runs when the view appears, just like `onAppear` — but it's an async context, so you can `await` directly.

The first big win: automatic cancellation. When the view disappears, SwiftUI cancels the task. Your in-flight network load doesn't outlive the screen, and nothing leaks. The cancellation is *cooperative* — the task is asked to stop and honors it at its next suspension point.

Now add an `id:`:

```swift
DetailView()
    .task(id: userID) {
        await viewModel.load(userID)   // re-runs whenever userID changes
    }
```

The second win: when `userID` changes, SwiftUI cancels the old task and starts a new one. "Reload when the selection changes" becomes one modifier.

Rule of thumb: `.task` for "load data when shown"; `onAppear` only for lightweight synchronous side effects.

## Common pitfalls

- **State resets when toggling an `if`/`else`.** The two branches are different structural identities. If you want state to survive, keep one view and vary its inputs instead of swapping branches.
- **State resets after adding `.id(...)`.** Any change to the id value creates a new identity and wipes `@State`. Only use `.id` when you *want* that reset behavior — or with a value that's stable.
- **Treating `onAppear` as `viewDidLoad`.** It fires every time the view re-enters the hierarchy. Guard one-time work explicitly, or move it out of the view.
- **`onAppear` + manual `Task` for loading.** The task outlives the view unless you cancel it by hand. `.task` does the cancellation for you.

## Interview lens

If asked about "SwiftUI's view lifecycle", reframe it immediately: SwiftUI has no `viewDidLoad`, because views are throwaway values. The real question is identity — SwiftUI decides whether a view is "the same" (keep `@State`) or "new" (reset it). Naming that reframe is what separates people who've read the docs from people who've debugged the bugs.

Be ready to explain the two identity kinds with the classic example: the two branches of an `if`/`else` are different *structural* identities, so toggling the condition resets state; `.id(...)` and `ForEach` ids are *explicit* identity, which overrides structure. Then state the rule: `@State` lifetime follows identity — that one sentence answers both "why did my state reset?" and "how do I reset a subview on purpose?".

For lifecycle hooks, say `onAppear`/`onDisappear` fire on entering and leaving the hierarchy — and volunteer that `onAppear` can fire multiple times, because interviewers love that gotcha. Then position `.task` as the modern async hook: it auto-cancels when the view disappears, and the `id:` variant restarts the work when a value changes.

If they push on rendering, close the loop: `body` recomputes when a dependency changes — per-property with `@Observable` — then SwiftUI diffs old against new and touches only what differs. That's why `body` must stay a pure function of its inputs.
