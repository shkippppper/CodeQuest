## The problem: nested subqueries become unreadable

A derived table works, but stack two or three and the query turns inside-out — you read it from the middle, and a repeated subquery has to be written twice:

```sql
SELECT city, total FROM (
  SELECT city, SUM(amount) AS total FROM sales GROUP BY city
) AS t
WHERE total > 90;
```

That's fine for one level. Add more and it's a puzzle. A **common table expression** — a **CTE** — lets you pull the subquery *out*, give it a name, and then read the query top to bottom.

## WITH: name a subquery

Define a CTE with `WITH name AS (query)`, then use `name` like a table:

```sql
WITH city_totals AS (
    SELECT city, SUM(amount) AS total
    FROM sales
    GROUP BY city
)
SELECT city, total
FROM city_totals
WHERE total > 90;
```

Same result as the derived table — but now it reads in order: "*first* compute `city_totals`, *then* select from it." The `WITH` block sets up a named, temporary result; the query below uses it as if it were a real table. Nothing is stored — the CTE exists only for this one statement.

## Reuse the same CTE more than once

A derived table defined in `FROM` can only be used in that one spot. A CTE can be referenced **multiple times** in the main query — define once, use everywhere. Compare each city's total against the overall total:

```sql
WITH city_totals AS (
    SELECT city, SUM(amount) AS total FROM sales GROUP BY city
)
SELECT a.city, a.total, b.city, b.total
FROM city_totals AS a
CROSS JOIN city_totals AS b
WHERE a.total > b.total;
```

`city_totals` appears twice, written once. That reuse — and the readability — is why CTEs are preferred for anything non-trivial.

## Chain several CTEs

List multiple CTEs separated by commas; later ones can build on earlier ones:

```sql
WITH
  city_totals AS (
    SELECT city, SUM(amount) AS total FROM sales GROUP BY city
  ),
  big_cities AS (
    SELECT city FROM city_totals WHERE total > 90
  )
SELECT * FROM big_cities;
```

`big_cities` reads from `city_totals`, which was defined just above it. Each CTE is a named step, so a complex transformation becomes a readable pipeline of stages instead of one deeply nested expression.

## Predict: what does this return?

`sales`: Batumi 100, Tbilisi 100, Kutaisi 40.

```sql
WITH t AS (SELECT city, SUM(amount) AS total FROM sales GROUP BY city)
SELECT city FROM t WHERE total >= 100;
```

Answer: **Batumi and Tbilisi**. The CTE `t` builds the per-city totals (100, 100, 40); the outer query keeps the two at 100 or above. Kutaisi's 40 is filtered out.

## CTE vs subquery: which to use

They compute the same things. Choose by clarity:

- A one-off, simple nested query → an inline **subquery** is fine and compact.
- A query used more than once, or a multi-step transformation → a **CTE** reads far better and avoids repetition.

Historically some databases couldn't optimize *across* a CTE boundary (it acted as a fence), but modern engines usually inline them, so the choice is mostly about readability. When in doubt, a CTE makes intent obvious.

## Common pitfalls

- **Expecting a CTE to persist.** It lives only for the single statement that defines it — it's not a temporary table you can query later.
- **Referencing a CTE before it's defined.** In a chain, a CTE can use ones listed *above* it, not below. Order them as a pipeline.
- **Over-CTEing trivial queries.** A single simple subquery doesn't need the `WITH` ceremony; save CTEs for when they add clarity.

## Interview lens

If a query is getting nested and hard to follow, say you'd refactor it into **CTEs** — name each step with `WITH` so it reads top to bottom, and note that a CTE can be **referenced multiple times** whereas a `FROM`-clause derived table can't. That's the practical win interviewers want to hear.

Be ready for "CTE vs subquery": they're functionally equivalent, so it's a readability/reuse decision, and modern optimizers usually inline CTEs so there's rarely a performance penalty. Mentioning that a CTE is also the gateway to **recursive** queries (the next lesson) shows you know where it leads.
