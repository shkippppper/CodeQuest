## The problem: objects that build their own dependencies

When a type creates the things it depends on — `let api = URLSession.shared`, `let db = CoreDataStack()` inside its `init` — it's welded to those concrete implementations. You can't substitute a mock in tests, can't swap the network layer, and can't reuse the type elsewhere. **Dependency Injection (DI)** is the simple discipline of **passing dependencies in from outside** rather than creating them inside — the practical enabler of testability and the "D" of SOLID in action.

## Why DI

Injecting dependencies (ideally as **protocols**, not concrete types) gives you:

- **Testability** — pass a mock/stub in tests.
- **Decoupling** — depend on an abstraction, swap implementations freely.
- **Flexibility** — configure differently per environment (real API in prod, fake in previews).
- **Explicit dependencies** — a type's `init` documents exactly what it needs.

```swift
// ❌ hidden, hard-wired dependency
final class Feed {
    private let api = RealAPIClient()   // can't test, can't swap
}

// ✅ injected abstraction
protocol APIClient { func load() async throws -> [Post] }
final class Feed {
    private let api: APIClient
    init(api: APIClient) { self.api = api }   // provided from outside
}
```

## Constructor vs property vs method injection

Three ways to inject, best-first for most cases:

- **Constructor (initializer) injection** — pass dependencies in `init`. Preferred: dependencies are **required, immutable (`let`), and explicit**; the object is always fully formed.
- **Property injection** — set a `var` dependency after init. Useful when you can't control construction (e.g. storyboard-instantiated view controllers) or the dependency is genuinely optional. Downside: a window where it's `nil`.
- **Method injection** — pass a dependency into the single method that needs it. Good for a one-off dependency not needed by the whole object.

```swift
final class VC: UIViewController {
    var analytics: Analytics!         // property injection (storyboard case)
}
func render(using formatter: Formatter) { }   // method injection
```

## DI containers

As graphs grow, wiring everything by hand at the top gets verbose. A **DI container** is an object that knows how to **construct and resolve** dependencies — you register how to build each type, then ask the container for one.

```swift
container.register(APIClient.self) { RealAPIClient() }
let feed = Feed(api: container.resolve(APIClient.self))
```

Containers (Swinject, Factory, Needle, or a hand-rolled one) reduce wiring boilerplate and centralize configuration — at the cost of some indirection and, for runtime containers, errors that surface at runtime instead of compile time.

## Service locator anti-pattern

A tempting cousin is the **service locator**: instead of receiving dependencies, an object **reaches out to a global registry** to fetch them (`ServiceLocator.shared.resolve(APIClient.self)`).

```swift
final class Feed {
    private let api = ServiceLocator.shared.resolve(APIClient.self)  // ⚠️ hidden dependency
}
```

This is widely considered an **anti-pattern**: it **hides** dependencies (the `init` no longer tells you what the type needs), reintroduces global state, and makes testing harder (you must configure a global before each test). DI *pushes* dependencies in; a service locator makes the object *pull* them from a global — prefer injection.

## DI for testability

The whole payoff shows up in tests: because the real dependency is an injected protocol, tests pass a controlled double.

```swift
struct MockAPI: APIClient { func load() async throws -> [Post] { [.stub] } }
let feed = Feed(api: MockAPI())   // deterministic, no network
```

No global setup, no network, no flakiness — the direct consequence of not hard-coding the dependency.

## Compile-time DI

Runtime containers can fail at runtime if a dependency isn't registered. **Compile-time DI** (e.g. Needle, or plain manual constructor injection wired at a composition root) makes the dependency graph **checked by the compiler** — a missing dependency won't build. Even without a framework, **manual constructor injection assembled at the app's composition root** gives you compile-time safety with zero magic; it's a perfectly good default.

## The interview lens

Define it plainly: DI means **providing a type's dependencies from outside (usually as protocols) instead of constructing them internally**, which yields **testability, decoupling, and flexibility**. Rank the forms: **constructor injection is preferred** (required, immutable, explicit), property injection for when you don't own construction (storyboards) or optional deps, method injection for one-offs.

Two senior beats: the **service locator is an anti-pattern** because it *hides* dependencies and reintroduces global state — DI *pushes* deps in, a locator makes objects *pull* them from a global. And **containers vs manual/compile-time DI**: runtime containers cut boilerplate but move errors to runtime, whereas manual constructor injection at a **composition root** (or a compile-time framework) keeps the graph compiler-verified. Tie it to SOLID's Dependency Inversion (depend on abstractions).
