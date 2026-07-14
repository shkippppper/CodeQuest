import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sync-vs-async",
    type: "mcq",
    prompt: "What's the difference between `queue.sync { }` and `queue.async { }`?",
    options: [
      "`sync` blocks the caller until the work finishes; `async` returns immediately",
      "`sync` always runs on the main thread while `async` always runs on a background thread, regardless of which queue you submit to",
      "`sync` is always faster because it avoids the overhead of scheduling the closure on the queue's internal event loop before executing it",
      "They are identical in behavior — the distinction is purely syntactic sugar with no observable difference at runtime",
    ],
    answer: 0,
    explanation:
      "`async` enqueues the work and returns right away. `sync` enqueues and **blocks the calling thread** until the work completes. Neither says anything about *which* thread runs it — that's the queue's job.",
  },
  {
    id: "main-queue-ui",
    type: "mcq",
    prompt: "Where must UIKit/SwiftUI UI updates be performed?",
    options: [
      "On the main queue / main thread",
      "On any global queue, because all global queues are internally routed through the main run loop for UIKit compatibility",
      "On a `.background` QoS queue, because UIKit detects low-priority submissions and automatically forwards them to the main thread before execution",
      "On any serial queue you create, because serialized execution prevents data races and UIKit treats all serial queues as equivalent to the main queue",
    ],
    answer: 0,
    explanation:
      "UI work must run on the **main thread** (via `DispatchQueue.main`). The idiom is to do heavy work on a background queue, then hop back with `DispatchQueue.main.async` to touch the UI.",
  },
  {
    id: "serial-queue-fill",
    type: "fill",
    prompt: "A queue that runs one task at a time, in FIFO order, is a ___ queue.",
    answers: ["serial"],
    hint: "The opposite of concurrent.",
    explanation:
      "A **serial** queue runs tasks one after another. It's a simple way to protect shared mutable state — only one task touches it at a time.",
  },
  {
    id: "qos-choice",
    type: "mcq",
    prompt: "You're prefetching data the user hasn't asked for yet, invisibly in the background. Which QoS fits best?",
    options: [".background", ".userInteractive", ".userInitiated", ".default"],
    answer: 0,
    explanation:
      "Invisible, non-urgent maintenance work should use **`.background`** — the lowest priority, most energy-efficient level. Reserve `.userInteractive`/`.userInitiated` for work the user is actively waiting on.",
  },
  {
    id: "dispatch-group-predict",
    type: "predict",
    prompt: "When does `notify` run?",
    code: `let group = DispatchGroup()
group.enter()
group.enter()
downloadA { group.leave() }
downloadB { group.leave() }
group.notify(queue: .main) { print("done") }`,
    options: [
      "After both leave() calls have run",
      "Immediately, before the downloads finish",
      "After the first leave()",
      "Never — notify isn't supported",
    ],
    answer: 0,
    explanation:
      "`DispatchGroup` fires `notify` once the group's counter returns to zero — i.e. after **both** `leave()` calls balance the two `enter()`s. Unbalanced enter/leave means `notify` never fires.",
  },
  {
    id: "barrier-purpose",
    type: "mcq",
    prompt: "What does a `.barrier` task on a concurrent queue achieve?",
    options: [
      "It runs exclusively — waits for prior tasks, then blocks others while it runs (reader-writer lock)",
      "It cancels all currently enqueued tasks and replaces them with itself, ensuring only the most recent work item ever executes on that queue",
      "It raises the queue's QoS priority to userInteractive for the duration of the barrier block, then restores the original priority once the block completes",
      "It makes the queue behave as a serial queue permanently for all future submissions, even after the barrier block itself has finished executing",
    ],
    answer: 0,
    explanation:
      "A barrier waits for all earlier tasks to finish, runs alone, then lets later tasks resume — enabling many concurrent reads but exclusive writes: the classic **reader-writer lock**.",
  },
  {
    id: "gcd-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about GCD.",
    options: [
      "`DispatchQueue.main` is a serial queue running on the main thread",
      "`async` submits work without blocking the caller",
      "You should create and manage your own threads for each task",
      "Concurrent queues can run multiple submitted tasks at the same time",
    ],
    answers: [0, 1, 3],
    explanation:
      "Main is a serial queue on the main thread, `async` is non-blocking, and concurrent queues run tasks in parallel. You should **not** manage threads yourself — GCD owns a managed thread pool (option 3 is false).",
  },
  {
    id: "sync-current-serial-senior",
    type: "predict",
    prompt: "🧠 Trick question — what happens when this runs on the main thread?",
    code: `DispatchQueue.main.sync {
    print("hi")
}`,
    options: [
      "Deadlock — the thread blocks waiting for a queue it's already holding",
      "Prints \"hi\" normally, since the main queue detects the recursive sync call and executes the block inline rather than waiting",
      "Prints \"hi\" on a background thread, because sync automatically offloads to an available worker thread when the target queue is already occupied",
      "Compile error — the Swift compiler detects the recursive queue submission and flags it as a potential deadlock during static analysis",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`sync` blocks the current thread until the queue is free — but the current thread IS the main queue's thread, and it's now blocked, so the queue can never run the block. Instant **deadlock**. Calling `sync` on the serial queue you're already executing on always deadlocks.",
  },
  {
    id: "thread-explosion-senior",
    type: "mcq",
    prompt: "You dispatch hundreds of blocking tasks to `DispatchQueue.global()` at once. What's the danger?",
    options: [
      "Thread explosion — GCD spawns many threads, exhausting the limited pool and starving the app",
      "Nothing — GCD scales infinitely because it allocates threads on demand from the OS without any cap on the total thread count",
      "The tasks run serially one at a time, since DispatchQueue.global() automatically detects saturation and degrades to serial execution to prevent overload",
      "The main thread speeds up because GCD redistributes CPU resources away from the blocked background threads to prioritize the main run loop",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Each **blocked** thread ties up a pool thread; GCD keeps creating more to make progress, but the pool is small (dozens). Overshooting causes **thread explosion** — memory pressure, scheduling overhead, even deadlock. This is a key reason structured concurrency caps concurrent work at the core count.",
  },
  {
    id: "async-then-main-senior",
    type: "predict",
    prompt: "What is the order of prints?",
    code: `print("1")
DispatchQueue.global().async {
    print("2")
}
print("3")`,
    options: [
      "1, 3, then 2 (2 may interleave, but 1 and 3 print first)",
      "1, 2, 3 always — the global queue runs the closure immediately on a background thread before returning, so 2 prints before the main thread continues to 3",
      "2, 1, 3 — the async dispatch steals the CPU before the main thread can print 1, completing the background work first",
      "3, 2, 1 — async schedules the closure ahead of remaining synchronous work, so the background closure runs before the main thread prints 3",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`global().async` returns immediately, so `1` and `3` print synchronously first, and `2` runs later on a background thread. `2` could technically appear at any point after the dispatch, but never before `1`, and `3` won't wait for it.",
  },
  {
    id: "gcd-flashcard",
    type: "flashcard",
    prompt:
      "Explain sync vs async, why DispatchQueue.main.sync from main deadlocks, and when you'd use a barrier. Answer aloud, then reveal.",
    modelAnswer:
      "**`async`** enqueues work and returns immediately; **`sync`** enqueues and blocks the caller until it finishes — neither dictates which thread runs it, only whether the caller waits. Calling **`DispatchQueue.main.sync` from the main thread deadlocks**: `sync` blocks the current (main) thread waiting for the main queue to become free, but the main queue can't run the block because its thread is blocked — a circular wait. A **barrier** on a *concurrent* queue runs exclusively (waits for prior tasks, blocks new ones while it runs), giving a reader-writer lock: concurrent reads, exclusive writes. Also: UI must run on `.main`; pick the lowest QoS that fits for energy; use `DispatchGroup` (balanced enter/leave) for fan-out/fan-in; and avoid dispatching lots of blocking work (thread explosion).",
    keyPoints: [
      "async = non-blocking; sync = blocks caller",
      "main.sync from main = deadlock (circular wait)",
      "barrier on concurrent queue = reader-writer lock",
      "UI on .main; choose lowest QoS that fits",
      "DispatchGroup enter/leave must balance; beware thread explosion",
    ],
    explanation:
      "The senior signal is explaining the deadlock as a circular wait and knowing the barrier reader-writer pattern plus thread-explosion, not just reciting sync/async definitions.",
  },
];

export default quiz;
