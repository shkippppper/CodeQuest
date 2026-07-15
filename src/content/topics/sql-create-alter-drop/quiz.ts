import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "cad-create",
    type: "mcq",
    prompt: "What does CREATE TABLE do?",
    options: [
      "Defines a new table's columns and types; the table starts empty",
      "Inserts a starter set of example rows into a table so that developers have some data to query right away",
      "Copies an existing table, including all of its current rows, into a second table under a brand-new name",
      "Marks a table as read-only so that its structure can never be altered again once it has been created once",
    ],
    answer: 0,
    explanation:
      "`CREATE TABLE` declares the columns and types. The table exists immediately but contains no rows until you insert some.",
  },
  {
    id: "cad-alter",
    type: "mcq",
    prompt: "What is ALTER TABLE used for?",
    options: [
      "Changing an existing table's structure, such as adding, dropping, or renaming a column",
      "Changing the values stored in existing rows, for example setting every user's status column to active at once",
      "Switching the table between different storage engines without having to recreate it from scratch each time",
      "Reordering the rows of a table so that they are physically stored sorted by the primary key on disk permanently",
    ],
    answer: 0,
    explanation:
      "`ALTER TABLE` modifies structure — add/drop/rename columns, etc. Changing row *values* is `UPDATE` (DML), not `ALTER`.",
  },
  {
    id: "cad-truncate-predict",
    type: "predict",
    prompt: "After running this, can you still `SELECT * FROM users`?",
    code: `TRUNCATE TABLE users;`,
    options: [
      "Yes — the table still exists but now returns zero rows",
      "No — TRUNCATE removes the table definition, so the SELECT fails with a 'no such table' error afterward instead",
      "Yes, and it returns exactly the same rows as before, because TRUNCATE only marks them as hidden rather than gone",
      "No — TRUNCATE locks the table permanently so that no query can read from it until the database is restarted again",
    ],
    answer: 0,
    explanation:
      "`TRUNCATE` empties all rows but keeps the table's definition. `SELECT` still works and returns zero rows. `DROP` would remove the table itself.",
  },
  {
    id: "cad-drop-fill",
    type: "fill",
    prompt: "To remove an entire table — its structure and all its rows — use the DDL command ___ TABLE.",
    answers: ["DROP", "drop"],
    hint: "The opposite of CREATE.",
    explanation:
      "`DROP TABLE` deletes the whole table. `DELETE` only removes rows and keeps the table.",
  },
  {
    id: "cad-delete-vs-drop",
    type: "mcq",
    prompt: "What's the difference between DELETE FROM t and DROP TABLE t?",
    options: [
      "DELETE removes rows and keeps the table; DROP removes the entire table including its structure",
      "DELETE removes the table structure while keeping the rows in a temporary buffer, and DROP discards that buffer too",
      "They are identical, except that DROP is the older spelling that some databases keep only for backward compatibility",
      "DELETE removes columns from the table one at a time, whereas DROP removes whole rows that match a given condition",
    ],
    answer: 0,
    explanation:
      "`DELETE` (DML) removes rows, table stays. `DROP` (DDL) removes the entire table — structure and rows together.",
  },
  {
    id: "cad-autocommit-senior",
    type: "mcq",
    prompt: "🧠 You accidentally DROP the wrong table inside a transaction, then ROLLBACK. In many databases, what happens?",
    options: [
      "The table stays dropped — DDL commonly auto-commits, so the ROLLBACK can't undo it",
      "The table is fully restored, because every statement without exception is protected by the surrounding transaction",
      "Only the table's rows are restored but its columns are lost, leaving an empty structureless table behind afterward",
      "The ROLLBACK is rejected as an error, since you are never permitted to roll back after issuing any DROP statement",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "DDL like `DROP` often auto-commits, so a `ROLLBACK` won't bring the table back — unlike a `DELETE` inside a transaction. Structural changes need extra caution.",
  },
  {
    id: "cad-multi",
    type: "multi",
    prompt: "Select **all** true statements.",
    options: [
      "CREATE TABLE makes an empty table",
      "TRUNCATE removes all rows but keeps the table",
      "DELETE can target specific rows with WHERE",
      "ALTER TABLE changes the values inside existing rows",
    ],
    answers: [0, 1, 2],
    explanation:
      "CREATE makes an empty table, TRUNCATE empties but keeps it, DELETE can filter rows. `ALTER` changes *structure*, not row values — so option 4 is false.",
  },
  {
    id: "cad-flashcard",
    type: "flashcard",
    prompt:
      "Explain CREATE/ALTER/DROP and the DELETE vs TRUNCATE vs DROP distinction, including rollback behavior. Answer aloud, then reveal.",
    modelAnswer:
      "**DDL** shapes the database. **`CREATE TABLE`** defines a new table's columns and types (starts empty; `IF NOT EXISTS` guards against re-creation). **`ALTER TABLE`** changes an existing table's **structure** — add/drop/rename columns — leaving rows in place (a new column is NULL for existing rows unless defaulted). **`DROP TABLE`** removes the **entire table**, structure and rows (`IF EXISTS` guards). Distinguish three 'removes': **`DELETE FROM t`** (DML) removes rows, optionally filtered by `WHERE`, table stays, rollback-able; **`TRUNCATE TABLE t`** (DDL) empties **all** rows fast, no `WHERE`, table stays; **`DROP TABLE`** removes the table itself. Crucial: **DDL commonly auto-commits**, so a mistaken `DROP`/`TRUNCATE` often **can't be rolled back**, unlike a `DELETE` inside a transaction — treat structural commands with care.",
    keyPoints: [
      "CREATE defines columns/types (empty table); ALTER changes structure; DROP removes the table",
      "DELETE = rows (WHERE-able, rollback-able); TRUNCATE = all rows fast; DROP = whole table",
      "New ALTER-added column is NULL for existing rows unless defaulted",
      "DDL usually auto-commits — DROP/TRUNCATE typically not rollback-able",
    ],
    explanation:
      "A strong answer gives the CREATE/ALTER/DROP jobs and the DELETE/TRUNCATE/DROP trio with the auto-commit rollback caveat.",
  },
];

export default quiz;
