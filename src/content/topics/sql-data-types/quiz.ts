import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "dt-money",
    type: "mcq",
    prompt: "What type should store a currency amount like a product price, and why?",
    options: [
      "DECIMAL (NUMERIC), because it stores the value exactly with no rounding",
      "FLOAT, because it is the fastest numeric type and money calculations need to run as quickly as possible",
      "TEXT, because a price such as $9.99 already contains a dollar sign and a decimal point that must be kept",
      "INTEGER, because a price never has a fractional part once it is rounded to the nearest whole currency unit",
    ],
    answer: 0,
    explanation:
      "`DECIMAL`/`NUMERIC` stores exact digits, so totals stay correct. `FLOAT` approximates in binary and introduces rounding errors that are unacceptable for money.",
  },
  {
    id: "dt-float-predict",
    type: "predict",
    prompt: "Using floating-point numbers, what does this most likely return?",
    code: `SELECT 0.1 + 0.2;`,
    options: [
      "0.30000000000000004 — binary floating point can't represent 0.1 exactly",
      "0.3 exactly, because the database rounds every floating-point result to one decimal place automatically",
      "An error, because floating-point columns are not allowed to be added together inside a SELECT statement",
      "0, because adding two numbers below 1.0 always truncates the fractional part down to a whole integer",
    ],
    answer: 0,
    explanation:
      "Floats store approximations, so 0.1 + 0.2 lands slightly off 0.3. That's exactly why money should use exact `DECIMAL` instead.",
  },
  {
    id: "dt-varchar",
    type: "mcq",
    prompt: "What's the difference between CHAR(3) and VARCHAR(100)?",
    options: [
      "CHAR(3) is always exactly 3 characters (padded); VARCHAR(100) holds up to 100 and stores only what's used",
      "CHAR(3) can hold three separate values in one cell, while VARCHAR(100) is limited to a single value per cell",
      "CHAR(3) stores numbers and VARCHAR(100) stores text, so the number in the name is really the column's type code",
      "There is no real difference; the two names are interchangeable spellings for the very same variable-length text type",
    ],
    answer: 0,
    explanation:
      "`CHAR(n)` is fixed width and pads short values; `VARCHAR(n)` is variable up to `n`. Use `VARCHAR`/`TEXT` for ordinary strings.",
  },
  {
    id: "dt-timestamp-fill",
    type: "fill",
    prompt: "To record both the date and the time that a row was created, the standard column type to use is ___.",
    answers: ["TIMESTAMP", "timestamp"],
    hint: "Date + time in one type; the workhorse for 'when did this happen'.",
    explanation:
      "`TIMESTAMP` stores date and time together, sorts correctly, and supports date math — far better than storing it as text.",
  },
  {
    id: "dt-date-as-text",
    type: "mcq",
    prompt: "Why is storing dates in a TEXT column a bad idea?",
    options: [
      "They sort like strings and lose real date arithmetic",
      "Text columns have a hard maximum length of ten characters, which is too short to fit a full calendar date",
      "The database will automatically delete any text value that happens to look like a date after a short while",
      "Dates contain slashes and dashes, and those particular characters are forbidden inside every text column",
    ],
    answer: 0,
    explanation:
      "As text, dates sort alphabetically (so \"10\" comes before \"9\") and you can't do date math on them. A real date/time type fixes both.",
  },
  {
    id: "dt-sqlite-affinity",
    type: "mcq",
    prompt: "🧠 SQLite is described as using 'type affinity'. What does that mean in practice?",
    options: [
      "A column has a preferred type but can still store values of other kinds in individual rows",
      "SQLite refuses to create a column unless you specify its exact byte size and character encoding up front",
      "Every column in SQLite is forced to be text, and numbers are only reconstructed at query time on demand",
      "SQLite copies the column's type from whichever other database you last imported the table from earlier",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "SQLite's type affinity means a column has a *preferred* type but tolerates other value kinds per row — unlike strict PostgreSQL. Core Data/SwiftData sit on SQLite, so validate in-app if you need strictness.",
  },
  {
    id: "dt-int-range",
    type: "mcq",
    prompt: "A counter could exceed two billion. Which integer choice is safest?",
    options: [
      "BIGINT, which offers a much larger range than a standard INTEGER",
      "INTEGER, since a standard integer column automatically upgrades itself to a wider type once it runs out of room",
      "DECIMAL(2), because two digits of precision is exactly what is needed to hold a number in the billions range",
      "CHAR, storing the number as fixed-width text so that there is effectively no numeric upper limit to worry about",
    ],
    answer: 0,
    explanation:
      "`INTEGER` tops out around ±2 billion. For values beyond that, `BIGINT` gives the wider range. Integers do not auto-widen.",
  },
  {
    id: "dt-flashcard",
    type: "flashcard",
    prompt:
      "Walk through the main SQL data types, the exact-vs-approximate number distinction, and how dialects differ. Answer aloud, then reveal.",
    modelAnswer:
      "Each column declares a **type** that guards its values and controls sorting/space/math. **Whole numbers**: `INTEGER` (~±2B) and `BIGINT` (wider). **Fractional**: `DECIMAL`/`NUMERIC` store values **exactly** (use for **money**); `FLOAT`/`REAL`/`DOUBLE` store **approximations** in binary (so `0.1 + 0.2` ≠ `0.3`) — fine for scientific data, wrong for currency. **Text**: `CHAR(n)` fixed width/padded, `VARCHAR(n)` variable up to n, `TEXT` unbounded — usually `VARCHAR`/`TEXT`. **Date/time**: `DATE`, `TIME`, `TIMESTAMP` (prefer over text so sorting and date math work). **Boolean**: `BOOLEAN`. **Dialects differ**: PostgreSQL is strict with rich types (`JSONB`, arrays, `UUID`); SQLite is loose via **type affinity** (a column tolerates other value kinds — and it underlies Core Data/SwiftData on iOS); MySQL has its own spellings. Types are portable in spirit, not exact name.",
    keyPoints: [
      "INTEGER/BIGINT for whole numbers",
      "DECIMAL = exact (money); FLOAT = approximate (rounding errors)",
      "VARCHAR/TEXT for strings; real DATE/TIMESTAMP types for dates",
      "Postgres strict+rich; SQLite loose type affinity (backs Core Data/SwiftData)",
    ],
    explanation:
      "A strong answer nails money=DECIMAL, dates as real types, and the Postgres-strict vs SQLite-affinity dialect split.",
  },
];

export default quiz;
