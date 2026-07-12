import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "design-networking-layer",
  title: "Designing a Networking Layer",
  category: "system-design",
  difficulty: "senior",
  order: 6,
  summary:
    "Building a request layer from a single URLSession call up to an abstraction with auth refresh, retry/backoff, caching, a typed error model, and testability.",
  est: 15,
  tags: ["system design", "networking", "auth", "retry", "caching", "testability"],
};

export default meta;
