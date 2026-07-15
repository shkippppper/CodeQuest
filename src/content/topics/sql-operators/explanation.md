## The problem: WHERE needs more than equals

You already filter with `=`, `<`, `>`, and combine with `AND`/`OR`. But real questions get clumsy fast. "Users aged 25 through 35" written with plain comparisons:

```sql
WHERE age >= 25 AND age <= 35
```

And "users in Batumi, Tbilisi, or Kutaisi" balloons into a wall of `OR`s. SQL has tighter operators for exactly these shapes: `BETWEEN` for ranges, `IN` for lists, and `LIKE` for text patterns.

## Ranges with BETWEEN

`BETWEEN` tests whether a value falls in a range:

```sql
SELECT name FROM users WHERE age BETWEEN 25 AND 35;
```

That's the same as `age >= 25 AND age <= 35` — and the key detail is that `BETWEEN` is **inclusive on both ends**. Both 25 and 35 match. People trip on this constantly.

Predict: which ages match `BETWEEN 25 AND 35` — is 35 included?

Answer: **yes**. `BETWEEN` includes both boundaries. If you want to exclude the top, don't use `BETWEEN` — write `age >= 25 AND age < 35` instead.

It works on dates and text too, following the column's natural order:

```sql
WHERE created BETWEEN '2026-01-01' AND '2026-01-31'
```

## Membership with IN

`IN` checks whether a value matches any item in a list — replacing a stack of `OR`s:

```sql
SELECT name FROM users
WHERE city IN ('Batumi', 'Tbilisi', 'Kutaisi');
```

That reads far better than `city = 'Batumi' OR city = 'Tbilisi' OR city = 'Kutaisi'`. `NOT IN` flips it to "none of these":

```sql
WHERE city NOT IN ('Batumi', 'Tbilisi')
```

One sharp edge: if the `IN` list contains a `NULL` and you use `NOT IN`, the whole condition can go `UNKNOWN` and return no rows. That surprise has its own explanation in the NULL lesson — here, just keep NULLs out of `NOT IN` lists.

## Pattern matching with LIKE

To match part of a string, `LIKE` compares against a pattern built from two wildcards:

- `%` — matches **any run of characters** (including none)
- `_` — matches **exactly one character**

```sql
SELECT name FROM users WHERE name LIKE 'A%';    -- starts with A: Ada
SELECT name FROM users WHERE name LIKE '%a';    -- ends with a: Ada
SELECT name FROM users WHERE name LIKE '%at%';  -- contains "at": Dato, Carlo? -> Dato
SELECT name FROM users WHERE name LIKE '_ato';  -- 4 letters ending "ato": Dato
```

Read `'A%'` as "an A, then anything." `'_ato'` is "one character, then a-t-o" — so exactly four letters. Combine the wildcards freely.

## A note on case and escaping

Whether `LIKE` cares about upper/lower case depends on the database: SQLite and MySQL are usually case-insensitive for ASCII, PostgreSQL's `LIKE` is case-sensitive (it offers `ILIKE` for insensitive matching). When you need to match a literal `%` or `_`, use an `ESCAPE` character so the wildcard is treated as ordinary text.

## Putting operators together

These combine with everything you know:

```sql
SELECT name FROM users
WHERE city IN ('Batumi', 'Tbilisi')
  AND age BETWEEN 30 AND 40
  AND name LIKE 'A%';
```

Each operator handles one shape of condition, and `AND`/`OR` glue them — remembering that `AND` binds tighter than `OR`, so parenthesize when mixing.

## Common pitfalls

- **Assuming `BETWEEN` is exclusive.** It includes *both* endpoints. For a half-open range, use explicit `>=` and `<`.
- **`NOT IN` with a NULL in the list.** The comparison goes UNKNOWN and you get zero rows. Strip NULLs first, or use `NOT EXISTS`.
- **Expecting `LIKE` case sensitivity to be universal.** It's dialect-dependent — Postgres is case-sensitive; use `ILIKE` or `LOWER()` for portable insensitivity.

## Interview lens

If asked to filter a range, reach for `BETWEEN` and *immediately* note it's inclusive on both ends — that awareness is exactly what's being tested. For a fixed set of values, `IN` reads better than chained `OR`s.

On `LIKE`, be ready to explain `%` (any characters) versus `_` (one character), and volunteer that a leading wildcard like `'%son'` can't use a normal index, so it forces a full scan. Connecting pattern shape to performance signals you think about more than correctness.
