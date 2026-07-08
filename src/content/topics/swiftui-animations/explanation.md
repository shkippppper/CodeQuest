## The problem: you animate state changes, not frames

Here's a toggle with no animation:

```swift
Circle()
    .fill(isOn ? .green : .gray)
```

Tap something that flips `isOn`, and the circle snaps from gray to green instantly. Functional, but harsh.

In UIKit you'd fix this by describing motion over time — `UIView.animate`, keyframes, durations. SwiftUI flips the model: you change *state*, and SwiftUI animates the *difference* between the old rendered view and the new one. You never drive frames by hand.

Your whole job is answering two questions: *which* state changes should animate, and with *what* curve. SwiftUI interpolates the rest — it computes all the in-between values for you.

## The implicit way: animate when a value changes

Add one modifier to the snapping circle:

```swift
Circle()
    .fill(isOn ? .green : .gray)
    .animation(.easeInOut, value: isOn)   // animate MY changes when isOn changes
```

Now every change to this view caused by `isOn` flipping animates with an ease-in-ease-out curve. This is an **implicit animation**: attached to a view, bound to a value, always watching.

The `value:` parameter is the scope. Only changes triggered by *that value* animate — other state changes to the same view still snap. There's an older, valueless `.animation(_:)` with no scope; it's deprecated because it animated everything and caused chaos. Always pass `value:`.

## The explicit way: animate this state change

The other entry point wraps the *mutation* instead of the view:

```swift
withAnimation(.spring) {
    isExpanded.toggle()
}
```

This is an **explicit animation**: every view anywhere on screen whose appearance depends on `isExpanded` animates this change with a spring curve. The trigger lives at the moment of change, not on a particular view.

`withAnimation(_:)` takes an `Animation` value — `.default`, `.easeInOut(duration:)`, `.spring(...)`, `.linear`, and friends. It can also return a value, and it works on bindings too. It's the most common, most predictable way to animate.

Rule of thumb: use `withAnimation` when *you* control the moment of change and want everything driven by it to move together. Use `.animation(_:value:)` when you want one specific view's animation tied to one specific value.

## Animating views that appear and disappear

So far we've animated views that *change*. What about a view that gets *inserted or removed*?

```swift
if showBanner {
    Banner()
        .transition(.move(edge: .top).combined(with: .opacity))
}
```

A **transition** describes how a view enters and exits the hierarchy — here, sliding from the top edge while fading. Built-ins include `.opacity`, `.scale`, `.move(edge:)`, `.slide`, and `.push`. Need different in and out effects? `.asymmetric(insertion:removal:)`.

### Predict: will this transition play?

The banner is toggled like this:

```swift
Button("Show") { showBanner.toggle() }   // no withAnimation
```

Does the banner slide in?

Answer: no — it pops in instantly, transition ignored. A transition only plays when the insertion or removal happens *inside an animation*. The fix is one wrapper:

```swift
Button("Show") {
    withAnimation { showBanner.toggle() }   // now the transition plays
}
```

The transition describes *how* to enter and exit; the animation is *permission* for it to happen gradually. Forgetting the `withAnimation` is the number-one "my transition doesn't work" bug.

## Hero moves with matchedGeometryEffect

Sometimes an element should appear to *fly* between two places — a thumbnail expanding into a full detail image. Those are really two different views, but you want them to read as one moving object.

Start with a shared namespace:

```swift
@Namespace private var ns
```

`@Namespace` creates an identifier space that groups matched views together. Now tag both views with the same id in that namespace:

```swift
// collapsed state:
Image("cover")
    .matchedGeometryEffect(id: "hero", in: ns)

// expanded state (the other branch):
Image("cover")
    .matchedGeometryEffect(id: "hero", in: ns)
```

When one is removed and the other inserted inside an animation, SwiftUI notices they share an id and interpolates the geometry — position and size — between them. The eye sees one element smoothly morphing. This is **matchedGeometryEffect**, SwiftUI's shared-element or "hero" transition.

## Teaching SwiftUI to animate your own values

SwiftUI can only animate values it knows how to interpolate. Watch it fail:

```swift
Text("\(count)")   // count: Int
// withAnimation { count = 100 } → text just jumps to "100"
```

Sizes, colors, offsets, angles — those interpolate out of the box, because their types conform to **Animatable**, the protocol that exposes a value SwiftUI can blend between. An `Int` inside a string does not.

To animate the counter, conform your view to `Animatable` and expose the value through `animatableData`:

```swift
struct CounterText: View, Animatable {
    var value: Double
    var animatableData: Double {
        get { value }
        set { value = newValue }   // SwiftUI feeds in-between values here
    }
    var body: some View {
        Text("\(Int(value))")
    }
}
```

Now `withAnimation { value = 100 }` doesn't jump. SwiftUI calls the `animatableData` setter with 1.3, 8.9, 42.5... rendering the body for each intermediate frame — a rolling number counter. The same technique animates a custom shape's control points.

## Multi-step choreography

A single curve gets you from A to B. Some effects need A to B to C, or several properties moving on different schedules. Two newer APIs handle that declaratively.

`.phaseAnimator` cycles a view through an ordered set of phases, animating between each:

```swift
Image(systemName: "bell")
    .phaseAnimator([0, -20, 20, 0]) { view, angle in
        view.rotationEffect(.degrees(angle))
    }
```

The bell rocks through each rotation phase in turn — a pulsing, attention-grabbing effect with no timers and no completion handlers.

`.keyframeAnimator` goes further: multiple properties, each on its own independent keyframe timeline. Scale can pop early while opacity fades late — parallel property tracks, all declared in one place. Reach for it when phases aren't expressive enough.

Both replace the old pattern of chaining animations in completion handlers.

## Common pitfalls

- **Transition doesn't play.** The insert/remove wasn't inside an animation. Wrap the state change in `withAnimation`.
- **Using the valueless `.animation(_:)`.** Deprecated — it animated *every* change hitting the view. Always scope with `value:`.
- **Expecting a non-`Animatable` value to interpolate.** Text built from an `Int` jumps. Conform to `Animatable` and expose `animatableData`.
- **Hero transition where views don't match.** `matchedGeometryEffect` needs the *same id in the same namespace* on both views, and the swap must happen inside an animation.

## Interview lens

Lead with the mental model, because it's what the question is really testing: in SwiftUI you animate state changes, not frames — SwiftUI diffs old and new rendered views and interpolates between them. Contrasting that with UIKit's imperative `UIView.animate` in one sentence signals you understand both worlds.

Then draw the implicit/explicit line crisply: `.animation(_:value:)` lives on a view and fires when its value changes; `withAnimation { }` wraps a mutation and animates everything that state drives. Mention unprompted that the valueless `.animation(_:)` is deprecated — knowing *why* (unscoped, animated everything) is a senior tell.

Expect "how do transitions differ from animations?" Answer: transitions handle insertion and removal — identity changes — and only play if that change happens inside an animation. That last clause is the gotcha they're fishing for.

For depth, have two cards ready: `matchedGeometryEffect` gives shared-element hero moves via a common id in a `@Namespace`; and SwiftUI can only animate `Animatable` values, so custom effects mean exposing `animatableData` — the counter example takes ten seconds to sketch and lands well. If they ask about sequences, name `phaseAnimator` and `keyframeAnimator` as the declarative replacements for completion-handler chains.
