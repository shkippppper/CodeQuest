## The problem: testing a protocol means writing a whole class

Start with an ordinary dependency-injection setup. A view model needs to fetch a user, so it depends on a protocol:

```swift
protocol APIClient {
    func fetchUser(id: String) async throws -> User
}

class ProfileViewModel {
    let client: APIClient
    init(client: APIClient) { self.client = client }
}
```

To test `ProfileViewModel` without hitting the network, you write a second conforming type:

```swift
class MockAPIClient: APIClient {
    var result: Result<User, Error> = .success(User(id: "1", name: "Ada"))
    func fetchUser(id: String) async throws -> User {
        try result.get()
    }
}
```

This works. But watch what happens the moment a second test needs *different* behavior from a third test — say, one test wants a slow response and another wants a specific error thrown only on the second call. You either keep adding configurable properties to `MockAPIClient` (`var delay: Double?`, `var failOnSecondCall = false`, ...) or you write more mock subclasses. The class itself becomes a small, growing pile of test-only knobs that exists purely to satisfy one protocol requirement.

## Predict first: what is the mock actually made of?

Before reading on, look at a more realistic `MockAPIClient` that already anticipates needing different behavior per test:

```swift
class MockAPIClient: APIClient {
    var fetchUserHandler: (String) async throws -> User = { _ in
        User(id: "1", name: "Ada")
    }
    func fetchUser(id: String) async throws -> User {
        try await fetchUserHandler(id)
    }
}
```

Predict: what is `fetchUserHandler`, structurally? Answer: it's a stored closure with the exact signature of the protocol requirement — and `fetchUser(id:)` itself does nothing but forward to it. The class, the protocol conformance, the method body — none of it is doing real work anymore. All the actual behavior lives in one closure property. That's the seed of this lesson: if the class is just a wrapper around a closure, what happens if you delete the class and keep the closure?

## Protocol witnesses as values

When a type conforms to a protocol, the Swift compiler builds a hidden table behind the scenes connecting each protocol requirement to that type's specific implementation of it. That table is called a **witness table**, and each individual implementation in it is a *witness* — proof that this type satisfies that requirement.

You never see this table normally; the compiler generates and uses it for you. But nothing stops you from building the same table yourself, by hand, as a plain struct whose fields are functions:

```swift
struct APIClient {
    var fetchUser: (String) async throws -> User
}
```

This struct *is* a witness table made visible: one field per requirement, each field holding the concrete implementation, exactly like the hidden compiler-generated version — except now it's an ordinary value you can construct, copy, and pass around like any other struct.

## Building it up: multiple requirements, a real implementation

Add a second requirement the same way:

```swift
struct APIClient {
    var fetchUser: (String) async throws -> User
    var updateUser: (User) async throws -> Void
}
```

A real, network-backed instance is just a value with both closures filled in, built once and reused:

```swift
extension APIClient {
    static let live = APIClient(
        fetchUser: { id in
            let (data, _) = try await URLSession.shared.data(from: URL(string: "https://api.example.com/users/\(id)")!)
            return try JSONDecoder().decode(User.self, from: data)
        },
        updateUser: { user in
            // PUT request omitted for brevity
        }
    )
}
```

Compare this to the protocol version: there's no class, no `URLSessionAPIClient: APIClient` declaration, no `func` bodies satisfying requirements. `.live` is just a value — one instance of `APIClient` with real closures inside it.

## Dependency injection via structs of closures

`ProfileViewModel` now depends on the struct instead of the protocol:

```swift
class ProfileViewModel {
    let client: APIClient
    init(client: APIClient = .live) { self.client = client }
}
```

Testing no longer needs a second type at all:

```swift
extension APIClient {
    static let mock = APIClient(
        fetchUser: { _ in User(id: "1", name: "Ada") },
        updateUser: { _ in }
    )
}

let vm = ProfileViewModel(client: .mock)
```

And the per-test customization that used to require new mock subclasses is now just replacing one field on a copy:

