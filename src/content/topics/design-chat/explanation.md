## The problem: a message has to survive a bad network

Start with the smallest possible chat feature — a text field and a send button:

```swift
func send(text: String) {
    api.postMessage(text)
}
```

Tap send on a subway platform with one bar of signal and this breaks in three different ways: the request might never leave the device, it might arrive at the server but the response gets lost, or it might arrive twice because the app retried. The user just sees "did my message send or not?" A real chat feature has to answer that question with confidence, even offline, even on a flaky connection, even if the app gets killed mid-send.

This lesson designs that feature piece by piece: how messages travel in real time, how you keep everyone's message order consistent, what you store on-device, how a fresh install catches up, how you show "Ada is typing…", and what happens with no network at all.

## Realtime transport: why polling doesn't scale

The naive way to get new messages is to ask the server on a timer:

```swift
Timer.scheduledTimer(withTimeInterval: 3, repeats: true) { _ in
    api.fetchNewMessages(since: lastMessageId)
}
```

This works for a demo. In production it means every idle chat screen hammers your server every three seconds, and even at three seconds a reply still takes up to three seconds to appear — too slow to feel like "chat."

What you want instead is a connection the *server* can push through the moment a message exists. That's a **WebSocket** — a single TCP connection, upgraded from an HTTP request, that stays open and lets either side send data at any time without a new request each time:

```swift
let task = urlSession.webSocketTask(with: chatURL)
task.resume()
task.receive { result in
    // called every time the server pushes a frame
}
```

The server holds one open socket per connected client. The instant Ada's friend sends a message, the server writes it straight down Ada's socket — no polling delay, no wasted requests while the screen sits idle.

### What a socket doesn't give you for free

A WebSocket delivers bytes in order over one connection, but it does *not* guarantee the message survives if that connection drops. Mobile networks drop connections constantly — a subway tunnel, a wifi-to-cellular handoff, the app backgrounding. If the socket dies mid-send, the client has no idea whether the server received the message before the drop.

That single fact — *the transport can silently fail* — is why the rest of this lesson exists. Everything from here on is about building certainty on top of an uncertain pipe.

### Reconnection strategy

When the socket drops, reconnecting immediately in a loop can make things worse — a server having trouble gets hit by every disconnected client retrying at once. The standard fix is **exponential backoff**: wait a little longer after each failed attempt, with some randomness mixed in so clients don't all retry in lockstep.

```swift
var attempt = 0
func reconnect() {
    let delay = min(30, pow(2.0, Double(attempt))) + Double.random(in: 0...1)
    attempt += 1
    DispatchQueue.main.asyncAfter(deadline: .now() + delay) { connectSocket() }
}
```

Each failure doubles the wait, capped at 30 seconds, with up to a second of random jitter added. A successful connection resets `attempt` back to 0. This same pattern reappears later in this lesson's sibling topic on networking layers — it isn't chat-specific.

## Message ordering & delivery state: what "sent" actually means

Picture two people typing at once. Ada's phone sends "lunch?" and, half a second later, her friend's phone sends "omw" — but Ada's message takes an extra beat to reach the server because her connection is slower. If you order messages by *when the server received them*, that's consistent for everyone; ordering by *when the client sent them* is not, because clocks and networks disagree across devices.

The fix: the server is the single source of truth for order. Every message the server accepts gets a **monotonically increasing sequence number** (or a server-assigned timestamp) at the moment it's persisted, and every client sorts by that value, never by its own clock.

```swift
struct Message: Codable {
    let id: String          // client-generated UUID, for dedup
    let serverSeq: Int64?   // nil until the server assigns one
    let text: String
    let senderId: String
}
```

Notice `id` and `serverSeq` are different fields. `id` is created on the device the instant the user hits send, before any network call — you need *some* identifier to track the message locally while it's still in flight. `serverSeq` only exists once the server has accepted it. That gap between "has an id" and "has a serverSeq" is exactly the gap where delivery state lives.

### The delivery-state machine

Every message a user sends moves through a small set of states, and the UI (the single checkmark, double checkmark, "failed — tap to retry") is just a rendering of that state:

```swift
enum DeliveryState {
    case sending    // written locally, request in flight
    case sent       // server acknowledged, serverSeq assigned
    case delivered  // recipient's device confirmed receipt
    case read       // recipient opened the conversation
    case failed     // request errored or timed out
}
```

Predict: if the app is killed while a message is `.sending`, what should happen on next launch?

Answer: the client can't assume it failed — the server might have received it right before the kill. On relaunch, the client re-sends messages still marked `.sending` *using the same client-generated `id`*, and the server treats a duplicate `id` as a no-op if it already has that message. This is what makes retries safe — the technical term is **idempotency**: doing the same operation twice has the same effect as doing it once.

```swift
func send(_ message: Message) async {
    try? await api.postMessage(message)   // server dedupes on message.id
}
```

Without a stable client-generated id, a retried send would create a duplicate message instead of confirming the original one.

## Local persistence: the database is the real UI

Chat screens should never wait on the network to show you something. Every message that reaches the device — sent or received — is written to a local database first, and the UI reads from that database, not from the socket directly:

```swift
struct MessageStore {
    func insert(_ message: Message) throws { /* SQLite / SwiftData write */ }
    func messages(in conversationId: String, limit: Int) throws -> [Message] { /* query */ }
}
```

