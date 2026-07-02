## The problem: animating state changes, not frames

In UIKit you animate by describing keyframes over time (`UIView.animate`). SwiftUI flips it: you **change state**, and SwiftUI **animates the difference** between the old and new rendered views automatically. You don't animate properties frame by frame — you tell SwiftUI *which state changes* should be animated and *with what curve*, and it interpolates.

## Implicit vs explicit animations

Two ways to trigger animation:

- **Implicit** — attach `.animation(_:value:)` to a view. Whenever the given `value` changes, SwiftUI animates that view's resulting changes.
- **Explicit** — wrap the state change in **`withAnimation { }`**. Every view affected by that state change animates.

```swift
// Implicit: this view animates whenever isOn changes
Circle()
    .fill(isOn ? .green : .gray)
    .animation(.easeInOut, value: isOn)

// Explicit: animate all views affected by this state change
withAnimation(.spring) {
    isExpanded.toggle()
}
```

Rule of thumb: **explicit (`withAnimation`)** when *you* control the moment of change and want everything driven by it to animate; **implicit (`.animation(value:)`)** to bind a specific view's animation to a specific value. (Avoid the deprecated valueless `.animation(_:)` — always scope it with `value:`.)

## `withAnimation`

`withAnimation(_:)` takes an **`Animation`** (`.default`, `.easeInOut(duration:)`, `.spring(...)`, `.linear`, etc.) and animates any view whose appearance depends on state you mutate inside the closure. You can also return a value and animate bindings. It's the most common, predictable entry point.

## Transitions

A **transition** animates a view **being inserted or removed** from the hierarchy (not just changing) — e.g. a view appearing when a condition becomes true.

```swift
if showBanner {
    Banner()
        .transition(.move(edge: .top).combined(with: .opacity))
}
// the insertion/removal must happen inside an animation:
withAnimation { showBanner.toggle() }
```

Built-ins include `.opacity`, `.scale`, `.move(edge:)`, `.slide`, `.push`, and `.asymmetric(insertion:removal:)` for different in/out effects. A transition only plays if the identity change (insert/remove) happens within an animation.

## `matchedGeometryEffect`

For "hero" animations where an element appears to **move/morph between two positions** (e.g. a thumbnail expanding into a detail), `matchedGeometryEffect` links two views sharing an `id` in a namespace; SwiftUI interpolates geometry between them as one is removed and the other inserted.

```swift
@Namespace private var ns
// small:
Image(...).matchedGeometryEffect(id: "hero", in: ns)
// large (in the other state):
Image(...).matchedGeometryEffect(id: "hero", in: ns)
```

SwiftUI treats them as the same element moving, producing a smooth shared-element transition.

## Animatable & custom animations

SwiftUI can only animate values it knows how to interpolate — those conforming to **`Animatable`** (via `animatableData`). Most built-in types (sizes, colors, offsets, angles) already do. For a custom effect (e.g. animating a shape's control point or a numeric counter), you conform your view/shape to `Animatable` and expose the value to interpolate:

```swift
struct CounterText: View, Animatable {
    var value: Double
    var animatableData: Double {
        get { value } set { value = newValue }
    }
    var body: some View { Text("\(Int(value))") }
}
```

Now `withAnimation` interpolates `value`, driving intermediate frames.

## Phase & keyframe animators

Newer APIs handle **multi-step** animations that a single curve can't:

- **`.phaseAnimator`** — cycles a view through an ordered set of **phases**, animating between each (e.g. a pulsing/attention effect).
- **`.keyframeAnimator`** — drives multiple properties along independent **keyframe** timelines for complex choreography.

These express sequences and parallel property tracks declaratively, without chaining completion handlers.

## The interview lens

Lead with the model: **you animate state changes, not frames** — SwiftUI interpolates between the old and new rendered views. Distinguish **implicit** (`.animation(_:value:)`, bound to a value's changes) from **explicit** (**`withAnimation { }`**, animates everything driven by the state you mutate) — and note the valueless `.animation(_:)` is deprecated (always scope with `value:`).

Know that **transitions** animate **insertion/removal** (identity changes) and only play when that change happens inside an animation; **`matchedGeometryEffect`** creates shared-element/"hero" moves between two views with the same id in a `@Namespace`; and SwiftUI can only animate **`Animatable`** values (`animatableData`) — which is how you build custom animations. Bonus: `phaseAnimator`/`keyframeAnimator` for multi-step/parallel choreography.
