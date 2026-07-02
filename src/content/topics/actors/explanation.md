## The problem: shared mutable state across threads

When two threads touch the same mutable variable and at least one writes, you have a **data race** — corrupted values, crashes, Heisenbugs. The old fix was manual locks (`NSLock`, serial queues), which are easy to forget or misuse. **Actors** bake the protection into the type system: an actor guarantees that only **one task at a time** touches its mutable state, and the compiler enforces it.

## The data-race problem

```swift
class Counter {                 // ❌ not thread-safe
    var value = 0
    func increment() { value += 1 }
}
```

If two tasks call `increment()` concurrently, the read-modify-write of `value` can interleave and lose updates. Nothing in the type stops that.

## Actor isolation

Make it an `actor` and the compiler **isolates** its mutable state: all access is serialized, so races are impossible.

```swift
actor Counter {
    private var value = 0
    func increment() { value += 1 }
    func current() -> Int { value }
}
```

Inside the actor, code runs with exclusive access — you write `value += 1` normally, no locks. The actor's *executor* ensures only one task runs actor-isolated code at a time.

## `await` on actor methods

From **outside** the actor, every access is potentially a suspension point, because you may have to wait your turn — so you must `await`:

```swift
let counter = Counter()
await counter.increment()        // await: might wait for the actor
let n = await counter.current()  // await to read isolated state too
```

You can't touch an actor's isolated properties synchronously from outside (`counter.value` won't compile). The `await` is the visible marker that you're crossing into the actor's serialized world.

## Actor reentrancy

The subtle senior trap: **actors are reentrant.** When an actor method hits an `await` (suspends), the actor is *free to run other tasks* while it waits. So state you checked *before* an `await` may have changed *after* it.

```swift
actor Bank {
    var balance = 0
    func withdraw(_ amount: Int) async {
        guard balance >= amount else { return }
        await audit()             // ⚠️ suspension — another withdraw can run here
        balance -= amount         // balance may have changed since the guard!
    }
}
```

Reentrancy prevents deadlocks (the actor doesn't freeze while awaiting), but it means **invariants you checked before an `await` can be stale after it**. Re-check state after suspension, or avoid awaiting between a check and the dependent mutation.

## `nonisolated` members

Not everything on an actor needs protection. A member that doesn't touch mutable isolated state can be marked **`nonisolated`**, making it callable synchronously without `await`.

```swift
actor User {
    let id: UUID                       // immutable
    var name: String = ""
    nonisolated var shortID: String {  // touches only immutable `id`
        id.uuidString.prefix(8).description
    }
}
```

`nonisolated` is also how an actor conforms to synchronous protocols (like `CustomStringConvertible`) — those methods can't access isolated state.

## Global actors

A **global actor** is a single shared actor whose isolation you can apply to *any* declaration with an attribute. The built-in one is **`@MainActor`** (covered in its own topic), which pins work to the main thread. You can define your own:

```swift
@globalActor
actor DataActor {
    static let shared = DataActor()
}

@DataActor func writeToDisk() { }   // always runs on DataActor's executor
```

Everything annotated with the same global actor shares one serialized execution context, no matter where it's declared — a way to protect a whole subsystem's state.

## The interview lens

The headline: *"How do actors prevent data races?"* — they **isolate** mutable state so only one task accesses it at a time (serialized by the actor's executor), enforced by the compiler; cross-actor access requires `await`. That replaces manual locks with a type-level guarantee.

The senior differentiator is **reentrancy**: because an actor yields at every `await`, other tasks can mutate its state while a method is suspended, so **invariants checked before an `await` may be invalid after it** — re-check, or don't suspend mid-transaction. Bonus points for `nonisolated` (synchronous access to non-isolated/immutable members, and conforming to sync protocols) and **global actors** (`@MainActor` and custom ones) that apply one shared isolation domain across many declarations.
