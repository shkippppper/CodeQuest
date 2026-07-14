import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "fs-sandbox-what",
    type: "mcq",
    prompt: "What is the iOS app sandbox?",
    options: [
      "A private folder each app is confined to; it can't freely read or write outside it",
      "A simulator-only debugging mode that isolates file access so file operations on the simulator can't accidentally modify the host macOS filesystem",
      "A cache the OS clears every launch to ensure apps always start with a clean slate and can't accumulate stale data between sessions",
      "A shared folder every app on the device can read, giving them access to common assets like system fonts and shared preference files",
    ],
    answer: 0,
    explanation:
      "Every iOS app is confined to its own private directory tree — the **sandbox** — and cannot read or write arbitrary paths on the device outside it.",
  },
  {
    id: "fs-directory-choice",
    type: "mcq",
    prompt: "You're caching downloaded thumbnails that can be re-fetched anytime. Which directory should they live in?",
    options: [
      "Caches directory",
      "Documents directory",
      "The app bundle",
      "/tmp only, never deleted",
    ],
    answer: 0,
    explanation:
      "Regenerable data belongs in **Caches** — it isn't backed up and the system may purge it under disk pressure, which is fine since you can re-download it.",
  },
  {
    id: "fs-documents-review-fill",
    type: "fill",
    prompt: "Putting large, re-downloadable files in the Documents directory can get an app rejected in App ___, because Documents is backed up to iCloud/iTunes.",
    answers: ["Review"],
    hint: "The process Apple runs before an app reaches the store.",
    explanation:
      "Documents is backed up automatically, so Apple's App Review guidelines flag apps that dump large regenerable caches there instead of using the Caches directory.",
  },
  {
    id: "fs-createdir-predict",
    type: "predict",
    prompt: "What happens when this runs, given that neither `Photos` nor `2024` exists yet inside Documents?",
    code: `let target = docs.appendingPathComponent("Photos").appendingPathComponent("2024")
try fm.createDirectory(at: target, withIntermediateDirectories: false)`,
    options: [
      "It throws an error because the parent `Photos` folder doesn't exist",
      "It silently creates both folders, treating the missing intermediate directories as if withIntermediateDirectories were true regardless of what was passed",
      "It creates `2024` as a top-level directory inside Documents and ignores the missing `Photos` path component entirely",
      "It compiles but does nothing at runtime, returning without error or side effects because the target already conceptually exists as a path string",
    ],
    answer: 0,
    explanation:
      "`withIntermediateDirectories: false` means only the final path component is created — since `Photos` doesn't exist yet, the call throws. Passing `true` would create the whole chain, like `mkdir -p`.",
  },
  {
    id: "fs-url-vs-string-multi",
    type: "multi",
    prompt: "Select all true statements about `URL` vs plain string paths for file work.",
    options: [
      "URL is a structured type with components like `lastPathComponent` and `pathExtension`",
      "Most modern FileManager APIs take a URL as the primary parameter",
      "String paths are inherently safer for concurrent access",
      "`appendingPathComponent` avoids manual slash concatenation bugs",
    ],
    answers: [0, 1, 3],
    explanation:
      "URL gives you structured access (components, extension) and is what modern APIs prefer; building paths with `appendingPathComponent` avoids hand-rolled string concatenation. String paths aren't inherently safer for concurrency — that's what file coordination is for.",
  },
  {
    id: "fs-atomic-write",
    type: "mcq",
    prompt: "Why pass `atomically: true` when writing a file?",
    options: [
      "It writes to a temp file first and swaps it in, so a crash mid-write can't leave a corrupted file",
      "It makes the write happen on a background thread automatically, releasing the main thread so the UI stays responsive during large file saves",
      "It encrypts the file using the device's hardware secure enclave before committing the data to the filesystem at the target path",
      "It guarantees the file is backed up to iCloud on the next sync cycle by adding it to the special protected backup manifest maintained by the OS",
    ],
    answer: 0,
    explanation:
      "Atomic writes go to a temporary location and are swapped into place only once complete, protecting against half-written files if the process is killed mid-write.",
  },
  {
    id: "fs-large-file-fill",
    type: "fill",
    prompt: "For files too large to load entirely into memory, prefer FileHandle or an InputStream over `Data(contentsOf:)`, which reads the whole file at ___.",
    answers: ["once"],
    hint: "One word — describes loading everything in a single shot.",
    explanation:
      "`Data(contentsOf:)` and `String(contentsOf:)` load the entire file into memory in one shot. For large files, chunked reading via `FileHandle`/`InputStream` avoids a memory spike.",
  },
  {
    id: "fs-coordination-senior",
    type: "mcq",
    prompt: "Your app and a share extension both write to the same file in a shared App Group container. What should you use to prevent them from corrupting each other's writes?",
    options: [
      "NSFileCoordinator to coordinate the read/write across processes",
      "atomically: true alone is sufficient, since atomic writes use a rename which is guaranteed to be atomic at the OS level across all processes sharing the same volume",
      "FileProtectionType.complete, which serializes access to the file by blocking any process that doesn't hold the device's decryption key at that moment",
      "A DispatchQueue.sync inside just your app, since the share extension always runs on the same OS-level thread pool and therefore shares the same serial queue automatically",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Atomic writes and a local dispatch queue only protect against races *within one process*. When two separate processes (app + extension) touch the same file, you need **NSFileCoordinator**, which negotiates access across processes via the system.",
  },
  {
    id: "fs-protection-senior",
    type: "predict",
    prompt: "🧠 A background URLSession task needs to read a downloaded file while the device is locked, shortly after the user rebooted and unlocked once. Which file protection level allows this?",
    code: `try fm.setAttributes([.protectionKey: FileProtectionType.???], ofItemAtPath: url.path)`,
    options: [
      "completeUntilFirstUserAuthentication — readable after the first post-reboot unlock, even while later locked",
      "complete — the file remains readable at all times since complete protection only restricts writes, leaving reads available to any background process",
      "none — no protection is applied by default, so every file in the app container is accessible to any process without requiring an unlock event",
      "completeUnlessOpen — the default for background downloads, keeping the file readable as long as it was opened by at least one process before the screen locked",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`.completeUntilFirstUserAuthentication` (the default protection level for most files) keeps data readable once the device has been unlocked at least once since boot, so background tasks can access it even while the screen is later locked. `.complete` would block that background read entirely.",
  },
  {
    id: "fs-flashcard",
    type: "flashcard",
    prompt:
      "Explain the iOS sandbox directory model and how it should shape where you store files. Answer aloud, then reveal.",
    modelAnswer:
      "Every app runs inside a private **sandbox** and gets a few standard directories via `FileManager.urls(for:in:)` rather than hard-coded paths, because the container path changes on reinstall. **Documents** holds user-generated content, is backed up to iCloud/iTunes, and Apple's App Review can reject apps that dump large regenerable data there. **Caches** holds data you can regenerate — downloaded images, computed results — is never backed up, and the system may purge it under disk pressure while the app isn't running. **tmp** (`temporaryDirectory`) is for short-lived scratch files the system can wipe anytime the app isn't running; you should clean it up yourself. Prefer `URL` over string paths for building file locations. Write with `atomically: true` so a crash mid-write can't corrupt the file. When multiple processes (an app and an extension) share a file, use `NSFileCoordinator` to avoid concurrent-write corruption — that's a different concern from `NSFileProtectionType`, which controls whether a file is readable while the device is locked (default `.completeUntilFirstUserAuthentication`, strongest is `.complete`). Sensitive secrets like tokens belong in the Keychain, not a protected file.",
    keyPoints: [
      "Ask FileManager for directory URLs; never hard-code the sandbox path",
      "Documents = user data, backed up, review-sensitive about size",
      "Caches = regenerable, not backed up, can be purged",
      "tmp = short-lived, system can wipe anytime",
      "atomically: true for crash-safe writes; NSFileCoordinator for cross-process safety",
      "File protection (readable-while-locked) is separate from Keychain (secrets)",
    ],
    explanation:
      "A senior answer distinguishes the three standard directories by backup/purge behavior, separates file coordination (cross-process races) from file protection (lock-state readability), and knows Keychain — not file protection — is the right home for secrets.",
  },
];

export default quiz;
