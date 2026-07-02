## The problem: mutable state in an immutable view

SwiftUI views are value-type structs, recreated on every render — so a plain `var` can't hold state that survives updates, and you can't even mutate `self` from inside `body`. SwiftUI's answer is a family of **property wrappers** that store state *outside* the transient struct and re-render the view when it changes. The two foundational ones are **`@State`** (a view owns some state) and **`@Binding`** (a view borrows read/write access to state someone else owns).

## Source of truth

The guiding principle: every piece of mutable state has exactly **one owner** — its **source of truth** — and everything else derives from or references it. Duplicating state (two copies that can drift) is the root of most SwiftUI bugs. `@State` *creates* a source of truth; `@Binding` *points at* one that lives elsewhere. Get ownership right and the UI stays consistent automatically.

## `@State`

`@State` declares state **owned by this view**. SwiftUI allocates the storage outside the struct (so it persists across re-creations) and re-renders the view whenever the value changes.

```swift
struct CounterView: View {
    @State private var count = 0
    var body: some View {
        Button("Count: \(count)") { count += 1 }   // mutating is fine now
    }
}
```

Conventions: `@State` is for a view's **private, local** UI state (a toggle, a text field's text, selected tab), so mark it `private`. It should hold **value types**. It's owned here — if child views need it, you pass a *binding* to it, you don't recreate it.

## `@Binding`

`@Binding` gives a view a **two-way reference** to state owned elsewhere. The child can read and write it, and writes flow back to the owner's source of truth — no duplication.

```swift
struct Toggle2: View {
    @Binding var isOn: Bool          // borrowed, not owned
    var body: some View {
        Button(isOn ? "On" : "Off") { isOn.toggle() }
    }
}

struct Parent: View {
    @State private var isOn = false  // the source of truth
    var body: some View {
        Toggle2(isOn: $isOn)         // pass a binding with $
    }
}
```

The child mutates `isOn`, and the parent's `@State` — the single source of truth — updates, re-rendering both.

## The `$` projected value

Every state wrapper exposes a **projected value** via the `$` prefix. For `@State`/`@Binding`, `$value` **is a `Binding`** to that value. That's how you hand write-access to a child or to a built-in control:

```swift
@State private var name = ""
TextField("Name", text: $name)   // $name is a Binding<String>
```

`name` is the plain value (`String`); `$name` is `Binding<String>`. SwiftUI's controls (`TextField`, `Toggle`, `Slider`) take bindings so they can write back into your source of truth.

## State & view identity

`@State` is tied to the view's **identity**, not its position — SwiftUI keeps the storage as long as it considers the view "the same." If a view's identity changes (e.g. its `id` changes, or it moves between branches of an `if`), SwiftUI treats it as a *new* view and **resets its `@State`**. This is why the identity topic matters: giving a row a stable `id` preserves its local state; changing the id blows it away. Conversely, forcing a new identity is a deliberate way to reset a subview's state.

## Local vs shared state

Choose the wrapper by ownership and scope:

- **`@State`** — small, private, value-type state a **single view owns** (toggles, text, selection).
- **`@Binding`** — a child needs **read/write** access to a parent's `@State`; pass `$value`.
- For **reference-type** models shared across many views, you graduate to `@StateObject`/`@ObservedObject`/`@Environment` or the `@Observable` macro (next topics). `@State`/`@Binding` are for *local* value state; shared object state is a different tool.

## The interview lens

Start from *why*: views are immutable structs recreated each render, so mutable state lives in wrappers SwiftUI stores externally and watches. **`@State`** = state a view **owns** (private, value type, local UI state); **`@Binding`** = a **two-way reference** to state owned elsewhere, so there's no duplicated copy. The **`$` projected value** of a `@State`/`@Binding` **is a `Binding`** you pass to children or controls (`TextField(text: $name)`).

The senior beat is **single source of truth** (one owner; derive/reference, never duplicate) and **`@State` + identity**: `@State` is keyed to view identity, so changing a view's `id` (or moving it across an `if` branch) **resets** its state — a subtlety behind both accidental state loss and the deliberate "change the id to reset" trick. Close by noting `@State`/`@Binding` are for *local value* state; shared *reference* models use `@StateObject`/`@Observable`.
