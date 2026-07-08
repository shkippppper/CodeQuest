## The problem: one thread draws everything

Here's a button handler:

```swift
@IBAction func buttonTapped() {
    let image = downloadAndDecode(bigImageURL)   // takes 3 seconds
    imageView.image = image
}
```

Tap the button and the entire app freezes for three seconds. No scrolling, no animation, no response to touches.

Why? Every app has one **main thread** — the thread that draws the screen and handles user input. While `downloadAndDecode` runs on it, nothing else can happen there.

The fix is to run slow work somewhere else. **Grand Central Dispatch** — GCD — is Apple's low-level API for handing work to background threads without you creating or managing a single thread yourself. Even in the async/await era, GCD fills existing codebases and interview questions.

## You submit work to queues, not threads

The core move in GCD is one line:

```swift
let queue = DispatchQueue(label: "com.app.work")
queue.async {
    print("running in the background")
}
```

You never say "make me a thread". You make a *queue* — a waiting line for chunks of work — and GCD runs its contents on a pool of threads that it owns and reuses.

### Serial queues run one task at a time

```swift
let serial = DispatchQueue(label: "com.app.serial")
serial.async { stepOne() }
serial.async { stepTwo() }   // won't start until stepOne finishes
```

By default a queue is **serial**: one task at a time, in the order they were added. That guarantee is useful on its own — if all access to some shared data goes through one serial queue, two tasks can never touch it at the same moment.

### Concurrent queues run many at once

```swift
let concurrent = DispatchQueue(label: "com.app.concurrent",
                               attributes: .concurrent)
concurrent.async { taskA() }
concurrent.async { taskB() }   // may run at the same time as taskA
```

Add `.concurrent` and the queue is **concurrent**: it can hand several of its tasks to different threads simultaneously.

### The main queue is special

```swift
DispatchQueue.main.async {
    imageView.image = image   // UI work belongs here
}
```

`DispatchQueue.main` is a built-in serial queue whose tasks run on the main thread. All UI updates must go through it — that rule comes back at the end of this lesson, and again in the `@MainActor` lesson later.

## async returns immediately, sync waits

There are two ways to hand work to a queue. First, `async`:

```swift
print("A")
queue.async { print("B") }
print("C")   // does not wait for B
```

`async` means: put the closure in the queue and *return immediately*. "A" prints, then "C" prints right away, and "B" prints whenever the queue gets around to it.

Now the other one, `sync`:

```swift
print("A")
queue.sync { print("B") }
print("C")   // waits — B has definitely printed by now
```

`sync` means: put the closure in the queue and *block the caller* — stand still and wait — until it has finished. The output is always A, B, C.

Prefer `async` unless you have a specific reason to block. `sync` is also the ingredient in GCD's most famous trap, coming up shortly.

## The classic pattern: work in the back, UI on main

Put the two pieces together and you get the idiom that fixed our frozen button:

```swift
DispatchQueue.global().async {
    let image = downloadAndDecode(bigImageURL)   // off the main thread
    DispatchQueue.main.async {
        self.imageView.image = image             // hop back to main for UI
    }
}
```

Heavy work runs on a background queue, so the main thread stays free. When the result is ready, a second dispatch bounces back to `main` to touch the UI.

This "background async, then main async" sandwich is *the* GCD pattern. If you remember one shape from this lesson, remember this one.

## Telling the system how urgent the work is

That `DispatchQueue.global()` call takes an argument:

```swift
DispatchQueue.global(qos: .userInitiated).async {
    let doc = openDocument()   // the user is actively waiting for this
}
```

`global(qos:)` returns a shared concurrent background queue at a chosen **quality-of-service** level — a label telling the system how much CPU time and battery to spend on this work. There are four everyday levels:

- `.userInteractive` — tied to an animation or interaction happening *right now*; must be instant.
- `.userInitiated` — the user tapped something and is waiting for the result, like opening a document.
- `.utility` — longer work with visible progress, like a download.
- `.background` — invisible maintenance the user never asked about: prefetching, cleanup.

Higher levels get more CPU and more energy. Pick the *lowest* level that fits the job, so the system can save battery.

