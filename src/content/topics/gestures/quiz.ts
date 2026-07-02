import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "recognizer-purpose",
    type: "mcq",
    prompt: "What does a UIGestureRecognizer do for you?",
    options: [
      "Analyzes the raw touch stream and fires an action when a named gesture (tap, pan, pinch…) is detected",
      "Renders the view",
      "Manages Auto Layout",
      "Handles networking",
    ],
    answer: 0,
    explanation:
      "Recognizers sit atop the raw touch system, doing the touch analysis so you get clean, named gestures via target-action instead of parsing `touchesBegan/Moved/Ended` yourself.",
  },
  {
    id: "target-action-attach",
    type: "mcq",
    prompt: "What's required to make `view.addGestureRecognizer(tap)` work?",
    options: [
      "The view must have `isUserInteractionEnabled = true`",
      "The view must be a UIButton",
      "The gesture must be added in viewDidAppear",
      "The view must be first responder",
    ],
    answer: 0,
    explanation:
      "Gestures only fire on views that accept interaction. Some views (like `UIImageView`) default to `isUserInteractionEnabled = false`, so you must enable it.",
  },
  {
    id: "continuous-state",
    type: "predict",
    prompt: "How often does a UIPanGestureRecognizer's action fire during a drag?",
    code: `@objc func handlePan(_ gr: UIPanGestureRecognizer) { /* ... */ }`,
    options: [
      "Repeatedly — it's continuous; check gr.state (.began/.changed/.ended)",
      "Exactly once when the drag ends",
      "Once per touch, not per movement",
      "Never — pan isn't a recognizer",
    ],
    answer: 0,
    explanation:
      "Continuous gestures (pan, pinch, long-press) fire many times as they progress. Switch on `state` — `.began`, `.changed` (repeated), `.ended`/`.cancelled` — and read values like `translation(in:)`. Discrete gestures (tap, swipe) fire once.",
  },
  {
    id: "simultaneous-fill",
    type: "fill",
    prompt: "Implement the delegate method `shouldRecognizeSimultaneouslyWith` returning ___ to let two gestures recognize at the same time.",
    answers: ["true"],
    hint: "A boolean.",
    explanation:
      "By default only one recognizer wins per touch sequence. Returning `true` from `gestureRecognizer(_:shouldRecognizeSimultaneouslyWith:)` allows concurrent recognition (e.g. pinch + rotate).",
  },
  {
    id: "require-tofail",
    type: "mcq",
    prompt: "How do you make a single-tap only fire if a double-tap doesn't happen?",
    options: [
      "`singleTap.require(toFail: doubleTap)`",
      "Set both to numberOfTapsRequired = 1",
      "Add them to different views",
      "It's impossible",
    ],
    answer: 0,
    explanation:
      "`require(toFail:)` establishes priority: the single-tap waits for the double-tap to fail before recognizing. It's the standard disambiguation for overlapping tap gestures.",
  },
  {
    id: "gestures-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about gesture recognizers.",
    options: [
      "Continuous gestures fire repeatedly and expose a `state`",
      "By default, gestures are mutually exclusive (one wins per touch sequence)",
      "You can subclass UIGestureRecognizer for custom gestures",
      "A view receives gestures even with isUserInteractionEnabled = false",
    ],
    answers: [0, 1, 2],
    explanation:
      "State-based continuous gestures, default exclusivity, and custom subclasses are correct. A view with `isUserInteractionEnabled = false` receives **no** touches/gestures (option 3 is false).",
  },
  {
    id: "button-in-pan-senior",
    type: "predict",
    prompt: "🧠 Trick question — a button sits inside a view that has a pan gesture. Taps on the button feel unreliable. What resolves it?",
    code: `// pannable container view contains a UIButton`,
    options: [
      "Use the delegate (gestureRecognizer(_:shouldReceive:) / shouldBegin) or require(toFail:) so the pan doesn't steal the button's touch",
      "Remove the button",
      "Disable Auto Layout",
      "Make the button first responder",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The pan can intercept touches meant for the button. Filter with `gestureRecognizer(_:shouldReceive:)` (ignore touches landing on controls), gate with `gestureRecognizerShouldBegin`, or set failure requirements — so the button's tap wins when appropriate. (UIKit already special-cases some controls, but nested custom cases need these hooks.)",
  },
  {
    id: "custom-gesture-state-senior",
    type: "mcq",
    prompt: "When writing a custom UIGestureRecognizer subclass, what do you do if the touches don't match your gesture?",
    options: [
      "Set `state = .failed` so other recognizers can proceed",
      "Return nil from touchesBegan",
      "Call removeGestureRecognizer on yourself",
      "Throw an error",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "In a custom recognizer you drive `state` from `touchesBegan/Moved/Ended`. Setting `.failed` early (when the input can't be your gesture) both stops your recognizer and lets competing recognizers take over the touch.",
  },
  {
    id: "recognizer-vs-touches-senior",
    type: "mcq",
    prompt: "How do gesture recognizers interact with a view's own `touchesBegan`?",
    options: [
      "Recognizers can intercept/delay touches before (or instead of) they reach the view's touchesBegan",
      "They never affect touchesBegan",
      "They only run after touchesEnded",
      "They replace the responder chain entirely",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Recognizers observe the same touches and can recognize a gesture, which may cancel/delay delivery to the view's `touchesBegan/Moved/Ended` (governed by properties like `cancelsTouchesInView`, `delaysTouchesBegan`). That's why an active recognizer can 'swallow' touches from the underlying view.",
  },
  {
    id: "gestures-flashcard",
    type: "flashcard",
    prompt:
      "Explain gesture recognizers: attaching them, discrete vs continuous, and resolving conflicts. Answer aloud, then reveal.",
    modelAnswer:
      "A **`UIGestureRecognizer`** analyzes the raw touch stream and fires an **action** (target-action) when its gesture is detected — a cleaner layer over `touchesBegan/Moved/Ended`. Built-ins cover tap, pan, long-press, swipe, pinch, rotation, screen-edge; you can subclass for custom gestures. Attach one with `addGestureRecognizer` to a view that has **`isUserInteractionEnabled = true`**. **Discrete** gestures (tap, swipe) fire once; **continuous** ones (pan, pinch, long-press) fire repeatedly, so you switch on **`state`** (`.began`/`.changed`/`.ended`/`.cancelled`) and read values like `translation(in:)`/`scale`. By default recognizers are **mutually exclusive**, so use the delegate's **`shouldRecognizeSimultaneouslyWith`** for concurrent gestures (pinch+rotate) and **`require(toFail:)`** for priority (single-tap requires the double-tap to fail). Delegate hooks (`gestureRecognizerShouldBegin`, `shouldReceive touch:`) resolve conflicts like a button inside a pannable view. Recognizers can also **intercept/delay** touches before the view's own `touchesBegan` (via `cancelsTouchesInView`/`delaysTouchesBegan`); a custom recognizer drives `state` and sets `.failed` when the input isn't its gesture.",
    keyPoints: [
      "Recognizer = target-action over analyzed touches; needs isUserInteractionEnabled",
      "Discrete fire once; continuous fire repeatedly (switch on state)",
      "Default mutually exclusive → shouldRecognizeSimultaneouslyWith / require(toFail:)",
      "Delegate hooks (shouldBegin, shouldReceive touch:) resolve conflicts",
      "Recognizers can intercept/delay the view's touchesBegan; custom sets state/.failed",
    ],
    explanation:
      "Senior answers cover discrete-vs-continuous state handling, conflict resolution (simultaneous + require(toFail:) + delegate), and how recognizers interact with the underlying view's touch delivery.",
  },
];

export default quiz;
