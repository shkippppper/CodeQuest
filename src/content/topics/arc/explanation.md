## The problem: freeing memory at the right time

A class instance lives on the heap. Free it too early and you have a dangling pointer (crash); too late (or never) and you leak. Manual `retain`/`release` (old Objective-C) was error-prone. **Automatic Reference Counting (ARC)** automates it: the compiler **inserts the retain/release calls for you** at compile time, tracking how many strong references point at each object and deallocating it the instant that count hits zero. It's automatic, but not magic — you still control *ownership* (strong/weak/unowned), which is where bugs live.

## How ARC works

Every **class instance** carries a **reference count**. ARC increments it when a new **strong** reference is made, decrements it when one goes away, and **deallocates** the instance when the count reaches **0**.

```swift
class Person { let name: String; init(name: String) { self.name = name } }

var a: Person? = Person(name: "Ada")   // count = 1
var b = a                              // count = 2 (another strong ref)
a = nil                                // count = 1
b = nil                                // count = 0 → deallocated (deinit runs)
```

Key point: ARC applies to **reference types (classes, actors, closures)**, not value types — structs/enums are copied, not reference-counted.

## Reference counts

The count reflects **strong** references only. Assigning a class instance to a `var`/`let`, storing it in a property or array, or capturing it strongly in a closure each add to the count; those references going out of scope or being reassigned/set to `nil` subtract from it. **`weak`** and **`unowned`** references do **not** increment the count (next topic) — that's precisely how you avoid keeping objects alive forever.

## When objects deallocate

Deallocation is **deterministic**: it happens **immediately** when the last strong reference disappears, and the object's **`deinit`** runs at that exact moment (synchronously, on the current thread). This predictability is a big ARC advantage — you know exactly when cleanup fires.

```swift
class FileHandleWrapper {
    deinit { print("closing file") }   // runs precisely when count hits 0
}
```

If a `deinit` you expect **never runs**, the object is still strongly referenced somewhere — almost always a **retain cycle** (two objects holding each other) keeping the count above zero.

## ARC vs garbage collection

Contrast with tracing **garbage collection** (Java, Go, C#):

| | ARC | Garbage collection |
|---|---|---|
| When freed | **Deterministically**, at count 0 | Non-deterministically, when the GC runs |
| Cost model | Retain/release work spread through code | Periodic collection pauses |
| Cycles | **Not** auto-collected — you break them | Cycles collected automatically |
| `deinit`/finalizer timing | Precise, immediate | Whenever the collector decides |

ARC's trade-off: no runtime pauses and deterministic cleanup, but **it can't detect cycles** — a GC can. So in Swift, *you* are responsible for not creating retain cycles (with `weak`/`unowned`).

## Visualizing the object graph

Think of your objects as a **graph** of strong references. An object stays alive as long as it's **reachable via a strong path** from a live root (a local variable, a global, a view controller on screen). It's freed when no strong path reaches it. A **cycle** (A → B → A, all strong) keeps both alive even after every *external* reference is gone — they hold each other. Xcode's **Memory Graph Debugger** literally draws this graph so you can spot leaked objects and the strong references keeping them alive.

## The interview lens

Define ARC as **compile-time-inserted retain/release** that tracks **strong** references to **class instances** and **deallocates deterministically when the count hits 0** (running `deinit` immediately). Stress that it's for **reference types**, not value types, and that `weak`/`unowned` don't bump the count.

The senior contrast is **ARC vs GC**: ARC frees deterministically with no collection pauses but **cannot reclaim reference cycles** — a tracing GC can — so avoiding cycles (via `weak`/`unowned`) is *your* job. And the practical tell: a **`deinit` that never fires** signals something still holds a strong reference (usually a retain cycle) — reach for the **Memory Graph Debugger** to see the strong path keeping the object alive.
