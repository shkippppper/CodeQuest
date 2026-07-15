import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sk-why-storekit2",
    type: "mcq",
    prompt: "Why did StoreKit 2 replace the observer-and-receipt design of StoreKit 1?",
    options: [
      "So purchases could be granted purely from a local flag the app sets, with no server or Apple involvement needed at all",
      "Because the App Store stopped supporting non-consumable products and every remaining product type had to be re-modelled from scratch",
      "It moved to async/await and delivers each transaction already signed by Apple, checked on device — replacing manual receipt parsing",
      "To let the app compute its own prices offline instead of relying on the slow and frequently unavailable App Store pricing servers",
    ],
    answer: 2,
    explanation:
      "StoreKit 1 leaned on observer callbacks and a binary receipt you parsed or validated on a server. StoreKit 2 is `async`/`await` and hands you **signed transactions** the framework verifies on device — that's the whole point of the redesign.",
  },
  {
    id: "sk-product-types",
    type: "mcq",
    prompt: "A pack of 100 coins that the user spends and can buy again is which product type?",
    options: [
      "A non-consumable, since the app records the identifier permanently the first time and simply revalidates that same entitlement on later launches",
      "A consumable",
      "An auto-renewable subscription, because the coins are effectively replenished on a schedule the store manages on the user's behalf automatically",
      "A non-renewing subscription that grants a fixed allotment for a set window and must be manually purchased again once the balance is exhausted",
    ],
    answer: 1,
    explanation:
      "Coins are **consumable** — used up and re-purchasable. A non-consumable is bought once forever (remove ads); subscriptions bill for access over time. Consumables also drop out of `currentEntitlements` once finished.",
  },
  {
    id: "sk-fetch-products",
    type: "predict",
    prompt: "What does `Product.products(for:)` return, and where do the prices come from?",
    code: "let products = try await Product.products(for: ids)",
    options: [
      "A dictionary keyed by identifier whose values are prices you first registered in a local plist bundled inside the shipped app binary",
      "An [Product] with localized displayName and displayPrice, priced by the App Store per region — you never hardcode the price",
      "A stream you must keep observing because product metadata is pushed incrementally and no single snapshot is ever considered complete",
      "The raw signed receipt data for each identifier, which you then decode yourself to pull out the display name and the formatted price string",
    ],
    answer: 1,
    explanation:
      "It's `async`, calls the App Store, and returns `[Product]`. Each `Product` carries localized `displayName` and a region-correct `displayPrice`. The store owns pricing, so you show `displayPrice`, never a hardcoded number.",
  },
  {
    id: "sk-purchase-result",
    type: "multi",
    prompt: "`try await product.purchase()` returns a `PurchaseResult`. Select **all** of its cases you must handle.",
    options: [
      ".success, carrying a verification result you still have to check",
      ".userCancelled, when the user dismisses the payment sheet",
      ".pending, e.g. an Ask to Buy purchase awaiting approval",
      ".failed, carrying the StoreKit error that caused the charge to be declined by the payment processor",
    ],
    answers: [0, 1, 2],
    explanation:
      "The three cases are `.success(verification)`, `.userCancelled`, and `.pending`. There is no `.failed` case — a genuine failure is thrown as an error, which is why the call is `try`.",
  },
  {
    id: "sk-verification-fill",
    type: "fill",
    prompt:
      "A successful purchase carries a VerificationResult with two cases: `.verified` and `.___`. You must reject the latter and never grant content from it.",
    answers: ["unverified"],
    hint: "The opposite of verified — the signature check failed.",
    explanation:
      "`VerificationResult` is `.verified` (Apple's signature matched) or `.unverified` (it failed). StoreKit checks the signature on device; your job is to refuse `.unverified`.",
  },
  {
    id: "sk-verified-meaning",
    type: "mcq",
    prompt: "What does a `.verified` transaction actually guarantee?",
    options: [
      "That you sent the receipt to your own backend server, which called Apple's validation endpoint and returned a positive verdict for it",
      "That the user's payment method has enough remaining balance to also cover any future auto-renewals of the same subscription product",
      "That StoreKit checked Apple's cryptographic signature on the transaction on device and it matched — the purchase is genuine",
      "That the transaction has already been finished, so it will not be redelivered to the app through the updates listener on the next launch",
    ],
    answer: 2,
    explanation:
      "`.verified` means the on-device signature check passed — no server round-trip required. It says nothing about whether you've called `finish()`; that's a separate step you still owe StoreKit.",
  },
  {
    id: "sk-finish-predict",
    type: "predict",
    prompt: "You grant the coins but never call `transaction.finish()`. What happens?",
    code: "await grantCoins(transaction.productID)\n// transaction.finish() is missing",
    options: [
      "Nothing visible — StoreKit treats a granted transaction as finished automatically once the purchase sheet has been dismissed by the user",
      "The purchase silently reverts and the user is refunded, because an unfinished transaction is interpreted as undelivered and rolled back",
      "The transaction stays unfinished and StoreKit re-delivers it on each launch, which can re-grant the consumable again and again",
      "The next call to purchase() throws, since StoreKit refuses to start a new transaction while a previous one remains in the unfinished queue",
    ],
    answer: 2,
    explanation:
      "`finish()` acknowledges delivery. Skip it and the transaction stays in the unfinished queue and is re-delivered every launch — for a consumable that looks like the coins keep getting granted. Grant first, then finish.",
  },
  {
    id: "sk-entitlements-senior",
    type: "mcq",
    prompt:
      "On a fresh device, how do you know the user already owns your non-consumable 'remove ads', and how do you implement Restore Purchases?",
    difficulty: "senior",
    options: [
      "Persist a bought flag in the keychain at purchase time and read it back later, syncing it across the user's devices through iCloud key-value storage",
      "Iterate `Transaction.currentEntitlements` — the source of truth for what's owned — verifying each; Restore is just iterating it again",
      "Replay every past `PurchaseResult` your app cached to local disk during previous sessions and re-apply whichever ones ended in a success case",
      "Call `product.purchase()` again for each product and rely on the store to return the existing entitlement instead of charging the user twice",
    ],
    answer: 1,
    explanation:
      "`Transaction.currentEntitlements` is the source of truth for what the user currently owns. There's no separate restore API — Restore Purchases simply iterates it and re-grants. Verify each `VerificationResult` as you go.",
  },
  {
    id: "sk-updates-senior",
    type: "predict",
    prompt:
      "You handle purchases only through the value returned by `product.purchase()` and never observe `Transaction.updates`. What breaks?",
    code: "// no Task { for await r in Transaction.updates { ... } }",
    options: [
      "Nothing meaningful — every transaction, including renewals and deferred approvals, is guaranteed to come back through the purchase() you awaited",
      "Renewals, Ask to Buy approvals, and purchases made on another device arrive outside purchase() and are silently missed",
      "The first direct purchase works but every later purchase() call for any product returns .pending forever until the missing listener is added",
      "Product fetching stops working because Product.products(for:) internally depends on the same updates stream to resolve product metadata",
    ],
    answer: 1,
    explanation:
      "`purchase()` only returns *your* direct purchase. Auto-renewals, deferred Ask to Buy approvals, and cross-device purchases flow through `Transaction.updates` — skip that listener at launch and the user pays but gets nothing.",
  },
  {
    id: "sk-testing-senior",
    type: "mcq",
    prompt: "What's the recommended order for testing StoreKit 2 purchases?",
    difficulty: "senior",
    options: [
      "Go straight to production with a hidden internal product, then remove it once you've confirmed the whole purchase and refund pipeline behaves",
      "Local .storekit configuration file first, then Sandbox with test accounts, and production last",
      "Sandbox first because it exercises Apple's real servers, and only drop down to a local configuration file afterwards if you hit signing issues",
      "Unit tests with a hand-rolled mock of the entire StoreKit framework, since neither the local config file nor Sandbox can simulate renewals at all",
    ],
    answer: 1,
    explanation:
      "Start with a local `.storekit` config file (offline, on the simulator, can fake renewals and Ask to Buy), move to Sandbox (real servers, test accounts, no charge), and hit production last.",
  },
  {
    id: "sk-flashcard",
    type: "flashcard",
    prompt:
      "Walk through a StoreKit 2 in-app purchase end to end: fetching, buying, verifying, finishing, entitlements, and the updates listener. Answer aloud, then reveal.",
    modelAnswer:
      "**Fetch:** `try await Product.products(for: ids)` returns `[Product]` with localized `displayName` and region-correct `displayPrice` (IDs configured in App Store Connect). **Buy:** `try await product.purchase()` returns a `PurchaseResult` with three cases — `.success(verification)`, `.userCancelled`, `.pending` (e.g. Ask to Buy). **Verify:** `.success` carries a `VerificationResult<Transaction>` — `.verified` vs `.unverified`. StoreKit checks Apple's cryptographic signature **on device**; you must **reject `.unverified`** and only grant from `.verified`. This replaces StoreKit 1's manual receipt parsing. **Finish:** after granting content, call `transaction.finish()` — otherwise the transaction is re-delivered every launch and can double-grant consumables. **Entitlements:** `Transaction.currentEntitlements` is the source of truth for what the user currently owns (non-consumables, active subscriptions); iterating it *is* Restore Purchases, and `Transaction.latest(for:)` gets one product's most recent transaction. **Listener:** observe `Transaction.updates`, an AsyncSequence, in a long-lived task started **at launch**, to catch renewals, Ask to Buy approvals, and purchases made on another device — which never flow through `purchase()`. **Test** with a local `.storekit` config file first, then Sandbox.",
    keyPoints: [
      "Fetch: Product.products(for:) → [Product] with localized displayPrice",
      "Buy: product.purchase() → .success / .userCancelled / .pending",
      "Verify: VerificationResult, reject .unverified — signature checked on device",
      "Finish: transaction.finish() after granting, or it's re-delivered",
      "currentEntitlements = source of truth; iterating it is Restore Purchases",
      "Observe Transaction.updates at launch for renewals / Ask to Buy / other devices",
    ],
    explanation:
      "A strong answer names the flow in order, stresses rejecting `.unverified` (the security core), remembers `finish()`, and calls out the `Transaction.updates` listener that juniors forget.",
  },
];

export default quiz;
