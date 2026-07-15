import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sc-self-purpose",
    type: "mcq",
    prompt: "When do you use a self join?",
    options: [
      "When rows in a table relate to other rows in the same table, like employees and their managers",
      "When two entirely separate tables happen to share one column name and you want to combine them into a single one",
      "When a table has grown too large and you need to split its rows across two physical copies to speed up reads",
      "When you want to remove duplicate rows from a table by comparing it against a backup copy of the exact same data",
    ],
    answer: 0,
    explanation:
      "A self join joins a table to itself — the way to follow a relationship that points from one row to another row in the same table.",
  },
  {
    id: "sc-alias-fill",
    type: "fill",
    prompt: "A self join requires table ___ (like e and m) so the two copies of the table can be told apart.",
    answers: ["aliases", "alias"],
    hint: "Short nicknames you give a table with AS.",
    explanation:
      "Aliases disambiguate the two roles of the table. Without them, a column like `id` is ambiguous — which copy?",
  },
  {
    id: "sc-cross-product",
    type: "predict",
    prompt: "sizes has 3 rows and colors has 4 rows. How many rows does this return?",
    code: `SELECT * FROM sizes CROSS JOIN colors;`,
    options: [
      "12 — every size paired with every color (3 × 4)",
      "7, because a cross join adds the number of rows in each of the two tables together to form its result set",
      "3, because the result can never contain more rows than the smaller of the two tables that are being joined",
      "0, because a cross join has no ON condition and therefore no pair of rows can ever satisfy the join at all",
    ],
    answer: 0,
    explanation:
      "A cross join is the Cartesian product: every combination. The row count is the product of the inputs — 3 × 4 = 12.",
  },
  {
    id: "sc-cross-def",
    type: "mcq",
    prompt: "What does a CROSS JOIN produce?",
    options: [
      "The Cartesian product — every row of one table paired with every row of the other",
      "Only the rows whose primary key values happen to appear in both of the two tables being joined together",
      "One row for each table, summarizing that table's contents into a single combined statistics row per side",
      "The rows of the first table followed immediately by the rows of the second table, stacked into one column",
    ],
    answer: 0,
    explanation:
      "A cross join pairs every row with every row — the Cartesian product — with no join condition.",
  },
  {
    id: "sc-accidental",
    type: "mcq",
    prompt: "Why is `SELECT * FROM orders, customers;` (no WHERE) usually a bug?",
    options: [
      "It cross-joins the tables, pairing every order with every customer and exploding the row count",
      "It is invalid syntax, so the database refuses to run it and returns a parser error instead of any result rows",
      "It returns only orders that share an id with a customer, which is almost never the relationship you intended",
      "It deletes the join relationship between the two tables, permanently unlinking every order from its customer row",
    ],
    answer: 0,
    explanation:
      "The comma-join with no `WHERE` is an implicit cross join. 10k orders × 5k customers = 50M rows. Always state the join condition.",
  },
  {
    id: "sc-self-root-senior",
    type: "predict",
    prompt: "🧠 Ada has manager_id NULL. Why does an INNER self join drop her, and what fixes it?",
    code: `SELECT e.name, m.name FROM employees e\nINNER JOIN employees m ON e.manager_id = m.id;`,
    options: [
      "NULL matches no id, so the inner join excludes Ada; a LEFT JOIN keeps her with a NULL manager",
      "Ada is dropped because she is the first row, and switching the order of the two aliased tables restores her to the output",
      "The inner join drops her because her name is also used as a manager elsewhere, creating a cycle the engine removes",
      "Nothing is wrong; Ada appears twice in the result, once as an employee and once again in her role as a manager",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Ada's `manager_id` is NULL, which matches no `m.id`, so an inner join excludes her. A `LEFT JOIN` keeps the hierarchy root with a NULL manager.",
  },
  {
    id: "sc-multi",
    type: "multi",
    prompt: "Select **all** true statements about self and cross joins.",
    options: [
      "A self join needs aliases to distinguish the two copies",
      "A cross join's row count is the product of the inputs",
      "A cross join has no ON condition",
      "A self join can only ever be an INNER JOIN",
    ],
    answers: [0, 1, 2],
    explanation:
      "Self joins need aliases, cross joins multiply row counts and have no `ON`. Option 4 is false — a self join is often a `LEFT JOIN` (to keep a hierarchy root).",
  },
  {
    id: "sc-flashcard",
    type: "flashcard",
    prompt:
      "Explain self joins and cross joins — when each is used, aliases, the Cartesian product, and the accidental-cross-join bug. Answer aloud, then reveal.",
    modelAnswer:
      "A **self join** joins a table **to itself** to follow a relationship between rows of the *same* table (e.g. employee → manager via `manager_id`). It's an ordinary join, but you must give the two copies **aliases** (`e`, `m`) to disambiguate columns — match `e.manager_id = m.id`. Use a **`LEFT JOIN`** so the top of a hierarchy (whose `manager_id` is NULL) isn't dropped. A **cross join** pairs **every** row of one table with **every** row of another — the **Cartesian product**, no `ON` — so the row count is the **product** of the inputs (3 × 4 = 12). It's occasionally intentional (generating combinations like size×color variants) but usually an **accidental bug**: a comma-join with no `WHERE`, or a join with a forgotten `ON`, explodes the row count (10k × 5k = 50M). A runaway row count is the tell of a missing join condition.",
    keyPoints: [
      "Self join = table joined to itself; aliases are mandatory",
      "Use LEFT JOIN in a self join to keep a hierarchy's root (NULL parent)",
      "Cross join = Cartesian product, no ON, count = product of inputs",
      "Sometimes intentional (variant grids), usually an accidental missing-ON bug",
    ],
    explanation:
      "A strong answer explains the aliased self join with a LEFT JOIN for the root, and the cross join's product row count as both feature and accidental-bug symptom.",
  },
];

export default quiz;
