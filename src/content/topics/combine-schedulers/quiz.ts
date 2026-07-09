import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sched-what",
    type: "mcq",
    prompt: "What is a Combine scheduler?",
    options: [
      "An object conforming to the Scheduler protocol that runs work at a given time on a given thread or queue",
      "A type that guarantees a publisher never fails",
      "A background timer that fires operators automatically",
      "A replacement for AnyCancellable",
    ],
    answer: 0,
    explanation:
      "A scheduler is anything conforming to Combine's `Scheduler` protocol — `DispatchQueue`, `RunLoop`, `OperationQueue`, and `ImmediateScheduler` are the common built-in ones.",
  },
  {
    id: "sched-receive-on",
    type: "mcq",
    prompt: "What does `receive(on:)` control?",
    options: [
      "Where everything downstream of it — later operators and the subscriber — receives values",
      "Where the publisher's own upstream work happens, regardless of position",
      "Whether the publisher can fail",
      "How many values the subscriber requests",
    ],
    answer: 0,
    explanation:
      "`receive(on:)` hops delivery to the given scheduler for everything after it in the chain. Its position matters — operators before it are unaffected.",
  },
  {
    id: "sched-subscribe-on",
    type: "mcq",
    prompt: "What does `subscribe(on:)` control, and how does its position in the chain matter?",
    options: [
      "Where the subscription and upstream work happen — and position doesn't matter, it always affects the source side",
      "Where downstream operators run — and only what's after it in the chain",
      "It has no effect on threading, only on cancellation",
      "It moves the subscriber's closure to the given queue, same as receive(on:)",
    ],
    answer: 0,
    explanation:
      "`subscribe(on:)` controls where the subscription begins and any synchronous upstream work runs. Unlike `receive(on:)`, its effect doesn't depend on where you place it in the chain.",
  },
  {
    id: "sched-blocking-predict-senior",
    type: "predict",
    prompt: "If `subscribe(on: DispatchQueue.global())` is removed from this chain, which thread runs the blocking file read?",
    code: `Deferred {
    Future<Data, Error> { promise in
        let data = try! Data(contentsOf: someFileURL)
        promise(.success(data))
    }
}
// .subscribe(on: DispatchQueue.global())  <-- removed
.receive(on: DispatchQueue.main)
.sink { data in self.label.text = "\\(data.count) bytes" }`,
    options: [
      "Whatever thread called .sink — often the main thread, freezing the UI",
      "A background thread automatically chosen by Combine",
      "It still runs on DispatchQueue.global() because Future is always async",
      "It throws a compile error",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Without `subscribe(on:)`, subscription-time work runs on whatever thread triggered the subscription — commonly the main thread — so the blocking disk read would freeze the UI. `receive(on:)` alone only controls where results are delivered, not where they're produced.",
  },
  {
    id: "sched-main-fill",
    type: "fill",
    prompt: "UIKit and SwiftUI state must only be touched on the ___ thread, so a Combine pipeline updating the UI needs receive(on:) targeting it.",
    answers: ["main"],
    hint: "The thread the app's UI runs on.",
    explanation:
      "`receive(on: DispatchQueue.main)` (or `RunLoop.main`) is required before any sink/assign that touches UI, since Combine doesn't hop threads automatically.",
  },
  {
    id: "sched-schedulers-multi",
    type: "multi",
    prompt: "Select **all** types that can be used as a Combine scheduler.",
    options: ["DispatchQueue", "RunLoop", "OperationQueue", "AnyCancellable"],
    answers: [0, 1, 2],
    explanation:
      "`DispatchQueue`, `RunLoop`, and `OperationQueue` all conform to the `Scheduler` protocol. `AnyCancellable` is a subscription token, unrelated to scheduling.",
  },
  {
    id: "sched-double-receive-predict",
    type: "predict",
    prompt: "What does calling `receive(on:)` a second time later in the chain do?",
    code: `pipeline
    .receive(on: DispatchQueue.global())
    .map { transform($0) }
    .receive(on: DispatchQueue.main)
    .sink { self.label.text = $0 }`,
    options: [
      "Adds a second hop — map runs on the global queue, then delivery moves to main for sink",
      "The second call is ignored; only the first receive(on:) has any effect",
      "It causes a runtime crash — receive(on:) can only appear once",
      "It moves the whole chain, including everything before the first receive(on:), to the main queue",
    ],
    answer: 0,
    explanation:
      "Each `receive(on:)` adds another thread hop for everything downstream of it. Here `map` runs on the global queue, and the final `sink` is moved back to main by the second hop.",
  },
  {
    id: "sched-testing-senior",
    type: "mcq",
    prompt: "Why do naive tests of `debounce`/`delay` pipelines tend to be slow or flaky?",
    options: [
      "They depend on a real scheduler's wall-clock time, so the test either sleeps for real or races the async work",
      "Combine operators can't be tested at all",
      "debounce and delay always run synchronously in tests",
      "XCTest doesn't support asynchronous expectations",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Time-based operators ask a real scheduler to run work after a real delay. Tests either wait for real time (slow) or risk a race if they don't wait long enough (flaky). The fix is injecting a virtual-time test scheduler instead of a hardcoded real one.",
  },
  {
    id: "sched-flashcard",
    type: "flashcard",
    prompt:
      "Explain the difference between receive(on:) and subscribe(on:), a common threading mistake with each, and how you'd make a debounce-based pipeline testable. Answer aloud, then reveal.",
    modelAnswer:
      "**`receive(on:)`** changes where *downstream* values are delivered — everything after it in the chain, including later operators and the terminal subscriber, moves to that scheduler. It's position-sensitive: place it too early and you drag operators that didn't need to move onto that scheduler (e.g. onto the main thread, blocking the UI with work that should stay in the background). **`subscribe(on:)`** changes where the *subscription and upstream production* happen — the moment a subscriber attaches, and any synchronous work the publisher does at that point (like a blocking read inside a `Future`). Its effect doesn't depend on chain position. The common mistake is using only one: `subscribe(on:)` alone moves where work starts but not where it's delivered, so a UI-touching `sink` can still fire on a background thread; `receive(on:)` alone doesn't stop expensive upstream work from running on whatever thread triggered the subscription. Most UI-facing network pipelines need both. For testability, avoid hardcoding a concrete scheduler like `DispatchQueue.main` inside the pipeline — take a `Scheduler` as an injected parameter so tests can substitute a virtual-time test scheduler (e.g. the community `CombineSchedulers` package's `TestScheduler`), letting a test advance time synchronously instead of sleeping for real delays or racing `debounce`/`delay`.",
    keyPoints: [
      "receive(on:): moves downstream delivery, position-sensitive",
      "subscribe(on:): moves subscription/upstream work, position-insensitive",
      "Common mistake: using only one when UI pipelines need both",
      "Testability: inject Scheduler rather than hardcode DispatchQueue.main",
      "Virtual-time test scheduler avoids real delays/flakiness for debounce/delay",
    ],
    explanation:
      "A senior answer keeps the two operators clearly separated by what they affect and position-sensitivity, names the paired-mistake pattern, and connects scheduler injection to testability.",
  },
];

export default quiz;
