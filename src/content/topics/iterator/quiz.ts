import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "iterator-what",
    type: "mcq",
    prompt: "What is an IteratorProtocol conforming type responsible for?",
    options: [
      "Handing back one element per call to next(), returning nil once there's nothing left",
      "Storing all elements in a contiguous array so they can be accessed by index in O(1) time",
      "Sorting elements before they are returned so callers always receive them in ascending order",
      "Converting each element to a common base type so heterogeneous sequences have a uniform Element type",
    ],
    answer: 0,
    explanation:
      "IteratorProtocol requires exactly one method, next() -> Element?, that produces elements one at a time and signals the end with nil.",
  },
  {
    id: "iterator-desugar-fill",
    type: "fill",
    prompt: "A for-in loop is sugar for calling ___() once, then calling next() in a loop until it returns nil.",
    answers: ["makeIterator"],
    hint: "The single required method of the Sequence protocol.",
    explanation:
      "for-in calls makeIterator() to get an IteratorProtocol value, then repeatedly calls next() until nil — there's no other magic involved.",
  },
  {
    id: "iterator-counting-predict",
    type: "predict",
    prompt: "What does this print?",
    code: `struct CountingIterator: IteratorProtocol {
    var current = 1
    let max = 2
    mutating func next() -> Int? {
        guard current <= max else { return nil }
        defer { current += 1 }
        return current
    }
}
var it = CountingIterator()
print(it.next())
print(it.next())
print(it.next())`,
    options: [
      "Optional(1), Optional(2), nil",
      "Optional(1), Optional(2), Optional(3)",
      "1, 2, nil",
      "nil, Optional(1), Optional(2)",
    ],
    answer: 0,
    explanation:
      "next() returns current then increments via defer. It returns values while current <= max (1, then 2), and once current is 3 the guard fails and it returns nil.",
  },
  {
    id: "iterator-sequence-vs-iterator-mcq",
    type: "mcq",
    prompt: "What does conforming a type to Sequence add on top of IteratorProtocol?",
    options: [
      "A makeIterator() method, which is what lets the type be used directly in a for-in loop and unlocks map/filter/reduce for free",
      "Automatic stable sorting of all elements before the first for-in call so consumers always receive them in their natural comparison order",
      "Thread-safe concurrent iteration that allows multiple threads to call next() simultaneously on the same iterator without introducing data races or requiring external locking",
      "The ability to store elements out of order internally and retrieve them in any insertion-independent sequence of positions the caller specifies at runtime",
    ],
    answer: 0,
    explanation:
      "Sequence requires makeIterator() -> some IteratorProtocol. That single method is what makes for-in accept the type and gives you the standard library's generic Sequence-based functions like map, filter, and reduce.",
  },
  {
    id: "iterator-infinite-predict",
    type: "predict",
    prompt: "What happens when this runs?",
    code: `struct Fibonacci: Sequence, IteratorProtocol {
    var current = 0, next_ = 1
    mutating func next() -> Int? {
        defer { (current, next_) = (next_, current + next_) }
        return current
    }
}
for n in Fibonacci() {
    print(n)
}`,
    options: [
      "It loops forever — next() always returns a value, so there's no natural stopping point",
      "It prints 0, 1, 1, 2, 3, 5 and stops automatically when the values exceed Int.max",
      "It is a compile error because Sequence requires a finite, non-nil-terminating count property",
      "It prints only the first element, 0, because for-in calls next() exactly once on a self-conforming iterator",
    ],
    answer: 0,
    explanation:
      "Fibonacci's next() never returns nil, so the for-in loop never terminates on its own. Bounding it with something like .prefix(6) or a break is required.",
  },
  {
    id: "iterator-lazy-order-predict",
    type: "predict",
    prompt: "With .lazy inserted, in what order do the print statements fire?",
    code: `let result = [1, 2, 3, 4, 5]
    .lazy
    .map { n -> Int in print("map \\(n)"); return n * 2 }
    .filter { n -> Bool in print("filter \\(n)"); return n > 4 }
    .first!`,
    options: [
      "map 1, filter 2, map 2, filter 4, map 3, filter 6 — stops as soon as first finds a match",
      "map 1, map 2, map 3, map 4, map 5, then all five filter calls happen in a second pass",
      "filter runs before map for every element because filter is declared after map in the chain",
      "Nothing prints because .lazy suppresses side effects inside closures passed to map and filter",
    ],
    answer: 0,
    explanation:
      ".lazy processes one element through the whole chain before moving to the next, and stops entirely once first finds a value — unlike the eager version, which fully maps all five elements before filtering starts.",
  },
  {
    id: "iterator-lazy-benefits-multi",
    type: "multi",
    prompt: "Select all true statements about .lazy sequences.",
    options: [
      "It avoids building a full intermediate array at each step in a chain",
      "It re-evaluates the chain each time you iterate, rather than caching results",
      "It makes every algorithm asymptotically faster",
      "It's most valuable on large or unbounded sequences combined with something like first or prefix",
    ],
    answers: [0, 1, 3],
    explanation:
      ".lazy defers computation and avoids intermediate storage, and it recomputes on each iteration rather than caching — it's not a universal speedup, just a way to skip work you never needed, which matters most on large/unbounded sequences.",
  },
  {
    id: "iterator-single-pass-senior",
    type: "mcq",
    prompt: "Why can iterating the same Sequence value a second time sometimes fail to restart from the beginning?",
    options: [
      "Sequence is a single-pass abstraction by convention; some iterators (e.g. reading a file) carry state that isn't reset, so makeIterator() must explicitly restart it if a fresh pass is required",
      "Swift automatically caches the full result of the first pass and transparently replays those cached elements on every subsequent for-in call made to the same sequence value",
      "Sequence types are always reference-semantic classes under the hood, so any mutation made to the iterator during the first pass persists and corrupts the starting position for subsequent passes",
      "for-in silently converts every Sequence into a materialized Array before starting the first iteration, which fully consumes the original source sequence and makes a second pass over it impossible",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Sequence only guarantees you can walk it once. Whether a second for-in restarts cleanly depends entirely on whether makeIterator() produces a genuinely fresh iterator — for stateful sources like file streams, it may not, which is a common source of subtle bugs.",
  },
  {
    id: "iterator-flashcard",
    type: "flashcard",
    prompt:
      "Explain how for-in works under the hood, how to make a custom type iterable, and what .lazy changes. Answer aloud, then reveal.",
    modelAnswer:
      "`for-in` is sugar over two protocols. **`IteratorProtocol`** requires one method, `next() -> Element?`, which hands back elements one at a time and returns `nil` when exhausted. **`Sequence`** requires `makeIterator()`, returning a fresh `IteratorProtocol` value; `for-in` calls `makeIterator()` once, then calls `next()` in a loop until `nil`. Conforming to `Sequence` also unlocks the standard library's generic functions — `map`, `filter`, `reduce`, `contains` — for free, since they're written once against `Sequence` rather than per type. A type can conform to both protocols at once for computed, on-the-fly sequences (like an infinite Fibonacci generator), which never need a backing array but also never terminate on their own — they need `.prefix(_:)` or a `break`. `.lazy` wraps a chain of `map`/`filter`/etc. so each element flows through the *entire* chain before the next element starts, instead of each step eagerly building a full intermediate array; this avoids wasted work and lets consumers like `first` short-circuit the whole chain early, at the cost of re-running the chain on every fresh iteration rather than caching.",
    keyPoints: [
      "IteratorProtocol: next() -> Element?, nil means done",
      "Sequence: makeIterator() -> some IteratorProtocol; for-in is just a loop calling it",
      "Sequence conformance unlocks map/filter/reduce for free",
      "A type can be its own iterator for computed/infinite sequences (needs prefix/break)",
      ".lazy processes per-element through the whole chain, avoids intermediate arrays, doesn't cache",
    ],
    explanation:
      "A strong answer connects the two protocols precisely (which one requires next, which one requires makeIterator) and explains why .lazy changes evaluation order rather than just calling it 'more efficient'.",
  },
];

export default quiz;
