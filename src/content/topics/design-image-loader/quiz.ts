import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "img-naive-problems",
    type: "multi",
    prompt: "Select **all** problems that show up when a naive `URLSession.data(from:)` call is used directly inside a scrolling collection view cell.",
    options: [
      "The same image can be requested multiple times because nothing remembers it was already fetched",
      "A cell recycled before the download finishes can show the wrong image",
      "Large images get decoded at full resolution even when displayed as a small thumbnail",
      "URLSession automatically caches, dedupes, and downsamples every image for you",
    ],
    answers: [0, 1, 2],
    explanation:
      "A raw URLSession call has no de-duplication, no cancellation tied to cell reuse, and no downsampling — it just fetches full-resolution bytes every time, which is exactly what an image-loading library needs to fix.",
  },
  {
    id: "img-api-cancel",
    type: "mcq",
    prompt: "Why does the ImageLoader API include cancelLoad(url:for:) as a separate method rather than relying on loadImage's async task simply finishing?",
    options: [
      "Because a cell gets reused for a different row before its in-flight image request finishes, and it needs to say it no longer cares about the result",
      "Because async/await cannot represent failure",
      "Because URLSession requests can never be cancelled",
      "Because prefetch requires it to compile",
    ],
    answer: 0,
    explanation:
      "Cell reuse means a cell that started a load may be repurposed for a different item before that load completes. Cancellation lets the loader stop wasting work on a result nobody will use.",
  },
  {
    id: "img-cache-layers",
    type: "mcq",
    prompt: "What's the key difference between the memory cache and the disk cache in a two-layer image cache design?",
    options: [
      "Memory holds fully decoded images (fast, RAM-bounded); disk holds compressed bytes (slower, needs a decode step, but can hold far more)",
      "They store identical data and exist only for redundancy",
      "Disk cache is always faster to read from than memory",
      "Memory cache has no size limit since RAM is cheap",
    ],
    answer: 0,
    explanation:
      "Memory caches decoded UIImages for instant reuse but is bounded by available RAM. Disk caches compressed bytes, which take more time to read and decode but can store far more images because compressed data is much smaller than decoded pixel data.",
  },
  {
    id: "img-lru-fill",
    type: "fill",
    prompt: "When a bounded memory cache is full, evicting the entry that hasn't been accessed in the longest time is called ___ eviction.",
    answers: ["lru", "least-recently-used", "least recently used"],
    hint: "An acronym for \"least recently used.\"",
    explanation:
      "LRU eviction assumes items not accessed recently are less likely to be needed soon, so they're the first candidates removed when the cache needs room.",
  },
  {
    id: "img-dedup-predict",
    type: "predict",
    prompt: "A user scrolls down past a photo, then scrolls back up to it a moment later, before the first request for that URL has finished. With request de-duplication in place via an in-flight Task dictionary, what happens?",
    code: `private var inFlight: [URL: Task<UIImage, Error>] = [:]
// second call for the same url arrives while the first is still running`,
    options: [
      "The second caller awaits the same in-flight Task instead of starting a duplicate download",
      "A second, independent download starts in parallel",
      "The second request is silently dropped with no image ever returned",
      "The first request is cancelled to make room for the second",
    ],
    answer: 0,
    explanation:
      "De-duplication checks the in-flight dictionary first; if a Task for that URL is already running, the new caller just awaits its result instead of triggering a second identical download.",
  },
  {
    id: "img-downsample",
    type: "mcq",
    prompt: "Why does downsampling (decoding directly at the target display size) save more memory than decoding full-size and then shrinking with a resize step afterward?",
    options: [
      "It avoids ever allocating the full-size decoded bitmap in the first place, rather than allocating it and then discarding most of it",
      "It compresses the image file on disk before download",
      "It skips the network request entirely",
      "It only affects CPU time, not memory",
    ],
    answer: 0,
    explanation:
      "CGImageSource's thumbnail API reduces the pixel size during decode itself, so the large intermediate full-resolution bitmap is never created. Decode-then-resize allocates the full bitmap first and throws most of it away, wasting both memory and CPU.",
  },
  {
    id: "img-cooperative-cancel-senior",
    type: "predict",
    prompt: "A cell calls cancelLoad right as its Task is mid-decode. The decode was already in progress. What actually happens?",
    code: `func cancelLoad(url: URL, for token: AnyHashable) {
    inFlight[url]?.cancel()
}
// decode was already running when cancel() was called`,
    options: [
      "Cancellation is cooperative — the in-progress decode may still finish and the task may complete before it observes cancellation, so a receiving guard (like a per-request token check) is still needed",
      "The decode is forcibly and instantly killed with no further code executing",
      "cancel() has no effect on Task at all",
      "The app crashes because you cannot cancel a Task mid-decode",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Task cancellation in Swift is cooperative: it sets a flag that running code can check, but doesn't forcibly interrupt work already in progress. That's why a defense-in-depth guard on the caller's side (checking a token before applying the result) still matters even with cancellation wired up correctly.",
  },
  {
    id: "img-concurrency-senior",
    type: "mcq",
    prompt: "Why bound the number of concurrent downloads with something like a semaphore instead of letting every visible-plus-prefetched image download at once?",
    options: [
      "Unbounded concurrent downloads during a fast scroll can saturate the network and starve the requests the user can actually see, so a cap keeps the pipe busy without overwhelming it",
      "URLSession physically cannot run more than one request at a time",
      "A semaphore makes each individual download faster",
      "It removes the need for a memory cache",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A fast scroll can trigger dozens of near-simultaneous requests. Without a concurrency cap, they compete for the same limited bandwidth, so even the images currently on screen load slowly. A bounded limit (e.g. 6 concurrent downloads) keeps throughput high for what matters most.",
  },
  {
    id: "img-flashcard",
    type: "flashcard",
    prompt:
      "Design an image-loading library end to end: API surface, caching, cancellation, decoding, and concurrency. Answer aloud, then reveal.",
    modelAnswer:
      "Expose a small **API surface**: `loadImage(url:) async throws -> UIImage` as the main path, `cancelLoad` so a reused cell can disown a stale request, and `prefetch` as a fire-and-forget hint for URLs likely needed soon. Back it with two cache layers checked in order: a **memory cache** of decoded images (fast, RAM-bounded, evicted with an **LRU** policy or `NSCache`) and a **disk cache** of compressed bytes (slower, needs a decode step, but holds far more). Track in-flight work in a `[URL: Task]` dictionary so concurrent requests for the same URL **de-duplicate** into one download instead of racing. Support **cooperative cancellation** via `Task.cancel()`, but don't rely on it alone — since a task can still finish after being told to cancel, guard the callback with a per-request token so a late result can't land on a cell that moved on. Decode with **downsampling**: decode directly at the target display size (e.g. via `CGImageSourceCreateThumbnailAtIndex`) instead of decoding full resolution and shrinking after, which avoids ever allocating the large intermediate bitmap. Bound concurrent downloads with a semaphore so a fast scroll doesn't saturate the network, and run decoding on a background queue so CPU-heavy work never competes with the main thread's frame budget during scroll.",
    keyPoints: [
      "API: loadImage / cancelLoad / prefetch, designed from the caller's perspective",
      "Two-layer cache: memory (decoded, LRU-bounded) + disk (compressed, larger capacity)",
      "In-flight Task dictionary de-duplicates concurrent requests for the same URL",
      "Cancellation is cooperative — still need a per-request token guard on the result",
      "Downsample during decode (not resize after); bound concurrency; decode off the main thread",
    ],
    explanation:
      "A senior answer treats the API surface as a design decision (not an afterthought), explains the memory/disk trade-off precisely, and flags that cancellation alone isn't sufficient defense against stale results.",
  },
];

export default quiz;
