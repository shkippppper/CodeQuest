import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ld-lock-modes",
    type: "mcq",
    prompt: "How do shared (read) and exclusive (write) locks differ?",
    options: [
      "Many transactions can hold a shared lock at once; an exclusive lock is held by only one and excludes all others",
      "Shared locks are held only on whole tables, while exclusive locks can be held only on the individual rows within them",
      "A shared lock lasts for the whole session, whereas an exclusive lock is automatically released after each single statement",
      "Exclusive locks allow other readers to continue, but shared locks block absolutely every other transaction completely",
    ],
    answer: 0,
    explanation:
      "Reads share (many shared locks coexist); writes exclude (one exclusive lock, no other locks alongside it). A writer waits for conflicting locks to clear.",
  },
  {
    id: "ld-wait",
    type: "mcq",
    prompt: "Txn A holds an exclusive lock on row 1. Txn B tries to UPDATE row 1. What happens to B?",
    options: [
      "B waits until A releases the lock (at A's commit or rollback), then proceeds",
      "B immediately overwrites the row, because the most recent write always wins regardless of any locks that are held",
      "B is permanently rejected and must be rewritten by the developer to target a different row before it can run at all",
      "B reads A's uncommitted value and continues, since a lock only blocks other writers from committing but not from reading",
    ],
    answer: 0,
    explanation:
      "B needs an exclusive lock, which conflicts with A's. B waits until A commits or rolls back, then acquires it and continues.",
  },
  {
    id: "ld-deadlock-def",
    type: "mcq",
    prompt: "What is a deadlock?",
    options: [
      "A cycle where each transaction holds a lock the other needs, so neither can ever proceed",
      "A single transaction that takes so long that the database gives up on it and cancels it after a fixed timeout",
      "A situation where a table is locked so heavily that new connections to the whole database are refused entirely",
      "A read that returns stale data because a lock was released a moment too early before the write had finished",
    ],
    answer: 0,
    explanation:
      "A deadlock is a waiting cycle: each transaction holds a lock the other is waiting for, so neither can advance.",
  },
  {
    id: "ld-detector-fill",
    type: "fill",
    prompt: "When a deadlock occurs, the database aborts one transaction — the ___ — and rolls it back so the other can proceed.",
    answers: ["victim", "VICTIM"],
    hint: "The transaction chosen to be sacrificed.",
    explanation:
      "The deadlock detector picks a victim transaction to abort and roll back, breaking the cycle. The app should retry it.",
  },
  {
    id: "ld-order-predict",
    type: "predict",
    prompt: "🧠 Both transactions transfer between accounts 1 and 2, and both lock account 1 first, then account 2. Can they deadlock?",
    code: `-- both: lock row 1, then lock row 2`,
    options: [
      "No — acquiring locks in the same order means one simply waits, so no cycle forms",
      "Yes, because any two transactions that touch the same two rows will always deadlock no matter what order they use",
      "Yes, but only if the two transactions happen to begin at the exact same microsecond on two different connections",
      "No, because a transaction that locks more than one row is automatically upgraded to run entirely on its own",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Same-order acquisition can't cycle: one transaction waits for the other and then proceeds. Deadlock requires acquiring the shared resources in *different* orders.",
  },
  {
    id: "ld-prevent-senior",
    type: "mcq",
    prompt: "🧠 What is the single most effective way to prevent deadlocks?",
    options: [
      "Have every transaction acquire locks in a consistent order, so a waiting cycle can't form",
      "Set every transaction to the SERIALIZABLE isolation level, which removes the need for the database to take locks",
      "Disable locking entirely so that no transaction ever has to wait for another transaction to release anything",
      "Run all writes on a single thread so that only one transaction can ever hold any lock at a given moment in time",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Consistent lock ordering makes a cycle impossible. Combine with short transactions and a retry-on-deadlock handler for robustness.",
  },
  {
    id: "ld-multi",
    type: "multi",
    prompt: "Select **all** effective deadlock defenses.",
    options: [
      "Acquire locks in a consistent order everywhere",
      "Keep transactions short",
      "Retry a transaction that fails with a deadlock error",
      "Hold locks longer so other transactions give up waiting",
    ],
    answers: [0, 1, 2],
    explanation:
      "Consistent ordering, short transactions, and retrying the victim all help. Holding locks *longer* widens the contention window and makes deadlocks worse — option 4 is false.",
  },
  {
    id: "ld-flashcard",
    type: "flashcard",
    prompt:
      "Explain locking (shared vs exclusive), deadlocks, detection, and prevention. Answer aloud, then reveal.",
    modelAnswer:
      "Isolation is enforced with **locks**. A **shared (read)** lock can be held by **many** transactions at once; an **exclusive (write)** lock is held by **one** and excludes all others — **reads share, writes exclude**. A transaction wanting to modify a row needs an exclusive lock and **waits** if another holds a conflicting lock (released at commit/rollback). A **deadlock** is a **cycle** of waiting: each transaction holds a lock the other needs, so neither proceeds — classically two transfers locking the same two rows in **opposite orders**. Databases run a **deadlock detector** that aborts one transaction (the **victim**) and rolls it back, so the **app must retry** the failed transaction. Prevention: **consistent lock ordering** (always acquire in the same order, e.g. by id — the most effective fix, since same-order acquisition can't cycle), **short transactions** (don't hold locks during slow work / user think-time), narrower updates, and a **retry** handler for the victim.",
    keyPoints: [
      "Shared (read, many) vs exclusive (write, one); reads share, writes exclude",
      "Writer waits for conflicting locks until commit/rollback",
      "Deadlock = cycle of transactions each holding a lock the other needs",
      "DB detects and aborts a victim → app must retry",
      "Prevent with consistent lock ordering + short transactions",
    ],
    explanation:
      "A strong answer defines the two lock modes, deadlock as a waiting cycle, victim-abort + retry, and consistent lock ordering as the top prevention.",
  },
];

export default quiz;
