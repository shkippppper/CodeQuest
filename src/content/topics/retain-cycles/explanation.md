## The problem: the leak ARC can't fix for you

ARC frees an object when its **strong** count hits zero. But what if two objects each hold a **strong** reference to the other? Even after every *outside* reference is gone, each still has a count of 1 — kept alive **by the other**. Neither ever reaches zero, so **neither is freed**: a **retain cycle** (a memory leak). ARC can't detect these, so recognizing and breaking them is a core skill.

## What a retain cycle is

A retain cycle is a **loop of strong references** — objects that transitively hold each other strongly, keeping the whole loop alive independent of any external reference. The telltale symptom: **`deinit` never runs** even after you drop all your references to the objects.

## Cycles between objects

The classic two-object cycle: a parent and child that both point at each other strongly.

```swift
class Parent { var child: Child? }
class Child  { var parent: Parent? }      // both strong

var p: Parent? = Parent()
var c: Child?  = Child()
p?.child = c
c?.parent = p                             // now p ⇄ c strongly

p = nil; c = nil                          // external refs gone, but…
// each still has count 1 (held by the other) → NEITHER deinits. Leak.
```

**Fix:** make one side **`weak`** (or `unowned`). Typically the "back" reference — the child's `parent` — is `weak`, expressing "the child doesn't own its parent."

```swift
class Child { weak var parent: Parent? }   // breaks the cycle
```

## Cycles in closures

The more common (and sneaky) case: a **closure captures `self` strongly**, and `self` **stores the closure** — closure ⇄ self.

```swift
class ViewModel {
    var onChange: (() -> Void)?
    func setup() {
        onChange = {
            self.reload()      // captures self STRONGLY
        }                       // self holds onChange; onChange holds self → cycle
    }
    func reload() {}
}
```

Because closures are reference types, storing an escaping closure that captures `self` creates a cycle. **Fix:** a **capture list** — `[weak self]` (or `[unowned self]`) — so the closure doesn't keep `self` alive (next topic covers this in depth).

```swift
onChange = { [weak self] in self?.reload() }
```

Note: a **non-escaping** closure (runs and returns before the function ends) generally **won't** cause a cycle — it doesn't outlive the call. The risk is with **escaping/stored** closures.

## Delegate cycles

A delegate held **strongly** is a classic cycle: object A owns B (its child/subview/controller), and B's `delegate` points back at A strongly → A ⇄ B.

```swift
protocol FooDelegate: AnyObject { }
class Foo { var delegate: FooDelegate? }        // ❌ strong delegate
```

**Fix:** declare delegates **`weak`** (which is why delegate protocols are usually `AnyObject`-constrained — `weak` requires a class):

```swift
class Foo { weak var delegate: FooDelegate? }   // ✅
```

## Breaking cycles

The universal fix: make **one** reference in the loop **non-owning** (`weak` or `unowned`), turning the loop into a line. Which one?

- Make the **back-reference weak** (child→parent, delegate→owner) — the side that logically doesn't own the other.
- In closures, use **`[weak self]`** by default; **`[unowned self]`** only when `self` is guaranteed to outlive the closure.
- You only need to break **one** link per cycle.

## Detecting leaks

Cycles are silent, so you hunt them:

- **`deinit` logging** — add `deinit { print("deinit X") }`; if it never prints when the object should die, suspect a cycle.
- **Xcode Memory Graph Debugger** — pauses the app and draws the object graph; leaked objects appear with a purple "!" and you can trace the strong references keeping them alive.
- **Instruments → Leaks / Allocations** — track objects that should have been freed but persist.

## The interview lens

Define a retain cycle as **two (or more) objects strongly referencing each other**, so ARC's counts never reach zero and **nobody deinits** — a leak ARC can't collect. Give the two canonical forms: **object ⇄ object** (parent/child, fixed by a `weak` back-reference) and **closure ⇄ self** (an escaping/stored closure capturing `self` strongly while `self` holds the closure, fixed with **`[weak self]`**), plus the **strong-delegate** cycle (fixed by a `weak` delegate — why delegates are `AnyObject` + `weak`).

Senior signals: you break a cycle by making **one** reference **non-owning** (`weak`/`unowned`) — usually the back-reference; **non-escaping** closures typically don't cause cycles (only escaping/stored ones do); and you **detect** them via `deinit` never firing, the **Memory Graph Debugger**, or Instruments' Leaks. The clean mental model: a cycle is a strong loop — turn it into a line by cutting one link.
