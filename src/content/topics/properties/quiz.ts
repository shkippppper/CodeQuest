import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "computed-must-be-var",
    type: "mcq",
    prompt: "Why must a read-only computed property be declared with `var`, not `let`?",
    options: [
      "Because its returned value can differ between accesses — it's recomputed each time",
      "Because `let` isn't allowed inside structs at all — only classes permit constant stored properties",
      "Because computed properties need storage",
      "It's a naming convention only",
    ],
    answer: 0,
    explanation:
      "A computed property has no storage; it runs its `get` on every access and can return different values as its inputs change, so Swift models it as `var` even when read-only.",
  },
  {
    id: "computed-area",
    type: "predict",
    prompt: "What is printed?",
    code: `struct Rect { var w: Double; var h: Double
    var area: Double { w * h }
}
var r = Rect(w: 2, h: 3)
r.w = 5
print(r.area)`,
    options: ["15", "6", "10", "Compile error"],
    answer: 0,
    explanation:
      "`area` is **computed** from `w` and `h` on each read. After `r.w = 5`, `area` recomputes `5 * 3 = 15`. Derived values via computed properties can't get out of sync with their inputs.",
  },
  {
    id: "didset-oldvalue",
    type: "predict",
    prompt: "What does this print?",
    code: `class C { var x = 0 { didSet { print(oldValue, x) } } }
let c = C()
c.x = 7`,
    options: ["0 7", "7 0", "7 7", "0 0"],
    answer: 0,
    explanation:
      "`didSet` runs after the change with `oldValue` available. The old value was `0`, the new `x` is `7`, so it prints `0 7`. (`willSet` would give you `newValue` instead.)",
  },
  {
    id: "observers-not-in-init",
    type: "mcq",
    prompt: "When are `willSet` / `didSet` observers NOT triggered?",
    options: [
      "During the property's own initialization",
      "When the property is a `let`",
      "When set from outside the type",
      "They always trigger on every single assignment without exception",
    ],
    answer: 0,
    explanation:
      "Observers fire on changes *after* initialization, never during `init`. (Also, assigning inside `didSet` does not re-trigger the observer, so there's no infinite loop.)",
  },
  {
    id: "lazy-fill",
    type: "fill",
    prompt: "Which keyword makes a stored property defer its initialization until the first time it is accessed?",
    answers: ["lazy"],
    hint: "5 letters — the opposite of eager.",
    explanation:
      "`lazy` defers the initializer until first access and caches the result. It must be `var`, runs once, and is **not** thread-safe.",
  },
  {
    id: "static-type-property",
    type: "predict",
    prompt: "What is printed?",
    code: `struct Counter { static var total = 0 }
Counter.total += 1
Counter.total += 1
print(Counter.total)`,
    options: ["2", "1", "0", "Compile error"],
    answer: 0,
    explanation:
      "`static var total` belongs to the **type**, not an instance — there's one shared value. Both increments hit the same storage, so it prints `2`.",
  },
  {
    id: "properties-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about Swift properties.",
    options: [
      "A computed property runs its getter on every access",
      "`lazy` properties are initialized once and cached",
      "Property observers fire during `init`",
      "`static let` on a type is initialized once, lazily and thread-safely",
    ],
    answers: [0, 1, 3],
    explanation:
      "Computed getters run each access, `lazy` caches after first use, and `static let` is a guaranteed once/lazy/thread-safe init (the singleton idiom). Observers do **not** fire during `init`, so option 3 is false.",
  },
  {
    id: "lazy-not-threadsafe-senior",
    type: "mcq",
    prompt: "Why is a plain `lazy var` a poor choice for a shared singleton accessed from multiple threads?",
    options: [
      "`lazy` is not thread-safe — racing first accesses can run the initializer more than once",
      "`lazy` can never be accessed from a background thread because Swift restricts it to the main actor",
      "`lazy` recomputes on every access, making it identical to a computed property at runtime",
      "`lazy` requires a computed getter",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`lazy` has no synchronization: two threads hitting the first access simultaneously can both run the initializer. The thread-safe, init-once idiom is `static let shared = ...`, which the runtime guarantees runs exactly once.",
  },
  {
    id: "didset-struct-array-senior",
    type: "predict",
    prompt: "How many times does `didSet` fire here?",
    code: `struct Model { var items: [Int] = [] { didSet { print("changed") } } }
var m = Model()
m.items.append(1)
m.items[0] = 9`,
    options: ["Twice", "Once", "Zero times", "Three times"],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`items` is a value-type array, so **mutating** it (append, subscript-set) counts as writing the whole property — each of `append(1)` and `items[0] = 9` triggers `didSet`. This surprises people: in-place mutation of a value-type property is still a 'set'.",
  },
  {
    id: "computed-vs-lazy-senior",
    type: "mcq",
    prompt: "You have an expensive value derived from other stored properties that change over time. Computed property or `lazy`?",
    options: [
      "Computed — it stays correct as inputs change; `lazy` would cache a stale value",
      "`lazy` — caching is always cheaper regardless of whether the inputs change over time",
      "Either behaves identically",
      "Neither can depend on other stored properties of the same type",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`lazy` computes **once** and caches, so if the inputs later change, the cached value goes stale. A **computed** property recomputes on each access and stays correct. Use `lazy` only when the value is a one-time setup that won't need to change; otherwise compute (and cache manually if the cost demands it).",
  },
  {
    id: "properties-inout-computed-trick",
    type: "predict",
    prompt: "🧠 Trick question — what prints when `bump(&b.value)` runs?",
    code: `struct Box {
    var backing = 0
    var value: Int {
        get { print("get"); return backing }
        set { print("set"); backing = newValue }
    }
}
func bump(_ n: inout Int) { n += 1 }
var b = Box()
bump(&b.value)`,
    options: [
      "get, then set (copy-in / copy-out)",
      "Only get",
      "Only set",
      "Neither — computed properties can't be inout",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Passing a **computed** property as `inout` uses copy-in/copy-out: Swift calls the getter to read the value in, mutates the local copy, then calls the setter to write it back. So you see `get` then `set`. It surprises people who assume `inout` needs direct storage.",
  },
  {
    id: "properties-flashcard",
    type: "flashcard",
    prompt:
      "Walk through the kinds of Swift properties and when you'd choose each. Answer aloud, then reveal.",
    modelAnswer:
      "**Stored** properties hold state in the instance (structs & classes). **Computed** properties have no storage — they run a getter (and optional setter) each access; use them for values *derived* from other properties so they can't drift. **Observers** (`willSet`/`didSet`) run code around changes to a stored property (not during `init`, and no recursion when set inside `didSet`). **`lazy`** defers a stored property's init until first access and caches it — `var` only, runs once, not thread-safe. **Type properties** (`static`/`class`) belong to the type, shared across instances; `static let` is the thread-safe, init-once singleton idiom. Choose stored for independent state, computed for derived values, `lazy` for one-time expensive setup, observers for reacting to change.",
    keyPoints: [
      "Stored = state; Computed = derived (getter each access)",
      "Observers fire around changes, not during init",
      "lazy = deferred, cached-once, var-only, not thread-safe",
      "static/class = type-level shared; static let = safe singleton",
      "Computed stays fresh; lazy can go stale",
    ],
    explanation:
      "Senior answers contrast computed (always fresh) vs lazy (cached, can go stale), and flag that value-type property mutation triggers `didSet` and that `lazy` isn't thread-safe.",
  },
];

export default quiz;
