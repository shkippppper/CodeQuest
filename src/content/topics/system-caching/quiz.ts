import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "caching-what-is",
    type: "mcq",
    prompt: "What is a cache, in the system-design sense used in this lesson?",
    options: [
      "A faster, closer copy of data whose real, authoritative version lives somewhere else",
      "Any dictionary or key-value store held in RAM regardless of its relationship to a backing source",
      "The persistent database that owns the data permanently and is the authoritative source of record",
      "A compressed, deduplicated archive of a file stored to save disk space on the device",
    ],
    answer: 0,
    explanation:
      "A **cache** is a disposable copy kept close (memory/disk) to avoid repeatedly asking the slower, authoritative source — usually the network.",
  },
  {
    id: "caching-layer-order-predict",
    type: "predict",
    prompt: "Given this cache-aside read, what happens on the very first call for a userID never seen before?",
    code: `func loadProfile(userID: String) async throws -> Profile {
    if let cached = memoryCache[userID] { return cached }
    if let onDisk = try? diskCache.read(userID) {
        memoryCache[userID] = onDisk
        return onDisk
    }
    let fresh = try await api.get("/users/\\(userID)")
    memoryCache[userID] = fresh
    try? diskCache.write(userID, fresh)
    return fresh
}`,
    options: [
      "Memory miss, disk miss, network fetch — then both memory and disk are backfilled",
      "Memory miss only — then it throws immediately because disk has nothing for an unseen key",
      "It bypasses all local layers and goes straight to the network call without checking memory or disk",
      "Disk is always checked first before memory, regardless of relative access speed or recency",
    ],
    answer: 0,
    explanation:
      "Cache-aside checks the fastest layer first. On a cold key, memory misses, disk misses, and the network fetch backfills both layers so the *next* read is instant.",
  },
  {
    id: "caching-aside-vs-write-through-fill",
    type: "fill",
    prompt: "In the ___ pattern, every write goes through the cache layer itself, which updates both the cache and the source together in the same call.",
    answers: ["write-through"],
    hint: "Two words, hyphenated, opposite of cache-aside.",
    explanation:
      "Write-through means the cache layer owns writes: it writes to the source and updates the cached copy atomically, so the app never has a stale cache for its own writes.",
  },
  {
    id: "caching-aside-delete-mcq",
    type: "mcq",
    prompt: "Why does a well-designed cache-aside write typically delete the cached entry instead of overwriting it with the new value?",
    options: [
      "Overwriting risks writing a subtly wrong shape (server-computed fields might differ); deleting is safe because the next read just re-fetches the real thing",
      "Deleting the cache entry is consistently measurably faster than overwriting it because the deletion path fully skips the serialization and encoding steps entirely",
      "Cache-aside is strictly a read-path optimization pattern by definition and specifies absolutely no write-path update behavior or invalidation semantics whatsoever",
      "NSCache's internal write API formally enforces deletion semantics on every write operation and will raise an NSException if the caller attempts to overwrite an existing key",
    ],
    answer: 0,
    explanation:
      "The server might recompute fields (like `updatedAt`) on write. Deleting the stale entry and letting the next read re-fetch guarantees correctness without guessing at the server's exact response shape.",
  },
  {
    id: "caching-ttl-tradeoff-multi",
    type: "multi",
    prompt: "Select **all** true statements about TTL-based (time-to-live) staleness control.",
    options: [
      "A TTL expires on a clock, not on the actual moment the underlying data changed",
      "Shortening the TTL eliminates staleness entirely with no cost",
      "Different fields on the same object can reasonably use different TTLs",
      "A TTL cache can answer a read entirely locally until the entry expires",
    ],
    answers: [0, 2, 3],
    explanation:
      "TTLs are a passive, clock-based approximation of freshness — shortening them only trades staleness for more network traffic, it doesn't remove the gap (option 2 is false). Per-field TTLs and local-only reads until expiry are both correct.",
  },
  {
    id: "caching-invalidation-strategies-flashcard",
    type: "flashcard",
    prompt: "Explain the three common cache invalidation triggers and the trade-off of each. Answer aloud, then reveal.",
    modelAnswer:
      "**Invalidation** is actively marking a cached value as no longer trustworthy, rather than waiting for it to passively expire. Three common triggers: (1) **time-based** — a **TTL** stamped at write time, simple but blind to when data actually changed; (2) **event-based** — your own app invalidates immediately after a write it made (e.g. delete-on-write in cache-aside), but it only knows about changes it caused itself; (3) **version/ETag-based** — the client asks the server on every read 'has this changed since I last saw it?' via a cheap header round-trip, which is the most robust because it doesn't guess and doesn't require the app to know about every place data could change, at the cost of always paying a network round-trip. Production systems typically layer all three: TTL as a coarse safety net, event-based invalidation for the app's own writes, and ETags for reads in between.",
    keyPoints: [
      "Time-based (TTL): passive, clock-driven, blind to real change events",
      "Event-based: app invalidates on its own writes; misses external changes",
      "Version/ETag: asks the source every read, cheap round-trip, most robust",
      "Real systems layer all three rather than picking just one",
    ],
    explanation:
      "A senior answer names all three triggers, explains why ETag/version checks are the most robust, and notes real systems combine them rather than relying on one.",
  },
  {
    id: "caching-source-of-truth-senior",
    type: "mcq",
    prompt: "An offline-first app queues local writes on disk before syncing them to the server. If deleting that local disk store would permanently lose data the server never received, what does that tell you about the disk store?",
    options: [
      "It isn't a cache — it's acting as a source of truth, and deleting it needs sync-engine-level safety, not cache-eviction logic",
      "It is still a perfectly normal disposable cache layer that can be freely evicted at any time like any other cache tier",
      "The unsynced pending writes should be moved into NSCache, which provides stronger durability guarantees than any custom disk store",
      "It reveals the TTL is configured too high, causing write entries to expire from the store before they have a chance to sync upstream",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A **source of truth** must survive eviction by definition — a cache is always safe to delete because the real data survives elsewhere. If deleting the local store loses real data, it has become a source of truth in disguise, and needs the durability guarantees of a sync engine, not a cache's disposability.",
  },
  {
    id: "caching-per-field-ttl-senior",
    type: "predict",
    prompt: "Trick question: should a user's own just-edited bio and a public follower count use the same cache TTL?",
    code: `// bio: user edits it and is shown it back immediately
// followerCount: shown on every profile view, changes constantly in the background`,
    options: [
      "No — the bio needs near-zero staleness (the user will notice their own edit not reflecting), while the follower count can tolerate minutes of staleness",
      "Yes — always use a single unified global TTL value that is applied uniformly to every cached field across the entire app for simplicity and operational consistency",
      "No — the follower count is actually the far more write-sensitive field that genuinely requires near-zero staleness, while the bio can safely remain stale for several hours",
      "TTLs are a concept that applies only to raw HTTP network-layer response caching and can never meaningfully be applied to individual model fields that are stored in local memory",
    ],
    answer: 0,
    explanation:
      "Staleness tolerance is a judgment call per field, not per app. A user notices instantly if their own saved edit looks unsaved, but nobody notices a follower count off by a few for a couple of minutes.",
  },
  {
    id: "caching-vs-caching-topic-mcq",
    type: "mcq",
    prompt: "How does this lesson's scope relate to the separate 'Caching Strategies' (NSCache/URLCache/LRU) lesson?",
    options: [
      "This lesson is the architecture layer above it — cache-aside/write-through, invalidation, and freshness policy — assuming you already know the on-device containers",
      "The two lessons cover entirely separate and completely unrelated topics with absolutely no meaningful conceptual connection or shared vocabulary between them at all",
      "This system-design architecture lesson fully renders both NSCache and URLCache obsolete by introducing clearly superior design-level architectural replacements for each of them",
      "URLCache is completely reframed throughout this lesson as a pure system-design architectural pattern rather than a concrete Foundation framework API, and it is discussed in substantial depth",
    ],
    answer: 0,
    explanation:
      "The Foundation-layer lesson covers the concrete on-device tools (NSCache, URLCache, LRU eviction). This lesson sits above that: the design decisions about when to trust a cached value and how to keep multiple layers consistent.",
  },
];

export default quiz;
