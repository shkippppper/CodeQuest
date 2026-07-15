## The problem: a table has more than you want

Picture a `users` table sitting in the database:

```output
id | name    | city    | age
---+---------+---------+----
1  | Ada     | Batumi  | 34
2  | Beka    | Tbilisi | 28
3  | Carlo   | Batumi  | 41
4  | Dato    | Kutaisi | 19
```

You rarely want the whole thing. You want *some columns* for *some rows* — "the names of users in Batumi", not every field of every person. **SQL** — the language you use to talk to a relational database — has one statement for exactly that read: `SELECT`.

## Ask for columns with SELECT

Start with the smallest useful query:

```sql
SELECT name FROM users;
```

Read it left to right: pick the `name` column, `FROM` the `users` table. You get one value per row:

```output
name
-----
Ada
Beka
Carlo
Dato
```

Ask for more than one column by separating names with commas:

```sql
SELECT name, city FROM users;
```

```output
name  | city
------+--------
Ada   | Batumi
Beka  | Tbilisi
Carlo | Batumi
Dato  | Kutaisi
```

When you genuinely want *every* column, there's a shorthand — the star:

```sql
SELECT * FROM users;
```

The `*` means "all columns." It's handy while exploring, but in real application code you name the columns you need. Naming them means the query keeps working when someone later adds a column, and the database reads less data.

## Keep only the rows you want with WHERE

`SELECT` alone gives you *every* row. To drop rows, add a `WHERE` clause — a condition each row must pass to appear in the result:

```sql
SELECT name FROM users WHERE city = 'Batumi';
```

The database walks every row, keeps the ones where `city` equals `'Batumi'`, and throws the rest away:

```output
name
-----
Ada
Carlo
```

Two small things in that query matter. Text goes in **single quotes** — `'Batumi'`, not `"Batumi"`. And equality is a single `=`, not the doubled `==` you may have seen in other languages.

Numbers need no quotes, and you can compare them with the usual operators:

```sql
SELECT name FROM users WHERE age >= 30;
```

```output
name
-----
Ada
Carlo
```

`<`, `>`, `<=`, `>=`, `=`, and "not equal" (`<>`, or `!=` in most databases) all work the way you'd expect on numbers.

## Combine conditions with AND / OR

One condition is often not enough. Glue several together with `AND` (every part must be true) and `OR` (at least one part must be true):

```sql
SELECT name FROM users
WHERE city = 'Batumi' AND age >= 40;
```

Only Carlo is in Batumi *and* at least 40:

```output
name
-----
Carlo
```

Swap `AND` for `OR` and the meaning flips to "either one is enough":

```sql
SELECT name FROM users
WHERE city = 'Kutaisi' OR age >= 40;
```

```output
name
-----
Carlo   -- age 41
Dato    -- city Kutaisi
```

When you mix `AND` and `OR` in the same `WHERE`, `AND` binds tighter than `OR` — it groups first, just like `×` before `+` in arithmetic. That is easy to get wrong, so reach for parentheses to say exactly what you mean:

```sql
SELECT name FROM users
WHERE (city = 'Batumi' OR city = 'Tbilisi') AND age >= 30;
```

The parentheses force the two-city test to happen first, *then* the age test applies to that group.

## Predict before you run it

Here's the same data. What does this return?

```sql
SELECT name FROM users
WHERE city = 'Batumi' OR city = 'Tbilisi' AND age >= 30;
```

Answer: `Ada`, `Carlo`, *and* `Beka`. Because `AND` binds first, the database reads this as `city = 'Batumi'` **OR** `(city = 'Tbilisi' AND age >= 30)`. Ada and Carlo pass the first branch on city alone; Beka (Tbilisi, 28) fails the age test, so — wait, Beka is 28, under 30, so Beka is *not* included. The result is `Ada` and `Carlo`. The lesson isn't the exact rows; it's that without parentheses the grouping is not what a quick reading suggests. Add the parentheses.

## A note on missing values

Some columns hold no value at all — a **NULL**, SQL's marker for "unknown / not filled in." NULL does not behave like a normal value in `WHERE`: a row where `city` is NULL passes neither `city = 'Batumi'` nor `city <> 'Batumi'`. Comparisons against unknown answer "unknown," not true. NULL has enough surprises to earn its own lesson later; for now, just know that `WHERE` silently skips rows whose tested column is NULL.

## Where this runs on iOS

This isn't only server knowledge. Every iPhone ships with **SQLite**, a small SQL database, and Apple's **Core Data** and **SwiftData** store your objects in a SQLite file underneath. When you write a SwiftData fetch with a predicate, the framework compiles it down to a `SELECT ... WHERE ...` much like the ones above. Knowing the raw SQL makes those higher-level tools far less mysterious.

## Common pitfalls

- **Double quotes around text.** `WHERE city = "Batumi"` — in standard SQL and PostgreSQL, double quotes mean *a column named Batumi*, so you get a confusing error. Use single quotes for text values.
- **`= NULL`.** `WHERE city = NULL` never matches anything. Testing for a missing value uses `IS NULL` instead (its own lesson).
- **Forgetting parentheses with mixed AND/OR.** `AND` groups before `OR`; if you meant the other grouping, the query quietly returns the wrong rows instead of erroring.

## Interview lens

If asked to "get some data out of a table," reach for `SELECT columns FROM table WHERE condition` and say it in that order — most interviewers just want to see you filter with `WHERE` rather than pulling everything and filtering in application code.

Expect a follow-up on operator precedence: be ready to explain that `AND` binds tighter than `OR`, and that you use parentheses to make intent explicit. Volunteering that habit signals you've been bitten by it before.

If SQLite or Core Data comes up, connect the dots: `SELECT`/`WHERE` is what a SwiftData or Core Data fetch predicate becomes under the hood. Showing you know the layer beneath the framework reads as senior.
