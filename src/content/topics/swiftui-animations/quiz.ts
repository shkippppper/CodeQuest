import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "animate-state-not-frames",
    type: "mcq",
    prompt: "What do you animate in SwiftUI?",
    options: [
      "State changes — SwiftUI interpolates between the old and new rendered views",
      "Individual frames, one at a time",
      "CALayer properties directly",
      "The run loop timing",
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
      "Only animates the button that was tapped",
      "Runs the closure on a background thread",
      "Disables animations",
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
      "A color change on a persistent view",
      "Scroll position",
      "Text content updates",
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
      "Matching two colors",
      "Aligning text baselines",
      "Detecting device geometry",
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
      "Nothing — Text animates numbers automatically",
      "A CADisplayLink timer",
      "A withAnimation call is enough on its own",
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
      "It always animates regardless",
      "It crashes",
      "The transition plays in reverse",
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
      "It's faster to type",
      "It animates on a background thread",
      "It disables transitions",
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
