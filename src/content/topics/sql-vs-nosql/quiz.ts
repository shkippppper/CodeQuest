import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "vn-relational-strengths",
    type: "mcq",
    prompt: "What is a relational database especially good at?",
    options: [
      "Structured data with a fixed schema, joins, and ACID transactions for correctness",
      "Storing enormous volumes of loosely-structured documents whose fields differ wildly from one record to the next",
      "Serving a single value for a given key as fast as physically possible, with no querying or filtering capability",
      "Traversing millions of relationship edges between nodes, which is the exact use case that joins were built to avoid",
    ],
    answer: 0,
    explanation:
      "Relational databases shine on structured data: an enforced schema, joins to reassemble split data, and ACID transactions for correctness.",
  },
  {
    id: "vn-document",
    type: "mcq",
    prompt: "What characterizes a document store like MongoDB?",
    options: [
      "It stores JSON-like documents where each record can have a different shape, with no fixed schema",
      "It stores data strictly in rows and columns with a rigid schema enforced identically on every single record",
      "It stores only key-value pairs and offers no way to keep more than one field inside a single stored record",
      "It stores nodes and edges as first-class objects, optimized entirely for traversing connections between them",
    ],
    answer: 0,
    explanation:
      "A document store keeps flexible, schema-less JSON-like documents — good when data is a self-contained document and the shape changes often.",
  },
  {
    id: "vn-scaling-fill",
    type: "fill",
    prompt: "Spreading data across many commodity servers to share the load is called ___ scaling (scaling out).",
    answers: ["horizontal", "HORIZONTAL"],
    hint: "The opposite of vertical (a bigger single server).",
    explanation:
      "Horizontal scaling (scale out) adds machines; many NoSQL systems are built for it. Vertical scaling (scale up) means a bigger single server.",
  },
  {
    id: "vn-cap-senior",
    type: "mcq",
    prompt: "🧠 What does the CAP theorem say happens during a network partition?",
    options: [
      "A distributed store can guarantee consistency or availability, but not both at once",
      "A distributed store loses all of its data unless it has been fully replicated to at least three separate machines",
      "A distributed store automatically becomes faster, because each partition can now answer its own requests locally",
      "A distributed store must shut down entirely until the network partition between its nodes has been fully repaired",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Under a partition, you choose Consistency (latest write everywhere) or Availability (always answer) — not both. Many NoSQL stores pick availability (eventual consistency).",
  },
  {
    id: "vn-choose-predict",
    type: "predict",
    prompt: "🧠 You're building a payments ledger: account balances, transfers, strict correctness. Which fits best?",
    code: `-- ledger: balances + transfers, must be correct`,
    options: [
      "Relational — money needs ACID transactions and enforced constraints",
      "A key-value store, because looking up a single account balance by its id is the only operation that ever matters",
      "An eventually-consistent NoSQL store, since a briefly stale balance is perfectly acceptable for financial data",
      "A graph database, because the transfers between accounts form edges that only a graph engine can represent at all",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A ledger demands ACID and constraints — the relational model's core strengths. A stale balance (eventual consistency) is unacceptable for money.",
  },
  {
    id: "vn-polyglot",
    type: "mcq",
    prompt: "What does 'polyglot persistence' mean?",
    options: [
      "Using different databases for different workloads within one system, chosen per need",
      "Storing every table in several database engines at once so that any one of them can serve as a live backup",
      "Writing the same query in several SQL dialects so it can run unchanged on any database the company might adopt",
      "Translating a NoSQL database into a relational one automatically whenever the data grows past a certain size",
    ],
    answer: 0,
    explanation:
      "Polyglot persistence means picking the right store per workload — e.g. Postgres for the ledger, Redis for sessions, MongoDB for a catalog — in one system.",
  },
  {
    id: "vn-multi",
    type: "multi",
    prompt: "Select **all** true statements about SQL vs NoSQL.",
    options: [
      "Relational databases enforce a fixed schema and support ACID",
      "Many NoSQL systems are designed to scale horizontally",
      "Under a partition, CAP forces a choice between consistency and availability",
      "NoSQL is always the better choice for a brand-new application",
    ],
    answers: [0, 1, 2],
    explanation:
      "Relational = schema + ACID, many NoSQL scale out, and CAP forces the consistency/availability trade under a partition. Option 4 is false — the right choice depends on the workload.",
  },
  {
    id: "vn-flashcard",
    type: "flashcard",
    prompt:
      "Compare relational and NoSQL: strengths, the NoSQL families, scaling, CAP, and how to choose. Answer aloud, then reveal.",
    modelAnswer:
      "**Relational** databases excel at **structured** data: an enforced **fixed schema**, **joins** (data split with no duplication, reassembled on demand), **ACID** transactions (correctness for money/orders), and **ad-hoc SQL** queries — the right default when correctness matters. **NoSQL** ('not only SQL') is four families that each drop some relational rule for a gain: **document** stores (MongoDB — flexible JSON docs, changing schemas), **key-value** (Redis/DynamoDB — fast hash-map lookups, caches/sessions), **wide-column** (Cassandra — huge write volume across machines), **graph** (Neo4j — connected data / traversals). **Scaling**: relational traditionally scales **vertically** (bigger server, has a ceiling); many NoSQL scale **horizontally** (out across commodity servers) by default. **CAP**: under a network **partition**, a distributed store guarantees **Consistency** or **Availability**, not both — many NoSQL pick availability (**eventual consistency**: briefly stale, then converges). **Choosing**: relational for structured/correctness-critical (a ledger); NoSQL for flexible schemas, massive scale, or a specific shape (a social feed). Real systems use **both** — **polyglot persistence**, per workload.",
    keyPoints: [
      "Relational: fixed schema, joins, ACID, ad-hoc SQL — structured/correctness-critical",
      "NoSQL families: document, key-value, wide-column, graph — each drops a rule for a gain",
      "Relational scales up (vertical); many NoSQL scale out (horizontal)",
      "CAP: under a partition, choose consistency OR availability (NoSQL often eventual consistency)",
      "Choose per workload; real systems mix both (polyglot persistence)",
    ],
    explanation:
      "A strong answer refuses the binary, contrasts strengths, names the NoSQL families, and covers scaling + CAP + polyglot persistence.",
  },
];

export default quiz;
