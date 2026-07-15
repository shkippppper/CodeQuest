import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ex-purpose",
    type: "mcq",
    prompt: "What does EXPLAIN show you?",
    options: [
      "The query plan — the step-by-step strategy the database chose to run the query",
      "A written English description of what the query is intended to accomplish, generated from the SQL text itself",
      "The rows the query returns, but formatted as a tree so that related rows are visually grouped together neatly",
      "A list of every index that exists on the tables involved, whether or not the query actually makes use of them",
    ],
    answer: 0,
    explanation:
      "`EXPLAIN` reports the plan — how the database intends to execute the query (scans, joins, sorts) — instead of running it for results.",
  },
  {
    id: "ex-seq-vs-index",
    type: "mcq",
    prompt: "What's the difference between a Seq Scan and an Index Scan in a plan?",
    options: [
      "Seq Scan reads every row and tests the condition; Index Scan uses an index to jump to matching rows",
      "Seq Scan reads rows in sequence and Index Scan reads them in reverse, but both examine every row of the table",
      "Seq Scan is used only for writes while Index Scan is used only for reads, so a SELECT can never do a Seq Scan",
      "Index Scan builds a brand-new index on the fly for the query, whereas Seq Scan reuses an index built earlier",
    ],
    answer: 0,
    explanation:
      "A Seq Scan reads the whole table; an Index Scan seeks via an index. Seeing a Seq Scan where you expected an index is the classic slow-query tell.",
  },
  {
    id: "ex-analyze-fill",
    type: "fill",
    prompt: "To actually run the query and report real timings and row counts (not just estimates), use EXPLAIN ___.",
    answers: ["ANALYZE", "analyze"],
    hint: "It measures rather than estimates.",
    explanation:
      "`EXPLAIN ANALYZE` executes the query and adds actual time and actual rows next to the estimates.",
  },
  {
    id: "ex-cost",
    type: "mcq",
    prompt: "What does the `cost` number in an EXPLAIN plan represent?",
    options: [
      "An abstract estimate of work the optimizer uses to compare plans — not a measurement in milliseconds",
      "The exact number of milliseconds the query will take to run, measured precisely during the last execution",
      "The amount of disk space in megabytes that the query's result set will occupy once it has been returned",
      "The dollar cost of running the query, calculated from the cloud provider's per-query billing rate at that time",
    ],
    answer: 0,
    explanation:
      "`cost` is an abstract optimizer unit for comparing candidate plans (lower = cheaper), not a time. For real timing, use `EXPLAIN ANALYZE`.",
  },
  {
    id: "ex-diagnose-predict",
    type: "predict",
    prompt: "🧠 EXPLAIN on a WHERE email = ... query over 10M rows shows `Seq Scan on users`. What's wrong, and the fix?",
    code: `EXPLAIN SELECT * FROM users\nWHERE email = 'ada@example.com';`,
    options: [
      "No usable index on email, so it scans all rows — create an index on email",
      "The email column contains a NULL somewhere, which forces the planner to abandon the index and scan instead",
      "Nothing is wrong; a Seq Scan is always the fastest possible way for a database to answer an equality lookup",
      "The table is too small to index, so the fix is to insert more rows until the planner decides to build an index",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A `Seq Scan` for a selective equality on a huge table means no usable index. Creating one on `email` should switch the plan to an `Index Scan`.",
  },
  {
    id: "ex-est-vs-actual-senior",
    type: "mcq",
    prompt: "🧠 In EXPLAIN ANALYZE, the optimizer estimated 1 row but 500,000 actually came back. What does that suggest?",
    options: [
      "Stale statistics led to a bad estimate, so the planner likely chose a poor plan — refresh statistics",
      "The query is malformed, because an accurate database should always estimate the exact row count in advance",
      "The index is corrupted and must be dropped and rebuilt before the query can be trusted to return correct data",
      "Nothing meaningful, since the estimated and actual row counts are unrelated and are never expected to match up",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A large estimated-vs-actual gap means the optimizer's statistics are stale, so it likely picked a suboptimal plan. Refreshing statistics (e.g. `ANALYZE`) often fixes it.",
  },
  {
    id: "ex-multi",
    type: "multi",
    prompt: "Select **all** true statements about EXPLAIN.",
    options: [
      "EXPLAIN shows the plan without returning result rows",
      "EXPLAIN ANALYZE actually runs the query",
      "A Seq Scan on a large, selectively-filtered table is a warning sign",
      "The cost value is measured in milliseconds",
    ],
    answers: [0, 1, 2],
    explanation:
      "`EXPLAIN` plans without running, `EXPLAIN ANALYZE` runs it, and a Seq Scan on a big selective query is a red flag. `cost` is an abstract unit, not milliseconds — option 4 is false.",
  },
  {
    id: "ex-flashcard",
    type: "flashcard",
    prompt:
      "Explain EXPLAIN: what it shows, Seq vs Index Scan, cost/rows, and EXPLAIN ANALYZE. Answer aloud, then reveal.",
    modelAnswer:
      "**`EXPLAIN`** shows the **query plan** — the database's chosen strategy (scans, join methods, sorts) — instead of running the query. Key access methods: a **Seq Scan** reads **every row** and tests the condition (fine for small tables or when most rows match; a **red flag** on a big table filtered to few rows), while an **Index Scan** uses an index to **seek** to matches. The plan is a **tree** of nodes read from most-indented outward; each carries **estimates**: **`cost`** (an abstract optimizer unit for comparing plans — *not* milliseconds), **`rows`** (expected output), **`width`** (row size). **`EXPLAIN ANALYZE`** actually **runs** the query and adds **actual** time and rows — the gold is comparing **estimated vs actual rows**: a big gap means **stale statistics** and likely a bad plan (fix with `ANALYZE`/refresh stats). Diagnosis flow: run `EXPLAIN`, look for a `Seq Scan` where an `Index Scan` is expected, then add the missing index or refresh statistics. (Avoid `EXPLAIN ANALYZE` on writes unless in a transaction you roll back.)",
    keyPoints: [
      "EXPLAIN = the plan (how it runs), not the rows",
      "Seq Scan = read all rows; Index Scan = seek via index",
      "cost = abstract optimizer estimate (not ms); rows = expected count",
      "EXPLAIN ANALYZE runs it → actual time/rows",
      "Big estimated-vs-actual rows gap = stale stats → bad plan",
    ],
    explanation:
      "A strong answer explains the plan, Seq-vs-Index scan, that cost is abstract, and that EXPLAIN ANALYZE's estimated-vs-actual gap reveals stale statistics.",
  },
];

export default quiz;
