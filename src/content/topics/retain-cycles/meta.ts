import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "retain-cycles",
  title: "Retain Cycles",
  category: "memory",
  difficulty: "mid",
  order: 3,
  summary: "When two objects (or a closure and its owner) strongly reference each other, ARC can never free them.",
  est: 13,
  tags: ["retain cycle", "memory leak", "closure", "delegate", "weak"],
};

export default meta;
