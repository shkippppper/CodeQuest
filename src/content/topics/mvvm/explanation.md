## The line of code with no home

From the MVC lesson, you know where trouble starts. Here it is again, concretely:

```swift
joinedLabel.text = "Joined " + relativeFormatter.string(for: user.joinDate)!
saveButton.isEnabled = !titleField.text!.isEmpty
```

Turning a `Date` into "2 hours ago". Deciding whether Save is enabled. Mapping an API model into what a label shows.

This kind of code — **presentation logic** — is neither business rules nor drawing. MVC gives it no role of its own, so it lands in the view controller, tangled up with UIKit, where no unit test can reach it.

**MVVM** — Model-View-ViewModel — fixes this with one new role: a plain object that owns all presentation state and logic, knows nothing about UIKit or SwiftUI, and can be tested by itself.

## Meet the ViewModel

Start with the model — unchanged from MVC, just data and business logic:

```swift
struct User {
    let name: String
    let lastSeen: Date
}
```

Now the new role. A **ViewModel** takes the model in and produces *display-ready state* out:

```swift
@MainActor
final class ProfileViewModel: ObservableObject {
    @Published private(set) var title = ""
    @Published private(set) var subtitle = ""
}
```

Two properties, both plain `String`s. Not a `Date`, not a `User` — exactly the text the screen will show, pre-formatted.

Give it the logic that used to live in the controller:

```swift
    func load(_ user: User) {
        title = user.name
        subtitle = "Seen " + RelativeDateTimeFormatter()
            .localizedString(for: user.lastSeen, relativeTo: .now)
    }
```

Look at what this class imports: Foundation. No UIKit, no views, no outlets. It doesn't know a view exists — it just transforms model in, display-ready strings out.

That's the whole trick. The view's remaining job is trivial: show `title`, show `subtitle`, and forward user actions like `didTapSave()` to the ViewModel as intents.

### The three roles, named

- **Model** — data and business logic, same as ever.
- **View** — the UI. In UIKit that means the view controller *plus* its views; in SwiftUI, the `View` struct. It renders the ViewModel's state and forwards actions. Thin.
- *ViewModel* — presentation state and logic. Holds no reference to any view.

## Binding: how the view stays in sync

The ViewModel changes `title` — how does the label find out? The view observes the ViewModel, and updates itself when state changes. This link is called **binding**, and how you build it is the main difference between MVVM in SwiftUI and in UIKit.

### SwiftUI: binding is built in

```swift
struct ProfileScreen: View {
    @StateObject var viewModel = ProfileViewModel()

    var body: some View {
        VStack {
            Text(viewModel.title)
            Text(viewModel.subtitle)
        }
    }
}
```

That's the entire binding. `@Published` properties announce changes, `@StateObject` listens, and SwiftUI re-renders the body. The framework's data-flow tools — `ObservableObject`, `@Published`, or the newer `@Observable` macro — *are* the binding layer; you write none of it yourself.

### UIKit: you build the binding by hand

UIKit labels don't observe anything on their own, so you wire the link — commonly with Combine:

```swift
final class ProfileViewController: UIViewController {
    let viewModel = ProfileViewModel()
    private var cancellables = Set<AnyCancellable>()

    override func viewDidLoad() {
        super.viewDidLoad()
        viewModel.$title
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in self?.titleLabel.text = $0 }
            .store(in: &cancellables)
    }
}
```

Each published property gets a subscription that pushes new values into an outlet. Closure callbacks or a delegate work too, if the team avoids Combine — the shape is the same: ViewModel changes, view reacts.

More wiring than SwiftUI, same payoff. Which brings us to the payoff.

## The payoff: testing without a view

Predict: to test that `subtitle` formats correctly, what UI do you need to spin up?

Answer: none. No view controller, no view hierarchy, no simulator rendering — the ViewModel is a plain object:

```swift
func testSubtitleFormatsRelativeTime() {
    let vm = ProfileViewModel()
    vm.load(User(name: "Ada", lastSeen: .now.addingTimeInterval(-3600)))

    XCTAssertEqual(vm.title, "Ada")
    XCTAssertTrue(vm.subtitle.contains("hour"))
}
```

Feed input, assert on output state. This is exactly the test that was impossible in MVC, where the same logic sat inside `render()` next to a `UILabel`.

That's the whole reason MVVM exists, stated as a test.

## SwiftUI fit versus UIKit fit

In SwiftUI, MVVM is nearly free: the observation tools ship with the framework, so many SwiftUI apps adopt MVVM without ceremony.

Worth knowing as a live debate: some developers argue a SwiftUI `View` struct — being a lightweight description of UI derived from state — already *is* a view model, making a separate ViewModel class redundant for simple screens. There's no settled answer; small screens often skip the class, complex ones benefit from it.

In UIKit, you pay for the binding yourself — Combine subscriptions, closures, or delegates — and you call into the ViewModel from lifecycle methods. More wiring, identical testability win.

## The failure mode: the Massive View Model

MVVM doesn't prevent bloat — it *relocates* it. Left unguarded, the ViewModel becomes the new dumping ground:

```swift
final class ProfileViewModel: ObservableObject {
    func load() { /* URLSession calls, JSON decoding... */ }        // networking
    func validateSubscription() { /* pricing rules... */ }          // business logic
    func showSettings() { /* creates and pushes a screen?! */ }     // navigation
}
```

Same disease as the Massive View Controller, one door down. The guardrails:

- Business logic belongs in the *model layer and services* — the ViewModel calls them, it doesn't contain them.
- Navigation belongs in a *coordinator or router* — a ViewModel that pushes screens is coupled to flow. Coordinators have their own lesson later.
- The ViewModel does *presentation* only: state, formatting, intents.

Two more traps round out the list. If the ViewModel imports UIKit or holds a view reference, you've silently lost the testability that justified it — the whole point evaporates. And a static, trivial screen doesn't need a ViewModel at all; ceremony without logic is just noise.

## Common pitfalls

- **Massive View Model.** Networking, business rules, and navigation piled into the ViewModel. Keep business logic in models/services, navigation in a coordinator; the ViewModel does presentation only.
- **ViewModel referencing the view.** An `import UIKit` or a stored view kills isolated testing — the entire payoff.
- **Navigation inside the ViewModel.** Couples it to one flow; delegate navigation outward instead.
- **A ViewModel for a static screen.** Overkill. No logic, no ViewModel.

## Interview lens

Lead with the reason the pattern exists, not the diagram: MVVM adds a ViewModel that owns presentation state and logic and has *no UI dependency*, so it can be unit-tested — exactly the thing Cocoa MVC couldn't offer. Then give the flow in one breath: Model in, ViewModel produces display-ready state and exposes intents, View binds to the state and forwards actions, binding keeps them in sync.

Expect "how does binding differ between SwiftUI and UIKit?" SwiftUI gives it to you — `ObservableObject` and `@Published`, or the newer `@Observable`, observed via `@StateObject`/`@ObservedObject`. UIKit makes you wire it manually with Combine sinks, closures, or delegates. Saying you'd `receive(on:)` the main queue in the Combine version is a nice touch of realism.

And volunteer the pitfall before they ask: MVVM relocates bloat rather than abolishing it, so an unguarded ViewModel becomes a Massive View Model. The defense is a one-liner — business logic to services, navigation to a coordinator, ViewModel does presentation only.
