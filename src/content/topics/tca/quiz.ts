import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "tca-reducer",
    type: "mcq",
    prompt: "In TCA, what is a Reducer?",
    options: [
      "A pure function that mutates State for a given Action and returns any side effects to run",
      "The runtime object that holds state, observes published changes, and owns the feature's lifecycle",
      "A SwiftUI view struct that renders the current state and dispatches actions on user interaction",
      "A type-safe networking client that handles all async API requests for a given feature module",
    ],
    answer: 0,
    explanation:
      "A reducer is a **pure** `(inout State, Action) -> Effect`: it applies the state change for an action and returns Effects for any side work. Purity is what makes it testable and predictable.",
  },
  {
    id: "tca-store",
    type: "mcq",
    prompt: "What is the Store's role in TCA?",
    options: [
      "It holds the state, receives actions, runs the reducer, executes effects, and drives the view",
      "It performs network requests directly inside the reducer as part of the pure state transformation",
      "It is where you declare the Action enum and all associated value types the feature can dispatch",
      "It replaces SwiftUI by providing its own layout and rendering engine for TCA-managed views",
    ],
    answer: 0,
    explanation:
      "The **Store** is the runtime: the view sends it actions, it runs the reducer (updating state and collecting effects), runs those effects, and feeds their results back as new actions.",
  },
  {
    id: "tca-effects",
    type: "mcq",
    prompt: "Why can't a reducer perform a network call inline?",
    options: [
      "Reducers must be pure; side effects are returned as Effect values the store runs, with results fed back as actions",
      "TCA compiles all reducer logic to run on the GPU in a compute shader to enable fully parallel state updates across features",
      "Swift's own type system statically bans all networking API calls from any function that is annotated as a TCA reducer method",
      "The Store module forbids async code anywhere in the entire feature module in order to guarantee strictly synchronous state transitions",
    ],
    answer: 0,
    explanation:
      "Purity keeps reducers deterministic and testable. Side effects are modeled as **Effect** values (e.g. `.run { send in ... }`); their results return as new actions the reducer can handle.",
  },
  {
    id: "tca-unidirectional-fill",
    type: "fill",
    prompt: "TCA is a ___ data-flow architecture — state only ever changes inside the reducer.",
    answers: ["unidirectional", "one-way", "one directional"],
    hint: "One direction of flow (Redux-style).",
    explanation:
      "Data flows one way: Action → Reducer → State → View → Action. State mutates only inside the reducer, which makes changes predictable and debuggable.",
  },
  {
    id: "tca-dependencies",
    type: "mcq",
    prompt: "How does TCA keep side effects testable?",
    options: [
      "External systems (API, clock, UUID) are injected via `@Dependency`, so tests substitute controlled versions",
      "TestStore automatically intercepts and no-ops every effect closure declared in the reducer so none actually execute",
      "TCA relies entirely on process-wide global singleton instances so that any test file can reach in and replace live implementations",
      "Every single effect closure is silently dropped and never executed at all when the TCA feature module runs inside any test target",
    ],
    answer: 0,
    explanation:
      "TCA's dependency system injects clients for external systems. In tests you swap in deterministic versions (fixed dates, canned responses), making the whole feature reproducible.",
  },
  {
    id: "tca-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about TCA.",
    options: [
      "Large features are composed from smaller reducers (Scope/ifLet/forEach)",
      "`TestStore` forces you to assert exactly how state changed",
      "Reducers are impure and perform I/O directly",
      "It's a third-party library you adopt wholesale",
    ],
    answers: [0, 1, 3],
    explanation:
      "Composition, exhaustive `TestStore` assertions, and being an opt-in third-party dependency are all true. Reducers are **pure** — I/O happens in Effects, not inline (option 3 is false).",
  },
  {
    id: "tca-exhaustive-senior",
    type: "predict",
    prompt: "🧠 Trick question — a `TestStore` test sends `.increment` but the assertion closure omits the `count` change. What happens?",
    code: `await store.send(.increment) { /* forgot: $0.count = 1 */ }`,
    options: [
      "The test fails — exhaustive testing requires you to describe every state mutation",
      "The test passes silently because undescribed state changes are treated as acceptable noise",
      "It crashes the running app process with an unhandled exception from the assertion framework",
      "The action is silently dropped and never forwarded to the reducer in test mode",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "TCA's `TestStore` is **exhaustive** by default: any state change you don't account for in the assertion closure (or any effect action you don't receive) **fails** the test. That rigor catches unintended state changes — a signature strength (you can opt into non-exhaustive mode when needed).",
  },
  {
    id: "tca-composition-senior",
    type: "mcq",
    prompt: "How does TCA compose a parent feature from child features?",
    options: [
      "The parent embeds child State, wraps child Actions, and glues child reducers with Scope/ifLet/forEach",
      "By subclassing the child reducer class and selectively overriding only the action-handling methods that differ in the parent",
      "By manually copying the entire child feature's reducer body verbatim into the matching action cases of the parent reducer",
      "Child features fundamentally cannot be composed into a parent in TCA — every feature must be written and tested in full isolation",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Composition is structural: parent `State` contains child `State`, parent `Action` wraps child `Action`, and operators (`Scope`, `ifLet`, `forEach`) run the child reducer within the parent. That's how independently-tested feature modules assemble into an app.",
  },
  {
    id: "tca-tradeoff-senior",
    type: "mcq",
    prompt: "What's the most honest downside of adopting TCA?",
    options: [
      "You couple your architecture to a third-party library with a steep learning curve and boilerplate — heavy for small apps",
      "It makes every single state change unpredictable because TCA reducers execute asynchronously on an unspecified background scheduler",
      "TCA has no mechanism whatsoever to model or represent side effects — all I/O must be handled entirely outside the architecture",
      "TCA ships with absolutely no built-in testing story and requires integrating a completely separate third-party framework to verify reducer behavior",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "TCA's consistency and testability come at the cost of a **third-party dependency**, a real learning curve, and boilerplate per feature (plus historical compile-time overhead on big reducers). It shines in large, stateful, team apps and is overkill for simple ones.",
  },
  {
    id: "tca-flashcard",
    type: "flashcard",
    prompt:
      "Explain TCA's core loop and its signature strengths and trade-offs. Answer aloud, then reveal.",
    modelAnswer:
      "**TCA** is a unidirectional, Redux-style library. Core pieces: **State** (value-type single source of truth), **Action** (enum of every event), **Reducer** (a *pure* `(inout State, Action) -> Effect` that mutates state and returns side effects), and **Store** (runtime that holds state, runs the reducer, executes effects, drives the SwiftUI view). Because reducers are pure, side effects are returned as **Effects** whose results come back as actions, and external systems (API, clock, UUID) are injected via **`@Dependency`** — making everything deterministic. Signature strengths: **composition** (build big features from small reducers with `Scope`/`ifLet`/`forEach`) and **exhaustive testing** (`TestStore` fails unless you assert every state change and receive every effect action). Trade-offs: it's a **third-party dependency** with a **steep learning curve** and **boilerplate**, adopted wholesale — great at scale, overkill for small apps. Essentially Redux/unidirectional data flow productized for Swift.",
    keyPoints: [
      "State / Action / Reducer (pure) / Store — unidirectional",
      "Side effects returned as Effects; results come back as actions",
      "Dependencies injected via @Dependency → deterministic",
      "Composition (Scope/ifLet/forEach) + exhaustive TestStore",
      "Cost: 3rd-party dep, learning curve, boilerplate — best at scale",
    ],
    explanation:
      "Senior answers nail the pure-reducer + Effects loop, cite exhaustive TestStore and composition as the differentiators, and give the honest third-party/boilerplate trade-off.",
  },
];

export default quiz;
