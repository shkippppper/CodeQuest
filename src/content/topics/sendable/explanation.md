## The problem: what's safe to pass between tasks?

Actors protect their *own* state, but the moment you pass a value **across** a concurrency boundary — into a `Task`, to an actor method, out of a task group — you need to know that value can't be mutated from two places at once. **`Sendable`** is the protocol that answers "is this type safe to hand to another concurrency domain?", and the compiler uses it to prove your program is free of data races *at compile time*.

## What `Sendable` means

A type is `Sendable` if it can be safely shared across concurrency boundaries — meaning it has no way to be mutated from two tasks simultaneously. It's a **marker protocol**: no methods, just a promise the compiler checks.

```swift
func run<T: Sendable>(_ value: T) async { }
```

When you cross a boundary (e.g. capture something in a `Task`, or pass an argument to an actor), the compiler requires the type to be `Sendable`. If it isn't, you get a warning today and an **error** under full concurrency checking (Swift 6 mode).

## Sendable value vs reference types

The rules follow from *who can share and mutate*:

- **Value types** (structs, enums) are `Sendable` **automatically** if all their stored properties are `Sendable` — copies are independent, so there's nothing to race. Most standard types (`Int`, `String`, `Array<Sendable>`) are Sendable.
- **Immutable classes** (all `let` properties, no mutable state, `final`) can be `Sendable` — nothing can change, so sharing is safe.
- **Mutable classes are NOT `Sendable`** — two tasks holding the same reference could both mutate it. You must make them safe another way (an actor, a lock) before the compiler trusts them.
- **Actors are implicitly `Sendable`** — that's the whole point; their state is isolated.

```swift
struct Point: Sendable { var x, y: Int }   // auto — value type of Sendables

final class Config: Sendable {             // ok — all immutable
    let name: String
    init(name: String) { self.name = name }
}

class Mutable { var n = 0 }                 // NOT Sendable — shared mutation
```

## `@Sendable` closures

Closures crossing concurrency boundaries must be **`@Sendable`**, which means everything they **capture** must itself be `Sendable`, and they can't capture mutable state by reference.

```swift
func schedule(_ work: @Sendable @escaping () -> Void) { }

var counter = 0
schedule {
    // counter += 1   // ❌ can't capture & mutate non-Sendable state
    print("safe")
}
```

`Task { }`'s closure is `@Sendable`, which is why the compiler complains if you capture a mutable `var` or a non-Sendable object inside it.

## Compiler-enforced data-race safety

The big idea: `Sendable` turns data-race safety into a **compile-time** property. As you enable stricter concurrency checking (minimal → targeted → complete, and by default in Swift 6 language mode), the compiler flags every value crossing a boundary that isn't provably safe. Warnings become errors. The goal is that a program that compiles under complete checking is **guaranteed free of data races** — a remarkable static guarantee.

## `@unchecked Sendable`

Sometimes you *know* a class is thread-safe (it guards its state with an internal lock), but the compiler can't prove it. **`@unchecked Sendable`** is your escape hatch: you assert safety and take responsibility.

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

`@unchecked` disables the compiler's checks for that type — so if your locking is wrong, you're back to real data races with no safety net. Use it sparingly and only around genuinely synchronized types.

## The interview lens

The core question: *"What is `Sendable` and why does it exist?"* — a marker protocol asserting a type is **safe to pass across concurrency boundaries**, which the compiler checks to make data-race safety a **compile-time** guarantee. Know the rules: value types of Sendable members are auto-Sendable; immutable `final` classes can be; **mutable classes are not**; actors are implicitly Sendable.

The senior follow-ups: **`@Sendable` closures** require all captures to be Sendable (why `Task {}` rejects capturing a mutable `var`), and **`@unchecked Sendable`** is the "trust me, I lock internally" escape hatch that turns the checks off (and the safety with them if you're wrong). Mentioning Swift 6's complete concurrency checking — where these become hard errors — shows you're current.
