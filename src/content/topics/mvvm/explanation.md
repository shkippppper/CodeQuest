## The problem: presentation logic has no home

In MVC, "turn this `Date` into `"2 hours ago"`", "should the Save button be enabled?", and "map this API model into what the label shows" all end up in the view controller — mixed with UIKit, impossible to test. **MVVM (Model-View-ViewModel)** fixes this by adding one role: a **ViewModel** that holds all presentation state and logic, knows nothing about UIKit/SwiftUI, and can be unit-tested on its own.

## Model / View / ViewModel roles

- **Model** — data and business logic (unchanged from MVC).
- **View** — the UI (in UIKit: the view controller *plus* its views; in SwiftUI: the `View` struct). It's thin: it renders the ViewModel's state and forwards user actions.
- **ViewModel** — the star. It takes the Model, produces **display-ready state** (formatted strings, flags, derived values), exposes intents (`didTapSave()`), and holds no reference to any view. It's a plain, testable object.

```swift
struct User { let name: String; let lastSeen: Date }

@MainActor
final class ProfileViewModel: ObservableObject {
    @Published private(set) var title = ""
    @Published private(set) var subtitle = ""

    func load(_ user: User) {
        title = user.name
        subtitle = "Seen \(RelativeDateTimeFormatter().localizedString(for: user.lastSeen, relativeTo: .now))"
    }
}
```

The view just shows `title`/`subtitle` — all the formatting lives in the testable ViewModel.

## Binding the view

The View and ViewModel stay in sync through **binding** — when ViewModel state changes, the View updates automatically. How you bind depends on the framework:

- **SwiftUI**: `@Published` + `ObservableObject` (or the newer `@Observable`), observed with `@StateObject`/`@ObservedObject`. Changes republish and the view re-renders.
- **UIKit**: you bind manually — with Combine (`@Published` → `sink`), a closure callback, or a delegate — updating outlets when the ViewModel changes.

```swift
// UIKit binding via Combine
viewModel.$title
    .receive(on: DispatchQueue.main)
    .sink { [weak self] in self?.titleLabel.text = $0 }
    .store(in: &cancellables)
```

The binding mechanism is the main difference between MVVM in SwiftUI (automatic) and UIKit (manual).

## Testable view models

The whole payoff: because the ViewModel has **no UI dependency**, you test it like any object — feed input, assert on published output.

```swift
func testSubtitleFormatsRelativeTime() {
    let vm = ProfileViewModel()
    vm.load(User(name: "Ada", lastSeen: .now.addingTimeInterval(-3600)))
    XCTAssertEqual(vm.title, "Ada")
    XCTAssertTrue(vm.subtitle.contains("hour"))
}
```

No view hierarchy, no UIKit — just logic in, state out. That's what MVC couldn't give you.

## MVVM in SwiftUI vs UIKit

- **SwiftUI** is a natural fit: the framework's data-flow tools (`ObservableObject`/`@Observable`, `@Published`, bindings) *are* the binding layer. Many SwiftUI apps use MVVM almost for free. (Some argue SwiftUI's `View` already is a "view model", making a separate class redundant for simple screens — a real debate.)
- **UIKit** needs you to build the binding yourself (Combine/closures/delegates) and to call the ViewModel from lifecycle methods — more wiring, but the same testability win.

## Pitfalls (fat view models)

MVVM doesn't magically prevent bloat — it relocates it. Common traps:

- **Massive View Model**: the ViewModel becomes the new dumping ground (networking, navigation, business rules). Keep business logic in the **Model/services**, navigation in a **Coordinator/router**, and let the ViewModel do *presentation* only.
- **ViewModel referencing the view**: if it imports UIKit or holds a view, you've lost testability — the whole point.
- **Doing navigation in the ViewModel**: couples it to flow; prefer delegating navigation out.
- **Overkill for trivial screens**: a static screen doesn't need a ViewModel.

## The interview lens

Lead with the *reason* MVVM exists: it introduces a **ViewModel that owns presentation state/logic and has no UI dependency, so it's unit-testable** — exactly what MVC lacked. Describe the flow: Model → ViewModel (produces display-ready state + intents) → View (binds to state, forwards actions), with **binding** keeping them in sync.

Be ready for *"how does binding differ in SwiftUI vs UIKit?"* — SwiftUI gives it to you (`ObservableObject`/`@Published`/`@Observable`), UIKit needs manual wiring (Combine/closures/delegates). And name the pitfall: MVVM can create a **Massive View Model** if you pile business logic and navigation into it — keep it presentation-only, push business logic to services/models and navigation to a coordinator.
