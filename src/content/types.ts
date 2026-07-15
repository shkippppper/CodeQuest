export type Difficulty = "junior" | "mid" | "senior";

export type SubjectId = "swift" | "sql";

export type CategoryId =
  | "language"
  | "types"
  | "memory"
  | "concurrency"
  | "ui"
  | "reactive"
  | "foundation"
  | "architecture"
  | "solid"
  | "patterns"
  | "testing"
  | "performance"
  | "system-design"
  | "tooling"
  | "cs-fundamentals"
  | "sql-foundations"
  | "sql-querying"
  | "sql-aggregation"
  | "sql-joins"
  | "sql-subqueries"
  | "sql-ddl"
  | "sql-dml-transactions"
  | "sql-indexing";

export interface TopicMeta {
  id: string;
  title: string;
  category: CategoryId;
  difficulty: Difficulty;
  order: number;
  summary: string;
  /** estimated minutes to read + quiz */
  est: number;
  tags?: string[];
}

export interface BaseQuestion {
  id: string;
  /** markdown */
  prompt: string;
  /** markdown shown after answering */
  explanation: string;
  /** optional swift snippet rendered with the question */
  code?: string;
  difficulty?: Difficulty;
}

export interface MCQQuestion extends BaseQuestion {
  type: "mcq";
  options: string[];
  answer: number;
}

export interface PredictQuestion extends BaseQuestion {
  type: "predict";
  options: string[];
  answer: number;
}

export interface FillQuestion extends BaseQuestion {
  type: "fill";
  /** acceptable answers, matched case-insensitively after trimming */
  answers: string[];
  hint?: string;
}

export interface FlashcardQuestion extends BaseQuestion {
  type: "flashcard";
  /** markdown — the "back" of the card */
  modelAnswer: string;
  /** quick self-check bullet points the user should have mentioned */
  keyPoints?: string[];
}

export interface MultiQuestion extends BaseQuestion {
  type: "multi";
  options: string[];
  /** indices of every correct option (at least one) */
  answers: number[];
}

export type Question = MCQQuestion | PredictQuestion | FillQuestion | FlashcardQuestion | MultiQuestion;

export interface Topic {
  meta: TopicMeta;
  markdown: string;
  quiz: Question[];
}

export interface SubjectInfo {
  id: SubjectId;
  label: string;
  /** hero copy, e.g. "Master Swift, level by level." */
  tagline: string;
  blurb: string;
  /** lucide icon name */
  icon: string;
  accent: string;
  order: number;
}

export const SUBJECTS: Record<SubjectId, SubjectInfo> = {
  swift: {
    id: "swift",
    label: "Swift & iOS",
    tagline: "Master Swift, level by level.",
    blurb: "The language, the frameworks, and the iOS interview surface.",
    icon: "Braces",
    accent: "#4d6699",
    order: 1,
  },
  sql: {
    id: "sql",
    label: "SQL & Databases",
    tagline: "Master SQL, query by query.",
    blurb: "Relational modeling, querying, transactions and performance.",
    icon: "Database",
    accent: "#2f9e8f",
    order: 2,
  },
};

