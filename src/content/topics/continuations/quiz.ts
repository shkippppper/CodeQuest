import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "continuation-purpose",
    type: "mcq",
    prompt: "What is a continuation used for?",
    options: [
      "Bridging a completion-handler / callback API into an async function",
      "Running work on a background thread by dispatching to a global DispatchQueue without needing a Task wrapper",
      "Caching the result of an async call so that repeated awaits return the same stored value without re-executing the work",
      "Cancelling a task by signalling its cancellation handler from outside the structured concurrency hierarchy",
    ],
    answer: 0,
    explanation:
      "`withCheckedContinuation` suspends the async function and gives a callback the ability to `resume` it with a result — turning callback-based APIs into awaitable `async` functions.",
  },
  {
    id: "throwing-continuation",
    type: "mcq",
    prompt: "Your legacy API's callback delivers a `Result<Data, Error>`. Which continuation do you use?",
    options: [
      "`withCheckedThrowingContinuation` — resume returning on success, throwing on failure",
      "`withCheckedContinuation` — it handles errors automatically by mapping the Result failure case to a nil return value",
      "`AsyncStream` initialized with a Result element type, since it natively models success and failure values over time",
      "`Task.detached` with a do/catch block inside, forwarding any caught error to the caller via an actor-isolated property",
    ],
    answer: 0,
    explanation:
      "Use the **throwing** variant so you can `resume(throwing:)` on failure. The non-throwing `withCheckedContinuation` can only `resume(returning:)`.",
  },
  {
    id: "resume-once-fill",
    type: "fill",
    prompt: "A continuation must be resumed exactly ___ time(s) — no more, no less.",
    answers: ["one", "1", "once"],
    hint: "A single number/word.",
    explanation:
      "Resume exactly **once**. Resuming twice crashes; never resuming leaves the awaiting task suspended forever.",
  },
  {
    id: "double-resume-crash",
    type: "mcq",
    prompt: "What happens if you call `continuation.resume` twice on a checked continuation?",
    options: [
      "It traps (crashes) with a clear diagnostic",
      "The second resume call is silently ignored and only the value from the first call is delivered to the awaiting caller",
      "The two resumed values are averaged together and the mean is delivered as the single result of the async function",
      "The task restarts from the top of its async function, re-executing all code before the continuation suspension point",
    ],
    answer: 0,
    explanation:
      "A **checked** continuation detects a double-resume and traps with a helpful message. That safety net is the reason to prefer it over `withUnsafeContinuation` while developing.",
  },
  {
    id: "bridge-predict",
    type: "predict",
    prompt: "What does `value` become?",
    code: `func load() async -> Int {
    await withCheckedContinuation { c in
        DispatchQueue.global().async {
            c.resume(returning: 42)
        }
    }
}
let value = await load()`,
    options: ["42", "0", "nil", "It hangs forever"],
    answer: 0,
    explanation:
      "The continuation suspends `load()` until the background callback calls `resume(returning: 42)`, which delivers `42` back to the awaiting caller. `resume` can be called from any thread.",
  },
  {
    id: "continuations-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about continuations.",
    options: [
      "Never resuming a continuation leaves the awaiting task suspended forever",
      "A continuation represents a single result, not a stream of values",
      "`resume` may be called from any thread",
      "Checked continuations are faster than unsafe ones",
    ],
    answers: [0, 1, 2],
    explanation:
      "Not resuming hangs the task, a continuation is single-shot, and resume is thread-agnostic. The **unsafe** variant is the faster one (it skips the checks), so option 3 is false.",
  },
  {
    id: "never-resume-senior",
    type: "predict",
    prompt: "🧠 Trick question — what's the bug's effect?",
    code: `func fetch() async throws -> Data {
    try await withCheckedThrowingContinuation { c in
        legacyFetch { data, error in
            guard let data else { return }   // early return on error!
            c.resume(returning: data)
        }
    }
}`,
    options: [
      "On the error path the continuation is never resumed, so the await hangs forever",
      "It crashes immediately at the guard statement because withCheckedThrowingContinuation traps whenever the callback returns early",
      "It returns empty Data because the runtime detects the missing resume and substitutes a zero-byte buffer as a safe default value",
      "It retries the legacyFetch call automatically up to three times before propagating the missing resume as a CancellationError",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "When `data` is nil (an error), the `guard` returns **without resuming**, so the continuation is never called — the awaiting task is suspended forever (a silent hang/leak). Every path through the callback must resume exactly once; here the error path should `c.resume(throwing: error)`.",
  },
  {
    id: "repeating-callback-senior",
    type: "mcq",
    prompt: "You need to bridge a callback that fires repeatedly (many location updates). Should you use a continuation?",
    options: [
      "No — a continuation is single-shot; use AsyncStream for repeated values",
      "Yes — resume it once per update, since each resume just extends the single-shot window until the callback fires again",
      "Yes — use withUnsafeContinuation for the speed benefit, as its lack of bookkeeping lets it resume safely multiple times",
      "Yes — continuations automatically buffer multiple values internally and deliver them in order to a single awaiting caller",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A continuation delivers **one** result; resuming it again crashes. A source that emits many values over time should be bridged with **`AsyncStream`** (yield per callback), not a continuation.",
  },
  {
    id: "unsafe-continuation-senior",
    type: "mcq",
    prompt: "What's the trade-off of `withUnsafeContinuation` vs `withCheckedContinuation`?",
    options: [
      "Unsafe skips the double-resume / missing-resume checks for slightly less overhead — you lose the safety diagnostics",
      "Unsafe is required for throwing callbacks because the checked throwing variant is not available in the standard library",
      "Unsafe automatically resumes the continuation with a nil result if the timeout period elapses without an explicit resume call",
      "There is no functional difference between the two — the word unsafe is just a historical naming convention with no runtime impact",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`withUnsafeContinuation` omits the runtime bookkeeping that catches double-resume and discarded continuations, for a tiny performance gain. Develop with the **checked** version; only switch to unsafe in hot paths after you've proven correctness.",
  },
  {
    id: "continuations-flashcard",
    type: "flashcard",
    prompt:
      "How do you bridge a completion handler to async, and what is the resume-exactly-once rule? Answer aloud, then reveal.",
    modelAnswer:
      "Wrap the callback API in **`withCheckedContinuation`** (for callbacks that always succeed) or **`withCheckedThrowingContinuation`** (for Result/error callbacks). Inside the closure you call the legacy API, and from its callback you call `continuation.resume(returning:)` on success or `resume(throwing:)` on failure — that resumes the suspended async function with the result, so callers just `await` a normal function. The iron rule is **resume exactly once**: resuming **twice crashes** (the *checked* continuation traps with a diagnostic), and **never resuming leaves the task suspended forever** (a silent hang) — classically caused by a `guard`/error path that returns without resuming. A continuation is **single-shot**: for a callback that fires repeatedly, use `AsyncStream` instead. `withUnsafeContinuation` skips the safety checks for a little speed — use only after verifying correctness.",
    keyPoints: [
      "withCheckedContinuation / ...ThrowingContinuation to wrap callbacks",
      "resume(returning:) / resume(throwing:) from the callback",
      "Resume EXACTLY once: twice = crash, never = hang forever",
      "Every callback path (incl. errors/guards) must resume",
      "Single-shot — use AsyncStream for repeating callbacks; unsafe skips checks",
    ],
    explanation:
      "The senior signal is the resume-exactly-once invariant with both failure modes (crash vs hang) and knowing a continuation is single-shot (AsyncStream for repeats).",
  },
];

export default quiz;
