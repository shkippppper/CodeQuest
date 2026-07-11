## The problem: a five-second edit-compile-run loop becomes a two-minute one

Early in a project, you change one line and Xcode rebuilds in a couple of seconds. A year later, the same team changes one line in the same-sized file and waits two minutes. Nothing about that one line got harder to compile — the *project* around it grew, and slow builds are almost always a symptom of how the project is structured, not of any single expensive statement.

This lesson is about finding out which part of a slow build is actually slow, and the concrete changes — to code, to project structure, and to build settings — that fix each cause.

## Diagnosing slow builds: measure before you guess

Guessing at what's slow wastes far more time than measuring it. Xcode and the Swift compiler expose real numbers for this.

The fastest first check is Xcode's own **build timing summary** — Report Navigator → select a build → Editor menu → "Reveal in Log" (or the "Show" chevron on the build log) shows a per-target and per-file breakdown of how long compilation actually took. Start here before touching anything.

For per-function detail, two compiler flags surface exactly where time is going, added under Build Settings → Other Swift Flags:

```
-Xfrontend -warn-long-function-bodies=100
-Xfrontend -warn-long-expression-type-checking=100
```

Both take a millisecond threshold. With `100`, any function whose body takes over 100ms to type-check, or any single expression that takes over 100ms, prints a compiler warning pointing at the exact line:

```
MyView.swift:42:5: warning: expression took 1847ms to type-check (limit: 100ms)
```

That warning is a direct pointer to the second topic below — a slow expression is almost always a type-inference problem, not a "this code does a lot of work" problem, since these flags measure *compile time*, not runtime.

For whole-project timing, `xcodebuild` accepts `-showBuildTimingSummary`, which prints per-target wall-clock time from the command line — useful for tracking build time in CI over time, rather than eyeballing it once in Xcode.

## Type-inference cost: the compiler's silent tax

Swift's type checker infers types without you writing them out, and for a single line that's nearly free. The cost appears when inference has to consider many possible interpretations of one expression before settling on one.

Start with a fast, unambiguous expression:

```swift
let total: Double = price + tax   // types are explicit or trivially inferred — fast
```

Now remove the annotation and add more operators, mixing numeric literals and operator overloads:

```swift
let total = price + tax * quantity / discountFactor + shipping
```

Each `+`, `*`, and `/` here can resolve to any of several overloaded operator implementations depending on the types involved, and integer/floating-point literals are themselves generic until context pins them down. The type checker has to explore combinations of all of these together, and that search grows *combinatorially* as more operators and literals pile into one expression — not linearly.

Predict: which of these two takes longer for the compiler to type-check?

```swift
let a = 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10
let b: Int = 1
let c = b + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10
```

Answer: `a`, often dramatically so. Every literal in `a` is untyped and ambiguous until the whole chain resolves; anchoring the very first value to a concrete `Int` in `c` gives the type checker a starting point instead of a search space. This is exactly what `-warn-long-expression-type-checking` catches, and the fix is always the same: add explicit type annotations to break the ambiguity, especially on complex arithmetic, SwiftUI view-building expressions, and long chained method calls.

## Module boundaries: making the compiler redo less work

A Swift package or framework target is a **module** — a compilation unit with its own boundary. Everything inside a module can see everything else inside it; from outside, only what's marked `public` is visible.

A single-module app forces the compiler to re-typecheck the whole thing whenever a file it depends on changes, because there's no boundary to say "this part is done and stable." Splitting a large app into modules changes that:

```
MyApp (target)
├── depends on → NetworkingKit (module)
├── depends on → DesignSystem (module)
└── depends on → FeatureA (module)
```

Once `NetworkingKit` is compiled, its `public` interface is cached as a compiled artifact. Editing a file inside `FeatureA` never triggers a rebuild of `NetworkingKit` — the compiler trusts its already-compiled, unchanged interface and only rebuilds what actually changed.

The real payoff shows up on a team: two engineers working in `FeatureA` and `FeatureB` never invalidate each other's builds, because those are separate modules with a stable shared dependency between them. In a single giant app target, the same two engineers are effectively sharing one big compilation unit — one person's unrelated change can force everyone's next build to recheck files they never touched.

