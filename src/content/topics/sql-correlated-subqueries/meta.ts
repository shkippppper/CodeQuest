import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "sql-correlated-subqueries",
  title: "Correlated Subqueries",
  category: "sql-subqueries",
  difficulty: "senior",
  order: 2,
  summary: "A subquery that references the outer row and re-runs per row — the basis of EXISTS and per-row comparisons.",
  est: 12,
  tags: ["correlated", "EXISTS", "NOT EXISTS", "subquery"],
};

export default meta;
