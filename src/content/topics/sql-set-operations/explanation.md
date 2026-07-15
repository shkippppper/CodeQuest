## The problem: combining two result sets

A join glues tables *side by side*, adding columns. Sometimes you want the opposite — stack two query results *on top of each other*, or compare which rows they share. You have current customers and archived customers in separate tables and want one combined list of names:

```output
customers            archived_customers
name                 name
------               ------
Ada                  Carlo
Beka                 Ada
```

That's not a join. It's a **set operation** — treating each query's rows as a set and combining the sets. The three are `UNION`, `INTERSECT`, and `EXCEPT`.

## UNION: stack and de-duplicate

`UNION` takes two `SELECT`s and returns all their rows together, **removing duplicates**:

```sql
SELECT name FROM customers
UNION
SELECT name FROM archived_customers;
```

```output
name
------
Ada
Beka
Carlo
```

Ada was in both lists but appears **once** — `UNION` behaves like a mathematical set: no repeats. The two queries stack vertically, so they must line up: **same number of columns, compatible types, in the same order.** The result takes its column names from the first query.

## UNION ALL: keep every row

De-duplicating costs work — the database must compare rows to find repeats. When you *know* there are no duplicates, or you *want* to keep them, `UNION ALL` skips that step and returns everything:

```sql
SELECT name FROM customers
UNION ALL
SELECT name FROM archived_customers;   -- Ada appears twice
```

`UNION ALL` is a straight concatenation — and it's **faster** because it never sorts or compares to remove duplicates. Reach for it by default and only use plain `UNION` when you actually need de-duplication.

## Predict: how many rows?

`customers` has Ada, Beka. `archived_customers` has Carlo, Ada.

```sql
SELECT name FROM customers UNION SELECT name FROM archived_customers;
```

How many rows? Answer: **3** — Ada, Beka, Carlo. Ada is in both but `UNION` collapses the duplicate. With `UNION ALL` you'd get **4** (Ada twice).

## INTERSECT: rows in both

`INTERSECT` returns only rows that appear in **both** result sets — the overlap:

```sql
SELECT name FROM customers
INTERSECT
SELECT name FROM archived_customers;   -- just: Ada
```

Only Ada is in both lists, so only Ada comes back. This answers "who is in both groups?" — users who are both buyers and reviewers, products both in-stock and on-sale.

## EXCEPT: rows in the first but not the second

`EXCEPT` (called `MINUS` in Oracle) returns rows from the first query that are **not** in the second — a subtraction:

```sql
SELECT name FROM customers
EXCEPT
SELECT name FROM archived_customers;   -- just: Beka
```

Beka is a current customer who isn't archived. Order matters: `A EXCEPT B` is not `B EXCEPT A`. It answers "what's in the first set only?" — active users who never churned, products never ordered.

## Set operations vs joins

Keep the two straight: a **join** combines tables *horizontally* (matching rows, adding columns). A **set operation** combines query results *vertically* (stacking rows, same columns). Some questions can be phrased either way — `INTERSECT` often rewrites as an inner join, `EXCEPT` as an anti-join — but the set operators read more directly when you're genuinely comparing two same-shaped lists.

## Common pitfalls

- **Mismatched columns.** Both queries must select the same number of columns with compatible types in the same order, or the operation errors.
- **Using `UNION` when `UNION ALL` would do.** Plain `UNION` pays to sort and de-duplicate every time. If duplicates are impossible or wanted, `UNION ALL` is faster.
- **Assuming `EXCEPT` is symmetric.** `A EXCEPT B` ≠ `B EXCEPT A`. It's a directional subtraction — the first query's leftovers.

## Interview lens

If asked to merge two result sets, distinguish `UNION` (de-duplicates) from `UNION ALL` (keeps everything, faster) and say you default to `UNION ALL` unless you specifically need duplicates removed — that performance awareness is the point being tested.

For "who's in both lists" or "who's in list A but not B," reach for `INTERSECT` and `EXCEPT`, and note that they can often be rewritten as an inner join and an anti-join respectively. Being able to move between the set-operator phrasing and the join phrasing shows you understand what each is really computing.
