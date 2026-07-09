## The problem: one line, four objects deep

Look at this line, buried in a checkout screen:

```swift
let city = order.customer.address.city
```

It compiles. It works. But count how many objects this one expression reaches through: `order`, then its `customer`, then that customer's `address`, then that address's `city`. The checkout screen now knows the *entire internal shape* of `Order` — not just that an order has a customer, but that a customer has an address, and an address has a city.

If `Address` is ever refactored to store `cityName` instead of `city`, or `Customer` starts wrapping its address in an optional, this line breaks — along with every other line anywhere in the codebase that also reached this deep. That fragility has a name: the **Law of Demeter**, a guideline that says a piece of code should only talk to objects it directly knows about, not to objects reached by chaining through them.

## "Don't talk to strangers"

The Law of Demeter is often summarized as "don't talk to strangers." To see what counts as a stranger, look at what a method is normally allowed to call:

```swift
class CheckoutScreen {
    let order: Order

    func summary() -> String {
        return order.total()   // OK: order is a direct property of self
    }
}
```

Calling a method on `order` is fine — `order` is something `CheckoutScreen` directly holds. That's a "friend": an object you were handed directly, either as a property, a parameter, or something you created yourself.

```swift
func cityLabel() -> String {
    return order.customer.address.city   // order.customer.address is a stranger
}
```

`order.customer.address` is a **stranger**: an object `CheckoutScreen` never directly holds, only reaches by walking through `order`. The Law of Demeter's rule of thumb is that a method should only call methods on: `self`, its own parameters, objects it creates itself, and its own direct properties — never on an object it obtained by chaining through one of those.

## Train-wreck calls

That chained expression has its own name in the refactoring literature — a **train wreck**: a long chain of dots, each one a coupling to another object's internal structure, reading like linked train cars.

Watch a train wreck grow as requirements grow:

```swift
let city = order.customer.address.city
```

Now the checkout screen also needs the postal code, for tax calculation:

```swift
let postalCode = order.customer.address.postalCode
```

And now a discount depends on how long the customer has had an account:

```swift
let isLongTimeCustomer = order.customer.account.createdAt.timeIntervalSinceNow < -365 * 24 * 3600
```

Each new requirement adds another chain reaching through the same objects. Predict: if `Customer` is refactored so `account` becomes optional (some customers are guests with no account), how many of these three lines break?

Answer: only the third line breaks today — but every future line anyone writes that reaches through `.account` will need the same `nil`-handling fix, in every file that wrote a chain like this. The train wreck pattern means the same structural knowledge — "an order has a customer, which has an account, which has a createdAt" — gets duplicated across every call site instead of living in one place.

## Tell-don't-ask

The fix is to stop asking an object for its internals and instead tell the object what you want done, letting it use its own internals to do it:

```swift
struct Address {
    let city: String
    let postalCode: String
}

struct Customer {
    let address: Address

    func city() -> String {
        return address.city
    }
}
```

`CheckoutScreen` no longer reaches through `order.customer.address.city`. It asks the customer directly:

```swift
struct Order {
    let customer: Customer

    func customerCity() -> String {
        return customer.city()
    }
}

// call site:
let city = order.customerCity()
```

Each object exposes one small step of behavior for the layer directly above it, and only that layer above ever calls it. This is **tell-don't-ask**: instead of pulling data out of an object to make a decision *outside* it, you tell the object to make the decision (or hand back exactly the one thing you need) using data it already owns.

The tax and loyalty checks refactor the same way — push the logic *into* the object that owns the data, instead of pulling the data out:

```swift
struct Customer {
    let address: Address
    private let account: Account?

    func city() -> String { address.city }

    func isLongTime() -> Bool {
        guard let account else { return false }
        return account.createdAt.timeIntervalSinceNow < -365 * 24 * 3600
    }
}

// call site:
if order.customer.isLongTime() { /* apply loyalty discount */ }
```

