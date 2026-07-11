## The problem: real dependencies make tests slow and flaky

Say you have a view model that loads a profile:

```swift
class ProfileViewModel {
    let repository: UserRepository
    init(repository: UserRepository) { self.repository = repository }

    func loadName(id: String) async throws -> String {
        let user = try await repository.fetchUser(id: id)
        return user.name
    }
}
```

`UserRepository` is a protocol — some type that can fetch a user. If the only implementation you have is one that hits a real server, every test for `ProfileViewModel` now needs a network connection, a test account, and a server that's actually up. One flaky Wi-Fi connection and your whole test suite goes red for no real reason.

You don't want to test the network in this test — you want to test that `loadName` correctly pulls `name` out of whatever `UserRepository` gives it. So you hand `ProfileViewModel` a stand-in object instead of the real repository. These stand-ins are called **test doubles** — a general term for any object that plays the role of a real dependency in a test, borrowed from "stunt double".

## The five kinds of test double

Not every stand-in behaves the same way. There are five recognized shapes, and interviewers care that you can tell them apart.

Start with the plainest one. A **dummy** is passed in only to satisfy a parameter list — it's never actually called:

```swift
struct DummyLogger: Logger {
    func log(_ message: String) {
        fatalError("should never be called")
    }
}
```

If `ProfileViewModel` also took a `Logger` that this particular test doesn't care about, you'd pass a `DummyLogger` just to make the initializer compile. Its body never runs.

A **stub** goes one step further: it returns hardcoded, canned data when called.

```swift
struct StubUserRepository: UserRepository {
    func fetchUser(id: String) async throws -> User {
        User(id: id, name: "Ada Lovelace")
    }
}
```

Now `ProfileViewModel(repository: StubUserRepository())` can actually run `loadName` and get back `"Ada Lovelace"` — no network involved. A stub answers questions; it doesn't remember how it was asked.

A **spy** does remember. It wraps a real (or stub-like) behavior but also records what happened, so the test can check it afterward:

```swift
class SpyUserRepository: UserRepository {
    private(set) var fetchUserCallCount = 0
    private(set) var lastRequestedID: String?

    func fetchUser(id: String) async throws -> User {
        fetchUserCallCount += 1
        lastRequestedID = id
        return User(id: id, name: "Ada Lovelace")
    }
}
```

A test can now assert `spy.fetchUserCallCount == 1` and `spy.lastRequestedID == "42"` — it verifies *interactions*, not just return values.

A **mock** is a spy with expectations baked in ahead of time: you tell it what calls to expect before running the code, and it fails the test itself if reality doesn't match. In Swift, without a mocking framework, the line between "spy" and "mock" is mostly about *intent* — a spy is inspected after the fact, a mock is pre-programmed with an expected call and can flag a mismatch on the spot.

```swift
class MockUserRepository: UserRepository {
    var expectedID: String?
    var stubbedUser = User(id: "1", name: "Ada Lovelace")
    var didFail = false

    func fetchUser(id: String) async throws -> User {
        if id != expectedID { didFail = true }
        return stubbedUser
    }
}
```

Finally, a **fake** is a working implementation, just a simplified one unsuitable for production — an in-memory dictionary standing in for a database, for example:

```swift
class FakeUserRepository: UserRepository {
    private var storage: [String: User] = [:]

    func save(_ user: User) { storage[user.id] = user }

    func fetchUser(id: String) async throws -> User {
        guard let user = storage[id] else { throw RepositoryError.notFound }
        return user
    }
}
```

Unlike a stub, a fake has real logic: save a user, then fetch it back, and you get exactly what you saved. That makes fakes useful for tests that need multi-step behavior — "save, then update, then fetch" — without a real database.

## Hand-rolled doubles in Swift

Notice something about every example above: none of them used a mocking library. That's deliberate. Languages like Java or C# lean on **reflection** — inspecting and generating code about a type at runtime — to auto-generate mocks for any class. Swift doesn't expose that kind of runtime reflection over arbitrary types, so mocking frameworks that auto-generate doubles are rare and limited.

Instead, idiomatic Swift testing writes doubles by hand as ordinary structs or classes that conform to a protocol. That's really all `StubUserRepository` and `SpyUserRepository` are above — no macro, no code generation, just a type that implements the same interface as the real thing. This is more typing up front, but it's plain Swift: it type-checks normally, autocompletes normally, and you can step through it in the debugger like any other code.

## Protocol-based mocking: the shape that makes this work

None of this works unless the *production code* depends on a protocol rather than a concrete type. Compare:

```swift
class ProfileViewModel {
    let repository: NetworkUserRepository   // a concrete class — can't be swapped
}
```

```swift
class ProfileViewModel {
    let repository: UserRepository          // a protocol — any conformer works
}
```

The second version can be constructed with `NetworkUserRepository()` in production and `StubUserRepository()` in a test, because both conform to `UserRepository`. This pattern — depending on an abstraction and having it handed to you rather than constructing it yourself — is **dependency injection**, and test doubles are the reason it matters for testing.

Define the protocol first, narrow enough to cover what the view model actually needs:

