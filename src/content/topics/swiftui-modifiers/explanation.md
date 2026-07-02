## The problem: repeating the same styling everywhere

You apply the same `.padding().background().cornerRadius().shadow()` combo to every card in the app. Copy-paste means one design tweak becomes a hunt across dozens of files. SwiftUI's tools for **reuse** — custom `ViewModifier`s, `@ViewBuilder` helper functions — let you name a bundle of view logic once and apply it everywhere, and **`PreferenceKey`** solves the harder problem of passing data *up* the tree.

## The `ViewModifier` protocol

A **`ViewModifier`** packages a reusable transformation of a view. It has one method, `body(content:)`, receiving the view it's applied to.

```swift
struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .shadow(radius: 4)
    }
}

Text("Hello").modifier(CardStyle())
```

`Content` is the (opaque) type of the view being modified. The modifier can hold its own stored properties (parameters) and even its own `@State`/`@Environment`.

## Reusable modifiers

For ergonomics, wrap the modifier in a `View` **extension** so it reads like a built-in modifier:

```swift
extension View {
    func cardStyle() -> some View { modifier(CardStyle()) }
}

Text("Hello").cardStyle()   // clean, discoverable
```

Now a design change lives in one place. This extension pattern is the idiomatic way to ship a design system's building blocks.

## `@ViewBuilder` functions

You can also factor out **chunks of view-producing code** into functions or computed properties marked **`@ViewBuilder`**, which lets them contain multiple views and `if`/`switch` just like `body`.

```swift
@ViewBuilder
func statusLabel(_ status: Status) -> some View {
    switch status {
    case .ok:    Label("OK", systemImage: "checkmark")
    case .error: Label("Error", systemImage: "xmark").foregroundStyle(.red)
    }
}
```

Use `@ViewBuilder` to break a big `body` into readable pieces, or to accept view content as a parameter (`content: () -> Content`) in your own container views.

## Conditional content

`@ViewBuilder` supports `if`/`switch`, but there's a subtle catch: an `if` creates **different structural identities** for its branches, so a view moving between branches loses its `@State` (see the lifecycle topic). For simple visual toggles prefer modifiers that don't change identity:

```swift
// identity-preserving:
Text("Hi").opacity(isVisible ? 1 : 0)

// vs. the "conditional modifier" trap:
```

A commonly-seen `.if(condition) { ... }` helper (a custom extension applying a modifier conditionally) is convenient but **risky**: because it can produce different branch types, it can change identity and reset state. Prefer inherently conditional modifiers (opacity, disabled, etc.) over branching whole views when identity matters.

## PreferenceKeys

Data normally flows **down** (parameters, environment). But sometimes a parent needs information from its **children** — the measured size of the tallest child, a child's chosen title. **`PreferenceKey`** lets children send values **up** the tree, which an ancestor reads.

```swift
struct WidthKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())     // combine children's values
    }
}

childView.background(GeometryReader { proxy in
    Color.clear.preference(key: WidthKey.self, value: proxy.size.width)
})
// ancestor:
.onPreferenceChange(WidthKey.self) { width in maxWidth = width }
```

`reduce` combines multiple children's contributions; the ancestor observes with `.onPreferenceChange`. This powers things like matched widths, custom nav-bar titles, and anchor-based overlays — the mechanism SwiftUI itself uses for `navigationTitle`.

## The interview lens

For reuse, name the two tools: **`ViewModifier`** (a reusable `body(content:)` transformation, usually exposed via a `View` extension so it reads like a built-in) and **`@ViewBuilder`** functions/params (factor out or accept multi-view content with `if`/`switch`). Emphasize the extension pattern as how you build a design system.

The senior beats: **conditional views via `if` change structural identity** (and can reset `@State`), so prefer identity-preserving modifiers (`opacity`, `disabled`) over branching whole views — and be wary of the `.if {}` helper for that reason. And **`PreferenceKey`** is the answer to "how does data flow **up** from children to a parent?" — children set a preference, `reduce` combines them, an ancestor reads via `.onPreferenceChange` (it's how SwiftUI implements `navigationTitle` and anchor overlays). Environment flows down; preferences flow up.
