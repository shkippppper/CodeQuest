## The problem: "use structs" is advice without a mechanism

Every Swift style guide says to prefer structs over classes when you can. It's good advice, but repeated without a reason it's just folklore. This lesson is the mechanism: the four concrete places — allocation, copying, dynamic dispatch, and function-call overhead — where a value type's performance actually comes from, and how to check that you're really getting it.

## Stack allocation wins

```swift
func makePoint() -> PointS {
    let p = PointS(x: 1, y: 2)   // lives on the stack — bump a pointer, done
    return p
}
```

As the memory-layout lesson covers, a local struct is stored inline on the **stack** — the region of memory a function call bumps forward on entry and releases all at once on return. There's no search for free space and no bookkeeping: allocation is a pointer move, and deallocation is implicit when the function returns.

Compare the class version:

```swift
func makePoint() -> PointC {
    let p = PointC(x: 1, y: 2)   // allocated on the heap
    return p                      // + ARC retain as it escapes the function
}
```

`PointC` requires a heap allocation — finding a free block, with thread-safe bookkeeping since the heap is shared across the whole program — plus ARC has to retain the instance as it's returned out of the function, and eventually release it. None of that exists for the struct.

Predict: does *every* struct avoid the heap, always?

Answer: no. A struct containing heap-backed storage — a `String`, an `Array`, a class reference — still owns heap memory through that field; only the struct's own inline bytes are stack-allocated. And the Swift optimizer can sometimes prove a class instance never escapes a function and stack-allocate it anyway — a bonus, never something to design around.

## COW costs

Collections and `String` get value semantics without paying a copy on every assignment, through **copy-on-write** — covered in full in its own lesson. The performance-relevant summary: assignment copies a reference to shared storage (cheap), and the actual element-by-element copy is deferred until the first mutation of a *shared* buffer.

```swift
var a = largeArray            // cheap: shares storage with largeArray
var b = a                     // still cheap: shares storage with a
b.append(newItem)             // pays the full copy here — buffer was shared
```

The cost that trips people in interviews and in real code is the same one from that lesson: an extra strong reference you didn't notice — a closure capture, a stored property holding onto an older snapshot — silently keeps a buffer's reference count above one, turning a loop of "in-place" mutations into a loop of full copies.

```swift
var data = loadBigArray()
let snapshot = data           // extra reference — data's buffer is no longer unique
for i in data.indices {
    data[i] *= 2               // EVERY iteration re-copies, because snapshot still holds it
}
```

The general performance lesson: COW makes assignment and reads cheap unconditionally, but makes *mutation* cost conditional on uniqueness — and that conditional cost is invisible at the call site, which is exactly why it's worth knowing to look for.

## Existential overhead

Wrapping a value behind a protocol type introduces its own cost, distinct from COW — and it applies even to types that never touch a collection.

```swift
protocol Shape { func area() -> Double }
struct Circle: Shape { var r: Double; func area() -> Double { .pi * r * r } }

let shapes: [any Shape] = [Circle(r: 1), Circle(r: 2)]
```

As the memory-layout lesson covers, `any Shape` stores each value in a fixed-size **existential container** — a small inline buffer plus type metadata and a witness table. A `Circle` (one `Double`, 8 bytes) fits inline; a struct with six stored `Double`s wouldn't, and gets heap-boxed instead, adding a hidden allocation.

The dispatch cost is separate from the storage cost. Calling `.area()` on an `any Shape` goes through the **witness table** — a per-conforming-type table of function pointers, conceptually similar to a class's vtable — rather than being resolved directly at compile time:

```swift
for shape in shapes {
    total += shape.area()   // dynamic dispatch through the witness table — one indirection per call
}
```

Compare a generic function over the same values:

```swift
func totalArea<S: Shape>(_ shapes: [S]) -> Double {
    shapes.reduce(0) { $0 + $1.area() }   // concrete type known — can resolve statically
}
```

Here the compiler knows the concrete type `S` at the call site (or can specialize a generic instantiation for it, covered next), so `.area()` can often be resolved and even inlined directly — no witness-table indirection, no boxing, because there's no existential container involved at all. `some Shape` behaves like the generic case for this purpose: the concrete type is fixed and known, just hidden from the caller's signature.

## Inlining & specialization

The compiler's biggest lever on function-call overhead is deciding not to make the call at all. **Inlining** replaces a call site with the callee's body directly, eliminating call/return overhead and, more importantly, opening up further optimization across what used to be a function boundary.

