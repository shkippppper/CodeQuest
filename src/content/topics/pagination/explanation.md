## The problem: you can't fetch ten thousand rows at once

A product list screen needs to show a catalog with ten thousand items. The naive request:

```swift
let items: [Product] = try await api.fetchProducts()
```

...means one enormous JSON payload, a multi-second wait before anything renders, and a device holding ten thousand model objects it isn't even displaying yet. Nobody scrolls that far in one sitting. What the screen actually needs is the first thirty items now, and the next thirty when the user scrolls near the bottom. That's **pagination** — fetching a large collection in small, sequential chunks — and this lesson is about the decisions that go into doing it well: how you ask for a page, when you ask for the next one, how you avoid showing the same item twice, and how the list stays correct while data underneath it keeps changing.

## Offset vs cursor: two ways to ask for "the next page"

The first design decision is what you send the server to mean "give me more."

### Offset paging

The obvious approach: ask for a page number, or a starting index and a count.

```swift
func fetchProducts(offset: Int, limit: Int) async throws -> [Product] {
    try await api.get("/products?offset=\(offset)&limit=\(limit)")
}
```

The client just keeps incrementing `offset` by `limit` each time it needs more: page 1 is `offset=0`, page 2 is `offset=30`, and so on. It's simple, and the server can answer it with a plain SQL `LIMIT`/`OFFSET` clause. It also lets you jump straight to "page 7" without walking through pages 1–6 first — useful for things like a numbered results view.

Predict: a user is on page 3 of a live product list (`offset=60`) when someone else adds five new products to the front of the catalog, sorted newest-first. What happens when the user loads page 4?

Answer: the five new items shifted everything after them down by five positions, so `offset=90` for page 4 now points at five items the user already saw on page 3 — and the five items originally at the very end of what would've been page 4 get skipped entirely. Offset paging silently breaks when the underlying data changes between requests, because "offset 90" means a different item every time something is inserted ahead of it.

### Cursor paging

A **cursor** sidesteps that problem by asking not for a numeric position but for "everything after this specific item":

```swift
func fetchProducts(after cursor: String?, limit: Int) async throws -> ProductPage {
    try await api.get("/products?after=\(cursor ?? "")&limit=\(limit)")
}

struct ProductPage: Decodable {
    let items: [Product]
    let nextCursor: String?   // nil means no more pages
}
```

The server encodes a stable pointer — often the last item's id, or its id plus its sort value — into `nextCursor`, and the client just echoes that value back to ask for the next batch. New items inserted at the front never shift what "after this cursor" means, because the cursor identifies a specific item, not a position. This is the same mechanism the chat-system-design lesson in this course uses for syncing missed messages — the two problems are really the same shape: "give me everything after the last thing I saw."

The tradeoff is that a cursor can't jump to "page 7" — it can only walk forward one page at a time from wherever it currently is. For an infinite-scroll feed, that's not a real limitation, since nobody types "take me to item 210" in a scrolling list. For a numbered search-results view where users do click page numbers, offset (or a hybrid) is often the better fit.

| | Offset | Cursor |
|---|---|---|
| Behaves correctly if items are inserted mid-list | No — page contents shift | Yes — cursor identifies a specific item |
| Can jump to an arbitrary page | Yes | No — only walks forward |
| Server implementation | Simple `LIMIT`/`OFFSET` | Needs a stable, sortable pointer |

## Prefetch triggers: asking before the user hits the bottom

Once you can fetch page N+1, the next question is *when*. Fetching only after the user reaches the very last visible row means they stare at a spinner while it loads — the request should start earlier, while there's still unseen content to look at.

```swift
func tableView(_ tableView: UITableView, willDisplay cell: UITableViewCell, forRowAt indexPath: IndexPath) {
    let thresholdIndex = items.count - 5   // fire when 5 rows from the end
    if indexPath.row == thresholdIndex {
        Task { await loadNextPage() }
    }
}
```

`willDisplay` fires just before a cell becomes visible, so checking against a threshold a few rows before the end starts the fetch while the user is still scrolling through content that's already loaded — by the time they reach the bottom, the next page has often already arrived.

The one thing this trigger needs to guard against is firing more than once for the same page:

```swift
var isLoadingNextPage = false

func loadNextPage() async {
    guard !isLoadingNextPage, let cursor = nextCursor else { return }
    isLoadingNextPage = true
    defer { isLoadingNextPage = false }
    let page = try? await fetchProducts(after: cursor, limit: 30)
    // append page.items, store page.nextCursor
}
```

Scrolling triggers `willDisplay` repeatedly as rows near the threshold pass by, so without the `isLoadingNextPage` guard, a single scroll gesture can kick off the same page-load several times over.

## Deduplication: the same item arriving twice

Even with a guard against double-firing requests, duplicates can still reach the list from elsewhere — a page boundary lands on an item that shifted slightly between requests, or a pull-to-refresh re-fetches page 1 while older pages are already loaded. Appending raw server results straight into an array makes duplicates a real risk:

