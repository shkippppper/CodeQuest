## The problem: describing UI instead of mutating it

In UIKit you *build* and *mutate* a view tree: create a `UILabel`, set `.text`, add it as a subview, later change `.text` again. That imperative style means the UI and your state can drift out of sync. **SwiftUI is declarative**: you write a function of your state that *describes* what the UI should look like right now, and the framework figures out the changes. You never hold or mutate view objects — you return a fresh description whenever state changes.

## The `View` protocol

A SwiftUI view is any type conforming to `View`, which has one requirement: a **`body`** computed property returning some UI.

```swift
struct Greeting: View {
    let name: String
    var body: some View {
        Text("Hello, \(name)")
    }
}
```

`some View` is an **opaque return type**: "I return one specific `View` type, but you don't need to name it." It's required because `body`'s real type is a huge nested generic (`Text`, `VStack<...>`, etc.) you'd never want to write by hand.

## `body` & view composition

You build complex UI by **composing** small views inside containers (`VStack`, `HStack`, `ZStack`, `List`). Every view is small and focused; you nest them.

```swift
var body: some View {
    VStack(alignment: .leading) {
        Text(title).font(.headline)
        Text(subtitle).foregroundStyle(.secondary)
    }
}
```

`body` is called by SwiftUI whenever it needs to render — potentially very often — so it should be **cheap and side-effect-free**. Don't do network calls or heavy work in `body`; just describe the UI.

## Value-type views

SwiftUI views are **structs** (value types), not classes. They're **cheap, disposable descriptions** — SwiftUI creates and throws them away constantly, diffing the new description against the old to compute minimal updates to the *actual* render tree it manages behind the scenes.

This is why you don't store mutable state as a plain `var` in a view: the struct is recreated on every update, so the value would reset. Mutable UI state needs a property wrapper like `@State` (next topic) that SwiftUI stores *outside* the transient struct.

## Modifiers

You customize a view by applying **modifiers** — methods that return a **new, wrapped view** rather than mutating the original.

```swift
Text("Hi")
    .font(.title)
    .padding()
    .background(.blue)
    .foregroundStyle(.white)
```

Each modifier wraps the previous view (`Text` → `_PaddingLayout<Text>` → …). Because each returns a new view, **order matters**: `.padding().background()` puts the background *around* the padding, while `.background().padding()` puts padding *outside* a tight background. Modifiers are how nearly all styling and layout is expressed.

## `@ViewBuilder` basics

The closure you pass to `VStack { … }` can list several views with no commas or `return` — that's a **`@ViewBuilder`**, a result builder that collects the child views into one composite. It also supports limited control flow (`if`, `switch`) to conditionally include views.

```swift
VStack {
    Text("Always")
    if isLoggedIn {
        Text("Welcome back")     // conditional child via @ViewBuilder
    }
}
```

(A `@ViewBuilder` supports a bounded number of children and simple conditionals — for dynamic collections you use `ForEach`.)

## Previews

SwiftUI's Xcode **previews** render a view live without launching the app, using sample data — a fast feedback loop that's a core part of the workflow.

```swift
#Preview {
    Greeting(name: "Ada")
}
```

Because views are cheap value types you construct with plain initializers, previewing any view in any state is trivial — just build it with the data you want.

## The interview lens

Lead with **declarative vs imperative**: in SwiftUI you write `body` as a **function of state that describes the UI**, and the framework diffs descriptions to update the real render tree — you never hold or mutate view objects like in UIKit. Explain that views are **cheap value-type structs**, recreated constantly, which is *why* mutable state can't be a plain `var` and needs `@State`.

Be ready for **`some View`** (an opaque type hiding the complex generic body), that **`body` should be cheap/side-effect-free** (it runs often), and that **modifiers return new wrapped views so order matters** (`.padding().background()` ≠ `.background().padding()`). Mention `@ViewBuilder` as the result builder enabling the comma-free, conditionally-composed child views.
