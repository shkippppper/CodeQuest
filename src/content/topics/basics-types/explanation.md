## The problem: naming values safely

Every program needs to name and store values. The questions Swift answers up front are: *can this value change?* and *what type is it?* Getting those two right — immutability by default, and a strong static type for everything — heads off a whole class of bugs before your code even runs.

## `let` vs `var`

`let` declares a **constant**: bind it once, and it can never be reassigned. `var` declares a **variable** you can reassign.

```swift
let pi = 3.14159   // constant — fixed forever
var score = 0      // variable — can change
score = 10         // ok
// pi = 3.14       // ❌ compile error: cannot assign to a 'let'
```

The idiom is **`let` by default, `var` only when you truly need mutation**. It signals intent, lets the compiler optimize, and — for value types — makes the whole value immutable. The compiler will even warn you if a `var` is never mutated.

## Type inference vs annotation

Swift is statically typed, but you rarely write types out. The compiler **infers** the type from the initial value.

```swift
let count = 42          // inferred Int
let price = 9.99        // inferred Double (not Float)
let name = "Ada"        // inferred String
let flag = true         // inferred Bool
```

You add an explicit **annotation** when there's no initializer to infer from, or when you want a type other than the default:

```swift
let temperature: Double = 98    // Double, not Int
var note: String                // declared now, assigned later
let big: Int64 = 1              // a specific width
```

Two defaults to remember: an integer literal infers to `Int`, and a floating-point literal infers to `Double`. If you need `Float`, you must say so.

## Value initialization & default values

Swift has **no implicit `null`/zero**. A constant or variable must hold a value before you read it — the compiler enforces "definite initialization." You *can* declare first and assign later, as long as every path assigns before first use.

```swift
let threshold: Int
if isProduction {
    threshold = 100
} else {
    threshold = 10
}
print(threshold)   // ok — assigned on every path
```

Reading an uninitialized variable is a **compile error**, not a runtime surprise. There are no default zero-values as in Go or C.

## Type safety

Swift is strongly, statically typed: it won't silently mix types. There are **no implicit numeric conversions** — you convert explicitly.

```swift
let apples = 3          // Int
let ratio = 2.5         // Double
// let total = apples + ratio   // ❌ can't add Int and Double
let total = Double(apples) + ratio  // 5.5
```

This feels strict coming from C or JavaScript, but it eliminates an entire family of coercion bugs (`"3" + 4`, silent truncation, `0.1 + 0.2` surprises with hidden casts).

## Numeric types & conversions

The common numeric types are `Int` (word-sized signed integer — 64-bit on modern devices), `Double` (64-bit float, the default), `Float` (32-bit), plus sized/unsigned variants (`Int32`, `UInt8`, …). You convert by constructing the target type:

```swift
let i = 7
let d = Double(i)       // 7.0
let back = Int(3.9)     // 3  — truncates toward zero, does NOT round
let clamped = UInt8(300 & 0xFF)  // wrap explicitly if you mean to
```

Two gotchas: `Int(someDouble)` **truncates** (drops the fraction), and converting a value that doesn't fit the target type (e.g. `Int8(200)`) **traps at runtime**. Use `Int(exactly:)` for a failable, non-crashing conversion.

## Tuples

A **tuple** groups several values into one compound value without defining a whole type. Great for returning multiple results.

```swift
let point = (x: 4, y: 9)         // named elements
print(point.x)                   // 4

let http = (404, "Not Found")    // unnamed — access by index
print(http.0)                    // 404

let (code, message) = http       // destructuring
print(message)                   // Not Found
```

Tuples are value types and support `==` when their elements do. They're perfect for lightweight, local grouping — but once a tuple starts being passed around or gains meaning, promote it to a `struct` with named, documented fields.

## The interview lens

The warm-up question is *"`let` vs `var`?"* — constant vs variable, and the idiom of preferring `let` for immutability and intent. Be ready to explain **why Swift has no implicit conversions**: it trades a little verbosity for the elimination of silent coercion bugs, and it makes numeric precision explicit.

A sharper follow-up: *"What does `Int(3.9)` give you?"* — `3`, because it **truncates** rather than rounds, and an out-of-range conversion **traps** (reach for `Int(exactly:)` when you can't guarantee the range). Mentioning that literals default to `Int`/`Double` (never `Float`) and that Swift enforces definite initialization rounds out a strong answer.
