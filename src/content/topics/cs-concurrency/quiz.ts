import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "concurrency-race-condition",
    type: "mcq",
    prompt: "What is a race condition?",
    options: [
      "The final result of concurrent code depends on unpredictable thread timing instead of program logic",
      "A crash caused by calling an unavailable API",
      "A compiler error from writing to a `let` constant",
      "A deliberate performance benchmark between two algorithms",
    ],
    answer: 0,
    explanation:
      "A race condition happens when two or more threads access shared state and the outcome depends on the order the scheduler happens to run them in, so the same code can produce a different result each run.",
  },
  {
    id: "concurrency-atomic-predict",
    type: "predict",
    prompt: "Two threads both run `counter += 1` on a shared, unprotected `Int` starting at 0, at roughly the same time. What is `counter` afterward?",
    code: `var counter = 0\n\n// Thread A: counter += 1\n// Thread B: counter += 1 (same instant)`,
    options: [
      "It could be 1 or 2 — the read-modify-write isn't atomic, so an update can be lost",
      "Always 2 — Swift guarantees atomic Int updates",
      "Always 1 — the second write is blocked automatically",
      "A crash — Swift traps on concurrent writes",
    ],
    answer: 0,
    explanation:
      "`+= 1` is really read, then add, then write. If both threads read 0 before either writes, both write 1 and one increment is lost — the result can land at 1 instead of the expected 2.",
  },
  {
    id: "concurrency-critical-section-fill",
    type: "fill",
    prompt: "The stretch of code between `lock()` and `unlock()` where shared state is touched is called the ___ section.",
    answers: ["critical"],
    hint: "Two words: '___ section'. The blank is an adjective meaning essential/sensitive.",
    explanation:
      "The critical section is the region of code that must run with exclusive access to shared state — it's exactly the part a mutex is protecting.",
  },
  {
    id: "concurrency-mutex-vs-semaphore",
    type: "mcq",
    prompt: "What's the key structural difference between a mutex and a semaphore?",
    options: [
      "A mutex admits exactly one thread and is typically owner-locked; a semaphore is a counter that can admit N threads and has no owner",
      "A semaphore always admits exactly one thread; a mutex can admit N",
      "They are identical — 'semaphore' is just another name for a mutex",
      "A mutex works across processes; a semaphore only works within one thread",
    ],
    answer: 0,
    explanation:
      "A mutex is a lock for exactly one thread at a time, usually unlocked by the same thread that locked it. A semaphore is a general counter — any thread can call `wait()`/`signal()`, and it can allow more than one thread through. A mutex is essentially a semaphore fixed at count 1.",
  },
  {
    id: "concurrency-defer-unlock",
    type: "fill",
    prompt: "In Swift, `lock.lock()` should almost always be paired with `___ { lock.unlock() }` so the unlock still runs on an early return or thrown error.",
    answers: ["defer"],
    hint: "A Swift keyword that schedules code to run when the current scope exits.",
    explanation:
      "`defer` runs its block no matter how the scope exits — normal return, early return, or a thrown error — which guarantees `unlock()` always fires and the lock never gets stuck held forever.",
  },
  {
    id: "concurrency-failure-modes-multi",
    type: "multi",
    prompt: "Select all statements that correctly describe deadlock, livelock, or starvation.",
    options: [
      "Deadlock: two or more threads are frozen, each waiting on a resource the other holds",
      "Livelock: threads keep running and changing state but never make real progress",
      "Starvation always means the CPU is at 0% usage",
      "Starvation: a thread is technically able to proceed but is perpetually out-scheduled by others",
    ],
    answers: [0, 1, 3],
    explanation:
      "Deadlock is a frozen circular wait, livelock is busy-but-stuck (e.g. synchronized retries), and starvation is a thread that keeps losing the scheduling race. Option 2 is false — a starved thread's CPU can be perfectly busy running other threads; the starved thread just never gets its turn.",
  },
  {
    id: "concurrency-deadlock-fix-senior",
    type: "mcq",
    prompt: "Two functions each lock two shared locks in a different order, causing an occasional deadlock. What's the standard fix?",
    options: [
      "Always acquire the locks in the same global order everywhere they're used together",
      "Add a `sleep()` before every `lock()` call",
      "Switch from `NSLock` to `DispatchSemaphore` — semaphores can't deadlock",
      "Retry the whole operation on a background thread until it succeeds",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Deadlock from multiple locks requires a circular wait. Enforcing one consistent lock-acquisition order everywhere (e.g. always by ascending account ID) removes the possibility of a cycle, which removes the possibility of this kind of deadlock. Semaphores can deadlock just as easily as mutexes if used the same way.",
  },
  {
    id: "concurrency-producer-consumer-senior",
    type: "predict",
    prompt: "In the classic producer-consumer solution, a bounded buffer uses `emptySlots`, `filledSlots`, and `mutex`. A consumer calls `consume()` while the buffer is empty. What happens?",
    code: `func consume() -> Int {\n    filledSlots.wait()\n    mutex.wait()\n    let item = buffer.removeFirst()\n    mutex.signal()\n    emptySlots.signal()\n    return item\n}`,
    options: [
      "It blocks on `filledSlots.wait()` until a producer calls `filledSlots.signal()`",
      "It crashes calling `removeFirst()` on an empty array",
      "It spins in a busy-wait loop burning CPU",
      "It blocks on `mutex.wait()` forever because the buffer is empty",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`filledSlots` starts at 0 and only rises when a producer adds an item and calls `signal()`. A consumer arriving to an empty buffer blocks on `filledSlots.wait()` before it ever touches `mutex` or `buffer`, so there's no crash and no busy-waiting — it sleeps efficiently until woken.",
  },
  {
    id: "concurrency-flashcard",
    type: "flashcard",
    prompt:
      "Explain, from memory: what a mutex and a semaphore are, what atomicity means, the three classic failure modes, and how the producer-consumer problem is solved. Answer aloud, then reveal.",
    modelAnswer:
      "A **mutex** lets exactly one thread into a **critical section** at a time via `lock()`/`unlock()`, and is normally released by the same thread that acquired it. A **semaphore** is a more general counter decremented by `wait()` and incremented by `signal()`; it can admit N threads at once and has no single owner — a mutex is just a semaphore fixed at count 1. An operation is **atomic** if it's guaranteed to run as one indivisible step that no other thread can observe half-finished; a plain `counter += 1` on shared memory is NOT atomic (it's read-modify-write) unless protected by a lock, semaphore, or actor. The three classic failure modes: **deadlock** — threads frozen forever, each holding a resource another needs, fixed by acquiring locks in a consistent global order; **livelock** — threads stay busy and keep changing state but never progress, usually from synchronized retry/backoff, fixed with randomized backoff; **starvation** — a thread could proceed but is perpetually out-scheduled by others, fixed with fairness (FIFO) scheduling. The **producer-consumer** problem uses two counting semaphores (`emptySlots`, `filledSlots`) to gate capacity and readiness, plus one mutex to protect the few lines that actually touch the shared buffer — keeping 'wait for a slot' and 'touch the buffer' as separate steps avoids deadlocking the pattern itself.",
    keyPoints: [
      "Mutex = 1 owner-locked thread; semaphore = counter, N threads, no owner",
      "Atomic = indivisible step; plain read-modify-write on shared memory is not atomic",
      "Deadlock (frozen, circular wait) vs livelock (busy, no progress) vs starvation (perpetually out-scheduled)",
      "Fixes: lock ordering for deadlock, randomized backoff for livelock, fairness/FIFO for starvation",
      "Producer-consumer: emptySlots + filledSlots gate capacity/readiness, mutex protects the buffer access itself",
    ],
    explanation:
      "A senior-level answer keeps the three synchronization jobs distinct — capacity, readiness signaling, and mutual exclusion — rather than reaching for one lock to do everything, and can name the standard fix for each of the three failure modes.",
  },
];

export default quiz;
