## The problem: ARC's blind spot, up close

The ARC lesson ended with a warning about objects pointing at each other. Time to trigger the bug on purpose. Two classes, both with `deinit` loggers, both with plain strong properties:

```swift
class Parent {
    var child: Child?
    deinit { print("parent deallocated") }
}

class Child {
    var parent: Parent?
    deinit { print("child deallocated") }
}
```

Wire them together, tracking the counts:

```swift
var p: Parent? = Parent()   // Parent count: 1
var c: Child? = Child()     // Child count: 1
p?.child = c                // Child count: 2
c?.parent = p               // Parent count: 2
```

Predict: what prints when we drop both variables?

```swift
p = nil
c = nil
```

Answer: *nothing*. `p = nil` takes Parent's count from 2 to 1 — the child's `parent` property still holds it. `c = nil` takes Child's count to 1 — the parent's `child` property still holds *it*. Neither count reaches zero. Neither `deinit` runs. Ever.

## What a retain cycle is

What you just built is a **retain cycle**: a loop of strong references, where each object keeps the next one alive around the circle.

No variable in your code can reach these two objects anymore. But ARC only counts references — it doesn't check reachability — so a loop that holds itself is, to ARC, two perfectly alive objects. This is the one kind of garbage ARC can never collect.

The telltale symptom is the one you just saw: a `deinit` that never runs even after you've dropped every reference you own. When debugging, that silence is your number-one leak clue.

## Breaking the object cycle

The fix comes from the previous lesson: make one reference in the loop non-owning.

```swift
class Child {
    weak var parent: Parent?   // the child doesn't own its parent
    deinit { print("child deallocated") }
}
```

Rerun the walk with the weak back-reference:

```swift
p = nil   // Parent count: 0 — the child's weak ref doesn't count. "parent deallocated"
          // …and the dying parent releases its child: Child count: 2 → 1
c = nil   // Child count: 0. "child deallocated"
```

Both `deinit`s print. The loop became a line, and lines drain to zero.

Which side to weaken? The *back-reference* — the one that points "up" or "backwards" in the ownership story. A parent owns its child; a child merely knows about its parent. The knower goes `weak`.

## The sneakier cycle: closures

Object-to-object cycles are easy to spot in a code review. The version that actually bites people hides inside closures — because closures are reference types, and they capture strongly by default:

```swift
class ViewModel {
    var onChange: (() -> Void)?
    func reload() {}
    deinit { print("viewmodel deallocated") }

    func setup() {
        onChange = {
            self.reload()   // the closure captures self — strongly
        }
    }
}
```

Trace the loop: `self` stores `onChange`, and `onChange` captures `self`. Closure ⇄ object — the same circle as parent ⇄ child, just with one participant being a closure.

Confirm the leak:

```swift
var vm: ViewModel? = ViewModel()
vm?.setup()
vm = nil        // prints nothing — leaked
```

The fix is a **capture list** — the bracketed note at the start of a closure that changes how it captures:

```swift
onChange = { [weak self] in
    self?.reload()          // closure holds self weakly — no cycle
}
```

Capture lists are the entire next lesson; for now, `[weak self]` reads as "don't keep `self` alive on my account."

One scoping note that saves a lot of unnecessary `[weak self]`: only closures that *outlive the call* can form cycles. A non-escaping closure — one that runs and finishes before the function returns, like the body of `map` — is gone before any cycle could matter. The risk lives in escaping closures: ones that are stored in properties or run later.

## The delegate cycle

The third classic wears a costume, but it's the same loop:

```swift
protocol FooDelegate: AnyObject {}

class Foo {
    var delegate: FooDelegate?   // ❌ strong delegate
}
```

Picture the usual setup: a view controller owns a `Foo`, and sets *itself* as the delegate. Now the controller strongly holds `Foo`, and `Foo.delegate` strongly holds the controller back. Owner ⇄ owned — a cycle.

The fix is the delegate convention you've seen in every framework:

```swift
class Foo {
    weak var delegate: FooDelegate?   // ✅
}
```

And now the `AnyObject` on the protocol makes sense: `weak` only works on class references, so delegate protocols are constrained to classes *specifically so the delegate property can be weak*.

## Breaking cycles: cut one link

Every fix above is the same move. To kill a cycle:

- Make exactly **one** reference in the loop non-owning — `weak` or `unowned`. One cut per loop is enough.
- Cut the back-reference: child → parent, delegate → owner, closure → self. The side that logically doesn't own the other.
- In closures, default to `[weak self]`; use `[unowned self]` only when `self` provably outlives the closure — the same lifetime rule as the previous lesson.

The mental model to keep: a cycle is a strong *loop*. Turn it into a *line*, and ARC drains it naturally.

## Hunting leaks

Cycles are silent — no crash, no warning, just memory that never comes back. Three tools, in the order you'll actually use them:

- **`deinit` logging.** Add `deinit { print("deinit \(Self.self)") }` to a suspect class. Trigger the flow that should destroy it. No print → something still holds it strongly → suspect a cycle.
- **Xcode's Memory Graph Debugger** — the small branching icon in the debug bar. It pauses the app and draws the real object graph; leaked objects get a purple `!` badge, and clicking one shows exactly which strong references are keeping it alive.
- **Instruments → Leaks and Allocations.** For the long-session view: objects that should have died but whose population keeps growing.

## Common pitfalls

- **Cycles longer than two.** A → B → C → A leaks exactly the same way; the loop just has three links. One `weak` anywhere in the ring still fixes it.
- **Weakening every reference "to be safe."** Over-weakened objects die early and your weak references go `nil` mid-flight. One non-owning link per cycle; ownership stays strong.
- **Assuming non-escaping closures need `[weak self]`.** They don't outlive the call, so they can't hold a cycle — the annotation is just noise there.
- **Believing ARC will eventually notice.** It won't. There is no cycle detector — prevention and hunting are entirely on you.

## Interview lens

Define it plainly: a retain cycle is two or more objects holding strong references in a loop, so no count in the loop ever reaches zero and none of them ever deinits — a leak ARC structurally cannot collect, because ARC counts references rather than tracing reachability.

Then give the three canonical shapes, because interviewers expect all three: object ⇄ object, fixed with a `weak` back-reference; closure ⇄ self, where a stored escaping closure captures `self` while `self` stores the closure, fixed with `[weak self]`; and the strong delegate, fixed by `weak var delegate` — which is also your chance to explain *why* delegate protocols are `AnyObject`-constrained.

Senior signals: you only need to break one link per cycle, and you choose the back-reference; non-escaping closures don't cycle, so `[weak self]` there is noise; and you detect leaks via `deinit` that never fires, the Memory Graph Debugger, or Instruments. Close with the one-liner — a cycle is a strong loop; cut one link and it's a line.
