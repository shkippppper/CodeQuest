import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "frame-coordinate-system",
    type: "mcq",
    prompt: "In whose coordinate system is a view's `frame` expressed?",
    options: [
      "The superview's coordinate system",
      "The view's own coordinate system",
      "The screen's coordinate system, always",
      "The window's coordinate system",
    ],
    answer: 0,
    explanation:
      "`frame` describes where the view sits **inside its superview**. `bounds`, by contrast, is in the view's **own** coordinate system.",
  },
  {
    id: "bounds-coordinate-system",
    type: "mcq",
    prompt: "What does `bounds` describe?",
    options: [
      "The view's own internal rectangle in its own coordinate system (origin defaults to 0,0)",
      "The view's position inside its superview, expressed as an origin point plus a size in the parent's coordinate space",
      "The device screen size in logical points, updated whenever the device orientation changes or an external display is connected",
      "The safe area insets subtracted from the full bounds, giving the region where content won't be obscured by the notch or home indicator",
    ],
    answer: 0,
    explanation:
      "`bounds` is the view's rectangle in its **own** space; its origin defaults to `(0,0)` and its size matches the frame's size (absent transforms). Subviews are laid out relative to their superview's bounds.",
  },
  {
    id: "scrollview-bounds",
    type: "mcq",
    prompt: "How does a UIScrollView 'scroll' its content?",
    options: [
      "By changing its `bounds.origin`, which shifts the visible portion without moving the view in its superview",
      "By changing its `frame.origin`, which repositions the entire scroll view container within its parent to simulate a scrolling effect",
      "By resizing all subviews proportionally so that more content fits within the fixed frame as the user drags a finger across the screen",
      "By moving the window's root view controller, shifting all content relative to the physical display boundaries rather than the view hierarchy",
    ],
    answer: 0,
    explanation:
      "Scrolling moves the scroll view's `bounds.origin`. Since subviews are positioned relative to the superview's bounds, shifting the bounds origin changes which content is visible — the scroll view's own frame stays put.",
  },
  {
    id: "fb-when-changes",
    type: "predict",
    prompt: "You move a view within its parent (no resize, no transform). Which changes?",
    code: `// reposition view inside its superview`,
    options: [
      "frame.origin and center change; bounds is unchanged",
      "bounds.origin changes while frame stays fixed in the superview, since the reposition is tracked in the view's own coordinate space",
      "Both frame and bounds origins change together, since they describe the same rect just from different reference frames",
      "Neither changes, because repositioning is handled by Auto Layout constraints rather than by mutating frame or bounds directly",
    ],
    answer: 0,
    explanation:
      "Moving within the parent changes the superview-space values (`frame.origin`, `center`). The view's own internal rectangle (`bounds`) is unaffected.",
  },
  {
    id: "center-fill",
    type: "fill",
    prompt: "Like frame, the `___` property expresses the view's midpoint in the SUPERVIEW's coordinate system.",
    answers: ["center"],
    hint: "The midpoint property.",
    explanation:
      "`center` is a superview-space point (the view's midpoint in its parent). It's often the cleanest way to reposition a view, and — unlike frame — it stays valid under a transform.",
  },
  {
    id: "fb-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about frame and bounds.",
    options: [
      "`frame` is in the superview's coordinates; `bounds` is in the view's own",
      "Subviews are positioned relative to their superview's bounds",
      "`bounds.origin` is always (0,0) and can never change",
      "Resizing a view changes both frame.size and bounds.size",
    ],
    answers: [0, 1, 3],
    explanation:
      "The coordinate-system distinction, subview positioning via bounds, and resize affecting both sizes are correct. `bounds.origin` **can** change (e.g. scroll views move it) — option 3 is false.",
  },
  {
    id: "transform-frame-senior",
    type: "predict",
    prompt: "🧠 Trick question — you rotate a square view 45° with a transform. What happens to bounds vs frame?",
    code: `view.transform = CGAffineTransform(rotationAngle: .pi / 4)`,
    options: [
      "bounds and center stay the same; frame becomes the larger axis-aligned box enclosing the rotated square",
      "Both bounds and frame rotate identically, since they describe the same physical area and the transform applies to the coordinate system they share",
      "bounds becomes larger to enclose the rotated corners while frame stays the same size because frame is fixed in the superview's axis-aligned grid",
      "Nothing changes until the view is redrawn on the next run loop cycle, at which point both frame and bounds update to reflect the new rotation angle",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Under a transform, `bounds` (the view's own rect) and `center` are unchanged, but `frame` reports the **axis-aligned bounding box** of the transformed view — bigger than the original for a rotation. That's why a rotated square's frame is larger than its bounds.",
  },
  {
    id: "transform-set-frame-senior",
    type: "mcq",
    prompt: "Once a non-identity `transform` is applied, which should you avoid using to position/size the view?",
    options: [
      "`frame` — use `bounds` (size) and `center` (position) instead",
      "`center` — it reports the midpoint in the superview's pre-transform coordinate space, so setting it moves the view to the wrong position after rotation is applied",
      "`bounds` — it becomes meaningless under transforms since it no longer maps to a predictable region of the superview's coordinate space",
      "All three are equally safe to read and write under a non-identity transform, since UIKit automatically adjusts each property to account for the current transformation matrix",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "With a transform in place, `frame` is a derived bounding box and setting it yields undefined/confusing results. Manipulate `bounds` for size and `center` for position — both remain well-defined under transforms.",
  },
  {
    id: "subview-superview-bounds-senior",
    type: "mcq",
    prompt: "Why does changing a superview's `bounds.origin` reposition its subviews?",
    options: [
      "Subview frames are interpreted relative to the superview's bounds, so shifting the bounds origin shifts all children",
      "It doesn't affect subviews at all — subview positions are stored as absolute screen coordinates that remain fixed regardless of any ancestor's bounds changes",
      "Subviews are positioned relative to the window's coordinate system, so only changing the window's bounds origin would cause them to appear to move on screen",
      "Because it resizes the subviews proportionally to fill the new visible region, scaling their frames so their content fills the same fraction of the visible area as before",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A subview's frame is in its superview's coordinate space, which is defined by the superview's **bounds**. Moving `bounds.origin` (as scroll views do) therefore shifts where all subviews appear — the mechanism behind scrolling.",
  },
  {
    id: "frame-bounds-flashcard",
    type: "flashcard",
    prompt:
      "Explain frame vs bounds, and what happens to each under a transform. Answer aloud, then reveal.",
    modelAnswer:
      "Both are `CGRect`s, but in **different coordinate systems**: **`frame`** is in the **superview's** coordinates (where the view sits in its parent), while **`bounds`** is in the view's **own** coordinates (its internal rectangle, origin defaulting to `(0,0)`). Consequences: subviews are laid out relative to their superview's **bounds**, and a **`UIScrollView` scrolls by changing its `bounds.origin`** (content shifts, the view stays put in its parent). **`center`** is, like frame, a **superview-space** midpoint. The big gotcha is **transforms**: applying a rotation/scale leaves **`bounds` and `center` unchanged** but makes **`frame` the axis-aligned bounding box** of the transformed view — so a rotated square's frame is *larger* than its bounds. Therefore, once a non-identity transform is set, **manipulate `bounds`/`center`, not `frame`** (setting frame under a transform is undefined). Summary of changes: moving within parent → frame/center change; scrolling → bounds.origin changes; rotating → frame becomes the enclosing box while bounds/center hold.",
    keyPoints: [
      "frame = superview coords (placement); bounds = own coords (internal rect)",
      "Subviews positioned relative to superview's bounds",
      "Scroll views scroll by moving bounds.origin",
      "center is a superview-space midpoint (valid under transforms)",
      "Under a transform: bounds/center stay, frame = enclosing box → don't set frame",
    ],
    explanation:
      "Senior answers derive scrolling from bounds.origin and nail the transform behavior (frame = bounding box; use bounds/center, not frame, under a transform).",
  },
];

export default quiz;
