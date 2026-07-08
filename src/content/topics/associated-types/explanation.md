## The problem: a protocol that can't name its element type

Try to write a protocol for "anything that holds items":

```swift
protocol Container {
    var count: Int { get }
    mutating func append(_ item: Int)
}
```

This works for containers of `Int` — and nothing else. A stack of names can't conform, because its `append` takes a `String`.

You could copy-paste `IntContainer`, `StringContainer`, `PersonContainer`... one protocol per element type. What you actually want is a protocol with a blank in it: "I hold *some* element type, and each conformer decides which."

## associatedtype fills in the blank

Here's the blank:

```swift
protocol Container {
    associatedtype Item
    var count: Int { get }
    mutating func append(_ item: Item)
    subscript(i: Int) -> Item { get }
}
```

`associatedtype Item` declares an **associated type** — a placeholder type that the protocol itself never fixes. Every conformer supplies its own concrete `Item`. The protocol has become generic.

Now conform:

```swift
struct IntStack: Container {
    var items: [Int] = []
    var count: Int { items.count }
    mutating func append(_ item: Int) { items.append(item) }
    subscript(i: Int) -> Int { items[i] }
}
```

Notice what's *missing*: `IntStack` never writes `Item = Int` anywhere. The compiler infers it — `append` takes an `Int`, so `Item` must be `Int`.

You can also state it explicitly:

```swift
struct IntStack: Container {
    typealias Item = Int   // explicit — usually unnecessary
    // ...
}
```

Most code lets inference do the work.

You already use associated types every day. `Sequence` and `IteratorProtocol` have `Element`, and `Identifiable` has `ID` — every `for` loop you've ever written leans on an associated type.

## Self requirements create the same situation

An `associatedtype` isn't the only way a protocol gains a blank. Look at `Equatable`:

```swift
protocol Equatable {
    static func == (lhs: Self, rhs: Self) -> Bool
}
```

`Self` means "whatever concrete type is conforming." `Int`'s `==` compares two `Int`s; `String`'s compares two `String`s. The protocol can't say in advance which.

So two features leave a hole only the conformer can fill: an `associatedtype`, or a requirement that mentions `Self`. Protocols like this are often called **PATs** — protocols with associated types — and they share one famous restriction.

## The classic limitation

Predict: does this line compile?

```swift
let c: Container = IntStack()
```

Answer: classically, no. The error became famous:

```
protocol 'Container' can only be used as a generic constraint
because it has Self or associated type requirements
```

Why? Writing `Container` as a plain type asks Swift for a box that can hold *any* conformer while hiding which one — that kind of box is called an **existential**. It gets its own lesson next; for now, "a value whose concrete type is hidden" is the whole idea.

The box would hide which `Item` this particular container uses. Then what could the compiler say about `c.append(...)` — what type goes in? What comes out of `c[0]`? It can't type-check the requirements, so it refuses to make the box.

## The workaround: use it as a constraint

Instead of hiding the type, keep it visible with a generic:

```swift
func describe<C: Container>(_ c: C) -> String {
    "\(c.count) items"
}
```

Here `C` is one known concrete type per call — and so is `C.Item`. The compiler can check everything.

Need to talk about the item type? Constrain it with `where`:

```swift
func sum<C: Container>(_ c: C) -> Int where C.Item == Int {
    var total = 0
    for i in 0..<c.count { total += c[i] }
    return total
}
```

`where C.Item == Int` pins the associated type, so the subscript's result is a real `Int` you can add. This constraint style is the idiomatic default for working with PATs.

## Modern Swift relaxed the rule — partly

Since Swift 5.7 you can mark associated types as *primary* in the protocol declaration:

```swift
protocol Container<Item> {   // Item is now a primary associated type
    associatedtype Item
    // ...
}

let c: any Container<Int> = IntStack()   // ✅ compiles today
```

Declaring `Container<Item>` names a **primary associated type**, and `any Container<Int>` says "some hidden container whose `Item` is definitely `Int`." With `Item` no longer hidden, the compiler can type-check the requirements again.