```swift
@inline(__always)
func square(_ x: Double) -> Double { x * x }

let y = square(4.0)   // compiler substitutes: let y = 4.0 * 4.0
```

`@inline(__always)` is a strong request; the compiler also inlines automatically for small functions when it judges it profitable, and Whole Module Optimization (from the build-time lesson) widens the pool of candidates by letting the optimizer see across file boundaries within a module.

**Specialization** is the generics half of the same idea. A generic function is compiled once, generically, but for each concrete type it's actually called with, the compiler can generate a dedicated, fully-typed copy:

```swift
func identity<T>(_ x: T) -> T { x }

let a = identity(5)        // compiler can generate a specialized identity(Int) -> Int
let b = identity("hi")     // and a separate specialized identity(String) -> String
```

The specialized version has no generic overhead left — no boxing, no indirection through type metadata — it reads like you'd written `identity(_ x: Int) -> Int` by hand. This is why passing concrete types through generic collection/algorithm code (`Array.map`, `sorted(by:)`) is typically as fast as a hand-written loop: the standard library's generic implementation gets specialized for your concrete element type.

Specialization requires the compiler to see both the generic definition and the call site together, which is another reason module boundaries and library evolution mode (used for ABI-stable frameworks) matter for performance — a generic function whose body lives in a separately-compiled binary without WMO/cross-module optimization enabled may not get specialized for its callers.

## Measuring

None of the above is worth reasoning about in the abstract when the tools to check it are one profiling session away.

**Instruments' Time Profiler** shows where CPU time is actually going, sample by sample — the tool to reach for first when comparing "did switching this `any Shape` to a generic actually help," since it will show witness-table dispatch or specialized code directly in the call tree.

**Instruments' Allocations** instrument shows every heap allocation, with a stack trace for each — the tool that confirms whether a "value type" is quietly still allocating on the heap (an oversized existential, a struct wrapping a class, an un-specialized generic).

For quick, repeatable checks without leaving code, `XCTest`'s `measure` block runs a block ten times and reports average wall-clock time, useful as a regression guard once you've made a change and want to confirm it stuck:

```swift
func testAreaCalculation() {
    let shapes: [any Shape] = (0..<10_000).map { Circle(r: Double($0)) }
    measure {
        _ = shapes.reduce(0.0) { $0 + $1.area() }
    }
}
```

Run the same `measure` block against a generic `[Circle]` array instead of `[any Shape]`, and the difference in reported time is the existential-dispatch cost made concrete — the same shape of experiment applies to comparing struct vs. class, or COW-shared vs. COW-copied workloads.

The rule that ties this whole lesson together: every claim in it ("existentials box large values," "COW mutation of shared storage copies," "generics get specialized") is checkable, and in a real project it's worth actually checking rather than trusting the rule of thumb blindly — compilers and optimization heuristics change across Swift versions.

## Common pitfalls

- **Assuming "it's a struct" means no heap allocation.** True only for the struct's own inline bytes — a `String`/`Array`/class-reference field still owns heap storage.
- **Missing a stray reference that defeats COW.** A closure capture or leftover snapshot variable can turn a mutation loop from in-place into full-copy-every-iteration, invisibly.
- **Reaching for `any` by default.** It's the right tool when heterogeneous storage is genuinely needed; otherwise a generic or `some` avoids both the boxing risk and the witness-table dispatch.
- **Trusting a performance claim without profiling it.** Inlining and specialization decisions are compiler heuristics, not guarantees — Instruments' Time Profiler and Allocations are the way to confirm what actually happened.

## Interview lens

If asked why Swift favors value types for performance, give the mechanism, not the slogan: stack allocation avoids heap bookkeeping and ARC traffic entirely for a struct's own storage, and copy-on-write defers the one unavoidable cost — the real element copy — until it's actually needed, keeping assignment and reads cheap regardless of size.

The senior differentiator is naming the two costs that undo these wins: an existential (`any P`) that either heap-boxes an oversized value or pays witness-table dispatch on every call, and a stray strong reference that silently defeats COW's uniqueness check, turning cheap in-place mutation into repeated full copies. Both are invisible at the call site, which is exactly why they show up in interviews as "why is this slower than it looks."

Close with measurement: cite Instruments' Time Profiler for dispatch/CPU cost and Allocations for confirming heap traffic, and mention `XCTest`'s `measure` for a quick regression check — that shows you treat these as testable claims about a specific Swift compiler and optimization level, not universal rules to recite from memory.
