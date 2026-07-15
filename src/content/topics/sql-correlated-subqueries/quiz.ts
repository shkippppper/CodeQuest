import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "cs-what",
    type: "mcq",
    prompt: "What makes a subquery 'correlated'?",
    options: [
      "Its inner query references a column from the outer query, so it re-runs for each outer row",
      "It returns two or more columns at once, which the outer query then correlates against its own set of columns",
      "It is stored under a name and reused by several different outer queries that all correlate to the same data",
      "It joins two tables together inside the subquery before handing a single combined value to the outer query",
    ],
    answer: 0,
    explanation:
      "A correlated subquery depends on a value from the current outer row, so it can't run once — it re-executes per outer row.",
  },
  {
    id: "cs-vs-plain",
    type: "mcq",
    prompt: "How does a correlated subquery differ from a plain (independent) one?",
    options: [
      "A plain subquery runs once; a correlated one re-runs for every outer row and can't stand alone",
      "A plain subquery can only appear in WHERE, while a correlated one is restricted to appearing only in the FROM clause",
      "A correlated subquery always runs faster, because the database is able to cache its single result and reuse it",
      "A plain subquery must return many rows, whereas a correlated subquery is required to return exactly one single row",
    ],
    answer: 0,
    explanation:
      "An independent subquery runs a single time. A correlated one references the outer row, so it executes once per outer row and is meaningless alone.",
  },
  {
    id: "cs-exists",
    type: "mcq",
    prompt: "What does `WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)` test?",
    options: [
      "Whether the customer has at least one matching order",
      "Whether the customer has exactly one order and no more than one, failing if they have placed several orders",
      "The total number of orders the customer has placed, returning that count for the outer query to compare against",
      "Whether the orders table contains any rows at all, independent of which particular customer is being examined",
    ],
    answer: 0,
    explanation:
      "`EXISTS` returns true if the correlated subquery finds any row for the current customer — a yes/no existence test.",
  },
  {
    id: "cs-select-one-fill",
    type: "fill",
    prompt: "Inside EXISTS, people conventionally write `SELECT ___` because only the row's existence matters, not its contents.",
    answers: ["1", "1 "],
    hint: "A throwaway constant — the digit one.",
    explanation:
      "`EXISTS` ignores the selected values entirely, so `SELECT 1` is idiomatic — it only checks whether a row is returned.",
  },
  {
    id: "cs-not-exists-null-senior",
    type: "mcq",
    prompt: "🧠 Why prefer NOT EXISTS over NOT IN for an anti-join when NULLs are possible?",
    options: [
      "NOT EXISTS handles NULLs correctly, whereas a NULL in a NOT IN list makes the whole condition return no rows",
      "NOT EXISTS is a newer keyword that has simply replaced NOT IN, which most modern databases no longer support at all",
      "NOT IN can only be used with a hard-coded list of values and is never allowed to take a subquery as its argument",
      "NOT EXISTS automatically removes duplicate rows from its result, while NOT IN leaves the duplicate rows in place",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A NULL in a `NOT IN` list turns the comparison UNKNOWN for every row, returning nothing. `NOT EXISTS` is NULL-safe, so it's the robust anti-join.",
  },
  {
    id: "cs-short-circuit-senior",
    type: "predict",
    prompt: "🧠 A customer has 5000 orders. How many does an EXISTS subquery need to examine before returning true?",
    code: `WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)`,
    options: [
      "As few as one — EXISTS stops at the first matching row",
      "All 5000, because EXISTS must fully count every matching order before it can decide whether any of them exist",
      "Exactly half of them on average, since the database samples the orders table randomly until it is confident enough",
      "None, because EXISTS looks only at the customers table and never actually reads the orders table during the check",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`EXISTS` only needs to know a match exists, so it can short-circuit at the first hit — which is why it often beats `COUNT(*) > 0`.",
  },
  {
    id: "cs-multi",
    type: "multi",
    prompt: "Select **all** true statements about correlated subqueries and EXISTS.",
    options: [
      "A correlated subquery re-runs per outer row",
      "EXISTS short-circuits at the first matching row",
      "NOT EXISTS is a NULL-safe anti-join",
      "A correlated subquery can run standalone with no outer query",
    ],
    answers: [0, 1, 2],
    explanation:
      "Correlated subqueries re-run per row, `EXISTS` stops early, and `NOT EXISTS` is NULL-safe. Option 4 is false — a correlated subquery references the outer row and can't run alone.",
  },
  {
    id: "cs-flashcard",
    type: "flashcard",
    prompt:
      "Explain correlated subqueries, EXISTS/NOT EXISTS, and why NOT EXISTS beats NOT IN. Answer aloud, then reveal.",
    modelAnswer:
      "A **correlated subquery** references a column from the **outer** query (e.g. `WHERE inner.dept = e.dept`), so it can't run once — it **re-executes per outer row**, recomputing for that row's context (like 'salary above the department average'). Contrast an **independent** subquery, which runs a single time and could stand alone. The cost: per-row execution can be expensive at scale (a join or window function may be faster). Correlation pairs naturally with **`EXISTS`**, a yes/no test — 'does the subquery return any row for this outer row?' — written `WHERE EXISTS (SELECT 1 FROM ... WHERE ... = outer.col)`. `EXISTS` **short-circuits** at the first match (often beating `COUNT(*) > 0`), and `SELECT 1` is idiomatic since only existence matters. **`NOT EXISTS`** is the robust **anti-join** ('rows with no match') and is **NULL-safe**, unlike **`NOT IN`**, which returns nothing when its list/subquery contains a NULL.",
    keyPoints: [
      "Correlated = inner references outer row → re-runs per row (can be costly)",
      "Independent subquery runs once; correlated can't stand alone",
      "EXISTS = yes/no, short-circuits at first match; SELECT 1 idiom",
      "NOT EXISTS = NULL-safe anti-join; NOT IN breaks on NULLs",
    ],
    explanation:
      "A strong answer explains per-row execution and cost, EXISTS short-circuiting, and NOT EXISTS's NULL-safety over NOT IN.",
  },
];

export default quiz;
