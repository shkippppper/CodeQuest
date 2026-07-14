import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "race-definition",
    type: "mcq",
    prompt: "What defines a race condition?",
    options: [
      "The result depends on the unpredictable timing of concurrent operations on shared state",
      "Code that runs too slowly because the thread scheduler starves it of CPU time while other tasks dominate",
      "Two functions sharing the same name causing ambiguity that the linker resolves unpredictably at build time",
      "A loop that never exits its condition and therefore blocks the thread it runs on indefinitely",
    ],
    answer: 0,
    explanation:
      "A race condition means the outcome depends on how concurrent operations interleave — classically a non-atomic read-modify-write on shared mutable state, where updates can be lost.",
  },
  {
    id: "race-fix",
    type: "mcq",
    prompt: "What's the most modern, compiler-checked way to protect shared mutable state from races in Swift?",
    options: [
      "Isolate it inside an actor",
      "Add more threads",
      "Use a global variable",
      "Wrap every access in try/catch",
    ],
    answer: 0,
    explanation:
      "An **actor** serializes access to its state and the compiler enforces it — no manual locks to forget. Even better when possible: don't share at all (value types / task-local state).",
  },
  {
    id: "deadlock-fill",
    type: "fill",
    prompt: "A circular wait where each party holds a resource the other needs — so nobody proceeds — is called a ___.",
    answers: ["deadlock"],
    hint: "8 letters — the queues are 'dead'.",
    explanation:
      "A deadlock is a circular wait. Avoid it with consistent lock ordering, preferring `async` over `sync`, and letting actors serialize state.",
  },
  {
    id: "thread-explosion-cause",
    type: "mcq",
    prompt: "What causes 'thread explosion' in GCD?",
    options: [
      "Dispatching many blocking tasks at once, exhausting the limited thread pool",
      "Using too few queues, so all tasks serialise behind one another and never run in parallel at all",
      "Calling async dispatch instead of sync, causing the caller to return before the work item finishes",
      "Creating a serial queue and submitting only non-blocking work items that do not hold the thread",
    ],
    answer: 0,
    explanation:
      "Each blocked thread ties up a pool thread; GCD spawns more to progress until the pool is exhausted — memory pressure, thrash, even deadlock. Structured concurrency avoids it by suspending (not blocking) at `await` on a capped pool.",
  },
  {
    id: "tsan-tool",
    type: "mcq",
    prompt: "Which tool detects data races at runtime by tracking cross-thread memory accesses?",
    options: ["Thread Sanitizer (TSan)", "SwiftLint", "The Simulator", "Instruments' Energy gauge"],
    answer: 0,
    explanation:
      "**Thread Sanitizer** is a build setting that instruments memory accesses and reports the exact conflicting reads/writes when a race occurs. Exercise the app with it on to surface races.",
  },
  {
    id: "pitfalls-truths-multi",
    type: "multi",
    prompt: "Select **all** effective ways to prevent concurrency bugs.",
    options: [
      "Prefer value types and task-local state so there's nothing shared to race",
      "Isolate shared mutable state in an actor",
      "Acquire multiple locks in a consistent global order",
      "Dispatch every task with blocking `sync` calls",
    ],
    answers: [0, 1, 2],
    explanation:
      "Not sharing, actor isolation, and consistent lock ordering all prevent bugs. Blocking `sync` everywhere invites deadlocks and thread explosion (option 3 is harmful).",
  },
  {
    id: "priority-inversion-senior",
    type: "mcq",
    prompt: "A `.userInteractive` task is stuck waiting on a resource held by a `.background` task. What is this, and what does the system do?",
    options: [
      "Priority inversion — the runtime applies priority escalation, boosting the low-priority holder",
      "Thread explosion — GCD spawns additional threads to keep the high-priority task running, eventually exhausting the thread pool",
      "A permanent deadlock that the Swift runtime cannot detect or recover from without intervention from the operating system kernel",
      "A memory leak caused by the high-priority task's closure retaining the low-priority task's context strongly",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The high-priority task effectively runs at low priority — **priority inversion**. GCD's QoS and Swift concurrency both mitigate it with **priority escalation**, temporarily raising the blocking task's priority. Avoid blocking across large priority gaps in the first place.",
  },
  {
    id: "atomic-not-enough-senior",
    type: "predict",
    prompt: "🧠 Trick question — each `balance` access is individually thread-safe (atomic). Is `transfer` race-free?",
    code: `// balance reads/writes are atomic
func transfer(_ n: Int) {
    if balance >= n {      // atomic read
        balance -= n       // atomic write
    }
}`,
    options: [
      "No — atomicity of each access doesn't make the check-then-act sequence atomic; two transfers can both pass the check",
      "Yes — individually atomic accesses on every read and write make the entire function fully race-free regardless of call order",
      "Yes — Swift's if statement implicitly acquires a lock on any atomic variable it reads, making the block execute as a single transaction",
      "No — because Int isn't Sendable across actor boundaries, so the compiler rejects any concurrent access to an Int property at all",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "This is a **check-then-act** race. Even if each read and write is atomic, two threads can both read `balance >= n` as true before either subtracts, overdrawing the account. Atomicity of individual operations does not make a *compound* operation atomic — you need to serialize the whole transaction (an actor, a lock around both steps).",
  },
  {
    id: "structured-caps-senior",
    type: "mcq",
    prompt: "Why is structured concurrency less prone to thread explosion than raw GCD?",
    options: [
      "Its cooperative thread pool is capped (~one thread per core) and tasks suspend at await instead of blocking a thread",
      "It never uses threads at all — all concurrency in Swift's structured model is simulated via run-loop callbacks on a single thread",
      "It creates a new OS thread for every task just like GCD does, but uses a faster scheduling algorithm to reduce context-switching overhead",
      "It runs all async work on the main actor by default, serialising everything and eliminating any possibility of a race condition",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Swift concurrency uses a **cooperative pool** sized to the core count; at each `await` a task **suspends** and frees its thread rather than blocking it. So thousands of tasks multiplex over a handful of threads — no explosion, provided you await (not block) on I/O.",
  },
  {
    id: "pitfalls-flashcard",
    type: "flashcard",
    prompt:
      "Catalog the main concurrency pitfalls and how you'd prevent and diagnose them. Answer aloud, then reveal.",
    modelAnswer:
      "**Race condition** — outcome depends on timing of concurrent access to shared mutable state (lost updates, corruption); prevent by not sharing (value/task-local state), isolating in an **actor**, or serializing/locking. Watch for **check-then-act** races where individually atomic ops still compose non-atomically. **Deadlock** — circular wait (the `DispatchQueue.main.sync`-on-main classic; lock-ordering cycles); prevent with consistent lock order, preferring `async`, and actors. **Priority inversion** — high-priority task waits on a low-priority one; the runtime applies **priority escalation**, and you keep QoS sane. **Thread explosion** — many blocking dispatches exhaust GCD's pool; structured concurrency avoids it via a capped cooperative pool that suspends at `await`. Diagnose with **Thread Sanitizer** (races), the **Main Thread Checker** (off-main UI), and lean on **compile-time** checks (`Sendable`, actor isolation, Swift 6) to make whole classes impossible.",
    keyPoints: [
      "Race (incl. check-then-act) → don't share / actor / serialize",
      "Deadlock → consistent lock order, avoid sync, use actors",
      "Priority inversion → priority escalation + sane QoS",
      "Thread explosion → structured concurrency's capped cooperative pool",
      "Diagnose: Thread Sanitizer, Main Thread Checker; prevent via Sendable/actors",
    ],
    explanation:
      "The senior signal is the check-then-act insight (atomic parts ≠ atomic whole), knowing priority escalation and thread explosion, and citing TSan plus compile-time prevention.",
  },
];

export default quiz;
