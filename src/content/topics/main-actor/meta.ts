import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "main-actor",
  title: "MainActor & UI Threading",
  category: "concurrency",
  difficulty: "mid",
  order: 7,
  summary: "Why UI is main-thread only and how @MainActor guarantees it at compile time.",
  est: 12,
  tags: ["MainActor", "main thread", "UI", "isolation", "global actor"],
};

export default meta;
