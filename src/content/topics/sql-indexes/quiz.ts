import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ix-purpose",
    type: "mcq",
    prompt: "What does an index do for a query?",
    options: [
      "Keeps a column's values sorted with pointers to rows, so a lookup can seek instead of scanning every row",
      "Stores a second full copy of the table so that if the original becomes corrupted the query can read the backup",
      "Caches the result of the most recent query so that running the identical query again returns instantly from memory",
      "Compresses the table on disk so that scanning through all of its rows takes less time than it otherwise would",
    ],
    answer: 0,
    explanation:
      "An index holds a column's values in sorted order with row pointers, turning a full scan into a targeted lookup.",
  },
  {
    id: "ix-scan",
    type: "mcq",
    prompt: "Without a useful index, how does the database find rows matching a WHERE condition?",
    options: [
      "It performs a full table scan, checking every row against the condition",
      "It refuses to run the query until an index is created on the column named in the WHERE clause of the statement",
      "It guesses which rows match based on the table's size and returns an approximate sample of the matching rows",
      "It reads only the first and last rows of the table, since a sorted table keeps all matches between those two",
    ],
    answer: 0,
    explanation:
      "With no index, the database must scan every row — a full table scan — which is slow on large tables.",
  },
  {
    id: "ix-btree-fill",
    type: "fill",
    prompt: "Most indexes use a balanced tree structure called a ___-tree, which keeps lookups fast even on huge tables.",
    answers: ["B", "b"],
    hint: "A single letter names it.",
    explanation:
      "A B-tree stays balanced and shallow, so lookups are logarithmic — fast even on billions of rows.",
  },
  {
    id: "ix-log-predict",
    type: "predict",
    prompt: "🧠 The users table has 10 million rows with an index on email. Roughly how many rows are examined for an exact email lookup?",
    code: `SELECT * FROM users WHERE email = 'ada@example.com';`,
    options: [
      "A handful — the B-tree depth, a few hops, not 10 million",
      "Exactly half of them on average, because the index lets the database perform a binary search across the whole table",
      "All 10 million, because the index only speeds up sorting and does not help an equality lookup in any way at all",
      "Around 10 thousand, since the index groups the rows into blocks and the whole matching block must be read fully",
    ],
    answer: 0,
    difficulty: "mid",
    explanation:
      "A B-tree lookup is logarithmic — a few hops to reach the value regardless of table size. That's the whole point of indexing.",
  },
  {
    id: "ix-pk-auto",
    type: "mcq",
    prompt: "Which columns are indexed automatically, without you creating an index?",
    options: [
      "Primary key and UNIQUE columns",
      "Every column in the table, since the database always builds one index per column when the table is first created",
      "Foreign key columns, because they are the columns most often used to join one table against another table",
      "No columns at all; every index in a database must always be created manually by the developer using CREATE INDEX",
    ],
    answer: 0,
    explanation:
      "A primary key (and any `UNIQUE` constraint) gets an index automatically. Other columns — including foreign keys — do not.",
  },
  {
    id: "ix-fk-senior",
    type: "mcq",
    prompt: "🧠 Why is indexing a foreign key often the biggest win for join performance?",
    options: [
      "Foreign keys aren't auto-indexed, yet joins constantly filter the child table by them",
      "A foreign key index automatically rewrites the join into a faster subquery behind the scenes for you",
      "Indexing a foreign key removes the need for the referenced parent table to have a primary key at all",
      "Foreign key indexes are the only kind of index that a database is able to use inside of a JOIN clause",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Primary keys are auto-indexed but foreign keys are not, and a join filters the child by its foreign key — so an index there is frequently the missing piece in a slow join.",
  },
  {
    id: "ix-multi",
    type: "multi",
    prompt: "Select **all** query shapes a B-tree index on a column can help.",
    options: [
      "Equality lookups (WHERE col = x)",
      "Range scans (WHERE col BETWEEN a AND b)",
      "Sorting by that column (ORDER BY col)",
      "Matching a leading-wildcard pattern (LIKE '%x')",
    ],
    answers: [0, 1, 2],
    explanation:
      "A sorted B-tree helps equality, ranges, and ordering. A leading wildcard (`'%x'`) can match anywhere in the string, defeating the index — so option 4 is false.",
  },
  {
    id: "ix-flashcard",
    type: "flashcard",
    prompt:
      "Explain what an index is, the B-tree, which columns it helps, and what's auto-indexed. Answer aloud, then reveal.",
    modelAnswer:
      "Without help, a filtered query does a **full table scan** — reading every row (slow on big tables). An **index** on a column stores that column's values in **sorted order** with **pointers to rows**, so the database can **seek** straight to a value instead of scanning (like a book's index vs reading every page). Most indexes are a **B-tree** — balanced and shallow, so lookups are **logarithmic**: doubling the table adds one more step, keeping lookups fast on billions of rows (same idea as binary search). Because it's ordered, **one index** helps **equality** (`= x`), **ranges** (`BETWEEN`), **sorting** (`ORDER BY`), and **joins** (matching keys). **Primary keys and UNIQUE columns are indexed automatically**, but **foreign keys are not** — and since joins filter the child by its foreign key, indexing foreign keys is often the biggest join win. Caveat: wrapping a column in a function or using a **leading wildcard** (`LIKE '%x'`) usually bypasses the index.",
    keyPoints: [
      "Index = sorted values + row pointers → seek instead of full scan",
      "B-tree = balanced, logarithmic lookups (fast on huge tables)",
      "One ordered index helps equality, ranges, ORDER BY, and joins",
      "Primary key / UNIQUE auto-indexed; foreign keys are NOT",
      "Index foreign keys for join speed; functions/leading wildcards defeat indexes",
    ],
    explanation:
      "A strong answer explains seek-vs-scan, the logarithmic B-tree, the query shapes one index serves, and that foreign keys need manual indexing.",
  },
];

export default quiz;
