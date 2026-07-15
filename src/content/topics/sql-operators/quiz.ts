import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "op-between-inclusive",
    type: "mcq",
    prompt: "Which ages does `age BETWEEN 25 AND 35` match?",
    options: [
      "Every age from 25 to 35, including both 25 and 35 themselves",
      "Every age strictly greater than 25 and strictly less than 35, leaving out both of the two boundary values",
      "Only the two boundary values 25 and 35, and none of the ages that fall in between those two numbers",
      "Every age except those from 25 to 35, because BETWEEN describes the range that should be excluded instead",
    ],
    answer: 0,
    explanation:
      "`BETWEEN` is inclusive on both ends — it equals `age >= 25 AND age <= 35`. For a half-open range, use explicit comparisons.",
  },
  {
    id: "op-in",
    type: "mcq",
    prompt: "What is `city IN ('Batumi', 'Tbilisi', 'Kutaisi')` equivalent to?",
    options: [
      "city = 'Batumi' OR city = 'Tbilisi' OR city = 'Kutaisi'",
      "city = 'Batumi' AND city = 'Tbilisi' AND city = 'Kutaisi', requiring the row to match all three city names at once",
      "A check that the city column contains all three of those words somewhere inside its text, in any order",
      "A range test that keeps every city whose name sorts alphabetically between 'Batumi' and 'Kutaisi' inclusive",
    ],
    answer: 0,
    explanation:
      "`IN (list)` is shorthand for a chain of OR equality checks — the row matches if the value equals any list item.",
  },
  {
    id: "op-like-percent",
    type: "predict",
    prompt: "Names: Ada, Beka, Carlo, Dato. Which match `name LIKE 'A%'`?",
    code: `SELECT name FROM users WHERE name LIKE 'A%';`,
    options: [
      "Ada — the only name that starts with A",
      "Ada and Carlo, since both of those names contain the letter A somewhere within them regardless of position",
      "No names, because the % wildcard must always appear at the very start of a LIKE pattern to work correctly",
      "All four names, because % matches any run of characters and so the pattern effectively matches everything",
    ],
    answer: 0,
    explanation:
      "`'A%'` means 'A followed by anything', so it matches names *starting* with A. Only Ada qualifies.",
  },
  {
    id: "op-underscore-fill",
    type: "fill",
    prompt: "In a LIKE pattern, the ___ wildcard matches exactly one single character (while % matches any run).",
    answers: ["_", "underscore"],
    hint: "A single character on the keyboard, often below the minus sign.",
    explanation:
      "`_` matches exactly one character; `%` matches any number of characters (including zero).",
  },
  {
    id: "op-like-single",
    type: "predict",
    prompt: "Names: Ada, Beka, Dato, Otar. Which match `name LIKE '_ato'`?",
    code: `SELECT name FROM users WHERE name LIKE '_ato';`,
    options: [
      "Dato — one character, then 'ato', so exactly four letters ending in ato",
      "Dato and Otar, because both names are four letters long and the pattern only counts the total length",
      "Every name containing the letters a, t, and o somewhere, in any order and with any number of characters",
      "No names, since the underscore is a literal underscore character and none of the names contain one at all",
    ],
    answer: 0,
    explanation:
      "`_` matches exactly one character, so `'_ato'` is any single character followed by 'ato' — four letters total. Only Dato fits.",
  },
  {
    id: "op-not-in-null-senior",
    type: "mcq",
    prompt: "🧠 Why can `city NOT IN ('Batumi', NULL)` return zero rows unexpectedly?",
    options: [
      "The NULL makes the NOT IN comparison evaluate to UNKNOWN, so no row is ever TRUE",
      "NOT IN lists are capped at one value, so including a second entry silently disables the whole condition",
      "NULL in a list is expanded to match every possible city, which then excludes all rows from the result set",
      "NOT IN is only valid with numbers, so mixing the text 'Batumi' with a NULL makes the query fail to parse",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "With a NULL in the list, `NOT IN` turns UNKNOWN for every row, so nothing qualifies. Keep NULLs out of the list or use `NOT EXISTS`.",
  },
  {
    id: "op-multi",
    type: "multi",
    prompt: "Select **all** true statements about these operators.",
    options: [
      "BETWEEN includes both of its endpoints",
      "IN replaces a chain of OR equality checks",
      "% in LIKE matches any run of characters",
      "_ in LIKE matches any run of characters",
    ],
    answers: [0, 1, 2],
    explanation:
      "`BETWEEN` is inclusive, `IN` is OR-shorthand, and `%` matches any run. Option 4 is false — `_` matches exactly one character, not a run.",
  },
  {
    id: "op-leading-wildcard-senior",
    type: "mcq",
    prompt: "🧠 Why is `name LIKE '%son'` often slower than `name LIKE 'John%'`?",
    options: [
      "A leading % means the match can start anywhere, so a normal index can't be used and a full scan is needed",
      "The % character is more expensive to compare than plain letters, so more of them always slows the query down",
      "Patterns ending in a wildcard are cached but patterns starting with one are recomputed on every single row",
      "A trailing pattern like 'John%' is rejected by most databases, forcing the slower leading-wildcard form instead",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`'John%'` has a fixed prefix an index can seek to; `'%son'` could match anywhere in the string, defeating a normal B-tree index and forcing a scan.",
  },
  {
    id: "op-flashcard",
    type: "flashcard",
    prompt:
      "Explain BETWEEN, IN, and LIKE — including the inclusivity, the NOT IN/NULL trap, and the wildcards. Answer aloud, then reveal.",
    modelAnswer:
      "**`BETWEEN a AND b`** tests a range and is **inclusive on both ends** (= `>= a AND <= b`); for a half-open range use explicit `>=`/`<`. It works on numbers, dates, and text by natural order. **`IN (list)`** is shorthand for a chain of **OR** equality checks — cleaner than many `OR`s; **`NOT IN`** means 'none of these', but a **NULL in the list** makes `NOT IN` evaluate UNKNOWN and return **no rows**, so strip NULLs or use `NOT EXISTS`. **`LIKE`** matches text patterns: **`%`** = any run of characters (including none), **`_`** = exactly one character — so `'A%'` starts-with-A and `'_ato'` is four letters ending 'ato'. Case sensitivity is **dialect-dependent** (Postgres `LIKE` is case-sensitive, offers `ILIKE`; SQLite/MySQL often insensitive), and use `ESCAPE` to match a literal `%`/`_`. Performance: a **leading wildcard** (`'%son'`) can't use a normal index and forces a scan, while a fixed prefix (`'John%'`) can seek.",
    keyPoints: [
      "BETWEEN is inclusive of both endpoints",
      "IN = OR shorthand; NOT IN + NULL in list → zero rows",
      "LIKE: % = any run, _ = exactly one character",
      "Case sensitivity is dialect-dependent (Postgres LIKE case-sensitive)",
      "Leading wildcard defeats a normal index (full scan)",
    ],
    explanation:
      "A strong answer nails BETWEEN inclusivity, the NOT-IN-with-NULL trap, the two wildcards, and the leading-wildcard performance note.",
  },
];

export default quiz;
