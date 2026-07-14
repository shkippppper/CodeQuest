import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "actor-isolation",
    type: "mcq",
    prompt: "How does an `actor` prevent data races on its mutable state?",
    options: [
      "It serializes access — only one task runs actor-isolated code at a time, enforced by the compiler",
      "It copies its state for every caller, so each task works on its own snapshot instead of the original",
      "It makes all stored properties constants, preventing mutation after initialization entirely",
      "It runs everything on the main thread, sequencing all tasks through the main run loop",
    ],
    answer: 0,
    explanation:
      "An actor **isolates** its mutable state: its executor guarantees one task at a time touches it, and the compiler forbids unsynchronized access. That replaces manual locks with a type-level guarantee.",
  },
  {
    id: "actor-await",
    type: "predict",
    prompt: "Does this compile?",
    code: `actor Counter { var value = 0 }
let c = Counter()
print(c.value)`,
    options: [
      "No — you can't read actor-isolated state synchronously from outside; needs await via a method",
      "Yes — prints 0, because reading a stored property on an actor requires no special treatment",
      "Yes — but prints nil, because actor properties default to nil before the first await completes",
      "No — actors can't have stored properties, only computed ones accessed through methods",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`value` is actor-isolated, so it can't be read synchronously from outside the actor. You access it through an `await`ed method (or an isolated computed property). Cross-actor access is always potentially suspending, hence `await`.",
  },
  {
    id: "actor-await-fill",
    type: "fill",
    prompt: "Calling an actor's isolated method from outside the actor requires the ___ keyword before the call.",
    answers: ["await"],
    hint: "The same keyword used for async calls.",
    explanation:
      "`await` marks the potential suspension while you wait your turn to enter the actor. It's the visible boundary between your code and the actor's serialized world.",
  },
  {
    id: "nonisolated-purpose",
    type: "mcq",
    prompt: "What is `nonisolated` used for on an actor member?",
    options: [
      "To allow synchronous access to a member that doesn't touch mutable isolated state (and to satisfy sync protocols)",
      "To deliberately opt out of the actor's thread-safety guarantees so that multiple callers are free to race on the member's mutable data",
      "To run the member on a fixed background dispatch queue instead of the actor's own executor",
      "To expose all the actor's mutable state publicly without requiring callers to use await",
    ],
    answer: 0,
    explanation:
      "A `nonisolated` member promises it doesn't access mutable isolated state, so it can be called synchronously without `await`. It's also how an actor conforms to synchronous protocols like `CustomStringConvertible`.",
  },
  {
    id: "global-actor-mainactor",
    type: "mcq",
    prompt: "What is `@MainActor`?",
    options: [
      "A built-in global actor that pins annotated work to the main thread",
      "A property wrapper for thread-local storage that automatically restores values after each task switch",
      "A compiler macro that disables Swift concurrency checking for a specific type or function",
      "A serial DispatchQueue you must create yourself and manually switch onto for UI work",
    ],
    answer: 0,
    explanation:
      "`@MainActor` is the standard **global actor**: anything annotated with it runs on the main thread's serialized context — the modern, type-checked way to guarantee UI code runs on main.",
  },
  {
    id: "actors-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about actors.",
    options: [
      "Cross-actor access to isolated state requires `await`",
      "Only one task executes an actor's isolated code at a time",
      "Actors are value types, copied on assignment",
      "A global actor applies one shared isolation domain across many declarations",
    ],
    answers: [0, 1, 3],
    explanation:
      "Actors serialize access (needing `await` from outside) and global actors span declarations. But actors are **reference types** (like classes), not value types — option 3 is false.",
  },
  {
    id: "reentrancy-senior",
    type: "predict",
    prompt: "🧠 Trick question — why is this `withdraw` still unsafe despite being on an actor?",
    code: `actor Bank {
    var balance = 100
    func withdraw(_ n: Int) async {
        guard balance >= n else { return }
        await audit()          // suspension point
        balance -= n
    }
}`,
    options: [
      "Actor reentrancy — during `await audit()`, another withdraw can run, so the guarded balance may be stale after resuming",
      "It's fully safe — actors serialize absolutely everything, including across every suspension point, so the balance guard always still holds",
      "`guard` doesn't work inside actor methods because actors require a different assertion mechanism",
      "`balance -= n` still needs an explicit lock because actors don't protect individual arithmetic operations",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Actors are **reentrant**: at `await audit()` the actor suspends and can run *other* tasks, including a second `withdraw`. Both may pass the `guard` before either subtracts, overdrawing the account. The invariant checked before the `await` is no longer guaranteed after it — re-check after suspension, or don't await between the check and the mutation.",
  },
  {
    id: "actor-reference-type-senior",
    type: "mcq",
    prompt: "Are actors value types or reference types?",
    options: [
      "Reference types — like classes, but with isolation and no inheritance",
      "Value types — like structs, so each assignment gives an independent copy of the actor's state",
      "Neither — they exist purely at compile time with no runtime representation or heap allocation",
      "It depends on whether they're global actors, which use value semantics, or regular actors, which don't",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Actors are **reference types** (heap-allocated, shared by reference), similar to classes. They add compiler-enforced isolation and are implicitly `Sendable`, but they do not support inheritance (there are no actor subclasses, except the special `@MainActor` global actor semantics).",
  },
  {
    id: "actor-hop-cost-senior",
    type: "mcq",
    prompt: "What is an 'actor hop', and why can too many hurt performance?",
    options: [
      "Switching execution onto an actor's executor at each await — many fine-grained cross-actor calls add scheduling overhead and suspensions",
      "A hop is what happens when an actor crashes at runtime and the system transfers control all the way up to the nearest matching error handler in the calling task",
      "It's the time the runtime spends allocating and initializing a new actor instance on the heap",
      "Hops offload isolated computations to the GPU's command queue for parallel numeric processing",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Each cross-actor `await` may require hopping onto the actor's executor (and back). A chatty design with many tiny isolated calls incurs repeated suspensions/hops. Batching work into fewer, coarser actor calls reduces this overhead — a real senior-level tuning concern.",
  },
  {
    id: "actors-flashcard",
    type: "flashcard",
    prompt:
      "How do actors stop data races, and what is reentrancy? Answer aloud, then reveal.",
    modelAnswer:
      "An **actor** isolates its mutable state so only **one task at a time** executes its isolated code (serialized by the actor's executor), and the compiler enforces it — cross-actor access requires `await`, replacing manual locks with a type-level guarantee. Actors are **reference types**, implicitly `Sendable`. Key subtlety: actors are **reentrant** — at every `await` (suspension point) the actor is free to run other tasks, so any invariant you checked *before* an `await` may be **stale after it** (e.g. two withdrawals both passing a balance guard before either subtracts). Fix by re-checking after suspension or not suspending between check and mutation. `nonisolated` members skip isolation for state they don't touch (and to satisfy sync protocols); **global actors** like `@MainActor` apply one shared isolation domain across many declarations.",
    keyPoints: [
      "Isolation: one task at a time on isolated state, compiler-enforced",
      "Cross-actor access needs await; actors are reference types & Sendable",
      "Reentrancy: state can change across an await — re-check invariants",
      "nonisolated for non-isolated members / sync protocol conformance",
      "Global actors (@MainActor) apply shared isolation across declarations",
    ],
    explanation:
      "The senior differentiator is reentrancy — most candidates know 'actors serialize state' but miss that awaiting inside an actor method lets other tasks mutate it.",
  },
];

export default quiz;
