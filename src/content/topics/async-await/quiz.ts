import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "await-meaning",
    type: "mcq",
    prompt: "What does reaching an `await` actually do to the current thread?",
    options: [
      "It blocks the calling thread until the result is ready, preventing it from handling any other work",
      "It marks a possible suspension point; the thread is released to do other work while suspended",
      "It spawns a new background thread that runs the remainder of the function after the awaited value resolves",
      "It busy-waits by spinning in a tight loop on the calling thread until the awaited value becomes available",
    ],
    answer: 1,
    explanation:
      "`await` is a *suspension point*, not a blocking call. If the function suspends, it occupies no thread — the thread is freed for other work and the function resumes (possibly on a different thread) once the awaited work completes.",
  },
  {
    id: "sequential-time",
    type: "predict",
    prompt:
      "Each `fetch` takes ~1 second. Roughly how long does this take in total, and why?",
    code: `let a = await fetch(1)
let b = await fetch(2)`,
    options: [
      "~1 second — both fetches overlap because Swift automatically parallelizes sequential awaits on the same thread",
      "~2 seconds — each await waits for the previous to finish",
      "Instant — await is syntactic sugar that doesn't introduce any actual delay or suspension",
      "It depends on the number of CPU cores available, since more cores allow the awaits to overlap at the OS level",
    ],
    answer: 1,
    explanation:
      "Plain `await` statements run sequentially: the second `fetch` doesn't start until the first resumes. Total ≈ 1 + 1 = 2s. To run them concurrently you'd use `async let`.",
  },
  {
    id: "async-let-keyword",
    type: "fill",
    prompt:
      "Complete the keyword: to start two independent async operations concurrently and await them later, you write `___ let first = fetch(1)`.",
    answers: ["async"],
    hint: "It's the same word you use to mark a suspending function.",
    explanation:
      "`async let` creates a child task that begins running immediately. You only suspend when you read its value with `await`, so two `async let` bindings run in parallel — total time ≈ max of the two, not the sum.",
  },
  {
    id: "parallel-fix",
    type: "predict",
    prompt: "With each fetch ~1s, about how long does THIS version take?",
    code: `async let a = fetch(1)
async let b = fetch(2)
let results = await [a, b]`,
    options: ["~2 seconds", "~1 second", "~4 seconds", "It deadlocks"],
    answer: 1,
    explanation:
      "Both `async let` child tasks start immediately and run concurrently. By the time you `await [a, b]` they're already in flight, so total time ≈ max(1s, 1s) ≈ 1 second.",
  },
  {
    id: "structured-vs-unstructured",
    type: "mcq",
    prompt: "Which is true about a standalone `Task { ... }` compared to `async let`?",
    options: [
      "It is structured — its lifetime is bound to the enclosing scope, and cancelling the parent cancels it automatically",
      "It is unstructured — it is not tied to the surrounding scope, and you manage its lifetime",
      "It cannot perform async work; Task is only used to bridge synchronous code that needs to call an async function once",
      "It always runs on an anonymous background thread and can never be assigned to the main actor for UI updates",
    ],
    answer: 1,
    explanation:
      "`async let` and task groups are *structured*: child tasks can't outlive their scope and cancellation propagates automatically. A bare `Task { }` is *unstructured* — it runs independently and you're responsible for awaiting or cancelling it via its handle.",
  },
  {
    id: "cancellation-model",
    type: "mcq",
    prompt: "How does task cancellation work in Swift concurrency?",
    options: [
      "It immediately kills the task, forcibly unwinds the whole call stack, and runs any defer blocks before returning control to the caller",
      "It is cooperative: a flag is set and your code must check it (e.g. `Task.checkCancellation()`) and stop voluntarily",
      "It pauses the task at the current suspension point so it can be resumed later when conditions allow",
      "Only the main actor is permitted to cancel tasks; calling cancel from a background context has no effect",
    ],
    answer: 1,
    explanation:
      "Cancellation is *cooperative*. Calling `.cancel()` sets `isCancelled`; nothing stops automatically. Code should call `Task.checkCancellation()` (which throws `CancellationError`) or read `Task.isCancelled`. Many stdlib APIs like `URLSession` check this for you.",
  },
  {
    id: "mainactor-fill",
    type: "fill",
    prompt:
      "Which attribute do you put on a function or type to guarantee its code runs on the main thread? Include the `@`.",
    answers: ["@MainActor", "MainActor"],
    hint: "It's a global actor used for all UI work.",
    explanation:
      "`@MainActor` guarantees the annotated code runs on the main thread — the modern replacement for `DispatchQueue.main.async` when updating UI. You can also hop inline with `await MainActor.run { }`.",
  },
  {
    id: "explain-structured-flashcard",
    type: "flashcard",
    prompt:
      "Explain 'structured concurrency' and why it's safer than spawning raw threads. Answer aloud, then reveal.",
    modelAnswer:
      "**Structured concurrency** ties the lifetime of child tasks to a well-defined scope. With `async let` or a `TaskGroup`, the parent cannot return until all its children have finished, and cancelling the parent automatically cancels the children. Tasks form a tree that mirrors your code's structure, so no task accidentally outlives the work that created it. This eliminates leaked threads, orphaned work, and the manual bookkeeping that plagued GCD/`Thread` code.",
    keyPoints: [
      "Child tasks are bound to a lexical scope",
      "Parent awaits all children before returning",
      "Cancellation propagates parent → children automatically",
      "Contrast with unstructured `Task { }` and raw GCD",
      "Prevents leaked / orphaned background work",
    ],
    explanation:
      "A senior-level answer stresses *lifetime guarantees* and *automatic cancellation propagation*, and contrasts them with the manual lifetime management of GCD or `Thread`.",
  },
];

export default quiz;
