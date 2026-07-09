## The problem: one property changes, the whole screen redraws

Here's a typical `ObservableObject` model:

```swift
class CartModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var total: Decimal = 0
}
```

Now picture a view that only reads `total`:

```swift
struct TotalView: View {
    @ObservedObject var cart: CartModel
    var body: some View {
        Text("\(cart.total)")   // never touches items
    }
}
```

Predict: if code elsewhere appends to `cart.items`, does `TotalView` redraw?

Answer: yes — even though `TotalView` never reads `items`. `@Published` observation is **object-level**: any published property changing fires `objectWillChange`, and *every* view observing that object redraws, whether or not it actually reads the property that changed. In a large model, one unrelated field changing can invalidate half your UI.

## Why Observation replaced ObservableObject

iOS 17 introduced the **Observation framework**, built around a macro called **`@Observable`**. It targets exactly the problem above, plus a second one: the ceremony of writing `@Published` on every property and choosing between `@StateObject`, `@ObservedObject`, and `@EnvironmentObject` depending on where a model came from.

Observation fixes both:

1. **Fine-grained tracking** — a view redraws only when a property it actually read last time changes.
2. **Less boilerplate** — one macro on the class, no per-property `@Published`, no separate wrapper for owning vs. receiving a model.

It's the recommended default for new SwiftUI code targeting iOS 17 and later.

## The `@Observable` macro

Rewrite the cart model with `@Observable`:

```swift
@Observable
final class CartModel {
    var items: [Item] = []
    var total: Decimal = 0
}
```

No `: ObservableObject`, no `@Published` on either property. The macro rewrites property access under the hood so that reading `items` registers "this view read `items`," and writing it signals "anyone who read `items` needs to redraw." You write what looks like an ordinary class.

## Fine-grained tracking

Rerun the earlier scenario with the `@Observable` model:

```swift
struct TotalView: View {
    let cart: CartModel
    var body: some View {
        Text("\(cart.total)")   // reads only `total`
    }
}
```

Now mutate `cart.items` from elsewhere in the app. `TotalView`'s `body` never touched `items`, so this time it does *not* redraw. SwiftUI recorded exactly which properties `TotalView` read the last time its `body` ran, and only that specific set of properties can trigger a redraw. That's the entire headline feature: redraws now track *properties*, not *objects*.

## Using it in views

Because tracking moved to the property level, the wrapper you use to hold a model also changed. A view that owns its model uses `@State` — yes, the same `@State` you'd use for an `Int`, now also holding reference-type `@Observable` models:

```swift
struct CartScreen: View {
    @State private var cart = CartModel()
    var body: some View {
        CartBadge(cart: cart)
    }
}
```

A child view that only reads the model — never owns it — takes it as a plain `let`, with no wrapper at all:

```swift
struct CartBadge: View {
    let cart: CartModel
    var body: some View {
        Text("\(cart.items.count)")
    }
}
```

There's no `@ObservedObject` here, because there's nothing left for it to do — fine-grained tracking already handles the "redraw when read data changes" job that `@ObservedObject` used to do. For values placed in the environment, the pattern is `.environment(cart)` to inject it and `@Environment(CartModel.self)` to read it back out — replacing `@EnvironmentObject`.

## `@Bindable`

`let cart: CartModel` is fine for reading, but a `TextField` or `Toggle` needs a two-way `$` binding into a specific property. That's what **`@Bindable`** provides:

```swift
struct EditView: View {
    @Bindable var cart: CartModel
    var body: some View {
        TextField("Note", text: $cart.note)
    }
}
```

`@Bindable var cart: CartModel` takes the same model passed in from outside — it doesn't own it — but unlocks `$cart.note` as a working binding. A model owned via `@State` already exposes `$` directly without needing `@Bindable`; you reach for `@Bindable` specifically when the model arrived from a parameter or from the environment and you now need to bind into one of its fields.

## Migration notes

Moving an existing `ObservableObject` model to `@Observable` is mostly mechanical:

- Remove `: ObservableObject` from the class and delete every `@Published` — plain `var` properties are tracked automatically.
- Where a view owned the model with `@StateObject`, switch to `@State`.
- Where a view received the model with `@ObservedObject`, switch to a plain `let` — or `@Bindable` if that view needs to write into it via bindings.
- Where a view used `@EnvironmentObject`, switch to `@Environment(Type.self)`, and inject with `.environment(_:)` instead of `.environmentObject(_:)`.

`@Observable` requires iOS 17 or later; code that still supports older OS versions stays on `ObservableObject`. The two systems can coexist, so migration can happen model by model rather than all at once.

## Interview lens

If asked "why did Observation replace ObservableObject?", lead with the redraw granularity: `ObservableObject` invalidates every observer on any `@Published` change, while `@Observable` tracks which properties a view actually read and redraws only when those specific properties change. Frame it as a real performance fix for large models, not just less typing — though it's also less typing.

If asked how to use it, walk the wrapper mapping for iOS 17+: `@State` to own a model (replacing `@StateObject`), a plain `let` to receive a read-only model (replacing `@ObservedObject`), `@Bindable` when you need `$` bindings into a model you don't own, and `@Environment(Type.self)` with `.environment(_:)` for environment-injected models (replacing `@EnvironmentObject`).

If pushed on adoption, say it requires iOS 17+, that `ObservableObject` still works and can be migrated incrementally, and that the migration itself is mostly mechanical — drop `@Published`, add `@Observable`, and swap each property wrapper to its Observation equivalent based on who owns the model.
