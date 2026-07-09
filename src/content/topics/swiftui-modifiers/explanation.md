## The problem: the same four modifiers, copy-pasted everywhere

Every card in your app is styled like this:

```swift
Text("Order #1024")
    .padding()
    .background(.regularMaterial)
    .clipShape(RoundedRectangle(cornerRadius: 12))
    .shadow(radius: 4)
```

And so is the profile card. And the settings card. And thirty other views, each with the same four lines pasted in.

Then design says: corner radius is now 16. Your afternoon is a project-wide hunt for every copy of the combo, hoping you don't miss one.

The fix is the same as for any repeated code — give the bundle a name, define it once, use the name everywhere. SwiftUI has dedicated tools for naming view logic, and this lesson walks through them: custom modifiers, view-builder functions, and — the advanced one — a channel for sending data *up* the view tree.

## ViewModifier: naming a bundle of modifiers

The tool for packaging a modifier chain is the **`ViewModifier`** protocol. It asks for exactly one method:

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
```

Read `body(content:)` as: "here's the view I'm being applied to — hand back the transformed version." The `content` parameter *is* that view. Its type, `Content`, is a placeholder the compiler fills in — you never need to know the concrete type, you just chain modifiers onto it.

Apply it with `.modifier(...)`:

```swift
Text("Order #1024").modifier(CardStyle())
```

Four pasted lines became one. Change the corner radius inside `CardStyle`, and every card in the app updates.

Because `CardStyle` is an ordinary struct, it can do more than a fixed recipe. It can take parameters:

```swift
struct CardStyle: ViewModifier {
    var radius: CGFloat = 12          // a stored property = a parameter
    func body(content: Content) -> some View {
        content
            .padding()
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: radius))
            .shadow(radius: 4)
    }
}
```

And it can hold its own `@State` or read `@Environment` — a modifier that tracks a hover flag, or restyles itself in dark mode, keeps that logic inside itself, invisible to every view that uses it.

## Making it read like a built-in

`.modifier(CardStyle())` works, but no built-in modifier looks like that. One small extension closes the gap:

```swift
extension View {
    func cardStyle() -> some View { modifier(CardStyle()) }
}
```

Now the call site is indistinguishable from SwiftUI's own modifiers:

```swift
Text("Order #1024").cardStyle()
```

This pairing — a `ViewModifier` struct plus a `View` extension exposing it — is the idiomatic pattern for shipping a design system. Your team autocompletes `.cardStyle()`, `.primaryButton()`, `.sectionHeader()` right alongside `.padding()`, and every visual decision lives in exactly one file.

## @ViewBuilder: naming a chunk of views

Modifiers transform one existing view. The other kind of repetition is a *chunk of view code* — several views, maybe a `switch` — that you want to pull out of a bloated `body`. A plain function almost works:

```swift
func statusLabel(_ status: Status) -> some View {
    switch status {                      // ❌ won't compile in a plain function
    case .ok:    Label("OK", systemImage: "checkmark")
    case .error: Label("Error", systemImage: "xmark").foregroundStyle(.red)
    }
}
```

The compiler rejects it: a plain function must `return` one expression, and this `switch` produces different view types per branch with no `return` at all. Yet the exact same code is legal inside `body`. Why?

Because `body` is secretly marked with **`@ViewBuilder`** — an attribute that teaches a function to accept multiple views, `if`s, and `switch`es, and weave them into a single result behind the scenes. The fix is to borrow that power explicitly:

```swift
@ViewBuilder
func statusLabel(_ status: Status) -> some View {
    switch status {                      // ✅ now legal, just like in body
    case .ok:    Label("OK", systemImage: "checkmark")
    case .error: Label("Error", systemImage: "xmark").foregroundStyle(.red)
    }
}
```

One attribute, and the function speaks the same dialect as `body`. Use it in two places: breaking a long `body` into named, readable pieces — and accepting view content as a parameter, the way SwiftUI's own containers do:

```swift
struct Card<Content: View>: View {
    @ViewBuilder var content: () -> Content   // callers pass views in braces
    var body: some View {
        content().cardStyle()
    }
}

