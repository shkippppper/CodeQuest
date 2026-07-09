## The problem: no half-built objects, ever

Predict: does this compile?

```swift
class User {
    var name: String
}
```

Answer: no — "class 'User' has no initializers." Swift refuses because `name` has no value, and Swift's rule is absolute: *an instance is fully valid the instant it exists*. Every stored property must have a value before anyone can touch the object. There is no reading an uninitialized field, no half-built object, period.

That one guarantee explains every rule in this lesson. Initializers exist to prove to the compiler that all properties get set; the fancy machinery — designated vs convenience, two-phase init, failable inits — is just that proof extended to inheritance and to construction that can fail.

The fix for `User`, by the way, is any of: a default value (`var name = ""`), an optional (`var name: String?`, which defaults to `nil`), or an initializer that sets it.

## Structs come with a free initializer

Write a struct and get an init without asking:

```swift
struct Point {
    var x: Int
    var y: Int
}

let p = Point(x: 1, y: 2)   // where did this init come from?
```

Nobody wrote `init(x:y:)` — Swift synthesized it from the stored properties. It's called the **memberwise initializer**: one labeled parameter per stored property, in declaration order. Classes never get this; for a class you write the init yourself.

Now the trap. Add your own initializer to the struct:

```swift
struct Point {
    var x: Int
    var y: Int

    init(both: Int) {
        x = both
        y = both
    }
}

let p = Point(x: 1, y: 2)   // compile error — memberwise init is GONE
```

Writing any init in the struct's main declaration makes Swift withdraw the free one — it assumes you're taking manual control. The escape hatch: define your custom inits in an `extension` instead:

```swift
struct Point {
    var x: Int
    var y: Int
}

extension Point {
    init(both: Int) {
        self.init(x: both, y: both)
    }
}

Point(x: 1, y: 2)   // memberwise init survives
Point(both: 5)      // and the custom one works too
```

Extensions get their own lesson; for now, know this placement trick keeps both initializers.

## Failable initializers: construction that can say no

Some values have rules. An age can't be negative:

```swift
struct Age {
    let value: Int

    init?(_ n: Int) {
        guard n >= 0 else { return nil }
        value = n
    }
}
```

The question mark in `init?` makes this a **failable initializer** — one that's allowed to give up and return `nil` instead of an instance. Look at what callers receive:

```swift
let ok  = Age(30)   // Optional(Age) — it's an Age?
let bad = Age(-5)   // nil
```

The result is optional, so the compiler forces every caller to confront the failure case — no invalid `Age` can ever exist. You've already met a failable init without the name: an enum's `init?(rawValue:)` returns `nil` when the raw value matches no case.

There's also `init!`, which fails by producing an implicitly-unwrapped optional — one that crashes if the failure is touched. It exists mostly for legacy interoperability; you'll rarely write one.

## Class inits: designated and convenience

Classes complicate initialization because of inheritance. Swift splits class initializers into two ranks:

```swift
class Vehicle {
    var wheels: Int
    var name: String

    init(wheels: Int, name: String) {        // designated
        self.wheels = wheels
        self.name = name
    }

    convenience init(name: String) {          // convenience
        self.init(wheels: 4, name: name)
    }
}
```

The first is a **designated initializer** — the real one. It takes full responsibility: sets every stored property of this class, and (in a subclass) calls up to the superclass's designated init.

The second is a **convenience initializer** — a shortcut. Marked with the `convenience` keyword, it's not allowed to set up the object on its own; it must call another initializer of the *same* class via `self.init`, filling in defaults along the way. Here it hands "4 wheels" to the designated init.

The whole system compresses into one rule: designated inits delegate *up* (to `super.init`), convenience inits delegate *across* (to `self.init`), and every chain of calls eventually lands on a designated initializer. That funnel is how the compiler proves that no matter which init a caller picks, every property gets set exactly once.

## Two-phase initialization

Now the deep one — the class-init question interviews actually ask. Watch a subclass initializer and note the order of its three lines:

```swift
class A {
    var a: Int
    init() { a = 1 }
}

class B: A {
    var b: Int

    override init() {
        b = 2           // 1. my own property FIRST
        super.init()    // 2. then hand up the chain
        a = 10          // 3. only now touch inherited state
    }
}
```

