## The problem: fetching the same thing twice is wasteful

```swift
let image1 = try await downloadImage(url: avatarURL)   // 1.2s over the network
let image2 = try await downloadImage(url: avatarURL)   // same URL, same 1.2s again
```

Nothing here remembers that `avatarURL` was already downloaded once. Scroll a list up and down a few times and the same avatar gets fetched over and over — slow for the user, wasteful of battery and data.

A **cache** is a place that keeps a copy of something expensive to produce, so the next request can be answered instantly instead of redone from scratch:

```swift
var imageCache: [URL: UIImage] = [:]

func loadImage(url: URL) async throws -> UIImage {
    if let cached = imageCache[url] { return cached }   // instant
    let image = try await downloadImage(url: url)
    imageCache[url] = image
    return image
}
```

That dictionary works, but it has two problems real caches don't: it never shrinks under memory pressure, and it grows forever. The rest of this lesson is about the tools that fix both.

## NSCache: a dictionary that empties itself under pressure

```swift
let cache = NSCache<NSURL, UIImage>()

cache.setObject(image, forKey: url as NSURL)
let cached = cache.object(forKey: url as NSURL)
```

`NSCache` looks like a dictionary, but it behaves differently in one crucial way: when the system is low on memory, it can evict entries on its own, without you writing any cleanup code. A plain `Dictionary` never does that — every entry stays until you remove it yourself.

`NSCache` also takes hints about how much each entry is "worth," so eviction is smarter than random:

```swift
cache.countLimit = 100                 // evict once there are more than 100 entries
cache.totalCostLimit = 50_000_000      // evict once total "cost" exceeds ~50 MB
cache.setObject(image, forKey: url as NSURL, cost: image.pngData()?.count ?? 0)
```

The `cost` you pass in is just a number you choose — bytes is the common convention — and `NSCache` uses it to decide *which* entries to drop first when it needs to free space, favoring cheap, easily-recomputed entries staying while it clears out from the ones you marked as taking the most room.

One more difference from `Dictionary`: `NSCache` is thread-safe. Reading and writing from multiple threads at once doesn't need an external lock — the class handles it internally.

## Memory cache vs disk cache

`NSCache` lives in RAM, which makes it fast but temporary: a memory cache disappears the moment the app terminates, and every entry is gone on next launch. A **disk cache** writes data to a file instead, so it survives app restarts — at the cost of being slower to read, since it goes through the file system rather than RAM.

```swift
func cachePath(for url: URL) -> URL {
    let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
    return dir.appendingPathComponent(url.lastPathComponent)
}

try imageData.write(to: cachePath(for: url))
```

Most real image or network caches layer both: check the memory cache first (fastest), fall back to the disk cache (slower but still local), and only hit the network if neither has it.

```swift
func loadImage(url: URL) async throws -> UIImage {
    if let hit = memoryCache.object(forKey: url as NSURL) { return hit }
    if let diskData = try? Data(contentsOf: cachePath(for: url)),
       let image = UIImage(data: diskData) {
        memoryCache.setObject(image, forKey: url as NSURL)   // promote to memory
        return image
    }
    let image = try await downloadImage(url: url)
    memoryCache.setObject(image, forKey: url as NSURL)
    try? image.pngData()?.write(to: cachePath(for: url))
    return image
}
```

Notice the disk hit gets copied back into the memory cache — that's called *promotion*, and it means the second access to any given image, even after the memory cache was cleared, is fast again on the third.

## Cache invalidation

Predict: the server updates a user's avatar. The old avatar is still sitting in both caches under the same URL. What happens the next time the app asks for it?

Answer: the stale image, unless something tells the cache the entry is no longer valid. **Cache invalidation** is the general problem of knowing when a cached value has gone stale and needs to be refetched — it's famously one of the two hard problems in computer science, because there's no single correct answer for every case.

Three common strategies:

