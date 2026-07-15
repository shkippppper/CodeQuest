## The problem: a group total, but keep every row

`GROUP BY` collapses rows. Ask for each city's total and you *lose* the individual sales:

```sql
SELECT city, SUM(amount) FROM sales GROUP BY city;   -- 2 rows, sales gone
```

But often you want both at once — every sale *and* its city's total beside it, so you can compute "what fraction of the city's total was this sale?":

```output
id | city    | amount | city_total
---+---------+--------+-----------
1  | Batumi  | 40     | 100
2  | Batumi  | 60     | 100
3  | Tbilisi | 30     | 100
```

`GROUP BY` can't do this — it returns one row per group, not per sale. **Window functions** can: they compute an aggregate *across a set of rows* while leaving every original row in place.

## The OVER clause turns an aggregate into a window

Take a normal aggregate and add `OVER (...)`. That `OVER` is what makes it a window function:

```sql
SELECT id, city, amount,
  SUM(amount) OVER () AS grand_total
FROM sales;
```

`SUM(amount) OVER ()` computes the total across *all* rows — but instead of collapsing, it staples that total onto **every** row. Empty parentheses `OVER ()` mean "the window is the whole result set." Five sales in, five rows out, each carrying the grand total.

The mental model: an aggregate with `OVER` looks *sideways* at a set of related rows (its **window**) and returns a value, without removing your row.

## PARTITION BY: a window per group

Empty `OVER ()` spans everything. Add `PARTITION BY` to split rows into groups — a separate window for each — like `GROUP BY`, but without collapsing:

```sql
SELECT id, city, amount,
  SUM(amount) OVER (PARTITION BY city) AS city_total
FROM sales;
```

Now each row's window is "the rows sharing its city." The Batumi rows each show `city_total = 100`; the Tbilisi rows show their own city's total. Every original row survives, each annotated with its group's sum. That's the `city_total` table from the top.

## ORDER BY inside the window: running totals

Add an `ORDER BY` *inside* `OVER` and the window becomes "all rows up to and including this one," giving a **running total**:

```sql
SELECT id, amount,
  SUM(amount) OVER (ORDER BY id) AS running_total
FROM sales;
```

```output
id | amount | running_total
---+--------+--------------
1  | 40     | 40
2  | 60     | 100
3  | 30     | 130
```

Row by row the sum accumulates. Combine both: `OVER (PARTITION BY city ORDER BY id)` gives a running total that *restarts* for each city.

## Ranking functions

Some window functions exist only in window form — the ranking family numbers rows within each window:

```sql
SELECT city, amount,
  ROW_NUMBER() OVER (PARTITION BY city ORDER BY amount DESC) AS rn
FROM sales;
```

- `ROW_NUMBER()` — 1, 2, 3, … always distinct, even on ties.
- `RANK()` — ties share a number, then it **skips** (1, 1, 3).
- `DENSE_RANK()` — ties share a number, **no skip** (1, 1, 2).

`ROW_NUMBER()` with `PARTITION BY city ORDER BY amount DESC` gives each city's biggest sale `rn = 1` — the standard "top N per group" trick: wrap it in a subquery and keep `rn <= 3`.

## Predict: ROW_NUMBER vs RANK on a tie

Two rows tie for the top amount. What numbers do `ROW_NUMBER()` and `RANK()` assign to the row *after* the tie (the third row)?

Answer: `ROW_NUMBER()` gives it **3** (it never ties — the two leaders got 1 and 2 arbitrarily). `RANK()` gives it **3** too, but the two tied leaders both got **1** (RANK skips 2). `DENSE_RANK()` would give the third row **2**. The difference is entirely in how each handles ties.

## Where windows sit in the query

A window function is computed *after* `WHERE`, `GROUP BY`, and `HAVING` — at the `SELECT` stage. So you can't filter on a window result in `WHERE` (it doesn't exist yet); to filter on `rn <= 3`, compute it in a subquery or CTE, then filter in the outer query.

## Common pitfalls

- **Trying to filter a window result in `WHERE`.** Windows are computed at `SELECT`, after `WHERE`. Wrap the query and filter outside (subquery/CTE).
- **Confusing `PARTITION BY` with `GROUP BY`.** `GROUP BY` collapses to one row per group; `PARTITION BY` keeps all rows and annotates each.
- **Reaching for `RANK()` when you need unique numbers.** `RANK()` produces duplicates on ties and gaps after them; use `ROW_NUMBER()` when every row needs a distinct position.

## Interview lens

If asked for "each row alongside its group's total" or a running total, name **window functions** and contrast them with `GROUP BY`: same aggregate, but `OVER` keeps every row instead of collapsing. Saying "`PARTITION BY` is like `GROUP BY` without losing the rows" lands the concept in one sentence.

The classic task is "top N per group." Walk through `ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC)` in a subquery, then `WHERE rn <= N` outside — and be ready to explain why the filter must be outside (windows are computed after `WHERE`). Knowing the `ROW_NUMBER` / `RANK` / `DENSE_RANK` tie differences is the detail that signals real fluency.
