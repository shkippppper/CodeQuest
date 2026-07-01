import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "dict-subscript-type",
    type: "mcq",
    prompt: "What is the type of `ages[\"Ada\"]` given `let ages: [String: Int]`?",
    options: ["`Int`", "`Int?`", "`String`", "`[String: Int]`"],
    answer: 1,
    explanation:
      "A dictionary subscript returns an **optional** (`Int?`) because the key might not exist. That's why `ages[\"Ada\"]!` is risky — force-unwrapping a missing key crashes. Use `ages[\"Ada\", default: 0]` or `if let`.",
  },
  {
    id: "dict-missing-key",
    type: "predict",
    prompt: "What does this print?",
    code: `let scores = ["a": 1]
print(scores["b", default: 0])`,
    options: ["0", "nil", "1", "A runtime crash"],
    answer: 0,
    explanation:
      "The `default:` subscript returns the supplied default (`0`) when the key is missing, and it returns a **non-optional** value. Without the default, `scores[\"b\"]` would be `nil` and `scores[\"b\"]!` would crash.",
  },
  {
    id: "set-uniqueness",
    type: "predict",
    prompt: "What is printed?",
    code: `var seen: Set<Int> = [1, 2, 3]
seen.insert(2)
print(seen.count)`,
    options: ["3", "4", "2", "Compile error"],
    answer: 0,
    explanation:
      "A `Set` holds **unique** elements, so inserting `2` again is a no-op and the count stays `3`. `insert` even returns whether the element was newly added.",
  },
  {
    id: "reduce-fill",
    type: "fill",
    prompt: "Which higher-order function collapses a collection into a **single** value from an initial seed, e.g. summing `[1,2,3]` to `6`?",
    answers: ["reduce"],
    hint: "`[1,2,3].____(0, +)`",
    explanation:
      "`reduce(_:_:)` starts from a seed and combines each element into an accumulator — `nums.reduce(0, +)` sums them. `map` transforms element-by-element and `filter` selects a subset; neither collapses to one value.",
  },
  {
    id: "map-vs-filter",
    type: "predict",
    prompt: "What is the result?",
    code: `let n = [1, 2, 3, 4]
let r = n.filter { $0 % 2 == 0 }.map { $0 * 10 }
print(r)`,
    options: ["[20, 40]", "[10, 20, 30, 40]", "[2, 4]", "[20, 40, 60, 80]"],
    answer: 0,
    explanation:
      "`filter` keeps the evens `[2, 4]`, then `map` multiplies each by 10 → `[20, 40]`. Because collections are value types, each step returns a fresh array without mutating `n`.",
  },
  {
    id: "collection-choice-multi",
    type: "multi",
    prompt: "Select **all** situations where a `Set` is a better fit than an `Array`.",
    options: [
      "You need to preserve insertion order",
      "You need fast repeated 'have I seen this?' checks",
      "You must guarantee elements are unique",
      "You need to look elements up by index",
    ],
    answers: [1, 2],
    explanation:
      "`Set` gives O(1)-average membership tests and enforces uniqueness. It does **not** preserve order and has no index access — those call for an `Array`.",
  },
  {
    id: "array-value-semantics",
    type: "predict",
    prompt: "What does this print?",
    code: `var original = [1, 2, 3]
var copy = original
copy.append(4)
print(original.count)`,
    options: ["3", "4", "0", "A runtime crash"],
    answer: 0,
    explanation:
      "`Array` is a value type, so `var copy = original` makes an independent copy (via copy-on-write). Appending to `copy` leaves `original` at count `3`.",
  },
  {
    id: "cow-array-mutation",
    type: "predict",
    prompt: "With copy-on-write in mind, at which marked step does `copy` actually allocate its own buffer?",
    code: `var original = [1, 2, 3]
var copy = original   // (A) assign
_ = copy[0]           // (B) read
copy.append(4)        // (C) mutate`,
    options: ["At (C), the first mutation", "At (A), the assignment", "At (B), the read", "Never — they share forever"],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Copy-on-write shares the buffer on assignment (A); reads (B) are free. The buffer is duplicated only at the first **mutation** (C), when the runtime sees it isn't uniquely referenced. That's why passing large arrays around is O(1) until someone writes.",
  },
  {
    id: "hashable-contract",
    type: "mcq",
    prompt: "You hand-write `Hashable` for a custom type used as a `Set` element. Which rule must hold or the Set can silently 'lose' elements?",
    options: [
      "If `a == b`, then `a` and `b` must hash to the same value",
      "Every distinct value must hash to a unique value",
      "`hash(into:)` must combine every stored property",
      "The type must be a class",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The contract: equal values (`==`) MUST produce equal hashes. Break it and a `Set`/`Dictionary` may fail to find an element it contains. Hashes need not be unique (collisions are expected), you only hash the properties used in `==`, and value types are fine as keys.",
  },
  {
    id: "reduce-into-perf",
    type: "mcq",
    prompt: "Why is `reduce(into:_:)` usually preferred over `reduce(_:_:)` when the result is itself a collection (e.g. grouping into a dictionary)?",
    options: [
      "It passes the accumulator `inout`, mutating one collection in place instead of copying a new one each step",
      "It runs the closure across multiple threads",
      "It is lazy and only computes on demand",
      "It guarantees an ordering that `reduce` does not",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`reduce(into:)` hands the accumulator as `inout`, so you mutate a single collection in place (uniquely referenced under COW) rather than returning a fresh copy per element. That turns an accidental O(n²) into O(n) for building dictionaries/arrays.",
  },
  {
    id: "collections-flashcard",
    type: "flashcard",
    prompt:
      "How would you explain when to use Array vs Set vs Dictionary, and what makes their lookups fast or slow? Answer aloud, then reveal.",
    modelAnswer:
      "**Array** is ordered, allows duplicates, O(1) index access but O(n) `contains`. **Set** is unordered, unique, `Hashable` elements, O(1)-average membership and set algebra (union/intersection). **Dictionary** maps unique `Hashable` keys to values with O(1)-average lookup/insert/delete, and its subscript returns an **optional**. All three are value types with copy-on-write, so copies are cheap until mutation. Rule of thumb: order/duplicates → Array; uniqueness/membership → Set; key lookup → Dictionary. If you call `array.contains` in a loop, switch to a Set.",
    keyPoints: [
      "Array: ordered, duplicates, O(1) index / O(n) contains",
      "Set: unique, Hashable, O(1)-avg membership, no order",
      "Dictionary: key→value, O(1)-avg, subscript returns optional",
      "All value types with copy-on-write",
      "contains-in-a-loop is the tell to switch Array→Set",
    ],
    explanation:
      "A strong answer ties each collection to its complexity and to a concrete decision rule, and mentions the optional dictionary subscript plus the `Hashable` requirement.",
  },
];

export default quiz;
