## The problem: two tasks, one variable

Here's an innocent-looking class:

```swift
class Counter {
    var value = 0
    func increment() { value += 1 }
}
```

Now hit it from two tasks at once:

```swift
let counter = Counter()
Task { for _ in 0..<1000 { counter.increment() } }
Task { for _ in 0..<1000 { counter.increment() } }
```

Predict: after both tasks finish, what does `value` hold?

Answer: nobody knows. Often less than 2000 — sometimes a crash. `value += 1` is secretly three steps: read the current value, add one, write it back. If both tasks read `5` at the same moment, both write `6`, and one increment vanishes.

Two threads touching the same mutable data, where at least one is writing, is a **data race** — the source of corrupted values, crashes, and bugs that disappear the moment you try to reproduce them.

The pre-Swift-concurrency fixes were manual: wrap every access in an `NSLock`, or funnel everything through a serial queue. Both work — until someone adds a new method and forgets the lock. Nothing in the *type* stops them.

## Turning the class into an actor

Change one keyword:

```swift
actor Counter {
    private var value = 0
    func increment() { value += 1 }
    func current() -> Int { value }
}
```

An `actor` is a reference type, like a class, with one built-in guarantee: only one task at a time may touch its mutable state. This protection is called **actor isolation** — the state is isolated inside the actor, and the compiler enforces the boundary.

Notice what's *not* in the code: no locks, no queues. Inside the actor's own methods, you write `value += 1` like plain single-threaded code, because it effectively is — the actor's **executor**, the machinery that runs its code, only ever runs one task's actor work at a time. Callers that arrive while it's busy simply wait their turn.

## Talking to an actor from outside

Now use the actor from outside:

```swift
let counter = Counter()
await counter.increment()          // await — you may wait your turn
let n = await counter.current()    // even a read needs await
```

Every call from outside is marked `await`. Why? Because the actor might be busy serving another task — your call may have to *suspend* until it's your turn. The `await` is the visible marker that you're crossing into the actor's serialized world.

What about skipping the method and reading the property directly?

```swift
print(counter.value)   // ❌ does not compile
```

The compiler refuses. Isolated state is not reachable synchronously from outside — that's the enforcement part. With a lock-based class, forgetting the lock compiles fine and races at runtime; with an actor, the same mistake is a compile error.

## The actor lets others in while it waits

Now the trap that separates senior answers from junior ones. Actors are **reentrant**: when actor code hits an `await` and suspends, the actor does *not* stay locked — it's free to run *other* tasks' calls while the first one waits.

Watch what that does to this bank:

```swift
actor Bank {
    var balance = 100
    func withdraw(_ amount: Int) async {
        guard balance >= amount else { return }   // check
        await audit()                             // suspension point!
        balance -= amount                         // mutate
    }
}
```

Two tasks each call `withdraw(100)` at the same time. Predict the final balance.

Answer: it can go to `-100`. Task A passes the `guard` (balance is 100), then suspends at `await audit()`. The actor is now free — Task B enters, *also* passes the guard (balance is still 100), suspends at its own `audit()`. Both resume and both subtract. The guard each task checked was stale by the time it mattered.

Note this is not a data race — accesses were still one-at-a-time, and memory is intact. It's a logic bug: an assumption you verified *before* an `await` silently expired *during* it.

Why does Swift allow this? Because the alternative — keeping the actor locked across every `await` — would deadlock the moment two actors awaited each other. Reentrancy trades deadlock-freedom for this rule:

*State checked before an `await` must be re-checked after it — or don't `await` between the check and the mutation at all.*

```swift
func withdraw(_ amount: Int) async {
    await audit()                             // suspend FIRST
    guard balance >= amount else { return }   // then check-and-mutate
    balance -= amount                         // with no await in between
}
```

## `nonisolated`: opting members out

Not everything on an actor needs guarding. Immutable data can't race — so Swift lets you mark members that never touch mutable state as `nonisolated`, making them callable synchronously, no `await`:

```swift
actor User {
    let id: UUID                        // immutable — set once
    var name = ""                       // mutable — stays isolated
    nonisolated var shortID: String {   // only reads immutable `id`
        String(id.uuidString.prefix(8))
    }
}

let user = User(id: UUID())
print(user.shortID)    // no await needed
```

The compiler still checks you: a `nonisolated` member that tries to read `name` won't compile, because `name` is mutable isolated state.

`nonisolated` also solves a practical problem: conforming an actor to a synchronous protocol. `CustomStringConvertible` requires a plain, non-async `description` — only a `nonisolated` implementation can satisfy it, and it can only use non-isolated members.

## Global actors: one isolation domain, many types

A regular actor protects its own properties. But some state doesn't live in one type — "everything that touches the database" might span a dozen files. A **global actor** is a single shared actor whose isolation you can stamp onto any declaration, anywhere, with an attribute:

```swift
@globalActor
actor DataActor {
    static let shared = DataActor()
}

@DataActor func writeToDisk() { }      // runs on DataActor's executor
@DataActor var cache: [String: Data] = [:]   // protected by the same actor
```

Every declaration marked `@DataActor` shares one serialized execution context — one at a time across all of them, no matter where they're declared. It's how you protect a whole subsystem rather than a single object.

The global actor you'll use daily is built in: `@MainActor`, which pins work to the main thread. It has its own lesson coming up.

## Common pitfalls

- **Treating `await actor.method()` as instant.** It's a potential suspension — the actor may be busy, and you queue up. Don't hold assumptions about timing across it.
- **Checking state before an `await` and using it after.** Reentrancy means another task may have changed the state during your suspension. Re-check, or restructure so check and mutation have no `await` between them.
- **Fighting the compiler with `nonisolated` on mutable state.** It won't compile — and that's the feature. If you need sync access, the data must be immutable or protected some other way.
- **Making everything an actor.** Actors serialize access, which is a bottleneck by design. Value types you copy between tasks don't need one.

## Interview lens

If asked "how do actors prevent data races?", the strong answer has the enforcement in it: an actor's mutable state is isolated, its executor runs only one task's code at a time, and — the part that matters — the *compiler* rejects synchronous outside access. Locks are a convention; actors are a guarantee.

The senior differentiator is reentrancy. Say it before they ask: at every `await` inside an actor method, the actor is free to serve other tasks, so invariants checked before the suspension can be stale after it. Give the bank-withdrawal example, note that reentrancy exists to prevent deadlocks, and give the fix — re-check after suspending, or keep check-and-mutate free of `await`s. Be precise that this is a logic hazard, not a data race; memory safety still holds.

Round it out with `nonisolated` — synchronous access for members that only touch immutable state, and the only way an actor conforms to synchronous protocols like `CustomStringConvertible` — and global actors: one shared isolation domain applied by attribute across many declarations, with `@MainActor` as the everyday example.
