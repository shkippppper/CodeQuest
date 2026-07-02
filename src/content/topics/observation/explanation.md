## The problem: ObservableObject over-renders

`ObservableObject`/`@Published` observation is **object-level**: any `@Published` change fires `objectWillChange`, so **every** view observing that object re-renders — even ones that read a completely different property. In a big model, one field changing can invalidate half your UI. It's also boilerplate-heavy (`@Published` on every property) and awkward with non-class state. The **Observation framework** (iOS 17+), driven by the **`@Observable`** macro, fixes both: precise per-property tracking and near-zero ceremony.

## Why Observation replaced ObservableObject

Two wins:

1. **Fine-grained tracking** — a view re-renders only when a property **it actually read** changes, not on any change to the object.
2. **Less boilerplate** — no `@Published`, no `ObservableObject` conformance, no `@StateObject` vs `@ObservedObject` juggling for observation.

It's the recommended approach for new SwiftUI code targeting iOS 17+.

## The `@Observable` macro

Annotate a class with `@Observable` and it's done — plain stored properties are automatically tracked.

```swift
@Observable
final class CartModel {
    var items: [Item] = []     // no @Published needed
    var total: Decimal = 0
}
```

The macro rewrites property access to register reads and signal writes to SwiftUI's observation system. You mostly just write a normal class.

## Fine-grained tracking

The headline behavior: SwiftUI records **which properties a view's `body` reads**, and re-renders that view only when *those* change.

```swift
struct TotalView: View {
    let cart: CartModel
    var body: some View {
        Text("\(cart.total)")   // reads only `total`
    }
}
// Mutating cart.items does NOT re-render TotalView — it never read `items`.
```

With `ObservableObject`, changing `items` would have re-rendered `TotalView` too. Observation eliminates that wasted work automatically — a real performance improvement for large models.

## Using it in views

Observation collapses the wrapper zoo. For a model a view **owns**, use `@State` (yes — `@State` now holds `@Observable` reference models too):

```swift
struct CartScreen: View {
    @State private var cart = CartModel()   // owns the @Observable model
    var body: some View { CartBadge(cart: cart) }
}

struct CartBadge: View {
    let cart: CartModel                     // just pass it — no @ObservedObject
    var body: some View { Text("\(cart.items.count)") }
}
```

A child that only reads can take the model as a **plain `let`** — no `@ObservedObject`. For the environment, use `.environment(cart)` and `@Environment(CartModel.self)`.

## `@Bindable`

When you need **two-way bindings** into an `@Observable` model's properties (for a `TextField`, `Toggle`, etc.), use **`@Bindable`** to get `$` projections:

```swift
struct EditView: View {
    @Bindable var cart: CartModel
    var body: some View {
        TextField("Note", text: $cart.note)   // $ binding via @Bindable
    }
}
```

`@State`-owned `@Observable` values already expose `$` for bindings; `@Bindable` is how you get them from a model **passed in** (or bind to an `@Environment` model).

## Migration notes

Moving from `ObservableObject` → `@Observable`:

- Remove `: ObservableObject` and all `@Published` (plain `var`s are tracked).
- `@StateObject` → **`@State`**; `@ObservedObject` (passed in) → **plain `let`** (or `@Bindable` if you need bindings).
- `@EnvironmentObject` → `@Environment(Type.self)`, injected with `.environment(_:)`.
- Requires **iOS 17+**; pre-17 code stays on `ObservableObject`. You can migrate incrementally, model by model.

## The interview lens

The core: **Observation (`@Observable`) replaces `ObservableObject` with fine-grained, per-property tracking** — a view re-renders only when a property **it read** changes, versus `ObservableObject`'s **object-level** invalidation that re-renders all observers on any `@Published` change. That's both **less boilerplate** (no `@Published`/conformance) and a **performance** win for large models.

Know the wrapper mapping for iOS 17+: own a model with **`@State`** (not `@StateObject`), pass it as a **plain `let`** to read-only children (not `@ObservedObject`), use **`@Bindable`** to get `$` bindings from a passed-in/environment model, and `@Environment(Type.self)` + `.environment(_:)` for the environment. Mention it requires **iOS 17+** and can be adopted incrementally — pre-17 uses `ObservableObject`.
