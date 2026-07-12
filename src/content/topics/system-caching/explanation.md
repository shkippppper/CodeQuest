## The problem: the network is the slowest, flakiest part of your app

Say your app shows a user's profile: name, avatar, follower count.

```swift
func loadProfile(userID: String) async throws -> Profile {
    try await api.get("/users/\(userID)")
}
```

Every time the profile screen appears, this fires a request. On a good connection that's a few hundred milliseconds of blank screen. On a bad one — a subway, a flaky hotel Wi-Fi — it's seconds, or a failure. And if the user backs out and back in five times in a row, you just made five identical requests for data that almost certainly hasn't changed.

The fix is to keep a copy of the answer close by so you don't have to ask again. That copy is a **cache** — a faster, closer store that holds a copy of data owned somewhere else. This lesson is about the design decisions that come with adding one: where the copy lives, when you trust it, and when you throw it away.

## Cache layers: memory, disk, network

A read for the same profile can be satisfied from three different places, in order of speed:

```swift
// 1. In-memory cache — a dictionary living in RAM, gone when the process dies
var memoryCache: [String: Profile] = [:]

// 2. On-disk cache — survives app relaunch, slower than memory
let diskCache: DiskStore<Profile>

// 3. Network — the real source, slowest, can fail
let api: APIClient
```

A read checks them in order, fastest first, and stops as soon as one has an answer:

```swift
func loadProfile(userID: String) async throws -> Profile {
    if let cached = memoryCache[userID] { return cached }
    if let onDisk = try? diskCache.read(userID) {
        memoryCache[userID] = onDisk   // promote it, so next time is instant
        return onDisk
    }
    let fresh = try await api.get("/users/\(userID)")
    memoryCache[userID] = fresh
    try? diskCache.write(userID, fresh)
    return fresh
}
```

Three things happened on that miss-then-fetch path: a memory miss, a disk miss, and finally a network fetch that backfills both layers on the way out. That backfill step — writing into the faster layers after a slow lookup — is the whole point of layering: the *next* read for this user never touches the network again.

This lesson is the layer above that dictionary-and-file mechanics: it's about *when* to trust a cached value and *how* to keep it consistent, not the low-level containers themselves. Swift's actual on-device tools for the memory and disk layers — `NSCache`, `URLCache`, and LRU eviction — have their own lesson; this one assumes you know they exist and focuses on the architecture wrapped around them.

## Cache-aside vs write-through

The code above is one specific pattern, and it's worth naming: **cache-aside** (also called lazy loading). The application checks the cache itself; on a miss, *it* fetches from the source and populates the cache. The cache is a passive lookup table that the app manages by hand.

```swift
// Cache-aside: the app owns both the read-miss path and the write path
func updateBio(userID: String, bio: String) async throws {
    try await api.patch("/users/\(userID)", ["bio": bio])
    memoryCache.removeValue(forKey: userID)   // don't update it — just drop it
}
```

Notice the write path doesn't update the cached copy — it deletes it. Writing the new value into the cache risks a subtly wrong shape (what if the server also updates `updatedAt` or recalculates a derived field?). Deleting is safe: the next read simply re-fetches the real thing.

The alternative is **write-through**: every write goes through the cache layer first, which immediately writes both the cache and the source together, so the cache is never stale after a write your own app made.

```swift
// Write-through: the cache layer itself owns writing to both places
protocol ProfileStore {
    func write(_ profile: Profile) async throws
}

struct WriteThroughProfileStore: ProfileStore {
    let cache: MemoryCache<Profile>
    let api: APIClient

    func write(_ profile: Profile) async throws {
        try await api.put("/users/\(profile.id)", profile)
        cache.set(profile.id, profile)   // update, in the same call
    }
}
```

Predict: which pattern is simpler to keep correct when *another client* — a different device, a different user — changes the same record on the server?

Answer: neither, fully. Write-through only keeps the cache correct for writes that go *through your own write-through store*. If another device edits the same profile, your cache is stale under both patterns until something invalidates it. Write-through solves "did my own write get reflected," not "is this data still fresh."

## Staleness vs freshness — how old is too old?

A cached value is never *wrong* the instant it's written — it's a snapshot. The question is how much time can pass before that snapshot is too old to trust. That gap between "not updated yet" and "no longer true" is **staleness**.

The simplest tool for managing it is a **TTL** — time-to-live, an expiry timestamp stamped on the cached entry at write time:

```swift
struct CacheEntry<T> {
    let value: T
    let expiresAt: Date
}

func loadProfile(userID: String) async throws -> Profile {
    if let entry = memoryCache[userID], entry.expiresAt > .now {
        return entry.value   // still fresh
    }
    let fresh = try await api.get("/users/\(userID)")
    memoryCache[userID] = CacheEntry(value: fresh, expiresAt: .now.addingTimeInterval(300))
    return fresh
}
```

