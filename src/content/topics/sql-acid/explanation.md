## The problem: two writes that must both happen

Transferring money is two updates — take from one account, add to the other:

```sql
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
```

Now imagine the server crashes *between* those two lines. The first ran, the second didn't: $100 vanished. These two statements must happen **together or not at all** — there's no acceptable half-way. A **transaction** is the tool that groups statements into one indivisible unit.

## BEGIN, COMMIT, ROLLBACK

Wrap the statements in a transaction:

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

`BEGIN` starts the transaction. The updates happen *provisionally* — not yet permanent. `COMMIT` makes them all permanent at once. If anything goes wrong before the commit, `ROLLBACK` undoes every change since `BEGIN`, restoring the state as if the transaction never ran:

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- something's wrong...
ROLLBACK;   -- the -100 is undone; balances unchanged
```

Either the whole transaction commits, or it's as though nothing happened. That all-or-nothing behavior is the first of four guarantees, together called **ACID**.

## A — Atomicity

**Atomicity** means a transaction is indivisible: all its statements succeed, or all are undone. There's no partial result. The money-transfer crash can't leave $100 missing — on recovery, an uncommitted transaction is rolled back entirely.

"Atomic" here means "can't be split," the same root as an indivisible atom. This is the guarantee you reach for most.

## C — Consistency

**Consistency** means a transaction moves the database from one **valid** state to another, never leaving it breaking the rules. Every constraint (foreign keys, `CHECK`, `UNIQUE`) holds before and after. If a statement in the transaction would violate a constraint, the transaction fails and rolls back rather than committing invalid data.

## I — Isolation

**Isolation** means concurrent transactions don't step on each other — each behaves as if it were running alone, even when many run at once. If two transfers touch the same account simultaneously, isolation stops them from seeing each other's half-finished work.

*How much* isolation is a tunable dial — the different isolation levels, and the anomalies they permit, are their own lesson. Here, know that isolation is the guarantee about concurrency.

## D — Durability

**Durability** means once a transaction **commits**, its changes survive — even an immediate power loss. The database writes committed data somewhere permanent (typically a write-ahead log flushed to disk) before reporting success. After `COMMIT` returns, the money has moved for good.

## Predict: what's the balance?

Account 1 starts at 500. This runs and the server crashes right after the first update, before `COMMIT`:

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- crash here
```

On restart, what is account 1's balance? Answer: **500**. The transaction never committed, so atomicity + durability mean the uncommitted `-100` is rolled back on recovery. Only committed transactions survive; in-flight ones are undone.

## Auto-commit: the invisible transaction

If you never write `BEGIN`, each statement still runs in its own tiny transaction that commits immediately — **auto-commit** mode. That's why a lone `INSERT` is durable without ceremony. You only need explicit `BEGIN`/`COMMIT` when *several* statements must be atomic together.

## Common pitfalls

- **Multi-step changes without a transaction.** Related writes (transfer, order + inventory decrement) left in auto-commit can half-complete on failure. Wrap them in `BEGIN`/`COMMIT`.
- **Assuming a `COMMIT` might still be lost.** Durability guarantees committed data survives a crash; if `COMMIT` returned, the change is safe.
- **Confusing consistency with isolation.** Consistency is about honoring constraints (valid states); isolation is about concurrent transactions not interfering.

## Interview lens

If asked "what is a transaction?", say it's a group of statements treated as **all-or-nothing**, bounded by `BEGIN` and `COMMIT`, with `ROLLBACK` to undo. Give the money-transfer example — two updates that must both land — because it makes atomicity concrete.

Then spell out **ACID**: **A**tomicity (all-or-nothing), **C**onsistency (valid states / constraints hold), **I**solation (concurrent transactions don't interfere), **D**urability (committed data survives crashes). The two most commonly confused are Consistency (constraints) and Isolation (concurrency) — distinguishing them cleanly, and noting isolation has tunable *levels*, is what marks a strong answer.
