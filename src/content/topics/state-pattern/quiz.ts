import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "state-what",
    type: "mcq",
    prompt: "What is the core idea of the State pattern?",
    options: [
      "Give an object's status its own type, and let behavior branch on that type instead of on a pile of boolean flags",
      "Cache expensive computations so they run once",
      "Wrap a legacy API in a compatible interface",
      "Restrict a class to a single instance",
    ],
    answer: 0,
    explanation:
      "State isolates per-status behavior into its own type (an enum case or a dedicated object) so illegal combinations of flags become impossible to represent.",
  },
  {
    id: "state-flags-problem",
    type: "mcq",
    prompt: "What's the main problem with tracking status using several independent Bool properties?",
    options: [
      "Nothing stops the type system from allowing contradictory combinations, like isDownloading and isComplete both true",
      "Booleans are slower than enums at runtime",
      "Booleans cannot be stored in a class",
      "Swift doesn't allow more than 3 Bool properties per type",
    ],
    answer: 0,
    explanation:
      "Independent Bool flags let you set combinations that make no real-world sense. An enum with one case active at a time makes those combinations unrepresentable.",
  },
  {
    id: "state-exhaustive-predict",
    type: "predict",
    prompt: "Does this function compile?",
    code: `enum DownloadState { case idle, downloading, completed, failed, paused }

func describe(_ state: DownloadState) -> String {
    switch state {
    case .idle: return "Not started"
    case .downloading: return "Downloading"
    case .completed: return "Done"
    }
}`,
    options: [
      "No — the switch is missing .failed and .paused, and switches over enums must be exhaustive",
      "Yes — Swift fills in missing cases with a default no-op",
      "Yes — enums only require the first case to be handled",
      "No — enums cannot be used in a switch statement",
    ],
    answer: 0,
    explanation:
      "Swift requires an exhaustive switch over an enum's cases (or a default:). Missing .failed and .paused is a compile error, catching a bug before it ships.",
  },
  {
    id: "state-machine-fill",
    type: "fill",
    prompt: "A fixed set of states plus a fixed set of allowed moves between them is called a state ___.",
    answers: ["machine"],
    hint: "Two words: 'state ___'.",
    explanation:
      "A state machine restricts not just which states are representable, but which transitions between them are legal — e.g. you can't jump from completed back to downloading.",
  },
  {
    id: "state-guard-transition",
    type: "predict",
    prompt: "What does calling pause() do here?",
    code: `enum DownloadState { case idle, downloading(progress: Double), paused(progress: Double) }

class Download {
    var state: DownloadState = .idle
    func pause() {
        guard case .downloading(let p) = state else { return }
        state = .paused(progress: p)
    }
}
let d = Download()
d.pause()`,
    options: [
      "Nothing — the guard fails because state is .idle, not .downloading, so pause() silently does nothing",
      "It crashes because .paused doesn't exist yet",
      "It sets state to .paused(progress: 0) regardless of the current state",
      "It throws a runtime error for an invalid transition",
    ],
    answer: 0,
    explanation:
      "The guard only lets the transition through if the current state matches .downloading. Since state is .idle, pause() is a no-op — invalid transitions are quietly rejected rather than corrupting state.",
  },
  {
    id: "state-vs-enum-multi",
    type: "multi",
    prompt: "Select all statements that are true about choosing between an enum-driven state and full State objects.",
    options: [
      "An enum with associated values is exhaustiveness-checked by the compiler",
      "State objects behind a shared protocol let you add a new state without editing existing switch statements",
      "Enums are the better fit when each state needs several methods and its own internal bookkeeping",
      "State objects are the classic Gang-of-Four form of the pattern",
    ],
    answers: [0, 1, 3],
    explanation:
      "Enums are compiler-checked and cheap for light per-state logic. When a state needs real behavior of its own, protocol-based State objects (the classic GoF form) scale better, since a new state is a new conforming type rather than a new switch case everywhere.",
  },
  {
    id: "state-context-mcq",
    type: "mcq",
    prompt: "In the protocol-based State pattern, what role does the 'context' object play?",
    options: [
      "It holds the current State object and forwards calls to it, letting that state decide what happens and what the next state is",
      "It stores every possible state simultaneously",
      "It is the shared protocol that all states conform to",
      "It converts the state enum into a String for logging",
    ],
    answer: 0,
    explanation:
      "The context is the stable, externally visible object. It delegates each call (like start() or pause()) to whichever state object is current, and that state object can replace itself with the next one.",
  },
  {
    id: "state-default-pitfall-senior",
    type: "mcq",
    prompt: "Why is adding a default: case to a state switch \"just in case\" considered a pitfall?",
    options: [
      "It silently swallows any new state you add later and forget to explicitly handle, defeating the compiler's exhaustiveness check",
      "Swift doesn't allow default: in a switch over an enum",
      "It makes the switch run slower at runtime",
      "It forces every case to return the same type",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The entire safety benefit of enum-driven state comes from exhaustive switches failing to compile when you add a case and forget a call site. A catch-all default: quietly absorbs the new case instead of surfacing the omission.",
  },
  {
    id: "state-flashcard",
    type: "flashcard",
    prompt:
      "Explain the State pattern: the problem it solves, the enum-driven approach, the full object-oriented form, and when to reach for each. Answer aloud, then reveal.",
    modelAnswer:
      "The **State pattern** solves the problem of an object's behavior changing based on its status, historically tracked with multiple independent Bool flags that allow contradictory combinations. The idiomatic Swift fix is an **enum with associated values**: only one case can be active at a time, and Swift's exhaustive switch forces every call site to handle every case, catching missing states at compile time. A **state machine** goes further and restricts which *transitions* between states are legal, typically enforced with guard checks inside methods like pause() or start(). When a state's behavior grows beyond a few lines — its own sub-methods, internal data, complex rules — the classic Gang-of-Four **State objects** form is the better fit: each state is its own type conforming to a shared protocol, and a 'context' object holds the current state and delegates to it, letting the state itself decide the next transition. Rule of thumb: enum for light, data-shaped state; protocol-based objects when each state carries real behavior of its own, since new states become new types instead of new switch cases scattered across the codebase.",
    keyPoints: [
      "Problem: independent Bool flags allow impossible combinations",
      "Enum with associated values + exhaustive switch = compiler-checked states",
      "State machine adds legal-transition guards, not just legal states",
      "State objects (GoF form): protocol-conforming types + context that delegates and swaps state",
      "Enum for light logic; objects when each state has substantial behavior",
    ],
    explanation:
      "A senior answer connects the enum-based Swift idiom back to the classic Gang-of-Four State pattern and can articulate exactly when to escalate from one to the other.",
  },
];

export default quiz;
