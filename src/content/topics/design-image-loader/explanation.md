## The problem: "just use URLSession" doesn't survive a scrolling list

Loading one image from a URL is three lines:

```swift
let (data, _) = try await URLSession.shared.data(from: url)
let image = UIImage(data: data)
```

That works fine for a single static image. It falls apart the moment it's used inside a scrolling feed: cells get reused faster than images finish downloading, the same photo gets requested five times because nothing remembers it was already fetched, a 4000x3000 pixel photo gets decoded at full size to fill a 100x100 thumbnail, and scrolling fast leaves a trail of wasted network requests for cells that scrolled away before they finished. Designing an image-loading library means solving each of those, in order, starting from the shape of the API a caller actually uses.

## API surface

Start from what the caller writes, since a library's API is the first thing anyone judges:

```swift
protocol ImageLoader {
    func loadImage(url: URL) async throws -> UIImage
    func cancelLoad(url: URL, for token: AnyHashable)
    func prefetch(urls: [URL])
}
```

Three methods, three responsibilities. `loadImage` is the main path: give it a URL, get back a decoded image, `async throws` because it might fail (bad URL, no network) and shouldn't block the caller's thread while it works. `cancelLoad` exists because of cell reuse — a cell that requested an image and then got recycled for a different row needs to say "I don't care about that request anymore." `prefetch` is a fire-and-forget hint: "you'll probably need these soon, get a head start," with no result to wait on.

A cell wires up like this:

```swift
class PhotoCell: UICollectionViewCell {
    private var loadToken = UUID()

    func configure(url: URL, loader: ImageLoader) {
        let token = UUID()
        loadToken = token
        Task {
            let image = try? await loader.loadImage(url: url)
            if loadToken == token {          // still the same request this cell cares about
                imageView.image = image
            }
        }
    }

    override func prepareForReuse() {
        loader.cancelLoad(url: currentURL, for: loadToken)
    }
}
```

That `loadToken == token` check is doing real work: even if cancellation doesn't stop the network call in time, it stops a *stale* result from landing on a cell that has since been reused for a different photo.

## In-memory & disk cache

The naive version re-downloads the same image every time it scrolls back on screen. Fix that with two cache layers, checked in order:

```swift
func loadImage(url: URL) async throws -> UIImage {
    if let cached = memoryCache[url] { return cached }          // fastest: already-decoded, in RAM
    if let diskData = diskCache[url] {                          // slower: on disk, needs decoding
        let image = try decode(diskData)
        memoryCache[url] = image
        return image
    }
    let data = try await download(url)                          // slowest: network round trip
    diskCache[url] = data
    let image = try decode(data)
    memoryCache[url] = image
    return image
}
```

Each layer trades speed for capacity. The **memory cache** holds fully decoded `UIImage`s — instant to use, but bounded by RAM, so it can only hold what's roughly on screen plus a small buffer. The **disk cache** holds raw compressed bytes — slower (needs a decode step, plus a disk read) but can hold thousands of images because compressed JPEG bytes are far smaller than decoded pixel data.

Predict: should the memory cache ever be allowed to grow unbounded, since RAM is fast?

Answer: no — an unbounded memory cache is exactly how a scrolling list gets killed by the OS for memory pressure. The standard fix is an **LRU (least-recently-used) eviction policy**: when the cache hits a size limit, throw away the entry that hasn't been touched in the longest time, on the assumption that "not viewed recently" predicts "not needed soon." `NSCache` gives you this behavior for free and also auto-evicts under system memory pressure, which a hand-rolled dictionary won't do.

## Cancellation

Scroll fast through a feed and the naive loader starts twenty downloads for cells the user has already scrolled past. Each one wastes bandwidth and CPU on a decode nobody will see.

```swift
private var inFlight: [URL: Task<UIImage, Error>] = [:]

func loadImage(url: URL) async throws -> UIImage {
    if let existing = inFlight[url] { return try await existing.value }   // dedupe: join, don't restart
    let task = Task {
        defer { inFlight[url] = nil }
        return try await downloadAndDecode(url)
    }
    inFlight[url] = task
    return try await task.value
}

func cancelLoad(url: URL, for token: AnyHashable) {
    inFlight[url]?.cancel()
}
```

Two things happen here that the earlier version didn't have. First, **request de-duplication**: if two cells ask for the same URL at nearly the same time (common when a user scrolls up and back down), the second caller joins the first's in-flight `Task` instead of starting a second identical download. Second, `Task.cancel()` cooperatively signals the download to stop — `URLSession`'s async APIs check for cancellation and throw, freeing up the connection for a cell that actually needs it.

