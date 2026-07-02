import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "tca-reducer",
    type: "mcq",
    prompt: "In TCA, what is a Reducer?",
    options: [
      "A pure function that mutates State for a given Action and returns any side effects to run",
      "The object that holds and observes state",
      "A SwiftUI view",
      "A networking client",
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
      "It performs the network requests directly inside the reducer",
      "It defines the Action enum",
      "It replaces SwiftUI",
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
      "Reducers run on the GPU",
      "Networking is banned in Swift",
      "The store forbids async code",
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
      "It disables all effects in tests",
      "It uses global singletons",
      "Effects are ignored during testing",
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
      "The test passes silently",
      "It crashes the app",
      "The action is ignored",
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
      "By subclassing the child reducer",
      "By copying the child's code into the parent",
      "Children can't be composed",
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
      "It makes state changes unpredictable",
      "It can't handle side effects",
      "It has no testing story",
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
