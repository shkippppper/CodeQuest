## The problem: who else can change my data?

You pass a piece of data to a function, the function tweaks it, and now — surprise — your original copy changed too. Or it *didn't*, and you can't figure out why. This "spooky action at a distance" is one of the most common sources of bugs, and Swift's answer is to make you decide, up front, whether a type has **value semantics** or **reference semantics**.

`struct` (and `enum`) are **value types**. `class` is a **reference type**. Picking the right one is one of the first design decisions you make for every type you write.

## Value vs reference semantics

A **value type** is copied whenever you assign it to a new variable or pass it to a function. Each copy is completely independent.

```swift
struct PointS { var x: Int }
var a = PointS(x: 1)
var b = a        // b is a COPY
b.x = 99
print(a.x, b.x)  // 1 99  — a is untouched
```

A **reference type** is not copied. Assigning or passing it hands over a *reference* to the same underlying object. Change it through one reference and every reference sees the change.

```swift
class PointC { var x: Int; init(x: Int) { self.x = x } }
let a = PointC(x: 1)
let b = a        // b points at the SAME object
b.x = 99
print(a.x, b.x)  // 99 99  — both see it
```

This single difference — *copy* vs *share* — is what "value vs reference" means in practice.

## Copying behavior

Copying a value type is a shallow copy of its stored properties. If a struct contains other value types, those are copied too. If a struct contains a *reference* type, only the reference is copied — both structs then point at the same object.

```swift
class Box { var n = 0 }
struct Holder { var box = Box(); var tag = "a" }

var h1 = Holder()
var h2 = h1
h2.tag = "b"      // independent — value type
h2.box.n = 42     // SHARED — box is a class
print(h1.tag, h1.box.n) // a 42
```

Swift makes this cheap with **copy-on-write** for its standard library collections (`Array`, `Dictionary`, `Set`, `String`): the buffer is shared until you mutate, so copies are O(1) until the first write.

## Identity vs equality

Two things can be *equal* (same contents) without being *identical* (the same object in memory).

- `==` asks about **equality** (you provide it via `Equatable`).
- `===` asks about **identity** — are these two references the same object? It only applies to reference types.

```swift
let x = PointC(x: 1)
let y = PointC(x: 1)
let z = x
print(x === y)  // false — different objects
print(x === z)  // true  — same object
```

Value types have no meaningful identity — a copy *is* the value — so `===` isn't available for them.

## Mutability and `mutating`

Because a value type's methods could change the value itself, a method that modifies stored properties must be marked `mutating`. And you can only call a mutating method on a `var`, never a `let`.

```swift
struct Counter {
    private(set) var count = 0
    mutating func bump() { count += 1 }
}

var c = Counter()
c.bump()          // ok
let frozen = Counter()
// frozen.bump()  // ❌ compile error: cannot mutate a `let` value type
```

Classes don't need `mutating`: you're changing the object *through* a reference, and even a `let` reference can have its properties mutated (the constant is the reference, not the contents).

```swift
let obj = PointC(x: 1)
obj.x = 5   // fine — `let` freezes the reference, not the object
```

## When to choose which

Reach for a **struct** by default. Prefer a **class** only when you specifically need reference semantics.

Choose a **struct / value type** when:
- The data is a simple value (a coordinate, a model, a piece of state).
- You want independent copies and no shared mutable state.
- You want thread-safety-by-default and easy reasoning (no aliasing).

Choose a **class / reference type** when:
- You need a single shared instance that many places observe or mutate (e.g. a controller, a cache, a network session).
- You need identity — "is this the *same* object?"
- You need inheritance, deinitializers (`deinit`), or Objective-C interop.

## Inheritance trade-offs

Only classes support inheritance. That's powerful but couples subclasses to their superclass's implementation and enables the fragile-base-class problem. Swift's protocol-oriented style often replaces inheritance with **composition + protocols**: define behavior in protocols, give default implementations in extensions, and let value types conform. You get polymorphism without the shared-mutable-state and coupling costs of a class hierarchy.

## The interview lens

The classic question is *"What's the difference between a struct and a class?"* Lead with the one word that matters — **semantics**: structs are value types (copied, independent, no identity, `mutating` to change), classes are reference types (shared, identity via `===`, inheritance, `deinit`). Then show you understand the *consequences*: value types are easier to reason about and safer across threads because there's no aliasing, which is why Swift's standard library is built almost entirely from structs.

A favourite follow-up: *"A `let` array can't be modified, but a `let` object's properties can — why?"* Because `let` freezes the binding. For a value type the binding *is* the value, so it's frozen; for a reference type the binding is the pointer, and the object it points to is still mutable.