```swift
var items: [Product] = []

func append(_ newItems: [Product]) {
    items.append(contentsOf: newItems)   // no dedup — a repeat id shows up twice
}
```

The fix is to key the list by identity and skip anything already present:

```swift
var items: [Product] = []
var seenIds: Set<String> = []

func append(_ newItems: [Product]) {
    for item in newItems where !seenIds.contains(item.id) {
        items.append(item)
        seenIds.insert(item.id)
    }
}
```

`seenIds` is checked before every insert, so re-fetching a page that overlaps with what's already loaded just quietly skips the repeats instead of rendering the same product card twice.

## Error / empty states: a page load can fail in three different ways

A paginated list isn't in one binary loaded-or-not state — it has to represent several distinct situations to the user, and conflating them makes for a confusing screen:

```swift
enum PageLoadState {
    case idle
    case loadingFirstPage
    case loadingNextPage
    case loadedEmpty        // request succeeded, zero results — different from a failure
    case failed(Error)
}
```

`loadingFirstPage` is a full-screen spinner; `loadingNextPage` is a small spinner at the bottom of an already-populated list — reusing one loading flag for both means either the whole screen blanks out on every subsequent page (jarring), or the first load shows nothing at all (broken). `loadedEmpty` matters because "zero results" and "the request failed" need completely different messaging — "No products match your filters" versus "Something went wrong, tap to retry" — and collapsing them into one generic empty view tells the user the wrong thing.

A failed *next*-page load also shouldn't wipe out the items already on screen:

```swift
func loadNextPage() async {
    guard !isLoadingNextPage, let cursor = nextCursor else { return }
    isLoadingNextPage = true
    defer { isLoadingNextPage = false }
    do {
        let page = try await fetchProducts(after: cursor, limit: 30)
        append(page.items)
        nextCursor = page.nextCursor
    } catch {
        showRetryFooter(error)   // existing rows stay exactly as they were
    }
}
```

The thirty items already visible are untouched; only the footer changes to show a retry affordance, because the user's scroll position and everything they've already seen shouldn't disappear over a failure fetching *more* content.

## Cache coherence: what if item 12 changes while item 45 is loading?

The trickiest part of pagination isn't fetching pages — it's keeping a list that was assembled from many separate requests, at different times, consistent with a backing store that keeps changing underneath it. Say the list is also written to a local cache for offline reading, the same pattern the networking-layer topic in this course uses for single requests:

```swift
func append(_ newItems: [Product]) {
    for item in newItems where !seenIds.contains(item.id) {
        items.append(item)
        seenIds.insert(item.id)
        cache.upsert(item)   // write-through: keep the cache in sync as pages load
    }
}
```

Now suppose the user favorites item 12, which is already loaded and cached, while page 4 is still in flight. If the update to item 12 only happens in the in-memory `items` array and not in `cache`, the two fall out of sync — a fresh app launch reading from `cache` shows item 12 as un-favorited again. The fix isn't specific to pagination: any mutation to an item needs to go through the same single write path, updating the in-memory list and the cache together, rather than the list mutating one copy of the data and the cache holding a second, independent copy.

```swift
func toggleFavorite(_ item: Product) {
    var updated = item
    updated.isFavorited.toggle()
    if let index = items.firstIndex(where: { $0.id == updated.id }) {
        items[index] = updated
    }
    cache.upsert(updated)   // same write path, same source of truth
}
```

The lesson generalizes: pagination assembles a list out of pieces fetched over time, but there should still be exactly one place that owns "the current truth about item X" — every read and every write goes through it, whether the item arrived via page 1, page 4, or a mutation from a completely different screen.

## Common pitfalls

- **Using offset paging on a frequently-changing feed.** Items shift under the pages, causing skips and repeats — use a cursor instead.
- **No guard against a double-fired prefetch.** Fast scrolling can trigger `willDisplay` multiple times before the first request even returns.
- **Treating "zero results" as an error.** A successful empty response needs its own state and message, distinct from a failed request.
- **A failed next-page load clearing the whole list.** Only the append should fail; already-loaded rows must stay on screen.

## Interview lens

If asked to design pagination, lead with offset vs. cursor and justify the choice with the access pattern: infinite scroll on a feed that changes underneath the user wants a cursor, because it survives insertions; a numbered results page where users jump around wants offset, because it supports random access. Naming the actual failure mode of offset paging — items shifting and causing skipped or repeated rows — is what separates a memorized answer from an understood one.

When the conversation moves to implementation details, mention the prefetch threshold and the in-flight guard together: prefetching early avoids a visible stall, and the guard is what stops a fast scroll from firing the same request several times over.

If pushed on correctness at scale, bring up cache coherence unprompted: a paginated list built from many separate requests has to funnel every read and write of an item through one owned source of truth, or a mutation made on one screen (like a favorite toggle) silently disappears the next time that data loads from a stale copy.
