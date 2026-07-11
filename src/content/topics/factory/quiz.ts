import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "factory-what",
    type: "mcq",
    prompt: "What is a factory method's defining job?",
    options: [
      "Deciding which concrete type to construct and returning it through a protocol, so callers depend on the protocol",
      "Compressing multiple objects into one",
      "Guaranteeing only one instance of a type ever exists",
      "Replacing all initializers in an app",
    ],
    answer: 0,
    explanation:
      "A factory method's return type is a **protocol**, not a concrete type. The decision of *which* concrete type to build lives inside the factory, so every caller only ever sees the protocol.",
  },
  {
    id: "factory-return-type-predict",
    type: "predict",
    prompt: "This factory method compiles but doesn't achieve decoupling. Why not?",
    code: `func makeProcessor(for method: String) -> StripeProcessor {\n    return StripeProcessor()\n}`,
    options: [
      "The return type is the concrete `StripeProcessor`, not a protocol, so callers can still see and depend on the concrete type",
      "Swift doesn't allow returning structs from functions",
      "The function is missing a `switch` statement",
      "It needs to be marked `static`",
    ],
    answer: 0,
    explanation:
      "Decoupling only happens when the function's *return type* is a protocol like `PaymentProcessor`. Returning the concrete `StripeProcessor` means callers are just as tied to it as if they'd written `StripeProcessor()` directly.",
  },
  {
    id: "factory-vs-abstract-fill",
    type: "fill",
    prompt: "A factory method builds one object; an ___ ___ is a protocol that builds a whole family of related objects that must agree with each other.",
    answers: ["abstract factory"],
    hint: "Two words — the second half of this lesson's title.",
    explanation:
      "Abstract factory scales the idea from one object to a matched *family* of objects — like a theme's button style and background style, which must always come from the same concrete factory to stay consistent.",
  },
  {
    id: "factory-static-factory-mcq",
    type: "mcq",
    prompt: "What can a static factory method do that a plain `init` cannot?",
    options: [
      "Return an existing cached or shared instance instead of always allocating a new one",
      "Take zero arguments",
      "Be called without importing the module",
      "Run faster than any initializer at compile time",
    ],
    answer: 0,
    explanation:
      "`init` always produces a fresh instance. A static factory like `URLSession.session(for:)` can inspect its argument and hand back `URLSession.shared` instead of allocating — an `init` can never do that.",
  },
  {
    id: "factory-theme-multi",
    type: "multi",
    prompt: "Select **all** true statements about the `ThemeFactory` example (a protocol with `makeButtonStyle()` and `makeBackgroundStyle()`).",
    options: [
      "Each concrete factory (e.g. `DarkThemeFactory`) guarantees its pieces are mutually consistent",
      "A screen using `ThemeFactory` never needs to branch on the current theme itself",
      "It's impossible to accidentally combine a dark button with a light background as long as one factory instance supplies both",
      "`ThemeFactory` must be a class, never a struct",
    ],
    answers: [0, 1, 2],
    explanation:
      "The whole point of an abstract factory is that one concrete factory hands out a matched set — the consuming code never checks the theme itself, and mixing pieces from different themes becomes structurally impossible. Nothing requires `ThemeFactory` implementations to be classes; structs conform to protocols just fine.",
  },
  {
    id: "factory-namespace-fill",
    type: "fill",
    prompt: "An `enum` with no cases, used only to hold static functions like `LoggerFactory.make(isTesting:)`, is acting purely as a ___ — a type that can't be instantiated.",
    answers: ["namespace"],
    hint: "The role the enum plays; it groups related static functions without needing any state.",
    explanation:
      "A case-less enum can't be instantiated (there's no value to construct), which makes it a convenient, lightweight namespace for grouping static factory functions with no instance state.",
  },
  {
    id: "factory-di-predict",
    type: "predict",
    prompt: "What does calling `LoggerFactory.make(isTesting: true)` return, given the definitions from the lesson?",
    code: `enum LoggerFactory {\n    static func make(isTesting: Bool) -> AnalyticsLogger {\n        isTesting ? NoOpLogger() : NetworkLogger()\n    }\n}\nlet logger = LoggerFactory.make(isTesting: true)`,
    options: [
      "A `NoOpLogger` instance, typed as `AnalyticsLogger`",
      "A `NetworkLogger` instance, typed as `AnalyticsLogger`",
      "Compile error — `AnalyticsLogger` can't be returned",
      "nil",
    ],
    answer: 0,
    explanation:
      "`isTesting` is `true`, so the ternary picks `NoOpLogger()`. The static type of `logger` is `AnalyticsLogger` (the protocol), even though the runtime instance is a `NoOpLogger` — exactly the decoupling a factory is meant to provide.",
  },
  {
    id: "factory-pitfall-senior",
    type: "mcq",
    prompt: "A teammate's factory method has grown to contain the app's core discount-calculation logic inside its `switch` statement, alongside deciding which `PaymentProcessor` to build. What's the concern?",
    options: [
      "The factory is doing more than deciding which type to construct — business logic like discount calculation belongs in the objects it builds, not the factory itself",
      "Nothing — factories are meant to hold all app logic",
      "Factories can only contain a single `case`",
      "The factory should be renamed to a builder",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A factory's one job is choosing *which* concrete type to build. Once it starts embedding business rules, it stops being a clean seam for swapping implementations — changes to discount logic now risk breaking the type-selection code, and vice versa.",
  },
  {
    id: "factory-flashcard",
    type: "flashcard",
    prompt:
      "Explain the factory method pattern, how it differs from abstract factory, and why a static factory in Swift is sometimes better than a plain `init`. Answer aloud, then reveal.",
    modelAnswer:
      "A **factory method** is a function or static method whose return type is a **protocol** rather than a concrete type; it contains the `switch`/`if` logic deciding which concrete implementation to construct, so every caller depends only on the protocol and never names the concrete type directly. This is how you **decouple** object creation from object use — swapping `StripeProcessor` for a fake `PaymentProcessor` in a test touches only the factory. An **abstract factory** scales this up: instead of one object, it's a protocol that produces a whole *family* of related objects that must agree with each other (like a theme's button and background styles), guaranteeing you can never accidentally mix pieces from two different families. A Swift **static factory** — a named static function like `URLColor.brand()` or `URLSession.session(for:)` — differs from a plain `init` in two ways: the name documents *what's* being built better than a raw initializer call can, and it can return an existing cached or shared instance instead of always allocating fresh, which `init` can never do. A case-less enum is a common lightweight **namespace** for grouping these static factory functions when no instance state is needed.",
    keyPoints: [
      "Factory method: function/static method returning a protocol, deciding which concrete type to build",
      "Decouples creation from use — callers depend only on the protocol",
      "Abstract factory: a protocol producing a matched family of related objects",
      "Static factory vs init: better naming + can return a cached/shared instance instead of always allocating",
      "Case-less enum as a namespace for grouping static factory functions",
    ],
    explanation:
      "A senior answer distinguishes factory method (one object) from abstract factory (a consistent family), and can articulate the concrete advantage a static factory has over `init` — returning a shared instance.",
  },
];

export default quiz;
