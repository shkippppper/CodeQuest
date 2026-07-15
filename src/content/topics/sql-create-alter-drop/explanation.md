## The problem: before you can store data, you need a place for it

Every table you've queried had to be *defined* first — its columns and their types declared. That's the job of **DDL** (Data Definition Language), the family of commands that shape the database itself rather than the rows inside it. Three verbs do most of the work: `CREATE`, `ALTER`, `DROP`.

## CREATE TABLE: define the shape

`CREATE TABLE` lays out a new table's columns, each with a name and a type:

```sql
CREATE TABLE users (
    id     INTEGER PRIMARY KEY,
    name   TEXT NOT NULL,
    email  TEXT,
    joined DATE
);
```

Read it as a list of columns. `id INTEGER PRIMARY KEY` makes `id` the unique row identifier; `name TEXT NOT NULL` says the name must always be present. The table now exists but holds zero rows — you've built the container, not filled it.

Add `IF NOT EXISTS` to avoid an error when the table might already be there:

```sql
CREATE TABLE IF NOT EXISTS users ( ... );
```

## ALTER TABLE: change the shape later

Requirements change. `ALTER TABLE` modifies an existing table's structure without rebuilding it:

```sql
ALTER TABLE users ADD phone TEXT;          -- add a column
ALTER TABLE users DROP COLUMN email;        -- remove a column
ALTER TABLE users RENAME COLUMN name TO full_name;  -- rename
```

Each changes the *columns*, leaving existing rows in place (a newly added column starts NULL for every current row unless you give it a default). Note the exact spellings vary a little by database — SQLite historically supported only a subset of `ALTER` operations, for instance.

## DROP TABLE: remove it entirely

`DROP TABLE` deletes the table — structure, rows, and all:

```sql
DROP TABLE users;
```

There's no "rows left behind." The table is gone as if it never existed. `DROP TABLE IF EXISTS users;` avoids an error when it might already be absent.

## DROP vs DELETE vs TRUNCATE

Three very different "remove" operations that beginners blur together:

| Command | Family | What it removes |
|---|---|---|
| `DELETE FROM t` | DML | Rows (optionally filtered by `WHERE`); table stays |
| `TRUNCATE TABLE t` | DDL | *All* rows fast; table stays; no `WHERE` |
| `DROP TABLE t` | DDL | The entire table — structure included |

`DELETE` is surgical (a `WHERE` targets specific rows) and can be rolled back in a transaction. `TRUNCATE` empties the whole table quickly but keeps its definition. `DROP` removes the table itself.

## Predict: what's left?

You run `TRUNCATE TABLE users;`. Afterwards, can you still `SELECT * FROM users`?

Answer: **yes** — you'll get zero rows, but the table still exists. `TRUNCATE` removes the data, not the definition. Had you run `DROP TABLE users`, the `SELECT` would fail with "no such table."

## DDL usually can't be rolled back

One crucial behavior: in many databases, DDL **auto-commits** — the change is permanent the instant it runs, and a later `ROLLBACK` won't undo it. A mistaken `DROP TABLE` or `TRUNCATE` is often *not* recoverable the way a mistaken `DELETE` inside a transaction is. Treat structural commands with extra care, especially in production.

## Common pitfalls

- **Confusing `DROP` with `DELETE`.** `DELETE` removes rows and keeps the table; `DROP` removes the whole table. Reaching for the wrong one is a costly slip.
- **Assuming `TRUNCATE` can be rolled back like `DELETE`.** `TRUNCATE` is DDL in many engines and often auto-commits — no undo.
- **Running structural changes without `IF EXISTS`/`IF NOT EXISTS` in scripts.** A missing or already-present table then aborts the whole script; the guards make it idempotent.

## Interview lens

If asked the difference between `DELETE`, `TRUNCATE`, and `DROP`, give the crisp trio: `DELETE` removes selected rows (DML, `WHERE`-able, rollback-able), `TRUNCATE` empties all rows fast (DDL, no `WHERE`), `DROP` removes the entire table. Knowing which keep the table and which can be undone is exactly the point.

The senior note is transactional behavior: DDL commonly **auto-commits**, so a `DROP`/`TRUNCATE` mistake usually can't be rolled back, unlike a `DELETE` inside a transaction. Mentioning that you'd double-check a `DROP` against the right environment before running it signals operational maturity.
