import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "srp-definition",
    type: "mcq",
    prompt: "What does the Single Responsibility Principle actually say?",
    options: [
      "A type should have exactly one reason to change",
      "A type should have exactly one method",
      "A type should have exactly one property",
      "A type should never call another type's methods",
    ],
    answer: 0,
    explanation:
      "SRP is about **reasons to change**, not method count. A type can have many methods and still satisfy SRP as long as they all serve one job owned by one actor.",
  },
  {
    id: "srp-who-files",
    type: "mcq",
    prompt: "A class has methods for calculating tax, formatting a receipt, and saving to a database. What's the fast way to tell if it violates SRP?",
    options: [
      "Ask who would file a bug report or feature request against each method — different answers mean different responsibilities",
      "Count the number of methods — more than 5 is always a violation",
      "Check if it uses generics",
      "Check if it's a class instead of a struct",
    ],
    answer: 0,
    explanation:
      "If tax logic, formatting, and persistence each trace back to a different team or concern, that's three responsibilities in one type — a clear SRP smell.",
  },
  {
    id: "srp-manager-fill",
    type: "fill",
    prompt: "A ___ or Helper class with a grab-bag of unrelated methods is one of the most common SRP violations in real codebases.",
    answers: ["manager", "Manager"],
    hint: "The generic type-name suffix that tends to attract unrelated behavior over time.",
    explanation:
      "`Manager` and `Helper` names are magnets for unrelated methods because they don't describe what the type actually *is* — just that it vaguely *does stuff*.",
  },
  {
    id: "srp-predict-blast-radius",
    type: "predict",
    prompt: "After splitting InvoiceManager into InvoiceCalculator, InvoicePrinter, and InvoiceStore, a designer changes InvoicePrinter.format(). Does InvoiceCalculator's behavior change?",
    code: `struct InvoiceCalculator {
    func total(of items: [LineItem]) -> Decimal { ... }
}
struct InvoicePrinter {
    func format(_ items: [LineItem], total: Decimal) -> String { ... }
}`,
    options: [
      "No — InvoiceCalculator doesn't depend on or call InvoicePrinter",
      "Yes — they share the InvoiceManager superclass",
      "Yes — Swift recompiles all structs in the same file together",
      "It depends on access control",
    ],
    answer: 0,
    explanation:
      "The whole point of the split is independence: since InvoiceCalculator has no dependency on InvoicePrinter, a formatting change has zero blast radius on pricing logic.",
  },
  {
    id: "srp-over-split-multi",
    type: "multi",
    prompt: "Select all statements that describe a real risk of applying SRP incorrectly.",
    options: [
      "Splitting one method per type creates ceremony without adding real separation of concerns",
      "Splitting by technical layer (e.g. a Getter class and a Setter class for the same data) isn't a genuine SRP split",
      "SRP means every type must have exactly one public method",
      "Over-splitting can make a simple feature require opening many files to trace",
    ],
    answers: [0, 1, 3],
    explanation:
      "Over-splitting is a real failure mode: one-method classes and layer-based splits (getter/setter) don't create genuine separation, they just add indirection. SRP never mandates a fixed method count (option 2 is false).",
  },
  {
    id: "srp-codable-mcq",
    type: "mcq",
    prompt: "A `User` struct conforms to `Codable` and also has an `isValidEmail()` business-rule method. Per SRP guidance in this lesson, what's the typical judgment call?",
    options: [
      "Codable is often left on the model since it's mechanical and low-risk, but growing validation logic deserves its own type like UserValidator",
      "Both must always be split into separate types with no exceptions",
      "Codable and validation are always the same responsibility",
      "Neither should ever live on the model type",
    ],
    answer: 0,
    explanation:
      "SRP is a judgment call, not a rigid rule. Mechanical, low-risk conformances like Codable commonly stay on the model, while business validation rules that tend to grow are worth extracting.",
  },
  {
    id: "srp-cohesion-fill",
    type: "fill",
    prompt: "SRP is really about ___ — whether all the members of a type change together for the same reason.",
    answers: ["cohesion"],
    hint: "The property of a type's members belonging together.",
    explanation:
      "Cohesion measures how tightly a type's members relate to one job. High cohesion (one reason to change) is what SRP is actually asking for.",
  },
  {
    id: "srp-senior-judgment",
    type: "mcq",
    prompt: "An interviewer asks: \"isn't splitting every class like this over-engineering for a small app?\" What's the strongest senior-level answer?",
    options: [
      "SRP is a judgment call — the goal is one reason to change per type, and over-splitting into one-method classes is just as real a failure mode as under-splitting",
      "No, every app should always split every class into the maximum number of pieces possible",
      "SRP only applies to apps with more than 100,000 lines of code",
      "SRP is outdated and shouldn't be used in Swift",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A senior answer avoids dogma: SRP trades off against added indirection. The target is genuine reasons-to-change, not a mechanical one-class-per-method rule, and naming that tension shows real experience applying the principle.",
  },
  {
    id: "srp-flashcard",
    type: "flashcard",
    prompt: "Explain the Single Responsibility Principle, how to detect a violation, and its opposite failure mode. Answer aloud, then reveal.",
    modelAnswer:
      "**SRP** states that a type should have **one reason to change** — all of its behavior should be owned by a single actor or business concern, which is really a statement about **cohesion**. To detect a violation, ask *who would file a bug report* against each method; if the answers differ (e.g. accounting vs. design vs. infra), the type is bundling unrelated responsibilities and should be split, typically by extracting one type per concern (a calculator, a formatter, a persistence layer). `Manager`/`Helper`-named types are a common magnet for this problem because they describe *doing stuff* rather than *being something specific*. The opposite failure mode is **over-splitting**: creating one tiny type per individual method (or splitting by technical layer, like a Getter/Setter pair) adds indirection without creating real separation, since those methods still share the same reason to change. The right amount of splitting is judged by reasons-to-change, not method count.",
    keyPoints: [
      "One reason to change = cohesion, not method count",
      "\"Who files the bug report\" test finds mixed responsibilities",
      "Split along actor/business concern, not by technical layer",
      "Manager/Helper names attract unrelated methods over time",
      "Over-splitting (one method per class) is a real opposite failure mode",
    ],
    explanation:
      "A senior answer distinguishes SRP from mere method-counting, gives a concrete detection technique, and names over-splitting as a real, symmetric risk.",
  },
];

export default quiz;
