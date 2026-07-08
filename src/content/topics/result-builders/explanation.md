## The problem: statements that should add up to one value

You've seen code like this — it's how every SwiftUI screen is written:

```swift
VStack {
    Text("Title")
    Text("Subtitle")
}
```

Two statements, no commas, no `return` — yet `VStack` somehow receives *one* combined value describing both texts.

Plain Swift can't do that. In a normal closure, only the final expression can become the result; the lines before it are just statements that get evaluated and dropped:

```swift
let makeGreeting = {
    "Hello"    // warning: unused
    "world"    // only this could be the result
}
```

There's no built-in way for a block of statements to *accumulate* into a single value. **Result builders** are the compiler feature that adds exactly that — and they're the machinery under SwiftUI's `ViewBuilder`. SwiftUI itself has its own lessons; here we take the machinery apart.

## A builder turns statements into arguments

A result builder is a type whose static methods the compiler calls to fold a block of statements into one value. Here's the smallest possible one:

```swift
@resultBuilder
enum StringBuilder {
    static func buildBlock(_ parts: String...) -> String {
        parts.joined(separator: " ")
    }
}
```

The `@resultBuilder` attribute marks the type. **`buildBlock`** is the one required method: it receives the block's statements as arguments and combines them.

Now attach the builder to a function:

```swift
@StringBuilder
func greeting() -> String {
    "Hello"
    "there"
    "world"
}
```

Predict: what does `greeting()` return?

Answer: `"Hello there world"` — not `"world"`. The three statements weren't evaluated-and-dropped. The compiler rewrote the body.

## The rewrite, spelled out

What the compiler actually generated is roughly this:

```swift
func greeting() -> String {
    let v0 = "Hello"
    let v1 = "there"
    let v2 = "world"
    return StringBuilder.buildBlock(v0, v1, v2)
}
```

That's the entire trick. Each expression in the block becomes an argument; the builder's method folds them into one value; that value is returned. Everything else about result builders is variations on this rewrite.

## Teaching the builder control flow

Try adding an `if` to the body:

```swift
@StringBuilder
func greeting(polite: Bool) -> String {
    "Hello"
    if polite { "dear" }   // ❌ error: StringBuilder doesn't support this
    "world"
}
```

It doesn't compile. An `if` without an `else` might produce nothing, and `buildBlock` alone doesn't know what "nothing" looks like. The builder needs another method:

```swift
@resultBuilder
enum StringBuilder {
    static func buildBlock(_ parts: String...) -> String {
        parts.joined(separator: " ")
    }
    static func buildOptional(_ part: String?) -> String {
        part ?? ""
    }
}
```

Now the `if` compiles: the compiler wraps the branch's value in an optional and passes it to `buildOptional`.

Each piece of syntax maps to its own optional method:

- `buildOptional(_:)` — an `if` with no `else`.
- `buildEither(first:)` / `buildEither(second:)` — the two branches of an `if`/`else`, and `switch` cases.
- `buildArray(_:)` — the accumulated results of a `for` loop.
- `buildExpression(_:)` — transforms each individual expression before combining, which lets a builder accept several input types.
- `buildFinalResult(_:)` — one last transform on the assembled value.
- `buildLimitedAvailability(_:)` — handles `if #available`.

You implement only what your syntax needs. And the rule cuts both ways: if a builder doesn't implement a method, that syntax is a *compile error* inside it. No `buildArray` means no `for` loops in that builder — that's why some builder-based APIs allow loops and others don't. `guard` and early `return` are never part of the transform, in any builder.

## ViewBuilder is exactly this

SwiftUI's `@ViewBuilder` is a result builder whose values are views. Map the methods:

```swift
struct MyView: View {
    var body: some View {          // body is implicitly @ViewBuilder
        Text("a")                  // an expression
        if flag {
            Text("b")              // buildEither(first:)
        } else {
            Image(systemName: "x") // buildEither(second:)
        }
    }
}
```

`buildBlock` combines the children into a `TupleView` — a view that just holds its parts. `buildEither` wraps the two branches in `_ConditionalContent`, a view that holds *either* one type *or* the other.

That last detail answers a common puzzle: how can an `if`/`else` inside `body` have a `Text` in one branch and an `Image` in the other, when `some View` demands one concrete type? Because the result *is* one concrete type — `_ConditionalContent<Text, Image>` — built by `buildEither`. The comma-free statements, the limited `if`/`switch`, the whole `VStack { }` feel: all of it is the result-builder rewrite.

## Build a custom DSL

A **DSL** — domain-specific language — is a mini-language shaped for one job, hosted inside Swift's syntax. Result builders are Swift's DSL toolkit. Let's build one for HTML.

First a value to build:

```swift
enum HTML {
    case element(String, HTML)
    case fragment([HTML])
    case text(String)
    case empty
}

func p(_ s: String) -> HTML { .element("p", .text(s)) }
```

Then the builder — just the methods our syntax needs:

```swift
@resultBuilder
enum HTMLBuilder {
    static func buildBlock(_ children: HTML...) -> HTML { .fragment(Array(children)) }
    static func buildOptional(_ child: HTML?) -> HTML { child ?? .empty }
    static func buildEither(first child: HTML) -> HTML { child }
    static func buildEither(second child: HTML) -> HTML { child }
}
```

Finally, attach the builder to a closure parameter — the same way `VStack` does:

```swift
func div(@HTMLBuilder _ content: () -> HTML) -> HTML {
    .element("div", content())
}

div {
    p("Hello")
    if loggedIn { p("Welcome back") }   // works: we implemented buildOptional
}
```

Because there's no `buildArray`, a `for` loop inside `div { }` won't compile — our DSL simply doesn't offer it. This same pattern powers HTML libraries, regex builders, `AttributedString` builders, and test-case builders.

## Common pitfalls

- **Expecting the last expression to be the result.** In a builder body, *every* expression feeds `buildBlock`. The rewrite changes the rules of the block.
- **Writing `for` or `guard` and blaming yourself.** A missing `buildArray` forbids loops; `guard` and early `return` are forbidden everywhere. The error is about the builder's vocabulary, not your logic.
- **Reaching for `AnyView` to make `if`/`else` branches "match."** `buildEither` already handles differing branch types via `_ConditionalContent` — erasing is usually unnecessary.
- **Forgetting `buildEither` comes in pairs.** Implement `first:` and `second:` together, or `if`/`else` won't compile.

## Interview lens

If asked what a result builder is, lead with the rewrite: a `@resultBuilder` type whose static methods the compiler uses to fold the statements of a marked closure into a single value — each expression becomes an argument to `buildBlock` and friends. Saying "the compiler rewrites the body" is the phrase that shows you know it's a compile-time transform, not runtime magic.

Name the method mapping, because that's the usual follow-up: `buildOptional` for a lone `if`, `buildEither` for `if`/`else` and `switch`, `buildArray` for `for` — and the key rule that an unimplemented method makes that syntax a compile error in that DSL.

The headline connection is SwiftUI: `@ViewBuilder` is a result builder, `buildBlock` produces a `TupleView`, and `buildEither` produces `_ConditionalContent` — which is precisely why `if`/`else` branches in `body` can be different view types while `body` stays `some View`. If you can also sketch a tiny custom DSL — an HTML or test builder with three methods — you've demonstrated the senior version of this answer.
