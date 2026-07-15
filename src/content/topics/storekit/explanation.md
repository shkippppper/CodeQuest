## The problem: you cannot be trusted with money

Say your app sells a "remove ads" upgrade. You'd like to write:

```swift
if userTapped {
    user.hasRemovedAds = true   // just flip a flag?
}
```

But nothing stops a user from patching that flag, and nothing here charged them. Real money has to change hands, and the proof of payment has to be something your app *can't* forge. That means Apple must run the transaction and hand you back a receipt you can trust.

The old system, **StoreKit 1**, did this with a maze of observer callbacks, and the proof of purchase was a binary receipt file you had to parse or send to a server to validate. It worked, but it was easy to get wrong.

**StoreKit 2** rewrote the whole thing around `async`/`await` and **signed transactions** — each transaction arrives already cryptographically signed by Apple, and the framework checks that signature for you on the device. This lesson walks the full flow: naming products, fetching them, buying one, verifying it, granting the content, and catching purchases that happen when you're not looking.

## Four kinds of thing you can sell

Before any code, you pick a **product type** for each thing in your catalog. There are four, and the type decides how ownership behaves.

A **consumable** is used up and can be bought again — 100 coins, an extra life. Once spent, it's gone; buying it again is a brand-new purchase.

A **non-consumable** is bought once and owned forever — "remove ads", a pro feature unlock. Buying it a second time should restore it, not charge again.

An **auto-renewable subscription** bills on a repeating schedule — monthly or yearly access — and renews itself until the user cancels.

A **non-renewing subscription** grants access for a fixed span with no automatic renewal — a "season pass" the user must re-buy manually when it lapses.

You never invent these on device. Each product gets an **identifier** you configure in **App Store Connect**, and that's the string your code will ask for.

## Fetching what you can sell

Your code starts by turning those identifiers into real products with prices:

```swift
let ids = ["com.app.coins100", "com.app.removeads"]
let products = try await Product.products(for: ids)
```

`Product.products(for:)` is `async` — it calls the App Store — and returns `[Product]`. Each `Product` carries the localized `displayName`, `description`, and a `displayPrice` already formatted in the user's currency:

```swift
for product in products {
    print(product.displayName, product.displayPrice)   // "100 Coins  $0.99"
}
```

You never hardcode a price. The App Store owns pricing, so `displayPrice` is the right string to show in your UI, correct for every region automatically.

## Making the purchase

To buy one, call `purchase()` on the product:

```swift
let result = try await product.purchase()
```

This suspends while the system shows Apple's payment sheet and the user confirms with Face ID or a password. When it resumes, `result` is a `PurchaseResult` — an enum with three cases you must handle:

```swift
switch result {
case .success(let verification):
    // payment went through — but see the next section first
    break
case .userCancelled:
    break   // user backed out; do nothing
case .pending:
    break   // waiting on approval (e.g. Ask to Buy)
@unknown default:
    break
}
```

`.userCancelled` means they closed the sheet — not an error, just nothing to do. `.pending` means the purchase isn't final yet; a common cause is **Ask to Buy**, where a child's purchase waits for a parent's approval. You show a "waiting" state and the real result arrives later through a listener we'll build at the end.

`.success` is the interesting one — but notice it does **not** hand you a finished transaction. It hands you a `verification`. That gap is deliberate.

## The security core: verify before you believe

The value inside `.success` has type `VerificationResult<Transaction>`. StoreKit already checked Apple's cryptographic signature on the transaction **on the device**, and it reports the outcome as one of two cases:

```swift
case .success(let verification):
    switch verification {
    case .verified(let transaction):
        // signature checks out — this purchase is real
        break
    case .unverified(let transaction, let error):
        // signature FAILED — do not trust this
        break
    }
```

A **verified** result means the transaction's signature matched Apple's — the payment genuinely happened. An **unverified** result means the signature check failed, which points at tampering or a corrupted transaction.

The rule is simple and absolute: **reject `.unverified`.** Never grant content from it. This one check replaces all the receipt-parsing and server round-trips of StoreKit 1 — the framework does the cryptography, and your job is only to refuse anything that doesn't pass.

Because you'll unwrap verification results all over your code, most apps write one helper:

```swift
func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
    switch result {
    case .verified(let safe):
        return safe                       // trusted — hand it back
    case .unverified:
        throw StoreError.failedVerification
    }
}
```

Now the happy path reads cleanly: unwrap, and if it throws, you never reach the "grant content" line.

## Grant the content, then finish the transaction

Once you have a `.verified` transaction, do two things in order:

```swift
let transaction = try checkVerified(verification)

await grantAccess(to: transaction.productID)   // 1. give the user what they paid for
await transaction.finish()                      // 2. tell StoreKit you're done
```

