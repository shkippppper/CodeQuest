## The problem: bugs that only happen sometimes

Run this seemingly innocent code:

```swift
var counter = 0

// two tasks running at the same time, each doing:
for _ in 0..<1000 {
    counter += 1
}
```

Two tasks, a thousand increments each. Predict: what's `counter` at the end?

Answer: *you can't know.* Maybe 2000. Maybe 1400. Maybe a different number every run. The result depends on how the two tasks' operations happened to interleave — and that changes with the device, the load, and the phase of the moon.

Bugs like this are **non-deterministic** — they don't produce the same result every run, which is what makes them the worst kind. The code passes a thousand test runs, then corrupts data on the thousand-and-first, in release builds only, on one customer's phone. This lesson catalogs the classic failure modes and the tools that make them reproducible.

## Why the counter loses updates

Zoom into `counter += 1`. It looks like one operation, but the machine performs three:

```swift
counter += 1
// 1. read the current value        (reads 0)
// 2. add one                        (computes 1)
// 3. write the result back          (writes 1)
```

Now interleave two tasks:

```swift
// Task A: reads 0
// Task B: reads 0        ← before A finished writing
// Task A: writes 1
// Task B: writes 1       ← overwrites... also 1
```

Both tasks incremented, but the counter went up by one. An update vanished.

This is a **race condition**: the outcome depends on the unpredictable timing of concurrent operations. The canonical trigger is exactly this — a read-modify-write on shared state that isn't protected.

The fixes, in order of preference:

- **Don't share.** Give each task its own local value; combine results at the end. Value types are copied on assignment, so they can't race.
- **Isolate.** Put the mutable state inside an actor — a type that serializes all access to its state, so only one task touches it at a time.
- **Synchronize.** A serial queue or a lock, if you must manage it by hand.

Swift's `Sendable` checking exists to catch this whole category at compile time: the compiler refuses to let non-thread-safe state cross into concurrent code.

## Two tasks waiting on each other forever

Race conditions corrupt data. The next pitfall stops it entirely.

```swift
// Task 1: acquires lock A... then tries to take lock B
// Task 2: acquires lock B... then tries to take lock A
```

Task 1 holds A and waits for B. Task 2 holds B and waits for A. Each is waiting for the other to let go. Neither ever will.

That circular wait is a **deadlock** — every party holds something another party needs, so nobody proceeds. No crash, no error. The app just stops responding.

The famous single-line version doesn't even need two locks:

```swift
// running on the main thread:
DispatchQueue.main.sync {
    updateUI()
}
// ☠️ frozen forever
```

Walk it through. `sync` means "block this thread until the queue runs my closure." But the main queue runs its work *on the main thread* — the very thread now blocked waiting. The thread is waiting for itself. Instant deadlock.

Defenses:

- Acquire locks in a consistent global order — if every task takes A before B, the circle can't form.
- Prefer `async` over blocking `sync` calls; a suspended task releases its thread, a blocked one doesn't.
- Let actors serialize your state instead of hand-rolling lock choreography.

## High-priority work stuck behind low-priority work

Here's a subtler stall:

```swift
// A .background task acquires a lock, starts slow work
// A .userInteractive task (driving the UI!) tries the same lock — blocked
// Meanwhile, medium-priority tasks keep the CPU busy,
// so the .background task barely gets scheduled
```

The UI task is nominally the most important thing in the app. But it's waiting on a lock held by the least important task — which itself can't finish because medium-priority work keeps cutting in line. Your high-priority task is effectively running at background priority.

This is **priority inversion**: high-priority work blocked on a resource held by low-priority work.

The system fights back with **priority escalation** — when a high-priority task blocks on a low-priority one, GCD's quality-of-service machinery and Swift concurrency both temporarily boost the blocker so it can finish and get out of the way.

Escalation is a mitigation, not a license. You *cause* inversions by letting `.userInteractive` work wait on `.background` work. Keep QoS levels sensible, and avoid blocking across large priority gaps in the first place.

## Spawning threads until the system chokes

GCD's thread pool is not infinite. Watch what this does:

