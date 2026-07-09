## The problem: rounding a corner needs a `.layer`

Try to round a view's corners:

```swift
let card = UIView()
card.layer.cornerRadius = 12
```

Notice the `.layer` in the middle. `UIView` itself has no `cornerRadius` property — you have to reach through the view to something called its layer.

That one line of syntax gives away a secret: a `UIView` doesn't actually draw itself. Behind every view sits a second object that owns everything you can see. This lesson is about that object, and about why the split exists.

## Two objects, one picture

Every `UIView` you create secretly creates a partner object:

```swift
let view = UIView()
view.layer          // a CALayer — created automatically, always there
```

That partner is a **CALayer** — a Core Animation layer, the object that holds the view's visual content and hands it to the GPU for drawing. The view and its layer are born together and live together; the layer at `view.layer` is called the view's *backing layer*.

The two objects split the work cleanly:

```swift
view.addGestureRecognizer(tap)     // UIView's job: touches and gestures
view.translatesAutoresizingMaskIntoConstraints = false  // UIView's job: layout
view.layer.borderWidth = 1         // CALayer's job: what you see
```

`UIView` handles the *interactive* side: touch events, gestures, Auto Layout, and passing unhandled events up the responder chain. `CALayer` handles the *visual* side: geometry, appearance, and animation. The view is essentially a thin, touchable wrapper around its layer.

This split is why "view" properties like corner radius, borders, and shadows live at `view.layer.something` — they're appearance, so they belong to the layer.

## The layer's toolbox

Here are the layer properties you'll set most often:

```swift
view.layer.cornerRadius = 12       // round the corners
view.layer.borderWidth = 1         // draw an outline
view.layer.borderColor = UIColor.gray.cgColor
```

Shadows are four properties working together:

```swift
view.layer.shadowColor = UIColor.black.cgColor
view.layer.shadowOpacity = 0.3     // 0 = invisible; you must set this or no shadow
view.layer.shadowOffset = CGSize(width: 0, height: 2)
view.layer.shadowRadius = 4        // how blurry the shadow edge is
```

Layers also have their own geometry — `frame`, `bounds`, and `position` — mirroring the view's, plus a `contents` property that holds the actual bitmap being displayed.

Beyond the plain `CALayer`, Core Animation ships specialized subclasses: `CAGradientLayer` draws gradients, `CAShapeLayer` draws vector paths, `CAReplicatorLayer` stamps out repeated copies of a sublayer, and `CAEmitterLayer` runs particle effects. You add these as sublayers when a plain bitmap isn't enough.

### The clipping trap

Time to predict. You round the corners of an image view:

```swift
imageView.layer.cornerRadius = 20
```

Does the photo inside get rounded corners?

Answer: no. The photo still fills the square. `cornerRadius` on its own only rounds the layer's *background and border* — it does not clip the content inside. To actually cut the content to the rounded shape, add:

```swift
imageView.layer.masksToBounds = true   // now the photo is clipped to the corners
```

`masksToBounds` means "throw away anything drawn outside my bounds" — sublayers and content included.

### Clipping kills the shadow

Now combine the two features you just learned:

```swift
card.layer.cornerRadius = 20
card.layer.masksToBounds = true    // clip the content
card.layer.shadowOpacity = 0.3     // ...and the shadow vanishes
```

The shadow disappears. A shadow is drawn *outside* the layer's bounds — and `masksToBounds` just told the layer to discard everything outside its bounds. The clip eats the shadow.

The standard fix is two layers doing one job each:

```swift
let shadowView = UIView()              // outer: shadow, no clipping
shadowView.layer.shadowOpacity = 0.3

let contentView = UIView()             // inner: rounded + clipped
contentView.layer.cornerRadius = 20
contentView.layer.masksToBounds = true
shadowView.addSubview(contentView)
```

The outer view wears the shadow and never clips; the inner view clips its content to the rounded shape. This "shadow view wrapping a clipped view" pattern shows up in almost every card-style UI.

## Animations you never wrote

Create a layer by itself — not through a view — and change a property:

```swift
let dot = CALayer()                // a standalone layer, no UIView involved
view.layer.addSublayer(dot)
dot.opacity = 1
// later:
dot.opacity = 0
```

The dot doesn't blink out. It *fades* out, over a default quarter-second — even though you wrote zero animation code. Core Animation noticed an animatable property change and animated it for you.

These free animations are called **implicit animations**: change an animatable property on a layer, get a smooth transition automatically. Under the hood, the layer looks up a default "action" for the property and runs it.

Now the nuance interviewers fish for. Try the same thing on a view's backing layer:

```swift
myView.layer.opacity = 0   // no fade — jumps instantly
```

Nothing animates. UIKit *disables* implicit animations on layers that back a `UIView`. If it didn't, every frame change during layout would smear across the screen. Inside UIKit you opt in to animation explicitly instead:

```swift
UIView.animate(withDuration: 0.25) {
    myView.alpha = 0       // this is how view properties animate
}
```

So the rule is: standalone layers animate implicitly; view-backed layers don't, and you use `UIView.animate` there.

## Telling the layer exactly how to animate

When you need control — duration, timing, repetition — you build an animation object and attach it to the layer:

```swift
let anim = CABasicAnimation(keyPath: "transform.rotation.z")
anim.fromValue = 0
anim.toValue = CGFloat.pi * 2      // one full turn
anim.duration = 1
```

`CABasicAnimation` animates a single property, named by a string key path, from one value to another. Attach it and it starts:

```swift
anim.repeatCount = .infinity
layer.add(anim, forKey: "spin")    // the layer spins forever
```

The `forKey` string is just a handle — you can use it later to remove or replace the animation.

