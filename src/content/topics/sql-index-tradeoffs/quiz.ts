import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "it-write-cost",
    type: "mcq",
    prompt: "Why does adding more indexes to a table slow down writes?",
    options: [
      "Every INSERT, UPDATE, or DELETE must also update each index to keep it in sync",
      "Writes are queued behind reads, so the more indexes a table has the longer every write must wait its turn",
      "Each index locks the entire table for the duration of the write, so writes can no longer run concurrently at all",
      "Indexes force the database to write each row twice, once sorted and once unsorted, doubling every single write",
    ],
    answer: 0,
    explanation:
      "An index is a separate sorted structure that must stay in sync. Each write updates the row plus every index on the table.",
  },
  {
    id: "it-selectivity-fill",
    type: "fill",
    prompt: "How many distinct values a column has relative to its row count is its ___ — an index helps most when this is high.",
    answers: ["selectivity", "SELECTIVITY"],
    hint: "High for email, low for a boolean flag.",
    explanation:
      "Selectivity measures distinctness. High-selectivity columns (nearly unique) benefit from an index; low-selectivity ones (booleans) rarely do.",
  },
  {
    id: "it-low-selectivity-predict",
    type: "predict",
    prompt: "🧠 You index a boolean is_active column where 90% of rows are true. Does `WHERE is_active = true` use the index?",
    code: `SELECT * FROM users WHERE is_active = true;`,
    options: [
      "Probably not — matching 90% of rows via an index is slower than just scanning",
      "Yes, always, because any column that has an index on it will be searched through that index in every query",
      "Yes, and it will run instantly, because a boolean column is the ideal high-selectivity case for an index to help",
      "No, because a database is not able to create an index on a boolean column in the first place under any conditions",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Low selectivity: matching 90% of rows through an index (seek + pointer, millions of times) is slower than a scan, so the optimizer scans anyway.",
  },
  {
    id: "it-function-defeats",
    type: "mcq",
    prompt: "Why does `WHERE LOWER(email) = 'x'` fail to use a plain index on the email column?",
    options: [
      "The index stores the raw email values, not their lowercased form, so it can't match LOWER(email)",
      "The LOWER function is too slow to run, so the database skips the index in order to save processing time overall",
      "Indexes can never be used together with any function in a WHERE clause, regardless of which column is involved",
      "The email column must be dropped and recreated as text before any function may be applied to it in a query",
    ],
    answer: 0,
    explanation:
      "A plain index holds the original values. Wrapping the column in a function means the stored values don't match — index the expression (`LOWER(email)`) to fix it.",
  },
  {
    id: "it-composite-predict",
    type: "predict",
    prompt: "🧠 An index exists on (last_name, first_name). Which query CANNOT use it?",
    code: `-- index: (last_name, first_name)`,
    options: [
      "WHERE first_name = 'Ada'  (filters on first_name alone)",
      "WHERE last_name = 'Smith'  (filters on the leading column of the composite index by itself)",
      "WHERE last_name = 'Smith' AND first_name = 'Ada'  (filters on both of the indexed columns together)",
      "WHERE last_name = 'Smith' AND first_name = 'Beka'  (also filters on both columns at the same time)",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "By the leftmost-prefix rule, the index is sorted by last_name first. Filtering on first_name alone can't use it — like a phone book can't find everyone named 'Ada'.",
  },
  {
    id: "it-leading-wildcard",
    type: "mcq",
    prompt: "Why can `LIKE 'John%'` use an index while `LIKE '%son'` usually cannot?",
    options: [
      "'John%' has a fixed prefix the sorted index can seek to; '%son' could match anywhere in the string",
      "'John%' is shorter, and indexes only work on patterns below a certain maximum number of characters in length",
      "'%son' contains a special character that indexes reject, whereas 'John%' contains only ordinary plain letters",
      "There is no difference; both patterns use the index equally well, because LIKE is always an indexed operation",
    ],
    answer: 0,
    explanation:
      "A sorted index can seek to a known prefix ('John'). A leading wildcard means the match may start anywhere, defeating the ordered index.",
  },
  {
    id: "it-multi",
    type: "multi",
    prompt: "Select **all** true statements about index trade-offs.",
    options: [
      "Each index adds cost to every write",
      "A low-selectivity column often won't benefit from an index",
      "A composite index helps queries filtering on a leftmost prefix of its columns",
      "Adding more indexes always makes every operation faster",
    ],
    answers: [0, 1, 2],
    explanation:
      "Indexes tax writes, low-selectivity columns rarely benefit, and composite indexes follow the leftmost-prefix rule. Option 4 is false — indexes slow writes, so more isn't always faster.",
  },
  {
    id: "it-flashcard",
    type: "flashcard",
    prompt:
      "Explain the costs of indexes, selectivity, what defeats an index, and composite column order. Answer aloud, then reveal.",
    modelAnswer:
      "Indexes **speed reads but aren't free**. **Write cost**: each index is a separate sorted structure that must stay in sync, so every `INSERT`/`UPDATE`/`DELETE` updates the row **plus every index** — many indexes = slower writes. **Storage cost**: each index is extra data to store, cache, and back up. **Selectivity**: an index helps only when it narrows results a lot — high-selectivity columns (email) benefit; **low-selectivity** ones (a boolean where 90% are true) don't, and the optimizer will scan instead. **Index-defeating conditions**: a **function on the column** (`LOWER(email)` vs a plain index — fix by indexing the expression), a **leading wildcard** (`LIKE '%son'` can match anywhere; `'John%'` can seek), or a **type mismatch** all bypass an index. **Composite indexes** cover multiple columns but follow the **leftmost-prefix** rule: `(last_name, first_name)` serves filters on `last_name` (and both), but **not** `first_name` alone — order columns to match your queries. Bottom line: index the columns you filter/join/sort on, not everything.",
    keyPoints: [
      "Indexes speed reads, slow writes (every write updates every index), cost storage",
      "Selectivity: low-selectivity columns (booleans) rarely benefit",
      "Functions on the column, leading wildcards, type mismatches defeat an index",
      "Composite index = leftmost-prefix rule; column order must match queries",
      "Index what you filter/join/sort on — not every column",
    ],
    explanation:
      "A strong answer covers write/storage cost, selectivity, index-defeating conditions, and the leftmost-prefix rule for composite indexes.",
  },
];

export default quiz;
