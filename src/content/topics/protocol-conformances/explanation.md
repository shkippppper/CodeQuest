## The problem: your type can't join in yet

Define a perfectly reasonable struct and try to use it like a built-in type:

```swift
struct Point {
    var x: Int
    var y: Int
}

Point(x: 1, y: 2) == Point(x: 1, y: 2)   // ❌ error: == not defined for Point
let visited: Set<Point> = []             // ❌ error: Point is not Hashable
[p1, p2, p3].sorted()                    // ❌ error: Point is not Comparable
```

Three lines, three rejections. Comparing, putting in a `Set`, sorting — none of it works, because Swift doesn't guess what equality or ordering *means* for your type.

Each capability is unlocked by conforming to a small standard-library protocol. These conformances are the vocabulary the whole ecosystem speaks: `Set` and `Dictionary` speak `Hashable`, `sorted()` speaks `Comparable`, `print` speaks `CustomStringConvertible`, SwiftUI lists speak `Identifiable`. The good news: Swift writes most of these conformances for you. The catch: each one comes with a contract you must not break. This lesson walks through the five you'll use daily.

## Equatable: what does "equal" mean here?

Unlock `==` by declaring one conformance:

```swift
struct Point: Equatable {
    var x: Int
    var y: Int
}

Point(x: 1, y: 2) == Point(x: 1, y: 2)   // ✓ true
```

Notice what you did *not* write: any `==` function. Because every stored property of `Point` is itself `Equatable`, the compiler generated the obvious implementation — compare all stored properties. This compiler-generated conformance is called **synthesis**, and it works for structs whose stored properties are all Equatable, and for enums whose associated values all are.

Sometimes property-by-property is the wrong meaning of equal. Say a user carries a cache you don't want compared:

```swift
struct User: Equatable {
    let id: UUID
    var name: String
    var avatarCache: Data?

    static func == (l: User, r: User) -> Bool {
        l.id == r.id                     // equal means: same id, ignore the rest
    }
}
```

Writing your own `==` replaces the synthesized one. But now you own the contract: `==` must be *reflexive* (`a == a` is always true), *symmetric* (`a == b` implies `b == a`), and *transitive* (`a == b` and `b == c` imply `a == c`). The synthesized version guarantees all three; a hand-written one is your responsibility.

## Hashable: earning a spot in Set and Dictionary

Now make `Point` usable as a `Set` element or `Dictionary` key:

```swift
struct Point: Hashable {
    var x: Int
    var y: Int
}

var visited: Set<Point> = []
visited.insert(Point(x: 1, y: 2))   // ✓
```

**Hashable** builds on Equatable — every Hashable type must also be Equatable. It adds one requirement, `hash(into:)`, which boils a value down to a number called a hash. A `Set` uses that number as a shortcut: instead of comparing your point against every element, it jumps straight to the bucket where an equal value *would* live, then confirms with `==`. Synthesis works exactly like Equatable's: all stored properties Hashable, and the compiler hashes them all for you.

That bucket-jumping is why Hashable has an iron contract: if `a == b`, then `a` and `b` must produce the same hash. Watch what happens when the contract breaks. Here's a type with a hand-written `==` that only checks `id`, but a `hash(into:)` that hashes everything:

```swift
struct User: Hashable {
    let id: UUID
    var name: String

    static func == (l: User, r: User) -> Bool { l.id == r.id }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
        hasher.combine(name)   // ❌ hashing a field == ignores
    }
}
```

Predict: what does the last line print?

```swift
let id = UUID()
var set: Set<User> = [User(id: id, name: "Ada")]

let sameUser = User(id: id, name: "Ada Lovelace")   // == says: equal (same id)
print(set.contains(sameUser))
```

Answer: `false` — even though `sameUser ==` the element in the set. The two values hash differently (different `name`), so the set looks in the *wrong bucket*, finds nothing, and reports the element missing. The set has effectively lost an element it contains. The fix: hash exactly the fields `==` uses — here, only `id`.

Two clarifications that trip people up. Hashes do *not* need to be unique — two unequal values sharing a hash is called a collision, and sets handle collisions correctly, just a bit slower. The contract is one-directional: equal values must hash equal; hash-equal values need not be `==`.

## Comparable: defining an order

`Comparable` also builds on Equatable and adds `<`. Implement `<` and Swift derives `>`, `<=`, and `>=` for free — plus everything ordering unlocks: `sorted()`, `min()`, `max()`, and ranges like `a...b`.

Unlike the previous two, Comparable is *not* synthesized for structs. There's no obvious "natural order" for multi-field types, so you write `<` yourself:

```swift
struct Version: Comparable {
    let major: Int
    let minor: Int

    static func < (l: Version, r: Version) -> Bool {
        (l.major, l.minor) < (r.major, r.minor)
    }
}

Version(major: 2, minor: 0) > Version(major: 1, minor: 9)   // true
```

That body uses a handy trick: tuples of Comparable values compare element by element, left to right — major first, minor only on a tie. It's the cleanest way to write multi-field ordering.

Enums are the exception: an enum with no associated values *can* get Comparable synthesized, ordered by the declaration order of its cases:

