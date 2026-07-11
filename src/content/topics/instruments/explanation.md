## The problem: "it feels slow" isn't a plan

Say a list screen in your app stutters when it appears. You could guess: maybe it's the network call, maybe it's a heavy `for` loop, maybe it's SwiftUI re-rendering too much. Each guess costs you a rebuild-and-rerun cycle.

```swift
func loadFeed() {
    let posts = fetchPosts()        // guess #1: is this slow?
    let sorted = posts.sorted { $0.date > $1.date }   // guess #2?
    let vms = sorted.map(PostViewModel.init)          // guess #3?
    self.items = vms
}
```

Guessing which line is the bottleneck wastes time and, worse, you can "fix" a line that was never slow. **Instruments** is Xcode's profiling app — it attaches to your running app and records exactly what it's doing, so instead of guessing you can point at the actual slow line.

## Opening Instruments and picking a template

From Xcode, hit Cmd+I (or Product → Profile). Xcode builds your app in release-like conditions and hands you a template picker — a grid of recording tools, each built for one kind of question. Pick the **Time Profiler** for "what's using CPU," **Allocations** for "what's using memory," **Leaks** for "what never gets freed."

Choosing the wrong template wastes the run — Time Profiler won't show you a memory leak, and Allocations won't show you which function is burning CPU cycles. Match the template to the question you're actually asking.

## Time Profiler: finding the slow function

Select the Time Profiler template and hit the red record button in the top-left. Instruments launches your app on the device or simulator and starts sampling.

Every few milliseconds, Time Profiler interrupts every thread in your app and records the current call stack — which function is running, and which function called it, all the way down. This repeated snapshotting is called **sampling**: instead of tracking every single function call (which would be too slow to record), it takes thousands of quick photographs and builds a statistical picture of where time went.

Reproduce the slow moment — scroll the stuttering list, tap the button, whatever triggers it — then stop recording. The bottom pane fills with a list of every function that was sampled, each row showing how much time was spent there.

Two columns matter:

```
Function                  Self Weight    Total Weight
sorted(by:)                   45.2 ms         45.2 ms
loadFeed()                     2.1 ms         89.7 ms
fetchPosts()                   1.0 ms         42.4 ms
```

**Self time** is time spent inside that function's own code, not counting the functions it calls. **Total time** (called *cumulative* or heaviest stack time) includes everything it called too. Sort by self time first — that row is where the CPU is actually stuck, not just a wrapper function that happens to call something slow.

## Allocations & Leaks: finding memory problems

Switch templates — stop the current recording, go back to the template chooser, and pick Allocations. This tracks every object your app creates and frees while it runs: object count, total bytes, and — critically — a live count of objects still alive right now.

Run through your flow, then look at the Statistics view sorted by "# Living." If a screen you've already closed still shows a rising count of `PostViewModel` instances that never drops back toward zero, those objects are being kept alive by something — a strong reference nobody released.

The Leaks instrument (often added alongside Allocations in the same recording) is narrower: it specifically flags reference cycles — two or more objects that only reference each other, unreachable from anywhere else in your app, which Swift's automatic reference counting can never free on its own. A leak shows up as a red spike on the Leaks track with a stack trace of where the leaked object was allocated. This topic gets its own deep dive in the next lesson.

## Signposts: marking your own events

Time Profiler shows you *what* ran, but it doesn't know your app's logic — it can't tell you "this stretch of samples was the image-decoding step" versus "this stretch was the JSON parse." **Signposts** are markers you add in code to name a region of work, so Instruments can show it as a labeled interval instead of an anonymous stretch of samples.

```swift
import os

let logger = OSLog(subsystem: "com.gaoa.app", category: "FeedLoading")

os_signpost(.begin, log: logger, name: "Decode Feed")
let posts = try decoder.decode([Post].self, from: data)
os_signpost(.end, log: logger, name: "Decode Feed")
```

Record with the Points of Interest or os_signpost instrument enabled (Time Profiler lets you add it as an extra track), and this shows up as a named bar with its own start and end time — "Decode Feed" ran from 120ms to 340ms — right next to the CPU samples from the same window. Now you can see whether the stutter lines up with your decode step or with something else entirely.

## Reading a flame graph

Switch the Time Profiler's call tree to the **flame graph** view (there's a toggle in the bottom toolbar next to "Invert Call Tree" and "Call Tree"). Time still runs left to right, but now every sampled call stack is stacked vertically: the bottom row is the function running at the top of the thread (like `main` or your app's run loop), and each row above it is one level deeper into the call stack at that moment.

```
[main thread run loop                                    ]
[loadFeed()          ][ handleTap()                       ]
[sorted(by:)][fetchPosts()][   updateUI()   ]
              [decode()]
```

A wide block means that function (or something it called) consumed a lot of sampled time. A tall stack means deep nesting — lots of function calls piled on top of each other for that moment. Click any block to zoom into just that stack; the flame graph redraws scaled to that subtree, which is the fastest way to drill from "the whole run took 2 seconds" down to "this one recursive call took 1.6 of them."

## Measure before optimizing

Predict: you rewrite `sorted(by:)` to use a faster comparison closure, confident it'll fix the stutter. You rerun the app. Does it feel any smoother?

Answer: *maybe not* — and you won't know for sure by feel. The only way to know your change helped is to profile again and compare the same Self Weight number against the baseline you captured before you touched anything.

This is the rule experienced engineers repeat until it's boring: measure first, form a hypothesis from the data, make one change, measure again. Profiling *before* you write a fix tells you which function is actually worth your time; profiling *after* tells you whether your fix worked or just moved the bottleneck somewhere else. Skipping either half turns performance work into folklore.

## Common pitfalls

- **Profiling a Debug build.** Debug builds skip compiler optimizations, so everything looks slower than it will be for real users. Always profile a Release-configuration build (Instruments does this by default when you use Product → Profile, but double check the scheme).
- **Trusting total time over self time.** A function with huge total time might just be a thin wrapper calling one slow thing — the real culprit is whichever row has the highest *self* time.
- **Optimizing without a baseline.** If you didn't record before changing code, you have no number to compare against, and "feels faster" isn't evidence.

## Interview lens

If asked "how would you find a performance problem," walk through the workflow: attach Instruments with Product → Profile, pick Time Profiler, reproduce the slow interaction, then sort the call tree by self time to find the actual hot function — not just the biggest total-time wrapper.

If asked about memory specifically, mention Allocations for tracking live object counts over time and Leaks for reference cycles, and be ready to say that a rising "# Living" count on a screen you've navigated away from is the signature of a retention problem.

If the interviewer pushes on methodology, say the one thing that separates a senior answer from a junior one: never optimize by feel. Measure with Instruments first to find the real bottleneck, change one thing, and measure again to confirm it actually moved the number.
