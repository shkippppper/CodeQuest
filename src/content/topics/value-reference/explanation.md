## The problem: who else can change my data?

Run this:

```swift
struct Point { var x: Int }
var a = Point(x: 1)
var b = a
b.x = 99
```

What is `a.x` now — 1 or 99?

Answer: `1`. `b` got its own independent copy of the point, so changing `b` never touches `a`.

Now run the same shape of code with a `class` instead:

```swift
class Box { var x: Int; init(x: Int) { self.x = x } }
let c = Box(x: 1)
let d = c
d.x = 99
```

What is `c.x` now?

Answer: `99`. `d` isn't a second box — it's a second label on the *same* box. Change it through `d` and `c` sees it too.

Same-looking code, opposite behavior. The difference comes entirely from one choice: `struct` vs `class`. Getting this choice right for every type you write is one of the most consequential decisions in Swift, so it's worth understanding exactly what's happening under the hood.

## Value vs reference semantics

A **value type** is copied every time it's assigned to a new variable or passed to a function. `struct` and `enum` are value types.

```swift
struct PointS { var x: Int }
var a = PointS(x: 1)   // a owns its own Point
var b = a               // b is a brand-new, independent COPY
b.x = 99
print(a.x, b.x)         // 1 99 — a is untouched
```

A **reference type** is never copied on assignment — you get a second pointer to the same object in memory. `class` is a reference type.

```swift
class PointC { var x: Int; init(x: Int) { self.x = x } }
let a = PointC(x: 1)
let b = a               // b points at the SAME object as a
b.x = 99
print(a.x, b.x)         // 99 99 — both see it, because it's one object
```

That's the whole distinction: value types *copy*, reference types *share*. Everything else in this lesson follows from that one fact.

## Copying behavior

Copying a struct copies its stored properties, one by one. If a property is itself a value type, that gets copied too — copying goes all the way down.

```swift
struct Holder { var tag = "a" }
var h1 = Holder()
var h2 = h1
h2.tag = "b"
print(h1.tag)   // "a" — fully independent
```

But watch what happens when a struct holds a *reference* type as one of its properties:

```swift
class Box { var n = 0 }
struct Holder2 { var box = Box(); var tag = "a" }

var g1 = Holder2()
var g2 = g1
g2.tag = "b"        // independent — tag is a value type
g2.box.n = 42       // SHARED — box is a class instance
print(g1.tag, g1.box.n)  // a 42
```

`g1` and `g2` are two separate structs, but both structs' `box` property points at the *same* `Box` object. Copying a struct only copies the reference, not the object it points to — so a struct's independence is only as deep as its own value-type properties.

You might expect all this copying to be slow, especially for a huge array. It isn't, because Swift's built-in collections (`Array`, `Dictionary`, `Set`, `String`) use a trick called **copy-on-write**: assigning one to another just shares the same underlying storage buffer, and an actual copy of that buffer only happens the moment either side is mutated. Until then, both variables secretly point at the same memory — so `let b = a` for a million-element array is instant, not O(n).

## Identity vs equality

Two things can have the same contents without being the same object in memory. Swift gives you two different operators for these two different questions.

```swift
let x = PointC(x: 1)
let y = PointC(x: 1)
let z = x
```

`x == y` asks: *do these have equal contents?* You have to opt in by conforming to `Equatable` and defining what "equal" means.

`x === z` asks a different question entirely: *is this literally the same object in memory?* This is called **identity**, and it only makes sense for reference types.

```swift
print(x === y)   // false — two different Box objects, even with equal contents
print(x === z)   // true  — z is just another name for x's object
```

A value type has no identity to check — a copy *is* the value, indistinguishable from the original — so `===` simply isn't available for structs or enums.

## Mutability and `mutating`

Because assigning a struct makes a full copy, the compiler has to know exactly which of a struct's own methods are allowed to change its stored properties. Try this without the keyword:

```swift
struct Counter {
    var count = 0
    func bump() { count += 1 }   // ❌ won't compile
}
```

That fails: a plain method can't touch `self`'s stored properties. Mark it `mutating` and it can:

```swift
struct Counter {
    var count = 0
    mutating func bump() { count += 1 }   // ✅
}
```

`mutating` is really just Swift's honest way of saying "this method replaces `self` with a new value." One consequence: you can only call a `mutating` method on a variable declared with `var`, never `let`.

```swift
var c = Counter()
c.bump()          // fine — c is a var

let frozen = Counter()
// frozen.bump()  // ❌ compile error: cannot mutate a `let` value type
```

Classes skip all of this. You're always mutating an object *through* a reference, so there's no `mutating` keyword — and even a `let` reference lets you change what it points to:

```swift
let obj = PointC(x: 1)
obj.x = 5   // fine — `let` freezes the reference itself, not the object's insides
```

That last line trips people up constantly: `let` on a class instance means "you can't reassign this variable to point at a different object," not "this object is now immutable."

## When to choose which

Default to a **struct**. Reach for a **class** only when you specifically need one of the things only reference semantics gives you.

Pick a struct when:
- The type is a plain value — a coordinate, a model, a snapshot of state.
- You want every copy to be independent, with nothing shared behind your back.
- You want safety across threads by default — there's no aliasing to worry about, because nobody else has a pointer to your data.

Pick a class when:
- You need one shared instance that multiple parts of the app observe or mutate together — a network session, a cache, a view controller.
- You specifically need identity — the ability to ask "is this the *same* instance?"
- You need inheritance, a `deinit`, or interop with Objective-C APIs.

## Inheritance trade-offs

Only classes support inheritance. A subclass can override a superclass's behavior — powerful, but it also chains the subclass to the superclass's implementation details forever. Change something in the base class and every subclass might silently break; this is often called the **fragile base class** problem.

Swift's usual answer is to skip inheritance entirely and reach for **composition with protocols** instead: define behavior as a protocol, supply default implementations via an extension, and let value types conform.

```swift
protocol Flyable { func fly() -> String }
extension Flyable { func fly() -> String { "flying" } }

struct Bird: Flyable {}
struct Plane: Flyable {}
```

`Bird` and `Plane` share behavior without either one inheriting from the other, and both stay lightweight value types. You get the polymorphism inheritance was giving you, without the shared-mutable-state and tight coupling a class hierarchy brings along.

## Common pitfalls

- **Assuming a struct is deeply immutable just because it's a `let`.** A struct held in a `let` can't be reassigned, but if one of its properties is a class instance, that inner object can still be mutated through it.
- **Expecting `===` to work on structs.** It only compiles for reference types — structs have no identity to compare.
- **Forgetting `mutating`.** A struct method that changes `self`'s properties won't compile without it — the compiler is protecting the copy-semantics guarantee.

## Interview lens

If asked "what's the difference between a struct and a class?", lead with the one word that matters: **semantics**. Structs are value types — copied on assignment, fully independent, no identity, need `mutating` to change themselves. Classes are reference types — shared on assignment, compared by identity with `===`, support inheritance and `deinit`.

Then go one level deeper, because that's what separates a junior answer from a senior one: explain *why* it matters. Value types are easier to reason about and safer across threads, because there's no aliasing — nobody else can be silently holding a pointer to the thing you're changing. That's exactly why Swift's standard library — `Array`, `String`, `Dictionary` — is built almost entirely out of structs.

A favorite follow-up: "a `let` array can't be modified, but a `let` object's properties can be — why?" Because `let` freezes the *binding*, not necessarily the data. For a value type the binding is the value, so freezing the binding freezes everything. For a reference type the binding is just the pointer — the object on the other end of it is still as mutable as ever.
