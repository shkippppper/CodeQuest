## The problem: a loop that shouldn't run out of memory, but does

Run this loop:

```swift
for i in 0..<1_000_000 {
    let data = try Data(contentsOf: url(for: i))
    process(data)
}
```

Each pass creates some temporary objects, uses them, and moves on. Nothing escapes the loop body, so you'd expect ARC to free each iteration's garbage before the next iteration starts.

Watch memory while it runs, though, and it climbs. And climbs. On a big enough loop the system kills the app.

Nothing is leaked here — every object *will* be freed. The frees are just *late*. This lesson is about why they're late, and how to make them happen on time.

## Two ways an object can be released

In the ARC lesson you saw the normal path: the last strong reference disappears, the count hits zero, the object dies on that exact line.

There's a second path. Some functions — especially ones backed by Objective-C and Apple's Cocoa frameworks — return objects that are **autoreleased**:

```swift
let data = try Data(contentsOf: fileURL)   // ObjC-backed API — creates autoreleased temporaries
```

Autoreleased means the release is **deferred**: instead of "release this now", the object is registered for "release this later". It's how an Objective-C method hands back a temporary object without owning it and without killing it before the caller can grab it.

All those postponed releases have to wait somewhere. They wait in an **autorelease pool** — a list of objects whose release has been queued up.

When the pool **drains**, every object in it finally receives its deferred release. Any object whose count drops to zero at that moment is destroyed right then.

## Who drains the pool for you

On the main thread you almost never think about any of this. The reason is the **run loop** — the main thread's endless cycle that waits for an event (a touch, a timer), handles it, then goes back to waiting.

The run loop wraps every one of those cycles in an autorelease pool. Handle a tap, create a hundred autoreleased temporaries, and at the end of that cycle the pool drains and they all die.

So here's the question for the loop at the top of this lesson. It runs a million iterations without ever returning to the run loop. How many times does the pool drain *during* the loop?

Answer: zero. The wrapping pool only drains after the loop — and the whole event cycle — finishes. Every iteration's deferred releases pile up, a million iterations deep. That's the memory spike.

## @autoreleasepool drains early

The fix is one line:

```swift
for i in 0..<1_000_000 {
    @autoreleasepool {
        let data = try Data(contentsOf: url(for: i))
        process(data)
    }   // ← this iteration's autoreleased temporaries are freed HERE
}
```

`@autoreleasepool { ... }` creates a *local* pool. Any object autoreleased inside the block goes into this pool instead of the outer one.

When the block exits, the local pool drains immediately. It doesn't wait for any run-loop boundary.

Wrapped around the loop *body*, that means each iteration cleans up its own temporaries before the next iteration begins. The million-object spike becomes a flat, bounded footprint — memory for one iteration at a time.

## When you actually need one

Three situations call for an explicit `@autoreleasepool`:

- Tight loops that create many temporary objects — image processing, parsing thousands of files — *without returning to the run loop*. The default pool won't drain until the loop ends.
- Code that calls Objective-C / Cocoa APIs that return autoreleased objects. Many Foundation calls behave this way: `NSString` and `NSData` factory methods, `contentsOfFile:`, format methods, `UIImage`-style loaders.
- Background threads doing heavy work. A thread you spin up has no run loop draining a pool for you.

And one situation that usually doesn't: pure Swift. An object you create with a plain Swift `init` is normally released promptly by ARC — no deferral, no pool needed. The autorelease behavior comes from the Objective-C side.

So don't sprinkle `@autoreleasepool` everywhere as a superstition. Watch memory in Instruments or the Xcode gauge first; add the pool where the graph actually stair-steps upward.

## What a pool cannot do

It's tempting to think of `@autoreleasepool` as a memory-cleanup hammer. Watch it fail:

```swift
@autoreleasepool {
    let ada = Person()
    let rex = Dog()
    ada.pet = rex
    rex.owner = ada    // retain cycle, from the ARC lesson
}                       // pool drains... and the cycle is still alive
```

The drain sends the deferred releases — but Ada and Rex still hold strong references to *each other*, so neither count reaches zero. A pool changes *when* releases fire, never *whether* an object is still strongly referenced.

That's the right mental file for autorelease pools: they are part of ARC, not a replacement for it. ARC sometimes chooses to defer a release instead of doing it immediately, and the pool is where deferred releases wait. `@autoreleasepool` just lets you pick the drain moment.

It does not touch strong/weak semantics, and it will never fix a retain cycle. It's about *timing* for objects that would have been freed anyway.

## Common pitfalls

- **Wrapping the whole loop instead of the body.** `@autoreleasepool { for ... }` drains once, at the end — same spike. Put the pool *inside* the `for`.
- **Adding pools to pure-Swift loops "just in case."** Plain Swift objects are usually released promptly; the pool does nothing. Measure before adding.
- **Expecting a drain to fix a leak.** If memory never comes back even after the pool drains, you have a retain cycle — reach for the Memory Graph Debugger, not more pools.
- **Heavy work on a background thread with no pool at all.** No run loop there means no automatic drain; wrap the work yourself.

## Interview lens

If asked "what is an autorelease pool?", say: it's a collection of *deferred* releases. Some objects — mainly ones returned by Objective-C/Cocoa APIs — are autoreleased, meaning their release fires when the pool drains rather than immediately. The main run loop drains a pool every cycle, which is why you normally never notice.

The follow-up is always "when would you use `@autoreleasepool` yourself?" The answer: a tight loop creating many temporaries without returning to the run loop — the deferred releases accumulate into a memory spike, and wrapping the loop *body* drains them each iteration, capping the footprint.

The senior signals: know that pure-Swift `init` objects are usually released promptly, so pools matter mostly at the Objective-C bridge; say clearly that autorelease is about release *timing*, not ownership — it can't break a retain cycle; and mention that you'd measure with Instruments before adding pools. The crisp one-liner: autorelease defers releases to a pool drain, and `@autoreleasepool` lets you drain early.