```swift
for _ in 0..<1000 {
    DispatchQueue.global().async {
        blockingIO()          // each one BLOCKS a thread while it waits
    }
}
```

Each closure blocks its thread — the thread sits idle-but-occupied waiting on I/O. GCD sees no progress, so it spawns another thread to keep work moving. And another. And another, until hundreds of threads exist.

That runaway spawning is **thread explosion**: memory pressure from all the thread stacks, scheduling thrash as the CPU juggles them, and sometimes an outright deadlock when the pool is exhausted and the work needed to unblock everyone can't get a thread.

This is a headline reason structured concurrency works the way it does. Swift's cooperative thread pool runs roughly one thread per CPU core — and at every `await`, a task *suspends* rather than blocks, freeing its thread for other tasks:

```swift
for _ in 0..<1000 {
    Task {
        await nonBlockingIO()   // suspends — thread goes off to run other tasks
    }
}
```

A thousand tasks, a handful of threads, no explosion. The cap on concurrency is a feature.

## Every road leads back to shared mutable state

Look back at the catalog: the race needed shared state two tasks could write. The deadlock needed shared resources worth locking. Almost every concurrency bug traces back to **shared mutable state** — data that more than one concurrent context can modify.

So the hierarchy of fixes, best first:

1. **Don't share.** Value types are copies; local and task-local state belongs to one task. Nothing shared, nothing to race.
2. **Isolate.** Mutable state that must be shared goes inside an actor, where access is serialized and the compiler checks it.
3. **Synchronize.** A lock or serial queue as a last resort — correct only if you're careful, and the compiler can't help you.

Modern Swift pushes you hard toward 1 and 2. Reach for raw locks only at the edges, such as wrapping legacy code.

## Making the invisible visible

You don't find timing bugs by staring at code — you instrument:

- **Thread Sanitizer** (TSan) — a build setting, not a library. It instruments every memory access at runtime and reports data races with the exact pair of conflicting reads and writes, including stack traces. Turn it on in the scheme, exercise the app, read the reports.
- Main Thread Checker — flags UIKit and AppKit calls made off the main thread, the moment they happen.
- Address Sanitizer and Instruments' concurrency tooling — for the related memory-corruption and timing issues.
- Swift's compile-time concurrency checking — `Sendable` conformance and actor isolation move whole bug classes from "runtime maybe" to "compile error." Swift 6's strict mode makes the checking mandatory.

The progression matters: sanitizers make existing bugs reproducible; the compile-time checks make new ones impossible.

## Common pitfalls

- **Unprotected read-modify-write** (`counter += 1` from two tasks) — updates vanish. Isolate with an actor, or don't share.
- **`DispatchQueue.main.sync` from the main thread** — the thread waits for itself. Instant deadlock.
- **Inconsistent lock ordering** across tasks — the classic two-lock deadlock. Pick one global order.
- **High-QoS work blocking on low-QoS work** — priority inversion. Keep priorities coherent.
- **Mass-dispatching blocking work to `DispatchQueue.global()`** — thread explosion. Use structured concurrency's suspending `await` instead.
- **Debugging races by re-running and hoping** — turn on Thread Sanitizer and make the race report itself.

## Interview lens

The likely question is "name common concurrency bugs and how you'd prevent or diagnose them." Have the taxonomy ready, one line each: a race condition is a timing-dependent result from shared mutable state — fix by isolating in an actor, serializing, or not sharing at all. A deadlock is a circular wait — fix with consistent lock ordering and by avoiding blocking `sync`, and cite `main.sync` on the main thread as the classic. Priority inversion is high-priority work stuck behind low-priority work — sane QoS plus the system's escalation. Thread explosion is too many blocking dispatches exhausting the pool — which is exactly why Swift's cooperative pool caps threads at roughly the core count and suspends at `await` instead of blocking.

The senior close is tooling and prevention. Say you'd reproduce races with Thread Sanitizer rather than eyeballing, catch off-main UI calls with the Main Thread Checker — and then land the modern angle: `Sendable` and actor isolation move these bugs to compile time, so with Swift 6 checking, whole classes of them become impossible rather than merely debuggable. Interviewers read that last point as the difference between someone who has fought these bugs and someone who has only read about them.
