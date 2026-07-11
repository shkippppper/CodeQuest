## The problem: checkout touches five different systems

Here's what "place an order" actually requires, written out honestly:

```swift
let items = cart.items
try inventory.reserve(items)
let total = pricing.calculateTotal(items, coupon: cart.coupon)
let charge = try await paymentGateway.charge(total, card: user.savedCard)
try shipping.scheduleDelivery(items, to: user.address)
notifications.send(.orderConfirmed(charge.id), to: user)
```

Six lines, five different subsystems — `inventory`, `pricing`, `paymentGateway`, `shipping`, `notifications` — each with its own API, its own error types, its own ordering requirements (you must reserve inventory *before* charging the card, or you might charge someone for something out of stock). Now imagine every screen that can trigger a purchase — the cart screen, a "buy again" button, a subscription renewal job — needs to know all five of these systems and get the ordering right, every time.

## One entry point in front of the mess

A **facade** is a single type that sits in front of a group of subsystems and offers one simple method that does the coordinating internally:

```swift
final class CheckoutFacade {
    private let inventory: InventoryService
    private let pricing: PricingService
    private let paymentGateway: PaymentGateway
    private let shipping: ShippingService
    private let notifications: NotificationService

    init(inventory: InventoryService, pricing: PricingService, paymentGateway: PaymentGateway,
         shipping: ShippingService, notifications: NotificationService) {
        self.inventory = inventory
        self.pricing = pricing
        self.paymentGateway = paymentGateway
        self.shipping = shipping
        self.notifications = notifications
    }

    func placeOrder(cart: Cart, user: User) async throws -> Order {
        try inventory.reserve(cart.items)
        let total = pricing.calculateTotal(cart.items, coupon: cart.coupon)
        let charge = try await paymentGateway.charge(total, card: user.savedCard)
        try shipping.scheduleDelivery(cart.items, to: user.address)
        notifications.send(.orderConfirmed(charge.id), to: user)
        return Order(chargeId: charge.id, items: cart.items)
    }
}
```

Now every call site collapses to one line:

```swift
let order = try await checkoutFacade.placeOrder(cart: cart, user: user)
```

The word **facade** literally means the front face of a building — you see one clean wall, not the wiring and plumbing behind it. That's exactly the job of this type: it's the front face of five subsystems, and it's the *only* thing most of the app needs to know about.

## What the facade is hiding

Notice what didn't change: `InventoryService`, `PricingService`, `PaymentGateway`, `ShippingService`, and `NotificationService` still exist, each doing exactly what they did before. The facade doesn't replace them or duplicate their logic — it just knows the correct order to call them in and hides that sequencing from everyone else.

Predict: if a second screen — say a "reorder last purchase" button — also needs to place an order, does it need to know that inventory must be reserved before the card is charged?

Answer: no. It calls `checkoutFacade.placeOrder(cart:user:)` exactly like the first screen did. The ordering rule lives in one place — inside the facade — instead of being a piece of tribal knowledge every call site has to get right independently.

## Facade vs a thin API layer

It's easy to confuse a facade with "just an API layer," so it's worth being precise about the difference. An API layer (say, a `UserAPI` wrapping `URLSession` calls) usually wraps *one* subsystem and mostly does format translation — JSON in, `User` struct out. A facade specifically coordinates *multiple* subsystems that already have their own independent APIs, and its value is entirely in the coordination, not in translating any single one of them.

```swift
// API layer: translates one subsystem's format. Not a facade.
struct UserAPI {
    func fetchUser(id: String) async throws -> User {
        let data = try await URLSession.shared.data(from: userURL(id))
        return try JSONDecoder().decode(User.self, from: data)
    }
}

// Facade: orchestrates five independent subsystems. This is the pattern.
final class CheckoutFacade { /* as above */ }
```

If you deleted the facade, could the caller still get the same result by calling the underlying methods directly, just with more code and more chances to get the order wrong? If yes, that's the signature of a real facade — it's pure convenience and correctness, layered over subsystems that could theoretically be called directly. An API layer, by contrast, is often *necessary*: without it there's no other way to get a `User` from the network response.

## Facades can be partial

A facade doesn't have to hide everything a subsystem can do — only what most callers need. `PaymentGateway` might support charges, refunds, and subscription management, but `CheckoutFacade` only exposes what checkout needs:

```swift
protocol PaymentGateway {
    func charge(_ amount: Double, card: Card) async throws -> Charge
    func refund(_ chargeId: String) async throws
    func createSubscription(plan: Plan, card: Card) async throws -> Subscription
}
```

`CheckoutFacade` only ever calls `charge`. If a refund flow is needed elsewhere, it either gets its own facade (`RefundFacade`) or, if refunds are rare and simple, callers use `paymentGateway.refund(_:)` directly — the facade is there to simplify the *common* path, not to become the only allowed door into every subsystem.

## Examples in real codebases

`URLSession`'s simple `data(from:)` method is a small facade in front of connection pooling, TLS negotiation, redirect following, and caching — you get one call instead of configuring each of those systems yourself. Many app-level "Manager" or "Service" types serve the same role: a `LocationManager` that presents one `currentLocation` property while hiding Core Location's authorization requests, delegate callbacks, and accuracy configuration underneath.

## Common pitfalls

- **Turning the facade into a god object.** Once one facade exists, it's tempting to keep adding unrelated methods to it until it does everything. Keep a facade scoped to one coordinated workflow — `CheckoutFacade` places orders, it doesn't also manage user profiles.
- **Hiding errors instead of translating them.** A facade should still surface failures meaningfully (which subsystem failed, and why) — swallowing every subsystem's error into one generic `OrderFailed` makes debugging harder, not easier.
- **Facading a single subsystem.** If there's only one thing being wrapped, you don't have a facade — you likely just have a wrapper or an API layer, and calling it a facade adds a misleading label without adding value.

## Interview lens

If asked what a facade is, describe the shape first: one type with a small, simple public interface that internally coordinates calls to several independent subsystems, in the correct order, so callers don't have to know that order themselves.

If asked why not just let each screen call the subsystems directly, name the two costs: duplicated coordination logic (the ordering rules get copy-pasted, and eventually drift out of sync), and a much larger surface area for callers to understand and get wrong. A facade centralizes both the sequencing and the risk.

If pushed on facade vs a plain API wrapper, the test is whether multiple independent subsystems are being coordinated (facade) or a single subsystem's data is being translated into a friendlier shape (API layer) — the two solve related but different problems, and a strong answer keeps them distinct instead of using "facade" as a catch-all for "wrapper."
