## The problem: two writers, one row

Isolation has to be *enforced* somehow. If two transactions try to update the same account at the same moment, something must make one wait for the other — otherwise their changes interleave and money is lost. The common mechanism is a **lock**: a transaction claims a row (or table) so others can't stomp on it until it's done.

## Shared vs exclusive locks

Not all access conflicts. Two readers don't interfere; a writer interferes with everyone. So there are two lock modes:

- A **shared lock** (read lock) — many transactions can hold it on the same row at once. Readers coexist.
- An **exclusive lock** (write lock) — only one transaction can hold it, and no shared locks may coexist with it. A writer excludes everyone.

The rule in one line: **reads share, writes exclude.** When a transaction wants to modify a row, it needs an exclusive lock; if another transaction holds *any* lock on that row, the writer **waits** until the lock is released (at the other transaction's commit or rollback).

## Watch a transaction wait

```output
Txn A: BEGIN; UPDATE row 1   -> takes exclusive lock on row 1
Txn B: BEGIN; UPDATE row 1   -> wants exclusive lock on row 1... WAITS
Txn A: COMMIT                -> releases the lock
Txn B: (now proceeds)        -> acquires the lock, continues
```

Waiting is normal and usually brief — B just pauses until A commits. Locks held for a short time keep this invisible. The trouble starts when two transactions wait on *each other*.

## Deadlock: a waiting cycle

A **deadlock** is a cycle of waiting where neither transaction can ever proceed because each holds a lock the other needs. The textbook case — two transfers grabbing the same two accounts in opposite orders:

```output
Txn A: locks row 1, then wants row 2
Txn B: locks row 2, then wants row 1

A waits for B to release row 2.
B waits for A to release row 1.
Neither will ever release. Stuck forever.
```

Each is holding what the other is waiting for. Left alone, both would wait indefinitely.

## How databases handle it

A database won't hang forever. It runs a **deadlock detector** that spots the waiting cycle, then **aborts one transaction** — the "victim" — rolling it back so the other can proceed. The victim gets an error like "deadlock detected."

That means **your application must be ready to retry** a transaction that fails with a deadlock error. A deadlock isn't a bug you can always eliminate; it's a condition you handle by catching the error and running the transaction again (the retry usually succeeds, since the contending transaction has now finished).

## Predict: does this deadlock?

Both transactions transfer between accounts 1 and 2, and both are written to lock **account 1 first, then account 2**. Can they deadlock?

Answer: **no**. Because both acquire the locks in the *same* order, one simply waits for the other and then proceeds — there's no cycle. Deadlock needs the transactions to grab the same resources in *different* orders. That's the key to prevention.

## Preventing deadlocks

You can't always avoid waiting, but you can avoid *cycles*:

- **Consistent lock ordering.** If every transaction acquires locks in the same order (e.g. always the lower account id first), a cycle is impossible. This is the single most effective prevention.
- **Keep transactions short.** The less time a lock is held, the smaller the window for contention. Don't do slow work (network calls, user think-time) inside an open transaction.
- **Touch fewer rows / lock less.** Narrower updates and appropriate indexes reduce how much gets locked.
- **Be ready to retry.** Since deadlocks can still happen, wrap transactions so a deadlock error triggers a retry.

## Common pitfalls

- **Acquiring locks in inconsistent orders across code paths.** This is *the* cause of deadlocks. Standardize the order (e.g. by primary key) everywhere.
- **Long-running transactions.** Holding locks while waiting on a user or a slow API massively widens the contention window. Keep the transaction to the actual database work.
- **Not handling the deadlock error.** The database picks a victim and aborts it; if your app doesn't catch and retry, that work is simply lost.

## Interview lens

If asked how isolation is enforced, mention **locks**: shared (read, many at once) versus exclusive (write, one only) — reads share, writes exclude — and that a writer waits for conflicting locks to release. That grounds isolation in a concrete mechanism.

The centerpiece is deadlock: define it as a **cycle of transactions each waiting on a lock the other holds**, say the database **detects it and aborts a victim** (so the app must **retry**), and give the prevention that matters most — **consistent lock ordering**, plus short transactions. Walking through the two-accounts-in-opposite-orders example and then showing that same-order acquisition removes the cycle is the answer that lands.
