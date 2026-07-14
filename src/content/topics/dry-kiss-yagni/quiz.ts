import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "dry-what",
    type: "mcq",
    prompt: "What does DRY actually require?",
    options: [
      "Every piece of knowledge (a fact or rule) should be expressed in exactly one place",
      "No two lines of code may ever look visually similar, even if they represent different business rules",
      "Every function must be called from at least two distinct call sites before it is allowed to remain in the codebase",
      "All code must live in a single file so that related logic is always co-located and never accidentally duplicated",
    ],
    answer: 0,
    explanation:
      "DRY is about repeated knowledge, not repeated text. A business rule stated in three places means a change has to be made correctly in all three, or the copies drift out of sync.",
  },
  {
    id: "dry-bug-predict",
    type: "predict",
    prompt: "The member discount changes from 10% to 15%. Only EmailReceipt is updated; PDFInvoice and RefundCalculator still multiply by 0.9. QA reports 'refunds are wrong.' What's the actual bug?",
    code: `struct EmailReceipt {
    func total(for t: Ticket) -> Decimal { t.price * 0.85 }  // updated
}
struct RefundCalculator {
    func total(for t: Ticket) -> Decimal { t.price * 0.9 }   // forgotten
}`,
    options: [
      "No logic error — it's a forgotten duplicate of a fact that should have lived in one place",
      "A rounding error caused by Decimal arithmetic treating 0.9 and 0.85 as binary floating-point approximations",
      "A race condition caused by both structs reading the same Ticket value concurrently from different threads",
      "RefundCalculator has a deliberate typo in the discount multiplier that was introduced when the struct was first written",
    ],
    answer: 0,
    explanation:
      "The math in RefundCalculator was correct for the old rule. The real bug is structural: the discount fact was duplicated instead of expressed once, so an update to the rule couldn't reach every use automatically.",
  },
  {
    id: "false-abstraction-fill",
    type: "fill",
    prompt: "Merging two pieces of code that look alike today but represent two unrelated business rules creates a false ___.",
    answers: ["abstraction"],
    hint: "The thing DRY is supposed to produce, done wrong.",
    explanation:
      "A false abstraction forces two different concepts to share one implementation because they coincidentally look the same right now. It's usually harder to untangle later than the original duplication was.",
  },
  {
    id: "kiss-what",
    type: "mcq",
    prompt: "What does KISS mean when the same result can be produced by three plain if-statements or a generic rule-table lookup?",
    options: [
      "Prefer the plain if-statements — reach for the generic version only once the problem actually requires it",
      "Always prefer the generic, data-driven rule-table version because it signals engineering maturity and scales better to future requirements",
      "Always prefer whichever version has fewer total characters in the source file, since shorter code is by definition simpler",
      "KISS says to avoid using if-statements entirely, replacing all conditional logic with polymorphism or strategy objects instead",
    ],
    answer: 0,
    explanation:
      "KISS favors the simplest design that solves today's actual requirement. A generic rule table is more machinery to read and test than three fixed tiers currently need — it's only worth it once tiers genuinely become dynamic.",
  },
  {
    id: "kiss-vs-short-multi",
    type: "multi",
    prompt: "Select all statements that are true about KISS.",
    options: [
      "Simple means minimal unnecessary machinery, not minimal line count",
      "A clear solution to a genuinely hard problem can still be long",
      "KISS means you should never write more than 10 lines in a function",
      "KISS argues against adding complexity the current problem doesn't require",
    ],
    answers: [0, 1, 3],
    explanation:
      "KISS is about avoiding unneeded machinery, not about hitting an arbitrary line count. A long solution can still be 'simple' if every part of it is earning its place for a real requirement.",
  },
  {
    id: "yagni-what",
    type: "mcq",
    prompt: "A ticket-pricing feature has exactly one discount rule, but the code ships with a PricingStrategy protocol, a strategy-registration system, and a resolver that picks the cheapest of several registered strategies. What principle does this violate?",
    options: [
      "YAGNI — it builds speculative generality for use cases nobody has asked for yet",
      "DRY — because the PricingStrategy protocol duplicates the same discount logic already present in the concrete struct",
      "Nothing — using a protocol with a registration system is always the correct default when a concept might need to vary in the future",
      "KISS only, not YAGNI, since the plugin system technically produces correct output for the current single rule",
    ],
    answer: 0,
    explanation:
      "This is speculative generality: a plugin-like system built in advance of any second real requirement. YAGNI says to wait for a second concrete pricing rule before generalizing — the eventual real shape will likely differ from the guessed one anyway.",
  },
  {
    id: "yagni-second-fill",
    type: "fill",
    prompt: "According to YAGNI, the right time to introduce a general PricingStrategy protocol is when a ___ real pricing rule actually shows up as a requirement.",
    answers: ["second"],
    hint: "One case doesn't justify a general abstraction; how many do, at minimum?",
    explanation:
      "Generalize from real cases, not imagined ones. A second concrete requirement gives you two real shapes to learn the right abstraction from, instead of guessing at one.",
  },
  {
    id: "balance-senior",
    type: "predict",
    prompt: "You spot two functions with identical-looking math in different files. DRY suggests merging them. What should you check FIRST, per this lesson's balancing advice?",
    code: `// File A: loyalty discount
func total(for t: Ticket) -> Decimal { t.price * 0.9 }
// File B: early-bird discount
func total(for t: Ticket) -> Decimal { t.price * 0.9 }`,
    options: [
      "Whether the two blocks represent the same underlying fact or two different rules that coincidentally match today",
      "Whether merging them will reduce the total line count across both files, since fewer lines always indicates better adherence to DRY",
      "Whether both functions are defined in Swift files that belong to the same compilation target in the project",
      "Nothing — any two functions with identical source text should always be merged immediately to prevent the codebase from diverging later",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Duplication is cheap and reversible; a wrong abstraction is expensive to unwind because code grows to depend on its shape. Before merging, confirm the two blocks encode one fact, not two unrelated rules that happen to match by coincidence right now.",
  },
  {
    id: "dry-kiss-yagni-flashcard",
    type: "flashcard",
    prompt:
      "Explain DRY, KISS, and YAGNI, and how they can conflict with each other. Answer aloud, then reveal.",
    modelAnswer:
      "**DRY** (Don't Repeat Yourself) means every piece of **knowledge** — a business rule or fact — should be expressed in exactly one place, so a change is a single edit instead of a hunt across the codebase. It is about repeated *knowledge*, not repeated *text*: merging two blocks that merely look alike but encode different rules creates a **false abstraction** that's harder to unwind than the duplication was. **KISS** (Keep It Simple) means preferring the plainest design that solves today's actual problem over a cleverer, more 'configurable' one — simple measures unnecessary machinery, not line count. **YAGNI** (You Aren't Gonna Need It) means not building capability for a requirement nobody has stated yet; doing so is **speculative generality** — protocols, registries, or plugin systems built ahead of any real second use case, which cost real complexity today and are usually shaped wrong once the real need appears. The three can conflict: DRY pushes toward unifying similar code, while YAGNI and the false-abstraction risk push back against unifying too early. The balancing rule: duplication is cheap and reversible — tolerate it briefly and extract a shared abstraction once two or three real call sites exist to learn from; premature abstraction is expensive and hard to reverse.",
    keyPoints: [
      "DRY: one fact, one place — knowledge, not literal text",
      "Merging superficially-similar code too early creates a false abstraction",
      "KISS: least machinery needed for today's problem, not fewest lines",
      "YAGNI: don't build for imagined future requirements (speculative generality)",
      "Duplication is cheap/reversible; premature abstraction is expensive/hard to reverse",
    ],
    explanation:
      "A senior answer explicitly names the tension between DRY and YAGNI/false-abstraction risk, and states the balancing heuristic: prefer reversible duplication over irreversible premature abstraction.",
  },
];

export default quiz;
