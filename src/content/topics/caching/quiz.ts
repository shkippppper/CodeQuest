import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "caching-nscache-vs-dict",
    type: "mcq",
    prompt: "What's the key behavioral difference between NSCache and a plain Dictionary used as a cache?",
    options: [
      "NSCache can automatically evict entries under memory pressure and is thread-safe; Dictionary does neither",
      "NSCache is persisted to disk automatically and survives app termination just like URLCache does",
      "Dictionary is faster in every lookup case because it skips the overhead of NSCache\\'s eviction bookkeeping",
      "There is no real difference; NSCache is just a renamed Dictionary with the same thread and memory behavior",
    ],
    answer: 0,
    explanation:
      "`NSCache` behaves like a dictionary but can drop entries on its own when memory is tight, and it's safe to read/write from multiple threads without an external lock — a plain `Dictionary` does neither.",
  },
  {
    id: "caching-cost-fill",
    type: "fill",
    prompt: "When adding an item to NSCache, you can pass a ___ (a number, usually bytes) that helps the cache decide which entries to evict first.",
    answers: ["cost"],
    hint: "It's a parameter on setObject(_:forKey:cost:).",
    explanation:
      "The `cost` you supply tells `NSCache` roughly how expensive/large an entry is, so it can prioritize evicting costlier entries when it needs to free space.",
  },
  {
    id: "caching-memory-vs-disk",
    type: "mcq",
    prompt: "What's the trade-off between a memory cache and a disk cache?",
    options: [
      "Memory cache is fast but disappears when the app terminates; disk cache survives restarts but is slower to read",
      "Disk cache is always faster than memory cache because it avoids Swift\\'s heap allocations entirely",
      "Memory cache survives app restarts intact, while disk cache is cleared on every cold launch by the OS",
      "There is no meaningful difference in speed or persistence; both are equally fast and equally volatile on termination",
    ],
    answer: 0,
    explanation:
      "A memory cache like `NSCache` is fast but volatile — gone when the app quits. A disk cache persists across launches but pays file-system read/write cost.",
  },
  {
    id: "caching-layered-predict",
    type: "predict",
    prompt: "In a layered image cache (memory -> disk -> network), what happens on the THIRD request for the same URL, right after a disk hit promoted the image to memory?",
    code: `// Request 1: memory miss, disk miss -> network fetch, saved to disk + memory\n// Request 2 (after memory cache cleared): memory miss, disk hit -> promoted to memory\n// Request 3: ?`,
    options: [
      "Memory hit — fast, because request 2 promoted the disk hit back into the memory cache",
      "Another full network fetch because promotion only lasts until the next memory warning is received",
      "Another disk read, because memory promotion only applies within a single request and is never cached again",
      "It fails with a cache conflict error because the same URL was already fetched twice in the same session",
    ],
    answer: 0,
    explanation:
      "Promotion means a disk hit gets copied back into the memory cache. The next request after that finds it in memory and returns instantly, without touching disk or network.",
  },
  {
    id: "caching-invalidation-multi",
    type: "multi",
    prompt: "Select all valid cache invalidation strategies mentioned in the lesson.",
    options: [
      "Time-based expiry (treat an entry as stale after a duration)",
      "Explicit invalidation when the app knows data changed",
      "Versioned cache keys that change when the underlying data changes",
      "Never invalidating, and relying on the OS to eventually restart the app",
    ],
    answers: [0, 1, 2],
    explanation:
      "Time-based expiry, explicit invalidation, and versioned keys are the three real strategies. Never invalidating isn't a strategy — it just means serving stale data indefinitely.",
  },
  {
    id: "caching-urlcache-fill",
    type: "fill",
    prompt: "URLCache stores HTTP responses according to caching rules sent by the server in the ___ response header, such as max-age.",
    answers: ["cache-control"],
    hint: "Two words, hyphenated.",
    explanation:
      "`Cache-Control` (e.g. `max-age=3600`) tells `URLCache` how long a response is fresh for, without any client-side configuration needed beyond enabling the cache.",
  },
  {
    id: "caching-etag-senior",
    type: "mcq",
    prompt: "After a URLCache-stored response's max-age has expired, what typically happens on the next request if the server supports ETags?",
    options: [
      "A conditional request is sent; if nothing changed, the server replies 304 Not Modified and the body isn't resent",
      "The cached response is immediately discarded and permanently removed from URLCache regardless of ETag validity",
      "The full response body is always re-downloaded from scratch regardless of whether the content actually changed",
      "ETags disable caching entirely for that resource because the server signals it cannot trust client-stored copies",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "An `ETag` is a fingerprint for a response. Past its freshness window, URLCache can send a conditional request; a 304 response means the cached body is still valid, saving the cost of re-sending it.",
  },
  {
    id: "caching-lru-senior",
    type: "predict",
    prompt: "In an LRU cache at capacity, a new key is inserted. Which entry gets evicted?",
    code: `// order (front = most recently used): [C, B, A]\n// capacity reached, insert D`,
    options: [
      "A — the least recently used entry, at the back of the recency order",
      "C — the most recently used entry, because LRU always evicts the front of the recency-ordered list",
      "A random entry chosen by a probabilistic sampling algorithm to avoid worst-case sequential eviction patterns",
      "The oldest-inserted entry regardless of how recently it was accessed or how frequently it was requested",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "LRU evicts whichever entry hasn't been accessed the longest — the back of the recency-ordered list. Even if A was inserted first, if B or C were accessed more recently, A is still the one that goes.",
  },
  {
    id: "caching-flashcard",
    type: "flashcard",
    prompt: "Explain a full image-caching strategy: the layers involved, how each evicts or invalidates, and where URLCache fits in. Answer aloud, then reveal.",
    modelAnswer:
      "A layered cache checks a fast, memory-only **NSCache** first, falls back to a slower but persistent **disk cache**, and only hits the network as a last resort — a disk hit gets promoted back into memory so the next access is fast again. `NSCache` differs from a plain `Dictionary` in two ways: it can evict entries under memory pressure using `countLimit`/`totalCostLimit`/per-item `cost`, and it's thread-safe. Staleness is handled by **cache invalidation** — time-based expiry, explicit invalidation when you know data changed, or versioned cache keys that naturally miss when the underlying data changes; there's no single right answer, which is why it's a famously hard problem. Separately, `URLCache` sits under `URLSession` and caches HTTP responses automatically based on server-sent `Cache-Control` headers and `ETag`-based revalidation (a 304 response reuses the cached body) — no manual eviction logic needed there, since the server drives it. When a hand-rolled cache needs an eviction policy, **LRU** (least recently used) is the standard choice: evict whatever hasn't been touched in the longest time.",
    keyPoints: [
      "Layered cache: memory (NSCache) -> disk -> network, with promotion on disk hits",
      "NSCache vs Dictionary: auto-eviction under pressure + thread safety",
      "Invalidation: time-based, explicit, or versioned keys — no universal answer",
      "URLCache is header-driven (Cache-Control, ETag/304) — no manual eviction code",
      "LRU: evict the least-recently-used entry when at capacity",
    ],
    explanation:
      "A senior answer names the layering explicitly, distinguishes NSCache from a plain dictionary, and separates the header-driven URLCache from a hand-rolled cache's eviction policy.",
  },
];

export default quiz;
