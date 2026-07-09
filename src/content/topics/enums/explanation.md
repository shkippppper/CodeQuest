## The problem: "one of a fixed set", done honestly

Model a traffic light with a string:

```swift
var light = "red"
light = "grene"     // compiles fine. Ships fine. Breaks at runtime.
```

Nothing stops the typo, because `String` can hold *anything* — but a traffic light has exactly three legal values. The same disease with numbers:

```swift
var status = 2      // 0 = loading, 1 = success, 2 = failure... what's -1?
```

Swift's answer is the `enum`: a type whose values are a fixed, named list of cases, checked by the compiler. And Swift enums go far beyond the C version — they can carry data, have methods and computed properties, and adopt shared capabilities the way structs and classes do. By the end of this lesson they'll be your default tool for modeling state.

## A fixed list of cases

```swift
enum Direction {
    case north, south, east, west
}

let heading = Direction.north
```

`Direction` is now a full type, and a `Direction` value is always exactly one of those four cases — no fifth option, no typo, no `-1`. When Swift already knows the type, you can drop the type name:

```swift
var heading: Direction = .north
heading = .south                  // type known, so `.south` suffices
```

That leading-dot shorthand is why enum-heavy Swift reads so cleanly.

## Raw values: a built-in backing value

Sometimes each case should correspond to a fixed primitive — a number from a server, a string for storage. Declare a raw type after the enum's name:

```swift
enum Planet: Int {
    case mercury = 1, venus, earth
}
```

Predict: what is `Planet.earth.rawValue`?

Answer: `3`. Integer raw values auto-increment from the last one you wrote — `mercury` is 1, so `venus` becomes 2 and `earth` 3, without spelling them out.

String raw values have their own default — the case's name:

```swift
enum Suit: String {
    case hearts, spades
}

Suit.hearts.rawValue   // "hearts"
```

Raw values also work backwards. Given a raw value, look up the case:

```swift
let s = Suit(rawValue: "hearts")   // Optional(Suit.hearts)
let t = Suit(rawValue: "banana")   // nil
```

Notice the type: `Suit?`, an optional. `init(rawValue:)` is a **failable initializer** — an initializer that can return `nil` instead of a value — because the string you pass might not match any case. The compiler forces you to handle the miss, which is exactly what you want when the raw value arrives from a server or a file.

## Associated values: cases that carry data

Here's the feature that separates Swift enums from every C-style enum. A case can carry its own payload:

```swift
enum Barcode {
    case upc(Int, Int, Int, Int)
    case qr(String)
}

let a = Barcode.upc(8, 85909, 51226, 3)
let b = Barcode.qr("https://swift.org")
```

These payloads are called **associated values**, and each case declares its own — a `upc` always carries four integers, a `qr` always carries one string. That guarantee lives in the type itself: there is no way to construct a `qr` without its string, and no way to sneak four integers into one.

Contrast that with raw values. A raw value is fixed at compile time, identical for every `.hearts` ever created. An associated value is chosen fresh at *creation* time — every `.qr(...)` can carry a different string. Because the two ideas conflict, an enum can have raw values *or* associated values, never both.

## Getting the data back out

An associated value is sealed inside its case. The tool for opening it is `switch`, using the `case let` patterns from the Control Flow lesson:

```swift
switch barcode {
case .upc(let a, let b, let c, let d):
    print("UPC \(a)-\(b)-\(c)-\(d)")
case .qr(let code):
    print("QR \(code)")
}
```

Each pattern matches a case *and* binds its payload in one move. And the switch must be exhaustive — cover every case, or it doesn't compile. Since both cases are handled here, no `default` is needed.

That exhaustiveness is a long-term safety net. Add a case next year:

```swift
enum Barcode {
    case upc(Int, Int, Int, Int)
    case qr(String)
    case aztec(String)      // new
}
```

Every switch over `Barcode` that doesn't handle `.aztec` immediately becomes a compile error — the compiler hands you a checklist of every spot that needs updating. A `default` case would have swallowed the new case silently, which is why seasoned Swift avoids `default` on its own enums.

When only one case matters, skip the ceremony with `if case`:

```swift
if case .qr(let code) = barcode {
    print("Scanned \(code)")
}
```

## Recursive enums: cases that contain themselves

