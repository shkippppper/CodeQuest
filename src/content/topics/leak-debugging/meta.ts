import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "leak-debugging",
  title: "Leak & Retain-Cycle Debugging",
  category: "performance",
  difficulty: "mid",
  order: 2,
  summary: "Using the Memory Graph Debugger and the Leaks instrument to find, diagnose, and verify fixes for objects that never get freed.",
  est: 13,
  tags: ["memory graph debugger", "Leaks instrument", "retain cycle", "closures", "delegate"],
};

export default meta;
