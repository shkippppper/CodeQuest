import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "tk-pk-purpose",
    type: "mcq",
    prompt: "What is a primary key's job?",
    options: [
      "To uniquely identify each row in its table",
      "To store a copy of a value taken from some other table so the two tables can be searched together",
      "To sort the rows of the table alphabetically by name whenever new data is inserted into that table",
      "To hold the password that a user must type before the database will let them read any of the rows",
    ],
    answer: 0,
    explanation:
      "A primary key uniquely identifies each row within its own table. Its value is guaranteed unique and never NULL.",
  },
  {
    id: "tk-pk-rules",
    type: "multi",
    prompt: "Select **all** guarantees the database enforces for a primary key.",
    options: [
      "Every value is unique across the table",
      "A value can never be NULL",
      "Two different rows may share the same value",
      "The value may be left empty when unknown",
    ],
    answers: [0, 1],
    explanation:
      "A primary key must be unique and non-NULL. Options 3 and 4 describe the exact things a primary key forbids.",
  },
  {
    id: "tk-fk-def",
    type: "fill",
    prompt: "A column that stores the primary-key value of a row in another table is called a ___ key.",
    answers: ["foreign"],
    hint: "The opposite of the key that lives at 'home' in this table.",
    explanation:
      "A foreign key holds another table's primary-key value, creating the link between the two tables.",
  },
  {
    id: "tk-direction",
    type: "mcq",
    prompt: "In an orders/customers design, which table holds the foreign key, and what does it reference?",
    options: [
      "orders holds customer_id, which references the primary key of customers",
      "customers holds order_id, which references the primary key of orders, one column per order that exists",
      "Both tables hold a copy of the other table's entire primary key column, kept in sync on every write",
      "Neither table holds a key; the link is stored in a separate hidden table the database manages for you",
    ],
    answer: 0,
    explanation:
      "The child table (orders) holds the foreign key `customer_id`, pointing at the parent table's (customers) primary key. One customer, many orders.",
  },
  {
    id: "tk-referential",
    type: "fill",
    prompt: "The guarantee that a foreign key always points at a row that actually exists is called referential ___.",
    answers: ["integrity"],
    hint: "It means the references are kept honest / consistent.",
    explanation:
      "Referential integrity is the promise that every foreign-key value matches a real row in the referenced table — no dangling references.",
  },
  {
    id: "tk-bad-insert",
    type: "predict",
    prompt: "customers has ids 1, 2, 3. What happens when this runs?",
    code: `INSERT INTO orders (id, customer_id, total)\nVALUES (1003, 999, 20);`,
    options: [
      "It is rejected, because no customer has id 999 for the foreign key to reference",
      "It succeeds and quietly creates a brand-new customer row with id 999 so the reference becomes valid",
      "It succeeds, and the customer_id column is automatically reset to NULL because 999 was not found",
      "It succeeds now but silently deletes the order again the next time anyone queries the orders table",
    ],
    answer: 0,
    explanation:
      "The foreign key requires `customer_id` to match an existing customer. Since none has id 999, referential integrity blocks the insert.",
  },
  {
    id: "tk-composite",
    type: "mcq",
    prompt: "An enrolments table allows a student in many classes and a class to have many students, but each (student_id, class_id) pair only once. What kind of primary key fits?",
    options: [
      "A composite key made of student_id and class_id together",
      "A primary key on student_id alone, since a single student identifies each enrolment row uniquely",
      "No primary key is possible here, because neither of the two columns holds unique values on its own",
      "A foreign key on grade, because that is the only remaining column left over in the enrolments table",
    ],
    answer: 0,
    explanation:
      "Neither column is unique alone, but the *pair* is. A primary key spanning multiple columns is a composite key.",
  },
  {
    id: "tk-fk-null-senior",
    type: "mcq",
    prompt: "🧠 An order has an optional coupon_id foreign key. Which values may that column legally hold?",
    options: [
      "The id of an existing coupon, or NULL to mean no coupon",
      "Any number at all, since foreign keys are only checked for the primary key of the same table they live in",
      "Only NULL, because a foreign key is not permitted to point at a real row in a different table than its own",
      "The id of an existing coupon only; NULL is always forbidden in any column that is a foreign key column",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A foreign key may be NULL (meaning 'references nothing'), or it must match an existing row. What it can't be is a non-NULL value with no matching row — that would be a dangling reference.",
  },
  {
    id: "tk-delete-parent-senior",
    type: "predict",
    prompt: "🧠 Order 1001 has customer_id = 2. By default, what happens here?",
    code: `DELETE FROM customers WHERE id = 2;`,
    options: [
      "The database blocks the delete, because it would leave order 1001 as an orphan",
      "The delete succeeds and order 1001 keeps its customer_id of 2, now pointing at a customer that is gone",
      "The delete succeeds and every order belonging to customer 2 is silently removed along with the customer",
      "The delete is rewritten by the database into an update that sets the customer's name to an empty string",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The safe default refuses the delete to prevent orphaned orders. You must reassign or remove the child orders first — or explicitly configure cascading behavior.",
  },
  {
    id: "tk-flashcard",
    type: "flashcard",
    prompt:
      "Explain primary keys vs foreign keys, what referential integrity gives you, and what a composite key is. Answer aloud, then reveal.",
    modelAnswer:
      "A **primary key** uniquely identifies each row *within its own table*; the database enforces that it is **unique** and **never NULL**. Most tables use an auto-incrementing integer id. A **foreign key** is a column in a *child* table that stores the **primary-key value** of a row in a *parent* table — e.g. `orders.customer_id` references `customers.id`. This gives **referential integrity**: the database guarantees the foreign key points at a row that exists (it blocks inserts referencing a missing parent) and prevents deletes that would **orphan** children (unless you opt into cascading). A foreign key *may* be **NULL** (references nothing) but may not hold a non-NULL value with no matching row. When no single column is unique but a combination is, the primary key can span several columns — a **composite key** (e.g. `(student_id, class_id)`).",
    keyPoints: [
      "Primary key: unique + non-NULL, identifies rows in its own table",
      "Foreign key: child stores parent's primary-key value to link tables",
      "Referential integrity: FK must point at a real row; blocks orphaning deletes",
      "Foreign key may be NULL, but not a dangling non-NULL value",
      "Composite key: primary key made of multiple columns together",
    ],
    explanation:
      "A strong answer distinguishes the two keys by direction, names referential integrity with the orphan example, and knows a composite key covers many-to-many join rows.",
  },
];

export default quiz;
