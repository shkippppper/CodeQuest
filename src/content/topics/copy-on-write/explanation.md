## The problem: value semantics without the copy cost

Value types are copied on assignment — great for safety (no shared mutable state), but a naive implementation would **deep-copy a million-element array every time you passed it**, which would be ruinously slow. Swift resolves this with **copy-on-write (COW)**: value types *behave* as if copied, but the underlying storage is **shared until someone mutates it** — only then is a real copy made. You get value semantics at reference-copy speed.

## Value semantics recap

A **value type** (struct, enum) is **copied** on assignment/passing, so each copy is independent — mutating one never affects another. That's the guarantee callers rely on:

```swift
var a = [1, 2, 3]
var b = a            // conceptually a copy
b.append(4)
print(a)             // [1, 2, 3] — unaffected
```

The question is: was that copy at `var b = a` *actually* made? For a big array, copying eagerly would be wasteful — hence COW.

## How COW works internally

Swift's collections (`Array`, `Dictionary`, `Set`, `String`) store their elements in a **heap buffer behind an internal class reference**. Copying the value type copies only that **reference** (cheap, O(1)) — so `a` and `b` **share** the same buffer. The buffer is duplicated **only when you mutate** a copy while it's shared:

```
var b = a       // b and a share one buffer (O(1))
_ = b[0]        // read → still shared (free)
b.append(4)     // MUTATION: buffer is uniquely-referenced? No → copy it, then mutate
```

So reads are always free; the O(n) copy happens lazily, at the first write to a shared buffer. Passing large arrays around is therefore cheap until someone writes.

## `isKnownUniquelyReferenced`

The mechanism that decides "copy or mutate in place" is **`isKnownUniquelyReferenced(&ref)`** — it returns `true` when the given class reference is the **only** strong reference (so mutating its buffer is safe), `false` when it's shared (so you must copy first). The standard library uses this internally; before mutating, it checks uniqueness and copies the buffer if it's shared.

```swift
if !isKnownUniquelyReferenced(&storage) {
    storage = storage.copy()   // shared → make our own before mutating
}
storage.mutate()               // now safe: we own it
```

## Implementing COW for a custom type

You get COW for free with stdlib collections. To give a **custom** value type COW (e.g. a struct wrapping a large buffer), you wrap the storage in a **class** and check uniqueness before mutating:

```swift
final class Box { var value: [Int]; init(_ v: [Int]) { value = v } }

struct COWArray {
    private var box: Box
    init(_ v: [Int] = []) { box = Box(v) }

    var values: [Int] { box.value }         // reads: no copy

    mutating func append(_ x: Int) {
        if !isKnownUniquelyReferenced(&box) {
            box = Box(box.value)             // shared → copy the storage first
        }
        box.value.append(x)                 // now uniquely owned → mutate in place
    }
}
```

The struct stays a value type to callers; internally it shares the `Box` across copies and duplicates it only on a mutation of a shared instance.

## Performance trade-offs

- **Wins:** copies and passing are O(1) until first mutation; you get value-semantics safety without eager deep copies.
- **Costs:** the **uniqueness check** on every mutation has a small overhead, and if you mutate a **shared** buffer you pay the **full O(n) copy** at that moment.
- **Gotchas:** an **unexpected extra reference** (e.g. capturing the array in a closure, or holding it elsewhere) makes the buffer non-unique, so a mutation that you expected to be in-place triggers a copy — a subtle performance cliff. Also, mutating in a loop while the buffer is shared can copy repeatedly. Use `reserveCapacity` and avoid accidental extra references to keep mutations in-place.

## The interview lens

Explain COW as **"value semantics with lazy copying"**: stdlib collections share a **heap buffer behind an internal class reference**, so copying the value copies only that reference (**O(1)**); the buffer is **duplicated only on the first mutation of a shared copy**. Name the mechanism — **`isKnownUniquelyReferenced(&ref)`** — which returns whether a reference is the sole owner, so the runtime can **mutate in place when unique** and **copy first when shared**.

Senior signals: implementing COW for a **custom** type (wrap storage in a class, check `isKnownUniquelyReferenced` before mutating, copy if shared), and the **performance gotcha** — an unexpected extra strong reference (a closure capture, another variable) makes the buffer non-unique, so a mutation you assumed was in-place triggers a full O(n) copy. The one-liner: reads are free, copies are lazy, and the cost lands exactly at the first write to shared storage.
