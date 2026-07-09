## The problem: your app can't touch just anywhere

Try this in a macOS command-line tool and it works fine:

```swift
let data = "hello".data(using: .utf8)!
try data.write(to: URL(fileURLWithPath: "/Users/ada/Desktop/notes.txt"))
```

Run the same line inside an iOS app and it throws an error. iOS apps don't get free access to the disk — each app is locked inside its own private folder, and it can't read or write anywhere else.

That private folder is called the **sandbox**. This lesson is about what's inside it, how `FileManager` reads and writes there, and how to do it without corrupting your own data.

## Finding your way around the sandbox

Every app gets a handful of directories inside its sandbox, and you never hard-code their paths — you ask for them, because the exact path changes between installs and OS versions.

```swift
let fm = FileManager.default
let docs = fm.urls(for: .documentDirectory, in: .userDomainMask).first!
print(docs)
// file:///.../Data/Application/<UUID>/Documents/
```

That `<UUID>` is different every time the app is reinstalled — which is exactly why you ask `FileManager` for the URL instead of remembering it.

Three directories cover almost everything you'll need:

```swift
let documents = fm.urls(for: .documentDirectory, in: .userDomainMask).first!
let caches    = fm.urls(for: .cachesDirectory,   in: .userDomainMask).first!
let temp      = fm.temporaryDirectory
```

Each one has a different deal with the system, and picking the wrong one is a common review-flagged bug:

- **Documents** — user-generated data. It's backed up to iCloud/iTunes automatically, so Apple's review guidelines say don't put re-downloadable files here (large caches will get your app rejected).
- **Caches** — data you can regenerate, like downloaded images. Never backed up, and the system may delete it under disk pressure when your app isn't running.
- **tmp** (`temporaryDirectory`) — short-lived scratch files. The system can wipe it any time your app isn't running, and you should delete files here yourself once you're done with them.

Predict: you're building a photo editor that lets users export a PDF. Where should the finished PDF go, and where should the downloaded stock-photo thumbnails go?

Answer: the finished PDF is user-generated output the user cares about — **Documents**. The stock-photo thumbnails can be re-downloaded any time — **Caches**.

## FileManager: the one object for filesystem work

`FileManager.default` is a singleton — one shared instance — that does the actual work: creating folders, listing contents, checking existence, deleting things.

```swift
let fm = FileManager.default

fm.fileExists(atPath: docs.path)                 // Bool
try fm.createDirectory(at: docs.appendingPathComponent("Photos"),
                        withIntermediateDirectories: true)
let items = try fm.contentsOfDirectory(at: docs, includingPropertiesForKeys: nil)
try fm.removeItem(at: docs.appendingPathComponent("old.txt"))
```

`withIntermediateDirectories: true` matters the moment your path is more than one level deep — it's the difference between `mkdir` and `mkdir -p`. Without it, creating `Documents/Photos/2024` fails unless `Photos` already exists.

## URLs vs paths: two ways to point at the same file

Older APIs use a plain string path like `"/Documents/notes.txt"`. Modern APIs use `URL`, a structured type that knows about path components, extensions, and (for network URLs) schemes and hosts.

```swift
let stringPath = docs.path + "/notes.txt"                       // "/…/Documents/notes.txt"
let fileURL = docs.appendingPathComponent("notes.txt")           // URL
```

Both describe the same file, but the `URL` version is safer to build up piece by piece — no manual slash-concatenation to get wrong:

```swift
let nested = docs
    .appendingPathComponent("Photos")
    .appendingPathComponent("2024")
    .appendingPathComponent("beach.jpg")
```

Two properties you'll reach for constantly:

```swift
nested.lastPathComponent   // "beach.jpg"
nested.pathExtension       // "jpg"
nested.deletingLastPathComponent()  // the parent folder's URL
```

Prefer `URL` over raw strings for anything you build yourself — nearly every modern `FileManager` method takes a `URL` first and a path-string version only as a fallback.

