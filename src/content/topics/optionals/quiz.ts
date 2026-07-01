import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "what-is-optional",
    type: "mcq",
    prompt: "Under the hood, what is the type `String?` in Swift?",
    options: [
      "A pointer that may be null",
      "`Optional<String>` — an enum with `.some` and `.none` cases",
      "A `String` initialised to an empty string",
      "A special compiler-only type with no runtime representation",
    ],
    answer: 1,
    explanation:
      "`String?` is sugar for `Optional<String>`, an `enum` with `case none` (written `nil`) and `case some(Wrapped)`. There's no null pointer — it's an ordinary value-type wrapper.",
  },
  {
    id: "chaining-nil",
    type: "predict",
    prompt: "What does this print?",
    code: `struct Pet { var name: String }
let pet: Pet? = nil
print(pet?.name ?? "none")`,
    options: ["none", "nil", `Optional("none")`, "Runtime crash"],
    answer: 0,
    explanation:
      "`pet` is `nil`, so optional chaining `pet?.name` short-circuits to `nil` (type `String?`). The `?? \"none\"` then supplies the default, giving the plain string `none`.",
  },
  {
    id: "force-unwrap-dict",
    type: "predict",
    prompt: "What happens when this runs?",
    code: `let scores: [String: Int] = ["a": 1]
print(scores["b"]!)`,
    options: ["0", "nil", "A runtime crash", "An empty line"],
    answer: 2,
    explanation:
      "A dictionary subscript returns an optional. The key `\"b\"` is missing, so the lookup is `nil`, and force-unwrapping `nil` with `!` traps at runtime: *unexpectedly found nil while unwrapping*. Use `??` or `if let` instead.",
  },
  {
    id: "guard-keyword",
    type: "fill",
    prompt:
      "Which keyword unwraps an optional and **exits the current scope** if it is `nil`, keeping the unwrapped value available for the rest of the function?",
    answers: ["guard"],
    hint: "It's paired with `let` and is the idiomatic way to validate inputs at the top of a function.",
    explanation:
      "`guard let name else { return }` unwraps `name` and bails out early on `nil`. Unlike `if let`, the unwrapped value stays in scope for the remainder of the function, which keeps the happy path un-indented.",
  },
  {
    id: "coalescing-operator",
    type: "fill",
    prompt: "Type the exact operator that provides a default value when an optional is `nil`.",
    answers: ["??"],
    hint: "Two identical characters.",
    explanation: "The nil-coalescing operator `??` returns the wrapped value if present, otherwise the right-hand default. The result is non-optional.",
  },
  {
    id: "iflet-vs-guard",
    type: "mcq",
    prompt: "Which statement about `if let` versus `guard let` is correct?",
    options: [
      "They are identical; `guard` is just older syntax",
      "`if let` exits the function on failure; `guard let` does not",
      "`guard let` keeps the unwrapped value in scope after the statement; `if let` confines it to its block",
      "Only `if let` can unwrap multiple optionals at once",
    ],
    answer: 2,
    explanation:
      "Both unwrap optionals. `if let` scopes the value to its `{ }` block. `guard let` requires an early exit on the `nil` path (`return`/`throw`/`break`/`continue`) and, in exchange, keeps the unwrapped value usable for the rest of the enclosing scope.",
  },
  {
    id: "chain-count",
    type: "predict",
    prompt: "What is printed?",
    code: `let s: String? = "hello"
print(s?.count ?? -1)`,
    options: ["5", "-1", `Optional(5)`, "nil"],
    answer: 0,
    explanation:
      "`s` holds a value, so `s?.count` is `Optional(5)`. `?? -1` unwraps it to `5`. The default `-1` would only appear if `s` were `nil`.",
  },
  {
    id: "optional-truths-multi",
    type: "multi",
    prompt: "Select **all** statements about Swift optionals that are correct.",
    options: [
      "`T?` is shorthand for `Optional<T>`",
      "`Optional` is an enum with `.some` and `.none` cases",
      "A non-optional `Int` can hold `nil`",
      "`if let` and `guard let` both unwrap optionals",
    ],
    answers: [0, 1, 3],
    explanation:
      "`T?` is sugar for the `Optional<T>` enum (`.some`/`.none`), and both `if let` and `guard let` unwrap it. A **non-optional** type can never hold `nil` — that is the entire point of optionals, so option 3 is false.",
  },
  {
    id: "explain-optionals-flashcard",
    type: "flashcard",
    prompt:
      "In an interview, how would you explain what an optional is and why Swift has them? Answer out loud, then reveal.",
    modelAnswer:
      "An **optional** represents a value that may be present or absent. `T?` is sugar for `Optional<T>`, an enum with `.some(value)` and `.none` (`nil`). Swift makes absence explicit in the type system: ordinary types can never be `nil`, so you must consciously opt into nullability and then handle it before use. This turns an entire class of null-pointer runtime crashes into compile-time errors.",
    keyPoints: [
      "It's an `enum`: `.some` / `.none` — not a null pointer",
      "`T?` == `Optional<T>`",
      "Absence is encoded in the type system",
      "Converts runtime null crashes into compile-time checks",
      "Bonus: mention Tony Hoare's \"billion-dollar mistake\"",
    ],
    explanation:
      "Strong answers name the underlying enum and frame optionals as a *safety* feature, not just syntax. Mentioning that the compiler forces handling of `nil` shows you understand the 'why', which is what mid/senior interviewers probe for.",
  },
];

export default quiz;
