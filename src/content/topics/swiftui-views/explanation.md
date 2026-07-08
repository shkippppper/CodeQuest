## The problem: keeping the screen in sync with your data

Here's how UIKit — Apple's older UI framework — shows a label:

```swift
let label = UILabel()
label.text = "Hello, Ada"
view.addSubview(label)
// ...later, when the name changes:
label.text = "Hello, Grace"
```

You *build* the view object, keep a reference to it, and *mutate* it every time the data changes. This style is called **imperative** — you give step-by-step orders: create this, set that, now change it.

The failure mode: you forget one of those "now change it" calls, and the screen shows stale data. The UI and your state have drifted apart, and nothing forces them back together.

SwiftUI flips the model. It's **declarative** — instead of orders, you write a description of what the UI should look like *for the current state*, and the framework figures out what actually changed on screen. You never hold a view object. You never mutate one. When state changes, you just describe again.

## A view is a struct with a body

Here's a complete SwiftUI view:

```swift
struct Greeting: View {
    let name: String
    var body: some View {
        Text("Hello, \(name)")
    }
}
```

Three things to notice, one at a time.

First: it's a struct conforming to the `View` protocol, which has exactly one requirement — a computed property called **`body`** that returns the UI description.

Second: `body` is *computed*. There's no stored view object anywhere. Ask for `body` and it builds a fresh description from the current `name`.

Third: that return type, `some View`. This is an **opaque return type** — it promises "I return one specific type that conforms to `View`, but I'm not telling you which." Why hide it? Because the real type of even a modest `body` is a monstrous nested generic like `VStack<TupleView<(Text, ModifiedContent<Text, ...>)>>`. You'd never want to write that by hand, and `some View` means you never have to.

## Small views compose into big ones

Add a second line of text:

```swift
struct RecipeHeader: View {
    let title: String
    let subtitle: String
    var body: some View {
        VStack(alignment: .leading) {
            Text(title).font(.headline)
            Text(subtitle).foregroundStyle(.secondary)
        }
    }
}
```

`VStack` stacks its children vertically. Its siblings `HStack` and `ZStack` do horizontal and front-to-back stacking, and `List` does scrolling rows. Complex screens are built by nesting these containers — every individual view stays small and focused.

One rule about `body`: SwiftUI calls it whenever it needs to re-render, which can be *very* often. So `body` must be cheap and side-effect-free — describe the UI and nothing else. No network calls, no heavy computation, no writing to disk in there.

## Views are throwaway values, not objects

SwiftUI views are structs — value types. That's a deliberate, load-bearing choice.

```swift
Greeting(name: "Ada")    // created...
// state changes
Greeting(name: "Grace")  // ...thrown away, created again
```

Your view structs are cheap, disposable *descriptions*. SwiftUI creates them, reads their `body`, and discards them constantly. Behind the scenes it keeps a separate, long-lived render tree — the actual on-screen stuff — and **diffs** each new description against the old one, meaning it compares the two and applies only the minimal changes.

Now predict: what does the button below show after three taps?

```swift
struct Counter: View {
    var count = 0                       // plain var — no property wrapper
    var body: some View {
        Button("Taps: \(count)") { /* count += 1 — won't even compile */ }
    }
}
```

Answer: it can't work at all. `body` isn't allowed to mutate the struct — and even if it could, the struct gets recreated on every update, so `count` would reset to 0 each time. A plain `var` in a view can't hold state that survives.

Mutable UI state needs a property wrapper like `@State`, which stores the value *outside* the transient struct. That's the next topic — here, the point is *why* it must exist: because views are throwaway values.

## Modifiers wrap views in layers

You style a view by calling **modifiers** — methods that return a *new view wrapping the old one*, never mutating it:

```swift
Text("Hi")
    .font(.title)
```

That line doesn't change a `Text`. It produces a new view: a font-styled wrapper around the `Text`. Keep chaining:

```swift
Text("Hi")
    .font(.title)
    .padding()                 // wraps the text in breathing room
    .background(.blue)         // wraps THAT in a blue backdrop
    .foregroundStyle(.white)
```

Each step wraps the result of the previous one, like nesting boxes: `Text` → padded text → blue-backed padded text.

Because each modifier wraps whatever came before it, *order matters*. Predict the difference:

```swift
Text("A").padding().background(.blue)   // version 1
Text("B").background(.blue).padding()   // version 2
```

Answer: version 1 paints blue around a padded text — the blue area includes the padding. Version 2 paints blue tightly around the bare text *first*, then adds transparent padding outside the blue. Same modifiers, visibly different result. Nearly all styling and layout in SwiftUI is expressed through modifier chains, so this wrapping model comes up constantly.

## The closure syntax that makes composition readable

Look back at the `VStack`:

```swift
VStack {
    Text("First")
    Text("Second")     // no commas, no return, no array
}
```

Two expressions just sitting there, and somehow they become the stack's children. The trick is **`@ViewBuilder`** — a result builder, which is a Swift feature that collects the expressions in a closure and combines them into one value. `VStack`'s closure is marked `@ViewBuilder`, so listing views is enough.

It also allows limited control flow:

```swift
VStack {
    Text("Always shown")
    if isLoggedIn {
        Text("Welcome back")   // included only when true
    }
}
```

`if` and `switch` work for conditionally including views. A `@ViewBuilder` handles a bounded number of children and simple conditionals — for dynamic collections of unknown length you use `ForEach`, which has its own lesson.

## Previews give instant feedback

Because views are plain value types built with ordinary initializers, rendering one in any state is trivial:

```swift
#Preview {
    Greeting(name: "Ada")
}
```

Xcode's preview canvas renders this live, without launching the app. Change the code, watch it update. Want to see an edge case? Construct the view with edge-case data — a long name, an empty string — right in the preview. This fast loop is a core part of the SwiftUI workflow, and it falls straight out of the value-type design.

## Common pitfalls

- **Storing state in a plain `var`.** The struct is recreated on every update; the value resets. Use `@State` (next topic).
- **Doing work in `body`.** It runs constantly — network calls or heavy computation there means jank. Describe, don't compute.
- **Ignoring modifier order.** `.padding().background()` and `.background().padding()` look different. Read chains as wrapping, inside-out.
- **Thinking of views as objects to keep.** There's no reference to hold and mutate — if you're reaching for one, you're writing UIKit in SwiftUI syntax.

## Interview lens

Lead with declarative versus imperative: in SwiftUI, `body` is a function of state that *describes* the UI, and the framework diffs successive descriptions to update the real render tree — you never hold or mutate view objects the way you do in UIKit. That one sentence covers the biggest conceptual gap.

Then explain that views are cheap value-type structs recreated constantly — and use that as the *reason* mutable state can't live in a plain `var` and needs `@State`. Interviewers love hearing the "why" chain instead of two disconnected facts.

Be ready for three follow-ups: `some View` is an opaque type hiding the huge generic body type; `body` must be cheap and side-effect-free because it runs often; and modifiers return new wrapped views, so order matters — cite `.padding().background()` versus `.background().padding()` as the concrete example. If `@ViewBuilder` comes up, describe it as the result builder that lets container closures list children comma-free and include them conditionally with `if`.
