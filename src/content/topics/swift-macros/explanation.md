## The problem: boilerplate you write by hand, over and over

Here's a struct that needs to expose a URL built from its parts:

```swift
struct Endpoint {
    let host: String
    let path: String
}
```

Every type like this needs the same tedious extras: an initializer, maybe a `CodingKeys` enum, maybe an `==`. You either type them by hand — and keep them in sync forever — or you reach for a runtime trick.

The runtime tricks all have a cost. Reflection (`Mirror`) inspects your type *while the app runs*, so mistakes surface as crashes, not compiler errors. Code generators like Sourcery run *outside* the compiler, as a separate build step you have to wire up and trust. Both push work to a place where the compiler can't check it.

**Swift macros** close that gap. A macro is code that generates *more code at compile time* — the generated code is real Swift the compiler sees, type-checks, and shows you. This lesson is about how they work and where each kind fits.

## Your first macro: expanding an expression

Swift ships some macros already. The simplest to feel is `#warning`:

```swift
#warning("Refactor this before shipping")
```

That `#name(...)` syntax — a hash, a name, arguments — is a **freestanding macro**. It stands on its own as an expression or statement. At compile time it expands into something else; `#warning` expands into a compiler diagnostic.

A more useful built-in is `#function`, and the classic teaching example, `#stringify`:

```swift
let (value, text) = #stringify(1 + 2)
// value == 3
// text  == "1 + 2"
```

One call produced *two* things: the evaluated result `3`, and the **source text** `"1 + 2"` as a string. That second part is the whole point. The macro received the syntax `1 + 2` — not the number 3 — and could read it as text. A normal function can never see the source you passed it; a macro can.

## Macros operate on syntax, not values

Hold onto that idea, because it is the mental model for everything else.

```swift
#stringify(1 + 2)
```

When the compiler hits this line, it does **not** run `1 + 2`. It hands the macro a tree describing the code — "an addition of the literals 1 and 2." The macro's job is to return a *new* tree of code. The compiler then drops that new code in place of the macro call and compiles it normally.

So a macro is a small program that runs *during* compilation, takes code as input, and returns code as output. Reading and rewriting code as data like this is called **metaprogramming** — programming that operates on programs. Macros are Swift's type-safe way to do it.

## Freestanding vs attached: the two families

There are exactly two shapes a macro can take, and the syntax tells you which.

A **freestanding macro** starts with `#` and appears where an expression or declaration would:

```swift
let url = #URL("https://swift.org")   // freestanding: produces a value
```

An **attached macro** starts with `@` and attaches to a declaration — a type, a property, a function — adding to it:

```swift
@Observable          // attached: modifies the class it sits on
class Model { }
```

The rule of thumb: use freestanding when you want to *produce* something new at a call site, and attached when you want to *augment* a declaration the programmer already wrote. The `@Observable` you use in SwiftUI is an attached macro; it rewrites your class to track property access.

## Attached macros come in roles

"Augment a declaration" is vague, so attached macros declare a **role** that says exactly what they add. Three roles cover most real use.

A **member** macro adds new members inside the type:

```swift
@AddInit
struct Endpoint {
    let host: String
    let path: String
    // the macro inserts:  init(host: String, path: String) { ... }
}
```

The macro reads the stored properties and generates the matching initializer as a new member.

A **peer** macro adds declarations *beside* the one it's attached to:

```swift
@AddCompletionHandler
func fetch() async -> Data { ... }
// the macro inserts a peer:
// func fetch(completion: @escaping (Data) -> Void) { ... }
```

One `async` function, and a second callback-style function appears next to it — same body, bridged automatically.

An **extension** (conformance) macro adds a protocol conformance and its requirements:

```swift
@AddEquatable
struct Point { let x: Int; let y: Int }
// the macro inserts:  extension Point: Equatable { static func == ... }
```

A single attached macro can play several roles at once. `@Observable` is a member macro *and* an extension macro: it injects tracking members and conforms the class to the `Observable` protocol in one shot.

## What the compiler guarantees: macros are additive

Predict this: can a macro attached to your struct *delete* one of its properties, or change a property's type?

Answer: no. Macros can only **add** code — new members, new peers, new conformances. They never modify or remove what you wrote. Your original declaration always stays exactly as typed, and the macro's output sits alongside it.

That single rule is why macros are safe to read. When you see:

```swift
@AddInit
struct Endpoint {
    let host: String
    let path: String
}
```

you know `Endpoint` still has exactly `host` and `path`, unchanged. The macro can only have *added* things. In Xcode you can right-click the macro and "Expand Macro" to see every line it generated — because it's real source, there are no hidden surprises.

## Where the macro's code actually lives

Here's the part that trips people up in interviews. The macro *implementation* does not ship in your app.

A macro is two pieces in two places:

```swift
// 1. The declaration — in your app target, this is what users call:
@freestanding(expression)
macro stringify<T>(_ value: T) -> (T, String)
    = #externalMacro(module: "MyMacrosPlugin", type: "StringifyMacro")
```

The `macro` keyword declares the name and signature. The `#externalMacro(...)` part points at where the real work lives.

```swift
// 2. The implementation — in a SEPARATE compiler-plugin module:
struct StringifyMacro: ExpressionMacro {
    static func expansion(...) -> ExprSyntax {
        // reads the input syntax, builds and returns new syntax
    }
}
```

That plugin module is a build-time tool. The compiler loads it, runs it to expand your macros, and then throws it away. It compiles into the *compiler's* process — never into your app binary. So a macro adds zero runtime weight: by the time your app runs, only the generated Swift remains.

The implementation is built on **SwiftSyntax**, Apple's library for representing Swift source as a tree of typed nodes. Writing a macro means taking `SwiftSyntax` nodes in and returning `SwiftSyntax` nodes out.

## Macros report errors like the compiler does

Because a macro runs inside compilation, it can *fail* compilation with a real diagnostic:

```swift
@AddInit
enum Direction { case north, south }   // error: @AddInit only supports structs
```

A well-written macro inspects the syntax it was given and, if it can't handle it, emits a compiler error pointing at the offending line — exactly like a built-in error. The programmer sees a red mark in Xcode at compile time, not a crash at runtime. This is the core advantage over reflection: mistakes are caught before the app ever runs.

## Common pitfalls

- **Thinking the macro runs at runtime.** It runs during compilation and produces source. At runtime there is no macro, only the generated code.
- **Expecting a macro to change existing code.** Macros are purely additive — they add members, peers, and conformances; they never edit or delete what you wrote.
- **Forgetting the two-module split.** The `macro` declaration lives with your code; the implementation lives in a separate compiler-plugin target and never links into the app.
- **Reaching for a macro when a function or generic will do.** Macros earn their cost only when you truly need to generate code from *syntax* (like reading a type's stored properties). For ordinary logic, a function is simpler and cheaper.

## Interview lens

If asked "what is a Swift macro?", give the one-sentence core first: it's code that runs at compile time, takes your source as syntax, and generates additional Swift the compiler then type-checks. Stress *compile time* and *additive* — those two words separate macros from reflection and from code editing.

The expected follow-up is "freestanding vs attached." Say: freestanding macros start with `#` and produce an expression or declaration at a call site; attached macros start with `@` and augment a declaration, in roles like member, peer, and extension. Name `@Observable` as a real attached macro they've used.

If they push on *why* macros over the alternatives, hit three points: errors surface at compile time not runtime (unlike `Mirror` reflection), there's no separate build tool to wire up (unlike Sourcery), and there's zero runtime cost because the plugin never ships in the binary. Mentioning that the implementation is a separate SwiftSyntax-based plugin module signals you've actually looked under the hood.
