## The problem: from real-world things to tables

Before writing `CREATE TABLE`, you decide *what tables to have* and *how they connect*. A store has customers, orders, and products; a customer places many orders; an order contains many products. Sketching those things and their connections first — an **entity-relationship model**, or **ER model** — keeps the schema coherent. This lesson turns that sketch into tables.

## Entities and relationships

Two words:

- An **entity** is a kind of thing you store — Customer, Order, Product. It becomes a **table**, and one instance (a specific customer) becomes a **row**.
- A **relationship** is how two entities connect — "a customer *places* orders," "an order *contains* products."

The design question for every relationship is its **cardinality**: how many of one entity relate to how many of the other. There are three shapes.

## One-to-many: the common case

The most frequent relationship. One customer has many orders; each order belongs to one customer:

```output
customers            orders
id | name            id | customer_id | total
```

You implement one-to-many by putting a **foreign key on the "many" side**. The order (many) stores `customer_id` pointing back at the one customer. Ask "which side can there be many of?" — the order — and that's where the foreign key goes. A customer isn't cluttered with a list of order ids; each order simply names its customer.

## One-to-one: a rarer split

Occasionally one row relates to exactly one row in another table — a user and their single profile settings row. Implement it like one-to-many but add a `UNIQUE` constraint on the foreign key so the "many" side is capped at one:

```sql
user_id INTEGER UNIQUE REFERENCES users(id)
```

One-to-one usually means you *could* have merged the tables; the split is deliberate — to isolate rarely-used columns, separate sensitive data, or keep an optional block of fields out of the main row.

## Many-to-many needs a third table

Here's the one people get wrong. An order contains many products, and a product appears in many orders — **many-to-many**. You *cannot* implement this with a foreign key on either side: an order can't hold one `product_id` (it has several), and neither can a product.

The solution is a **junction table** (also called a join or bridge table) that sits between them, holding one row per pairing:

```output
order_items
order_id | product_id | quantity
---------+------------+---------
1        | 10         | 2
1        | 11         | 1
2        | 10         | 5
```

Each row links one order to one product. Order 1 contains products 10 and 11 (two rows); product 10 appears in orders 1 and 2. The junction table has two foreign keys — one to each side — and its primary key is usually the **composite** `(order_id, product_id)`. A many-to-many is really *two* one-to-many relationships pointing into the junction table.

## Predict: how do you model it?

Students enrol in many courses; a course has many students. How many tables?

Answer: **three** — `students`, `courses`, and a junction table `enrolments(student_id, course_id)`. Any many-to-many needs that middle table; there's no way to represent it with just the two entity tables.

## Reading a relationship into keys

The whole mapping, in one glance:

| Relationship | Implementation |
|---|---|
| One-to-many | Foreign key on the "many" side |
| One-to-one | Foreign key with a `UNIQUE` constraint |
| Many-to-many | Junction table with two foreign keys |

Get the cardinality right and the keys follow mechanically.

## Common pitfalls

- **Trying to model many-to-many with a foreign key.** You can't fit many product ids in one order column. It needs a junction table — omitting it is the classic schema mistake.
- **Putting the foreign key on the "one" side.** In one-to-many the key goes on the *many* side (the order), not the one (the customer). Reversed, you'd need a list in a column.
- **Splitting into one-to-one without a reason.** If both rows always exist together and are read together, a separate table just adds a join. Split only for a real reason (optional/sensitive/rarely-used columns).

## Interview lens

If handed a design prompt ("model a store," "model a library"), start by naming the **entities** (tables) and the **relationship cardinality** between each pair, then place keys: foreign key on the many side for one-to-many, a junction table for many-to-many. Narrating cardinality first shows you design deliberately rather than guessing at columns.

The detail interviewers listen for is many-to-many: state plainly that it requires a **junction table** with a foreign key to each side and typically a composite primary key, and that it's really two one-to-many relationships. Correctly modeling students↔courses or orders↔products is a near-universal test — nailing the junction table is the win.
