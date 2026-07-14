import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "dependency-rule",
    type: "mcq",
    prompt: "What is the Dependency Rule in Clean Architecture?",
    options: [
      "Source-code dependencies point only inward — inner layers never depend on outer ones",
      "Every layer can depend on every other layer, as long as the dependency is injected via a protocol",
      "The UI layer is at the center because it orchestrates all user interactions and business actions",
      "Dependencies point only outward, toward frameworks, so the domain stays updated with the latest APIs",
    ],
    answer: 0,
    explanation:
      "Dependencies point **inward** toward the more abstract layers. Entities and Use Cases never import UI, network, or database code — that keeps business logic framework-independent.",
  },
  {
    id: "center-layer",
    type: "mcq",
    prompt: "Which sits at the center (most independent) of Clean Architecture?",
    options: [
      "Entities (enterprise business rules)",
      "URLSession, because it abstracts all network access behind a stable Apple-provided interface",
      "The View, because it represents the user's goals and must stay shielded from technical details",
      "Core Data, since the persistent store is the foundation every other layer reads from",
    ],
    answer: 0,
    explanation:
      "**Entities** — the most stable, framework-independent business objects — are at the center. Frameworks (URLSession, Core Data, UIKit) live at the outermost edge as replaceable details.",
  },
  {
    id: "use-case-role",
    type: "mcq",
    prompt: "What is a 'use case' (interactor) in Clean Architecture?",
    options: [
      "Application-specific business logic that orchestrates entities, depending only on abstractions",
      "A SwiftUI view that owns the screen's input validation and routes to the next screen on success",
      "A database table definition that maps domain fields to columns for the persistence layer",
      "A networking client that calls the remote API and decodes the JSON response into models",
    ],
    answer: 0,
    explanation:
      "A use case fulfills one application action (e.g. 'register user') by orchestrating entities, depending on **protocols** for anything external — never on concrete frameworks.",
  },
  {
    id: "clean-dip-fill",
    type: "fill",
    prompt: "The principle that lets an inner use case 'call' the database without depending on it — by owning a protocol the outer layer implements — is dependency ___.",
    answers: ["inversion", "injection"],
    hint: "The 'D' in SOLID.",
    explanation:
      "**Dependency inversion**: the use case declares the protocol it needs; the outer layer implements and injects it. This flips the dependency arrow so it points inward, satisfying the Dependency Rule.",
  },
  {
    id: "frameworks-edge",
    type: "mcq",
    prompt: "Where do UIKit, URLSession, and Core Data belong in Clean Architecture?",
    options: [
      "At the outermost layer (Frameworks & Drivers) — replaceable details",
      "At the center with the entities, since they provide the stable platform APIs all layers rely on",
      "In the use cases, because the interactor needs direct access to URLSession and Core Data models",
      "They aren't used at all, because Clean Architecture mandates a purely abstract data layer",
    ],
    answer: 0,
    explanation:
      "Frameworks are **details** at the edge. Because inner layers depend only on protocols, you can swap Core Data for SwiftData or mock the network without touching business logic.",
  },
  {
    id: "clean-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about Clean Architecture.",
    options: [
      "The domain (entities + use cases) can compile without Apple frameworks",
      "Business logic becomes easy to unit test by injecting mock implementations",
      "Inner layers import the UI layer to update it",
      "VIPER is essentially Clean Architecture applied per screen",
    ],
    answers: [0, 1, 3],
    explanation:
      "A framework-free domain, testability via injected mocks, and the VIPER relationship are all correct. Inner layers **never** import the UI — that would violate the Dependency Rule (option 3 is false).",
  },
  {
    id: "clean-boundary-protocol-senior",
    type: "predict",
    prompt: "🧠 Trick question — in which layer does the `UserRepository` **protocol** live, and in which does `CoreDataUserRepository` live?",
    code: `protocol UserRepository { func save(_ u: User) async throws }
final class CoreDataUserRepository: UserRepository { /* ... */ }`,
    options: [
      "The protocol lives in the inner (domain/use-case) layer; the Core Data implementation lives in the outer (data) layer",
      "Both live in the outer data layer, since the protocol is just a convenience contract owned by the repository implementation itself",
      "Both live in the domain layer, because the concrete Core Data class must be compiled alongside the use case for direct injection",
      "The protocol lives in the UI layer so the view model can declare exactly the data shape and access pattern it requires",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The abstraction is **owned by the inner layer** that needs it (so the use case depends only on `UserRepository`), while the concrete framework-backed implementation lives **outward** and is injected in. That ownership split is the mechanism of dependency inversion — the protocol points the dependency arrow inward.",
  },
  {
    id: "clean-overkill-senior",
    type: "mcq",
    prompt: "What's the honest downside of full Clean Architecture on a small app?",
    options: [
      "Boilerplate, type-mapping across boundaries, and indirection that outweigh the benefits at small scale",
      "It makes business logic untestable because the protocol boundaries block injection of mock dependencies",
      "It couples you to a single framework, since each layer must be compiled against the same platform SDK",
      "It has no real downsides — the layering pays for itself even in a two-screen app with one developer",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The layers, protocols, and DTO mapping add real overhead. For a small app it's often over-engineering; most teams apply the *principles* (inward dependencies, use cases, injected boundaries) pragmatically rather than drawing every circle.",
  },
  {
    id: "clean-swap-framework-senior",
    type: "mcq",
    prompt: "Why can you migrate Core Data → SwiftData with minimal impact in a Clean codebase?",
    options: [
      "Business logic depends on a repository protocol, not the persistence framework — you swap only the outer implementation",
      "Clean Architecture explicitly forbids any persistence layer and instead relies on a remote service to store all domain objects across sessions",
      "SwiftData is fully API-identical to Core Data at the call site, so the existing models and fetch requests compile completely unchanged",
      "Both frameworks read from a shared remote managed object context stored in the cloud, so entity definitions are framework-agnostic by default",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Use cases talk to `UserRepository`, not to Core Data. Swapping persistence means writing a new outer implementation of that protocol; the domain and presentation layers don't change. Framework-independence is the whole payoff of the Dependency Rule.",
  },
  {
    id: "clean-flashcard",
    type: "flashcard",
    prompt:
      "Explain Clean Architecture: the layers, the Dependency Rule, and how dependency inversion enables it. Answer aloud, then reveal.",
    modelAnswer:
      "**Clean Architecture** arranges code in concentric layers: **Entities** (core business rules) at the center, **Use Cases** (application logic) around them, **Interface Adapters** (presenters/view models, gateways/repositories) next, and **Frameworks & Drivers** (UIKit, URLSession, Core Data) at the outer edge. The **Dependency Rule**: source dependencies point **only inward** — inner layers never know about outer ones, so business logic is **framework-independent and unit-testable**. That works via **dependency inversion**: an inner use case **owns the protocol** it needs (e.g. `UserRepository`); the outer layer **implements** it and injects it at the composition root, flipping the natural outward arrow inward. On iOS this maps to Domain (framework-free) / Data / Presentation modules. Trade-off: framework-swappability and testability vs. boilerplate, cross-boundary type mapping, and indirection — overkill for small apps, so apply the principles pragmatically. (VIPER is this, per screen.)",
    keyPoints: [
      "Layers: Entities → Use Cases → Adapters → Frameworks (center out)",
      "Dependency Rule: source deps point only inward",
      "Dependency inversion: inner owns the protocol, outer implements/injects",
      "Domain compiles without Apple frameworks → testable, swappable",
      "Cost: boilerplate/mapping/indirection; apply pragmatically",
    ],
    explanation:
      "Senior answers state the Dependency Rule precisely, explain dependency inversion (who owns the protocol), map it to iOS modules, and give the honest overhead trade-off.",
  },
];

export default quiz;