Two siblings extend the same idea. `CAKeyframeAnimation` animates through a whole *list* of values (or along a `CGPath`), with `keyTimes` controlling the pacing. `CAAnimationGroup` bundles several animations to run together as one.

### The snap-back trap

Predict this one. You slide a layer to the right:

```swift
let slide = CABasicAnimation(keyPath: "position.x")
slide.fromValue = 50
slide.toValue = 300
slide.duration = 1
layer.add(slide, forKey: "slide")
```

The layer glides to x = 300. Where is it one second later, when the animation ends?

Answer: back at x = 50. It snaps home the instant the animation finishes.

Here's why. A `CAAnimation` never touches the layer's real property — the value your code reads and writes, called the **model** value. The animation only changes what's painted on screen. When it's removed at the end, the screen falls back to the model value, which never moved.

The clean fix is to set the model value yourself, alongside the animation:

```swift
layer.position.x = 300             // update the truth
layer.add(slide, forKey: "slide")  // animate the appearance to match
```

There's also a workaround you'll see in the wild: `slide.fillMode = .forwards` plus `slide.isRemovedOnCompletion = false` keeps the finished animation attached, freezing the appearance at the end value. It looks right, but the model still says 50 — appearance and truth now disagree, which bites you later. Prefer setting the model value.

While an animation is mid-flight, you can ask the layer what's *actually on screen right now*:

```swift
let live = layer.presentation()   // a snapshot of the animated, on-screen state
live?.position                     // the mid-flight position
```

`presentation()` returns a copy of the layer holding the in-progress animated values. This is how you hit-test a moving object — the model says where the layer *will settle*, but `presentation()` says where the user actually sees it.

## Why layers are fast — and how to keep them fast

Layers are cheap to animate because of *where* the work happens:

```swift
UIView.animate(withDuration: 0.3) {
    card.transform = CGAffineTransform(scaleX: 1.2, y: 1.2)
    card.alpha = 0.8
}
```

Each layer's content is rendered to a bitmap once. After that, the GPU just *composites* — stacks the bitmaps together with their positions, transforms, and opacities — every frame. Moving, scaling, rotating, and fading are all compositing tricks, so the GPU replays them at 60 or 120 frames per second without re-drawing anything.

That's the rule of thumb: prefer animating `transform` and `opacity`. They stay on the GPU's fast path. Animating things that force re-layout or re-drawing does not.

Some effects break the fast path by requiring **offscreen rendering** — the GPU has to render part of the layer tree into a separate, invisible buffer first, then combine it back. Extra passes, every frame. The usual triggers: `cornerRadius` combined with `masksToBounds`, layer masks, and shadows whose shape the renderer must compute.

The shadow case has a one-line fix:

```swift
card.layer.shadowPath = UIBezierPath(
    roundedRect: card.bounds, cornerRadius: 20
).cgPath
```

Without a `shadowPath`, the renderer inspects the layer's actual pixels to figure out the shadow's shape — every frame. Giving it the shape explicitly skips that work entirely. Any time you set a shadow on something that moves or animates, set its `shadowPath`.

One more dial:

```swift
fancyLayer.shouldRasterize = true
fancyLayer.rasterizationScale = UIScreen.main.scale
```

`shouldRasterize` tells Core Animation to render the layer (with all its sublayers and effects) into a cached bitmap once, then reuse that bitmap. For a complex layer that *doesn't change*, that's a big win. For a layer that changes often, it's a loss — every change throws the cache away and re-rasterizes, so you pay the offscreen cost repeatedly.

## Common pitfalls

- **`cornerRadius` with no visible effect on content.** The radius doesn't clip. Add `masksToBounds = true` to actually cut images and sublayers to the rounded shape.
- **Shadow disappears when you clip.** `masksToBounds` discards the shadow, which lives outside the bounds. Use the two-view fix: outer view shadows, inner view clips.
- **Layer snaps back after a `CABasicAnimation`.** The animation was presentation-only. Set the model property alongside the animation instead of leaning on `fillMode`.
- **Hit-testing a moving layer at its destination.** Mid-animation, the model already holds the end value. Use `layer.presentation()` for the on-screen position.
- **Expecting `myView.layer.opacity = 0` to fade.** Implicit animations are disabled on view-backing layers. Use `UIView.animate` for views; implicit animation only applies to standalone layers.
- **Animated shadows with no `shadowPath`.** The renderer recomputes the shadow shape each frame. Set an explicit `shadowPath`.

## Interview lens

If asked "what's the relationship between `UIView` and `CALayer`?", lead with the split: every view is backed by a layer; the view owns events, gestures, and layout, while the layer owns visual content and animation, composited on the GPU. Then point out the evidence — `cornerRadius`, `borderWidth`, and the shadow properties all live on `layer`, not the view.

The classic follow-up is the corner/shadow trap: say that `cornerRadius` alone doesn't clip content until `masksToBounds` is set, and that `masksToBounds` then kills the shadow because shadows draw outside the bounds — so the production fix is two layers, an outer one for the shadow and an inner one that clips. Knowing that pattern cold reads as real-world experience.

If they probe animation, hit two nuances. First: implicit animations fire on standalone layers but are disabled on view-backing layers, which is why UIKit code uses `UIView.animate`. Second: `CAAnimation` objects are presentation-only — the layer snaps back to its model value when the animation ends unless you update the model too, and `presentation()` is how you read the live mid-flight value.

For performance questions, the strong answer is: animate `transform` and `opacity` because they're pure GPU compositing; avoid offscreen rendering triggers like mask-based clipping and pathless shadows; set an explicit `shadowPath`; and use `shouldRasterize` only for complex layers that don't change.
