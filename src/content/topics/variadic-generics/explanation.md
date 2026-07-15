## The problem: the same generic, copy-pasted N times

You want a `zip`-like function that pairs up values from a few sequences. Start with two:

```swift
func zip<A, B>(_ a: A, _ b: B) -> (A, B) {
    (a, b)
}
```

That works for exactly two arguments. Now someone needs three:

```swift
func zip<A, B, C>(_ a: A, _ b: B, _ c: C) -> (A, B, C) {
    (a, b, c)
}
```

And four, and five. Each new arity is a whole new overload — same body, one more type parameter. You copy-paste until you get bored, then you stop at some arbitrary cap.

This is not a made-up problem. SwiftUI's `ViewBuilder` and `TupleView` were built exactly this way: a stack of overloads for 2, 3, 4… up to 10 child views. Ten was the ceiling because someone hand-wrote overloads up to ten and quit. Put an eleventh view in a `VStack` before this feature existed and the compiler couldn't type it.

**Parameter packs** remove the copy-paste. You write the generic *once*, and it works for any number of type parameters — two, three, or seventeen.

## Declaring "zero or more types at once" with `each`

An ordinary generic parameter stands for *one* type:

```swift
func f<T>(_ x: T) { }   // T is exactly one type
```

A **type parameter pack** stands for *any number* of types — zero, one, or many — bundled together. You declare it by putting `each` in front of the name:

```swift
func f<each T>(_ x: ???) { }   // "each T" is a whole pack of types
```

Read `<each T>` as "a pack named `T`, holding some list of types." If you call `f` with three arguments of types `Int`, `String`, `Bool`, then inside `f` the pack `T` *is* the list `Int, String, Bool`. Call it with none, and the pack is empty.

The `each` keyword is the signal, everywhere it appears, that you are talking about a pack rather than a single type.

## Accepting one value per type with `repeat each`

A pack of *types* needs a matching pack of *values* — one value for each type. You describe the parameter's type with `repeat each`:

```swift
func f<each T>(_ items: repeat each T) { }
```

Read `repeat each T` as "one value for every type in the pack `T`." This is a **value pack**: if the type pack is `Int, String, Bool`, then `items` carries three values, one `Int`, one `String`, one `Bool`.

So the whole signature says: *take any number of arguments, of any types, and remember both the types and the values as parallel packs.* That single line replaces the entire stack of overloads from the top of the lesson.

```swift
f()                    // pack empty
f(1)                   // pack is Int
f(1, "hi", true)       // pack is Int, String, Bool
```

## Doing something to every element with `repeat`

A pack you can't touch is useless. The `repeat` keyword also drives **expansion**: it applies an expression once for every element in the pack.

Here is the mental model. Write `repeat` followed by an expression that mentions `each item`, and Swift stamps out a copy of that expression for every element:

```swift
func printAll<each T>(_ items: repeat each T) {
    repeat print(each item)
}
```

`repeat print(each item)` is not a loop that runs at runtime in the usual sense — think of it as the compiler *unrolling* the pack. For a three-element pack it expands, at compile time, into:

```swift
print(item0)
print(item1)
print(item2)
```

The slogan to remember: **`repeat` is map-over-the-pack, unrolled by the compiler.** Each expansion sees the matching element through `each item`.

Predict this before reading on. How many times does the body of `repeat print(each item)` run for a **3-element** pack?

Answer: three times — once per element. The pack has three elements, so the expression is stamped out three times, producing three `print` calls. An empty pack would produce zero calls.

## Parameterising a whole type with a pack

Packs are not just for functions. A **type** can be generic over a whole pack. Here is a tiny tuple-like container:

```swift
struct Bundle<each T> {
    let values: (repeat each T)
}
```

`Bundle<each T>` is one type definition that covers `Bundle<Int>`, `Bundle<Int, String>`, `Bundle<Int, String, Bool>`, and so on. The stored property `values` has type `(repeat each T)` — a tuple with one slot per element in the pack.

