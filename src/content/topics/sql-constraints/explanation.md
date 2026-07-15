## The problem: keeping bad data out

Your app validates input — but bugs slip through, and the same table is often written by scripts, admins, and other services that don't share your app's checks. If "correctness" lives only in application code, corrupt rows eventually appear: a negative price, a missing name, two users with the same email.

**Constraints** are rules you attach to the table itself, and the database *enforces* them on every write, from every source. A row that breaks a constraint is rejected. Correctness becomes the database's job, not just the app's.

## NOT NULL: this column must have a value

The simplest constraint forbids missing values:

```sql
CREATE TABLE users (
    id    INTEGER PRIMARY KEY,
    name  TEXT NOT NULL,
    email TEXT
);
```

`name TEXT NOT NULL` means an insert without a name is rejected. `email` has no such rule, so it may be left NULL. Use `NOT NULL` for anything genuinely required.

## DEFAULT: a value when none is given

`DEFAULT` supplies a value for a column the insert didn't mention:

```sql
status TEXT DEFAULT 'active',
created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

Insert a user without a `status` and they come out `'active'`; without a `created`, they get the current time. `DEFAULT` and `NOT NULL` pair well — a required column with a sensible default is never missing.

## UNIQUE: no duplicates

A `UNIQUE` constraint forbids two rows from sharing a value:

```sql
email TEXT UNIQUE
```

Try to insert a second user with an existing email and the database rejects it. Unlike a primary key, a `UNIQUE` column *may* be NULL (and, in most databases, several NULLs are allowed, since NULLs aren't "equal"). A table can have many `UNIQUE` constraints but only one primary key.

## CHECK: a custom rule

`CHECK` enforces any boolean condition on a row's values:

```sql
price DECIMAL CHECK (price >= 0),
age   INTEGER CHECK (age >= 18)
```

An insert with `price = -5` fails the check and is rejected. `CHECK` is how you encode business rules — non-negative amounts, valid status values (`CHECK (status IN ('active','banned'))`), sensible date ranges — directly in the schema.

## PRIMARY KEY and FOREIGN KEY

Two you've met already are constraints too:

- **`PRIMARY KEY`** — unique *and* not NULL, identifying each row. It's effectively `UNIQUE` + `NOT NULL` with the special "row identity" role.
- **`FOREIGN KEY`** — the value must match a primary-key value in another table, giving referential integrity.

```sql
customer_id INTEGER REFERENCES customers(id)
```

## Predict: which insert fails?

Given `price DECIMAL CHECK (price >= 0)` and `name TEXT NOT NULL`:

```sql
INSERT INTO products (name, price) VALUES ('Widget', -3);
```

Answer: it's **rejected**. `name` is fine ('Widget'), but `price = -3` violates `CHECK (price >= 0)`. The database refuses the whole row — a constraint failure blocks the entire insert, it doesn't save a "partly valid" version.

## Table-level constraints

Some rules span *multiple* columns and are written after the columns:

```sql
CREATE TABLE enrolments (
    student_id INTEGER,
    class_id   INTEGER,
    PRIMARY KEY (student_id, class_id),         -- composite key
    UNIQUE (student_id, class_id)
);
```

A composite primary key or a multi-column `UNIQUE` must be declared at the table level because it involves more than one column.

## Common pitfalls

- **Relying on app validation alone.** Other writers (scripts, admin tools) bypass your app. Constraints enforce the rule for *every* path into the table.
- **Confusing `UNIQUE` with `PRIMARY KEY`.** `UNIQUE` allows NULLs and you can have several; a primary key is one per table and never NULL.
- **Forgetting a rejected row aborts the whole insert.** A constraint violation blocks the entire statement — there's no partial write.

## Interview lens

If asked how you'd guarantee data correctness, say you push the invariants into the schema as **constraints** — `NOT NULL`, `UNIQUE`, `CHECK`, `PRIMARY KEY`, `FOREIGN KEY` — so the database enforces them on every write, not just through the app. That "correctness belongs in the database" instinct is what's being probed.

A common compare-and-contrast is `UNIQUE` vs `PRIMARY KEY`: both prevent duplicates, but a primary key is also `NOT NULL` and there's exactly one per table, whereas you can have many `UNIQUE` constraints and they permit NULLs. Adding that `CHECK` is where business rules live rounds out a strong answer.
