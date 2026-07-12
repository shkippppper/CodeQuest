## The problem: what happens when "save" has no network to save to?

A notes app: the user types a note with no internet connection, then closes the app. What should happen?

If "save" means "send to the server," there's nothing to send to, and the note is gone. An **offline-first** app inverts that assumption: every write goes to a local database first, always succeeds instantly regardless of connectivity, and syncing to the server becomes a background concern instead of a blocking one. This lesson designs that sync engine, piece by piece, starting from the one decision everything else depends on: where does the "real" data live?

## Local source of truth

The foundational decision in offline-first design is this: the local database is the **source of truth** — the thing the UI reads from and trusts — not a cache of the server. The server is a sync target, not the authority the app defers to on every read.

```swift
struct Note: Codable {
    let id: UUID
    var text: String
    var updatedAt: Date
    var syncState: SyncState        // synced, pendingCreate, pendingUpdate, pendingDelete
}

enum SyncState: String, Codable {
    case synced, pendingCreate, pendingUpdate, pendingDelete
}
```

That `syncState` field is what makes this design offline-first rather than just "an app with a cache." Every note carries its own sync status, so the UI can always answer "is this note only on my device, or has it made it to the server?" without asking the network.

Saving a note now looks like this, with no network call in the critical path at all:

```swift
func saveNote(_ note: Note) {
    var updated = note
    updated.syncState = .pendingUpdate
    updated.updatedAt = Date()
    localDB.save(updated)      // returns instantly — this is the entire "save" operation
}
```

The function returns the moment the local write completes. Whether the device is online, in airplane mode, or has zero bars underground makes no difference to this line — that's the whole point of putting the local database first.

## Sync engine

Something still has to notice `pendingUpdate` notes and actually send them. That's the **sync engine**: a background process that periodically (or on connectivity change) finds everything not yet `synced` and pushes it.

```swift
func runSync() async {
    let pending = localDB.fetch(where: \.syncState != .synced)
    for note in pending {
        switch note.syncState {
        case .pendingCreate, .pendingUpdate:
            try? await pushToServer(note)
        case .pendingDelete:
            try? await deleteOnServer(note.id)
        case .synced:
            continue
        }
    }
}
```

This loop is intentionally dumb — it doesn't try to be clever about ordering or batching yet. Its only job is: find local changes the server doesn't know about, and tell the server. Everything else in this lesson is about making that simple loop survive the real world: conflicting edits, partial failures, and duplicate sends.

## Change tracking

`runSync` needs to know *what* changed without re-sending everything every time. Re-uploading the entire local database on every sync would work, but it wastes bandwidth and doesn't scale past a handful of records.

The `syncState` field from the source-of-truth section is already doing this job — it's a form of **change tracking**: marking exactly which records have local changes the server hasn't seen, so sync only touches what's different.

```swift
func updateNoteText(_ id: UUID, newText: String) {
    var note = localDB.fetch(id: id)!
    note.text = newText
    note.updatedAt = Date()
    if note.syncState == .synced {
        note.syncState = .pendingUpdate    // first local edit since last sync
    }
    // if already .pendingUpdate or .pendingCreate, leave it — still needs to go up
    localDB.save(note)
}
```

The `if` guard matters: a note that's already `pendingCreate` (never synced at all) should stay `pendingCreate`, not get downgraded to `pendingUpdate` — the server doesn't have a copy to "update" yet, it needs a create. Change tracking at this granularity (per-field would be even finer, per-record is usually enough) is what keeps `runSync` cheap regardless of how large the local database grows.

## Conflict resolution

Now the hard part. The same note gets edited offline on a phone *and* on a tablet, and both come back online. The server ends up receiving two different versions of the same note. Which one wins?

```swift
// Phone, offline:  note.text = "Buy milk"        (updatedAt: 10:02)
// Tablet, offline: note.text = "Buy milk and eggs" (updatedAt: 10:05)
// Both sync once back online — server now has two conflicting versions
```

There's no universally correct answer here — it's a product decision as much as an engineering one, and the framework lesson's advice applies directly: pick a strategy and justify it against a requirement. Three common strategies:

