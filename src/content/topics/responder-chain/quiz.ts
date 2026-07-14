import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "hittest-vs-chain",
    type: "mcq",
    prompt: "What's the difference between hit testing and the responder chain?",
    options: [
      "Hit testing finds the initial view for a touch; the responder chain routes an unhandled event up through next responders",
      "They are the same mechanism — hit testing IS the responder chain, just named differently depending on whether a touch is involved",
      "Hit testing routes keyboard input to the focused view, while the responder chain finds the correct view for touch events",
      "The responder chain runs before hit testing — UIKit walks it first to find a willing handler, then confirms with point(inside:)",
    ],
    answer: 0,
    explanation:
      "Hit testing (`hitTest(_:with:)`) locates the deepest view under a touch. If that view doesn't handle the event, it bubbles **up** the responder chain via `next` responders.",
  },
  {
    id: "first-responder",
    type: "mcq",
    prompt: "What is the first responder primarily for?",
    options: [
      "Receiving non-positional events like keyboard input and menu/shortcut actions first",
      "Being the topmost view on screen — the view rendered last in the view hierarchy Z-order automatically becomes first responder",
      "Handling the very first touch of a multi-touch gesture before any other view gets a chance to recognize the sequence",
      "The app delegate — it is always the first responder so that global keyboard shortcuts are handled before any view sees them",
    ],
    answer: 0,
    explanation:
      "The first responder gets first crack at events not tied to a location — keyboard text, `UIKeyCommand`s, menu actions. A `UITextField` becomes first responder when editing (showing the keyboard).",
  },
  {
    id: "becomefirstresponder-fill",
    type: "fill",
    prompt: "Call `textField.___()` to make it the first responder and show the keyboard.",
    answers: ["becomeFirstResponder"],
    hint: "become___Responder.",
    explanation:
      "`becomeFirstResponder()` requests first-responder status (showing the keyboard for a text field); `resignFirstResponder()` gives it up (dismissing the keyboard).",
  },
  {
    id: "hittest-ignores",
    type: "mcq",
    prompt: "Which views does hit testing skip (so they can't receive touches)?",
    options: [
      "Hidden views, views with isUserInteractionEnabled = false, and near-transparent (alpha < 0.01) views",
      "Views with any background color, since a colored background suggests the view is purely decorative and not interactive",
      "Views nested inside a UIStackView, because the stack view intercepts all touches on behalf of its arranged subviews",
      "Views with a cornerRadius greater than zero, because clipped corners reduce the hittable area below the frame rectangle",
    ],
    answer: 0,
    explanation:
      "Hit testing ignores `isHidden`, `isUserInteractionEnabled == false`, and `alpha < 0.01` views. So a disabled or invisible view won't intercept touches.",
  },
  {
    id: "responder-chain-order",
    type: "predict",
    prompt: "What's the typical responder chain order for an unhandled touch starting at a button?",
    code: `// button → ? → ? → ? → ?`,
    options: [
      "button → superviews → view controller → window → UIApplication → AppDelegate",
      "button → AppDelegate → window → view controller → superviews, because the app delegate handles global events first",
      "button → UIApplication → superviews → view controller, skipping the window since it's transparent to event routing",
      "button → window → button again — the event bounces back to the initial hit-tested view after the window fails to handle it",
    ],
    answer: 0,
    explanation:
      "A view's `next` is usually its superview; the top view's next is its view controller, then the window, the application, and the app delegate. Any responder can handle and stop the chain.",
  },
  {
    id: "responder-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about UIKit events.",
    options: [
      "UIView, UIViewController, UIApplication, and AppDelegate are all UIResponders",
      "`hitTest(_:with:)` uses `point(inside:with:)` to test each view",
      "Returning nil from hitTest passes the touch through to what's behind",
      "Keyboard input is delivered via hit testing to the tapped view",
    ],
    answers: [0, 1, 2],
    explanation:
      "The responder classes, hitTest using point(inside:), and nil-hitTest pass-through are correct. Keyboard input goes to the **first responder**, not via hit testing (option 3 is false).",
  },
  {
    id: "subview-outside-bounds-senior",
    type: "predict",
    prompt: "🧠 Trick question — a button is placed partly OUTSIDE its parent's bounds. Why is the outside part untappable?",
    code: `// child button extends beyond parent.bounds`,
    options: [
      "Hit testing asks the parent point(inside:) first; points outside the parent's bounds return false, so the child never gets the touch",
      "Buttons declared as subviews can't extend visually or interactively past their parent's frame in any direction whatsoever",
      "The button is hidden — UIKit automatically hides any portion of a subview that extends outside its parent's clipsToBounds area",
      "It's purely a rendering issue and taps work fine everywhere — hit testing uses the button's own absolute frame, not the parent's bounds",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Hit testing descends only into views whose `point(inside:)` is true. A touch outside the parent's bounds fails the parent's test, so UIKit never reaches the child — even though the child is drawn there. Fix by overriding the parent's `point(inside:)`/`hitTest` to include the child's area (or enlarge the parent).",
  },
  {
    id: "target-nil-senior",
    type: "mcq",
    prompt: "How does a `sendAction` with `target: nil` (e.g. copy:/paste:) find its handler?",
    options: [
      "It travels up the responder chain until a responder implements that selector",
      "It calls the AppDelegate directly, bypassing the chain, since the delegate handles all system-level actions globally",
      "It broadcasts to every visible view simultaneously, and all matching handlers execute in reverse Z-order",
      "It does nothing without an explicit target — UIKit ignores sendAction calls where target is nil as a safety measure",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A nil-target action is dispatched **up the responder chain** starting at the first responder until an object implements the selector. This is how editing menu commands (`cut:`/`copy:`/`paste:`), `UIKeyCommand`s, and first-responder actions are routed.",
  },
  {
    id: "passthrough-hittest-senior",
    type: "mcq",
    prompt: "You want an overlay view to let touches reach the content behind it. What do you do?",
    options: [
      "Override hitTest to return nil (or the underlying view) for points the overlay shouldn't handle",
      "Set the overlay's alpha to exactly 1.0, since any fully opaque view automatically passes all touches through to views behind it",
      "Add more Auto Layout constraints to shrink the overlay's frame so it doesn't cover the interactive content underneath",
      "Make the overlay the first responder so it receives all events at the start of the chain and can decide how to forward them",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Returning `nil` from `hitTest(_:with:)` (or returning the specific underlying view) tells UIKit the overlay doesn't want that touch, so it passes through to what's behind. Setting `isUserInteractionEnabled = false` on the overlay achieves a whole-view version of the same.",
  },
  {
    id: "responder-flashcard",
    type: "flashcard",
    prompt:
      "Explain hit testing, the responder chain, and first responder. Answer aloud, then reveal.",
    modelAnswer:
      "UIKit routes events in two cooperating phases. **Hit testing** finds the **initial view for a touch**: `hitTest(_:with:)` walks the view tree from the window **down**, using `point(inside:with:)` to find the deepest view containing the point — skipping views that are hidden, have `isUserInteractionEnabled = false`, or `alpha < 0.01`. If that view (a **`UIResponder`**) doesn't handle the event, it bubbles **up the responder chain** via `next`: view → superviews → view controller → window → `UIApplication` → `AppDelegate`; any responder can handle it and stop the chain. The **first responder** is the entry point for **non-positional** events — keyboard input, `UIKeyCommand`s, menu actions — and `target: nil` actions (like `copy:`/`paste:`) travel up the chain from it until something implements the selector. Key gotchas: a subview **outside its parent's bounds isn't tappable** (parent's `point(inside:)` fails — override it/`hitTest`), and returning **`nil` from `hitTest` passes the touch through** to views behind.",
    keyPoints: [
      "Hit testing = find initial touched view (hitTest + point(inside:), top→down)",
      "Skips hidden / userInteractionEnabled=false / alpha<0.01 views",
      "Responder chain = view → superviews → VC → window → app → app delegate",
      "First responder handles keyboard/shortcuts/menu; target:nil actions go up the chain",
      "Gotchas: outside-parent-bounds untappable; hitTest→nil passes touches through",
    ],
    explanation:
      "Senior answers separate hit testing (initial view) from the responder chain (bubbling), and cite the outside-bounds untappable + nil-hitTest pass-through + target:nil-up-the-chain behaviors.",
  },
];

export default quiz;
