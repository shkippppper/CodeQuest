import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ui-testing-what-is-xcuiapplication",
    type: "mcq",
    prompt: "What does `XCUIApplication()` actually do?",
    options: [
      "Represents and launches your app as a separate real process, driven through the accessibility layer",
      "Creates an in-memory mock of your view controllers",
      "Runs your app's unit tests inside the same process as the test",
      "Compiles a headless version of your app with no UI",
    ],
    answer: 0,
    explanation:
      "`XCUIApplication` is a proxy for your app running as its own process. `launch()` boots it for real, and XCUITest drives it through the same accessibility layer VoiceOver uses.",
  },
  {
    id: "ui-testing-identifier-vs-label",
    type: "mcq",
    prompt: "Why prefer querying by accessibility identifier over visible label text?",
    options: [
      "Identifiers are stable and don't change with localization or copy edits, unlike visible text",
      "Identifiers run faster than text queries",
      "Visible text queries are not supported by XCUIApplication",
      "Identifiers are required for the app to compile",
    ],
    answer: 0,
    explanation:
      "Visible text changes with localization, A/B tests, and copy edits. An explicit `.accessibilityIdentifier(...)` stays stable, so tests built on it survive those changes.",
  },
  {
    id: "ui-testing-predict-exists",
    type: "predict",
    prompt: "This test taps a button that triggers a network call and a screen transition. What's most likely to happen?",
    code: `signInButton.tap()
XCTAssertTrue(app.staticTexts["Welcome, Ada"].exists)`,
    options: [
      "It flakes or fails — `exists` checks immediately, before the async transition finishes",
      "It always passes, since `tap()` blocks until the app is idle",
      "It throws a compile error",
      "It always fails because `exists` can't be used after `tap()`",
    ],
    answer: 0,
    explanation:
      "`exists` reports the state right now. A network call and screen transition take real time, so the label usually isn't there yet — this needs `waitForExistence(timeout:)` instead.",
  },
  {
    id: "ui-testing-fill-wait",
    type: "fill",
    prompt:
      "Instead of calling `sleep()`, the correct way to wait for an element to appear before asserting on it is `element.___(timeout: 5)`.",
    answers: ["waitForExistence"],
    hint: "It polls for existence up to a timeout, instead of sleeping a fixed amount of time.",
    explanation:
      "`waitForExistence(timeout:)` polls until the element appears or the timeout elapses, returning as soon as the condition is true — fast on fast runs, still reliable on slow ones.",
  },
  {
    id: "ui-testing-hittable-mcq",
    type: "mcq",
    prompt: "An element's `.exists` is `true` but tapping it fails intermittently. What should you check next?",
    options: [
      "`isHittable` — the element may be off-screen or covered by another view like the keyboard",
      "Whether the app compiled in Debug or Release",
      "Whether the test target links XCTest",
      "The device's clock time",
    ],
    answer: 0,
    explanation:
      "An element can exist in the view hierarchy while being covered by another view or scrolled off-screen. `isHittable` reports whether a tap would actually land on it.",
  },
  {
    id: "ui-testing-flake-sources-multi",
    type: "multi",
    prompt: "Select **all** common sources of flaky UI tests.",
    options: [
      "Using `sleep()` with a fixed duration instead of `waitForExistence`",
      "Hitting a real, unmocked backend from the test",
      "Leftover app state carried over from a previous test",
      "Using `waitForExistence(timeout:)` before asserting",
    ],
    answers: [0, 1, 2],
    explanation:
      "Fixed sleeps, real network dependencies, and shared state between tests are classic flake sources. `waitForExistence` is the *fix* for flakiness, not a cause of it.",
  },
  {
    id: "ui-testing-page-object-mcq",
    type: "mcq",
    prompt: "What problem does the Page Object pattern solve in UI tests?",
    options: [
      "It centralizes a screen's element queries and actions in one type, so a UI change means editing one place instead of every test",
      "It makes tests run in a separate process for speed",
      "It replaces the need for accessibility identifiers",
      "It lets tests run without launching the app",
    ],
    answer: 0,
    explanation:
      "Without it, every test that touches a screen repeats the same queries inline. A Page Object pulls those into one type, so tests read as intent and a layout change is fixed once.",
  },
  {
    id: "ui-testing-senior-network-predict",
    type: "predict",
    prompt:
      "A senior-level question: your UI test suite passes locally but fails ~10% of the time on CI, always on tests that log in. What's the most likely root cause?",
    code: `// LoginScreen.signIn() hits the real production auth API`,
    options: [
      "The test depends on a real network call, so CI's slower or shared network conditions introduce non-determinism",
      "CI machines don't support XCUIApplication",
      "The accessibility identifiers are different on CI",
      "UI tests can't run in CI at all",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Any live, uncontrolled dependency — a real backend, real network latency — introduces variance a fixed-timeout test can't fully absorb. The fix is stubbing the network or driving the app via a launch argument that injects deterministic responses.",
  },
  {
    id: "ui-testing-flashcard",
    type: "flashcard",
    prompt:
      "Explain how XCUITest finds and drives UI elements, and the two main techniques for avoiding flaky tests. Answer aloud, then reveal.",
    modelAnswer:
      "`XCUIApplication` launches the app as a real, separate process and drives it through the same **accessibility** layer VoiceOver uses. You find elements with **queries** like `app.buttons[\"id\"]`, ideally matched against an explicit `.accessibilityIdentifier(...)` rather than visible text, since text changes with localization and copy edits. Once an element resolves, you act on it (`tap()`, `typeText(...)`) and assert on the result. Because UI transitions, animations, and network calls are asynchronous, asserting immediately with `.exists` is unreliable — use `waitForExistence(timeout:)`, which polls until the condition is true instead of guessing with `sleep()`. Also check `isHittable`, not just `.exists`, since an element can be present in the hierarchy but covered by another view or the keyboard. Beyond waits, flakiness commonly comes from real network dependencies and state left over from a previous test — both are fixed by injecting fake, deterministic data (e.g. via launch arguments) and resetting state in `setUp()`. To keep large suites maintainable, the **Page Object pattern** centralizes a screen's queries and actions into one type, so a UI redesign only requires updating one place.",
    keyPoints: [
      "XCUIApplication launches the app as a real process, driven via accessibility",
      "Prefer accessibility identifiers over visible text for queries",
      "waitForExistence(timeout:) instead of sleep(); also check isHittable",
      "Real network calls and leftover state between tests are the main flake sources",
      "Page Object pattern centralizes queries/actions per screen for maintainability",
    ],
    explanation:
      "A senior answer connects flakiness back to asynchronicity and non-determinism, not just 'add a wait', and calls out Page Objects as a maintainability tool, not just a style preference.",
  },
];

export default quiz;
