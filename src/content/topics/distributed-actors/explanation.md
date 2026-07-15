## The problem: the object you're calling lives somewhere else

A plain `actor` solves one problem beautifully: it protects mutable state so two tasks in *your* process can't corrupt it. (If that sentence isn't automatic yet, the `actors` lesson is the one to revisit — this topic builds directly on it.)

```swift
actor Counter {
    var value = 0
    func increment() { value += 1 }
}

let counter = Counter()
await counter.increment()
```

That `await` crosses into the actor's serialized world — but the actor is still sitting in your process, a normal object in your app's memory.

Now change the situation. The `Counter` you want to talk to isn't in your process. It's on another machine — a game server, a worker node in a cluster, a helper process on the same device. You still want to write `await counter.increment()` and have it *just work*.

Without help, that means hand-writing a networking layer: open a socket, invent a message format, serialize the method name and arguments, send bytes, wait for a reply, deserialize it, handle the connection dropping. Every remote call, by hand, forever.

**Distributed actors** are Swift's answer: keep the `await method()` ergonomics, and let a pluggable transport do the networking and serialization for you.

## Declaring a distributed actor

Add two words to the actor:

```swift
import Distributed

distributed actor Counter {
    var value = 0
}
```

`distributed actor` is still an actor — same isolation, same one-task-at-a-time guarantee. The new part is that some of its methods can be invoked from *another* location, not just another task.

But not automatically. Try to make a method callable remotely:

```swift
distributed actor Counter {
    var value = 0
    distributed func increment() { value += 1 }   // callable from afar
    func reset() { value = 0 }                     // local-only
}
```

Every method you want reachable across a boundary must be marked `distributed func`. A plain `func` on a distributed actor is still usable — but only from code that already holds the actor *locally*. Remote callers can't see it.

### Properties are not remotely accessible

Here's the first predict-then-reveal. You're on node B, holding a handle to a `Counter` that actually lives on node A. Can you read its `value` property directly?

```swift
let remote: Counter = /* handle to the actor on node A */
print(remote.value)   // ?
```

Answer: no — this does not compile from a remote context. A distributed actor exposes **only** its `distributed func` methods across a boundary. Stored properties stay put on the node that owns the actor. If node B wants the count, node A must offer a method:

```swift
distributed func current() -> Int { value }
```

The reasoning is physical: a property read is synchronous, but reaching across a network is not. Swift refuses to pretend a network hop is a field access.

## Location transparency

Look at the call site again:

```swift
await handle.increment()
```

Nothing here tells you *where* the actor is. It might be local — same process, no network at all. It might be on a server three data centers away. The calling code is byte-for-byte identical either way.

That property has a name: **location transparency** — the caller writes the same code regardless of where the actor actually lives, and cannot tell from the call site whether the target is local or remote.

This is the whole point of the feature. You design your logic once, against the actor's methods, and the *placement* of actors becomes a deployment decision rather than a code-rewrite. An actor that ran in-process during testing can move to a remote node in production without touching the call sites.

The transparency isn't magic, though. Something has to actually know where the actor is and how to reach it. That something is the actor system.

## The ActorSystem: the pluggable transport

Every distributed actor belongs to an **actor system** — the piece of machinery that gives each actor an identity and physically ships the messages from caller to callee.

You declare which system an actor uses with a type member:

```swift
import Distributed

distributed actor Counter {
    typealias ActorSystem = ClusterSystem   // this actor's transport
    var value = 0
    distributed func increment() { value += 1 }
}
```

Think of the split this way:

- Apple's `Distributed` module defines the `DistributedActorSystem` *protocol* — the contract for "how to assign identities and deliver calls."
- *You* (or, far more often, a library) provide a concrete type that conforms to it — the actual transport.

Swift ships the protocol but no production transport. The best-known concrete implementation is `ClusterSystem` from the open-source **swift-distributed-actors** package, which handles node-to-node networking, membership, and message delivery for you. You could also write a small in-memory system for tests, or an XPC-backed one for cross-process work on a single device.

When you create the actor, you hand it a system, and the system stamps it with an identity:

