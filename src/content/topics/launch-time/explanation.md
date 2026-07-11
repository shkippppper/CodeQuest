## The problem: users judge you before your first screen draws

Tap your app's icon. There's a gap — sometimes half a second, sometimes three — before anything appears. That gap is dead time from the user's point of view: no progress indicator, no feedback, just a blank or system-drawn splash. If it's long enough, users assume the app is broken and quit before your code has run a single line of business logic.

```swift
@main
struct MyApp: App {
    init() {
        AnalyticsSDK.configure()
        FeatureFlagService.shared.fetchAll()   // network call, blocking init
        CrashReporter.start()
    }
    var body: some Scene { WindowGroup { RootView() } }
}
```

Every line in that `init` runs before the user sees your first screen. This lesson is about where that time actually goes, and how to shrink it.

## Cold launch vs warm launch

Predict: you tap your app's icon twice in a row, a few seconds apart. Is the second launch the same speed as the first?

Answer: *no, it's usually much faster.* The first tap is a **cold launch** — the app isn't in memory at all, so the system has to load your executable and every library it depends on from disk, then run your code from a clean process. The second tap, if the app is still in the recently-used list, can be a **warm launch** — parts of the binary may already be cached by the OS, so paging it back in is cheaper.

There's a third case worth naming: a **resume**, where the app was merely backgrounded (not terminated) and the system just brings the existing process back to the foreground — no launch code runs at all. When you're asked to "optimize launch time," it almost always means cold launch, because that's the worst case and the one most likely to make a first impression.

## Pre-main time: the part your code doesn't control (yet)

Launch time splits into two phases. **Pre-main time** is everything that happens before your first line of Swift runs — the system loading your binary, resolving symbols, running static initializers. Your `main` function, and therefore your `App` struct's `init`, only starts after all of that finishes.

```
[ pre-main: dyld loads binary + libraries + runs initializers ]  [ your code runs from main() onward ]
0ms                                                        250ms                                    ...
```

You can't add a signpost inside pre-main — your code isn't running yet — but Xcode's Organizer (Window → Organizer → Launch Time in the app's metrics) reports it separately from post-main time for builds distributed through TestFlight or the App Store, which is often the first place a slow pre-main phase gets noticed.

## Dynamic libraries and dyld

Pre-main time is dominated by one thing: **dyld**, the dynamic linker, loading every dynamic library your app depends on. A dynamic library (`.dylib` or an embedded framework) is code that isn't baked directly into your executable — it's loaded and linked at launch instead of at compile time.

```
MyApp.app/
├── MyApp                (your compiled executable)
└── Frameworks/
    ├── Alamofire.framework
    ├── SDWebImage.framework
    ├── FirebaseCore.framework
    └── FirebaseAnalytics.framework
```

Each framework here is a separate file dyld has to find, map into memory, and link — resolving every symbol your code calls against every symbol that framework exports. Ten frameworks isn't ten times the work of one; the number of *symbols* to resolve grows with how much each framework exports, and dyld has to do this synchronously before your first line runs.

This is why a common senior-level lever on launch time is reducing the framework count: merging several small internal frameworks into one, preferring static linking for code that doesn't need to be a separate dynamic unit, or dropping SDKs that duplicate functionality. Fewer, larger dynamic libraries generally load faster than many small ones, because dyld's per-library overhead (finding the file, validating it, setting up its load commands) happens once per library regardless of size.

## Deferring work after main()

Once pre-main finishes, everything from your `App` struct's `init` up to your first screen appearing is time you *do* control. The instinct is to get every service running immediately — analytics, feature flags, crash reporting, cache warm-up — all in `init` or `application(_:didFinishLaunchingWithOptions:)`.

```swift
init() {
    AnalyticsSDK.configure()
    FeatureFlagService.shared.fetchAll()
    CrashReporter.start()
}
```

Ask for each line: does the very first screen need this to have already finished? A feature flag fetch that gates a screen three taps deep doesn't need to block launch — it needs to be ready by the time that screen appears, which could be seconds later.

```swift
init() {
    CrashReporter.start()   // cheap, and you want crashes from frame 1 caught
    Task {
        await FeatureFlagService.shared.fetchAll()   // deferred, runs after first frame
    }
}
```

`CrashReporter.start()` stays synchronous — it's genuinely cheap and you want crash coverage immediately. The feature flag fetch moves into a `Task`, so it starts *after* the current run loop turn hands control back to SwiftUI/UIKit to draw the first frame, instead of blocking that frame. The same reasoning applies to warming image caches, pre-fetching non-critical API data, or running database migrations that aren't needed for the first screen — schedule them for right after first paint, not before it.

## Measuring with signposts

You can't optimize what you haven't measured, and launch time is no exception. Use the same **signposts** mechanism from the Instruments lesson, but anchored to launch-specific events: mark the start of your `App` init, and mark the point your first meaningful screen has actually rendered its content (not just an empty container).

```swift
import os

let launchLog = OSLog(subsystem: "com.gaoa.app", category: "Launch")

init() {
    os_signpost(.event, log: launchLog, name: "App Init Start")
    // ...
}

// later, once real content is visible:
os_signpost(.event, log: launchLog, name: "First Content Rendered")
```

Profile with Instruments' **App Launch** template — it's built specifically for this and stitches together pre-main time (from dyld) with your post-main signposts on one timeline, so you can see the full picture: how much time was pre-main, how much was your `init` work, and how much was the rest of the way to a usable screen. Without that combined view you might "fix" post-main code while pre-main, dominated by ten dynamic frameworks, is actually the bigger chunk of the total.

## Common pitfalls

- **Optimizing post-main code while pre-main dominates.** If dyld loading time is 800ms out of a 1000ms launch, shaving 50ms off your `init` barely moves the total. Check the App Launch template's breakdown before picking where to spend effort.
- **Blocking the first frame with non-critical network calls.** Any `await` or synchronous network call before the first screen renders adds the full round-trip time (and any retry/timeout) directly to launch time users experience.
- **Deferring truly required work.** Not everything can move — if the first screen genuinely needs data to render (say, a cached user session), that fetch has to complete before first paint. Deferral only helps for work the first screen doesn't depend on.

## Interview lens

If asked to define launch time, split it immediately into pre-main (dyld loading and linking your binary and its dynamic libraries, before your code runs) and post-main (your own `init` and setup code up through the first rendered frame) — most candidates only think about the second half.

If asked how you'd reduce it, give concrete levers for each half: for pre-main, reduce the number of dynamic frameworks or prefer static linking where feasible; for post-main, audit `init`/`didFinishLaunching` and move anything the first screen doesn't strictly need into a deferred `Task` that runs after first paint.

If asked how you'd measure it, mention Instruments' App Launch template combined with custom signposts marking your own "first content rendered" moment, plus Xcode Organizer's Launch Time metric for real-world, App Store–distributed data — because a debug-build measurement on your own device doesn't reflect what actual users experience on older hardware.