One nuance worth stating out loud in an interview: cancellation is cooperative, not immediate. A task that's already mid-decode when cancelled might still finish that decode before checking `Task.isCancelled`. That's exactly why the cell-side `loadToken` check from the API section still matters even with proper cancellation — it's a second, cheap guard against a result arriving after the cell stopped caring.

## Decoding & downsampling

Even a cache hit can be slow if it decodes wrong. A photo captured at 4000x3000 pixels, decoded at full resolution to fill a 100x100 thumbnail, wastes both memory (a full decode allocates roughly width x height x 4 bytes, tens of megabytes for one photo) and CPU, for detail the thumbnail can never show anyway.

```swift
func decode(_ data: Data, targetSize: CGSize) throws -> UIImage {
    let options: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceThumbnailMaxPixelSize: max(targetSize.width, targetSize.height),
        kCGImageSourceCreateThumbnailWithTransform: true,
    ]
    let source = CGImageSourceCreateWithData(data as CFData, nil)!
    let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)!
    return UIImage(cgImage: cgImage)
}
```

This is **downsampling**: decoding the image directly at (roughly) the pixel size it will actually be displayed at, instead of decoding at full size and shrinking afterward. `CGImageSource`'s thumbnail API does the size reduction *during* decode, so the huge intermediate full-size bitmap is never allocated at all — the memory savings come from work never done, not from cleanup after the fact.

## Prefetch

`prefetch(urls:)` from the API surface exists to hide network latency the user would otherwise see. As soon as the app knows the next twenty photo URLs (say, from a feed page's response), it can kick off downloads and decodes for cells that aren't visible yet, so that by the time the user scrolls to them the memory cache already has the answer.

```swift
func prefetch(urls: [URL]) {
    for url in urls where memoryCache[url] == nil {
        Task(priority: .low) { _ = try? await loadImage(url: url) }
    }
}
```

`priority: .low` matters here: a prefetch task should never win a CPU or network contest against an image the user is looking at *right now*. It's a hint, not a promise — if the system is busy, prefetch work should be the first thing that waits.

## Concurrency model

Pull the pieces together and one more design question surfaces: how many downloads and decodes should run at once? Unbounded concurrency during a fast scroll can spin up dozens of simultaneous downloads, saturating the network and starving the ones the user can actually see.

```swift
let downloadLimiter = AsyncSemaphore(limit: 6)   // bound concurrent downloads
let decodeQueue = DispatchQueue(label: "image.decode", attributes: .concurrent)

func downloadAndDecode(_ url: URL) async throws -> UIImage {
    await downloadLimiter.wait()
    defer { downloadLimiter.signal() }
    let data = try await download(url)
    return try await withCheckedThrowingContinuation { cont in
        decodeQueue.async {
            cont.resume(with: Result { try self.decode(data, targetSize: .init(width: 200, height: 200)) })
        }
    }
}
```

A **semaphore** here caps how many downloads run concurrently — enough to keep the network pipe busy, not so many that everything competes for the same limited bandwidth. Decoding runs on its own concurrent queue, off the main thread, so CPU-heavy decode work never competes with the thread that's drawing the next scroll frame — the same main-thread rule from the previous lesson's scroll-performance section, now showing up as a concrete design decision inside the loader itself.

## Common pitfalls

- **No de-duplication.** Two cells requesting the same URL simultaneously without joining an in-flight task doubles the network and decode cost for nothing.
- **Decoding at full resolution.** Skipping downsampling is the single most common cause of a fast, correct-looking image loader that still causes memory warnings in a photo-heavy screen.
- **Cancelling the task but not guarding the callback.** Cooperative cancellation can still let an in-flight decode finish and land late — always re-check a per-request token before applying the result to a view.

## Interview lens

If asked to design an image loader, start from the API a caller would actually write — `loadImage`, `cancelLoad`, `prefetch` — before talking about caches. It shows you're designing for the consumer, not just listing components.

When caching comes up, be precise about *why there are two layers*: memory holds decoded images for instant reuse but is RAM-bounded (LRU eviction), disk holds compressed bytes and can hold far more at the cost of a decode step. Conflating the two, or proposing only one, is a common tell of shallow depth.

On performance, the strongest signal is naming **downsampling** unprompted — decoding at target size instead of full size — since it's the highest-leverage fix and many candidates only think of adding caching. And always mention that cancellation is cooperative: a task can be told to cancel and still finish what it was doing, so a cheap per-request token check on the receiving end is what actually prevents a stale image from landing on the wrong cell.
