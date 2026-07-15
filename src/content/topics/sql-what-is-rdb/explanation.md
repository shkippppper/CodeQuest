## The problem: the same fact, copied everywhere

Imagine tracking orders in one big spreadsheet:

```output
order | customer | customer_email   | city
------+----------+------------------+--------
1001  | Ada      | ada@example.com  | Batumi
1002  | Ada      | ada@example.com  | Batumi
1003  | Beka     | beka@example.com | Tbilisi
```

Ada's email sits in two rows. The day she changes it, you must find and fix *every* row that mentions her — miss one and your data now disagrees with itself.

Storing the same fact in many places is where data goes wrong. A **relational database** — a store that holds data in tables and links them together — is built to stop exactly this. This lesson is about what "relational" means and why it beats one giant sheet.

## A table is a spreadsheet with rules

Data lives in **tables**. A table looks like a spreadsheet: named **columns** across the top, one **row** per thing you're storing.

```output
customers
id | name | email
---+------+------------------
1  | Ada  | ada@example.com
2  | Beka | beka@example.com
```

The rules a table adds over a loose spreadsheet: every column has a fixed **type** (this one is text, that one is a number), and every row has the same columns. That fixed shape — the columns and their types — is called the table's **schema**.

## Split the data, link by id

Instead of repeating Ada's email in every order, give her one row in a `customers` table, then have each order *point at* that row:

```output
customers                          orders
id | name | email                  id   | customer_id | city
---+------+-----------------       -----+-------------+--------
1  | Ada  | ada@example.com        1001 | 1           | Batumi
2  | Beka | beka@example.com       1002 | 1           | Batumi
                                    1003 | 2           | Tbilisi
```

An order no longer stores the email at all. It stores `customer_id` — the `id` of the matching customer row. Ada's email now exists in exactly **one** place. Change it once and every order automatically reflects the new value, because the order never held a copy.

That link — "this column holds the id of a row in another table" — is the heart of the model. It gets its own lesson (`sql-tables-keys`); here the point is just that splitting data into linked tables removes the duplication.

## Why it's called "relational"

Predict: does "relational" refer to the *links* between tables?

Answer: no — a reasonable guess, but not the origin. The name comes from mathematics, where a **relation** is just a set of rows with the same columns. In other words, *a table itself is the "relation."* The links between tables are a bonus the model is famous for, but the word describes the tables.

You'll never need the math. What matters: a relational database is one organized as tables of typed rows, queried with a language called **SQL**.

## The fixed schema is a feature

Because every row shares the same columns and types, the database can guarantee things for you: a `price` column will never accidentally hold the word "banana," and an order can be forbidden from pointing at a customer that doesn't exist. The structure lets the database *protect* the data.

This rigidity is the trade-off. Adding a new column means changing the schema for the whole table, not just tacking a field onto one row.

## Where NoSQL fits

Not every store is relational. **NoSQL** is an umbrella term for databases that drop one or more of these rules. The most common kind, a **document store** (like MongoDB), keeps flexible JSON-shaped documents where each record can have different fields and no fixed schema.

| | Relational | Document (NoSQL) |
|---|---|---|
| Shape | Fixed schema, typed columns | Flexible per-record fields |
| Links | First-class, enforced | Usually up to your app code |
| Best when | Structured data, consistency matters | Rapidly changing or loosely-structured data |

Neither is "better." Relational shines when your data is structured and correctness matters — orders, payments, users. NoSQL shines when the shape changes constantly or you're storing loose documents. This curriculum is about the relational world and SQL.

## Common pitfalls

- **Treating a table like a spreadsheet and duplicating facts.** The whole point is to store each fact once and link to it. Repeated data drifts out of sync.
- **Thinking "relational" means "the relationships/links."** It refers to the tables themselves. The links are foreign keys, a separate idea.
- **Assuming NoSQL is newer-and-therefore-better.** They solve different problems; relational databases remain the default for structured, consistency-critical data.

## Interview lens

If asked "what is a relational database?", say: data stored in **tables** of typed rows, where tables link to each other by referencing ids, and you query it with SQL. Mentioning that each fact lives in one place — avoiding duplication — shows you understand *why* the model exists, not just what it is.

Expect a "relational vs NoSQL" follow-up. Don't crown a winner — say relational fits structured data where consistency matters, NoSQL fits flexible or loosely-structured data, and the choice depends on the workload. That measured answer reads as more senior than picking a side.
