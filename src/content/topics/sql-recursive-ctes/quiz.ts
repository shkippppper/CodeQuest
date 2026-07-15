import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "rc-when",
    type: "mcq",
    prompt: "What problem is a recursive CTE built to solve?",
    options: [
      "Walking a hierarchy or chain of unknown depth, like an org chart or a comment tree",
      "Speeding up a slow join by caching its intermediate result and reusing that cached result on every later pass",
      "Removing duplicate rows from a result set by comparing each row against every other row repeatedly until none remain",
      "Splitting one very wide table into several narrower tables so that each column can be queried on its own separately",
    ],
    answer: 0,
    explanation:
      "A recursive CTE follows links to arbitrary depth — perfect for hierarchies whose depth you don't know when writing the query.",
  },
  {
    id: "rc-two-parts",
    type: "mcq",
    prompt: "What are the two parts of a recursive CTE, joined by UNION ALL?",
    options: [
      "An anchor member that seeds the result, and a recursive member that references the CTE to go one level further",
      "A SELECT that reads the table and a DELETE that removes the rows it has already processed so they are not revisited",
      "A subquery that counts the rows and a second subquery that stops the loop once that count reaches a fixed limit",
      "An outer query that returns the columns and an inner query that supplies the WHERE condition used to filter them",
    ],
    answer: 0,
    explanation:
      "The anchor runs once to seed the set; the recursive member references the CTE by name and adds the next level each pass.",
  },
  {
    id: "rc-keyword-fill",
    type: "fill",
    prompt: "A self-referencing CTE is usually declared with `WITH ___ name AS (...)`.",
    answers: ["RECURSIVE", "recursive"],
    hint: "The keyword that permits the CTE to reference itself.",
    explanation:
      "`WITH RECURSIVE` allows the CTE's name to be used inside its own definition. Most databases require it for recursion.",
  },
  {
    id: "rc-termination",
    type: "mcq",
    prompt: "When does the recursion in a recursive CTE stop?",
    options: [
      "When the recursive member returns no new rows",
      "After exactly one hundred passes, which is the hard limit that every database enforces on recursive queries by default",
      "When the anchor member has finished running, since the recursive member only ever executes a single time after it",
      "When the result set first contains a duplicate row, because UNION ALL halts as soon as it detects any repetition",
    ],
    answer: 0,
    explanation:
      "Recursion ends when a pass adds zero new rows — naturally, at the leaves of the hierarchy or the sequence's bound.",
  },
  {
    id: "rc-count-predict",
    type: "predict",
    prompt: "How many rows does this return?",
    code: `WITH RECURSIVE nums AS (\n  SELECT 1 AS n\n  UNION ALL\n  SELECT n + 1 FROM nums WHERE n < 3\n)\nSELECT n FROM nums;`,
    options: [
      "3 rows — 1, 2, 3",
      "2 rows — 1 and 2, because the recursion stops as soon as n first reaches the boundary value used in the condition",
      "Infinite rows, because there is nothing in the query that ever tells the recursive member when it should stop adding",
      "1 row — just the value 1 from the anchor, since the recursive member below the UNION ALL never actually executes",
    ],
    answer: 0,
    explanation:
      "Anchor gives 1; recursion adds 2 (1<3) and 3 (2<3); at n=3 the condition fails, so no new row — 1, 2, 3.",
  },
  {
    id: "rc-cycle-senior",
    type: "mcq",
    prompt: "🧠 What happens if the data has a cycle (A reports to B and B reports to A)?",
    options: [
      "The recursion never runs out of new rows, so it loops until it errors or a depth guard stops it",
      "The database detects the cycle automatically and silently returns only the rows found before the cycle began",
      "The anchor member refuses to run, so the query returns an empty result set without processing any of the rows",
      "UNION ALL removes the repeating rows on each pass, so the recursion quietly terminates after just two full passes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A cycle means each pass keeps finding 'new' rows, so recursion never terminates. Add a depth counter (`WHERE depth < N`) as a guard.",
  },
  {
    id: "rc-multi",
    type: "multi",
    prompt: "Select **all** true statements about recursive CTEs.",
    options: [
      "The anchor member runs once to seed the result",
      "The recursive member references the CTE by name",
      "Recursion stops when a pass adds no new rows",
      "A recursive CTE cannot be used to generate a number sequence",
    ],
    answers: [0, 1, 2],
    explanation:
      "Anchor seeds, recursive member self-references, and recursion ends at zero new rows. Option 4 is false — generating sequences (1..N, dates) is a classic use.",
  },
  {
    id: "rc-flashcard",
    type: "flashcard",
    prompt:
      "Explain recursive CTEs: the two members, how it terminates, cycles, and a non-hierarchy use. Answer aloud, then reveal.",
    modelAnswer:
      "A **recursive CTE** (`WITH RECURSIVE name AS (...)`) references **itself** to walk a chain of unknown depth. It has two parts joined by **`UNION ALL`**: the **anchor member** runs **once** to seed the result (e.g. the top employee), and the **recursive member** references the CTE by name and runs **repeatedly**, each pass adding the next level (employees whose manager is already in the set). It **terminates** when a pass returns **zero new rows** — naturally at the leaves. A **cycle** in the data (A→B→A) means each pass keeps finding new rows, so it **never terminates** — add a depth counter guard (`WHERE depth < N`). Beyond hierarchies, recursive CTEs **generate sequences**: start at 1, add 1 each pass with a `WHERE n < N` stop — useful to produce a row per day/hour in a range even when no table holds them. Use `UNION ALL` (not `UNION`).",
    keyPoints: [
      "WITH RECURSIVE; anchor (seeds, runs once) + recursive member (self-references, repeats), UNION ALL",
      "Each pass adds the next level from the previous pass's new rows",
      "Stops when a pass adds no new rows",
      "Cycles loop forever — add a depth guard",
      "Also generates sequences (1..N, dates) from nothing",
    ],
    explanation:
      "A strong answer describes anchor + recursive member, zero-new-rows termination, the cycle risk with a depth guard, and sequence generation.",
  },
];

export default quiz;
