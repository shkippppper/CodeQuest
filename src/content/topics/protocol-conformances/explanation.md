## The problem: the "standard behaviors" your types need

To put a type in a `Set`, use it as a `Dictionary` key, sort it, compare it, print it usefully, or drive a SwiftUI `List` — it must adopt the right **standard-library protocol**. These conformances are the vocabulary the whole ecosystem speaks. Swift **synthesizes** most of them for you, but each has a **contract** you must respect (and sometimes implement by hand).

## `Equatable`

**`Equatable`** provides `==` — value equality. Swift **synthesizes** it for structs (all stored properties Equatable) and enums (all associated values Equatable) when you declare conformance.

```swift
struct Point: Equatable { var x: Int; var y: Int }   // == synthesized
```

Write it yourself when equality shouldn't compare every field (e.g. equal if `id`s match, ignoring a cache). The contract: `==` must be reflexive, symmetric, and transitive.

## `Hashable`

**`Hashable`** (requires `Equatable`) provides a `hashValue`/`hash(into:)`, letting the type be a `Set` element or `Dictionary` key. Also synthesized for structs/enums when all members are `Hashable`.

**The iron contract: if `a == b`, then `a.hashValue == b.hashValue`.** Break it — e.g. by hashing fields your custom `==` ignores — and a `Set`/`Dictionary` can "lose" an element it contains. When you hand-write both, keep `hash(into:)` consistent with `==` (hash exactly the fields used in equality). Hashes need not be unique; collisions are fine.

## `Comparable`

**`Comparable`** (requires `Equatable`) provides `<` (and derives `>`, `<=`, `>=`), enabling `sort()`, `min()`, `max()`, ranges. **Not synthesized for structs** — you implement `<` (or, for enums with no associated values, declaring `Comparable` synthesizes an order based on case declaration order).

```swift
struct Version: Comparable {
    let major: Int; let minor: Int
    static func < (l: Version, r: Version) -> Bool {
        (l.major, l.minor) < (r.major, r.minor)     // tuple comparison
    }
}
```

The contract: a strict total order (irreflexive, transitive, and consistent with `==`).

## `Identifiable`

**`Identifiable`** requires an **`id`** (a `Hashable` associated type `ID`) that stably identifies an instance — the protocol SwiftUI's `List`/`ForEach` use to track rows. If your type has a `let id`, conformance is automatic:

```swift
struct User: Identifiable { let id: UUID; var name: String }   // id satisfies it
```

The key requirement: `id` must be **stable** (not change across updates) and **unique**, so SwiftUI diffs correctly. Don't use a value that changes when content changes.

## `CustomStringConvertible`

**`CustomStringConvertible`** provides a **`description`** — the string used by `String(describing:)`, `print`, and interpolation. Adopt it to give a type a clean, human-readable representation (instead of the default reflection dump).

```swift
struct Money: CustomStringConvertible {
    let cents: Int
    var description: String { "$\(Double(cents) / 100)" }
}
```

(There's also `CustomDebugStringConvertible`/`debugDescription` for the debugger/`po`.)

## Synthesized vs custom conformance

- **Synthesized** (`Equatable`, `Hashable`, `Codable`, and enum `Comparable`): declare the conformance and the compiler generates it from the stored properties/associated values — as long as they all conform. Prefer this; it's correct and free.
- **Custom**: implement the requirement yourself when the default behavior is wrong (equality by `id` only, a domain-specific order, a formatted `description`) — but then you **own the contract** (keep `==`/`hash(into:)` consistent, keep `<` a total order).

A subtle synthesis gotcha: adding **one** non-conforming stored property (e.g. a closure, which isn't `Equatable`/`Hashable`) **disables synthesis** for the whole type — you must then exclude it via a hand-written implementation.

## The interview lens

Map each protocol to its capability and synthesis status: **`Equatable`** (`==`, synthesized for structs/enums of Equatable members), **`Hashable`** (Set/Dict keys; synthesized; **contract: equal values must hash equally**), **`Comparable`** (`<` → sorting/ranges; **not** synthesized for structs — you write `<`; enums without payloads get case-order synthesis), **`Identifiable`** (a **stable, unique `id`** for SwiftUI diffing), and **`CustomStringConvertible`** (`description` for `print`/interpolation).

The senior signals: the **Hashable/Equatable contract** (hash the same fields `==` uses, or a `Set` loses elements), that **one non-Hashable/Equatable stored property (like a closure) kills synthesis**, and *when to go custom* (equality by identity/`id`, domain ordering, formatted description) — accepting that you then own the invariants.
