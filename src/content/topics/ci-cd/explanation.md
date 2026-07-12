## The problem: "it built on my machine" doesn't scale

One developer, one Mac, manual signing, manual TestFlight upload — that workflow survives exactly until a second developer joins, or until a release happens while the first developer is on vacation. The fix is to move build, test, and release off any one person's laptop and onto a machine that runs the same steps, the same way, every time:

```
git push
  -> a server checks out the code
  -> runs the same build/test/sign/upload steps a human would type
  -> reports pass/fail back to the PR
```

That server-driven repeatability is **CI/CD** — continuous integration (automatically building and testing every change) and continuous delivery/deployment (automatically getting a passing build into testers' or users' hands). Everything below is the machinery that makes those steps identical every time, instead of "whatever's on someone's Mac right now."

## Pipeline stages

A typical iOS pipeline runs a fixed sequence of stages, each one gating the next:

```
1. Checkout      -> pull the exact commit
2. Resolve deps  -> swift package resolve / pod install
3. Lint           -> SwiftLint, fail fast on style violations
4. Build          -> xcodebuild, catches compile errors
5. Test           -> xcodebuild test, unit + UI tests
6. Sign & Archive -> produce a signed .ipa
7. Distribute     -> upload to TestFlight / App Store
```

The ordering matters for one practical reason: cheap, fast checks run first. Linting takes seconds and catches the most common mistakes, so it runs before a ten-minute build — no point waiting for a full compile just to fail on a style rule. Each stage only runs if the previous one succeeded, so a broken build never reaches the signing step, and a failing test never reaches distribution.

## Fastlane: scripting the steps a human used to click

Every one of those stages used to mean opening Xcode and clicking through menus. **Fastlane** is a Ruby-based tool that turns each of those manual steps into a single named command, defined in a `Fastfile`:

```ruby
# fastlane/Fastfile
default_platform(:ios)

platform :ios do
  lane :test do
    run_tests(scheme: "MyApp")
  end
end
```

Running `fastlane test` from any machine — your laptop or a CI server — runs the exact same `run_tests` action with the exact same arguments. That's the core value: the steps live in a file checked into the repo, not in a person's head or a wiki page that goes stale.

A **lane** is just a named sequence of actions. Grow it to build and upload to TestFlight:

```ruby
lane :beta do
  increment_build_number(build_number: latest_testflight_build_number + 1)
  build_app(scheme: "MyApp", export_method: "app-store")
  upload_to_testflight
end
```

`increment_build_number` bumps the build number automatically so every TestFlight upload has a unique one — Apple rejects an upload that reuses a build number already seen for that version. `build_app` wraps `xcodebuild archive` and `xcodebuild -exportArchive` into one call, reading signing settings from the project. `upload_to_testflight` pushes the resulting `.ipa` to App Store Connect over the App Store Connect API.

Predict: a teammate runs `fastlane beta` locally, on their own Mac, with their own personal signing certificate. What's the risk?

Answer: the uploaded build is signed with *their* identity, not the team's shared distribution identity — which works for that one upload, but means every developer's local Fastlane run could be signing with a different certificate, defeating the point of a single, reproducible release process. This is exactly the problem the signing section below solves.

## GitHub Actions: where the pipeline actually runs

Fastlane defines *what* to run; something still has to trigger it on a fresh machine every time code changes. **GitHub Actions** is GitHub's CI platform: a YAML file in the repo describes a workflow — a set of triggers and jobs — and GitHub provisions a fresh virtual machine to run it on:

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - run: bundle install
      - run: bundle exec fastlane test
```

`runs-on: macos-14` matters specifically for iOS: unlike most CI work, building an iOS app requires an actual macOS runner with Xcode installed, because `xcodebuild` and code signing tools don't exist on Linux. `on: pull_request` means this workflow fires automatically on every PR against `main` — a contributor sees red/green directly on their PR before it merges, without anyone manually running tests.

Grow the workflow to add a second job that only runs after tests pass, gated by `needs`:

```yaml
jobs:
  test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - run: bundle exec fastlane test

  release:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - run: bundle exec fastlane beta
```

`needs: test` means `release` waits for `test` to succeed first — a failing test blocks the release job from ever starting. `if: github.ref == 'refs/heads/main'` restricts the release job to pushes on `main`, so merging a PR (not just opening one) is what triggers a TestFlight upload.

## Test and build automation

The `test` stage isn't just "run the tests" — it's specifically making sure the same test suite runs identically regardless of who or what triggers it:

```ruby
lane :test do
  run_tests(
    scheme: "MyApp",
    devices: ["iPhone 15"],
    code_coverage: true
  )
