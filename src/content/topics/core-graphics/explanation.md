## The problem: when no view gives you the shape you need

You need a custom pie-slice gauge, a signature pad, or a chart with hand-drawn axes. You reach for the usual toolbox and come up empty:

```swift
// No stack of UIViews or SwiftUI Shapes produces this exact drawing.
```

Stacking views and rounding corners only gets you so far. Sometimes you have to paint the pixels yourself, line by line and curve by curve. The tool for that is **Core Graphics** — a low-level 2D drawing engine (also called Quartz 2D). This lesson is about drawing with it and, just as importantly, when to leave it alone.

## Where drawing happens: the context

In UIKit you draw by overriding one method on a `UIView` subclass:

```swift
override func draw(_ rect: CGRect) {
    // draw here
}
```

The system calls `draw(_:)` when the view needs to render, and hands you a ready-to-use canvas called a **graphics context** — an object holding both the surface you paint onto and the current drawing state (color, line width, transforms). You grab it with `UIGraphicsGetCurrentContext()`, though the higher-level UIKit drawing calls use it implicitly.

You never call `draw(_:)` yourself. When the content changes, you tell the view it's stale:

```swift
setNeedsDisplay()   // asks the system to call draw(_:) again, later
```

The system then re-invokes `draw(_:)` on the next cycle. That indirection matters for performance, as we'll see.

## Paths: a shape is a recipe first

You don't draw a triangle directly — you first describe it as a **path**, a recipe of lines and curves. `UIBezierPath` is the friendly way:

```swift
let path = UIBezierPath()
path.move(to: CGPoint(x: 0, y: 0))     // pen down here
path.addLine(to: CGPoint(x: 100, y: 0))
path.addLine(to: CGPoint(x: 50, y: 80))
path.close()                            // back to the start
```

Nothing is on screen yet. A path is pure geometry — a description of where the lines go, not any actual pixels. `move`, `addLine`, `addArc`, and `close` build up the recipe. (Under the hood this wraps `CGPath`/`CGMutablePath`, the raw Core Graphics types.)

## Turning a path into pixels: fill and stroke

Now you render the path two ways. **Fill** paints the interior; **stroke** paints the outline:

```swift
UIColor.systemBlue.setFill()
path.fill()                 // solid blue triangle

UIColor.black.setStroke()
path.lineWidth = 2
path.stroke()               // 2pt black outline
```

Set the color into the context first, then fill or stroke — the color is part of the context's *current state*, not an argument to `fill()`. Line width, caps (line ends), and joins (corners) are set the same way before stroking.

For a gradient you drop to Core Graphics directly with a `CGGradient`, drawing it into the context between two points — useful for that gauge's shaded fill.

## The flipped-coordinate gotcha

Predict this: you drop into raw Core Graphics and draw a rectangle at `y = 0`, expecting it at the top of the view. Where does it land?

Answer: the **bottom**. Here's why. UIKit's coordinate system has its origin at the **top-left**, with y increasing **downward** — the way you'd expect on screen. But Core Graphics' native coordinate system has its origin at the **bottom-left**, with y increasing **upward**, like a math graph.

```swift
// In UIKit's draw(_:), UIKit-level calls (UIBezierPath, UIColor) already
// account for this. Drop to raw CGContext primitives and y is flipped.
```

When you use `UIBezierPath` and `UIColor` inside `draw(_:)`, UIKit has already flipped the context for you, so top-left works as expected. The moment you call raw `CGContext` functions, the flip bites. This mismatch is the single most common Core Graphics bug.

## Transforms and saving state

You can move, scale, and rotate everything you draw with a **transform** — a rule that shifts coordinates before they're painted:

```swift
context.translateBy(x: 50, y: 50)   // shift origin
context.rotate(by: .pi / 4)          // rotate 45°
context.scaleBy(x: 2, y: 2)          // double size
```

These stack up and affect *all* subsequent drawing. So when you want a transform to apply to just one shape, you bracket it:

