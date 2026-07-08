## One push call, three hidden problems

This line sits in thousands of view controllers, and it looks completely innocent:

```swift
final class HomeViewController: UIViewController {
    func didSelectProfile(_ id: Int) {
        let vc = ProfileViewController(userID: id)
        navigationController?.pushViewController(vc, animated: true)
    }
}
```

Look at what `HomeViewController` now knows: that `ProfileViewController` exists, how to build it, what it needs, and that it comes next in the flow. Screen A is welded to screen B.

That one weld causes three problems as an app grows:

- *Coupling* — Home only works in this exact flow. Reuse it in another context, or A/B test a different destination, and you're editing Home itself.
- *Massive View Controller* — flow logic is one more job piling into a class that already has too many.
- *Rigid flows* — onboarding order, deep links, and conditional routing end up scattered across every controller that pushes something.

The **Coordinator pattern** pulls navigation out of view controllers into dedicated flow objects. Controllers just announce "the user tapped this" — something else decides where to go.

## Turn navigation into an event

First, strip the knowledge out of the controller. It keeps the button; it loses the destination:

```swift
final class HomeViewController: UIViewController {
    var onSelectProfile: ((Int) -> Void)?

    func didSelectProfile(_ id: Int) {
        onSelectProfile?(id)      // report the event — go nowhere
    }
}
```

`HomeViewController` no longer mentions `ProfileViewController` at all. It exposes a closure and fires it. Delegate protocols work identically here — same idea, different plumbing.

Now something has to own the flow. A **Coordinator** is a plain object — not a view controller — whose job is starting screens and deciding what follows what:

```swift
protocol Coordinator: AnyObject {
    var childCoordinators: [Coordinator] { get set }
    func start()
}
```

Two requirements: a way to begin the flow, and an array whose purpose becomes clear shortly.

Here's a concrete one, wiring the home screen:

```swift
final class AppCoordinator: Coordinator {
    var childCoordinators: [Coordinator] = []
    let navigationController: UINavigationController

    init(_ nav: UINavigationController) { self.navigationController = nav }

    func start() {
        let vc = HomeViewController()
        vc.onSelectProfile = { [weak self] id in
            self?.showProfile(id)                 // the coordinator decides
        }
        navigationController.pushViewController(vc, animated: false)
    }

    func showProfile(_ id: Int) {
        let vc = ProfileViewController(userID: id)
        navigationController.pushViewController(vc, animated: true)
    }
}
```

Every `pushViewController` in the app now lives in coordinators. Home doesn't know Profile exists; it fires `onSelectProfile` and the coordinator does the rest. Change the flow — insert a paywall before profiles, route a deep link straight there — and you edit one coordinator, zero view controllers.

## Flows nest, so coordinators nest

Real apps aren't one flow. Onboarding is a flow. The main tabs are a flow. Checkout is a flow inside a tab. Give each its own coordinator, and let a parent start it:

```swift
func startOnboarding() {
    let child = OnboardingCoordinator(navigationController)
    childCoordinators.append(child)    // ← the critical line
    child.start()
}
```

There's the mysterious array from the protocol — and that `append` line is the most important line in this lesson.

### Predict: delete the append

Suppose you skip it:

```swift
func startOnboarding() {
    let child = OnboardingCoordinator(navigationController)
    child.start()                      // no append — what happens?
}
```

The first onboarding screen appears... and then? Think about what holds `child` in memory.

Answer: nothing does. A coordinator is a plain object — no superview owns it, no navigation stack retains it, no view-controller lifecycle keeps it alive. When `startOnboarding()` returns, ARC deallocates `child` on the spot. Its screens stay visible, because the navigation controller retains *those* — but every `[weak self]` closure pointing at the dead coordinator now silently does nothing. The user taps Continue and the flow is frozen.

So the rule: the parent must *retain* each child coordinator for as long as its flow runs. That's the whole reason `childCoordinators` exists.

### And clean up when the flow ends

Retention has a matching obligation. The child announces when it finishes, and the parent releases it:

```swift
func startOnboarding() {
    let child = OnboardingCoordinator(navigationController)
    child.onFinish = { [weak self, weak child] in
        self?.removeChild(child)       // release — or it leaks
        self?.showMainApp()
    }
    childCoordinators.append(child)
    child.start()
}
```

Forget the removal and every finished flow stays in the array forever — the classic coordinator *memory leak*. The lifecycle is symmetric: append on start, remove on finish. Both halves, always.

## Data flows down, events flow up

The traffic rules fall out of what you've already seen:

```swift
let vc = ProfileViewController(userID: id)      // data DOWN: init parameters
vc.onFollow = { [weak self] user in ... }       // events UP: closures/delegates
```

Downward, the coordinator passes data through initializers and parameters when it builds a screen. Upward, screens report events through closures or delegates, and coordinators report to *their* parents the same way — that `onFinish` callback is just the coordinator-level version.

The result is composition: an entire checkout flow is one `child.start()` plus one `onFinish`, and no screen anywhere knows the bigger picture.

## The same idea in SwiftUI

SwiftUI changed navigation's shape: instead of calling push, you mutate state and `NavigationStack(path:)` renders whatever the path holds. The coordinator idea survives — it becomes an object that *owns that path*:

```swift
@Observable
final class Router {
    var path = NavigationPath()

    func showProfile(_ id: Int) { path.append(Route.profile(id)) }
}
```

Views call `router.showProfile(id)` — an event, exactly like `onSelectProfile` — and never touch navigation themselves. A `NavigationStack` bound to `router.path` maps each appended route to a destination view via `.navigationDestination(for:)`.

Same principle, new expression: navigation logic lives outside the views, now as observable state instead of imperative pushes.

## Common pitfalls

- **Child coordinator not retained.** It deallocates the moment `start()` returns, and the flow dies mid-stream — screens visible, callbacks dead. Append to `childCoordinators`.
- **Finished children never removed.** The array grows forever; every completed flow leaks. Remove on `onFinish`.
- **The child reaching back into its parent.** Report upward through closures/delegates only, or you've rebuilt the coupling the pattern exists to remove.
- **Coordinators that do everything.** A coordinator owns *flow* — screens' creation and order. Business logic still belongs in models and services.

## Interview lens

When asked what the Coordinator pattern solves, give the coupling story: navigation inside view controllers welds each screen to the next, so controllers can't be reused and flow logic scatters across the app. Coordinators extract it — controllers become flow-agnostic and just report events through closures or delegates, while destinations, onboarding order, deep links, and conditional routing live in one editable place.

The follow-up senior interviewers reach for is memory management, so get there first: coordinators are plain objects with no view-controller lifecycle keeping them alive, so a parent must retain children in a `childCoordinators` array or they deallocate mid-flow — and must remove them on finish or they leak. Saying both halves, retain *and* remove, is the tell that you've shipped this.

Expect the SwiftUI question too: the modern form is a router object owning a `NavigationPath` as observable state, with views appending typed routes — same principle, navigation out of the views. And connect it across the curriculum: coordinators compose cleanly with MVVM, and VIPER's Router is essentially this pattern under another name.
