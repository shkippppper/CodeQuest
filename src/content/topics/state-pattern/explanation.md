## The problem: flags that can lie

Here's a download tracker, written the way it tends to start out:

```swift
class Download {
    var isDownloading = false
    var isPaused = false
    var isFailed = false
    var isComplete = false
}
```

Nothing stops you from writing this:

```swift
let d = Download()
d.isDownloading = true
d.isComplete = true   // ...also true? What does that even mean?
```

The type system has no idea that "downloading" and "complete" can never be true at the same time. Every method that touches this object now has to defensively check combinations of flags, and every new status you add multiplies the number of combinations nobody actually meant to allow.

## Enum-driven state: make the illegal states unrepresentable

Swift has a tool that fixes this directly: an `enum`, where a value can be exactly one case at a time.

```swift
enum DownloadState {
    case idle
    case downloading(progress: Double)
    case paused(progress: Double)
    case completed
    case failed(Error)
}
```

Now a `Download` can only ever be in *one* of these five shapes:

```swift
class Download {
    var state: DownloadState = .idle
}
```

There's no way to be "downloading" and "complete" at once — the compiler won't let you set two cases simultaneously, because a variable holds one enum value, not five booleans. This is the core idea of the **State pattern**: give the object's status its own type, and let behavior branch on that type instead of on a pile of flags.

Predict before reading on: what happens if you `switch` over `state` and forget a case?

```swift
func describe(_ state: DownloadState) -> String {
    switch state {
    case .idle: return "Not started"
    case .downloading(let p): return "Downloading \(Int(p * 100))%"
    case .completed: return "Done"
    }
}
```

Answer: this won't compile. Swift's `switch` over an enum must be exhaustive, so leaving out `.paused` and `.failed` is a compile error, not a runtime bug waiting to happen. That's the flags version's core weakness, solved for free.

## State machines: only some transitions are legal

An enum stops *impossible* states, but it doesn't stop *impossible transitions*. Nothing yet prevents jumping straight from `.completed` back to `.downloading`. A **state machine** adds that rule: a fixed set of states, plus a fixed set of allowed moves between them.

```swift
extension Download {
    func start() {
        guard case .idle = state else { return }
        state = .downloading(progress: 0)
    }

    func pause() {
        guard case .downloading(let p) = state else { return }
        state = .paused(progress: p)
    }
}
```

Each method checks the *current* case before changing it. `pause()` only does anything if you're actually `.downloading` — calling it while `.idle` is silently ignored rather than corrupting the state. Add `resume()`, `finish()`, and `fail(_:)` the same way, and the whole set of legal moves lives in one place instead of being scattered across the app as ad hoc `if` checks.

## When an enum switch isn't enough: State objects

Enum-driven state works well while the *behavior* per state is small — a few lines in a `switch`. Some objects need more: each state has several methods, internal data, and its own rules, and stuffing all of that into `switch` statements spread across the class turns every method into a five-way branch.

The classic (Gang of Four) form of the State pattern solves this with objects instead of cases. Each state gets its own type conforming to a shared protocol:

```swift
protocol DownloadHandling {
    func start(_ context: DownloadContext)
    func pause(_ context: DownloadContext)
}

struct IdleState: DownloadHandling {
    func start(_ context: DownloadContext) {
        context.state = DownloadingState()
    }
    func pause(_ context: DownloadContext) { }   // no-op: nothing to pause
}

struct DownloadingState: DownloadHandling {
    func start(_ context: DownloadContext) { }   // already running
    func pause(_ context: DownloadContext) {
        context.state = PausedState()
    }
}
```

The `context` is the object everyone sees from the outside — it holds *whichever* state object is current and forwards calls to it:

```swift
class DownloadContext {
    var state: DownloadHandling = IdleState()
    func start() { state.start(self) }
    func pause() { state.pause(self) }
}
```

Calling `context.start()` doesn't run an `if` chain — it just asks the current state object to handle `start`, and that object decides what happens next, including replacing itself with the next state. Each state's logic lives entirely inside its own type, so adding a sixth state means adding one new struct, not editing every existing `switch`.

## Enum vs State objects: which one to reach for

Both are the same idea — isolate per-state behavior — at different scales:

- Reach for an **enum with associated values** when the states are mostly data with light logic. It's exhaustiveness-checked, cheap, and easy to `switch` on everywhere you need it.
- Reach for **State objects** (structs or classes behind a shared protocol) when each state carries real behavior, internal bookkeeping, or its own sub-methods that would otherwise bloat one giant `switch`.

A useful middle ground: keep the enum as the *source of truth* for what state you're in, but have a `switch` that delegates the heavy logic to a per-case helper function or type — enum for the shape, small dedicated pieces for the behavior.

## Examples you'll recognize

- `UIViewController`'s lifecycle — `viewDidLoad`, `viewWillAppear`, `viewDidDisappear` — is effectively a state machine; iOS calls the method for your current state and expects you not to assume any other order.
- An audio player — idle, playing, paused, buffering, ended — where `play()` behaves differently depending on whether you're paused (resume) or buffering (queue it up).
- A traffic light — red, yellow, green — where each color both displays itself and knows which color comes next, a textbook fit for the State-objects form.

## Common pitfalls

- **Booleans that should have been one enum.** Multiple independent `Bool` properties describing "what mode am I in" is the smell that should make you reach for a state enum.
- **A `switch` with a `default:` case "just in case."** That silently swallows new states you forget to handle — prefer exhaustive switches with no default so the compiler flags missing cases.
- **Transition logic duplicated at every call site.** If five different places check "am I allowed to pause right now?", move that check into one `pause()` method instead.

## Interview lens

If asked to define the State pattern, say it in one sentence: an object's behavior changes based on its internal state, and that state gets its own type instead of being tracked with booleans or string flags — swapping the "current state" object swaps the behavior.

If asked how Swift's idioms relate to the classic Gang-of-Four pattern, be explicit: an `enum` with associated values plus an exhaustive `switch` covers most real cases and is more idiomatic Swift; reach for full protocol-based State *objects* only when each state's behavior is substantial enough that one `switch` would become unmanageable.

If pushed on trade-offs, mention that enums are cheaper and compiler-checked, but objects support runtime extension — you can add a whole new conforming type without touching existing code, which an exhaustive `switch` cannot do without a compile error at every switch site.
