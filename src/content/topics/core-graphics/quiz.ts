import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "cg-context-what",
    type: "mcq",
    prompt: "In a UIView's `draw(_:)`, what is the graphics context the system hands you?",
    options: [
      "The canvas you paint onto plus the current drawing state — color, line width, and transforms",
      "A background queue dedicated to rendering so that all of your drawing work runs safely off the main thread",
      "A cached bitmap of the previous frame that you diff against to compute only the pixels that actually changed",
      "A read-only description of the view hierarchy that reports where every subview and layer is currently positioned",
    ],
    answer: 0,
    explanation:
      "A graphics context is both the surface you draw into and the current state (color, line width, transform). You get it via `UIGraphicsGetCurrentContext()`, and UIKit's drawing calls use it implicitly.",
  },
  {
    id: "cg-path-is-recipe",
    type: "mcq",
    prompt: "What does building a `UIBezierPath` with move/addLine/close actually do?",
    options: [
      "It describes a shape as geometry — a recipe of lines and curves — without drawing any pixels yet",
      "It immediately paints the outlined shape into the current context using the view's default tint color",
      "It allocates a dedicated offscreen bitmap the exact size of the shape and rasterizes the outline into it",
      "It registers the shape with the layer tree so Core Animation can interpolate it during implicit animations",
    ],
    answer: 0,
    explanation:
      "A path is pure geometry — a description of where the lines go. Nothing is drawn until you `fill()` (paint the interior) or `stroke()` (paint the outline).",
  },
  {
    id: "cg-fill-vs-stroke-fill",
    type: "fill",
    prompt: "`path.fill()` paints a path's interior; `path.___()` paints only its outline.",
    answers: ["stroke"],
    hint: "The outline-drawing counterpart to fill.",
    explanation:
      "Fill paints the interior, stroke paints the outline. You set the color into the context first (`setFill`/`setStroke`) because color is part of the context's current state.",
  },
  {
    id: "cg-flipped-y-predict",
    type: "predict",
    prompt: "You drop into raw CGContext primitives and draw a rectangle at y = 0, expecting it at the top. Where does it appear?",
    code: `// Raw CGContext drawing, NOT going through UIBezierPath/UIColor\nlet r = CGRect(x: 0, y: 0, width: 50, height: 20)\ncontext.fill(r)`,
    options: [
      "At the bottom — Core Graphics' native origin is bottom-left with y increasing upward",
      "At the top-left, because every graphics context in iOS uses UIKit's top-left origin convention",
      "Centered vertically, since a y of 0 is interpreted as the drawable area's vertical midpoint",
      "Nowhere visible, because a y of 0 places the rectangle entirely outside the context's clip region",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Core Graphics' native coordinate system has a bottom-left origin with y up (like a math graph). UIKit's `draw(_:)` pre-flips the context so `UIBezierPath` behaves top-left — but raw `CGContext` calls hit the flip. It's the classic Core Graphics bug.",
  },
  {
    id: "cg-savestate-senior",
    type: "predict",
    prompt: "You rotate the context to draw one shape at an angle, then draw a second shape. Without any state management, what happens to the second shape?",
    code: `context.rotate(by: .pi / 4)\nfirstPath.fill()\nsecondPath.fill()   // no save/restore anywhere`,
    options: [
      "It's rotated too — the transform stays in the context state and affects all later drawing",
      "It draws unrotated, because a context transform only ever applies to the single next drawing call",
      "It fails to draw at all, since the context refuses further operations after a transform is applied",
      "It draws rotated by twice the angle, because each successive fill re-applies the pending rotation again",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A transform mutates the context's current state and affects everything drawn afterward. Bracket per-shape changes with `saveGState()` / `restoreGState()` so the rotation is undone before the next shape.",
  },
  {
    id: "cg-setneedsdisplay",
    type: "mcq",
    prompt: "How do you get a custom view to redraw when its content changes?",
    options: [
      "Call `setNeedsDisplay()`, which asks the system to invoke `draw(_:)` again on the next cycle",
      "Call `draw(_:)` directly yourself, passing in the current bounds so the view repaints immediately inline",
      "Reassign the view's `layer.contents` to nil, which forces Core Animation to rebuild the drawing synchronously",
      "Remove the view from its superview and add it back, so the system treats it as a brand-new view to render",
    ],
    answer: 0,
    explanation:
      "You never call `draw(_:)` yourself. `setNeedsDisplay()` marks the view stale, and the system schedules the redraw on the next cycle — that indirection is what lets it batch and optimize.",
  },
  {
    id: "cg-image-renderer",
    type: "mcq",
    prompt: "What is `UIGraphicsImageRenderer` used for?",
    options: [
      "Drawing once into an off-screen context to produce a reusable UIImage, e.g. to cache expensive drawing",
      "Streaming a view's live drawing to an external display without going through the normal window server",
      "Converting a UIImage back into an editable vector path you can then reshape point by point at runtime",
      "Rendering a view's existing drawing on a background GPU thread so that `draw(_:)` no longer has to run on the main thread at all",
    ],
    answer: 0,
    explanation:
      "`UIGraphicsImageRenderer` gives you an off-screen context; you draw into it and get a `UIImage` to reuse. It's the modern replacement for `UIGraphicsBeginImageContext`, handling scale and color space correctly.",
  },
  {
    id: "cg-perf-multi",
    type: "multi",
    prompt: "Select **all** true statements about custom `draw(_:)` performance.",
    options: [
      "`draw(_:)` runs on the main thread",
      "It re-runs every time the view is invalidated with `setNeedsDisplay()`",
      "Caching an expensive drawing into a UIImage avoids redrawing it every frame",
      "Heavy drawing in `draw(_:)` is free because the GPU handles it entirely off the main thread",
    ],
    answers: [0, 1, 2],
    explanation:
      "`draw(_:)` is main-thread work re-run on each invalidation, so caching into an image helps. It is NOT free GPU work — heavy drawing competes with everything else on the main thread and can drop frames (option 4 is false).",
  },
  {
    id: "cg-canvas-senior",
    type: "mcq",
    prompt: "How does SwiftUI's `Canvas` relate to Core Graphics drawing?",
    options: [
      "It offers the same immediate-mode model — build a Path, fill/stroke it into a context — without a UIView subclass",
      "It renders arbitrary UIKit `draw(_:)` output directly, acting purely as a thin passthrough wrapper around CGContext",
      "It is a declarative shape library only, with no per-pixel context drawing available anywhere in its API surface",
      "It runs all of its drawing work on a dedicated background actor, which is why it never blocks the SwiftUI main thread",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Canvas` gives SwiftUI the same draw-it-yourself model — a `Path` built and then filled/stroked into a context — but without subclassing `UIView`, and using SwiftUI's top-left coordinate convention.",
  },
  {
    id: "core-graphics-flashcard",
    type: "flashcard",
    prompt:
      "Explain custom drawing with Core Graphics: the context, paths, fill/stroke, the coordinate flip, state, image rendering, performance, and Canvas. Answer aloud, then reveal.",
    modelAnswer:
      "**Core Graphics** (Quartz 2D) is a low-level 2D drawing engine you reach for only when no arrangement of views, layers, or SwiftUI shapes gives the result — a custom chart, gauge, or signature pad. In UIKit you override **`draw(_ rect:)`** on a `UIView`; the system hands you a **graphics context** — the surface plus current state (color, line width, transform). You describe a shape as a **path** (`UIBezierPath` — a recipe of `move`/`addLine`/`addArc`/`close`, no pixels yet), then render it: **`fill()`** paints the interior, **`stroke()`** the outline, with the color set into the context first. The classic gotcha is the **coordinate flip**: Core Graphics' native origin is **bottom-left, y up**, unlike UIKit's **top-left, y down** — UIKit's `draw(_:)` pre-flips the context so `UIBezierPath` works top-left, but raw `CGContext` calls hit the flip. **Transforms** (`translateBy`/`rotate`/`scaleBy`) mutate the context state and affect all later drawing, so bracket per-shape changes with **`saveGState()`/`restoreGState()`**. To render off-screen (to cache expensive drawing) use **`UIGraphicsImageRenderer`** → a reusable `UIImage` (it replaced `UIGraphicsBeginImageContext`). **Performance**: `draw(_:)` runs on the **main thread** and re-runs on every **`setNeedsDisplay()`**, so heavy drawing drops frames — prefer composing layers, cache into an image, and redraw the minimum region. Modern equivalent: SwiftUI's **`Canvas`** offers the same path/fill/stroke model without a UIView subclass.",
    keyPoints: [
      "Override draw(_:); system gives a context (surface + state)",
      "Path = geometry recipe; fill() interior, stroke() outline",
      "Coordinate flip: CG native is bottom-left y-up; UIKit pre-flips draw(_:)",
      "Transforms mutate state → bracket with saveGState/restoreGState",
      "UIGraphicsImageRenderer renders off-screen into a reusable UIImage",
      "draw(_:) is main-thread + re-runs on setNeedsDisplay → cache, minimize, prefer layers",
      "SwiftUI Canvas = same model without a UIView subclass",
    ],
    explanation:
      "A senior answer states the context/path/fill-stroke model, nails the bottom-left coordinate flip and that UIKit pre-flips draw(_:), covers save/restore for transforms, and closes on the main-thread performance cost with caching and Canvas as the modern option.",
  },
];

export default quiz;
