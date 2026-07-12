import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "feed-why-hard",
    type: "mcq",
    prompt: "What makes a feed harder to design than a static, fixed-length list?",
    options: [
      "It's unbounded, changes underneath the user while they scroll, and is rendering-heavy (media)",
      "It only ever shows text, never images",
      "It never needs pagination since feeds are short",
      "It's identical to a static list in every way",
    ],
    answer: 0,
    explanation:
      "A feed is too long to load at once (needs pagination), gets new items inserted at the top while the user is mid-scroll (needs a freshness strategy), and typically carries media that threatens scroll smoothness.",
  },
  {
    id: "feed-cursor-insert",
    type: "predict",
    prompt: "A feed uses page-number pagination (page=1, page=2, ...). Three new posts arrive at the top while the user is viewing page 2. What happens when they load page 3?",
    code: `// GET /feed?page=3&limit=20
// 3 new posts were inserted at the top since page 2 was fetched`,
    options: [
      "Everything shifts down by 3, so page 3 now overlaps with items already shown on page 2 — duplicates appear",
      "Nothing changes; page numbers are immune to inserts",
      "The server rejects the request",
      "The app automatically deduplicates with no extra logic",
    ],
    answer: 0,
    explanation:
      "Page-number pagination re-derives each page from a live, shifting list. Inserts at the top shift every later page's contents down, causing overlap/duplicates — exactly why feeds use a stable cursor (based on timestamp or ID) instead.",
  },
  {
    id: "feed-prefetch-fill",
    type: "fill",
    prompt: "Triggering the next page's network request while the user is still a few screens away from the bottom, instead of waiting until they hit it, is called ___.",
    answers: ["prefetching", "prefetch"],
    hint: "Fetching before it's strictly needed.",
    explanation:
      "Prefetching starts the next page's request early enough that the response is usually ready before the user scrolls far enough to need it, avoiding a visible loading spinner.",
  },
  {
    id: "feed-new-posts-banner",
    type: "mcq",
    prompt: "New posts arrive in the background while the user is reading the feed. What's the better UX default, and why?",
    options: [
      "Show a non-disruptive \"N new posts\" banner rather than silently splicing them above the user's scroll position",
      "Silently insert them at the top immediately so the feed is always maximally fresh",
      "Ignore new posts entirely until the next full app relaunch",
      "Reload the entire feed from scratch on a timer regardless of scroll position",
    ],
    answer: 0,
    explanation:
      "Splicing content in above an actively-scrolling user yanks their position around, which feels broken even though the data is \"more correct.\" A banner lets the user opt into the refresh instead of having it forced on them.",
  },
  {
    id: "feed-aspect-ratio",
    type: "mcq",
    prompt: "Why does the PostDTO in this lesson include imageAspectRatio instead of letting the cell size itself once the image downloads?",
    options: [
      "So the cell can reserve the correct height immediately, avoiding a layout jump when the image finishes loading",
      "It's required by every image format",
      "It replaces the need for a thumbnail URL",
      "It has no effect on layout, only on decoding speed",
    ],
    answer: 0,
    explanation:
      "Without a known aspect ratio, the cell's height is unknown until the image finishes downloading, causing the whole list to reflow and jump. Sending the ratio in the API response lets layout be correct from the first frame.",
  },
  {
    id: "feed-optimistic-multi",
    type: "multi",
    prompt: "Select **all** true statements about optimistic updates, using the like-button example.",
    options: [
      "The UI is updated immediately, before the network call resolves",
      "If the network call fails, the local state should roll back to its prior value",
      "Optimistic updates guarantee the request can never fail",
      "Optimistic updates make the UI feel instant even on a slow connection",
    ],
    answers: [0, 1, 3],
    explanation:
      "Optimistic updates change local state immediately and only revert it if the request actually fails — they don't prevent failures, they just avoid making the user wait to see a response before feeling like the tap worked.",
  },
  {
    id: "feed-cache-vs-grid-senior",
    type: "predict",
    prompt: "The profile-grid lesson used write-through caching (update the cache the instant a write succeeds). Should a feed of other people's posts use the same default?",
    code: `// profile grid: your own photos, write-through cache
// home feed: other people's posts, arriving continuously`,
    options: [
      "No — silently applying every incoming update mid-scroll disorients the reader, so a feed favors showing cached content plus an explicit \"new posts\" affordance instead",
      "Yes — every cache in a mobile app should always be write-through, no exceptions",
      "No — feeds should never cache anything at all",
      "It makes no difference which one you pick",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Same underlying trade-off, opposite default, because the protected requirement differs: the profile grid protects \"my own edits must appear immediately,\" while the feed protects \"don't yank the reader's scroll position for content that isn't theirs.\"",
  },
  {
    id: "feed-scroll-perf-senior",
    type: "mcq",
    prompt: "A feed uses proper cell reuse (UICollectionView/LazyVStack) but still stutters while scrolling past image-heavy posts. What's the most likely remaining cause?",
    options: [
      "Image decoding is happening synchronously on the main thread, competing with frame rendering",
      "Cell reuse is inherently incompatible with images",
      "The cursor-based pagination scheme is too slow",
      "The FeedPage struct is missing a nextCursor field",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Cell reuse solves allocation overhead, not CPU-bound work happening inside each cell's configuration. Decoding images on the main thread steals time from the ~16ms (60fps) or ~8ms (120fps) budget needed to draw each frame, causing visible hitches even with reuse in place.",
  },
  {
    id: "feed-flashcard",
    type: "flashcard",
    prompt:
      "Explain how you'd design a feed's data layer end to end: pagination, caching, and optimistic updates. Answer aloud, then reveal.",
    modelAnswer:
      "Paginate with a **cursor** built from a stable field like timestamp or ID, not a page number — feeds insert new items at the front constantly, and page numbers shift under concurrent inserts while a cursor (\"everything older than X\") does not. Trigger the next page's fetch via **prefetching**, a few screens before the user actually reaches the bottom, guarded so a second fetch can't fire while one is already in flight. For freshness, render the **cached** feed immediately on open for an instant first paint, then check for new posts in the background — and surface them as an explicit \"N new posts\" banner rather than splicing them in live, because yanking an actively-scrolling reader's position feels worse than brief staleness. For actions like liking a post, use an **optimistic update**: flip the local state immediately assuming success, send the network request, and roll the state back only if the request actually fails — this makes the UI feel instant regardless of connection speed and gives offline support almost for free, at the cost of occasionally showing a state that has to be corrected. Underneath all of this, images carry their **aspect ratio** in the API response so cells can reserve correct height before the image finishes downloading, and image decoding stays off the main thread so it doesn't compete with frame rendering during scroll.",
    keyPoints: [
      "Cursor-based pagination (stable field), not page numbers, because inserts happen at the front",
      "Prefetch a few screens early, guarded against duplicate in-flight requests",
      "Cache-first render, background refresh, explicit \"new posts\" banner instead of a silent splice",
      "Optimistic updates: update UI immediately, roll back only on failure",
      "Aspect ratio in the API response prevents layout jump; decode images off the main thread",
    ],
    explanation:
      "A senior answer connects each choice back to a specific requirement (instant reopen, no disorientation, no stutter) rather than listing techniques in isolation.",
  },
];

export default quiz;
