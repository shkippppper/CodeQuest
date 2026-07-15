## The problem: why not index every column?

Indexes make reads fast. So why not put one on every column and enjoy fast everything? Because an index isn't free — it costs on **writes**, on **storage**, and it only helps when the query and the data actually suit it. Indexing is a trade, and knowing the costs is what separates "add an index" from "add the *right* index."

## Every index slows writes

An index is a second structure that must stay in sync with the table. Every time you change data, every index on that table must be updated too:

```sql
INSERT INTO users (email, name) VALUES ('x@y.com', 'X');
```

With three indexes on `users`, that one insert does **four** writes: the row, plus an update to each of the three indexes (each must slot the new value into its sorted position). `UPDATE` and `DELETE` pay the same tax. A table with many indexes has fast reads but noticeably slower writes.

So the trade is direct: indexes speed reads and slow writes. On a write-heavy table, too many indexes hurt.

## Indexes cost storage

Each index is extra data on disk — often a significant fraction of the table's own size. Ten indexes can double or triple the storage a table consumes, and more data means more to cache, back up, and maintain. Rarely a dealbreaker alone, but it adds up.

## Selectivity: an index on the wrong column does nothing

An index helps only when it *narrows* the search a lot. **Selectivity** is how many distinct values a column has relative to its rows — high selectivity (email: nearly unique) is great; low selectivity (a boolean `is_active`) is nearly useless.

Predict: you index a boolean `is_active` column where 90% of rows are `true`. Does `WHERE is_active = true` use it?

Answer: **probably not.** Matching 90% of the table via an index — jump to a value, follow a pointer, repeat millions of times — is *slower* than just scanning. The optimizer knows this and picks a `Seq Scan`. An index only pays off when the condition selects a **small fraction** of rows.

## What silently defeats an index

Even with a perfect index, the *way* you write the condition can bypass it:

- **A function on the indexed column.** `WHERE LOWER(email) = 'x'` can't use a plain index on `email` — the index stores the raw values, not their lowercased form. (Fix: index the expression, `CREATE INDEX ... ON users(LOWER(email))`.)
- **A leading wildcard.** `WHERE name LIKE '%son'` could match anywhere in the string, so the sorted index is useless; `'John%'` (fixed prefix) can seek.
- **A type mismatch.** Comparing an indexed number column to a string can force a conversion that skips the index.

These are why a query with an index still shows a `Seq Scan` in `EXPLAIN` — the condition isn't in an index-usable shape.

## Composite indexes and column order

An index can cover **multiple columns** — a **composite index**. But column *order* matters. An index on `(last_name, first_name)` is sorted by last name first, then first name within each last name, like a phone book:

- `WHERE last_name = 'Smith'` → uses it.
- `WHERE last_name = 'Smith' AND first_name = 'Ada'` → uses it fully.
- `WHERE first_name = 'Ada'` alone → **can't** use it — you can't jump to a first name without a last name, just as a phone book can't find everyone named "Ada."

This is the **leftmost-prefix** rule: a composite index helps queries that filter on a *prefix* of its columns, starting from the left. Order the columns to match your common queries.

## Common pitfalls

- **Indexing everything "to be safe."** Each index taxes every write and consumes storage. Index the columns your queries actually filter, join, and sort on.
- **Indexing a low-selectivity column.** A boolean or a status with two values rarely benefits; the optimizer will scan anyway.
- **Wrapping an indexed column in a function or leading wildcard.** It silently defeats the index. Index the expression, or restructure the condition.

## Interview lens

If asked "should you index every column?", say no and explain the trade: indexes **speed reads but slow writes** (each index is another structure to update on every `INSERT`/`UPDATE`/`DELETE`) and cost storage — so you index the columns queries filter, join, and sort on, not all of them.

The senior details are **selectivity** and **index-defeating conditions**: an index on a low-selectivity column (a boolean) won't be used, and a **function on the column** or a **leading wildcard** bypasses even a good index. Add the **leftmost-prefix** rule for composite indexes — column order must match how you query — and you've covered what interviewers probe when they push past "just add an index."
