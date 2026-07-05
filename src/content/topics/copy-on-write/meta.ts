import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "copy-on-write",
  title: "Value Semantics & Copy-on-Write",
  category: "memory",
  difficulty: "senior",
  order: 5,
  summary: "How Swift gives value types cheap copies — sharing a buffer until a mutation forces a real copy.",
  est: 14,
  tags: ["copy-on-write", "value semantics", "isKnownUniquelyReferenced", "COW", "performance"],
};

export default meta;
