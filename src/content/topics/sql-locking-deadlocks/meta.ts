import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "sql-locking-deadlocks",
  title: "Locking & Deadlocks",
  category: "sql-dml-transactions",
  difficulty: "senior",
  order: 4,
  summary: "How locks enforce isolation, what a deadlock is, and how databases detect and you prevent them.",
  est: 12,
  tags: ["locking", "deadlock", "shared lock", "exclusive lock"],
};

export default meta;
