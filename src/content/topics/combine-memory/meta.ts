import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "combine-memory",
  title: "Memory Management in Combine",
  category: "reactive",
  difficulty: "mid",
  order: 5,
  summary: "Storing AnyCancellable tokens safely and avoiding the retain cycles sinks and operators quietly create.",
  est: 11,
  tags: ["Combine", "AnyCancellable", "retain cycle", "weak self", "cancellation"],
};

export default meta;
