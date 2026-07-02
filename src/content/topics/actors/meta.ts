import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "actors",
  title: "Actors & Data Isolation",
  category: "concurrency",
  difficulty: "senior",
  order: 5,
  summary: "How actors serialize access to mutable state to kill data races — plus reentrancy, nonisolated, and global actors.",
  est: 15,
  tags: ["actor", "isolation", "data race", "reentrancy", "nonisolated"],
};

export default meta;
