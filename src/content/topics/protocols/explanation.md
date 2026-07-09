## The problem: one superclass is not enough

Start with the classic way to share behavior — a class hierarchy:

```swift
class Animal {
    func speak() { print("...") }
}

class Dog: Animal {
    override func speak() { print("Woof") }
}
```

`Dog` inherits `speak` from `Animal` and can replace it with its own version. This works — but only inside strict limits.

Watch the limits appear the moment you step outside them:

```swift
struct Robot: Animal {   // ❌ error: structs cannot inherit from a class
    // ...
}
```

Structs and enums cannot subclass anything. Inheritance is a classes-only feature.

There's a second limit even for classes:

```swift
class Dog: Animal, Pet { ... }   // ❌ only ONE superclass allowed
```

A class gets exactly one superclass. If `Dog` already inherits from `Animal`, it can't also inherit behavior from some other base class. And deep hierarchies grow brittle — change something in the base class and every subclass below it feels the shake.

Swift's answer is the **protocol**: a contract that *any* type can sign — struct, enum, class, or actor. Protocols, plus the ability to attach default behavior to them, are why the Swift standard library is built as a web of small contracts instead of a deep class tree. This overall approach has a name — protocol-oriented programming, or POP — and it's what this lesson builds up to.

## Writing the contract

Here is a protocol:

```swift
protocol Drawable {
    var area: Double { get }   // property requirement
    func draw()                // method requirement
}
```

Read it as a list of demands. Any type calling itself `Drawable` *must* have a readable `area` property and a `draw()` method. Notice what's missing: there is no code inside. The protocol says *what* a conformer must provide, never *how*.

Look closer at the property line. The `{ get }` marks it as read-only from the protocol's point of view:

```swift
var area: Double { get }        // conformer must let you READ area
var title: String { get set }   // conformer must let you read AND write title
```

A `{ get }` requirement is generous about how you satisfy it: a `let` constant works, a `var` works, a computed property works. A `{ get set }` requirement is stricter — a `let` or a read-only computed property won't do, because the protocol promised callers they can write to it.

Protocols can demand more than properties and methods. They can also require initializers, and they can require placeholder types called associated types — a senior-level feature with its own lesson later.

## Signing the contract: conformance

A type **conforms** to a protocol by naming it after a colon and then fulfilling every requirement:

```swift
struct Circle: Drawable {
    let radius: Double
    var area: Double { .pi * radius * radius }   // requirement #1 ✓
    func draw() { print("drawing a circle") }    // requirement #2 ✓
}
```

If `Circle` skipped `draw()`, the file would not compile. The compiler checks the whole contract — conformance is verified, not promised.

Now the payoff over inheritance. Conform a completely different kind of type:

```swift
enum Shape: Drawable {
    case square(side: Double)
    var area: Double {
        switch self { case .square(let s): return s * s }
    }
    func draw() { print("drawing a shape") }
}
```

A struct and an enum now share a common interface — no base class in sight. That is the first big advantage: value types get polymorphism too, where *polymorphism* just means "different types usable through one shared interface."

## Using the contract as a type

Once types share a protocol, you can write code against the protocol instead of any concrete type:

```swift
let shapes: [any Drawable] = [Circle(radius: 2), Shape.square(side: 3)]

for shape in shapes {
    shape.draw()   // works — every element is guaranteed to have draw()
}
```

The array holds a circle and an enum side by side. All the loop knows is "each element is *some* Drawable" — and that's enough, because the contract guarantees `draw()` exists.

The `any` keyword marks this usage explicitly: `any Drawable` means "a box that can hold any conforming type." That box has a cost we'll come back to at the end of the lesson.

## Free behavior: protocol extensions

So far protocols only *demand* code. Here's the superpower — they can also *supply* it:

```swift
extension Drawable {
    func describe() -> String { "a drawable with area \(area)" }
}
```

An `extension` adds code to a type that already exists — extensions have their own lesson, but that one sentence is all you need here. Extending a *protocol* adds the code to every conformer at once:

```swift
Circle(radius: 2).describe()        // "a drawable with area 12.56..."
Shape.square(side: 3).describe()    // "a drawable with area 9.0"
```

Neither `Circle` nor `Shape` wrote `describe()`. They got it free, because the extension could build it out of the one thing the contract guarantees: `area`.

The same trick works on the requirements themselves. Give `draw()` a **default implementation**:

```swift
extension Drawable {
    func draw() { print("drawing something with area \(area)") }
}
```

Now a new conformer only *must* provide `area` — if it skips `draw()`, the default steps in. A conformer that wants its own `draw()` still writes one, and its version wins.

Pause on what just happened, because it's the heart of POP: unrelated types — structs, enums, classes — share real implementation *horizontally*, through a protocol they all conform to. Inheritance shares code vertically, down a family tree, classes only. Protocol extensions share code sideways, across any types that signed the contract.

## The dispatch trap

Here's the one place protocol extensions bite. Set up the trap carefully:

```swift
protocol Greeter {
    func hello()                 // hello IS a requirement
}

extension Greeter {
    func hello() { print("hello from the protocol") }
    func bye()   { print("bye from the protocol") }   // bye is NOT a requirement
}

struct English: Greeter {
    func hello() { print("hello from English") }
    func bye()   { print("bye from English") }
}
```

Both methods live in the extension. Both are "overridden" by `English`. The only difference: `hello()` is declared inside the protocol body as a requirement, `bye()` exists *only* in the extension.

Call both through a variable typed as the protocol. Predict the output:

