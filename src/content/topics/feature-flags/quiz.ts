import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "flags-what",
    type: "mcq",
    prompt: "What is a feature flag?",
    options: [
      "A runtime check guarding a feature whose value can change without shipping a new build",
      "A compiler directive that removes dead code branches by evaluating conditions at build time instead of at runtime",
      "A comment marking TODO items in source so they can be tracked in the issue backlog without affecting behavior",
      "A SwiftLint rule for naming conventions that flags identifiers which don't follow the module's agreed-upon naming guidelines",
    ],
    answer: 0,
    explanation:
      "A feature flag decouples 'code is merged and shipped in a binary' from 'feature is actually live for users,' since its value is controlled remotely.",
  },
  {
    id: "flags-types-multi",
    type: "multi",
    prompt: "Select all flag types that are meant to be long-lived (not deleted after a short decision window).",
    options: [
      "Permission flag (e.g. gating a paid tier)",
      "Release flag (temporarily hiding a new feature until launch)",
      "Ops flag (kill switch for an unstable dependency)",
      "Experiment flag (running an A/B test)",
    ],
    answers: [0, 2],
    explanation:
      "Permission and ops flags check permanent conditions and live indefinitely. Release and experiment flags are meant to be temporary — deleted once the decision is made.",
  },
  {
    id: "flags-remote-config",
    type: "fill",
    prompt: "The small key-value payload an app fetches from a server, typically at launch, to decide flag values, is called ___ ___.",
    answers: ["remote config"],
    hint: "Two words: where the config lives relative to the app.",
    explanation:
      "Remote config is what lets a flag's value change without shipping a new build — the app fetches it and reacts accordingly.",
  },
  {
    id: "flags-default-predict",
    type: "predict",
    prompt: "The remote config fetch fails on first launch (no network yet). What does this code return for newCheckoutEnabled?",
    code: `static var newCheckoutEnabled: Bool {\n    RemoteConfig.shared.bool(forKey: "new_checkout_enabled", default: false)\n}`,
    options: [
      "false — the safe, already-shipped behavior, since the fetch never completed",
      "The app crashes because there's no value to read — RemoteConfig requires a completed fetch before any key access is valid",
      "true — flags always default to enabled so new features reach users even without a completed network fetch",
      "It throws a compile error because the `default:` label conflicts with reserved Swift keyword syntax inside a function call",
    ],
    answer: 0,
    explanation:
      "The explicit `default: false` ensures a failed or not-yet-completed fetch falls back to already-shipped, safe behavior rather than an undefined state.",
  },
  {
    id: "flags-rollout-fill",
    type: "fill",
    prompt: "A gradual ___ assigns users to on/off based on a stable hash of their ID, ramping the on-group from a small percentage up to 100% while watching health metrics.",
    answers: ["rollout", "percentage rollout"],
    hint: "The gradual expansion process itself.",
    explanation:
      "A stable-hash rollout keeps the same users in the 'on' group across sessions, so crash/error data at each ramp step is meaningful and reversible.",
  },
  {
    id: "flags-ab-vs-rollout",
    type: "mcq",
    prompt: "What question does an A/B test answer that a plain gradual rollout does not?",
    options: [
      "Which of two variants actually performs better, measured statistically",
      "Whether the new code compiles cleanly and passes all unit tests before being enabled for any real users",
      "Whether the feature flag system is online and successfully delivering values to all targeted user segments",
      "How many total users are currently active in the app and eligible to be included in the on-group percentage",
    ],
    answer: 0,
    explanation:
      "A rollout mainly answers 'is this safe to enable broadly?' An A/B test deliberately keeps two variants live to compare a specific metric between them.",
  },
  {
    id: "flags-experiment-multi",
    type: "multi",
    prompt: "Select all true statements about designing a valid A/B test.",
    options: [
      "Sample size must be large enough that a real effect is distinguishable from random noise",
      "A guardrail metric protects against a primary-metric win that hides damage elsewhere (e.g. crashes)",
      "Users should be randomly reassigned to a different variant on every app launch",
      "Variant assignment should be based on a stable hash so a user sees the same variant consistently",
    ],
    answers: [0, 1, 3],
    explanation:
      "Sample size and guardrail metrics make an experiment statistically meaningful and safe. Reassigning users randomly each launch (option 2) breaks both the user experience and the experiment's data.",
  },
  {
    id: "flags-debt-senior",
    type: "predict",
    prompt: "🧠 A release flag reached 100% rollout eight months ago and was never removed from the code. What's the concrete cost of leaving it?",
    code: `if FeatureFlags.newCheckoutEnabled { showNewCheckout() } else { showLegacyCheckout() }\n// rollout has been 100% for 8 months`,
    options: [
      "Flag debt — a permanent dead if/else branch that doubles the paths a future change must reason about, even though only one branch has run in months",
      "No real cost — an unused branch has zero runtime overhead and the compiler will eliminate the dead code entirely during optimization, leaving no footprint in the binary",
      "It automatically gets deleted by the remote config service after 90 days, once the platform detects the flag has been at 100% rollout with no recent value changes",
      "It causes the app to crash on the next build, because the compiler detects the unreachable else branch and treats it as a logical error in release configuration",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "This is flag debt: a stale conditional that adds cognitive and maintenance overhead with no benefit. The fix is deleting the flag and the dead branch once the rollout is confirmed stable, treating that as part of the feature's definition of done.",
  },
  {
    id: "flags-flashcard",
    type: "flashcard",
    prompt: "Explain feature flags end-to-end: types, remote config, rollout, experimentation, and cleanup. Answer aloud, then reveal.",
    modelAnswer:
      "A **feature flag** is a runtime check guarding a feature whose value can change without a new build. Flags come in different types: **release flag** and experiment flag are temporary and should be deleted once their decision is made; **permission flag** and **ops flag** are permanent, checking a long-lived condition. The flag's value comes from **remote config**, a key-value payload fetched from a server — with a safe default for when the fetch fails, so behavior degrades to already-shipped code, not an undefined state. A **percentage rollout** ramps the 'on' group gradually using a stable hash of user ID (so assignment is consistent across sessions), watching a health metric at each step so a bad rollout can be reversed after affecting only a small slice of users. An **A/B test** goes further, deliberately keeping control and treatment variants live to statistically compare a metric — requiring adequate **sample size** to avoid noise, and a **guardrail metric** so a primary-metric win can't hide damage elsewhere. The step teams consistently skip is cleanup: once a release or experiment flag reaches its final state, both the flag and the dead branch should be deleted — otherwise it becomes **flag debt**, permanent dead conditionals nobody trusts or fully understands.",
    keyPoints: [
      "Flag types: release/experiment = temporary; permission/ops = permanent",
      "Remote config needs a safe default for fetch failures",
      "Stable-hash rollout + health metric monitoring = reversible safety net",
      "A/B test needs adequate sample size and a guardrail metric",
      "Flag debt: failing to delete flags/branches after they reach their final state",
    ],
    explanation:
      "A senior answer treats flag lifecycle management — not just the on/off mechanism — as the core of the system, since that's what prevents the codebase from rotting.",
  },
];

export default quiz;
