import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "await-meaning",
    type: "mcq",
    prompt: "What does reaching an `await` actually do to the current thread?",
    options: [
      "It blocks the thread until the result is ready",
      "It marks a possible suspension point; the thread is released to do other work while suspended",
      "It spawns a new background thread for the rest of the function",
      "It busy-waits in a loop until the value arrives",
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
      "~1 second — they run in parallel",
      "~2 seconds — each await waits for the previous to finish",
      "Instant — await doesn't actually wait",
      "It depends on the number of CPU cores",
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
      "It is structured — its lifetime is bound to the enclosing scope",
      "It is unstructured — it is not tied to the surrounding scope, and you manage its lifetime",
      "It cannot perform async work",
      "It always runs on a background thread, never the main actor",
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
      "It immediately kills the task and unwinds the stack",
      "It is cooperative: a flag is set and your code must check it (e.g. `Task.checkCancellation()`) and stop voluntarily",
      "It pauses the task so it can be resumed later",
      "Only the main actor can cancel tasks",
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
