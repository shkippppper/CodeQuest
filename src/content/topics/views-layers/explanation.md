## The problem: what actually draws a view?

A `UIView` handles touches, layout, and the responder chain — but it doesn't draw itself. Behind **every** `UIView` sits a **`CALayer`** (Core Animation layer) that owns the view's visual content and does the actual rendering and animation on the GPU. Knowing the view↔layer split explains where properties like `cornerRadius` and `shadow` live, and why Core Animation is so cheap.

## The view/layer relationship

Each `UIView` has a backing layer at **`view.layer`**. The division of labor:

- **`UIView`** — event handling, gesture/touch, Auto Layout, the responder chain.
- **`CALayer`** — visual content, geometry, and **animation**. It renders the view's bitmap and composites it.

The view is essentially a thin, interactive wrapper around its layer. Many "view" visual properties are really layer properties surfaced (or set directly on the layer):

```swift
view.layer.cornerRadius = 12
view.layer.borderWidth = 1
view.layer.shadowOpacity = 0.3
view.layer.masksToBounds = true   // clip subviews/content to the rounded bounds
```

## `CALayer` properties

Layers expose geometry and appearance: `frame`/`bounds`/`position`, `cornerRadius`, `borderWidth`/`borderColor`, `shadow*` (`shadowColor`/`shadowOffset`/`shadowRadius`/`shadowOpacity`), `masksToBounds`, `contents` (a bitmap), plus specialized subclasses (`CAGradientLayer`, `CAShapeLayer`, `CAReplicatorLayer`, `CAEmitterLayer`). A subtle gotcha: **`cornerRadius` alone doesn't clip content** unless you also set `masksToBounds = true` — but `masksToBounds` clipping can **disable the layer's shadow** (shadow is drawn outside bounds). The common fix is a two-layer setup (one for the shadow, an inner one that masks).

## Implicit animations

Core Animation's signature feature: changing an **animatable layer property** on a **standalone** layer animates it **automatically** over the default duration — no animation code.

```swift
let layer = CALayer()
layer.opacity = 1
// later, on this standalone layer:
layer.opacity = 0        // implicitly animates (fades) by default
```

These automatic animations are called **implicit animations** (driven by the layer's default "actions"). Important nuance: **layers backing a `UIView` have implicit animations disabled** — inside a `UIView`, you animate via `UIView.animate`, and direct layer-property changes don't implicitly animate. Implicit animation applies to *standalone* CALayers you add yourself.

## `CABasicAnimation` & keyframes

For **explicit** control, add animation objects to a layer:

- **`CABasicAnimation`** — animate one `keyPath` from a `fromValue` to a `toValue`.
- **`CAKeyframeAnimation`** — animate through multiple `values`/`keyTimes` (or along a `path`).
- **`CAAnimationGroup`** — run several together.

```swift
let anim = CABasicAnimation(keyPath: "transform.rotation.z")
anim.fromValue = 0
anim.toValue = CGFloat.pi * 2
anim.duration = 1
anim.repeatCount = .infinity
layer.add(anim, forKey: "spin")
```

Gotcha: `CAAnimation` is **presentation-only** — it animates the layer's *appearance* but doesn't change the **model** value. When it ends, the layer snaps back to its actual property unless you also set the underlying property (or use `fillMode`/`isRemovedOnCompletion`). Read `layer.presentation()` for the mid-flight value (e.g. for hit-testing during animation).

## Layer-backed performance

Because layers composite on the **GPU**, animating layer properties (opacity, transform, position) is cheap. Performance pitfalls:

- **Offscreen rendering** — `cornerRadius + masksToBounds`, `shadowPath`-less shadows, and masks can force expensive offscreen passes. Set an explicit **`shadowPath`** to avoid the renderer computing the shadow shape each frame.
- **`shouldRasterize`** caches a layer as a bitmap (good for static complex layers, bad if it changes often — it re-rasterizes).
- Prefer animating **transform/opacity** (GPU-composited) over properties that trigger re-layout or redraw.

## The interview lens

Lead with the split: **every `UIView` is backed by a `CALayer`** — the **view** handles events/layout/responder duties, the **layer** does the drawing and animation (on the GPU). That's why visual properties like `cornerRadius`, `borderWidth`, and `shadow*` live on `layer`.

Senior specifics: **`cornerRadius` needs `masksToBounds` to clip**, but masking can kill the **shadow** (two-layer fix); **implicit animations** auto-animate standalone `CALayer` property changes but are **disabled on UIView-backed layers** (use `UIView.animate` there); `CABasicAnimation`/`CAKeyframeAnimation` give explicit control but are **presentation-only** (set the model value or the layer snaps back, and use `presentation()` for the live value); and for performance, set an explicit **`shadowPath`** and prefer animating **transform/opacity** to avoid offscreen rendering.