The `any` keyword and its costs are the next lesson's whole subject. Even with this feature, the generic-constraint approach stays the default — and the older technique below is still what you reach for when you need a concrete, storable type.

## Type erasure: a concrete wrapper when you must store one type

Sometimes a constraint isn't enough. You need to put mixed conformers in one array, store one in a property, or return one from a function — all places that demand a single concrete type.

The tool is **type erasure**: wrap the conformer in a concrete type that conforms to the protocol, forwards everything to the wrapped value, and exposes only the associated types you care about.

The standard library ships several erasers:

```swift
let seq: AnySequence<Int> = AnySequence([1, 2, 3])   // the real Sequence type is hidden
```

`AnySequence<Int>` says "some sequence of `Int`s — don't ask which." Its cousins: `AnyIterator`, `AnyHashable`, SwiftUI's `AnyView`, Combine's `AnyPublisher`.

One caution about `AnyView`: it lets you return different view types from one function, but SwiftUI loses its static knowledge of the view structure, so its optimizations suffer. Hence the common advice — avoid *gratuitous* `AnyView`.

## Build your own type eraser

The classic hand-rolled pattern stores closures that capture the wrapped conformer. Start with the shell:

```swift
struct AnyContainer<Item> {
    private let _count: () -> Int
    private let _subscriptAt: (Int) -> Item
}
```

Instead of storing the container itself — whose type we're trying to hide — we store one closure per requirement.

Now the initializer, where the erasing happens:

```swift
    init<C: Container>(_ base: C) where C.Item == Item {
        _count = { base.count }
        _subscriptAt = { base[$0] }
    }
```

The generic `init` knows the concrete `C`. Each closure captures `base`, so the concrete type is sealed inside — only `Item` remains visible in the wrapper's signature.

Finish by conforming:

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
```

And use it:

```swift
let anyC = AnyContainer(IntStack(items: [1, 2, 3]))
let containers: [AnyContainer<Int>] = [anyC]        // storable, returnable, mixable
```

`AnyContainer<Int>` is a plain concrete type — it goes in arrays, properties, and return positions where the bare protocol couldn't. In modern code, `any Container<Int>` often replaces a hand-rolled eraser; the pattern still matters for older toolchains, for protocols without primary associated types, and because the stdlib erasers are built exactly this way.

## Common pitfalls

- **Reaching for erasure when a constraint would do.** If a generic `<C: Container>` works, use it — it's simpler and faster. Erase only when you must store or mix.
- **Forgetting that `Self` counts too.** A protocol with no `associatedtype` but a `Self` requirement — like `Equatable` — hits the same restriction.
- **`AnyView` sprinkled everywhere.** Each one blinds SwiftUI's optimizer. Prefer `some View` or `@ViewBuilder`; erase as a last resort.
- **Expecting inference to fail loudly.** If a conformer's methods disagree about `Item`, the error points at the conformance, not the mismatch — check your method signatures first.

## Interview lens

If asked what `associatedtype` is, say: a type placeholder that makes the protocol itself generic — each conformer fills it in, usually by inference. `Sequence.Element` is the example everyone recognizes.

The follow-up is almost always the limitation. Explain *why*, not just *that*: a plain `Container` value would hide which `Item` it uses, so the compiler couldn't type-check `append` or the subscript — that's why the old error said "can only be used as a generic constraint," and why the fix is `<C: Container>` plus `where C.Item == ...`.

The senior payoff is type erasure. Describe the pattern concretely: a concrete wrapper whose generic `init` captures the conformer in closures, exposing only the associated type — and name the shipped erasers, `AnySequence`, `AnyHashable`, `AnyView`, `AnyPublisher`. For bonus points, mention that Swift 5.7's primary associated types — `any Container<Int>` — relaxed the old restriction and reduced the need for custom erasers. Knowing both the old world and the new one is exactly what separates a memorized answer from an understood one.
