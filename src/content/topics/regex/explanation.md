## The problem: pulling structure out of text by hand

You have a line like `"SKU-42: $9.99"` and you need three things out of it: the id `42`, and the price `9.99`. The obvious approach is to slice the string by hand:

```swift
let line = "SKU-42: $9.99"
let afterDash = line.dropFirst(4)          // "42: $9.99"
let id = afterDash.prefix { $0.isNumber }  // "42"
// ...and now find the "$", drop it, parse the rest...
```

Every step is a chance to be off by one character. Change the format slightly — `"SKU-42:$9.99"` with no space — and the whole thing quietly breaks. This is fiddly, and it fails silently.

A **regular expression** (regex) is a compact pattern that describes what the text *looks like*, so you can match and extract in one shot instead of counting characters. Swift has a modern, type-checked version of this. That's what this lesson is about.

## A regex literal is checked when you build the app

Write a pattern between two slashes:

```swift
let digits = /\d+/
```

`\d` means "any digit", and `+` means "one or more of the thing before it". So `/\d+/` matches a run of one or more digits. The type of `digits` is `Regex<Substring>`.

The important part is *when* Swift looks at this pattern. A **regex literal** — the `/.../` form — is compiled and type-checked at **compile time**, meaning while you build the app, not while it runs. If you typo the pattern into something malformed, you get a build error on that line, the same as any other syntax mistake:

```swift
let bad = /\d+(/      // build error: the group is never closed
```

You find out immediately, at your desk — not from a crash on a user's phone.

## When the pattern isn't known until runtime

Sometimes you don't have the pattern while writing code — a user types it into a search box, or you read it from a config file. You can't write that as a literal because it doesn't exist yet. Build it from a string instead:

```swift
let userInput = "\\d+"                 // came from somewhere at runtime
let re = try Regex(userInput)
```

`Regex(_:)` takes a `String` and returns a regex. Because the string might be a malformed pattern, this initializer can **throw** — hence the `try`. That's the trade: a literal catches mistakes at build time, but a runtime `Regex(String)` can only discover them when it runs, so it hands you an error to handle.

Reach for the literal whenever the pattern is fixed. Reach for `Regex(String)` only when the pattern genuinely isn't known until the program is running.

## Asking a string whether it matches

A regex on its own does nothing — you point it at some text. The core methods:

```swift
let text = "order 42 shipped"
let re = /\d+/

let first = text.firstMatch(of: re)   // the first place the pattern hits
let whole = text.wholeMatch(of: re)   // matches ONLY if the pattern covers the entire string
```

`firstMatch(of:)` scans left to right and stops at the first hit. `wholeMatch(of:)` succeeds only when the pattern describes the *whole* string end to end — here it returns `nil`, because `"order 42 shipped"` is more than just digits. Both return an optional, so you unwrap with `if let`:

```swift
if let match = text.firstMatch(of: re) {
    print(match.0)     // "42"
}
```

To work with *every* occurrence, `matches(of:)` gives you a collection, and `replacing(_:with:)` swaps them out:

```swift
let all = "a1 b2 c3".matches(of: /\d/)          // three matches: 1, 2, 3
let hidden = "call 555-1234".replacing(/\d/, with: "*")   // "call ***-****"
```

## Captures come back as a typed tuple

A pair of parentheses inside a pattern is a **capture group** — a piece you want to pull out separately, not just confirm is there. Here we capture the digits after the dash:

```swift
let re = /SKU-(\d+)/
let match = "SKU-42".firstMatch(of: re)
```

Now look at `match.output`. This is the payoff over old regex libraries. Instead of asking for "group number 1" by an integer and getting back a maybe-nil string, the captures arrive as a **typed tuple**:

```swift
if let match = "SKU-42".firstMatch(of: re) {
    let whole = match.output.0   // "SKU-42"  — the entire match
    let id    = match.output.1   // "42"      — the first capture group
}
```

Element `.0` is always the **whole match**, and each capture group follows in order: `.1`, `.2`, and so on. The compiler knows exactly how many pieces there are and what each one is, so there's no group-index guesswork and no stringly-typed lookups.

Now predict this one. A pattern has *two* capture groups:

```swift
let re = /(\w+)=(\d+)/
let match = "count=42".firstMatch(of: re)
```

