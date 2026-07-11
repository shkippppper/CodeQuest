## The problem: `init` ties you to one concrete type

Say a checkout screen needs to build a payment processor:

```swift
let processor = StripeProcessor()
processor.charge(amount: 4200)
```

That single line quietly commits the whole screen to `StripeProcessor`. If the app later needs `ApplePayProcessor` for some users and `StripeProcessor` for others, every call site that wrote `StripeProcessor()` has to change. Worse, a test that wants to fake payment can't — the concrete initializer is baked right into the code that uses it.

A **factory** is a piece of code whose one job is deciding *which* concrete type to build and handing back the result — so the rest of the app depends only on what that result can do, not on how it was made.

## Factory method: let a function decide

Start by pulling the decision out into one function:

```swift
protocol PaymentProcessor {
    func charge(amount: Int)
}

struct StripeProcessor: PaymentProcessor {
    func charge(amount: Int) { print("Charged \(amount) via Stripe") }
}

struct ApplePayProcessor: PaymentProcessor {
    func charge(amount: Int) { print("Charged \(amount) via Apple Pay") }
}
```

Now write the factory method itself — a function whose return type is the **protocol**, not any one concrete type:

```swift
func makeProcessor(for method: String) -> PaymentProcessor {
    switch method {
    case "applePay": return ApplePayProcessor()
    default:         return StripeProcessor()
    }
}
```

The caller now writes this instead:

```swift
let processor = makeProcessor(for: "applePay")
processor.charge(amount: 4200)
```

Predict: does the caller's code need to change if you add a `PayPalProcessor` case next month?

Answer: no. `makeProcessor` gets one new `case`, and every call site — which only ever saw `PaymentProcessor` — keeps compiling untouched. That's the whole point: the decision of *which* type to construct lives in exactly one place.

## Abstract factory: a whole family of related objects

A single factory method picks one object. An **abstract factory** is a protocol whose job is to produce several *related* objects that need to agree with each other — a family, not a single item.

Picture a UI kit that must render consistently in either a light or dark theme:

```swift
protocol ButtonStyle { func render() -> String }
protocol BackgroundStyle { func render() -> String }

protocol ThemeFactory {
    func makeButtonStyle() -> ButtonStyle
    func makeBackgroundStyle() -> BackgroundStyle
}
```

Each concrete factory builds one *matching* family:

```swift
struct DarkButtonStyle: ButtonStyle { func render() -> String { "dark button" } }
struct DarkBackgroundStyle: BackgroundStyle { func render() -> String { "dark background" } }

struct DarkThemeFactory: ThemeFactory {
    func makeButtonStyle() -> ButtonStyle { DarkButtonStyle() }
    func makeBackgroundStyle() -> BackgroundStyle { DarkBackgroundStyle() }
}
```

A screen that's handed a `ThemeFactory` never has to check "am I in dark mode?" before building each piece — it just asks the factory for both pieces, and the factory guarantees they match:

```swift
func buildScreen(using factory: ThemeFactory) {
    let button = factory.makeButtonStyle()
    let background = factory.makeBackgroundStyle()
    print(button.render(), background.render())
}

buildScreen(using: DarkThemeFactory())
// "dark button dark background"
```

Swap in a `LightThemeFactory` and every piece it hands out is light — there's no way to accidentally mix a dark button onto a light background, because one factory produces the whole consistent set.

## Static factories in Swift

Swift's standard library leans on a lighter-weight version of this idea constantly: a **static factory** is just a named static function or property on the type itself, standing in for (or alongside) `init`.

```swift
extension UIColor {
    static func brand() -> UIColor {
        UIColor(red: 0.0, green: 0.68, blue: 0.32, alpha: 1)
    }
}

let tint = UIColor.brand()
```

You've already used this pattern without naming it: `URL(string:)`, `Array(repeating:count:)`, and `.shared`-style static properties are all static factories. The advantage over a plain `init` is a name that documents *what* is being built (`.brand()` reads better than a four-argument initializer call) and the freedom to return a cached or shared value instead of always allocating a new one.

```swift
enum Environment {
    case staging, production
}

extension URLSession {
    static func session(for env: Environment) -> URLSession {
        switch env {
        case .staging:    return URLSession(configuration: .ephemeral)
        case .production: return URLSession.shared
        }
    }
}
```

`session(for: .production)` hands back the existing shared session instead of constructing a new one — something a plain `init` can never do, because `init` always produces a fresh instance.

## Decoupling creation from use

Here's the property all three variants share: the code that *uses* an object never writes its concrete type name. Compare the very first line of this lesson with where we ended up:

```swift
// Before: use-site knows the concrete type
let processor = StripeProcessor()

// After: use-site knows only the protocol
let processor = makeProcessor(for: paymentMethod)
```

This is what "decoupling creation from use" means in practice: swapping `StripeProcessor` for a fake `PaymentProcessor` in a test, or adding a third real implementation, touches the factory and nothing else. Every caller was already written against the protocol, so it doesn't notice.

## Examples: dependency injection through a factory

A common real use is choosing between a real and fake implementation for tests, without any `if isTesting` checks scattered through production code:

```swift
protocol AnalyticsLogger { func log(_ event: String) }

struct NetworkLogger: AnalyticsLogger {
    func log(_ event: String) { /* sends over the network */ }
}

struct NoOpLogger: AnalyticsLogger {
    func log(_ event: String) { /* does nothing, used in tests */ }
}

enum LoggerFactory {
    static func make(isTesting: Bool) -> AnalyticsLogger {
        isTesting ? NoOpLogger() : NetworkLogger()
    }
}
```

`enum LoggerFactory` here has no cases — it's used purely as a **namespace**: a type that can't be instantiated, existing only to group the static `make` function. This is a common Swift idiom for a factory that doesn't need any state of its own.

## Common pitfalls

- **A factory that returns a concrete type, not a protocol.** If `makeProcessor` returns `StripeProcessor`, callers can still see and depend on the concrete type — the decoupling never actually happens.
- **Putting business logic inside the factory.** A factory should decide *which* type to build, not run the app's core logic — that belongs in the objects it builds.
- **Reaching for abstract factory when one object is enough.** If you only ever construct one kind of thing, a single factory method is simpler and just as decoupled; save the "family of related objects" version for when the objects genuinely need to match each other.

## Interview lens

If asked to implement a factory, write a function or static method whose *return type* is a protocol, with a `switch` or `if` inside deciding which concrete type to build — and say out loud that callers now depend only on the protocol, not on any one implementation.

If asked "factory method vs abstract factory," the distinction is scope: a factory method produces one object; an abstract factory is a protocol that produces a *family* of related objects that must agree with each other, like matching button and background styles for a theme.

If asked why this matters, the answer is testability and decoupling: a factory is the one seam where you swap `StripeProcessor` for a fake in a test, or add a new implementation, without touching any of the code that consumes it — because that code only ever saw the protocol.