```swift
protocol UserRepository {
    func fetchUser(id: String) async throws -> User
}
```

The real implementation talks to the network:

```swift
struct NetworkUserRepository: UserRepository {
    let session: URLSession

    func fetchUser(id: String) async throws -> User {
        let (data, _) = try await session.data(from: URL(string: "https://api.example.com/users/\(id)")!)
        return try JSONDecoder().decode(User.self, from: data)
    }
}
```

The test double conforms to the exact same protocol, so it's a drop-in substitute:

```swift
final class ProfileViewModelTests: XCTestCase {
    func test_loadName_returnsRepositoryName() async throws {
        let stub = StubUserRepository()
        let sut = ProfileViewModel(repository: stub)

        let name = try await sut.loadName(id: "42")

        XCTAssertEqual(name, "Ada Lovelace")
    }
}
```

`sut` here stands for "system under test" — the object the test is actually about. Everything else in the test, the stub included, exists to isolate `sut` from the outside world.

## Verifying interactions with a spy

Sometimes correctness isn't about the return value at all — it's about whether the code called its dependency the right way. That's what a spy is for.

```swift
final class ProfileViewModelSpyTests: XCTestCase {
    func test_loadName_fetchesRequestedID() async throws {
        let spy = SpyUserRepository()
        let sut = ProfileViewModel(repository: spy)

        _ = try await sut.loadName(id: "42")

        XCTAssertEqual(spy.fetchUserCallCount, 1)
        XCTAssertEqual(spy.lastRequestedID, "42")
    }
}
```

Predict before reading on: what would `spy.fetchUserCallCount` be if `loadName` accidentally called `fetchUser` twice — say, once to check a cache and once for real? It would be `2`, and the assertion `XCTAssertEqual(spy.fetchUserCallCount, 1)` would fail, catching a real bug (an unnecessary duplicate network call) that a stub-only test would have missed entirely, because a stub never counts anything.

This is the core reason spies exist separately from stubs: a stub can only tell you *what came back*, a spy can also tell you *what was asked for, and how many times*. Use a spy specifically when the behavior you're testing is "did we call the right thing, with the right arguments, the right number of times" rather than "did we compute the right result."

## Over-mocking: when doubles make tests worse

Test doubles solve isolation, but they're easy to overuse. Picture a test with five collaborators, and a mock for every single one:

```swift
let sut = ProfileViewModel(
    repository: MockUserRepository(),
    analytics: MockAnalytics(),
    logger: MockLogger(),
    cache: MockCache(),
    formatter: MockFormatter()
)
```

Every one of those five mocks is a fact the test now depends on. If you refactor `ProfileViewModel` to call `cache.store` in a slightly different order, this test breaks — even though the *behavior* the user cares about, "loading a name works," never changed. A test suite like this doesn't protect refactoring; it punishes it.

This failure mode is called testing **implementation details**: asserting on *how* code does something (which methods it called, in what order) instead of *what* it produces. The fix isn't "never use mocks" — it's to reserve mocks and spies for the one or two interactions that are genuinely part of the contract (like "we must call `analytics.track` exactly once"), and use plain stubs or fakes for everything the test doesn't actually care about verifying.

A useful gut check: if replacing a mock's expectations would make the test fail while the feature still works correctly for the user, that assertion is testing an implementation detail, not behavior.

## Common pitfalls

- **Reaching for a mock everywhere.** A stub is enough whenever the test only needs a return value; save mocks and spies for interactions you specifically need to verify.
- **Asserting call order that doesn't matter.** A spy that checks `calls == ["fetch", "save", "log"]` locks in an order the user never sees. Assert counts and arguments, not incidental sequencing, unless order is truly part of the contract.
- **Forgetting the fake needs its own tests.** A fake has real logic (the in-memory dictionary above), so a bug in the fake can hide a bug in production — or invent one that isn't there. Keep fakes simple enough that this risk stays small.
- **Depending on a concrete type instead of a protocol.** No protocol, no substitution point — you can't inject any double at all without one.

## Interview lens

If asked to name the five kinds of test double, give the short definitions in order of "how much they do": a dummy is never called, a stub returns canned data, a spy records what happened, a mock pre-programs expectations and can fail on mismatch, and a fake is a simplified but real working implementation. Most interviewers are happy if you nail stub vs. mock vs. fake clearly and can gesture at dummy and spy.

If asked why Swift doesn't have a dominant auto-mocking framework the way Java (Mockito) or C# (Moq) do, say it's because Swift lacks the runtime reflection those frameworks lean on, so the idiomatic approach is a protocol plus a hand-written conforming type — more boilerplate, but it's ordinary, type-checked Swift rather than generated code.

If the conversation turns to "how do you decide what to mock," that's your chance to bring up over-mocking: say you keep tests focused on observable behavior — inputs and outputs — and only add a mock or spy where verifying an interaction (like "we called analytics exactly once") is itself part of the requirement. Mention that mocking every collaborator makes tests brittle against refactors that don't change behavior, which is usually the sign a candidate has actually maintained a real test suite rather than just written one.
