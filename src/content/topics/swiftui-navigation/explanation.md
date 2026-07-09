## The problem: navigation you can't control from code

Here's how SwiftUI navigation looked for its first few years:

```swift
NavigationView {
    List(items) { item in
        NavigationLink(destination: DetailView(item: item)) {
            Text(item.name)
        }
    }
}
```

Read the link closely: the *destination view* is baked into the *tap target*. Where you go is hard-wired into where you tap.

That works until the day navigation has to happen without a tap. A push notification should open a specific item's detail screen. A URL like `myapp://profile/7` should land three levels deep. The app relaunches and should restore the screen the user was on. In every case some piece of *code* — not a finger — needs to say "navigate there," and this API gives code no handle to grab. There's no clean way to ask "what's on the stack?" or to say "make the stack look like *this*."

Modern SwiftUI's answer — `NavigationStack`, from iOS 16 — rebuilds navigation around one idea: the navigation stack is *data*. You push plain values, a separate rule turns values into screens, and the whole stack is a piece of state you can read, mutate, and save. The old `NavigationView` approach is deprecated; this lesson is the replacement.

## NavigationStack: push a value, not a view

Here's the same list, rebuilt the modern way:

```swift
NavigationStack {
    List(items) { item in
        NavigationLink(item.name, value: item)      // push a VALUE
    }
    .navigationDestination(for: Item.self) { item in
        DetailView(item: item)                      // value → screen
    }
}
```

`NavigationStack` is the container — it hosts the stack of screens, the title bar, the back button. The interesting change is in the two halves below it:

```swift
NavigationLink(item.name, value: item)
```

The link no longer contains a destination view. It says only: when tapped, push *this value* — an `Item` — onto the stack.

```swift
.navigationDestination(for: Item.self) { item in
    DetailView(item: item)
}
```

This is the other half: a rule declaring how to render any pushed value of type `Item`. "Whenever an `Item` lands on the stack, show a `DetailView` for it."

Notice what got separated. The link knows *what* to push; the destination rule knows *how to render it*; neither knows about the other beyond the value's type. The list could ship in one module and the detail screen in another, connected only by `Item`.

## Any Hashable value can be a screen

What can you push? Any value that's `Hashable` — meaning it can be compared and summarized for fast lookup, which SwiftUI needs to track stack entries. In practice, apps define an enum of routes:

```swift
enum Route: Hashable {
    case settings
    case profile(id: Int)
}

NavigationLink("Settings", value: Route.settings)
NavigationLink("Profile",  value: Route.profile(id: 7))

.navigationDestination(for: Route.self) { route in
    switch route {
    case .settings:          SettingsView()
    case .profile(let id):   ProfileView(id: id)
    }
}
```

Three payoffs come with pushing values:

- Decoupling — links don't reference destination views, just value types.
- Reuse — `.profile(id: 7)` can be pushed from a list row, a search result, or a notification handler, and one rule renders it.
- The big one: navigation is now *data*. And data can be manipulated by code — which is the next section, and the whole reason this API exists. Structuring an app's routes at scale gets its own routing lesson later.

## The path: navigation as a variable

So far links still do the pushing. The final piece hands the stack itself to your code. Bind the stack to a **path** — an array holding whatever has been pushed:

```swift
@State private var path: [Route] = []

NavigationStack(path: $path) {
    RootView()
        .navigationDestination(for: Route.self) { route in
            view(for: route)
        }
}
```

The binding makes it two-way: the stack shows whatever the array contains, and taps that push values append to the array. Which means ordinary array mutations *are* navigation:

```swift
path.append(.profile(id: 7))   // pushes the profile screen
path.removeLast()              // pops one screen — same as the back button
path.removeAll()               // pops all the way to root
```

No `push()` or `pop()` methods anywhere — you edit state, and SwiftUI makes the screen match. This is the same declarative loop as everything else in SwiftUI, applied to navigation.

Now predict. The app has just launched; the user is at the root. Code runs:

```swift
path = [.settings, .profile(id: 7)]
```

What does the user see, and what happens when they tap back?

Answer: they land on the profile screen, two levels deep. Tapping back pops to settings — SwiftUI built the *entire* stack from the array, intermediate screen included, with a working back chain. You never navigated "through" settings; you declared the end state and the stack materialized it. Hold onto that — it's exactly what deep linking needs.

One variant to know: if your pushed values have *mixed types* — some `Item`s, some `Route`s — a typed array can't hold them. `NavigationPath` is a container SwiftUI provides for exactly that: it stores values of different `Hashable` types in one path, at the cost of not letting you inspect elements as freely as an array.

