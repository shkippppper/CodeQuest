## The problem: how does Swift know what to compile?

Drop a folder of `.swift` files onto disk and nothing happens by itself. Something has to say: these files form a library called `Networking`, this other folder is an executable called `App`, and `App` depends on `Networking`. That "something" is a manifest file:

```swift
// Package.swift
import PackageDescription

let package = Package(
    name: "Networking",
    targets: [
        .target(name: "Networking")
    ]
)
```

This is the entire contract. **Swift Package Manager** (SPM) reads `Package.swift`, discovers the Swift files under `Sources/Networking/`, and knows how to build them into a library. No project file, no build phases UI — the manifest *is* the build description.

## The manifest: `Package.swift`

The manifest is itself Swift code, evaluated by the Swift compiler before your build even starts. That's why the first line matters:

```swift
// swift-tools-version:5.9
import PackageDescription
```

The `swift-tools-version` comment isn't a regular comment — SPM parses it to decide which version of the `PackageDescription` API is available. Get the version wrong and APIs used further down in the file won't exist yet.

Everything else lives inside a single `Package` value:

```swift
let package = Package(
    name: "Networking",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [ /* what consumers can import */ ],
    dependencies: [ /* other packages this one needs */ ],
    targets: [ /* the actual buildable units */ ]
)
```

`platforms` sets the minimum OS versions the package supports — SPM uses it to pick the right standard library and reject incompatible dependencies.

## Targets: the buildable units

A **target** is one folder of source files SPM compiles as a unit — the closest thing SPM has to an Xcode "module." Add a second target and a dependency between them:

```swift
targets: [
    .target(name: "NetworkingCore"),
    .target(name: "Networking", dependencies: ["NetworkingCore"]),
]
```

SPM expects `NetworkingCore`'s source files under `Sources/NetworkingCore/` and `Networking`'s under `Sources/Networking/` — the folder name must match the target name exactly, unless you override it with a `path:` argument.

Predict: if `Networking` imports a type from `NetworkingCore` but the `dependencies: ["NetworkingCore"]` line is missing, what happens?

Answer: a compile error, even though the folder sits right next to it on disk. SPM only links targets that are explicitly listed as dependencies — proximity on disk means nothing.

Test code gets its own target kind:

```swift
.testTarget(name: "NetworkingTests", dependencies: ["Networking"]),
```

A `testTarget` behaves like a normal target but is only built when running tests, and it links against `XCTest` automatically.

## Products: what the outside world can use

A target is an internal building block; a **product** is what a *consumer* of your package actually imports. Expose `Networking` as a library:

```swift
products: [
    .library(name: "Networking", targets: ["Networking"])
],
targets: [
    .target(name: "NetworkingCore"),
    .target(name: "Networking", dependencies: ["NetworkingCore"]),
]
```

Notice `NetworkingCore` has no product — it's an implementation detail. A consumer who adds this package can `import Networking`, but `import NetworkingCore` fails: it was never listed as a product, only as a target.

`.library` products come in two flavors:

```swift
.library(name: "Networking", type: .dynamic, targets: ["Networking"])
```

Leave `type` off and SPM picks automatically (usually static, linked directly into the consuming binary); `.dynamic` builds a separate loadable framework; `.static` forces static linking explicitly. Most packages leave this unset and let SPM decide.

## Dependencies and resolution

Depending on another package means adding it to `dependencies:` at the package level, then referencing its product inside a target:

```swift
dependencies: [
    .package(url: "https://github.com/apple/swift-log.git", from: "1.5.0")
],
targets: [
    .target(name: "Networking", dependencies: [
        "NetworkingCore",
        .product(name: "Logging", package: "swift-log"),
    ])
]
```

`from: "1.5.0"` means "the highest compatible version, following semantic versioning" — SPM will happily pick 1.9.2 but never 2.0.0, because a major version bump signals breaking changes.