Five minutes here is a judgment call, and it's the actual interview conversation: a follower count can tolerate minutes of staleness — nobody notices it's off by one for a bit. A user's own edited bio, shown right back to them after they save it, can tolerate zero staleness — they'll notice immediately if their own change appears to have not saved. Different fields on the same object can reasonably get different TTLs, or even different cache layers entirely.

TTLs alone have a failure mode worth naming: they expire on a *clock*, not on an *event*. If the data changes one second after you cached it, you serve stale data for the rest of the TTL window regardless of how short you set it. Shortening the TTL trades staleness for more network traffic — it doesn't fix the fundamental gap.

## Invalidation strategies

**Invalidation** is the act of telling the cache "that value is no longer good, stop serving it" — as opposed to waiting for a TTL to quietly expire. There are three common triggers:

```swift
// 1. Time-based: the TTL above — invalidation happens passively, by the clock

// 2. Event-based: something in your own app changed the data, so you invalidate now
func deleteAccount(userID: String) {
    memoryCache.removeValue(forKey: userID)
    diskCache.remove(userID)
}

// 3. Version/ETag-based: ask the server "has this changed since I last saw it?"
func loadProfile(userID: String) async throws -> Profile {
    let cachedETag = memoryCache[userID]?.etag
    let response = try await api.get("/users/\(userID)", ifNoneMatch: cachedETag)
    if response.status == .notModified {
        return memoryCache[userID]!.value   // server confirms: still good
    }
    // response has a fresh body + new ETag; cache both
    memoryCache[userID] = CacheEntry(value: response.body, etag: response.etag)
    return response.body
}
```

That third one is the most robust of the three, and it's worth understanding why: it doesn't guess how long data stays fresh, and it doesn't require your app to know about every place the data could change. It asks the actual source of truth on every read, cheaply — an ETag check is a tiny header round-trip, not a full payload download. The trade is that it still costs a network round-trip per read, just a cheap one, whereas a pure TTL cache can answer entirely locally until it expires.

The named cache-invalidation strategies — cache-aside's delete-on-write, write-through's update-on-write, TTL expiry, and ETag revalidation — aren't mutually exclusive. A production system typically layers them: TTL as a coarse safety net, event-based invalidation for writes your own app makes, and ETags for the reads in between.

## Single source of truth

Here's the design principle that ties the whole lesson together: a cache should never be the place where the "real" answer lives. There must be exactly one **source of truth** — one place whose data is authoritative — and every cache is a disposable, rebuildable copy of it.

```swift
// The server's database is the source of truth.
// The on-device disk cache is a local mirror the app can rebuild from the server at any time.
// The in-memory dictionary is a mirror of the mirror, rebuildable from disk.
```

Test this with a thought experiment: what happens if you delete the entire in-memory cache, right now, mid-session? Answer: nothing bad, just a few slower reads while it refills from disk or network. Now ask the same question about the on-device disk cache in an offline-first app that queues writes locally before syncing. If deleting it loses data the server never received, it wasn't a cache — it was a source of truth wearing a cache's name.

This distinction is the practical difference between "caching" and "local persistence," and interviewers probe it directly: a cache is always safe to evict, because the real data survives elsewhere. If evicting your local store can lose data, you're doing sync-engine design (its own lesson), not caching.

## Common pitfalls

- **Writing the new value straight into the cache on every mutation.** Safer to delete-and-refetch (cache-aside) unless you're certain the write-through copy matches exactly what the server will compute and return.
- **One global TTL for every field.** A follower count and a payment balance don't deserve the same staleness budget — pick per-field, not per-app.
- **Treating a disk cache as durable storage.** If losing it silently drops user data instead of just costing a re-fetch, it's not a cache — rename the abstraction and treat it with sync-engine rigor.
- **Invalidating only on your own app's writes.** A cache that never learns about server-side or other-device changes just gets staler over time; pair event-based invalidation with a TTL ceiling or ETag check.

## Interview lens

If asked to design caching for a feature, start by naming the layers out loud: what's in memory, what's on disk, and what's the network source of truth. Interviewers want to see you separate "how fast can I answer" from "who owns the real answer" — that's the single-source-of-truth framing.

When asked cache-aside vs write-through, give the real trade: cache-aside is simpler and self-healing (a bad cache entry just gets refetched on miss), write-through keeps the cache warm and consistent for the app's own writes but adds complexity and can drift if anything outside that write path changes the data.

For staleness, don't just say "use a TTL" — name what field you're caching and justify the number. A senior answer picks different staleness tolerances for different data (follower count vs a user's own just-saved edit) rather than one blanket cache policy, and mentions ETag/version-based revalidation as the strategy that scales better than guessing a TTL.
