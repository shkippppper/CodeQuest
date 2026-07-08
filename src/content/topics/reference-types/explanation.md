## The problem: some references shouldn't count

From the ARC lesson: an object dies the moment its last strong reference disappears. Which means *every reference you write is a vote to keep something alive*. Look at this pair:

```swift
class Person { var apartment: Apartment? }
class Apartment { var tenant: Person? }
```

A person points at their apartment — fine, that feels like ownership. But the apartment pointing back at its tenant? If that reference also keeps the person alive, the person can never die while the apartment exists. Two mutual votes, and neither object can ever be freed.

Swift's answer is to let you choose *what kind* of reference each one is. There are three: `strong` — the default — plus `weak` and `unowned`, which don't vote at all.

## strong: owning references

Every plain reference you've ever written is strong:

```swift
class Engine {}
class Car {
    let engine = Engine()   // strong — Car owns its Engine
}
```

A **strong** reference owns its target: it adds one to the reference count and keeps the object alive. No keyword needed — it's what `var` and `let` do by default.

Use strong for genuine ownership, where the target is *part of* the owner. An engine without its car has no reason to exist.

The danger is symmetry: two objects strongly owning each other never reach count zero. That's the retain cycle from the ARC lesson — the next lesson dissects it fully. This lesson gives you the tools that break it.

## weak: a reference that lets go

Give `Person` a `deinit` so we can watch, and make the back-reference `weak`:

```swift
class Person {
    let name: String
    init(name: String) { self.name = name }
    deinit { print("\(name) deallocated") }
}

class Apartment {
    weak var tenant: Person?   // points at the tenant, doesn't own her
}
```

A **weak** reference does *not* increment the count. Watch the numbers:

```swift
let apartment = Apartment()
var ada: Person? = Person(name: "Ada")   // Ada's count: 1
apartment.tenant = ada                    // Ada's count: still 1 — weak doesn't vote
```

Predict: what does this print?

```swift
ada = nil
print(apartment.tenant)
```

Answer: first `Ada deallocated`, then `nil`. The only strong reference vanished, so Ada was destroyed on that line — and the weak reference *automatically became `nil`*.

That auto-nil behavior dictates weak's shape. It must be an `Optional`, because it needs to be able to hold `nil`. And it must be a `var`, because the runtime rewrites it behind your back — a `let` can't change.

Auto-nil is also why weak is *safe*: you can never follow a weak reference to a destroyed object. Worst case, you get `nil` and handle it with `if let` or `guard let`.

## unowned: a promise the target lives longer

Sometimes the optionality feels wrong. A credit card *always* has an owner — modeling that as `Customer?` lies about the domain:

```swift
class Customer {
    var card: CreditCard?
    deinit { print("customer deallocated") }
}

class CreditCard {
    unowned let owner: Customer   // non-optional, doesn't keep owner alive
    init(owner: Customer) { self.owner = owner }
}
```

An **unowned** reference also doesn't increment the count — but unlike weak, it's non-optional and it never auto-nils. It's a promise to the compiler: *the target will outlive this reference, guaranteed.*

Break the promise and here's what happens:

```swift
var customer: Customer? = Customer()
let card = CreditCard(owner: customer!)

customer = nil        // prints "customer deallocated" — card.owner now dangles
card.owner            // 💥 crash — accessing a destroyed object
```

No `nil`, no warning — a runtime crash. That's the trade: unowned is cheaper than weak (no optional unwrapping, no auto-nil bookkeeping) and cleaner to read, but only *correct* when the lifetime guarantee actually holds.

There's an even sharper knife, `unowned(unsafe)`, which skips the runtime safety check entirely — accessing it after deallocation is undefined behavior, not a clean crash. Avoid it.

## Choosing: ask who can die first

Both `weak` and `unowned` refuse to own. The deciding question is always *relative lifetime*:

- The reference **can outlive** its target → `weak`. You'll get `nil` and handle it.
- The target is **guaranteed to outlive** the reference → `unowned`. Non-optional, slightly cheaper.
- Not sure → `weak`. A `nil` you handle beats a crash you don't.

The canonical example is the pair you just saw. A customer may exist without a card, so `Customer.card` is an optional strong reference. But a card can never exist without — or outlast — its customer, so `CreditCard.owner` is `unowned`.

The canonical counter-example is a delegate:

```swift
protocol ScannerDelegate: AnyObject {}
class Scanner {
    weak var delegate: ScannerDelegate?   // the delegate may die before the scanner
}
```

A delegate — often a view controller — can be deallocated while the object holding the reference lives on. The scanner can't promise anything about the delegate's lifetime, so `weak` it is. The `AnyObject` constraint is required because `weak` only works on class references.

## Lifetime guarantees are your job

The compiler never verifies the unowned promise — you do. `unowned` is provably correct in one situation: the two objects are created together, and one strictly contains the other for its entire life. `CreditCard` inside `Customer` fits; so does an inner helper object that never escapes its owner.

If there is *any* code path where the target could be freed first — an async callback, a cached reference, an object handed to another owner — the promise is broken and `weak` is the answer.

The same choice reappears inside closures as `[weak self]` versus `[unowned self]`, with exactly the same lifetime reasoning. That's two lessons ahead.

## Common pitfalls

- **`weak let` or non-optional `weak`.** Doesn't compile — auto-nil requires a mutable optional `var`.
- **A weak-only object dies instantly.**

  ```swift
  weak var p: Person? = Person(name: "Ada")   // count never stays above 0
  print(p)                                     // nil — nobody owned her
  ```

  Something must hold the object strongly, or it's destroyed at once.
- **Choosing `unowned` for style.** "It avoids the optional" is not a lifetime proof. When the guarantee is fuzzy, that clean syntax is a deferred crash.
- **A strong delegate.** The default reference kind silently applies — forget `weak` on a delegate property and you've built the cycle the next lesson is about.

## Interview lens

If asked to compare the three, give the crisp version: `strong` is the default, owns the target, and increments the count; `weak` doesn't own, auto-nils when the target dies, and therefore must be an optional `var` — safe; `unowned` doesn't own, is non-optional, never nils, and crashes if you access it after the target is gone.

The real question behind it is the decision rule, so volunteer it: choose by relative lifetime. `weak` when the reference can outlive the target — delegates, back-references, anything whose lifetime you don't control. `unowned` only when the target provably outlives the reference, like `CreditCard.owner`. Default to `weak` when unsure, because a handled `nil` beats a dangling-reference crash.

Two details that mark a senior answer: delegates are `weak` *and* their protocols are `AnyObject`-constrained precisely because `weak` requires a class; and this whole topic exists to break the retain cycles ARC cannot collect on its own — which is where the interviewer is usually heading next.