## Sheets and alerts: presentation is state too

The same state-driven principle covers modal presentation — sheets, alerts, popovers. Nothing is ever "presented" by calling a method; a piece of state says whether it's up:

```swift
@State private var showAdd = false

Button("Add") { showAdd = true }        // mutate state...
    .sheet(isPresented: $showAdd) {     // ...sheet follows the Bool
        AddView()
    }
```

The sheet is visible exactly when `showAdd` is `true`. Dismissing it — swipe down, or a Done button — sets the binding back to `false`. State and screen can't disagree, because the screen is derived from the state.

Now the common harder case: tapping any row should open an editor *for that row's item*. With a `Bool` you'd need a second variable to smuggle the item across, and the two can fall out of sync. The `item:` variant collapses both into one optional:

```swift
@State private var editing: Item?       // nil = no sheet

List(items) { item in
    Button(item.name) { editing = item }
}
.sheet(item: $editing) { item in        // presents when non-nil
    EditView(item: item)                //  — and hands the value in
}
```

When `editing` becomes non-nil, the sheet appears with that item; dismissal resets it to `nil`. One variable is both the "is it showing?" flag and the payload — nothing to desynchronize.

Alerts, confirmation dialogs, and popovers follow the same shape:

```swift
.alert("Delete?", isPresented: $confirming) { /* buttons */ }
.confirmationDialog("Options", isPresented: $showOptions) { /* buttons */ }
.popover(isPresented: $showPopover) { InfoView() }
```

Because all presentation lives in plain view state, it's declarative and testable — a unit test can set `editing` and assert the state, no simulated taps required.

## Deep linking: parse a URL, assign the path

Time to collect the payoff. The app receives `myapp://profile/7` and must land on that profile. Navigation is a variable now — so deep linking is an assignment:

```swift
.onOpenURL { url in
    if let route = Route(url: url) {    // parse URL → route value
        path = [route]                  // assign → stack renders it
    }
}
```

`onOpenURL` fires when the system hands your app a URL. You parse it into one of your route values and set the path. Done — no walking through screens, no timing hacks.

And the multi-level case costs nothing extra, because of what the predict moment showed — assigning a whole array builds a whole stack:

```swift
path = [.list, .detail(id: 42)]   // detail screen, back button leads to list
```

The same mechanism gives you state restoration. If `Route` is `Codable` — convertible to and from saved data — you can persist the path when the app quits and reassign it on launch, reopening the user's exact screen. Serializing navigation was effectively impossible when destinations were views; it falls out for free when they're values.

## Common pitfalls

- **Reaching for `NavigationView` and `NavigationLink(destination:)` in new code.** Deprecated, and it hard-wires destinations to taps — programmatic navigation and deep links fight it. Use `NavigationStack` with values.
- **Pushing values with no matching `.navigationDestination(for:)`.** The link does nothing or the stack misbehaves; every pushed value type needs a registered rule.
- **A `Bool` plus a stored variable for item sheets.** The two drift out of sync. Use `.sheet(item:)` — one optional carries both the flag and the payload.
- **Deep-link handlers that "walk" to the target screen step by step.** Unnecessary — build the full path array and assign it once; SwiftUI constructs the intermediate stack.

## Interview lens

The core shift to articulate: `NavigationStack` makes navigation data-driven. `NavigationLink(value:)` pushes a `Hashable` value, and `.navigationDestination(for:)` maps that value's type to a destination view — so links and destinations are decoupled, connected only by a type. If you frame your answer around "you push values, not views," you've hit the headline.

Then get to the path, because that's where the senior signal lives: bind the stack to a path — a typed array of route values, or `NavigationPath` when types are mixed — and navigation becomes plain state. `path.append` pushes, `removeAll` pops to root, and assigning a whole array materializes a whole stack with a working back chain.

Be ready for "why does that matter?" — the answer is deep linking and state restoration. Parse an incoming URL into route values, assign the path, and the app lands anywhere, any depth; make routes `Codable` and the same path persists and restores across launches. Contrast with the deprecated `NavigationView`/`NavigationLink(destination:)`, which baked destinations into tap targets and couldn't be driven from code cleanly.

Round it out by noting modals follow the same philosophy: `.sheet(isPresented:)`, `.alert`, `.confirmationDialog` are all bound to state, and `.sheet(item:)` presents when an optional becomes non-nil while passing the value in — the clean replacement for a flag-plus-payload pair. Presentation as state means it's declarative and testable, which is the phrase interviewers are listening for.
