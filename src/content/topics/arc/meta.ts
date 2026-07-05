import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "arc",
  title: "Automatic Reference Counting",
  category: "memory",
  difficulty: "mid",
  order: 1,
  summary: "How ARC tracks strong references at compile time to deallocate class instances deterministically.",
  est: 12,
  tags: ["ARC", "reference counting", "deinit", "memory", "deallocation"],
};

export default meta;
