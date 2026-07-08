## The problem: "a Shape" can mean two different things

Start with a protocol and two conformers:

```swift
protocol Shape { func area() -> Double }

struct Circle: Shape { func area() -> Double { 3.14 } }
struct Square: Shape { func area() -> Double { 1.0 } }
```

Now two needs that *look* identical but aren't:

```swift
func makeShape() -> ??? { Circle() }     // hide the concrete type from callers
let shapes: [???] = [Circle(), Square()] // hold different types together
```

The first wants to hide *one* concrete type. The second genuinely needs to mix *many*. Swift spells them differently — `some Shape` and `any Shape` — and they have opposite behavior and opposite costs.

## any: a box that holds any conformer

Fill the second blank first:

```swift
let shape: any Shape = Circle()
```

`any Shape` is an **existential** — a box that can hold a value of *any* type conforming to `Shape`, hiding which one. The concrete type can even change:

```swift
var shape: any Shape = Circle()
shape = Square()                 // fine — the box now holds a Square
```

And that's what makes mixed collections possible:

```swift
let shapes: [any Shape] = [Circle(), Square()]   // different types, one array
```

This is the existential's superpower: heterogeneity — genuinely different concrete types living behind one uniform interface.

## What the box costs

The flexibility isn't free. Inside the box, the runtime stores the value plus a **witness table** — a lookup table that maps each protocol requirement to the concrete type's actual implementation.

```swift
for shape in shapes {
    shape.area()   // which area()? Looked up in the witness table, at run time
}
```

That lookup is **dynamic dispatch**: the method to call is decided while the program runs, not while it compiles. The compiler can't inline or specialize a call it can't see.

There's a storage cost too, called **boxing**. The existential container is a fixed size — a small value fits inline inside it, but a larger one gets moved out to separately allocated memory, and the box holds a pointer. The memory-layout lesson later shows the exact numbers.

So `any` trades speed for flexibility. That's a fine trade when you need the mix — and pure waste when there's really only one type at the call site.

## some: one hidden type

Now the first blank:

```swift
func makeShape() -> some Shape {
    Circle()
}
```

`some Shape` is an **opaque type**: one specific concrete type that conforms to `Shape`, which the function chooses and refuses to name. The *caller* can't see it's a `Circle` — but the *compiler* knows exactly what it is.

Because the compiler knows the real type, there's no box and no witness-table lookup. Calls dispatch statically, inline, specialize — as fast as using `Circle` directly.

Predict: does this compile?

```swift
func makeShape(flag: Bool) -> some Shape {
    if flag { return Circle() }
    return Square()
}
```

Answer: no. `some Shape` promises *one* concrete type on every path, and this function tries to return two. Returning genuinely different types is `any`'s job, not `some`'s.

That single-type rule is exactly why SwiftUI's `body: some View` works: however enormous the view expression gets, it's always one concrete type per `body`.

## some is a generic running in reverse

Put a normal generic next to an opaque return:

```swift
func pick<T: Shape>() -> T        // the CALLER chooses T
func make() -> some Shape         // the IMPLEMENTATION chooses, and hides it
```

With `<T: Shape>`, whoever calls the function decides the concrete type. With `some Shape`, the function body decides — and keeps the answer secret from the caller. Same machinery, opposite direction. That's why `some` is often called a **reverse generic**.

The type identity is still fixed and fully known to the compiler; it's only *abstract to the caller*.

One more place `some` appears — parameters:

```swift
func render(_ shape: some Shape) { ... }   // sugar for: func render<T: Shape>(_ shape: T)
func render(_ shape: any Shape) { ... }    // takes the box
```

A `some` parameter is just shorthand for a generic parameter. An `any` parameter accepts the boxed existential.

## Choosing between them

| | `some P` (opaque) | `any P` (existential) |
|---|---|---|
| Concrete types involved | Exactly one, hidden from caller | Many, mixed freely |
| Typical home | Return types, SwiftUI `body` | Heterogeneous collections `[any P]` |
| Dispatch | Static — inlinable, specializable | Dynamic — via witness table |
| Storage | The value itself, no box | Boxed; large values allocated separately |
| Branch rule | Same type on every path | Different types per element or branch |

The rule of thumb: reach for `some` first. It's cheaper and keeps more type information. Use `any` only when you need genuine heterogeneity — different concrete types in the same variable, array, or branch.

## The performance picture

Summing up what each choice costs:

- `some P` — no boxing, static dispatch, full specialization. Identical performance to naming the concrete type.
- `any P` — boxing with possible separate allocation, witness-table dispatch, and no specialization across the boundary.

In hot paths, prefer `some` or an explicit generic. And here's why the keyword exists at all: before Swift 5.7 you wrote a bare `Shape` and got an existential silently. Since 5.7 the compiler pushes you to write `any Shape` explicitly, precisely so the hidden cost has a visible label.

## Common pitfalls

- **Using `any` when there's one type.** `var shape: any Shape = Circle()` that only ever holds circles pays boxing for nothing — use the concrete type or `some`.
- **Expecting `some` to switch types per branch.** One concrete type per function, every path. Two branches with two types need `any` — or a redesign.
- **`[any P]` in a hot loop.** Every element access goes through the box and the witness table. Consider a generic algorithm or an enum of known cases instead.
- **Forgetting that `some` in parameters is just a generic.** `func f(_ x: some P)` doesn't box anything — it's sugar, and often the cleanest option.

## Interview lens

If asked the difference, draw the contrast in one breath: `any P` is an existential box that can hold *different* concrete types, paying boxing and dynamic dispatch; `some P` is an opaque type — *one* hidden concrete type — with static dispatch and no box, but it must be the same type on every return path.

The follow-up is usually SwiftUI: explain that `body: some View` works because each `body` produces exactly one concrete view type, and that this is why you can't return a `Text` in one branch and an `Image` in the other without a wrapper.

Drop the phrase "reverse generic" and explain it: a normal generic lets the caller pick the type, `some` lets the implementation pick and hide it while the compiler keeps full knowledge. Then give the guidance an interviewer wants to hear: prefer `some` or a generic constraint for performance, use `any` only for genuine heterogeneity — and mention that Swift 5.7 made the `any` keyword mandatory specifically to make the existential's cost visible in source code.
