## The problem: two threads racing over shared memory

Run this on two threads at once:

```swift
var counter = 0

DispatchQueue.concurrentPerform(iterations: 2) { _ in
    for _ in 0..<100_000 {
        counter += 1
    }
}

print(counter)
```

You'd expect `200000`. Run it a few times and you'll see `173482`, `191006`, some different number every time — never quite right.

Nothing crashed. There's no error message. The two threads just stepped on each other's work, and some increments got silently lost. This is a **race condition**: the final result depends on the unpredictable timing of two threads touching the same memory, instead of on your code's logic.

The rest of this lesson is about the tools that stop threads from stepping on each other, and the new problems those tools introduce.

## Why `counter += 1` isn't one step

To see *why* the count comes out wrong, you have to know what `counter += 1` actually costs the CPU. It isn't one operation — it's three:

```swift
let temp = counter   // 1. read the current value
let next = temp + 1  // 2. add one
counter = next        // 3. write it back
```

Now picture two threads running those three steps interleaved:

```swift
// Thread A reads counter = 5
// Thread B reads counter = 5      <- both saw 5!
// Thread A writes counter = 6
// Thread B writes counter = 6     <- B's increment overwrote A's
```

Both threads meant to add 1, so the counter should be 7. It's 6. One increment vanished because the read-modify-write sequence got split apart by the scheduler switching threads in the middle.

An operation that's guaranteed to complete as a single, uninterruptible step — no other thread can ever see it half-done — is called **atomic**. Plain reads and writes to an `Int` in Swift are *not* atomic across threads; that three-step sequence is exactly what needs protecting.

## Locks and mutexes: taking turns

The fix is to make the three steps run as if they were one. A **mutex** (short for *mutual exclusion*) is an object that only one thread can hold at a time — everyone else calling `lock()` blocks and waits until it's free.

```swift
let lock = NSLock()
var counter = 0

DispatchQueue.concurrentPerform(iterations: 2) { _ in
    for _ in 0..<100_000 {
        lock.lock()
        counter += 1
        lock.unlock()
    }
}
```

Now only one thread at a time can be inside the `lock()`/`unlock()` pair. The section of code between them — the part where shared state is being touched — is called the **critical section**. Rerun this and `counter` prints `200000` every time.

"Lock" and "mutex" are used interchangeably in most conversations — `NSLock` *is* a mutex. A `mutex` is just the general CS term; `NSLock` is Swift/Foundation's concrete implementation of it.

### The one line you can't forget

What happens if the code inside the critical section throws or returns early?

```swift
lock.lock()
guard someCondition else { return }   // uh oh — never reaches unlock()
counter += 1
lock.unlock()
```

That early `return` skips `unlock()`. The lock stays held forever, and every other thread that calls `lock()` blocks permanently. The fix is `defer`:

```swift
lock.lock()
defer { lock.unlock() }
guard someCondition else { return }   // defer still runs unlock() here
counter += 1
```

`defer` runs no matter how the scope exits, so the unlock is guaranteed. Any time you see a manual `lock()`, check for the matching `defer { unlock() }` right next to it — its absence is one of the most common concurrency bugs in code review.

## Semaphores: letting N threads in, not just one

A mutex only ever lets one thread into the critical section. Sometimes you want to allow a fixed number — say, at most 3 network downloads running at once, out of 50 queued. That's what a **semaphore** is for: a counter that threads decrement to enter and increment to leave, blocking whenever the counter hits zero.

```swift
let downloadSlots = DispatchSemaphore(value: 3)

func download(url: URL) {
    downloadSlots.wait()      // decrement; blocks if the count is already 0
    defer { downloadSlots.signal() }  // increment when done
    performDownload(url)
}
```

Start the semaphore's internal count at 3. The first three calls to `wait()` each decrement it (3 → 2 → 1 → 0) and proceed immediately. A fourth call to `wait()` sees 0 and blocks — it sleeps until some other thread calls `signal()` and bumps the count back up.

