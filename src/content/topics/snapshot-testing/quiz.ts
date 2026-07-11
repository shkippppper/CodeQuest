import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "snapshot-what-catches",
    type: "mcq",
    prompt: "What does a snapshot test catch that a typical unit test structurally can't?",
    options: [
      "Unintended pixel-level visual changes, like a broken font or a shifted layout, even when no value in the view model changed",
      "Logic errors in a view model's computed properties",
      "Race conditions between two async functions",
      "Memory leaks caused by retain cycles",
    ],
    answer: 0,
    explanation:
      "A snapshot test renders a view and diffs the resulting image against a saved reference, so it catches any pixel change — padding, fonts, colors — regardless of whether you thought to check that specific property.",
  },
  {
    id: "snapshot-record-mode-mcq",
    type: "mcq",
    prompt: "What does `assertSnapshot(of: view, as: .image, record: true)` do?",
    options: [
      "Overwrites the saved reference image with the current rendering and always passes — it never compares",
      "Fails the test if the view doesn't match the last saved image",
      "Runs the snapshot test only on CI",
      "Deletes all previously recorded snapshots",
    ],
    answer: 0,
    explanation:
      "Recording mode always passes; it just saves whatever the view currently renders as the new baseline. It's meant to be run once, deliberately, then removed — never left in committed code.",
  },
  {
    id: "snapshot-predict-record-true",
    type: "predict",
    prompt:
      "A PR adds this and merges it to main. What happens to this test from then on?",
    code: `func test_profileHeader_layout() {
    assertSnapshot(of: view, as: .image, record: true)
}`,
    options: [
      "It will always pass, silently re-recording the reference every run — it can never actually fail",
      "It will fail on the very next unrelated pixel change",
      "It will only run once and then be skipped automatically",
      "CI will refuse to build until record is set back to false",
    ],
    answer: 0,
    explanation:
      "With `record: true` left in, the test never compares against anything — it just re-saves the current rendering as correct every time, so it can never catch a regression.",
  },
  {
    id: "snapshot-fill-precision",
    type: "fill",
    prompt:
      "To tolerate minor anti-aliasing differences across OS versions instead of requiring byte-for-byte equality, you pass a ___ value like 0.98 to the snapshot strategy.",
    answers: ["precision"],
    hint: "It's a fraction of pixels that must match exactly.",
    explanation:
      "`precision: 0.98` requires 98% of pixels to match exactly, absorbing small anti-aliasing noise while still failing on a real layout regression, which shifts far more pixels than that.",
  },
  {
    id: "snapshot-variance-multi",
    type: "multi",
    prompt: "Select **all** valid techniques for reducing false-positive snapshot failures caused by device/OS variance.",
    options: [
      "Pinning an explicit rendered size instead of relying on whatever simulator ran the test",
      "Recording and comparing on the same pinned CI simulator/OS configuration",
      "Allowing a small precision tolerance for anti-aliasing noise",
      "Leaving `record: true` permanently enabled so it never fails",
    ],
    answers: [0, 1, 2],
    explanation:
      "Pinning size, pinning the recording environment, and tolerance are all legitimate ways to reduce noise. Leaving `record: true` on doesn't reduce false positives — it disables the test entirely.",
  },
  {
    id: "snapshot-when-hurt-mcq",
    type: "mcq",
    prompt: "What is 'snapshot fatigue'?",
    options: [
      "Reviewers rubber-stamping 'update snapshots' commits without actually reviewing the diffs, because failures are too frequent to inspect individually",
      "The CPU cost of rendering many views to images during a test run",
      "A crash caused by taking too many snapshots in one test",
      "The delay before a snapshot test times out",
    ],
    answer: 0,
    explanation:
      "When shared-component changes fan out into large batches of snapshot failures, reviewers stop meaningfully reviewing diffs and just re-record — the safety net stops actually verifying anything.",
  },
  {
    id: "snapshot-senior-scope",
    type: "predict",
    prompt:
      "Senior-level: your team snapshot-tests every screen in the app, including ones that change weekly. A design-system spacing token is bumped by 2pt. What's the likely fallout, and what's the better strategy going forward?",
    code: `// Shared DesignSystem.spacing.medium: 8 -> 10
// Every screen using that spacing token fails its snapshot test`,
    options: [
      "Dozens of unrelated snapshot failures fire from one intentional change, training reviewers to stop reading diffs — snapshot testing should be reserved for visually critical, low-churn components",
      "Nothing changes, because snapshot tests only check logic, not layout",
      "Only the design system's own tests fail; screen-level tests are unaffected",
      "The build fails to compile since spacing tokens can't be snapshot tested",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Snapshot tests are indiscriminate — any pixel shift fails, wanted or not. A shared low-level change fanning out into a large re-record batch is exactly how snapshot fatigue starts. The fix is scoping snapshot coverage to visually critical, low-churn views rather than every screen.",
  },
  {
    id: "snapshot-flashcard",
    type: "flashcard",
    prompt:
      "Explain what snapshot testing is, how recording vs comparing modes work, and when it stops being worth the cost. Answer aloud, then reveal.",
    modelAnswer:
      "A **snapshot test** renders a view to an image and compares it pixel-by-pixel against a previously saved reference image, failing if they differ. It catches any unintended visual regression — padding shifts, broken fonts, wrong dark-mode colors — that a value-based unit test would never notice, because nothing about the underlying data changed. Snapshot libraries run in two modes: `record: true` always passes and just overwrites the saved reference with the current rendering (used once, locally, to create or intentionally update a baseline — never left in committed code); the default comparing mode renders the view and diffs it against the saved file, failing with a visual diff on mismatch. Because raw pixels depend on the exact OS, simulator, and font rendering that produced them, teams pin a fixed rendered `size`, record references on one pinned CI configuration, and often allow a small `precision` tolerance (e.g. 0.98) to absorb anti-aliasing noise without hiding a real regression. The downside is that snapshot tests are indiscriminate — any pixel change fails, wanted or not — so a single shared-component tweak can invalidate dozens of references at once. Reviewing and re-recording that many diffs regularly leads to **snapshot fatigue**, where reviewers stop actually reading diffs and just approve re-records, turning the safety net into a rubber stamp. The practical guidance is to snapshot-test visually critical, low-churn components (a design system's core pieces) rather than every screen, and lean on unit/UI tests for behavior.",
    keyPoints: [
      "Renders a view to an image, diffs pixel-by-pixel against a saved reference",
      "record: true saves a new baseline and always passes; never leave it in committed code",
      "Pin size + CI simulator/OS, and/or a precision tolerance, to reduce false positives",
      "Indiscriminate: any pixel change fails, causing large diff batches from one shared-component change",
      "Snapshot fatigue = reviewers stop reading diffs; scope snapshots to low-churn, visually critical views",
    ],
    explanation:
      "A senior answer connects the recording/comparing mechanics to the variance problem, and explicitly names snapshot fatigue as the reason to scope coverage rather than snapshot everything.",
  },
];

export default quiz;
