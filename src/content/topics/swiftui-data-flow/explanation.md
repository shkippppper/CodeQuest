## The problem: sharing a model across many views

`@State`/`@Binding` handle *local value* state. But apps also have **reference-type models** — a user session, a cart, a settings store — that many, often distant, views must observe and mutate. For those, SwiftUI provides the **`ObservableObject`** protocol plus a set of wrappers (`@StateObject`, `@ObservedObject`, `@EnvironmentObject`) whose differences — especially **who owns the object's lifetime** — are among the most-asked SwiftUI interview questions.

## `ObservableObject` & `@Published`

An `ObservableObject` is a **class** whose changes SwiftUI can observe. Mark the properties that should trigger updates with **`@Published`**.

```swift
final class CartModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var total: Decimal = 0
}
```

When a `@Published` property changes, the object emits `objectWillChange`, and any view observing it re-renders. (Note: this is **object-level** observation — see the caveat below.)

## `@StateObject` vs `@ObservedObject`

Both let a view observe an `ObservableObject`, but they differ in **ownership/lifetime** — the classic trap:

- **`@StateObject`** — the view **owns** the object. SwiftUI creates it **once** and keeps it alive across re-renders. Use where the object is *first created*.
- **`@ObservedObject`** — the view **observes** an object owned elsewhere (passed in). SwiftUI does **not** manage its lifetime.

```swift
struct CartScreen: View {
    @StateObject private var cart = CartModel()   // created & owned HERE
    var body: some View { CartBadge(cart: cart) }
}

struct CartBadge: View {
    @ObservedObject var cart: CartModel           // passed in, observed
    var body: some View { Text("\(cart.items.count)") }
}
```

**The bug**: if you use `@ObservedObject var cart = CartModel()` (creating it), it gets **recreated every time the parent re-renders**, silently resetting your state. Rule: **create with `@StateObject`, receive with `@ObservedObject`.**

## `@EnvironmentObject`

Passing a shared model down through many layers by hand is tedious. **`@EnvironmentObject`** injects it into the environment once, and any descendant reads it without explicit passing.

```swift
CartScreen()
    .environmentObject(session)     // inject once at the top

struct DeepChild: View {
    @EnvironmentObject var session: Session   // read anywhere below
    var body: some View { Text(session.username) }
}
```

Great for truly app-wide models (session, theme). The catch: it's **resolved at runtime** — if no ancestor injected the object, the app **crashes** when the view appears. Use it for genuinely global dependencies, not everything.

## `@Environment` values

Distinct from `@EnvironmentObject`, **`@Environment`** reads SwiftUI's built-in (or custom) environment **values** by key path — things like color scheme, size class, dismiss action, locale.

```swift
@Environment(\.colorScheme) private var colorScheme
@Environment(\.dismiss) private var dismiss
```

You can define custom environment values via `EnvironmentKey`. `@Environment` is for *values* (often value types) keyed by `\.`; `@EnvironmentObject` is for *reference-type ObservableObjects* keyed by type.

## Choosing the right wrapper

| Need | Wrapper |
|---|---|
| Local value state a view owns | `@State` |
| Two-way ref to a parent's value state | `@Binding` |
| **Create/own** a reference model | `@StateObject` |
| **Observe** a reference model owned elsewhere | `@ObservedObject` |
| App-wide reference model, injected implicitly | `@EnvironmentObject` |
| Built-in/custom environment value | `@Environment(\.key)` |

Ownership is the deciding axis: who *creates* it (`@StateObject`), who *borrows* it (`@ObservedObject`/`@EnvironmentObject`).

## The interview lens

The number-one question: **`@StateObject` vs `@ObservedObject`**. Both observe an `ObservableObject`, but `@StateObject` means the view **owns and creates** the object (SwiftUI instantiates it once, persists it across re-renders), while `@ObservedObject` means the object is **owned elsewhere and passed in** (SwiftUI won't keep it alive). The concrete bug: creating a model with `@ObservedObject` re-creates it on every parent re-render, resetting state — so **create with `@StateObject`, receive with `@ObservedObject`.**

Then distinguish **`@EnvironmentObject`** (implicitly-injected shared `ObservableObject`, **crashes if not provided**) from **`@Environment(\.key)`** (reads environment *values* like `colorScheme`/`dismiss`). Bonus: note that `ObservableObject`/`@Published` observation is **object-level** (any published change re-renders all observers), which the newer `@Observable` macro improves with fine-grained tracking (next topic).
