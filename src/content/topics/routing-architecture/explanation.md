## The problem: navigation that scales past a few screens

Five screens, wired up by hand, is easy:

```swift
navigationController.pushViewController(SettingsVC(), animated: true)
```

Every screen just pushes the next one directly. That works fine — until the app needs to open a *specific* screen from a push notification, restore the exact navigation stack after the OS kills the app in the background, or let a new engineer add a destination without hunting down every `push` call scattered across the codebase.

None of that is solvable by writing more `push` calls. It needs navigation to be treated as an **architecture**: destinations modeled as data, a defined strategy for who decides where to go, and state you can actually save and reload — not a pile of one-off calls.

## Centralized vs decentralized routing

Two ends of a spectrum for *who* is allowed to decide where to navigate.

**Centralized routing**: one router or registry knows about every destination in the app and how to build it. A deep link, a notification, a button tap — everything funnels through that one place to get resolved.

```swift
final class AppRouter {
    func navigate(to route: Route) { /* one place decides everything */ }
}
```

The upside is a single source of truth — deep linking and analytics have exactly one place to hook into. The downside shows up as the app grows: that one router keeps absorbing more responsibilities until it becomes a bottleneck every feature team has to touch.

**Decentralized routing** flips it: each feature owns its own navigation, and parent coordinators simply delegate to child coordinators for anything inside that feature.

```swift
final class ProfileCoordinator {
    func start() { /* only knows about Profile's own screens */ }
}
```

Features stay independent — which is exactly what you want if the app is split into separate modules — but now a deep link or a cross-feature navigation has to find its way through several routers instead of one.

Most real apps land in between: **feature-local coordinators** handle navigation *within* a feature, plus one **thin central resolver** whose only job is mapping external entry points — deep links, push notifications — to the right feature's coordinator.

## Deep links & URL routing

A **deep link** is a URL or payload that opens a specific screen or state from *outside* the running app — a universal link, a custom URL scheme, a push notification, Spotlight, Handoff.

Predict: given `myapp://profile/42`, what should happen if the user taps it while the app is already open on a completely different screen?

Answer: it has to resolve to the same destination the app would reach by tapping through the UI manually — a `Profile` screen showing user `42` — regardless of whatever screen was on top when the link arrived.

Handling that reliably comes down to three separate steps, kept separate on purpose:

```swift
// 1. Parse: turn the raw URL into a typed value, once, in one place
func route(from url: URL) -> Route? { /* "myapp://profile/42" → .profile(id: 42) */ }
```

```swift
// 2. Resolve: turn that route into an actual navigation action —
//    which might mean building a whole stack (Tab → List → Detail)
```

```swift
// 3. Apply: push it onto navigation state, accounting for whether
//    the app was cold-launched or was already running
```

Keeping step 1 as one small, testable function — instead of string-matching scattered across view controllers — is what makes deep linking maintainable as the app grows.

## Type-safe routes

Once you have a `Route`, what should it actually be? Not a raw string:

```swift
// Stringly typed — nothing stops a typo or a missing case
func navigate(to screen: String, params: [String: Any]) { ... }
```

A typo in `"profil"` compiles fine and fails silently at runtime. Model destinations as an enum instead:

```swift
enum Route: Hashable {
    case profile(id: Int)
    case settings
    case article(slug: String)
}
```

Now the compiler enforces two things at once: every destination requires the exact data it needs (`profile` can't be reached without an `id`), and a `switch` over `Route` won't compile unless every case is handled.

SwiftUI can drive navigation directly off a typed array of routes:

```swift
@Observable final class Router { var path: [Route] = [] }

// NavigationStack(path: $router.path) {
//     RootView()
//         .navigationDestination(for: Route.self) { route in view(for: route) }
// }
```

`Route` conforms to `Hashable` specifically because that's what `NavigationStack(path:)` requires to store it. The bigger payoff is that "navigate to X" is now just a *value* — `Route.profile(id: 42)` — which means you can pass it around, log it, assert against it in a test, and, as the next section shows, save it to disk.

## Navigation state restoration

iOS can terminate a backgrounded app at any time to free memory, and users expect to reopen it back where they left off, not at the root screen.

If navigation state is already a plain, serializable value — an array of `Codable` routes — restoration stops being a special case and becomes two ordinary operations:

```swift
// As the path changes, persist it
let data = try JSONEncoder().encode(router.path)
```

```swift
// On relaunch, decode it and hand it right back to the router
router.path = try JSONDecoder().decode([Route].self, from: data)
```

SwiftUI's `NavigationStack(path:)` makes this close to automatic when `Route` is `Codable` — `@SceneStorage` can persist the path for you across launches. UIKit doesn't have that shortcut built in; it reaches for `NSUserActivity` and restoration identifiers to achieve the same result by hand.

The throughline across this whole lesson: it's the *same* type-safe, value-based `Route` serving three different jobs — in-app navigation, deep linking, and state restoration — because all three are really just "produce a `Route` value and hand it to the router."

## Common pitfalls

- **Letting the central router know every screen's internal details.** It should resolve *which* coordinator handles a route, not build every view itself — otherwise it becomes the God object the centralized approach warns about.
- **Parsing deep links inline wherever they're received.** Scatter the URL-parsing logic across notification handlers and scene delegates, and every new deep link format means hunting down every call site.
- **Treating routes as strings "just for now."** It compiles, it looks fine in a demo, and then a renamed case or a typo silently breaks a production deep link with no compiler warning.

## Interview lens

Frame navigation as its own architectural concern the moment an app grows past a handful of screens — not something that can stay ad hoc `push`/`present` calls forever. The two building blocks to name: **type-safe routes**, an enum modeling every destination so the compiler enforces correctness, and a **routing strategy** — centralized (one resolver, simple but can bottleneck) versus decentralized (per-feature coordinators, independent but harder to deep-link across) — with most real apps blending the two: feature-local coordinators plus a thin central resolver for external entry points.

The senior-level insight to land on is that **value-based, `Codable` routes unify three problems that look separate but aren't**: in-app navigation, deep linking, and state restoration. All three reduce to "produce a `Route` value and feed it to the router." Concretely, mention SwiftUI's `NavigationStack(path:)` driving off a typed, hashable, codable path — with `@SceneStorage` persisting it — and UIKit's `NSUserActivity`/restoration-identifier equivalent for the same job. The takeaway line that shows you understand the whole picture: make routes data, and navigation becomes testable, deep-linkable, and restorable almost for free.
