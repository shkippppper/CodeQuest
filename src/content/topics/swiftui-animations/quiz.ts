import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "animate-state-not-frames",
    type: "mcq",
    prompt: "What do you animate in SwiftUI?",
    options: [
      "State changes — SwiftUI interpolates between the old and new rendered views",
      "Individual frames, one at a time, by supplying a new view description at each display-link tick inside the animation block",
      "CALayer properties directly, since SwiftUI animations ultimately translate to Core Animation at the rendering layer",
      "The run loop timing, by scheduling timed callbacks that nudge a value along a curve on each pass of the main run loop",
    ],
    answer: 0,
    explanation:
      "You change state and tell SwiftUI which changes to animate; it computes the difference between old and new views and interpolates. You don't write keyframes over time like UIKit's `UIView.animate`.",
  },
  {
    id: "explicit-withanimation",
    type: "mcq",
    prompt: "What does `withAnimation { isExpanded.toggle() }` do?",
    options: [
      "Animates every view whose appearance depends on the state changed inside the closure",
      "Only animates the button that was tapped, leaving sibling views that also read isExpanded to update without any transition",
      "Runs the closure on a background thread so the state mutation doesn't block the main thread during the animation",
      "Disables animations for the closure's mutations, since the explicit block overrides any implicit .animation modifiers already on the views",
    ],
    answer: 0,
    explanation:
      "`withAnimation` is **explicit** animation: any view affected by state mutated in the closure animates its change, using the provided `Animation` curve (`.spring`, `.easeInOut`, etc.).",
  },
  {
    id: "implicit-animation-fill",
    type: "fill",
    prompt: "Attach `.animation(.easeInOut, ___: isOn)` to bind a view's implicit animation to changes of a specific value.",
    answers: ["value"],
    hint: "The parameter that scopes the animation to a value's changes.",
    explanation:
      "`.animation(_:value:)` animates the view whenever `value` changes. The old valueless `.animation(_:)` is deprecated because it animated too broadly.",
  },
  {
    id: "transition-insertion",
    type: "mcq",
    prompt: "What does a `.transition(...)` animate?",
    options: [
      "A view being inserted into or removed from the hierarchy",
      "A color change on a persistent view, interpolating each RGB channel independently from the old value to the new one",
      "Scroll position, sliding the content offset from one coordinate to another over the animation's duration",
      "Text content updates, cross-fading between the old and new string whenever the Text's content binding changes",
    ],
    answer: 0,
    explanation:
      "Transitions animate **identity changes** — a view appearing or disappearing (e.g. inside an `if`). The insertion/removal must occur within an animation (e.g. `withAnimation`) for the transition to play.",
  },
  {
    id: "matched-geometry",
    type: "mcq",
    prompt: "What is `matchedGeometryEffect` for?",
    options: [
      "Shared-element/'hero' animations — morphing one view into another that shares an id in a namespace",
      "Matching two colors so SwiftUI interpolates between them using the same curve as the surrounding animation block",
      "Aligning text baselines across different font sizes in a horizontal stack by sharing a common measurement namespace",
      "Detecting device geometry so a view can position itself relative to a named anchor point elsewhere on screen",
    ],
    answer: 0,
    explanation:
      "Give two views the same `id` in a `@Namespace`, and SwiftUI treats them as one element moving between states, interpolating geometry — a smooth thumbnail→detail 'hero' transition.",
  },
  {
    id: "animations-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about SwiftUI animations.",
    options: [
      "`withAnimation` is explicit; `.animation(_:value:)` is implicit",
      "A transition needs its insert/remove to happen inside an animation to play",
      "SwiftUI can animate any value, even non-Animatable ones",
      "`phaseAnimator`/`keyframeAnimator` handle multi-step animations",
    ],
    answers: [0, 1, 3],
    explanation:
      "Explicit vs implicit, transition-needs-animation, and the phase/keyframe animators are correct. SwiftUI can only animate values conforming to **`Animatable`** (option 3 is false).",
  },
  {
    id: "animatable-senior",
    type: "mcq",
    prompt: "You want to animate a custom numeric 'count-up' in a Text. What must you provide?",
    options: [
      "Conform to `Animatable` and expose the value via `animatableData` so SwiftUI can interpolate it",
      "Nothing — Text animates numbers automatically when the binding changes inside a withAnimation block, no extra conformance needed",
      "A CADisplayLink timer that fires each frame and updates the displayed value by a fixed step toward the target",
      "A withAnimation call is enough on its own; SwiftUI detects numeric Text content and interpolates the digits without any protocol work",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "SwiftUI only interpolates values it knows how to — those conforming to `Animatable`. Exposing your numeric value as `animatableData` lets SwiftUI feed intermediate values during the animation, driving the count-up frame by frame.",
  },
  {
    id: "transition-no-animation-senior",
    type: "predict",
    prompt: "🧠 Trick question — the Banner has a `.transition`, but toggling `show` isn't wrapped in an animation. What happens?",
    code: `if show {
    Banner().transition(.move(edge: .top))
}
// elsewhere:
show.toggle()   // NOT inside withAnimation
`,
    options: [
      "The banner appears/disappears instantly — the transition doesn't play without an animation driving the change",
      "It always animates regardless, because SwiftUI applies a default spring animation to any transition attached to a conditional view",
      "It crashes with a runtime assertion because attaching a transition modifier to a view that isn't inside withAnimation is unsupported",
      "The transition plays in reverse every time, sliding the banner in from the wrong edge because no curve was specified",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A transition only animates when the identity change (insert/remove) occurs inside an animation. Toggling `show` without `withAnimation` (or an `.animation(value:)` observing it) makes the banner pop in/out with no transition. Wrap the toggle in `withAnimation`.",
  },
  {
    id: "implicit-scope-senior",
    type: "mcq",
    prompt: "Why is the modern `.animation(_:value:)` preferred over the deprecated valueless `.animation(_:)`?",
    options: [
      "It scopes the animation to changes of a specific value, avoiding accidentally animating unrelated changes",
      "It's faster to type because you can omit the value parameter and rely on the default any-change behavior from the old API",
      "It animates on a background thread, offloading interpolation work from the main thread to avoid blocking the UI during the curve",
      "It disables transitions on views that have a .transition modifier, preventing them from playing when the same value changes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The valueless modifier animated *any* change flowing through that view, causing surprising, over-broad animations. `.animation(_:value:)` ties the animation to a specific value's changes, making behavior predictable — which is why the valueless form was deprecated.",
  },
  {
    id: "animations-flashcard",
    type: "flashcard",
    prompt:
      "Explain SwiftUI's animation model: implicit vs explicit, transitions, matchedGeometry, and Animatable. Answer aloud, then reveal.",
    modelAnswer:
      "In SwiftUI you **animate state changes, not frames**: change state and SwiftUI interpolates between the old and new rendered views with the curve you specify. Two triggers: **explicit** — **`withAnimation(_:) { }`** animates every view affected by the state you mutate inside; and **implicit** — **`.animation(_:value:)`** animates a view whenever the given `value` changes (the valueless `.animation(_:)` is deprecated for being too broad). **Transitions** (`.transition(...)`) animate a view's **insertion/removal** (identity change) and only play if that change happens inside an animation. **`matchedGeometryEffect`** links two views sharing an `id` in a `@Namespace` for shared-element/'hero' moves between states. SwiftUI can only animate values conforming to **`Animatable`** (via `animatableData`) — most built-ins do, and you conform custom views/shapes to animate custom values (e.g. a count-up). For multi-step choreography, **`phaseAnimator`** cycles ordered phases and **`keyframeAnimator`** drives multiple property timelines.",
    keyPoints: [
      "Animate state changes; SwiftUI interpolates old→new views",
      "Explicit withAnimation vs implicit .animation(_:value:) (valueless deprecated)",
      "Transitions animate insert/remove — need an animation to play",
      "matchedGeometryEffect = shared-element/hero moves via @Namespace id",
      "Only Animatable values interpolate; phase/keyframe animators for multi-step",
    ],
    explanation:
      "Senior answers stress state-driven interpolation, the transition-needs-animation gotcha, matchedGeometry for hero moves, and Animatable/animatableData for custom animations.",
  },
];

export default quiz;