Try to model an arithmetic expression — a thing that is either a number, or an addition of two smaller expressions:

```swift
enum Expr {
    case number(Int)
    case add(Expr, Expr)    // error: recursive enum
}
```

The compiler rejects it. Why? An enum normally stores its data inline, so it needs a fixed size — but an `Expr` containing two `Expr`s, each possibly containing more, has no computable size. The fix is one keyword:

```swift
indirect enum Expr {
    case number(Int)
    case add(Expr, Expr)
}
```

`indirect` tells the compiler to store the recursive payloads behind a pointer — "boxed" on the side rather than inline — which gives the enum a fixed size again. Now trees build naturally:

```swift
let tree = Expr.add(.number(1), .add(.number(2), .number(3)))
// represents 1 + (2 + 3)
```

You can also mark just the recursive cases (`indirect case add(Expr, Expr)`) instead of the whole enum. Either way, this is how Swift models trees, nested expressions, and linked structures as plain value types.

## CaseIterable: a free list of all cases

Building a settings menu, you want to loop over every case of an enum. Adopt `CaseIterable`:

```swift
enum Tab: CaseIterable {
    case home, search, profile
}

Tab.allCases.count            // 3
for tab in Tab.allCases {
    print(tab)                // home, search, profile — declaration order
}
```

`CaseIterable` is a protocol — a named capability a type can adopt; protocols get their own lesson later. Adopting it here makes the compiler write the `allCases` array for you.

The catch: automatic synthesis only works for enums *without* associated values. `Barcode.allCases` can't be generated — what string would the `.qr` case carry? — so for payload-carrying enums you'd have to write `allCases` by hand, if it even makes sense.

## Enums as state machines

Now the design payoff. Model a loading screen with a struct:

```swift
struct LoadState {
    var isLoading: Bool
    var data: [String]?
    var error: Error?
}
```

Count the trouble: `isLoading == true` *and* `data != nil` at once? `data` and `error` both set? All three unset? The struct happily represents every nonsense combination, and your code needs defensive checks for each.

The enum version:

```swift
enum LoadState {
    case idle
    case loading
    case loaded([String])
    case failed(Error)
}
```

An enum value is exactly one case at a time — being loaded *and* failed simultaneously isn't a bug you have to check for, it's a sentence that can't be written. The data rides along only where it exists: `loaded` has its array, `failed` has its error, `loading` carries nothing.

Swift designers have a phrase for this: **make illegal states unrepresentable**. Instead of validating bad states at runtime, choose types where bad states cannot be constructed at all. Enums with associated values are the primary tool for it, and every switch over `LoadState` gets exhaustiveness-checking as a bonus.

## Common pitfalls

- **Force-unwrapping `init(rawValue:)`.** `Suit(rawValue: serverString)!` crashes the moment the server sends something new. It's an optional for a reason — handle the `nil`.
- **Adding `default` to switches over your own enum.** New cases then vanish into `default` silently instead of producing the compile errors that would guide your update.
- **Trying to mix raw and associated values.** One enum can't have both; pick per what the type means.
- **Expecting `allCases` on an enum with associated values.** Synthesis is skipped — there's no single value for a payload-carrying case.
- **Modeling exclusive states as parallel booleans/optionals.** `isLoading` + `data` + `error` allows contradictions; one enum with associated values doesn't.

## Interview lens

The headline question is "how are Swift enums more powerful than enums in other languages?" Lead with associated values — each case carries its own typed payload, chosen at creation time — and exhaustive pattern matching, where the compiler forces every case to be handled and flags every switch when a case is added later. Slip in the supporting facts: a case can have raw *or* associated values but not both, and `init(rawValue:)` is failable because the input might match nothing.

The design question interviewers love is "model a screen that can be loading, loaded, or errored." Reach for the enum — `idle`, `loading`, `loaded(data)`, `failed(error)` — and then say the phrase they're fishing for: it makes illegal states unrepresentable, unlike a struct of booleans and optionals where contradictory combinations compile fine. That framing is what separates a good answer from a great one.

If recursion comes up, know that `indirect` exists because an enum needs a fixed inline size; the keyword boxes the recursive payload behind a pointer. And for `CaseIterable`, remember the one limit — no automatic `allCases` when cases carry associated values — since that's the follow-up most people miss.
