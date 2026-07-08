## The problem: copying a million elements would hurt

Run these two lines:

```swift
var a = Array(repeating: 0, count: 1_000_000)
var b = a
```

Arrays are value types — assignment copies. So did line two just copy a million elements?

If it did, Swift would be unusable: every function call that passes an array, every assignment, every property read would pay for a full duplication. Yet value semantics is the language's core promise. This lesson is about the trick that keeps both — **copy-on-write**, or COW: behave like a copy, but only *actually* copy when someone writes.

## The promise: value semantics

First, the behavior Swift must preserve, from the structs-vs-classes lesson:

```swift
var a = [1, 2, 3]
var b = a
b.append(4)
```

Predict: what does `print(a)` show?

Answer: `[1, 2, 3]`. Copies are independent — mutating `b` never affects `a`. Whatever optimization Swift plays underneath, this observable behavior is non-negotiable.

So the real question about `var b = a` isn't "does it behave like a copy" — it does, always. It's: *was the copy actually made on that line?*

## The trick: share until someone writes

Here's what an array really is inside. The struct you hold is tiny — it contains a reference to a separately allocated buffer where the elements actually live. That buffer sits on the **heap**, the region of memory for long-lived, size-changing data, managed by ARC like any class instance.

Now re-run the walk, watching the buffer:

```swift
var a = [1, 2, 3]   // a → buffer₁ [1,2,3]
var b = a            // b → buffer₁ — only the reference was copied. Constant time.
_ = b[0]             // read: buffers can be shared safely — still buffer₁, free
b.append(4)          // write to a SHARED buffer: copy it first, then mutate
```

After the `append`:

```swift
print(a)   // [1, 2, 3]    — a → buffer₁, untouched
print(b)   // [1, 2, 3, 4] — b → buffer₂, its own copy
```

That's the whole scheme. Copies and reads cost almost nothing, no matter the size. The expensive element-by-element copy happens *lazily* — deferred until the first write to a shared buffer, and skipped entirely if no one ever writes.

Value semantics survives intact: sharing is never observable, because any writer duplicates before touching shared data.

## The uniqueness check

How does `append` know whether its buffer is shared? One runtime function makes the decision:

```swift
if !isKnownUniquelyReferenced(&storage) {
    storage = storage.copy()   // someone else sees this buffer → get our own
}
storage.mutate()               // now safe: we're the only owner
```

**`isKnownUniquelyReferenced(&ref)`** answers a single question: is this class reference the *only* strong reference to its object? `true` — mutating the buffer in place is safe, nobody else can see it. `false` — the buffer is shared, so copy first.

This is a direct read of ARC's reference count. Every mutating method on `Array`, `Dictionary`, `Set`, and `String` runs this check before touching storage.

## Build COW yourself

Stdlib collections give you COW for free. A *custom* struct wrapping big storage doesn't get it automatically — but the recipe is short. Start with a class to hold the storage:

```swift
final class Box {
    var value: [Int]
    init(_ v: [Int]) { value = v }
}
```

The class is the point: class references are what ARC counts, so wrapping storage in one is what makes the uniqueness check possible.

Wrap it in a struct — first, the *wrong* way:

```swift
struct COWArray {
    private var box: Box
    init(_ v: [Int] = []) { box = Box(v) }

    var values: [Int] { box.value }

    mutating func append(_ x: Int) {
        box.value.append(x)         // ❌ mutates the shared box
    }
}
```

Copy this struct and both copies point at the same `Box` — so `append` on one *visibly changes the other*. That's not a performance bug; it's broken value semantics.

Add the check:

```swift
    mutating func append(_ x: Int) {
        if !isKnownUniquelyReferenced(&box) {
            box = Box(box.value)    // shared → copy the storage first
        }
        box.value.append(x)         // uniquely owned → mutate in place
    }
```

Now the struct is a genuine value type to its users: copies share the `Box` for free, and the first mutation on a shared copy pays for its own storage. Exactly what `Array` does internally.

## The costs and the cliff

COW isn't free — it moves costs around, and you should know where they land:

- Every mutation pays the uniqueness check. It's cheap — a reference-count read — but it's there.
- Mutating a *shared* buffer pays the full element-by-element copy, at that exact line. The cost of `var b = a` didn't vanish; it's waiting at `b`'s first write.

And the classic performance cliff — an extra reference you forgot about:

```swift
var data = loadBigArray()
let snapshot = data          // buffer now shared…
data.append(1)               // …so this "in-place" append copies everything
```

Any second strong reference — another variable, a stored property, a closure capture — makes the buffer non-unique, silently turning cheap in-place mutations into full copies. In a loop, that can mean copying repeatedly.

Defenses: call `reserveCapacity` before bulk appends, and keep an eye out for accidental long-lived references to collections you're actively mutating.

## Common pitfalls

- **Assuming assignment copies eagerly.** It doesn't — it shares. The copy is deferred to the first write, which is where profilers will show the time.
- **Assuming mutation is always cheap.** In-place is cheap; the first write to a *shared* buffer is a full copy.
- **A custom storage-class struct without the uniqueness check.** Not slow — *wrong*. Copies visibly mutate each other; value semantics is broken.
- **A stray reference before a mutation loop.** A closure capture or debug variable holding the collection defeats in-place mutation for the whole loop.

## Interview lens

The one-line definition to lead with: COW is value semantics with lazy copying — the collection's elements live in a heap buffer behind an internal class reference, so copying the value copies only the reference, and the buffer is duplicated only on the first mutation of a shared copy.

Name the mechanism, because that's the depth check: `isKnownUniquelyReferenced(&ref)` reports whether a class reference is the sole owner, letting mutating methods choose between mutate-in-place and copy-then-mutate. If you can sketch the custom-type recipe — storage in a `final class`, uniqueness check before every mutation, copy when shared — you've cleared the senior bar; bonus points for knowing that *omitting* the check breaks correctness, not just speed.

The other senior signal is the performance cliff: an unexpected extra strong reference — a second variable, a closure capture — makes the buffer non-unique, so a mutation you assumed was in-place pays a full copy. Close with the summary that sticks: reads are free, copies are lazy, and the cost lands exactly at the first write to shared storage.
