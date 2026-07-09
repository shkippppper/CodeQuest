## The problem: a view that can't remember anything

Try to build the simplest interactive thing imaginable — a counter button:

```swift
struct CounterView: View {
    var count = 0
    var body: some View {
        Button("Count: \(count)") {
            count += 1   // ❌ compiler error
        }
    }
}
```

The compiler refuses. `CounterView` is a struct, and `body` isn't allowed to change the struct's own properties. Swift treats `body` as read-only.

Suppose Swift *did* let you mutate `count`. It still wouldn't work — and the reason is the key fact about SwiftUI views:

```swift
CounterView()   // SwiftUI creates this struct...
CounterView()   // ...then throws it away and creates a fresh one
CounterView()   // ...again, and again, on every update
```

SwiftUI destroys and recreates your view structs constantly, every time anything on screen needs updating. A plain `var` lives inside the struct, so it dies with the struct. Every fresh `CounterView` would start at `count = 0` again.

So we have a real problem: the view is a short-lived value, but state has to survive across all those recreations. Something outside the struct has to hold it.

## @State: storage that outlives the struct

Change one line:

```swift
struct CounterView: View {
    @State private var count = 0
    var body: some View {
        Button("Count: \(count)") { count += 1 }   // ✅ compiles and works
    }
}
```

`@State` is a **property wrapper** — a Swift feature that wraps a property in a small helper type that controls how its value is stored and accessed. This particular wrapper moves `count` *out* of the struct, into storage that SwiftUI itself manages and keeps alive.

Now the lifecycle looks different:

```swift
CounterView()   // struct created — reads count from SwiftUI's storage: 3
CounterView()   // struct recreated — same storage, still 3
```

The struct is still thrown away and rebuilt constantly. But `count` no longer lives in the struct — the struct just holds a reference to SwiftUI's external storage, so the value survives every recreation.

`@State` does a second job too. Watch what happens when the button is tapped:

```swift
count += 1   // 1. writes into SwiftUI's storage
             // 2. SwiftUI notices the change
             // 3. SwiftUI re-runs body to redraw the view
```

The wrapper doesn't just persist the value — it *watches* it. Any write triggers a re-render of the view that owns it. That's the entire update loop of SwiftUI: state changes, body re-runs, screen updates.

Three conventions come with `@State`, and each has a reason:

- Mark it `private`. This state belongs to this one view; nobody outside should set it directly.
- Use it for value types — `Int`, `String`, `Bool`, small structs. Reference-type model objects get different tools, covered below.
- Use it for local UI details: a toggle's flag, a text field's text, the selected tab. Not for app-wide data.

## One owner per value: the source of truth

Here's the bug that motivates everything else in this lesson. A parent view owns a flag, and a child view wants to display and edit it. The tempting move is to give the child its *own* copy:

```swift
struct Parent: View {
    @State private var isOn = false
    var body: some View {
        LightSwitch(isOn: isOn)     // hands the child a copy
    }
}

struct LightSwitch: View {
    @State private var isOn: Bool   // the child's OWN state — a second copy
    // ...
}
```

Now there are two `isOn` values in the app. The child flips its copy to `true`; the parent's copy is still `false`. Two pieces of UI now disagree about whether the light is on. They have *drifted*.

This is the root of most SwiftUI bugs, and the principle that prevents it is called **source of truth**: every piece of mutable state should have exactly one owner. Everyone else either derives their display from it or holds a reference to it — nobody keeps a second copy.

So the child shouldn't own a copy. It should *borrow* the parent's value. That's the next wrapper.

## @Binding: borrowing state you don't own

Rewrite the child with one change:

```swift
struct LightSwitch: View {
    @Binding var isOn: Bool          // borrowed — not owned, not copied
    var body: some View {
        Button(isOn ? "On" : "Off") { isOn.toggle() }
    }
}
```

`@Binding` declares a **two-way reference** to state that lives somewhere else. The child can read `isOn` and write to it — but the actual storage stays with whoever owns it.

The parent connects the two with a `$`:

```swift
struct Parent: View {
    @State private var isOn = false   // the one and only source of truth
    var body: some View {
        LightSwitch(isOn: $isOn)      // $ passes a binding, not a copy
    }
}
```

Now trace a tap on the button:

```swift
isOn.toggle()   // child writes through the binding...
                // ...into the parent's @State storage...
                // ...SwiftUI sees the change and re-renders both views
```

One value, one owner, no drift. The child never had a copy to fall out of sync.

## What the $ actually is

