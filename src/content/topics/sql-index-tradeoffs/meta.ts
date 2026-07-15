import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "sql-index-tradeoffs",
  title: "When Indexes Hurt",
  category: "sql-indexing",
  difficulty: "senior",
  order: 3,
  summary: "Indexes speed reads but slow writes and cost storage — plus selectivity and what silently defeats an index.",
  est: 12,
  tags: ["index tradeoffs", "selectivity", "write cost", "composite index"],
};

export default meta;
