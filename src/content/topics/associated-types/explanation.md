## The problem: protocols that need a placeholder type

A `Container` protocol should work with *any* element type — but the element type differs per conformer (`IntStack` holds `Int`, `NameStack` holds `String`). You can't hard-code it. **Associated types** let a protocol declare a **type placeholder** each conformer fills in — making the protocol itself generic. The catch is that such protocols gain restrictions (you can't use them as plain existentials the old way), which leads to **type erasure**.

## `associatedtype`

Declare a placeholder with **`associatedtype`**; conformers supply the concrete type (explicitly, or inferred from usage).

```swift
protocol Container {
    associatedtype Item
    var count: Int { get }
    mutating func append(_ item: Item)
    subscript(i: Int) -> Item { get }
}

struct IntStack: Container {
    var items: [Int] = []
    var count: Int { items.count }
    mutating func append(_ item: Int) { items.append(item) }   // Item inferred as Int
    subscript(i: Int) -> Int { items[i] }
}
```

`Sequence`/`IteratorProtocol` (`Element`), `Collection`, and `Identifiable` (`ID`) are all protocols with associated types (PATs).

## Self & associated-type requirements

Two things make a protocol "generic" and impose restrictions: an **`associatedtype`**, or a requirement that uses **`Self`** (e.g. `Equatable`'s `static func == (Self, Self) -> Bool`). Such protocols are sometimes called **PATs / Self-requirement protocols**.

## The "protocol with Self" limitation

Historically the big gotcha: **you couldn't use a PAT or Self-requirement protocol as a plain type**:

```swift
// let c: Container = IntStack()   // ❌ (classic error)
// "protocol 'Container' can only be used as a generic constraint
//  because it has Self or associated type requirements"
```

Why? An existential `Container` box would hide *which* `Item` it uses, so the compiler can't type-check `append`/subscript (what type goes in/comes out?). The idiomatic uses instead:

- **As a generic constraint:** `func f<C: Container>(_ c: C)` — the concrete `C` (and its `Item`) is known.
- **With `where`:** `func sum<C: Container>(_ c: C) where C.Item == Int`.

(Modern Swift has relaxed some of this with `any` + primary associated types like `any Container<Int>`, but the constraint approach is still the default, and erasure remains the tool when you need a concrete storable type.)

## Type erasure

When you genuinely need to **store or return** a PAT value as one concrete type — e.g. a heterogeneous array, or hiding the concrete iterator type — you use a **type eraser**: a concrete wrapper type that conforms to the protocol and forwards to any underlying conformer, exposing only the associated types you care about. The standard library ships several: **`AnySequence`**, **`AnyIterator`**, **`AnyHashable`**, **`AnyView`** (SwiftUI), **`AnyPublisher`** (Combine).

```swift
let seq: AnySequence<Int> = AnySequence([1, 2, 3])   // hides the real Sequence type
```

`AnyView` in SwiftUI is a type eraser that lets you return different view types from one function (at the cost of losing SwiftUI's static optimizations — hence "avoid gratuitous AnyView").

## Building your own type eraser

The classic pattern (pre-`any`): a public wrapper that stores **closures** capturing the underlying conformer's methods.

```swift
struct AnyContainer<Item>: Container {
    private let _count: () -> Int
    private let _subscriptAt: (Int) -> Item

    init<C: Container>(_ base: C) where C.Item == Item {
        _count = { base.count }
        _subscriptAt = { base[$0] }
    }
    var count: Int { _count() }
    subscript(i: Int) -> Item { _subscriptAt(i) }
}

let anyC = AnyContainer(IntStack(items: [1, 2, 3]))   // concrete, storable, homogeneous Item
```

The eraser captures `base` in closures, exposing only `Item` — now you can put `AnyContainer<Int>` in an array or return it from a function. (Modern Swift often replaces hand-rolled erasers with `any Protocol<AssocType>`.)

## The interview lens

Define **`associatedtype`** as a **type placeholder that makes a protocol generic** (conformers fill it in; `Sequence.Element` is the canonical example). Explain the historical **limitation**: a protocol with an **associated type or a `Self` requirement can't be used as a plain existential type** — the box would hide the associated type, so the compiler can't check the requirements — so you use it as a **generic constraint** (`<T: P>`, `where T.Assoc == ...`) instead.

The senior payoff is **type erasure**: when you must store/return such a value as one concrete type (heterogeneous collections, hiding an iterator/view type), wrap it in an eraser — stdlib's `AnySequence`/`AnyHashable`, SwiftUI's `AnyView`, Combine's `AnyPublisher` — or hand-roll one that captures the base in closures. Bonus: note modern Swift's **`any Protocol<PrimaryAssociatedType>`** (e.g. `any Collection<Int>`) relaxes some of the old restriction, reducing the need for custom erasers.
