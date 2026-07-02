## The problem: the same get/set boilerplate on many properties

You want several properties that clamp to a range, or trim whitespace, or read from `UserDefaults`. Writing a custom getter/setter on each is repetitive and error-prone. A **property wrapper** packages that access logic **once** into a type, then you attach it to any property with `@WrapperName` — the wrapper runs its get/set behavior transparently. It's how `@State`, `@Published`, and `@AppStorage` are built.

## The problem they solve

A property wrapper factors out **reusable access logic** — the code that runs when you read or write a property. Instead of copy-pasting a `didSet`/computed pattern, you define the behavior in a wrapper type and reuse it via an annotation. The property still *looks* like a normal value at the use site.

## `wrappedValue`

A property wrapper is a type marked **`@propertyWrapper`** with a required **`wrappedValue`** property. `wrappedValue`'s getter/setter is the logic that runs on access:

```swift
@propertyWrapper
struct Clamped {
    private var value: Int
    let range: ClosedRange<Int>
    init(wrappedValue: Int, _ range: ClosedRange<Int>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }
    var wrappedValue: Int {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
}

struct Player {
    @Clamped(0...100) var health = 100
}
```

At the use site, `player.health` is an `Int`; behind the scenes it's stored in a `Clamped` and clamped on every write. The compiler rewrites the property into a hidden stored wrapper instance plus a computed accessor delegating to `wrappedValue`.

## `projectedValue` (`$`)

A wrapper can optionally expose a **`projectedValue`** — a *second* value accessed with the **`$`** prefix, for extra API beyond the plain value:

```swift
@propertyWrapper
struct Validated {
    private(set) var wrappedValue: String
    var projectedValue: Bool { !wrappedValue.isEmpty }   // $ gives validity
}

struct Form { @Validated var name = "" }
// form.name    -> the String (wrappedValue)
// form.$name   -> Bool (projectedValue: is it non-empty?)
```

`$name` returns the `projectedValue`. In SwiftUI, `@State`'s `projectedValue` is a `Binding`, which is exactly why `$count` gives you a `Binding` to pass to a `TextField`.

## Building a custom wrapper

The recipe: a `@propertyWrapper` type with (1) an `init(wrappedValue:...)` (so `@Wrapper var x = default` works and you can pass config), (2) a `wrappedValue` computed property holding the access logic, and optionally (3) a `projectedValue`. A common real example wraps `UserDefaults`:

```swift
@propertyWrapper
struct UserDefault<T> {
    let key: String; let defaultValue: T
    var wrappedValue: T {
        get { UserDefaults.standard.object(forKey: key) as? T ?? defaultValue }
        set { UserDefaults.standard.set(newValue, forKey: key) }
    }
}
```

## Wrappers in SwiftUI

SwiftUI is built on property wrappers: **`@State`**, **`@Binding`**, **`@Published`**, **`@StateObject`/`@ObservedObject`**, **`@Environment`**, **`@AppStorage`**, **`@FocusState`**. Their `wrappedValue` is the value you read; their `projectedValue` (`$`) is usually a `Binding` or publisher. Understanding property wrappers demystifies why `@State` stores state outside the struct and why `$state` yields a binding.

## Composition & limits

- **Composition:** you can nest wrappers (`@A @B var x`), applied outermost-in — but it's fiddly and each wrapper's `wrappedValue` must line up with the next; use sparingly.
- **Limits:** a wrapped property **can't also be `lazy`/`@NSCopying`**, generally can't be overridden, has restrictions in protocols, and the wrapper's storage lives with the instance (so wrappers add a hidden stored property — you can't use one where stored properties aren't allowed, e.g. in an extension). The `init(wrappedValue:)` ordering also matters for how `@Wrapper var x = value` is desugared.

## The interview lens

Define a property wrapper as a **`@propertyWrapper` type with a `wrappedValue`** that packages **reusable get/set logic**, attached to a property via `@Name`; at the use site the property reads/writes like a normal value while the wrapper's `wrappedValue` accessor runs the logic. Explain the **`projectedValue`** — the `$`-prefixed secondary value — and that **SwiftUI's `@State` projects a `Binding`**, which is why `$count` is a binding.

Senior signals: name that `@State`/`@Published`/`@AppStorage` **are** property wrappers (so you understand the framework, not just use it); know the wrapper adds a **hidden stored instance** (hence can't go where stored properties can't, and can't combine with `lazy`); and that `init(wrappedValue:)` enables the `@Wrapper var x = default` syntax. Bonus: wrappers **compose** (`@A @B`) but with careful ordering.
