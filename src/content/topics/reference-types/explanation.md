## The problem: who owns whom?

ARC frees an object when its **strong** count hits zero — so *which* references count as strong determines what stays alive. Sometimes you want a reference that **doesn't** keep the target alive (a child pointing back at its parent, a delegate). Swift gives you three ownership qualifiers — **`strong`** (default), **`weak`**, and **`unowned`** — and choosing correctly is how you both prevent leaks and avoid crashes.

## Strong references

A **strong** reference **owns** its target: it increments the reference count and keeps the object alive. It's the **default** — a plain `var`/`let` property or variable is strong.

```swift
class Engine {}
class Car { let engine = Engine() }   // `engine` is a strong reference; Car owns its Engine
```

Use strong for genuine ownership ("this object is part of me"). The danger is two objects owning each other → a **retain cycle** (next topic).

## Weak references & optionality

A **`weak`** reference does **not** keep its target alive (doesn't increment the count). When the target is deallocated, the weak reference **automatically becomes `nil`** — so it **must be an `Optional var`**.

```swift
class Apartment { weak var tenant: Person? }   // apartment doesn't own the tenant
```

Because it auto-nils, `weak` is **safe**: you never dereference a dangling pointer — you just get `nil`. The trade-off is you must handle the optional (`if let`/`guard let`). Use `weak` when the reference **may outlive** its target, or when the target's lifetime isn't under your control (delegates, back-references, observers).

## Unowned references & their danger

An **`unowned`** reference also doesn't keep its target alive, but — unlike `weak` — it is **non-optional and does not auto-nil**. It's a promise that the target **will always outlive** this reference. If you're wrong and access it after the target is deallocated, your app **crashes** (accessing a dangling reference).

```swift
class Customer { var card: CreditCard? }
class CreditCard { unowned let owner: Customer }   // a card always has an owner
```

`unowned` is like an implicitly-unwrapped, non-nilling weak: cheaper (no optional, no auto-nil bookkeeping) but **unsafe if the lifetime assumption breaks**. There's also `unowned(unsafe)` (no runtime safety check at all) — avoid it.

## Choosing weak vs unowned

Both break retain cycles; the deciding question is **relative lifetime**:

- **`weak`** — the reference **can outlive** the target (the target might be deallocated first). Safe: becomes `nil`. Requires optionality. **Default choice when unsure.**
- **`unowned`** — the reference will **never** outlive the target (the target is guaranteed to live at least as long). Non-optional, slightly cheaper, but **crashes** if the guarantee is violated.

The canonical example: **`Customer ⇄ CreditCard`**. A customer may exist without a card (`card: CreditCard?` — strong or optional), but a card can *never* exist without its customer, and the card can't outlive the customer → the card's `owner` is **`unowned`**. Conversely, a **delegate** should be **`weak`**, because the delegate (e.g. a view controller) can be deallocated while the object holding the delegate reference still lives.

## Lifetime guarantees

`unowned` is only correct when you can *prove* the target outlives the reference — typically when they're created together and one strictly contains the other for its whole life. If there's any path where the target could go away first, use **`weak`**. When in doubt, prefer `weak`: a `nil` you handle beats a crash you don't. In closures, the same choice appears as `[weak self]` vs `[unowned self]` (next topic) — same reasoning about relative lifetime.

## The interview lens

Give the three-way summary crisply: **`strong`** (default) **owns** and keeps the target alive (count++); **`weak`** does **not** own, **auto-nils** when the target deallocates (so it's an **optional**) — safe; **`unowned`** does **not** own, is **non-optional and does not auto-nil**, so accessing it after the target is gone **crashes** — use only when the target is **guaranteed to outlive** the reference.

The senior decision rule: choose **`weak` when the reference can outlive the target** (delegates, back-references you don't control) and **`unowned` when it can't** (e.g. `CreditCard.owner`), because unowned is cheaper but unsafe if that lifetime assumption is wrong. Default to `weak` when unsure — a handled `nil` is safer than a dangling-reference crash. Tie it back: this is exactly how you break the retain cycles ARC can't collect on its own.
