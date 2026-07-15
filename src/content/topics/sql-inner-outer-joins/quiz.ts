import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "io-inner",
    type: "mcq",
    prompt: "What rows does an INNER JOIN return?",
    options: [
      "Only rows that have a match on both sides of the join condition",
      "Every row from the first table, plus a NULL-filled placeholder for each row of the second table that is unmatched",
      "Every possible pairing of a row from each table, regardless of whether the join condition is satisfied or not",
      "Only rows from the left table, since the right table is used purely to test the condition and is then discarded",
    ],
    answer: 0,
    explanation:
      "An inner join keeps only rows where the `ON` condition matches on both sides. Unmatched rows from either table are dropped.",
  },
  {
    id: "io-left",
    type: "mcq",
    prompt: "What does a LEFT JOIN do that an INNER JOIN does not?",
    options: [
      "It keeps every row of the left table, using NULLs where the right table has no match",
      "It runs the join in reverse, matching the right table's rows against the left instead of the other way around",
      "It removes duplicate rows from the result so that each left-table row can appear at most one single time",
      "It sorts the joined result by the left table's primary key before any of the right table's columns are attached",
    ],
    answer: 0,
    explanation:
      "A left join preserves all left-table rows. Where the right table has no match, its columns come back NULL.",
  },
  {
    id: "io-inner-count-predict",
    type: "predict",
    prompt: "Ada has 2 orders, Beka has 1, Carlo has 0. How many rows does this return?",
    code: `SELECT customers.name FROM customers\nINNER JOIN orders ON orders.customer_id = customers.id;`,
    options: [
      "3 — Ada twice, Beka once, and Carlo not at all",
      "4, because all three customers appear once and Ada then contributes one additional row for her second order",
      "1, because an inner join collapses the matching customers down into a single combined summary row of output",
      "0, because none of the customer id values are exactly equal to any of the order id values in the two tables",
    ],
    answer: 0,
    explanation:
      "Inner join yields one row per match: Ada matches 2 orders (2 rows), Beka 1 (1 row), Carlo 0. Total 3 — and a join can multiply rows.",
  },
  {
    id: "io-on-fill",
    type: "fill",
    prompt: "The clause that states the matching rule between the two joined tables begins with the keyword ___.",
    answers: ["ON", "on"],
    hint: "Two letters; it holds the equality between the key columns.",
    explanation:
      "The `ON` clause defines how rows pair up, e.g. `ON orders.customer_id = customers.id`.",
  },
  {
    id: "io-anti-join",
    type: "mcq",
    prompt: "How do you find customers who have never placed an order?",
    options: [
      "LEFT JOIN orders and keep rows where orders.id IS NULL",
      "INNER JOIN orders and keep rows where orders.total is greater than zero for every one of the customer's orders",
      "CROSS JOIN orders and then remove any customer whose id appears more than once anywhere in the joined output",
      "RIGHT JOIN orders and keep only the rows where the customer name column comes back populated with a real value",
    ],
    answer: 0,
    explanation:
      "The anti-join: a left join gives unmatched customers a NULL right side, and `WHERE orders.id IS NULL` keeps exactly those.",
  },
  {
    id: "io-outer-multi",
    type: "multi",
    prompt: "Select **all** true statements about joins.",
    options: [
      "INNER JOIN drops rows with no match on either side",
      "LEFT JOIN keeps all rows of the left table",
      "FULL OUTER JOIN keeps unmatched rows from both tables",
      "INNER JOIN keeps unmatched rows from the left table",
    ],
    answers: [0, 1, 2],
    explanation:
      "Inner drops unmatched rows, left keeps all left rows, full outer keeps unmatched from both. Option 4 contradicts option 1 — inner keeps no unmatched rows.",
  },
  {
    id: "io-where-demotes-senior",
    type: "mcq",
    prompt: "🧠 A LEFT JOIN unexpectedly hides customers with no orders once you add `WHERE orders.total > 0`. Why?",
    options: [
      "The WHERE condition rejects the NULL right-side rows, effectively turning the left join into an inner join",
      "WHERE always runs before the join, so it filters the orders table down before any customers can be matched to it",
      "A left join can only keep unmatched rows when the query has no WHERE clause of any kind anywhere in the statement",
      "The total column is indexed, and any condition on an indexed column silently converts every join into an inner join",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Unmatched rows have `orders.total = NULL`, and `NULL > 0` is not TRUE, so `WHERE` drops them — demoting the left join. Put the condition in `ON` to keep them.",
  },
  {
    id: "io-flashcard",
    type: "flashcard",
    prompt:
      "Explain inner vs outer joins, the ON clause, the anti-join pattern, and how a WHERE can demote a left join. Answer aloud, then reveal.",
    modelAnswer:
      "A **join** combines rows from two tables using the **`ON`** condition (the matching rule, e.g. `orders.customer_id = customers.id`). An **`INNER JOIN`** keeps only rows that **match on both sides** — unmatched rows from either table vanish. An **outer join** also keeps unmatched rows: **`LEFT JOIN`** keeps every row of the **left** table (the one before the keyword), NULL-filling the right where there's no match; **`RIGHT JOIN`** mirrors it (= `B LEFT JOIN A`); **`FULL OUTER JOIN`** keeps unmatched rows from **both** sides. Joins can **multiply** rows: one left row with N matches → N result rows. The **anti-join** finds unmatched rows — `LEFT JOIN ... WHERE right.id IS NULL` (e.g. customers with no orders). Watch out: a `WHERE` condition on the outer table (like `orders.total > 0`) rejects the NULL rows a left join added, silently **demoting it to an inner join** — put such conditions in the `ON` clause instead.",
    keyPoints: [
      "INNER = matches only; OUTER (left/right/full) also keeps unmatched, NULL-filled",
      "LEFT keeps all rows of the table before the keyword",
      "ON is the matching rule; a join can multiply rows",
      "Anti-join: LEFT JOIN ... WHERE right.id IS NULL",
      "WHERE on the outer table can demote a LEFT JOIN to inner — use ON",
    ],
    explanation:
      "A strong answer contrasts inner/outer, gives the anti-join pattern, and knows the WHERE-demotes-a-left-join gotcha.",
  },
];

export default quiz;
