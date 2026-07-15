import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "il-dirty-read",
    type: "mcq",
    prompt: "What is a dirty read?",
    options: [
      "Reading a row another transaction has changed but not yet committed",
      "Reading a row that contains a NULL value in a column where the application expected a real value to be present",
      "Reading rows in a different order than the one in which they were originally inserted into the table earlier",
      "Reading from a table while an index on that table is still being rebuilt in the background by the database",
    ],
    answer: 0,
    explanation:
      "A dirty read sees uncommitted changes from another transaction. If that transaction rolls back, you acted on data that never existed.",
  },
  {
    id: "il-non-repeatable",
    type: "mcq",
    prompt: "What distinguishes a non-repeatable read from a phantom read?",
    options: [
      "Non-repeatable read is the same row's value changing; a phantom is the set of matching rows changing",
      "Non-repeatable read only happens on writes, whereas a phantom read only ever happens during a plain read query",
      "They are the same anomaly under two names, so any isolation level that prevents one always prevents the other too",
      "Non-repeatable read involves uncommitted data, while a phantom read only ever involves already-committed data rows",
    ],
    answer: 0,
    explanation:
      "Non-repeatable read = an existing row you re-read has a different value. Phantom = new rows appear (or vanish) in a re-run query's result set.",
  },
  {
    id: "il-uncommitted-fill",
    type: "fill",
    prompt: "The weakest isolation level, which even permits dirty reads, is READ ___.",
    answers: ["UNCOMMITTED", "uncommitted"],
    hint: "The opposite of committed.",
    explanation:
      "`READ UNCOMMITTED` allows dirty reads — it's the weakest level and rarely used.",
  },
  {
    id: "il-serializable",
    type: "mcq",
    prompt: "What does the SERIALIZABLE isolation level guarantee?",
    options: [
      "Transactions behave as if they ran one after another, with none of the read anomalies",
      "Every transaction is written to disk in the exact serial order in which it was originally submitted to the server",
      "Only one connection may be open to the database at any moment, forcing all clients to take strict turns querying",
      "Reads are permitted to see uncommitted data, but writes are serialized so that they never conflict with each other",
    ],
    answer: 0,
    explanation:
      "SERIALIZABLE is the strongest level: the result is as if transactions ran serially, preventing dirty, non-repeatable, and phantom reads — at the highest concurrency cost.",
  },
  {
    id: "il-choose-predict",
    type: "predict",
    prompt: "🧠 You need re-reads of the same rows to be stable, but you tolerate new matching rows appearing. Minimum level?",
    code: `-- prevent non-repeatable reads; phantoms are acceptable`,
    options: [
      "REPEATABLE READ — stops non-repeatable reads while (per the standard) still allowing phantoms",
      "READ COMMITTED, because it already stops rows you have read from changing their values within your transaction",
      "READ UNCOMMITTED, since it is the fastest level and stable re-reads do not actually require any isolation at all",
      "SERIALIZABLE is the only level that can possibly keep re-read values stable, so nothing weaker will ever work",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "REPEATABLE READ prevents non-repeatable reads but the standard still permits phantoms — matching your exact tolerance. SERIALIZABLE would work but costs more concurrency than needed.",
  },
  {
    id: "il-tradeoff-senior",
    type: "mcq",
    prompt: "🧠 What's the engineering trade-off across isolation levels?",
    options: [
      "Higher isolation prevents more anomalies but reduces concurrency; pick the weakest level that stays correct",
      "Higher isolation is always better, so production systems should default every transaction to SERIALIZABLE mode",
      "Lower isolation uses more memory, so the level is chosen purely based on how much RAM the server currently has",
      "The level only affects read-only transactions, so any transaction that writes data can safely ignore the setting",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Stronger isolation blocks more anomalies but serializes contention, hurting throughput. The goal is the weakest level that keeps the transaction correct.",
  },
  {
    id: "il-multi",
    type: "multi",
    prompt: "Select **all** true statements about isolation levels.",
    options: [
      "READ COMMITTED prevents dirty reads",
      "SERIALIZABLE prevents phantom reads",
      "Higher isolation generally reduces concurrency",
      "Most databases default to SERIALIZABLE",
    ],
    answers: [0, 1, 2],
    explanation:
      "READ COMMITTED stops dirty reads, SERIALIZABLE stops phantoms, and stronger isolation lowers concurrency. Option 4 is false — defaults are usually READ COMMITTED or REPEATABLE READ.",
  },
  {
    id: "il-flashcard",
    type: "flashcard",
    prompt:
      "Explain the three read anomalies, the four isolation levels, and the trade-off. Answer aloud, then reveal.",
    modelAnswer:
      "Isolation is tunable because perfect isolation throttles throughput. Three **read anomalies**: **dirty read** (seeing another transaction's *uncommitted* change), **non-repeatable read** (an existing row you re-read has a *different value* because another transaction committed), **phantom read** (a re-run query returns *different rows* because rows were inserted/deleted). The four **levels**, each forbidding more: **READ UNCOMMITTED** (allows all, even dirty reads), **READ COMMITTED** (no dirty reads; Postgres/Oracle default), **REPEATABLE READ** (no dirty or non-repeatable reads; standard still permits phantoms — though some engines prevent them; MySQL default), **SERIALIZABLE** (as if transactions ran serially — no anomalies, highest cost). **Trade-off**: stronger isolation prevents more anomalies but reduces concurrency/throughput, so choose the **weakest level that keeps your transaction correct**. Watch that defaults differ across databases — set the level explicitly when correctness depends on it.",
    keyPoints: [
      "Dirty read (uncommitted), non-repeatable (row value changes), phantom (row set changes)",
      "READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE forbid progressively more",
      "READ COMMITTED stops dirty; REPEATABLE READ stops non-repeatable; SERIALIZABLE stops all",
      "Stronger isolation = fewer anomalies but less concurrency",
      "Pick the weakest correct level; defaults differ (Postgres READ COMMITTED, MySQL REPEATABLE READ)",
    ],
    explanation:
      "A strong answer names the three anomalies, orders the four levels by what they forbid, and frames the concurrency trade-off.",
  },
];

export default quiz;
