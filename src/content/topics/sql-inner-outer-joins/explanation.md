## The problem: the answer lives in two tables

The relational model split data apart on purpose. Customers live in one table, their orders in another, linked by an id:

```output
customers                 orders
id | name                 id   | customer_id | total
---+------                -----+-------------+------
1  | Ada                  1001 | 1           | 40
2  | Beka                 1002 | 1           | 60
3  | Carlo                1003 | 2           | 30
```

"Show each order with the customer's name" needs both tables at once. The order has `customer_id = 1` but not the name; the name is over in `customers`. A **join** stitches rows from two tables together on a matching column.

## INNER JOIN: keep only matches

The default join pairs a row from each table wherever a condition holds:

```sql
SELECT orders.id, customers.name, orders.total
FROM orders
INNER JOIN customers ON orders.customer_id = customers.id;
```

```output
id   | name | total
-----+------+------
1001 | Ada  | 40
1002 | Ada  | 60
1003 | Beka | 30
```

Read the `ON` clause as the matching rule: pair an order with the customer whose `id` equals the order's `customer_id`. Order 1001 (`customer_id = 1`) matches Ada (`id = 1`), and so on.

Notice who's *missing*: Carlo (id 3) has no orders, so he doesn't appear at all. An **inner join keeps only rows that have a match on both sides.** No order for Carlo → no Carlo in the result.

## LEFT JOIN: keep every left row

Sometimes you want the unmatched rows too — "every customer, with their orders *if any*." A **left join** keeps every row from the left table, filling the right side with NULL when there's no match:

```sql
SELECT customers.name, orders.total
FROM customers
LEFT JOIN orders ON orders.customer_id = customers.id;
```

```output
name  | total
------+------
Ada   | 40
Ada   | 60
Beka  | 30
Carlo | NULL   <- no orders, so the right side is NULL
```

Carlo now appears, with `NULL` for `total`. The word "left" means the table written *before* `LEFT JOIN` — here `customers`. Every one of its rows survives; the right table contributes where it can.

## RIGHT and FULL OUTER

The mirror images round out the family:

- **`RIGHT JOIN`** keeps every row from the *right* table instead. `A RIGHT JOIN B` is the same as `B LEFT JOIN A` — most people just rewrite it as a left join.
- **`FULL OUTER JOIN`** keeps *every* row from both tables, pairing where possible and NULL-filling both sides where not. (SQLite gained this only recently; MySQL lacks it and you emulate it.)

"Outer" is the umbrella term for joins that keep unmatched rows (left, right, full); "inner" keeps only matches.

## The trick: finding rows with no match

A left join plus an `IS NULL` filter finds exactly the unmatched rows — "customers who never ordered":

```sql
SELECT customers.name
FROM customers
LEFT JOIN orders ON orders.customer_id = customers.id
WHERE orders.id IS NULL;
```

The left join gives Carlo a NULL right side; `WHERE orders.id IS NULL` keeps only those NULL-side rows. This "anti-join" pattern answers a huge class of questions: unsold products, users without a profile, invoices without a payment.

## Predict: how many rows?

Using the tables above (Ada has 2 orders, Beka has 1, Carlo has 0):

```sql
SELECT customers.name FROM customers
INNER JOIN orders ON orders.customer_id = customers.id;
```

Answer: **3** rows — Ada, Ada, Beka. Ada appears twice (one row per matching order), Beka once, and Carlo not at all (no match). A join can *multiply* rows: one customer with N orders yields N result rows.

## Common pitfalls

- **Using `INNER JOIN` when you meant to keep unmatched rows.** If customers without orders vanish and you needed them, switch to `LEFT JOIN`.
- **Filtering the outer table in `WHERE` and silently turning a `LEFT JOIN` into an inner one.** A condition like `WHERE orders.total > 0` rejects the NULL rows a left join added. Put such conditions in the `ON` clause instead.
- **Forgetting a join multiplies rows.** One left row with several matches becomes several result rows — watch your counts and sums.

## Interview lens

If asked the difference between inner and outer joins, say it in one line: **inner keeps only matching rows; outer (left/right/full) also keeps unmatched rows, NULL-filling the missing side.** Then anchor it — "a left join keeps every row of the left table."

The follow-up interviewers love: "find customers with no orders." Reach for the `LEFT JOIN ... WHERE right_table.id IS NULL` anti-join and explain why it works (the left join manufactures NULL right-sides for the unmatched, and the filter keeps exactly those). Volunteering that a `WHERE` condition on the outer table can accidentally demote a left join to an inner one shows real depth.