Every property wrapper can expose a second, companion value alongside the main one. Swift calls this the **projected value**, and you reach it by prefixing the property name with `$`.

For `@State` and `@Binding`, the projected value is a `Binding`:

```swift
@State private var name = ""

name    // the plain value        — type String
$name   // the projected value    — type Binding<String>
```

This is exactly how SwiftUI's built-in controls work. Predict first: does this compile?

```swift
@State private var name = ""
TextField("Name", text: name)
```

Answer: no. `TextField` doesn't want a `String` — it wants a `Binding<String>`, because it needs to *write back* what the user types. Passing `name` hands it a dead copy of the text. The fix is one character:

```swift
TextField("Name", text: $name)   // ✅ TextField writes keystrokes back into name
```

`Toggle`, `Slider`, `Picker` — all of SwiftUI's editable controls take bindings for the same reason. They are children borrowing write access to *your* source of truth.

## When @State gets wiped: identity

There's a catch with `@State` that surprises almost everyone. Watch this parent:

```swift
struct Parent: View {
    @State private var big = false
    var body: some View {
        if big {
            CounterView().font(.largeTitle)   // branch A
        } else {
            CounterView()                     // branch B
        }
    }
}
```

Tap the counter five times, so its internal `count` reads 5. Then `big` flips to `true`.

Predict: after the flip, does the counter show 5 or 0?

Answer: 0. The count is gone.

SwiftUI keeps `@State` storage alive only as long as it considers the view "the same view" — as long as the view keeps the same *identity*. The `CounterView` in branch A and the one in branch B are, to SwiftUI, two different views. When the branch switches, the old one is torn down — its state storage with it — and a brand-new one is created, starting from `count = 0`.

The same reset happens if you change a view's `id`:

```swift
CounterView().id(resetToken)   // change resetToken → brand-new view, fresh state
```

This cuts both ways:

- Accidentally changing identity — moving a view between `if` branches, or feeding it an unstable `id` — silently destroys its local state. That's a classic "my text field keeps clearing itself" bug.
- Deliberately changing the `id` is a legitimate trick to reset a subview's state on purpose.

How SwiftUI decides identity is a deep topic with its own lesson later. For now the rule to carry: `@State` lives and dies with the view's identity, not with what's on screen.

## Choosing the right tool

The decision comes down to two questions: who owns the state, and is it a value or an object?

- The view owns it, and it's a small value type → `@State`, marked `private`.
- A parent owns it, and this view needs to read *and write* it → `@Binding`, passed in with `$`.
- It's a reference-type model object shared across many views → neither. That's the job of `@StateObject`, `@ObservedObject`, `@Environment`, and the `@Observable` macro — the next lessons. `@State` and `@Binding` are the tools for *local value* state.

## Common pitfalls

- **Passing `name` where a control wants `$name`.** The control needs a `Binding` so it can write back; the plain value is read-only to it. Add the `$`.
- **Initializing a child's `@State` from a parent's value.** That creates a second copy that drifts. If the child must write, give it a `@Binding` instead.
- **Expecting `@State` to survive an identity change.** Moving a view between `if` branches or changing its `id` resets its state. Keep identity stable — or exploit the reset deliberately with `.id()`.
- **Using `@State` for a shared model object.** It works mechanically, but ownership and update behavior go wrong at scale. Shared reference models belong in `@StateObject`/`@Observable` (next lessons).

## Interview lens

If asked "why does SwiftUI need `@State` at all?", start from the mechanics: views are structs that SwiftUI destroys and recreates on every update, so a plain `var` can't hold anything and `body` can't mutate `self`. `@State` moves the value into storage SwiftUI keeps alive outside the struct, and re-renders the view when it changes. Explaining the *why* is what separates you from someone who memorized the wrapper names.

If asked the difference between `@State` and `@Binding`, answer in ownership terms: `@State` *creates and owns* a source of truth; `@Binding` is a two-way reference to a source of truth *owned elsewhere*, so no copy exists to drift. Mention that `$value` — the projected value — is the `Binding` you hand to children and controls like `TextField(text: $name)`.

The senior signal interviewers listen for is "single source of truth" — one owner per value, everything else derives or references, never duplicates. The second senior beat is state and identity: `@State` is keyed to view identity, so changing a view's `id` or moving it across an `if` branch resets its state. Knowing that explains both a whole class of accidental state-loss bugs and the deliberate change-the-id-to-reset trick.

Close by scoping the tools: `@State`/`@Binding` are for local, value-type UI state; shared reference-type models graduate to `@StateObject` and `@Observable`.
