## The problem: the same accessor logic, copy-pasted

Say a game needs stats that stay between 0 and 100:

```swift
struct Player {
    var health: Int = 100 {
        didSet { health = min(max(health, 0), 100) }
    }
    var mana: Int = 50 {
        didSet { mana = min(max(mana, 0), 100) }
    }
}
```

The clamping logic is written twice. Add stamina, shield, and rage, and it's written five times — five chances to typo a bound.

The logic that runs when a property is read or written shouldn't have to live *on* the property. A **property wrapper** packages that access logic into a reusable type you attach with an `@` annotation. This is the mechanism behind `@State`, `@Published`, and `@AppStorage`.

## Build the wrapper

Start with a plain type holding the logic:

```swift
@propertyWrapper
struct Clamped {
    private var value: Int
    let range: ClosedRange<Int>

    var wrappedValue: Int {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
}
```

Two things make this a wrapper. The `@propertyWrapper` attribute marks the type, and the property named `wrappedValue` is required — its getter and setter are the logic that runs on every access.

Now give it an initializer:

```swift
    init(wrappedValue: Int, _ range: ClosedRange<Int>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }
```

The parameter name `wrappedValue` is special — it's what lets the familiar `= 100` default syntax work, as you'll see in a moment. The extra `range` parameter is per-property configuration.

Attach it:

```swift
struct Player {
    @Clamped(0...100) var health = 100
    @Clamped(0...100) var mana = 50
}
```

One line per property, logic written once.

Predict: what does this print?

```swift
var player = Player()
player.health = 250
print(player.health)
```

Answer: `100`. The assignment went through `Clamped`'s setter, which clamped 250 down to the range's upper bound. At the use site `health` still looks like a plain `Int` — the wrapper is invisible.

## What the compiler actually generates

The `@Clamped` line is shorthand. The compiler rewrites it into ordinary code — this rewriting of friendly syntax into plainer code is called **desugaring**. Roughly:

```swift
struct Player {
    private var _health = Clamped(wrappedValue: 100, 0...100)

    var health: Int {
        get { _health.wrappedValue }
        set { _health.wrappedValue = newValue }
    }
}
```

Read that carefully — it explains three facts you'll need later.

First: there's a hidden stored property, `_health`, holding the wrapper instance. A wrapper adds real storage to the enclosing type.

Second: `= 100` became `Clamped(wrappedValue: 100, 0...100)`. That's why `init(wrappedValue:)` matters — without it, the default-value syntax doesn't compile.

Third: `health` itself became a computed property delegating to `wrappedValue`. Every read and write runs your logic, always.

## $: a second value the wrapper can project

A wrapper can expose one more thing — an optional **projected value**, reached with the `$` prefix:

```swift
@propertyWrapper
struct Validated {
    private(set) var wrappedValue: String
    var projectedValue: Bool { !wrappedValue.isEmpty }
}

struct Form { @Validated var name = "" }
```

Now one property answers two questions:

```swift
form.name    // "" — the String   (wrappedValue)
form.$name   // false — is it valid?  (projectedValue)
```

`$name` is compiler shorthand for `_name.projectedValue`. The projected value can be any type at all — a validity flag, a publisher, a binding — whatever extra API the wrapper wants to offer beside the plain value.

## A real wrapper: backing a property with UserDefaults

`UserDefaults` is the system's small key-value store for user preferences. Reading and writing it by hand is classic boilerplate — perfect wrapper material:

```swift
@propertyWrapper
struct UserDefault<T> {
    let key: String
    let defaultValue: T

    var wrappedValue: T {
        get { UserDefaults.standard.object(forKey: key) as? T ?? defaultValue }
        set { UserDefaults.standard.set(newValue, forKey: key) }
    }
}
```

The getter reads the store and falls back to a default; the setter writes through. Attach it and the persistence disappears from view:

```swift
struct Settings {
    @UserDefault(key: "volume", defaultValue: 5) var volume: Int
}

Settings().volume = 9   // silently persisted to UserDefaults
```

## SwiftUI runs on property wrappers

SwiftUI has its own lessons, but here's the connection worth banking now: `@State`, `@Binding`, `@Published`, `@StateObject`, `@ObservedObject`, `@Environment`, `@AppStorage`, and `@FocusState` are all property wrappers — the exact mechanism you just built.

Their `wrappedValue` is the value you read in `body`. Their `projectedValue` — the `$` — is usually a `Binding`, a read-write connection to the value:

```swift
@State private var count = 0

TextField("Count", value: $count, format: .number)   // $count is the Binding
```

That's the demystification: `$count` isn't magic syntax, it's `_count.projectedValue`. And `@State` storing its value outside the struct is just a wrapper whose hidden instance manages external storage.

## Wrappers compose, within limits

You can stack wrappers on one property:

```swift
@A @B var x = 0   // applied outermost-in: A wraps B wraps the value
```

Each wrapper's `wrappedValue` type must line up with the next wrapper's expected input — it works, but it's fiddly. Use sparingly.

The limits come straight from the hidden-stored-property desugaring:

- A wrapped property can't live in an extension — extensions can't add stored properties, and the wrapper *is* one.
- A wrapped property can't also be `lazy` or `@NSCopying` — those features compete for the same accessor machinery.
- Wrapped properties generally can't be overridden, and can't be declared in protocols.
- The `init(wrappedValue:)` signature dictates how `@Wrapper var x = value` desugars — get the parameter name wrong and the default syntax breaks.

## Common pitfalls

- **Confusing `name` and `$name`.** Plain name → `wrappedValue`; `$` → `projectedValue`. They can be completely different types.
- **No `init(wrappedValue:)`, then `@Wrapper var x = 0` fails.** The default-value syntax needs that exact parameter name.
- **Putting a wrapped property in an extension.** It's a stored property in disguise — the compiler refuses.
- **Forgetting the wrapper adds storage.** Every `@Wrapped` property carries a hidden instance; on a tiny struct that's a real size change.

## Interview lens

If asked what a property wrapper is, define it by its parts: a type marked `@propertyWrapper` with a required `wrappedValue`, packaging reusable get/set logic that runs transparently when an annotated property is accessed. Then say what the compiler does — a hidden stored `_name` instance plus a computed accessor delegating to `wrappedValue` — because knowing the desugaring is what separates users from understanders.

Expect the SwiftUI follow-up: explain that `@State` and friends *are* property wrappers, and that `$count` is the projected value, which for `@State` is a `Binding`. That one sentence shows you understand the framework's plumbing, not just its incantations.

Senior signals to drop: the wrapper adds a hidden stored property, which is exactly why it can't go in extensions or combine with `lazy`; `init(wrappedValue:)` is what powers the `= default` syntax; and wrappers compose (`@A @B`) but with careful ordering. If you've written a `UserDefault` or `Clamped` wrapper yourself, say so — a concrete custom wrapper is the most convincing answer in this topic.
