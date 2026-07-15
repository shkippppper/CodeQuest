## The problem: rows come back in no promised order

Run a plain query and you might assume the rows arrive sorted somehow:

```sql
SELECT name FROM users;
```

They don't. A database returns rows in whatever order is convenient — and that order can change between runs. If you want a predictable order, you must ask for it. That's what `ORDER BY` is for.

## Sort with ORDER BY

Add `ORDER BY` and name the column to sort on:

```sql
SELECT name, age FROM users ORDER BY age;
```

```output
name  | age
------+----
Dato  | 19
Beka  | 28
Ada   | 34
Carlo | 41
```

By default the sort is **ascending** — smallest first for numbers, A→Z for text. Make it explicit with `ASC`, or flip it with `DESC` for largest-first:

```sql
SELECT name, age FROM users ORDER BY age DESC;   -- Carlo, Ada, Beka, Dato
```

## Break ties with more columns

Sort on one column and rows with the same value are left in no guaranteed order. List a second column to decide those ties:

```sql
SELECT name, city, age FROM users
ORDER BY city ASC, age DESC;
```

Rows sort by `city` first; wherever the city is equal, the older person comes first because of `age DESC`. Each column can have its own direction. Reading it aloud: "by city A→Z, then within a city by age high→low."

## Take just the top rows with LIMIT

You rarely want all million rows. `LIMIT` caps how many come back:

```sql
SELECT name, age FROM users ORDER BY age DESC LIMIT 3;
```

That's "the three oldest users." Note the order of operations: the database sorts *first*, then keeps the first 3. `LIMIT` without `ORDER BY` gives you *some* 3 rows, but which 3 is unpredictable — almost always a bug.

## Paging with OFFSET

To show results a page at a time, skip rows with `OFFSET` before applying `LIMIT`:

```sql
SELECT name FROM users ORDER BY name LIMIT 10 OFFSET 20;
```

"Skip the first 20, then take 10" — that's page 3 of 10-per-page results. `OFFSET` always needs a stable `ORDER BY`, or pages will overlap and drop rows.

## Predict: which rows?

Data sorted by age is Dato 19, Beka 28, Ada 34, Carlo 41. What does this return?

```sql
SELECT name FROM users ORDER BY age LIMIT 2 OFFSET 1;
```

Answer: **Beka and Ada**. Sort ascending, skip the first row (Dato), then take two (Beka, Ada). Trace it as sort → skip → take, in that order.

## Drop duplicate rows with DISTINCT

Sometimes a column repeats and you want each value once. `DISTINCT` removes duplicate rows from the result:

```sql
SELECT DISTINCT city FROM users;
```

```output
city
--------
Batumi
Tbilisi
Kutaisi
```

Even if ten users live in Batumi, it appears once. `DISTINCT` looks at *all selected columns together* — `SELECT DISTINCT city, age` keeps each unique `(city, age)` pair, not each city.

## Common pitfalls

- **`LIMIT` without `ORDER BY`.** "Top 5" is meaningless without a defined order; you get an arbitrary 5 that may differ each run.
- **Paging with `OFFSET` but no stable sort.** If the `ORDER BY` has ties, rows can shift between pages, showing duplicates or skipping records.
- **Expecting `DISTINCT` to apply to one column when you selected several.** It de-duplicates the whole selected row, so extra columns can bring the "duplicates" back.

## Interview lens

If asked to return "the most recent 10 orders," write `ORDER BY created_at DESC LIMIT 10` and say out loud that the sort happens before the limit. Interviewers want to see you never rely on the database's natural row order.

Expect a paging question. Explain `LIMIT`/`OFFSET` and immediately flag that it needs a stable, unique `ORDER BY` or pages drift. Mentioning that large `OFFSET` values get slow (the database still scans and discards the skipped rows) is the senior touch — it's why keyset pagination exists.
