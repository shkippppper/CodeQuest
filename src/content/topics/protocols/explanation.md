## The problem: sharing behavior without inheritance

Class inheritance shares behavior by putting it in a superclass — but you get one superclass, value types can't use it, and hierarchies grow rigid. Swift's answer is **protocols**: contracts that any type (struct, enum, class, actor) can adopt, combined with **protocol extensions** that supply default behavior. This "protocol-oriented programming" (POP) is why the Swift standard library is protocol-based, not a deep class tree.

## Defining protocols

A **protocol** declares requirements — methods, properties, initializers, associated types — that a conforming type must satisfy.

```swift
protocol Drawable {
    var area: Double { get }        // property requirement
    func draw()                     // method requirement
}
```

Property requirements specify `{ get }` or `{ get set }`; the protocol says *what*, not *how*.

## Protocol conformance

A type **conforms** by declaring the protocol and implementing its requirements.

```swift
struct Circle: Drawable {
    let radius: Double
    var area: Double { .pi * radius * radius }
    func draw() { /* ... */ }
}
```

Any kind of type can conform — structs, enums, classes, actors. That's the first advantage over class inheritance: **value types get polymorphism too**.

## Default implementations via extensions

The superpower: give a protocol **default behavior** in a **protocol extension**. Conformers get it for free and can override it.

```swift
extension Drawable {
    func draw() { print("Drawing something with area \(area)") }   // default
    func describe() -> String { "area = \(area)" }                 // bonus method
}
```

Now conformers only *must* provide `area`; `draw`/`describe` come from the extension. This is how POP shares implementation **horizontally** across unrelated types — no shared base class needed.

**Gotcha (static vs dynamic dispatch):** a method **defined in the protocol** and overridden by a conformer uses **dynamic dispatch** (the conformer's version wins). But a method **only in the extension, not a protocol requirement**, uses **static dispatch** based on the *variable's declared type* — so calling it through a `Drawable` reference runs the extension's version even if the concrete type "overrode" it. Declare it as a requirement if you need polymorphic dispatch.

## Protocol composition

Require **multiple** protocols at once with `&`:

```swift
func handle(_ item: Drawable & Codable) { ... }
typealias Serializable = Codable & Equatable
```

Composition lets you demand exactly the capabilities you need without inventing a combined protocol or a class hierarchy.

## POP vs OOP

| | Class inheritance (OOP) | Protocol-oriented (POP) |
|---|---|---|
| Reuse via | subclassing a base class | conforming + protocol extensions |
| Works with | classes only | structs, enums, classes, actors |
| Multiplicity | one superclass | many protocols |
| Coupling | tight (fragile base class) | loose (composition of contracts) |

POP favors **composition of small protocols** over deep inheritance, and value types over reference types. It's not "no classes ever" — it's "model capabilities as protocols, share defaults via extensions, prefer composition."

## Protocols as types vs constraints

A protocol can be used two ways, with very different performance:

- **As a constraint (generic):** `func f<T: Drawable>(_ x: T)` — the concrete type is known at compile time; calls can be statically dispatched/specialized. Preferred for performance.
- **As a type (existential):** `func f(_ x: Drawable)` or `let items: [any Drawable]` — a heterogeneous box holding *some* `Drawable`; dispatch is dynamic and there's boxing overhead.

(The `some`/`any` keywords make this explicit — covered in its own topic.) Rule of thumb: use a **generic constraint** when a call site works with one concrete type; use an **existential (`any`)** when you genuinely need a mixed collection of different conformers.

## The interview lens

Explain POP as **"model capabilities as protocols and share implementation via protocol extensions,"** which works for **all** types (not just classes) and favors **composition over inheritance** — avoiding the single-superclass and fragile-base-class limits. Name the mechanics: requirements (`{ get }`/`{ get set }`, methods), **default implementations in extensions**, and **composition with `&`**.

The senior differentiators: the **static-vs-dynamic dispatch gotcha** — a method that's only in a protocol *extension* (not a requirement) is dispatched **statically by the declared type**, so a conformer's "override" is ignored when called through the protocol type (declare it as a requirement for dynamic dispatch). And **protocol as constraint vs existential**: generic constraints (`<T: P>`) are compile-time-known and fast; existentials (`any P`) box a value for heterogeneous use with dynamic dispatch — choose based on whether you need one concrete type or a mixed collection.
