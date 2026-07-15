## The problem: isolation isn't free

The Isolation guarantee says concurrent transactions shouldn't interfere. Perfect isolation — every transaction acting as if it's completely alone — is possible, but it forces transactions to wait for each other, throttling throughput. So databases offer a **dial**: weaker isolation runs faster but lets certain read anomalies slip through; stronger isolation prevents them at a cost. To choose a setting you first need to know the anomalies.

## Three read anomalies

Each anomaly is something a transaction might see when another transaction is running concurrently.

**Dirty read** — you read a row another transaction has changed but *not yet committed*. If that other transaction rolls back, you acted on data that never really existed.

```output
Txn B: UPDATE balance = 0 (not committed)
Txn A: reads balance = 0   <- dirty: B might roll back
```

**Non-repeatable read** — you read a row, and reading it *again* in the same transaction gives a different value, because another transaction committed a change in between.

```output
Txn A: reads balance = 100
Txn B: UPDATE balance = 50; COMMIT
Txn A: reads balance = 50   <- the same row changed under you
```

**Phantom read** — you run a query returning a set of rows, and re-running it returns *different rows*, because another transaction inserted or deleted rows matching your condition.

```output
Txn A: SELECT ... WHERE city = 'Batumi'  -> 3 rows
Txn B: INSERT a Batumi row; COMMIT
Txn A: same SELECT -> 4 rows   <- a "phantom" appeared
```

The distinction: non-repeatable read is *the same row changing*; phantom is *the set of rows changing* (new rows appearing/vanishing).

## The four isolation levels

The SQL standard defines four levels, from weakest to strongest. Each *forbids* more anomalies:

| Level | Dirty read | Non-repeatable | Phantom |
|---|---|---|---|
| READ UNCOMMITTED | possible | possible | possible |
| READ COMMITTED | prevented | possible | possible |
| REPEATABLE READ | prevented | prevented | possible* |
| SERIALIZABLE | prevented | prevented | prevented |

Reading the ladder:

- **READ UNCOMMITTED** — the weakest; even dirty reads are allowed. Rarely used.
- **READ COMMITTED** — you only ever see committed data (no dirty reads), but a row can still change between two reads. A common default (e.g. PostgreSQL, Oracle).
- **REPEATABLE READ** — a row you've read won't change within your transaction. (*The standard permits phantoms here; some engines, like PostgreSQL and MySQL's InnoDB, prevent them too.*) MySQL's default.
- **SERIALIZABLE** — the strongest: transactions behave exactly as if run one after another, no anomalies at all — at the highest concurrency cost.

## Predict: which level?

You need a report where re-reading the same rows always gives the same values, but you're fine with new matching rows possibly appearing. What's the minimum level?

Answer: **REPEATABLE READ**. It stops non-repeatable reads (existing rows won't change under you) while, per the standard, still permitting phantoms (new rows) — exactly your tolerance. Jumping to SERIALIZABLE would also work but costs more concurrency than you need.

## The trade-off

Higher isolation = fewer anomalies but more blocking (or more aborted transactions under optimistic schemes), so lower throughput. Lower isolation = more concurrency but you must reason about the anomalies your code can tolerate. The engineering call is choosing the **weakest level that's still correct** for the workload — strong enough to avoid bugs, weak enough to stay fast.

Defaults differ, which bites people porting SQL: PostgreSQL and Oracle default to READ COMMITTED, MySQL's InnoDB to REPEATABLE READ. Set the level explicitly when correctness depends on it rather than assuming.

## Common pitfalls

- **Assuming the default is SERIALIZABLE.** It almost never is — most databases default to READ COMMITTED or REPEATABLE READ, so anomalies are possible unless you opt up.
- **Confusing non-repeatable read with phantom.** Non-repeatable = an existing row's value changed; phantom = the set of matching rows changed (rows added/removed).
- **Defaulting everything to SERIALIZABLE "to be safe."** It serializes contention and tanks throughput. Pick the weakest correct level instead.

## Interview lens

If asked about isolation levels, name the three anomalies first — **dirty read, non-repeatable read, phantom read** — then the four levels as a ladder that forbids progressively more of them (READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE). Being able to say *which anomaly each level still allows* is the core of the question.

The senior framing is the trade-off: stronger isolation prevents more anomalies but reduces concurrency, so you choose the **weakest level that keeps your transaction correct**. Mentioning that real defaults differ (Postgres READ COMMITTED, MySQL REPEATABLE READ) and that some engines prevent phantoms earlier than the standard requires signals hands-on experience.
