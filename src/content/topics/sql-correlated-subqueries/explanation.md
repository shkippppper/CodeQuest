## The problem: "compared to its own group"

A plain subquery runs once and hands back a value. But some questions ask about each row *relative to its own context*. "Employees paid more than the average **in their own department**" — the average isn't one number, it's a different number per department, depending on the row you're looking at.

That needs a subquery that can *see* the current outer row and recompute for it. A subquery that references a column from the outer query is a **correlated subquery**.

## Spot the correlation

Here it is — notice the inner query mentions the outer table:

```sql
SELECT e.name, e.salary
FROM employees AS e
WHERE e.salary > (
    SELECT AVG(inner_e.salary)
    FROM employees AS inner_e
    WHERE inner_e.dept = e.dept    -- references e from the outer query
);
```

The line `inner_e.dept = e.dept` is the correlation: the inner query depends on `e.dept`, a value from the *current outer row*. So the inner query can't run just once — it must run **again for every outer row**, each time computing that row's departmental average.

Read it as a loop: for each employee `e`, compute the average salary of `e`'s department, and keep `e` if their salary beats it.

## Independent vs correlated

The difference is whether the inner query can stand alone:

- A **plain** subquery — `SELECT AVG(salary) FROM employees` — runs **once**; its result never changes per row. You could run it by itself.
- A **correlated** subquery references the outer row (`e.dept`), so it **re-runs per outer row** and can't be run on its own — it's meaningless without an `e`.

That per-row execution is powerful but potentially expensive: 10,000 employees can mean 10,000 inner queries.

## EXISTS: the natural partner

Correlation shines with `EXISTS`, which asks "does the subquery return **any** row for this outer row?" — a yes/no test, not a value. "Customers who have placed at least one order":

```sql
SELECT c.name FROM customers AS c
WHERE EXISTS (
    SELECT 1 FROM orders AS o
    WHERE o.customer_id = c.id
);
```

For each customer `c`, the inner query looks for an order belonging to `c`. `EXISTS` returns true the moment it finds **one** — it doesn't gather all of them, so it can stop early. The `SELECT 1` is idiomatic: `EXISTS` only cares *whether* a row exists, not what's in it, so you select a throwaway constant.

## NOT EXISTS: the safe anti-join

`NOT EXISTS` keeps outer rows for which the subquery finds **nothing** — "customers with no orders":

```sql
SELECT c.name FROM customers AS c
WHERE NOT EXISTS (
    SELECT 1 FROM orders AS o WHERE o.customer_id = c.id
);
```

This is the robust way to write an anti-join. Unlike `NOT IN`, `NOT EXISTS` **handles NULLs correctly** — a NULL in the orders won't make the whole result vanish, the way it does with `NOT IN`. When you need "rows with no match," prefer `NOT EXISTS`.

## Predict: does it stop early?

For a customer with 5,000 orders, how many rows does the `EXISTS` subquery examine before returning true?

Answer: as few as **one**. `EXISTS` only needs to know a matching row exists, so the database can stop at the first hit rather than counting all 5,000. That short-circuit is why `EXISTS` often beats `COUNT(*) > 0`, which would tally every match.

## Common pitfalls

- **Assuming a correlated subquery runs once.** It re-runs per outer row — fine for small tables, a performance concern for large ones. A join or window function may be faster.
- **Using `NOT IN` for an anti-join when NULLs are possible.** A NULL makes `NOT IN` return nothing. `NOT EXISTS` is NULL-safe — prefer it.
- **Writing `COUNT(*) > 0` where `EXISTS` fits.** `COUNT` scans every match; `EXISTS` stops at the first. Use `EXISTS` for pure existence checks.

## Interview lens

If asked for a per-group comparison from a single table ("above their department's average," "their most recent order"), a **correlated subquery** is a classic answer — explain that the inner query references the outer row and therefore re-runs per row. Flag the cost so you're not caught out on scale.

The high-value follow-up is `EXISTS` vs `IN` and, especially, `NOT EXISTS` vs `NOT IN`. Say `EXISTS` short-circuits at the first match, and that `NOT EXISTS` is the **NULL-safe** anti-join whereas `NOT IN` breaks when the list contains a NULL. That NULL-safety point is a favorite senior gotcha — volunteering it lands well.
