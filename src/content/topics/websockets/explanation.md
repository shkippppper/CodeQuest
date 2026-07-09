## The problem: request/response can't tell you about the *next* thing

Everything in the URLSession lesson followed the same shape: send one request, get one response, done. That's fine for "give me the article list" — but it breaks down for "tell me the moment a new chat message arrives" or "stream live price updates." Polling `GET /messages` every two seconds works, but it's wasteful and laggy — most polls come back empty, and a real update might sit unseen for up to two seconds.

A **WebSocket** is a different kind of connection: instead of request-then-response-then-close, it opens once and stays open, letting *either side* send a message at any time. The server can push you a new chat message the instant it happens, with no polling.

## Opening a socket: URLSessionWebSocketTask

WebSockets in Foundation are built on the same `URLSession` you already know — just a different task type:

```swift
let url = URL(string: "wss://chat.example.com/socket")!
let task = URLSession.shared.webSocketTask(with: url)
task.resume()
```

Note the scheme: `wss://` (WebSocket-secure), the WebSocket equivalent of `https://` — a `ws://` connection is the unencrypted version, same relationship as `http://` to `https://`. Calling `.webSocketTask(with:)` creates a **`URLSessionWebSocketTask`**, and just like the completion-handler data tasks from the URLSession lesson, it starts suspended — `.resume()` is what actually opens the connection.

Once open, the task stays alive until you close it, the server closes it, or the connection drops. That persistent lifetime is the whole point: no new request needs to be issued for the server to talk to you.

## Sending a message

```swift
let message = URLSessionWebSocketTask.Message.string("hello")
try await task.send(message)
```

A **`Message`** is an enum with two cases — `.string` for text (typically JSON) and `.data` for raw binary. Most chat and live-update APIs send JSON text frames:

```swift
struct ChatMessage: Codable { let text: String }
let payload = try JSONEncoder().encode(ChatMessage(text: "hello"))
try await task.send(.data(payload))
```

Encode your model to `Data` with the `Codable` pipeline from the previous lesson, wrap it in `.data(...)`, and send — the same JSON pipeline, just delivered over a persistent socket instead of a one-shot request.

## Receiving: the loop that never stops

Sending is one call. Receiving is different, because messages can arrive at any time, not in response to anything you asked for. You get them with a loop:

```swift
while true {
    let message = try await task.receive()
    switch message {
    case .string(let text):
        print("received: \(text)")
    case .data(let data):
        print("received \(data.count) bytes")
    @unknown default:
        break
    }
}
```

`.receive()` suspends until the *next* message arrives — could be a millisecond later, could be an hour later — then returns it. Wrapping that in `while true` gives you a **receive loop**: as long as the socket is open, this loop keeps pulling the next message and handling it, one at a time, forever.

This loop typically runs in its own `Task`, separate from whatever code sends messages, since sending and receiving happen independently and shouldn't block each other:

```swift
let receiveTask = Task {
    while true {
        let message = try await task.receive()
        handle(message)
    }
}
```

Predict: what happens to this loop when the connection drops?

