## The problem: which row do you mean?

Here's a `customers` table:

```output
name | city
-----+--------
Ada  | Batumi
Ada  | Tbilisi
Beka | Batumi
```

Two people named Ada. If you say "update Ada's city," the database has no way to know *which* Ada. Names repeat, so a name can't reliably identify a row. Every table needs a column whose value is guaranteed unique — a dependable handle for "this exact row."

## The primary key: a row's unique name

Give the table an `id` column where every value is different:

```output
id | name | city
---+------+--------
1  | Ada  | Batumi
2  | Ada  | Tbilisi
3  | Beka | Batumi
```

That `id` column is the **primary key** — the column (or columns) whose value uniquely identifies each row. "Update the customer with id 2" is now unambiguous.

A primary key carries two promises, enforced by the database:

- **Unique** — no two rows may share the same primary-key value.
- **Not empty** — a primary-key value can never be missing (never NULL).

Try to insert a second row with `id = 2` and the database rejects it. That rejection is the point: the key stays trustworthy because the database won't let you break it.

Most tables use a plain auto-incrementing integer id as the primary key — the database hands out 1, 2, 3, … so you never pick them yourself.

## Foreign keys: pointing at another table's row

Now a second table, `orders`, needs to record who placed each order. It stores the customer's primary-key value:

```output
orders
id   | customer_id | total
-----+-------------+------
1001 | 2           | 40
1002 | 3           | 15
```

`customer_id` here is a **foreign key** — a column that holds the primary-key value of a row in another table. Order 1001 points at customer 2; order 1002 points at customer 3.

Read the direction carefully: the *child* table (orders) points at the *parent* table (customers). One customer can have many orders, but each order names exactly one customer.

## What a foreign key protects

The database can enforce that a foreign key only ever points at a row that actually exists. This guarantee is called **referential integrity** — references are kept honest.

Watch it block a bad write:

```sql
INSERT INTO orders (id, customer_id, total) VALUES (1003, 999, 20);
```

If no customer has `id = 999`, the database rejects the insert. You cannot create an order for a customer who doesn't exist. The foreign key turns "this should point at a real customer" from a hope into a rule.

It works in the other direction too. Try to delete customer 2 while order 1001 still points at them:

```sql
DELETE FROM customers WHERE id = 2;
```

By default the database refuses — deleting would leave order 1001 pointing at nothing, an **orphan**. You'd have to remove or reassign the order first. (You can configure other behaviors, like automatically deleting the orders too, but the safe default is to block.)

## When one column isn't enough

Sometimes no single column is unique, but a *combination* is. A table of class enrolments might allow a student in many classes and a class to have many students — but each `(student_id, class_id)` pair should appear once:

```output
enrolments
student_id | class_id | grade
-----------+----------+------
1          | 10       | A
1          | 11       | B
2          | 10       | A
```

A primary key made of more than one column is a **composite key**. Here the pair of columns together is unique, even though neither column is unique alone.

## Predict: can a foreign key be empty?

An order has an optional `coupon_id` foreign key. Most orders use no coupon. What can that column hold?

Answer: a real coupon id *or* NULL. A foreign key may be left empty to mean "points at nothing." What it may **not** be is a value that points at a coupon row that doesn't exist. NULL is allowed; a dangling reference is not.

## Common pitfalls

- **Using a name (or email, or phone) as the primary key.** These change and can repeat. Prefer a stable, meaningless id the database generates.
- **Inserting a child row before its parent exists.** Create the customer, *then* the order — the foreign key requires the target to already be there.
- **Expecting to delete a parent that still has children.** The default blocks it to avoid orphans; remove or reassign the children first, or configure cascading behavior deliberately.

## Interview lens

If asked "what's the difference between a primary key and a foreign key?": a **primary key** uniquely identifies rows *within* its own table (unique + never NULL); a **foreign key** stores a primary-key value *from another table* to link the two. Say which table points at which — the child's foreign key references the parent's primary key.

Expect "what does a foreign key give you?" The word to reach for is **referential integrity**: the database guarantees the reference points at a row that exists, and blocks deletes that would orphan children. Naming that term and giving the orphan example signals you've relied on it in practice.