This gives you two things at once. First, instant UI: sending a message paints it on screen the moment it's typed (marked `.sending`), rather than after a round trip — this is the **optimistic update** pattern, showing the expected result before the server confirms it. Second, offline reading: reopening a conversation with no network still shows everything previously synced, because the screen was always reading local data.

```swift
func sendOptimistically(text: String) {
    let message = Message(id: UUID().uuidString, serverSeq: nil, text: text, senderId: me, state: .sending)
    try? store.insert(message)     // UI updates instantly from this write
    Task { await send(message) }   // network happens in the background
}
```

If `send` later fails, you update that same row's state to `.failed` and the UI shows a retry affordance — no new message, just a state change on the row that's already there.

## Sync & pagination: catching a device up

A phone that was offline for two days, or a fresh install logging into an existing account, needs to catch up on everything it missed. Fetching the *entire* conversation history on every launch doesn't scale, so sync is built around the same `serverSeq` you saw earlier:

```swift
func syncMissed(after lastKnownSeq: Int64) async throws -> [Message] {
    try await api.fetchMessages(conversationId: id, since: lastKnownSeq)
}
```

The client remembers the highest `serverSeq` it has stored, asks the server for anything newer, and appends the results. This is a **cursor** — a marker pointing at "everything I've already seen" — rather than an offset like "give me page 4," because new messages keep arriving and shifting what "page 4" would even mean. (The pagination topic in this course covers offset-vs-cursor tradeoffs in depth; chat sync always uses a cursor for exactly this reason.)

Scrolling *up* into older history is a second, separate kind of pagination — paging backward from the oldest message currently loaded, using that message's `serverSeq` as the cursor going the other direction. Keeping "sync forward from last-seen" and "page backward into history" as two distinct code paths, both keyed on the same `serverSeq`, avoids a whole category of off-by-one and duplicate-message bugs.

## Presence & typing: state that's fine to lose

Not everything in chat needs the durability of a message. "Ada is online" and "Ada is typing…" are **ephemeral state** — useful right now, worthless a minute from now, and not worth persisting or retrying if a single update is dropped.

```swift
enum PresenceEvent {
    case typing(userId: String, conversationId: String)
    case online(userId: String)
    case offline(userId: String)
}
```

These events ride the same WebSocket as messages but get different handling: no local database write, no retry queue, no delivery-state tracking. A dropped "stopped typing" event just means the indicator lingers a couple seconds too long — annoying, not a correctness bug. This asymmetry is deliberate: spending message-grade reliability engineering on presence would be wasted effort on data nobody needs a permanent record of.

A typing indicator also needs a timeout on the *receiving* side, independent of any "stopped typing" event ever arriving:

```swift
func didReceiveTyping(from userId: String) {
    showTyping(userId)
    scheduleHide(for: userId, after: 5)  // clears itself if no follow-up arrives
}
```

If the sender's app crashes mid-typing-indicator, the receiver's UI still self-heals after five seconds instead of showing "Ada is typing…" forever.

## Offline: queue, don't fail

Pull the earlier pieces together for the fully offline case. A user types a message with no connection at all:

```swift
func sendOptimistically(text: String) {
    let message = Message(id: UUID().uuidString, serverSeq: nil, text: text, senderId: me, state: .sending)
    try? store.insert(message)
    outbox.enqueue(message.id)   // new: track it as pending work
}
```

The **outbox** is a durable queue of messages waiting to be sent — separate from the message store itself, so the app has an explicit list of "what still needs to leave this device" rather than scanning every message for a `.sending` state. When connectivity returns:

```swift
func flushOutbox() async {
    for id in outbox.pendingIds() {
        guard let message = try? store.message(id: id) else { continue }
        if (try? await send(message)) != nil {
            outbox.remove(id)
        }
        // still fails? leave it queued, try again next flush
    }
}
```

This runs whenever the network path comes back (a reachability callback) and, as a safety net, on app foreground. Because sends are idempotent on the client-generated `id`, flushing the same outbox twice in a row — say, a flaky reconnect that triggers two flushes — never creates duplicate messages.

## Common pitfalls

- **Ordering by client timestamp.** Clocks disagree across devices; always sort by the server-assigned sequence.
- **No client-generated id.** Without one, a retried send after a dropped response becomes a duplicate message instead of a safe no-op.
- **Treating presence like messages.** Persisting and retrying "typing" events adds complexity for data that's supposed to be throwaway.
- **Reading straight from the socket.** A screen that renders directly off incoming socket frames shows nothing when offline; render from local storage instead.

## Interview lens

If asked to design chat, start by naming the three moving pieces before writing anything: a realtime transport (WebSocket, reconnecting with backoff), a local-first data model (database as the source of truth for the UI, socket as just a feed into it), and a sync protocol (a server-assigned sequence cursor, not client clocks) that reconciles the two after any gap.

When the interviewer pushes on reliability — and they will — lead with idempotency: a client-generated message id lets you safely retry, because the server can recognize "I already have this one" instead of creating a duplicate. That single design choice is what makes offline queuing, app-kill recovery, and flaky reconnects all safe to handle the same simple way — retry blindly, let the server dedupe.

If they ask what you'd cut under time pressure, presence and typing indicators are the right answer: they're explicitly not required to be reliable, so it's fine to skip persistence and retry logic for them and spend that budget on message delivery guarantees instead.
