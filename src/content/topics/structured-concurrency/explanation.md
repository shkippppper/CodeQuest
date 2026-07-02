## The problem: concurrency that cleans up after itself

With GCD or raw callbacks, spawned work floats free: nothing ties a background task's lifetime to the code that started it, so cancellation, error propagation, and "wait for all of these" are all manual and easy to get wrong. **Structured concurrency** gives async work a **tree shape** — child tasks live inside a parent scope, and the parent cannot finish until its children do. That structure makes cancellation and error handling automatic.

## Task trees

The core rule: **a parent task waits for all its child tasks before returning.** Children inherit the parent's priority and task-local values, and if the parent is cancelled, cancellation flows down to the children. This "no child outlives its parent scope" property is what "structured" means.

The two ways to create children within a scope are `async let` and `TaskGroup`.

## `async let`

`async let` starts a child task immediately and binds a promise to its future result. You `await` it later — running several operations **in parallel** with almost no ceremony.

```swift
func loadProfile() async throws -> Profile {
    async let avatar = fetchAvatar()      // starts now
    async let posts  = fetchPosts()       // starts now, in parallel
    // both are already running concurrently
    return try await Profile(avatar: avatar, posts: posts)  // await both
}
```

Compare that to `let a = await fetchAvatar(); let b = await fetchPosts()`, which runs them **sequentially**. `async let` is the concise tool when you know the *fixed* set of concurrent tasks at compile time.

## `TaskGroup`

When the number of child tasks is **dynamic** (one per item in a list), use a task group. `withTaskGroup` (or `withThrowingTaskGroup`) gives you a group you add child tasks to and then collect results from.

```swift
func fetchAll(_ ids: [Int]) async -> [Data] {
    await withTaskGroup(of: Data.self) { group in
        for id in ids {
            group.addTask { await fetch(id) }   // one child per id
        }
        var results: [Data] = []
        for await data in group {               // collect as they finish
            results.append(data)
        }
        return results
    }
}
```

Results arrive in **completion order**, not submission order. The group scope won't return until every child finishes — again, structured.

## Task priority & inheritance

Tasks carry a `TaskPriority` (`.high`, `.medium`, `.low`, `.background`, …). A child task **inherits** its parent's priority (and task-local values) unless you override it. The runtime also does **priority escalation**: if a high-priority task awaits a lower-priority one, the latter is bumped up to avoid priority inversion.

## Cancellation propagation

Cancellation in structured concurrency is **cooperative** and flows **down the tree**: cancel a parent (or let its scope throw) and all descendants are marked cancelled. But marking isn't stopping — your code must **check**:

```swift
try Task.checkCancellation()      // throws CancellationError if cancelled
if Task.isCancelled { return }    // or check the flag and bail
```

Well-behaved async APIs (like `URLSession`, `Task.sleep`) check for you and throw `CancellationError`. If a task group's child throws, the group cancels its siblings and propagates the error out. This automatic, tree-shaped cancellation is the biggest practical win over GCD.

## Unstructured `Task { }`

Sometimes you must escape the tree — e.g. kick off async work from a synchronous context (a button handler). A bare `Task { }` creates an **unstructured** task: it still inherits actor context and priority, but its lifetime is **not** bound to the enclosing scope, and you're responsible for storing and cancelling it.

```swift
let handle = Task {
    await doWork()
}
// ...
handle.cancel()     // you must manage its lifetime yourself
```

`Task.detached { }` goes further — it inherits **nothing** (no priority, no actor, no task-locals). Use it rarely; prefer structured tasks or a plain `Task {}` so context is preserved.

## The interview lens

The framing question: *"What does 'structured' buy you over GCD?"* — child tasks form a **tree bound to a scope**; the parent can't return until children finish, and **cancellation and errors propagate automatically** down/up that tree. Contrast `async let` (fixed, compile-time-known parallel tasks) with `TaskGroup` (dynamic number of children, results in completion order).

Be ready for cancellation depth: it's **cooperative** — cancelling only *marks* tasks; code must `Task.checkCancellation()` or check `Task.isCancelled` (built-in APIs do this and throw `CancellationError`). And know the escape hatches: `Task { }` is **unstructured** (lifetime not scoped, you manage cancellation), while `Task.detached { }` inherits no context — both should be used sparingly.
