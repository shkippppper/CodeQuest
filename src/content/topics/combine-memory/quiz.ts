import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "mem-anycancellable-role",
    type: "mcq",
    prompt: "What happens if you never store the AnyCancellable that sink returns?",
    options: [
      "The token deallocates immediately, which cancels the subscription before it can deliver values",
      "The subscription runs forever regardless",
      "It causes a compile error",
      "The publisher automatically retries the subscription",
    ],
    answer: 0,
    explanation:
      "`AnyCancellable` owns the subscription. With nothing holding a strong reference to it, the token deallocates right away, and its `deinit` cancels the subscription before any value arrives.",
  },
  {
    id: "mem-store-in-fill",
    type: "fill",
    prompt: "Calling .___(in: &cancellables) on the AnyCancellable returned by sink inserts it into a collection instead of needing one property per subscription.",
    answers: ["store"],
    hint: "The method name matches what it does with the collection.",
    explanation:
      "`.store(in:)` inserts the cancellable into a `Set<AnyCancellable>` (or similar collection) you keep as a property, so many subscriptions can share one piece of storage.",
  },
  {
    id: "mem-cycle-predict",
    type: "predict",
    prompt: "Does deinit run once every external reference to this ViewModel is gone?",
    code: `class ViewModel {
    var cancellables = Set<AnyCancellable>()
    var results: [String] = []
    deinit { print("gone") }

    func startListening() {
        searchPublisher
            .sink { value in
                self.results.append(value)
            }
            .store(in: &cancellables)
    }
}`,
    options: [
      "No — self owns cancellables, which owns the AnyCancellable, which owns a closure capturing self: a retain cycle",
      "Yes — Combine automatically breaks retain cycles",
      "Yes — sink closures never capture self strongly",
      "No — but only because searchPublisher never completes",
    ],
    answer: 0,
    explanation:
      "The closure captures `self` strongly and is retained by `self` via the cancellables set — a loop that keeps the count above zero forever, so `deinit` never runs even after all outside references are gone.",
  },
  {
    id: "mem-weak-self-mcq",
    type: "mcq",
    prompt: "What does adding [weak self] to a sink closure change?",
    options: [
      "The closure captures self without incrementing its reference count, breaking the retain cycle through that closure",
      "It cancels the subscription immediately",
      "It makes the publisher run on a background thread",
      "It prevents the closure from ever running",
    ],
    answer: 0,
    explanation:
      "`[weak self]` captures self as a weak reference, so it no longer keeps the object alive. Inside the closure, `self` becomes optional — usually unwrapped with `guard let self else { return }`.",
  },
  {
    id: "mem-partial-fix-senior",
    type: "predict",
    prompt: "Does marking only the sink closure [weak self] fully fix the retain cycle here?",
    code: `searchPublisher
    .map { text in self.normalize(text) }
    .filter { self.isValid($0) }
    .sink { [weak self] value in
        self?.results.append(value)
    }
    .store(in: &cancellables)`,
    options: [
      "No — map and filter still capture self strongly, and the whole pipeline is retained by self via cancellables",
      "Yes — the terminal sink is the only closure that matters for retain cycles",
      "Yes — map and filter never capture self even if written to",
      "No — because store(in:) itself causes the leak regardless of captures",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The retain cycle runs through every closure in the chain that captures `self` and is retained by `self`. `map` and `filter` here still capture `self` strongly, so the cycle survives even with a weak `sink` — those closures need `[weak self]` too.",
  },
  {
    id: "mem-cancel-fill",
    type: "fill",
    prompt: "Calling .___() on an AnyCancellable immediately ends the subscription, the same thing that happens automatically when the token deallocates.",
    answers: ["cancel"],
    hint: "Same word as the type's name minus 'Any' and 'able'.",
    explanation:
      "`.cancel()` explicitly tears down the subscription right away. `AnyCancellable`'s `deinit` calls the same method automatically when the token is deallocated.",
  },
  {
    id: "mem-share-cancel-senior",
    type: "mcq",
    prompt: "A publisher was set up with .share() and has two subscribers. One subscriber cancels its AnyCancellable. What happens to the other subscriber?",
    options: [
      "It keeps receiving values — cancelling one subscriber doesn't tear down shared upstream work for others",
      "Both subscribers stop receiving values immediately",
      "The publisher restarts from scratch for the remaining subscriber",
      "Cancellation is not possible on a shared publisher",
    ],
    answer: 0,
    explanation:
      "Cancellation is per-subscriber. With `.share()`, the upstream pipeline keeps running for any subscribers still attached; only the cancelling subscriber's own subscription ends.",
  },
  {
    id: "mem-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about memory management in Combine.",
    options: [
      "Storing many AnyCancellables in a Set is the standard pattern for managing several subscriptions",
      "A sink closure that captures self and is retained (directly or indirectly) by self can create a retain cycle",
      "AnyCancellable's deinit automatically cancels its subscription",
      "[weak self] is only ever needed in the terminal sink closure, never in map or filter",
    ],
    answers: [0, 1, 2],
    explanation:
      "The first three are correct patterns/behaviors. The fourth is false — any closure in the chain that captures `self` and is retained by `self` can need `[weak self]`, not just the terminal sink.",
  },
  {
    id: "mem-flashcard",
    type: "flashcard",
    prompt:
      "Explain how a Combine retain cycle typically forms through sink and cancellables, and how to fix it correctly across a whole pipeline. Answer aloud, then reveal.",
    modelAnswer:
      "A retain cycle forms when a view model stores its subscriptions on itself — `self` owns a `Set<AnyCancellable>` (via `store(in:)`), that set owns the `AnyCancellable`, and the `AnyCancellable` owns the closures passed to `sink`/`map`/`filter`/etc. If any of those closures capture `self` **strongly**, the chain loops back: `self → cancellables → AnyCancellable → closure → self`. This is the same shape as an ARC retain cycle, just built from Combine's internal storage instead of two custom classes. The fix is `[weak self]` on every closure in that chain that both captures `self` and is retained by `self` — not just the terminal `sink`. `map`, `filter`, `handleEvents`, and any other operator closure capturing `self` needs the same treatment, since fixing only the last link leaves the cycle intact through the earlier ones. Inside a weakly-captured closure, unwrap with `guard let self else { return }` (or optional chaining) since `self` becomes optional. Separately from leaks, `.cancel()` (called explicitly, or implicitly via `AnyCancellable` deallocation) ends a subscription — but only that subscriber's own subscription; with a `.share()`d publisher, other subscribers keep receiving values until they cancel too.",
    keyPoints: [
      "Cycle: self -> cancellables -> AnyCancellable -> closure -> self",
      "Only closures that both capture self AND are retained by self are at risk",
      "Fix every closure in the chain, not just the terminal sink",
      "guard let self else { return } unwraps the weak capture",
      "cancel() is per-subscriber; shared publishers keep running for others",
    ],
    explanation:
      "A strong answer names the exact ownership loop, generalizes the fix beyond the terminal sink to every retained-and-capturing closure, and notes cancellation's per-subscriber scope with share().",
  },
];

export default quiz;
