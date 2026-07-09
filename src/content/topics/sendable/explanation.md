## The problem: the race moved to the boundary

Actors protect their *own* state. But watch what happens with a plain class and a `Task`:

```swift
class Tracker {
    var count = 0
}

let tracker = Tracker()
Task {
    tracker.count += 1     // task B touches it...
}
tracker.count += 1         // ...while task A touches it too
```

The class isn't inside any actor. The moment `tracker` was captured by that `Task`, one object became reachable from two concurrent tasks — and both mutate it. That's a data race, the same disease from the actors lesson, just contracted at a different place: not inside a type, but while *passing a value across* into other concurrent work.

Every such crossing — capturing a value in a `Task`, passing an argument to an actor method, returning a result out of a task group — is a **concurrency boundary**. Swift's question at every boundary is: *is this value safe to share?* The answer is a protocol.

## What `Sendable` promises

```swift
struct Point: Sendable {
    var x: Int
    var y: Int
}
```

A type conforms to `Sendable` to declare: values of this type can be handed across a concurrency boundary without any risk of two tasks mutating the same storage at once.

Look at the conformance — there's nothing to implement. `Sendable` is a **marker protocol**: it has no methods and no properties. It's purely a promise, and the compiler's job is to *check* that the promise is true. Try to conform a type that can actually be shared-and-mutated, and the compiler refuses.

Generic code states the requirement the same way:

```swift
func run<T: Sendable>(_ value: T) async { }
```

## Which types get to be Sendable

The rules all fall out of one question: *can two tasks end up mutating the same storage?*

Start with value types:

```swift
struct Point: Sendable { var x, y: Int }   // fine — automatic, in fact
```

Structs and enums are copied on assignment. If task A and task B each get a `Point`, they hold two independent copies — there is no shared storage to race on. So value types are `Sendable` automatically, as long as every stored property is itself `Sendable`. `Int`, `String`, `Bool`, and collections of Sendable elements all qualify, which is why most everyday structs just work.

Now predict — is this struct `Sendable`?

```swift
class Tracker { var count = 0 }

struct Wrapper {
    var tracker: Tracker
}
```

Answer: no. Copying a `Wrapper` copies the *reference* inside it — both copies point at the same `Tracker` object. The struct's shell is a value, but it smuggles shared mutable state. The "all stored properties must be Sendable" rule exists exactly to catch this.

Classes are where it gets strict:

```swift
final class Config: Sendable {       // ✅ allowed
    let name: String
    init(name: String) { self.name = name }
}

class Mutable { var n = 0 }          // ❌ can never be plain Sendable
```

`Config` is safe because nothing about it can ever change: all properties are `let`, and it's `final` so no subclass can add mutable state. Sharing an immutable object is harmless — everyone only reads. A class with any `var`, though, is shared *and* mutable — the definition of race material — so the compiler won't accept a plain `Sendable` conformance for it.

And actors? They're `Sendable` implicitly. Sharing an actor reference is safe *because* the actor serializes all access to its state — that's the entire point of actors.

## `@Sendable` closures

Functions cross boundaries too. A closure that will run concurrently is marked `@Sendable`:

```swift
func schedule(_ work: @Sendable @escaping () -> Void) { }
```

A `@Sendable` closure carries the same promise as a `Sendable` type, which constrains what it may capture:

```swift
var counter = 0
schedule {
    counter += 1    // ❌ won't compile
}
```

Capturing the `var` by reference would let the closure and the caller mutate the same `counter` from different tasks. So `@Sendable` closures may not capture mutable variables by reference, and everything they do capture must itself be `Sendable`.

This explains an error message you've probably already met: the closure you pass to `Task { }` *is* `@Sendable`. That's why the compiler complains when a `Task` captures a mutable local or a non-Sendable class — it's the `Tracker` example from the top of this lesson, caught at compile time.

## The compiler as race detector

Here's the payoff of all these rules. Data races are the worst class of bug precisely because they're invisible in code review and irreproducible in testing. `Sendable` moves the whole problem to compile time: every value crossing every concurrency boundary must be *provably* safe, or the code doesn't build.

The strictness is dialed up in stages. Swift's concurrency checking has levels — *minimal*, *targeted*, and *complete* — and under older language modes, violations are warnings. In **Swift 6 language mode**, complete checking is the default and violations are hard errors.

The end state is a remarkable guarantee: a program that compiles under complete checking is free of data races. Not "probably fine" — proven, by the type system, the way type safety proves you never call a `String` method on an `Int`.

## `@unchecked Sendable`: the escape hatch

Sometimes a class really is thread-safe, but by means the compiler can't see:

```swift
final class Cache: @unchecked Sendable {
    private let lock = NSLock()
    private var storage: [String: Data] = [:]

    func value(for key: String) -> Data? {
        lock.lock(); defer { lock.unlock() }
        return storage[key]
    }
}
```

`storage` is a `var`, so a plain `Sendable` conformance is rejected — yet every access is guarded by a lock, so the type genuinely is safe. `@unchecked Sendable` tells the compiler: *trust me, I've synchronized this myself.*

Be clear about the price. `@unchecked` switches off all checking for the type. If your locking has a gap — one method that forgets the lock — you're back to real data races, and the compiler will never warn you again. It's the right tool for lock-based legacy types and careful low-level code, and the wrong tool for silencing errors you don't understand.

## Common pitfalls

- **A struct that hides a class.** Value types are only auto-Sendable if every stored property is Sendable — one class reference inside spoils it, because copies share the object.
- **Capturing a mutable `var` in `Task { }`.** The task's closure is `@Sendable`; capture the value immutably (`let copy = counter`) or restructure so the state lives in an actor.
- **Reaching for `@unchecked Sendable` to silence an error.** If you can't say precisely what synchronizes the type, the error was correct.
- **Marking a non-final class Sendable.** A subclass could add mutable state; `final` (or immutability all the way down) is part of the safety argument.

## Interview lens

If asked "what is `Sendable`?", lead with the boundary idea: it marks types that are safe to pass across concurrency boundaries — into tasks, to actors, out of groups. Then add the two words that show precision: it's a *marker protocol*, no requirements, just a compiler-checked promise.

Know the eligibility rules cold, with reasons: value types are automatically Sendable when all stored properties are (copies can't race); immutable `final` classes qualify (nothing to mutate); classes with mutable state never qualify as-is (shared + mutable = race); actors are implicitly Sendable (isolation does the protecting).

The follow-up is usually `@Sendable` closures: their captures must all be Sendable and they can't capture mutable state by reference — and `Task { }` takes one, which is why the compiler rejects capturing a mutable `var` there.

For senior credit, mention `@unchecked Sendable` as the "I synchronize internally with a lock" assertion that turns checking off — powerful, dangerous, use only around genuinely synchronized types. And place it all in context: under Swift 6's complete concurrency checking these become hard errors, making data-race freedom a compile-time guarantee.
