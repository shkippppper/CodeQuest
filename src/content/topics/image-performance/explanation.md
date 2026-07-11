## The problem: a 2MB file becomes a 50MB image

Load a photo from your bundle:

```swift
let image = UIImage(named: "sunset.jpg")
```

Check the file on disk: maybe 2MB, nicely compressed by JPEG. Now put that image in a small 100x100 thumbnail on screen and watch your app's memory jump by 50MB. Where did the other 48MB come from?

The file size and the memory size are almost unrelated numbers. This lesson is about why, and about the handful of techniques that keep image-heavy screens fast and lean.

## Decoding: the cost hiding behind `UIImage(named:)`

A JPEG or PNG on disk is **compressed** — its bytes are a mathematically packed encoding, not raw pixel data. Before anything can appear on screen, those compressed bytes must be **decoded**: unpacked into an uncompressed grid of pixel values the GPU can actually draw.

```swift
let image = UIImage(named: "sunset.jpg")   // just wraps the file reference — no decode yet
```

This line does almost no work. `UIImage(named:)` only prepares a lightweight object; the expensive part hasn't happened.

The decode happens later, the first time the image is actually drawn:

```swift
imageView.image = image   // <- decode happens around here, on first render
```

The moment the system needs pixels, it decodes the full image at its **native resolution** — the width and height baked into the file, which might be a 4000x3000 photo from a modern camera. Decoded memory is roughly `width * height * 4` bytes (4 bytes per pixel — one each for red, green, blue, alpha). A 4000x3000 photo decodes to 4000 × 3000 × 4 = 48,000,000 bytes — about 48MB — no matter how small the JPEG file was, and no matter how small the `UIImageView` displaying it is.

That's the surprise: decoding cost depends on the image's *pixel dimensions*, not its file size or its on-screen size.

## Downsampling: decode small in the first place

If you only need a 200x200 thumbnail, decoding all 12 million pixels of a 4000x3000 photo is wasted work — you'll immediately throw away over 99% of those pixels when the image is scaled down for display. **Downsampling** fixes this by decoding directly at a smaller size, so the wasted pixels are never produced.

The key API is `CGImageSourceCreateThumbnailAtSize`, from Image I/O:

```swift
func downsample(imageAt url: URL, to pointSize: CGSize, scale: CGFloat) -> UIImage? {
    let sourceOptions = [kCGImageSourceShouldCache: false] as CFDictionary
    guard let source = CGImageSourceCreateWithURL(url as CFURL, sourceOptions) else { return nil }

    let maxDimension = max(pointSize.width, pointSize.height) * scale
    let thumbnailOptions = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceShouldCacheImmediately: true,
        kCGImageSourceCreateThumbnailWithTransform: true,
        kCGImageSourceThumbnailMaxPixelSize: maxDimension,
    ] as CFDictionary

    guard let cgImage = CGImageSourceCreateThumbnailAtSize(source, 0, thumbnailOptions) else { return nil }
    return UIImage(cgImage: cgImage)
}
```

Walk through what each option buys you:

- `kCGImageSourceShouldCache: false` on the source — don't decode the full image just to inspect it.
- `kCGImageSourceThumbnailMaxPixelSize` — the actual downsample target, in pixels, not points. This is the number that controls decoded memory.
- `kCGImageSourceCreateThumbnailFromImageAlways` — always generate a fresh thumbnail from the original data, rather than trusting an embedded low-res preview that might be stale or too small.

Call it with the view's real pixel size, not its point size:

```swift
let thumb = downsample(imageAt: url, to: imageView.bounds.size, scale: UIScreen.main.scale)
```

Multiplying by `scale` matters: a 100x100-point image view on a 3x Retina screen needs 300x300 pixels to look sharp, so the target pixel size must account for the screen's scale factor.

Predict: for a 4000x3000 source photo downsampled to a 300x300-pixel target, how much decoded memory does the thumbnail use, versus decoding the full image?

Answer: roughly 300 × 300 × 4 = 360,000 bytes, versus 48,000,000 for the full decode — about 130x less memory, for a thumbnail that looks identical on screen.

## Caching: don't pay the decode cost twice

Downsampling controls how much you pay once. **Caching** controls how many times you pay it. Without a cache, scrolling a table view back and forth redecodes the same image every time its cell reappears — pure waste.

`NSCache` is the standard tool: a dictionary-like cache that automatically evicts entries under memory pressure, unlike a plain `Dictionary` which would happily hold everything until you crash.

```swift
final class ImageCache {
    static let shared = NSCache<NSString, UIImage>()
}

func cachedThumbnail(for url: URL, size: CGSize) -> UIImage {
    let key = url.absoluteString as NSString
    if let cached = ImageCache.shared.object(forKey: key) {
        return cached   // no decode — just a dictionary lookup
    }
    let thumb = downsample(imageAt: url, to: size, scale: UIScreen.main.scale) ?? UIImage()
    ImageCache.shared.setObject(thumb, forKey: key)
    return thumb
}
```

