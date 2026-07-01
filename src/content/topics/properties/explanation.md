## The problem: values that store, compute, or react

A property is just "a value that belongs to a type" — but Swift gives you several flavors that look identical at the call site and behave very differently. Some **store** a value, some **compute** it on every access, some **react** when it changes, and some defer their work until first use. Knowing which is which prevents subtle bugs (an observer that never fires, a `lazy` that recomputes state, a computed property doing expensive work every read).

## Stored properties

A **stored property** holds a value in the instance's memory. Structs and classes have them; enums do not.

```swift
struct User {
    var name: String       // stored, mutable
    let id: Int            // stored, constant
}
```

A `let` stored property is fixed after initialization; a `var` can change. On a **struct**, mutating any stored property requires a `var` instance (and `mutating` methods).

## Computed properties

A **computed property** has no storage — it runs code every time you read (and optionally write) it. Declare it with a `get` (and optional `set`).

```swift
struct Rectangle {
    var width: Double
    var height: Double

    var area: Double {           // read-only computed
        width * height           // single-expression get
    }

    var isSquare: Bool {
        get { width == height }
        set { if newValue { height = width } }
    }
}
```

- A read-only computed property can drop `get { }` and just return the expression.
- A settable one receives the assigned value as `newValue` (rename with `set(x)`).
- Computed properties **must be `var`** (their value can change), even when read-only.

Reach for computed when a value is *derived* from others — it can never get out of sync with its inputs.

## Property observers (`willSet` / `didSet`)

Observers run code **around a change** to a stored property. `willSet` fires just before, `didSet` just after.

```swift
class StepCounter {
    var steps: Int = 0 {
        willSet { print("about to set to \(newValue)") }
        didSet  { print("changed from \(oldValue) to \(steps)") }
    }
}
```

`willSet` gives you `newValue`; `didSet` gives you `oldValue`. Two gotchas: observers do **not** fire during the property's own initialization, and setting the property inside `didSet` does *not* re-trigger the observer (no infinite loop).

## Lazy properties

A **`lazy`** stored property isn't computed until its first access. Use it to defer expensive setup, or when the initial value depends on other properties (which aren't available during `init`).

```swift
class DataManager {
    lazy var heavyResource = ExpensiveThing()   // built on first use
}
```

Caveats: `lazy` must be `var` (it's mutated on first access from "unset" to "set"), it's computed **once** and cached, and it is **not thread-safe** — two threads racing the first access can both run the initializer.

## Type (`static` / `class`) properties

A **type property** belongs to the type itself, not an instance — one shared value. Declare it `static` (or `class` on a class, which allows subclass overriding).

```swift
struct Physics {
    static let gravity = 9.81           // shared constant
    static var simulations = 0          // shared mutable
}
Physics.gravity          // accessed on the type
Physics.simulations += 1
```

`static let` is also the idiomatic, thread-safe way to build a singleton's shared instance, because Swift guarantees a global/static `let` is initialized exactly once, lazily, on first access.

## `let` vs `var` properties

The same rule as any binding: `let` is fixed after init, `var` is mutable. But note the interaction with value vs reference types (covered in Structs vs Classes): a `let` on a **struct** instance freezes all its stored properties, whereas a `let` on a **class** reference only freezes the reference — the object's `var` properties can still change.

## The interview lens

A favourite is *"stored vs computed property — how do you decide?"* Store when the value is independent state; compute when it's **derived** from other properties (so it can't drift out of sync) — the trade-off being a computed property runs its `get` on every access, so keep it cheap or cache.

Expect a `didSet` gotcha: *"does setting a property inside its own `didSet` recurse?"* — no, and observers don't run during `init`. And a `lazy` follow-up: it's computed **once**, must be `var`, and is **not thread-safe**, which is why you don't use a plain `lazy var` for shared singletons — you use `static let`, which *is* guaranteed init-once and thread-safe.