Now the `nil`-handling for guest accounts lives in exactly one place — inside `Customer`, where `account` is declared — instead of being copy-pasted into every call site that needs to check it.

## Encapsulation benefits

Notice what `account` became in that last snippet: `private`. That's not incidental — tell-don't-ask and the Law of Demeter are really the same idea as **encapsulation**, keeping an object's internal data hidden and only exposing behavior, applied at the level of *call sites* instead of just access modifiers.

The payoff is that internal structure can change without breaking callers:

```swift
struct Customer {
    // was: private let account: Account?
    // now: private let accounts: [Account]   // supports multiple accounts

    func isLongTime() -> Bool {
        guard let oldest = accounts.min(by: { $0.createdAt < $1.createdAt }) else { return false }
        return oldest.createdAt.timeIntervalSinceNow < -365 * 24 * 3600
    }
}
```

`Customer` went from one optional account to an array of accounts, and `isLongTime()`'s signature and every call site are untouched. If callers had instead written `order.customer.account?.createdAt` directly, this change would break every one of them. Fewer places know about `Customer`'s internal shape means fewer places a refactor inside `Customer` can break.

## Pragmatic limits

The Law of Demeter is a guideline, not a compiler rule, and applying it with no judgment produces its own smell: a wrapper method for every single property, adding indirection without adding meaning.

```swift
// over-applying the rule: a pointless one-line forwarding method
struct Order {
    func customerName() -> String { customer.name() }
}
struct Customer {
    func name() -> String { name }
}
```

If `customerName()` does nothing but forward to `customer.name()` with no actual logic, you haven't reduced coupling — you've just moved the same coupling one layer down and added a method nobody needed. The rule exists to avoid *reaching through unrelated internal structure to make decisions*, not to ban every multi-level access.

Two more things worth knowing before applying this in review:

- **Fluent APIs are an intentional exception.** `builder.setTitle("x").setColor(.red).build()` chains dots, but each call returns `self` or a purpose-built builder — the chain isn't reaching into unrelated objects' internals, it's a deliberately designed interface.
- **Value types read differently than object graphs.** `order.subtotal.formatted()` walks through a `Decimal`'s own formatting method — that's calling a capability of a value you already hold, not reaching through a chain of *different* domain objects. The smell is specifically about crossing multiple *unrelated* object boundaries to grab internal data, not about calling any method at all on a returned value.

Apply the rule where a chain crosses object boundaries to extract data for a decision that logically belongs to one of those objects. Skip it where the chain is a deliberately exposed, stable interface, or a single value type doing its own job.

## Common pitfalls

- **Treating every dot-chain as a violation.** `a.b()` chained with `.c()` on the *result* of `b()` (a fluent builder or a value type's own API) isn't the same as reaching through unrelated stored properties.
- **Over-refactoring into pointless one-line wrappers.** A forwarding method with no logic just relocates the coupling instead of removing it.
- **Fixing the symptom instead of the object model.** Wrapping a train wreck in a free function (`extractCity(from: order)`) hides the chain without moving the responsibility to the object that actually owns the data.

## Interview lens

If asked to define the Law of Demeter, say it in one line: a method should only call methods on objects it directly knows about — `self`, its parameters, things it creates, and its own properties — not on objects reached by chaining through those.

If shown a train-wreck expression like `order.customer.address.city`, name the risk concretely: it duplicates knowledge of `Order`'s internal object graph at every call site, so a refactor deep inside `Customer` or `Address` can break code far away that has nothing to do with either type. Then propose **tell-don't-ask**: push a small method onto the object that owns the data, so callers ask for a result instead of walking the structure themselves.

If pushed on limits, don't apply the rule dogmatically — call out fluent builder APIs and value types' own methods as legitimate exceptions, and flag that turning every access into a one-line forwarding method just relocates coupling without removing it. Showing you know *when to stop* applying a principle reads as more senior than reciting the principle itself.
