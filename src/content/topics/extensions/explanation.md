## The problem: you can't edit Apple's source

Say you want a `.trimmed` helper on `String`. `String` is a struct in the standard library — you don't own the file it's defined in, and you can't subclass a struct.

```swift
"  hi  ".trimmed   // ❌ doesn't exist yet — and you can't edit String.swift
```

Swift's answer is the **extension**: a way to add new functionality to a type you don't own, without touching its original source and without subclassing.

## Extending types

Here's the smallest extension:

```swift
extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
}

"  hi  ".trimmed   // "hi"
```

`extension TypeName { ... }` reopens `TypeName` and adds a member to it. From here on, every `String` in your codebase — including ones from other files, other frameworks, even ones created before this extension existed — has `.trimmed`.

You can add more than one member, and you can extend more than just structs:

```swift
extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
    func repeated(_ n: Int) -> String { String(repeating: self, count: n) }
}

"ab".repeated(3)   // "ababab"
```

Structs, enums, classes, protocols, and generic types can all be extended. The rule is the same everywhere: you're adding to a type that already exists somewhere else.

## Adding computed properties & methods

Predict: given the extension above, can you add a *stored* property — say `var visitCount = 0` — to `String` the same way?

Answer: no. Try it and the compiler rejects it. An extension has no place to put storage; `String`'s actual memory layout was fixed when `String` was originally declared, and the extension can't go back and change it.

What extensions *can* add: computed properties, methods (including `mutating` ones on structs), subscripts, nested types, and new initializers.

```swift
extension Int {
    var isEven: Bool { self % 2 == 0 }
    func clamped(to r: ClosedRange<Int>) -> Int {
        min(max(self, r.lowerBound), r.upperBound)
    }
}

7.isEven               // false
12.clamped(to: 0...10)  // 10
```

Every one of these — `isEven`, `clamped(to:)` — computes its answer from `self` on the spot rather than reading a stored field. That's why extensions can offer them: nothing needs a permanent home in memory.

Classes get one more privilege here: an extension can add a **convenience initializer** (never a designated one, since those need full control over stored-property setup). For structs, adding any initializer in an extension has a side effect worth knowing — it doesn't remove the automatic memberwise initializer, so both stay available.

## Protocol conformance via extension

Extensions have a second job beyond adding members: attaching a **protocol conformance** to a type, with the conforming code grouped in its own block.

```swift
struct MyModel { let id: Int }

extension MyModel: Equatable {
    static func == (l: MyModel, r: MyModel) -> Bool { l.id == r.id }
}
```

Nothing about `MyModel`'s original declaration changed. The `Equatable` conformance and the `==` it requires live together in one place, separate from the model's core definition.

This works even on types you don't own:

```swift
extension Int: MyProtocol {
    func describe() -> String { "the number \(self)" }
}
```

`Int` is a standard-library type and `MyProtocol` might be your own — extensions let you bridge the two without owning either side. This is called **retroactive conformance**: conforming a type to a protocol neither of which you wrote. It's allowed, but it has a real hazard — if two different modules in the same app each add their own conformance of `Int` to the same protocol, the app won't compile, or worse, picks one arbitrarily. Retroactive conformance plus default implementations from protocol extensions is what makes protocol-oriented programming practical in Swift: you can bolt behavior onto existing types instead of wrapping them.

## Constrained extensions

Sometimes you only want an extension's members to exist for *some* versions of a generic type, not all of them.

```swift
extension Array where Element: Numeric {
    func total() -> Element { reduce(.zero, +) }
}

[1, 2, 3].total()   // 6
```

The `where Element: Numeric` clause means this `total()` method only appears on arrays whose `Element` conforms to `Numeric`. Predict: does `["a", "b"].total()` compile?

Answer: no. `String` isn't `Numeric`, so for `[String]` the method simply isn't there — it's not a runtime error, the compiler never generates it for that type.

This is exactly how the standard library adds specialized methods to collections only when their contents support them, and it's the same mechanism behind **conditional conformance** (a type conforming to a protocol only when its generic parameter does). You can constrain a protocol extension the same way: `extension Collection where Element == Int`.

## Organizing code with extensions

Beyond adding new behavior, extensions are also just a way to split one type's code into readable chunks — often one extension per concern, sometimes in separate files.

```swift
// MyViewController+TableView.swift
extension MyViewController: UITableViewDataSource {
    // table view methods live here
}

// MyViewController+Networking.swift
extension MyViewController {
    func loadData() { /* ... */ }
}
```

`MyViewController` itself might be declared in a third file with none of this code in it. Each extension groups one responsibility, which keeps a large type from turning into one unreadable block. This is the standard way to separate a UIKit view controller's `UITableViewDataSource`/`Delegate` conformances from its main body.

## Common pitfalls

- **Trying to add a stored property in an extension.** Extensions can't add storage — only computed properties, methods, subscripts, and initializers. If you need stored state, it has to live in the original type declaration.
- **Retroactive conformance conflicts.** Conforming someone else's type to someone else's protocol works until a second module does the same thing — then you get a silent conflict or a compile error.
- **A dependency cycle disguised as a protocol extension.** Not related to storage, but worth knowing: constrained extensions can stack subtly — check what a method actually resolves to when several constrained extensions could apply.

## Interview lens

If asked "what is an extension?", the strong answer is: a way to add methods, computed properties, subscripts, initializers, and protocol conformances to *any* existing type — yours or not — without subclassing. Say the limitation in the same breath: no stored properties, because extensions don't add storage to a type's memory layout.

If pushed further, bring up constrained extensions (`extension Array where Element: Numeric`) as the mechanism behind conditional conformance, and retroactive conformance as the technique that lets you make a type from one module conform to a protocol from another — along with its real risk of silent conflicts across modules.

If the conversation turns to code organization, mention that splitting a type's protocol conformances into separate extensions (often separate files) is idiomatic Swift, not just a style preference — it's how most UIKit codebases keep `UITableViewDataSource` and friends out of a view controller's main body.
