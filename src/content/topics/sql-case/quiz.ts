import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "case-first-match",
    type: "predict",
    prompt: "What does this expression return?",
    code: `CASE\n  WHEN 5 > 10 THEN 'a'\n  WHEN 5 > 3  THEN 'b'\n  ELSE 'c'\nEND`,
    options: [
      "'b' — the first true WHEN wins, and evaluation stops there",
      "'c', because the ELSE branch is always evaluated last and therefore overrides whichever WHEN matched first",
      "'a' and 'b' both, since every WHEN whose condition is true contributes its THEN value to the final output",
      "NULL, because two of the conditions are true at once and the engine cannot decide between the two of them",
    ],
    answer: 0,
    explanation:
      "CASE checks WHENs top to bottom and returns the first true branch's THEN — here 5 > 3 is the first true one, giving 'b'. It never reaches ELSE.",
  },
  {
    id: "case-no-else",
    type: "mcq",
    prompt: "In a CASE with no ELSE, what value do rows that match no WHEN receive?",
    options: [
      "NULL",
      "An empty string, because the database substitutes a blank text value whenever every branch fails to match a row",
      "The value from the very first WHEN branch, which acts as an implicit fallback default when nothing else matches",
      "Zero, since a CASE without an ELSE is treated as a numeric expression that defaults to the number zero on failure",
    ],
    answer: 0,
    explanation:
      "With no `ELSE`, an unmatched row yields NULL. Add an explicit `ELSE` to supply a default and avoid surprise NULLs.",
  },
  {
    id: "case-order-matters",
    type: "mcq",
    prompt: "Why does WHEN order matter in `CASE WHEN age < 65 THEN 'adult' WHEN age < 18 THEN 'minor' END`?",
    options: [
      "A 10-year-old matches the first WHEN and is labelled 'adult', because evaluation stops at the first true branch",
      "The database evaluates both branches and then keeps whichever label happens to be alphabetically earlier of the two",
      "Order never matters in a CASE; the branches are checked in parallel and the most specific condition always wins out",
      "The query fails to compile, because the two age conditions overlap and SQL forbids overlapping ranges in a CASE",
    ],
    answer: 0,
    explanation:
      "First-match-wins: `age < 65` catches minors too, so they'd wrongly get 'adult'. List the narrowest conditions (`age < 18`) first.",
  },
  {
    id: "case-simple-fill",
    type: "fill",
    prompt: "`CASE city WHEN 'Batumi' THEN ...` is the ___ CASE form, which compares one column against each WHEN value.",
    answers: ["simple", "SIMPLE"],
    hint: "The opposite of the 'searched' form; also means 'not complicated'.",
    explanation:
      "The simple CASE compares a single expression to each `WHEN` value with `=`. The searched form (`CASE WHEN condition`) allows arbitrary conditions.",
  },
  {
    id: "case-in-order-by",
    type: "mcq",
    prompt: "What does `ORDER BY CASE status WHEN 'urgent' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END` achieve?",
    options: [
      "It sorts urgent rows first, then normal, then everything else — a custom priority order",
      "It removes all rows whose status is neither urgent nor normal before the remaining rows are sorted normally",
      "It renames the status column to a number so the values take up less storage space inside the sorted output",
      "It groups the rows into three status buckets and returns only one summary row for each of those buckets",
    ],
    answer: 0,
    explanation:
      "The CASE maps each status to a sort rank, so rows sort by that custom priority rather than alphabetically.",
  },
  {
    id: "case-conditional-count-senior",
    type: "predict",
    prompt: "🧠 Ages: 19, 28, 34, 12. What does the minors column return?",
    code: `SELECT\n  COUNT(CASE WHEN age < 18 THEN 1 END) AS minors\nFROM users;`,
    options: [
      "1 — only the age-12 row yields 1; the others yield NULL, and COUNT skips NULLs",
      "4, because COUNT with a CASE inside it counts every row in the table regardless of whether the condition held",
      "0, because COUNT cannot be combined with a CASE expression and therefore returns an empty count of zero rows",
      "2, since COUNT treats both the age-12 and the age-19 rows as minors when the threshold is any value under twenty",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`CASE WHEN age < 18 THEN 1 END` returns 1 for the age-12 row and NULL for the rest. `COUNT` ignores NULLs, so it counts just the one minor.",
  },
  {
    id: "case-branches-multi",
    type: "multi",
    prompt: "Select **all** true statements about CASE expressions.",
    options: [
      "It returns the first matching branch's THEN value",
      "Omitting ELSE gives NULL for unmatched rows",
      "It can appear in ORDER BY, not only SELECT",
      "Every branch whose condition is true is returned",
    ],
    answers: [0, 1, 2],
    explanation:
      "CASE is first-match-wins, defaults to NULL without ELSE, and produces a value usable anywhere. Option 4 is false — only the first matching branch is returned.",
  },
  {
    id: "case-flashcard",
    type: "flashcard",
    prompt:
      "Explain CASE: searched vs simple form, first-match/ELSE behavior, and conditional aggregation. Answer aloud, then reveal.",
    modelAnswer:
      "**CASE** is SQL's if/else: it returns a value based on conditions. The **searched** form — `CASE WHEN cond THEN val … ELSE default END` — checks each `WHEN` top to bottom and returns the **first true** branch's `THEN`, stopping there (so order the narrowest conditions first). The **simple** form — `CASE col WHEN v1 THEN … END` — compares one expression to each value with `=`; equivalent but only for equality on a single column. With **no `ELSE`**, unmatched rows return **NULL**, so add an explicit default when NULL would be wrong. A CASE yields a value, so it works in `SELECT`, `ORDER BY` (custom sort priority), and more. The senior pattern is **conditional aggregation**: `COUNT(CASE WHEN cond THEN 1 END)` or `SUM(CASE WHEN cond THEN amount ELSE 0 END)` computes several conditional totals in one scan — it works because `COUNT`/`SUM` skip NULLs. That's a lightweight **pivot** turning rows into side-by-side columns.",
    keyPoints: [
      "Searched CASE = if/else; first true WHEN wins, order matters",
      "Simple CASE compares one column with = to each WHEN value",
      "No ELSE → NULL for unmatched rows; add a default",
      "CASE usable in SELECT, ORDER BY, etc.",
      "Conditional aggregation: COUNT/SUM(CASE ...) for one-pass pivots",
    ],
    explanation:
      "A strong answer distinguishes searched vs simple, stresses first-match-wins + ELSE=NULL, and shows conditional aggregation as a pivot.",
  },
];

export default quiz;
