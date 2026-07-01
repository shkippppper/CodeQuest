## The problem: controlling who can see what

As code grows into modules and frameworks, you need to say "this is the public API" and "this is my private plumbing — don't touch it." Access control is how Swift enforces those boundaries at **compile time**: it hides implementation details, keeps a framework's surface small and stable, and stops callers from depending on internals you might change.

## Access levels (`open` → `private`)

Swift has **five** levels, from most to least visible:

- **`open`** — usable *and subclassable/overridable* from other modules. (Classes and their members only.)
- **`public`** — usable from other modules, but **not** subclassable/overridable outside the defining module.
- **`internal`** — usable anywhere in the **same module**. This is the **default**.
- **`fileprivate`** — usable only within the **same source file**.
- **`private`** — usable only within the **enclosing declaration** (and its extensions in the same file).

```swift
open class Widget {}          // subclassable across modules
public struct Config {}       // visible across modules, not subclassable
internal func helper() {}     // default — same module
fileprivate let cache = 0     // same file
private var secret = 0        // this type/scope only
```

## `internal` is the default

If you write no access modifier, a declaration is **`internal`** — visible everywhere in your app or module, invisible outside it. For an app target (one module) that's usually exactly what you want, which is why most app code has no access keywords at all. You only reach for `public`/`open` when you're building a **framework** other modules import.

## `private` vs `fileprivate`

Both hide things, but at different granularities:

- **`private`** restricts to the **enclosing declaration** — the type itself and any of *its* extensions in the **same file**.
- **`fileprivate`** restricts to the **whole file** — other types in that file can see it too.

```swift
struct BankAccount {
    private var balance = 0.0      // only BankAccount (and its same-file extensions)

    func deposit(_ x: Double) { balance += x }
}

// Another type in the SAME file:
struct Auditor {
    func check(_ a: BankAccount) {
        // print(a.balance)   // ❌ private — not visible here
    }
}
```

Prefer **`private`** by default for encapsulation; use `fileprivate` only when two types in one file genuinely need to collaborate on a hidden member.

## `open` vs `public`

This distinction only matters for **library authors** and only for classes:

- **`public`** class — other modules can *use* it, but cannot **subclass** it or **override** its members. You keep control of the class's behavior.
- **`open`** class — other modules can subclass and override. You're explicitly inviting extension.

Making things `public` (not `open`) by default lets a framework evolve its class internals without breaking subclasses it never intended to allow. For non-class declarations there's no `open` — `public` is the top.

## Module boundaries

A **module** is a unit of distribution — an app target, or a framework/Swift package. Access control is defined *relative to* the module: `internal` = "this module", `public`/`open` = "any module that imports us". This is what lets a Swift package expose a clean API (`public`) while keeping everything else (`internal`) hidden from consumers.

A member can't be more visible than its enclosing type: a `public` method on an `internal` struct is effectively `internal`.

## Access control & testability (`@testable`)

Unit tests live in a **separate module**, so by the normal rules they could only see your `public` API — but you don't want to make everything public just to test it. The fix:

```swift
@testable import MyApp
```

`@testable import` raises the visibility of the imported module's **`internal`** declarations to the test module, so tests can reach internal types and methods without you weakening your real API. (It does **not** expose `private`/`fileprivate` — those stay hidden even from tests.)

## The interview lens

The core question is *"what are Swift's access levels and what's the default?"* — five levels `open > public > internal > fileprivate > private`, with **`internal`** the default. Nail the two subtle pairs: **`private` vs `fileprivate`** (enclosing declaration vs whole file) and **`open` vs `public`** (subclassable across modules vs not — a library-author concern).

A great follow-up is *"how do you test internal code without making it public?"* — `@testable import`, which promotes `internal` (not `private`) to the test module. Mentioning that access is defined relative to a **module** and that a member can't exceed its type's visibility shows you understand the model, not just the keywords.
