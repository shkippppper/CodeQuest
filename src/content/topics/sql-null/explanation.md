## The problem: we don't know yet

Some facts are simply missing. A user signs up but hasn't given a middle name, or a survey answer was skipped:

```output
id | name | middle_name
---+------+------------
1  | Ada  | Grace
2  | Beka | NULL
3  | Dato | NULL
```

That `NULL` isn't an empty string and isn't zero. It's SQL's marker for **unknown** — "there is no value here." Treating unknown like a normal value is where a huge share of SQL bugs live, so NULL earns careful handling.

## NULL is not zero, not blank

Three different things people confuse:

```sql
0      -- the number zero: a known value
''     -- an empty string: a known value (zero characters)
NULL   -- unknown: no value at all
```

A balance of `0` means "we know it's zero." A `NULL` balance means "we don't know the balance." The distinction matters the moment you compare or add.

## Comparisons with NULL give a third answer

You'd expect every comparison to be true or false. With NULL there's a third result. Ask "is the unknown middle name equal to 'Grace'?":

```sql
NULL = 'Grace'   -- result: UNKNOWN (not false!)
NULL = NULL      -- result: UNKNOWN (not true!)
```

Since the value is unknown, whether it equals anything is *also* unknown. This is **three-valued logic** — every condition is `TRUE`, `FALSE`, or `UNKNOWN`, where UNKNOWN means "can't say."

The practical rule: `WHERE` only keeps rows where the condition is **TRUE**. `UNKNOWN` rows are dropped, just like `FALSE` ones.

```sql
SELECT name FROM users WHERE middle_name = 'Grace';
```

Only Ada comes back. Beka and Dato produce `UNKNOWN` (their middle name is unknown, so "equals Grace?" is unknowable), and `WHERE` discards them.

## Predict: finding the missing ones

You want the users with *no* middle name. Does this work?

```sql
SELECT name FROM users WHERE middle_name = NULL;
```

Answer: it returns **nothing**. `middle_name = NULL` evaluates to `UNKNOWN` for every row — even the NULL ones — so no row is ever TRUE. You must use a special operator instead:

```sql
SELECT name FROM users WHERE middle_name IS NULL;      -- Beka, Dato
SELECT name FROM users WHERE middle_name IS NOT NULL;  -- Ada
```

`IS NULL` and `IS NOT NULL` are the *only* correct way to test for a missing value. `= NULL` and `<> NULL` never match anything.

## NULL inside AND / OR

Combining conditions, `UNKNOWN` propagates by careful rules. Two worth knowing:

```sql
TRUE  OR  UNKNOWN   -- TRUE  (one true branch is enough)
FALSE AND UNKNOWN   -- FALSE (one false branch kills an AND)
TRUE  AND UNKNOWN   -- UNKNOWN
```

You don't need to memorize the full table. The intuition: `OR` is satisfied as soon as one side is TRUE; `AND` fails as soon as one side is FALSE; otherwise an UNKNOWN keeps the result UNKNOWN.

## NULL in aggregates

Aggregate functions — the ones that summarize many rows, like `SUM` or `COUNT` — mostly **skip** NULLs:

```sql
-- salaries: 100, NULL, 200
SELECT SUM(salary)   FROM staff;  -- 300  (NULL ignored)
SELECT AVG(salary)   FROM staff;  -- 150  (300 / 2, not / 3)
SELECT COUNT(salary) FROM staff;  -- 2    (NULLs not counted)
SELECT COUNT(*)      FROM staff;  -- 3    (rows, NULL or not)
```

The trap is `AVG`: it divides by the count of *non-NULL* values, so a NULL is not treated as zero. And `COUNT(column)` skips NULLs while `COUNT(*)` counts every row. These have their own aggregation lesson; the point here is that NULL quietly changes the math.

## Filling the gap with COALESCE

When you'd rather show a real value than a blank, `COALESCE` returns the first non-NULL argument:

```sql
SELECT name, COALESCE(middle_name, '(none)') FROM users;
```

Beka and Dato now display `(none)` instead of NULL. `COALESCE(a, b, c)` walks left to right and returns the first argument that isn't NULL — handy for defaults in reports and for turning a NULL into 0 before arithmetic.

## Common pitfalls

- **`= NULL` to find missing values.** Always `UNKNOWN`, never matches. Use `IS NULL`.
- **Assuming `AVG` treats NULL as zero.** It ignores NULLs entirely, dividing by the non-NULL count — a different, often surprising number.
- **Forgetting NULL in `NOT IN`.** If the list contains a NULL, `NOT IN` can return no rows at all because the comparison goes UNKNOWN. Filter NULLs out first.

## Interview lens

If asked "what is NULL?", say it means **unknown / absent**, distinct from `0` or `''`. Then volunteer the consequence: comparisons against NULL yield **UNKNOWN** under three-valued logic, and `WHERE` keeps only TRUE rows — so you test missingness with `IS NULL`, never `= NULL`. That chain of reasoning is what interviewers are probing.

A favorite follow-up is aggregates: state that `SUM`/`AVG`/`COUNT(col)` skip NULLs and that `AVG` therefore divides by the non-NULL count, while `COUNT(*)` counts all rows. Mentioning `COALESCE` for supplying defaults shows you know how to *handle* NULL, not just describe it.
