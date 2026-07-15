import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "acid-transaction",
    type: "mcq",
    prompt: "What is a database transaction?",
    options: [
      "A group of statements treated as one all-or-nothing unit",
      "A single SELECT query that reads data without changing any of the rows it happens to touch along the way",
      "A saved copy of a table taken before a risky change so the original data can be restored later if needed",
      "The record of who accessed the database and when, kept so that administrators can audit past activity",
    ],
    answer: 0,
    explanation:
      "A transaction bundles statements so they all commit together or all roll back — no partial result.",
  },
  {
    id: "acid-atomicity",
    type: "mcq",
    prompt: "What does Atomicity guarantee?",
    options: [
      "All of a transaction's statements succeed, or all are undone — never a partial result",
      "Each individual statement runs faster because it is broken down into smaller atomic operations internally",
      "Only one transaction is ever allowed to run at a time, so two transactions can never overlap one another",
      "Committed data is written to disk so that it survives a crash or a sudden loss of power to the machine",
    ],
    answer: 0,
    explanation:
      "Atomicity = indivisible: all statements land or none do. The last option describes Durability, not Atomicity.",
  },
  {
    id: "acid-rollback-fill",
    type: "fill",
    prompt: "To undo every change made since BEGIN and restore the prior state, issue a ___.",
    answers: ["ROLLBACK", "rollback"],
    hint: "The opposite of COMMIT.",
    explanation:
      "`ROLLBACK` discards all changes since `BEGIN`, as if the transaction never ran. `COMMIT` makes them permanent instead.",
  },
  {
    id: "acid-crash-predict",
    type: "predict",
    prompt: "Account 1 starts at 500. The server crashes right after the first update, before COMMIT. On restart, what is the balance?",
    code: `BEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\n-- crash here (no COMMIT)`,
    options: [
      "500 — the uncommitted change is rolled back on recovery",
      "400, because the UPDATE statement already ran and its effect is kept even though the COMMIT never happened at all",
      "0, because a crash in the middle of a transaction wipes the entire accounts table to protect against corruption",
      "It is impossible to know, because the balance after a crash is left in a random state until it is manually fixed",
    ],
    answer: 0,
    explanation:
      "The transaction never committed, so atomicity + durability roll back the in-flight `-100` on recovery. The balance stays 500.",
  },
  {
    id: "acid-durability",
    type: "mcq",
    prompt: "What does Durability guarantee?",
    options: [
      "Once a transaction commits, its changes survive even an immediate power loss",
      "Transactions never take locks, so no transaction ever has to wait for another transaction to finish first",
      "A transaction always leaves every constraint satisfied, moving the database between two valid states only",
      "Every transaction sees a completely private copy of the whole database that no other transaction can observe",
    ],
    answer: 0,
    explanation:
      "Durability means committed data is persisted (typically via a write-ahead log) and survives crashes. The third option is Consistency.",
  },
  {
    id: "acid-consistency-vs-isolation-senior",
    type: "mcq",
    prompt: "🧠 What's the difference between the Consistency and Isolation guarantees?",
    options: [
      "Consistency keeps constraints valid before and after; Isolation stops concurrent transactions from interfering",
      "They are two names for the same guarantee, both describing how committed data is safely written out to disk",
      "Consistency is about concurrency between transactions, while Isolation is about honoring the schema's constraints",
      "Consistency applies only to reads and Isolation applies only to writes, so a read-only transaction needs neither",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Consistency = the database stays in a valid state (constraints hold). Isolation = concurrent transactions behave as if run alone. They're the two most-confused letters.",
  },
  {
    id: "acid-multi",
    type: "multi",
    prompt: "Select **all** true statements about transactions and ACID.",
    options: [
      "BEGIN starts a transaction; COMMIT makes its changes permanent",
      "Atomicity means all-or-nothing",
      "Without an explicit BEGIN, each statement auto-commits in its own transaction",
      "Durability means concurrent transactions never interfere",
    ],
    answers: [0, 1, 2],
    explanation:
      "BEGIN/COMMIT bound a transaction, atomicity is all-or-nothing, and auto-commit wraps lone statements. Option 4 describes Isolation, not Durability — so it's false.",
  },
  {
    id: "acid-flashcard",
    type: "flashcard",
    prompt:
      "Explain transactions (BEGIN/COMMIT/ROLLBACK) and the four ACID guarantees. Answer aloud, then reveal.",
    modelAnswer:
      "A **transaction** groups statements into one **all-or-nothing** unit: **`BEGIN`** starts it, changes are provisional, **`COMMIT`** makes them all permanent at once, and **`ROLLBACK`** undoes everything since `BEGIN`. Classic example: a money transfer (two `UPDATE`s that must both land, or neither). The four **ACID** guarantees: **Atomicity** — all statements succeed or all are undone (no partial result; an in-flight transaction is rolled back on crash recovery). **Consistency** — each transaction moves the DB from one **valid** state to another, honoring all constraints (foreign keys, CHECK, UNIQUE). **Isolation** — concurrent transactions behave as if run alone (how much is tunable via isolation *levels*, its own topic). **Durability** — once **committed**, changes survive crashes/power loss (persisted via a write-ahead log). Without an explicit `BEGIN`, each statement **auto-commits** in its own tiny transaction — you only need explicit transactions when several statements must be atomic together. Most-confused pair: Consistency (constraints) vs Isolation (concurrency).",
    keyPoints: [
      "Transaction = all-or-nothing; BEGIN / COMMIT / ROLLBACK",
      "Atomicity: all or none (rolled back on crash)",
      "Consistency: valid states, constraints hold",
      "Isolation: concurrent txns don't interfere (tunable levels)",
      "Durability: committed data survives crashes; lone statements auto-commit",
    ],
    explanation:
      "A strong answer defines the transaction verbs and each ACID letter, and distinguishes Consistency (constraints) from Isolation (concurrency).",
  },
];

export default quiz;
