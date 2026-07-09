import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "subjects-why",
    type: "mcq",
    prompt: "What problem do subjects solve that ordinary publishers like `Just` or an array's `.publisher` don't?",
    options: [
      "Pushing values into a Combine pipeline from imperative, callback-driven code",
      "Making a pipeline run faster",
      "Removing the need for `AnyCancellable`",
      "Converting a publisher into an `AsyncSequence`",
    ],
    answer: 0,
    explanation:
      "Subjects let imperative code call `.send(value)` to push values into Combine by hand — the standard bridge for delegate callbacks, notifications, or UI events that aren't already publishers.",
  },
  {
    id: "subjects-passthrough-vs-currentvalue",
    type: "mcq",
    prompt: "What's the key behavioral difference between `PassthroughSubject` and `CurrentValueSubject`?",
    options: [
      "CurrentValueSubject stores and replays its latest value to new subscribers and exposes `.value`; PassthroughSubject has no memory",
      "PassthroughSubject can never fail",
      "CurrentValueSubject can only be used with Int",
      "They behave identically except for the initializer",
    ],
    answer: 0,
    explanation:
      "`CurrentValueSubject` always holds the most recent value, hands it to any subscriber that attaches, and exposes it synchronously via `.value`. `PassthroughSubject` only forwards values sent after a subscriber attaches.",
  },
  {
    id: "subjects-late-subscriber-predict",
    type: "predict",
    prompt: "What does the late subscriber print?",
    code: `let taps = PassthroughSubject<Int, Never>()
taps.send(1)
taps.send(2)
let late = taps.sink { print("late got \\($0)") }
taps.send(3)`,
    options: ["late got 3", "late got 1, late got 2, late got 3", "Nothing ever prints", "late got 1"],
    answer: 0,
    explanation:
      "`PassthroughSubject` has no memory of past sends. `late` only receives values sent after it subscribes, so it sees just `3`.",
  },
  {
    id: "subjects-currentvalue-predict-senior",
    type: "predict",
    prompt: "Two subscribers attach at different times around a `.send`. What does subscriber `b` print first?",
    code: `let counter = CurrentValueSubject<Int, Never>(0)
let a = counter.sink { print("a: \\($0)") }
counter.send(5)
let b = counter.sink { print("b: \\($0)") }`,
    options: ["b: 5", "b: 0", "b prints nothing", "b: 0 then b: 5"],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`b` attaches after the send, so the 'current value on attach' it receives is already `5` — it never sees the original `0`.",
  },
  {
    id: "subjects-share-fill",
    type: "fill",
    prompt: "The operator ___() turns a cold publisher into a hot one, running the upstream pipeline once and broadcasting values to every current subscriber.",
    answers: ["share"],
    hint: "One word, also the name of the concept: multicasting.",
    explanation:
      "`share()` multicasts a single upstream run to all current subscribers instead of letting each subscriber trigger its own independent run.",
  },
  {
    id: "subjects-cold-repeat-predict",
    type: "predict",
    prompt: "How many times does \"fetching…\" print?",
    code: `let pipeline = urlPublisher
    .map { url -> Data in
        print("fetching…")
        return download(url)
    }
let a = pipeline.sink { _ in }
let b = pipeline.sink { _ in }`,
    options: [
      "Twice — each subscriber restarts the cold pipeline from scratch",
      "Once — Combine automatically shares work",
      "Zero times — nothing runs without `.share()`",
      "Once per app launch",
    ],
    answer: 0,
    explanation:
      "Without `.share()`, the pipeline is cold and every subscriber re-runs it independently, so the side effect in `map` fires once per subscriber — twice here.",
  },
  {
    id: "subjects-share-limits-multi",
    type: "multi",
    prompt: "Select **all** true statements about `share()`.",
    options: [
      "It runs the upstream pipeline once and multicasts values to current subscribers",
      "It makes a cold publisher hot",
      "It replays the most recent value to subscribers that attach late",
      "It removes the need to store an AnyCancellable",
    ],
    answers: [0, 1],
    explanation:
      "`share()` multicasts one run to current subscribers (hot instead of cold), but it does **not** replay history — a late subscriber misses earlier values. It also doesn't change anything about cancellable storage.",
  },
  {
    id: "subjects-backpressure-senior",
    type: "mcq",
    prompt: "How do subjects interact with Combine's demand-driven backpressure system?",
    options: [
      "They largely bypass it — `.send()` delivers values immediately regardless of what the subscriber requested",
      "They strictly enforce demand and block `.send()` until the subscriber asks for more",
      "Subjects don't support any subscriber other than `sink`",
      "Backpressure only applies to subjects, not other publishers",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A subject's `.send()` is a synchronous push from imperative code with no way to pause and wait for demand. Ordinary pull-based publishers respect requested demand; subjects effectively sidestep that discipline, so managing pace becomes the caller's or subscriber's responsibility.",
  },
  {
    id: "subjects-flashcard",
    type: "flashcard",
    prompt:
      "Explain when you'd reach for PassthroughSubject vs CurrentValueSubject vs share(), and why subjects break Combine's usual backpressure model. Answer aloud, then reveal.",
    modelAnswer:
      "Use a **`PassthroughSubject`** to bridge one-off, imperative events — button taps, delegate callbacks, notifications — into a Combine pipeline via `.send()`; it has no memory, so only subscribers attached before a send see it. Use a **`CurrentValueSubject`** when a screen needs to know the *current* value: it's constructed with a starting value, always holds the latest one, exposes it synchronously through `.value`, and replays it to any new subscriber immediately on attach. Reach for **`share()`** when a cold pipeline has a side effect (network call, heavy computation) that must not repeat per subscriber — it runs the upstream once and multicasts the result, though it still doesn't replay history to late subscribers (that needs `multicast(subject:)` with a `CurrentValueSubject`). Subjects break Combine's normal pull-based backpressure because `.send()` is a synchronous, fire-and-forget call from imperative code with no way to wait for a subscriber's requested demand — the values go out regardless, so managing pace is left to the caller or the subscriber, not the framework.",
    keyPoints: [
      "PassthroughSubject: no memory, bridges imperative events",
      "CurrentValueSubject: holds latest value, exposes .value, replays to new subscribers",
      "share(): fixes cold-pipeline side-effect duplication by multicasting one run",
      "share() does not replay history — multicast(subject:) does",
      "Subjects bypass demand-based backpressure — .send() always delivers",
    ],
    explanation:
      "A senior answer distinguishes the two subjects by memory behavior, ties share() to the cold-publisher problem it fixes, and names the backpressure trade-off subjects make.",
  },
];

export default quiz;
