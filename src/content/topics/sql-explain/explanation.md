## The problem: is my query using the index?

You added an index, but the query is still slow. Did the database actually *use* it? You can't tell from the result — the rows come back the same either way. You need to see the **plan**: the step-by-step strategy the database chose to run the query. `EXPLAIN` shows you that plan.

## EXPLAIN shows the plan, not the rows

Put `EXPLAIN` in front of any query and, instead of running it, the database reports how it *would* execute it:

```sql
EXPLAIN SELECT * FROM users WHERE email = 'ada@example.com';
```

```output
Index Scan using idx_users_email on users
  Index Cond: (email = 'ada@example.com')
```

That output is the query plan. The important word is **Index Scan** — the database is using `idx_users_email` to seek straight to the row. Exactly what you wanted.

## Seq Scan vs Index Scan

The two access methods you'll recognize first:

- **Seq Scan** (sequential / full table scan) — read every row and test the condition. Fine for small tables or when most rows match; a red flag on a big table filtered to a few rows.
- **Index Scan** — use an index to jump to the matching rows. What you want for a selective filter on a large table.

Drop the index and re-run `EXPLAIN` on the same query:

```output
Seq Scan on users
  Filter: (email = 'ada@example.com')
```

Now it's a `Seq Scan` — reading all 10 million rows. Seeing `Seq Scan` where you expected an index is the classic "why is this slow?" diagnosis.

## The plan is a tree

A real query — with joins, sorting, grouping — produces a *tree* of steps, read from the innermost/most-indented outward. Each node is an operation: a scan, a join method (nested loop, hash join, merge join), a sort, an aggregate. The plan shows how they feed into each other, so you can spot the expensive step.

Each node also carries **cost estimates**:

```output
Seq Scan on users  (cost=0.00..18334.00 rows=500 width=64)
```

- `cost` — the optimizer's estimate of work (a made-up unit; lower is better). The second number is the estimated total.
- `rows` — how many rows it *expects* this step to produce.
- `width` — estimated average row size in bytes.

These are **estimates** the optimizer used to choose the plan — not measurements.

## EXPLAIN ANALYZE: the real numbers

`EXPLAIN` only *plans*. `EXPLAIN ANALYZE` actually **runs** the query and reports the real timing and row counts alongside the estimates:

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'ada@example.com';
```

```output
Index Scan ...  (cost=... rows=1) (actual time=0.03..0.04 rows=1 loops=1)
```

Now you see `actual time` and `actual rows`. The gold is comparing **estimated vs actual rows**: if the optimizer expected 1 row but 500,000 came back, its statistics are stale and it likely picked a bad plan. (Because it runs the query, avoid `EXPLAIN ANALYZE` on an `UPDATE`/`DELETE` unless inside a transaction you roll back.)

## Predict: what does this tell you?

You run `EXPLAIN` on a `WHERE email = ...` query and see `Seq Scan on users` with `rows=1` on a 10-million-row table. What's wrong?

Answer: there's **no usable index on `email`**, so the database scans all 10 million rows to return the 1 match. The fix is to create an index on `email` — after which the plan should switch to `Index Scan`.

## Common pitfalls

- **Trusting that an index is used without checking.** The optimizer may ignore an index (stale statistics, low selectivity, a function on the column). `EXPLAIN` is how you confirm.
- **Reading cost as milliseconds.** `cost` is an abstract unit for *comparing* plans, not a time. Use `EXPLAIN ANALYZE` for real timings.
- **Ignoring the estimated-vs-actual row gap.** A large mismatch signals stale statistics and often a bad plan; refreshing statistics (e.g. `ANALYZE`) can fix it.

## Interview lens

If asked how you'd diagnose a slow query, say you'd run **`EXPLAIN`** (or `EXPLAIN ANALYZE`) to read the **query plan** and check whether it's doing a **Seq Scan** where an **Index Scan** is expected. That's the concrete first move interviewers want, versus guessing.

The senior signal is knowing what the numbers mean: `cost` is an abstract optimizer estimate for comparing plans (not milliseconds), `EXPLAIN ANALYZE` gives *actual* timing by running the query, and a big **estimated-vs-actual rows** gap points to stale statistics and a likely-bad plan. Mentioning that you'd refresh statistics or add the missing index based on what the plan reveals shows you can act on it, not just read it.