- **Last-write-wins (LWW).** Compare `updatedAt` and keep the newer one. Simple to implement, and correct enough for low-collision data like personal notes — but it silently discards the loser's edit, which is unacceptable for something like a shared shopping list where both edits were meaningful.
- **Server-authoritative.** The server always wins; the client's pending change is discarded or replayed on top of the server's version. Simple, but can silently erase a user's offline work.
- **Merge.** Combine both versions where possible (e.g. two people adding different items to the same list can both survive), falling back to LWW or a user prompt only for genuine field-level collisions.

For a single-user notes app, last-write-wins on `updatedAt` is a defensible default — the "requirement" it protects is simplicity, and the cost (losing the older edit) is rare and low-stakes for personal notes. A collaborative document editor would need the merge strategy instead, because the requirement — preserve everyone's edits — makes LWW's data loss unacceptable. Naming that dependency, exactly like the trade-off discussion in the framework lesson, is the answer an interviewer is listening for.

## Retry & idempotency

Predict: `pushToServer(note)` sends the request, the server saves it and returns success, but the response is lost to a flaky connection before the client sees it. What does the sync engine do next?

Answer: it retries — from the client's point of view, the request simply never got a response, so it looks identical to a failure. That means the same "create this note" request can hit the server twice.

```swift
struct CreateNoteRequest: Encodable {
    let clientGeneratedId: UUID   // generated on-device, sent with every retry of this create
    let text: String
}
```

The fix is **idempotency**: designing the request so that sending it twice has the same effect as sending it once. Here that means the client generates the note's ID *before* it ever talks to the server, and sends the same ID on every retry. The server then treats a create request with an ID it's already seen as a no-op success rather than creating a duplicate note.

```
Client generates id = UUID()
  → POST /notes {id, text}     -- times out, client doesn't know if it landed
  → retries: POST /notes {id, text}     -- same id
Server: "I already have a note with this id" → returns success, creates nothing new
```

Without idempotency, retry logic and duplicate data are two names for the same bug. With it, retrying is always safe, which is what lets the sync engine be as aggressive as it needs to be about retrying on any ambiguous failure.

## Consistency

Pull the pieces together and ask: what guarantee can this design actually make? Not **strong consistency** — a guarantee that every device sees the exact same data at the exact same instant — because that would require blocking writes on network availability, which directly violates the whole premise of offline-first.

What it offers instead is **eventual consistency**: every device's local data will converge to the same state *eventually*, once all pending changes have synced and any conflicts have been resolved, but at any given instant two offline devices can legitimately disagree. That's not a flaw to apologize for — it's the explicit trade being made in exchange for "save never blocks on the network," and it's worth stating as a deliberate choice rather than a limitation you're hoping nobody asks about.

## Common pitfalls

- **Treating the server as the source of truth while offline-first.** If the UI ever blocks on a network call to show "current" data, the design isn't actually offline-first — the local database has to be what the UI trusts.
- **Non-idempotent create requests.** Server-generated IDs plus a naive retry loop is the single most common way offline apps end up with duplicate records.
- **Silent last-write-wins with no product justification.** Losing a user's edit without them ever knowing is fine for some data and a real bug for other data — the choice needs a reason, not a default.

## Interview lens

If asked to design offline-first sync, open by stating the source-of-truth inversion explicitly: the local database is authoritative for the UI, and the server is a sync target — this one sentence tells the interviewer you're not just describing "a cache with retry logic."

When conflict resolution comes up, don't reach for last-write-wins reflexively. State the trade-off — simplicity and data loss on one side, correctness and complexity on the other — and pick based on what the data actually is: personal vs. collaborative, high-collision vs. low-collision.

If they push on reliability, bring up idempotency unprompted: any retry-based sync design that doesn't guarantee "send twice, effect once" will eventually create duplicate data, and client-generated IDs are the standard fix. And be ready to name the consistency model directly — offline-first means trading strong consistency for eventual consistency, and saying that trade out loud (rather than dodging the question) is exactly the senior signal this section is testing for.
