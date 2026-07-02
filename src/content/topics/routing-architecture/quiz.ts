import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "type-safe-routes",
    type: "mcq",
    prompt: "Why model navigation destinations as a type-safe enum rather than string identifiers?",
    options: [
      "The compiler enforces handling every destination and passing the right data; routes become values you can pass, test, and serialize",
      "Enums render faster",
      "Strings can't be used in Swift",
      "It avoids using NavigationStack",
    ],
    answer: 0,
    explanation:
      "A `Route` enum makes destinations compiler-checked and turns 'navigate to X' into a value you can log, test, deep-link to, and serialize — unlike scattered stringly-typed identifiers.",
  },
  {
    id: "centralized-vs-decentralized",
    type: "mcq",
    prompt: "What's a downside of fully centralized routing (one router knows every screen)?",
    options: [
      "The central router can become a bottleneck / God object",
      "Deep linking becomes impossible",
      "It can't be tested",
      "Features become too independent",
    ],
    answer: 0,
    explanation:
      "Centralized routing gives one source of truth (great for deep links/analytics) but risks a God-object bottleneck. Decentralized per-feature routing keeps features independent but complicates cross-feature/deep-link resolution — most apps blend the two.",
  },
  {
    id: "deep-link-parse",
    type: "mcq",
    prompt: "What's the recommended first step when handling a deep link URL?",
    options: [
      "Parse the URL/payload into a typed Route in one place, then resolve and apply it",
      "String-match the URL wherever navigation happens",
      "Ignore it unless the app is already running",
      "Immediately present an alert",
    ],
    answer: 0,
    explanation:
      "Centralize URL→Route parsing so deep-link logic is testable and consistent. Then resolve the route to a navigation action (possibly building a whole stack) and apply it, handling cold vs warm launch.",
  },
  {
    id: "hashable-fill",
    type: "fill",
    prompt: "For SwiftUI's `NavigationStack(path:)` to store your route values, the Route type must conform to ___.",
    answers: ["Hashable"],
    hint: "The protocol required for values in a NavigationPath / typed path array.",
    explanation:
      "`NavigationStack(path:)` stores a path of `Hashable` values; `.navigationDestination(for: Route.self)` maps each to a view. Making Route `Codable` too enables persistence/restoration.",
  },
  {
    id: "state-restoration",
    type: "mcq",
    prompt: "How do value-based Codable routes help navigation state restoration?",
    options: [
      "You can persist the route path and rebuild the exact stack on relaunch by decoding it",
      "They prevent the app from being terminated",
      "They disable deep links",
      "They make navigation synchronous",
    ],
    answer: 0,
    explanation:
      "If the nav state is a serializable `[Route]`, you persist it (e.g. `@SceneStorage`) and, on relaunch, decode and feed it back into the router's path to restore where the user was.",
  },
  {
    id: "routing-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about routing architecture.",
    options: [
      "Value-based routes can unify in-app navigation, deep linking, and state restoration",
      "Type-safe routes let the compiler catch unhandled destinations",
      "Deep-link parsing is best scattered across each screen",
      "Most large apps blend centralized and decentralized routing",
    ],
    answers: [0, 1, 3],
    explanation:
      "Unified value routes, compiler-checked destinations, and the centralized/decentralized blend are all correct. Deep-link parsing should be **centralized** in one testable place, not scattered (option 3 is false).",
  },
  {
    id: "cold-launch-senior",
    type: "predict",
    prompt: "🧠 Trick question — a universal link arrives while the app is terminated (cold launch). What must routing handle that a warm launch doesn't?",
    code: `// App is not running; user taps https://myapp.com/article/swift-6`,
    options: [
      "It must build the whole target stack from scratch (e.g. Tab → List → Detail) once the app finishes launching, not just push one screen",
      "Nothing — cold and warm launches are identical",
      "It should ignore the link on cold launch",
      "It must reinstall the app",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "On a warm launch you can push onto the existing stack. On a **cold launch** there's no stack yet, so the router must construct the full path to the destination (select the tab, build the intermediate list, then the detail) after launch completes — and often defer applying the route until the UI is ready. Handling both paths from one parsed Route is the mark of solid routing design.",
  },
  {
    id: "codable-route-senior",
    type: "mcq",
    prompt: "What extra capability does making your Route type `Codable` (not just `Hashable`) unlock?",
    options: [
      "Persisting and restoring the navigation stack across app termination",
      "Faster navigation animations",
      "Automatic deep-link registration with the OS",
      "Compile-time exhaustiveness",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Hashable` is enough to store routes in a `NavigationStack` path. `Codable` additionally lets you **serialize** the path to disk/`SceneStorage` and decode it on relaunch — the basis of state restoration. Same route type then serves navigation, deep links, and persistence.",
  },
  {
    id: "routing-modularization-senior",
    type: "mcq",
    prompt: "In a modular app, how do you route to another feature without coupling modules?",
    options: [
      "Define route/handler abstractions in a shared module; features register/resolve through them, wired at the app level",
      "Import every feature module into every other",
      "Use a global mutable dictionary of view controllers",
      "Hard-code destinations in each feature",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "To avoid feature↔feature imports (and cycles), routes and routing protocols live in a shared module; each feature provides handlers, and the app's composition root wires them. This keeps modular boundaries intact while still supporting cross-feature and deep-link navigation.",
  },
  {
    id: "routing-flashcard",
    type: "flashcard",
    prompt:
      "Explain routing as an architecture: type-safe routes, deep linking, and state restoration. Answer aloud, then reveal.",
    modelAnswer:
      "Treat navigation as **architecture** once an app grows: model destinations as **type-safe routes** (an enum, `Hashable` for `NavigationStack(path:)`), so 'go to X' is a value the compiler checks and you can pass/test/log. Choose a **routing strategy** — **centralized** (one resolver: great for deep links/analytics, risks a God object) vs **decentralized** (per-feature coordinators: independent, but cross-feature resolution is harder); most apps **blend** them (feature coordinators + a thin central deep-link resolver). Handle **deep links** by parsing the URL/payload into a typed Route in one place, then resolving it to a navigation action — including building a full stack on **cold launch** (no existing stack) vs pushing on warm launch. Make routes **`Codable`** and you unify three things: in-app navigation, deep linking, and **state restoration** (persist the `[Route]` path via `@SceneStorage`/disk, decode and rebuild on relaunch; UIKit uses `NSUserActivity`/restoration). In modular apps, keep route abstractions in a shared module and wire feature handlers at the composition root to avoid coupling.",
    keyPoints: [
      "Routes as type-safe values (enum, Hashable) → compiler-checked, testable",
      "Centralized vs decentralized routing; most apps blend them",
      "Deep links: parse URL → typed Route → resolve/apply (cold vs warm launch)",
      "Codable routes unify navigation + deep linking + state restoration",
      "Modular apps: route abstractions in shared module, wired at composition root",
    ],
    explanation:
      "Senior answers make routes data (Hashable/Codable), cover the cold-launch stack-building nuance, and unify navigation/deep-linking/restoration through one route type.",
  },
];

export default quiz;
