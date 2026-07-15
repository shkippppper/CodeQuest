## The problem: filtering on a total

You've grouped sales by city and now want only the cities that sold more than 90:

```sql
SELECT city, SUM(amount)
FROM sales
WHERE SUM(amount) > 90   -- ILLEGAL
GROUP BY city;
```

This fails. `WHERE` runs *before* the groups exist, so there's no `SUM` yet for it to test. To filter on an aggregate you need a clause that runs *after* grouping — that's `HAVING`.

## Two filters, two moments

The two clauses filter at different stages of the query:

- **`WHERE`** filters individual **rows**, *before* they're grouped.
- **`HAVING`** filters whole **groups**, *after* the aggregate is computed.

Here's the same intent, written correctly:

```sql
SELECT city, SUM(amount)
FROM sales
GROUP BY city
HAVING SUM(amount) > 90;
```

The database groups the rows, computes each city's `SUM`, then keeps only the groups whose sum clears 90. `HAVING` can see aggregates because it runs later; `WHERE` cannot because it runs earlier.

## The order the database actually runs

The clauses execute in a fixed sequence, which explains everything:

```output
1. FROM      pick the table
2. WHERE     drop rows that fail the row condition
3. GROUP BY  gather surviving rows into groups
4. HAVING    drop groups that fail the group condition
5. SELECT    compute the output columns
6. ORDER BY  sort the result
```

`WHERE` is step 2 (rows still individual, no aggregates exist). `HAVING` is step 4 (groups formed, aggregates available). That ordering *is* the difference between them.

## Use both together

They're not either/or — a query often needs both:

```sql
SELECT city, SUM(amount)
FROM sales
WHERE amount > 0            -- keep only real sales (per row)
GROUP BY city
HAVING SUM(amount) > 90;    -- keep only big-selling cities (per group)
```

`WHERE amount > 0` throws out bad rows *before* grouping — so they never pollute any city's sum. `HAVING SUM(amount) > 90` then judges the finished totals. Filtering rows early with `WHERE` is also faster: fewer rows reach the grouping step.

## Predict: where does each condition go?

You want, per customer, the count of their orders over $100 — but only customers with more than 3 such orders. Which clause holds which condition?

Answer: `WHERE amount > 100` (a per-row test, before grouping) and `HAVING COUNT(*) > 3` (a per-group test, on the aggregate). Row conditions go in `WHERE`; conditions on the aggregate go in `HAVING`.

## A subtle point: HAVING without an aggregate

`HAVING` *can* reference a grouped column without an aggregate, and it'll work — but if the condition is really about individual rows, it belongs in `WHERE` for speed. Reserve `HAVING` for conditions that genuinely need the aggregate, like `SUM(...) > 90` or `COUNT(*) > 3`.

## Common pitfalls

- **Putting an aggregate in `WHERE`.** `WHERE SUM(x) > 10` fails — no aggregate exists yet at that stage. Move it to `HAVING`.
- **Putting a plain row condition in `HAVING`.** It works but filters after grouping, wasting effort. Row filters belong in `WHERE` so fewer rows get grouped.
- **Thinking one replaces the other.** They filter at different stages; many correct queries use both.

## Interview lens

The question is almost always "what's the difference between `WHERE` and `HAVING`?" Answer with the two moments: `WHERE` filters rows before grouping and can't see aggregates; `HAVING` filters groups after aggregation and can. Then cite the execution order (`WHERE` before `GROUP BY`, `HAVING` after) — that ordering is the whole explanation.

The follow-up: "if a condition could go in either, which do you pick?" Say `WHERE`, because filtering rows before grouping means fewer rows to aggregate — same result, less work. That performance instinct is what separates a memorized answer from an understood one.
