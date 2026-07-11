## The problem: some things really should exist only once

Look at this call, sprinkled all over an app:

```swift
AudioSession.shared.setCategory(.playback)
```

Every screen that plays a sound needs to talk to *the same* audio session — the physical device only has one speaker, one microphone, one hardware session. If two independent `AudioSession` objects both tried to configure the hardware, they'd fight each other.

The **singleton** pattern is a way of guaranteeing, at the type level, that only one instance of a class ever exists — and that every part of the app reaches that same instance through one shared access point.

## A minimal Swift singleton

Here's the smallest version that compiles:

```swift
final class AudioSession {
    static let shared = AudioSession()
    private init() {}
}
```

Three things are doing the work here. `static let shared` is a single, lazily-created stored property that belongs to the type itself, not to any instance — every caller reads the same property, so they get the same object.

`private init()` is the lock. Because the initializer is private, no code outside this file can write `AudioSession()` to make a second one. The *only* way to get an `AudioSession` is through `.shared`.

`final` closes the last loophole: without it, a subclass could still be instantiated freely, quietly defeating the "only one" guarantee.

## Using it

```swift
AudioSession.shared.setCategory(.playback)
// ...somewhere else in the app...
AudioSession.shared.setCategory(.record)
```

Both lines touch the exact same object. There's no "which instance did I get" question, because there's only ever one.

What does this print?

```swift
let a = AudioSession.shared
let b = AudioSession.shared
print(a === b)
```

Answer: `true`. `===` checks *identity* — are these two variables pointing at the same object in memory — and since `shared` always hands back the one instance, they are.

## Why `static let` is already thread-safe

Add a print to watch initialization happen:

```swift
final class AudioSession {
    static let shared = AudioSession()
    private init() { print("AudioSession created") }
}
```

Even if ten different threads read `AudioSession.shared` at the exact same moment, `"AudioSession created"` prints **once**. Swift guarantees that a `static let` (a global or static stored property) is initialized exactly once, and it uses a lock internally to make concurrent first-access safe — this is called **thread safety**: correct behavior even when multiple threads touch the code at once. You don't write any locking code yourself; the language runtime does it for you the moment you write `static let`.

This is worth contrasting with the old Objective-C pattern you'll still see in interview questions, which manually double-checked a flag and locked a mutex to get the same guarantee. In Swift, `static let` gives you that for free — there's no reason to hand-roll it.

## Where singletons quietly cause damage

Now grow the example. Say `AudioSession` also needs to log what it does:

```swift
final class AudioSession {
    static let shared = AudioSession()
    private init() {}

    func setCategory(_ category: Category) {
        AnalyticsLogger.shared.log("category changed to \(category)")
        // ... configure hardware ...
    }
}
```

Notice what just happened: `AudioSession` reaches out and grabs `AnalyticsLogger.shared` directly, from inside its own method body. Nothing about `AudioSession`'s public interface tells you it depends on a logger — you'd only discover that by reading the implementation.

This is the core complaint about singletons: they're **global mutable state**, accessible from anywhere, with no record in any function signature of who's using them. Compare it to a class that takes its dependencies as constructor arguments — you can read the `init` and know exactly what it needs. A singleton hides that.

## Why singletons make tests hard

Picture testing `AudioSession`:

```swift
func testSetCategoryLogsChange() {
    AudioSession.shared.setCategory(.playback)
    // ...how do I check what AnalyticsLogger.shared logged?
}
```

`AnalyticsLogger.shared` is a real, live logger — maybe one that writes to disk or sends network requests. The test can't swap in a fake one, because `AudioSession`'s code is hardwired to call `AnalyticsLogger.shared`, not "whatever logger I was given."

Worse, singleton state carries over between tests. If a test earlier in the suite called `AudioSession.shared.setCategory(.record)`, and this test assumes it starts in `.playback`, the tests now depend on the order they run in — a classic source of flaky test suites.

## The testable alternative: inject the dependency

The fix doesn't require throwing away the shared instance — it requires not *hardcoding* the reference to it:

```swift
protocol Logging {
    func log(_ message: String)
}

final class AudioSession {
    private let logger: Logging
    init(logger: Logging = AnalyticsLogger.shared) {
        self.logger = logger
    }

    func setCategory(_ category: Category) {
        logger.log("category changed to \(category)")
    }
}
```

`AudioSession` now depends on the `Logging` **protocol** — a type-agnostic contract — not on the concrete `AnalyticsLogger` singleton. Production code still gets the real shared logger, because it's the default argument. But a test can now write:

```swift
final class FakeLogger: Logging {
    var messages: [String] = []
    func log(_ message: String) { messages.append(message) }
}

func testSetCategoryLogsChange() {
    let fakeLogger = FakeLogger()
    let session = AudioSession(logger: fakeLogger)
    session.setCategory(.playback)
    XCTAssertEqual(fakeLogger.messages, ["category changed to playback"])
}
```

This is **dependency injection** — passing in what an object needs rather than letting it reach out and grab a global. The object that genuinely must be unique (`AnalyticsLogger.shared`, `AudioSession` itself if hardware truly demands one instance) still exists as exactly one instance. What changed is that nothing else in the codebase is *hardcoded* to that global — everything takes it as a parameter, with the singleton only supplying the default.

## When a singleton is actually the right call

Not every shared instance is a mistake. `URLSession.shared`, `FileManager.default`, and `UserDefaults.standard` are Apple's own singletons, and they're reasonable because the resource they wrap — the network stack, the filesystem, a user-preferences store — genuinely has one instance at the OS level. The pattern fits when: the underlying resource is truly singular (hardware, an OS service), the type is stateless or its state genuinely should be shared everywhere, and you still expose it in a way that can be substituted in tests (a protocol, an injected default) rather than called directly by name throughout your code.

## Common pitfalls

- **Reaching for `.shared` out of convenience**, not necessity — most "I need this everywhere" problems are better solved by passing a dependency down through initializers.
- **Mutable state on the singleton** that different parts of the app silently depend on, making behavior depend on call order.
- **Calling the singleton by name inside a type's methods**, instead of injecting it — this is what actually makes testing hard, not the existence of a shared instance itself.

## Interview lens

If asked to implement a singleton, write `static let shared`, a `private init()`, and mark the class `final` — and say out loud that `static let` is already thread-safe in Swift, so you don't need manual locking.

If asked "what's wrong with singletons," don't just say "they're bad" — name the two concrete costs: they're global mutable state with hidden dependencies (you can't tell what a type needs by reading its signature), and they make unit tests fragile because you can't substitute a fake and state can leak between test runs.

If asked how you'd fix that, describe dependency injection: keep the singleton as the single source of truth, but have consumers depend on a protocol and accept an instance through their initializer, defaulting to `.shared` in production and a fake in tests. That answer shows you understand the pattern isn't inherently evil — it's *hardcoded, untestable access* to it that is.
