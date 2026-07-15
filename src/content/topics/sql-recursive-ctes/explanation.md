## The problem: how deep does this go?

An `employees` table stores a reporting chain — each person points at their manager:

```output
id | name  | manager_id
---+-------+-----------
1  | Ada   | NULL
2  | Beka  | 1
3  | Dato  | 2
4  | Eka   | 3
```

"List everyone under Ada, at any depth" is impossible with a normal query. A self join reaches managers *one* level up; two self joins reach two levels. But the chain could be 3 deep or 30 — you don't know in advance how many joins to write. You need a query that keeps following the links until it runs out. That's a **recursive CTE**: a CTE that refers to *itself*.

## Two parts joined by UNION ALL

A recursive CTE has a fixed shape — two `SELECT`s combined with `UNION ALL`:

```sql
WITH RECURSIVE reports AS (
    -- anchor: where to start
    SELECT id, name, manager_id
    FROM employees
    WHERE id = 1

    UNION ALL

    -- recursive step: one level further, each pass
    SELECT e.id, e.name, e.manager_id
    FROM employees AS e
    JOIN reports AS r ON e.manager_id = r.id
)
SELECT name FROM reports;
```

The two halves have distinct jobs:

- The **anchor member** (above `UNION ALL`) runs **once** and seeds the result — here, Ada.
- The **recursive member** (below) references the CTE `reports` by name. It runs **repeatedly**: each pass finds the employees whose manager is someone already in `reports`, adding the next level down.

`WITH RECURSIVE` is the keyword that permits the CTE to reference itself.

## Watch it fill up, level by level

Trace the passes:

```output
pass 0 (anchor):     Ada                (id 1)
pass 1 (recursive):  Beka               (manager_id 1 → in set)
pass 2 (recursive):  Dato               (manager_id 2 → in set)
pass 3 (recursive):  Eka                (manager_id 3 → in set)
pass 4 (recursive):  (nobody new) → stop
```

Each pass feeds the previous pass's *new* rows back into the join. When a pass adds **no new rows**, recursion stops automatically. The final `reports` holds Ada, Beka, Dato, Eka — the whole chain, however deep.

## The termination rule

Recursion ends when the recursive member returns **zero new rows**. That happens naturally when you reach the leaves of the hierarchy (no one reports to Eka). If the data had a *cycle* — A manages B and B somehow manages A — the recursion would never run dry and would loop forever. Real hierarchies are acyclic, but production queries often add a depth guard (a level counter with `WHERE depth < 100`) as a safety net.

## Generating a sequence

Recursion isn't only for hierarchies — it can manufacture rows. Generate the numbers 1 through 5 from nothing:

```sql
WITH RECURSIVE nums AS (
    SELECT 1 AS n                       -- anchor: start at 1
    UNION ALL
    SELECT n + 1 FROM nums WHERE n < 5  -- step: add 1, stop at 5
)
SELECT n FROM nums;   -- 1, 2, 3, 4, 5
```

The anchor is the first value; the recursive member adds one each pass; the `WHERE n < 5` is the explicit stop. This trick fills gaps — a row per day in a date range, per hour in a schedule — even when no table holds those rows.

## Predict: how many rows?

```sql
WITH RECURSIVE nums AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM nums WHERE n < 3
)
SELECT n FROM nums;
```

Answer: **3 rows** — 1, 2, 3. Anchor gives 1; recursion adds 2 (1 < 3) and 3 (2 < 3); at n = 3 the `WHERE n < 3` is false, no new row, so it stops.

## Common pitfalls

- **Forgetting `RECURSIVE`.** Most databases require `WITH RECURSIVE` for a self-referencing CTE; without it the CTE name isn't in scope inside itself.
- **No termination.** If the recursive member never stops producing new rows (a data cycle or a missing `WHERE` bound), the query loops until it errors or exhausts memory. Add a depth limit.
- **Using `UNION` when you need `UNION ALL`.** `UNION ALL` is standard here; plain `UNION` de-duplicates each pass and can mask or change behavior — use `UNION ALL` unless you have a specific reason.

## Interview lens

If asked to traverse a hierarchy of unknown depth — an org chart, a threaded-comment tree, a category tree — name the **recursive CTE** and describe its two parts: an **anchor** that seeds the start, and a **recursive member** that references the CTE to walk one level further each pass, combined with `UNION ALL`. Stating that it stops when a pass adds no new rows shows you understand the mechanism, not just the syntax.

The senior detail is termination and safety: recursion ends at zero new rows, a **cycle** would loop forever, and production queries add a depth counter as a guard. Mentioning the sequence-generation use (rows per day in a range) signals you've reached for recursive CTEs beyond the textbook org-chart example.
