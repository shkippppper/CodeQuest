## The problem: text is not an array of bytes

In many languages a string is "an array of characters" you can index with `s[5]`. Swift deliberately refuses that, because human-perceived characters (an emoji, an accented `é`, a flag) can be made of **several** Unicode code points. Treating text as a flat array leads to corrupted emoji, wrong lengths, and split characters. Swift's `String` is built to always do the right thing for real-world Unicode — at the cost of a learning curve around indices.

## String as a value type

`String` is a **struct** — a value type with copy-on-write. Assigning or passing a string copies it (cheaply, until mutation), so there's no shared-mutable-string aliasing.

```swift
var a = "hello"
var b = a
b.append("!")
print(a, b)   // hello hello!  — independent copies
```

Mutability is the usual `let`/`var` story: a `let` string can't be changed.

## Characters & grapheme clusters

A `String` is a collection of **`Character`** values, and a `Character` is an **extended grapheme cluster** — one human-perceived character, which may combine multiple Unicode scalars.

```swift
let flag = "🇬🇪"          // one Character (two regional-indicator scalars)
print(flag.count)         // 1

let e = "e\u{301}"        // "e" + combining acute accent
print(e)                  // é
print(e.count)            // 1  — one grapheme cluster
```

This is why `"é".count` is `1` even when it's stored as two scalars: `count` counts **characters** (grapheme clusters), matching what a human sees.

## Unicode & scalars

Under the grapheme layer, a string exposes several **views** at different levels:

```swift
let s = "é"                  // one Character
print(s.count)               // 1  (Characters)
print(s.unicodeScalars.count) // 2  (U+0065 + U+0301) if decomposed
print(s.utf8.count)          // number of UTF-8 bytes
print(s.utf16.count)         // number of UTF-16 code units
```

Pick the view that matches your need: `.unicodeScalars` for code points, `.utf8` for byte-level work (networking, hashing), `.utf16` when bridging to APIs that use UTF-16 offsets (like `NSRange`).

## String indices

Because characters vary in size, you **cannot** subscript a string with an `Int` — `s[5]` doesn't compile. You navigate with **`String.Index`**, obtained relative to `startIndex`/`endIndex`.

```swift
let s = "Swift"
let first = s[s.startIndex]                 // "S"
let third = s.index(s.startIndex, offsetBy: 2)
print(s[third])                             // "i"
print(s.first ?? "-", s.last ?? "-")        // S t

if let i = s.firstIndex(of: "f") {
    print(s.distance(from: s.startIndex, to: i))  // 3
}
```

Indexing is **O(n)** to reach an arbitrary position (you must walk the grapheme boundaries), which is the trade-off for Unicode correctness. `endIndex` is the "past the last character" position — not a valid subscript.

## Substrings & memory

Slicing a string yields a **`Substring`**, not a `String`. A `Substring` **shares the original string's storage** — great for cheap, allocation-free slicing while you process, but it keeps the *whole* original alive.

```swift
let big = "the quick brown fox"
let word = big.prefix(3)     // Substring "the" — shares big's buffer
```

The rule: use `Substring` for short-lived work, but convert to `String` (`String(word)`) before storing it long-term, so you don't accidentally pin a huge original string in memory for one small slice.

## Interpolation & formatting

**String interpolation** embeds values with `\( )`:

```swift
let name = "Ada"
let age = 36
let msg = "\(name) is \(age)"     // "Ada is 36"
```

For numbers and dates, prefer the modern **`formatted()` / `FormatStyle`** APIs over the old C-style `String(format:)`:

```swift
let price = 9.5
price.formatted(.currency(code: "USD"))     // "$9.50"
(0.83).formatted(.percent)                   // "83%"
```

Multi-line strings use triple quotes (`"""`), and you can write a custom `StringInterpolation` extension for domain-specific formatting.

## The interview lens

The signature question: *"Why can't you index a Swift string with an `Int`?"* Because a `Character` is an **extended grapheme cluster** of variable byte length, so there's no O(1) mapping from an integer to a character boundary — Swift uses `String.Index` (walked via `index(_:offsetBy:)`) to stay Unicode-correct, at O(n) access cost. Bonus: `"🇬🇪".count == 1` and `"é".count == 1` even though they're multiple scalars/bytes.

Be ready for *"`String` vs `Substring`"* — slicing gives a `Substring` that **shares the parent's storage** (cheap, but pins the whole original), so convert to `String` before storing long-term. And knowing the views (`unicodeScalars`, `utf8`, `utf16`) and that `String` is a **value type** rounds out a strong answer.
