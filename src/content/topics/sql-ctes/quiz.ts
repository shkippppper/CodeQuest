import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "cte-what",
    type: "mcq",
    prompt: "What is a common table expression (CTE)?",
    options: [
      "A named, temporary result defined with WITH and used like a table in the same statement",
      "A permanent table you create ahead of time so that several different queries can share the same intermediate data",
      "A special index that the database builds over the most frequently joined columns to speed up repeated lookups",
      "A stored procedure that bundles several queries together and runs them one after another as a single named unit",
    ],
    answer: 0,
    explanation:
      "A CTE names a subquery via `WITH`, letting the main query reference it like a table. It exists only for that one statement.",
  },
  {
    id: "cte-keyword-fill",
    type: "fill",
    prompt: "A CTE is introduced with the keyword ___, as in `___ city_totals AS (SELECT ...)`.",
    answers: ["WITH", "with"],
    hint: "It comes before the main SELECT.",
    explanation:
      "`WITH name AS (query)` defines a CTE that the following statement can use by name.",
  },
  {
    id: "cte-vs-derived",
    type: "mcq",
    prompt: "What can a CTE do that a FROM-clause derived table cannot?",
    options: [
      "Be referenced multiple times within the same main query",
      "Store its result permanently on disk so that later, unrelated queries can read the same rows back again",
      "Run without needing to select from any underlying table, generating its rows entirely out of thin air instead",
      "Skip the requirement to have an alias, since a CTE is allowed to remain completely anonymous inside the query",
    ],
    answer: 0,
    explanation:
      "A CTE is defined once and can be referenced multiple times in the query. A derived table lives in one `FROM` slot only.",
  },
  {
    id: "cte-predict",
    type: "predict",
    prompt: "Sales totals: Batumi 100, Tbilisi 100, Kutaisi 40. What does this return?",
    code: `WITH t AS (\n  SELECT city, SUM(amount) AS total FROM sales GROUP BY city\n)\nSELECT city FROM t WHERE total >= 100;`,
    options: [
      "Batumi and Tbilisi",
      "All three cities, because the CTE keeps every grouped row and the outer filter is applied only to the raw sales rows",
      "Kutaisi only, since it is the single city whose total falls below the one-hundred threshold used in the condition",
      "One row containing the combined grand total of 240, because the CTE sums every city together into a single value",
    ],
    answer: 0,
    explanation:
      "The CTE builds per-city totals (100, 100, 40); the outer query keeps totals of 100 or more — Batumi and Tbilisi.",
  },
  {
    id: "cte-chain",
    type: "mcq",
    prompt: "In `WITH a AS (...), b AS (SELECT ... FROM a) SELECT * FROM b`, what is true?",
    options: [
      "b can read from a, because a is defined earlier in the same WITH chain",
      "b and a run as two completely separate statements, so b is unable to see anything that a produced beforehand",
      "a must be listed after b, because a CTE can only reference other CTEs that appear below it in the WITH block",
      "Only one CTE is allowed per WITH block, so writing both a and b in the same WITH is rejected as a syntax error",
    ],
    answer: 0,
    explanation:
      "CTEs chain: a later CTE can reference earlier ones. `b` reads from `a` because `a` is defined above it.",
  },
  {
    id: "cte-persist-senior",
    type: "mcq",
    prompt: "🧠 How long does a CTE's result exist?",
    options: [
      "Only for the single statement that defines it — it is not stored for later queries",
      "Until the current database session ends, so any query run afterward in the same connection can still read it",
      "Permanently, because the WITH clause writes the CTE's rows into a hidden table kept on disk between runs",
      "Until the next time the underlying table changes, at which point the database automatically refreshes the CTE",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A CTE is scoped to the one statement. It's not a temporary table — a later query can't reference it.",
  },
  {
    id: "cte-multi",
    type: "multi",
    prompt: "Select **all** true statements about CTEs.",
    options: [
      "A CTE improves readability by naming a subquery",
      "A CTE can be referenced multiple times in the query",
      "Multiple CTEs can be chained, later ones using earlier ones",
      "A CTE persists as a table for use by future queries",
    ],
    answers: [0, 1, 2],
    explanation:
      "CTEs name subqueries, allow reuse, and chain. Option 4 is false — a CTE exists only for the statement that defines it.",
  },
  {
    id: "cte-flashcard",
    type: "flashcard",
    prompt:
      "Explain CTEs: syntax, the readability/reuse benefits over subqueries, chaining, and lifetime. Answer aloud, then reveal.",
    modelAnswer:
      "A **common table expression (CTE)** names a subquery with **`WITH name AS (query)`**, then the following statement uses `name` like a table. It computes the same thing as a derived table but reads **top to bottom** ('first compute X, then select from it') instead of inside-out. Advantages over an inline subquery: (1) **readability** — each step is named; (2) a CTE can be **referenced multiple times** in the main query, whereas a `FROM`-clause derived table lives in one spot; (3) you can **chain** several CTEs (comma-separated) where a later one reads from an **earlier** one, turning a complex transform into a pipeline of named stages. A CTE is **scoped to the single statement** — it isn't stored and later queries can't see it. CTE vs subquery is mostly a **readability/reuse** call (modern optimizers usually inline CTEs, so little perf difference). CTEs are also the gateway to **recursive** queries.",
    keyPoints: [
      "WITH name AS (query) → use name like a table, reads top-to-bottom",
      "Can be referenced multiple times (derived table can't)",
      "Chain multiple CTEs; later ones reference earlier ones",
      "Scoped to one statement — not a persistent temp table",
      "vs subquery: readability/reuse; recursion builds on CTEs",
    ],
    explanation:
      "A strong answer highlights readability, multi-reference, chaining, single-statement lifetime, and the recursion tie-in.",
  },
];

export default quiz;
