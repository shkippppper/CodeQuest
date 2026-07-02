import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "view-layer-split",
    type: "mcq",
    prompt: "What is the division of labor between a UIView and its CALayer?",
    options: [
      "The view handles events/layout/responder duties; the layer does drawing and animation",
      "The view draws; the layer handles touches",
      "They are the same object",
      "The layer handles Auto Layout",
    ],
    answer: 0,
    explanation:
      "Every `UIView` is backed by a `CALayer` at `view.layer`. The view is the interactive wrapper (touches, layout, responder chain); the layer renders visual content and animates it on the GPU.",
  },
  {
    id: "visual-props-on-layer",
    type: "mcq",
    prompt: "Where do properties like `cornerRadius`, `borderWidth`, and `shadowOpacity` live?",
    options: [
      "On the view's `layer` (CALayer)",
      "On the view directly, unrelated to layers",
      "On the window",
      "On the view controller",
    ],
    answer: 0,
    explanation:
      "These are `CALayer` properties, accessed via `view.layer.cornerRadius`, etc. The view surfaces some, but they belong to the backing layer that does the drawing.",
  },
  {
    id: "cornerradius-mask-fill",
    type: "fill",
    prompt: "Setting `cornerRadius` alone won't clip content; you also need `layer.___ = true`.",
    answers: ["masksToBounds"],
    hint: "masks___Bounds.",
    explanation:
      "`cornerRadius` rounds the background/border, but content/subviews are clipped only when `masksToBounds = true` (equivalent to the view's `clipsToBounds`).",
  },
  {
    id: "cornerradius-shadow-conflict-senior",
    type: "predict",
    prompt: "🧠 Trick question — you set `cornerRadius`, `masksToBounds = true`, AND a shadow on the same layer. Why is there no shadow?",
    code: `layer.cornerRadius = 12
layer.masksToBounds = true
layer.shadowOpacity = 0.3`,
    options: [
      "masksToBounds clips everything to the bounds, including the shadow (drawn outside) — use two layers: one for shadow, an inner one that masks",
      "Shadows require a UIView, not a layer",
      "shadowOpacity must be 1",
      "It's a simulator-only bug",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A shadow is drawn **outside** the layer's bounds, but `masksToBounds` clips to the bounds — so it clips the shadow away. The standard fix is a container layer with the shadow and an inner layer that does the corner masking.",
  },
  {
    id: "implicit-standalone",
    type: "mcq",
    prompt: "When does changing a CALayer property animate implicitly (automatically)?",
    options: [
      "On a standalone CALayer you created — implicit animations are disabled on UIView-backed layers",
      "Always, on every layer",
      "Never — you must always add a CABasicAnimation",
      "Only inside viewDidLoad",
    ],
    answer: 0,
    explanation:
      "Standalone layers animate animatable property changes automatically (implicit animations). But the layer backing a `UIView` has these disabled — inside a view you animate via `UIView.animate`.",
  },
  {
    id: "views-layers-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about views and layers.",
    options: [
      "Every UIView has a backing CALayer",
      "Layers composite on the GPU, making transform/opacity animations cheap",
      "cornerRadius clips subviews without masksToBounds",
      "CAShapeLayer and CAGradientLayer are CALayer subclasses",
    ],
    answers: [0, 1, 3],
    explanation:
      "Backing layer, GPU compositing, and layer subclasses are correct. `cornerRadius` does **not** clip content unless `masksToBounds = true` (option 3 is false).",
  },
  {
    id: "presentation-only-senior",
    type: "predict",
    prompt: "🧠 Trick question — a CABasicAnimation moves a layer, but when it finishes the layer jumps back to the start. Why?",
    code: `let a = CABasicAnimation(keyPath: "position")
a.toValue = newPoint
a.duration = 1
layer.add(a, forKey: nil)   // model layer.position never set`,
    options: [
      "CAAnimation is presentation-only — it animates appearance but doesn't change the model value, so it reverts unless you also set layer.position",
      "The duration is too short",
      "Layers can't animate position",
      "You must call layoutIfNeeded",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A `CAAnimation` animates the **presentation** layer, not the **model** value. When it's removed, the layer shows its real (unchanged) property and snaps back. Set the underlying `layer.position = newPoint` too (or adjust `fillMode`/`isRemovedOnCompletion`), and read `layer.presentation()` for the live value.",
  },
  {
    id: "shadowpath-perf-senior",
    type: "mcq",
    prompt: "Why set an explicit `shadowPath` on a layer with a shadow?",
    options: [
      "Without it, Core Animation computes the shadow shape each frame (offscreen rendering); a shadowPath avoids that cost",
      "It changes the shadow color",
      "It's required for the shadow to appear at all",
      "It disables the shadow",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A shadow without an explicit `shadowPath` forces the renderer to derive the shape from the layer's alpha each frame — an expensive offscreen pass. Providing a `shadowPath` (e.g. a rounded-rect bezier) lets it skip that computation, a common scroll-performance fix.",
  },
  {
    id: "should-rasterize-senior",
    type: "mcq",
    prompt: "When is `layer.shouldRasterize = true` a good idea?",
    options: [
      "For a complex but static layer (cache it as a bitmap); it's harmful if the layer changes often (re-rasterizes each change)",
      "Always — it speeds up everything",
      "Only for text",
      "Never — it has no effect",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`shouldRasterize` caches the layer's rendered bitmap, saving recompositing for **static** complex content. But if the layer changes frequently, it re-rasterizes every change (plus cache-miss overhead), hurting performance. Pair with an appropriate `rasterizationScale`.",
  },
  {
    id: "views-layers-flashcard",
    type: "flashcard",
    prompt:
      "Explain the view/layer relationship and the key Core Animation gotchas. Answer aloud, then reveal.",
    modelAnswer:
      "Every **`UIView` is backed by a `CALayer`** (`view.layer`): the **view** handles events, layout, and the responder chain, while the **layer** does the actual **drawing and animation** (composited on the GPU). That's why visual properties — `cornerRadius`, `borderWidth`, `shadow*`, `masksToBounds` — live on the layer. Gotchas: **`cornerRadius` needs `masksToBounds = true` to clip content**, but masking **clips the shadow** (drawn outside bounds), so rounded-corner-plus-shadow needs a two-layer setup. **Implicit animations** auto-animate property changes on **standalone** `CALayer`s, but are **disabled on UIView-backed layers** (use `UIView.animate` there). For explicit control, add **`CABasicAnimation`**/`CAKeyframeAnimation`/`CAAnimationGroup` — but these are **presentation-only**: they animate appearance and revert on completion unless you also set the model property (use `presentation()` for the live value). For performance: layers make **transform/opacity** animations cheap; set an explicit **`shadowPath`** to avoid per-frame offscreen shadow rendering, and use `shouldRasterize` only for static complex layers.",
    keyPoints: [
      "UIView backed by CALayer: view = events/layout, layer = draw/animate (GPU)",
      "Visual props (cornerRadius/shadow) are layer properties",
      "cornerRadius needs masksToBounds to clip; masking kills shadow (two-layer fix)",
      "Implicit animations on standalone layers; disabled on UIView-backed (use UIView.animate)",
      "CAAnimation is presentation-only (set model value); shadowPath + transform/opacity for perf",
    ],
    explanation:
      "Senior answers cover the view/layer split, the cornerRadius/masksToBounds/shadow interaction, implicit-animation disabling on view layers, and the presentation-vs-model + shadowPath performance points.",
  },
];

export default quiz;
