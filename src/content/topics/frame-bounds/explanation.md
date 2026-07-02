## The problem: "why is my frame wrong after rotating the view?"

`frame` and `bounds` look interchangeable — both are `CGRect`s describing a view's rectangle — until you scroll, rotate, or transform something and they diverge. The confusion comes from not knowing **which coordinate system each one lives in**. Once that clicks, a whole class of positioning bugs disappears.

## Coordinate systems

Every view has its own coordinate space. The key question for any rectangle is: **whose coordinate system is it expressed in?**

- **`frame`** is expressed in the **superview's** coordinate system — where this view sits *inside its parent*.
- **`bounds`** is expressed in the view's **own** coordinate system — the view's internal rectangle, independent of where it's placed.

That single distinction explains everything else.

## `frame`

`frame` = the view's position and size **within its superview**. Its `origin` is the top-left corner relative to the parent; its `size` is the view's width/height in the parent's space.

```swift
childView.frame = CGRect(x: 20, y: 40, width: 100, height: 50)
// child sits 20pt from parent's left, 40pt from parent's top
```

Setting `frame` moves and sizes the view inside its parent. Use it for simple, manual placement (when not using Auto Layout).

## `bounds`

`bounds` = the view's own rectangle in its **own** coordinates. By default `bounds.origin` is `(0, 0)` and its size equals the frame's size. Because it's the view's internal space, its **origin is what changes when the view "scrolls" its content** — a `UIScrollView` scrolls by moving its `bounds.origin`, which shifts what part of its content is visible without moving the scroll view itself in its parent.

```swift
view.bounds.origin = CGPoint(x: 0, y: 100)
// content shifts up 100pt; the view stays put in its superview
```

Subview frames are laid out relative to their superview's **bounds** (not frame) — which is why changing a superview's bounds origin repositions its children.

## `center` & transforms

- **`center`** is the midpoint of the view **in its superview's coordinates** (like `frame`, it's a superview-space value). Moving a view is often cleaner via `center` than recomputing `frame.origin`.
- **`transform`** (rotation/scale) is where frame and bounds truly split. Applying a `transform` (e.g. a 45° rotation) leaves **`bounds` unchanged** (the view's internal rect is still the same width/height) and **`center` unchanged**, but the **`frame` becomes the bounding box** of the transformed view in the superview — so a rotated square's `frame` is a larger axis-aligned rectangle that encloses it.

```swift
view.transform = CGAffineTransform(rotationAngle: .pi / 4)
// bounds: same size · center: same · frame: the enclosing (larger) rect
```

**Rule:** when a non-identity `transform` is applied, **don't trust or set `frame`** — use `bounds` (for size) and `center` (for position). Setting `frame` under a transform gives undefined/confusing results.

## When each changes

- Move the view within its parent → `frame.origin` and `center` change; `bounds` unchanged.
- Resize the view → both `frame.size` and `bounds.size` change.
- Scroll content (scroll view) → `bounds.origin` changes; `frame` unchanged.
- Apply a rotation/scale `transform` → `bounds`/`center` stay; `frame` becomes the enclosing box.

## The interview lens

The one-liner: **`frame` is in the superview's coordinate system (where the view is placed); `bounds` is in the view's own coordinate system (its internal rect).** From that, derive the rest: a scroll view scrolls by changing its **`bounds.origin`** (content moves, the view doesn't); subviews are positioned relative to their superview's **bounds**.

The senior gotcha is **transforms**: applying a rotation/scale leaves **`bounds` and `center` unchanged** but makes **`frame` the axis-aligned bounding box** of the transformed view — so **once a transform is set, you should manipulate `bounds`/`center`, not `frame`.** Being able to say "a rotated square's `frame` is bigger than its `bounds`" is the tell that you actually understand the two.
