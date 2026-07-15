## The problem: relationships inside one table

Not every relationship spans two tables. An `employees` table stores who reports to whom, all in one place — each row points at another row in the *same* table:

```output
employees
id | name  | manager_id
---+-------+-----------
1  | Ada   | NULL        <- the boss
2  | Beka  | 1           <- reports to Ada
3  | Carlo | 1           <- reports to Ada
4  | Dato  | 2           <- reports to Beka
```

"List each employee next to their manager's name" needs the manager's row — which is another row in this very table. You can't get it with a normal join to a *different* table. You join the table **to itself**.

## The self join: one table, two roles

Join `employees` to `employees`, giving the two copies different names (**aliases**) so you can tell them apart:

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees AS e
LEFT JOIN employees AS m ON e.manager_id = m.id;
```

```output
employee | manager
---------+--------
Ada      | NULL
Beka     | Ada
Carlo    | Ada
Dato     | Beka
```

The aliases `e` and `m` are the whole trick. Think of `e` as "the employee row" and `m` as "the manager row." The `ON e.manager_id = m.id` says: match each employee to the row whose `id` is their `manager_id`. It's an ordinary join; the only novelty is that both sides are the same table, so the aliases are *mandatory* to disambiguate.

A `LEFT JOIN` here keeps Ada (whose `manager_id` is NULL) with a NULL manager, rather than dropping the boss.

## The cross join: every pairing

A **cross join** pairs *every* row of one table with *every* row of another — no `ON` condition at all. The result is the **Cartesian product**: all possible combinations.

```sql
SELECT sizes.label, colors.label
FROM sizes
CROSS JOIN colors;
```

With 3 sizes and 4 colors you get 3 × 4 = **12** rows — every size-color pairing. That's genuinely useful for generating combinations: all size/color variants of a product, every day×room slot for a schedule, a grid of options.

## Predict: how big?

`sizes` has 3 rows, `colors` has 4 rows.

```sql
SELECT * FROM sizes CROSS JOIN colors;
```

How many rows come back? Answer: **12** — 3 × 4. A cross join's row count is the *product* of the two tables' counts, which is exactly why an accidental one is dangerous.

## The accidental cross join

Cross joins are usually a *bug*. Forget the `ON` condition on a regular join — or write the old comma syntax without a matching `WHERE` — and the database quietly pairs everything:

```sql
SELECT * FROM orders, customers;   -- no WHERE: every order × every customer
```

With 10,000 orders and 5,000 customers that's 50 million rows. The fix is to always state the relationship: `FROM orders JOIN customers ON orders.customer_id = customers.id`. An explosion in row count is the classic sign of a missing join condition.

## Common pitfalls

- **Forgetting aliases in a self join.** Without `e` and `m`, `employees.id` is ambiguous — which copy? Aliases are required, not optional.
- **Accidental cross join from a missing `ON`.** A join without a condition (or comma-join without `WHERE`) multiplies row counts into the millions. Always specify the match.
- **Dropping the top of a hierarchy with an inner self join.** The root row (manager_id NULL) has no manager to match; use a `LEFT JOIN` to keep it.

## Interview lens

If asked "how do you show each employee with their manager's name from one table?", the answer is a **self join**: join the table to itself with two aliases, matching `employee.manager_id` to `manager.id`, and use a `LEFT JOIN` so the top of the hierarchy survives. Naming the aliases as two roles makes the explanation click.

On cross joins, state that a cross join produces the **Cartesian product** — every combination, row count = product of the inputs — and that it's occasionally intentional (generating variant grids) but far more often an accidental bug from a missing join condition. Recognizing a runaway row count as the symptom of a lost `ON` is exactly the practical instinct interviewers want.
