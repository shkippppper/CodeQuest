import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "co-purpose",
    type: "mcq",
    prompt: "What does a constraint do?",
    options: [
      "Enforces a rule on the data at the database level, rejecting any write that breaks it",
      "Speeds up queries by keeping a sorted copy of one column so that lookups on that column run much faster",
      "Documents the intended meaning of a column for other developers without actually affecting any stored data",
      "Automatically fixes invalid values as they are inserted, rounding or clamping them to the nearest legal value",
    ],
    answer: 0,
    explanation:
      "A constraint is a rule the database enforces on every write from every source — invalid rows are rejected, not silently corrected.",
  },
  {
    id: "co-not-null",
    type: "mcq",
    prompt: "What does a NOT NULL constraint guarantee?",
    options: [
      "The column must always contain a value; an insert that omits it is rejected",
      "The column's values must all be different from one another, so no two rows may ever share the same value in it",
      "The column is automatically filled with a zero or an empty string whenever an insert does not provide a value",
      "The column can only hold text, since NULL is the marker used specifically for numeric columns left unfilled",
    ],
    answer: 0,
    explanation:
      "`NOT NULL` forbids missing values in that column. An insert (or update) leaving it empty is rejected.",
  },
  {
    id: "co-unique-vs-pk",
    type: "mcq",
    prompt: "How does a UNIQUE constraint differ from a PRIMARY KEY?",
    options: [
      "UNIQUE allows NULLs and a table can have several; a primary key is NOT NULL and there's one per table",
      "UNIQUE prevents duplicates while a primary key does not, which is why most tables define both on the same column",
      "They are completely identical in every respect, so the two keywords can always be swapped without any change",
      "UNIQUE applies only to text columns whereas a primary key applies only to the integer id column of the table",
    ],
    answer: 0,
    explanation:
      "Both prevent duplicates, but a primary key is also `NOT NULL` and unique in its identity role — one per table. `UNIQUE` permits NULLs and you can have many.",
  },
  {
    id: "co-check-fill",
    type: "fill",
    prompt: "To enforce a custom rule like price being non-negative, add a ___ (price >= 0) constraint.",
    answers: ["CHECK", "check"],
    hint: "It takes a boolean condition each row must satisfy.",
    explanation:
      "A `CHECK` constraint enforces any boolean condition on a row's values — the place for business rules like non-negative amounts.",
  },
  {
    id: "co-check-predict",
    type: "predict",
    prompt: "Given `price DECIMAL CHECK (price >= 0)` and `name TEXT NOT NULL`, what happens?",
    code: `INSERT INTO products (name, price)\nVALUES ('Widget', -3);`,
    options: [
      "The insert is rejected, because price = -3 violates the CHECK constraint",
      "The insert succeeds and the price is automatically stored as positive 3, since CHECK flips negative values around",
      "The insert succeeds and stores -3, because CHECK constraints are only advisory and never actually block any writes",
      "The insert succeeds but the price column is quietly set to NULL, since -3 is not an allowed value for the column",
    ],
    answer: 0,
    explanation:
      "`CHECK (price >= 0)` fails for -3, so the whole row is rejected. A constraint violation aborts the entire insert — no partial write.",
  },
  {
    id: "co-default",
    type: "mcq",
    prompt: "What does `status TEXT DEFAULT 'active'` do?",
    options: [
      "Supplies 'active' as the status whenever an insert doesn't specify one",
      "Rejects any insert whose status is not exactly the text 'active', enforcing a single allowed value for the column",
      "Renames every existing status value in the table to 'active' at the moment the constraint is first added",
      "Prevents the status column from ever being changed once it has been set to 'active' on a given row",
    ],
    answer: 0,
    explanation:
      "`DEFAULT` provides a value when the insert omits the column. It pairs well with `NOT NULL` so the column is never missing.",
  },
  {
    id: "co-app-vs-db-senior",
    type: "mcq",
    prompt: "🧠 Your app validates emails are unique, so why also add a UNIQUE constraint in the database?",
    options: [
      "Other writers (scripts, admin tools, other services) bypass the app, but the constraint guards every write path",
      "The UNIQUE constraint makes the app's own validation code run faster by offloading the comparison to the database",
      "Database constraints are purely for documentation, so it is added only to record that the app expects uniqueness",
      "Without it the UNIQUE keyword in the app's query would fail to compile, so the constraint is a required dependency",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "App validation is bypassed by any other path into the table. A database constraint enforces the rule for *every* writer, making it the real guarantee.",
  },
  {
    id: "co-multi",
    type: "multi",
    prompt: "Select **all** true statements about constraints.",
    options: [
      "A PRIMARY KEY is effectively UNIQUE plus NOT NULL",
      "A FOREIGN KEY requires the value to match a row in another table",
      "A CHECK constraint enforces a boolean condition",
      "A table may have several PRIMARY KEYs",
    ],
    answers: [0, 1, 2],
    explanation:
      "A primary key is unique + not-null, a foreign key enforces referential integrity, and CHECK enforces a condition. A table has exactly *one* primary key, so option 4 is false.",
  },
  {
    id: "co-flashcard",
    type: "flashcard",
    prompt:
      "List the main constraints, what each enforces, and why constraints beat app-only validation. Answer aloud, then reveal.",
    modelAnswer:
      "**Constraints** are rules the **database enforces on every write** (from any source), so correctness lives in the schema, not just app code. **`NOT NULL`** — the column must have a value. **`DEFAULT`** — supplies a value when the insert omits the column (pairs with `NOT NULL`). **`UNIQUE`** — no duplicate values; unlike a primary key it **allows NULLs** and a table can have **several**. **`CHECK (condition)`** — any boolean rule (`price >= 0`, `status IN (...)`) — where business rules go. **`PRIMARY KEY`** — effectively `UNIQUE` + `NOT NULL` with the row-identity role; **one per table**. **`FOREIGN KEY`** (`REFERENCES other(col)`) — the value must match a row in another table (referential integrity). Multi-column rules (composite key, multi-column UNIQUE) are declared at the **table level**. A violated constraint **rejects the whole write** — no partial row. Why over app validation: other writers bypass the app; the constraint guards **every** path.",
    keyPoints: [
      "NOT NULL (required), DEFAULT (fills missing), UNIQUE (no dups, allows NULL, many per table)",
      "CHECK = boolean business rules; PRIMARY KEY = UNIQUE+NOT NULL, one per table",
      "FOREIGN KEY = must match another table's row (referential integrity)",
      "Violation rejects the whole write; enforced for every writer, not just the app",
    ],
    explanation:
      "A strong answer lists each constraint's job, the UNIQUE-vs-PK distinction, and why DB constraints beat app-only checks.",
  },
];

export default quiz;
