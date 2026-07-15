## The problem: the filter you need is itself a query

You want every product priced above the average. You can't write the average as a constant — it changes as data changes. What you need is to *compute* it inside the query:

```sql
SELECT name, price FROM products
WHERE price > (SELECT AVG(price) FROM products);
```

That inner `SELECT` is a **subquery** — a query nested inside another. The database runs the inner one first (it returns the average, say 50), substitutes the value, and then the outer query becomes `WHERE price > 50`. A subquery lets one query's *result* feed another.

## A scalar subquery: one value

When a subquery returns exactly **one row and one column**, it's a **scalar subquery** and can stand wherever a single value is allowed — in `WHERE`, or even in the `SELECT` list:

```sql
SELECT name, price,
  price - (SELECT AVG(price) FROM products) AS diff_from_avg
FROM products;
```

Each row shows how far its price sits from the overall average. The subquery yields one number, reused on every row. If a "scalar" subquery accidentally returns more than one row, the database errors — so make sure it truly produces a single value.

## A subquery as a list: IN

When the subquery returns a **column of values**, feed it to `IN`. "Customers who have placed an order" — the order table holds the list of customer ids:

```sql
SELECT name FROM customers
WHERE id IN (SELECT customer_id FROM orders);
```

The inner query produces every `customer_id` that appears in `orders`; the outer keeps customers whose `id` is in that list. This reads as one clear thought — no join needed to answer a yes/no membership question.

## A subquery as a table: derived tables

A subquery can also sit in the `FROM` clause, acting as a temporary table — a **derived table**. It must be given an alias. This is how you filter or sort on an aggregate you just computed:

```sql
SELECT city, total
FROM (
  SELECT city, SUM(amount) AS total
  FROM sales
  GROUP BY city
) AS city_totals
WHERE total > 90;
```

The inner query builds a small table of per-city totals; the outer query treats it like any table and filters it. (This is one way to filter on an aggregate without `HAVING`.) The `AS city_totals` alias is required — a derived table must be named.

## Predict: what comes back?

`products` prices are 30, 50, 70 (average 50).

```sql
SELECT name FROM products
WHERE price > (SELECT AVG(price) FROM products);
```

Answer: the product priced **70** only. The subquery computes 50, so the outer filter is `price > 50` — 30 and 50 fail, 70 passes.

## Where subqueries can go

Three slots to remember: a **scalar** subquery anywhere a single value fits (`WHERE`, `SELECT`), a **list** subquery with `IN`/`NOT IN`, and a **derived table** in `FROM`. Each runs the inner query and hands its result to the outer one.

These subqueries are **independent** — the inner query doesn't reference the outer, so it runs once. A subquery that *does* reference the outer query (running once per outer row) is a **correlated** subquery, and it's the next lesson.

## Common pitfalls

- **A scalar subquery returning multiple rows.** `WHERE price > (SELECT price FROM …)` errors if the inner query yields more than one value. Ensure it returns exactly one, or use `IN`/`ANY`.
- **Forgetting to alias a derived table.** A subquery in `FROM` must have a name (`AS t`), or the query won't parse.
- **`NOT IN` with a subquery that returns NULLs.** As with a literal list, a NULL in the results makes `NOT IN` return no rows — filter NULLs out or use `NOT EXISTS`.

## Interview lens

If asked to compare each row against an aggregate ("above average," "more than the median"), reach for a scalar subquery in `WHERE` and explain that the inner query computes the value once and the outer filter uses it. For membership questions, `IN (SELECT …)` is often the clearest phrasing.

Be ready to distinguish a plain subquery from a **correlated** one: a plain subquery is independent and runs a single time; a correlated subquery references the outer row and re-runs per row. Knowing that a `FROM`-clause subquery is called a derived table and needs an alias rounds out a confident answer.