```swift
context.saveGState()      // push a copy of the current state
context.rotate(by: .pi / 4)
path.fill()
context.restoreGState()   // pop back — rotation undone for later drawing
```

`saveGState` snapshots the context's state (transform, colors, clip); `restoreGState` pops back to it. Forgetting to restore is why "one rotated shape" accidentally rotates the rest of your drawing.

## Drawing into an image, off-screen

Sometimes you don't want to draw in a live view at all — you want to render once into a reusable image (say, to cache an expensive drawing). `UIGraphicsImageRenderer` gives you an off-screen context:

```swift
let renderer = UIGraphicsImageRenderer(size: CGSize(width: 100, height: 100))
let image = renderer.image { ctx in
    UIColor.systemBlue.setFill()
    ctx.fill(CGRect(x: 0, y: 0, width: 100, height: 100))
}
```

You get a `UIImage` you can show in an `UIImageView` and reuse. `UIGraphicsImageRenderer` is the modern API — it replaced the older, more error-prone `UIGraphicsBeginImageContext` and handles color space and scale correctly.

## Why to think twice before drawing by hand

`draw(_:)` runs on the **main thread**, and it re-runs every time the view is invalidated with `setNeedsDisplay()`. Heavy custom drawing there directly competes with everything else the main thread must do to keep scrolling smooth — so it can cause dropped frames.

The guidance:

- Prefer composing regular views and layers when they can express the design. Layer-backed rendering (see the views-and-layers lesson) is often GPU-accelerated and cheaper. Also see the rendering-performance lesson for the frame budget.
- If you must draw, **cache** the result — render once into a `UIImage` with `UIGraphicsImageRenderer` instead of redrawing every frame.
- Redraw the smallest region you can, not the whole view for a tiny change.

## The modern option: SwiftUI's Canvas

SwiftUI offers the same immediate-mode, draw-it-yourself power without a `UIView` subclass, via `Canvas` and `Path`:

```swift
Canvas { context, size in
    var path = Path()
    path.move(to: .zero)
    path.addLine(to: CGPoint(x: size.width, y: size.height))
    context.stroke(path, with: .color(.blue), lineWidth: 2)
}
```

Same mental model — build a path, fill or stroke it into a context — but in SwiftUI and with its top-left coordinate convention. Reach for `Canvas` when a design needs custom drawing inside a SwiftUI app.

## Common pitfalls

- **The flipped y-axis.** Raw `CGContext` uses a bottom-left origin; `y = 0` lands at the bottom. UIKit-level calls in `draw(_:)` are already flipped for you — mixing the two is the classic bug.
- **Forgetting `restoreGState`.** A transform or clip you set leaks into all later drawing; bracket per-shape changes with `saveGState`/`restoreGState`.
- **Redrawing everything, every frame.** `draw(_:)` is main-thread work; cache expensive drawings into an image and invalidate only the region that changed.
- **Calling `draw(_:)` directly.** You don't — call `setNeedsDisplay()` and let the system schedule the redraw.

## Interview lens

If asked when you'd drop to Core Graphics, say: only when no arrangement of views, layers, or SwiftUI shapes gives you the result — a custom chart, gauge, or signature pad. Lead with the model: override `draw(_:)`, get a graphics **context**, build a **path**, then **fill** or **stroke** it. Naming "path is a recipe, fill/stroke renders it" shows you understand the two steps.

The gotcha interviewers love is the coordinate flip — Core Graphics' native origin is bottom-left with y up, unlike UIKit's top-left with y down — and that UIKit's `draw(_:)` pre-flips the context so `UIBezierPath` behaves as expected. Mentioning it signals hands-on experience.

Close on performance, because it's what separates a senior answer: `draw(_:)` is main-thread and re-runs on every `setNeedsDisplay()`, so heavy drawing drops frames. You'd prefer composing layers where possible, cache expensive drawings into a `UIImage` via `UIGraphicsImageRenderer`, and redraw the minimum region — and note that SwiftUI's `Canvas` offers the same drawing model in modern code.
