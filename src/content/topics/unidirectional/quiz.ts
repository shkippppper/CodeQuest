import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "udf-cycle",
    type: "mcq",
    prompt: "What is the data-flow cycle in a unidirectional architecture?",
    options: [
      "State → View → Action → Reducer → new State",
      "View ↔ Model (two-way binding)",
      "Action → View → State → Action",
      "Model → Controller → Model",
    ],
    answer: 0,
    explanation:
      "Data flows one way: the View renders from State, dispatches Actions, a Reducer produces new State, and the View re-renders. The view never mutates state directly.",
  },
  {
    id: "single-source-fill",
    type: "fill",
    prompt: "Unidirectional apps keep all state in one place, often called the single source of ___.",
    answers: ["truth"],
    hint: "'single source of ___'.",
    explanation:
      "A **single source of truth** means every screen derives what it shows from one store, so views can't disagree and there's one place to inspect/persist/restore state.",
  },
  {
    id: "reducer-pure",
    type: "mcq",
    prompt: "Why must reducers be pure functions in UDF?",
    options: [
      "Determinism — same state + action always yields the same new state, enabling replay and easy testing",
      "Purity makes them run faster on the GPU",
      "So they can perform network calls inline",
      "It's a Swift compiler requirement",
    ],
    answer: 0,
    explanation:
      "Pure reducers are deterministic, so state becomes a replayable function of the initial state plus the action list — the basis for time-travel debugging and mock-free tests.",
  },
  {
    id: "side-effects-location",
    type: "mcq",
    prompt: "Where do side effects (networking, timers) run in a unidirectional architecture?",
    options: [
      "Outside the reducer — in middleware or as Effect values — with results dispatched back as new actions",
      "Inside the reducer, synchronously",
      "In the View's body",
      "They aren't allowed at all",
    ],
    answer: 0,
    explanation:
      "Reducers stay pure, so effects run outside them (Redux middleware, or TCA-style Effect values). The async result re-enters the loop as a new action — nothing bypasses the one-way flow.",
  },
  {
    id: "action-meaning",
    type: "mcq",
    prompt: "What does an Action represent?",
    options: [
      "A description of what happened (an event), not how to change state",
      "A direct mutation of state",
      "A view to render",
      "A network request object",
    ],
    answer: 0,
    explanation:
      "An Action is a value describing an event (`.buttonTapped`, `.dataLoaded(items)`). The reducer decides *how* that event changes state — the action only says *what* happened.",
  },
  {
    id: "udf-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about unidirectional data flow.",
    options: [
      "The view can only dispatch actions, not mutate state directly",
      "State can be reconstructed by replaying the ordered list of actions",
      "Reducers perform network requests inline",
      "TCA and Redux are concrete implementations of this pattern",
    ],
    answers: [0, 1, 3],
    explanation:
      "View-dispatches-only, replayable state, and TCA/Redux as implementations are all correct. Reducers are **pure** and never do I/O inline (option 3 is false).",
  },
  {
    id: "udf-vs-mvvm-senior",
    type: "mcq",
    prompt: "How does unidirectional data flow chiefly differ from typical MVVM?",
    options: [
      "UDF centralizes state and mutates only via actions→reducer; MVVM keeps per-screen state and lets view models mutate directly (often two-way binding)",
      "MVVM has no state",
      "UDF forbids SwiftUI",
      "They are identical",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "UDF has a single source of truth and strictly one-way mutation through pure reducers; MVVM distributes state across view models that mutate it directly, commonly with two-way binding. UDF trades more boilerplate for higher global predictability.",
  },
  {
    id: "time-travel-senior",
    type: "predict",
    prompt: "🧠 Trick question — an app records every dispatched action. A tester hits a bug. How do you reproduce the exact state?",
    code: `// initialState + [action0, action1, ..., actionN] were logged`,
    options: [
      "Replay the logged actions through the pure reducers from the initial state — you get the identical state",
      "You can't reproduce it without the original device",
      "Re-run the network requests and hope",
      "Restart the app and guess",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Because state is a **pure function** of initialState + the ordered actions, replaying the recorded actions deterministically reconstructs the exact state — the foundation of time-travel debugging and bug reports that ship an action log. This is only possible because reducers are pure and effects re-enter as actions.",
  },
  {
    id: "udf-cost-senior",
    type: "mcq",
    prompt: "What's the main cost of adopting strict unidirectional data flow?",
    options: [
      "Boilerplate (actions/reducers for everything) and a mindset shift — heavy for simple screens",
      "It makes state unpredictable",
      "It can't handle asynchronous work",
      "It only works on the web",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "One-way flow demands defining actions and reducers for every interaction, which is overhead for simple screens. The predictability/testability payoff is worth it for complex, shared, app-wide state — you can even mix UDF for one feature with MVVM elsewhere.",
  },
  {
    id: "udf-flashcard",
    type: "flashcard",
    prompt:
      "Explain unidirectional data flow, why it's predictable, and how it compares to MVVM. Answer aloud, then reveal.",
    modelAnswer:
      "**Unidirectional data flow (UDF/Redux)** moves data in one direction: **State → View → Action → Reducer → new State → View**. There's a **single source of truth** (one store), the view can **only dispatch actions** (values describing what happened), and **pure reducers** `(State, Action) -> State` compute the next state. Because reducers are pure, **side effects live outside** them — in **middleware** (Redux) or **Effect** values (TCA) — with results dispatched back as new actions. The payoff: state is a **replayable function** of initialState + the action list, giving time-travel debugging, mock-free testing, and one place to reason about every change; the cost is **boilerplate** and a mindset shift. Versus **MVVM**: UDF centralizes state and mutates only via actions→reducer (strictly one-way), while MVVM keeps per-screen state and mutates it directly (often two-way binding) — lighter but less globally predictable. **TCA and Redux are concrete implementations** of this pattern, and it can coexist with MVVM per feature.",
    keyPoints: [
      "One-way cycle: State → View → Action → Reducer → State",
      "Single source of truth; view only dispatches actions",
      "Pure reducers; side effects in middleware/Effects, results re-enter as actions",
      "State replayable from actions → time-travel debug + easy tests",
      "vs MVVM: centralized/one-way vs per-screen/two-way; more boilerplate",
    ],
    explanation:
      "Senior answers connect purity to replayability/time-travel, correctly place side effects outside reducers, and contrast with MVVM's distributed, two-way state.",
  },
];

export default quiz;