export interface CategoryInfo {
  id: CategoryId;
  subject: SubjectId;
  label: string;
  order: number;
  blurb: string;
  /** lucide icon name */
  icon: string;
  accent: string;
}

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  language: {
    id: "language",
    subject: "swift",
    label: "Swift Language",
    order: 1,
    blurb: "The core language: types, optionals, protocols, generics, memory.",
    icon: "Braces",
    accent: "#6d85b4",
  },
  types: {
    id: "types",
    subject: "swift",
    label: "Type System & POP",
    order: 2,
    blurb: "Protocols, generics, associated types, and Swift's protocol-oriented design.",
    icon: "Shapes",
    accent: "#98abce",
  },
  memory: {
    id: "memory",
    subject: "swift",
    label: "Memory Management",
    order: 3,
    blurb: "ARC, ownership, retain cycles, and value semantics from stack to heap.",
    icon: "MemoryStick",
    accent: "#5d76a8",
  },
  concurrency: {
    id: "concurrency",
    subject: "swift",
    label: "Concurrency",
    order: 4,
    blurb: "GCD, async/await, actors, Sendable and structured concurrency.",
    icon: "Workflow",
    accent: "#4d6699",
  },
  ui: {
    id: "ui",
    subject: "swift",
    label: "SwiftUI & UIKit",
    order: 5,
    blurb: "Building interfaces: state, layout, lifecycle and the view system.",
    icon: "LayoutDashboard",
    accent: "#3c527d",
  },
  reactive: {
    id: "reactive",
    subject: "swift",
    label: "Combine & Reactive",
    order: 7,
    blurb: "Publishers, operators, subjects and bridging streams to async/await.",
    icon: "GitBranch",
    accent: "#7b90bb",
  },
  foundation: {
    id: "foundation",
    subject: "swift",
    label: "Networking & Persistence",
    order: 8,
    blurb: "URLSession, Codable pipelines, Core Data, SwiftData and caching.",
    icon: "Database",
    accent: "#46608f",
  },
  architecture: {
    id: "architecture",
    subject: "swift",
    label: "iOS Architecture",
    order: 9,
    blurb: "App architecture, patterns, networking, persistence and testing.",
    icon: "Building2",
    accent: "#324363",
  },
  solid: {
    id: "solid",
    subject: "swift",
    label: "SOLID & Clean Code",
    order: 10,
    blurb: "The five SOLID principles plus the habits of maintainable code.",
    icon: "Ruler",
    accent: "#a5b5d3",
  },
  patterns: {
    id: "patterns",
    subject: "swift",
    label: "Design Patterns",
    order: 11,
    blurb: "GoF and Cocoa patterns, written the way Swift actually uses them.",
    icon: "Puzzle",
    accent: "#64789f",
  },
  testing: {
    id: "testing",
    subject: "swift",
    label: "Testing & Quality",
    order: 12,
    blurb: "XCTest, Swift Testing, test doubles and strategies that scale.",
    icon: "FlaskConical",
    accent: "#8fa2c6",
  },
  performance: {
    id: "performance",
    subject: "swift",
    label: "Performance",
    order: 13,
    blurb: "Instruments, launch time, rendering hitches and memory efficiency.",
    icon: "Gauge",
    accent: "#55658b",
  },
  "system-design": {
    id: "system-design",
    subject: "swift",
    label: "Mobile System Design",
    order: 14,
    blurb: "The senior round: feeds, sync engines, chat and networking layers.",
    icon: "Network",
    accent: "#2b3a55",
  },
  tooling: {
    id: "tooling",
    subject: "swift",
    label: "Tooling & Ecosystem",
    order: 15,
    blurb: "SPM, the Xcode build system, signing, CI/CD and debugging tools.",
    icon: "Wrench",
    accent: "#718bb9",
  },
  "cs-fundamentals": {
    id: "cs-fundamentals",
    subject: "swift",
    label: "CS Fundamentals",
    order: 16,
    blurb: "Data structures and algorithms for the coding rounds.",
    icon: "Binary",
    accent: "#8497c0",
  },
  "sql-foundations": {
    id: "sql-foundations",
    subject: "sql",
    label: "SQL Foundations",
    order: 101,
    blurb: "What relational databases are, tables, keys, types and NULL logic.",
    icon: "Database",
    accent: "#2f9e8f",
  },
  "sql-querying": {
    id: "sql-querying",
    subject: "sql",
    label: "Querying",
    order: 102,
    blurb: "SELECT, WHERE, ordering, operators and conditional expressions.",
    icon: "Search",
    accent: "#38ac9b",
  },
  "sql-aggregation": {
    id: "sql-aggregation",
    subject: "sql",
    label: "Aggregation & Grouping",
    order: 103,
    blurb: "GROUP BY, aggregate functions, HAVING and window functions.",
    icon: "Sigma",
    accent: "#2a8f83",
  },
  "sql-joins": {
    id: "sql-joins",
    subject: "sql",
    label: "Joins & Sets",
    order: 104,
    blurb: "Inner and outer joins, self/cross joins and set operations.",
    icon: "GitMerge",
    accent: "#43b0a0",
  },
  "sql-subqueries": {
    id: "sql-subqueries",
    subject: "sql",
    label: "Subqueries & CTEs",
    order: 105,
    blurb: "Subqueries, correlated subqueries and common table expressions.",
    icon: "ListTree",
    accent: "#268076",
  },
  "sql-ddl": {
    id: "sql-ddl",
    subject: "sql",
    label: "Schema Design (DDL)",
    order: 106,
    blurb: "CREATE/ALTER/DROP, constraints, normalization and ER modeling.",
    icon: "Table2",
    accent: "#4fb7a8",
  },
  "sql-dml-transactions": {
    id: "sql-dml-transactions",
    subject: "sql",
    label: "DML & Transactions",
    order: 107,
    blurb: "INSERT/UPDATE/DELETE, ACID, isolation levels and locking.",
    icon: "ArrowLeftRight",
    accent: "#1f736b",
  },
  "sql-indexing": {
    id: "sql-indexing",
    subject: "sql",
    label: "Indexing & Performance",
    order: 108,
    blurb: "Indexes and B-trees, EXPLAIN, index tradeoffs and SQL vs NoSQL.",
    icon: "Gauge",
    accent: "#57c0b0",
  },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  junior: { label: "Junior", color: "#98abce" },
  mid: { label: "Mid", color: "#4d6699" },
  senior: { label: "Senior", color: "#28344c" },
};
