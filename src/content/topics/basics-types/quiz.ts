import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "let-reassign",
    type: "predict",
    prompt: "What happens with this code?",
    code: `let limit = 10
limit = 20
print(limit)`,
    options: ["Compile error — cannot assign to a `let`", "Prints 20", "Prints 10", "Runtime crash"],
    answer: 0,
    explanation:
      "`let` declares a constant, so reassigning `limit` is a **compile-time** error, not a runtime one. Use `var` if the value must change.",
  },
  {
    id: "literal-default-type",
    type: "mcq",
    prompt: "What type does Swift infer for `let x = 9.99`?",
    options: ["`Float`", "`Double`", "`Decimal`", "`CGFloat`"],
    answer: 1,
    explanation:
      "A floating-point literal infers to **`Double`**, never `Float`. Likewise an integer literal infers to `Int`. If you want `Float` you must annotate it explicitly.",
  },
  {
    id: "int-conversion-truncates",
    type: "predict",
    prompt: "What is printed?",
    code: `let d = 3.9
print(Int(d))`,
    options: ["3", "4", "3.9", "Compile error"],
    answer: 0,
    explanation:
      "`Int(_:)` **truncates** toward zero — it drops the fractional part rather than rounding — so `Int(3.9)` is `3`. Use `.rounded()` first if you want `4`.",
  },
  {
    id: "no-implicit-conversion",
    type: "predict",
    prompt: "What does this do?",
    code: `let apples = 3
let ratio = 2.5
let total = apples + ratio`,
    options: [
      "Compile error — can't add `Int` and `Double`",
      "Prints 5.5",
      "Prints 5",
      "Prints 6",
    ],
    answer: 0,
    explanation:
      "Swift performs **no implicit numeric conversions**, so `Int + Double` doesn't compile. You must convert explicitly: `Double(apples) + ratio` → `5.5`.",
  },
  {
    id: "tuple-destructure",
    type: "predict",
    prompt: "What is printed?",
    code: `let http = (404, "Not Found")
let (code, message) = http
print(message)`,
    options: ["Not Found", "404", "code", "(404, \"Not Found\")"],
    answer: 0,
    explanation:
      "Tuples can be **destructured** into named constants. `let (code, message) = http` binds `code = 404` and `message = \"Not Found\"`, so it prints `Not Found`. Unnamed elements are also reachable as `http.0` / `http.1`.",
  },
  {
    id: "prefer-let-fill",
    type: "fill",
    prompt: "By convention you declare bindings with ___ by default, switching to `var` only when the value genuinely needs to change.",
    answers: ["let"],
    hint: "The keyword for a constant.",
    explanation:
      "`let` by default communicates intent, enables optimizations, and makes value types fully immutable. The compiler even warns when a `var` is never mutated.",
  },
  {
    id: "definite-initialization",
    type: "mcq",
    prompt: "What does Swift do if you read a local variable that hasn't been assigned on every code path?",
    options: [
      "Refuses to compile (definite-initialization error)",
      "Reads a default zero value",
      "Reads `nil`",
      "Crashes at runtime",
    ],
    answer: 0,
    explanation:
      "Swift enforces **definite initialization**: reading a variable before it's guaranteed to hold a value is a compile error. There are no implicit zero/`nil` defaults for non-optional variables.",
  },
  {
    id: "types-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about Swift's type system.",
    options: [
      "An integer literal with no annotation infers to `Int`",
      "You can declare a constant now and assign it later, once, before first use",
      "`Int` and `Double` values can be added directly without conversion",
      "Type inference means Swift is dynamically typed",
    ],
    answers: [0, 1],
    explanation:
      "Integer literals infer to `Int`, and deferred single assignment is allowed under definite initialization. But `Int + Double` needs an explicit conversion, and inference is a *compile-time* convenience — Swift is fully **statically** typed, not dynamic.",
  },
  {
    id: "int-exactly-senior",
    type: "predict",
    prompt: "What is the type and value of `result`?",
    code: `let big = 300
let result = Int8(exactly: big)`,
    options: [
      "`Int8?` equal to `nil`",
      "`Int8` equal to 44 (wrapped)",
      "`Int8` equal to 127 (clamped)",
      "A runtime crash",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Int8(exactly:)` is a **failable** initializer returning `Int8?`. `300` doesn't fit in an `Int8` (max 127), so it returns `nil` — no crash. By contrast, the plain `Int8(300)` would **trap** at runtime. `exactly:` is the safe conversion when you can't guarantee the range.",
  },
  {
    id: "overflow-trap-senior",
    type: "mcq",
    prompt: "In release builds, what happens at `Int.max + 1` in ordinary Swift arithmetic?",
    options: [
      "It traps (crashes) — overflow is a runtime error by default",
      "It silently wraps around to `Int.min`",
      "It saturates at `Int.max`",
      "It promotes to a wider type automatically",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Swift's default `+`/`-`/`*` **trap on overflow**, even in release builds — this is deliberate safety, not undefined behavior like C. If you *want* wraparound, use the overflow operators `&+`, `&-`, `&*` (e.g. `Int.max &+ 1 == Int.min`).",
  },
  {
    id: "value-copy-semantics-senior",
    type: "predict",
    prompt: "What does this print?",
    code: `var a = 1
var b = a
b += 10
print(a, b)`,
    options: ["1 11", "11 11", "1 1", "Compile error"],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Int` is a value type (a struct), so `var b = a` copies the value. Mutating `b` leaves `a` at `1` → `1 11`. Every basic Swift type (`Int`, `Double`, `Bool`, `String`, arrays, tuples…) has this value semantics.",
  },
  {
    id: "basics-types-flashcard",
    type: "flashcard",
    prompt:
      "Why does Swift require explicit numeric conversions and have no implicit zero/null defaults? Answer aloud, then reveal.",
    modelAnswer:
      "Both are **safety** choices. No implicit conversions means `Int + Double` won't silently coerce — you convert explicitly (`Double(x)`), which prevents hidden precision loss and coercion bugs common in C/JS. No implicit defaults means Swift enforces **definite initialization**: you can't read a variable until it provably holds a value, so there's no accidental use of a garbage/zero/`nil` value. Combined with `let`-by-default immutability, static typing, and trap-on-overflow arithmetic, the language pushes a whole class of bugs from runtime to compile time.",
    keyPoints: [
      "No implicit numeric conversion → convert explicitly, no silent coercion",
      "Definite initialization → no reading uninitialized/zero values",
      "`let` by default → immutability & intent",
      "Literals default to Int / Double (never Float)",
      "Arithmetic traps on overflow unless you use `&+` etc.",
    ],
    explanation:
      "The senior framing ties these rules together as 'move errors from runtime to compile time' and mentions overflow trapping and value semantics — showing the design is coherent, not arbitrary strictness.",
  },
];

export default quiz;
