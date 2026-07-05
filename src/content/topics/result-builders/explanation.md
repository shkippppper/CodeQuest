## The problem: a block of statements that becomes one value

`VStack { Text("a"); Text("b"); if flag { Text("c") } }` reads like imperative statements, but it *produces* a single composed value. Plain Swift can't do that — a block of expressions doesn't return a combined result. **Result builders** (`@resultBuilder`) are the compiler feature that transforms the statements inside a marked closure into calls that **assemble one value**. They're the machinery behind SwiftUI's `ViewBuilder`, and you can build your own DSLs with them.

## What result builders do

A **`@resultBuilder`** is a type that defines **static methods** the compiler calls to combine the statements in a builder closure. When a closure or function is annotated with a result builder, the compiler **rewrites** its body: each expression becomes an argument, and the builder's methods fold them into a single return value.

```swift
@resultBuilder
enum StringBuilder {
    static func buildBlock(_ parts: String...) -> String {
        parts.joined(separator: " ")
    }
}

@StringBuilder
func greeting() -> String {
    "Hello"
    "there"
    "world"
}
greeting()   // "Hello there world"
```

The three statements aren't three returns — the compiler feeds them to `buildBlock` and returns its result.

## `buildBlock` & friends

`buildBlock` is required (combine sibling statements). To support control flow and richer bodies, you implement optional methods:

- **`buildBlock(_:)`** — combine the statements in a block.
- **`buildOptional(_:)`** — an `if` **without** `else` (may be nil).
- **`buildEither(first:)` / `buildEither(second:)`** — the two branches of an `if/else` (and `switch`).
- **`buildArray(_:)`** — a `for` loop's accumulated results.
- **`buildExpression(_:)`** — transform each individual expression before it's combined (lets you accept multiple input types).
- **`buildFinalResult(_:)`** — a final transform on the assembled value.
- **`buildLimitedAvailability(_:)`** — handle `if #available`.

You implement only the ones your DSL needs; the compiler wires the corresponding syntax to them.

## How `ViewBuilder` works

SwiftUI's **`@ViewBuilder`** is just a result builder whose `Component` is `some View`. `buildBlock` combines child views into a `TupleView`; `buildEither`/`buildOptional` produce `_ConditionalContent`/optional views — which is why an `if` inside a `VStack` compiles, and why the branches can be different view types (they're wrapped in `_ConditionalContent`). The reason a `VStack { }` closure takes comma-free statements with limited `if`/`switch` is entirely the result-builder transform.

```swift
struct MyView: View {
    var body: some View {          // body is @ViewBuilder
        Text("a")
        if flag { Text("b") }      // buildOptional
        else    { Text("c") }      // buildEither
    }
}
```

## Building a custom DSL

Annotate a parameter or function with your builder and implement the methods for the syntax you want:

```swift
@resultBuilder
enum HTMLBuilder {
    static func buildBlock(_ children: HTML...) -> HTML { .fragment(Array(children)) }
    static func buildOptional(_ c: HTML?) -> HTML { c ?? .empty }
    static func buildEither(first c: HTML) -> HTML { c }
    static func buildEither(second c: HTML) -> HTML { c }
}

func div(@HTMLBuilder _ content: () -> HTML) -> HTML { .element("div", content()) }

div {
    p("Hello")
    if loggedIn { p("Welcome") }
}
```

This pattern powers HTML/DSL libraries, test builders, `AttributedString` builders, regex builders, etc.

## Control flow in builders

The builder methods are exactly what enable control flow inside a builder closure: `if` → `buildOptional`, `if/else` and `switch` → `buildEither`, `for` → `buildArray`, `if #available` → `buildLimitedAvailability`. **If a builder doesn't implement the corresponding method, that syntax isn't allowed** — e.g. no `buildArray` means you can't write a `for` loop in that DSL. This is why some builders support loops and others don't. You **can't** use `guard`, and early `return`/arbitrary statements aren't part of the transform.

## The interview lens

Explain a result builder as a **`@resultBuilder` type whose static methods the compiler uses to fold the statements of a marked closure into a single value** — the compiler *rewrites* the body (each expression → an argument to `buildBlock` and friends). Name **`buildBlock`** (required) and that **control flow maps to specific methods**: `buildOptional` (`if`), `buildEither` (`if/else`/`switch`), `buildArray` (`for`) — and that unsupported methods mean that syntax is disallowed.

The headline connection: **SwiftUI's `@ViewBuilder` is a result builder** — `buildBlock` makes a `TupleView`, `buildEither`/`buildOptional` make `_ConditionalContent` (why `if`/`else` branches can be different view types), which is exactly why `VStack { }` accepts comma-free statements with limited conditionals. Bonus: you build your own DSLs (HTML, tests, regex) by implementing just the builder methods your syntax needs.