## Waiting for several tasks to all finish

Say you're downloading five files and want to run something after *all* of them complete. Each download is async — how do you know when the last one lands?

```swift
let group = DispatchGroup()
```

A `DispatchGroup` is a counter for in-flight work. You tell it when work starts and when work ends:

```swift
for url in urls {
    group.enter()                      // +1: a download began
    download(url) {
        group.leave()                  // -1: this download finished
    }
}
```

Then you ask to be notified when the counter returns to zero:

```swift
group.notify(queue: .main) {
    print("all downloads done")        // runs after the last leave()
}
```

One rule matters above all: every `enter()` must be balanced by exactly one `leave()`. Miss a `leave` and `notify` never fires; call `leave` too many times and you crash.

`notify` is the non-blocking way to react. There's also `group.wait()`, which blocks the calling thread until the group empties — use it rarely, and never on the main thread.

## Barriers: many readers, one writer

Concurrent queues have one more trick. Watch the flag:

```swift
let queue = DispatchQueue(label: "rw", attributes: .concurrent)

queue.async { read() }                       // reads run together
queue.async { read() }
queue.async(flags: .barrier) { write() }     // runs ALONE
queue.async { read() }                       // waits for the write
```

A **barrier** task waits for every task ahead of it to finish, then runs with the whole queue to itself — nothing else runs alongside it. When it finishes, later tasks flow again.

That gives you the classic reader-writer setup: many simultaneous reads (safe, nobody is changing anything), but each write gets exclusive access. It's a lock built out of a queue.

## The deadlock everyone asks about

Time to predict. This code runs on the main thread. What happens?

```swift
// currently ON the main thread
DispatchQueue.main.sync {
    print("hello")
}
```

Answer: "hello" never prints, and the app freezes forever.

Walk it through. `sync` blocks the main thread until the closure finishes. But the closure is queued on `main` — a serial queue — and the main queue can't start it until the main thread is free. The thread is waiting for the closure; the closure is waiting for the thread.

Two parties each waiting for the other, forever, is a **deadlock**. This exact line is the single most-asked GCD interview question.

The general rule: never call `sync` targeting the serial queue you are currently running on. `DispatchQueue.main.sync` is just the most common way to break that rule, because so much code already runs on main.

## Common pitfalls

- **`DispatchQueue.main.sync` from the main thread.** Instant deadlock, as above. If you might already be on main, use `async` or check first.
- **Touching UI from a background queue.** Works sometimes, corrupts layout or crashes other times. Always bounce UI updates through `DispatchQueue.main.async`.
- **Unbalanced `enter`/`leave` on a group.** A missing `leave` means `notify` silently never fires — a bug that looks like "the completion just doesn't run."
- **Dispatching lots of *blocking* work to global queues.** Each blocked task ties up a thread, and GCD keeps creating more — **thread explosion**, where hundreds of threads choke the system. This is one reason Swift's newer structured concurrency (its own lesson later) keeps a small, fixed pool instead.
- **Defaulting everything to high QoS.** Pick the lowest level that fits; the system uses it to manage energy.

## Interview lens

The near-guaranteed question is "what happens if you call `DispatchQueue.main.sync { }` from the main thread?" Answer: deadlock — `sync` blocks the current thread waiting for the queue, but that queue needs the current thread to run the closure. Explaining *why*, not just naming it, is what scores.

Be ready to define `sync` versus `async` in one breath: `async` enqueues and returns immediately; `sync` enqueues and blocks until done. And state the UI rule plainly: all UI work goes through the main queue because UIKit is only safe on the main thread.

Expect "serial vs concurrent queue" (one at a time in order, versus many at once) and the barrier pattern — say "concurrent reads, exclusive writes" and you've named the reader-writer lock. Mention QoS and that you pick the lowest level that fits, for battery.

For senior polish: bring up `DispatchGroup` for "wait for N async things" with the balanced enter/leave rule, and note that GCD manages the thread pool for you — but over-dispatching blocking work causes thread explosion, which is part of why structured concurrency later moved to a capped pool.
