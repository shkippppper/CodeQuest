import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "why-main-thread",
    type: "mcq",
    prompt: "Why must UIKit/SwiftUI updates happen on the main thread?",
    options: [
      "The UI frameworks are single-threaded by design and not thread-safe",
      "The main thread is faster",
      "Background threads can't allocate memory",
      "Only the main thread has network access",
    ],
    answer: 0,
    explanation:
      "UIKit/SwiftUI were designed single-threaded to avoid locking every UI property. Touching UI off-main is undefined behavior — flicker, corruption, or intermittent crashes.",
  },
  {
    id: "mainactor-what",
    type: "mcq",
    prompt: "What is `@MainActor`?",
    options: [
      "The built-in global actor representing the main thread — annotate code to guarantee it runs on main",
      "A wrapper that speeds up the main thread",
      "A replacement for URLSession",
      "A SwiftUI-only property wrapper",
    ],
    answer: 0,
    explanation:
      "`@MainActor` is the standard **global actor** for the main thread. Annotating a function or type makes its code main-isolated, turning 'remember to hop to main' into a compile-time guarantee.",
  },
  {
    id: "mainactor-await",
    type: "mcq",
    prompt: "Calling a `@MainActor` method from a non-main-actor async context requires…",
    options: [
      "`await` — you may need to hop onto the main actor",
      "nothing special",
      "a `DispatchQueue.global()` call first",
      "marking the caller `nonisolated`",
    ],
    answer: 0,
    explanation:
      "Crossing onto the main actor is a potential suspension (hop), so it needs `await` — exactly like any actor boundary.",
  },
  {
    id: "mainactor-run-fill",
    type: "fill",
    prompt: "From a non-isolated async function, wrap a block in `MainActor.___ { }` to run just that block on the main actor.",
    answers: ["run"],
    hint: "Three letters — you 'run' it on main.",
    explanation:
      "`await MainActor.run { ... }` executes the block on the main actor without annotating the whole function — handy after doing background work.",
  },
  {
    id: "body-mainactor",
    type: "mcq",
    prompt: "Why do you rarely need to annotate SwiftUI view code with `@MainActor`?",
    options: [
      "`View.body` is already `@MainActor`, so view code runs on main by default",
      "SwiftUI runs everything on a background thread",
      "SwiftUI disables concurrency checking",
      "Views are value types and can't touch the UI",
    ],
    answer: 0,
    explanation:
      "SwiftUI's `body` is `@MainActor`-isolated, so the view-building code is already on the main actor. You only reach for explicit hops when calling into background work and back.",
  },
  {
    id: "mainactor-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about `@MainActor`.",
    options: [
      "Applied to a type, it makes every method and property main-isolated",
      "A `Task { }` started from main-actor context inherits the main actor",
      "`Task.detached` inherits the main actor too",
      "It turns 'run UI on main' into a compile-time guarantee",
    ],
    answers: [0, 1, 3],
    explanation:
      "`@MainActor` on a type isolates all members, an inherited `Task { }` stays on main, and it's a compile-time guarantee. But `Task.detached` inherits **no** context, including the main actor (option 3 is false).",
  },
  {
    id: "task-on-main-freeze-senior",
    type: "predict",
    prompt: "🧠 Trick question — inside this `@MainActor` view model, does the heavy work block the UI?",
    code: `@MainActor
final class VM {
    func load() {
        Task {
            let x = expensiveSyncWork()   // heavy, synchronous
            print(x)
        }
    }
}`,
    options: [
      "Yes — the Task inherits the main actor, so the heavy sync work runs on the main thread and freezes the UI",
      "No — Task always runs on a background thread",
      "No — @MainActor moves it off main automatically",
      "It won't compile",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A `Task { }` created in main-actor context **inherits** the main actor, so `expensiveSyncWork()` runs on the main thread and blocks the UI. Fix it with `Task.detached` (no inheritance) or by calling a truly async function that suspends onto a background executor. This is a classic 'I used Task so it must be off-main' mistake.",
  },
  {
    id: "assume-isolated-senior",
    type: "mcq",
    prompt: "What does `MainActor.assumeIsolated { }` do?",
    options: [
      "Runs the block synchronously, asserting you're already on the main actor (traps if you're not)",
      "Hops to the main actor asynchronously",
      "Detaches work from the main actor",
      "Disables main-actor checking permanently",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`assumeIsolated` is a **synchronous** assertion that you're already running on the main actor — no hop, no `await`. It traps if the assumption is false. It's used to bridge from callbacks you know fire on main into main-actor-isolated code without an unnecessary async hop.",
  },
  {
    id: "background-completion-bug-senior",
    type: "mcq",
    prompt: "A legacy `URLSession` completion handler updates `label.text` directly and occasionally crashes. Best fix?",
    options: [
      "Marshal the UI update onto the main actor (@MainActor method or await MainActor.run)",
      "Add a longer timeout",
      "Retain the label more strongly",
      "Wrap the whole app in @MainActor",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Legacy completion handlers fire on a background queue, so touching UI there is a data race with the UI framework. Hop to main — `@MainActor` on the update method, or `await MainActor.run { ... }` (or `DispatchQueue.main.async` in non-async code).",
  },
  {
    id: "mainactor-flashcard",
    type: "flashcard",
    prompt:
      "Explain @MainActor: what problem it solves and the isolation-inheritance gotcha. Answer aloud, then reveal.",
    modelAnswer:
      "UIKit/SwiftUI are **single-threaded and not thread-safe**, so all UI work must run on the main thread; doing it off-main causes intermittent corruption/crashes. **`@MainActor`** is the built-in global actor for the main thread — annotate a function or type and the compiler guarantees that code runs on main, replacing the error-prone `DispatchQueue.main.async` convention. Applied to a type it isolates every member; calling a `@MainActor` member from off-main needs `await` (a hop). `MainActor.run { }` runs an ad-hoc block on main from a non-isolated context. The key gotcha is **isolation inheritance**: `View.body` is `@MainActor`, and a `Task { }` spawned in main-actor context **inherits** the main actor — so heavy synchronous work inside it runs on main and freezes the UI. Use `Task.detached` or a properly-suspending async call to get off main.",
    keyPoints: [
      "UI frameworks are single-threaded/not thread-safe → UI on main",
      "@MainActor = compile-time guarantee code runs on main",
      "On a type, isolates all members; off-main calls need await",
      "MainActor.run for ad-hoc main work; assumeIsolated asserts already-on-main",
      "Gotcha: inherited Task {} stays on main; use Task.detached for background",
    ],
    explanation:
      "The senior signal is the inheritance gotcha — knowing that `Task {}` in a `@MainActor` context does NOT get you off the main thread.",
  },
];

export default quiz;