The trade-off to know: crossing a module boundary means only `public`/`open` symbols are visible, so splitting a codebase also means being deliberate about API surface — over-splitting into too many tiny modules adds linking and toolchain overhead that can offset the win.

## Incremental builds: only recompile what changed

Within a single module, Swift's build system tracks dependencies between files so that editing one file doesn't necessarily force every file to recompile — this is an **incremental build**.

The dependency graph it tracks is at the level of declarations, not files: if `FileB.swift` calls a function declared in `FileA.swift`, changing that function's *signature* invalidates `FileB.swift`, but changing only its *body* (with the same signature) does not — `FileB` never needed to know what was inside.

```swift
// FileA.swift
func fetchUser(id: String) -> User {    // signature: touching this invalidates callers
    // body: touching only this does not
}
```

This is why changing a private implementation detail deep inside a large function is often nearly instant to rebuild, while changing a public function's parameter list can cascade into recompiling every file that calls it.

Two things silently defeat incrementality:

- **Bridging headers and Objective-C interop** — every Swift file that imports a bridging header gets invalidated whenever *any* header it references changes, even unrelated ones, because the compiler can't finely track dependencies through Objective-C the way it can through Swift.
- **A clean build.** Product → Clean Build Folder (or deleting derived data) throws away every cached artifact, forcing a full rebuild from nothing — worth doing to fix a corrupted build state, but not something to reach for casually, since it erases all the incremental-build savings you've been relying on.

## Whole-module optimization: trading incrementality for runtime speed

Xcode's Swift Compilation Mode setting has two values, and they optimize for opposite goals:

```
Debug   → Incremental        (fast rebuilds, less runtime optimization)
Release → Whole Module Optimization   (slower full builds, faster generated code)
```

**Whole-module optimization (WMO)** compiles the entire module as a single unit in one compiler invocation, instead of file-by-file. That lets the optimizer see across file boundaries — inlining a function defined in one file directly into a call site in another, for instance — which produces measurably faster generated code but forecloses incremental rebuilds, since there's no per-file unit left to skip.

That's exactly why the defaults are the way they are: Debug configuration favors iteration speed (Incremental), Release favors runtime performance (WMO) for the build that actually ships. Flipping WMO on for Debug is a common mistake that trades away your entire edit-compile-run loop for an optimization nobody benefits from until release.

The corollary worth remembering for CI: a Release build's compile time is not a reliable stand-in for how fast your team's everyday Debug builds feel, because they're running under a fundamentally different compilation strategy.

## Common pitfalls

- **Guessing instead of measuring.** Use the build timing summary and `-warn-long-expression-type-checking`/`-warn-long-function-bodies` before changing anything.
- **Leaving complex expressions untyped.** Chained operators and literals without annotations force a combinatorial type-checker search — add explicit types to anchor them.
- **One giant app module.** Without module boundaries, every file change risks invalidating the whole build; splitting by feature gives the compiler real caching boundaries.
- **Enabling WMO in Debug.** It trades away incremental rebuilds for a runtime optimization that only matters in the shipped Release build.
- **Reaching for Clean Build Folder as a first response.** It throws away all incremental caching; use it to fix genuine build corruption, not as a routine step.

## Interview lens

If asked how you'd approach a slow build, lead with measurement, not opinions: Xcode's build timing summary for a first pass, then `-Xfrontend -warn-long-expression-type-checking` and `-warn-long-function-bodies` to pinpoint specific slow expressions and functions. That shows you treat build time as a profileable problem, the same as runtime performance.

For the type-inference story specifically, explain *why* an untyped chain of operators and literals is slow: the type checker searches a combinatorial space of overload and literal-type combinations, and an explicit annotation anywhere in the chain collapses that search. It's a concrete, memorable example interviewers can picture immediately.

On architecture, the strongest senior answer connects module boundaries to incremental builds directly: a module's compiled interface is a cache boundary that isolates changes elsewhere in the codebase, which is why splitting a large single-target app into feature modules is one of the highest-leverage build-time fixes a team can make — and why it also happens to improve parallel team velocity, not just clean-build time. Close by distinguishing WMO from incremental builds — Release trades rebuild speed for runtime speed, Debug does the opposite — so you don't conflate "my Release build is slow" with "my everyday development loop is slow"; they're different problems with different fixes.
