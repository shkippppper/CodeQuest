import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "no-int-subscript",
    type: "mcq",
    prompt: "Why doesn't `myString[5]` compile in Swift?",
    options: [
      "Characters are variable-width grapheme clusters, so there's no O(1) Int→character mapping",
      "Strings are immutable",
      "`Int` isn't `Hashable`",
      "It only works on `NSString`",
    ],
    answer: 0,
    explanation:
      "A `Character` is an extended grapheme cluster of variable byte length, so an integer can't map directly to a character boundary. Swift uses `String.Index` (walked via `index(_:offsetBy:)`) to stay Unicode-correct.",
  },
  {
    id: "emoji-count",
    type: "predict",
    prompt: "What is printed?",
    code: `let flag = "🇬🇪"
print(flag.count)`,
    options: ["1", "2", "4", "8"],
    answer: 0,
    explanation:
      "`count` counts **`Character`s** (grapheme clusters), i.e. what a human perceives. The flag is one Character even though it's built from two regional-indicator Unicode scalars, so `count` is `1`.",
  },
  {
    id: "string-value-type",
    type: "predict",
    prompt: "What does this print?",
    code: `var a = "hello"
var b = a
b.append("!")
print(a, b)`,
    options: ["hello hello!", "hello! hello!", "hello hello", "Compile error"],
    answer: 0,
    explanation:
      "`String` is a **value type** (struct with copy-on-write). `var b = a` copies, so mutating `b` leaves `a` as `hello`. Prints `hello hello!`.",
  },
  {
    id: "substring-type",
    type: "mcq",
    prompt: "What type does `myString.prefix(3)` return?",
    options: ["`Substring`", "`String`", "`[Character]`", "`ArraySlice<Character>`"],
    answer: 0,
    explanation:
      "Slicing operations return a **`Substring`**, which shares the original string's storage for efficiency. Convert with `String(...)` when you need to store it long-term.",
  },
  {
    id: "string-index-fill",
    type: "fill",
    prompt: "What type do you use to address a position in a Swift `String`, since `Int` subscripts aren't allowed?",
    answers: ["String.Index", "Index"],
    hint: "`String.____` — obtained from `startIndex` / `endIndex`.",
    explanation:
      "`String.Index` marks a character boundary. You get one from `startIndex`/`endIndex` and move it with `index(_:offsetBy:)` or `firstIndex(of:)`.",
  },
  {
    id: "unicode-views",
    type: "predict",
    prompt: "For a precomposed `let s = \"é\"` (one grapheme, one scalar), what does this print?",
    code: `let s = "é"
print(s.count, s.utf8.count)`,
    options: ["1 2", "2 2", "1 1", "2 1"],
    answer: 0,
    explanation:
      "`count` counts grapheme clusters → `1`. `utf8.count` counts UTF-8 **bytes**; `é` (U+00E9) encodes as 2 UTF-8 bytes → `2`. The different views (`unicodeScalars`, `utf8`, `utf16`) expose text at different levels.",
  },
  {
    id: "strings-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about Swift `String`.",
    options: [
      "`String` is a value type with copy-on-write",
      "`count` returns the number of grapheme clusters (Characters)",
      "You can subscript a `String` with an `Int`",
      "Slicing returns a `Substring` that shares storage with the original",
    ],
    answers: [0, 1, 3],
    explanation:
      "`String` is a COW value type, `count` counts Characters, and slices are storage-sharing `Substring`s. You **cannot** subscript with an `Int` (option 3 is false) — that's the whole point of `String.Index`.",
  },
  {
    id: "grapheme-combining-senior",
    type: "predict",
    prompt: "What is printed? (the string is 'e' followed by a combining acute accent)",
    code: `let e = "e\\u{301}"
print(e, e.count)`,
    options: ["é 1", "e 2", "é 2", "e\\u{301} 5"],
    answer: 0,
    explanation:
      "`e` plus the combining accent `U+0301` forms a single grapheme cluster that renders as `é`. Swift treats it as **one** `Character`, so `count` is `1` — even though it's two Unicode scalars. This is why Swift's model matches human perception.",
  },
  {
    id: "substring-memory-senior",
    type: "mcq",
    prompt: "You slice a 1 MB string to keep a 3-character `Substring` in a long-lived property. What's the risk?",
    options: [
      "The Substring pins the entire 1 MB original in memory until it's released",
      "The slice is copied, wasting a full megabyte",
      "Substrings can't be stored in properties",
      "There's no downside",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A `Substring` **shares** the parent's backing storage, so holding one keeps the whole original alive — a subtle leak when the parent is large. Convert with `String(slice)` before storing long-term to copy just the bytes you need.",
  },
  {
    id: "index-complexity-senior",
    type: "mcq",
    prompt: "What is the time complexity of reaching an arbitrary character position in a Swift `String`?",
    options: [
      "O(n) — you must walk grapheme boundaries from a known index",
      "O(1) — like array indexing",
      "O(log n) — strings are balanced trees",
      "O(n^2)",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Because grapheme clusters vary in size, there's no random access — advancing to the k-th character means walking boundaries, which is **O(n)**. That's the deliberate cost of Unicode-correct indexing, and why tight loops sometimes drop to the `utf8`/`unicodeScalars` views.",
  },
  {
    id: "strings-zwj-emoji-trick",
    type: "predict",
    prompt: "🧠 Trick question — the string is a family emoji (four people joined by zero-width joiners). What prints?",
    code: `let family = "👨‍👩‍👧‍👦"
print(family.count)`,
    options: ["1", "4", "7", "11"],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The family emoji is a single **grapheme cluster** — four person emoji bound together by zero-width joiners (ZWJ). Swift counts what a human perceives, so `count` is `1`, even though it's 7 Unicode scalars and 25 UTF-8 bytes. This is precisely why a Swift `String` isn't an array of fixed-size characters.",
  },
  {
    id: "strings-flashcard",
    type: "flashcard",
    prompt:
      "Explain why Swift strings aren't Int-indexable and what String vs Substring means for memory. Answer aloud, then reveal.",
    modelAnswer:
      "A Swift `Character` is an **extended grapheme cluster** — one human-perceived character that may be several Unicode scalars/bytes (an emoji, a combined accent, a flag). Because characters are variable-width, there's no O(1) mapping from an `Int` to a character boundary, so Swift forbids `s[5]` and uses **`String.Index`**, advanced with `index(_:offsetBy:)`; arbitrary access is O(n). This keeps text operations Unicode-correct (`\"é\".count == 1`, `\"🇬🇪\".count == 1`). Slicing returns a **`Substring`** that **shares the original's storage** — cheap for short-lived work, but it keeps the whole parent alive, so convert to `String` before storing a small slice of a large string. Under the grapheme layer, the `unicodeScalars`, `utf8`, and `utf16` views expose the text at lower levels when you need them.",
    keyPoints: [
      "Character = extended grapheme cluster (variable width)",
      "No Int subscript; use String.Index, O(n) access",
      "count = grapheme clusters, matches human perception",
      "Substring shares storage → pins the whole original",
      "Views: unicodeScalars / utf8 / utf16 for lower levels",
    ],
    explanation:
      "The senior signal is naming 'extended grapheme cluster', explaining the O(n) indexing trade-off, and knowing the Substring memory-pinning gotcha plus the byte/scalar views.",
  },
];

export default quiz;
