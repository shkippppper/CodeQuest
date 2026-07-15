import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ol-default-order",
    type: "mcq",
    prompt: "Without an ORDER BY clause, in what order does a SELECT return its rows?",
    options: [
      "No guaranteed order — whatever is convenient, and it may change between runs",
      "Always sorted ascending by the table's primary key, because that is the order rows are physically stored in",
      "Always in the exact order the rows were originally inserted into the table when it was first populated",
      "Alphabetically by the first text column, falling back to the first numeric column whenever there is a tie",
    ],
    answer: 0,
    explanation:
      "Row order is unspecified without `ORDER BY`. Never rely on the natural order — ask for the order you want explicitly.",
  },
  {
    id: "ol-desc",
    type: "mcq",
    prompt: "What does `ORDER BY age DESC` do?",
    options: [
      "Sorts rows from the largest age to the smallest",
      "Removes every row whose age value is a duplicate of another row already returned earlier in the result set",
      "Sorts rows from the smallest age to the largest, which is also the default direction when none is written",
      "Groups the rows into age brackets and returns a single summary row for each distinct bracket that exists",
    ],
    answer: 0,
    explanation:
      "`DESC` sorts descending (largest first). `ASC` — the default — sorts ascending.",
  },
  {
    id: "ol-limit-predict",
    type: "predict",
    prompt: "Ages sorted ascending: Dato 19, Beka 28, Ada 34, Carlo 41. What does this return?",
    code: `SELECT name FROM users\nORDER BY age LIMIT 2 OFFSET 1;`,
    options: [
      "Beka and Ada",
      "Dato and Beka, the first two rows of the ascending result before any of them are skipped by the query",
      "Ada and Carlo, because OFFSET 1 counts from the end and LIMIT then keeps the two oldest of the users",
      "Only Beka, since OFFSET 1 skips one row and LIMIT 2 cannot return more rows than the offset removed",
    ],
    answer: 0,
    explanation:
      "Sort ascending, skip the first row (Dato) via `OFFSET 1`, then take two: Beka and Ada.",
  },
  {
    id: "ol-distinct-fill",
    type: "fill",
    prompt: "To return each city only once even when many users share it, add the keyword ___ after SELECT.",
    answers: ["DISTINCT", "distinct"],
    hint: "It removes duplicate rows from the result.",
    explanation:
      "`SELECT DISTINCT city` collapses duplicate rows so each value appears once.",
  },
  {
    id: "ol-tiebreak",
    type: "mcq",
    prompt: "What does `ORDER BY city ASC, age DESC` produce?",
    options: [
      "Rows sorted by city A→Z, and within each city by age from highest to lowest",
      "Rows sorted by city and age added together into a single combined sort key that mixes text with numbers",
      "Rows sorted by age from highest to lowest first, using city only to label each group in the final output",
      "An error, because a single ORDER BY clause is not permitted to reference two different columns at once",
    ],
    answer: 0,
    explanation:
      "The first column is the primary sort; the second breaks ties. Each column carries its own direction.",
  },
  {
    id: "ol-limit-no-order",
    type: "mcq",
    prompt: "Why is `SELECT ... LIMIT 5` without an ORDER BY usually a bug?",
    options: [
      "Which 5 rows you get is unpredictable and may change between runs",
      "LIMIT is only valid when it is paired with an OFFSET, so the database rejects the query outright as invalid",
      "LIMIT always returns the 5 newest rows, which is rarely the specific set of rows the developer actually wanted",
      "The number after LIMIT must match the number of columns selected, so 5 only works on a five-column table",
    ],
    answer: 0,
    explanation:
      "Without `ORDER BY`, 'the first 5' has no defined meaning — you get an arbitrary 5. Sort first, then limit.",
  },
  {
    id: "ol-distinct-multi-senior",
    type: "predict",
    prompt: "🧠 Users: (Batumi,34), (Batumi,41), (Tbilisi,28). What does this return?",
    code: `SELECT DISTINCT city, age FROM users;`,
    options: [
      "All three rows, because each (city, age) pair is unique",
      "Two rows, one per distinct city, keeping only the first age value the engine happens to encounter for each",
      "One row, because DISTINCT collapses everything down to a single representative row for the whole table",
      "Three rows but with the age column blanked out, since DISTINCT can only ever apply to one column at a time",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`DISTINCT` considers all selected columns together. The two Batumi rows differ in age, so the pair is unique — all three rows remain.",
  },
  {
    id: "ol-offset-slow-senior",
    type: "mcq",
    prompt: "🧠 Why does `LIMIT 10 OFFSET 100000` tend to get slow on a large table?",
    options: [
      "The database still scans and discards all 100000 skipped rows before returning the 10 you want",
      "OFFSET forces the query to sort the table a second time from scratch once per row that is being skipped over",
      "Large OFFSET values are stored as text internally, so the database must parse each one character by character",
      "The database rebuilds every index on the table each time the OFFSET exceeds the number of rows in a page",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "OFFSET doesn't skip cheaply — the engine produces and throws away the skipped rows. Deep paging is why keyset (seek) pagination is preferred at scale.",
  },
  {
    id: "ol-flashcard",
    type: "flashcard",
    prompt:
      "Explain ORDER BY (direction + tie-breakers), LIMIT/OFFSET paging, and DISTINCT. Answer aloud, then reveal.",
    modelAnswer:
      "Rows have **no guaranteed order** without **`ORDER BY`**. `ORDER BY col` sorts **ascending** (`ASC`, the default); `DESC` reverses it. List multiple columns for **tie-breakers** — the first is primary, later ones settle ties, each with its own direction (`ORDER BY city ASC, age DESC`). **`LIMIT n`** caps the row count and runs **after** the sort, so `ORDER BY x DESC LIMIT 10` = top 10 — `LIMIT` without `ORDER BY` returns an arbitrary set. **`OFFSET m`** skips m rows first, giving pages (`LIMIT 10 OFFSET 20` = page 3), but needs a **stable, unique** `ORDER BY` or pages drift; large offsets are **slow** because skipped rows are still produced and discarded (hence keyset pagination). **`DISTINCT`** removes duplicate rows, considering **all selected columns together**, not just one.",
    keyPoints: [
      "No order without ORDER BY; ASC default, DESC reverses",
      "Extra ORDER BY columns break ties, each with its own direction",
      "LIMIT runs after sort; needs ORDER BY to be meaningful",
      "OFFSET pages but needs a stable sort; big offsets are slow",
      "DISTINCT de-duplicates the whole selected row",
    ],
    explanation:
      "A strong answer covers sort direction + tie-breakers, sort-before-limit, OFFSET's stable-sort requirement and cost, and DISTINCT spanning all columns.",
  },
];

export default quiz;
