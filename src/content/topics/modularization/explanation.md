## The problem: one giant target

This line compiles today, somewhere deep in a big single-target app:

```swift
// SettingsViewController.swift
let cell = FeedCell()          // Settings quietly reaches into Feed's UI
cell.applyExperimentalLayout() // ...and pokes an "internal" detail
```

Nothing stops it. In a single app target, every file can see every other file, so Settings can grab Feed's cells, Feed can call Profile's helpers, and six months later nobody can say where one feature ends and another begins.

The pain compounds three ways as the app grows:

- Change one file, and Xcode recompiles a huge chunk of the target — builds crawl.
- No boundary is enforced, so the architecture erodes one convenient import at a time.
- Multiple teams edit the same target and step on each other constantly.

**Modularization** is the fix: split the app into multiple modules — usually Swift Package Manager packages or framework targets — each with a clear responsibility and a deliberately small public API. This lesson builds that structure and shows what the compiler starts enforcing for you.

## Why the compiler suddenly cares

Move `FeedCell` into its own module and rebuild:

```swift
import Feed
let cell = FeedCell()   // ❌ error: 'FeedCell' is inaccessible due to 'internal' protection
```

Same code, new result. Across a module boundary, `internal` — Swift's default access level — means "visible only inside this module". Settings can no longer touch it.

Inside one app target, `internal` spans the whole app, so it hides nothing. Modularization is what gives access control real teeth.

To share something on purpose, the Feed module must mark it `public`:

```swift
// inside the Feed module
public struct FeedScreen { public init() { ... } }   // the deliberate doorway
```

So each module ends up with a small, designed **public API** — the `public` types — while everything else stays `internal` and truly hidden. "Don't reach into another feature's internals" stops being a code-review comment and becomes a compile error.

## The shape: features on top of core

The common way to slice an app is by feature, with shared infrastructure below:

```
App                     (thin shell: wiring / composition root)
 ├─ Features
 │   ├─ Feed            (a feature module)
 │   ├─ Profile
 │   └─ Settings
 ├─ Core
 │   ├─ Networking      (shared infrastructure)
 │   ├─ DesignSystem
 │   └─ Models
```

Read it bottom-up. **Core modules** hold infrastructure every feature needs — networking, shared models, the design system.

Each **feature module** is a self-contained vertical slice: its screens, view models, and logic. Features depend on core modules, and generally *not* on each other — more on that rule shortly.

The App target shrinks to a thin shell. It owns almost no code; it just composes the features together and does the dependency wiring at launch.

## Declaring it in SPM

Swift Package Manager is the modern tool for this. Each module is a target in a `Package.swift`, and each target must declare what it depends on:

```swift
// Package.swift (sketch)
.target(name: "Networking", dependencies: []),
.target(name: "Feed",       dependencies: ["Networking", "DesignSystem"]),
.testTarget(name: "FeedTests", dependencies: ["Feed"]),
```

That dependency list is not documentation — it's enforcement. If `Feed` doesn't declare `Analytics`, then `import Analytics` inside Feed simply fails to build. The dependency graph becomes explicit and compiler-checked.

Local packages keep all modules in one repo, which is the usual setup. Larger organizations sometimes split modules into separate repos with versioned releases; same idea, more ceremony.

## What happens to build times

The headline win: when you edit a file, only its module and the modules that depend on it recompile — not the world. Incremental builds, the kind you do hundreds of times a day, get dramatically faster.

Two honest nuances ride along:

- Clean builds can get *slightly* slower. More targets means more linking and per-module overhead. Since incremental builds are the common case, the trade is usually worth it.
- Modules also unlock isolated testing: a feature module builds and tests on its own, and teams often add a tiny sample app that runs one feature without booting the whole product.

And one real failure mode: over-modularization. Dozens of tiny one-file packages add wiring, cross-module type mapping, and build overhead of their own. Aim for cohesive units — a module should be a thing you can name and own, not a folder with a manifest.

## Keep the graph pointing one way

The health of a modular app lives in its **dependency graph** — the picture of which module depends on which. The rule: keep it a **DAG**, a directed acyclic graph, meaning the arrows never form a loop.

Predict: Feed declares a dependency on Profile, and Profile declares one on Feed. What happens?

Answer: it doesn't build. Circular module dependencies won't link — SPM rejects the cycle outright. Which is a blessing, because a cycle means the two features were never really separate.

Two habits keep the graph clean.

### Features talk through abstractions

Suppose Feed needs to open a Profile screen. The tempting move — `import Profile` — couples the features and creeps toward a cycle. Instead, depend on a protocol in a shared module:

```swift
// in a small shared "interfaces" module
public protocol ProfileOpening { func openProfile(id: Int) }

// Feed uses only the abstraction
public struct FeedScreen {
    let profileOpener: ProfileOpening    // injected — Feed never imports Profile
}
```

Profile implements `ProfileOpening`, and the App shell wires the real implementation into Feed at the composition root. Feed and Profile stay strangers; only the thin App layer knows both.

### Arrows point down, never up

Features depend on stable core modules. Core modules never depend back up on features — the moment `Networking` imports `Feed`, every feature transitively depends on Feed and the layering is gone. Dependencies flow toward the stable bottom.

## Common pitfalls

- **Marking everything `public` to make errors go away.** That recreates the giant target with extra steps. Each `public` is API you now maintain; add them deliberately.
- **Feature-to-feature imports.** They work at first, then two features grow into each other and eventually cycle. Route cross-feature needs through a shared protocol, wired at the App level.
- **A "Common" module that eats the app.** One grab-bag shared module becomes a dependency of everything, so every change to it recompiles everything. Split core by purpose: Networking, Models, DesignSystem.
- **Modularizing for its own sake.** A 20-file app split into 15 packages is pure overhead. Modularize when build times, boundaries, or team parallelism actually hurt.

## Interview lens

Lead with the why, in three beats: modularization speeds up incremental builds because only the changed module and its dependents recompile; it enforces boundaries because across modules only `public` API is visible, so `internal` implementation is genuinely hidden; and it lets teams own modules and work in parallel.

Then sketch the shape: a thin App shell acting as composition root, feature modules on top, shared core modules underneath, all declared as SPM targets so the dependency graph is explicit and compiler-checked.

The senior signals interviewers listen for: keeping the graph acyclic — mention that circular module dependencies won't even link — and avoiding feature-to-feature coupling by depending on a protocol in a shared interfaces module, with the implementation injected at the composition root. That answer connects modularization to dependency injection, which is exactly the connection they're probing.

Close with the honest caveat: over-modularization is real. Too many tiny modules add wiring and can slow clean builds, so the goal is cohesive units, not a package per file. Admitting the trade-off reads as someone who has actually lived in a modular codebase.
