import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "strong-default",
    type: "mcq",
    prompt: "What is the default ownership qualifier for a reference in Swift?",
    options: [
      "strong — it owns the target and keeps it alive (count++)",
      "weak — so that properties don't accidentally keep their owners alive and cause memory to pile up silently",
      "unowned — the compiler assumes you know the target outlives the reference and optimizes away nil-checking overhead",
      "There is no default — every reference must be explicitly annotated with strong, weak, or unowned before it compiles",
    ],
    answer: 0,
    explanation:
      "A plain `var`/`let` reference is **strong** by default: it increments the reference count and keeps the object alive. Use it for genuine ownership.",
  },
  {
    id: "weak-optional",
    type: "mcq",
    prompt: "Why must a `weak` reference be an optional `var`?",
    options: [
      "It auto-nils when the target deallocates, so it must be able to hold nil",
      "Because weak references are read-only — the compiler enforces var so you can't accidentally reassign a weak reference",
      "To increase the reference count by one each time the optional is unwrapped, balancing the decrement from not owning",
      "It doesn't — weak can be a let constant, since the auto-nil is handled internally without requiring a mutable binding",
    ],
    answer: 0,
    explanation:
      "`weak` doesn't keep the target alive, and when the target is deallocated the reference automatically becomes `nil` — so it must be a mutable optional (`weak var x: T?`).",
  },
  {
    id: "unowned-danger",
    type: "mcq",
    prompt: "What happens if you access an `unowned` reference after its target has been deallocated?",
    options: [
      "The app crashes — unowned doesn't auto-nil and assumes the target still exists",
      "It returns nil — the runtime detects the dangling reference and silently substitutes nil to prevent a crash",
      "It returns a zero-initialized default value constructed from the type's layout, similar to a forced try that falls back",
      "Nothing — unowned is always safe because ARC delays deallocation until all unowned references are also released",
    ],
    answer: 0,
    explanation:
      "`unowned` is non-optional and does not auto-nil. Accessing it after the target is gone is a dangling reference → crash. It's only correct when the target is guaranteed to outlive the reference.",
  },
  {
    id: "weak-no-count-fill",
    type: "fill",
    prompt: "Both weak and unowned references do NOT ___ the reference count, which is how they avoid keeping the target alive.",
    answers: ["increment", "increase", "raise"],
    hint: "They don't ___ the count (opposite of decrement).",
    explanation:
      "Neither weak nor unowned increments the count, so neither keeps the object alive — that's what makes them useful for breaking retain cycles. Strong references increment it.",
  },
  {
    id: "weak-vs-unowned-choose",
    type: "mcq",
    prompt: "You're unsure whether a reference could outlive its target. Which should you choose?",
    options: [
      "weak — it safely becomes nil if the target is gone",
      "unowned — it avoids the optional overhead and is always the correct choice whenever lifetime is uncertain or ambiguous",
      "strong — keeping the target alive is the safest approach since you never have to worry about a nil or a dangling pointer",
      "unowned(unsafe) — it eliminates both the optional overhead and the runtime check, making it the fastest available option",
    ],
    answer: 0,
    explanation:
      "When in doubt, use `weak`: a handled `nil` is safer than an `unowned` crash. Reserve `unowned` for when you can *prove* the target outlives the reference.",
  },
  {
    id: "reftypes-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements.",
    options: [
      "A delegate reference should typically be `weak`",
      "`unowned` is non-optional and cheaper than weak (no auto-nil bookkeeping)",
      "Both weak and unowned break retain cycles",
      "`weak` keeps its target alive",
    ],
    answers: [0, 1, 2],
    explanation:
      "Weak delegates, cheaper non-optional unowned, and both breaking cycles are correct. `weak` does **not** keep its target alive (option 3 is false) — that's the whole point.",
  },
  {
    id: "customer-card-senior",
    type: "predict",
    prompt: "🧠 Trick question — a CreditCard can never exist without its Customer, and can't outlive it. What should `CreditCard.owner` be?",
    code: `class Customer { var card: CreditCard? }
class CreditCard { ??? let owner: Customer }`,
    options: [
      "unowned — the owner is guaranteed to outlive the card, so no optional/auto-nil is needed",
      "weak — always use weak for any back-reference to be safe, even when the target is guaranteed to outlive the holder",
      "strong — the card should own the customer to ensure the customer stays alive as long as any card references it",
      "It doesn't matter — ARC handles the cycle automatically through its internal cycle-detection pass at deallocation time",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Because a card's owner always outlives the card (a card can't exist without one, and is destroyed with/before the customer), `owner` can be **`unowned`** — non-optional and cheaper. Making `owner` strong would create a retain cycle; making it weak would force needless optionality.",
  },
  {
    id: "delegate-weak-senior",
    type: "mcq",
    prompt: "Why is `weak` (not `unowned`) the right choice for a delegate?",
    options: [
      "The delegate (e.g. a view controller) can be deallocated while the object holding the reference still lives, so it may outlive its target",
      "Delegates are always value types, and Swift value types can only ever be referenced weakly because unowned simply doesn't apply to structs or enums",
      "unowned isn't permitted on protocol-typed properties because protocol existentials require a fixed-size inline storage layout",
      "weak is faster than unowned because it skips the non-optional check and returns nil immediately rather than trapping on dangling access",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A delegate's lifetime isn't guaranteed relative to the delegating object — the delegate can be torn down first. So the reference could outlive the target, which demands the safety of `weak` (auto-nil), not `unowned`.",
  },
  {
    id: "unowned-unsafe-senior",
    type: "mcq",
    prompt: "What is `unowned(unsafe)` and why avoid it?",
    options: [
      "It's unowned with NO runtime safety check — accessing a dangling reference is undefined behavior rather than a clean crash",
      "It's a faster version of weak that returns nil on a dangling access instead of crashing, skipping the optional-binding step",
      "It auto-nils exactly like weak but without the optional wrapper, so you access the value directly without unwrapping",
      "It's the default reference qualifier that all properties use unless explicitly annotated with weak or unowned keywords",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Regular `unowned` still has a runtime check that traps on a dead reference. `unowned(unsafe)` removes even that, so a stale access is undefined behavior (memory corruption/garbage) — avoid it unless you have a very specific, measured reason.",
  },
  {
    id: "reference-types-flashcard",
    type: "flashcard",
    prompt:
      "Contrast strong, weak, and unowned, and give the rule for choosing weak vs unowned. Answer aloud, then reveal.",
    modelAnswer:
      "**`strong`** (the default) **owns** the target — increments the reference count and keeps it alive; use it for genuine ownership (but two objects owning each other is a retain cycle). **`weak`** does **not** own the target and **automatically becomes `nil`** when the target deallocates, so it must be an **optional `var`** — it's **safe** (you get `nil`, never a dangling pointer) at the cost of handling the optional. **`unowned`** also doesn't own the target, but is **non-optional and does not auto-nil**; it assumes the target **always outlives** the reference, so accessing it after the target is gone **crashes** (a dangling reference). Neither weak nor unowned increments the count, so both break retain cycles. **Choosing:** use **`weak`** when the reference **can outlive** its target (delegates, back-references, anything whose lifetime you don't control) — the default when unsure; use **`unowned`** only when the reference **can never outlive** the target (e.g. `CreditCard.owner`, created together with the target strictly containing it), because it's cheaper but crashes if that guarantee is violated. When in doubt, prefer `weak` — a handled `nil` beats an unowned crash.",
    keyPoints: [
      "strong = owns, keeps alive (default); weak/unowned don't increment count",
      "weak = auto-nils → must be optional var; SAFE",
      "unowned = non-optional, no auto-nil → CRASHES if target gone",
      "weak when reference can outlive target (delegates); unowned when it can't (CreditCard.owner)",
      "Default to weak when unsure; avoid unowned(unsafe)",
    ],
    explanation:
      "Senior answers give the relative-lifetime rule (weak = may outlive, unowned = can't) with the delegate (weak) and CreditCard.owner (unowned) examples, and note the crash-vs-nil safety trade-off.",
  },
];

export default quiz;
