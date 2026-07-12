import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "chat-transport-mcq",
    type: "mcq",
    prompt: "Why does a chat feature use a WebSocket instead of polling the server every few seconds?",
    options: [
      "A WebSocket is a single persistent connection the server can push through instantly, avoiding both wasted idle requests and polling delay",
      "WebSockets are encrypted and HTTP requests are not",
      "Polling is not supported on mobile networks",
      "WebSockets use less battery than any HTTP request",
    ],
    answer: 0,
    explanation:
      "Polling wastes requests on idle screens and still adds up to the polling interval of latency. A WebSocket stays open so the server can push a message the instant it exists.",
  },
  {
    id: "chat-socket-guarantee-predict",
    type: "predict",
    prompt: "A user taps send, and the WebSocket connection drops one second later with no error surfaced. What can the client conclude?",
    code: `task.send(.string(messageJSON)) { error in
    // called if the local write to the socket fails,
    // NOT if the server never received it
}
socket.disconnect() // happens moments later, unrelated callback`,
    options: [
      "Nothing — the message may or may not have reached the server before the drop",
      "The message definitely was not delivered",
      "The message definitely was delivered",
      "The socket automatically retries and guarantees delivery",
    ],
    answer: 0,
    explanation:
      "A dropped connection tells you nothing about what the server received before the drop. This uncertainty is exactly why chat systems need idempotent retries rather than trusting the transport alone.",
  },
  {
    id: "chat-ordering-fill",
    type: "fill",
    prompt: "Chat messages should be ordered by a server-assigned sequence number, not by each device's own ___.",
    answers: ["clock", "timestamp", "client timestamp", "local clock"],
    hint: "The thing that disagrees across different phones.",
    explanation:
      "Client clocks drift and disagree across devices. Ordering by the server's monotonically increasing sequence number keeps everyone's view of the conversation consistent.",
  },
  {
    id: "chat-idempotency-mcq",
    type: "mcq",
    prompt: "Why does every outgoing message get a client-generated id before it's ever sent to the server?",
    options: [
      "So a retried send can be recognized by the server as a duplicate and safely ignored instead of creating a second message",
      "So the UI can sort messages alphabetically",
      "So the server can bill the user per message",
      "Because UUIDs are required by the WebSocket protocol",
    ],
    answer: 0,
    explanation:
      "The client-generated id makes sends idempotent: replaying the same send after a dropped response or app kill lets the server recognize it already has that message and no-op instead of duplicating it.",
  },
  {
    id: "chat-delivery-states-multi",
    type: "multi",
    prompt: "Select all statements that are true about the message delivery-state machine (sending / sent / delivered / read / failed).",
    options: [
      "The UI's checkmarks are a direct rendering of this state, not a separate piece of logic",
      "A message can move from `.sending` back to `.sending` safely after an app relaunch, because sends are idempotent",
      "`.delivered` means the server has assigned a `serverSeq`, nothing more",
      "`.failed` should be a dead end with no retry path",
    ],
    answers: [0, 1],
    explanation:
      "The state drives the UI directly. Re-sending a `.sending` message after relaunch is safe because of idempotency. `.sent` (not `.delivered`) is what server acknowledgment with a `serverSeq` means — `.delivered` requires the recipient's device confirming receipt. `.failed` should offer a retry, not be a dead end.",
  },
  {
    id: "chat-persistence-mcq",
    type: "mcq",
    prompt: "Why does the chat screen read from a local database instead of rendering incoming WebSocket frames directly?",
    options: [
      "So the UI shows the same content whether online or offline, and can paint sent messages instantly before the server responds",
      "Because WebSocket frames can't contain text",
      "Because SwiftUI cannot bind to a socket",
      "To reduce the number of messages the server sends",
    ],
    answer: 0,
    explanation:
      "The database is the source of truth for the UI. It enables instant optimistic rendering on send and lets a reopened, offline conversation still show everything previously synced.",
  },
  {
    id: "chat-sync-cursor-fill",
    type: "fill",
    prompt: "When a client catches up after being offline, it asks the server for messages since its last-known server sequence — this kind of marker is called a ___.",
    answers: ["cursor"],
    hint: "Contrast with paging by a numbered offset like 'page 4'.",
    explanation:
      "A cursor points at 'everything already seen' and keeps working correctly even as new messages arrive, unlike an offset-based page number.",
  },
  {
    id: "chat-presence-vs-messages-senior",
    type: "predict",
    prompt: "🧠 A senior engineer proposes writing every 'typing' event to the local database and retrying it through the outbox like a message. What's the strongest objection?",
    code: `// proposal: treat PresenceEvent.typing exactly like Message
outbox.enqueue(typingEvent.id)`,
    options: [
      "Presence is ephemeral and doesn't need durability — the engineering cost of persistence and retries isn't worth it for data that's stale within seconds",
      "The database schema can't store enum values",
      "WebSockets can't carry presence events, only messages",
      "It would violate the client-generated id requirement",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Presence and typing indicators are explicitly not required to be reliable — a dropped update just means a stale indicator that self-clears via timeout. Spending message-grade durability and retry logic on it is wasted effort better spent on delivery guarantees that actually matter.",
  },
  {
    id: "chat-outbox-senior-mcq",
    type: "mcq",
    prompt: "The app flushes its outbox twice in quick succession after a flaky reconnect (two reachability callbacks fire close together). What keeps this from creating duplicate messages?",
    options: [
      "Sends are idempotent on the client-generated message id, so the server recognizes and ignores the second copy of an already-received message",
      "The outbox uses a database lock that prevents a second flush from running at all",
      "The server rejects any two requests sent within one second of each other",
      "Duplicate messages are expected and get deduplicated by the UI at render time",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Because every message carries a stable client-generated id, the server can safely no-op a duplicate delivery. This is the same idempotency property that makes app-kill recovery and offline queuing safe, applied here to a double-flush race.",
  },
  {
    id: "chat-flashcard",
    type: "flashcard",
    prompt:
      "Explain how you'd design chat message reliability end to end: transport, ordering, persistence, and offline. Answer aloud, then reveal.",
    modelAnswer:
      "Use a **WebSocket** for realtime push, with **exponential backoff** reconnection so clients don't hammer a struggling server. Never trust the socket alone — a dropped connection tells you nothing about what the server received, so every message carries a **client-generated id** created before the network call, making sends **idempotent**: a retry after a dropped response, an app kill, or a flaky double-flush is recognized by the server as a duplicate and safely ignored rather than creating a second message. Order is decided by the server, not client clocks — each accepted message gets a **monotonically increasing sequence number**, and clients sort by that. Locally, a database is the single source of truth the UI renders from, not the socket directly: sends are written and shown **optimistically** before the server confirms, and a `.failed` state offers retry. An **outbox** queue tracks messages still waiting to leave the device and flushes when connectivity returns. Catching up after a gap uses **sync**: fetch everything since the last-known server sequence — a **cursor**, which stays correct as new messages keep arriving, unlike an offset page number. Presence and typing are the one exception: they're **ephemeral**, ride the same socket, but skip persistence and retries entirely since a dropped 'typing' update just self-clears via a receiver-side timeout.",
    keyPoints: [
      "WebSocket + exponential backoff reconnection",
      "Client-generated id makes sends idempotent — safe to retry blindly",
      "Server-assigned sequence number, never client clocks, decides order",
      "Local database is the UI's source of truth; optimistic writes on send",
      "Outbox queues pending sends for offline/flaky-network flushing",
      "Sync after a gap uses a cursor (last-seen sequence), not an offset",
      "Presence/typing are ephemeral — no persistence, no retry, self-healing timeout",
    ],
    explanation:
      "A senior answer leads with idempotency as the unifying design choice, keeps the database as the UI's source of truth, and explicitly draws the line between durable messages and disposable presence state.",
  },
];

export default quiz;
