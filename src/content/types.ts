export type Difficulty = "junior" | "mid" | "senior";
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
  | "cs-fundamentals";

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

export interface CategoryInfo {
  id: CategoryId;
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
    label: "Swift Language",
    order: 1,
    blurb: "The core language: types, optionals, protocols, generics, memory.",
    icon: "Braces",
    accent: "#6d85b4",
  },
  types: {
    id: "types",
    label: "Type System & POP",
    order: 2,
    blurb: "Protocols, generics, associated types, and Swift's protocol-oriented design.",
    icon: "Shapes",
    accent: "#98abce",
  },
  memory: {
    id: "memory",
    label: "Memory Management",
    order: 3,
    blurb: "ARC, ownership, retain cycles, and value semantics from stack to heap.",
    icon: "MemoryStick",
    accent: "#5d76a8",
  },
  concurrency: {
    id: "concurrency",
    label: "Concurrency",
    order: 4,
    blurb: "GCD, async/await, actors, Sendable and structured concurrency.",
    icon: "Workflow",
    accent: "#4d6699",
  },
  ui: {
    id: "ui",
    label: "SwiftUI & UIKit",
    order: 5,
    blurb: "Building interfaces: state, layout, lifecycle and the view system.",
    icon: "LayoutDashboard",
    accent: "#3c527d",
  },
  reactive: {
    id: "reactive",
    label: "Combine & Reactive",
    order: 7,
    blurb: "Publishers, operators, subjects and bridging streams to async/await.",
    icon: "GitBranch",
    accent: "#7b90bb",
  },
  foundation: {
    id: "foundation",
    label: "Networking & Persistence",
    order: 8,
    blurb: "URLSession, Codable pipelines, Core Data, SwiftData and caching.",
    icon: "Database",
    accent: "#46608f",
  },
  architecture: {
    id: "architecture",
    label: "iOS Architecture",
    order: 9,
    blurb: "App architecture, patterns, networking, persistence and testing.",
    icon: "Building2",
    accent: "#324363",
  },
  solid: {
    id: "solid",
    label: "SOLID & Clean Code",
    order: 10,
    blurb: "The five SOLID principles plus the habits of maintainable code.",
    icon: "Ruler",
    accent: "#a5b5d3",
  },
  patterns: {
    id: "patterns",
    label: "Design Patterns",
    order: 11,
    blurb: "GoF and Cocoa patterns, written the way Swift actually uses them.",
    icon: "Puzzle",
    accent: "#64789f",
  },
  testing: {
    id: "testing",
    label: "Testing & Quality",
    order: 12,
    blurb: "XCTest, Swift Testing, test doubles and strategies that scale.",
    icon: "FlaskConical",
    accent: "#8fa2c6",
  },
  performance: {
    id: "performance",
    label: "Performance",
    order: 13,
    blurb: "Instruments, launch time, rendering hitches and memory efficiency.",
    icon: "Gauge",
    accent: "#55658b",
  },
  "system-design": {
    id: "system-design",
    label: "Mobile System Design",
    order: 14,
    blurb: "The senior round: feeds, sync engines, chat and networking layers.",
    icon: "Network",
    accent: "#2b3a55",
  },
  tooling: {
    id: "tooling",
    label: "Tooling & Ecosystem",
    order: 15,
    blurb: "SPM, the Xcode build system, signing, CI/CD and debugging tools.",
    icon: "Wrench",
    accent: "#718bb9",
  },
  "cs-fundamentals": {
    id: "cs-fundamentals",
    label: "CS Fundamentals",
    order: 16,
    blurb: "Data structures and algorithms for the coding rounds.",
    icon: "Binary",
    accent: "#8497c0",
  },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  junior: { label: "Junior", color: "#98abce" },
  mid: { label: "Mid", color: "#4d6699" },
  senior: { label: "Senior", color: "#28344c" },
};
