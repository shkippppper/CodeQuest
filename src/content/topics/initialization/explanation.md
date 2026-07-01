## The problem: guaranteeing a valid object

Initialization is Swift's contract that **an instance is fully valid the instant it exists** — every stored property has a value, no exceptions, no half-built objects. That guarantee is stronger than in many languages (there's no reading an uninitialized field), and it's why Swift's init rules — designated vs convenience, two-phase init, failable — exist. Interviewers use inits to probe whether you actually understand class initialization order.

## Designated & convenience initializers

A **designated initializer** fully initializes the type: it sets every stored property and calls its superclass's designated init. A **convenience initializer** is a secondary init that must call another init in the same class (ultimately funneling to a designated one).

```swift
class Vehicle {
    var wheels: Int
    var name: String

    init(wheels: Int, name: String) {   // designated
        self.wheels = wheels
        self.name = name
    }

    convenience init(name: String) {    // convenience
        self.init(wheels: 4, name: name)  // must delegate across
    }
}
```

The rules in one breath: **designated inits delegate *up*** (call `super.init`), **convenience inits delegate *across*** (call `self.init`), and every init chain ends at a designated initializer.

## Memberwise initializers

**Structs** get a free **memberwise initializer** synthesized from their stored properties — no boilerplate.

```swift
struct Point { var x: Int; var y: Int }
let p = Point(x: 1, y: 2)   // memberwise init, auto-provided
```

Two things to know: classes get **no** memberwise init (you write your own), and if you add your own init to a struct in its main declaration you *lose* the synthesized one — unless you define your custom inits in an `extension`, which keeps the memberwise init too.

## Failable initializers

An `init?` can **return `nil`** when construction should fail (bad input, invalid raw value). The caller gets an optional.

```swift
struct Age {
    let value: Int
    init?(_ n: Int) {
        guard n >= 0 else { return nil }   // fail
        value = n
    }
}
let ok = Age(30)    // Age?  -> some
let bad = Age(-5)   // nil
```

You've already met one: `enum` `init?(rawValue:)` is failable. There's also `init!` (implicitly-unwrapped failure), used rarely.

## Required initializers

`required` forces every subclass to implement (or inherit) that initializer. It's how a superclass guarantees all descendants can be built a certain way — notably `init(coder:)` for `NSCoding`.

```swift
class Base {
    required init() { }
}
class Sub: Base {
    required init() { super.init() }   // must provide it
}
```

## Two-phase initialization

This is *the* class-init interview topic. Swift initializes a class in **two phases**:

1. **Phase 1** — walk *up* the chain setting stored properties: each class sets its own properties, then calls `super.init`, until the root is reached and every stored property has an initial value. Until phase 1 completes, **you cannot call methods, read properties, or use `self`** in ways that assume a finished object.
2. **Phase 2** — walk *back down*, letting each initializer further customize (now `self` is fully usable, methods can be called, properties overridden).

```swift
class A { var a: Int; init() { a = 1 } }
class B: A {
    var b: Int
    override init() {
        b = 2          // phase 1: set my own property FIRST
        super.init()   // then hand off up the chain
        a = 10         // phase 2: now safe to touch inherited state
    }
}
```

The rule that falls out: **set your own stored properties before calling `super.init`**, and only use `self`/inherited members *after* it. This ordering is what prevents ever observing a partially-initialized object.

## Deinitialization (`deinit`)

Only **classes** have a `deinit`, called automatically just before an instance is deallocated by ARC. Use it to release resources (observers, timers, file handles).

```swift
class FileHandleWrapper {
    deinit { print("closing file") }
}
```

You never call `deinit` yourself, structs/enums don't have one (they're value types with no shared lifetime), and if a `deinit` never fires when you expect it to, suspect a **retain cycle** keeping the object alive.

## The interview lens

The classic is *"explain two-phase initialization."* Phase 1 sets all stored properties bottom-up to `super`; phase 2 customizes top-down. The practical rule: **initialize your own properties before `super.init()`, use `self` only after** — this is what makes a partially-built object unobservable and is a common source of "self used before super.init" compile errors.

Follow-ups worth knowing: designated (delegate up) vs convenience (delegate across); structs get a **free memberwise init** but lose it if you add a custom init in the main declaration (put custom inits in an `extension` to keep both); `init?` returns `nil` on failure; and `deinit` exists only on classes and firing-or-not is a retain-cycle signal.
