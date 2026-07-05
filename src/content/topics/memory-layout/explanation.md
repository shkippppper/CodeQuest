## The problem: where does a value actually live?

Two variables that look identical in code can behave very differently at runtime because of **where their memory lives**. A struct sits inline on the **stack** (fast, automatic); a class instance lives on the **heap** (reference-counted, indirect). Understanding stack vs heap — and how Swift measures type sizes — explains performance differences, why value types are usually cheaper, and surprises like "wrapping a value in `any` makes it slower."

## Stack vs heap allocation

- **Stack** — a per-thread region that grows/shrinks with function calls. Allocation is essentially free (bump a pointer) and automatic (freed when the scope exits). Great for small, fixed-size, short-lived data.
- **Heap** — a shared region for dynamically-sized or long-lived objects. Allocation is more expensive (find a slot, thread-safe bookkeeping) and, in Swift, tied to **ARC** (reference counting).

Rule of thumb: **stack = cheap & automatic; heap = flexible but costlier** (allocation + ARC + indirection).

## Where values & references live

- A **value type** (struct/enum) is stored **inline** where it's declared — on the **stack** for a local variable, or inline **within** its containing object.
- A **class instance** always lives on the **heap**; the variable holds a **reference** (pointer) to it. That reference itself may sit on the stack, but the object is heap-allocated and reference-counted.

```swift
struct Point { var x: Int; var y: Int }   // inline value (stack for a local)
class Node { var value = 0 }              // instance on the heap; you hold a reference
```

Caveat: a struct containing a class (or a stdlib collection) stores the *value* inline but the referenced buffer/object on the heap — so "value type" doesn't guarantee "no heap." And the optimizer can sometimes promote short-lived class instances to the stack, but you can't rely on it.

## `MemoryLayout`

**`MemoryLayout<T>`** reports a type's memory characteristics at compile time:

- **`size`** — bytes the value actually occupies.
- **`stride`** — bytes from one element to the next in an array (size rounded up for alignment; may be larger than `size`).
- **`alignment`** — the address boundary the type must start on.

```swift
MemoryLayout<Int>.size        // 8   (on 64-bit)
MemoryLayout<Bool>.size       // 1
MemoryLayout<Int?>.size       // 9   (Int has no spare bit → +1 discriminator byte)
MemoryLayout<Point>.stride    // 16  (two Ints)
```

Key nuance: **`stride`, not `size`, is what arrays use** — because of padding/alignment, `stride >= size`. (Reference types report pointer size — `MemoryLayout<Node>.size == 8` — since the variable is just a pointer.)

## Inline storage & existential boxing

When you use a protocol as an **existential** (`any P`), Swift stores the value in a fixed-size **existential container** (historically ~3 words of inline "buffer" plus type metadata and a witness table). If the value **fits inline**, it's stored in place; if it's **larger**, it's **boxed on the heap** and the container holds a pointer. So:

```swift
let a: any Shape = SmallStruct()   // may fit inline in the existential buffer
let b: any Shape = HugeStruct()    // too big → heap-allocated (boxed)
```

This "existential boxing" is a hidden heap allocation and indirection — a concrete reason `any P` can be slower than a generic or `some P` (which keep the concrete type and store it inline, no box). It's the memory-layout explanation for the performance advice from the opaque/existential topic.

## Alignment & size

**Alignment** requires a type to start at an address that's a multiple of its alignment (e.g. an `Int` on an 8-byte boundary). To satisfy alignment for fields, the compiler inserts **padding** between struct members, which is why a struct's `size`/`stride` can exceed the sum of its fields, and why **field order can change a struct's size** (grouping same-sized fields reduces padding). This matters for cache efficiency and when interoperating with C layouts.

## The interview lens

Draw the split: **value types are stored inline (stack for locals, or inside their container); class instances live on the heap and you hold a reference** — so heap allocation + ARC + indirection make reference types generally costlier than small value types. Note the caveat that a value type containing a class/collection still has heap-allocated storage.

Senior signals: **`MemoryLayout<T>`** with the **`size` vs `stride` vs `alignment`** distinction (arrays use **stride** because of padding; `MemoryLayout<Int?>.size` is 9). And **existential boxing** — `any P` stores small values inline but **heap-boxes** large ones (fixed-size existential container + metadata + witness table), which is the concrete memory reason `any` can be slower than generics/`some` that store the concrete type inline. Bonus: **alignment/padding** means struct field order can affect size.
