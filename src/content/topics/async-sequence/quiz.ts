import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "asyncsequence-vs-await",
    type: "mcq",
    prompt: "What does `AsyncSequence` model that a plain `async` function does not?",
    options: [
      "Many values arriving over time, consumed with `for await`",
      "A single value returned faster",
      "Synchronous iteration",
      "Thread creation",
    ],
    answer: 0,
    explanation:
      "`await` yields one value later; `AsyncSequence` yields a *stream* of values over time, each awaited in a `for await` loop, with cancellation and error handling built in.",
  },
  {
    id: "for-await-fill",
    type: "fill",
    prompt: "Complete the loop keyword used to iterate an `AsyncSequence`: `for ___ line in url.lines { }`",
    answers: ["await"],
    hint: "Same keyword as calling an async function.",
    explanation:
      "`for await` (or `for try await` if it can throw) suspends each iteration until the next element is ready. It must run in an async context.",
  },
  {
    id: "asyncstream-yield",
    type: "predict",
    prompt: "What does this print?",
    code: `let stream = AsyncStream<Int> { c in
    c.yield(1)
    c.yield(2)
    c.finish()
}
for await n in stream { print(n) }`,
    options: ["1, then 2", "2, then 1", "nothing", "1, 2, then error"],
    answer: 0,
    explanation:
      "`AsyncStream` produces values via `continuation.yield(...)` and ends at `finish()`. The consumer's `for await` receives `1` then `2`, then the loop ends.",
  },
  {
    id: "asyncstream-purpose",
    type: "mcq",
    prompt: "What is the primary use of `AsyncStream`?",
    options: [
      "To produce an AsyncSequence — often bridging a callback/delegate API into async code",
      "To run work on a background thread",
      "To replace actors",
      "To cache network responses",
    ],
    answer: 0,
    explanation:
      "`AsyncStream` is the ready-made way to *build* an async sequence: you push values into its continuation. It's the standard adapter for turning delegate/callback event sources into a `for await` loop.",
  },
  {
    id: "throwing-stream",
    type: "mcq",
    prompt: "Which type do you use when the streamed source can fail with an error?",
    options: ["`AsyncThrowingStream`", "`AsyncStream`", "`Result`", "`ThrowingSequence`"],
    answer: 0,
    explanation:
      "`AsyncThrowingStream` lets you end the stream with `continuation.finish(throwing:)`; consumers iterate it with `for try await`. Plain `AsyncStream` cannot throw.",
  },
  {
    id: "asyncsequence-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about async sequences.",
    options: [
      "`for await` suspends until the next element is available",
      "Cancelling the surrounding task stops a well-behaved async sequence",
      "`AsyncStream`'s `onTermination` runs when iteration stops or the task is cancelled",
      "AsyncSequence guarantees producers can never outrun consumers",
    ],
    answers: [0, 1, 2],
    explanation:
      "for-await suspends per element, cancellation propagates, and `onTermination` is the cleanup hook. But producers CAN outrun consumers — you manage that with a buffering policy (option 3 is false).",
  },
  {
    id: "backpressure-senior",
    type: "mcq",
    prompt: "A high-frequency source yields into an `AsyncStream` faster than the consumer reads. How do you bound memory?",
    options: [
      "Create the stream with a buffering policy like `.bufferingNewest(n)`, which drops excess values",
      "Nothing — AsyncStream blocks the producer automatically",
      "Call `finish()` after each yield",
      "Use a serial DispatchQueue",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`AsyncStream` doesn't apply true backpressure (it won't block the producer). You choose a **buffering policy** — `.unbounded` (risky), `.bufferingNewest(n)`, or `.bufferingOldest(n)` — to cap memory by dropping values. `yield` even returns whether the value was enqueued or dropped.",
  },
  {
    id: "ontermination-senior",
    type: "mcq",
    prompt: "Why set `continuation.onTermination` when bridging a delegate into an `AsyncStream`?",
    options: [
      "To tear down the underlying source when the consumer stops or the task is cancelled",
      "To yield a final value",
      "To make the stream throwing",
      "To move the stream to the main actor",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`onTermination` fires when iteration ends or is cancelled — the place to stop the delegate/timer/socket you started. Without it, the underlying source keeps running (a leak) after consumers walk away.",
  },
  {
    id: "for-await-cancel-senior",
    type: "predict",
    prompt: "🧠 Trick question — a `for try await` loop over a network byte stream is inside a Task that gets cancelled mid-iteration. What happens?",
    code: `let task = Task {
    for try await byte in handle.bytes {
        process(byte)
    }
}
task.cancel()`,
    options: [
      "The async sequence observes cancellation and the loop ends (typically throwing CancellationError)",
      "The loop keeps running until the stream naturally ends",
      "The app crashes",
      "Cancellation is ignored inside for-await",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`for await` is a suspension point that participates in cooperative cancellation. A well-behaved async sequence (like `bytes`) checks and stops producing when its task is cancelled, so the loop terminates — usually by throwing `CancellationError` out of the `for try await`. This automatic teardown is a big advantage over manual callback loops.",
  },
  {
    id: "asyncsequence-flashcard",
    type: "flashcard",
    prompt:
      "What is AsyncSequence, how do you produce one with AsyncStream, and how is backpressure handled? Answer aloud, then reveal.",
    modelAnswer:
      "**`AsyncSequence`** is the async analogue of `Sequence`: producing each element is `async` (and may `throw`), so you consume it with **`for await`** / `for try await`, getting values as they arrive with built-in cancellation and error propagation. You rarely implement it by hand — **`AsyncStream`** is the standard producer: its closure hands you a `continuation` you push values into with `yield`, ending with `finish()` (or `finish(throwing:)` for `AsyncThrowingStream`), and set `onTermination` to tear down the source when iteration stops or the task is cancelled. That makes `AsyncStream` the go-to adapter to **bridge delegate/callback APIs** into async code. **Backpressure** isn't automatic (the producer isn't blocked); you pick a **buffering policy** — `.bufferingNewest(n)`, `.bufferingOldest(n)`, or `.unbounded` — to bound memory by dropping excess, and `yield` reports whether a value was enqueued or dropped.",
    keyPoints: [
      "AsyncSequence = many values over time, consumed with for-await",
      "for-await suspends per element and honors cancellation",
      "AsyncStream produces one via continuation.yield / finish",
      "onTermination cleans up the bridged source",
      "Backpressure = buffering policy (not producer blocking)",
    ],
    explanation:
      "Senior answers cover producing streams (AsyncStream continuation + onTermination for bridging) and correctly state that backpressure is a buffering-policy choice, not automatic producer blocking.",
  },
];

export default quiz;
