## The problem: a policy class that knows about a socket

Here's an order-processing feature that looks fine at a glance:

```swift
final class OrderProcessor {
    private let db = MySQLDatabase()

    func complete(_ order: Order) throws {
        try db.save(order)
    }
}
```

`OrderProcessor` is the class that decides *what* happens when an order completes — the important business rule. `MySQLDatabase` is a detail: which brand of database, which network protocol, which connection pool.

Right now the important class depends directly on the unimportant one. Swap databases and `OrderProcessor` has to change. Write a test for `complete(_:)` and it has to talk to a real MySQL server. The class that should be the most stable, most reusable piece of the app is welded to the piece most likely to change.

**Dependency Inversion** is the fix: instead of the important code depending on the detail, both depend on something in between. This lesson is about what that "something in between" is, and why the direction of the arrow matters so much.

## High-level and low-level modules

Call `OrderProcessor` a **high-level module** — code that encodes a business decision ("when an order completes, persist it"). Call `MySQLDatabase` a **low-level module** — code that does the mechanical work (opening a socket, writing bytes).

Without dependency inversion, the arrow points downhill:

```
OrderProcessor  --->  MySQLDatabase
 (high-level)          (low-level)
```

That arrow is backwards from what you actually want. The business rule "save the order" shouldn't need to know or care that MySQL exists. It should be MySQL's job to fit into the shape the business rule expects — not the other way around.

Traditional structured programming always draws this arrow downhill: high-level calls low-level, which calls lower-level still. The **Dependency Inversion Principle** says: *flip it*. Both high-level and low-level modules should depend on an abstraction, not on each other directly. That's where the name comes from — the usual direction of dependency gets inverted.

## Inverting it with a protocol

Introduce a `protocol` that describes what the high-level module needs, in the high-level module's own vocabulary:

```swift
protocol OrderStore {
    func save(_ order: Order) throws
}
```

`OrderProcessor` now depends on `OrderStore`, not on `MySQLDatabase`:

```swift
final class OrderProcessor {
    private let store: OrderStore
    init(store: OrderStore) { self.store = store }

    func complete(_ order: Order) throws {
        try store.save(order)
    }
}
```

`MySQLDatabase` conforms to the protocol instead of being depended on directly:

```swift
final class MySQLDatabase: OrderStore {
    func save(_ order: Order) throws { /* talk to MySQL */ }
}
```

Redraw the arrows:

```
OrderProcessor  --->  OrderStore  <---  MySQLDatabase
 (high-level)        (abstraction)      (low-level)
```

Both modules now point at the abstraction. Neither one points at the other. That's the inversion: the low-level `MySQLDatabase` depends *upward* on a protocol that lives conceptually next to the high-level code, instead of the high-level code depending *downward* on it.

Predict: if you later write a `PostgresDatabase: OrderStore` and swap it in, how many lines of `OrderProcessor` change?

Answer: zero. `OrderProcessor` only ever saw `OrderStore`. It has no idea which database is on the other side, so a new one slots in through `init` without touching a single line of business logic.

## Where does the protocol live?

This is the detail that trips people up. It's tempting to put `OrderStore` in the same file as `MySQLDatabase`, since that's the type that implements it. Don't — that puts the abstraction on the low-level side again, and `OrderProcessor` ends up importing the database module just to see the protocol.

The protocol belongs with the high-level module, because the high-level module is the one that defines what it needs:

```swift
// OrderProcessing module — owns OrderProcessor AND OrderStore
protocol OrderStore { func save(_ order: Order) throws }
final class OrderProcessor { /* depends on OrderStore */ }

// Persistence module — owns MySQLDatabase, imports OrderProcessing to conform
final class MySQLDatabase: OrderStore { /* ... */ }
```

The persistence module depends on the order-processing module now, never the reverse. That's the real test of whether you've inverted anything: trace the arrows between your modules and check that dependencies point toward business rules, not away from them.

## DIP is not the same thing as dependency injection

These two get mixed up constantly because they show up in the same code, but they answer different questions.

**Dependency Inversion Principle** is about *what you depend on*: high-level code should depend on an abstraction, not a concrete low-level type. It's a design rule about the shape of your types.

**Dependency injection** is about *how a concrete instance gets into a dependent object*: passing it through an initializer or property instead of the object constructing it itself. It's a mechanical technique — a separate topic with its own lesson.

You can see the difference by using one without the other:

```swift
// Injection without inversion — still depends on the concrete type
final class OrderProcessor {
    private let db: MySQLDatabase
    init(db: MySQLDatabase) { self.db = db }   // "injected", but not abstracted
}
```

This passes `db` in from outside, which looks like the fix — but the parameter type is still the concrete `MySQLDatabase`. Nothing is inverted; you've only moved *where* the concrete dependency is created, not *what* is depended on. DIP is what makes that injected parameter a protocol instead of a class, so the high-level module stays ignorant of the low-level one. In short: injection is the delivery mechanism, inversion is the rule about what shape the thing being delivered should be.

## Where to draw the boundary

Not every dependency needs its own protocol. Introducing an abstraction has a cost — an extra type, an extra layer to read through — so DIP is worth applying at **boundaries**: the seams between your business logic and something volatile, external, or slow.

Good candidates for a boundary:

```swift
protocol PaymentGateway { func charge(_ amount: Decimal) async throws }
protocol AnalyticsTracker { func log(_ event: String) }
protocol OrderStore { func save(_ order: Order) throws }
```

Networking, persistence, payment providers, analytics SDKs — all things that change vendors, need faking in tests, or carry side effects. Business rules that call into them should see a protocol, never the SDK type directly.

A poor candidate is inverting *everything*, including stable, dependency-free types that will never be swapped or mocked:

```swift
struct Money {
    let amount: Decimal
    let currency: String
}
```

`Money` has no I/O, no vendor, nothing to fake in a test. Wrapping it behind a `MoneyProtocol` adds a layer with no payoff — it's the DIP equivalent of over-engineering. Reserve the inversion for the modules that actually cross a boundary.

## Common pitfalls

- **Putting the protocol in the low-level module.** If `OrderStore` lives next to `MySQLDatabase` and the high-level module has to import the persistence layer to see it, you haven't inverted anything — the arrow still points downhill.
- **Calling injection alone "DIP".** Passing a concrete type through an initializer is dependency injection, not dependency inversion, unless the parameter's type is an abstraction.
- **Inverting stable, dependency-free types.** Protocols for things like `Money` or `Point` add indirection without a real seam to exploit.

## Interview lens

If asked to define DIP, lead with the two clauses from the original definition: high-level modules shouldn't depend on low-level modules — both should depend on abstractions — and abstractions shouldn't depend on details, details should depend on abstractions. Then ground it in Swift: the abstraction is a `protocol`, owned by the high-level module, and the low-level type conforms to it.

When the interviewer asks how DIP differs from dependency injection, say it plainly: DIP is the design rule about *what type* you depend on (an abstraction); DI is the technique for *how* a concrete instance arrives (passed in via initializer or property). You can inject a concrete type without inverting anything, and that's the mistake to call out.

If asked where to apply it, don't say "everywhere" — that's the wrong answer and a good interviewer will push back. Say you apply it at boundaries: networking, persistence, external SDKs, anything you'll want to fake in a test or swap in production. Stable, dependency-free value types don't need it.
