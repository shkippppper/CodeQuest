## The problem: turning many rows into one number

You have a `sales` table, one row per sale:

```output
id | city    | amount
---+---------+-------
1  | Batumi  | 40
2  | Batumi  | 60
3  | Tbilisi | 30
4  | Tbilisi | 20
5  | Tbilisi | 50
```

The question isn't "show me the rows" — it's "how much did *each city* sell?" That means squashing several rows down into one summary value per city. The tools are **aggregate functions** (they compute one value from many rows) and **`GROUP BY`** (it decides which rows get summarized together).

## Aggregate functions over the whole table

Start without grouping. An aggregate function reads a column across *all* rows and returns a single number:

```sql
SELECT COUNT(*), SUM(amount), AVG(amount) FROM sales;
```

```output
count | sum | avg
------+-----+----
5     | 200 | 40
```

The five you'll use constantly:

- `COUNT(*)` — how many rows
- `SUM(col)` — total
- `AVG(col)` — average
- `MIN(col)` / `MAX(col)` — smallest / largest

Each collapses the whole table into one row. (Remember from the NULL lesson: all of these except `COUNT(*)` skip NULLs.)

## GROUP BY: one summary per group

`GROUP BY` splits the rows into buckets before aggregating — one bucket per distinct value of the grouping column — then runs the aggregate *within each bucket*:

```sql
SELECT city, SUM(amount)
FROM sales
GROUP BY city;
```

```output
city    | sum
--------+----
Batumi  | 100
Tbilisi | 100
```

Two cities, so two rows out. The database gathered the Batumi rows (40 + 60 = 100) and the Tbilisi rows (30 + 20 + 50 = 100) separately. `GROUP BY city` is the instruction "make one group per city."

## The rule that trips everyone

Look closely at what you're allowed to `SELECT` alongside an aggregate:

```sql
SELECT city, amount, SUM(amount)   -- ILLEGAL
FROM sales
GROUP BY city;
```

This fails. Each city group contains *many* different `amount` values — the database can't pick one to show next to the single `SUM`. The rule: **every column in the `SELECT` that isn't inside an aggregate must appear in `GROUP BY`.** You either group by a column or aggregate it; you can't show a raw column that varies within the group.

So `SELECT city, SUM(amount) ... GROUP BY city` is fine (city is grouped, amount is aggregated), but adding a bare `amount` is not.

## Grouping by several columns

List more than one column and the group becomes the *combination* of their values:

```sql
SELECT city, product, SUM(amount)
FROM sales
GROUP BY city, product;
```

Now there's one row per distinct `(city, product)` pair — sales of Product A in Batumi are summed separately from Product B in Batumi. More grouping columns means more, smaller groups.

## Predict: how many rows?

The `sales` table has cities Batumi, Batumi, Tbilisi, Tbilisi, Tbilisi. How many rows does this return?

```sql
SELECT city, COUNT(*) FROM sales GROUP BY city;
```

Answer: **2** — one per distinct city (Batumi with count 2, Tbilisi with count 3). A grouped query returns one row *per group*, not per original row.

## NULL forms its own group

If the grouping column has NULLs, they collect into a single group of their own — `GROUP BY` treats all NULLs as one bucket (even though `NULL = NULL` is normally UNKNOWN). Expect a NULL group in the output when the column has missing values.

## Common pitfalls

- **Selecting a non-aggregated, non-grouped column.** Every bare column must be in `GROUP BY`; otherwise the database can't choose which of the group's values to show.
- **Expecting one row per original row.** A grouped query returns one row per *group*. If you wanted per-row output with a group total attached, that's a window function (next lesson).
- **Forgetting `COUNT(col)` skips NULLs while `COUNT(*)` counts rows.** They can differ when the column has missing values.

## Interview lens

If asked for a per-category total ("revenue by city," "orders per customer"), the shape is `SELECT group_col, AGG(...) FROM t GROUP BY group_col`. Say clearly that grouped output has one row per group, not per input row.

The rule interviewers probe: which columns may appear in the `SELECT`? Answer that non-aggregated columns must be in the `GROUP BY`, and explain *why* — a group holds many values for the other columns, so there's nothing single to show. Understanding the reason, not just reciting the rule, is what reads as solid.
