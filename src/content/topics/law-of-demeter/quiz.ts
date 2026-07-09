import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "lod-definition",
    type: "mcq",
    prompt: "What does the Law of Demeter say?",
    options: [
      "A method should only call methods on objects it directly knows about — self, its parameters, things it creates, and its own properties — not objects reached by chaining through those",
      "Every property must be marked private",
      "A class should never call a method on any other class",
      "Every function must return an optional",
    ],
    answer: 0,
    explanation:
      "The Law of Demeter (\"don't talk to strangers\") restricts a method to calling methods on objects it directly holds — not on objects it only reaches by chaining through one of those.",
  },
  {
    id: "lod-train-wreck-fill",
    type: "fill",
    prompt: "A long chain of dots like `order.customer.address.city`, where each dot couples to another object's internal structure, is nicknamed a ___ in the refactoring literature.",
    answers: ["train wreck"],
    hint: "Two words — it reads like linked cars.",
    explanation:
      "\"Train wreck\" describes a chained expression that reaches through multiple unrelated objects' internals, coupling the caller to structure it shouldn't need to know about.",
  },
  {
    id: "lod-stranger-mcq",
    type: "mcq",
    prompt: "Inside `CheckoutScreen`, which of these counts as a 'stranger' under the Law of Demeter?",
    options: [
      "order.customer.address — reached by chaining through the order property, not held directly",
      "order — a direct property of CheckoutScreen",
      "self — the object the method is defined on",
      "A local variable created inside the method itself",
    ],
    answer: 0,
    explanation:
      "A 'friend' is self, a parameter, something created locally, or a direct property. `order.customer.address` is a stranger: it's only reachable by chaining through `order`, a friend, so calling methods on it directly violates the guideline.",
  },
  {
    id: "lod-refactor-predict",
    type: "predict",
    prompt: "`Customer.account` is refactored from `Account?` to `[Account]` (multiple accounts). Call sites use `customer.isLongTime()`, a method Customer exposes instead of exposing `account` directly. What breaks at the call sites?",
    code: `struct Customer {
    private let accounts: [Account]
    func isLongTime() -> Bool {
        guard let oldest = accounts.min(by: { $0.createdAt < $1.createdAt }) else { return false }
        return oldest.createdAt.timeIntervalSinceNow < -365 * 24 * 3600
    }
}`,
    options: [
      "Nothing — isLongTime()'s signature and every call site are unaffected by the internal change",
      "Every call site that used isLongTime() must now handle an array instead of an optional",
      "The code no longer compiles anywhere isLongTime() is called",
      "isLongTime() must be renamed at every call site",
    ],
    answer: 0,
    explanation:
      "Because call sites ask Customer to make the decision (tell-don't-ask) instead of reaching into `account` directly, Customer's internal representation can change freely as long as `isLongTime()`'s contract stays the same. This is the direct payoff of following the Law of Demeter.",
  },
  {
    id: "lod-tell-dont-ask-fill",
    type: "fill",
    prompt: "Instead of pulling data out of an object to make a decision outside it, you tell the object to make the decision using data it already owns. This practice is called ___-___-___.",
    answers: ["tell-dont-ask", "tell dont ask", "tell-don't-ask"],
    hint: "Three words, hyphenated, describing what you do to an object instead of asking it for data.",
    explanation:
      "Tell-don't-ask pushes the decision into the object that owns the relevant data, rather than extracting that data so the caller can decide — this is the concrete technique that satisfies the Law of Demeter.",
  },
  {
    id: "lod-truths-multi",
    type: "multi",
    prompt: "Select all statements that are true about applying the Law of Demeter.",
    options: [
      "A fluent builder chain like builder.setTitle(x).setColor(y).build() is generally considered an intentional exception, not a violation",
      "Turning every single property access into a one-line forwarding method always reduces coupling",
      "The guideline targets reaching across multiple unrelated object boundaries to extract data for a decision, not calling any method at all on a returned value",
      "Encapsulation and tell-don't-ask are closely related ideas — both keep internal structure hidden behind exposed behavior",
    ],
    answers: [0, 2, 3],
    explanation:
      "Fluent APIs are a deliberate, designed exception. The guideline is about crossing unrelated object boundaries to grab internals, not banning all chained calls. Option 1 is false — a pointless one-line wrapper with no logic just relocates the same coupling one layer down instead of removing it.",
  },
  {
    id: "lod-when-to-skip-senior",
    type: "mcq",
    prompt: "Which of these is the strongest justification for NOT applying the Law of Demeter to a given chain?",
    options: [
      "The chain calls a value type's own method on a value you already directly hold (e.g. order.subtotal.formatted()), rather than reaching through a chain of separate domain objects",
      "The chain is more than three dots long, so it must already be fine",
      "The Law of Demeter never applies to Swift, only to older object-oriented languages",
      "Any chain inside a private method is automatically exempt",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The smell is specifically about crossing multiple *unrelated* object boundaries to pull out internal data. Calling a method on a value type you already own (its own formatting/computation capability) isn't reaching through someone else's internals — it's simply using a capability of a value you legitimately hold.",
  },
  {
    id: "lod-coupling-senior",
    type: "predict",
    prompt: "🧠 Five different screens each write `order.customer.address.city` directly instead of going through a `Customer.city()` method. `Address` is later refactored so city and postal code merge into a single formatted `cityLine` string. What's the realistic blast radius?",
    code: `// five call sites, each independently reaching: order.customer.address.city`,
    options: [
      "All five call sites break simultaneously, because each one independently duplicated knowledge of Address's internal shape",
      "Only the first call site written breaks — the others are unaffected",
      "None break, since Swift infers the correct field automatically",
      "Only Address itself needs updating; no external code is affected either way",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Every train-wreck call site independently encodes the same assumption about Address's internal structure. A refactor inside Address breaks every one of them at once — exactly the fragility the Law of Demeter is meant to prevent by centralizing that knowledge inside Customer or Address's own methods.",
  },
  {
    id: "lod-flashcard",
    type: "flashcard",
    prompt:
      "Explain the Law of Demeter, the train-wreck problem it prevents, the tell-don't-ask fix, and where the rule shouldn't be applied dogmatically. Answer aloud, then reveal.",
    modelAnswer:
      "The **Law of Demeter** ('don't talk to strangers') says a method should only call methods on objects it directly knows about — `self`, its parameters, objects it creates, and its own direct properties — never on an object only reached by chaining through one of those (a **stranger**). Violating it produces a **train wreck**: a long dot-chain like `order.customer.address.city` that duplicates knowledge of another type's internal object graph at every call site. If that internal structure changes, every train-wreck call site written anywhere in the codebase can break at once. The fix is **tell-don't-ask**: instead of pulling data out of an object to make a decision externally, push a small method onto the object that owns the data, so it makes the decision (or hands back exactly the needed value) internally — this is the same idea as **encapsulation**, applied at the level of call sites rather than just access modifiers. The payoff is that a type's internal representation (e.g. `Account?` becoming `[Account]`) can change freely as long as the exposed method's contract stays stable. The rule isn't absolute: fluent builder chains that return `self` or a purpose-built builder are a deliberate exception, calling a value type's own method on a value you already hold isn't the same as reaching through unrelated domain objects, and turning every property access into a pointless one-line forwarding method just relocates coupling instead of removing it.",
    keyPoints: [
      "Law of Demeter: only call methods on self, parameters, created objects, and direct properties",
      "Train wreck: a chain through 'stranger' objects duplicates knowledge of their internal shape at every call site",
      "Tell-don't-ask: push the decision into the object that owns the data instead of pulling data out",
      "Same as encapsulation — hides internal structure so it can change without breaking callers",
      "Limits: fluent builders, value types' own methods, and pointless one-line forwarding wrappers are not real fixes",
    ],
    explanation:
      "A senior answer connects the principle to a concrete failure mode (fragile call sites duplicating internal knowledge) and explicitly names when the rule shouldn't be applied dogmatically, rather than reciting it as an absolute.",
  },
];

export default quiz;
