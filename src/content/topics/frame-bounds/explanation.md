## The problem: two rectangles that look like one

Print a view's two rectangles:

```swift
let box = UIView(frame: CGRect(x: 20, y: 40, width: 100, height: 50))
print(box.frame)    // (20, 40, 100, 50)
print(box.bounds)   // (0, 0, 100, 50)
```

Same size, different origin — and it's tempting to conclude "`bounds` is just `frame` with a zeroed origin". Plenty of working code is written on that assumption.

Then you rotate a view, or scroll one, and the two rectangles stop agreeing entirely. Code that reads the wrong one starts placing things in the wrong spots. This lesson is about the one question that untangles them for good.

## The one question: whose coordinates?

Every view owns a coordinate system of its own — a grid whose (0, 0) is the view's *own* top-left corner. So whenever you see a rectangle, ask: *whose grid is this measured on?*

The two properties are the two possible answers:

```swift
box.frame    // measured on the SUPERVIEW's grid — where the box sits in its parent
box.bounds   // measured on the box's OWN grid — its internal rectangle
```

`frame` answers "where is this view inside its parent?" `bounds` answers "what does this view's own space look like?" That single distinction generates everything else in this lesson.

## frame: the view as its parent sees it

Place a view inside its parent:

```swift
childView.frame = CGRect(x: 20, y: 40, width: 100, height: 50)
// 20pt from the parent's left edge, 40pt from the parent's top
```

The `origin` is the child's top-left corner measured from the *parent's* top-left corner. The `size` is the child's width and height as they appear in the parent's space. Setting `frame` is how you manually position and size a view when you're not using Auto Layout.

## bounds: the view's own world

Now the same view, from the inside:

```swift
childView.bounds   // (0, 0, 100, 50)
```

By default the origin is (0, 0) — the view's own grid starts at its own corner — and the size matches the frame's size. So far, so redundant.

The interesting part: `bounds.origin` is settable. Predict what this does:

```swift
bigView.bounds.origin = CGPoint(x: 0, y: 100)
```

Does `bigView` move inside its parent?

Answer: no. `bigView` doesn't move a single point — its *content* does. Everything inside the view shifts up by 100 points, as if you slid the view's internal grid underneath its window.

Here's why. Subviews are positioned relative to their superview's *bounds* — not its frame. A subview at frame origin (0, 130) sits at the point the parent's own grid calls (0, 130). Shift the parent's grid by setting `bounds.origin` to (0, 100), and the point labeled (0, 130) is now higher up in the visible window — so the subview appears to move, without any of its own numbers changing.

If "slide the content window without moving the view" sounds familiar — that's scrolling. A `UIScrollView` is exactly this mechanism with gestures attached:

```swift
scrollView.contentOffset = CGPoint(x: 0, y: 250)
// literally the same as:
scrollView.bounds.origin = CGPoint(x: 0, y: 250)
```

The scroll view never moves in its parent while you scroll. Its `frame` is untouched; only its `bounds.origin` glides across the content. That's the canonical interview answer for "how does a scroll view actually scroll?"

## center: a handle for moving things

There's a third position property:

```swift
box.center   // (70, 65) — the midpoint, in the SUPERVIEW's coordinates
```

`center` is the view's midpoint measured on the parent's grid — same coordinate space as `frame`, just tracking the middle instead of a corner. Moving a view is often cleaner through `center` than recomputing a `frame.origin`:

```swift
box.center = CGPoint(x: 200, y: 300)   // move; size untouched
```

It looks like a convenience. The next section is where `center` becomes essential.

## Transforms: where frame and bounds finally split

Rotate a square view by 45 degrees:

```swift
square.bounds   // (0, 0, 100, 100)
square.transform = CGAffineTransform(rotationAngle: .pi / 4)
```

Predict all three values now: `bounds`, `center`, `frame`.

Answer:

```swift
square.bounds   // (0, 0, 100, 100) — unchanged
square.center   // unchanged — it rotated around its middle
square.frame    // ≈ (−20.7, −20.7, 141.4, 141.4) relative to where it was — BIGGER
```

`bounds` didn't move: internally, the view is still the same 100×100 rectangle — rotation doesn't change what the view *is*, only how it's displayed. `center` didn't move: the view spun in place around its midpoint.

But `frame` grew. A frame is always an axis-aligned rectangle — its edges run parallel to the parent's edges, no tilting allowed. A tilted square can't be described by such a rectangle, so `frame` reports the closest thing it can: the smallest upright rectangle that fully *encloses* the tilted square. A rotated 100×100 square needs a 141×141 box around it. The `frame` is now a bounding box, not the view's true shape.

This leads to the rule that separates people who know this topic from people who've memorized it: once a view has a non-identity `transform`, stop using `frame` entirely. Reading it gives you the bounding box, not the view. *Setting* it is documented as undefined behavior. Under a transform, the honest properties are:

```swift
square.bounds.size = CGSize(width: 120, height: 120)  // resize: use bounds
square.center = CGPoint(x: 250, y: 400)               // reposition: use center
```

`bounds` for size, `center` for position — those two stay truthful no matter what the transform does.

## The cheat sheet: what changes when

Every scenario in this lesson, reduced to one table:

| You do this | `frame` | `bounds` | `center` |
|---|---|---|---|
| Move the view in its parent | origin changes | unchanged | changes |
| Resize the view | size changes | size changes | may change |
| Scroll (scroll view) | unchanged | origin changes | unchanged |
| Rotate/scale via `transform` | becomes enclosing box | unchanged | unchanged |

Notice the symmetry: moving is a frame-side event, scrolling is a bounds-side event, resizing touches both sizes, and transforming breaks `frame` while leaving the other two honest.

## Common pitfalls

- **Treating `bounds` as "frame with a zero origin".** True only until something scrolls or transforms. The real definition is coordinate-system-based, and it's the only one that survives contact with a scroll view.
- **Reading `frame.size` on a transformed view.** You get the bounding box, which is larger than the view. Use `bounds.size`.
- **Setting `frame` on a transformed view.** Undefined behavior. Set `bounds` and `center` instead.
- **Doing subview math against the parent's `frame`.** Subviews live in the parent's *bounds* coordinates. The distinction matters the moment `bounds.origin` isn't (0, 0) — i.e. inside anything scrollable.
- **Expecting a scroll view's `frame` to change while scrolling.** It never does; only `bounds.origin` moves. If you observe `frame` for scroll position, you'll observe nothing.

## Interview lens

If asked "what's the difference between frame and bounds?", give the coordinate-system answer, not the origin answer: frame is the view's rectangle in its *superview's* coordinate system — where it's placed — while bounds is the rectangle in the view's *own* coordinate system — its internal space. Then derive one consequence to show it's understood, not memorized: a scroll view scrolls by changing its `bounds.origin`, which slides the content while the view itself never moves, and that works because subviews are positioned relative to their superview's bounds.

The senior gotcha is transforms. Say it precisely: applying a rotation or scale leaves `bounds` and `center` unchanged, but `frame` becomes the axis-aligned bounding box of the transformed view — so a rotated square's frame is *bigger* than its bounds. Then give the rule: once a transform is set, don't read or write `frame`; manipulate `bounds` for size and `center` for position. The sentence "a rotated square's frame is larger than its bounds" is the tell interviewers listen for.
