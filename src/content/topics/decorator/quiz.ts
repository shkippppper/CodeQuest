import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "decorator-what",
    type: "mcq",
    prompt: "What is the core shape of the decorator pattern?",
    options: [
      "A type that conforms to the same interface as the object it wraps, forwards calls to it, and adds behavior around the forwarding",
      "A subclass that overrides every method of its parent",
      "A global singleton that all objects share",
      "A protocol with no default implementations",
    ],
    answer: 0,
    explanation:
      "A decorator implements the same protocol as the thing it wraps, holds a reference to it, forwards calls, and adds its own behavior before or after forwarding.",
  },
  {
    id: "decorator-why-not-subclass",
    type: "mcq",
    prompt: "Why does subclassing struggle when you need to combine several independent toppings/behaviors?",
    options: [
      "Covering every combination can require up to 2^N subclasses, one per combination",
      "Swift doesn't support subclassing",
      "Subclasses can't override methods",
      "Structs can't be subclassed so it's always impossible",
    ],
    answer: 0,
    explanation:
      "With N independent behaviors, a subclass hierarchy may need up to 2^N classes to cover every combination. Decorators instead nest N small wrapper types in any order.",
  },
  {
    id: "decorator-stack-predict",
    type: "predict",
    prompt: "What does `fancy.cost` evaluate to?",
    code: `struct Espresso: Beverage {
    var cost: Double { 2.50 }
}
struct MilkDecorator: Beverage {
    let wrapped: Beverage
    var cost: Double { wrapped.cost + 0.50 }
}
struct CaramelDecorator: Beverage {
    let wrapped: Beverage
    var cost: Double { wrapped.cost + 0.75 }
}
let fancy = CaramelDecorator(wrapped: MilkDecorator(wrapped: Espresso()))
print(fancy.cost)`,
    options: ["3.75", "2.50", "3.25", "4.00"],
    answer: 0,
    explanation:
      "Espresso costs 2.50, MilkDecorator adds 0.50 (3.00), CaramelDecorator adds 0.75 more (3.75). Each layer only knows about the layer directly inside it.",
  },
  {
    id: "decorator-fill",
    type: "fill",
    prompt: "A decorator that implements a protocol by wrapping another implementer of that same protocol is specifically called a ___ decorator.",
    answers: ["protocol"],
    hint: "Named after the language construct being wrapped.",
    explanation:
      "A protocol decorator wraps another conformer of the same protocol — e.g. `CachingImageLoader` wrapping `NetworkImageLoader`, both conforming to `ImageLoader`.",
  },
  {
    id: "decorator-order-predict",
    type: "predict",
    prompt: "Given `LoggingImageLoader(wrapped: CachingImageLoader(wrapped: NetworkImageLoader()))`, does the logger print on a cache hit?",
    code: `let loader: ImageLoader = LoggingImageLoader(wrapped: CachingImageLoader(wrapped: NetworkImageLoader()))
_ = try await loader.load(url: url)   // first call: miss
_ = try await loader.load(url: url)   // second call: hit`,
    options: [
      "Yes — the logger sits outside the cache, so it logs on every call, hit or miss",
      "No — the logger only fires on the underlying network call",
      "It throws an error",
      "Only the first call logs",
    ],
    answer: 0,
    explanation:
      "Because `LoggingImageLoader` wraps `CachingImageLoader` (not the other way around), every call passes through the logger first, regardless of whether the cache underneath serves a hit or triggers a real fetch.",
  },
  {
    id: "decorator-truths-multi",
    type: "multi",
    prompt: "Select all true statements about the decorator pattern.",
    options: [
      "Decorators can wrap other decorators",
      "A decorator must forward the call to the wrapped object to preserve its behavior",
      "Decorator is the only way to combine behaviors in Swift",
      "SwiftUI view modifiers like `.padding().background()` are a real-world example of decoration",
    ],
    answers: [0, 1, 3],
    explanation:
      "Decorators compose (option 0), should generally forward to avoid silently breaking behavior (option 1), and SwiftUI modifiers are a genuine everyday example (option 3). Decorator isn't the *only* way to combine behavior (option 2 is false) — plain composition or enums can work too depending on the case.",
  },
  {
    id: "decorator-vs-subclass-senior",
    type: "mcq",
    prompt: "What can a decorator-based design do that a fixed subclass hierarchy cannot?",
    options: [
      "Swap or omit a specific layer at runtime for one call site without creating a new subclass",
      "Run faster in all cases",
      "Avoid using protocols entirely",
      "Guarantee thread safety automatically",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Because each decorator layer is just an object built at runtime, you can build `LoggingImageLoader(wrapped: NetworkImageLoader())` without caching for one screen, while every other screen keeps caching — no new subclass required. A subclass hierarchy bakes that choice in at compile time.",
  },
  {
    id: "decorator-pitfall-senior",
    type: "predict",
    prompt: "🧠 A decorator's method body doesn't call the wrapped object's corresponding method at all. What's the likely consequence?",
    code: `final class BrokenCachingLoader: ImageLoader {
    private let wrapped: ImageLoader
    init(wrapped: ImageLoader) { self.wrapped = wrapped }
    func load(url: URL) async throws -> UIImage {
        throw LoaderError.notImplemented   // never calls wrapped.load
    }
}`,
    options: [
      "The wrapped object's real behavior never runs — every call through this decorator silently loses the underlying functionality",
      "Swift automatically forwards the call anyway",
      "It compiles but always returns a cached value",
      "This is a compile-time error",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Forgetting to forward is a classic decorator bug: since the decorator doesn't call `wrapped.load`, the entire underlying implementation is bypassed — here it just throws instead of ever reaching the network loader.",
  },
  {
    id: "decorator-flashcard",
    type: "flashcard",
    prompt: "Explain the decorator pattern: shape, why it beats subclassing for combinable behaviors, and one real Swift example. Answer aloud, then reveal.",
    modelAnswer:
      "A **decorator** is a type that conforms to the same interface as the object it wraps, holds a reference to that wrapped object, forwards calls to it, and adds its own behavior before or after forwarding. Because a decorator conforms to the same protocol as what it wraps, decorators can be **stacked** — a decorator can wrap another decorator — letting you combine N independent behaviors with N small types nested in any order, instead of needing up to 2^N subclasses to cover every combination. The pattern differs from a **protocol decorator** specifically only in naming: same idea, applied to a protocol with methods rather than just computed properties. A real Swift example is SwiftUI view modifiers (`.padding().background().cornerRadius()`), where each call wraps the previous view in a new one conforming to `View`, or a `CachingImageLoader`/`LoggingImageLoader` stack wrapping a `NetworkImageLoader`, all conforming to `ImageLoader`.",
    keyPoints: [
      "Same interface as wrapped object, holds a reference, forwards + adds behavior",
      "Decorators stack: N types combine in any order vs up to 2^N subclasses",
      "Must forward the call or the underlying behavior is lost",
      "Real examples: SwiftUI modifiers, caching/logging loader stacks",
    ],
    explanation:
      "A senior answer emphasizes the combinatorial advantage over subclassing and names a concrete Swift example instead of only the abstract definition.",
  },
];

export default quiz;
