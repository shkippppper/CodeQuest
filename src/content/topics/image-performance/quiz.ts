import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "imgperf-decode-cost",
    type: "mcq",
    prompt: "What primarily determines an image's decoded memory footprint?",
    options: [
      "Its pixel dimensions (width x height x 4 bytes)",
      "Its compressed file size on disk",
      "The file format (JPEG vs PNG)",
      "The UIImageView's frame size in points",
    ],
    answer: 0,
    explanation:
      "Decoded memory is roughly `width * height * 4` bytes, based on the image's native pixel dimensions — a small compressed file can still decode to tens of megabytes if its source resolution is high.",
  },
  {
    id: "imgperf-predict-decode",
    type: "predict",
    prompt: "When does the expensive decode actually happen here?",
    code: `let image = UIImage(named: "sunset.jpg")   // line A
imageView.image = image                     // line B, first draw`,
    options: [
      "Around line B, the first time the image is actually rendered",
      "Immediately at line A",
      "Never — UIImage never decodes",
      "Only when the app terminates",
    ],
    answer: 0,
    explanation:
      "`UIImage(named:)` just wraps a reference to the file. The costly decode into raw pixel data is deferred until the image is first drawn, which is usually where the memory spike and any main-thread stutter show up.",
  },
  {
    id: "imgperf-downsample-fill",
    type: "fill",
    prompt: "Decoding an image directly at a smaller target size, instead of decoding at full resolution and scaling down, is called ___.",
    answers: ["downsampling", "down-sampling"],
    hint: "Starts with 'down'.",
    explanation:
      "Downsampling decodes straight to the pixel dimensions you actually need, avoiding the memory and CPU cost of producing pixels you'll immediately discard.",
  },
  {
    id: "imgperf-ncache-mcq",
    type: "mcq",
    prompt: "Why prefer `NSCache` over a plain `Dictionary` for an in-memory image cache?",
    options: [
      "NSCache automatically evicts entries under memory pressure",
      "NSCache is faster at every lookup",
      "Dictionary cannot store UIImage values",
      "NSCache persists to disk automatically",
    ],
    answer: 0,
    explanation:
      "`NSCache` behaves like a dictionary but automatically purges entries when the system is low on memory, which a plain `Dictionary` will never do on its own — you'd have to implement eviction yourself.",
  },
  {
    id: "imgperf-uiimage-cgimage-multi",
    type: "multi",
    prompt: "Select all statements that are true of `UIImage` versus `CGImage`.",
    options: [
      "UIImage wraps a CGImage and adds scale/orientation metadata",
      "CGImage is the type most Image I/O and downsampling APIs operate on",
      "CGImage integrates directly with UIKit view properties like `.image`",
      "UIImage always eagerly decodes at initialization time",
    ],
    answers: [0, 1],
    explanation:
      "`UIImage` is the UIKit-friendly wrapper around a lower-level `CGImage` bitmap; Core Graphics and Image I/O APIs work on `CGImage` directly. `UIImage` does not directly assign to view properties (option 3 reverses the relationship) and it decodes lazily, not eagerly (option 4 is false).",
  },
  {
    id: "imgperf-main-thread-senior",
    type: "predict",
    prompt: "A table view stutters while scrolling through photo thumbnails loaded with plain `UIImage(named:)`. What's the most likely cause?",
    code: `cell.imageView.image = UIImage(contentsOfFile: largePhotoPath)`,
    options: [
      "Decoding happens lazily on first draw, which is blocking the main thread as cells scroll into view",
      "UIImage caches too aggressively",
      "The disk read is instantaneous so this can't be the cause",
      "SwiftUI is required to avoid this",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Since decode is deferred to first render, assigning a large undecoded image directly to a cell forces the decode to happen synchronously on the main thread right as the cell appears — the classic cause of scroll hitches. The fix is decoding off the main thread ahead of time and handing back a ready `UIImage`.",
  },
  {
    id: "imgperf-cancel-senior",
    type: "mcq",
    prompt: "In a reusable table/collection view cell, why must you cancel a previous async image load before starting a new one?",
    options: [
      "A slow, stale load can finish after the cell is recycled and paint the wrong image into it",
      "Cancelling is required by NSCache's API",
      "Uncancelled loads leak memory permanently with no other symptom",
      "It has no effect — cells always show the latest assigned image",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Cells are reused as the user scrolls. If an older image request for a recycled cell finishes after a newer one started, its completion handler can overwrite the correct image with a stale one unless you cancel or check relevance before applying the result.",
  },
  {
    id: "imgperf-flashcard",
    type: "flashcard",
    prompt: "Explain the full image performance story: decode cost, downsampling, caching, and threading. Answer aloud, then reveal.",
    modelAnswer:
      "A compressed file (JPEG/PNG) must be **decoded** into raw pixels before it can be drawn, and decoded memory is roughly `width * height * 4` bytes — driven entirely by the source's **native resolution**, not its file size or on-screen size. **Downsampling** with `CGImageSourceCreateThumbnailAtSize` (targeting the view's pixel size, i.e. point size times screen scale) decodes directly at the needed size, avoiding wasted pixels. An **`NSCache`** avoids repeating that decode work every time a view reappears, and it auto-evicts under memory pressure unlike a plain dictionary; production pipelines add a disk cache too. `UIImage` wraps the lower-level `CGImage` that Image I/O and Core Graphics actually operate on. Because decode is lazy — happening on first draw, typically the main thread — expensive decoding should be pushed to a background queue, with only the finished `UIImage` handed back to the main thread; in reusable cells, stale in-flight loads must be cancelled so they don't paint into a recycled cell after it's moved on.",
    keyPoints: [
      "Decoded size = width * height * 4, independent of file size",
      "Downsampling decodes at target pixel size (point size * scale) instead of full resolution",
      "NSCache auto-evicts under memory pressure; add a disk cache for cross-launch persistence",
      "UIImage wraps CGImage; CGImage is what Image I/O/Core Graphics operate on",
      "Decode is lazy on first draw — do it off the main thread, cancel stale loads in reused cells",
    ],
    explanation:
      "A senior answer connects all four pieces into one pipeline: downsample to avoid decoding pixels you don't need, cache to avoid repeating the decode, and move that decode off the main thread with cancellation for reused cells.",
  },
];

export default quiz;
