import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "nf-purpose",
    type: "mcq",
    prompt: "What is the goal of normalization?",
    options: [
      "Organize columns into tables so each fact is stored once, removing redundancy and its anomalies",
      "Compress the database on disk by shortening long column names into fixed-length numeric codes for speed",
      "Combine many small tables into one wide table so that every query can avoid ever having to join anything",
      "Encrypt sensitive columns so that redundant copies of the data become unreadable to unauthorized users",
    ],
    answer: 0,
    explanation:
      "Normalization splits columns across tables so each fact lives once, eliminating the update/insert/delete anomalies redundancy causes.",
  },
  {
    id: "nf-1nf",
    type: "mcq",
    prompt: "A column stores 'Pen, Notebook' as a comma-separated list. Which normal form does this violate?",
    options: [
      "1NF — values must be atomic, so each product needs its own row",
      "2NF, because the list depends on only part of the table's composite primary key rather than on the whole of it",
      "3NF, because the list of products depends on another non-key column instead of depending on the key directly",
      "None — a comma-separated list is a perfectly normalized way to store several related values inside one cell",
    ],
    answer: 0,
    explanation:
      "1NF requires atomic (single) values. A list in one cell breaks it — split each value onto its own row.",
  },
  {
    id: "nf-anomaly-fill",
    type: "fill",
    prompt: "Changing a fact in one row but forgetting its duplicate elsewhere, leaving contradictory data, is an update ___.",
    answers: ["anomaly", "anomalies"],
    hint: "A word for an inconsistency or irregularity.",
    explanation:
      "That's the update anomaly — the core problem redundancy causes and normalization removes.",
  },
  {
    id: "nf-3nf-predict",
    type: "predict",
    prompt: "Which normal form does department_name violate in this table?",
    code: `employees(id, name, department_id, department_name)`,
    options: [
      "3NF — department_name depends on department_id, a non-key column, not directly on the key",
      "1NF, because the department_name column is storing more than one atomic value inside of a single table cell",
      "2NF, because department_name depends on only one part of a composite primary key made of several columns",
      "None — the table is fully normalized, since every column relates in some way to the employee it describes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`department_name` depends on `department_id` (non-key), not directly on `id` — a transitive dependency, which 3NF forbids. Move it to a departments table.",
  },
  {
    id: "nf-2nf",
    type: "mcq",
    prompt: "When does second normal form (2NF) become relevant?",
    options: [
      "When the primary key is composite — every non-key column must depend on the whole key, not just part",
      "Only when the table has no primary key at all, since 2NF is what defines which column should become the key",
      "When a column stores a list of values, because splitting that list into rows is exactly what 2NF requires",
      "When two tables need to be joined, because 2NF governs how the foreign key between them must be structured",
    ],
    answer: 0,
    explanation:
      "2NF concerns composite keys: no non-key column may depend on only *part* of the key (a partial dependency).",
  },
  {
    id: "nf-denormalization-senior",
    type: "mcq",
    prompt: "🧠 Why might a team deliberately denormalize a schema?",
    options: [
      "To reduce the number of joins on a hot read path, trading redundancy risk for faster reads",
      "To guarantee the data can never contain any anomalies, since duplicated copies are always kept in sync for free",
      "Because normalization is an outdated practice that modern databases no longer support in any meaningful way",
      "To shrink the total storage used, because storing the same value in several places takes up less room overall",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Denormalization reintroduces redundancy to avoid costly joins on read-heavy paths. The trade is accepting update-anomaly risk — normalize first, denormalize with intent.",
  },
  {
    id: "nf-multi",
    type: "multi",
    prompt: "Select **all** true statements about normalization.",
    options: [
      "1NF requires atomic (single-valued) cells",
      "3NF forbids a non-key column depending on another non-key column",
      "Normalization removes update, insert, and delete anomalies",
      "Denormalization removes redundancy to save disk space",
    ],
    answers: [0, 1, 2],
    explanation:
      "1NF = atomic values, 3NF forbids transitive dependencies, and normalization removes the three anomalies. Denormalization *adds* redundancy for read speed — so option 4 is false.",
  },
  {
    id: "nf-flashcard",
    type: "flashcard",
    prompt:
      "Explain normalization: the anomalies it fixes, 1NF/2NF/3NF, and the denormalization trade-off. Answer aloud, then reveal.",
    modelAnswer:
      "**Normalization** organizes columns into tables so each **fact lives once**, removing the three redundancy **anomalies**: **update** (change a duplicated fact everywhere or contradict yourself), **insert** (can't record a fact because unrelated data is missing), **delete** (removing one thing erases another). The forms: **1NF** — every cell is **atomic** (no lists / repeating groups); **2NF** — with a **composite** key, no non-key column depends on only **part** of the key (no partial dependency); **3NF** — no non-key column depends on **another non-key** column (no transitive dependency). The 3NF mnemonic: every non-key column depends on *the key, the whole key, and nothing but the key*. Counterpoint: **denormalization** deliberately reintroduces redundancy (duplicated columns, precomputed totals) to **cut joins** on hot read paths — a trade that accepts update-anomaly risk for speed. Practice: normalize first (3NF is the usual target), denormalize selectively with a measured need.",
    keyPoints: [
      "Fixes update / insert / delete anomalies from redundancy",
      "1NF = atomic cells (no lists)",
      "2NF = no partial dependency on part of a composite key",
      "3NF = no transitive dependency (non-key on non-key)",
      "Denormalization trades redundancy risk for fewer joins (read speed)",
    ],
    explanation:
      "A strong answer names the three anomalies, defines 1NF/2NF/3NF crisply, and frames denormalization as a deliberate read-speed trade-off.",
  },
];

export default quiz;
