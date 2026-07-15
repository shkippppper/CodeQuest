import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "sql-acid",
  title: "Transactions & ACID",
  category: "sql-dml-transactions",
  difficulty: "mid",
  order: 2,
  summary: "Group statements into all-or-nothing transactions, and the four ACID guarantees that make them safe.",
  est: 11,
  tags: ["transaction", "ACID", "COMMIT", "ROLLBACK", "atomicity"],
};

export default meta;
