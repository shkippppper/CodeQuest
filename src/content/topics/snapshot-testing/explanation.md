## The problem: XCTAssertEqual can't see a view

A normal unit test compares values — two integers, two strings, two structs. But a view's correctness isn't a value in that sense: it's *how it looks*. Nothing in `XCTAssertEqual` tells you that a `ProfileHeaderView` rendered with the avatar overlapping the name label.

```swift
func test_profileHeader_layout() {
    let view = ProfileHeaderView(name: "Ada Lovelace", avatarURL: sampleURL)
    // ...now what do you assert?
}
```

You could assert on individual frame values, but that only catches the bugs you thought to check for in advance. What you actually want is to catch *any* unintended visual change — even ones you never imagined.

## What a snapshot test actually catches

A **snapshot test** renders a view to an image and compares that image, pixel by pixel, against a previously saved reference image. If they differ, the test fails.

```swift
import SnapshotTesting
import XCTest

func test_profileHeader_layout() {
    let view = ProfileHeaderView(name: "Ada Lovelace", avatarURL: sampleURL)
    assertSnapshot(of: view, as: .image)
}
```

The first time this runs, there's no reference image to compare against — the library records the current rendering as the new baseline. Every run after that renders the view again and diffs the new image against that baseline, pixel by pixel.

This catches a category of bug unit tests structurally can't: anything that changes *pixels* without changing any value your other tests check. A padding constant that got bumped from 8 to 12, a font that silently fell back to system default because a custom font failed to load, a color asset that resolved to the wrong value in dark mode — none of these show up as a failed `XCTAssertEqual`, but all of them shift pixels, and a snapshot test catches every one automatically.

## Recording, then comparing

Snapshot tests run in one of two modes, and the library needs to know which:

```swift
func test_profileHeader_layout() {
    let view = ProfileHeaderView(name: "Ada Lovelace", avatarURL: sampleURL)
    assertSnapshot(of: view, as: .image, record: true)   // recording mode: save, don't compare
}
```

With `record: true`, the test always passes and simply overwrites the saved reference image with whatever the view currently looks like. You run it once, deliberately, whenever you *want* the current rendering to become the new source of truth — after building the view for the first time, or after an intentional redesign.

```swift
func test_profileHeader_layout() {
    let view = ProfileHeaderView(name: "Ada Lovelace", avatarURL: sampleURL)
    assertSnapshot(of: view, as: .image)   // comparing mode: diff against the saved reference
}
```

Without `record: true`, the same call runs in comparing mode: it renders the view, loads the previously saved reference file from disk, and fails the test with a pixel diff image if they don't match exactly. This is the mode your CI pipeline should always run in — CI should never be allowed to silently re-record a reference, or a real regression would just become the new "correct" baseline.

Predict: a teammate adds `assertSnapshot(of: view, as: .image, record: true)`, commits it, and opens a PR. What's wrong with merging this as-is?

Answer: with `record: true` left in, the test can never fail — it will happily overwrite the reference image and pass every single run, on every machine, forever. `record: true` is a local, temporary flag for generating a new baseline; it should never reach `main`.

## Handling device and OS variance

Reference images are rendered pixels, and pixels depend on more than your view's code — they depend on the simulator, the OS version, and the device size that rendered them.

```swift
assertSnapshot(
    of: view,
    as: .image(size: CGSize(width: 375, height: 200))
)
```

Pinning an explicit `size` removes one variable: the test always lays the view out at the same fixed size, regardless of what simulator happens to run it, so a wider CI runner window doesn't shift the layout and fail the diff for no real reason.

The bigger source of noise is font rendering and anti-aliasing differing across Xcode versions, OS versions, and even Intel vs Apple Silicon Macs — a font hinted slightly differently produces pixels that are *visually* identical but not *byte* identical. Teams handle this two ways:

- **Pin the CI simulator and OS version exactly**, and only compare snapshots recorded on that same configuration. This is the most common approach: reference images are recorded once, on CI, in CI, so every comparison run is apples-to-apples.
- **Allow a small perceptual tolerance** instead of requiring byte-for-byte equality, so a handful of sub-pixel anti-aliasing differences don't fail the build:

```swift
assertSnapshot(of: view, as: .image(precision: 0.98))
```

`precision: 0.98` means 98% of pixels must match exactly; the remaining 2% tolerance absorbs anti-aliasing noise without absorbing an actual layout bug, which typically shifts far more than 2% of pixels.

Neither trick eliminates variance entirely — it's why snapshot tests are almost always run only in CI, against one pinned configuration, and developers are told "don't record locally, let CI regenerate."

## When snapshots hurt

Snapshot tests are powerful exactly because they're indiscriminate: they fail on *any* pixel change, wanted or not. That's also their biggest cost.

```swift
// Designer intentionally increases avatar size from 40pt to 48pt.
// Every snapshot test that renders ProfileHeaderView now fails.
```

A single, deliberate design change can invalidate dozens of reference images at once. Each failure has to be manually reviewed — is this diff the intended change, or did it accidentally reveal a second, unrelated bug hiding in the same view? — and then re-recorded. On a large view hierarchy shared across many screens, one shared component change can mean reviewing and re-recording a large batch of snapshots for a single PR.

This creates a specific failure mode: **snapshot fatigue**. Reviewers start rubber-stamping "update snapshots" commits without actually looking at the diffs, because there are too many of them, too often. At that point the test suite still runs and still "catches" changes, but nobody is actually verifying what changed — the safety net is there in name only.

Snapshot tests also tend to be brittle across unrelated changes: bump a shared design-system spacing token and every screen using that component fails, even though nothing about *this* screen actually broke. That's a lot of noise for one real signal.

The practical guidance: use snapshot tests for components that are visually significant and change rarely — a design system's core components, a critical marketing screen — not for every view in the app. Reserve them for places where "did the pixels change" is genuinely the question you want answered, and lean on unit tests and UI tests for behavior, since those tests actually explain *why* they failed instead of just showing you a diff.

## Common pitfalls

- **Leaving `record: true` in committed code.** The test can never fail again — it silently accepts whatever renders. Strip it before merging.
- **Recording locally instead of on CI.** A locally recorded reference bakes in your machine's font rendering, and CI will fail forever after because it can never reproduce those exact pixels.
- **Snapshotting everything.** High-churn views generate constant, low-signal failures that train reviewers to stop reading diffs.
- **Treating a failing snapshot as automatically wrong.** A failure just means "pixels changed" — it's still a human's job to decide if that change was intended.

## Interview lens

If asked what a snapshot test catches that a unit test doesn't, say it's *unintended visual changes* — anything that shifts pixels without changing a value your other tests check, like a padding tweak, a broken font, or a dark-mode color bug. Contrast that with what it *can't* do: it can't tell you *why* something changed, or whether a change was intentional — a human still reviews the diff.

If asked about flakiness across environments, mention the two real levers: pinning size (and generally pinning the CI simulator/OS the references were recorded on) removes layout variance, and a small `precision` tolerance absorbs anti-aliasing noise without hiding a real regression.

If asked when you'd *avoid* snapshot testing, be direct: high-churn views and anything where a single shared-component change fans out into dozens of unrelated failures. That's snapshot fatigue, and it quietly turns a safety net into a rubber stamp. Reserve snapshots for visually critical, low-churn components.
