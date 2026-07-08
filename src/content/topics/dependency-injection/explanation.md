## The problem: an object that builds its own dependencies

Here's a feed feature that looks perfectly reasonable:

```swift
final class Feed {
    private let api = RealAPIClient()      // built inside
    func refresh() async throws -> [Post] {
        try await api.load()
    }
}
```

`Feed` constructs its own `RealAPIClient`. Now write a unit test for `refresh()`.

You can't — not a real one. Every test hits the actual network, because there is no way to hand `Feed` anything else. The dependency is welded on inside `init`, invisible from outside, impossible to substitute.

The same weld blocks everything else: you can't swap the network layer, can't use a fake API in SwiftUI previews, can't reuse `Feed` in another context. One hidden line — `= RealAPIClient()` — did all that damage.

**Dependency injection** is the fix, and it is almost embarrassingly simple: pass dependencies in from outside instead of creating them inside. This lesson walks through the ways to pass them in, the tooling that grows around it, and the tempting shortcut that undoes all the benefits.

## Pass it in, and hide it behind a protocol

Step one — accept the dependency instead of building it:

```swift
final class Feed {
    private let api: RealAPIClient
    init(api: RealAPIClient) { self.api = api }   // provided from outside
}
```

Better, but `Feed` still only works with the one concrete class. Step two — depend on an abstraction:

```swift
protocol APIClient { func load() async throws -> [Post] }

final class Feed {
    private let api: APIClient                 // any conformer will do
    init(api: APIClient) { self.api = api }
}
```

Now `Feed` doesn't know or care which client it gets. That buys four things at once:

- Testability — pass a mock in tests.
- Decoupling — swap implementations without touching `Feed`.
- Flexibility — real API in production, fake one in previews, per environment.
- Explicit dependencies — the `init` signature documents exactly what `Feed` needs to work.

That last one is underrated. Reading `init(api:cache:analytics:)` tells you the type's full needs at a glance; a hidden `= RealAPIClient()` tells you nothing.

## Three ways to inject

You've just seen the first and best way. There are three, and they rank.

### Constructor injection — the default

```swift
final class Feed {
    private let api: APIClient
    init(api: APIClient) { self.api = api }
}
```

Passing dependencies through `init` is **constructor injection**. The dependency is required — you cannot create a `Feed` without one. It's immutable, stored in a `let`. And the object is fully formed from its first moment. Prefer this whenever you control construction.

### Property injection — when you don't own the init

```swift
final class ProfileVC: UIViewController {
    var analytics: Analytics!     // set after creation, by whoever loads the VC
}
```

Setting a `var` after creation is **property injection**. You need it when something else constructs the object — classically, storyboards instantiating view controllers — or when the dependency is genuinely optional.

The cost is visible in that `!`: there's a window after `init` where the dependency is missing. Forget to set it, and you crash at first use instead of failing to compile.

### Method injection — for one-off needs

```swift
func render(using formatter: Formatter) { ... }
```

Passing a dependency into the single method that uses it is **method injection**. Good when one method needs something the rest of the object never touches — no point storing it for the object's whole life.

## The payoff: tests with no network

Here is why we did all this. Because `Feed` depends on the `APIClient` protocol, a test passes a controlled double:

```swift
struct MockAPI: APIClient {
    func load() async throws -> [Post] { [.stub] }   // instant, canned answer
}

let feed = Feed(api: MockAPI())
let posts = try await feed.refresh()     // no network, same result every run
```

No global setup, no network, no flakiness. The test is deterministic — meaning it produces the same result every single run — as a direct consequence of not hard-coding the dependency.

This is the single biggest practical reason DI exists. It is also the "D" of SOLID in action: depend on abstractions, not concretions.

## When wiring gets big: DI containers

Injection has a cost that shows up at scale. *Someone* has to construct everything and pass it down:

```swift
let api = RealAPIClient()
let cache = DiskCache()
let feed = Feed(api: api, cache: cache)
let profile = Profile(api: api, analytics: analytics)
// ... × every feature in the app
```

