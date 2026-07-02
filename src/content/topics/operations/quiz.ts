import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "op-vs-gcd",
    type: "mcq",
    prompt: "What do Operations add over raw GCD?",
    options: [
      "Cancellation, dependencies, priorities, and reusable/observable work objects",
      "Faster execution",
      "Access to more threads",
      "Nothing — they're the same API",
    ],
    answer: 0,
    explanation:
      "Operations are an object-oriented layer built on GCD. The value is **management**: you can cancel work, declare dependencies between units, set priorities, and subclass/observe them. GCD blocks are lightweight but fire-and-forget.",
  },
  {
    id: "dependency-order",
    type: "mcq",
    prompt: "After `decode.addDependency(download)`, when does `decode` start?",
    options: [
      "Only after `download` has finished",
      "Immediately, in parallel with `download`",
      "Before `download`",
      "Never — dependencies block execution",
    ],
    answer: 0,
    explanation:
      "An operation won't begin until **all** its dependencies finish. `addDependency` is how you order work (download → decode) without nesting completion handlers.",
  },
  {
    id: "serial-operationqueue",
    type: "fill",
    prompt: "Set an OperationQueue's `maxConcurrentOperationCount` to ___ to make it run operations serially, one at a time.",
    answers: ["1"],
    hint: "A single number.",
    explanation:
      "`maxConcurrentOperationCount = 1` forces serial execution. The default lets the queue run several operations concurrently.",
  },
  {
    id: "cancellation-cooperative",
    type: "mcq",
    prompt: "What does calling `operation.cancel()` on a running operation actually do?",
    options: [
      "Sets `isCancelled = true` — the operation must check the flag and stop itself",
      "Immediately kills the operation's thread",
      "Rolls back any work already done",
      "Throws an error into the operation",
    ],
    answer: 0,
    explanation:
      "Cancellation is **cooperative**: `cancel()` only sets `isCancelled`. A running operation keeps going until *it* checks the flag and returns early. A not-yet-started operation simply won't run.",
  },
  {
    id: "blockoperation-predict",
    type: "predict",
    prompt: "Does `op2` run?",
    code: `let queue = OperationQueue()
let op1 = BlockOperation { print("1") }
let op2 = BlockOperation { print("2") }
op2.addDependency(op1)
op1.cancel()
queue.addOperations([op1, op2], waitUntilFinished: false)`,
    options: [
      "Yes — a dependency finishing (even by cancellation) unblocks op2",
      "No — cancelling op1 permanently blocks op2",
      "Only if op1 runs first",
      "Neither runs",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A cancelled operation still transitions to *finished* (it just doesn't do its work). Dependencies are satisfied when the dependency **finishes** — cancelled or not — so `op2` becomes ready and prints `2`. Cancelling a dependency does NOT automatically cancel its dependents.",
  },
  {
    id: "operations-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about Operations.",
    options: [
      "`OperationQueue` is built on top of GCD",
      "Operations can declare dependencies on other operations",
      "`cancel()` guarantees a running operation stops instantly",
      "`OperationQueue.main` runs operations on the main thread",
    ],
    answers: [0, 1, 3],
    explanation:
      "OperationQueue sits on GCD, supports dependencies, and has a `.main` queue. But `cancel()` is cooperative — it can't force a running operation to stop instantly (option 3 is false).",
  },
  {
    id: "async-operation-senior",
    type: "mcq",
    prompt: "To wrap an asynchronous API (a network call with a completion handler) in an `Operation`, what must you do?",
    options: [
      "Subclass Operation, set `isAsynchronous = true`, and drive KVO `isExecuting`/`isFinished`, finishing only in the async callback",
      "Use a BlockOperation — its closure waits for the callback automatically",
      "Nothing special — all operations are async",
      "Call `queue.waitUntilAllOperationsAreFinished()`",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A `BlockOperation` finishes when its closure returns, so a fire-and-forget async call inside it would be marked finished too early. For true async work you subclass `Operation`, override `isAsynchronous` to `true`, and manually manage the KVO-compliant `isExecuting`/`isFinished` state, flipping `isFinished` only when the async work actually completes.",
  },
  {
    id: "dependency-cycle-senior",
    type: "predict",
    prompt: "🧠 Trick question — what happens if `a.addDependency(b)` and `b.addDependency(a)`?",
    code: `let a = BlockOperation { print("a") }
let b = BlockOperation { print("b") }
a.addDependency(b)
b.addDependency(a)
queue.addOperations([a, b], waitUntilFinished: false)`,
    options: [
      "Neither runs — a dependency cycle deadlocks the graph",
      "They run in the order added",
      "It throws an exception when adding the second dependency",
      "GCD detects and breaks the cycle automatically",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Each operation waits for the other to finish first, so **neither can ever start** — a classic dependency-cycle deadlock. The framework does not detect it for you; avoiding cycles is on you when building the graph.",
  },
  {
    id: "operations-vs-structured-senior",
    type: "mcq",
    prompt: "For brand-new async code needing ordered, cancellable work, why might you prefer structured concurrency over Operations?",
    options: [
      "`async let` / `TaskGroup` express dependencies and automatic cancellation with far less boilerplate than async Operation subclasses",
      "Operations can't run on background threads",
      "Structured concurrency is the only way to cancel work",
      "Operations were removed in recent iOS versions",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The async `Operation` subclass (manual KVO state) is verbose. Structured concurrency gives you ordering (`async let`, awaiting), fan-out (`TaskGroup`), and **automatic cooperative cancellation** that propagates down the task tree — much less boilerplate. Operations remain great in existing UIKit code and when you need their specific object model.",
  },
  {
    id: "operations-flashcard",
    type: "flashcard",
    prompt:
      "When would you choose Operations over GCD, and what are their standout features and gotchas? Answer aloud, then reveal.",
    modelAnswer:
      "Choose **Operations** when you need to *manage* work, not just run it: they add **dependencies** (`addDependency` — run B after A without nested callbacks), **cancellation** (`cancel()` / `cancelAllOperations`), **priorities/QoS**, and reusable, testable, observable work objects (subclasses). They're built on GCD, so `OperationQueue` still uses a managed thread pool; `maxConcurrentOperationCount = 1` makes a queue serial. Gotchas: **cancellation is cooperative** — `cancel()` only sets `isCancelled`, running work must check it; a **dependency cycle deadlocks**; and wrapping an async API requires an `isAsynchronous` subclass driving KVO `isExecuting`/`isFinished`. For new code, structured concurrency often expresses the same ordering + cancellation with far less boilerplate.",
    keyPoints: [
      "Operations = management layer on GCD: dependencies, cancellation, priorities, reuse",
      "addDependency orders work without callback nesting",
      "Cancellation is cooperative (check isCancelled)",
      "Async work needs an isAsynchronous subclass + KVO state",
      "Dependency cycles deadlock; structured concurrency is lighter for new code",
    ],
    explanation:
      "Strong answers name dependencies as the killer feature, stress cooperative cancellation, and know the async-operation KVO boilerplate — then contrast with structured concurrency.",
  },
];

export default quiz;
