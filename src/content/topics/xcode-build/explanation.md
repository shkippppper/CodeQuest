## The problem: "build" hides a lot of decisions

Press Cmd+R in Xcode and dozens of decisions get made silently: which files to compile, which device to run on, which environment variables to set, whether assertions stay in the binary. Somewhere those decisions have to be written down. Open a project's settings and you'll find three separate layers stacked on top of each other:

```
Target       -> what gets built (an app, a framework, a test bundle)
Scheme       -> which target(s) to build, and what action (run/test/archive) does
Configuration -> which set of build settings to use (Debug or Release)
```

This lesson walks through how those three fit together, and what actually happens between "Build" and a binary landing on your device.

## Targets: one project, several outputs

A single `.xcodeproj` can produce more than one thing. Open the target list and you might see:

```
MyApp            -> the app itself
MyAppTests       -> a unit test bundle
MyAppUITests     -> a UI test bundle
NotificationExt  -> a notification service extension
```

Each of these is a **target** — its own list of source files, its own build settings, its own product (an `.app`, an `.xctest` bundle, an `.appex` extension). Add a Swift file to the project and it isn't automatically compiled anywhere; you choose which target(s) include it via **Target Membership** in the File Inspector. Forget to check the box, and that file silently doesn't exist as far as that target's compiler is concerned — a classic "why is this symbol missing" bug.

## Schemes: what happens when you press the button

A **scheme** answers a different question: when you hit Run, Test, Profile, or Archive, what actually happens? Xcode auto-creates one scheme per app target, but a scheme is really five separate action configurations bundled together:

```
Run     -> uses the Debug configuration by default
Test    -> uses Debug, builds the *Tests targets too
Profile -> uses Release, launches under Instruments
Analyze -> static analysis pass
Archive -> uses Release, produces a distributable .xcarchive
```

Predict: you flip a `#if DEBUG` block to log verbose network traffic, then run *Profile* in Instruments to check performance. Does the log spam show up?

Answer: no. Profile builds with the Release configuration by default, and `DEBUG` isn't defined there — so that whole block is compiled out. This is a common "why does my debug code behave differently under Instruments" surprise.

Schemes are also where *shared* vs *user-specific* matters: a shared scheme (checked in `.xcodeproj/xcshareddata/xcschemes/`) is what CI and teammates see; an unshared one only exists on your machine and silently won't run in CI.

## Configurations and build settings

A **configuration** is a named bucket of build setting values — Xcode ships with `Debug` and `Release` out of the box, but you can add more (a `Staging` configuration is common). Each build setting is a key with a per-configuration value:

```
SWIFT_OPTIMIZATION_LEVEL   Debug: -Onone     Release: -O
ENABLE_TESTABILITY         Debug: YES        Release: NO
GCC_PREPROCESSOR_DEFINITIONS  Debug: DEBUG=1
```

`SWIFT_OPTIMIZATION_LEVEL` is the one that explains most "works in Debug, crashes in Release" bugs: `-Onone` disables optimizations for fast, debuggable builds, while `-O` aggressively inlines and reorders code — occasionally exposing bugs (like relying on undefined evaluation order) that Debug's simpler codegen happened to hide.

Settings can live at the project level (a default for every target) or be overridden per target. Xcode resolves a target's effective value by checking the target first, then falling back to the project:

```
Project MyApp, setting SWIFT_VERSION = 5.9
  Target MyApp        -> inherits 5.9
  Target LegacyWidget  -> overrides to SWIFT_VERSION = 5.0
```

## `.xcconfig`: settings as text, not GUI clicks

Every setting above can also be typed into a plain-text file instead of clicked through the GUI — an `.xcconfig` file:

```
// Release.xcconfig
SWIFT_OPTIMIZATION_LEVEL = -O
ENABLE_TESTABILITY = NO
API_BASE_URL = https://api.example.com
```

Assign it to a configuration under Project > Info > Configurations, and every setting in the file becomes that configuration's values — readable in a diff, mergeable, reviewable in a pull request, unlike the sprawling XML of `project.pbxproj`. `.xcconfig` files can also `#include` each other:

```
// Debug.xcconfig
#include "Shared.xcconfig"
API_BASE_URL = https://staging.example.com
```

This is the standard way teams keep per-environment secrets or URLs out of the checked-in `.pbxproj` and out of source code: define `API_BASE_URL` in an `.xcconfig`, then read it in code via `Bundle.main.object(forInfoDictionaryKey:)` after wiring it through `Info.plist` with `$(API_BASE_URL)`.

## Build phases: the steps inside a single build

Zoom into what actually happens when a target builds — it runs through an ordered list of **build phases**:

```
1. Dependencies      -> build other targets this one depends on first
2. Compile Sources   -> .swift/.m files -> object files
3. Link Binary        -> object files + frameworks -> one executable
4. Copy Bundle Resources -> images, storyboards, plists into the .app
5. Run Script Phases  -> arbitrary shell scripts, anywhere in the order
```

A **Run Script** phase is how SwiftLint, a build-number stamper, or a code generator hooks into the build — it's just a shell script Xcode runs at a specific point in this list. Two things trip people up constantly: forgetting to check "Based on dependency analysis" (Xcode may skip a script phase entirely if it can't tell what changed) and declaring **Input/Output Files** — without them, the phase reruns on *every* build even when nothing relevant changed, which is a common cause of slow incremental builds.

## Workspaces: tying multiple projects together

A **workspace** (`.xcworkspace`) is a container that groups multiple `.xcodeproj` files — and any Swift packages — so they can reference each other and share one build folder. This is what you get automatically the moment you add a CocoaPods dependency, or what you'd set up by hand to develop an app alongside a local framework project:

```
MyApp.xcworkspace
├── MyApp.xcodeproj
├── NetworkingKit.xcodeproj
└── Pods/Pods.xcodeproj   (if using CocoaPods)
```

The key mental model: a project only knows about its own targets. A workspace is what lets `MyApp`'s target declare a dependency on `NetworkingKit`'s target even though they live in separate `.xcodeproj` files — always open the `.xcworkspace`, never the inner `.xcodeproj`, once one exists, or the cross-project references won't resolve.

## Common build errors and what they actually mean

- *"No such module 'X'"* — usually a missing target dependency or a framework not added to "Link Binary with Libraries," not a typo in the import.
- *"Multiple commands produce ..."* — two build phases (often a Run Script and Copy Bundle Resources) are both trying to write the same output file; check for a resource added to more than one target or phase.
- *"Undefined symbol for architecture arm64"* — a linker error: the code compiled, but nothing linked in the object file that implements this symbol, usually a missing framework or a target-membership checkbox left unchecked on the file that defines it.

## Interview lens

If asked "what's the difference between a scheme and a configuration," give the short version first: a configuration is a named bag of build setting values (Debug/Release), a scheme decides which configuration each action (run/test/archive) uses and which targets get built for it. They're independent axes — a scheme's Run action could be pointed at Release if you needed to debug a release-only issue.

If asked how you'd manage different environments (dev/staging/prod), the strong answer is `.xcconfig` files per environment plus extra configurations, not scattered `#if` blocks — it keeps environment differences in reviewable text files instead of buried in Swift code.

If a build-error debugging question comes up, walk the resolution order out loud: check target membership first, then linker settings ("Link Binary with Libraries"), then whether the failing target is even part of the active scheme. That ordering signals you've actually chased one of these down before, not just read about it.
