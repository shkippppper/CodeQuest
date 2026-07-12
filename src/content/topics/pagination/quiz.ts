import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "pagination-why-mcq",
    type: "mcq",
    prompt: "Why does a screen showing a ten-thousand-item catalog fetch it a page at a time instead of all at once?",
    options: [
      "Fetching everything means a slow multi-second wait and a device holding far more data in memory than it's currently displaying",
      "Servers physically cannot return more than 30 items in one response",
      "JSON can only encode 30 objects per payload",
      "Pagination is required by the App Store",
    ],
    answer: 0,
    explanation:
      "Nobody scrolls through ten thousand items in one sitting. Fetching in small chunks keeps the first render fast and keeps memory usage proportional to what's actually been scrolled to.",
  },
  {
    id: "pagination-offset-shift-predict",
    type: "predict",
    prompt: "A user is viewing page 3 (`offset=60, limit=30`) of a newest-first product list when 5 new products are inserted at the front. What happens when they load page 4 (`offset=90`)?",
    code: `// before insert: page 3 = items[60..<90]
// 5 new items inserted at index 0
// user requests offset=90, limit=30 for page 4`,
    options: [
      "5 items the user already saw on page 3 reappear on page 4, and 5 items get skipped entirely from the end of the original page 4",
      "Nothing changes — offset paging is unaffected by insertions",
      "The server automatically adjusts the offset to compensate",
      "Page 4 becomes empty",
    ],
    answer: 0,
    explanation:
      "The 5 new items shift everything after them down by 5 positions. Offset 90 now points 5 slots earlier in the original ordering than it did before the insert, causing 5 repeats and 5 skips.",
  },
  {
    id: "pagination-cursor-fill",
    type: "fill",
    prompt: "A pagination approach that asks for 'everything after this specific item' rather than a numeric position is called ___ paging.",
    answers: ["cursor"],
    hint: "Contrast with offset paging.",
    explanation:
      "A cursor identifies a specific item (often its id or id+sort value), so it stays correct even when items are inserted or removed elsewhere in the list.",
  },
  {
    id: "pagination-offset-vs-cursor-mcq",
    type: "mcq",
    prompt: "A numbered search-results screen where users click directly to 'page 7' is a better fit for which paging strategy, and why?",
    options: [
      "Offset — because it supports random access to an arbitrary page, which cursor paging cannot do",
      "Cursor — because it's always faster to implement on the server",
      "Offset — because it's the only strategy JSON supports",
      "Cursor — because it eliminates the need for a limit parameter",
    ],
    answer: 0,
    explanation:
      "Cursor paging can only walk forward one page at a time from wherever it currently is. Jumping straight to page 7 needs a numeric position, which is exactly what offset paging provides.",
  },
  {
    id: "pagination-prefetch-multi",
    type: "multi",
    prompt: "Select all true statements about triggering the next page load during scrolling.",
    options: [
      "Firing the fetch a few rows before the end avoids a visible stall when the user reaches the bottom",
      "`willDisplay`-style callbacks can fire repeatedly for cells near the threshold during a single fast scroll",
      "A guard flag like `isLoadingNextPage` is unnecessary since UITableView never calls `willDisplay` twice for the same row",
      "Without an in-flight guard, a fast scroll can trigger the same page-load request multiple times",
    ],
    answers: [0, 1, 3],
    explanation:
      "Prefetching a few rows early hides the fetch behind existing content. The display callback firing repeatedly near the threshold is exactly why an in-flight guard is necessary — without one, duplicate requests for the same page can fire.",
  },
  {
    id: "pagination-dedup-fill",
    type: "fill",
    prompt: "Tracking already-appended item ids in a Set and skipping repeats when appending a new page is a form of ___.",
    answers: ["deduplication", "dedup", "dedupe", "deduping"],
    hint: "Preventing the same item from appearing twice in the list.",
    explanation:
      "Even with careful cursor logic, overlapping page boundaries or refresh timing can produce duplicate items — checking against a set of seen ids before inserting keeps the rendered list clean.",
  },
  {
    id: "pagination-empty-vs-error-mcq",
    type: "mcq",
    prompt: "Why does a paginated list need a distinct `loadedEmpty` state instead of folding zero-results into the same handling as a failed request?",
    options: [
      "A successful response with zero items and a failed request need different messaging — 'no results match' versus 'something went wrong, retry'",
      "Empty responses are technically a type of network error",
      "SwiftUI cannot render an empty array",
      "There's no real difference — they should be handled identically",
    ],
    answer: 0,
    explanation:
      "Collapsing 'zero results' and 'request failed' into one generic empty view gives the user misleading feedback — one is a normal outcome (no matches), the other means something needs a retry.",
  },
  {
    id: "pagination-cache-coherence-senior",
    type: "predict",
    prompt: "🧠 A paginated product list keeps items in an in-memory array and separately write-throughs each page to a local cache. A user favorites an already-loaded item, and that mutation only updates the in-memory array. What breaks?",
    code: `func toggleFavorite(_ item: Product) {
    var updated = item
    updated.isFavorited.toggle()
    items[items.firstIndex(where: { $0.id == updated.id })!] = updated
    // no cache.upsert(updated) call
}`,
    options: [
      "The cache still holds the un-favorited version, so a fresh app launch reading from the cache shows the item as un-favorited again",
      "Nothing — in-memory and cached state are always kept in sync automatically",
      "The app crashes on the next favorite toggle",
      "The item disappears from the list entirely",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "When a mutation only updates one of two copies of the same data, the two fall out of sync. Every read and write of an item needs to go through a single owned source of truth — updating the in-memory list and the cache together — regardless of which page or screen the mutation came from.",
  },
  {
    id: "pagination-flashcard",
    type: "flashcard",
    prompt:
      "Explain the key decisions in designing pagination for an infinite-scroll list: paging strategy, prefetching, dedup, and state. Answer aloud, then reveal.",
    modelAnswer:
      "Choose between offset paging (a numeric position, simple to implement, supports jumping to an arbitrary page, but breaks when items are inserted or removed mid-list because it silently causes skips and repeats) and **cursor** paging (a stable pointer to a specific item — often its id — that keeps working correctly under insertions, at the cost of only being able to walk forward one page at a time). Infinite-scroll feeds that change underneath the user should use a cursor; numbered results views that support random access should use offset. Trigger the next fetch a few rows before the visible end (a prefetch threshold) rather than waiting for the last row, and guard it with an in-flight flag, since scroll callbacks can fire the request repeatedly during a single fast scroll. Guard against duplicate items reaching the rendered list by tracking seen ids and skipping repeats on append. Model loading as more than binary: first-page loading, next-page loading, a successful-but-empty state (distinct messaging from a failure), and a failed state that leaves already-loaded rows untouched — only the append should fail. Finally, if the list is also cached for offline reading, every mutation to an item (like a favorite toggle) must go through one owned write path that updates both the in-memory list and the cache together, or the two silently drift out of sync.",
    keyPoints: [
      "Cursor paging survives insertions; offset paging supports random-access jumps",
      "Prefetch a few rows early; guard against duplicate fetches from repeated scroll callbacks",
      "Dedup appended items by id to guard against overlapping page boundaries",
      "Distinguish loadingFirstPage / loadingNextPage / loadedEmpty / failed as separate states",
      "A failed next-page load must not clear already-loaded rows",
      "Item mutations must go through one write path shared by the in-memory list and any cache",
    ],
    explanation:
      "A strong answer justifies the offset-vs-cursor choice by the access pattern rather than reciting both definitions, and raises cache coherence as the deeper correctness issue once caching enters the picture.",
  },
];

export default quiz;
