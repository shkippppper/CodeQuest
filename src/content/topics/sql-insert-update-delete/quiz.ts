import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "iud-insert",
    type: "mcq",
    prompt: "What does `INSERT INTO users (name, email) VALUES ('Ada', 'ada@x.com')` do?",
    options: [
      "Adds one new row, setting name and email and leaving other columns to their defaults or NULL",
      "Updates the existing row for Ada if one is found, and otherwise reports an error because no such row exists yet",
      "Adds a new column called Ada to the users table and stores the email address as that column's default value",
      "Reads back the row where name is Ada, returning it so the application can display the stored email on screen",
    ],
    answer: 0,
    explanation:
      "`INSERT` adds a new row with the given column values. Unlisted columns take their default or NULL.",
  },
  {
    id: "iud-no-where-predict",
    type: "predict",
    prompt: "The users table has 100 rows. What does this statement do?",
    code: `UPDATE users SET email = 'new@x.com';`,
    options: [
      "Sets every one of the 100 rows to the same email, because there is no WHERE to limit it",
      "Updates only the first row of the table, since an UPDATE without a WHERE affects just a single default row",
      "Does nothing and returns an error, because an UPDATE statement is not valid unless it includes a WHERE clause",
      "Adds a new row with that email, leaving the existing 100 rows in the table completely unchanged as they were",
    ],
    answer: 0,
    explanation:
      "With no `WHERE`, `UPDATE` changes *every* row — all 100 get the same email. A forgotten `WHERE` is a classic disaster.",
  },
  {
    id: "iud-where-fill",
    type: "fill",
    prompt: "To avoid changing every row, an UPDATE or DELETE should almost always include a ___ clause.",
    answers: ["WHERE", "where"],
    hint: "It picks which rows are affected.",
    explanation:
      "The `WHERE` clause limits which rows an `UPDATE`/`DELETE` touches. Without it, the statement affects the whole table.",
  },
  {
    id: "iud-update-count",
    type: "predict",
    prompt: "100 rows total, 3 with status 'banned'. How many rows does this change?",
    code: `UPDATE users SET active = false\nWHERE status = 'banned';`,
    options: [
      "3 — only the rows matching the WHERE condition",
      "100, because an UPDATE always rewrites the entire table and the WHERE clause only decides the new value to store",
      "0, because you cannot set a boolean column to false inside an UPDATE without first declaring a default for it",
      "97, since the WHERE condition selects every row that does not currently have the banned status value set on it",
    ],
    answer: 0,
    explanation:
      "`UPDATE` changes only rows matching the `WHERE` — the 3 banned users. The other 97 are untouched.",
  },
  {
    id: "iud-delete",
    type: "mcq",
    prompt: "What does `DELETE FROM users WHERE id = 1` do?",
    options: [
      "Removes the single row whose id is 1, leaving the table and its other rows intact",
      "Removes the entire users table from the database, including its structure, just as a DROP statement would do",
      "Marks the row with id 1 as hidden but keeps it stored, so it can still appear in results that opt to include it",
      "Removes the id column from every row in the table, since id is the column named in the WHERE condition",
    ],
    answer: 0,
    explanation:
      "`DELETE ... WHERE id = 1` removes just that row. `DELETE` keeps the table (and is rollback-able in a transaction), unlike `DROP`.",
  },
  {
    id: "iud-upsert-senior",
    type: "mcq",
    prompt: "🧠 What does an upsert (INSERT ... ON CONFLICT ... DO UPDATE) accomplish?",
    options: [
      "Inserts the row, or updates it instead if a row with the conflicting key already exists",
      "Inserts the row twice as a backup, so that a later delete of one copy still leaves the other copy in place",
      "Deletes any conflicting row first and then inserts the new one, discarding whatever data the old row held",
      "Inserts the row only if the table is currently empty, and otherwise silently skips the statement entirely",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "An upsert inserts when the row is new and updates when a key conflict is detected — avoiding the race in a manual check-then-write.",
  },
  {
    id: "iud-multi",
    type: "multi",
    prompt: "Select **all** true statements.",
    options: [
      "INSERT can add multiple rows in one statement",
      "UPDATE without WHERE affects every row",
      "You can INSERT the result of a SELECT into a table",
      "DELETE removes the table's structure along with its rows",
    ],
    answers: [0, 1, 2],
    explanation:
      "Multi-row inserts, whole-table updates without WHERE, and `INSERT ... SELECT` are all real. `DELETE` keeps the structure (only `DROP` removes it), so option 4 is false.",
  },
  {
    id: "iud-flashcard",
    type: "flashcard",
    prompt:
      "Explain INSERT/UPDATE/DELETE, the WHERE danger, and upsert. Answer aloud, then reveal.",
    modelAnswer:
      "The three **DML** write verbs: **`INSERT INTO t (cols) VALUES (...)`** adds a row (unlisted columns → default/NULL); you can insert **multiple rows** (comma-separated tuples) or the result of a query (`INSERT ... SELECT`). Always **name the columns** so it survives schema changes. **`UPDATE t SET col = val WHERE ...`** changes matching rows (multiple assignments comma-separated). **`DELETE FROM t WHERE ...`** removes matching rows (keeps the table, rollback-able — unlike `DROP`/`TRUNCATE`). The sharp edge: **`UPDATE`/`DELETE` with no `WHERE` affects every row** — a classic production disaster; write the `WHERE` first or preview with a `SELECT`. An **upsert** — `INSERT ... ON CONFLICT (key) DO UPDATE` (or `MERGE`) — inserts a new row or updates the existing one on a key conflict, avoiding the race in a manual check-then-insert (the conflict is detectable thanks to a `UNIQUE`/primary key).",
    keyPoints: [
      "INSERT adds rows (name columns; multi-row and INSERT...SELECT supported)",
      "UPDATE ... SET ... WHERE changes matching rows",
      "DELETE ... WHERE removes matching rows, keeps the table",
      "No WHERE on UPDATE/DELETE = every row — preview with SELECT first",
      "Upsert (ON CONFLICT/MERGE) = insert-or-update, avoids check-then-write race",
    ],
    explanation:
      "A strong answer covers the three verbs, stresses the missing-WHERE danger, and explains upsert as a race-free insert-or-update.",
  },
];

export default quiz;