- **Time-based expiry** — stamp each entry with when it was stored, and treat it as stale after some duration (`Date().addingTimeInterval(300)` for a 5-minute cache).
- **Explicit invalidation** — the app knows exactly when data changed (the user just uploaded a new avatar) and removes that one entry directly.
- **Versioned keys** — bake a version or hash into the cache key itself (`"avatar-\(user.id)-\(user.avatarVersion)"`), so a changed avatar naturally misses the old entry instead of needing to be found and deleted.

```swift
imageCache.removeObject(forKey: url as NSURL)          // explicit invalidation
try? FileManager.default.removeItem(at: cachePath(for: url))
```

## URLCache and HTTP caching

Networking has its own built-in cache, and it's easy to get for free. `URLCache` sits underneath `URLSession` and stores HTTP responses according to the caching rules the *server* sends back in its response headers.

```swift
URLSession.shared.configuration.urlCache = URLCache(
    memoryCapacity: 20_000_000,
    diskCapacity: 100_000_000
)
```

A server response can include a `Cache-Control` header like `max-age=3600`, telling `URLCache` "this response is good for one hour — don't even ask the network again." Once that hour is up, `URLCache` can still send a conditional request with an `ETag` (a fingerprint the server generated for that response), and the server replies with a cheap "304 Not Modified" if nothing changed, instead of resending the whole body.

That means `URLCache` handles both time-based expiry and a lightweight form of revalidation automatically, driven by headers the server controls — you don't write eviction logic for it at all, unlike `NSCache` or a hand-rolled disk cache.

## LRU and eviction

When a cache hits its size limit, something has to go. **LRU** — least recently used — is the most common eviction policy: throw away whatever hasn't been touched in the longest time, on the theory that data used recently is likely to be used again soon.

```swift
final class LRUCache<Key: Hashable, Value> {
    private var capacity: Int
    private var store: [Key: Value] = [:]
    private var order: [Key] = []   // front = most recently used

    init(capacity: Int) { self.capacity = capacity }

    func get(_ key: Key) -> Value? {
        guard let value = store[key] else { return nil }
        touch(key)
        return value
    }

    func set(_ key: Key, _ value: Value) {
        if store[key] == nil, store.count >= capacity {
            let evicted = order.removeLast()   // least recently used
            store[evicted] = nil
        }
        store[key] = value
        touch(key)
    }

    private func touch(_ key: Key) {
        order.removeAll { $0 == key }
        order.insert(key, at: 0)
    }
}
```

Every `get` or `set` moves that key to the front of `order`; a `set` past capacity drops whatever's at the back — the one entry nobody has touched in the longest time. `NSCache`'s internal eviction uses a similar recency-and-cost-based heuristic, though Apple doesn't guarantee it's a strict LRU.

## Common pitfalls

- **Treating `NSCache` as persistent.** It's memory-only and can be cleared at any time under pressure — never use it as your only copy of data you can't refetch.
- **Never invalidating a cache.** A cache that's never cleared is just a memory leak with extra steps; always have a strategy — time, explicit, or versioned keys.
- **Forgetting `URLCache` respects the server's headers.** If a server sends `Cache-Control: no-store`, no client-side configuration will make `URLCache` store that response.
- **Building a custom LRU cache without a size cap.** Without a `capacity` check before insert, an "LRU cache" is just a list that grows forever.

## Interview lens

If asked "how would you cache network images?", the strong answer layers two caches: a fast, memory-only `NSCache` in front of a slower, persistent disk cache, checking memory first, disk second, network last — and promoting disk hits back into memory.

If asked about invalidation, name the three real strategies — time-based expiry, explicit invalidation when you know data changed, and versioned cache keys — rather than a vague "I'd clear it sometimes." Mentioning that cache invalidation is famously hard shows you understand there's a real trade-off, not a single right answer.

On eviction, be ready to say what LRU means in one sentence — evict whatever hasn't been used most recently — and that `NSCache`'s built-in behavior approximates this using cost and count limits you configure, so you rarely need to hand-roll an LRU cache unless you need precise control over the policy.
