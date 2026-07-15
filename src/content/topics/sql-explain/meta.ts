import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "sql-explain",
  title: "EXPLAIN & Query Plans",
  category: "sql-indexing",
  difficulty: "senior",
  order: 2,
  summary: "Read the query plan EXPLAIN produces to see whether a query scans or seeks — and why it's slow.",
  est: 12,
  tags: ["EXPLAIN", "query plan", "seq scan", "index scan"],
};

export default meta;