A **DI container** is an object that automates this: you register how to build each type, then ask for instances.

```swift
container.register(APIClient.self) { RealAPIClient() }
let feed = Feed(api: container.resolve(APIClient.self))
```

Libraries like Swinject, Factory, and Needle do this — or you hand-roll a small one. The win is less wiring boilerplate and one central place to configure the graph.

The cost: indirection, and — for runtime containers — a new failure mode. Predict: what happens if you call `resolve(APIClient.self)` but nobody registered `APIClient`?

Answer: a crash, at runtime, when that line first executes. The compiler was fine with it. Errors that used to be "missing init argument, won't build" become "works until that screen opens".

## The tempting shortcut: service locator

There's a pattern that looks like DI's convenient cousin. Instead of receiving dependencies, the object reaches out and grabs them from a global registry:

```swift
final class Feed {
    private let api = ServiceLocator.shared.resolve(APIClient.self)   // pulls from a global
}
```

This is the **service locator**, and it's widely considered an anti-pattern. Compare the two `Feed`s we've written:

- With injection, `init(api:)` announces the dependency. With the locator, `init()` looks dependency-free — the real needs are hidden inside.
- The locator is global state: every test must configure `ServiceLocator.shared` before running and clean it up after, or tests contaminate each other.
- You're back to the original problem in disguise — the object decides where its dependencies come from.

The distinction to internalize: DI *pushes* dependencies in from outside; a locator makes the object *pull* them from a global. Push wins. Note the container snippet earlier resolved at the wiring site and passed the result into `init` — that's still push. It becomes a locator the moment `resolve` moves *inside* the object.

## Compile-time DI and the composition root

The runtime-crash problem has a clean solution: make the compiler check the graph.

The zero-framework version is manual constructor injection, all assembled in one place near app launch:

```swift
@main
struct AppMain {                          // the composition root
    static func makeRoot() -> RootScreen {
        let api = RealAPIClient()
        let feed = Feed(api: api)         // forget an argument → won't compile
        return RootScreen(feed: feed)
    }
}
```

That one place is called the **composition root** — the single spot where concrete types are chosen and the whole object graph is wired. Miss a dependency and the build fails; there is nothing left to fail at runtime.

Frameworks like Needle offer **compile-time DI** with less hand-wiring: they generate the graph and verify it during the build, keeping the compiler-checked guarantee. But plain manual injection at a composition root is a perfectly good default — compile-time safety with zero magic.

## Common pitfalls

- **Injecting the concrete type.** `init(api: RealAPIClient)` is injected but not swappable. Inject the protocol.
- **`resolve` calls sprinkled through the codebase.** That's a service locator wearing a container's clothes. Resolve at the composition root, push everything else in through inits.
- **Property injection by habit.** Reaching for `var dep: Thing!` when you fully control construction trades a compile error for a runtime crash. Constructor injection first.
- **Registering everything as a singleton.** Containers make shared instances easy; state you meant to be per-screen quietly becomes app-global.

## Interview lens

Define it plainly: dependency injection means a type's dependencies are provided from outside — usually as protocols — instead of constructed internally, and the payoff is testability, decoupling, and per-environment flexibility. Use the "test a type that news up its own URLSession" example; every interviewer recognizes that pain.

When asked about the kinds, rank them and say why: constructor injection is preferred because dependencies are required, immutable, and explicit; property injection is for when you don't own construction, like storyboard view controllers, or truly optional dependencies; method injection is for one-off needs. The ranking matters more than the list.

Two answers mark you as senior. First, the service locator question: it's an anti-pattern because it hides dependencies and reintroduces global state — the object pulls from a global instead of having dependencies pushed in. Second, containers versus manual wiring: runtime containers cut boilerplate but move missing-dependency errors from compile time to runtime, so manual constructor injection at a composition root — or a compile-time framework like Needle — keeps the graph compiler-verified.

If they ask how this relates to SOLID, tie it off in one line: DI is the everyday mechanism for the Dependency Inversion Principle — depend on abstractions, and let someone outside choose the concretion.
