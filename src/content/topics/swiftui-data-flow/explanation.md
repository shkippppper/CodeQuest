## The problem: a model too big for @State

The last lesson ended with a rule: `@State` and `@Binding` are for small, local, value-type state. But look at what a real app carries around:

```swift
final class CartModel {
    var items: [Item] = []
    var total: Decimal = 0
}
```

A shopping cart. It's a class — a reference type — because many screens need to look at the *same* cart: the product page adds to it, the badge in the toolbar counts it, the checkout screen empties it. Copies won't do; everyone must share one object.

Try to wire it up with what we know:

```swift
struct CartBadge: View {
    var cart: CartModel
    var body: some View {
        Text("\(cart.items.count)")   // shows the count... once
    }
}
```

This compiles and even shows the right number — the first time. Then someone adds an item, `cart.items` changes, and the badge doesn't move. SwiftUI has no idea the object changed, because nothing told it to watch.

That's the gap this lesson fills: making SwiftUI *observe* a shared reference-type model, and — the part interviews hammer on — deciding who keeps that object alive.

## A class SwiftUI can watch

Two additions make the cart observable:

```swift
final class CartModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var total: Decimal = 0
}
```

**`ObservableObject`** is a protocol for classes whose changes SwiftUI can subscribe to. **`@Published`** marks which properties count as changes worth announcing.

Here's what happens on a write, step by step:

```swift
cart.items.append(newItem)
// 1. just before the change, the object emits a signal called objectWillChange
// 2. every view observing this object hears the signal
// 3. each of those views re-renders
```

One detail hides in step 3, and it matters later: the signal says "*the object* will change" — not *which property*. Observation is object-level. A view that only reads `total` still re-renders when `items` changes, because all it heard was "something in this object moved." Hold that thought; it comes back at the end.

## Observing the model from a view

The model can announce changes now, but our badge still isn't listening. One wrapper fixes that:

```swift
struct CartBadge: View {
    @ObservedObject var cart: CartModel
    var body: some View {
        Text("\(cart.items.count)")   // now re-renders on every cart change
    }
}
```

**`@ObservedObject`** subscribes this view to the object's `objectWillChange` signal. Cart changes, badge re-renders. The object itself is *passed in* from outside — this view observes it but doesn't own it.

So who does own it? Somewhere, some view has to actually create the cart and keep it alive. The obvious attempt:

```swift
struct CartScreen: View {
    @ObservedObject var cart = CartModel()   // create it right here?
    var body: some View {
        CartBadge(cart: cart)
    }
}
```

Predict: `CartScreen` sits inside a parent view. The parent re-renders — maybe a clock ticked, maybe an unrelated toggle flipped. What happens to the items in the cart?

Answer: they're gone. The cart is silently replaced by a brand-new, empty `CartModel`.

Recall from the `@State` lesson *why*: SwiftUI destroys and recreates view structs constantly. When the parent re-renders, `CartScreen` is rebuilt as a fresh struct — and the initializer `= CartModel()` runs again. `@ObservedObject` does nothing to prevent this. It only *subscribes*; it makes no promise to keep the object alive across recreations.

This is the single most infamous SwiftUI bug, and it's nasty precisely because it's invisible until some unrelated re-render wipes your state.

## @StateObject: create it once, keep it alive

The fix is one word:

```swift
struct CartScreen: View {
    @StateObject private var cart = CartModel()   // created ONCE, owned here
    var body: some View {
        CartBadge(cart: cart)                     // children still receive it
    }
}
```

**`@StateObject`** does what `@State` did for values, but for reference objects: SwiftUI runs the initializer exactly once, stores the object in external storage tied to the view's identity, and hands the same instance back on every recreation of the struct. Parent re-renders all it wants — the cart survives.

Now the two wrappers snap into a clean division of labor:

```swift
struct CartScreen: View {
    @StateObject private var cart = CartModel()   // I CREATE it → @StateObject
    var body: some View { CartBadge(cart: cart) }
}

struct CartBadge: View {
    @ObservedObject var cart: CartModel           // I RECEIVE it → @ObservedObject
    var body: some View { Text("\(cart.items.count)") }
}
```

The rule to memorize, because interviewers ask it verbatim: create with `@StateObject`, receive with `@ObservedObject`. Ownership decides — the view where the object is *born* owns it; everyone downstream merely observes.

## Skipping the middlemen: @EnvironmentObject

Passing the cart down one level was fine. Now imagine the badge lives five levels deep:

```swift
RootView(cart: cart)
  → TabScreen(cart: cart)
    → Toolbar(cart: cart)        // doesn't use the cart
      → TrailingItems(cart: cart) // doesn't use the cart
        → CartBadge(cart: cart)   // finally uses it
```

