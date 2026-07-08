## The problem: strangers touching your internals

Imagine you ship this type in a framework:

```swift
struct BankAccount {
    var balance = 0.0        // anyone can set this to anything
}
```

Any code that imports your framework can now write `account.balance = -5000` and skip every rule you meant to enforce. Worse: once outsiders depend on `balance` being a settable property, you can never restructure it without breaking them.

**Access control** is Swift's answer: keywords that declare *who is allowed to see and use each declaration*, enforced by the compiler. It hides your plumbing, keeps a framework's public surface small, and stops callers from depending on internals you might change tomorrow.

## The five levels, from widest to narrowest

Here they all are in one place:

```swift
open class Widget {}          // usable AND subclassable from other modules
public struct Config {}       // usable from other modules, not subclassable there
internal func helper() {}     // usable anywhere in the same module — the default
fileprivate let cache = 0     // usable only within this source file
private var secret = 0        // usable only within the enclosing declaration
```

Read them as answers to "who can touch this?":

- `open` — anyone, anywhere, including subclassing and overriding from outside. Classes and class members only.
- `public` — anyone can *use* it from other modules, but subclassing and overriding stay locked to your module.
- `internal` — anyone in the *same module*. This is what you get when you write nothing.
- `fileprivate` — only code in the *same source file*.
- `private` — only the *enclosing declaration* itself, plus its extensions in the same file.

One word needs defining before any of this makes sense. A **module** is a unit of code that's built and imported as one thing — your app target, a framework, or a Swift package. Every access level is measured relative to module boundaries.

## You've been using internal all along

Look at ordinary app code:

```swift
struct Order {              // no keyword — internal
    var items: [String] = []
    func total() -> Double { 0 }
}
```

No access keywords anywhere, yet this compiles and works everywhere in your app. That's because the default level is `internal`: visible throughout your module, invisible outside it.

An app target is a single module, so for app code `internal` is usually exactly right — which is why most app code has no access keywords at all.

You only reach for `public` and `open` when you build a *framework* — a module other modules import. Then the keywords become your API contract: `public` marks the supported surface, everything else stays hidden.

## private vs fileprivate

Both hide a member, but they draw the fence at different distances. Watch:

```swift
struct BankAccount {
    private var balance = 0.0

    func deposit(_ x: Double) { balance += x }   // ✅ inside the type
}
```

`private` means "only the enclosing declaration" — `BankAccount` itself can use `balance`, and so can extensions of `BankAccount` *in this same file*.

Now add a second type in the *same file*:

```swift
struct Auditor {
    func check(_ a: BankAccount) {
        print(a.balance)      // ❌ private — Auditor can't see it, same file or not
    }
}
```

The auditor is locked out. If you *want* neighboring types in one file to collaborate on a hidden member, that's what `fileprivate` is for:

```swift
struct BankAccount {
    fileprivate var balance = 0.0    // whole file can see it now
}

struct Auditor {
    func check(_ a: BankAccount) {
        print(a.balance)             // ✅ same file
    }
}
```

The habit to build: default to `private`, and widen to `fileprivate` only when two types in one file genuinely need to share a secret.

## open vs public

This pair only matters for classes, and mostly for library authors. Start with `public`:

```swift
// Inside framework "DrawKit"
public class Renderer {
    public func render() {}
}
```

An app that imports DrawKit can create a `Renderer` and call `render()`. But try this in the app:

```swift
class MyRenderer: Renderer {}     // ❌ cannot subclass a public class
                                  //    from outside its module
```

Blocked. `public` grants *use*, not *extension by inheritance*. The framework keeps full control over how `Renderer` behaves.

To invite subclassing, the author must opt in with `open`:

```swift
public class Renderer {}          // use only
open   class Renderer {}          // use + subclass + override, from anywhere
```

Why default to the stricter one? Every subclass someone writes is a constraint on you: change your class's internals and you may break overrides you never intended to allow. `public`-not-`open` lets a framework evolve freely.

For structs, enums, and everything non-class, there is no `open` — `public` is the top, because there's no inheritance to control.

## Rules at the module boundary

Access levels interact with the things that contain them. Predict: this method is marked `public` — can another module call it?

```swift
internal struct Parser {          // internal type
    public func parse() {}        // "public" method… really?
}
```

Answer: no. A member can never be *more* visible than its enclosing type. Other modules can't see `Parser` at all, so its "public" method is effectively `internal`. The compiler allows the mismatch but the wider level is meaningless.

This is the mental model for packages and frameworks: mark the intended API `public` (or `open`), leave everything else `internal`, and the module boundary does the rest — consumers see a clean surface, your internals stay free to change.

## Testing internal code without exposing it

Unit tests live in their *own* module — a separate test target. By the normal rules, tests could only see your `public` API:

```swift
import MyApp                     // tests see only public declarations

// helper() is internal — invisible here ❌
```

Making everything `public` just for tests would wreck your API. The escape hatch is one keyword:

```swift
@testable import MyApp           // internal declarations now visible ✅
```

**`@testable import`** raises the imported module's `internal` declarations to visible-in-tests, so you can exercise internal types and functions without weakening the real API.

Note the limit: it promotes `internal` only. `private` and `fileprivate` members stay hidden even from tests — if you find yourself wanting to test one directly, that's usually a hint to test through the type's visible behavior instead.

## Common pitfalls

- **Marking members `public` inside an `internal` type and expecting them to be visible.** A member can't exceed its type's visibility; make the type `public` too.
- **Using `fileprivate` out of habit.** `private` already covers the type *and its same-file extensions*; `fileprivate` is only needed when a *different* type in the file must see the member.
- **Making a framework class `open` "to be safe."** It's the opposite of safe: you've promised to support arbitrary subclasses forever. Start `public`, open up only on demand.
- **Making things `public` so tests can reach them.** That's what `@testable import` is for.

## Interview lens

The core question is "name Swift's access levels and the default." Answer: five levels — `open`, `public`, `internal`, `fileprivate`, `private` — from widest to narrowest, and the default is `internal`, meaning visible throughout the module.

Two pairs carry the follow-ups. For `private` vs `fileprivate`, say: `private` is the enclosing declaration plus its same-file extensions; `fileprivate` is the whole file, including other types in it. For `open` vs `public`, say: both are visible across modules, but only `open` permits subclassing and overriding from outside — a distinction that exists so framework authors can expose a class without committing to support external subclasses.

When asked "how do you test internal code without making it public?", the answer is `@testable import`, and the senior detail is its limit: it promotes `internal` to the test module but never `private` or `fileprivate`.

Round out any answer by framing access control as *module-relative* — `internal` means "this module," `public`/`open` mean "any importer" — and mention that a member's effective visibility is capped by its enclosing type. Those two points show you understand the model, not just the keywords.
