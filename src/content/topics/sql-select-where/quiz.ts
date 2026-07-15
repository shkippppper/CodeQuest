import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sw-select-basic",
    type: "mcq",
    prompt: "What does `SELECT name, city FROM users;` return?",
    options: [
      "The name and city columns for every row in the users table",
      "Only the very first row of the users table, showing all of its available columns at once",
      "A single combined text value made by joining each user's name and city together with a comma",
      "Every column of the users table except for the two columns that were named in the query",
    ],
    answer: 0,
    explanation:
      "`SELECT` lists the columns you want; with no `WHERE`, you get those columns for **all** rows. Naming two columns returns exactly those two, one value each per row.",
  },
  {
    id: "sw-where-num",
    type: "predict",
    prompt: "Given the four users (Ada 34, Beka 28, Carlo 41, Dato 19), what does this return?",
    code: `SELECT name FROM users WHERE age >= 30;`,
    options: [
      "Ada and Carlo",
      "Beka and Dato, the two users whose recorded age is strictly below the thirty-year threshold",
      "All four users, because a WHERE clause only reorders rows and never removes any of them",
      "Nothing at all, since age is a number and numbers must be written inside single quotes",
    ],
    answer: 0,
    explanation:
      "`age >= 30` keeps rows where age is 30 or more: Ada (34) and Carlo (41). Numbers are compared directly and need no quotes.",
  },
  {
    id: "sw-quotes",
    type: "mcq",
    prompt: "How should a text value be written in a WHERE condition in standard SQL?",
    options: [
      "In single quotes, like `city = 'Batumi'`",
      "In double quotes, like `city = \"Batumi\"`, which standard SQL treats as a text string literal",
      "With no quotes at all, since the database infers that an unquoted word must be a piece of text",
      "In square brackets, like `city = [Batumi]`, which is the portable way to quote any text value",
    ],
    answer: 0,
    explanation:
      "Text literals use **single** quotes. Double quotes mean an *identifier* (a column/table name) in standard SQL and PostgreSQL, so `\"Batumi\"` would be read as a column name.",
  },
  {
    id: "sw-clause-fill",
    type: "fill",
    prompt: "The ___ clause filters a query down to only the rows that satisfy a condition.",
    answers: ["WHERE", "where"],
    hint: "It comes after FROM and takes a true/false condition.",
    explanation:
      "`WHERE` tests each row against a condition and keeps only those that pass. Without it, every row is returned.",
  },
  {
    id: "sw-precedence",
    type: "predict",
    prompt: "AND binds tighter than OR. How does the database read this WHERE clause?",
    code: `WHERE city = 'Batumi' OR city = 'Tbilisi' AND age >= 30`,
    options: [
      "city = 'Batumi' OR (city = 'Tbilisi' AND age >= 30)",
      "(city = 'Batumi' OR city = 'Tbilisi') AND age >= 30, applying the age test to both of the cities",
      "It is rejected as a syntax error because AND and OR may never appear in the same WHERE clause",
      "city = 'Batumi' AND (city = 'Tbilisi' OR age >= 30), because the first written operator always wins",
    ],
    answer: 0,
    explanation:
      "`AND` groups before `OR`, so the Tbilisi-and-age test binds together first. If you meant to apply the age test to both cities, wrap the cities in parentheses.",
  },
  {
    id: "sw-star",
    type: "mcq",
    prompt: "What does `SELECT * FROM users;` do, and why prefer naming columns in real code?",
    options: [
      "Returns every column; naming columns keeps the query stable when the table changes and reads less data",
      "Returns only columns that currently hold a non-null value, automatically hiding any empty columns from you",
      "Returns a count of how many columns the table has, which is why explicit names give you the rows instead",
      "Returns every column but sorts them alphabetically, so naming columns is the only way to keep the original order",
    ],
    answer: 0,
    explanation:
      "`*` means all columns. In application code you name the columns you need so adding a column later doesn't change results and the database transfers less data.",
  },
  {
    id: "sw-multi-truths",
    type: "multi",
    prompt: "Select **all** statements that are true about SELECT and WHERE.",
    options: [
      "WHERE removes rows that fail its condition",
      "Text values are written in single quotes",
      "SELECT without WHERE returns every row",
      "A single `=` tests equality in a WHERE condition",
    ],
    answers: [0, 1, 2, 3],
    explanation:
      "All four are correct: `WHERE` filters rows, text uses single quotes, an unfiltered `SELECT` returns all rows, and equality is a single `=` (not `==`).",
  },
  {
    id: "sw-equals-null",
    type: "mcq",
    prompt: "A column `city` is NULL for one row. Which rows does `WHERE city = NULL` match?",
    options: [
      "None — a comparison against NULL is never true, so no row is returned",
      "Every row whose city column has been left empty or unset, which is the one row with a NULL city here",
      "Only rows where city holds an actual text value, since NULL is automatically converted to an empty string",
      "All rows in the table, because comparing anything to NULL is treated as always true by the database engine",
    ],
    answer: 0,
    difficulty: "mid",
    explanation:
      "Comparisons with NULL yield *unknown*, never true, so `= NULL` matches nothing. To find missing values you use `IS NULL`, which is covered in its own lesson.",
  },
  {
    id: "sw-paren-senior",
    type: "predict",
    prompt: "🧠 You want users who are in Batumi or Tbilisi AND are at least 30. Which WHERE is correct?",
    code: `-- users: Ada(Batumi,34) Beka(Tbilisi,28) Carlo(Batumi,41) Dato(Kutaisi,19)`,
    options: [
      "WHERE (city = 'Batumi' OR city = 'Tbilisi') AND age >= 30",
      "WHERE city = 'Batumi' OR city = 'Tbilisi' AND age >= 30, since AND already applies to both of the listed cities",
      "WHERE city = 'Batumi' OR city = 'Tbilisi' OR age >= 30, because OR is what combines several separate conditions",
      "WHERE city IN 'Batumi' 'Tbilisi' AND age >= 30, listing the two cities one after another without any commas",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "You must parenthesize the OR so the age test applies to the whole city group. Without parentheses, `AND` binds to Tbilisi only and Ada/Carlo would skip the age check.",
  },
  {
    id: "sw-flashcard",
    type: "flashcard",
    prompt:
      "Explain the anatomy of `SELECT ... FROM ... WHERE ...`: what each clause does, how to write text and equality, and the AND/OR gotcha. Answer aloud, then reveal.",
    modelAnswer:
      "**`SELECT`** names the **columns** you want (or `*` for all); **`FROM`** names the **table**; **`WHERE`** gives a condition each **row** must pass to appear. Text literals go in **single quotes** (`'Batumi'`) — double quotes mean an *identifier* in standard SQL. Equality is a single **`=`** (not `==`), and numbers are compared directly with `<`, `>`, `>=`, etc., no quotes. Combine conditions with **`AND`** (all true) and **`OR`** (any true); **`AND` binds tighter than `OR`**, so use **parentheses** to make grouping explicit. A comparison against **NULL** is never true, so `WHERE col = NULL` matches nothing (use `IS NULL`). In real code prefer naming columns over `*` so results stay stable and less data moves. On iOS this is the same SQL that **SQLite**, and therefore **Core Data**/**SwiftData** fetches, run underneath.",
    keyPoints: [
      "SELECT columns / FROM table / WHERE row-condition",
      "Single quotes for text; single = for equality",
      "AND binds tighter than OR — parenthesize to be explicit",
      "= NULL never matches; use IS NULL",
      "Name columns over * for stability and less data",
    ],
    explanation:
      "A strong answer states each clause's job, the single-quote and single-`=` rules, and the AND-over-OR precedence trap.",
  },
];

export default quiz;
