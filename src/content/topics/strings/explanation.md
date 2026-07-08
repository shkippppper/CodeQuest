## The problem: what is the fifth character?

Try the obvious thing:

```swift
let s = "hello"
let c = s[4]        // ❌ does not compile
```

In many languages a string is "an array of characters," and `s[4]` hands you the fifth one. Swift refuses — deliberately.

Here's why. What a human sees as *one* character — an emoji, an accented `é`, a country flag — can be built from *several* Unicode pieces under the hood. If Swift let you index by integer, position 4 could land in the *middle* of one of those characters, corrupting the emoji or splitting the accent off its letter.

Swift's `String` is designed to always do the right thing for real-world text. The price is a learning curve around how you count and navigate it. This lesson pays that price down.

## A string is a value you copy

Start with the basics of what kind of type `String` is:

```swift
var a = "hello"
var b = a          // b is a copy
b.append("!")
print(a, b)        // hello hello!
```

`b` changed; `a` didn't. `String` is a struct — a value type — so assigning it gives you an independent copy. There's no hidden sharing where mutating one string surprises code holding "the same" string elsewhere.

Copying sounds expensive, but it isn't: Swift uses **copy-on-write**, meaning the two variables quietly share one buffer until the moment one of them mutates. Only then does the real copy happen.

Mutability is the usual story: a `let` string can't be changed at all, a `var` can.

## One character can be several pieces

Now the heart of the topic. Predict what this prints:

```swift
let flag = "🇬🇪"
print(flag.count)
```

Answer: `1`. The Georgian flag is stored as *two* Unicode values — a pair of regional-indicator symbols — but Swift reports one character, because that's what a human sees.

Same story with accents:

```swift
let e = "e\u{301}"    // "e" + a combining acute accent
print(e)              // é
print(e.count)        // 1
```

Two stored values, one visible character. Swift's name for "one human-perceived character" is an **extended grapheme cluster** — a cluster of one *or more* Unicode values that render as a single character. A Swift `Character` is exactly one grapheme cluster, and `String` is a collection of `Character`s.

That's why `count` always matches what a person would count on screen, no matter how the text is stored.

## Four ways to look at the same string

The character layer is the default, but the raw pieces are still there. A string exposes several **views** — alternate read-outs of the same text at different levels of detail:

```swift
let s = "é"                       // one Character
print(s.count)                    // 1  — characters (grapheme clusters)
print(s.unicodeScalars.count)     // 2  — U+0065 "e" + U+0301 accent (decomposed form)
print(s.utf8.count)               // 3  — bytes in UTF-8 encoding
print(s.utf16.count)              // 2  — 16-bit units in UTF-16 encoding
```

Same one-character string, four different counts. Each view answers a different question.

A **Unicode scalar** is a single Unicode code point — one entry in the Unicode catalog, like `U+0301`. Use `.unicodeScalars` when you need to reason at that level.

Use `.utf8` for byte-level work — networking, hashing, file sizes. Use `.utf16` when bridging to older APIs that measure text in UTF-16 units, like `NSRange`.

Pick the view that matches the question you're asking. Mixing them up — assuming `count` equals bytes, say — is where text bugs come from.

## Walking a string with indices

Since integers can't safely address characters, Swift gives strings their own position type: **`String.Index`**. You never invent one; you derive it from the string itself:

```swift
let s = "Swift"
let first = s[s.startIndex]      // "S"
```

`startIndex` is the position of the first character. Subscripting with a valid index works fine — it's only *integer* subscripts that are banned.

To move forward, ask the string to walk:

```swift
let third = s.index(s.startIndex, offsetBy: 2)
print(s[third])                  // "i"
```

`index(_:offsetBy:)` steps through the string character by character, respecting grapheme boundaries. Because characters vary in size, reaching position *n* means walking past everything before it — this costs O(n), meaning the time grows with how far you walk. That's the trade for Unicode correctness.

Convenience accessors avoid the walk for the common cases:

```swift
print(s.first ?? "-", s.last ?? "-")     // S t
```

You can also search, then measure:

```swift
if let i = s.firstIndex(of: "f") {
    print(s.distance(from: s.startIndex, to: i))   // 3
}
```

One boundary to respect: `endIndex` is the position *past* the last character. It's a valid endpoint for ranges, but subscripting with it crashes — there's no character there.

## Slices share storage

Take a slice of a string:

```swift
let big = "the quick brown fox"
let word = big.prefix(3)      // "the"
```

Check the type of `word`: it's not a `String`. It's a **`Substring`** — a slice that *shares the original string's storage* instead of copying it. That makes slicing essentially free: no new buffer, no copying, perfect for chopping up text while you process it.

But sharing has a hidden cost. As long as `word` is alive, the *entire* `big` buffer must stay in memory — all nineteen characters, kept alive by a three-character slice. Now imagine `big` is a 10 MB log file and you kept one word from it.

The rule: use `Substring` for short-lived, local work. The moment you want to *store* a slice — in a property, an array, anywhere long-term — convert it:

```swift
let keeper = String(word)     // copies just "the"; big can now be freed
```

## Building text: interpolation and formatting

Going the other direction — assembling text from values — starts with `\( )`:

```swift
let name = "Ada"
let age = 36
let msg = "\(name) is \(age)"     // "Ada is 36"
```

This is **string interpolation**: any expression inside `\( )` is evaluated and spliced into the string.

For numbers, dates, and currencies, prefer the modern `formatted()` family over the old C-style `String(format:)`:

```swift
let price = 9.5
price.formatted(.currency(code: "USD"))   // "$9.50"
(0.83).formatted(.percent)                // "83%"
```

These format styles are locale-aware and type-checked — no `%f` placeholders to get wrong.

Two more tools round out the kit. Triple quotes give you multi-line strings:

```swift
let poem = """
    Roses are red,
    strings are hard.
    """
```

And for domain-specific formatting, you can extend `String.StringInterpolation` so your own types get custom `\( )` behavior — a niche but handy trick for logging and templating.

## Common pitfalls

- **Storing a `Substring` long-term.** It pins the whole original string in memory. Convert with `String(slice)` before keeping it.
- **Assuming `count` equals bytes or UTF-16 units.** `"🇬🇪".count` is 1; its `utf8.count` is 8. Pick the view that matches the question.
- **Subscripting with `endIndex`.** It's one past the last character — valid as a range boundary, a crash as a subscript.
- **Walking indices in a tight loop with `index(_:offsetBy:)` from `startIndex` each time.** Each walk is O(n); re-walking from the start every iteration turns a linear scan into a quadratic one. Advance one saved index instead.

## Interview lens

The signature question is "why can't you index a Swift string with an `Int`?" Answer: because a `Character` is an extended grapheme cluster — one human-perceived character made of a variable number of Unicode scalars and bytes — so there is no constant-time mapping from an integer to a character boundary. Swift makes you use `String.Index`, walked via `index(_:offsetBy:)`, trading O(n) access for guaranteed Unicode correctness. Drop in the concrete proof: `"🇬🇪".count == 1` and `"é".count == 1` even though both are multiple scalars.

Expect "what's the difference between `String` and `Substring`?" Say: slicing returns a `Substring` that shares the parent's storage — cheap to create, but it keeps the entire original alive — so you convert to `String` before storing it long-term. Naming that memory consequence, not just the type difference, is what makes the answer senior.

Round it out with the views — `unicodeScalars` for code points, `utf8` for bytes, `utf16` for `NSRange`-style bridging — and the fact that `String` is a value type with copy-on-write, so copies are independent but cheap until mutation.
