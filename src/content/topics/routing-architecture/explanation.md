## The problem: navigation that scales past a few screens

Pushing view controllers ad hoc works for five screens. But real apps need to open **any** screen from a **push notification** or a **universal link**, restore the exact navigation stack after the app is killed, and let engineers add destinations without editing a giant `switch`. That requires treating navigation as an **architecture** — routes as data, a defined routing strategy, and state you can serialize — not scattered `push`/`present` calls.

## Centralized vs decentralized routing

Two ends of a spectrum:

- **Centralized routing** — one router/registry knows every destination and how to build it. A deep link or action goes to that one place, which resolves it. Pros: one source of truth, easy deep-linking and analytics; con: the central router can become a bottleneck/God object.
- **Decentralized routing** — each feature/coordinator handles its own routes; parents delegate to children. Pros: features stay independent (fits modularization); con: cross-feature and deep-link resolution needs coordination across many routers.

Most large apps land in the middle: **feature-local coordinators** for in-feature flow plus a **thin central resolver** that maps external entry points (deep links, notifications) to the right feature.

## Deep links & URL routing

A **deep link** opens a specific screen/state from outside the app (universal link, custom scheme, notification, Handoff, Spotlight). The pattern:

1. **Parse** the incoming URL/payload into a typed route (not string-matching scattered around).
2. **Resolve** the route to a navigation action (possibly building a whole stack: Tab → List → Detail).
3. **Apply** it to the navigation state, handling the case where the app was cold-launched vs already running.

```swift
// "myapp://profile/42"  →  Route.profile(id: 42)
func route(from url: URL) -> Route? { /* parse into a typed value */ }
```

Centralizing URL→Route parsing keeps deep-link logic in one testable place.

## Type-safe routes

Model destinations as an **enum** (or typed values), not stringly-typed identifiers. The compiler then guarantees you handle every destination and pass the right data.

```swift
enum Route: Hashable {
    case profile(id: Int)
    case settings
    case article(slug: String)
}

// SwiftUI: a NavigationStack drives off a typed path
@Observable final class Router { var path: [Route] = [] }
// NavigationStack(path: $router.path) { ... }
//   .navigationDestination(for: Route.self) { route in view(for: route) }
```

`Route` being `Hashable` is what lets SwiftUI's `NavigationStack(path:)` store it. Type-safe routes make "navigate to X" a value you can pass, test, log, and — crucially — **serialize**.

## Navigation state restoration

iOS can terminate a backgrounded app; users expect to return to **where they were**. If your navigation state is a serializable value (an array of `Codable` routes), restoration is straightforward:

- **Persist** the route path (e.g. encode `[Route]` to disk / `SceneStorage`) as it changes.
- On relaunch, **decode** it and rebuild the stack by feeding it back into the router's `path`.

SwiftUI's `NavigationStack(path:)` with a `Codable` route array makes this natural (`@SceneStorage` can even persist it); UIKit uses the state-restoration APIs (`NSUserActivity`/restoration identifiers). Type-safe, value-based routes are what make both deep linking and restoration tractable — the same route type serves navigation, links, and persistence.

## The interview lens

Frame navigation as an **architecture** concern for anything beyond a few screens: model destinations as **type-safe routes** (an enum), decide a **routing strategy** (centralized single resolver vs decentralized per-feature coordinators — most apps blend them), and centralize **deep-link parsing** (URL/payload → typed Route → navigation action, handling cold vs warm launch).

The senior payoff is that **value-based, `Codable` routes unify three things**: in-app navigation, deep linking, and **state restoration** (persist the `[Route]` path, rebuild it on relaunch). Mention SwiftUI's `NavigationStack(path:)` driving off a typed, hashable/codable path (with `@SceneStorage` for persistence), and UIKit's `NSUserActivity`/restoration equivalents. The takeaway: make routes **data**, and navigation becomes testable, deep-linkable, and restorable.