```swift
var flakyClient = APIClient.mock
flakyClient.fetchUser = { _ in throw URLError(.timedOut) }

let vm2 = ProfileViewModel(client: flakyClient)
```

Because `APIClient` is a struct, `flakyClient` is an independent copy — overriding `fetchUser` on it doesn't touch `.mock` or any other test's client. Each test builds exactly the behavior it needs, one closure at a time, with zero new types.

## Testability: why this scales better than mock classes

The protocol-plus-mock-class approach forces every distinct test scenario into either a new subclass or a growing pile of configuration properties on one shared mock. The struct-of-closures approach sidesteps both: every test can start from `.mock` and override only the one or two closures it cares about, inline, right next to the assertion that uses them. There's no mock class file to maintain, and no risk of one test's configuration leaking into another through shared mutable mock state — each `APIClient` value is independent.

It also composes cleanly: a struct can hold another struct's closures inside its own factory. A `.recording` variant that wraps `.live` and logs every call is just a struct that calls through to another struct's closures — no subclassing, no `override` keyword, no `super.fetchUser(id:)`.

## Trade-offs vs protocols

This isn't a strictly better replacement for protocols — it's a different tool with real costs.

**What you gain:** when a protocol value is used as a type on its own (`let client: APIClient` where `APIClient` is a protocol, or explicitly `any APIClient`), Swift calls this an **existential type** — a box that can hold *any* conforming type, with the concrete type erased and each call routed through the witness table at runtime. A struct of closures has no such box: the concrete type is known at compile time, and calls go straight to the stored closure, which the compiler can often inline. For hot paths, that indirection difference is measurable.

Structs of closures also sidestep a real Swift limitation: a protocol with an `associatedtype` requirement generally can't be used as `any Protocol` at all without extra ceremony (generics or a type-erasing wrapper box). A struct of closures never has this problem — it's just a concrete type, so there's no existential to construct in the first place.

**What you give up:** protocol extensions let you write a default implementation once and get it on every conforming type for free; a struct of closures has no such mechanism; every instance must supply every closure explicitly (though a static factory function can approximate a "default"). You also lose dynamic type checks like `is SomeProtocol` and Xcode's "jump to protocol conformances," since there's no protocol relationship for tooling to trace — just a value that happens to have the right shape. And for a dependency with a single production implementation and no real testing variance, a struct of closures is often more ceremony for the same result a protocol would have given you for free.

## Common pitfalls

- **Forgetting the memberwise initializer wants every closure.** Unlike a protocol (where one conforming type just implements the requirements), a struct's default initializer requires a value for every field — provide static factory functions like `.live` and `.mock` so call sites don't have to fill in every closure by hand.
- **Retain cycles inside `.live` closures.** A closure that captures `self` strongly inside a long-lived struct property leaks the same way any strong closure capture does — use `[weak self]` where the closure outlives the call site.
- **Reaching for this pattern on a dependency with one implementation and no tests that need variance.** The value of a struct of closures is testability and composability; on something with a single, stable implementation it's often just extra indirection.

## Interview lens

If asked what a protocol witness is, give the plain-words version first: it's the hidden table the compiler builds connecting a protocol's requirements to one type's concrete implementations of them — and this pattern's whole idea is making that table an explicit, constructible value (a struct of closures) instead of leaving it hidden and compiler-generated.

If asked why you'd choose this over a protocol, lead with testability: overriding one closure on a copied struct for a single test is simpler than writing or configuring a mock class, and it composes without subclassing. If pushed further, bring up the existential-type cost (dynamic dispatch through a type-erased box) and the associated-type limitation as the technical reasons this pattern exists at all, not just a style preference.

If asked for the honest trade-off, say it plainly: you lose protocol extensions' free default implementations and lose type-relationship tooling, so this is best reserved for exactly the dependencies you need to swap in tests or configure per environment — not a wholesale replacement for protocols everywhere.
