## The problem: navigation that's data-driven, not view-driven

The old `NavigationView`/`NavigationLink(destination:)` hard-wired *where* you go into *where you tap* — hard to drive programmatically, deep-link, or restore. Modern SwiftUI (**`NavigationStack`**, iOS 16+) makes navigation **data-driven**: you push **values**, and a separate mapping turns each value into a destination view. The navigation stack becomes a piece of **state** you can read, mutate, serialize, and deep-link into.

## `NavigationStack`

`NavigationStack` hosts a stack of views with a title bar and back button.

```swift
NavigationStack {
    List(items) { item in
        NavigationLink(item.name, value: item)   // push a VALUE
    }
    .navigationDestination(for: Item.self) { item in
        DetailView(item: item)                   // value → destination
    }
}
```

The two halves: `NavigationLink(value:)` says *what to push*, and `.navigationDestination(for:)` says *how to render* a pushed value of that type. They're decoupled — the list doesn't know the detail view exists beyond the value's type.

## Value-based navigation

Pushing **values** (not views) is the key shift. Any `Hashable` value can be a destination:

```swift
NavigationLink("Settings", value: Route.settings)
NavigationLink("Profile", value: Route.profile(id: 7))
```

Benefits: destinations are **decoupled** from links, the same value can be pushed from anywhere, and — crucially — navigation becomes **data** you can manipulate programmatically and serialize (see the routing topic).

## Programmatic navigation & paths

Bind the stack to a **path** (an array of values or a `NavigationPath`) and you can push/pop **in code**:

```swift
@State private var path: [Route] = []

NavigationStack(path: $path) {
    RootView()
        .navigationDestination(for: Route.self) { view(for: $0) }
}

// push:
path.append(.profile(id: 7))
// pop to root:
path.removeAll()
```

Because the path is `@State`, mutating it drives navigation — no imperative `push`/`pop` calls. This is what makes deep linking and state restoration natural: set the path and the stack renders it.

## Sheets, popovers, alerts

Modal presentation is driven by **state**, not method calls:

```swift
@State private var showSheet = false
@State private var editing: Item?      // item-driven presentation

.sheet(isPresented: $showSheet) { AddView() }
.sheet(item: $editing) { item in EditView(item: item) }   // presents when non-nil
.alert("Delete?", isPresented: $confirming) { /* buttons */ }
.confirmationDialog(...) { ... }
.popover(isPresented: $showPopover) { ... }
```

The `item:` variants present when the bound optional becomes non-nil and pass the value in — cleaner than a separate bool + stored item. All modal state lives in your view state, so presentation is declarative and testable.

## Deep linking

Because the stack is bound to a `path`, deep linking is just **setting the path**:

```swift
.onOpenURL { url in
    if let route = Route(url: url) { path = [route] }   // or build a full stack
}
```

Parse the incoming URL into your route value(s), assign the path, and SwiftUI renders that navigation state — including building a multi-level stack (e.g. `[.list, .detail(id)]`). Same mechanism serves state restoration when the path is `Codable`.

## The interview lens

The core shift: **`NavigationStack` is data-driven** — `NavigationLink(value:)` pushes a **`Hashable` value**, and `.navigationDestination(for:)` maps that value type to a destination view, **decoupling** links from destinations. Bind the stack to a **`path`** (`[Value]`/`NavigationPath`) and navigation becomes **state**: `path.append(...)`/`removeAll()` drives it programmatically.

Explain why that matters: value + path make **deep linking and state restoration** trivial — parse a URL into route values, set the path, done (and `Codable` routes persist/restore). Note that **modals are state-driven too** (`.sheet(isPresented:)`, `.sheet(item:)` for optional-driven, `.alert`, `.confirmationDialog`), and that this replaces the deprecated `NavigationView`/`NavigationLink(destination:)` which couldn't be driven programmatically as cleanly.
