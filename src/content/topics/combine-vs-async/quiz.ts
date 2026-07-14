import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "vsasync-shape",
    type: "mcq",
    prompt: "What is the fundamental shape difference between a plain async function and a Combine Publisher?",
    options: [
      "An async function returns exactly one value (or throws) once; a Publisher can emit zero or more values over time before completing",
      "A Publisher can only ever emit one value just like async/await, since the Combine framework always closes a stream immediately after the first emission",
      "async functions support structured cancellation through the Task hierarchy, but Publishers have no cancellation API at all",
      "There is no meaningful difference; they compile to the same SIL and are fully interchangeable in every situation",
    ],
    answer: 0,
    explanation:
      "`async`/`await` is single-value: call it, get one result or one thrown error, done. A `Publisher` follows Combine's values-then-one-ending grammar and can emit any number of values before finishing.",
  },
  {
    id: "vsasync-realcomparison",
    type: "mcq",
    prompt: "Which framing is more accurate for this topic?",
    options: [
      "It's really Publisher vs AsyncSequence for streams — plain async/await covers the single-value case neither is needed for",
      "Combine and async/await solve completely different problems and there is no meaningful overlap or shared bridging surface between them",
      "AsyncSequence is a superset that replaces async/await entirely, since every async function is just a sequence of one",
      "Publisher and async/await are functionally the same abstraction compiled differently, sharing the same runtime model",
    ],
    answer: 0,
    explanation:
      "Swift's own `AsyncSequence` is the native multi-value stream abstraction that overlaps with `Publisher`. Plain `async`/`await` is for the single-value case that neither stream abstraction is really needed for.",
  },
  {
    id: "vsasync-values-fill",
    type: "fill",
    prompt: "Every Publisher exposes a .___ property that returns an AsyncSequence, letting you consume it with a for await loop instead of sink.",
    answers: ["values"],
    hint: "Matches the property name shown in the code samples.",
    explanation:
      "`.values` bridges a `Publisher` to `AsyncSequence`, turning subscriber demand into the loop's request for the next element.",
  },
  {
    id: "vsasync-error-predict",
    type: "predict",
    prompt: "What happens to this loop when the publisher sends a .failure completion?",
    code: `for try await value in errorProne.values {
    print(value)
}`,
    options: [
      "The loop exits by throwing the error carried in the .failure completion",
      "The loop silently stops without propagating the error, identical to using try? around the entire loop body",
      "It's a compile error to call .values on a publisher whose Failure is not Never, preventing unsafe bridging",
      "The loop automatically retries the entire iteration from the top when it encounters a failure completion",
    ],
    answer: 0,
    explanation:
      "A failure completion surfaces as a thrown error from the loop, which is why `for try await` (not plain `for await`) is required whenever `Failure` isn't `Never`.",
  },
  {
    id: "vsasync-cancellation-senior",
    type: "mcq",
    prompt: "How does cancelling the surrounding Task affect a for await loop over publisher.values?",
    options: [
      "It cancels the underlying Combine subscription too, the same as calling .cancel() on its AnyCancellable would",
      "It has no effect on the Combine subscription, which keeps running and delivering emitted values into an internal buffer indefinitely",
      "It only pauses the loop; the publisher buffers all emitted values until the Task is resumed by the caller later",
      "It causes a crash because the .values bridge holds a strong reference back to the enclosing Task and cannot be cancelled",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Cancellation travels through the `.values` bridge: cancelling the `Task` cancels the underlying subscription just as `.cancel()` on the `AnyCancellable` would, since the bridge is built on the same subscription mechanism.",
  },
  {
    id: "vsasync-wrap-async-predict",
    type: "predict",
    prompt: "Why does this publisher wrap the Future in Deferred instead of using Future directly?",
    code: `func profilePublisher() -> AnyPublisher<Profile, Error> {
    Deferred {
        Future { promise in
            Task {
                let profile = try await api.fetchProfile()
                promise(.success(profile))
            }
        }
    }
    .eraseToAnyPublisher()
}`,
    options: [
      "Future runs eagerly at creation and caches one result for everyone; Deferred makes the async call happen fresh, per subscriber",
      "Deferred is syntactically required by the Swift compiler to wrap any publisher that closes over an async context inside a Task",
      "Deferred makes the publisher execute synchronously on the calling thread instead of dispatching the async work asynchronously",
      "There is no reason for Deferred here — a bare Future would produce identical behavior for every subscriber",
    ],
    answer: 0,
    explanation:
      "`Future` starts its work immediately when created and replays the same cached result to every subscriber. `Deferred` defers building the `Future` until subscription time, so each subscriber triggers its own fresh async call.",
  },
  {
    id: "vsasync-when-multi",
    type: "multi",
    prompt: "Select **all** good reasons to keep a stream in Combine rather than migrate it to AsyncSequence/async-await.",
    options: [
      "The call site genuinely needs combineLatest, debounce, or a similar composable operator",
      "The value only ever fires once and then completes",
      "The codebase is already deeply built around Combine at that boundary",
      "async/await doesn't support error handling",
    ],
    answers: [0, 2],
    explanation:
      "Real multi-stream/time-based composition (combineLatest, debounce) and existing Combine investment are good reasons to stay. A one-shot value is better as plain `async throws`, and async/await handles errors fine via `throws`.",
  },
  {
    id: "vsasync-migration-senior",
    type: "mcq",
    prompt: "What's the recommended incremental migration strategy from Combine to async/await in a large codebase?",
    options: [
      "Convert single-value producers to async throws first; bridge genuine streams at call sites with .values; only rewrite a stream's producer once nothing downstream needs Combine-specific operators",
      "Rewrite the entire codebase to async/await in one large PR so all Combine dependencies are removed in a single atomic change before the next release ships",
      "Leave all existing Combine code permanently untouched since any incremental migration across module or layer boundaries always introduces hard-to-diagnose regressions into otherwise-stable production code",
      "Delete all Publisher-returning functions up front immediately and then let every call site fail to compile until each consumer is individually located and manually rewritten",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The practical path is boundary-first and incremental: single-value producers convert cleanly since they never used Combine's multi-value behavior; genuine streams stay in Combine but get consumed via `.values` at call sites; producers only get rewritten once their consumers no longer need Combine-specific operators.",
  },
  {
    id: "vsasync-flashcard",
    type: "flashcard",
    prompt:
      "Explain when you'd choose async/await, AsyncSequence, or Combine's Publisher for a given piece of async work, and how to bridge between Combine and async code. Answer aloud, then reveal.",
    modelAnswer:
      "Choose plain **`async`/`await`** when the operation produces exactly one result — a single fetch, a single computation — since it's the simplest shape and needs no subscription bookkeeping. Choose **`AsyncSequence`** (`for await`) when there's a genuine multi-value stream but none of Combine's specific operators are doing real work for you; it composes naturally with structured concurrency, since a `for await` loop lives inside a `Task` and cancels with it. Choose Combine's **`Publisher`** when the stream needs Combine's composable operator library — `combineLatest`, `debounce`, `merge`, `retry` — or when the code sits in an already-Combine-heavy part of the codebase. To bridge Combine into async code, use every publisher's `.values` property inside a `for await` (or `for try await`, if `Failure` isn't `Never`) loop — it subscribes under the hood and turns the loop's pull for the next element into subscriber demand; cancelling the enclosing `Task` cancels the underlying subscription. To bridge the other way, wrap the `async` call in `Deferred { Future { promise in Task { ... } } }` — `Deferred` is needed because a bare `Future` runs eagerly at creation and caches one shared result, while `Deferred` makes the async call happen fresh per subscriber. For migrating a codebase, work boundary by boundary: convert single-value producers to `async throws` first, bridge remaining genuine streams at call sites with `.values`, and only rewrite a stream's producer once nothing downstream still needs Combine-specific operators on it.",
    keyPoints: [
      "async/await: single value; AsyncSequence: stream without needing Combine operators; Publisher: stream that needs Combine's operator library",
      ".values bridges Publisher -> AsyncSequence, for await/for try await depending on Failure",
      "Task cancellation propagates through .values to the underlying subscription",
      "Deferred { Future { ... } } bridges async -> Publisher, avoiding Future's eager/cached behavior",
      "Migration: convert single-value producers first, bridge streams at call sites, rewrite producers last",
    ],
    explanation:
      "A senior answer picks the right tool by shape (one value vs stream vs stream needing specific operators), names both bridges precisely, and gives a realistic incremental migration order rather than 'rewrite everything.'",
  },
];

export default quiz;