## Reading and writing files

For anything that fits comfortably in memory — text, JSON, a small image — `Data` and `String` have file-based initializers and write methods:

```swift
let text = "Hello, sandbox"
try text.write(to: fileURL, atomically: true, encoding: .utf8)

let readBack = try String(contentsOf: fileURL, encoding: .utf8)
print(readBack)   // "Hello, sandbox"
```

`atomically: true` writes to a temporary file first, then swaps it into place — so a crash mid-write can never leave you with a half-written file.

Binary data works the same way, and it's what you'll use for images, archives, or your own `Codable` payloads:

```swift
let payload = try JSONEncoder().encode(["score": 42])
try payload.write(to: fileURL, options: .atomic)

let loaded = try Data(contentsOf: fileURL)
let dict = try JSONDecoder().decode([String: Int].self, from: loaded)
```

For files too big to hold in memory at once — video, large downloads — reach for `FileHandle` or `InputStream` instead, which read in chunks rather than loading everything up front. That's a topic of its own; the key thing to remember here is that `Data`/`String` convenience APIs are for small files, not streaming ones.

## File coordination and protection

Two files racing to write the same URL at once — say, your main app and a share extension — can corrupt each other's writes. `NSFileCoordinator` exists to prevent that:

```swift
let coordinator = NSFileCoordinator()
var coordError: NSError?

coordinator.coordinate(writingItemAt: fileURL, options: [], error: &coordError) { safeURL in
    try? payload.write(to: safeURL)
}
```

The coordinator asks every other process that registered interest in that file to pause, performs your write, then lets everyone resume — this is **file coordination**: a system-managed handshake that stops concurrent readers and writers from stepping on each other. You mainly need it when multiple processes (an app and its extensions, or an app and a Files-app provider) touch the same file.

Protection is a separate concern from coordination — it's about *who* can read the file, not *when*. Every file gets a protection level that controls whether it's readable while the device is locked:

```swift
try fm.setAttributes(
    [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication],
    ofItemAtPath: fileURL.path
)
```

`.complete` encrypts the file so it's unreadable until the device is unlocked — the strongest setting, right for anything sensitive like auth tokens. `.completeUntilFirstUserAuthentication` (the default for most apps) keeps files readable after the *first* unlock post-reboot, which lets background tasks read data even while the phone is later locked again.

## Common pitfalls

- **Hard-coding a Documents path.** The sandbox UUID changes on reinstall; always ask `FileManager` with `.urls(for:in:)` rather than storing an absolute path.
- **Putting re-downloadable caches in Documents.** App Review can reject apps that back up large regenerable files to iCloud this way — use `.cachesDirectory` instead.
- **Loading huge files with `Data(contentsOf:)`.** That reads the whole file into memory at once; for large files use `FileHandle` or a stream so you're not spiking memory.
- **Skipping `atomically: true`.** A non-atomic write interrupted by a crash or termination can leave a corrupted, half-written file on disk.

## Interview lens

If asked "where would you store X," the answer should name the directory *and* justify it by re-downloadability and backup behavior: user-created content goes in Documents (backed up, review-sensitive about size), regenerable data goes in Caches (not backed up, can be purged), and short-lived scratch data goes in tmp (can vanish anytime the app isn't running).

If asked about writing files safely, mention atomic writes (`atomically: true` / `.atomic`) as the crash-safety mechanism, and bring up `NSFileCoordinator` specifically when multiple processes — an app and an extension — might touch the same file at once. That's the detail that separates "I've read files before" from "I've shipped a share extension."

If asked about sensitive data, don't reach for the file system's protection levels as your first answer — Keychain is the right place for secrets like tokens and passwords. Mention `NSFileProtectionType` only for files that must stay on disk but should be unreadable while the device is locked, and know that `.completeUntilFirstUserAuthentication` is the default, not `.complete`.
