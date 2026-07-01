import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "switch-exhaustive",
    type: "mcq",
    prompt: "You `switch` over an enum and handle every case explicitly. Do you need a `default`?",
    options: [
      "No — an exhaustive switch needs no `default`",
      "Yes — every switch requires a `default`",
      "Only if the enum has associated values",
      "Only in release builds",
    ],
    answer: 0,
    explanation:
      "If you cover every case, the switch is **exhaustive** and no `default` is needed. Better: omitting `default` means adding a new case later produces a compile error at every switch you must update.",
  },
  {
    id: "no-fallthrough",
    type: "predict",
    prompt: "What does this print?",
    code: `let n = 1
switch n {
case 1:
    print("one")
case 2:
    print("two")
default:
    print("other")
}`,
    options: ["one", "one, then two", "one, two, other", "Compile error"],
    answer: 0,
    explanation:
      "Swift has **no implicit fall-through** — a matched case runs and the switch ends. It prints just `one`. You'd need an explicit `fallthrough` keyword to continue into the next case.",
  },
  {
    id: "guard-must-exit",
    type: "mcq",
    prompt: "What must the `else` block of a `guard` statement do?",
    options: [
      "Transfer control out of the current scope (return / throw / break / continue)",
      "Assign a default value",
      "Nothing — it's optional",
      "Call `fatalError()`",
    ],
    answer: 0,
    explanation:
      "A `guard`'s `else` **must** leave the current scope. In exchange, any values it unwraps stay in scope for the rest of the function — that's what makes `guard` great for early validation.",
  },
  {
    id: "range-match",
    type: "predict",
    prompt: "What is printed?",
    code: `let status = 404
switch status {
case 200..<300: print("success")
case 400..<500: print("client error")
default: print("other")
}`,
    options: ["client error", "success", "other", "Compile error"],
    answer: 0,
    explanation:
      "`switch` matches **ranges**, not just single values. `404` falls in `400..<500`, so it prints `client error`. Range matching is one of the things a C-style switch can't do.",
  },
  {
    id: "where-clause-fill",
    type: "fill",
    prompt: "Which keyword attaches an extra condition to a pattern, so a `case` (or `for` loop element) matches only when it's also true?",
    answers: ["where"],
    hint: "`case let (x, y) ____ x == y:`",
    explanation:
      "`where` refines a pattern with a boolean condition. It works in `switch` cases and to filter `for` loops: `for n in nums where n > 0`.",
  },
  {
    id: "if-case-binding",
    type: "predict",
    prompt: "What does this print?",
    code: `enum Result { case ok(Int); case fail }
let r = Result.ok(5)
if case let .ok(value) = r {
    print(value)
} else {
    print("none")
}`,
    options: ["5", "ok", "none", "Compile error"],
    answer: 0,
    explanation:
      "`if case let .ok(value) = r` matches just the `.ok` case and binds its associated value to `value`, printing `5`. `if case` is the lightweight alternative to a full `switch` when you care about one case.",
  },
  {
    id: "labeled-break-multi",
    type: "multi",
    prompt: "Select **all** true statements about Swift control flow.",
    options: [
      "`switch` supports matching tuples, ranges, and enum associated values",
      "A labeled `break` can exit an outer loop from inside a nested one",
      "`if` conditions can be any 'truthy' value like `0` or `nil`",
      "`repeat-while` runs its body at least once",
    ],
    answers: [0, 1, 3],
    explanation:
      "Switches pattern-match structure, labels let you break the outer loop, and `repeat-while` always runs once before testing. But `if` requires a real `Bool` — Swift has **no** truthiness, so `if 0` doesn't compile.",
  },
  {
    id: "for-case-filter",
    type: "predict",
    prompt: "What does this print?",
    code: `let items: [Int?] = [1, nil, 2]
for case let x? in items where x > 1 {
    print(x)
}`,
    options: ["2", "1 and 2", "1, nil, 2", "Compile error"],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Two filters compose: `case let x?` matches only non-`nil` elements (unwrapping them), and `where x > 1` keeps only those above 1. Only `2` survives both, so it prints `2`.",
  },
  {
    id: "switch-value-binding-where-senior",
    type: "predict",
    prompt: "What is printed?",
    code: `let point = (3, 3)
switch point {
case let (x, y) where x == y:
    print("diagonal")
case (let x, _) where x > 5:
    print("far right")
default:
    print("elsewhere")
}`,
    options: ["diagonal", "far right", "elsewhere", "Compile error"],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Cases are tried top-down. `let (x, y) where x == y` binds `x = 3, y = 3` and the `where` holds (`3 == 3`), so the first case wins and prints `diagonal`. Value binding plus `where` is Swift pattern matching at full power.",
  },
  {
    id: "fallthrough-senior",
    type: "predict",
    prompt: "What does this print?",
    code: `switch 1 {
case 1:
    print("a")
    fallthrough
case 2:
    print("b")
default:
    print("c")
}`,
    options: ["a, then b", "a", "a, b, c", "b"],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`fallthrough` forces control into the **next** case's body unconditionally (without re-checking its pattern). So after printing `a`, it falls into `case 2` and prints `b`, then stops. It does not continue into `default`.",
  },
  {
    id: "control-flow-fallthrough-binding-trick",
    type: "predict",
    prompt: "🧠 Trick question — does this compile?",
    code: `enum E { case a(Int); case b(Int) }
func f(_ v: E) {
    switch v {
    case .a(let x):
        print(x)
        fallthrough
    case .b(let y):
        print(y)
    }
}`,
    options: [
      "No — fallthrough can't enter a case that binds a new variable",
      "Yes — it prints both x and y",
      "No — enums can't use fallthrough",
      "Yes — but only .a runs",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`fallthrough` jumps into the next case's body *without* running its pattern, so the binding `let y` would never be assigned. Swift therefore forbids falling through into a case that declares value bindings — a rule almost nobody remembers until the compiler complains.",
  },
  {
    id: "control-flow-flashcard",
    type: "flashcard",
    prompt:
      "How is a Swift `switch` more than a C `switch`, and why is exhaustiveness a feature rather than a nuisance? Answer aloud, then reveal.",
    modelAnswer:
      "A Swift `switch` is a **pattern-matching** engine: it matches tuples, ranges, enum cases with associated values, binds pieces with `case let`, and refines matches with `where`. It has **no implicit fall-through** (each case ends on its own; use `fallthrough` to opt in) and it must be **exhaustive**. Exhaustiveness is a refactoring safety net: because you must handle every case, adding a new enum case turns every switch you forgot into a compile error, pointing you at exactly the code to update — the compiler does the 'find all the places' work for you.",
    keyPoints: [
      "Matches tuples, ranges, associated values — not just equality",
      "`case let` binds; `where` adds conditions",
      "No implicit fall-through (opt in with `fallthrough`)",
      "Exhaustive → new case = compile errors guiding the update",
      "`if case` / `for case` for single-case checks",
    ],
    explanation:
      "Strong answers frame exhaustiveness as compiler-assisted refactoring safety and mention pattern matching (ranges, tuples, `where`, associated-value binding) rather than treating `switch` as a glorified `if`-chain.",
  },
];

export default quiz;