`NSCache` also has a `countLimit` and a `totalCostLimit` you can set, and it automatically purges entries when the system sends a memory-warning notification — behavior you'd otherwise have to write by hand.

A production pipeline layers two caches: an in-memory `NSCache` for instant redraws, and a disk cache (raw downsampled data, or a library like the one behind `AsyncImage`) so a relaunched app doesn't redownload and redecode images it already fetched. The memory cache is fast but empties on background/termination; the disk cache survives across launches but costs a file read instead of a dictionary lookup.

## `UIImage` vs `CGImage`: two layers of the same picture

`UIImage` is a friendly wrapper — it knows about scale, orientation, and animation frames, and integrates directly with UIKit views. Underneath, it wraps a `CGImage`, Core Graphics's lower-level bitmap type that Image I/O and downsampling APIs actually operate on.

```swift
let uiImage = UIImage(named: "sunset")
let cgImage = uiImage?.cgImage   // the underlying bitmap, no UIKit metadata
```

You reach for `CGImage` directly whenever you're doing pixel-level work — downsampling, cropping, applying a Core Image filter, or generating a thumbnail off the main thread — because it's the type the imaging frameworks (Image I/O, Core Graphics, Core Image) are built around. `UIImage` is what you hand back to a view once that work is done.

One practical detail: `UIImage(cgImage:)` doesn't know the source's orientation metadata unless you pass it explicitly — `kCGImageSourceCreateThumbnailWithTransform: true` above handles this by baking the correct orientation into the thumbnail so a portrait photo doesn't appear rotated.

## Async image pipelines: keep decoding off the main thread

Decoding a large image blocks whatever thread calls it — and `UIImage(named:)` decodes lazily on first draw, which usually means the **main thread**, right when a cell scrolls into view. Do that for a screen full of cells and you get dropped frames, visible as a stutter or "hitch."

The fix is to move decoding to a background queue and only hand the finished, already-decoded image back to the main thread for display:

```swift
func loadThumbnail(for url: URL, size: CGSize, completion: @escaping (UIImage) -> Void) {
    if let cached = ImageCache.shared.object(forKey: url.absoluteString as NSString) {
        completion(cached)
        return
    }
    DispatchQueue.global(qos: .userInitiated).async {
        let thumb = downsample(imageAt: url, to: size, scale: UIScreen.main.scale) ?? UIImage()
        ImageCache.shared.setObject(thumb, forKey: url.absoluteString as NSString)
        DispatchQueue.main.async { completion(thumb) }
    }
}
```

Notice the cache check stays synchronous and on the caller's thread — it's cheap — while the expensive downsample-and-decode work happens off the main thread, with only the final `UIImage` hop back for display.

The same shape appears in `async/await` form, and it's what libraries like Kingfisher, SDWebImage, and SwiftUI's `AsyncImage` do internally: check cache, decode off-thread if missing, cache the result, deliver on the main actor.

```swift
func loadThumbnail(for url: URL, size: CGSize) async -> UIImage {
    let key = url.absoluteString as NSString
    if let cached = ImageCache.shared.object(forKey: key) { return cached }
    let thumb = await Task.detached(priority: .userInitiated) {
        downsample(imageAt: url, to: size, scale: UIScreen.main.scale) ?? UIImage()
    }.value
    ImageCache.shared.setObject(thumb, forKey: key)
    return thumb
}
```

A cancellation detail worth knowing: in a fast-scrolling table or collection view, a cell can be reused before its image load finishes. If you don't cancel the stale load, an old request can win the race and paint the wrong image into a recycled cell — always cancel the previous task for a cell before starting a new one.

## Common pitfalls

- **Decoding at full resolution for a thumbnail.** Judge memory by pixel dimensions, not point size or file size — always downsample to the actual display size.
- **Skipping the cache.** Redecoding the same image on every scroll wastes CPU and causes hitches even if memory isn't the bottleneck.
- **Decoding on the main thread.** `UIImage(named:)` defers decode to first draw, which is usually the main thread — force decode work onto a background queue explicitly for anything large.
- **Not cancelling stale loads in reused cells.** A slow request that finishes after the cell was recycled paints the wrong image unless you check or cancel it.

## Interview lens

If asked "why does a small JPEG use so much memory," lead with the core fact: decoded memory is `width * height * 4` bytes, determined by the image's *pixel dimensions*, completely independent of its compressed file size. Then name the fix: downsample at decode time with `CGImageSourceCreateThumbnailAtSize`, targeting the view's actual pixel size (point size times screen scale) so you never decode more pixels than you'll display.

If pushed on caching, mention `NSCache` specifically — its automatic eviction under memory pressure is the reason to prefer it over a plain `Dictionary` for this job — and that production pipelines add a disk-cache layer so relaunches don't redownload data already fetched.

The senior-flavored follow-up is about threading: decoding blocks the calling thread, and since `UIImage` decodes lazily on first draw, that's often the main thread unless you force the work elsewhere. Describe the shape — check cache, decode off the main thread, cache and hand back the result on the main thread — and mention cancelling stale requests when cells get reused, since that's the bug that actually ships if you get async image loading wrong.
