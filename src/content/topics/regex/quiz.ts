import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "regex-literal-checked-when",
    type: "mcq",
    prompt: "When is a regex literal like `/\\d+/` checked for a malformed pattern?",
    options: [
      "At compile time — a bad pattern is a build error on that line, before the app ever runs",
      "At the exact moment the very first match is attempted against some string, throwing a runtime error if the pattern turns out to be malformed",
      "Never automatically; you are expected to validate the pattern text yourself by calling a separate checking method before using it anywhere",
      "Only during unit tests, because the regex engine defers all of its pattern validation until the surrounding test target is actually built and run",
    ],
    answer: 0,
    explanation:
      "A regex **literal** (`/.../`) is compiled and type-checked at compile time. A malformed pattern is a build error, just like any other syntax mistake — not a runtime crash.",
  },
  {
    id: "regex-runtime-throws",
    type: "mcq",
    prompt: "Why does `try Regex(someString)` need `try`, while `/\\d+/` does not?",
    options: [
      "The string may hold a malformed pattern only discoverable at runtime, so the initializer can throw",
      "Building a regex from a string always allocates on a background thread, and any operation that hops threads in Swift is required to be marked with try",
      "Runtime regexes are reference types whose initializers are universally throwing, whereas a literal is a value type and value-type initializers can never throw",
      "The `try` keyword forces the regex engine to precompile the pattern eagerly instead of lazily, which is mandatory whenever the source is a plain String value",
    ],
    answer: 0,
    explanation:
      "A literal is validated at compile time, so it can't fail at runtime. A `String` pattern isn't known until runtime and might be malformed, so `Regex(_:)` can **throw** — hence `try`.",
  },
  {
    id: "regex-whole-vs-first-predict",
    type: "predict",
    prompt: "What does this print?",
    code: [
      'let text = "order 42 shipped"',
      "let m = text.wholeMatch(of: /\\d+/)",
      "print(m == nil)",
    ].join("\n"),
    options: [
      "true",
      "false",
      'It prints the matched digits "42" instead of a boolean, because wholeMatch returns the substring it found rather than an optional wrapper',
      "Compile error: wholeMatch cannot be compared to nil because its result is a non-optional Match value that must be unwrapped first",
    ],
    answer: 0,
    explanation:
      "`wholeMatch` succeeds only if the pattern covers the **entire** string. `\\d+` matches just the digits, not the surrounding words, so it returns `nil` and `m == nil` is `true`.",
  },
  {
    id: "regex-output-zero-fill",
    type: "fill",
    prompt: "For any match, `match.output.___` is always the whole matched text (the first capture group is the next slot).",
    answers: ["0"],
    hint: "It's the very first tuple element — a single digit.",
    explanation:
      "Element `.0` of `output` is always the whole match. Capture groups follow in order starting at `.1`.",
  },
  {
    id: "regex-two-captures-type-predict",
    type: "predict",
    prompt: "What is the type of `match.output` for this pattern with two capture groups?",
    code: [
      "let re = /(\\w+)=(\\d+)/",
      'let match = "count=42".firstMatch(of: re)!',
    ].join("\n"),
    options: [
      "(Substring, Substring, Substring)",
      "(Substring, Substring)",
      "A dictionary keyed by the numeric position of each capture group, holding an optional Substring value for every one of the groups that the pattern declared",
      "Just a single Substring holding the whole match, with the individual capture groups reachable only through a separate indexed subscript on the match",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "One slot for the whole match plus one per capture group. Two groups gives three slots: `(Substring, Substring, Substring)`. The compiler counts the parentheses and builds the tuple to fit.",
  },
  {
    id: "regex-builder-reads",
    type: "mcq",
    prompt: "In a `RegexBuilder` block, what does a bare string literal like `\"-\"` on its own line do?",
    options: [
      "It matches that exact character sequence literally at that position in the pattern",
      "It defines a named reference label that later builder components inside the same block can point back to when they need to reuse the captured text",
      "It is treated as a comment describing the surrounding components and contributes nothing at all to the actual matching behavior of the regex",
      "It sets the delimiter that the builder uses to automatically split the input string into separate tokens before the rest of the pattern is applied",
    ],
    answer: 0,
    explanation:
      "A plain string in a builder block matches that literal text. `\"-\"` matches a hyphen exactly, the same as putting `-` in a pattern literal.",
  },
  {
    id: "regex-trycapture-nil-senior",
    type: "predict",
    prompt: "The transform returns `nil` for non-numeric text. What does this print?",
    code: [
      "import RegexBuilder",
      "let re = Regex {",
      '  "id="',
      "  TryCapture { OneOrMore(.word) } transform: { Int($0) }",
      "}",
      'print("id=abc".firstMatch(of: re) == nil)',
    ].join("\n"),
    options: [
      "true",
      "false",
      'It prints "abc" because TryCapture still captures the raw substring and only skips running the transform when the text is not a valid number',
      "Compile error: a TryCapture transform is not allowed to return an optional, so returning Int($0) which yields Int? fails to type-check inside the builder",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`TryCapture`'s transform returning `nil` makes the **whole match fail**. `Int(\"abc\")` is `nil`, so there's no match and `firstMatch` returns `nil` — the print is `true`.",
  },
  {
    id: "regex-choose-form-multi",
    type: "multi",
    prompt: "Select **all** true statements about choosing a regex literal versus `Regex(String)`.",
    options: [
      "A literal is validated at compile time, so a typo is a build error",
      "`Regex(String)` fits when the pattern isn't known until runtime, such as user input",
      "`Regex(String)` can throw, so it's used with `try`",
      "A literal must be rebuilt from a String on every match, which is why it avoids throwing",
    ],
    answers: [0, 1, 2],
    explanation:
      "Literals are compile-checked; `Regex(String)` suits runtime patterns and can throw. Option 4 is false — a literal is *not* rebuilt from a string per match; that's the opposite of how it works.",
  },
  {
    id: "regex-apis-multi",
    type: "multi",
    prompt: "Select **all** that correctly describe a Swift string matching API.",
    options: [
      "`firstMatch(of:)` returns the first match, scanning left to right",
      "`matches(of:)` returns a collection of every occurrence",
      "`replacing(_:with:)` swaps matched spans for replacement text",
      "`wholeMatch(of:)` returns the first match found anywhere inside a longer string",
    ],
    answers: [0, 1, 2],
    explanation:
      "`firstMatch`, `matches`, and `replacing` behave as described. `wholeMatch` is the odd one out: it matches only if the pattern covers the **entire** string, not any substring within it.",
  },
  {
    id: "regex-flashcard",
    type: "flashcard",
    prompt:
      "Explain Swift's typed regex: literals vs runtime patterns, the matching APIs, typed captures, and what RegexBuilder adds. Answer aloud, then reveal.",
    modelAnswer:
      "A **regex literal** `/\\d+/` is written between slashes and is compiled and **type-checked at compile time** — a malformed pattern is a build error, not a runtime crash, and its type carries the captures. When the pattern is only known at runtime (user input, a config file), build it from a string with `try Regex(_:)`, which can **throw** on a bad pattern. You apply a regex with `firstMatch(of:)` (first hit, left to right), `wholeMatch(of:)` (matches only if the pattern covers the **entire** string), `matches(of:)` (a collection of all occurrences), and `replacing(_:with:)`; the match returns an optional, so you unwrap with `if let`. The big win is **typed captures**: capture groups arrive as a typed tuple in `match.output`, where `.0` is always the whole match and `.1`, `.2`, ... are the groups in order — no stringly-typed group indexing. **RegexBuilder** is a DSL that spells the same pattern out top to bottom (`OneOrMore(.digit)`, a literal `\"-\"`, etc.); `Capture { }` adds a slot to `output`, and `TryCapture { } transform:` parses a capture straight into an `Int`/`Double`/`Date`, failing the whole match if the transform returns `nil`.",
    keyPoints: [
      "Literal /.../ is compile-time checked; runtime Regex(String) can throw (try)",
      "APIs: firstMatch, wholeMatch (entire string), matches, replacing",
      "Typed captures: output is a tuple; .0 is the whole match, .1+ are groups",
      "RegexBuilder DSL reads top to bottom; components are literals + quantifiers",
      "Capture adds an output slot; TryCapture transforms and can fail the match",
    ],
    explanation:
      "A strong answer leads with typed + compile-checked, contrasts the literal against the throwing runtime form, names the four matching APIs, explains the output tuple with .0 as the whole match, and covers RegexBuilder plus TryCapture's transform.",
  },
];

export default quiz;