Card { Text("Hi"); Image(systemName: "star") }   // reads like VStack { }
```

## The conditional-content trap

`@ViewBuilder` allowing `if` invites a habit that hides a real bug. Say you show or highlight a text field conditionally:

```swift
if isEditing {
    NotesField().border(.blue)
} else {
    NotesField()
}
```

Predict: the user types a paragraph into the field, then `isEditing` flips. What happens to their text?

Answer: it can vanish. The two branches of an `if` are *structurally different positions* in the view tree, and SwiftUI treats the view in each branch as a different view with a different identity. Flipping the condition destroys one and creates the other — and as the state lesson showed, a destroyed view takes its `@State` down with it. The lifecycle topic digs into identity fully; here you need the symptom and the cure.

The cure: for visual toggles, prefer modifiers that stay applied and merely change value — the view never moves, so its identity never changes:

```swift
NotesField().border(isEditing ? .blue : .clear)   // one view, one identity, state safe
Text("Hi").opacity(isVisible ? 1 : 0)             // hidden, not destroyed
Button("Save") { }.disabled(!isValid)             // inert, not removed
```

The same trap hides inside a popular convenience. Many codebases carry an `.if` extension:

```swift
content.if(isEditing) { $0.border(.blue) }   // convenient — and risky
```

Under the hood it's the same `if` with two branches, so it can change identity and silently reset state, and it can also confuse animations. Know why it's risky before you accept it in review: when identity matters, reach for the inherently conditional modifiers instead of branching whole views.

## PreferenceKey: sending data up the tree

Everything so far, and everything in the data-flow lesson, moves data *down* — parents pass parameters, ancestors inject the environment. Now invert the question: a parent needs to learn something *from its children*. Say a column of buttons should all match the width of the widest one — only the children know their widths, and the parent needs the maximum.

The channel for upward data is a **`PreferenceKey`**. Define one by answering two questions — what's the value when nobody reports, and how do multiple reports combine:

```swift
struct WidthKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())   // many children report; keep the widest
    }
}
```

`reduce` is the combining rule. As values bubble up from many children, SwiftUI folds them pairwise through `reduce` — here `max`, because we want the widest.

Next, each child measures itself and reports. This uses `GeometryReader` from the layout lesson, with a standard trick to keep it from eating the layout:

```swift
Button("OK") { }
    .background(
        GeometryReader { proxy in
            Color.clear
                .preference(key: WidthKey.self, value: proxy.size.width)
        }
    )
```

Walk the trick from inside out: a background is always exactly the size of the view it's attached to, so the `GeometryReader` — greedy as ever — is offered *only the button's size*, and `proxy.size.width` is precisely the button's width. `Color.clear` draws nothing; it exists only as a surface to hang `.preference(...)` on, which reports the measured width up the tree.

Finally, an ancestor listens:

```swift
VStack { /* the buttons */ }
    .onPreferenceChange(WidthKey.self) { widest in
        maxWidth = widest                     // store it in @State...
    }
// ...then propose it back down:
// each button gets .frame(width: maxWidth)
```

`.onPreferenceChange` fires with the reduced result — the maximum width — which the parent stores and feeds back down as a frame. The full loop: children report up via preferences, the ancestor reads, and pushes the decision down via ordinary layout.

This isn't an exotic corner. Preferences are how SwiftUI itself implements `navigationTitle` — a *child* view declares the title, and the navigation container above reads it off a preference. Matched-size layouts and anchor-based overlays ride the same mechanism. The slogan worth remembering: environment flows down, preferences flow up.

## Common pitfalls

- **Copy-pasting modifier chains.** One design tweak becomes a project-wide hunt. Package the chain in a `ViewModifier` plus a `View` extension.
- **A plain helper function that won't compile with `if`/`switch` inside.** It's missing `@ViewBuilder` — `body` has it implicitly; your helpers need it explicitly.
- **State vanishing when a condition flips.** The view moved between `if` branches and changed identity. Use identity-preserving modifiers (`opacity`, `disabled`, conditional values) for visual toggles.
- **Trusting a `.if { }` helper blindly.** It branches the view tree, so it can reset state and break animations. Confine it to cases where identity genuinely doesn't matter.
- **A raw `GeometryReader` swallowing the layout while measuring.** Put it in a `.background` with `Color.clear` so it's sized to the measured view, not the other way around.

## Interview lens

If asked how you avoid repeating styling in SwiftUI, name the two tools and the pattern. A `ViewModifier` packages a transformation in `body(content:)`, and a `View` extension exposes it so `.cardStyle()` reads like a built-in — say explicitly that this extension pairing is how you'd build a design system, because that's the production-experience signal. `@ViewBuilder` covers the other axis: factoring multi-view chunks with `if`/`switch` out of `body`, and accepting view content as parameters in your own containers.

The first senior beat is conditional content: an `if` in a view builder creates different structural identities per branch, so a view moving across branches loses its `@State`. Say that you prefer identity-preserving modifiers — `opacity`, `disabled` — over branching whole views, and that the popular `.if {}` helper is risky for exactly this reason. Interviewers use this to check whether you understand identity or just syntax.

The second is `PreferenceKey`, the expected answer to "data flows down — how does it flow *up*?" Children set a preference, a static `reduce` combines the values, and an ancestor reads the result with `.onPreferenceChange`. Add that SwiftUI implements `navigationTitle` and anchor overlays on this mechanism, and close with the slogan: environment flows down, preferences flow up.