Try reordering: move `a = 10` above `super.init()` and the compiler rejects it. Move `super.init()` above `b = 2` — rejected again. The order is enforced. Why?

Swift builds a class instance in two sweeps, called **two-phase initialization**:

Phase 1 goes *up* the chain. `B` sets its own stored properties, then calls `super.init()`; `A` sets its properties, and so on to the root. When phase 1 ends, every stored property in the whole object has a value. Until then the object is under construction — so during phase 1 you may not call methods, read other properties, or use `self` in any way that treats the object as finished.

Phase 2 comes back *down*. Each initializer, from the root back toward `B`, gets a chance to customize further — and now `self` is fully usable: call methods, modify inherited properties like `a = 10`, whatever you need.

Read the three lines of `B.init` again with that lens: line 1 is B's phase-1 duty, line 2 triggers the rest of phase 1 up the chain, line 3 is B's phase-2 customization. The compiler errors you hit earlier — "property not initialized at super.init call", "'self' used before super.init" — are the two phases being enforced.

The point of all this ceremony: at no moment, in any initializer, can code observe a partially-initialized object. The guarantee from the top of the lesson survives inheritance.

## Required initializers

Sometimes a superclass needs a promise from every future subclass: "you can always be built *this* way."

```swift
class Base {
    required init() { }
}

class Sub: Base {
    var extra: Int

    required init() {          // must be provided (and marked required again)
        extra = 0
        super.init()
    }
}
```

Marking an init `required` forces every subclass to implement it — or inherit it, if the subclass adds no stored properties needing setup. Note the subclass writes `required` again, not `override`; the obligation itself is passed down the chain.

Where you'll actually meet this: `init(coder:)` in UIKit. The framework needs to construct *any* view subclass when loading an interface file, so the ability to build from a coder is `required` on every descendant.

## deinit: the other end of the lifetime

Initializers begin a life; `deinit` ends one:

```swift
class FileHandleWrapper {
    deinit { print("closing file") }
}
```

A `deinit` runs automatically just before ARC deallocates the instance — the moment its last strong reference disappears, as covered in the ARC lesson. You never call it yourself, and it takes no parameters. Use it to release things the object was holding: file handles, timers, observers.

Only classes have `deinit`. Structs and enums are value types — copied around, not shared — so there's no single "the instance" whose death you could observe.

And the debugging tell from the ARC lesson applies here: if a `deinit` you expect never fires, the object is still strongly referenced — almost always a retain cycle.

## Common pitfalls

- **Losing the memberwise init.** Adding a custom init in a struct's main declaration removes the free `init(x:y:)`. Put custom inits in an `extension` to keep both.
- **Touching `self` before `super.init()`.** Phase 1 isn't done — the compiler blocks method calls and inherited-property access until the super call returns.
- **Calling `super.init()` before setting your own properties.** Also blocked: your properties are your phase-1 responsibility, and they must be set first.
- **Force-unwrapping failable inits.** `Age(userInput)!` crashes on the exact bad input the `init?` was written to catch.
- **Writing `override` on a required init.** Subclasses re-state `required` instead; the keyword carries the obligation downward.
- **Waiting for `deinit` on a struct.** Value types don't have one — only classes participate in ARC lifetimes.

## Interview lens

The classic is "explain two-phase initialization." Give it as a story: phase 1 walks up the chain with each class setting its own stored properties, ending with every property in the object initialized; phase 2 walks back down letting each init customize with a fully usable `self`. Then state the practical rule — set your own properties before `super.init()`, touch `self` and inherited state only after — and point out that this is precisely what makes a partially-built object impossible to observe. Mentioning that the common "self used before super.init" compile error *is* this rule shows you've hit it in real code.

For designated versus convenience, the one-breath answer: designated inits delegate up, convenience inits delegate across, and every chain terminates at a designated init — the funnel that guarantees each property is set exactly once.

Two struct facts to have ready: the memberwise init is free, and it vanishes if you add a custom init to the main declaration — recoverable by declaring custom inits in an extension. For failable inits, say `init?` returns an optional so invalid instances can't exist and callers must handle failure; cite `init?(rawValue:)` as the everyday example.

If `deinit` comes up, keep it tight: classes only, called automatically by ARC before deallocation, never called manually — and a `deinit` that never fires is your retain-cycle alarm.
