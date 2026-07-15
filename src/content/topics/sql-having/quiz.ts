import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "hv-difference",
    type: "mcq",
    prompt: "What is the core difference between WHERE and HAVING?",
    options: [
      "WHERE filters rows before grouping; HAVING filters groups after aggregation",
      "WHERE works only on text columns while HAVING works only on the numeric columns produced by a running query",
      "They are interchangeable keywords, and which one you choose only affects how the final result set gets sorted",
      "WHERE can filter at most one column at a time, whereas HAVING is required whenever two columns are involved",
    ],
    answer: 0,
    explanation:
      "`WHERE` runs before `GROUP BY` on individual rows; `HAVING` runs after, on the formed groups, so it can test aggregates.",
  },
  {
    id: "hv-illegal-where",
    type: "predict",
    prompt: "Why does this query fail?",
    code: `SELECT city, SUM(amount)\nFROM sales\nWHERE SUM(amount) > 90\nGROUP BY city;`,
    options: [
      "WHERE runs before grouping, so no SUM exists yet for it to test",
      "SUM can only be compared against another aggregate function, never against a plain constant number like ninety",
      "The GROUP BY clause must always be written before the WHERE clause, so the two clauses are in the wrong order",
      "You cannot select a column and an aggregate together, so removing city from the SELECT would fix the failure",
    ],
    answer: 0,
    explanation:
      "`WHERE` filters rows before groups are formed, so the aggregate `SUM(amount)` doesn't exist yet. That condition belongs in `HAVING`.",
  },
  {
    id: "hv-fix-fill",
    type: "fill",
    prompt: "To keep only the groups whose total exceeds 90, replace the illegal WHERE with a ___ clause.",
    answers: ["HAVING", "having"],
    hint: "It runs after GROUP BY and can see aggregates.",
    explanation:
      "`HAVING SUM(amount) > 90` filters groups after aggregation — the correct place for a condition on an aggregate.",
  },
  {
    id: "hv-order",
    type: "mcq",
    prompt: "In what order does the database process these clauses?",
    options: [
      "FROM, then WHERE, then GROUP BY, then HAVING, then SELECT",
      "SELECT first to pick the columns, then WHERE, then GROUP BY, and finally HAVING once everything else is done",
      "GROUP BY first to form the groups, then HAVING, then WHERE filters the surviving groups down row by row",
      "WHERE and HAVING run simultaneously in a single pass, and GROUP BY only decides how the output is displayed",
    ],
    answer: 0,
    explanation:
      "The logical order is FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. That's why `WHERE` can't see aggregates but `HAVING` can.",
  },
  {
    id: "hv-both",
    type: "mcq",
    prompt: "A query needs both `amount > 0` (per row) and `COUNT(*) > 3` (per group). Where does each go?",
    options: [
      "amount > 0 in WHERE, COUNT(*) > 3 in HAVING",
      "Both conditions go into HAVING, because any query that groups its rows must place every filter after the grouping",
      "Both conditions go into WHERE, since WHERE is capable of evaluating aggregate functions once a GROUP BY is present",
      "amount > 0 in HAVING and COUNT(*) > 3 in WHERE, so that the row filter is applied last after the groups are built",
    ],
    answer: 0,
    explanation:
      "Per-row conditions go in `WHERE` (before grouping); conditions on an aggregate go in `HAVING` (after). Many queries use both.",
  },
  {
    id: "hv-which-faster-senior",
    type: "mcq",
    prompt: "🧠 A condition on a plain (non-aggregated) column could go in WHERE or HAVING. Which is better and why?",
    options: [
      "WHERE — filtering rows before grouping means fewer rows to aggregate, so it's faster",
      "HAVING, because filtering after the groups are built guarantees the database produces a smaller and tidier result",
      "It is a coin flip with no difference at all, since both clauses always scan every row of the table exactly once",
      "HAVING, because WHERE is unable to reference any column that also appears in the query's GROUP BY clause list",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Put row conditions in `WHERE` so fewer rows reach the grouping step — same result, less work. Reserve `HAVING` for genuine aggregate conditions.",
  },
  {
    id: "hv-multi",
    type: "multi",
    prompt: "Select **all** true statements about WHERE and HAVING.",
    options: [
      "WHERE runs before GROUP BY",
      "HAVING can reference aggregate results",
      "A query may use both WHERE and HAVING",
      "WHERE can filter on SUM() or COUNT()",
    ],
    answers: [0, 1, 2],
    explanation:
      "The first three are correct. `WHERE` runs before aggregates exist, so it cannot filter on `SUM()`/`COUNT()` — that's `HAVING`'s job, making option 4 false.",
  },
  {
    id: "hv-flashcard",
    type: "flashcard",
    prompt:
      "Explain WHERE vs HAVING using the execution order, and say which to prefer when either would work. Answer aloud, then reveal.",
    modelAnswer:
      "**`WHERE`** filters individual **rows** *before* grouping and **cannot see aggregates** (they don't exist yet). **`HAVING`** filters whole **groups** *after* aggregation and **can** test aggregates like `SUM(...) > 90` or `COUNT(*) > 3`. The reason is the **logical execution order**: `FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY` — `WHERE` is before `GROUP BY`, `HAVING` after. They're not either/or; many queries use **both** (`WHERE` to drop bad rows early, `HAVING` to judge finished totals). When a plain row condition *could* go in either, prefer **`WHERE`**: filtering rows before grouping leaves fewer rows to aggregate, so it's faster for the same result. Reserve `HAVING` for conditions that genuinely need an aggregate.",
    keyPoints: [
      "WHERE = rows, before grouping, no aggregates",
      "HAVING = groups, after aggregation, can test aggregates",
      "Order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY",
      "Queries often use both",
      "Prefer WHERE for row conditions — fewer rows to aggregate (faster)",
    ],
    explanation:
      "A strong answer explains the difference via execution order and prefers WHERE for row filters on performance grounds.",
  },
];

export default quiz;
