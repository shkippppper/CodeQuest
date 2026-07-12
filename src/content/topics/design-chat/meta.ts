import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "design-chat",
  title: "Designing a Chat / Messaging System",
  category: "system-design",
  difficulty: "senior",
  order: 5,
  summary:
    "Walking a chat feature from a tapped send button to a synced, offline-capable message store: transport, ordering, persistence, and presence.",
  est: 16,
  tags: ["system design", "chat", "websocket", "sync", "offline", "presence"],
};

export default meta;
