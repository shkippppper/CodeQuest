import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "ownership-noncopyable",
  title: "Noncopyable Types & Ownership",
  category: "memory",
  difficulty: "senior",
  order: 8,
  summary:
    "Types that can't be copied (~Copyable), and the borrowing/consuming ownership model that makes them safe for unique resources.",
  est: 13,
  tags: ["noncopyable", "ownership", "borrowing", "consuming"],
};

export default meta;
