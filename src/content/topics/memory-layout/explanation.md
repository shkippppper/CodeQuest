## The problem: identical-looking code, different costs

These two types have the same fields:

```swift
struct PointS { var x = 0.0, y = 0.0 }
class  PointC { var x = 0.0, y = 0.0 }

let p1 = PointS()   // cheap
let p2 = PointC()   // allocation + reference counting + indirection
```

Same shape, very different runtime behavior — because their memory lives in different places. This lesson maps out those places, shows how to measure any type's footprint, and explains a performance surprise from earlier lessons: why wrapping a value in `any` can make it slower.

## The stack: fast and automatic

Every thread carries a **stack** — a region of memory that grows when a function is called and shrinks when it returns.

```swift
func demo() {
    let x = 42        // stack: allocated by bumping a pointer — nearly free
    let s = PointS()  // stack: same, 16 bytes further along
}                     // function returns → the whole region is reclaimed at once
```

Allocation on the stack is just moving a pointer forward. Freeing is even better: when the function returns, everything it stacked disappears automatically — no bookkeeping, no counting.

The limits: stack data must be fixed-size, and it can't outlive the function that created it. Small, short-lived, known-size values are the stack's sweet spot.

## The heap: flexible and costlier

The **heap** is the other region — shared by the whole program, for data that changes size or must outlive its creator.

Its flexibility has a price list. Allocating means *finding* a suitable free slot, with thread-safe bookkeeping since every thread shares the heap. And in Swift, heap objects are exactly what ARC spends its time counting.

The rule of thumb: stack is cheap and automatic; heap buys flexibility at the cost of allocation, ARC traffic, and a pointer indirection on every access.

## Where your values actually live

Now place the two `Point`s:

```swift
func demo() {
    let s = PointS()   // the 16 bytes of struct sit inline, on the stack
    let c = PointC()   // c is a pointer on the stack; the object is on the heap
}
```

The pattern generalizes. A value type — struct or enum — is stored *inline*, right where it's declared: on the stack for a local, or embedded inside whatever contains it. A class instance *always* lives on the heap; your variable holds only a reference to it.

Two caveats that trip people up:

```swift
struct Profile {
    var age: Int          // inline
    var name: String      // inline struct… whose characters live in a heap buffer
    var avatar: UIImage   // inline reference… to a heap object
}
```

First: "value type" does not mean "no heap." A struct containing a class reference — or a `String`, or an `Array` — stores the reference inline but the referenced storage on the heap.

Second: the optimizer can sometimes prove a class instance never escapes a function and place it on the stack anyway. A nice bonus — never something to rely on.

## Measuring types with MemoryLayout

Swift will tell you a type's exact footprint:

```swift
MemoryLayout<Int>.size    // 8   (on 64-bit)
MemoryLayout<Bool>.size   // 1
```

`size` is the number of bytes the value's data actually occupies.

Predict this one:

```swift
MemoryLayout<Int?>.size   // ?
```

Answer: `9`. An `Int` uses all 64 of its bits, so there's no spare bit pattern left to mean "nil" — the optional needs one extra byte just to record whether a value is present.

`MemoryLayout` reports two more numbers:

```swift
MemoryLayout<Int?>.size        // 9
MemoryLayout<Int?>.stride      // 16 — not 9!
MemoryLayout<Int?>.alignment   // 8
```

`alignment` says which address boundaries the type must start on — here, multiples of 8. `stride` is the distance from one element to the next inside an array: the size rounded up so the *next* element is properly aligned. That's the key nuance — arrays space elements by `stride`, not `size`, so `stride >= size` always.

One more measurement surprise:

```swift
MemoryLayout<PointC>.size   // 8 — the size of a pointer
```

For a class, `MemoryLayout` measures the *reference* you hold, not the heap object it points to.

## Padding and field order

Alignment has a visible consequence inside structs. Compare two orderings of the same three fields:

```swift
struct A { var flag: Bool; var value: Int; var flag2: Bool }
struct B { var value: Int; var flag: Bool; var flag2: Bool }

MemoryLayout<A>.size     // 17 — stride 24
MemoryLayout<B>.size     // 10 — stride 16
```

Where did `A`'s extra bytes come from? `flag` occupies byte 0, but `value` must start on an 8-byte boundary — so the compiler inserts 7 bytes of **padding**, filler that exists only to satisfy alignment. Then `value` fills bytes 8–15 and `flag2` lands at 16.

`B` packs cleanly: `value` at 0, both Bools right after — no padding needed between fields.

Same data, 24 versus 16 bytes per array element. Ordering fields from largest to smallest minimizes padding — worth knowing for big arrays of structs, for cache efficiency, and whenever you must match a C struct's layout exactly.

## The existential box

One last layout story — the memory behind `some` versus `any` from the opaque-types lesson.

When you write `any Shape`, Swift needs a fixed-size home for a value whose real size it can't know. That home is the **existential container**: a box with a small inline buffer — historically about three machine words — plus the type metadata and witness table.

The interesting part is what happens when the value doesn't fit:

```swift
struct SmallShape: Shape { var r: Double }                    // 8 bytes
struct HugeShape:  Shape { var a, b, c, d, e, f: Double }     // 48 bytes

let s: any Shape = SmallShape()   // fits the inline buffer — stored in place
let h: any Shape = HugeShape()    // too big — heap-allocated; the box holds a pointer
```

A small value hides inside the box itself. A large one gets *boxed onto the heap*, adding a hidden allocation and a pointer hop on every access.

That's the memory-level explanation for the earlier performance advice: `some P` and generics keep the concrete type, storing the value inline with no box — `any P` may silently buy a heap allocation. The keyword marks the spot where this cost can appear.

## Common pitfalls

- **"It's a struct, so no heap."** Wrong for any struct containing a class, `String`, `Array`, or other buffer-backed type — the wrapper is inline, the storage is heap.
- **Using `size` where `stride` matters.** Manual buffer math with `size` misplaces every element after the first; arrays and pointer arithmetic run on `stride`.
- **Measuring a class and reading 8.** `MemoryLayout` of a class type reports the pointer, not the instance behind it.
- **Large structs behind `any` in hot code.** Each one that outgrows the inline buffer is a hidden heap allocation — a generic or `some` avoids the box entirely.

## Interview lens

Start with the clean split: value types are stored inline — on the stack for locals, or embedded in their container — while class instances always live on the heap with the variable holding a reference. Then explain *why* that matters: heap means allocation cost, ARC traffic, and indirection, which is the root of "small value types are cheaper." Add the caveat that shows real understanding: a struct containing a class or a collection still owns heap storage.

On `MemoryLayout`, the distinction interviewers fish for is `size` versus `stride` versus `alignment`: arrays space by stride because of alignment padding, and `MemoryLayout<Int?>.size == 9` is the classic example — no spare bit in `Int`, so the optional pays an extra byte.

The senior-level connection is existential boxing: `any P` stores small values in the container's inline buffer but heap-boxes anything larger, alongside its metadata and witness table — the concrete, memory-level reason `any` can be slower than `some` or a generic. And if layout comes up in a performance context, mention that struct field order changes size via padding; it signals you've actually looked at the bytes.
