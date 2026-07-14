import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sqlite-when-raw-sql",
    type: "mcq",
    prompt: "When does raw SQL (or a lightweight wrapper like GRDB) tend to beat an ORM like Core Data or SwiftData?",
    options: [
      "For simple single-entity CRUD screens where the ORM's automatic row mapping removes the need for any hand-written SQL",
      "For aggregates, multi-table joins, full-text search, or hot paths where query performance matters most",
      "Only when the app has no persistent database at all and needs to query a transient in-memory SQLite instance",
      "Never — ORMs are always faster because they cache the query plan and avoid repeated SQLite compilation overhead",
    ],
    answer: 1,
    explanation:
      "An ORM shines for everyday CRUD. Once the hard part is the query itself — grouping, joins, ranked search, or a performance-critical hot path — writing SQL directly (or through GRDB) is usually faster and clearer.",
  },
  {
    id: "sqlite-orm-fill",
    type: "fill",
    prompt: "A layer that automatically turns database rows into Swift objects and back, like Core Data or SwiftData, is called an ___.",
    answers: ["orm", "object-relational mapper"],
    hint: "Three-letter acronym; the O stands for 'object'.",
    explanation:
      "An **ORM** (object-relational mapper) maps rows to objects automatically. GRDB gives you some of that convenience while still exposing raw SQL when you need it.",
  },
  {
    id: "sqlite-dbqueue-predict",
    type: "predict",
    prompt: "What SQL does this query builder chain actually execute?",
    code: `try Book.filter(Column("year") >= 2020)\n    .order(Column("title"))\n    .fetchAll(db)`,
    options: [
      "SELECT * FROM book WHERE year >= 2020 ORDER BY title",
      "SELECT * FROM book ORDER BY year",
      "UPDATE book SET year = 2020",
      "It doesn't produce SQL — it queries in-memory Swift objects",
    ],
    answer: 0,
    explanation:
      "GRDB's query builder is a type-safe way to assemble a SQL string. `.filter` becomes the WHERE clause and `.order` becomes ORDER BY, producing `SELECT * FROM book WHERE year >= 2020 ORDER BY title`.",
  },
  {
    id: "sqlite-dbqueue-vs-pool",
    type: "mcq",
    prompt: "What's the difference between GRDB's DatabaseQueue and DatabasePool?",
    options: [
      "DatabaseQueue serializes every read and write on one queue; DatabasePool allows concurrent reads via SQLite's write-ahead log while writes still serialize",
      "They are completely interchangeable — GRDB automatically selects between them internally based on your access pattern and workload characteristics",
      "DatabasePool is strictly single-threaded and processes all operations sequentially, while DatabaseQueue dispatches reads and writes across a pool of background threads",
      "DatabaseQueue is designed exclusively for read-only queries while DatabasePool handles only write transactions, so apps must configure and use both together",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "SQLite doesn't support multiple simultaneous writers. `DatabaseQueue` funnels everything through one serial queue. `DatabasePool` lets multiple threads read concurrently against a consistent snapshot via write-ahead logging, but writes still funnel through a single writer.",
  },
  {
    id: "sqlite-migration-multi",
    type: "multi",
    prompt: "Select all true statements about GRDB's DatabaseMigrator.",
    options: [
      "Each registered migration runs exactly once, tracked internally",
      "Migrations run in the order they were registered",
      "Calling migrate(_:) on an already-migrated database re-runs every migration",
      "It's safe to call migrate(_:) on every app launch",
    ],
    answers: [0, 1, 3],
    explanation:
      "Migrations are ordered and idempotent — each one runs once and is recorded, so calling `migrate(_:)` on every launch is safe and only runs migrations a given device hasn't seen yet (option 2 is false).",
  },
  {
    id: "sqlite-observation-fill",
    type: "fill",
    prompt: "GRDB's ___ re-runs a query automatically and delivers a fresh result whenever the tracked table's data changes.",
    answers: ["valueobservation", "value observation"],
    hint: "Starts with 'Value'.",
    explanation:
      "`ValueObservation` tracks which tables a query touched and re-runs it whenever a write affects them, delivering results through `onChange`.",
  },
  {
    id: "sqlite-n-plus-one",
    type: "mcq",
    prompt: "What is the 'N+1 problem'?",
    options: [
      "Running one query to fetch N parent rows, then N more queries to fetch each one's related rows individually, instead of one joined query",
      "A schema migration bug that accidentally adds N+1 duplicate columns to a table rather than the N columns specified in the migration definition",
      "An off-by-one error in a for-loop index that reads one extra row past the last valid result when iterating over a database cursor",
      "A hard SQLite per-database file size limit that the device filesystem enforces when a table's total stored data exceeds N+1 gigabytes",
    ],
    answer: 0,
    explanation:
      "Fetching a list and then looping to fetch each row's related data separately costs 1 + N round trips. A single query with a JOIN fetches everything at once.",
  },
  {
    id: "sqlite-batching-senior",
    type: "predict",
    prompt: "Which of these two patterns is dramatically slower for inserting 1,000 books, and why?",
    code: `// A\nfor book in books {\n    try dbQueue.write { db in try book.insert(db) }\n}\n\n// B\ntry dbQueue.write { db in\n    for book in books { try book.insert(db) }\n}`,
    options: [
      "A — each call to write() opens its own transaction with its own disk sync, 1,000 times over",
      "B — batching all inserts into a single write closure always adds overhead because GRDB must lock the queue for the entire duration",
      "They perform identically, because GRDB internally coalesces consecutive write() calls into one transaction automatically",
      "A is faster because releasing the queue between inserts allows other readers to interleave, improving overall throughput",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Pattern A wraps every single insert in its own transaction, paying a disk-sync cost 1,000 times. Pattern B does all 1,000 inserts inside one transaction, syncing once — often orders of magnitude faster.",
  },
  {
    id: "sqlite-flashcard",
    type: "flashcard",
    prompt: "Explain when you'd reach for SQLite/GRDB over an ORM, and the concrete performance levers you'd use once you're there. Answer aloud, then reveal.",
    modelAnswer:
      "Reach for raw **SQL** (or a wrapper like **GRDB**) when the query is the hard part: aggregates, multi-table joins, full-text search ranked by relevance, or a performance-critical hot path — an **ORM** like Core Data/SwiftData is great for everyday single-entity CRUD but pulls rows into memory to do that work in Swift instead of letting the database engine do it. GRDB adds type-safe query building and `Codable` records over SQLite, plus `ValueObservation` for reactive updates and a `DatabaseMigrator` for versioned, ordered, idempotent schema changes. For concurrency, `DatabaseQueue` serializes everything on one queue while `DatabasePool` allows concurrent reads via write-ahead logging with writes still serialized — SQLite itself doesn't support concurrent writers. For performance: add an **index** on columns you filter or sort by often to avoid full table scans, and batch multiple writes into a single transaction instead of one transaction per row, since each transaction costs a disk sync.",
    keyPoints: [
      "SQL/GRDB wins for aggregates, joins, full-text search, hot paths — ORM wins for simple CRUD",
      "GRDB: type-safe records + query builder, raw SQL fallback with safe placeholders",
      "ValueObservation for reactive re-fetching; DatabaseMigrator for ordered, one-time migrations",
      "DatabaseQueue serializes all access; DatabasePool allows concurrent reads, serial writes",
      "Performance: indexes for reads, batched transactions for writes, avoid N+1",
    ],
    explanation:
      "A senior answer leads with the concrete trade-off (query complexity, not 'ORMs are slow'), then names the specific performance levers rather than a vague 'optimize it'.",
  },
];

export default quiz;
