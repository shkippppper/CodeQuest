## The problem: naming a value

Run these two lines:

```swift
let pi = 3.14159
var score = 0
```

Both create a named value. But before Swift accepts either one, it wants two questions answered: *can this value ever change?* and *what type is it?*

Getting those two answers right kills a whole family of bugs before the program even runs. This lesson walks through how Swift settles both.

## `let` locks the value, `var` allows change

Try to change each one:

```swift
var score = 0
score = 10       // fine
```

`var` declares a **variable** — a name whose value you can replace whenever you like.

```swift
let pi = 3.14159
// pi = 3.14     // ❌ compile error: cannot assign to a 'let'
```

`let` declares a **constant** — a name bound to one value, forever. Reassign it and the compiler stops you on that exact line.

The Swift idiom is: `let` by default, `var` only when you truly need mutation. A `let` tells every reader "this never changes", it signals your intent, and it lets the compiler optimize.

The compiler even nudges you toward the idiom. Declare a `var` and never actually change it, and you get a warning suggesting `let`.

There's one more payoff you'll meet properly in the structs-vs-classes lesson: for value types, a `let` freezes the *entire* value — every field inside it.

## Swift figures out the type for you

Notice that none of our declarations wrote a type. Swift filled them in:

```swift
let count = 42       // Int
let price = 9.99     // Double
let name = "Ada"     // String
let flag = true      // Bool
```

Every name in Swift has exactly one type, decided at compile time and never changing afterward. But you rarely spell it out — the compiler looks at the initial value and works the type out itself. That's **type inference**.

Two defaults are worth memorizing. A whole-number literal like `42` always infers to `Int`. A decimal literal like `9.99` always infers to `Double` — never to `Float`.

## When you spell the type out yourself

Sometimes inference would pick the wrong type, so you override it:

```swift
let temperature: Double = 98
```

Without the `: Double`, the literal `98` would become an `Int`. Writing the type after the name is a **type annotation** — an explicit statement of what the type must be.

There are two other times you need one:

```swift
var note: String     // no initial value — nothing to infer from
let big: Int64 = 1   // you want a specific integer width
```

If there's no initializer, the compiler has nothing to look at, so the annotation is required. And if you need a precise numeric type like `Int64` or `Float`, you must say so — the defaults won't give it to you.

## No value may be read before it exists

Predict: does this compile?

```swift
let threshold: Int
if isProduction {
    threshold = 100
} else {
    threshold = 10
}
print(threshold)
```

Answer: yes. Every path through the `if` assigns `threshold` before `print` reads it, and the compiler can prove that. A `let` may be assigned *later* than its declaration — just exactly once.

Now delete the `else` branch. The code stops compiling: on the path where `isProduction` is false, `threshold` would be read empty. This rule is called **definite initialization** — the compiler proves that every constant and variable holds a value before its first read.

The consequence: Swift has no hidden defaults. No automatic zero, no silent empty string, no sneaky "nothing" value filled in for you. Reading an uninitialized name is a compile error — never a runtime surprise.

## Types never mix silently

Watch this fail:

```swift
let apples = 3       // Int
let ratio = 2.5      // Double
// let total = apples + ratio   // ❌ can't add Int and Double
```

Adding an `Int` to a `Double` does not compile. Swift performs no implicit numeric conversions — it will never quietly reshape one type into another behind your back.

You convert by saying so, out loud:

```swift
let total = Double(apples) + ratio   // 5.5
```

This feels strict at first. The payoff is that an entire family of silent-coercion bugs — text accidentally glued onto numbers, large values quietly squeezed into small types, decimal precision lost without a trace — simply cannot happen. The strictness is the feature.

## Converting numbers by hand

The everyday numeric types: `Int` is a signed whole number sized to the machine — 64-bit on modern devices. `Double` is the 64-bit decimal type and the default. `Float` is its 32-bit sibling, and there are sized variants like `Int32` and `UInt8` when you need exact widths.

Conversion always looks like construction — you build a value of the target type:

```swift
let i = 7
let d = Double(i)    // 7.0
```

Predict: what does this give you?

```swift
let back = Int(3.9)
```

Answer: `3`. Converting a decimal to an integer **truncates** — it drops the fraction entirely, it does not round. `Int(3.9)` and `Int(3.1)` are both `3`.

The second trap is range:

```swift
let tiny = Int8(200)   // 💥 crashes at runtime — 200 doesn't fit
```

`Int8` holds only -128 through 127. Handing it 200 doesn't wrap around or clamp — it **traps**, an immediate, deliberate crash. When you can't guarantee the value fits, use the checking form:

```swift
let maybe = Int8(exactly: 200)   // nil — no crash
```

`Int8(exactly:)` hands back an optional — a value that may be "nothing" when the conversion is impossible. Optionals have their own lesson next; for now, know this is the non-crashing escape hatch.

And if wrapping really is what you want, write it explicitly so the intent is visible:

```swift
let wrapped = UInt8(300 & 0xFF)   // 44 — wrap on purpose, in code
```

## Tuples: several values under one name

Sometimes you need to hand around two or three values together without ceremony:

```swift
let point = (x: 4, y: 9)
print(point.x)   // 4
```

A **tuple** bundles several values into one compound value — no type declaration needed. Name the elements and you read them by name.

Skip the names and you access by position instead:

```swift
let http = (404, "Not Found")
print(http.0)    // 404
```

You can also pull a tuple apart into separate constants in one line:

```swift
let (code, message) = http
print(message)   // Not Found
```

Tuples copy and compare like plain values — `==` works whenever every element supports it. Their sweet spot is small, local grouping, most famously returning two results from a single function.

One design rule: the moment a tuple starts traveling across your codebase, or its parts deserve documentation, promote it to a struct with named fields. Structs get their own lesson later.

## Common pitfalls

- **Expecting `Int(3.9)` to round.** It truncates to `3`. Call `.rounded()` on the `Double` first if rounding is what you mean.
- **Expecting a default value.** `var n: Int` followed by a read is a compile error — Swift never fills in a zero for you.
- **Expecting `Float` from a decimal literal.** `let x = 1.5` is a `Double`. Write `let x: Float = 1.5` if you genuinely need `Float`.
- **Trusting a narrowing conversion.** `Int8(someBigInt)` traps when the value doesn't fit. Reach for `Int8(exactly:)` when the range isn't guaranteed.

## Interview lens

The warm-up question is "`let` vs `var`?" Say: `let` is a constant, `var` is a variable, and the idiom is `let` by default — it documents intent, enables compiler optimizations, and for value types freezes the whole value.

If asked why Swift has no implicit conversions, say it trades a little verbosity for eliminating silent coercion bugs, and it forces numeric precision decisions to be visible in the code.

The sharper follow-up is "what does `Int(3.9)` give you?" The answer is `3` — conversion truncates, it never rounds — and an out-of-range conversion traps at runtime, which is why `Int(exactly:)` exists for values you can't vouch for.

Round out a strong answer by mentioning that literals default to `Int` and `Double` (never `Float`), and that Swift enforces definite initialization — there are no default zero-values, and reading an unassigned variable is a compile error rather than a runtime mystery.