Answer: `task.receive()` throws, the `while true` loop exits (since the `throw` propagates out of the `Task`'s closure), and receiving silently stops — nothing tries again on its own. Handling that gracefully is the next problem.

## Reconnection and heartbeats

A WebSocket can drop for reasons that have nothing to do with your code: the phone switches from Wi-Fi to cellular, the server restarts, a proxy times out an idle connection. A production client needs to notice and recover.

**Reconnection** wraps the whole connect-and-receive-loop in retry logic:

```swift
func connectAndListen() async {
    while true {
        do {
            let task = URLSession.shared.webSocketTask(with: url)
            task.resume()
            try await receiveLoop(on: task)   // runs until it throws
        } catch {
            try? await Task.sleep(for: .seconds(2))   // wait, then reconnect
        }
    }
}
```

When `receiveLoop` throws — meaning the connection died — the `catch` waits briefly, then the outer `while true` loops around and opens a fresh socket. This is the same exponential-backoff idea from the retry logic in the REST lesson: don't hammer the server with instant reconnect attempts.

**Heartbeats** solve a subtler problem: a connection can look open while actually being dead — the TCP connection is silently broken, but neither side has noticed yet. A heartbeat is a small "are you still there?" message sent on a timer:

```swift
task.sendPing { error in
    if let error {
        print("ping failed, connection is dead: \(error)")
    }
}
```

`sendPing` sends a low-level WebSocket ping frame and calls back when the server's pong reply arrives — or fails to. Sending one every 20–30 seconds means a dead connection gets detected (and reconnected) within seconds, instead of the app silently believing it's still listening for messages that will never come.

## Streaming with AsyncSequence

The manual `while true { try await task.receive() }` loop works, but it puts the socket's raw API in front of every caller. A cleaner shape wraps it as an **`AsyncSequence`** — a type you loop over with `for try await`, covered in its own lesson — so consuming messages looks like iterating any other sequence:

```swift
struct WebSocketMessages: AsyncSequence {
    typealias Element = URLSessionWebSocketTask.Message
    let task: URLSessionWebSocketTask

    struct AsyncIterator: AsyncIteratorProtocol {
        let task: URLSessionWebSocketTask
        mutating func next() async throws -> Element? {
            try await task.receive()
        }
    }
    func makeAsyncIterator() -> AsyncIterator { AsyncIterator(task: task) }
}
```

`next()` is called once per loop iteration by the consumer, and it just forwards to `task.receive()` — the same suspend-until-next-message behavior, now packaged behind the standard iteration protocol. A caller consumes it like this:

```swift
for try await message in WebSocketMessages(task: task) {
    handle(message)
}
```

Same behavior as the manual loop, but now the socket's transport details are hidden — callers just see "a sequence of messages arriving over time," which composes naturally with the rest of Swift's async tooling (`for try await`, `map`, cancellation via structured concurrency).

## Backpressure: what happens when messages arrive faster than you can handle them

The receive loop pulls one message, fully processes it, *then* asks for the next one — `task.receive()` isn't called again until the previous `await` returns. That built-in pause is what's called **backpressure**: the natural throttling that happens when a consumer only asks for more work once it's ready for it, rather than the producer force-feeding it as fast as data arrives.

Where this gets dangerous is when you *break* that natural pause — for example, spawning an unstructured `Task` per message instead of awaiting the work inline:

```swift
// dangerous: doesn't wait for handling to finish before receiving again
while true {
    let message = try await task.receive()
    Task { await handleSlowly(message) }   // fire-and-forget
}
```

Now the receive loop races ahead of processing: if messages arrive faster than `handleSlowly` finishes, you spawn an unbounded pile of concurrent tasks, each holding memory, with no limit on how many pile up. Under a burst of fast incoming messages this can exhaust memory or overwhelm whatever `handleSlowly` touches (a database, the UI).

The fix is almost always to keep processing *inline* in the receive loop — `await handleSlowly(message)` directly, no `Task {}` — so the next `receive()` naturally waits until the current message is fully handled. If some messages genuinely need to be processed in parallel, bound the concurrency explicitly (e.g. a fixed-size task group or a semaphore) instead of spawning without limit.

## Common pitfalls

- **Forgetting `.resume()`.** Like other URLSession tasks, a WebSocket task starts suspended.
- **No reconnection logic.** A dropped connection just silently stops delivering messages unless you wrap the connect/receive cycle in a retry loop.
- **No heartbeat.** A "dead but still looks open" connection can go undetected for a long time without periodic pings.
- **Fire-and-forget processing in the receive loop.** Spawning an unstructured task per message defeats backpressure and can pile up unbounded work under load.

## Interview lens

If asked why you'd choose a WebSocket over polling, the answer is latency and efficiency: the server pushes updates the instant they happen, instead of the client repeatedly asking and mostly getting empty responses.

If asked how you'd build a production-grade WebSocket client, name all four pieces: a send/receive loop built on `URLSessionWebSocketTask`, reconnection with backoff when the loop throws, periodic heartbeat pings to catch a silently-dead connection, and — for senior-level polish — wrapping the receive loop as an `AsyncSequence` so consumers don't touch the transport directly.

If asked about backpressure specifically, the strong answer is that the receive loop's natural `await`-then-loop-again shape *is* backpressure — it only asks for the next message once it's done with the current one — and the way people break it is by spawning fire-and-forget tasks per message instead of awaiting inline, which removes that throttle and can pile up unbounded concurrent work.
