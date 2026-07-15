import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "so-union",
    type: "mcq",
    prompt: "What does UNION do with the rows of its two queries?",
    options: [
      "Stacks them together and removes duplicate rows",
      "Matches them side by side on a shared key column, adding the second query's columns onto the first query's rows",
      "Keeps only the rows that the two queries have in common, discarding anything that appears in just one of them",
      "Returns the rows of whichever of the two queries happens to produce the larger number of rows in total",
    ],
    answer: 0,
    explanation:
      "`UNION` stacks both result sets vertically and de-duplicates, behaving like a set union. The queries must have compatible columns.",
  },
  {
    id: "so-union-all",
    type: "mcq",
    prompt: "How does UNION ALL differ from UNION, and why prefer it when you can?",
    options: [
      "It keeps duplicate rows and is faster, because it skips the sort/compare step that removes them",
      "It removes duplicates from both queries and also from each individual query before the two are combined together",
      "It matches rows on a join key instead of stacking them, so it behaves much more like an INNER JOIN would",
      "It sorts the combined result alphabetically, which is the reason it runs more slowly than a plain UNION does",
    ],
    answer: 0,
    explanation:
      "`UNION ALL` concatenates without de-duplicating, so it avoids the sort/compare cost. Default to it unless you specifically need duplicates removed.",
  },
  {
    id: "so-union-count",
    type: "predict",
    prompt: "customers = {Ada, Beka}, archived = {Carlo, Ada}. How many rows does this return?",
    code: `SELECT name FROM customers\nUNION\nSELECT name FROM archived_customers;`,
    options: [
      "3 — Ada, Beka, Carlo, with the duplicate Ada collapsed",
      "4, because every row from both of the two tables is preserved without any of them being removed as duplicates",
      "2, because UNION keeps only the rows that both of the two source queries happen to have in common with each other",
      "1, because Ada is the single name that appears in both tables and UNION returns only that shared overlapping row",
    ],
    answer: 0,
    explanation:
      "`UNION` de-duplicates, so Ada appears once: Ada, Beka, Carlo — 3 rows. `UNION ALL` would give 4 (Ada twice).",
  },
  {
    id: "so-intersect-fill",
    type: "fill",
    prompt: "To return only the rows that appear in BOTH query results, use the set operator ___.",
    answers: ["INTERSECT", "intersect"],
    hint: "The overlap of two sets.",
    explanation:
      "`INTERSECT` returns rows present in both result sets — the overlap.",
  },
  {
    id: "so-except",
    type: "predict",
    prompt: "customers = {Ada, Beka}, archived = {Carlo, Ada}. What does this return?",
    code: `SELECT name FROM customers\nEXCEPT\nSELECT name FROM archived_customers;`,
    options: [
      "Beka — the current customer who is not in the archived list",
      "Ada, because Ada is the one name that both of the two tables have in common with one another as an overlap",
      "Carlo, since EXCEPT returns the rows that are present in the second query but absent from the first query",
      "Ada and Beka, because EXCEPT keeps every row of the first query regardless of what the second query contains",
    ],
    answer: 0,
    explanation:
      "`EXCEPT` returns rows in the first query but not the second. Ada is in both (removed), leaving Beka.",
  },
  {
    id: "so-columns",
    type: "mcq",
    prompt: "What must be true of the two queries in a set operation?",
    options: [
      "Same number of columns, compatible types, in the same order",
      "The two queries must read from the exact same table, differing only in the WHERE conditions they apply to it",
      "The second query must select at least one more column than the first so its extra rows have somewhere to go",
      "Both queries must include an ORDER BY clause so the database knows how to line their rows up against each other",
    ],
    answer: 0,
    explanation:
      "Set operations stack rows vertically, so both queries need matching column counts and compatible types in the same order.",
  },
  {
    id: "so-except-order-senior",
    type: "mcq",
    prompt: "🧠 Is `A EXCEPT B` the same as `B EXCEPT A`?",
    options: [
      "No — EXCEPT is a directional subtraction; each returns the rows unique to its own first query",
      "Yes, because set operations are always symmetric and the order of the two queries never affects the result at all",
      "Yes, but only when both queries select from tables that contain the exact same number of total rows to begin with",
      "No, because B EXCEPT A is invalid syntax; the larger result set must always be written first in an EXCEPT query",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`EXCEPT` subtracts the second set from the first, so order matters: `A EXCEPT B` (A's leftovers) differs from `B EXCEPT A`.",
  },
  {
    id: "so-multi",
    type: "multi",
    prompt: "Select **all** true statements about set operations.",
    options: [
      "UNION removes duplicate rows",
      "UNION ALL is faster than UNION",
      "INTERSECT returns rows in both queries",
      "Set operations combine tables horizontally by adding columns",
    ],
    answers: [0, 1, 2],
    explanation:
      "UNION de-duplicates, UNION ALL skips that (faster), INTERSECT returns the overlap. Option 4 describes a *join* — set operations stack rows vertically, so it's false.",
  },
  {
    id: "so-flashcard",
    type: "flashcard",
    prompt:
      "Explain UNION / UNION ALL / INTERSECT / EXCEPT, the column rule, and how they relate to joins. Answer aloud, then reveal.",
    modelAnswer:
      "**Set operations** combine two query results **vertically** (stacking rows), unlike a **join** which combines **horizontally** (adding columns). Both queries must have the **same number of columns, compatible types, in the same order** (result column names come from the first query). **`UNION`** stacks and **removes duplicates**; **`UNION ALL`** keeps everything and is **faster** (skips the sort/compare to de-dup) — default to it unless you need duplicates removed. **`INTERSECT`** returns rows in **both** sets (the overlap — 'who's in both groups'). **`EXCEPT`** (Oracle: `MINUS`) returns rows in the **first but not the second** — a **directional** subtraction, so `A EXCEPT B ≠ B EXCEPT A`. `INTERSECT` often rewrites as an inner join and `EXCEPT` as an anti-join, but the set operators read more directly when comparing two same-shaped lists.",
    keyPoints: [
      "Set ops stack rows vertically; joins add columns horizontally",
      "Both queries: same column count/types/order",
      "UNION de-dups; UNION ALL keeps all and is faster",
      "INTERSECT = rows in both; EXCEPT = first-minus-second (directional)",
    ],
    explanation:
      "A strong answer contrasts set ops with joins, prefers UNION ALL on performance, and knows EXCEPT is directional.",
  },
];

export default quiz;