What is the type of `match!.output`?

Answer: `(Substring, Substring, Substring)`. One slot for the whole match, then one per capture group. Two groups means three slots. The compiler counts your parentheses for you and builds the tuple to fit.

## RegexBuilder: the same pattern, readable top to bottom

Cryptic patterns like `/(\w+)=(\d+)/` are hard to read and harder to edit six months later. **RegexBuilder** is a domain-specific language — a mini-language built with Swift code — that spells the same pattern out as a block you read line by line:

```swift
import RegexBuilder

let re = Regex {
    OneOrMore(.digit)
    "-"
    OneOrMore(.digit)
}
```

Each line is one piece of the pattern, in order: some digits, then a literal `"-"`, then more digits. `OneOrMore(.digit)` is the readable spelling of `\d+`; a plain `"-"` in the block matches that character literally. It reads like a description of the text.

To pull a piece out, wrap it in `Capture`:

```swift
let re = Regex {
    "SKU-"
    Capture { OneOrMore(.digit) }
}
```

That `Capture` adds a slot to `output` exactly like parentheses did — `match.output.1` is the captured digits.

### TryCapture parses straight into the type you want

A capture normally hands back a `Substring`, so you'd still convert `"42"` into an `Int` yourself. **TryCapture** folds that step in: you give it a transform, and if the transform returns `nil` the whole match fails.

```swift
let re = Regex {
    "SKU-"
    TryCapture {
        OneOrMore(.digit)
    } transform: { substr in
        Int(substr)          // returns Int?, so a non-number kills the match
    }
}
```

Now the capture in `output` is a real `Int`, not a `Substring`. The parsing and the matching happen together: if the transform can't produce a value, there's no half-parsed result to clean up — the match simply didn't happen.

## Putting it together: parsing one line end to end

Back to the original problem — `"SKU-42: $9.99"` into a typed id and price:

```swift
import RegexBuilder

let re = Regex {
    "SKU-"
    TryCapture { OneOrMore(.digit) } transform: { Int($0) }
    ": $"
    TryCapture {
        OneOrMore(.digit)
        "."
        OneOrMore(.digit)
    } transform: { Double($0) }
}
```

Two `TryCapture` blocks, one per field. Run it:

```swift
if let match = "SKU-42: $9.99".firstMatch(of: re) {
    let id: Int = match.output.1       // 42, a real Int
    let price: Double = match.output.2 // 9.99, a real Double
    print(id, price)
}
```

```output
42 9.99
```

No manual slicing, no off-by-one, no stray `String`-to-`Int` conversions scattered around. If the line's shape doesn't match, `firstMatch` returns `nil` and you handle that one case in the `if let`. That's the whole pitch: describe the shape once, get typed fields out.

## Common pitfalls

- **Using `wholeMatch` when you meant `firstMatch`.** `wholeMatch` demands the pattern cover the *entire* string; if there's anything extra it returns `nil`. To find a pattern *inside* a longer string, use `firstMatch` or `matches`.
- **Forgetting `try` on a runtime pattern.** `Regex(someString)` can throw on a malformed pattern. A literal `/.../` never needs `try`, so it's easy to forget the runtime form does.
- **Reaching for `.0` when you wanted a capture.** `.0` is the whole match; your first capture is `.1`. Off-by-one here gives you the entire matched span instead of the piece you wanted.

## Interview lens

If asked why Swift's regex is better than the old `NSRegularExpression`, lead with two words: *typed* and *compile-checked*. A literal `/\d+/` is validated when you build, so a bad pattern is a build error, not a runtime surprise; and captures come back as a typed tuple in `match.output`, so there's no "group at index 1 as an optional string" dance.

Expect a follow-up on literals versus `Regex(String)`. Say: use the literal when the pattern is fixed and known while writing code, because you get compile-time checking for free; use `try Regex(_:)` only when the pattern arrives at runtime, and be ready to handle the throw.

If they ask about readability or maintenance, bring up RegexBuilder — it turns a cryptic one-liner into a block you read top to bottom, and `TryCapture` with a transform parses a field straight into an `Int` or `Double` as part of matching. Mentioning that the transform returning `nil` fails the match shows you understand it's parse-and-validate in one step, not two.