A mutex is really just a semaphore with its count fixed at 1 — that special case even has its own name, a *binary semaphore*. The general semaphore's extra power is letting more than one thread through, which is exactly what you need for a resource pool instead of a single shared variable.

## Deadlock: everyone waiting forever

Locking gets dangerous once a thread needs two locks at once. Picture a bank transfer function that locks both accounts involved:

```swift
func transfer(from a: Account, to b: Account, amount: Int) {
    a.lock.lock()
    defer { a.lock.unlock() }
    b.lock.lock()
    defer { b.lock.unlock() }
    a.balance -= amount
    b.balance += amount
}
```

Predict: two threads call this at the same time — one transfers `alice → bob`, the other transfers `bob → alice`. What happens?

Answer: it can freeze forever. Thread 1 locks `alice`, then reaches for `bob`. Thread 2 locks `bob`, then reaches for `alice`. Each is holding the lock the other one needs, and each is waiting for the other to let go — which neither will ever do. This is **deadlock**: two or more threads stuck forever, each holding a resource the other is waiting for.

Deadlock needs all four of these true at once: locks are held exclusively, a thread can hold one lock while waiting for another, locks can't be forcibly taken away, and the "who's waiting for whom" chain loops back on itself. Break any one of those four and deadlock becomes impossible — the usual fix is ordering: always acquire locks in the same global order (say, by account ID) so the chain can never loop.

```swift
func transfer(from a: Account, to b: Account, amount: Int) {
    let (first, second) = a.id < b.id ? (a, b) : (b, a)
    first.lock.lock(); defer { first.lock.unlock() }
    second.lock.lock(); defer { second.lock.unlock() }
    a.balance -= amount
    b.balance += amount
}
```

Now every thread reaches for the lower-ID account's lock first, no matter which direction the transfer runs. The two threads from before now both try to lock `alice` (say her ID is lower) first — one wins, finishes the whole transfer, and releases both locks before the other even gets started. No cycle, no deadlock.

## Livelock: busy, but going nowhere

Deadlock freezes threads solid. **Livelock** is the opposite flavor of stuck: the threads keep running, keep changing state, and never make progress. Picture two threads that back off politely instead of blocking:

```swift
func transfer(from a: Account, to b: Account) {
    guard a.lock.try() else { return }   // couldn't get it, give up and retry later
    defer { a.lock.unlock() }
    guard b.lock.try() else { return }   // same here
    defer { b.lock.unlock() }
    // ... do the transfer
}
```

If both threads retry on a timer and happen to retry in lockstep, thread 1 grabs `a` right as thread 2 grabs `b`, both fail to get their second lock, both back off, and both retry at the same moment forever. CPUs are spinning, logs are full of activity, and zero transfers ever complete. The fix is usually to back off by a *random* amount instead of a fixed one, so the two threads fall out of sync.

## Starvation: always losing the race

**Starvation** is subtler still: one thread is technically able to make progress, but it never actually gets scheduled because other threads keep winning first. Imagine a lock implementation that always hands the lock to whichever waiting thread has the highest priority. A low-priority thread can sit in the queue indefinitely if higher-priority threads keep arriving — it's never deadlocked, never livelocked, just perpetually last in line.

The usual fix is fairness: a FIFO (first-in-first-out) lock that serves waiting threads in the order they arrived, so nobody can be perpetually skipped no matter how many higher-priority latecomers show up.

## Producer-consumer: the classic worked example

Now put locks and semaphores together to solve a real problem: one thread (or several) produces items, another thread (or several) consumes them, through a shared, fixed-size buffer.

Naively, a consumer might poll the buffer in a loop:

```swift
while buffer.isEmpty {
    // busy-wait — burns CPU doing nothing
}
let item = buffer.removeFirst()
```

That works but wastes CPU spinning, and it's a race if the producer touches `buffer` at the same instant. The classic solution uses two counting semaphores and one mutex:

```swift
let capacity = 5
var buffer: [Int] = []

let mutex = DispatchSemaphore(value: 1)       // protects `buffer` itself
let emptySlots = DispatchSemaphore(value: capacity)  // how many free slots remain
let filledSlots = DispatchSemaphore(value: 0)        // how many items are ready to read
```

