## The problem: work that floats free

Here's how background work looked before Swift concurrency:

```swift
DispatchQueue.global().async {
    let report = generateReport()
    upload(report)
}
```

The moment that block is dispatched, it's on its own. Nothing connects it to the function that started it. If the user leaves the screen, there's no built-in way to cancel it. If it fails, there's no built-in path for the error to reach you. If you dispatch five of these and need to wait for all five, you're wiring up a `DispatchGroup` by hand.

Swift concurrency's answer is to give every piece of async work a *parent*, so that work forms a tree instead of floating free. That discipline is called **structured concurrency**, and this lesson is about what the tree buys you.

## Every task gets a parent

The core rule is one sentence: a parent task cannot finish until all of its child tasks have finished.

Watch the rule in action:

```swift
func loadProfile() async throws -> Profile {
    async let avatar = fetchAvatar()   // child task 1 starts NOW
    async let posts  = fetchPosts()    // child task 2 starts NOW
    return try await Profile(avatar: avatar, posts: posts)
}
```

The two `async let` lines each start a **child task** — a separate piece of concurrent work owned by `loadProfile`. Both begin running immediately, in parallel.

Now the guarantee: `loadProfile` *cannot return* while either child is still running. There is no way to write this function such that a child leaks out and keeps running after the parent is gone. The scope is the leash.

Children also inherit things from their parent: its priority, and its **task-local values** — per-task storage that flows down the tree, like an environment. More on priority below.

## `async let`: a fixed set of children

Compare the structured version with the sequential one:

```swift
// Sequential: total ≈ time(avatar) + time(posts)
let avatar = try await fetchAvatar()
let posts  = try await fetchPosts()

// Parallel: total ≈ max of the two
async let avatar = fetchAvatar()
async let posts  = fetchPosts()
let profile = try await Profile(avatar: avatar, posts: posts)
```

An `async let` starts its work the moment the line executes. The `await` comes later, only where you actually consume the value — that's the point where the parent may suspend.

`async let` is the right tool when the set of parallel jobs is *fixed and known when you write the code*: an avatar and a post list, two named downloads. When the number of jobs depends on runtime data, you need the next tool.

## `TaskGroup`: one child per element

Say you have an array of IDs and want to fetch them all in parallel. `withTaskGroup` opens a scope and hands you a group you can add children to:

```swift
func fetchAll(_ ids: [Int]) async -> [Data] {
    await withTaskGroup(of: Data.self) { group in
        for id in ids {
            group.addTask { await fetch(id) }   // one child per id, all parallel
        }
        // ...
    }
}
```

Each `addTask` spawns a child that starts immediately. The `of: Data.self` declares what type each child returns.

Then, still inside the closure, the group itself is a sequence of results you can loop over:

```swift
        var results: [Data] = []
        for await data in group {   // suspends until the next child finishes
            results.append(data)
        }
        return results
```

Quick prediction: you added the tasks in order `ids[0], ids[1], ids[2]…` — in what order do the results come out of the loop?

Answer: whatever order they *finish* in. A group yields results in completion order, not submission order. If you need the original order, have each child return its index along with its value and sort afterwards.

And the structured rule still applies: the `withTaskGroup` scope does not return until every child is done. Use `withThrowingTaskGroup` when children can throw.

## Priority flows down the tree

Every task carries a `TaskPriority` — `.high`, `.medium`, `.low`, `.background`, and friends. You rarely set it on children, because a child inherits its parent's priority automatically, along with those task-local values:

```swift
group.addTask { await fetch(id) }                    // inherits parent priority
group.addTask(priority: .low) { await prefetch(id) } // explicit override
```

There's one runtime trick to know: **priority escalation**. Suppose a high-priority task `await`s a result from a low-priority one. Left alone, the important work would be stuck behind unimportant work — a situation called *priority inversion*. The runtime detects this and temporarily bumps the low-priority task up to the waiter's priority, so the wait ends sooner.

## Cancellation flows down the tree

Cancel a parent, and every descendant in its tree is marked cancelled — automatically, no bookkeeping. That's the second big payoff of the tree shape.

But recall from the async/await lesson what "cancelled" means: a *flag was set*. Nothing stops. Each task must cooperate:

```swift
try Task.checkCancellation()      // throws CancellationError if flagged
if Task.isCancelled { return }    // or: read the flag and bail your own way
```

Well-behaved async APIs — `URLSession`, `Task.sleep` — check the flag internally and throw `CancellationError` for you. Your own loops must check explicitly.

Now the error side. Predict: a task group has five children running, and one of them throws. What happens to the other four?

Answer: the group cancels them. The thrown error cancels the remaining siblings (cooperatively — they're *marked*, and stop at their next check), the group waits for them to wind down, and then the error propagates out of `withThrowingTaskGroup` to the caller. Errors flow *up* the tree; cancellation flows *down*. With GCD, every bit of that was manual.

## Escaping the tree: `Task { }`

Sometimes you genuinely can't be inside the tree — the classic case is starting async work from a synchronous context like a button handler. A bare `Task { }` creates an **unstructured task**:

```swift
let handle = Task {
    await doWork()
}
// later, if needed:
handle.cancel()
```

Unstructured means: its lifetime is *not* bound to the scope that created it. Nobody waits for it, and nobody cancels it for you — you hold the handle and manage both yourself. It does still inherit the current actor context and priority, so a `Task { }` created on the main actor stays on the main actor.

One step further off the leash:

```swift
Task.detached {
    await doWork()   // inherits NOTHING
}
```

`Task.detached` inherits no priority, no actor, and no task-local values. It's a completely blank slate — occasionally what you want for truly independent background work, but usually a mistake because it silently drops context (main-actor code inside it is suddenly *not* on the main actor). Prefer structured children; failing that, a plain `Task { }`.

## Common pitfalls

- **Expecting group results in submission order.** They arrive in completion order. Return an index from each child and reorder if order matters.
- **Assuming cancellation stops work.** It only marks the tree. A child that never checks `Task.isCancelled` runs to completion anyway.
- **Reaching for `Task.detached` casually.** It drops actor, priority, and task-locals. Most "I need a background task" cases are better served by a structured child or `Task { }`.
- **Fire-and-forget `Task { }` everywhere.** Each one is an unmanaged lifetime. If it touches `self` or the UI, someone has to cancel it when the screen goes away — you, manually.

## Interview lens

The framing question is "what does *structured* buy you over GCD?" The answer in one breath: tasks form a tree bound to scopes — a parent can't return until its children finish, cancellation propagates down the tree automatically, and errors propagate up it. With GCD, all three are manual and routinely botched.

Be ready to choose between the two child-creating tools: `async let` when the parallel jobs are fixed and known at compile time, `TaskGroup` when there's one job per element of runtime data. Mention that group results arrive in completion order — it's a favorite gotcha.

On cancellation, say the word *cooperative* early. Cancelling marks the tree; code must check via `Task.checkCancellation()` or `Task.isCancelled`, and built-in APIs like `URLSession` check for you and throw `CancellationError`. If one task-group child throws, its siblings get cancelled and the error surfaces from the group.

For senior depth: children inherit priority and task-local values from their parent, and the runtime escalates the priority of a task that a higher-priority task is awaiting — that's how Swift heads off priority inversion. And know the escape hatches cold: `Task { }` is unstructured but inherits actor and priority; `Task.detached` inherits nothing and should be rare.
