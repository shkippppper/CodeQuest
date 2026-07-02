## The problem: doing work off the main thread

Your app has one **main thread**, and it must stay free to draw UI and respond to touches. Do anything slow there — a network parse, a disk read, image decoding — and the app freezes. **Grand Central Dispatch (GCD)** is Apple's C-level API for handing work to background threads and coordinating it, without you managing threads by hand. Even in the async/await era, GCD is everywhere in existing code and a staple interview topic.

## Queues: serial vs concurrent

You don't create threads in GCD — you submit work to **queues**, and GCD runs it on a pool of threads it manages.

- A **serial** queue runs one task at a time, in order (FIFO). Great for protecting shared state.
- A **concurrent** queue can run many tasks at once.

```swift
let serial = DispatchQueue(label: "com.app.serial")
let concurrent = DispatchQueue(label: "com.app.concurrent", attributes: .concurrent)
```

The **main queue** (`DispatchQueue.main`) is a special serial queue that runs on the main thread — that's where all UI work must happen.

## Sync vs async dispatch

Two ways to submit work:

- **`async`** — enqueue the work and return **immediately**; it runs later.
- **`sync`** — enqueue the work and **block the caller** until it finishes.

```swift
DispatchQueue.global().async {
    let data = heavyWork()          // off the main thread
    DispatchQueue.main.async {
        updateUI(with: data)        // hop back to main for UI
    }
}
```

That "do work on a background queue, then bounce to `main.async` for the UI" pattern is the classic GCD idiom.

## Main vs global queues & QoS

`DispatchQueue.global(qos:)` gives you a shared concurrent background queue at a **quality-of-service** level, which tells the system how to prioritize:

- `.userInteractive` — work tied to a running animation/UI, must be instant.
- `.userInitiated` — the user is waiting for a result (e.g. opening a document).
- `.utility` — long-running with a progress bar (downloads).
- `.background` — invisible maintenance (prefetch, cleanup).

Higher QoS gets more CPU and energy. Pick the lowest level that fits, so the system can save battery.

## Dispatch groups

A **`DispatchGroup`** lets you wait for several async tasks to all finish, then run a completion.

```swift
let group = DispatchGroup()
for url in urls {
    group.enter()
    download(url) { group.leave() }   // balance every enter with a leave
}
group.notify(queue: .main) {
    print("all downloads done")       // runs after the last leave
}
```

Every `enter()` must be balanced by exactly one `leave()`, or `notify` never fires (or crashes). `notify` is the non-blocking way to react; `group.wait()` blocks the caller.

## Barriers

On a **concurrent** queue, a **barrier** task waits for all prior tasks to finish, runs alone (nothing else runs concurrently), then lets later tasks resume. This is the classic **reader-writer lock**: many concurrent reads, exclusive writes.

```swift
let queue = DispatchQueue(label: "rw", attributes: .concurrent)
queue.async { read() }                              // concurrent reads
queue.async(flags: .barrier) { write() }           // exclusive write
```

## Deadlocks

The single most-tested GCD trap: **calling `sync` on a serial queue you're already running on deadlocks.** The `sync` waits for the queue to be free, but the queue is busy waiting for `sync` to return — forever.

```swift
DispatchQueue.main.sync { }   // 💥 from the main thread: instant deadlock
```

Rules of thumb: never call `.sync` targeting the current serial queue; be very careful with `DispatchQueue.main.sync` (it deadlocks if you're already on main); prefer `async` unless you have a specific reason to block.

## The interview lens

The guaranteed question: *"What happens if you call `DispatchQueue.main.sync { }` from the main thread?"* — **deadlock**, because `sync` blocks the current thread waiting for the queue that the current thread is holding. Explain `sync` (blocks) vs `async` (returns immediately), and why UI must be dispatched to `.main`.

Expect *"serial vs concurrent queue"* and the **barrier** pattern for reader-writer locks, plus **QoS** (pick the lowest level that fits, for energy). Bonus: `DispatchGroup` for fan-out/fan-in with balanced `enter()`/`leave()`, and knowing that GCD manages a thread pool so you should never spin up threads yourself (over-dispatching blocking work causes **thread explosion** — a reason structured concurrency now caps the pool).
