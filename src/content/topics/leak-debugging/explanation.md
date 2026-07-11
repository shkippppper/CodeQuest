## The problem: memory keeps climbing and you don't know why

You push a detail screen, pop it, push it again, pop it again — ten times. Xcode's memory gauge in the debug bar keeps climbing and never comes back down.

```swift
class DetailViewController: UIViewController {
    deinit { print("DetailViewController deallocated") }
}
```

You'd expect "DetailViewController deallocated" to print each time you pop the screen. It never prints. Something is holding a strong reference to every instance you've ever pushed, and none of them are getting deallocated — a leak. The question is: which object is holding on, and why?

## The Memory Graph Debugger

Run the app, reproduce the leak (push and pop the screen a few times), then click the small branching-node icon in Xcode's debug bar — the **Memory Graph Debugger**. It pauses your app and draws every object currently alive, along with the reference between them.

The left sidebar lists live object types with a count next to each. If you see `DetailViewController` with a count of 10 after popping it ten times, that confirms the leak — ten instances exist that nothing on screen should still need.

Click one of those `DetailViewController` instances in the sidebar. The graph pane draws it as a box, with arrows for every reference pointing into it. Purple exclamation-mark icons flag references Xcode suspects are part of a cycle. Click an incoming arrow and the inspector on the right names the exact property holding it — say, a closure stored on a `NetworkManager` singleton that captured `self`.

That's the entire diagnostic payoff of the tool: instead of guessing which of your dozen properties is the culprit, you're looking at the actual live reference graph and reading off the answer.

## The Leaks instrument

The Memory Graph Debugger is great for "show me who's holding this object right now," but it only looks at a single frozen moment. The **Leaks instrument** (in Instruments, alongside or instead of Allocations) records continuously while you use the app, and specifically watches for **reference cycles** — groups of objects that only point at each other, unreachable from anywhere else, which Swift's reference counting can never free on its own.

Run your normal flow — push, pop, push, pop — with Leaks recording. Every time the algorithm detects a group of objects like that, it marks a red spike on the Leaks track with a stack trace of where the cycle was allocated. Click the spike and you get the allocation backtrace, telling you *where in your code* the leaked object was created, which is often faster than reading the graph by hand for cycles buried a few objects deep.

Use both together: Leaks tells you *that* and *where* a cycle formed over time, and the Memory Graph Debugger — paused at the current moment — lets you click through the exact chain of references keeping it alive.

## Common leak sources

Most leaks in real apps come from a short list of repeat offenders.

**Closures capturing `self` strongly.** A closure stored as a property, and referencing `self` inside it, keeps `self` alive as long as the closure exists — and if the closure is *also* stored on `self` (directly or through something `self` owns), neither one can ever be freed. This is exactly the retain-cycle pattern from the retain-cycles lesson; capture lists (`[weak self]`) are the fix, covered in that topic's own lesson.

```swift
class DetailViewController: UIViewController {
    var onRefresh: (() -> Void)?
    func setup() {
        onRefresh = {
            self.reloadData()   // captures self strongly
        }
    }
}
```

**Delegate properties declared strong.** A delegate is meant to be a callback path, not an ownership relationship — the object being delegated *to* shouldn't keep the delegating object alive. Declaring a delegate property `weak var delegate: SomeDelegate?` avoids this; forgetting `weak` is one of the most common leaks in UIKit code.

**Uncancelled `NotificationCenter` observers and `Timer`s.** A repeating `Timer` created with `Timer.scheduledTimer` retains its target by default. If the target is a view controller and the timer is never invalidated when the screen closes, the timer keeps firing and keeps the view controller alive indefinitely.

```swift
class DetailViewController: UIViewController {
    var timer: Timer?
    override func viewDidLoad() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            self.tick()   // keeps self alive until invalidated
        }
    }
    deinit { timer?.invalidate() }   // must happen, or the leak persists
}
```

**Caches and singletons that grow forever.** A dictionary on a long-lived singleton (`ImageCache.shared.storage[url] = image`) keeps every value alive as long as the app runs, because the singleton itself never deallocates. This isn't a reference *cycle* — Leaks won't flag it — but it's a real leak in the everyday sense: memory that should have been released stays resident. The fix is usually an eviction policy (`NSCache`, an LRU limit) rather than an unbounded dictionary.

## Verifying the fix

Predict: you add `[weak self]` to the closure from the earlier example and rerun the leaking flow. How do you know the fix actually worked, rather than just looking plausible?

Answer: *check the same signals you used to find the leak.* Add the `deinit` print back if it's not already there, push and pop the screen again, and confirm it prints every time. Then reopen the Memory Graph Debugger and confirm the live-object count for that class sits at 0 (or matches exactly what's on screen) after popping. If you were using the Leaks instrument, rerun the same recording and confirm the red spikes are gone.

A fix you haven't re-verified with the same tool you used to diagnose the leak is a guess, not a fix — the same measure-before-and-after discipline from profiling applies here too.

## Common pitfalls

- **Trusting "it feels fine now."** Memory pressure from a leak often only becomes visible after dozens of repetitions. Always reproduce the leaking flow enough times (ten pushes, not one) before declaring victory.
- **Fixing the wrong reference.** The Memory Graph Debugger might show three incoming arrows on a leaked object; breaking the wrong one still leaves a cycle through the other two. Read the whole graph, not just the first arrow you find.
- **Treating every rising memory number as a cycle.** An unbounded cache is a leak in effect but won't show a purple cycle icon or a Leaks spike — those tools only catch true reference cycles, not "memory that should have been evicted but wasn't."

## Interview lens

If asked how you'd track down a memory leak, describe the two-tool workflow: the Memory Graph Debugger for a live snapshot of exactly which reference is keeping a specific object alive right now, and the Leaks instrument for catching reference cycles as they form while you exercise the app, complete with an allocation stack trace.

If asked for common causes, list the repeat offenders in order of frequency: closures capturing `self` strongly (fixed with `[weak self]`), delegate properties that should have been `weak` but weren't, timers or notification observers that outlive their owner, and unbounded caches on long-lived singletons.

If pushed on how you'd *prove* a fix worked, say you re-run the exact same reproduction steps and check the same signal you used to find it — a `deinit` that now fires, a live-object count back at zero, or a Leaks track with no new spikes. Anything less is an assumption, not a verified fix.
