## The problem: the same code, over and over

Write a function that swaps two integers:

```swift
func swapInts(_ a: inout Int, _ b: inout Int) {
    let tmp = a
    a = b
    b = tmp
}
```

Now you need the same thing for strings:

```swift
func swapStrings(_ a: inout String, _ b: inout String) {
    let tmp = a
    a = b
    b = tmp
}
```

Look at the two bodies. They are *identical*. Only the type names differ — and you'd write it a third time for `Double`, a fourth for your own structs. Same logic, copy-pasted per type.

There's a tempting escape hatch: `Any`, the type that can hold anything.

```swift
func swapAnys(_ a: inout Any, _ b: inout Any) { ... }

var x: Any = 1
var y: Any = "hello"
swapAnys(&x, &y)          // compiles fine...
let sum = (x as! Int) + 2 // 💥 crash — x is now a String
```

`Any` erases the type information. You get one function, but every use site needs a cast, the compiler can no longer catch mistakes, and errors surface as runtime crashes. That trade is almost never worth it.

**Generics** solve both problems at once: you write the algorithm one time, with the type left as a fill-in-the-blank, and the compiler produces a correct, fully type-checked version for every concrete type you use. Flexibility, with none of the safety lost.

## One function, any type

Here is the swap written generically:

```swift
func swapValues<T>(_ a: inout T, _ b: inout T) {
    let tmp = a
    a = b
    b = tmp
}
```

The `<T>` after the name declares a **type parameter** — a placeholder standing for "some type, to be determined at each call." Everywhere the body says `T`, it means that same one type.

Watch the placeholder get filled in:

```swift
var i = 1, j = 2
swapValues(&i, &j)        // T becomes Int

var s1 = "a", s2 = "b"
swapValues(&s1, &s2)      // T becomes String
```

You never told the compiler what `T` is. It looked at the arguments and deduced it — this matching of the placeholder against real arguments is called *unification*. Every call is checked with the real type filled in, so type safety is fully intact.

Predict: does this compile?

```swift
var n = 1
var t = "one"
swapValues(&n, &t)
```

Answer: no. Both parameters are `T` — the *same* placeholder — so both arguments must be the same type. An `Int` and a `String` can't both be `T`. The compiler rejects it at compile time, exactly the error `Any` would have hidden until runtime.

One more thing about the body. Inside `swapValues`, all you can do with `T` values is what *every possible type* supports — assign them, pass them around. You can't write `a + b` or `a > b`, because the compiler has no idea whether `T` has those. That restriction is real, and constraints (below) are how you lift it.

## Generic types

Whole types can take type parameters, not just functions:

```swift
struct Stack<Element> {
    private var items: [Element] = []

    mutating func push(_ x: Element) { items.append(x) }
    mutating func pop() -> Element? { items.popLast() }
}
```

`Stack` isn't a type yet — it's a recipe for types. Give it an element type and you get a concrete one:

```swift
var ints = Stack<Int>()
ints.push(1)
ints.push(2)

var words = Stack<String>()
words.push("hi")
```

`Stack<Int>` and `Stack<String>` are two distinct, fully type-checked types. Pushing a string onto `ints` is a compile error.

The compiler can usually infer the parameter, same as with functions:

```swift
var s = Stack<Int>()   // explicit
// or infer from use — push(1) would fix Element = Int
```

You've been using generic types since your first day of Swift. `Array<Element>`, `Dictionary<Key, Value>`, and `Optional<Wrapped>` are all exactly this pattern — one implementation each, safe for any type you put inside.

## Constraints: teaching T some skills

Try to write "return the larger of two values":

```swift
func max2<T>(_ a: T, _ b: T) -> T {
    a > b ? a : b   // ❌ error: `>` is not defined for every possible T
}
```

A bare `T` could be anything — including types with no notion of ordering. The fix is a **constraint**: a promise that `T` conforms to some protocol, which unlocks that protocol's abilities inside the body.

```swift
func max2<T: Comparable>(_ a: T, _ b: T) -> T {
    a > b ? a : b   // ✓ `>` guaranteed — Comparable requires it
}
```

`Comparable` is a standard-library protocol that guarantees `<`, `>`, and friends exist; it gets a full lesson later. The `<T: Comparable>` reads: "any type T, as long as it's Comparable." Now the function is still generic — but only over types that can actually be compared, and the compiler enforces that at every call site.

Constraints are the balancing act of generics: unconstrained means maximally reusable but nearly powerless; each constraint trades a little reusability for real capabilities.

## Richer constraints: the where clause

Sometimes the constraint isn't on `T` itself but on something *inside* it. Say you want to check whether every element of a collection is equal:

```swift
func allEqual<C: Collection>(_ c: C) -> Bool where C.Element: Equatable {
    guard let first = c.first else { return true }   // empty: trivially equal
    return c.allSatisfy { $0 == first }
}
```

