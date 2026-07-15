import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sq-what",
    type: "mcq",
    prompt: "What is a subquery?",
    options: [
      "A query nested inside another query, whose result feeds the outer query",
      "A second copy of a query that the database runs in parallel to double-check the first query's returned results",
      "A query that has been saved under a name so that it can be called again later without rewriting all of its text",
      "A query that reads from a backup of the table instead of the live table to avoid interfering with other writers",
    ],
    answer: 0,
    explanation:
      "A subquery is a `SELECT` nested inside another statement; its result is substituted into the outer query.",
  },
  {
    id: "sq-scalar",
    type: "mcq",
    prompt: "What is a scalar subquery?",
    options: [
      "A subquery that returns exactly one row and one column — a single value",
      "A subquery that returns a whole column of values, which is then matched against the outer query using IN",
      "A subquery placed in the FROM clause that behaves like a temporary table for the outer query to read from",
      "A subquery that references the outer query's current row and therefore re-runs once for every outer row seen",
    ],
    answer: 0,
    explanation:
      "A scalar subquery yields a single value (one row, one column) and can be used wherever a single value is allowed.",
  },
  {
    id: "sq-above-avg-predict",
    type: "predict",
    prompt: "Prices are 30, 50, 70 (average 50). Which products does this return?",
    code: `SELECT name FROM products\nWHERE price > (SELECT AVG(price) FROM products);`,
    options: [
      "Only the product priced 70",
      "The products priced 50 and 70, because the comparison keeps every price that is greater than or equal to the average",
      "All three products, because the subquery recomputes a fresh average once for each row and each row beats its own",
      "None of the products, because you cannot compare a price column against the result of an aggregate subquery",
    ],
    answer: 0,
    explanation:
      "The subquery computes 50, so the filter is `price > 50`. Only 70 passes; 30 and 50 do not.",
  },
  {
    id: "sq-in-fill",
    type: "fill",
    prompt: "To keep customers whose id appears in a column of ids returned by a subquery, use `id ___ (SELECT ...)`.",
    answers: ["IN", "in"],
    hint: "Membership against a list.",
    explanation:
      "`IN (SELECT customer_id FROM orders)` keeps customers whose id is among the subquery's returned values.",
  },
  {
    id: "sq-derived-table",
    type: "mcq",
    prompt: "What is a derived table?",
    options: [
      "A subquery in the FROM clause that acts as a temporary table and must be given an alias",
      "A permanent table the database creates automatically to cache the results of any slow subquery it encounters",
      "A table produced by a join, so called because its columns are derived from two different source tables at once",
      "A copy of a table with one column removed, created so that a subquery does not accidentally expose that column",
    ],
    answer: 0,
    explanation:
      "A subquery in `FROM` is a derived table — treated like a table by the outer query — and it requires an alias to be named.",
  },
  {
    id: "sq-scalar-multi-senior",
    type: "mcq",
    prompt: "🧠 What happens if a scalar subquery in a WHERE comparison returns more than one row?",
    options: [
      "The database raises an error, because a single-value context can't accept multiple rows",
      "The database keeps only the first row the subquery returns and silently ignores all of the rows that follow it",
      "The comparison is repeated once for each returned row, and the outer row is kept if any one comparison is true",
      "The subquery results are averaged together into one number, which is then used for the single-value comparison",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A scalar context demands exactly one value. If the subquery returns multiple rows, it's an error — use `IN`/`ANY` for a multi-row comparison.",
  },
  {
    id: "sq-multi",
    type: "multi",
    prompt: "Select **all** valid places a subquery can appear.",
    options: [
      "In WHERE as a single value or a list",
      "In the SELECT list as a scalar value",
      "In FROM as a derived table (with an alias)",
      "As the target of an INSERT's table name",
    ],
    answers: [0, 1, 2],
    explanation:
      "Subqueries fit in `WHERE` (scalar or list), the `SELECT` list (scalar), and `FROM` (derived table). You can't put a subquery where the table *name* of an INSERT goes.",
  },
  {
    id: "sq-flashcard",
    type: "flashcard",
    prompt:
      "Explain subqueries: scalar, list (IN), and derived-table forms, plus the independent-vs-correlated distinction. Answer aloud, then reveal.",
    modelAnswer:
      "A **subquery** is a `SELECT` nested inside another query; its result feeds the outer one. Three forms: (1) a **scalar** subquery returns exactly **one row, one column** — a single value usable in `WHERE` or the `SELECT` list (e.g. `WHERE price > (SELECT AVG(price) ...)`); returning multiple rows in that context is an **error**. (2) A **list** subquery returns a column of values for **`IN`**/`NOT IN` (e.g. customers whose id is `IN (SELECT customer_id FROM orders)`); beware `NOT IN` with NULLs. (3) A **derived table** is a subquery in **`FROM`**, treated like a temporary table and **requiring an alias** — handy for filtering on an aggregate without `HAVING`. These are **independent** subqueries: the inner query doesn't reference the outer, so it runs **once**. A subquery that *does* reference the outer row (re-running per row) is a **correlated** subquery.",
    keyPoints: [
      "Subquery = nested SELECT feeding the outer query",
      "Scalar = one value (WHERE/SELECT); multiple rows in scalar context = error",
      "List subquery with IN/NOT IN (NOT IN + NULL trap)",
      "Derived table in FROM needs an alias",
      "Independent subquery runs once; correlated re-runs per outer row",
    ],
    explanation:
      "A strong answer names the three forms, the scalar single-value rule, the derived-table alias requirement, and independent-vs-correlated.",
  },
];

export default quiz;
