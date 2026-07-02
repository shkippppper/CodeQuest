export type Difficulty = "junior" | "mid" | "senior";
export type CategoryId = "language" | "types" | "concurrency" | "ui" | "architecture";

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
  architecture: {
    id: "architecture",
    label: "iOS Architecture",
    order: 9,
    blurb: "App architecture, patterns, networking, persistence and testing.",
    icon: "Building2",
    accent: "#324363",
  },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; color: string }> = {
  junior: { label: "Junior", color: "#98abce" },
  mid: { label: "Mid", color: "#4d6699" },
  senior: { label: "Senior", color: "#28344c" },
};
