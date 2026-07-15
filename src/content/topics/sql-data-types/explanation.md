## The problem: a column must know what it holds

When you create a table, each column is declared with a **type** — the kind of value it may store:

```sql
CREATE TABLE products (
    id     INTEGER,
    name   TEXT,
    price  DECIMAL(10, 2)
);
```

The type is a promise and a guard. `price` will only ever hold a number; try to put text there and the database rejects it. Types also decide how values sort, how much space they take, and how math behaves. Picking the right one is the difference between correct data and quiet corruption.

## Whole numbers

For counts and ids, use an integer type:

```sql
quantity INTEGER      -- typical 32-bit whole number
views    BIGINT       -- larger range for big counts
```

`INTEGER` covers roughly ±2 billion. When a value might exceed that — total page views across a site, say — reach for `BIGINT`. Whole numbers only; no fractional part.

## Fractional numbers: exact vs approximate

Here's where people get burned. There are two ways to store numbers with a decimal point, and they behave very differently:

```sql
price  DECIMAL(10, 2)   -- EXACT: up to 10 digits, 2 after the point
ratio  FLOAT            -- APPROXIMATE: fast, but rounded in binary
```

`DECIMAL` (also spelled `NUMERIC`) stores the number *exactly*, digit for digit. `FLOAT` (and `REAL`, `DOUBLE`) store an *approximation* — fast for scientific math, but the stored value can be a hair off.

## Predict: money in a float

What does this print in most databases?

```sql
SELECT 0.1 + 0.2;
```

Answer: `0.30000000000000004`, not `0.3` — *if* those are floats. Binary floating point can't represent 0.1 exactly, so tiny errors creep in. For money, those errors become wrong totals and failed reconciliations. **Store money in `DECIMAL`, never `FLOAT`.** Use float only when small rounding is acceptable, like sensor readings.

## Text: fixed vs variable length

```sql
code  CHAR(3)        -- always exactly 3 characters, padded if shorter
name  VARCHAR(100)   -- up to 100 characters, stores only what you use
bio   TEXT           -- arbitrary length
```

`CHAR(n)` is fixed width and pads short values with spaces — good only for genuinely fixed codes like country codes. `VARCHAR(n)` holds up to `n` characters and stores just what's there. `TEXT` is unbounded. In everyday use, `VARCHAR` or `TEXT` is almost always what you want.

## Dates, times, and booleans

```sql
born      DATE        -- 2026-07-15
alarm     TIME        -- 09:30:00
created   TIMESTAMP   -- date + time together
active    BOOLEAN     -- true / false
```

`TIMESTAMP` is the workhorse for "when did this happen." Prefer a real date/time type over storing dates as text — it sorts correctly and supports date math. A `TIMESTAMP WITH TIME ZONE` variant exists when zone matters.

## How dialects differ

SQL is a standard, but every database bends it. The three you'll meet:

- **PostgreSQL** — strict and rich. Enforces types firmly and adds powerful ones: `JSONB`, arrays, `UUID`, precise `NUMERIC`.
- **SQLite** — loose. It uses **type affinity**: a column has a *preferred* type but will happily store other kinds of values in any row. Convenient, surprising if you expect strictness. (This is the database inside every iPhone, under Core Data and SwiftData.)
- **MySQL** — mostly strict, with its own spellings (e.g. `TINYINT(1)` often standing in for boolean).

The lesson: types are portable in spirit, not in exact name or strictness. Check your database's docs for the precise set.

## Common pitfalls

- **Money in `FLOAT`.** Rounding errors corrupt totals. Use `DECIMAL`/`NUMERIC`.
- **Dates stored as `TEXT`.** They sort like strings ("10" before "9") and lose date math. Use a real date type.
- **Assuming SQLite enforces your types.** Its type affinity lets a "number" column hold text. Validate in your app if strictness matters.

## Interview lens

The classic trap is money. If asked what type a currency amount should use, say `DECIMAL`/`NUMERIC` for *exact* arithmetic, and explain that `FLOAT` introduces binary rounding errors that are unacceptable for money. That single answer signals real experience.

If dialects come up, mention that PostgreSQL is strict with rich types while SQLite uses loose type affinity — and that Core Data/SwiftData sit on SQLite, so an iOS store won't enforce types the way a server-side Postgres would. Connecting the type system to the platform reads as senior.