First unlock the feature or add the coins. Then call `transaction.finish()`. Calling `finish()` tells the App Store you've delivered the goods, and it stops resurfacing this transaction.

Predict what happens if you forget `finish()`. The transaction stays in the "unfinished" queue, and StoreKit will keep re-delivering it to your app on every launch, thinking you never handled it. For a consumable, that can look like the user gets their coins again and again. So `finish()` is not optional cleanup — it's how you acknowledge delivery.

## What does the user own right now?

A one-time purchase is easy to grant in the moment, but on the next launch — or a new device — how do you know the user already bought "remove ads"? You ask StoreKit for the current truth:

```swift
for await result in Transaction.currentEntitlements {
    if case .verified(let transaction) = result {
        await grantAccess(to: transaction.productID)
    }
}
```

`Transaction.currentEntitlements` is the **source of truth** for everything the user currently owns: non-consumables they've bought and subscriptions that are still active. Note it yields `VerificationResult`s too, so you verify each one the same way.

This is also exactly what a **Restore Purchases** button does — there's no special "restore" API in StoreKit 2. You simply iterate `currentEntitlements` again and re-grant what's there. When you need the single most recent transaction for one product, `Transaction.latest(for: productID)` gives you that.

Consumables are the exception: once finished, they drop out of `currentEntitlements`, because "100 coins" isn't an ongoing entitlement — it's your job to track the balance you added.

## The listener that catches purchases you didn't start

Here's the piece people forget. Not every transaction comes from *your* `purchase()` call. A subscription renews next month on its own. An **Ask to Buy** approval lands hours after the child tapped buy. The user bought the upgrade on their iPad and just opened your app on their iPhone.

None of those flow through the `purchase()` you awaited — so you need a second channel that's always listening:

```swift
Transaction.updates   // an AsyncSequence of every transaction, from anywhere
```

You start observing it at launch, in a long-lived task, and never stop:

```swift
func listenForTransactions() -> Task<Void, Never> {
    Task.detached {
        for await result in Transaction.updates {
            if case .verified(let transaction) = result {
                await grantAccess(to: transaction.productID)
                await transaction.finish()
            }
        }
    }
}
```

Start this task the moment your app launches — before the user touches anything — so a renewal or a deferred approval is caught even if the user never opens your store screen.

Predict what breaks if you skip this listener. Direct purchases still work, because those come back from `purchase()`. But **auto-renewals, Ask to Buy approvals, and purchases made on another device arrive silently and are missed** — the user paid and got nothing, because your app was never told. That's the classic StoreKit 2 bug, and it traces to a missing `Transaction.updates` loop.

## Testing without spending real money

You don't test this against the live store. Xcode gives you a local **StoreKit configuration file** — a `.storekit` file where you define products, prices, and even simulate renewals and Ask to Buy, all offline on the simulator. It's fast and needs no server.

Once the local flow works, move to the **Sandbox**: a real App Store environment tied to special test accounts, where purchases talk to Apple's servers but charge nothing. Sandbox catches the things a local file can't — real account states, real renewal timing. The order is always local config first, Sandbox second, production last.

## Common pitfalls

- **Trusting a purchase without verifying.** Every `.success` and every entitlement is a `VerificationResult` — always reject `.unverified` before granting anything.
- **Forgetting `transaction.finish()`.** An unfinished transaction gets re-delivered on every launch, which can double-grant consumables. Grant first, then finish.
- **No `Transaction.updates` listener at launch.** Renewals, Ask to Buy approvals, and cross-device purchases arrive outside your `purchase()` call and are lost without it.
- **Hardcoding prices or product names.** Read `displayPrice` and `displayName` from the fetched `Product` so currency and localization are correct everywhere.
- **Treating consumables like they persist.** They leave `currentEntitlements` once finished — track their balance yourself.

## Interview lens

If asked to walk through an in-app purchase, narrate the flow in order: fetch with `Product.products(for:)`, buy with `product.purchase()`, handle the three `PurchaseResult` cases, and on `.success` unwrap the `VerificationResult`. Say the word *verify* early — it's the part interviewers are listening for.

The follow-up is almost always about trust. Explain that StoreKit 2 checks Apple's signature on device and gives you `.verified` vs `.unverified`, and that you must refuse `.unverified`. Contrast it with StoreKit 1's manual receipt parsing to show you know why the redesign happened.

Then volunteer the two things juniors miss: call `transaction.finish()` after granting content, and observe `Transaction.updates` from launch so renewals and Ask to Buy approvals aren't dropped. Mention that `Transaction.currentEntitlements` is your source of truth for what the user owns and doubles as Restore Purchases. Finishing with "I'd test it against a local StoreKit config file, then Sandbox" signals you've actually shipped one.
