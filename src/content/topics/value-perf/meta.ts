import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "value-perf",
  title: "Value Types & Performance",
  category: "performance",
  difficulty: "senior",
  order: 8,
  summary: "How stack allocation, COW, existential boxing, and inlining combine to make value types fast — and how to actually measure it.",
  est: 12,
  tags: ["value types", "structs", "COW", "existentials", "inlining", "specialization"],
};

export default meta;
