import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "da-what-is",
    type: "mcq",
    prompt: "What does adding `distributed` to an `actor` fundamentally enable?",
    options: [
      "Its `distributed func` methods can be invoked across a process or network boundary using the same `await` call syntax as a local actor",
      "It automatically replicates its full stored state onto every other node in the cluster so that any node can read all of its properties directly and synchronously",
      "It removes the actor's isolation entirely so that multiple remote tasks can mutate its properties in parallel without ever waiting their turn for access",
      "It compiles the actor into a background operating-system service that keeps running and listening on a fixed network port even after the app process exits",
    ],
    answer: 0,
    explanation:
      "A `distributed actor` is still an isolated actor; the new capability is that its `distributed func` methods are reachable from another location, called with the same `await` ergonomics as a local actor.",
  },
  {
    id: "da-remotely-callable",
    type: "mcq",
    prompt: "On a distributed actor, which members are reachable from a *remote* caller?",
    options: [
      "Only methods marked `distributed func`; plain methods and stored properties are not part of the remote surface",
      "Every method and every stored property, provided each of the involved types happens to already conform to the Codable protocol on both nodes",
      "All `public` members, since access control rather than the `distributed` keyword is what actually governs what crosses a network boundary here",
      "Any method at all, plus computed properties, but specifically never the stored properties because those live in the actor's raw memory layout",
    ],
    answer: 0,
    explanation:
      "Only `distributed func` methods cross the boundary. A plain `func` is local-only, and stored properties are never remotely accessible — expose their values through a `distributed func` instead.",
  },
  {
    id: "da-read-property",
    type: "predict",
    prompt:
      "`remote` is a handle to a `Counter` living on another node. What happens at the marked line?",
    code:
      "distributed actor Counter {\n" +
      "    var value = 0\n" +
      "    distributed func increment() { value += 1 }\n" +
      "}\n" +
      "\n" +
      "let remote: Counter = /* handle to actor on node A */\n" +
      "print(remote.value)   // <-- here",
    options: [
      "Compile error — a stored property can't be read across a boundary; only `distributed func` methods are remotely reachable",
      "It transparently performs a network round-trip to node A, fetches the current value, blocks the calling thread until it returns, and prints it",
      "It prints 0, because a remote handle always carries a local cached snapshot copy of every stored property taken at the moment it was created",
      "It prints an actor identity string instead of the number, since reading a property on a remote handle returns the actor's address, not its state",
    ],
    answer: 0,
    explanation:
      "Reading a stored property across a boundary does not compile. A property read is synchronous, a network hop is not — Swift won't pretend otherwise. Expose the value through a `distributed func current() -> Int`.",
  },
  {
    id: "da-location-transparency-fill",
    type: "fill",
    prompt:
      "The property that the call `await handle.doThing()` looks identical whether the actor is local or remote is called location ___.",
    answers: ["transparency"],
    hint: "The caller can't 'see through' to where the actor actually lives.",
    explanation:
      "**Location transparency**: the caller writes the same code regardless of where the actor lives and can't tell from the call site whether the target is local or remote. Placement becomes a deployment decision, not a code rewrite.",
  },
  {
    id: "da-actor-system-role",
    type: "mcq",
    prompt: "What is the role of a distributed actor's `ActorSystem`?",
    options: [
      "It assigns each actor an identity and physically ships the messages between caller and callee — the pluggable transport underneath the actor",
      "It is a compiler pass that rewrites every `distributed func` body into equivalent plain synchronous code before the program is ever linked into a binary",
      "It is a required global singleton, provided by Apple's standard library, that all distributed actors in a process must register with before their first call",
      "It is the serialization format descriptor that decides whether the actor's messages travel across the wire encoded as JSON, as protobuf, or as raw bytes",
    ],
    answer: 0,
    explanation:
      "The actor system is the transport: it hands each actor an identity and routes calls to the right instance. Apple defines the `DistributedActorSystem` protocol; you or a library supply the concrete system.",
  },
  {
    id: "da-who-provides-system",
    type: "mcq",
    prompt: "Who provides the concrete actor system that actually does the networking?",
    options: [
      "You or a library — Apple ships the `DistributedActorSystem` protocol, and a package like swift-distributed-actors' `ClusterSystem` provides a real transport",
      "Apple ships a single production-ready cluster transport inside the standard library, so you only import `Distributed` and never depend on any third-party package",
      "The Swift compiler synthesizes a default TCP-based system automatically for every distributed actor unless you explicitly opt out with a special attribute",
      "The operating system provides it through a system daemon, and every distributed actor connects to that shared daemon over a local domain socket at launch",
    ],
    answer: 0,
    explanation:
      "Swift ships the *protocol* but no production transport. You supply a conforming type — commonly `ClusterSystem` from the open-source swift-distributed-actors package, or a small in-memory/XPC system of your own.",
  },
  {
    id: "da-serialization-fill",
    type: "fill",
    prompt:
      "For most actor systems, the arguments and return values of a `distributed func` must conform to the ___ protocol so they can be turned into bytes and back.",
    answers: ["Codable"],
    hint: "The same protocol you use for JSON encode/decode.",
    explanation:
      "Crossing a boundary requires serialization, so a system declares a serialization requirement — for `ClusterSystem` and most others that's **Codable**. A non-serializable argument is a compile error, not a runtime surprise.",
  },
  {
    id: "da-remote-throws-senior",
    type: "predict",
    prompt:
      "`current()` is declared without `throws`. Why must the remote caller still write `try`?",
    code:
      "distributed actor Counter {\n" +
      "    var value = 0\n" +
      "    distributed func current() -> Int { value }\n" +
      "}\n" +
      "\n" +
      "let n = try await handle.current()   // why try?",
    options: [
      "A remote call is implicitly throwing because the transport itself can fail — timeout, dropped connection, unreachable node — independently of the method's own body",
      "Because `distributed func` secretly rewrites every return type into a `Result` value, and unwrapping that generated `Result` at the call site is what forces the `try`",
      "Because reading the `value` stored property from inside a distributed actor is itself a throwing operation whenever more than one task is currently suspended on it",
      "Because `await` and `try` are always required together in Swift, so any single expression that already uses the `await` keyword is grammatically obligated to also carry a `try` keyword right beside it",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Every remote call is implicitly `throws` because the *transport* can fail regardless of your method's logic. So distributed methods are invoked with `try await` from a remote context, and you handle the network failure.",
  },
  {
    id: "da-crossing-costs-multi",
    type: "multi",
    prompt:
      "Select **all** rules that follow directly from a `distributed func` call potentially crossing a boundary.",
    options: [
      "Its arguments and return value must meet the system's serialization requirement",
      "The caller invokes it with `try` because a remote call is implicitly throwing",
      "The actor must be created with an `ActorSystem` that assigns it an identity",
      "The method must be `nonisolated` so that it can run without the actor's lock",
    ],
    answers: [0, 1, 2],
    explanation:
      "Serialization (usually `Codable`), implicit throwing, and belonging to an actor system that assigns identity all follow from crossing a boundary. `nonisolated` is unrelated — distributed methods keep the actor's isolation.",
  },
  {
    id: "da-when-to-use-senior",
    type: "mcq",
    prompt: "When are distributed actors the right tool?",
    options: [
      "Clustered server-side Swift and cross-process XPC-like designs — rarely in a typical single-process iOS app, where a plain `actor` is simpler and correct",
      "Any time an iOS app needs thread-safe shared state across its view models, because the distributed transport makes the isolation guarantees strictly stronger than a plain actor's",
      "Whenever a type must be encoded to JSON for a network request, since making it a distributed actor is what gives its properties automatic `Codable` conformance for free",
      "In performance-critical inner loops on a single device, because routing calls through an actor system removes the suspension overhead that a normal actor's `await` imposes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Distributed actors are a server-side clustering and cross-process tool. In a single process, a plain `actor` already protects state — adding a transport, serialization constraints, and failure handling you don't need is the wrong call.",
  },
  {
    id: "da-flashcard",
    type: "flashcard",
    prompt:
      "Explain distributed actors: what they add over a plain actor, location transparency, the ActorSystem, and the two constraints that come from crossing a boundary. Answer aloud, then reveal.",
    modelAnswer:
      "A **distributed actor** is a regular isolated actor whose methods marked `distributed func` can be invoked across a **process or network boundary**, using the *same* `await` call syntax as a local actor. Only `distributed func` methods are remotely reachable — plain methods are local-only and stored **properties are never** remotely accessible (expose them through a method). The key property is **location transparency**: the caller writes identical code and can't tell from the call site whether the actor is local or remote, so placement becomes a deployment decision. Making that work is the **ActorSystem**: Apple defines the `DistributedActorSystem` *protocol*, and you or a library supply the concrete transport (commonly `ClusterSystem` from swift-distributed-actors) that assigns each actor an **identity** and physically ships the messages. Two constraints fall out of crossing a boundary: (1) arguments and return values must meet the system's **serialization requirement**, usually **Codable**, and (2) remote calls are **implicitly throwing** because the transport can fail — so you call them with `try await` and handle the node being unreachable. It's a **server-side clustering / cross-process** tool, rarely used in an ordinary single-process iOS app where a plain `actor` suffices.",
    keyPoints: [
      "distributed actor: same isolation, methods callable across a boundary with normal await",
      "Only `distributed func` crosses; stored properties are never remotely accessible",
      "Location transparency: caller can't tell local vs remote from the call site",
      "ActorSystem = pluggable transport; Apple ships the protocol, a library ships the system (ClusterSystem)",
      "Args/returns must be serializable (usually Codable); remote calls are implicitly throwing",
      "Server-side clustering / cross-process tool, not for a typical single-process iOS app",
    ],
    explanation:
      "A senior answer keeps the local-actor ergonomics front and center, defines location transparency plainly, names the protocol-vs-implementation split of the ActorSystem, and lists the serialization + implicit-throws consequences of crossing a boundary.",
  },
];

export default quiz;
