## The problem: view controllers that know too much about flow

When screen A does `navigationController.pushViewController(ScreenB(...))`, screen A now **knows about** screen B — how to build it, what it needs, where it sits in the flow. That coupling makes A un-reusable (it only works in this exact flow), hard to test, and it scatters navigation logic across every controller. The **Coordinator pattern** extracts navigation into dedicated objects, so view controllers just say "the user tapped this" and something else decides where to go.

## Why move navigation out of VCs

Navigation in the controller causes three problems:

- **Coupling** — a controller that pushes a specific next screen is welded to that flow; you can't reuse it elsewhere or A/B a different destination.
- **Massive View Controller** — flow logic is one more responsibility piling into the controller.
- **Hard to change flows** — onboarding order, deep links, or conditional routing are spread across many files.

A **Coordinator** owns the flow. The view controller becomes flow-agnostic: it reports events (via delegate/closure) and the coordinator decides what happens.

## The coordinator, minimally

```swift
protocol Coordinator: AnyObject {
    var childCoordinators: [Coordinator] { get set }
    func start()
}

final class AppCoordinator: Coordinator {
    var childCoordinators: [Coordinator] = []
    let navigationController: UINavigationController

    init(_ nav: UINavigationController) { self.navigationController = nav }

    func start() {
        let vc = HomeViewController()
        vc.onSelectProfile = { [weak self] id in self?.showProfile(id) }  // event, not navigation
        navigationController.pushViewController(vc, animated: false)
    }

    func showProfile(_ id: Int) {
        let vc = ProfileViewController(userID: id)
        navigationController.pushViewController(vc, animated: true)
    }
}
```

`HomeViewController` doesn't know `ProfileViewController` exists — it just exposes `onSelectProfile`. The coordinator wires the flow.

## Coordinator hierarchy & child coordinators

Large apps have **nested flows** — an onboarding flow, a main-tab flow, a checkout flow. Each gets its own coordinator, and a parent coordinator owns its children:

```swift
func startOnboarding() {
    let child = OnboardingCoordinator(navigationController)
    child.onFinish = { [weak self, weak child] in
        self?.removeChild(child)     // clean up when the flow ends
        self?.showMainApp()
    }
    childCoordinators.append(child)  // retain the child while it runs
    child.start()
}
```

The **`childCoordinators` array is critical**: coordinators are plain objects with no view-controller lifecycle to keep them alive, so the parent must **retain** each child (and remove it when its flow finishes) or the child deallocates mid-flow. Forgetting to remove finished children is the classic coordinator **memory leak**.

## Passing data & callbacks

Data flows **down** via initializers/parameters when the coordinator builds a screen, and **up** via closures/delegates when a screen reports an event. Coordinators talk to each other through `onFinish`-style callbacks, so flows compose without any screen knowing the bigger picture.

## Coordinators in SwiftUI

SwiftUI navigation is **state-driven** (`NavigationStack(path:)`), which changes the shape but not the idea. The modern approach is a **`Router`/coordinator that owns a navigation path** as observable state:

```swift
@Observable final class Router {
    var path = NavigationPath()
    func showProfile(_ id: Int) { path.append(Route.profile(id)) }
}
// A NavigationStack bound to router.path with .navigationDestination(for:)
```

Views append typed routes to the router's `path`; the `NavigationStack` renders them. It's the same principle — navigation lives outside the view — expressed through SwiftUI's declarative, value-based navigation.

## The interview lens

The core: *"What does the Coordinator pattern solve?"* — it **removes navigation/flow logic from view controllers**, so controllers become **flow-agnostic and reusable** (they report events; the coordinator decides destinations), and flow logic lives in one place that's easy to change (onboarding order, deep links, conditional routing).

Two things senior interviewers probe: **child-coordinator memory management** — the parent must **retain children in an array and remove them when their flow finishes**, or you leak/deallocate mid-flow; and how it maps to **SwiftUI** — a `Router`/coordinator owning a `NavigationPath` as observable state, keeping navigation out of the views. Note it composes well with MVVM/VIPER (VIPER's Router is essentially this).