Walk through the signature. `C: Collection` constrains the container. But `==` happens on the *elements*, so we need a second promise — and that's what the **where clause** adds: `C.Element: Equatable` reaches into `C` and constrains its element type. `Element` here is a placeholder type declared by the `Collection` protocol itself — a so-called associated type, which has its own lesson later.

A `where` clause can also demand that two types be *the same*:

```swift
func merge<A: Collection, B: Collection>(_ a: A, _ b: B) -> [A.Element]
    where A.Element == B.Element {
    Array(a) + Array(b)
}
```

`A` and `B` can be different container types — an array and a set, say — as long as they hold the same element type. `<T: P>` handles the common case; `where` is the full-power syntax for constraints on associated types and same-type requirements.

## Conditional conformance

Here's a puzzle from the standard library. Predict: which of these lines compiles?

```swift
struct NoEquals {}          // conforms to nothing

let a = [1, 2] == [1, 2]                        // line 1
let b = [NoEquals()] == [NoEquals()]            // line 2
```

Answer: line 1 compiles, line 2 doesn't. `[Int]` is `Equatable`, but `[NoEquals]` is not — *the same generic type, `Array`, is Equatable for some element types and not others.*

The mechanism is **conditional conformance**: a generic type conforms to a protocol only when its type parameter meets a condition. You can write it for your own types:

```swift
extension Stack: Equatable where Element: Equatable {
    static func == (l: Stack, r: Stack) -> Bool { l.items == r.items }
}
```

Read the header slowly: "Stack is Equatable — but only where its Element is." Comparing two stacks means comparing their items, which is only possible when items can be compared. So `Stack<Int> == Stack<Int>` works, and `Stack<NoEquals>` simply isn't Equatable — no crash, no cast, the capability just doesn't exist for that instantiation. The standard library leans on this everywhere: arrays, dictionaries, and optionals are Equatable, Hashable, or Codable exactly when their contents are.

## Are generics slow?

A reasonable worry: if `T` can be anything, does every call pay for some runtime lookup?

Usually no — and the reason is a compiler trick called **specialization**. When the optimizer sees this call:

```swift
let m = max2(3, 7)   // T = Int, known at compile time
```

it can generate a dedicated `Int`-only version of `max2`, then inline it — as if you'd hand-written `func max2(_ a: Int, _ b: Int) -> Int`. All the generic abstraction evaporates. Specialized generic code runs at hand-written speed.

There is fine print. Specialization works best *within a module*, where the optimizer can see both the generic function's body and the call site at once. When a generic function lives in another module, the compiler may only be able to emit one shared, unspecialized version. That shared version works for every `T` by carrying a **witness table** — a small lookup table saying "here is where *this* T's `>` lives" — which adds a layer of indirection to each constrained operation. Marking the function `@inlinable` exposes its body across the module boundary so specialization can happen anyway.

Even unspecialized, generics beat the alternative. An existential — an `any P` box, from the protocols lesson — *always* boxes its value and *always* dispatches dynamically. A generic at worst pays a witness-table indirection and at best compiles down to concrete code. When you can choose, generics are usually the faster choice.

## Common pitfalls

- **Reaching for `Any` to make code flexible.** You lose compile-time checking and buy runtime casts and crashes. Fix: a type parameter `<T>` gives the same flexibility with full safety.
- **Expecting a bare `T` to support `==`, `>`, or `+`.** Unconstrained means "any type at all," so only universal operations compile. Fix: add the constraint that guarantees the operation — `<T: Equatable>`, `<T: Comparable>`, `<T: Numeric>`.
- **Writing one `swap`-style function per type.** Identical bodies differing only in type names are the textbook generics signal. Fix: one generic function.
- **Assuming generic code in another module is automatically fast.** Cross-module calls may stay unspecialized and go through witness tables. Fix: profile, and consider `@inlinable` for hot generic APIs.

## Interview lens

If asked "why generics?", pitch it as write-once, type-safe reuse: a type parameter is a placeholder filled in at each call site, so you get one implementation with full compile-time checking. Contrast with `Any`, which throws away the type and forces casts that fail at runtime. Mentioning that `Array`, `Dictionary`, and `Optional` are all generic shows you see it as the language's foundation, not a niche feature.

Expect a mechanics follow-up. Cover the two forms — generic functions and generic types like `Stack<Element>` — and explain that an unconstrained `T` can only do universal operations until a constraint like `<T: Comparable>` unlocks more, with `where` clauses handling the richer cases: constraints on associated types and same-type requirements like `A.Element == B.Element`.

The senior signals are two. First, conditional conformance: be ready to explain why `[Int]` is Equatable but an array of a non-Equatable type isn't, and to write `extension Stack: Equatable where Element: Equatable` on a whiteboard. Second, performance: the optimizer specializes generics into concrete inlined code — fast, especially within a module or with `@inlinable` — while cross-module unspecialized calls go through witness tables, and existentials (`any P`) always box and dispatch dynamically. That gives you the closing rule interviewers want to hear: prefer generics when each call works with one concrete type; use `any` only when you truly need heterogeneous values.