```swift
let g: any Greeter = English()
g.hello()
g.bye()
```

Answer:

```
hello from English
bye from the protocol
```

The second line is the trap. `English` wrote its own `bye()` — and it was ignored.

Why? The two methods are looked up differently:

- `hello()` is a *requirement*, so Swift resolves it at runtime by asking the actual object "which type are you, and what's *your* hello?" This runtime lookup is called **dynamic dispatch**. `English`'s version wins.
- `bye()` is *not* a requirement — it's extension-only. The compiler resolves it at compile time using only the variable's declared type, which is `any Greeter`. This compile-time lockdown is called **static dispatch**. The extension's version wins, and `English.bye()` never gets a chance.

The fix is one line — make `bye()` a requirement:

```swift
protocol Greeter {
    func hello()
    func bye()      // now a requirement → dynamic dispatch → conformer's version wins
}
```

Rule to remember: if conformers should be able to customize a method *and have that customization respected through a protocol-typed variable*, the method must be declared in the protocol body, not just in the extension.

## Demanding several contracts at once

Sometimes one protocol isn't enough. Combine them with `&`:

```swift
protocol Named {
    var name: String { get }
}

func display(_ item: any Drawable & Named) {
    print("\(item.name): area \(item.area)")
}
```

`display` accepts only values that conform to *both* protocols — exactly the capabilities it needs, nothing more. This is **protocol composition**. No combined "DrawableAndNamed" protocol had to be invented, and no class hierarchy had to be rearranged.

A composition you use often can get a name:

```swift
typealias DisplayableShape = Drawable & Named
```

Composition is the small-scale version of the POP philosophy: instead of one fat interface, declare several tiny protocols and combine them where needed.

## POP vs OOP, side by side

You've now seen every piece. Here's the whole comparison in one table:

| | Class inheritance (OOP) | Protocol-oriented (POP) |
|---|---|---|
| Reuse via | subclassing a base class | conforming + protocol extensions |
| Works with | classes only | structs, enums, classes, actors |
| How many sources | one superclass | many protocols |
| Coupling | tight — subclasses break when the base changes | loose — small contracts, composed |

That last row has an interview-famous name: the *fragile base class* problem — a change to a base class silently breaking subclasses that depended on its old behavior. Protocols dodge it because conformers depend on a thin contract, not on a living, changing implementation above them.

One caution: POP is not "never write a class." It's a default posture — model capabilities as small protocols, share behavior through extensions, prefer composing contracts over building towers of inheritance. Classes still earn their place when you genuinely need shared mutable identity.

## Two ways to use a protocol — and the performance difference

A protocol shows up in function signatures in two distinct ways. They look similar and behave very differently.

Way one — as a *constraint* on a generic:

```swift
func render<T: Drawable>(_ shape: T) {
    shape.draw()
}
```

The `<T: Drawable>` says: this function works with any one concrete type, as long as it's Drawable. At compile time Swift knows exactly which type each call site uses — `render(Circle(radius: 2))` compiles as if you'd written a circle-specific function. Calls can be resolved statically. This is the fast path. Generics get a full lesson next.

Way two — as a *type* itself:

```swift
func render(_ shape: any Drawable) {
    shape.draw()
}

let mixed: [any Drawable] = [Circle(radius: 1), Shape.square(side: 2)]
```

`any Drawable` is a box holding *some conformer, unknown until runtime* — the technical name is an **existential**. The box costs something: values get wrapped, and every method call is a dynamic lookup. But it buys something generics can't: `mixed` holds circles and squares *in the same array*.

The rule of thumb, worth saying verbatim in an interview: use a generic constraint when each call site works with one concrete type — it's faster. Reach for `any` only when you genuinely need to mix different conformers in one place, like a heterogeneous array. The `some` and `any` keywords that make this choice explicit have their own lesson later.

## Common pitfalls

- **Customizing an extension-only method and calling it through the protocol type.** The conformer's version is silently skipped — static dispatch picks the extension's. Fix: declare the method as a requirement in the protocol body.
- **Reaching for `any P` by default.** Every `any` is a boxed value with dynamic lookup. Fix: prefer `<T: P>` generics unless you need a mixed collection.
- **Writing one giant protocol.** A fat contract forces conformers to implement things they don't have. Fix: split into small protocols and compose with `&` at the point of use.
- **Requiring `{ get set }` when the protocol only reads.** It forbids `let` and computed-only conformers for no benefit. Fix: require `{ get }` unless the protocol's own code must write.

## Interview lens

If asked "what is protocol-oriented programming?", say: model capabilities as small protocols, share implementation through protocol extensions, and prefer composing contracts over inheriting from base classes. Then land the two structural wins — it works for all types, not just classes, and it avoids the single-superclass and fragile-base-class limits of inheritance.

Expect a mechanics check. Be ready to name: requirements with `{ get }` versus `{ get set }`, default implementations living in protocol extensions, and composition with `&`.

The question that separates seniors is the dispatch gotcha. Explain it precisely: a method declared as a protocol *requirement* is dynamically dispatched, so a conformer's implementation wins even through a protocol-typed variable. A method that exists *only* in an extension is statically dispatched by the variable's declared type — the conformer's "override" is ignored. The fix is to declare it as a requirement.

The other senior marker is constraint versus existential. Say: `<T: P>` keeps the concrete type known at compile time, so it's specialized and fast; `any P` boxes the value and dispatches dynamically, which is the price of holding mixed conformers together. Choosing between them based on whether you need one concrete type or a heterogeneous collection is exactly the judgment interviewers are probing for.