The first time you build, SPM walks every package's dependency list, picks compatible versions for all of them, and writes the result to a lockfile: `Package.resolved`. That file pins exact versions and exact commit hashes.

```
// Package.resolved (abridged)
{
  "pins": [
    { "identity": "swift-log", "state": { "version": "1.5.3" } }
  ]
}
```

Commit `Package.resolved` to source control. Without it, two developers running `swift build` on the same day could resolve to different patch versions if a new release shipped in between — with it, everyone builds against the exact pins in the file until someone explicitly updates them.

Other version requirement styles you'll see in real manifests:

```swift
.package(url: "...", exact: "2.0.0")        // pin one version
.package(url: "...", "1.0.0"..<"1.8.0")     // explicit range
.package(url: "...", branch: "main")        // track a branch, not a release
```

`branch:` is common for internal packages under active development, but it means builds aren't reproducible from the version number alone — every fetch could pull new commits.

## Local vs remote packages

So far every example points at a remote Git URL. A **local package** is one you reference by filesystem path instead, useful while developing a library alongside the app that consumes it:

```swift
dependencies: [
    .package(path: "../NetworkingKit")
]
```

With a `path:` dependency there's no version resolution at all — SPM just builds whatever is on disk right now, live. Edit a file in `../NetworkingKit` and the next build of your app picks up the change immediately, with no version bump, no `Package.resolved` entry, no push to a remote.

The trade-off: a `path:` dependency isn't something a teammate can pull down by checking out your repo, since it points at a location on *your* machine. It's a local-development convenience, meant to be swapped for a real `url:` dependency before merging — Xcode's "Edit > Packages" lets you toggle a remote package to local editing temporarily for exactly this workflow, without touching the manifest at all.

## Resources and plugins

Not every package is pure Swift code. Bundle an asset by declaring it explicitly:

```swift
.target(
    name: "Networking",
    resources: [.process("Config.json")]
)
```

`.process(...)` lets SPM apply platform-specific rules (like optimizing an image); `.copy(...)` copies the file byte-for-byte with no processing, which matters for something like a raw data fixture that must not be touched. Either way, the target gets a synthesized `Bundle.module` at compile time so your code can find it:

```swift
let url = Bundle.module.url(forResource: "Config", withExtension: "json")
```

**Plugins** are the other non-code piece: a plugin is a small Swift program SPM runs during the build, not part of your app's binary. A build-tool plugin can generate source files before compilation (think: turning a `.proto` file into Swift structs); a command plugin runs on demand, invoked as `swift package my-command`. Declaring one looks like:

```swift
.plugin(name: "GenerateModels", capability: .buildTool())
```

Most day-to-day package authoring never needs a custom plugin — SwiftLint and swift-format both ship as ready-made ones you just add to `dependencies:` and enable per-target.

## Common pitfalls

- **Forgetting `Package.resolved` in source control.** Without it, builds aren't reproducible across machines or CI runs.
- **Exposing an internal target as a product by accident.** Anything listed as a `.library` product is API surface consumers can import — keep implementation-detail targets un-exposed.
- **Leaving a `path:` dependency in a merged branch.** It only builds on the machine that has that exact folder layout.

## Interview lens

If asked "what's the difference between a target and a product," say it plainly: a target is a compiled module of source files, a product is what you expose to consumers — a target with no product is an internal implementation detail, invisible outside the package.

If asked how SPM handles versioning, mention `Package.resolved`: it pins exact resolved versions so builds are reproducible, and it should always be committed. Bring up `from:` vs `exact:` vs `branch:` to show you understand the trade-off between staying current and staying reproducible.

If the conversation turns to modularizing an app, mention `path:` dependencies as the standard way to iterate on a local package before publishing it, and note that resources need explicit `.process`/`.copy` declarations plus `Bundle.module` — a surprisingly common gotcha for anyone moving asset-heavy code into a package for the first time.
