## The problem: adding behavior to types you don't own

You want a `.trimmed` helper on `String`, or to make `Int` conform to your protocol — but you can't edit Apple's source. **Extensions** let you add functionality to **any existing type** — your own, the standard library's, or a third-party framework's — without subclassing and without access to the original source. They're one of the most-used tools in day-to-day Swift.

## Extending types

`extension TypeName { ... }` adds members to an existing type:

```swift
extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
    func repeated(_ n: Int) -> String { String(repeating: self, count: n) }
}

"  hi  ".trimmed        // "hi"
```

You can extend structs, enums, classes, protocols, and even generic types. The extension's members become available everywhere the type is visible.

## Adding computed properties & methods

Extensions can add **computed** properties, **methods** (including `mutating` ones on value types), **subscripts**, **nested types**, and **new initializers** (specifically **convenience** initializers for classes; for structs, adding an init in an extension also preserves the memberwise init).

```swift
extension Int {
    var isEven: Bool { self % 2 == 0 }
    func clamped(to r: ClosedRange<Int>) -> Int { min(max(self, r.lowerBound), r.upperBound) }
}
```

**The key limitation: extensions cannot add stored properties.** They have no storage of their own — only computed properties and methods. (Workarounds like associated objects exist for classes via the Objective-C runtime, but they're a smell.)

## Protocol conformance via extension

A very common pattern: **add conformance** to a type through an extension, keeping the conformance and its methods grouped together.

```swift
extension MyModel: Equatable {
    static func == (l: MyModel, r: MyModel) -> Bool { l.id == r.id }
}
```

You can even conform types you don't own: `extension Int: MyProtocol { ... }`. This — plus protocol extensions providing default implementations — is the backbone of protocol-oriented programming. (Note: **retroactive conformance**, conforming a type you don't own to a protocol you don't own, is allowed but discouraged because two modules could add conflicting conformances.)

## Constrained extensions

On a **generic** type, an extension can apply **only when the type parameter meets a constraint**, using `where`:

```swift
extension Array where Element: Numeric {
    func total() -> Element { reduce(.zero, +) }
}
[1, 2, 3].total()          // 6  — only available because Int is Numeric
// ["a"].total()           // ❌ String isn't Numeric, so `total()` doesn't exist there
```

This is how the standard library adds methods to collections only for suitable elements (and it underpins **conditional conformance**). You can also constrain a **protocol extension**: `extension Collection where Element == Int`.

## Organizing code with extensions

Beyond adding features, extensions are a **code-organization** idiom: split a type's implementation into focused chunks — one extension per protocol conformance, one grouping related helpers — often across multiple files.

```swift
// MyVC+TableView.swift
extension MyViewController: UITableViewDataSource { ... }
// MyVC+Networking.swift
extension MyViewController { func loadData() { ... } }
```

This keeps a large type readable (each concern in its own extension) and is idiomatic for separating `UITableViewDataSource`/`Delegate` conformances from the main type body.

## The interview lens

Define extensions as **adding methods, computed properties, subscripts, initializers, and protocol conformances to any existing type** (yours or not) **without subclassing** — the enabler of POP alongside protocol extensions' default implementations. Nail the **cardinal limitation: no stored properties** (extensions have no storage; only computed properties/methods).

Senior points: **constrained extensions** (`extension Array where Element: Numeric`) add members only when a generic constraint holds — the mechanism behind conditional conformance; **retroactive conformance** (conforming someone else's type to someone else's protocol) is allowed but risky (conflicts across modules); and extensions are a standard **organization** tool (one extension per conformance/concern, often split across files) — e.g. isolating `UITableViewDataSource` conformance.
