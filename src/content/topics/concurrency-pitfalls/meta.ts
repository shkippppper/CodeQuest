import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "concurrency-pitfalls",
  title: "Concurrency Pitfalls",
  category: "concurrency",
  difficulty: "senior",
  order: 10,
  summary: "Races, deadlocks, priority inversion, thread explosion, and how to catch them with the sanitizers.",
  est: 13,
  tags: ["race condition", "deadlock", "priority inversion", "thread explosion", "TSan"],
};

export default meta;
