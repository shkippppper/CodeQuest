## The problem: reading isn't enough

`SELECT` reads, but an app has to *write* — sign up a user, change an email, remove an account. Those are the three **DML** (Data Manipulation Language) verbs that change rows: `INSERT` adds them, `UPDATE` changes them, `DELETE` removes them. Each is simple, and each has one sharp edge worth respecting.

## INSERT: add rows

`INSERT` adds a new row. Name the columns, then give matching values:

```sql
INSERT INTO users (name, email)
VALUES ('Ada', 'ada@example.com');
```

Columns you don't list get their default (or NULL). Listing the columns explicitly — rather than relying on table order — keeps the insert working when someone later adds a column.

Add several rows in one statement with a comma-separated list of value tuples:

```sql
INSERT INTO users (name, email) VALUES
  ('Beka', 'beka@example.com'),
  ('Dato', 'dato@example.com');
```

You can also insert the *result of a query* — copying rows from one table to another:

```sql
INSERT INTO archive (name, email)
SELECT name, email FROM users WHERE joined < '2020-01-01';
```

## UPDATE: change existing rows

`UPDATE` sets new values on rows that match a condition:

```sql
UPDATE users
SET email = 'new@example.com'
WHERE id = 1;
```

`SET` lists the columns to change; `WHERE` picks which rows. Change several columns at once by separating assignments with commas: `SET name = 'Ada B', email = '...'`.

## The most dangerous omission in SQL

Look hard at what happens without the `WHERE`:

```sql
UPDATE users SET email = 'new@example.com';
```

This updates **every row in the table** — every user now has the same email. There's no confirmation, no undo outside a transaction. The same is true of `DELETE`:

```sql
DELETE FROM users;   -- deletes ALL rows
```

A forgotten `WHERE` on an `UPDATE` or `DELETE` is one of the classic production disasters. The habit that saves you: write the `WHERE` *first*, or test the condition with a `SELECT` before turning it into an `UPDATE`/`DELETE`.

## DELETE: remove rows

`DELETE` removes rows matching a condition:

```sql
DELETE FROM users WHERE id = 1;
```

Recall from the schema lessons: `DELETE` removes rows but keeps the table (and can be rolled back in a transaction), unlike `DROP`/`TRUNCATE`.

## Predict: how many rows change?

The `users` table has 100 rows, 3 of them with `status = 'banned'`.

```sql
UPDATE users SET active = false WHERE status = 'banned';
```

Answer: **3** rows. `UPDATE` touches only rows matching the `WHERE`. Had you omitted the `WHERE`, all 100 would change — which is exactly the trap.

## Upsert: insert or update

Often you want "insert this row, but if it already exists, update it instead" — an **upsert** (insert + update). Standard SQL spells it with `ON CONFLICT` (PostgreSQL/SQLite) or `MERGE`:

```sql
INSERT INTO users (id, name) VALUES (1, 'Ada')
ON CONFLICT (id) DO UPDATE SET name = 'Ada';
```

If no row with `id = 1` exists, it inserts; if one does (a conflict on the `id` key), it updates instead. Upsert saves the "check then insert-or-update" dance and avoids a race between the check and the write.

## Common pitfalls

- **`UPDATE`/`DELETE` with no `WHERE`.** Silently affects every row. Write the `WHERE` first, or preview with a `SELECT`.
- **Relying on column order in `INSERT`.** `INSERT INTO users VALUES (...)` without a column list breaks when the schema changes. Always name the columns.
- **Doing check-then-insert in app code.** Two requests can both pass the check and both insert. An upsert (`ON CONFLICT`) or a `UNIQUE` constraint handles the race correctly.

## Interview lens

If asked to modify data, use the right verb and *always* pair `UPDATE`/`DELETE` with a `WHERE`. Volunteering that you'd preview the affected rows with a `SELECT` (or wrap the change in a transaction) before running a bulk `UPDATE`/`DELETE` signals the operational caution interviewers want.

The value-add answer is upsert: describe "insert or update on conflict" with `ON CONFLICT`/`MERGE` and explain it avoids the race in a manual check-then-write. Tying it back to a `UNIQUE` constraint (which is what makes the conflict detectable) shows the pieces fit together in your head.
