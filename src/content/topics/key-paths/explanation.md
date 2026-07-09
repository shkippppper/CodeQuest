## The problem: referring to a property before you have a value

A closure like `{ $0.name }` reads a property, but you can't inspect it, store it in a dictionary, or ask "what type does this return" without running it. Sometimes you want to talk about a property *itself* — as a value — before you have any instance to read it from.

```swift
struct User { var name: String; let id: Int }

let getName = \User.name   // a value, not a function call
```

This is a **key path**: a type-safe reference to a property, written with a backslash. Unlike the closure, `getName` is data — the compiler knows exactly what type it reads from and what type it produces.

## KeyPath types

Key paths come in a small hierarchy, based on what they let you do.

```swift
let nameKP: WritableKeyPath<User, String> = \User.name
let idKP:   KeyPath<User, Int>            = \User.id
```

`nameKP` is a `WritableKeyPath<User, String>` because `name` is a `var` — Swift knows this key path could be used to both read and write. `idKP` is only a plain `KeyPath<User, Int>`, because `id` is a `let`; there's no way to write through it, so the compiler won't let you claim it's writable.

The full hierarchy:

- **`KeyPath<Root, Value>`** — read-only.
- **`WritableKeyPath<Root, Value>`** — read and write, for value types (needs a mutable variable).
- **`ReferenceWritableKeyPath<Root, Value>`** — read and write through a class reference, even if the reference itself is a `let`.
- **`PartialKeyPath<Root>`** and **`AnyKeyPath`** — type-erased versions, used when the `Value` type (or both types) aren't known ahead of time.

## Reading and writing via key paths

A key path is applied with the `[keyPath:]` subscript:

```swift
var user = User(name: "Ada", id: 1)
let n = user[keyPath: nameKP]        // "Ada"
```

`user[keyPath: nameKP]` reads the same thing `user.name` would — the key path is just a stored, reusable stand-in for that `.name` access. Because `nameKP` is a `WritableKeyPath` and `user` is a `var`, you can also assign through it:

```swift
user[keyPath: nameKP] = "Grace"
user.name   // "Grace"
```

Key paths also **compose**. `\User.address.city` isn't two key paths glued together at the call site — it's a single key path value that drills through both levels, and you can build the same thing programmatically with `kp1.appending(path: kp2)`. Writing through a composed key path still needs every step along the way to be mutable — one `let` in the chain and the whole path stops being writable.

## Key paths as functions

Here's where key paths start replacing closures. Predict: what does this print?

```swift
let users = [User(name: "Ada", id: 1), User(name: "Bo", id: 2)]
let names = users.map(\.name)
print(names)
```

Answer: `["Ada", "Bo"]` — exactly what `users.map { $0.name }` would produce. Since Swift 5.2, anywhere a function `(Root) -> Value` is expected, you can hand over a key path instead, and the compiler converts it into that function for you.

```swift
users.map(\.name)                    // instead of users.map { $0.name }
users.filter(\.isActive)             // instead of users.filter { $0.isActive }
```

The two forms run identically. The key-path version just can't sneak in extra logic — it's guaranteed to be exactly "read this property," which makes it easier to read at a glance.

## Dynamic member lookup

`@dynamicMemberLookup` lets a type respond to member access it never explicitly declared, by routing it through a subscript. Combined with key paths, that dynamic access stays fully type-checked:

```swift
@dynamicMemberLookup
struct Ref<T> {
    var value: T
    subscript<V>(dynamicMember kp: KeyPath<T, V>) -> V {
        value[keyPath: kp]
    }
}
```

Now watch what happens when you write `.name` on a `Ref<User>`, even though `Ref` never declared a `name` property:

```swift
let r = Ref(value: User(name: "Ada", id: 1))
r.name   // "Ada"
```

The compiler sees `r.name`, doesn't find a real `name` member on `Ref`, and instead calls the `dynamicMember` subscript with `\User.name` as the key path — resolved and type-checked at compile time, not looked up by string at runtime. This is what makes ergonomic wrapper types (like SwiftUI's binding wrappers) let you write `wrapper.property` directly while staying fully type-safe.

## Use in generic APIs

Key paths let a function be generic over *which property* to use, not just generic over types:

```swift
extension Sequence {
    func sorted<V: Comparable>(by kp: KeyPath<Element, V>) -> [Element] {
        sorted { $0[keyPath: kp] < $1[keyPath: kp] }
    }
}

users.sorted(by: \.id)     // sort by id
users.sorted(by: \.name)   // same function, sort by name instead
```

One implementation of `sorted(by:)` now handles sorting by any comparable property, because the key path carries both the `Root` and `Value` types with it — the compiler still checks that `\.id` and `\.name` produce `Comparable` values, it just doesn't need a separate function written for each property.

```swift
extension Sequence {
    func sum<V: AdditiveArithmetic>(of kp: KeyPath<Element, V>) -> V {
        reduce(.zero) { $0 + $1[keyPath: kp] }
    }
}
users.sum(of: \.id)   // total of every user's id
```

This pattern — accepting a key path as a parameter — shows up throughout Foundation and SwiftUI APIs whenever a library wants to stay generic over "which field."

## Interview lens

If asked "what is a key path?", say it's a type-safe, first-class value that refers to a property — `\Type.property` — as opposed to a closure, which is code that runs. Because it's a value, it carries its `Root` and `Value` types, can be stored, passed around, and composed, and is applied later with `[keyPath:]`.

If asked about the different key path types, walk the hierarchy from least to most capable: `KeyPath` for read-only, `WritableKeyPath` for read/write on value types, `ReferenceWritableKeyPath` for writing through a class even via a `let`, and the type-erased `PartialKeyPath`/`AnyKeyPath` for when the concrete types aren't known.

If the conversation goes toward modern usage, mention key paths as functions (`map(\.name)`, valid since Swift 5.2 anywhere a `(Root) -> Value` closure is expected) and `@dynamicMemberLookup` combined with key paths for type-safe dynamic member access — both signal you've used key paths beyond the textbook definition, in generic APIs like `sorted(by:)` that stay fully type-checked while being parameterized by which property to use.
