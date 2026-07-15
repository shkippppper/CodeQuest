## The problem: "SQL" is really five jobs

These four statements are all "SQL," yet they do wildly different things:

```sql
CREATE TABLE users (id INT, name TEXT);   -- builds a table
INSERT INTO users VALUES (1, 'Ada');      -- adds a row
SELECT name FROM users;                    -- reads rows
GRANT SELECT ON users TO analyst;          -- hands out a permission
```

One shapes the *container*, one *changes* data, one *reads* data, one manages *who's allowed*. Lumping them under a single word hides how differently they behave — especially around what can be undone. SQL sorts its commands into five families by job. Learn the families and you can predict what a statement touches before running it.

## DDL — define the structure

**DDL** stands for Data Definition Language: commands that define the *shape* of your data.

```sql
CREATE TABLE users (id INT, name TEXT);   -- make a table
ALTER TABLE users ADD email TEXT;          -- change its columns
DROP TABLE users;                          -- remove it entirely
```

`CREATE`, `ALTER`, `DROP`. These work on tables and other structures, not on the rows inside them. One thing that catches people out: in many databases DDL **auto-commits** — the change is permanent the instant it runs and can't be rolled back. Treat `DROP TABLE` with respect.

## DML — change the data

**DML** is Data Manipulation Language: commands that add, change, or remove *rows*.

```sql
INSERT INTO users VALUES (1, 'Ada');       -- add a row
UPDATE users SET name = 'Beka' WHERE id = 1;  -- change rows
DELETE FROM users WHERE id = 1;            -- remove rows
```

`INSERT`, `UPDATE`, `DELETE`. Unlike DDL, these leave the table's structure alone and only touch its contents — and, importantly, they *can* usually be rolled back before you commit.

## DQL — read the data

**DQL**, Data Query Language, is the family with a single member: `SELECT`. It *reads* rows and changes nothing.

```sql
SELECT name FROM users WHERE id = 1;
```

Many people fold `SELECT` into DML and only talk about four families. Either way, the useful fact is that `SELECT` is read-only — it can never alter your data.

## TCL — control transactions

**TCL**, Transaction Control Language, groups several DML statements into one all-or-nothing unit called a **transaction** — either every change lands, or none do.

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- make both permanent; ROLLBACK would undo both
```

`COMMIT` makes the changes permanent; `ROLLBACK` discards them. Transactions have their own lesson later — here just know this family exists and that it's what makes DML undoable until you commit.

## DCL — control access

**DCL**, Data Control Language, manages *permissions*: who may do what.

```sql
GRANT SELECT ON users TO analyst;   -- allow reading
REVOKE SELECT ON users FROM analyst;  -- take it back
```

`GRANT` and `REVOKE`. You'll meet these less often as an app developer, but they round out the picture.

## The whole map at a glance

| Family | Commands | Job |
|---|---|---|
| DDL | CREATE, ALTER, DROP | Define structure |
| DML | INSERT, UPDATE, DELETE | Change rows |
| DQL | SELECT | Read rows |
| TCL | COMMIT, ROLLBACK | Group changes into transactions |
| DCL | GRANT, REVOKE | Control permissions |

## Predict: which family?

Where does `ALTER TABLE orders ADD shipped BOOLEAN;` belong?

Answer: **DDL**. It changes the table's *structure* (adds a column), not its rows — even though the word "orders" tempts you toward the data families. Structure changes are always DDL.

## Common pitfalls

- **Assuming every statement can be rolled back.** DML inside a transaction can; DDL often auto-commits and can't. `DROP` and `TRUNCATE` are usually immediate.
- **Confusing ALTER (structure, DDL) with UPDATE (rows, DML).** `ALTER` changes columns; `UPDATE` changes values.
- **Thinking SELECT can change data.** It's read-only — a `SELECT` never modifies a row.

## Interview lens

If asked to "categorize SQL commands," name the families and give one command each: DDL (`CREATE`/`ALTER`/`DROP`), DML (`INSERT`/`UPDATE`/`DELETE`), DQL (`SELECT`), TCL (`COMMIT`/`ROLLBACK`), DCL (`GRANT`/`REVOKE`). You don't need all five verbatim, but showing the *structure* is the point.

The follow-up that separates candidates: "can you undo a `DROP TABLE`?" Say that DDL commonly auto-commits, so no — whereas DML changes can be rolled back until you commit. Connecting the family to its rollback behavior shows you understand *why* the grouping matters, not just the acronyms.
