import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "cicd-what-is",
    type: "mcq",
    prompt: "What does CI/CD provide that a single developer's local Fastlane setup doesn't?",
    options: [
      "A server that runs the same build/test/sign/upload steps identically on every change, independent of any one machine",
      "Faster Swift compilation, because dedicated CI servers always have more CPU cores and RAM than any developer\\'s Mac",
      "Automatic bug detection and auto-fixing by static analysis, since the server continuously monitors every code pattern",
      "A complete replacement for writing tests, because the pipeline replays cached results from successful previous runs",
    ],
    answer: 0,
    explanation:
      "CI/CD's value is reproducibility: the same steps run the same way on a shared server for every change, instead of depending on whatever's configured on one developer's laptop.",
  },
  {
    id: "cicd-stage-order",
    type: "mcq",
    prompt: "Why does linting typically run before the build stage in an iOS pipeline?",
    options: [
      "Linting is cheap and fast, so it fails fast before spending time on a slower build",
      "SwiftLint requires a successful build to analyze symbol types and inferred return values",
      "Order doesn't matter — the pipeline scheduler picks the fastest arrangement automatically",
      "Apple requires linting before compilation in the App Store submission guidelines",
    ],
    answer: 0,
    explanation:
      "Pipeline stages are ordered cheap-and-fast to expensive-and-slow: linting catches common issues in seconds, so there's no reason to wait through a multi-minute build first if a style rule already fails.",
  },
  {
    id: "cicd-fastfile-fill",
    type: "fill",
    prompt: "Fastlane defines named sequences of build/test/release actions, called ___, inside a Fastfile.",
    answers: ["lanes", "lane"],
    hint: "Singular form: `lane :beta do ... end`.",
    explanation:
      "A lane is a named sequence of Fastlane actions (e.g. `lane :beta`). Running `fastlane beta` executes that exact sequence identically wherever it's run.",
  },
  {
    id: "cicd-needs-predict",
    type: "predict",
    prompt: "In this GitHub Actions workflow, the test job fails. Does the release job run?",
    code: `jobs:
  test:
    runs-on: macos-14
    steps: [...]
  release:
    needs: test
    runs-on: macos-14
    steps: [...]`,
    options: [
      "No — needs: test means release only runs if test succeeds",
      "Yes, jobs run independently unless explicitly blocked with an if: condition expression",
      "Only if release also has an on: pull_request trigger or a matching workflow_run event",
      "It depends on which job is listed first in the file, since YAML order controls precedence",
    ],
    answer: 0,
    explanation:
      "`needs: test` creates a dependency: the release job waits for test and only proceeds if test succeeds. A failing test stage blocks release from ever starting.",
  },
  {
    id: "cicd-runner-os",
    type: "mcq",
    prompt: "Why must an iOS CI pipeline use a macOS runner (e.g. `runs-on: macos-14`) rather than a Linux one?",
    options: [
      "xcodebuild and Apple's code signing tools only exist on macOS",
      "GitHub Actions doesn't support Linux runners for any Apple-platform project type at all",
      "macOS runners are always faster because Apple Silicon is used exclusively for CI fleets",
      "Fastlane only installs correctly on macOS due to its gem dependencies on native extensions",
    ],
    answer: 0,
    explanation:
      "`xcodebuild`, Xcode, and Apple's signing toolchain are macOS-only — there is no Linux equivalent — so any stage touching build, test, or signing needs a real macOS runner.",
  },
  {
    id: "cicd-match-multi",
    type: "multi",
    prompt: "Select **all** true statements about Fastlane's `match`.",
    options: [
      "It stores certificates and provisioning profiles encrypted in a shared repository",
      "readonly: true lets CI consume existing signing identities without generating new ones",
      "CI should typically be allowed to generate brand-new certificates for convenience",
      "match ensures every machine (local or CI) signs with the same shared identity",
    ],
    answers: [0, 1, 3],
    explanation:
      "`match` centralizes signing identities in an encrypted repo shared by the team. `readonly: true` is the deliberate safe mode for CI — consuming, not minting, identities. Giving CI permission to generate new certificates risks silently invalidating everyone else's local profiles.",
  },
  {
    id: "cicd-2fa-senior",
    type: "predict",
    prompt: "A CI pipeline authenticates to App Store Connect using a personal Apple ID with two-factor authentication enabled. What breaks?",
    code: `# fastlane action tries to sign in with a personal Apple ID + 2FA
upload_to_testflight`,
    options: [
      "The headless runner has no way to answer the 2FA prompt, so the upload step hangs or fails",
      "Nothing — Fastlane bypasses 2FA automatically by caching the session token from the first login",
      "It works but is rate-limited to one upload per day because Apple throttles unattended sessions",
      "2FA only applies to App Store submissions and not to TestFlight distributions at all",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A CI runner can't respond to an interactive 2FA challenge. The standard fix is an App Store Connect API key, which authenticates without triggering 2FA and can be scoped/revoked independently of any personal account.",
  },
  {
    id: "cicd-automatic-release-senior",
    type: "mcq",
    prompt: "In `upload_to_app_store(submit_for_review: true, automatic_release: false, ...)`, what does `automatic_release: false` accomplish?",
    options: [
      "Submission is automated, but a human still manually triggers the final release after App Review approval",
      "It prevents the build from ever being submitted for App Review, keeping it permanently in a ready-to-submit draft state",
      "It permanently disables all CI/CD automation for this app in App Store Connect until a developer manually re-enables it",
      "It causes App Store Connect to automatically reject the build after review and notify the developer to resubmit with corrections",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`submit_for_review: true` automates getting the build into App Review. `automatic_release: false` deliberately keeps a human decision point at the very end — release doesn't happen the instant Apple approves it, giving a chance to catch late-discovered issues.",
  },
  {
    id: "cicd-flashcard",
    type: "flashcard",
    prompt:
      "Explain a full iOS CI/CD pipeline from commit to TestFlight, including where code signing fits. Answer aloud, then reveal.",
    modelAnswer:
      "A pipeline runs staged, gated steps: checkout, dependency resolution, **lint** (cheap, runs first), **build**, **test**, sign-and-archive, then distribute — each stage only runs if the previous one passed. **Fastlane** captures the actual commands (build, test, sign, upload) as named **lanes** in a `Fastfile`, checked into the repo so the same sequence runs identically on any machine. **GitHub Actions** (or similar) triggers those lanes on a fresh macOS runner — macOS specifically, since `xcodebuild` and Apple's signing tools don't exist on Linux — with `needs:` gating later jobs (like release) on earlier ones (like test) succeeding. Test automation pins the exact simulator so a CI image update can't silently break a green pipeline. Code signing in CI is the trickiest part: Fastlane's `match` stores the team's certificates and provisioning profiles encrypted in a shared repo, and CI runs it with `readonly: true` — consuming the shared distribution identity, never generating new ones — authenticating to Apple via an App Store Connect API key instead of a personal 2FA-protected login, since a headless runner can't answer a 2FA prompt. The final release lane can automate submission (`submit_for_review: true`) while keeping `automatic_release: false`, so a human still decides the exact moment a reviewed build goes live.",
    keyPoints: [
      "Staged pipeline: lint -> build -> test -> sign/archive -> distribute, each gating the next",
      "Fastlane lanes make the exact command sequence reproducible and version-controlled",
      "GitHub Actions needs a macOS runner; needs: gates jobs on earlier success",
      "match + readonly:true shares one signing identity across machines without letting CI mint new ones",
      "App Store Connect API key avoids 2FA prompts a headless runner can't answer",
      "automatic_release:false keeps a human decision point at final release",
    ],
    explanation:
      "A senior answer connects pipeline staging, Fastlane's reproducibility role, and the CI-specific signing constraints (match readonly, API key over personal login) into one coherent operational picture.",
  },
];

export default quiz;
