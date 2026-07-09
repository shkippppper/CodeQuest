## The problem: some queries don't fit an object graph

```swift
let books = try context.fetch(NSFetchRequest<Book>(entityName: "Book"))
// ...then filter, group, and count in Swift
```

Core Data and SwiftData model your data as a graph of objects: fetch some, walk their properties, mutate them. That's a great fit for typical screens — a list of books, an edit form.

It falls apart once the question is about the *data itself* rather than one object. "How many books did each author publish after 2020, ranked by count?" With an object graph, you fetch a pile of `Book` objects and do the counting and sorting yourself, in Swift, after pulling every row into memory.

Compare that to asking the database directly:

```swift
let sql = """
SELECT author, COUNT(*) AS bookCount
FROM book
WHERE year >= 2020
GROUP BY author
ORDER BY bookCount DESC
LIMIT 10
"""
```

This is plain **SQL** — Structured Query Language, the language a relational database understands natively. One query does the filtering, grouping, counting, and sorting *inside* the database engine, and only the ten rows you actually need cross into your app.

The layer that normally stands between your code and SQL is an **ORM** — object-relational mapper — software that turns rows into objects and back automatically, the way Core Data and SwiftData do. An ORM is convenient for everyday CRUD (create/read/update/delete), but it works by translating your query into SQL for you, and some queries — multi-table joins, aggregates, full-text search ranked by relevance, a hot path that runs on every scroll — are faster and clearer written directly.

## GRDB overview

```swift
import GRDB

let dbQueue = try DatabaseQueue(path: "/path/to/db.sqlite")
```

**GRDB** is a Swift library that wraps SQLite — the embedded, file-based database engine that ships on every Apple platform — and adds type-safe query building, `Codable`-based records, and change observation, while still letting you drop to raw SQL whenever you want.

Every access to the database goes through a closure:

```swift
try dbQueue.write { db in
    try db.execute(sql: "CREATE TABLE book (id INTEGER PRIMARY KEY, title TEXT, year INTEGER)")
}
```

A `DatabaseQueue` funnels every read and write through a single serial queue, one at a time. SQLite itself isn't safe for two threads to write at once, so GRDB enforces the ordering for you instead of leaving it to chance.

For read-heavy apps, GRDB also offers a `DatabasePool`: it lets several threads read concurrently by using SQLite's write-ahead log, a mode where readers see a consistent snapshot while a write happens in the background, and only actual writes still funnel through one thread.

## Records & queries

A **record** is a Swift type that knows how to read and write itself as a database row:

```swift
struct Book: Codable, FetchableRecord, PersistableRecord {
    var id: Int64?
    var title: String
    var year: Int
}
```

`Codable` handles the column mapping, `FetchableRecord` lets GRDB build a `Book` from a row, and `PersistableRecord` lets a `Book` insert or update itself.

```swift
try dbQueue.write { db in
    var book = Book(id: nil, title: "Some Title", year: 2024)
    try book.insert(db)   // id is filled in after insert
}
```

Reading uses a query builder instead of hand-written SQL:

```swift
let recentBooks = try dbQueue.read { db in
    try Book.filter(Column("year") >= 2020)
        .order(Column("title"))
        .fetchAll(db)
}
```

Predict: what SQL does that chain actually run against the database?

Answer: `SELECT * FROM book WHERE year >= 2020 ORDER BY title`. The query builder is just a type-safe way to construct that string — every `.filter` and `.order` call appends a clause, and GRDB checks the column names and types at compile time instead of at query-execution time.

When the builder can't express what you need, fall back to SQL directly, still returning typed records:

```swift
let books = try dbQueue.read { db in
    try Book.fetchAll(db, sql: "SELECT * FROM book WHERE year >= ?", arguments: [2020])
}
```

The `?` placeholders are filled in safely by GRDB — never build a query by pasting a value into the SQL string, or you open the door to SQL injection.

## Observation

```swift
let observation = ValueObservation.tracking { db in
    try Book.fetchAll(db)
}
```

