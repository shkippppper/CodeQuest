## The problem: modeling "one of a fixed set"

Some values can only be one of a handful of things: a traffic light is red, amber, or green; a network request is loading, succeeded, or failed. Represent that with a `String` or an `Int` and you invite illegal states — `"grene"`, `-1`, a status that's both loading *and* failed. Swift's `enum` makes the set of possibilities explicit and lets the compiler enforce that you handle every one.

Swift enums go far beyond C enums: they can carry data, conform to protocols, have methods and computed properties, and are the idiomatic way to model state.

## Basic enums and raw values

An enum defines a type with a fixed list of cases.

```swift
enum Direction {
    case north, south, east, west
}

let heading = Direction.north
```

You can give cases **raw values** — a backing `String`, `Int`, or other literal — by declaring a raw type. Integer raw values auto-increment; string raw values default to the case name.

```swift
enum Planet: Int {
    case mercury = 1, venus, earth   // venus = 2, earth = 3
}

enum Suit: String {
    case hearts, spades              // rawValue is "hearts", "spades"
}

print(Planet.earth.rawValue)        // 3
let s = Suit(rawValue: "hearts")    // Suit? — a failable lookup
```

Note that `init(rawValue:)` is **failable** — it returns an optional, because the raw value might not match any case.

## Associated values

This is the superpower C enums don't have: each case can carry its own **associated values** of any type. Different cases can carry different data.

```swift
enum Barcode {
    case upc(Int, Int, Int, Int)
    case qr(String)
}

let a = Barcode.upc(8, 85909, 51226, 3)
let b = Barcode.qr("https://swift.org")
```

A case can have raw values *or* associated values, but not both. Associated values turn an enum into a precise model — the type itself guarantees a `qr` always has a string and a `upc` always has four ints.

## Pattern matching enums

You read an enum's cases (and pull out associated values) with `switch`, which the compiler requires to be **exhaustive**.

```swift
switch barcode {
case .upc(let a, let b, let c, let d):
    print("UPC \(a)-\(b)-\(c)-\(d)")
case .qr(let code):
    print("QR \(code)")
}
```

If you cover every case, you don't need a `default`. Better still — if you add a new case later, every non-exhaustive switch becomes a **compile error**, pointing you at exactly the code you forgot to update. For a single case, `if case` is lighter than a full switch:

```swift
if case .qr(let code) = barcode {
    print("Scanned \(code)")
}
```

## Recursive (`indirect`) enums

An enum whose cases reference the enum itself must be marked `indirect`, which tells the compiler to box the recursive storage.

```swift
indirect enum Expr {
    case number(Int)
    case add(Expr, Expr)
}

let tree = Expr.add(.number(1), .add(.number(2), .number(3)))
```

This is how you model trees, linked structures, and small expression languages as value types.

## `CaseIterable`

Conform to `CaseIterable` and the compiler synthesizes an `allCases` collection — perfect for building menus, iterating options, or testing.

```swift
enum Tab: CaseIterable {
    case home, search, profile
}

print(Tab.allCases.count)          // 3
for tab in Tab.allCases { /* ... */ }
```

`allCases` is only synthesized automatically for enums **without** associated values.

## Enums as state machines

Because an enum can hold exactly one case with its own data, it's the cleanest way to model mutually-exclusive state — you literally cannot be in two states at once.

```swift
enum LoadState {
    case idle
    case loading
    case loaded([String])
    case failed(Error)
}
```

Compare that to a struct with `isLoading`, `data`, and `error` fields, where nothing stops all three being set at once. The enum makes the illegal combinations **unrepresentable** — a hallmark of good Swift design.

## The interview lens

The headline question is *"How are Swift enums more powerful than enums in other languages?"* Answer: **associated values** (each case carries its own typed data) and **exhaustive pattern matching** (the compiler forces you to handle every case, and flags you when a new case is added). Mention that a case can have raw *or* associated values, not both, and that `init(rawValue:)` is failable.

The design question interviewers love: *"How would you model a screen that's loading, loaded, or errored?"* Reach for an enum with associated values (`loading`, `loaded(data)`, `failed(error)`) and explain the phrase **"make illegal states unrepresentable"** — that's the senior framing that separates a good answer from a great one.
