import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ls-ddl",
    type: "mcq",
    prompt: "Which family do CREATE, ALTER, and DROP belong to, and what do they act on?",
    options: [
      "DDL — they define the structure of tables, not the rows inside them",
      "DML — they add, change, and remove the individual rows that are stored inside an existing table",
      "TCL — they group several row changes together into a single transaction that commits all at once",
      "DCL — they decide which database users are allowed to read from or write to a particular table",
    ],
    answer: 0,
    explanation:
      "`CREATE`/`ALTER`/`DROP` are Data Definition Language: they shape tables and other structures, leaving row contents to DML.",
  },
  {
    id: "ls-dml",
    type: "mcq",
    prompt: "What do the DML commands INSERT, UPDATE, and DELETE do?",
    options: [
      "Add, change, and remove rows within a table",
      "Create and destroy whole tables along with all of the columns and indexes those tables happen to contain",
      "Grant and revoke the permissions that control which users may connect to and query the running database",
      "Read rows out of a table and return them to you without ever modifying any of the stored data at all",
    ],
    answer: 0,
    explanation:
      "DML manipulates the *data*: `INSERT` adds rows, `UPDATE` changes them, `DELETE` removes them. Structure stays untouched.",
  },
  {
    id: "ls-select-family",
    type: "fill",
    prompt: "SELECT is the one command in the D__ family (Data Query Language) — it reads rows and changes nothing.",
    answers: ["Q", "DQL", "q"],
    hint: "Data _uery Language.",
    explanation:
      "`SELECT` is Data Query Language (DQL) — read-only. Some texts fold it into DML, but it never modifies data.",
  },
  {
    id: "ls-alter-predict",
    type: "predict",
    prompt: "Which family does this statement belong to?",
    code: `ALTER TABLE orders ADD shipped BOOLEAN;`,
    options: [
      "DDL — it changes the table's structure by adding a column",
      "DML — it updates the value of the shipped column for every order row currently stored in the table",
      "DQL — it reads back the shipped status of the orders so you can display them to the user on screen",
      "TCL — it opens a transaction so the new column can later be committed or rolled back as one unit",
    ],
    answer: 0,
    explanation:
      "Adding a column changes *structure*, so it's DDL — despite operating on the orders table. `UPDATE` (DML) would change values, not columns.",
  },
  {
    id: "ls-tcl",
    type: "mcq",
    prompt: "What is the role of the TCL commands COMMIT and ROLLBACK?",
    options: [
      "To make a group of changes permanent, or to undo them as one all-or-nothing unit",
      "To create and drop the tables that a transaction will later read from and write new rows into",
      "To grant a user permission to begin transactions and then revoke that permission again afterward",
      "To read the current contents of a table at the exact moment just before the transaction started",
    ],
    answer: 0,
    explanation:
      "Transaction Control Language groups DML into a transaction: `COMMIT` makes every change permanent, `ROLLBACK` discards them all.",
  },
  {
    id: "ls-rollback-senior",
    type: "mcq",
    prompt: "🧠 Can you typically ROLLBACK a DROP TABLE, and why?",
    options: [
      "Usually no — DDL commonly auto-commits, so the drop is permanent the moment it runs",
      "Yes, because every SQL statement without exception is held in a transaction until you commit it manually",
      "Yes, but only if the table was completely empty at the time, since there were no rows that could be lost",
      "No, because ROLLBACK is a DCL permission command and has nothing to do with undoing structural changes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "In many databases DDL auto-commits, so `DROP TABLE` can't be rolled back. DML changes, by contrast, can be undone until you commit.",
  },
  {
    id: "ls-families-multi",
    type: "multi",
    prompt: "Select **all** correct family assignments.",
    options: [
      "GRANT and REVOKE are DCL",
      "INSERT is DML",
      "SELECT is read-only",
      "CREATE TABLE is DML",
    ],
    answers: [0, 1, 2],
    explanation:
      "`GRANT`/`REVOKE` are DCL, `INSERT` is DML, and `SELECT` is read-only. `CREATE TABLE` is DDL, not DML — so option 4 is false.",
  },
  {
    id: "ls-flashcard",
    type: "flashcard",
    prompt:
      "Name SQL's command families with an example each, and explain why the grouping matters for rollback. Answer aloud, then reveal.",
    modelAnswer:
      "SQL commands split into families by job. **DDL** (Data Definition) — `CREATE`/`ALTER`/`DROP` — defines *structure* (tables, columns). **DML** (Data Manipulation) — `INSERT`/`UPDATE`/`DELETE` — changes *rows*. **DQL** (Data Query) — `SELECT` — *reads* rows and changes nothing (often folded into DML). **TCL** (Transaction Control) — `COMMIT`/`ROLLBACK` — groups DML into an all-or-nothing **transaction**. **DCL** (Data Control) — `GRANT`/`REVOKE` — manages **permissions**. Why it matters: DML inside a transaction can be **rolled back** until you `COMMIT`, but DDL commonly **auto-commits**, so a `DROP TABLE` is usually permanent the instant it runs. Knowing a statement's family tells you what it touches (structure vs rows vs access) and whether it can be undone.",
    keyPoints: [
      "DDL = structure (CREATE/ALTER/DROP)",
      "DML = rows (INSERT/UPDATE/DELETE); DQL = SELECT (read-only)",
      "TCL = COMMIT/ROLLBACK (transactions); DCL = GRANT/REVOKE (permissions)",
      "DML is rollback-able; DDL often auto-commits and isn't",
    ],
    explanation:
      "A strong answer lists the families with an example each and ties DDL's auto-commit to why DROP can't be undone.",
  },
];

export default quiz;
