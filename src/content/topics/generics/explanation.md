## The problem: the same logic for many types

Without generics you'd write `swapInts`, `swapStrings`, `swapDoubles`… identical code differing only in type. Or you'd fall back to `Any` and lose all type safety (casting everywhere, runtime crashes). **Generics** let you write the algorithm **once**, parameterized by type, and the compiler stamps out a correct, type-safe version for each concrete type you use — flexibility *with* full static checking.

## Why generics

Generics give you **reuse without losing type information**. `Array<Element>`, `Dictionary<Key, Value>`, `Optional<Wrapped>` are all generic — one implementation, safe for any element type. The alternative (`[Any]`) forces casts and defers errors to runtime; generics keep the concrete type known so the compiler catches mistakes and can optimize.

## Generic functions

A **type parameter** in angle brackets makes a function generic:

```swift
func swap<T>(_ a: inout T, _ b: inout T) {
    let tmp = a; a = b; b = tmp
}
```

`T` is a placeholder unified from the call: `swap(&x, &y)` with `Int`s makes `T == Int`. Inside, you can only do what *any* `T` supports (assignment here) — unless you add constraints.

## Generic types

Types can be generic too — you parameterize the whole struct/enum/class:

```swift
struct Stack<Element> {
    private var items: [Element] = []
    mutating func push(_ x: Element) { items.append(x) }
    mutating func pop() -> Element? { items.popLast() }
}
var s = Stack<Int>()
```

The compiler infers `Element` from usage or you specify it. `Stack<Int>` and `Stack<String>` are distinct, fully type-checked types.

## Type constraints (`where`)

A bare `T` can't do much. **Constraints** require `T` to conform to protocols (or match other types), unlocking their capabilities:

```swift
func max2<T: Comparable>(_ a: T, _ b: T) -> T {
    a > b ? a : b               // `>` available because T: Comparable
}

func allEqual<C: Collection>(_ c: C) -> Bool where C.Element: Equatable {
    // `where` refines associated types
    guard let first = c.first else { return true }
    return c.allSatisfy { $0 == first }
}
```

`<T: Comparable>` is the common form; a **`where` clause** expresses richer constraints (on associated types, or `T == U`). Constraints are how generics stay flexible *and* call type-specific methods safely.

## Conditional conformance

A generic type can conform to a protocol **only when its type parameter does**:

```swift
extension Stack: Equatable where Element: Equatable {
    static func == (l: Stack, r: Stack) -> Bool { l.items == r.items }
}
```

Now `Stack<Int>` is `Equatable` (because `Int` is) but `Stack<SomeNonEquatable>` isn't. This is why `[Int]` is `Equatable` but `[SomeNonEquatable]` isn't — the standard library uses conditional conformance extensively.

## Specialization & performance

Generics aren't slow by default. The compiler can **specialize** a generic function — generate a concrete version for a specific type (e.g. a dedicated `Int` version) — inlining and removing abstraction overhead, so it runs like hand-written type-specific code. Specialization works best **within a module** (the optimizer sees both the generic and the call site). Across module boundaries, the compiler may fall back to a single unspecialized version that uses **witness tables** (a small indirection) unless the code is inlinable (`@inlinable`). Contrast with **existentials (`any`)**, which always box and dispatch dynamically — generics are usually the faster choice.

## The interview lens

Pitch generics as **write-once, type-safe reuse**: a type parameter (`<T>`) unified at the call site, versus `Any` which throws away type info and forces casts. Show the two forms — **generic functions** and **generic types** (`Stack<Element>`) — and that a bare `T` can only do universal operations until you add **constraints** (`<T: Comparable>`, refined by a **`where` clause** on associated types or `T == U`).

Senior signals: **conditional conformance** (`extension Stack: Equatable where Element: Equatable` — why `[Int]` is Equatable but `[NonEquatable]` isn't), and **performance** — the optimizer **specializes** generics into concrete, inlined code (fast, especially within a module / with `@inlinable`), whereas **existentials box and dynamically dispatch**. So "generics vs `any`": prefer generics for a single concrete type per call; use `any` only for heterogeneous collections.
