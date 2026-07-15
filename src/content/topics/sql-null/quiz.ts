import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "null-meaning",
    type: "mcq",
    prompt: "What does NULL represent in SQL?",
    options: [
      "An unknown or absent value — no value at all",
      "The number zero, stored in a compact form that saves space compared with writing out a full integer value",
      "An empty piece of text, exactly equivalent to a string that happens to contain zero visible characters in it",
      "A placeholder the database inserts temporarily and then replaces with real data during the next backup cycle",
    ],
    answer: 0,
    explanation:
      "NULL means *unknown / no value* — distinct from the number 0 and from an empty string, both of which are known values.",
  },
  {
    id: "null-compare",
    type: "predict",
    prompt: "What is the result of comparing an unknown value with a known one?",
    code: `NULL = 'Grace'`,
    options: [
      "UNKNOWN — since the value is unknown, whether it equals 'Grace' is also unknown",
      "FALSE, because the two values are clearly different and a difference always evaluates to a false comparison",
      "TRUE, because the database treats a NULL as a wildcard that is considered equal to whatever it is compared to",
      "An error is raised, because you are never permitted to compare a NULL against a known value inside a query",
    ],
    answer: 0,
    explanation:
      "Any comparison with NULL yields UNKNOWN (three-valued logic). `WHERE` keeps only TRUE rows, so such a comparison never matches.",
  },
  {
    id: "null-is-null",
    type: "predict",
    prompt: "Rows: Ada(Grace), Beka(NULL), Dato(NULL). What does this return?",
    code: `SELECT name FROM users WHERE middle_name = NULL;`,
    options: [
      "No rows at all, because = NULL is always UNKNOWN and never TRUE",
      "Beka and Dato, because their middle_name column is empty and therefore matches the NULL on the right side",
      "All three rows, since comparing any value against NULL is treated by the engine as an always-true condition",
      "Ada only, because she is the single row whose middle name is actually a known and clearly present value",
    ],
    answer: 0,
    explanation:
      "`= NULL` is UNKNOWN for every row, so nothing matches. To find missing values use `IS NULL` (which would return Beka and Dato).",
  },
  {
    id: "null-test-fill",
    type: "fill",
    prompt: "To keep only rows where a column has no value, the condition to write is `column ___ NULL`.",
    answers: ["IS", "is"],
    hint: "Not '=' — a two-letter keyword.",
    explanation:
      "`IS NULL` (and `IS NOT NULL`) are the only correct tests for missing values. `= NULL` never matches.",
  },
  {
    id: "null-three-valued",
    type: "fill",
    prompt: "Because a condition can be TRUE, FALSE, or UNKNOWN, SQL's logic is called ___-valued logic.",
    answers: ["three", "3", "three-valued", "3-valued"],
    hint: "Count the possible results.",
    explanation:
      "Three-valued logic adds UNKNOWN to TRUE and FALSE. `WHERE` keeps only the TRUE rows, discarding both FALSE and UNKNOWN.",
  },
  {
    id: "null-avg-predict",
    type: "predict",
    prompt: "The salary column holds 100, NULL, and 200. What does AVG(salary) return?",
    code: `SELECT AVG(salary) FROM staff;`,
    options: [
      "150 — the NULL is skipped, so it averages 100 and 200 only",
      "100, because the middle value counts as a zero and pulls the three-number average down toward the lower end",
      "An error, since an average cannot be computed for a column that contains one or more NULL values anywhere",
      "NULL, because the presence of a single NULL anywhere in the column makes the entire aggregate result unknown",
    ],
    answer: 0,
    difficulty: "mid",
    explanation:
      "`AVG` ignores NULLs and divides by the count of non-NULL values: (100 + 200) / 2 = 150. It does *not* treat NULL as zero.",
  },
  {
    id: "null-count-multi",
    type: "multi",
    prompt: "Given salaries 100, NULL, 200, select **all** true statements.",
    options: [
      "COUNT(*) returns 3",
      "COUNT(salary) returns 2",
      "SUM(salary) returns 300",
      "COUNT(salary) returns 3",
    ],
    answers: [0, 1, 2],
    explanation:
      "`COUNT(*)` counts rows (3); `COUNT(salary)` skips the NULL (2); `SUM` ignores NULL (300). Option 4 is false — `COUNT(salary)` does not count the NULL.",
  },
  {
    id: "null-coalesce",
    type: "mcq",
    prompt: "What does COALESCE(middle_name, '(none)') do?",
    options: [
      "Returns middle_name if it is not NULL, otherwise returns '(none)'",
      "Concatenates the middle name and the text '(none)' together into one combined string for every single row",
      "Deletes any row whose middle_name column is NULL and then substitutes the text '(none)' into the results",
      "Renames the middle_name column to '(none)' permanently in the table's stored schema definition on disk",
    ],
    answer: 0,
    explanation:
      "`COALESCE` returns the first non-NULL argument left to right — a clean way to supply a default in place of NULL.",
  },
  {
    id: "null-not-in-senior",
    type: "mcq",
    prompt: "🧠 Why can `WHERE id NOT IN (1, 2, NULL)` surprisingly return no rows?",
    options: [
      "A NULL in the list makes the NOT IN comparison evaluate to UNKNOWN, so no row is ever TRUE",
      "NOT IN is not valid SQL syntax, so the database silently returns an empty result set instead of an error",
      "The list may only contain two values at most, so adding a third entry causes the whole condition to fail",
      "NULL in a list is automatically expanded to every possible id, which then excludes all rows from the output",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`NOT IN` with a NULL in the list turns the comparison UNKNOWN for every row, so nothing qualifies. Filter NULLs out of the list (or use `NOT EXISTS`) to avoid it.",
  },
  {
    id: "null-flashcard",
    type: "flashcard",
    prompt:
      "Explain NULL, three-valued logic, how to test for it, and how aggregates treat it. Answer aloud, then reveal.",
    modelAnswer:
      "**NULL** means **unknown / absent** — not `0`, not `''`. Because the value is unknown, any comparison with it yields **UNKNOWN**, the third result in SQL's **three-valued logic** (TRUE / FALSE / UNKNOWN). `WHERE` keeps only **TRUE** rows, so UNKNOWN rows are dropped like FALSE ones — which is why `= NULL` and `<> NULL` never match. Test for missing values with **`IS NULL`** / **`IS NOT NULL`**. In `AND`/`OR`, UNKNOWN propagates: `TRUE OR UNKNOWN` = TRUE, `FALSE AND UNKNOWN` = FALSE, otherwise UNKNOWN. **Aggregates skip NULLs**: `SUM`/`AVG`/`COUNT(col)` ignore them, so `AVG` divides by the non-NULL count (NULL ≠ 0), while `COUNT(*)` counts all rows. Use **`COALESCE(a, b, …)`** to return the first non-NULL — handy for defaults or turning NULL into 0 before math. Gotcha: `NOT IN` with a NULL in the list returns no rows.",
    keyPoints: [
      "NULL = unknown, not 0 or ''",
      "Comparisons give UNKNOWN; WHERE keeps only TRUE",
      "Test with IS NULL / IS NOT NULL, never = NULL",
      "Aggregates skip NULL; AVG divides by non-NULL count; COUNT(*) counts all rows",
      "COALESCE supplies a default; NOT IN with NULL matches nothing",
    ],
    explanation:
      "A strong answer ties NULL=unknown to three-valued logic, IS NULL for testing, and the aggregate/AVG behavior.",
  },
];

export default quiz;
