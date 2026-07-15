import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "wf-vs-groupby",
    type: "mcq",
    prompt: "How does a window function differ from GROUP BY?",
    options: [
      "It computes an aggregate across related rows but keeps every original row",
      "It runs strictly faster than GROUP BY by scanning only the first row of each group and estimating the rest",
      "It can only ever count rows, whereas GROUP BY is able to also total and average the values inside each group",
      "It collapses the table into a single row, while GROUP BY is what produces one separate row for each group found",
    ],
    answer: 0,
    explanation:
      "A window function annotates each row with an aggregate over its window — no collapsing. `GROUP BY` returns one row per group.",
  },
  {
    id: "wf-over-empty",
    type: "predict",
    prompt: "The sales amounts are 40, 60, 30 (three rows). What does grand_total show, and how many rows return?",
    code: `SELECT id, amount,\n  SUM(amount) OVER () AS grand_total\nFROM sales;`,
    options: [
      "Three rows, each showing grand_total = 130",
      "One row showing grand_total = 130, because the SUM collapses all three of the input rows down into a single total",
      "Three rows, each showing a different grand_total that accumulates as 40, then 100, and then 130 down the column",
      "An error, because SUM must always be paired with a GROUP BY clause whenever it appears anywhere in a query",
    ],
    answer: 0,
    explanation:
      "`OVER ()` makes the window the whole result set. The total (130) is stapled onto every row, and all three rows remain.",
  },
  {
    id: "wf-partition-fill",
    type: "fill",
    prompt: "To compute a separate window total for each city while keeping all rows, write `SUM(amount) OVER (___ BY city)`.",
    answers: ["PARTITION", "partition"],
    hint: "The window equivalent of GROUP — one window per group.",
    explanation:
      "`PARTITION BY city` splits rows into per-city windows. Each row shows its own city's total, and no rows are collapsed.",
  },
  {
    id: "wf-running-total",
    type: "predict",
    prompt: "Amounts by id: id1=40, id2=60, id3=30. What is running_total for id2?",
    code: `SELECT id, amount,\n  SUM(amount) OVER (ORDER BY id) AS running_total\nFROM sales;`,
    options: [
      "100 — the sum of all rows up to and including id2 (40 + 60)",
      "60, because with an ORDER BY inside the window each row simply repeats its own amount without accumulating",
      "130, because the window still spans the entire table and every row shows the same overall grand total value",
      "50, the running average of the first two amounts rather than their running sum as the rows are processed",
    ],
    answer: 0,
    explanation:
      "An `ORDER BY` inside `OVER` makes the window 'all rows up to this one', producing a running total: 40 then 40+60 = 100.",
  },
  {
    id: "wf-ranking-multi",
    type: "multi",
    prompt: "Select **all** true statements about the ranking functions.",
    options: [
      "ROW_NUMBER() gives distinct numbers even on ties",
      "RANK() gives ties the same number then skips",
      "DENSE_RANK() gives ties the same number with no skip",
      "ROW_NUMBER() gives tied rows the same number",
    ],
    answers: [0, 1, 2],
    explanation:
      "`ROW_NUMBER` is always distinct, `RANK` ties-then-skips (1,1,3), `DENSE_RANK` ties-no-skip (1,1,2). Option 4 contradicts option 1 and is false.",
  },
  {
    id: "wf-topn-senior",
    type: "mcq",
    prompt: "🧠 What's the standard way to get the top 3 sales per city using a window function?",
    options: [
      "ROW_NUMBER() OVER (PARTITION BY city ORDER BY amount DESC) in a subquery, then filter rn <= 3 outside",
      "SUM(amount) OVER (PARTITION BY city) in the SELECT, then keep only the three rows whose sum is the highest",
      "GROUP BY city with LIMIT 3, which returns the three cities that together produced the largest total revenue",
      "RANK() OVER (ORDER BY amount) with no partition, then take every row whose rank value comes out below four",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Number rows within each city by descending amount, then keep `rn <= 3` in an outer query — the classic top-N-per-group pattern.",
  },
  {
    id: "wf-where-senior",
    type: "mcq",
    prompt: "🧠 Why can't you filter directly with `WHERE ROW_NUMBER() OVER (...) <= 3`?",
    options: [
      "Window functions are computed at the SELECT stage, after WHERE, so the value doesn't exist yet in WHERE",
      "ROW_NUMBER only produces text labels, and WHERE is unable to compare any text value against a numeric threshold",
      "WHERE may reference at most one window function, and the OVER clause already counts as that single allowed one",
      "Window functions are only permitted inside ORDER BY, so referencing one in WHERE is a hard syntax error always",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Windows are evaluated after `WHERE`/`GROUP BY`/`HAVING`, at `SELECT`. To filter on one, compute it in a subquery or CTE and filter in the outer query.",
  },
  {
    id: "wf-flashcard",
    type: "flashcard",
    prompt:
      "Explain window functions: OVER, PARTITION BY, ORDER-BY-in-window, the ranking family, and where they run. Answer aloud, then reveal.",
    modelAnswer:
      "A **window function** computes an aggregate across a set of related rows (its **window**) while **keeping every original row** — unlike `GROUP BY`, which collapses. You make one by adding **`OVER (...)`** to an aggregate: `SUM(x) OVER ()` totals all rows and staples the result onto each. **`PARTITION BY col`** gives one window per group (like `GROUP BY` but non-collapsing) — each row shows its group's aggregate. An **`ORDER BY` inside `OVER`** makes the window 'all rows up to this one', producing a **running total** (combine with `PARTITION BY` to restart per group). The **ranking** family is window-only: **`ROW_NUMBER()`** = always distinct (1,2,3); **`RANK()`** = ties share, then skip (1,1,3); **`DENSE_RANK()`** = ties share, no skip (1,1,2). Windows are evaluated at the **SELECT** stage, *after* `WHERE`/`GROUP BY`/`HAVING`, so you **can't filter them in `WHERE`** — for 'top N per group', compute `ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC)` in a subquery/CTE and filter `rn <= N` outside.",
    keyPoints: [
      "OVER turns an aggregate into a per-window value, keeping all rows",
      "PARTITION BY = per-group window (GROUP BY without collapsing)",
      "ORDER BY inside OVER → running total",
      "ROW_NUMBER distinct; RANK ties+skip; DENSE_RANK ties+no-skip",
      "Computed at SELECT (after WHERE) → top-N-per-group needs a subquery/CTE",
    ],
    explanation:
      "A strong answer contrasts windows with GROUP BY, explains PARTITION/ORDER-in-window, the ranking tie differences, and the subquery-for-top-N pattern.",
  },
];

export default quiz;
