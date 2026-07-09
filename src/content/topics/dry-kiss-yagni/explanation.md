## The problem: the same fix, made in only one of three places

Picture a `Ticket` type with a discount rule that shows up in three places:

```swift
struct EmailReceipt {
    func total(for ticket: Ticket) -> Decimal {
        ticket.price * (ticket.isMember ? 0.9 : 1.0)
    }
}

struct PDFInvoice {
    func total(for ticket: Ticket) -> Decimal {
        ticket.price * (ticket.isMember ? 0.9 : 1.0)
    }
}

struct RefundCalculator {
    func total(for ticket: Ticket) -> Decimal {
        ticket.price * (ticket.isMember ? 0.9 : 1.0)
    }
}
```

Three copies of the same discount math. Now the business changes the member discount from 10% to 15%. You update `EmailReceipt`, ship it, and move on — but `PDFInvoice` and `RefundCalculator` still charge the old rate, because nobody remembered they existed.

This lesson is three related habits that keep code like this from happening, and — just as importantly — three ways each habit can be taken too far.

## DRY: say each fact once

**DRY** stands for *Don't Repeat Yourself*: every piece of knowledge should have exactly one place it's expressed. Not "don't copy-paste code" — don't state the same *fact* twice, even in different words.

Pull the discount rule out into one place:

```swift
extension Ticket {
    var total: Decimal { price * (isMember ? 0.9 : 1.0) }
}
```

Now every caller asks the ticket for its own total:

```swift
struct EmailReceipt {
    func total(for ticket: Ticket) -> Decimal { ticket.total }
}
struct PDFInvoice {
    func total(for ticket: Ticket) -> Decimal { ticket.total }
}
```

Change the discount rate once, in `Ticket.total`, and every caller is correct the next time it runs. That's the entire payoff of DRY: a bug fix or a business-rule change becomes a one-line edit instead of a hunt across the codebase.

Predict: if `RefundCalculator` still has its own copy-pasted `0.9`, and QA reports "refunds are wrong after the discount change" — what's the actual bug?

Answer: there is no logic bug at all. The refund math is *correct* for the old 10% rule; it's just a second, forgotten copy of a fact that was supposed to live in one place.

## The cost of the wrong abstraction

DRY is about repeated **knowledge**, not repeated **text**. Two things that happen to look alike right now aren't automatically the same fact — and merging them anyway is worse than leaving the duplication alone.

```swift
struct EmailReceipt {
    func total(for ticket: Ticket) -> Decimal { ticket.price * 0.9 }   // loyalty discount
}
struct PDFInvoice {
    func total(for ticket: Ticket) -> Decimal { ticket.price * 0.9 }   // early-bird discount
}
```

These lines look identical — same math, same `0.9` — but they encode two unrelated business rules that happen to share a number today. Merge them into one `Ticket.total` and you've created a **false abstraction**: a single piece of code standing in for two different concepts. The moment the loyalty discount changes to 15% while the early-bird discount stays at 10%, that one shared function has to grow an `if` to tell its two callers apart:

```swift
extension Ticket {
    func total(reason: DiscountReason) -> Decimal {
        switch reason {
        case .loyalty: return price * 0.85
        case .earlyBird: return price * 0.9
        }
    }
}
```

Every future unrelated discount adds another case to a function that was never really "one thing" to begin with. A wrong abstraction like this usually costs more to unwind than the duplication it was meant to prevent — untangling two concepts that were forced together is harder than factoring out two that were always separate. The rule of thumb: don't deduplicate the first time you see similar code. Wait until you understand *why* it's similar — whether it's really one fact or two facts that coincide today.

## KISS: the simplest thing that solves the actual problem

**KISS** stands for *Keep It Simple* — prefer the plainest design that solves the problem in front of you over a cleverer one that solves problems you don't have yet.

Here's a lookup that needs a member's discount tier:

```swift
func discountTier(for member: Member) -> DiscountTier {
    if member.yearsActive >= 5 { return .gold }
    if member.yearsActive >= 2 { return .silver }
    return .bronze
}
```

Three plain `if` statements, reading top to bottom. Compare it with a "clever" version built to look configurable:

```swift
enum TierRule {
    case threshold(years: Int, tier: DiscountTier)
}

let rules: [TierRule] = [.threshold(years: 5, tier: .gold), .threshold(years: 2, tier: .silver)]

func discountTier(for member: Member) -> DiscountTier {
    rules.sorted { if case .threshold(let a, _) = $0, case .threshold(let b, _) = $1 { return a > b }; return false }
        .first { if case .threshold(let years, _) = $0 { return member.yearsActive >= years }; return false }
        .map { if case .threshold(_, let tier) = $0 { return tier } else { return .bronze } } ?? .bronze
}
```

