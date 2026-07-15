## The problem: a value that depends on a condition

You want to label each user by age group in the result:

```output
name  | age | group
------+-----+--------
Dato  | 19  | minor
Beka  | 28  | adult
Ada   | 34  | adult
```

There's no `group` column in the table — you need to *compute* it per row: if the age is under 18, say "minor," otherwise "adult." SQL's tool for "pick a value based on conditions" is the **CASE expression** — its version of if/else.

## The searched CASE

The general form lists conditions and the value to return for each:

```sql
SELECT name, age,
  CASE
    WHEN age < 18 THEN 'minor'
    WHEN age < 65 THEN 'adult'
    ELSE 'senior'
  END AS group
FROM users;
```

Read it top to bottom: the database checks each `WHEN` in order and returns the `THEN` value for the **first** one that's true. `age = 34` skips the first `WHEN` (not < 18), matches the second (< 65), and returns `'adult'` — it never reaches the third. `AS group` names the computed column.

The order matters because it stops at the first match. If you wrote `WHEN age < 65` first, everyone under 65 — including minors — would get 'adult'. List the narrowest conditions first.

## ELSE and the missing default

`ELSE` gives the value when no `WHEN` matched. Leave it out and unmatched rows get **NULL**:

```sql
CASE WHEN age < 18 THEN 'minor' END
-- age 34 → NULL, because no WHEN matched and there's no ELSE
```

So an `ELSE` is really "the default." Include one whenever a NULL result would be wrong.

## The simple CASE

When every condition compares the *same* column to a value, there's a shorter form:

```sql
SELECT name,
  CASE city
    WHEN 'Batumi'  THEN 'coast'
    WHEN 'Tbilisi' THEN 'capital'
    ELSE 'other'
  END AS region
FROM users;
```

Here `CASE city` is compared against each `WHEN` value with `=`. It's exactly equivalent to `CASE WHEN city = 'Batumi' THEN … END`, just more compact. Use the simple form for equality checks against one column; use the searched form for anything richer (ranges, multiple columns, `IS NULL`).

## CASE goes almost anywhere

A `CASE` produces a value, so it works wherever a value is allowed — not just in `SELECT`. Sort by a custom priority:

```sql
ORDER BY CASE status
           WHEN 'urgent' THEN 1
           WHEN 'normal' THEN 2
           ELSE 3
         END;
```

That forces 'urgent' rows first regardless of alphabetical order.

## The senior trick: conditional counting

Put `CASE` *inside* an aggregate to count or sum only rows meeting a condition. This tallies minors and adults in one pass:

```sql
SELECT
  COUNT(CASE WHEN age < 18 THEN 1 END) AS minors,
  COUNT(CASE WHEN age >= 18 THEN 1 END) AS adults
FROM users;
```

Why it works: `COUNT` ignores NULLs. For a minor, the first `CASE` returns `1` (counted) and the second returns NULL (skipped). One scan of the table produces both totals — a pattern called a **pivot**, turning rows into side-by-side columns.

## Predict: what comes back?

```sql
SELECT CASE WHEN 5 > 10 THEN 'a' WHEN 5 > 3 THEN 'b' ELSE 'c' END;
```

Answer: `'b'`. The first `WHEN` (5 > 10) is false, the second (5 > 3) is true, so it returns `'b'` and stops — never evaluating the `ELSE`.

## Common pitfalls

- **Wrong `WHEN` order.** Evaluation stops at the first true branch, so a broad condition placed early swallows narrower ones. Put specific conditions first.
- **Forgetting `ELSE`.** Unmatched rows silently become NULL, which can break later math or filtering. Add an explicit default.
- **Expecting `CASE` to run several branches.** Only the first matching branch's `THEN` is returned; the rest are skipped.

## Interview lens

If asked to bucket or label rows, reach for `CASE` and mention the first-match-wins rule — ordering the `WHEN`s correctly is the subtle part interviewers watch for. Note that omitting `ELSE` yields NULL.

The impressive move is conditional aggregation: `COUNT`/`SUM` with a `CASE` inside to compute several conditional totals in a single scan, exploiting that `COUNT` skips NULL. Naming it as a lightweight pivot shows you've used it to shape real reports, not just toy queries.
