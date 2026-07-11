import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "launch-cold-warm",
    type: "mcq",
    prompt: "What's the difference between a cold launch and a warm launch?",
    options: [
      "Cold launch starts from no process in memory and loads everything from disk; warm launch can reuse recently cached parts of the binary, making it faster",
      "They take exactly the same amount of time",
      "Warm launch means the app was never installed before",
      "Cold launch only happens on the App Store, warm launch only in Xcode",
    ],
    answer: 0,
    explanation:
      "Cold launch is the worst case: no process exists, so the system loads your executable and its libraries fresh from disk. A warm launch benefits from OS-level caching from a recent run, so it's typically faster. Optimization work targets cold launch since it's the worst first impression.",
  },
  {
    id: "launch-resume-fill",
    type: "fill",
    prompt: "When an app was only backgrounded (not terminated) and the system just brings it back to the foreground with no launch code running, that's called a ___.",
    answers: ["resume"],
    hint: "One word, distinct from both cold and warm launch.",
    explanation: "A resume isn't a launch at all — the existing process is simply brought back to the foreground, so none of your launch-time code runs again.",
  },
  {
    id: "launch-premain-split",
    type: "mcq",
    prompt: "What is 'pre-main time'?",
    options: [
      "Everything that happens before your first line of Swift code runs — dyld loading your binary and its dynamic libraries, resolving symbols, running static initializers",
      "The time spent in your App struct's init",
      "The time your first screen takes to render after appearing",
      "The time Xcode takes to build your project",
    ],
    answer: 0,
    explanation:
      "Pre-main time is entirely outside your code's control at the source level — it's the dynamic linker's work before main() is called. Your init and everything after it is post-main time.",
  },
  {
    id: "launch-dyld-predict",
    type: "predict",
    prompt: "An app links against 12 small internal frameworks. A senior engineer merges them into 2 larger frameworks with the same total code. What happens to pre-main time, roughly?",
    code: `// Before: 12 separate .framework bundles
// After: 2 larger .framework bundles, same total symbols`,
    options: [
      "Pre-main time tends to drop — dyld's per-library overhead (finding, validating, linking each file) happens once per library regardless of size, so fewer libraries means less fixed overhead",
      "Pre-main time is unaffected because total code size didn't change",
      "Pre-main time increases because bigger files are always slower to load",
      "This only affects post-main time, not pre-main",
    ],
    answer: 0,
    explanation:
      "dyld pays a fixed cost per dynamic library it loads and links, separate from the cost proportional to symbol count. Reducing the number of separate dynamic libraries — even with the same total code — reduces that fixed overhead.",
  },
  {
    id: "launch-defer-fill",
    type: "fill",
    prompt: "Non-critical setup work (like a feature-flag fetch not needed by the first screen) should be moved into a ___, so it runs after the first frame instead of blocking it.",
    answers: ["task"],
    hint: "The Swift concurrency type used to start async work.",
    explanation: "Wrapping deferred work in a Task lets the current run loop turn hand control back to the UI framework to draw the first frame before the deferred work executes.",
  },
  {
    id: "launch-crash-vs-flags",
    type: "mcq",
    prompt: "In launch code that starts a crash reporter synchronously but defers a feature-flag network fetch into a Task, what's the reasoning?",
    options: [
      "The crash reporter is cheap and you want crash coverage from frame one; the flag fetch is a network call not needed by the first screen, so it shouldn't block first paint",
      "Feature flags are always more important than crash reporting",
      "Task-wrapped code never actually runs",
      "Synchronous code is always faster so everything should stay synchronous",
    ],
    answer: 0,
    explanation:
      "The decision is per-line: does the first screen need this to have already finished? Crash reporting is cheap and valuable immediately; a feature-flag fetch gating a screen several taps deep can safely start after the first frame renders.",
  },
  {
    id: "launch-truths-multi",
    type: "multi",
    prompt: "Select all true statements about measuring launch time.",
    options: [
      "Instruments' App Launch template combines pre-main (dyld) time with your own post-main signposts on one timeline",
      "You can add a signpost inside pre-main because your code is already running",
      "Xcode Organizer's Launch Time metric reflects real-world data from App Store/TestFlight builds, useful because it isn't limited to your own dev device",
      "Marking 'first content rendered' with a signpost, not just 'init started', gives a more complete picture of user-perceived launch time",
    ],
    answers: [0, 2, 3],
    explanation:
      "The App Launch template stitches dyld's pre-main data together with your signposts, Organizer gives real-world data across devices, and marking first-content-rendered captures the full user-perceived time. You cannot add a signpost inside pre-main — your code hasn't started running yet (option 1 is false).",
  },
  {
    id: "launch-wrong-target-senior",
    type: "predict",
    prompt: "Instruments' App Launch template shows 800ms pre-main and 200ms post-main out of a 1000ms cold launch. An engineer spends a week shaving 50ms off App init. What's the likely outcome?",
    code: `// pre-main: 800ms (dyld loading 15 frameworks)
// post-main: 200ms (App init + first render)
// optimization target: App init only`,
    options: [
      "Total launch time barely improves — the dominant cost is pre-main (dyld/framework loading), so the effort should have targeted reducing dynamic library count instead",
      "Total launch time improves by roughly 50%",
      "Post-main time is irrelevant to total launch time",
      "Pre-main time will automatically shrink once post-main does",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Optimization effort should go where the time actually is. With 800ms in pre-main dominated by framework loading, a 50ms post-main saving moves the total from 1000ms to 950ms — a 5% improvement, not the win the effort suggests. The App Launch template's breakdown exists precisely to catch this kind of misdirected effort.",
  },
  {
    id: "launch-flashcard",
    type: "flashcard",
    prompt: "Explain the full breakdown of iOS launch time and how you'd go about reducing it. Answer aloud, then reveal.",
    modelAnswer:
      "Launch splits into a **cold launch** (no process in memory, worst case, the one worth optimizing) versus a **warm launch** (recently run, some caching benefit) versus a **resume** (app was only backgrounded, no launch code runs at all). Within a cold launch, time splits into **pre-main time** — everything **dyld** (the dynamic linker) does before your first line of Swift runs: finding, validating, and linking your executable and every dynamic framework it depends on — and post-main time, which is your own `init`/`didFinishLaunching` code up through the first rendered frame. Pre-main is reduced by cutting the number of separate dynamic libraries (merging small frameworks, preferring static linking), since dyld pays fixed per-library overhead regardless of size. Post-main is reduced by auditing every line in your launch path and asking whether the first screen actually needs it to have finished — work that doesn't gate the first screen (feature flag fetches, cache warm-ups, non-critical migrations) gets wrapped in a `Task` so it runs after first paint instead of blocking it. You measure the whole thing with Instruments' App Launch template, which combines dyld's pre-main numbers with your own **signposts** marking events like \"first content rendered\", plus Xcode Organizer's real-world Launch Time metric from actual App Store/TestFlight installs.",
    keyPoints: [
      "Cold launch (worst case, optimization target) vs warm launch vs resume",
      "Pre-main = dyld loading/linking binary + dynamic libraries, before your code runs",
      "Post-main = your init/setup code through first rendered frame",
      "Reduce pre-main by cutting dynamic framework count / static linking",
      "Reduce post-main by deferring non-critical work into a Task after first paint",
      "Measure with App Launch template + signposts + Organizer real-world data",
    ],
    explanation:
      "A senior answer distinguishes pre-main from post-main explicitly, gives a concrete lever for each, and closes the loop with how to measure — including that pre-main can dominate and misdirect effort if you don't check the breakdown first.",
  },
];

export default quiz;