Three views in the middle take a `cart` parameter they never touch, purely to ferry it downward. Every new shared model repeats this plumbing.

**`@EnvironmentObject`** removes the plumbing. Inject the object once, high in the tree:

```swift
RootView()
    .environmentObject(cart)   // available to EVERYTHING below this point
```

Then any descendant — five levels down or fifty — pulls it out by type:

```swift
struct CartBadge: View {
    @EnvironmentObject var cart: CartModel   // no init parameter, no plumbing
    var body: some View { Text("\(cart.items.count)") }
}
```

The views in between mention nothing. SwiftUI matches the request to the injected object by its type: "someone above me injected a `CartModel`; give me that one."

There's a price for the convenience. That matching happens at runtime, when the view appears — not at compile time. So predict: what happens if `CartBadge` appears on screen and *no* ancestor ever called `.environmentObject(cart)`?

Answer: the app crashes, immediately, with a fatal error. The compiler can't save you, because it can't know what will be injected. This is why the guidance is to reserve `@EnvironmentObject` for genuinely app-wide models — the user session, the theme, the cart — where injection at the root is guaranteed, rather than sprinkling it everywhere as a convenience.

## @Environment: values, not objects

One neighbor gets confused with `@EnvironmentObject` constantly, so let's separate them. SwiftUI's environment also carries plain *values* — is dark mode on, what's the locale, how do I dismiss this sheet. **`@Environment`** reads those:

```swift
@Environment(\.colorScheme) private var colorScheme   // light or dark
@Environment(\.dismiss) private var dismiss           // action to close this screen
@Environment(\.locale) private var locale             // user's region settings
```

Note the access pattern: a key path, written `\.something`, naming which value you want. Compare:

- `@Environment(\.colorScheme)` — reads a *value* by key path. Often a value type. Built-ins cover color scheme, size class, dismiss, locale, and dozens more.
- `@EnvironmentObject` — reads a *reference-type `ObservableObject`* matched by its type, which you injected yourself.

You can extend the value side too: defining a custom `EnvironmentKey` lets you add your own keyed values, so `@Environment(\.myFeatureFlag)` works exactly like the built-ins.

## Choosing the right wrapper

The whole family, in one place. Ownership is the deciding axis: who *creates* the thing versus who *borrows* it.

| Need | Wrapper |
|---|---|
| Local value state this view owns | `@State` |
| Read/write access to a parent's value state | `@Binding` |
| Create and own a reference model | `@StateObject` |
| Observe a reference model owned elsewhere | `@ObservedObject` |
| App-wide reference model, injected implicitly | `@EnvironmentObject` |
| Built-in or custom environment value | `@Environment(\.key)` |

## Common pitfalls

- **`@ObservedObject var model = Model()`.** The model is recreated on every parent re-render, silently resetting its state. Fix: create with `@StateObject`; use `@ObservedObject` only for objects passed in.
- **A view reads a plain class property and never updates.** The class isn't `ObservableObject`, or the property isn't `@Published`, or the view holds it without a wrapper. All three links must exist.
- **`@EnvironmentObject` crash on appear.** A "fatal error: no ObservableObject found" means no ancestor injected that type. Fix: `.environmentObject(...)` at or above the crashing view — and in previews and tests too, which forget it most often.
- **Reaching for `@EnvironmentObject` for everything.** Implicit dependencies are invisible in initializers and unresolved until runtime. Keep it for genuinely global models; pass everything else explicitly.

## Interview lens

The number-one question in this area is "`@StateObject` versus `@ObservedObject` — what's the difference?" Answer in one axis: ownership. `@StateObject` means this view creates and owns the object — SwiftUI runs the initializer once and keeps the instance alive across every re-render. `@ObservedObject` means the object is owned elsewhere and passed in — SwiftUI subscribes to it but makes no promise about its lifetime.

Then volunteer the bug, because it proves you've been burned by the real thing: declaring `@ObservedObject var model = Model()` recreates the model every time the parent re-renders, wiping its state with no error anywhere. The rule you say out loud: create with `@StateObject`, receive with `@ObservedObject`.

If asked about `@EnvironmentObject`, hit both halves: it removes prop-drilling by injecting a shared `ObservableObject` once and reading it anywhere below by type — and it crashes at runtime if nothing was injected, which is why it's for genuinely app-wide models. Distinguish it crisply from `@Environment(\.key)`, which reads environment *values* like `colorScheme` and `dismiss` by key path.

For a senior close, name the limitation of this whole system: `ObservableObject`/`@Published` observation is object-level, so any published change re-renders every observer, even views that read a different property. The newer `@Observable` macro fixes exactly this with per-property tracking — that's the next lesson, and mentioning the trade-off unprompted is a strong signal.
