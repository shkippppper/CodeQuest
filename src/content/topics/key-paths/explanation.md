## The problem: referring to a property without accessing it

Sometimes you want to talk about a property *itself* — "sort by this field", "read this value from each element" — as a **value** you can pass around, before you have an instance to read it from. A closure `{ $0.name }` works but is opaque. **Key paths** (`\Type.property`) are a **type-safe, composable reference to a property**, usable as data: store them, pass them to generic APIs, and read/write through them.

## KeyPath types

A key-path literal is written with a **backslash**: `\Type.property`. There's a hierarchy by capability:

- **`KeyPath<Root, Value>`** — read-only access to `Value` from a `Root`.
- **`WritableKeyPath<Root, Value>`** — read **and** write, for **value types** (mutating `var` needed).
- **`ReferenceWritableKeyPath<Root, Value>`** — read/write through a **class** reference (works even on a `let` class).
- **`PartialKeyPath<Root>`** / **`AnyKeyPath`** — type-erased when the value (or root) type is unknown.

```swift
struct User { var name: String; let id: Int }
let nameKP: WritableKeyPath<User, String> = \User.name
let idKP:   KeyPath<User, Int>            = \User.id      // read-only (id is let)
```

## Reading & writing via key paths

Apply a key path with subscript **`[keyPath:]`**:

```swift
var user = User(name: "Ada", id: 1)
let n = user[keyPath: nameKP]        // read → "Ada"
user[keyPath: nameKP] = "Grace"      // write (WritableKeyPath, var user)
```

Key paths **compose**: `\User.address.city` drills through nested properties, and you can append (`kp1.appending(path: kp2)`). Writing requires a *writable* key path and a mutable root (value types) — or a `ReferenceWritableKeyPath` (classes).

## Key paths as functions

Since Swift 5.2, a **key path can be used where a function `(Root) -> Value` is expected** — the compiler converts `\Root.value` into a closure that reads that property:

```swift
let users = [User(name: "Ada", id: 1), User(name: "Bo", id: 2)]
let names = users.map(\.name)             // instead of { $0.name }
let sorted = users.sorted(by: { $0.id < $1.id })   // (key paths shine more with helpers)
```

`map(\.name)`, `filter(\.isActive)`, etc. read cleaner than closures and can't accidentally do extra work.

## Dynamic member lookup

**`@dynamicMemberLookup`** lets a type expose members dynamically via a subscript — and combined with **key paths** it gives *type-safe* dynamic member access. A wrapper can forward `wrapper.name` to `base[keyPath: \.name]`:

```swift
@dynamicMemberLookup
struct Ref<T> {
    var value: T
    subscript<V>(dynamicMember kp: KeyPath<T, V>) -> V { value[keyPath: kp] }
}
let r = Ref(value: User(name: "Ada", id: 1))
r.name      // "Ada" — resolved via the key-path subscript, fully type-checked
```

This powers ergonomic wrappers (e.g. SwiftUI's `@dynamicMemberLookup` bindings) where `wrapper.property` works and stays type-safe because the key-path subscript enforces the types.

## Use in generic APIs

Key paths let you write **reusable, type-safe APIs parameterized by a property** — the pattern behind many library helpers:

```swift
extension Sequence {
    func sorted<V: Comparable>(by kp: KeyPath<Element, V>) -> [Element] {
        sorted { $0[keyPath: kp] < $1[keyPath: kp] }
    }
    func sum<V: AdditiveArithmetic>(of kp: KeyPath<Element, V>) -> V {
        reduce(.zero) { $0 + $1[keyPath: kp] }
    }
}
users.sorted(by: \.id)          // sort by any field, type-safely
users.sum(of: \.id)             // sum a numeric field
```

Because key paths carry the `Root` and `Value` types, the API stays fully checked while accepting *which* property to use as an argument.

## The interview lens

Define a key path as a **type-safe, first-class reference to a property** (`\Type.property`), distinct from a closure because it's a value the compiler understands (carrying `Root`/`Value` types, composable, storable). Know the **capability hierarchy**: `KeyPath` (read), `WritableKeyPath` (read/write value types), `ReferenceWritableKeyPath` (write through a class, even on `let`), and the type-erased `PartialKeyPath`/`AnyKeyPath`; apply with **`[keyPath:]`**.

Senior signals: **key paths as functions** (`map(\.name)` since 5.2 — where a `(Root) -> Value` is expected), **`@dynamicMemberLookup` + key paths** for **type-safe** dynamic member access (wrappers forwarding `x.prop` to `base[keyPath: \.prop]`), and their use in **generic APIs** (`sorted(by: \.id)`, `sum(of: \.price)`) that stay type-checked while being parameterized by *which* property to use.
