import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "combine-operators-what-is",
    type: "mcq",
    prompt: "What is an operator in Combine?",
    options: [
      "A method on a publisher that returns a new publisher wrapping the old one, transforming values as they flow through",
      "A subscriber that discards all incoming values",
      "A global function that mutates a publisher in place",
      "A protocol every Subscriber must conform to",
    ],
    answer: 0,
    explanation:
      "Operators like `map` and `filter` wrap the upstream publisher and return a new one. Because every operator returns a publisher, they chain into pipelines.",
  },
  {
    id: "combine-operators-map-vs-flatmap",
    type: "mcq",
    prompt: "What's the key difference between `map` and `flatMap`?",
    options: [
      "`map` transforms a value into a value; `flatMap` transforms a value into a publisher, subscribes to it, and merges its output into the stream",
      "`map` is asynchronous and `flatMap` is synchronous",
      "`flatMap` can only be used with arrays, not publishers",
      "They are interchangeable in every case",
    ],
    answer: 0,
    explanation:
      "`map { id in api.fetchUser(id) }` would emit publishers, not users. `flatMap` subscribes to each inner publisher and flattens their emissions into one downstream stream of the actual values.",
  },
  {
    id: "combine-operators-flatmap-order-senior",
    type: "mcq",
    prompt: "If `flatMap` fires off requests for user 1 and user 2, and user 2's request finishes first, what happens downstream?",
    options: [
      "User 2's result arrives first — flatMap does not preserve input order, it merges by completion time",
      "Combine buffers user 2's result until user 1's arrives, preserving order",
      "The pipeline throws a runtime error",
      "Only the first inner publisher to be created ever emits",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`flatMap` merges the results of all inner publishers as they complete, not in the order the outer values arrived. By default it also runs every inner publisher concurrently — the `maxPublishers` parameter (e.g. `.max(1)`) caps concurrency and can serialize order-sensitive cases.",
  },
  {
    id: "combine-operators-removeduplicates",
    type: "predict",
    prompt: "What does `removeDuplicates()` produce for the stream `1, 1, 2, 1`?",
    code: `[1, 1, 2, 1].publisher
    .removeDuplicates()
    .sink { print($0) }`,
    options: [
      "1, 2, 1 — only consecutive duplicates are removed",
      "1, 2 — all repeated values anywhere in the stream are removed",
      "1, 1, 2, 1 — nothing changes",
      "Compile error — removeDuplicates requires Equatable and Comparable",
    ],
    answer: 0,
    explanation:
      "`removeDuplicates` only compares each value to the one immediately before it, so it suppresses consecutive repeats, not every repeat across the whole stream.",
  },
  {
    id: "combine-operators-merge-zip-combinelatest-multi",
    type: "multi",
    prompt: "Select **all** true statements about `merge`, `zip`, and `combineLatest`.",
    options: [
      "`merge` requires both publishers to share the same Output type and interleaves them in arrival order",
      "`zip` pairs values strictly by position, waiting until it has one value from each side",
      "`combineLatest` emits before either side has emitted a value",
      "`combineLatest` re-emits a pair whenever either side produces a new value, using the other side's latest",
    ],
    answers: [0, 1, 3],
    explanation:
      "`combineLatest` emits nothing until *both* sides have emitted at least once (option 2 is false) — a common gotcha for form validation UIs waiting on a password field.",
  },
  {
    id: "combine-operators-zip-vs-combinelatest-predict-senior",
    type: "predict",
    prompt: "letters emits A, then numbers emits 1, then letters emits B, then numbers emits 2. What does `zip` print versus `combineLatest`?",
    code: `letters.zip(numbers).sink { print("zip: \\($0)\\($1)") }
letters.combineLatest(numbers).sink { print("latest: \\($0)\\($1)") }`,
    options: [
      "zip: A1, B2 — strict positional pairs. latest: A1, B1, B2 — every emission re-pairs with the other side's latest",
      "zip and combineLatest both print A1, B2",
      "zip: A1, B1, B2. latest: A1, B2",
      "Neither prints anything until both streams complete",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`zip` only pairs by matched position (two complete positions = two pairs). `combineLatest` re-emits on every single emission from either side once both have fired at least once, producing three pairs here.",
  },
  {
    id: "combine-operators-catch-replaces-upstream",
    type: "mcq",
    prompt: "What does `.catch { _ in Just(fallback) }` do when the upstream fails?",
    options: [
      "It swallows the error and replaces the entire upstream with the new publisher — the original stream is gone for good",
      "It retries the upstream publisher automatically before falling back",
      "It only changes the Failure type, not the recovery behavior",
      "It pauses the pipeline until the error is manually cleared",
    ],
    answer: 0,
    explanation:
      "`catch` replaces the dead upstream with whatever publisher you return. That's different from `mapError`, which only converts the Failure type without recovering.",
  },
  {
    id: "combine-operators-inner-catch-flatmap-senior",
    type: "predict",
    prompt: "A search pipeline does `searchText.flatMap { api.search($0) }.catch { _ in Just([]) }.sink { ... }`. A search fails and catch supplies []. The user then types another query. What happens?",
    code: `searchText
    .flatMap { text in api.search(text) }
    .catch { _ in Just([]) }
    .sink { results in show(results) }`,
    options: [
      "Nothing, forever — catch replaced the whole upstream (including the searchText subscription) with a Just that already finished",
      "The next keystroke triggers a new search normally",
      "The pipeline throws a fatal error on the next keystroke",
      "catch only affects the first failure and is bypassed afterward",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The failure propagates up through flatMap and terminates everything above the catch, including the searchText subscription itself. The fix is to place `.catch` *inside* the flatMap closure so only the failed inner request is replaced.",
  },
  {
    id: "combine-operators-debounce-vs-throttle-fill",
    type: "fill",
    prompt: "Under a continuous stream of values that never pauses, ___ never emits again, while throttle keeps emitting once per interval.",
    answers: ["debounce"],
    hint: "The operator that waits for a quiet gap before emitting.",
    explanation:
      "`debounce` only emits after a quiet gap with no new values — a firehose that never stops means debounce stays silent forever. `throttle` guarantees at least one emission per interval regardless.",
  },
  {
    id: "combine-operators-flashcard",
    type: "flashcard",
    prompt: "Explain the difference between merge, zip, and combineLatest, and the inner-flatMap catch placement gotcha. Answer aloud, then reveal.",
    modelAnswer:
      "**`merge`** interleaves two same-`Output`-typed publishers in arrival order — fire on either trigger. **`zip`** pairs values strictly by position like a zipper, waiting until it has one value from *each* side before emitting, buffering the faster side's extras unboundedly if the sides are uneven. **`combineLatest`** re-emits the pair of *latest* values whenever *either* side emits, but only after **both** sides have emitted at least once — a common gotcha where a form-validation pipeline waiting on a password field emits nothing until the password field fires once. Rule of thumb: zip for matched sets, combineLatest for 'recompute on any change' (form validation). For errors: a failure is **terminal** — `catch` doesn't recover in place, it **replaces the entire upstream** with the publisher you return, and `mapError` only converts the Failure type without recovering. The classic trap is catching *outside* a `flatMap` in a long-lived pipeline like search-as-you-type: the inner request's failure propagates up and terminates everything above the catch, including the outer keystroke subscription itself, so later keystrokes go nowhere. The fix is placing `.catch` **inside** the `flatMap` closure so only that one inner request-publisher gets replaced, keeping the outer stream alive.",
    keyPoints: [
      "merge = same-type interleave; zip = strict positional pairs, waits for both; combineLatest = latest-of-each, re-emits on any change but only after both sides emit once",
      "catch replaces the whole upstream with the fallback publisher — not a repair, a swap",
      "mapError only converts Failure type, doesn't recover",
      "Catching outside flatMap kills the outer long-lived stream permanently on one inner failure",
      "Fix: place .catch inside the flatMap closure to sacrifice only that inner request",
    ],
    explanation:
      "A senior answer volunteers the inner-flatMap catch placement unprompted — it's one of the most-asked Combine error-handling questions and shows real production experience.",
  },
];

export default quiz;
