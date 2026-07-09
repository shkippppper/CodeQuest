## The problem: code that trusts a base type, betrayed by a subtype

This function takes any `Rectangle` and doubles its width:

```swift
class Rectangle {
    var width: Double
    var height: Double
    init(width: Double, height: Double) {
        self.width = width
        self.height = height
    }
}

func doubleWidth(of rect: Rectangle) {
    rect.width *= 2
}
```

Reasonable assumption: after calling `doubleWidth`, the rectangle's `height` is unchanged and its `width` is exactly twice what it was. Nothing about `Rectangle` suggests otherwise.

Now suppose someone adds `Square` as a subclass, reasoning "a square is a rectangle where width and height happen to be equal":

```swift
class Square: Rectangle {
    override var width: Double {
        didSet { height = width }
    }
    override var height: Double {
        didSet { width = height }
    }
}
```

Pass a `Square` into `doubleWidth`:

```swift
let square = Square(width: 4, height: 4)
doubleWidth(of: square)
print(square.width, square.height)   // 8, 8
```

`width` doubled to 8 as expected — but `height` silently became 8 too, because `Square` keeps its own invariant that width and height must match. `doubleWidth` never touched `height` directly, yet it changed. Any code written against `Rectangle`'s contract — "doubling width leaves height alone" — breaks the moment a `Square` is substituted in.

## Behavioral subtyping

The **Liskov Substitution Principle** (LSP) says: if `S` is a subtype of `T`, you should be able to use an instance of `S` anywhere a `T` is expected, without the program's correctness changing. This is stronger than "it compiles" — Swift happily compiles the `Square` example. LSP is about **behavioral subtyping**: the subtype must honor the base type's behavioral promises, not just its method signatures.

`Square` compiles as a `Rectangle` — it inherits the same properties and initializer. But it doesn't behave like one, because `Rectangle`'s implicit contract ("width and height vary independently") isn't something `Square` can keep while also being a square. The type system checked the shape of the API; it can't check the promise behind it.

## Contract violations

A subtype violates LSP whenever it changes what callers can rely on. There are a few recognizable ways this happens.

Strengthening a precondition — requiring more than the base type did:

```swift
class Bird {
    func fly() { print("flying") }
}

class Penguin: Bird {
    override func fly() {
        fatalError("penguins can't fly")
    }
}
```

Any code that calls `.fly()` on a `Bird` was relying on it always working. `Penguin` adds a hidden requirement — "don't call this if it's actually a penguin" — that the base type never advertised. Code written against `Bird` has no way to know to avoid it.

Weakening a postcondition — delivering less than the base type promised:

```swift
class SortedList {
    func add(_ n: Int) { /* keeps the list sorted */ }
}

class UnsortedList: SortedList {
    override func add(_ n: Int) { /* just appends — no longer sorted */ }
}
```

Code that calls `add` on a `SortedList` and then does a binary search afterward relied on the list staying sorted. `UnsortedList` breaks that promise while still compiling as a valid override.

Throwing new exceptions the base type never threw is the same problem in different clothes — callers wrote error handling against the base type's documented failure modes, and a subtype that adds new ones can crash code that never expected them.

## The classic rectangle/square

Predict: is there a way to fix `Square: Rectangle` so it never violates LSP, while keeping the inheritance relationship?

Answer: not really, and that's the point of the classic example. The problem isn't the implementation — it's that "a square is-a rectangle" is true geometrically but false *behaviorally*. `Rectangle`'s contract includes "width and height are independent," and no `Square` can honor that while staying a square. Inheritance here models an "is-a" relationship in the wrong dimension: geometric category, not behavioral contract.

The fix is to not model it as inheritance at all. If both need to report an area, a shared protocol works, because a protocol only promises what's actually declared — nothing about width and height being independent:

```swift
protocol HasArea {
    var area: Double { get }
}

struct Rectangle: HasArea {
    var width: Double
    var height: Double
    var area: Double { width * height }
}

struct Square: HasArea {
    var side: Double
    var area: Double { side * side }
}
```

