import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sync-source-of-truth",
    type: "mcq",
    prompt: "In an offline-first design, what is the \"source of truth\" that the UI reads from and trusts?",
    options: [
      "The local database — the server is a sync target, not the authority the UI blocks on",
      "The server, always, even if it means blocking the UI on a network call",
      "Whichever responded most recently, local or server",
      "There is no source of truth in offline-first design",
    ],
    answer: 0,
    explanation:
      "Offline-first inverts the usual assumption: the local database is authoritative for what the UI shows, and syncing to the server happens in the background. A design that blocks reads on the network isn't actually offline-first.",
  },
  {
    id: "sync-save-blocking",
    type: "predict",
    prompt: "A user has no network connection and taps save on a note. In the offline-first design from this lesson, what happens?",
    code: `func saveNote(_ note: Note) {
    var updated = note
    updated.syncState = .pendingUpdate
    updated.updatedAt = Date()
    localDB.save(updated)
}`,
    options: [
      "The save completes instantly regardless of connectivity, marked pendingUpdate for the sync engine to push later",
      "The function blocks until a network connection becomes available",
      "The save silently fails and the note is lost",
      "The app crashes because there is no network",
    ],
    answer: 0,
    explanation:
      "saveNote writes to the local database only — there's no network call in the critical path. The note is marked pendingUpdate so the sync engine can push it whenever connectivity returns.",
  },
  {
    id: "sync-change-tracking-fill",
    type: "fill",
    prompt: "Marking exactly which local records have changes the server hasn't seen yet, so a sync only has to touch what's different, is called change ___.",
    answers: ["tracking"],
    hint: "The word right after \"change\" in this lesson's section heading.",
    explanation:
      "Change tracking (here, the syncState field) lets the sync engine find only the records that actually changed, instead of re-uploading the entire local database every time.",
  },
  {
    id: "sync-pending-create-guard",
    type: "mcq",
    prompt: "Why does updateNoteText only upgrade syncState to pendingUpdate when it was already .synced, and leave a .pendingCreate note alone?",
    options: [
      "Because a note the server has never seen needs a create request, not an update — downgrading it to pendingUpdate would send the wrong kind of request",
      "Because .pendingCreate notes should never sync at all",
      "Because it has no effect either way",
      "Because .pendingUpdate always takes priority over .pendingCreate on the server",
    ],
    answer: 0,
    explanation:
      "A note the server has never received still needs to be created, not updated. Overwriting pendingCreate with pendingUpdate would tell the sync engine to send an update request for a record the server doesn't have yet.",
  },
  {
    id: "sync-conflict-multi",
    type: "multi",
    prompt: "Select **all** true statements about conflict resolution strategies for offline sync.",
    options: [
      "Last-write-wins is simple but can silently discard a real edit",
      "Server-authoritative resolution can silently erase a user's offline work",
      "Merge strategies can preserve both users' edits when the changes don't collide at the field level",
      "There is one universally correct conflict resolution strategy for every app",
    ],
    answers: [0, 1, 2],
    explanation:
      "LWW and server-authoritative both risk silently discarding real edits; merge strategies can combine non-colliding changes. Which one is correct depends on the data (personal vs. collaborative) — there's no universal answer.",
  },
  {
    id: "sync-lww-vs-merge-senior",
    type: "predict",
    prompt: "A single-user notes app and a collaborative shared shopping list both need conflict resolution. Should they use the same strategy?",
    code: `// Notes app: only the owner ever edits a note
// Shopping list: multiple people add/remove items concurrently`,
    options: [
      "No — last-write-wins is defensible for the low-stakes, single-user notes app, but a collaborative list needs a merge strategy so concurrent additions from different people aren't discarded",
      "Yes — last-write-wins is always the correct default for every data type",
      "Yes — server-authoritative is always correct regardless of collaboration",
      "No — the shopping list should disable sync entirely",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The right conflict strategy depends on what's being protected. For a single-user note, LWW's occasional data loss is a low-stakes trade for simplicity. For a collaborative list, discarding one person's concurrently-added item would be a real bug — a merge strategy is needed instead.",
  },
  {
    id: "sync-idempotency-fill",
    type: "fill",
    prompt: "Designing a request so that sending it twice has the same effect as sending it once — critical for safe retries — is called ___.",
    answers: ["idempotency", "idempotence"],
    hint: "The property that makes retries safe.",
    explanation:
      "Idempotency means a duplicate request (e.g. from a retry after a lost response) doesn't cause a duplicate effect on the server — usually achieved with a client-generated ID the server can recognize as already-processed.",
  },
  {
    id: "sync-idempotency-senior",
    type: "predict",
    prompt: "A create-note request succeeds on the server, but the success response is lost to a flaky connection before the client sees it. The sync engine retries. With server-generated IDs and no idempotency key, what happens?",
    code: `struct CreateNoteRequest: Encodable { let text: String }
// server generates a new id on every POST /notes it receives`,
    options: [
      "A duplicate note is created, because the server has no way to recognize the retry as the same request",
      "The server automatically detects and merges the duplicate",
      "The retry is a no-op because the client already has the note locally",
      "Nothing — server-generated IDs prevent duplicates by design",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Without a client-generated ID sent on every attempt, the server can't tell a retry apart from a genuinely new request, so it creates a second note. A client-generated ID sent with every retry lets the server recognize \"I've already processed this\" and return success without duplicating data.",
  },
  {
    id: "sync-flashcard",
    type: "flashcard",
    prompt:
      "Design an offline-first sync engine end to end: source of truth, sync loop, conflicts, retries, and the consistency guarantee it offers. Answer aloud, then reveal.",
    modelAnswer:
      "Make the **local database the source of truth** — the UI reads and trusts it directly, and every write (like `saveNote`) completes instantly with no network call in the critical path, marking the record with a **syncState** (synced / pendingCreate / pendingUpdate / pendingDelete) for **change tracking**. A background **sync engine** periodically finds every non-synced record and pushes just those changes to the server, rather than re-uploading everything. When the same record is edited on two offline devices, a **conflict** arises on sync; resolve it with a strategy chosen for the data — **last-write-wins** (simple, but can silently drop an edit) for low-collision personal data, a **merge** strategy for collaborative data where both edits should usually survive. Because a lost response makes a successful request look identical to a failed one to the client, every write request must be **idempotent** — typically via a client-generated ID sent on every retry — so the sync engine can retry aggressively without ever creating duplicate records. The guarantee this whole design offers is **eventual consistency**, not strong consistency: two offline devices can briefly disagree, but all pending changes converge to the same state once everyone's back online and conflicts are resolved — that trade is accepted deliberately in exchange for writes that never block on the network.",
    keyPoints: [
      "Local database is the source of truth; writes never block on network",
      "syncState per record enables change tracking so sync only pushes what's different",
      "Conflict strategy (LWW vs. merge vs. server-authoritative) chosen based on the data, not by default",
      "Idempotent requests (client-generated IDs) make retries safe against duplicate creation",
      "The model offered is eventual consistency, not strong consistency — a deliberate trade",
    ],
    explanation:
      "A senior answer explicitly names the consistency model being traded for (eventual, not strong) and justifies the conflict strategy against the specific data rather than defaulting to one universally.",
  },
];

export default quiz;
