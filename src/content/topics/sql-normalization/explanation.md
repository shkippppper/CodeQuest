## The problem: redundancy breeds contradictions

Here's an orders table that crammed everything into one place:

```output
order | customer | customer_city | product      | products
------+----------+---------------+--------------+---------
1     | Ada      | Batumi        | Pen, Notebook| ...
2     | Ada      | Batumi        | Pen          | ...
3     | Beka     | Tbilisi       | Notebook     | ...
```

Two problems are visible. `Ada / Batumi` is repeated, and the `product` cell holds a *list*. Repetition invites contradiction — update Ada's city on row 1 but forget row 2 and the table now claims she lives in two places. These are **anomalies**, and **normalization** is the process of splitting columns across tables so each fact lives once, removing them.

## The three anomalies normalization fixes

Redundant data causes three specific bugs:

- **Update anomaly** — a fact stored in many rows must be changed in all of them; miss one and the data contradicts itself.
- **Insert anomaly** — you can't record a fact because unrelated data is missing (can't add a customer who has no order yet, if customers only exist inside order rows).
- **Delete anomaly** — deleting one thing accidentally erases another (delete Ada's only order and you lose that she lives in Batumi).

Normalization is defined in stages called **normal forms**, each removing a specific kind of redundancy.

## First normal form (1NF): atomic values

**1NF** requires every cell to hold a single, indivisible value — no lists, no repeating groups.

The `product` cell `"Pen, Notebook"` breaks 1NF. Fix it by giving each product its own row:

```output
order_items
order_id | product
---------+---------
1        | Pen
1        | Notebook
2        | Pen
3        | Notebook
```

Now each cell is **atomic** — one value — and you can filter, join, and aggregate on products properly. A comma-separated list in a column is the classic 1NF violation.

## Second normal form (2NF): no partial dependency

**2NF** applies when the primary key is *composite* (multiple columns). It requires every non-key column to depend on the **whole** key, not just part of it.

Suppose `order_items` had a `product_price` column, with key `(order_id, product)`:

```output
order_id | product | product_price
```

`product_price` depends only on `product`, not on `order_id` — a **partial dependency**. The price is duplicated across every order of that product. Fix: move price to a `products` table keyed by product alone. Now `order_items` holds only what depends on the full key.

## Third normal form (3NF): no transitive dependency

**3NF** requires non-key columns to depend on the key *directly*, not through another non-key column — no **transitive dependency**.

An orders table with `customer_id` and `customer_city`:

```output
orders(id, customer_id, customer_city)
```

`customer_city` depends on `customer_id`, which isn't the key — city depends on the key only *transitively*, through the customer. So a customer's city is duplicated across all their orders (the update anomaly from the top). Fix: `customer_city` belongs in a `customers` table keyed by `customer_id`. Orders keep just the `customer_id` foreign key.

The plain-language summary of 3NF: **every non-key column depends on the key, the whole key, and nothing but the key.**

## Predict: which normal form is violated?

A table `employees(id, name, department_id, department_name)`. Which rule does `department_name` break?

Answer: **3NF**. `department_name` depends on `department_id` (a non-key column), not directly on the employee `id` — a transitive dependency. Every employee in a department repeats the department name. Move it to a `departments` table.

## Denormalization: breaking the rules on purpose

Normalized schemas avoid anomalies but require **joins** to reassemble data, and joins cost time. **Denormalization** deliberately reintroduces redundancy — copying a column, storing a precomputed total — to make reads faster.

It's a trade, not a mistake: you accept the update-anomaly risk (now you must keep copies in sync) in exchange for fewer joins on a hot read path. The discipline is to normalize first, then denormalize *selectively* with eyes open, often keeping the normalized tables as the source of truth.

## Common pitfalls

- **Storing lists in a column.** A comma-separated `"Pen, Notebook"` breaks 1NF and makes filtering/joining painful. Give each value its own row.
- **Denormalizing prematurely.** Redundant copies invite update anomalies. Normalize first; denormalize only for a measured performance need.
- **Treating normalization as all-or-nothing.** 3NF is the usual target for transactional schemas; higher forms exist but are rarely needed day to day.

## Interview lens

If asked "what is normalization?", say it's organizing columns into tables so each fact is stored **once**, eliminating the **update / insert / delete anomalies** that redundancy causes. Naming those three anomalies shows you understand the *why*, not just the ladder of forms.

For the forms themselves, keep it crisp: **1NF** = atomic values (no lists), **2NF** = no partial dependency on part of a composite key, **3NF** = no transitive dependency (non-key depending on another non-key). Then volunteer the counterpoint: **denormalization** trades that cleanliness for read speed by reintroducing redundancy deliberately — normalize first, denormalize with intent. That balanced take is what separates a memorized answer from a practitioner's.
