import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "command",
  title: "Command",
  category: "patterns",
  difficulty: "senior",
  order: 12,
  summary: "Turning an action into an object so it can be queued, logged, undone, and redone.",
  est: 12,
  tags: ["command", "undo", "redo", "queue", "action"],
};

export default meta;