Now `Square` isn't pretending to be a `Rectangle` with a hidden extra rule. It's its own type that happens to also satisfy `HasArea`. Nothing that works with `HasArea` can be surprised, because `HasArea` never promised independent width and height in the first place.

## LSP with protocols

LSP isn't just about class inheritance — it applies to any protocol conformance too, and Swift's protocol-oriented style makes this the more common place to hit it in practice.

```swift
protocol Cache {
    func store(_ value: String, for key: String)
    func value(for key: String) -> String?
}
```

The implicit contract: after `store(_:for:)`, calling `value(for:)` with the same key returns what you stored. A conforming type that silently drops entries under memory pressure is a legitimate cache — but only if that's part of the documented contract. A conforming type that returns *stale, wrong* data instead of `nil` is an LSP violation: it satisfies the method signatures but breaks what callers reasonably assume `store` followed by `value` means.

```swift
class BrokenCache: Cache {
    private var storage: [String: String] = [:]
    func store(_ value: String, for key: String) {
        storage[key] = value
    }
    func value(for key: String) -> String? {
        storage.randomElement()?.value  // returns SOME value, maybe the wrong one
    }
}
```

Any code that calls `store("token123", for: "authToken")` and then trusts `value(for: "authToken")` to return `"token123"` will silently get wrong data — and this compiles cleanly, conforms to `Cache` perfectly, and would pass a superficial code review. LSP violations are dangerous precisely because the type checker can't catch them; only tests against the *behavioral* contract can.

## Preconditions/postconditions

Two precise rules summarize everything above, borrowed from design-by-contract terminology.

A **precondition** is what must be true *before* a method runs (its requirements on the caller). A subtype may only **weaken** preconditions — accept everything the base type accepted, and optionally more:

```swift
class Base {
    func process(_ n: Int) {
        precondition(n > 0, "must be positive")
    }
}

class LenientSubclass: Base {
    override func process(_ n: Int) {
        // accepts n == 0 too — weaker precondition, OK
    }
}

class StrictSubclass: Base {
    override func process(_ n: Int) {
        precondition(n > 100, "must be over 100")  // stronger precondition — LSP violation
    }
}
```

`StrictSubclass` rejects inputs the base class accepted (like `n = 5`), so code trusting `Base`'s contract can crash on a `StrictSubclass` it didn't expect.

A **postcondition** is what must be true *after* a method runs (its promise to the caller). A subtype may only **strengthen** postconditions — guarantee everything the base type guaranteed, and optionally more, never less. `Penguin.fly()` and `UnsortedList.add()` from earlier are both postcondition weakenings: the base type promised something ("it flies," "the list stays sorted") that the subtype no longer delivers.

The memory hook: preconditions weaken, postconditions strengthen — a subtype can only ask *less* of callers and promise *more* to them, never the reverse.

## Common pitfalls

- Trusting "is-a" in plain English. "A square is a rectangle," "a penguin is a bird" — true in everyday language, false as a behavioral subtype if the base type's contract can't survive the specialization.
- Reviewing only method signatures, not behavior. `override func fly()` compiling is not evidence LSP holds — you have to check what callers assumed about the base method's outcome.
- Assuming protocols are automatically LSP-safe. A protocol only prevents signature mismatches; a conformance can still violate the protocol's implicit behavioral promises, as `BrokenCache` shows.

## Interview lens

If asked to define LSP, lead with substitutability: subtypes must be usable anywhere the base type is expected, without breaking the caller's correctness — and be ready to say this is about behavior, not just matching method signatures, which is why it compiles fine even when violated.

If given the rectangle/square example (a near-certain interview question), don't try to "fix" the subclass — explain *why* it can't be fixed while staying inheritance, then pivot to the real fix: model the shared capability as a protocol instead of an is-a class hierarchy, since a protocol only promises what it explicitly declares.

If asked how to catch LSP violations in review, mention the two testable rules: a subtype may only weaken preconditions (accept more) and must strengthen or keep postconditions (promise at least as much). Concretely: does the override reject an input the base type accepted, or fail to deliver something the base type guaranteed? Either one is disqualifying, no matter how clean the code looks.
