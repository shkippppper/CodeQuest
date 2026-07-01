import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "error-protocol",
    type: "mcq",
    prompt: "What must a custom type do to be thrown as a Swift error?",
    options: [
      "Conform to the `Error` protocol",
      "Subclass `NSError`",
      "Be an enum",
      "Override `throw()`",
    ],
    answer: 0,
    explanation:
      "Any type that conforms to the (empty) **`Error`** protocol can be thrown. Enums are idiomatic, but structs and classes work too — no `NSError` subclassing required.",
  },
  {
    id: "try-optional",
    type: "predict",
    prompt: "What is the type of `x`?",
    code: `func load() throws -> Int { return 1 }
let x = try? load()`,
    options: ["`Int?`", "`Int`", "`Result<Int, Error>`", "Compile error"],
    answer: 0,
    explanation:
      "`try?` converts a throwing call into an **optional**: success gives `.some`, any thrown error gives `nil`. So `x` is `Int?`. It discards *which* error occurred.",
  },
  {
    id: "try-bang-crash",
    type: "mcq",
    prompt: "What happens if a call marked `try!` actually throws at runtime?",
    options: [
      "The app traps (crashes)",
      "It returns nil",
      "The error is silently ignored",
      "It's caught by the nearest do/catch",
    ],
    answer: 0,
    explanation:
      "`try!` asserts the call won't throw. If it does, the program **traps** — just like force-unwrapping a `nil`. Use it only when a throw is genuinely impossible.",
  },
  {
    id: "defer-order",
    type: "predict",
    prompt: "What does this print?",
    code: `func f() {
    defer { print("A") }
    defer { print("B") }
    print("body")
}
f()`,
    options: ["body, B, A", "body, A, B", "A, B, body", "B, A, body"],
    answer: 0,
    explanation:
      "`defer` blocks run as the scope exits, in **reverse** registration order (LIFO). The body prints first, then `B` (last registered), then `A`.",
  },
  {
    id: "defer-fill",
    type: "fill",
    prompt: "Which keyword schedules a block to run when the current scope exits — whether it returns normally or throws?",
    answers: ["defer"],
    hint: "5 letters — you 'defer' the cleanup.",
    explanation:
      "`defer` guarantees cleanup on every exit path (return, throw, break). Multiple defers run last-in-first-out.",
  },
  {
    id: "catch-binding",
    type: "predict",
    prompt: "What does this print?",
    code: `enum E: Error { case bad(Int) }
func g() throws { throw E.bad(7) }
do {
    try g()
} catch E.bad(let n) {
    print("bad \\(n)")
} catch {
    print("other")
}`,
    options: ["bad 7", "other", "7", "Compile error"],
    answer: 0,
    explanation:
      "`catch` clauses pattern-match like `switch`. `E.bad(let n)` matches the thrown case and binds `n = 7`, printing `bad 7`. A bare `catch` would only run if no earlier pattern matched.",
  },
  {
    id: "error-handling-truths-multi",
    type: "multi",
    prompt: "Select **all** correct statements about Swift error handling.",
    options: [
      "Every call to a `throws` function must be marked with `try` (or a variant)",
      "`try?` collapses any thrown error into `nil`",
      "`defer` blocks run in the order they were written (first to last)",
      "`Result<Success, Failure>` represents a value-or-error as a value",
    ],
    answers: [0, 1, 3],
    explanation:
      "`try` is mandatory at throwing call sites, `try?` yields an optional, and `Result` is the value-form of throwing. But `defer` runs in **reverse** (LIFO) order, so option 3 is false.",
  },
  {
    id: "error-vs-optional-senior",
    type: "mcq",
    prompt: "You're designing an API. When is a **thrown error** the better choice over returning an optional?",
    options: [
      "When the failure has multiple causes or detail the caller may want to inspect or report",
      "Whenever a function can fail for any reason",
      "Only inside UIKit code",
      "When you want the failure to crash the app",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Use an **optional** for single-reason absence with no detail (a missing key). Use a **thrown error** when there are multiple failure modes or the caller needs the reason (parsing, I/O). Reserve **traps/`fatalError`** for programmer bugs / impossible states — not recoverable runtime failures.",
  },
  {
    id: "result-bridge-senior",
    type: "mcq",
    prompt: "How do you convert a throwing call into a `Result`, and a `Result` back into the throwing world?",
    options: [
      "`Result(catching: { try f() })` to wrap; `try result.get()` to unwrap",
      "`Result(f())` and `result!`",
      "`try Result(f())` and `result.value`",
      "You can't bridge between them",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Result(catching:)` runs a throwing closure and captures success or failure; `result.get()` throws the stored error or returns the value. This lets you move between the value-based `Result` world and the `throws` world freely.",
  },
  {
    id: "rethrows-senior",
    type: "mcq",
    prompt: "What does marking a function `rethrows` (instead of `throws`) communicate?",
    options: [
      "It only throws if one of its closure arguments throws — it adds no errors of its own",
      "It re-throws the same error twice",
      "It converts all errors to optionals",
      "It can only be called from a throwing context",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`rethrows` means the function throws **only** when a closure passed to it throws. This lets higher-order functions like `map`/`filter` be called without `try` when given a non-throwing closure, but propagate errors when given a throwing one — the best of both.",
  },
  {
    id: "error-try-optional-flatten-trick",
    type: "mcq",
    prompt: "🧠 Trick question — for `func f() throws -> Int?`, what is the type of `let x = try? f()` in Swift 5+?",
    options: [
      "`Int?` — `try?` no longer adds an extra optional layer",
      "`Int??` — a double optional",
      "`Int` — non-optional",
      "`Result<Int?, Error>`",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Before Swift 5, `try?` on a function returning `Int?` produced `Int??`. Swift 5 changed it to **flatten**, so you get a single `Int?` — `nil` for either a thrown error or a returned `nil`. A subtle, version-dependent gotcha that still catches people who learned pre-Swift-5.",
  },
  {
    id: "error-handling-flashcard",
    type: "flashcard",
    prompt:
      "When do you reach for an optional, a thrown error, or a crash to model failure? And what do try?/try!/do-catch each give you? Answer aloud, then reveal.",
    modelAnswer:
      "**Optional** for absence with a single obvious reason and no detail needed (missing key) — no error type, no `try`. **Thrown error** for recoverable failures with multiple causes or detail the caller may inspect/report (I/O, parsing, networking). **Trap / `fatalError`** only for programmer bugs or truly impossible states, never for expected runtime failure. For consuming a throwing call: **`do/catch`** when you want to inspect and react to the specific error; **`try?`** when you only care success/failure and are happy collapsing every error to `nil`; **`try!`** only when a throw is genuinely impossible (it traps otherwise). And `defer` guarantees cleanup on every exit path (reverse order); `Result` is the value-form, bridged with `Result(catching:)` and `.get()`.",
    keyPoints: [
      "Optional = single-reason absence; error = recoverable w/ detail; trap = programmer bug",
      "do/catch to inspect the error; try? for nil-on-fail; try! traps",
      "defer runs on every exit, reverse (LIFO) order",
      "Result is the value-form of throwing; bridge via catching/.get()",
      "rethrows: throws only if a closure arg throws",
    ],
    explanation:
      "Senior answers frame the optional/error/crash choice by *why* the failure happens, and correctly separate try?/try!/do-catch by intent rather than treating them as interchangeable.",
  },
];

export default quiz;
