import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "er-entity",
    type: "mcq",
    prompt: "In ER modeling, what does an entity become in the database?",
    options: [
      "A table, with each instance of the entity becoming a row",
      "A single column, since an entity represents one attribute of the thing that is actually being described",
      "A relationship line connecting two tables, because entities exist only to link other structures together",
      "A constraint, because entities describe the rules that the rows of a table must follow when inserted",
    ],
    answer: 0,
    explanation:
      "An entity (Customer, Order) maps to a table; one instance of it is a row. Relationships connect entities.",
  },
  {
    id: "er-one-to-many",
    type: "mcq",
    prompt: "A customer places many orders; each order belongs to one customer. Where does the foreign key go?",
    options: [
      "On the orders table (the 'many' side), pointing back at the customer",
      "On the customers table, storing a list of every order id that belongs to that particular customer in one column",
      "On both tables at once, so each side keeps its own copy of the other side's identifier fully synchronized",
      "In a separate junction table, because every relationship between two tables always requires a bridge table",
    ],
    answer: 0,
    explanation:
      "One-to-many puts the foreign key on the 'many' side. Each order stores `customer_id`; the customer isn't cluttered with a list.",
  },
  {
    id: "er-many-to-many",
    type: "mcq",
    prompt: "An order contains many products and a product appears in many orders. How is this modeled?",
    options: [
      "With a junction table holding one row per (order, product) pairing",
      "With a foreign key on the orders table that stores every product id belonging to that order as one combined value",
      "With a foreign key on the products table pointing at whichever single order most recently included that product",
      "By merging orders and products into one wide table so the relationship no longer needs to be represented at all",
    ],
    answer: 0,
    explanation:
      "Many-to-many needs a junction table (e.g. `order_items`) with a foreign key to each side — you can't fit many ids in one column.",
  },
  {
    id: "er-junction-fill",
    type: "fill",
    prompt: "The middle table that resolves a many-to-many relationship is called a ___ table (also 'join' or 'bridge').",
    answers: ["junction", "JUNCTION"],
    hint: "It sits between the two entity tables, linking them.",
    explanation:
      "A junction (join/bridge) table holds one row per pairing, with two foreign keys and usually a composite primary key.",
  },
  {
    id: "er-count-predict",
    type: "predict",
    prompt: "Students enrol in many courses; a course has many students. How many tables model this?",
    code: `-- students <-> courses (many-to-many)`,
    options: [
      "Three — students, courses, and a junction table linking them",
      "Two — students and courses, with each course row storing a list of all its enrolled student ids inside a column",
      "One — a single enrolments table containing every student's name and every course's title together on each row",
      "Four — students, courses, and one separate junction table for each of the two directions of the relationship",
    ],
    answer: 0,
    explanation:
      "A many-to-many needs three tables: the two entities plus a junction table `enrolments(student_id, course_id)`.",
  },
  {
    id: "er-one-to-one-senior",
    type: "mcq",
    prompt: "🧠 How do you enforce a one-to-one relationship, and why split the tables at all?",
    options: [
      "A foreign key with a UNIQUE constraint; split to isolate optional, sensitive, or rarely-used columns",
      "A junction table with two foreign keys, because one-to-one is just a restricted form of a many-to-many link",
      "Two foreign keys pointing at each other, which the database automatically keeps consistent on every write",
      "You cannot enforce it in SQL at all, so one-to-one relationships must always be validated in application code",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "One-to-one = a foreign key plus a `UNIQUE` constraint (capping the 'many' side at one). You split deliberately — to isolate sensitive, optional, or rarely-read columns.",
  },
  {
    id: "er-multi",
    type: "multi",
    prompt: "Select **all** correct relationship-to-implementation mappings.",
    options: [
      "One-to-many → foreign key on the many side",
      "Many-to-many → junction table with two foreign keys",
      "One-to-one → foreign key with a UNIQUE constraint",
      "Many-to-many → a single foreign key on either side",
    ],
    answers: [0, 1, 2],
    explanation:
      "One-to-many, one-to-one, and many-to-many map as shown. Option 4 is false — a single foreign key can't represent many-to-many; it needs a junction table.",
  },
  {
    id: "er-flashcard",
    type: "flashcard",
    prompt:
      "Explain ER modeling: entities, the three cardinalities, and how each maps to keys/tables. Answer aloud, then reveal.",
    modelAnswer:
      "An **ER (entity-relationship) model** sketches **entities** (things you store → tables; an instance → a row) and the **relationships** between them, whose key property is **cardinality**. Three shapes: **One-to-many** (a customer has many orders) → put the **foreign key on the 'many' side** (each order stores `customer_id`). **One-to-one** (a user and one profile row) → a foreign key with a **`UNIQUE`** constraint capping the many side at one; you split deliberately to isolate optional/sensitive/rarely-used columns. **Many-to-many** (orders ↔ products, students ↔ courses) → a **junction table** (join/bridge) with **one row per pairing** and a **foreign key to each side**, usually with a composite primary key `(a_id, b_id)`; it's really two one-to-many relationships into the middle table — you *cannot* model it with a single foreign key. Design flow: name entities, decide each pair's cardinality, then the keys follow mechanically.",
    keyPoints: [
      "Entity → table, instance → row; relationship has a cardinality",
      "One-to-many → FK on the many side",
      "One-to-one → FK + UNIQUE (split for optional/sensitive columns)",
      "Many-to-many → junction table, two FKs, composite PK",
      "Design: entities → cardinalities → keys follow",
    ],
    explanation:
      "A strong answer maps each cardinality to its implementation and stresses that many-to-many needs a junction table.",
  },
];

export default quiz;
