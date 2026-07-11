import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "testing-async",
  title: "Testing Async & Concurrent Code",
  category: "testing",
  difficulty: "senior",
  order: 7,
  summary: "Writing deterministic tests for async functions, actors, and time-dependent code without sleeping or racing the scheduler.",
  est: 13,
  tags: ["async/await", "actors", "testing", "determinism", "flakiness"],
};

export default meta;
