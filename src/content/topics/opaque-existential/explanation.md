## The problem: "returns a Drawable" hides too much or too little

Two different needs look similar. Sometimes you want to **hide a complex concrete type** from callers while keeping it *one specific type* (SwiftUI's `body: some View`). Other times you genuinely need to hold **different concrete types together** (a `[any Shape]`). Swift distinguishes these with **`some`** (opaque types) and **`any`** (existentials) — same-looking syntax, opposite semantics and performance.

## Existential containers

An **existential** is a box that can hold *any* value conforming to a protocol, hiding the concrete type behind a uniform interface. Written **`any P`**:

```swift
let shape: any Shape = Circle()
let shapes: [any Shape] = [Circle(), Square()]   // heterogeneous — different types together
```

At runtime the box stores the value (inline if small, else heap-allocated) plus a **witness table** for dynamic dispatch. Its power is **heterogeneity**: one array can hold many different conforming types.

## `any` keyword & boxing cost

`any P` makes the existential explicit. The cost:

- **Boxing** — values are wrapped in a fixed-size container (small values inline, larger ones heap-allocated), with type metadata.
- **Dynamic dispatch** — method calls go through the witness table (an indirection), and the compiler can't specialize/inline them.

So `any` trades performance for flexibility. It's the right tool when you truly need to store/pass mixed concrete types, but wasteful when there's really only one type at a call site.

## Opaque types (`some`)

**`some P`** means "**one specific concrete type** that conforms to `P`, which I'm not naming." The *caller* can't see which type, but the compiler **knows it's a single, fixed type** — so full static typing and specialization apply, with **no box and no dynamic dispatch**.

```swift
func makeShape() -> some Shape {   // returns ONE concrete Shape type, hidden
    Circle()
}
```

Key rule: a function returning `some P` must return the **same** concrete type on every path (you can't return a `Circle` on one branch and a `Square` on another — that's what `any` is for). This is why SwiftUI's `body: some View` works: it's always one concrete (if enormous) view type.

## Reverse generics

`some P` is often called a **reverse (implicit) generic**. A normal generic lets the **caller** pick the type: `func f<T: P>() -> T` — caller decides `T`. An opaque return `-> some P` lets the **callee (implementation)** pick and hide the type; the caller just knows "it's some `P`." The identity is fixed and known to the compiler, but abstract to the caller — the inverse direction of a normal generic parameter.

## When to use which

| Use `some P` (opaque) | Use `any P` (existential) |
|---|---|
| One concrete type, hidden from caller | Many different concrete types together |
| Return types, SwiftUI `body` | Heterogeneous collections `[any P]` |
| Performance matters (static dispatch) | Flexibility matters (dynamic dispatch) |
| Same type on every code path | Different types per element/branch |

Rule of thumb: **reach for `some` first** (cheaper, more type info); use **`any` only when you need genuine heterogeneity**. For parameters, `func f(_ x: some P)` is shorthand for a generic `<T: P>`; `func f(_ x: any P)` accepts a boxed existential.

## Performance implications

- **`some P`**: no boxing, static/devirtualized dispatch, specializable/inlinable — as fast as using the concrete type.
- **`any P`**: boxing (possible heap allocation), witness-table dynamic dispatch, no specialization across the boundary.

In hot paths and return types, prefer `some` (or a generic). Since Swift 5.7 the compiler nudges you to write `any` explicitly precisely because existentials have this hidden cost — the keyword makes the trade-off visible.

## The interview lens

Draw the contrast crisply: **`any P` is an existential box** that can hold **different** concrete types (heterogeneous, e.g. `[any Shape]`) at the cost of **boxing + dynamic dispatch**; **`some P` is an opaque type** — **one specific hidden concrete type** — giving **static dispatch, no box**, but it must be the **same type on every path** (why `body: some View` works and can't switch types per branch).

Call `some` a **reverse generic**: a normal generic lets the **caller** choose the type; `some` lets the **implementation** choose and hide it while the compiler keeps full type identity. Guidance: **prefer `some` (or a generic constraint) for performance; use `any` only when you genuinely need a mix of types.** Bonus: Swift 5.7 requires the explicit `any` keyword to surface the existential's cost.