end
```

Pinning `devices:` to a specific simulator matters more than it looks: without it, whichever simulator happens to be the CI image's default runs the tests, and that default can silently change when GitHub updates the macOS runner image — turning a green pipeline red with no code change at all. `code_coverage: true` produces a coverage report Fastlane can parse and post as a PR comment or gate a merge on, turning "we should have good test coverage" into an enforced number.

Build automation follows the same reproducibility goal: `build_app` should never depend on state a human set up by hand in Xcode (like a locally-cached derived data folder or a manually-toggled scheme setting) — everything the build needs has to be expressible as a flag or a file in the repo, because the runner starts from a clean slate every single time.

## Code signing in CI

This is where CI iOS pipelines most often break, because the private keys and profiles that live comfortably in one developer's Keychain don't exist anywhere on a freshly provisioned CI machine. The standard solution is Fastlane's `match`:

```ruby
lane :beta do
  match(type: "appstore", readonly: true)
  build_app(scheme: "MyApp", export_method: "app-store")
  upload_to_testflight
end
```

`match` stores certificates and provisioning profiles encrypted in a private Git repository (or a cloud storage bucket), shared by the whole team. On a CI run, `match(readonly: true)` decrypts and installs the team's shared distribution certificate and profile into the runner's temporary Keychain — the same signing identity every time, on every machine, instead of whatever certificate happens to be lying around locally.

```yaml
- run: bundle exec fastlane beta
  env:
    MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
    APP_STORE_CONNECT_API_KEY: ${{ secrets.ASC_API_KEY }}
```

Two secrets typically show up here: `MATCH_PASSWORD` decrypts the certificates repo, and an App Store Connect API key (not a personal Apple ID and password) authenticates the upload to Apple's servers. Using an API key instead of a personal login matters specifically for CI: it doesn't trigger two-factor authentication prompts, which a headless runner has no way to answer, and it can be scoped and revoked independently of any one person's Apple ID.

`readonly: true` is a deliberate safety choice — CI should *never* have permission to generate new certificates or profiles, only to consume ones a human explicitly created and pushed. A CI job that can mint new signing identities is a job that can quietly invalidate everyone else's local development profiles.

## Release automation

The last stage turns a signed, uploaded build into something real users get, and it's usually the most policy-driven step in the pipeline — not everything should auto-release:

```ruby
lane :release do
  match(type: "appstore", readonly: true)
  build_app(scheme: "MyApp", export_method: "app-store")
  upload_to_app_store(
    submit_for_review: true,
    automatic_release: false,
    release_notes: { "en-US" => File.read("release_notes.txt") }
  )
end
```

`submit_for_review: true` automates the submission click, but `automatic_release: false` deliberately keeps a human in the loop for the final "go live" moment — App Review approves the build, but someone still presses the release button manually, in case a critical issue is discovered between approval and release.

A mature pipeline usually tags this stage to a Git action, not just a branch push — a version tag like `v2.3.0` triggering the release lane keeps the release history traceable to a specific, reviewable commit:

```yaml
on:
  push:
    tags: ["v*"]
```

## Common pitfalls

- *Signing certificates baked into a CI-only Apple ID with 2FA enabled.* Headless CI can't answer a 2FA prompt — use an App Store Connect API key instead.
- *No pinned simulator/device in test runs.* A CI image update silently changes the default simulator and breaks previously-green tests with no code change.
- *Giving CI write access to `match`'s certificate storage.* CI should only read existing signing identities, never generate new ones — that's a human, deliberate action.

## Interview lens

If asked to describe an iOS CI/CD pipeline end to end, walk the stages in order and say *why* each one gates the next: lint before build because it's cheap, build before test because a broken build can't run tests, test before sign-and-archive because there's no point shipping a build that fails its own suite.

If asked why Fastlane exists at all when `xcodebuild` can do everything directly, the answer is reproducibility and abstraction: a `Fastfile` captures the exact sequence of flags and steps once, in version control, so `fastlane beta` behaves identically whether it's run by a new hire's laptop or a CI runner — no tribal knowledge required.

If the conversation goes to code signing in CI specifically, lead with `match` and the read-only distinction: CI consumes a shared, pre-issued signing identity via an encrypted certificates repo, authenticates to Apple with an API key (not a personal 2FA-protected login), and never has permission to mint new certificates itself. That answer signals you've actually operated a real pipeline, not just read the Fastlane docs.
