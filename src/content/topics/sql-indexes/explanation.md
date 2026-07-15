## The problem: finding a needle by reading the whole haystack

You look up a user by email:

```sql
SELECT * FROM users WHERE email = 'ada@example.com';
```

With no help, the database has only one option: read **every row**, checking each email until it finds a match. On a table of 10 million users that's 10 million comparisons for one lookup. This is a **full table scan** — and it's why an unindexed query on a big table crawls.

The fix is the same one a book uses so you don't read every page to find a topic: an **index**.

## An index is a sorted lookup structure

Think of the index at the back of a book: terms in alphabetical order, each with a page number. To find a term you don't read the book — you jump into the sorted list, narrow down fast, and get the page.

A database **index** on a column keeps that column's values in **sorted order**, each paired with a pointer to its row. To find `'ada@example.com'`, the database searches the sorted structure — not the table — then follows the pointer straight to the row.

```sql
CREATE INDEX idx_users_email ON users (email);
```

After this, the email lookup jumps to the answer instead of scanning. On 10 million rows the difference is milliseconds versus seconds.

## The B-tree: why lookups stay fast

Most indexes are a **B-tree** — a balanced tree structure that stays shallow even when huge. "Balanced" means every leaf is about the same depth, so every lookup takes roughly the same, small number of steps.

The key property: a B-tree search is **logarithmic**. Doubling the table adds only *one* more step, not double the work. That's why an indexed lookup on a billion rows still finishes in a handful of hops — the same idea as binary search, which has its own lesson.

Because a B-tree keeps values in order, one index helps several query shapes:

- **Equality** — `WHERE email = '...'` jumps to the value.
- **Ranges** — `WHERE age BETWEEN 25 AND 35` finds the start, then walks in order.
- **Sorting** — `ORDER BY age` can read the index in order, skipping a sort.
- **Joins** — matching `orders.customer_id` to `customers.id` uses the index on the key.

## Primary keys come pre-indexed

You already have indexes without asking: a **primary key** is automatically indexed (it must be unique, and the index enforces that efficiently). A `UNIQUE` constraint likewise creates an index. So joining on primary keys is fast by default — the index is already there.

## Predict: scan or seek?

`users` has 10 million rows and an index on `email`. How many rows does the database examine to run `WHERE email = 'ada@example.com'`?

Answer: a **handful** — the B-tree depth, maybe 3 or 4 hops, not 10 million. The index turns "check every row" into "navigate a sorted tree to the exact value," which is the entire point of indexing.

## Indexing foreign keys

A subtle but high-impact habit: **index your foreign keys.** They're not auto-indexed (only primary keys and `UNIQUE` are). A join filters the child table by its foreign key constantly — `WHERE customer_id = ...` under the hood — so an index there is often the single biggest win for join performance. Many "why is this join slow?" mysteries are a missing foreign-key index.

## Common pitfalls

- **Assuming every column is fast to filter.** Only indexed columns get the fast path; an unindexed `WHERE` still scans the whole table.
- **Forgetting to index foreign keys.** Primary keys are indexed automatically, foreign keys are not — and they're exactly what joins filter on.
- **Expecting an index to help a non-searchable condition.** Wrapping the column in a function (`WHERE LOWER(email) = ...`) or a leading wildcard (`LIKE '%son'`) usually bypasses the index — a topic in its own right.

## Interview lens

If asked "how do you speed up a slow query?", the first reflex is an **index** on the filtered/joined column — explain that it replaces a **full table scan** with a targeted lookup through a sorted **B-tree**, whose logarithmic search stays fast even on huge tables. Naming the B-tree and "logarithmic" shows you know *why* it's fast, not just that it is.

The practical detail that impresses: **primary keys are indexed automatically but foreign keys are not**, so indexing foreign keys is often the biggest join-performance win. Mentioning that one index also serves equality, range, sort, and join lookups (because it's ordered) rounds out a confident answer — and sets up the trade-offs lesson on why you *don't* just index everything.
