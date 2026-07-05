## The problem: objects that pile up before they're freed

ARC releases most objects promptly — but some (especially from Objective-C / Cocoa APIs) are returned **autoreleased**: their release is **deferred** and registered with an **autorelease pool**, to be sent when the pool **drains**. Usually you never notice, because the pool drains every run-loop iteration. But in a **tight loop** that creates many temporary objects, those deferred releases **accumulate** until the loop ends — a memory spike that can balloon or crash. `@autoreleasepool` is the tool to bound it.

## What autorelease pools are

An **autorelease pool** is a stack of objects whose `release` has been **deferred**. When a method returns an object it doesn't want to own (a temporary), it can **autorelease** it — meaning "release this later, when the current pool drains" — rather than releasing immediately. The pool holds those pending releases and, when **drained**, sends `release` to all of them at once.

The main thread's run loop wraps each iteration in an autorelease pool, so temporaries created during normal event handling are cleaned up at the end of each cycle. You rarely think about it — until you do a lot of work **outside** a run-loop turn.

## `@autoreleasepool`

**`@autoreleasepool { ... }`** creates a **local** pool: any object autoreleased inside the block is released when the block **exits**, not at some later run-loop boundary.

```swift
for i in 0..<1_000_000 {
    @autoreleasepool {
        let data = try Data(contentsOf: url(for: i))   // temp autoreleased objects
        process(data)
    }                                                   // pool drains each iteration → freed now
}
```

By wrapping the loop **body**, each iteration's temporaries are freed at the end of that iteration instead of piling up for a million iterations. That converts a huge spike into a flat, bounded footprint.

## When they matter (loops, bridging)

You need an explicit `@autoreleasepool` mainly when:

- **Tight loops** that create many temporary objects (image processing, parsing files, generating thousands of objects) **without returning to the run loop** — the default pool won't drain until the loop finishes.
- **Objective-C / Cocoa bridging** — APIs that return autoreleased objects (many Foundation/`NSString`/`NSData`/`UIImage`-style calls, `contentsOfFile:`, format methods). Pure-Swift objects created with `init` are usually released promptly by ARC and don't need a pool; the autorelease behavior comes from the ObjC side.
- **Background work off the main thread** where there's no run loop draining a pool for you.

If your loop only makes **pure Swift** value types or promptly-released instances, an explicit pool often isn't necessary — measure before adding one.

## Interaction with ARC

Autorelease pools are **part of ARC**, not a replacement for it — ARC just sometimes chooses to *autorelease* (defer) instead of *release* (immediate), and it inserts the pool-drain calls. `@autoreleasepool` gives you manual control over **when** those deferred releases happen. It does **not** affect strong/weak semantics or fix retain cycles — a leaked object in a cycle won't be freed by a pool drain, because it's still strongly referenced. Autorelease is about **timing** of releases for objects that would otherwise be freed anyway.

## The interview lens

Explain an autorelease pool as a **collection of deferred releases**: some objects (notably from Objective-C/Cocoa) are returned **autoreleased**, so their `release` fires when the pool **drains** rather than immediately; the run loop drains a pool each iteration, so you usually don't notice. The problem is a **tight loop that doesn't return to the run loop** — deferred releases **accumulate** into a memory spike — and the fix is wrapping the loop body in **`@autoreleasepool { }`** so temporaries are freed each iteration.

Senior signals: it matters mainly for **loops creating many temporaries** and **ObjC/Cocoa bridging** (pure-Swift `init` objects are usually released promptly and don't need a pool); it's about **release timing**, not ownership — it **won't** break a retain cycle or change strong/weak semantics; and you should **measure** rather than sprinkle `@autoreleasepool` everywhere. The crisp takeaway: autorelease defers releases to a pool drain, and `@autoreleasepool` lets you drain early to cap memory in tight loops.
