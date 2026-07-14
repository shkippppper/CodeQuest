import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "combine-basics-publisher-def",
    type: "mcq",
    prompt: "What is a publisher in Combine?",
    options: [
      "Any type that can deliver a sequence of values over time to whoever subscribes",
      "A closure that executes once on the main thread and returns the single result to its caller",
      "A class that wraps a delegate callback, converting each delegate method into a type-erased call",
      "A global singleton that stores app state and pushes updates to any registered observer object",
    ],
    answer: 0,
    explanation:
      "A **publisher** describes values that could be delivered over time. On its own, nothing has happened yet — values only start flowing once a subscriber attaches.",
  },
  {
    id: "combine-basics-output-failure-fill",
    type: "fill",
    prompt: "Every publisher declares two associated types: `Output`, and ___.",
    answers: ["Failure"],
    hint: "What kind of error it can end with.",
    explanation:
      "Every publisher declares `Output` (the values it emits) and `Failure` (the error type it can end with, or `Never` if it can't fail).",
  },
  {
    id: "combine-basics-grammar-predict",
    type: "predict",
    prompt: "What does this print?",
    code: `[1, 2, 3].publisher
    .sink(
        receiveCompletion: { print("done: \\($0)") },
        receiveValue: { print("value: \\($0)") }
    )`,
    options: [
      "value: 1, value: 2, value: 3, done: finished",
      "done: finished, value: 1, value: 2, value: 3",
      "Only value: 1, value: 2, value: 3 — no completion",
      "Compile error, sink needs a single closure",
    ],
    answer: 0,
    explanation:
      "Every publisher follows the same grammar: zero or more values, then at most one completion event. All three array values arrive first, then `.finished` fires last.",
  },
  {
    id: "combine-basics-anycancellable",
    type: "mcq",
    prompt: "Why does `sink` return an `AnyCancellable` that you need to store?",
    options: [
      "It's a token representing the live subscription; when it deallocates, the subscription is torn down automatically",
      "It is only used for debugging and cancellation logging and has absolutely no effect on the subscription\\'s lifetime",
      "It forces the publisher to emit all buffered values synchronously on the current thread before returning control to the caller",
      "It permanently type-erases the publisher\\'s Failure type to Never, preventing any error from ever reaching the downstream subscriber",
    ],
    answer: 0,
    explanation:
      "The `AnyCancellable` token keeps the subscription alive. If you discard it (e.g. it's a local variable that goes out of scope), the subscription cancels immediately and the sink never fires again.",
  },
  {
    id: "combine-basics-demand-multi",
    type: "multi",
    prompt: "Select **all** true statements about the Subscription/demand handshake.",
    options: [
      "The subscriber requests a number of values via `subscription.request(.max(n))`",
      "Publishers may push more values than the subscriber's outstanding demand",
      "Demand only accumulates — a subscriber can ask for more but never take back what it requested",
      "`sink` and `assign` open with `.unlimited` demand by default",
    ],
    answers: [0, 2, 3],
    explanation:
      "Subscribers request demand, and it only accumulates upward. Publishers must respect demand and never exceed it (option 1 is false) — this pull-driven contract is called backpressure.",
  },
  {
    id: "combine-basics-backpressure-predict-senior",
    type: "predict",
    prompt: "A custom Subscriber requests `.max(2)` and returns `.none` (no additional demand) on every `receive(_:)` call. It's fed a publisher of 5 values. What prints?",
    code: `func receive(subscription: Subscription) {
    subscription.request(.max(2))
}
func receive(_ input: Int) -> Subscribers.Demand {
    print("value: \\(input)")
    return .none
}
func receive(completion: Subscribers.Completion<Never>) {
    print("done")
}`,
    options: [
      "value: 1, value: 2 — nothing else, \"done\" never prints",
      "value: 1 through value: 5, then \"done\", because the publisher ignores demand and pushes all values eagerly",
      "value: 1, value: 2, then \"done\" immediately because the publisher closes once demand is satisfied",
      "Nothing prints — the subscription never starts because the custom subscriber's type doesn't conform fully",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Demand caps delivery at exactly 2 values since `.none` never grants more. The publisher can't send a 3rd value or `.finished`, because a sequence publisher only completes after delivering its last value — which it never got permission to send.",
  },
  {
    id: "combine-basics-future-eager-senior",
    type: "mcq",
    prompt: "When does the closure passed to `Future` execute?",
    options: [
      "Immediately at creation time, exactly once, and the result is cached and replayed to every subscriber",
      "Only when the first subscriber attaches, and again independently for every new subscriber that joins later",
      "Lazily, the first time the returned AnyPublisher value is accessed or awaited by a caller",
      "On a background DispatchQueue after a one-second configurable delay set by the scheduler parameter",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Unlike most publishers, `Future` is eager — it runs its closure the moment it's initialized, not on subscription, and caches the single result for every future subscriber. `Deferred` is the wrapper that makes the work lazy and per-subscriber.",
  },
  {
    id: "combine-basics-cold-publisher-fill",
    type: "fill",
    prompt: "Most publishers are ___: they do nothing until a subscriber attaches, and each subscriber triggers an independent run of the pipeline.",
    answers: ["cold"],
    hint: "The opposite of an already-running, shared stream.",
    explanation:
      "Cold publishers re-run their entire pipeline for each new subscriber — two sinks on the same pipeline means the work happens twice, independently.",
  },
  {
    id: "combine-basics-eraseToAnyPublisher",
    type: "mcq",
    prompt: "What does `.eraseToAnyPublisher()` do?",
    options: [
      "Wraps the concrete pipeline type in `AnyPublisher`, hiding it behind a plain \"publisher of Output, Failure\" interface",
      "Cancels the current subscription immediately and restarts a completely fresh subscription from the beginning of the pipeline",
      "Permanently converts the publisher\\'s Failure type to Never by silently swallowing all errors that flow through the pipeline",
      "Forces the entire upstream pipeline to run synchronously on the main thread regardless of any scheduler hops already applied",
    ],
    answer: 0,
    explanation:
      "Real pipelines produce deeply nested generic types. `AnyPublisher` is a type-erased wrapper used to expose a simple, stable return type across API boundaries.",
  },
  {
    id: "combine-basics-flashcard",
    type: "flashcard",
    prompt: "Explain what a publisher/subscriber pair is, the grammar every publisher follows, and how the Subscription demand handshake works. Answer aloud, then reveal.",
    modelAnswer:
      "A **publisher** is any type that can deliver a sequence of values over time; a **subscriber** is what receives them and acts. Every publisher declares an **`Output`** type and a **`Failure`** type — `Failure == Never` provably means it can't fail. Every publisher follows one **grammar**: zero or more values, then at most one **completion event** (`.finished` or `.failure(error)`); after that it's done forever. Attaching `sink` (or `assign`, which requires `Failure == Never`) returns an **`AnyCancellable`** token — discarding it tears the subscription down immediately, so it must be stored. Underneath, subscription is a three-step handshake: the subscriber attaches and receives a `Subscription`; it calls `request(.max(n))` to signal **demand** — how many values it can handle; the publisher may only push up to that demand, and each delivered value can return more demand, which only ever accumulates. This pull-driven flow control is **backpressure**; `sink`/`assign` just default to `.unlimited` demand so most code never notices it. `Just` emits one value and finishes; `Future` is the eager exception — it runs its closure at creation and caches one result for everyone; `Deferred` wraps it to make the work lazy and per-subscriber. Most publishers are **cold**: no work until subscribed, and a fresh independent run per subscriber. `AnyPublisher` type-erases a pipeline's gnarly concrete type for use across API boundaries.",
    keyPoints: [
      "Publisher = values over time; declares Output and Failure (Never = provably can't fail)",
      "Grammar: zero-or-more values, then at most one completion (finished/failure)",
      "AnyCancellable token must be stored or the subscription tears down",
      "Subscription handshake: attach -> request(demand) -> values within demand (backpressure)",
      "Future is eager and caches one result; Deferred makes it lazy/per-subscriber",
      "Most publishers are cold — re-run per subscriber; AnyPublisher type-erases the pipeline",
    ],
    explanation:
      "A senior answer names the demand mechanism explicitly as backpressure and distinguishes Future's eagerness from the general cold-publisher rule, not just the sink-level API.",
  },
];

export default quiz;
