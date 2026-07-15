import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "gb-what-aggregate",
    type: "mcq",
    prompt: "What does an aggregate function like SUM or COUNT do?",
    options: [
      "Computes a single summary value from many rows",
      "Returns every row of the table unchanged but adds one extra column holding a running position number to it",
      "Sorts the rows by the named column and then keeps only the very first and very last of the sorted rows",
      "Renames the column it is applied to so that the result set uses a shorter and more readable heading name",
    ],
    answer: 0,
    explanation:
      "Aggregate functions collapse many rows into one value — a count, total, average, minimum, or maximum.",
  },
  {
    id: "gb-group-rows",
    type: "predict",
    prompt: "Cities in the sales rows: Batumi, Batumi, Tbilisi, Tbilisi, Tbilisi. How many rows does this return?",
    code: `SELECT city, COUNT(*)\nFROM sales\nGROUP BY city;`,
    options: [
      "2 — one row per distinct city",
      "5, because a grouped query returns exactly one output row for each original input row in the sales table",
      "1, because COUNT collapses the entire table down to a single summary row no matter how it is grouped",
      "3, one row for each of the Tbilisi sales, since that is the city with the largest number of matching rows",
    ],
    answer: 0,
    explanation:
      "`GROUP BY city` produces one row per distinct city: Batumi (count 2) and Tbilisi (count 3) — two rows.",
  },
  {
    id: "gb-select-rule",
    type: "mcq",
    prompt: "In a grouped query, which columns may appear in the SELECT list?",
    options: [
      "Only columns that are in the GROUP BY, or wrapped in an aggregate function",
      "Any column at all from the table, because the database automatically picks a sensible value for the ungrouped ones",
      "Only a single column, since a grouped query is strictly limited to one grouping key and one aggregate result",
      "Only columns that come alphabetically before the grouping column in the original definition of the table's schema",
    ],
    answer: 0,
    explanation:
      "Every non-aggregated column must appear in `GROUP BY`. A group holds many values for other columns, so there's no single one to show.",
  },
  {
    id: "gb-illegal-predict",
    type: "predict",
    prompt: "What happens when this runs?",
    code: `SELECT city, amount, SUM(amount)\nFROM sales\nGROUP BY city;`,
    options: [
      "An error — amount is neither grouped nor aggregated, so it can't be selected",
      "It returns one row per city, showing the first amount the engine finds alongside that city's summed total value",
      "It returns every original row, with the SUM column repeating the same grand total on each of the returned rows",
      "It silently drops the amount column from the output and returns just the city and the sum for each city group",
    ],
    answer: 0,
    difficulty: "mid",
    explanation:
      "Bare `amount` varies within each city group, so it must be grouped or aggregated. Standard SQL rejects the query.",
  },
  {
    id: "gb-count-star-fill",
    type: "fill",
    prompt: "To count the number of rows in each group regardless of NULLs, use COUNT(___).",
    answers: ["*", "star"],
    hint: "A single symbol meaning 'all columns / every row'.",
    explanation:
      "`COUNT(*)` counts rows including those with NULLs. `COUNT(col)` skips rows where that column is NULL.",
  },
  {
    id: "gb-multi-column",
    type: "mcq",
    prompt: "What does GROUP BY city, product produce?",
    options: [
      "One row per distinct (city, product) combination",
      "Two completely separate result sets, one grouped by city and another grouped by product, stacked together",
      "One row per city only, with the product column collapsed into a comma-separated list of every product sold",
      "One row per product only, because the last column listed in GROUP BY is the one that actually takes effect",
    ],
    answer: 0,
    explanation:
      "Multiple grouping columns group by their combination — one summary row per distinct `(city, product)` pair.",
  },
  {
    id: "gb-aggregates-multi",
    type: "multi",
    prompt: "Select **all** true statements about aggregates and GROUP BY.",
    options: [
      "GROUP BY returns one row per group",
      "SUM and AVG skip NULL values",
      "Non-aggregated selected columns must be in GROUP BY",
      "COUNT(*) ignores rows that contain any NULL",
    ],
    answers: [0, 1, 2],
    explanation:
      "The first three are correct. `COUNT(*)` counts *all* rows including those with NULLs — only `COUNT(col)` skips NULLs — so option 4 is false.",
  },
  {
    id: "gb-null-group-senior",
    type: "mcq",
    prompt: "🧠 A region column is NULL for some rows. What does GROUP BY region do with them?",
    options: [
      "Collects all the NULL rows into a single group of their own",
      "Drops every row whose region is NULL before grouping, so those rows never appear anywhere in the result at all",
      "Creates a separate one-row group for each individual NULL, since NULL never compares as equal to another NULL",
      "Raises an error, because a column that contains NULL values cannot legally be used as a grouping key in SQL",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "For grouping, all NULLs are treated as one bucket — you get a single NULL group — even though `NULL = NULL` is normally UNKNOWN.",
  },
  {
    id: "gb-flashcard",
    type: "flashcard",
    prompt:
      "Explain aggregate functions, GROUP BY, the SELECT-column rule, and how NULLs group. Answer aloud, then reveal.",
    modelAnswer:
      "**Aggregate functions** collapse many rows into one value: `COUNT(*)` (rows), `SUM`, `AVG`, `MIN`, `MAX` — all except `COUNT(*)` **skip NULLs**. Without grouping they summarize the whole table into one row. **`GROUP BY col`** first splits rows into buckets — one per distinct value (or per distinct **combination** with multiple columns) — then runs the aggregate **within each bucket**, yielding **one row per group** (not per input row). The key rule: **every column in `SELECT` that isn't inside an aggregate must appear in `GROUP BY`**, because a group holds many values for the other columns and there's no single one to show. **NULLs** in the grouping column collect into **one group** (grouping treats all NULLs as equal, unlike normal `=`). If you want per-row output *with* a group value attached instead of collapsing, that's a **window function**.",
    keyPoints: [
      "Aggregates: COUNT(*), SUM, AVG, MIN, MAX collapse rows to one value",
      "GROUP BY → one row per distinct group / combination",
      "Non-aggregated selected columns must be in GROUP BY",
      "All NULLs form a single group",
      "Per-row output with a group total = window function, not GROUP BY",
    ],
    explanation:
      "A strong answer states the SELECT-column rule with its reason, that output is one row per group, and the NULL-as-one-group behavior.",
  },
];

export default quiz;