```swift
let system = ClusterSystem()
let counter = Counter(actorSystem: system)   // system assigns an identity
```

That identity is what lets a handle on another node point back at *this specific* actor. The system uses it to route every incoming call to the right instance.

## Serialization: arguments must cross the wire

A local method call passes arguments by pointer or by value copy — cheap, in-memory. A distributed call can't. The argument has to be turned into bytes, sent across the boundary, and rebuilt on the other side. Turning a value into a transmissible sequence of bytes and back is called **serialization**.

So Swift imposes a rule on distributed methods:

```swift
distributed func setName(_ name: String) { /* ... */ }        // ok: String is Codable
distributed func store(_ blob: NSObject) { /* ... */ }        // ✗ won't compile
```

Every argument and every return value of a `distributed func` must satisfy the system's **serialization requirement**. For most systems — including `ClusterSystem` — that requirement is `Codable`. A `String`, an `Int`, your own `Codable` struct: all fine. A type the system can't serialize is a compile error, right there, not a runtime surprise.

Each actor system declares its own requirement via an associated type, so a different system could demand a different protocol. But `Codable` is the common case, and it's the one to name in an interview.

## Errors: a remote call can fail on the wire

Local actor calls only suspend. A distributed call can outright *fail* — the network drops, the remote node crashes, a message times out. Swift makes that possibility visible at the call site:

```swift
do {
    let n = try await handle.current()   // note: try, even though current() has no `throws`
} catch {
    // transport failure — the node is unreachable, the call timed out, etc.
}
```

Look closely: `current()` was declared without `throws`, yet the caller writes `try`. Every remote call is *implicitly* throwing, because the transport itself can fail independently of your method's own logic. A `distributed func` is therefore called with `try await` from a remote context, and you are expected to handle the network failure like any other error.

This is a real behavioral difference from a plain actor, where `await` alone is enough. With distributed actors you plan for the callee simply not being there.

## When to actually reach for this

Be honest about the scope. Distributed actors are a **server-side and systems** tool:

- Clustered server-side Swift — a fleet of nodes that coordinate work, share load, and address each other as actors.
- Cross-process designs on one machine, XPC-like, where a helper process exposes an actor instead of a hand-rolled IPC protocol.

In a *typical* iOS app you will almost never declare a `distributed actor`. Your view models and caches are all in one process; a plain `actor` is the right tool. Reaching for distributed actors in an ordinary app adds a transport, serialization constraints, and failure handling you don't need. Say that plainly if asked — knowing when *not* to use a feature is part of the senior answer.

## Common pitfalls

- **Forgetting `distributed` on a method you want remote.** A plain `func` on a distributed actor is local-only; remote callers can't see it. The method silently isn't part of the remote surface.
- **Expecting to read a stored property remotely.** Only `distributed func` crosses the boundary. Expose the value through a method instead.
- **Non-`Codable` arguments.** If an argument or return type can't be serialized, it won't compile — the constraint is enforced, not optional.
- **Treating a remote call like a local one.** It can throw a transport error. Call it with `try await` and handle the node being unreachable.
- **Using distributed actors in a plain iOS app.** It's a clustering/IPC tool. In one process, a normal `actor` is simpler and correct.

## Interview lens

If asked "what's a distributed actor?", lead with the ergonomics-plus-transport idea: it's an actor whose `distributed func` methods can be invoked across a process or network boundary, and you call them with the *same* `await` syntax as a local actor. Then name the mechanism that makes that possible — location transparency — and define it plainly: the caller can't tell from the call site whether the actor is local or remote.

The follow-up is usually "how does it actually get there?" Answer: the `ActorSystem`. Apple defines the `DistributedActorSystem` protocol; you or a library (typically `ClusterSystem` from swift-distributed-actors) supply the concrete transport that assigns identities and ships messages. Mention the two constraints that fall out of crossing a boundary: arguments and returns must meet the serialization requirement (usually `Codable`), and remote calls are implicitly throwing because the transport can fail.

Close by showing judgment. Say that only `distributed func`s and never stored properties are remotely reachable, and that this is a server-side clustering and cross-process tool — rarely the right choice inside a single-process iOS app, where a plain actor already does the job.
