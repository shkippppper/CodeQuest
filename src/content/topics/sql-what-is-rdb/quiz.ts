import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "rdb-duplication",
    type: "mcq",
    prompt: "Why is storing a customer's email directly in every one of their order rows a problem?",
    options: [
      "If the email changes you must update every copy, and any row you miss makes the data inconsistent",
      "Email addresses are too long to fit inside a normal table column, so they overflow into the next row",
      "The database charges you extra storage fees for each duplicated text value that appears more than once",
      "Orders are not allowed to contain text columns at all, only numbers, so the email would be rejected outright",
    ],
    answer: 0,
    explanation:
      "Duplicated facts drift out of sync. Store the email once in a customers row and have orders reference that row, so a change happens in exactly one place.",
  },
  {
    id: "rdb-what-is-relation",
    type: "mcq",
    prompt: "In relational databases, what does the word \"relation\" actually refer to?",
    options: [
      "A table — a set of rows that all share the same columns",
      "The link between two tables, created whenever one table stores an id from another table",
      "The family of foreign keys that connect a parent table to all of its many related child tables",
      "The relationship a database administrator maintains with the users who query the system daily",
    ],
    answer: 0,
    explanation:
      "A \"relation\" is the table itself — a set of same-shaped rows. The links between tables are foreign keys, which is a different concept.",
  },
  {
    id: "rdb-schema-fill",
    type: "fill",
    prompt: "The fixed set of columns and their types that every row in a table must follow is called the table's ___.",
    answers: ["schema"],
    hint: "It defines the shape of the table.",
    explanation:
      "The schema is the table's structure: which columns exist and what type each holds. Every row conforms to it.",
  },
  {
    id: "rdb-link-column",
    type: "predict",
    prompt: "An order needs to record which customer placed it. In the relational model, what does the order row store?",
    code: `customers(id, name, email)\norders(id, customer_id, city)`,
    options: [
      "The customer's id, so the order points at exactly one customer row",
      "A full copy of the customer's name and email, duplicated into the order row for fast lookups",
      "Nothing about the customer, because orders and customers can never be connected to each other",
      "The row number of the customer as it currently appears on screen in the spreadsheet view",
    ],
    answer: 0,
    explanation:
      "The order stores `customer_id`, the id of the matching customer row. The customer's other details stay in the customers table, stored once.",
  },
  {
    id: "rdb-vs-nosql",
    type: "mcq",
    prompt: "How does a document-store (NoSQL) database differ from a relational one?",
    options: [
      "Each record can have a flexible set of fields with no fixed schema",
      "It refuses to store any text, keeping only numbers so that every lookup stays extremely fast",
      "It is always faster than a relational database for every possible query you could ever write against it",
      "It stores data in tables with typed columns too, but simply gives those tables much longer names",
    ],
    answer: 0,
    explanation:
      "A document store keeps flexible, schema-less records (JSON-shaped documents). Relational databases use a fixed schema of typed columns instead.",
  },
  {
    id: "rdb-benefits-multi",
    type: "multi",
    prompt: "Select **all** advantages of splitting data into linked relational tables rather than one big sheet.",
    options: [
      "Each fact is stored in a single place",
      "Updating a shared value happens in one row",
      "The database can enforce column types",
      "Duplicated data can silently drift out of sync",
    ],
    answers: [0, 1, 2],
    explanation:
      "The first three are benefits of the relational split. The fourth describes the *problem* with duplication that the split avoids — it is not an advantage.",
  },
  {
    id: "rdb-choose-senior",
    type: "mcq",
    prompt: "🧠 A team debates relational vs NoSQL for a payments system with strict correctness needs. What's the strongest answer?",
    options: [
      "Relational fits: structured data plus enforced consistency is exactly what the model is built for",
      "NoSQL is the modern choice, so it is always the right call for any brand-new system being built today",
      "It makes no difference at all, because both kinds of database store and return data in identical ways",
      "Relational cannot handle money or payments, so the team is forced to use a document store regardless",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Payments are structured and correctness-critical — the relational model's fixed schema and enforced integrity are the right tool. NoSQL trades some of that for flexibility that payments don't need.",
  },
  {
    id: "rdb-flashcard",
    type: "flashcard",
    prompt:
      "Explain what a relational database is, what \"relational\" means, and when you'd pick it over NoSQL. Answer aloud, then reveal.",
    modelAnswer:
      "A **relational database** stores data in **tables**: named, typed **columns** and one **row** per record, all following a fixed **schema**. Tables **link** by having one table store the **id** of a row in another (a foreign key), so each fact lives in exactly one place instead of being duplicated. **\"Relational\"** comes from math — a **relation** is a set of same-shaped rows, i.e. the *table itself*, not the links. You query it with **SQL**. Versus **NoSQL** (e.g. a document store like MongoDB), which drops the fixed schema for flexible per-record fields: pick **relational** for structured, consistency-critical data (orders, payments, users) where the database should enforce types and referential integrity; pick **NoSQL** for loosely-structured or rapidly-changing data. Neither is universally better.",
    keyPoints: [
      "Tables of typed rows following a fixed schema; queried with SQL",
      "Tables link by storing another table's id — each fact stored once",
      "\"Relation\" = the table (set of rows), not the links",
      "Relational for structured/consistency-critical; NoSQL for flexible/loose data",
    ],
    explanation:
      "A strong answer defines tables + schema, explains that a fact is stored once and linked, corrects the \"relation = links\" myth, and frames the NoSQL trade-off without declaring a universal winner.",
  },
];

export default quiz;