Same result, far more to read, and a new failure mode — an empty or unsorted `rules` array silently returns the wrong tier. Nothing here was asked for; three tiers were always going to be three tiers. KISS says: reach for the data-driven, generic version only once you actually need to add tiers at runtime, not because it looks more "engineered."

Simple doesn't mean naive or short — it means no more machinery than the current problem requires. A simple solution to a genuinely hard problem can still be long; the test is whether every piece of it is pulling weight for a requirement that exists today.

## YAGNI: don't build it until something needs it

**YAGNI** stands for *You Aren't Gonna Need It* — don't add a capability because you can imagine wanting it later. Build for the requirement in front of you.

Imagine a ticket-pricing feature where nobody has asked for anything beyond a flat member discount, but it gets built like this anyway:

```swift
protocol PricingStrategy { func price(for ticket: Ticket) -> Decimal }

struct FlatDiscountStrategy: PricingStrategy {
    let rate: Decimal
    func price(for ticket: Ticket) -> Decimal { ticket.price * (1 - rate) }
}

final class PricingEngine {
    var strategies: [PricingStrategy] = []
    func register(_ strategy: PricingStrategy) { strategies.append(strategy) }
    func price(for ticket: Ticket) -> Decimal {
        strategies.reduce(ticket.price) { min($0, $1.price(for: ticket)) }
    }
}
```

A protocol, a registration system, a strategy list, a "cheapest wins" resolver — all to serve one discount rule that could be a single stored property. This is **speculative generality**: machinery built to accommodate future requirements nobody has actually stated. It adds real cost today — more types to read, more paths to test, more places a bug can hide — in exchange for flexibility that may never be used, and that will almost certainly be shaped wrong for whatever the *real* future requirement turns out to be.

The YAGNI-respecting version is what you'd guess:

```swift
struct PricingEngine {
    func price(for ticket: Ticket, memberDiscount: Decimal) -> Decimal {
        ticket.price * (1 - memberDiscount)
    }
}
```

When a second pricing rule actually shows up — a real, ticketed feature request, not a guess — that's the moment to introduce a `PricingStrategy` protocol. Its shape will be informed by two real cases instead of one imagined one, and it'll almost certainly look different from the version built in advance.

## Balancing the three

These habits pull in the same general direction — less code, fewer places to go wrong — but they can also pull against each other, and knowing which one wins in a given moment is the actual skill.

DRY pushes you to unify two similar-looking pieces of code. YAGNI and the wrong-abstraction lesson from earlier push back: don't unify until you're sure it's one fact, and don't build the general version until a second real case shows up. KISS pushes you toward the plain three-`if` version; DRY might still ask you to name that shared logic once it's used in two places, which isn't the same as making it "clever" or "configurable."

A working rule of thumb: duplication is cheap and reversible — you can always extract a shared function later, once you have two or three real call sites in front of you to learn from. A wrong abstraction, or a generic system built for a requirement that never lands, is expensive and hard to walk back, because code has already grown to depend on its shape. When in doubt, prefer the version that's easiest to change later over the version that looks most "reusable" today.

## Common pitfalls

- **Deduplicating on first sight.** Two similar-looking blocks of code aren't automatically the same fact — check whether they represent one concept or two before merging them.
- **Confusing "simple" with "short."** KISS is about avoiding unnecessary machinery, not about minimizing line count; a clear solution can be longer than a clever one.
- **Building for an imagined second use case.** A protocol, a config system, or a plugin architecture built before any second real case exists is speculative generality — expensive to carry and often wrong-shaped once the real case arrives.

## Interview lens

If asked to define DRY, don't say "don't copy-paste" — say every piece of *knowledge* should be expressed in exactly one place, so a rule change is a one-line edit instead of a hunt through the codebase. Then be ready for the trap question: "should you always deduplicate similar-looking code?" The strong answer is no — merging code that looks alike but represents two unrelated facts creates a false abstraction that's harder to untangle later than the original duplication was.

For KISS, the interviewer is checking whether you reach for complexity by default. Say you prefer the plainest design that satisfies today's actual requirement, and that "simple" measures unnecessary machinery, not line count.

For YAGNI, name **speculative generality** directly — building configurability, protocols, or plugin points for a use case nobody has asked for yet. The strong closing point across all three: duplication is cheap and reversible, so it's the safer default to tolerate briefly; premature abstraction is expensive and hard to reverse, because real code grows to depend on its shape before you find out it was wrong.