```swift
enum Priority: Comparable { case low, medium, high }

Priority.low < Priority.high   // true — `low` is declared first
```

The contract for a hand-written `<` is a *strict total order*: `a < a` is always false, `a < b` and `b < c` imply `a < c`, and the ordering must agree with `==` — for any two values, exactly one of `a < b`, `a == b`, `b < a` holds. Violate it and `sorted()` produces garbage or crashes.

## Identifiable: a stable identity for lists

SwiftUI's `List` and `ForEach` — covered in their own lessons later — need to tell rows apart across updates: which row moved, which is new, which was deleted. The protocol they speak is **Identifiable**, and its single requirement is an `id` property whose type is Hashable.

If your type already stores an id, conformance is free:

```swift
struct User: Identifiable {
    let id: UUID        // this property satisfies the requirement
    var name: String
}
```

The requirement that matters is *semantic*, not syntactic: the `id` must be stable and unique. Stable means it doesn't change when the value's content changes — Ada renaming herself is still the same row. Unique means no two items share an id, or the list's diffing breaks.

The classic mistake is deriving `id` from content:

```swift
var id: String { name }   // ❌ rename the user → SwiftUI sees a DELETED row + a NEW row
```

Edit the name and the old id vanishes while a new one appears — animations glitch and row state is lost. Use an identity that belongs to the *entity*, like a database key or a `UUID` created once.

## CustomStringConvertible: printing something readable

Print a plain struct and you get the compiler's fallback dump:

```swift
struct Money { let cents: Int }
print(Money(cents: 199))    // Money(cents: 199)
```

Fine for debugging, wrong for anything user-facing. **CustomStringConvertible** has one requirement, `description`, and it becomes the string used by `print`, string interpolation, and `String(describing:)`:

```swift
struct Money: CustomStringConvertible {
    let cents: Int
    var description: String { "$\(Double(cents) / 100)" }
}

print(Money(cents: 199))            // $1.99
print("total: \(Money(cents: 50))") // total: $0.5
```

There's a sibling, `CustomDebugStringConvertible`, whose `debugDescription` feeds debugger output like the `po` command. Use `description` for a clean human-facing form and `debugDescription` when the debugger should show extra internals.

## Synthesized vs custom: choosing and owning

Zoom out — the pattern across all five:

```swift
struct Point: Equatable, Hashable, Codable {}   // declare → compiler writes it all
```

For `Equatable`, `Hashable`, `Codable` (its own lesson), and payload-free enum `Comparable`, synthesis means: declare the conformance and the compiler generates the implementation from your stored properties. Prefer it. It's free, it's correct, and it silently stays correct when you add properties.

Go custom only when the default *meaning* is wrong — equality by `id` instead of all fields, a domain-specific order, a formatted description. The price of custom is that you now own the invariants by hand: keep `hash(into:)` consistent with `==`, keep `<` a strict total order, and re-check them whenever the type changes.

One synthesis gotcha to know cold. Watch a single property break everything:

```swift
struct Handler: Equatable {          // ❌ no longer compiles
    let name: String
    let onTap: () -> Void            // closures are not Equatable
}
```

One non-conforming stored property — a closure is the classic culprit, since closures are neither Equatable nor Hashable — disables synthesis for the *whole type*. The compiler won't skip the field for you. Your options: write `==` yourself and exclude that property, or restructure so the non-conforming value lives elsewhere.

## Common pitfalls

- **Hashing fields your custom `==` ignores.** A `Set` can then fail to find an element it contains. Fix: `hash(into:)` combines exactly the fields `==` compares.
- **Expecting Comparable synthesis on a struct.** Structs never get it — only payload-free enums do, by case order. Fix: write `static func <`, ideally via tuple comparison.
- **An `id` derived from mutable content.** SwiftUI treats every edit as delete-plus-insert. Fix: a stable identity created once, like a `UUID` or database key.
- **One closure property silently killing synthesis.** The whole type loses Equatable/Hashable, not just that field. Fix: hand-write the conformance excluding it.
- **Assuming hashes must be unique.** They don't — collisions are legal and handled. Only the equal-implies-same-hash direction is a hard rule.

## Interview lens

If asked to run through the core conformances, map each to its capability and whether Swift writes it for you: `Equatable` gives `==` and is synthesized when all stored properties conform; `Hashable` builds on it to unlock `Set` and `Dictionary` keys, also synthesized; `Comparable` gives `<` plus sorting and ranges but is never synthesized for structs — only payload-free enums get case-order synthesis; `Identifiable` is a stable unique `id` for SwiftUI diffing; `CustomStringConvertible` is the `description` behind `print` and interpolation.

The contract question is where seniors separate. State the Hashable rule precisely: equal values must produce equal hashes, so a custom `==` and `hash(into:)` must use the same fields — otherwise a `Set` looks in the wrong bucket and loses elements. Add that collisions are fine; uniqueness is not required.

If asked "when would you write these by hand?", say: when the synthesized meaning is wrong — identity-based equality, domain ordering, formatted output — and acknowledge that going custom means you personally own the invariants from then on. Mentioning the closure-property gotcha (one non-conforming stored property disables synthesis for the whole type) is a strong real-world signal, because everyone hits it eventually.
