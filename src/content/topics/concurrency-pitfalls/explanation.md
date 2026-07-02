## The problem: the bugs that only happen sometimes

Concurrency bugs are the worst kind: they're **non-deterministic**. The code works a thousand times, then corrupts data or hangs on the thousand-and-first, on a different device, in release only. This topic catalogs the classic failure modes — race conditions, deadlocks, priority inversion, thread explosion — and the tools that make them reproducible.

## Race conditions

A **race condition** is when the result depends on the unpredictable *timing* of concurrent operations. The canonical case is a non-atomic read-modify-write on shared state:

```swift
var counter = 0
// two tasks running concurrently:
counter += 1        // read, add, write — can interleave and lose updates
```

Two tasks can both read `0`, both compute `1`, both write `1` — one increment vanishes. Fixes: serialize access (an **actor**, a serial queue, or a lock), or avoid sharing (value semantics, task-local state). Swift's `Sendable` checking exists to catch these at compile time.

## Deadlocks

A **deadlock** is a circular wait — each party holds a resource the other needs, so nobody proceeds. The GCD classic is `DispatchQueue.main.sync` on the main thread (the thread waits for a queue it's holding). The lock version:

```swift
// Task 1: lock A, then lock B
// Task 2: lock B, then lock A     → both stuck forever
```

Avoid by always acquiring locks in a **consistent global order**, preferring `async` over blocking `sync`, and letting actors serialize state instead of hand-rolled locks.

## Priority inversion

**Priority inversion**: a high-priority task is blocked waiting on a resource held by a low-priority task, which itself may be starved by medium-priority work — so the high-priority task effectively runs at low priority. The system mitigates it with **priority escalation** (GCD's QoS and Swift concurrency both boost the blocking task). You *cause* it by, e.g., a `.userInteractive` task waiting on a `.background` one — keep QoS levels sensible and avoid blocking across large priority gaps.

## Thread explosion

GCD's pool has a limited number of threads. If you dispatch many **blocking** tasks at once, GCD keeps spawning threads to make progress until the pool is exhausted — **thread explosion** — causing memory pressure, scheduling thrash, and sometimes deadlock.

```swift
for _ in 0..<1000 {
    DispatchQueue.global().async { blockingIO() }   // ⚠️ can explode the pool
}
```

This is a headline reason **structured concurrency caps concurrency**: Swift's cooperative thread pool runs roughly one thread per CPU core and suspends (rather than blocks) at `await`, so thousands of tasks share a handful of threads.

## Shared mutable state

Almost every concurrency bug traces back to **shared mutable state**. The hierarchy of fixes, best first:

1. **Don't share** — use value types (copies) and local/task-local state.
2. **Isolate** — put mutable state inside an **actor** so access is serialized and compiler-checked.
3. **Synchronize** — a lock or serial queue if you must (and are careful).

Modern Swift pushes you toward 1 and 2; reach for raw locks only at the edges.

## Debugging: the sanitizers

You don't find these by staring — you **instrument**:

- **Thread Sanitizer (TSan)** — a build setting that detects data races at runtime by tracking memory accesses across threads; it reports the exact conflicting reads/writes. Turn it on and exercise the app.
- **Main Thread Checker** — flags UIKit/AppKit calls made off the main thread.
- **Address Sanitizer** and Instruments' concurrency tooling help with related memory/timing issues.
- Swift's **compile-time concurrency checking** (`Sendable`, actor isolation) prevents many races before they can run at all.

## The interview lens

Expect *"name common concurrency bugs and how you'd prevent/diagnose them."* Have the taxonomy ready: **race condition** (timing-dependent result on shared mutable state → isolate with an actor / serialize / don't share), **deadlock** (circular wait → consistent lock ordering, avoid `sync`, the `main.sync`-on-main classic), **priority inversion** (high waits on low → sane QoS + escalation), **thread explosion** (too many blocking dispatches exhaust the pool → structured concurrency's capped cooperative pool).

The senior close is **tooling and prevention**: reproduce races with **Thread Sanitizer**, catch off-main UI with the Main Thread Checker, and — the modern angle — lean on **compile-time** guarantees (`Sendable`, actor isolation, Swift 6 checking) so whole classes of these bugs become impossible rather than merely debuggable.