```swift
let pair = Bundle(values: (1, "hi"))          // Bundle<Int, String>
let triple = Bundle(values: (1, "hi", true))  // Bundle<Int, String, Bool>
```

Before parameter packs, `TupleView` needed a separate generic type for each arity. Now one generic type over `each T` expresses the whole family.

## A worked example: a real `zip` over any arity

Put the pieces together into the function that motivated the lesson — one definition that pairs values for two, three, or seven inputs:

```swift
func tuple<each T>(_ items: repeat each T) -> (repeat each T) {
    (repeat each items)
}
```

Two packs appear here, and they line up:

- The parameter `repeat each T` takes one argument per type in the pack.
- The return type `(repeat each T)` is a tuple with one slot per type.
- The body `(repeat each items)` expands the value pack into that tuple.

```swift
let a = tuple(1, "hi")          // a: (Int, String)      == (1, "hi")
let b = tuple(1, "hi", true)    // b: (Int, String, Bool)
let c = tuple(1, 2, 3, 4, 5)    // c: (Int, Int, Int, Int, Int)
```

One function, every arity, and each result keeps its exact static types — no `Any`, no casting.

## Constraining every element with `each T: Protocol`

Often you need every type in the pack to support some operation. You attach the constraint to the pack, and it applies to *every* element:

```swift
func allEqual<each T: Equatable>(...) { }
```

`<each T: Equatable>` reads "every type in the pack conforms to `Equatable`." Now inside the body you may use `==` on each element, because each one is guaranteed comparable.

Combining results across a pack is where expansion earns its keep. Say you want to check that two bundles are element-wise equal:

```swift
func equalPairs<each T: Equatable>(
    _ lhs: repeat each T,
    _ rhs: repeat each T
) -> Bool {
    var result = true
    repeat result = result && (each lhs == each rhs)
    return result
}
```

The `repeat` line expands to one `&&` comparison per element, each between the matching `lhs` and `rhs` value. Two packs expand *in lockstep* — element 0 with element 0, element 1 with element 1 — because they share the same pack shape `T`.

```swift
equalPairs(1, "hi", 1, "hi")     // true
equalPairs(1, "hi", 2, "hi")     // false — first pair differs
```

## Common pitfalls

- **Forgetting `each` at a use site.** Writing `print(item)` instead of `repeat print(each item)` refers to the pack as a whole, which isn't a value. You need `each` to pull out one element, and `repeat` to unroll.
- **Mismatched pack shapes.** Two packs can only expand together if they have the same length. `equalPairs` works because both parameters share the pack `T`; two independent packs `each A` and `each B` can't be zipped element-wise.
- **Expecting a runtime loop you can `break` out of.** `repeat` is compile-time unrolling of an expression, not a `for` loop. There's no index, no `break`, no `continue`.
- **Assuming empty packs are illegal.** A pack can have zero elements. `tuple()` returns `()`. Handle the empty case if it's reachable.

## Interview lens

If asked "what are parameter packs for?", lead with the problem: before them you hand-wrote one generic overload per arity — `zip<A,B>`, `zip<A,B,C>` — and capped out at some number, exactly like SwiftUI's ten-view `ViewBuilder` limit. Parameter packs let you write that generic once for any number of type parameters.

Know the three keywords cold. `each T` in the generic clause declares a *type pack* — zero or more types at once. `repeat each T` as a parameter or return type is a *value pack* — one value per type. `repeat someExpr(each x)` is *expansion* — the compiler unrolls the expression once per element, so it's map-over-the-pack, not a runtime loop.

The senior nuance interviewers probe: constraints like `<each T: Equatable>` apply to every element, and two packs sharing the same pack name expand in lockstep so you can combine them element-wise. If you can explain that `(repeat each items)` builds a tuple whose static types are preserved with no `Any` in sight, you've shown you understand why this is a type-system feature and not just syntactic sugar.
