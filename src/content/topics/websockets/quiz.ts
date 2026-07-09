import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ws-why",
    type: "mcq",
    prompt: "Why choose a WebSocket over polling an endpoint every few seconds for live updates?",
    options: [
      "The server can push updates the instant they happen instead of the client repeatedly asking and mostly getting empty responses",
      "WebSockets don't require a server",
      "WebSockets are just a faster version of HTTP GET",
      "Polling is not possible with URLSession",
    ],
    answer: 0,
    explanation:
      "A WebSocket stays open and lets either side send at any time, so updates arrive with near-zero latency instead of waiting for the next poll — and without wasting requests on empty responses.",
  },
  {
    id: "ws-resume-predict",
    type: "predict",
    prompt: "What happens after this code runs?",
    code: `let task = URLSession.shared.webSocketTask(with: url)
try await task.send(.string("hello"))`,
    options: [
      "The send likely fails or never connects — the task was created but never `.resume()`d, so the connection was never opened",
      "The message is queued and sent as soon as .resume() is called later automatically",
      "It works fine — resume() is not needed for WebSocket tasks",
      "It throws a compile-time error",
    ],
    answer: 0,
    explanation:
      "Like other URLSession tasks, a `URLSessionWebSocketTask` is created suspended. `.resume()` must be called to actually open the connection before sending or receiving will work.",
  },
  {
    id: "ws-message-fill",
    type: "fill",
    prompt: "`URLSessionWebSocketTask.Message` is an enum with two cases: `.string` for text and .___ for raw binary payloads.",
    answers: ["data"],
    hint: "Same case name Data(contentsOf:) suggests.",
    explanation:
      "`Message` has `.string(String)` for text frames (commonly JSON) and `.data(Data)` for binary frames.",
  },
  {
    id: "ws-receive-loop-mcq",
    type: "mcq",
    prompt: "Why does receiving WebSocket messages require a `while true { try await task.receive() }` loop instead of a single call?",
    options: [
      "Messages can arrive at any time, not in response to a specific request, so the loop keeps waiting for and handling the next one indefinitely",
      "receive() only works once per connection",
      "It's required to keep the TCP connection warm",
      "A single call always times out after one message",
    ],
    answer: 0,
    explanation:
      "Unlike a request/response call, a WebSocket message isn't tied to something you just asked for — the loop suspends on `receive()`, handles whatever arrives, and asks again, for as long as the socket stays open.",
  },
  {
    id: "ws-reconnect-heartbeat-multi",
    type: "multi",
    prompt: "Select all true statements about reconnection and heartbeats.",
    options: [
      "A dropped WebSocket connection does not automatically reconnect on its own — the app must retry",
      "A connection can appear open while the underlying TCP link is silently dead",
      "sendPing detects a dead connection by expecting a pong reply from the server",
      "Heartbeats are unnecessary once reconnection logic exists",
    ],
    answers: [0, 1, 2],
    explanation:
      "Reconnection and heartbeats solve different problems: reconnection handles a connection that visibly closed/errored; heartbeats catch a connection that looks open but is actually dead, which reconnection logic alone won't detect until something eventually times out.",
  },
  {
    id: "ws-asyncsequence-fill",
    type: "fill",
    prompt: "Wrapping a WebSocket's receive loop so callers can write `for try await message in socket` requires conforming to ___.",
    answers: ["AsyncSequence"],
    hint: "The protocol that powers for-await loops.",
    explanation:
      "Conforming to `AsyncSequence` (with an `AsyncIteratorProtocol` whose `next()` calls `task.receive()`) lets consumers iterate messages with `for try await`, hiding the raw socket API.",
  },
  {
    id: "ws-backpressure-predict",
    type: "predict",
    prompt: "What's the risk of this receive loop under a burst of fast-arriving messages?",
    code: `while true {
    let message = try await task.receive()
    Task { await handleSlowly(message) }   // fire-and-forget
}`,
    options: [
      "It can spawn an unbounded pile of concurrent tasks, since receive() keeps racing ahead without waiting for handleSlowly to finish",
      "It will deadlock immediately",
      "It's identical in behavior to awaiting handleSlowly inline",
      "Task {} automatically limits concurrency to the CPU core count",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Because handling happens in a detached `Task {}` instead of being awaited inline, `receive()` is called again immediately regardless of whether the previous message finished processing — breaking the natural backpressure and potentially spawning unbounded concurrent work under load.",
  },
  {
    id: "ws-backpressure-fix-senior",
    type: "mcq",
    prompt: "What's the standard fix for the fire-and-forget backpressure problem in a WebSocket receive loop?",
    options: [
      "Process each message inline with `await` (or bound concurrency explicitly, e.g. a fixed-size task group) so the next receive() naturally waits for the current message to finish",
      "Switch from .string messages to .data messages",
      "Call sendPing more frequently",
      "Remove the while true loop entirely",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Awaiting the handler inline restores the natural throttle: the loop can't ask for the next message until the current one is done. If genuine parallelism is needed, bound it explicitly rather than spawning an unlimited number of tasks.",
  },
  {
    id: "ws-flashcard",
    type: "flashcard",
    prompt: "Explain the full shape of a production WebSocket client: connecting, exchanging messages, staying alive, and streaming. Answer aloud, then reveal.",
    modelAnswer:
      "Open a connection with `URLSession.shared.webSocketTask(with:)` and call **`.resume()`** — like other URLSession tasks it starts suspended. Send with **`task.send(.string(...))`** or `.data(...)`, typically JSON-encoded via `Codable`. Receive with a **loop**: `while true { try await task.receive() }`, since messages arrive independently of anything you asked for, usually run in its own `Task` separate from sending. Because a socket can drop for reasons unrelated to your code (network switch, server restart, idle proxy timeout), wrap connect+receive in **reconnection** logic with backoff, and send periodic **`sendPing`** heartbeats to catch a connection that looks open but is actually dead. For a clean API, wrap the receive loop as an **`AsyncSequence`** so callers use `for try await message in socket` instead of touching the raw task. Watch **backpressure**: the loop's natural suspend-then-receive-again shape throttles consumption automatically, but spawning a detached `Task` per message for handling breaks that throttle and can pile up unbounded concurrent work — keep handling inline (or explicitly bound any parallelism).",
    keyPoints: [
      "webSocketTask(with:).resume() opens the connection; send/receive work on the same task",
      "Receive requires a persistent loop — messages arrive independently of requests",
      "Reconnection (backoff) handles visible drops; heartbeats (sendPing) catch silently-dead connections",
      "AsyncSequence wrapping hides the raw receive loop behind for try await",
      "Backpressure = the loop naturally waits for the current message before pulling the next; fire-and-forget Task{} per message breaks that",
    ],
    explanation:
      "A senior-level answer covers the full lifecycle — connect, send, receive loop, resilience (reconnect + heartbeat), a clean streaming API, and the backpressure hazard — not just the happy-path send/receive calls.",
  },
];

export default quiz;
