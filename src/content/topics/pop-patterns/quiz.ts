import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "popp-witness-fill",
    type: "fill",
    prompt: "The hidden table the compiler builds connecting a protocol's requirements to a conforming type's implementations is called a ___ table.",
    answers: ["witness"],
    hint: "Each implementation in it is a 'witness' that the type satisfies the requirement.",
    explanation:
      "A witness table connects each protocol requirement to a specific type's implementation of it. The struct-of-closures pattern makes this table an explicit, constructible value instead of a hidden compiler artifact.",
  },
  {
    id: "popp-core-idea",
    type: "mcq",
    prompt: "What is the core idea behind representing a dependency as a struct of closures instead of a protocol?",
    options: [
      "Make the protocol's witness table an explicit, constructible struct value, with one closure field per requirement",
      "Replace all classes in the app with structs to gain value semantics and eliminate retain cycles across the codebase",
      "Use generics instead of protocols to avoid associated types entirely",
      "Store every dependency in a global singleton",
    ],
    answer: 0,
    explanation:
      "Instead of letting the compiler build a hidden witness table when a type conforms to a protocol, you build that same table yourself as a struct whose fields are closures — one per requirement.",
  },
  {
    id: "popp-mock-boilerplate-predict",
    type: "predict",
    prompt: "Given this struct-based client, what does the test below actually produce?",
    code: `struct APIClient {
    var fetchUser: (String) async throws -> User
}
extension APIClient {
    static let mock = APIClient(fetchUser: { _ in User(id: "1", name: "Ada") })
}
var flaky = APIClient.mock
flaky.fetchUser = { _ in throw URLError(.timedOut) }
// APIClient.mock is used elsewhere in the same test run`,
    options: [
      "APIClient.mock is unaffected — flaky is an independent copy because APIClient is a struct",
      "APIClient.mock now also throws URLError(.timedOut), since both variables share the closure's heap storage through a reference",
      "This is a compile error — struct properties can't be reassigned after init",
      "Both flaky and APIClient.mock become nil",
    ],
    answer: 0,
    explanation:
      "Structs are value types, so `var flaky = APIClient.mock` copies the value. Mutating flaky.fetchUser only changes the copy — APIClient.mock, and anything else using it, is untouched.",
  },
  {
    id: "popp-di-mcq",
    type: "mcq",
    prompt: "How does swapping in a test-specific dependency work when using a struct of closures for DI, compared to a protocol + mock class?",
    options: [
      "Override just the one or two closure fields you need on a copy, inline in the test — no new mock type required",
      "You still need to write a new class that conforms to the struct's implicit protocol and implements all its requirements",
      "It's impossible — structs can't be swapped at runtime",
      "You must use @testable import to access private closures",
    ],
    answer: 0,
    explanation:
      "Because the struct's fields are ordinary mutable properties, a test can start from a shared `.mock` value and override only what it needs, without declaring any new type.",
  },
  {
    id: "popp-existential-mcq",
    type: "mcq",
    prompt: "What is an existential type in Swift?",
    options: [
      "A protocol used as a type itself (e.g. `any APIClient`) — a box that can hold any conforming type, with the concrete type erased and calls routed through the witness table at runtime",
      "Any Swift type declared with the `struct` keyword, since structs always use static dispatch, value semantics, and copy-on-write, making dynamic type erasure unnecessary by definition",
      "Any type that conforms to both Equatable and Hashable, enabling it to serve as a dictionary key or set element",
      "A closure that captures no variables from its surrounding scope",
    ],
    answer: 0,
    explanation:
      "An existential type erases the concrete conforming type behind a protocol-shaped box. Calls on it go through dynamic dispatch via the witness table, unlike a concrete struct where the compiler knows the implementation at compile time.",
  },
  {
    id: "popp-associated-type-senior",
    type: "mcq",
    prompt: "Why does a struct of closures sidestep the associated-type limitation that protocols have?",
    options: [
      "A protocol with an associatedtype requirement generally can't be used as `any Protocol` without extra ceremony (generics or type erasure), while a struct of closures is just a concrete type with no existential needed at all",
      "Structs can't have generic parameters of their own, so any protocol-level associated-type limitation simply disappears automatically when you switch to a struct of closures because type-level generic constraints no longer apply at all",
      "Associated types are only a problem for classes, not protocols",
      "Swift automatically converts associated types to generics when used in structs",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Existential types (`any Protocol`) struggle with associated-type requirements because the erased box can't fully describe them without extra machinery. A struct of closures never becomes an existential in the first place — it's already a concrete type — so this limitation doesn't apply.",
  },
  {
    id: "popp-tradeoffs-multi",
    type: "multi",
    prompt: "Select all true statements about the trade-offs of struct-of-closures dependency injection vs protocols.",
    options: [
      "You lose the ability to provide a default implementation for all conforming types via a protocol extension",
      "Calls through a concrete struct's stored closures avoid the existential's dynamic-dispatch indirection",
      "It is always strictly better than a protocol for every dependency, regardless of how many implementations it has",
      "Every field of the struct's memberwise initializer must be supplied, which static factory functions like .live and .mock help manage",
    ],
    answers: [0, 1, 3],
    explanation:
      "Protocol extensions' free default implementations are lost, calls avoid existential dispatch overhead, and the struct's initializer needs every closure filled in. It is not universally better — for a single-implementation dependency with no test variance, a protocol (or nothing at all) is often simpler.",
  },
  {
    id: "popp-retain-cycle-predict",
    type: "predict",
    prompt: "What's the risk in this factory, and how would you fix it?",
    code: `class ProfileViewModel {
    var client: APIClient!
    func configure() {
        client = APIClient(fetchUser: { [self] id in
            try await self.session.fetchUser(id)
        })
    }
}`,
    options: [
      "The closure captures self strongly, creating a retain cycle since the closure lives inside a property on self — fix with [weak self]",
      "This is fine because APIClient is a struct, so its stored closures use value semantics and never cause retain cycles through ARC reference counting",
      "It will crash immediately because self isn't fully initialized",
      "Closures in Swift can never capture self, so this won't compile",
    ],
    answer: 0,
    explanation:
      "Even though APIClient is a struct, the closure inside it strongly captures self, and that closure is stored on self via client — a classic retain cycle. Capturing [weak self] breaks it, same as with any long-lived closure property.",
  },
  {
    id: "popp-flashcard",
    type: "flashcard",
    prompt:
      "Explain protocol witnesses as values: what a witness table is, how struct-of-closures DI works, why it helps testability, and its trade-offs vs protocols. Answer aloud, then reveal.",
    modelAnswer:
      "When a type conforms to a protocol, the compiler builds a hidden **witness table** connecting each requirement to that type's implementation. This pattern makes that table explicit: a plain struct with one closure-typed field per requirement (e.g. `struct APIClient { var fetchUser: (String) async throws -> User }`). A `.live` static instance fills in real implementations; a `.mock` static instance fills in fixed test values — and because it's a struct, any test can copy `.mock` and override just the one closure it needs, inline, with no new mock class and no risk of shared mutable state leaking between tests. The performance and language-level motivation is the **existential type** cost: using a protocol as a type on its own (`any APIClient`) erases the concrete type into a box, and calls dispatch dynamically through the witness table at runtime; a struct's closures are called directly, known at compile time. Structs of closures also dodge Swift's limitation that protocols with `associatedtype` requirements generally can't be used as existentials without generics or type erasure. The costs: you lose protocol extensions' free default implementations, lose `is`-style dynamic type checks and conformance-tracing tooling, and every struct instance must supply every closure (mitigated with static factories like `.live`/`.mock`). It's best reserved for dependencies you actually need to swap in tests or per environment, not a wholesale replacement for protocols.",
    keyPoints: [
      "Witness table: compiler's hidden requirement -> implementation mapping; struct of closures makes it explicit",
      "One closure field per protocol requirement; .live and .mock as static factory instances",
      "Testability: copy the struct, override one closure inline, no new mock class",
      "Existential type = type-erased protocol box with dynamic dispatch; structs avoid that overhead",
      "Trade-offs: no protocol-extension defaults, no dynamic type checks, every field required",
    ],
    explanation:
      "A senior answer explains the witness-table mechanism precisely, ties the existential-type cost to why this pattern exists, and can articulate honest trade-offs rather than presenting it as a strictly superior replacement for protocols.",
  },
];

export default quiz;
