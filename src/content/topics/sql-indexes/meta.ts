import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "sql-indexes",
  title: "Indexes & B-Trees",
  category: "sql-indexing",
  difficulty: "mid",
  order: 1,
  summary: "An index is a sorted lookup structure that turns a slow full scan into a fast targeted seek.",
  est: 11,
  tags: ["index", "B-tree", "CREATE INDEX", "full scan"],
};

export default meta;