`ValueObservation` re-runs the closure you give it and hands you a fresh result every time a table it touched changes underneath it — no manual "did anything change?" bookkeeping.

```swift
let cancellable = observation.start(
    in: dbQueue,
    onError: { error in print(error) },
    onChange: { books in print("Books updated: \(books.count)") }
)
```

`onChange` fires once immediately with the current data, then again every time a write affects the tracked table — insert a book from anywhere in the app, and every screen observing `Book` updates itself. Cancel the subscription by releasing `cancellable`, the same pattern as a Combine subscription.

## Migrations

A **migration** is a versioned, ordered change to the database schema — the shape of its tables and columns.

```swift
var migrator = DatabaseMigrator()
migrator.registerMigration("createBook") { db in
    try db.create(table: "book") { t in
        t.autoIncrementedPrimaryKey("id")
        t.column("title", .text).notNull()
        t.column("year", .integer).notNull()
    }
}
```

Add a second migration later, once the app has shipped and real devices already have a `book` table:

```swift
migrator.registerMigration("addRatingColumn") { db in
    try db.alter(table: "book") { t in
        t.add(column: "rating", .double).defaults(to: 0)
    }
}
try migrator.migrate(dbQueue)
```

`migrate(_:)` runs every registered migration that hasn't run yet, in the order it was registered, and records which ones have completed in a hidden tracking table. Call it on every app launch — a device on version 1 runs both migrations, a device already on version 2 runs only the new one, and nothing ever re-runs twice.

## Performance

Two SQL-specific tools matter once a table has real data in it.

An **index** is a sorted lookup structure the database maintains on one or more columns, so it doesn't have to scan every row to find matches:

```swift
try db.create(index: "book_year_idx", on: "book", columns: ["year"])
```

Without that index, `WHERE year >= 2020` scans the whole table row by row. With it, SQLite jumps straight to the matching range. Add indexes for columns you filter or sort by often — but not for every column, since each index also slows down writes and takes disk space.

The second lever is batching. Writing rows one at a time inside separate `write` calls means a separate transaction, and separate disk sync, per row:

```swift
for book in manyBooks {
    try dbQueue.write { db in try book.insert(db) }   // one transaction PER book — slow
}
```

Wrap the whole loop in a single `write` instead, and it becomes one transaction:

```swift
try dbQueue.write { db in
    for book in manyBooks {
        try book.insert(db)   // still many inserts, ONE transaction
    }
}
```

The same idea applies to reads: fetching a list of authors and then looping to fetch each author's books separately is the **N+1 problem** — one query plus N more, one per row. A single query with a join fetches everything in one round trip.

## Common pitfalls

- **Opening a new `DatabaseQueue` per query.** Each one opens its own connection; create one queue for the database file and reuse it for the app's lifetime.
- **A write-per-row loop.** Each call to `dbQueue.write` is its own transaction with its own disk sync — batch many writes into one `write` block.
- **Missing indexes on filtered or sorted columns.** A query that's instant on 100 rows can take seconds on 100,000 without one.
- **Building SQL by string interpolation.** Always pass values through `?` placeholders and `arguments:`, never interpolate user input directly into the SQL string.

## Interview lens

If asked "when would you reach for SQLite over Core Data or SwiftData?", the strong answer is: when the query itself — not the object graph — is the hard part. Aggregates, multi-table joins, full-text search, or a hot path you need to keep fast and lean all favor raw SQL or a lightweight wrapper like GRDB, while everyday CRUD screens are usually simpler with an ORM.

If asked how GRDB keeps SQLite safe under concurrency, mention that `DatabaseQueue` serializes every access on one queue, while `DatabasePool` allows concurrent reads through SQLite's write-ahead log but still serializes writes — SQLite was never designed for multiple simultaneous writers.

On migrations, the interviewer is checking that you understand they're additive and ordered: each one runs exactly once, tracked by the library, so a fresh install and an app that's been upgraded five times both converge on the same schema. And if performance comes up, lead with the two concrete levers — indexes for read speed, batched transactions for write speed — rather than a vague "I'd optimize the queries."
