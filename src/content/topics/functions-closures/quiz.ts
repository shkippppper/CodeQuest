import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "argument-label-underscore",
    type: "mcq",
    prompt: "What does the `_` do in `func log(_ message: String)`?",
    options: [
      "Omits the argument label, so you call `log(\"hi\")` with no label",
      "Makes the parameter optional",
      "Marks the parameter as unused",
      "Gives the parameter a default value",
    ],
    answer: 0,
    explanation:
      "`_` removes the **argument label** at the call site, so you write `log(\"hi\")` instead of `log(message: \"hi\")`. The parameter is still named `message` inside the body.",
  },
  {
    id: "inout-basics",
    type: "predict",
    prompt: "What is printed?",
    code: `func double(_ x: inout Int) { x *= 2 }
var n = 5
double(&n)
print(n)`,
    options: ["10", "5", "0", "Compile error"],
    answer: 0,
    explanation:
      "`inout` lets the function write back into the caller's variable (passed with `&`). `double` sets `x` to `10`, which is copied back to `n` on return.",
  },
  {
    id: "shorthand-args",
    type: "predict",
    prompt: "What does this produce?",
    code: `let r = [1, 2, 3].map { $0 * 10 }
print(r)`,
    options: ["[10, 20, 30]", "[1, 2, 3]", "[$0, $0, $0]", "Compile error"],
    answer: 0,
    explanation:
      "`$0` is the shorthand name for the closure's first argument, and a single-expression closure returns implicitly. So each element is multiplied by 10 → `[10, 20, 30]`.",
  },
  {
    id: "escaping-fill",
    type: "fill",
    prompt: "Which attribute must you add to a closure parameter that you store in a property or run asynchronously (i.e. it outlives the function call)?",
    answers: ["@escaping", "escaping"],
    hint: "Starts with @ — it 'escapes' the function's lifetime.",
    explanation:
      "`@escaping` marks a closure that outlives the call. The default is **non-escaping** — the closure must be used before the function returns, so it can't be stored and can't create a retain cycle.",
  },
  {
    id: "capture-by-reference",
    type: "predict",
    prompt: "What does this print?",
    code: `func makeCounter() -> () -> Int {
    var count = 0
    return { count += 1; return count }
}
let next = makeCounter()
print(next(), next())`,
    options: ["1 2", "1 1", "0 0", "2 2"],
    answer: 0,
    explanation:
      "The closure **captures `count` by reference**, so `count` lives on between calls. First call → `1`, second → `2`. This is why captured state persists.",
  },
  {
    id: "default-parameter",
    type: "predict",
    prompt: "Given `func connect(timeout: Int = 30, retries: Int = 3)`, what is `timeout` after calling `connect(retries: 5)`?",
    code: `func connect(timeout: Int = 30, retries: Int = 3) {
    print(timeout, retries)
}
connect(retries: 5)`,
    options: ["30 5", "0 5", "30 3", "Compile error"],
    answer: 0,
    explanation:
      "Default values fill in any omitted argument. `connect(retries: 5)` keeps `timeout` at its default `30` and sets `retries` to `5` → prints `30 5`.",
  },
  {
    id: "closures-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about Swift closures.",
    options: [
      "A trailing closure can be written outside the call's parentheses when it's the last argument",
      "Closures capture referenced variables by reference by default",
      "Non-escaping closures can be stored for later execution",
      "A function name can be passed where a closure is expected",
    ],
    answers: [0, 1, 3],
    explanation:
      "Trailing-closure syntax, capture-by-reference, and passing function values are all real. But a **non-escaping** closure specifically cannot be stored — storing it requires `@escaping` (option 3 is false).",
  },
  {
    id: "escaping-self-cycle-senior",
    type: "mcq",
    prompt: "Why does the compiler force you to write `self.` explicitly inside an `@escaping` closure?",
    options: [
      "To flag that the closure captures `self` strongly and may create a retain cycle",
      "Because `self` is otherwise undefined in closures",
      "It's a stylistic rule with no semantic meaning",
      "To make the closure run on the main thread",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "An escaping closure that captures `self` keeps it alive; if `self` also owns the closure, you get a **retain cycle**. The explicit `self.` is a deliberate nudge to make that capture visible — the usual fix is `[weak self]` or `[unowned self]`.",
  },
  {
    id: "capture-list-value-senior",
    type: "predict",
    prompt: "What does this print?",
    code: `var x = 1
let printByValue = { [x] in print(x) }
let printByRef = { print(x) }
x = 99
printByValue()
printByRef()`,
    options: ["1, then 99", "99, then 99", "1, then 1", "99, then 1"],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`[x]` in the capture list snapshots `x` **by value** at closure-creation time (`1`). The other closure captures `x` by reference and sees the later mutation (`99`). So it prints `1` then `99` — capture lists let you freeze a value.",
  },
  {
    id: "inout-not-reference-senior",
    type: "mcq",
    prompt: "Which best describes how `inout` parameters work?",
    options: [
      "Copy-in at call, copy-out (write-back) when the function returns",
      "A live pointer — every write is instantly visible to the caller mid-call",
      "A read-only reference to the caller's value",
      "The same as passing a class instance",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`inout` is **copy-in / copy-out**: the value is copied in, the function mutates its local copy, and the result is written back to the caller's variable on return. It is *not* guaranteed to be a live reference during the call — which matters if the same variable is aliased.",
  },
  {
    id: "functions-closures-flashcard",
    type: "flashcard",
    prompt:
      "Explain escaping vs non-escaping closures and how capture interacts with retain cycles. Answer aloud, then reveal.",
    modelAnswer:
      "A **non-escaping** closure (the default) is guaranteed to run — or not — before the function returns; it can't be stored, so it can't outlive the call and can't create a retain cycle, and it's cheaper. An **`@escaping`** closure can outlive the call: stored in a property or dispatched asynchronously. Closures **capture by reference**, so an escaping closure that captures `self` (a class) keeps it alive; if `self` also holds a reference to that closure, they keep each other alive — a retain cycle / leak. You break it with a capture list: `[weak self]` (optional, safe) or `[unowned self]` (non-optional, crashes if `self` is gone). That's why the compiler makes `self.` explicit inside escaping closures.",
    keyPoints: [
      "Non-escaping = default, can't be stored, no cycle risk, cheaper",
      "@escaping = outlives the call (stored / async)",
      "Closures capture by reference",
      "Escaping + captured self → retain cycle",
      "Fix with [weak self] / [unowned self] capture list",
    ],
    explanation:
      "The senior signal is connecting escaping + by-reference capture of `self` to retain cycles, and knowing the `[weak self]`/`[unowned self]` fix plus why the explicit `self.` requirement exists.",
  },
];

export default quiz;