`emptySlots` starts at 5 because the buffer starts empty — five free slots. `filledSlots` starts at 0 because nothing has been produced yet.

The producer waits for a free slot, then locks the buffer just long enough to insert:

```swift
func produce(_ item: Int) {
    emptySlots.wait()          // block if the buffer is already full (count 0)
    mutex.wait()
    buffer.append(item)
    mutex.signal()
    filledSlots.signal()       // announce one more item is ready
}
```

The consumer mirrors it exactly, waiting for an item instead of a slot:

```swift
func consume() -> Int {
    filledSlots.wait()         // block if the buffer is empty (count 0)
    mutex.wait()
    let item = buffer.removeFirst()
    mutex.signal()
    emptySlots.signal()        // announce one more free slot
    return item
}
```

Trace it: buffer capacity 2, starting empty. A producer calls `produce(1)` — `emptySlots` goes 2→1, it appends, `filledSlots` goes 0→1. A consumer calls `consume()` — `filledSlots` goes 1→0, it removes `1`, `emptySlots` goes back 1→2. If a second consumer calls `consume()` right now while the buffer is empty, `filledSlots.wait()` blocks it — no busy-waiting, no race, and it wakes up the instant a producer calls `signal()`.

Notice `mutex` only ever protects the couple of lines that touch `buffer` — the actual `append`/`removeFirst` — while `emptySlots` and `filledSlots` handle the waiting. Mixing up those two jobs (say, holding `mutex` while also blocking on `emptySlots.wait()`) is a common way to accidentally deadlock this exact pattern, so keep the "wait for a slot" step and the "touch the buffer" step separate, in that order, every time.

## How Swift solves this in practice

Everything above is language-agnostic operating-systems theory — the same ideas exist in C, Java, and every other language with threads. Swift has its own higher-level answers to the same problems that are worth knowing about, each with its own dedicated lesson: GCD wraps queues and semaphores into a simpler dispatch API, and actors replace manual locking entirely by letting the compiler serialize access to an actor's state for you, so a whole class of these race conditions can't compile in the first place. This lesson is the theory those tools are built on top of.

## Common pitfalls

- **Forgetting `unlock()` on an early return.** Always pair `lock()` with `defer { unlock() }` immediately, not at the bottom of the function.
- **Locking in inconsistent order across functions.** If one function locks `a` then `b`, and another locks `b` then `a`, you have a deadlock waiting to happen. Pick one global order and use it everywhere.
- **Treating a semaphore's `wait()`/`signal()` as automatically paired.** Unlike `defer { unlock() }` idioms with locks, it's easy to `wait()` on one code path and forget the matching `signal()` on an error path, permanently shrinking the pool.
- **Assuming a single property read or write is atomic.** `+=` on a plain `Int`, `Bool`, or `Array` is never atomic across threads — it needs a lock, a semaphore, or an actor around it.

## Interview lens

If asked "what's the difference between a mutex and a semaphore," give the precise answer: a mutex allows exactly one thread into a critical section and typically must be unlocked by the same thread that locked it; a semaphore is a counter that can allow N threads through and has no owner — any thread can call `signal()`. Say a mutex is really a binary semaphore with an ownership rule bolted on.

If asked to define deadlock versus livelock versus starvation, use the one-line distinctions: deadlock is threads frozen, each waiting on a resource the other holds; livelock is threads still running but making no progress, usually from synchronized retry/backoff; starvation is one thread technically able to proceed but perpetually out-scheduled by others. Interviewers often want you to notice that fixing one can cause another — for example, a fairness fix for starvation (strict FIFO) can make deadlock ordering harder to reason about.

If asked to solve producer-consumer live, write the two-semaphore-plus-mutex version from this lesson from memory: `emptySlots` and `filledSlots` gate how many items can be produced or consumed, and a separate `mutex` protects the handful of lines that actually touch the shared buffer. Naming why there are three synchronization primitives instead of one — capacity control, readiness signaling, and mutual exclusion are three separate jobs — is what separates a memorized answer from an understood one.
