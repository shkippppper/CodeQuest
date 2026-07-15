import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "a11y-what-voiceover-reads",
    type: "mcq",
    prompt: "What structure does VoiceOver actually navigate when a user swipes through your screen?",
    options: [
      "A parallel accessibility tree of elements, each carrying label/value/hint/trait metadata, not your raw views",
      "Your raw SwiftUI or UIKit view hierarchy exactly as declared, walking every single subview in strict back-to-front z-order",
      "A snapshot bitmap of the rendered screen that it runs through on-device optical character recognition to name each region",
      "The Auto Layout constraint graph, reading out each view by inferring a description from its position and sizing anchors",
    ],
    answer: 0,
    explanation:
      "VoiceOver reads the **accessibility tree** — a parallel list of accessibility elements with label/value/hint/trait metadata — not your raw views. Your job is to make sure meaningful views produce good elements.",
  },
  {
    id: "a11y-image-no-label-predict",
    type: "predict",
    prompt: "This image has no accessibility text set. When VoiceOver lands on it, what does it announce?",
    code: 'Image("profile_avatar_2x")\n// no .accessibilityLabel set',
    options: [
      'The image\'s file name, roughly "profile avatar 2x" — which is exactly why you must set a real label',
      'Nothing at all — an unlabeled image is silently dropped from the accessibility tree and skipped over entirely',
      'A generic placeholder phrase such as "unlabeled image, please add a description" that Apple substitutes automatically',
      'The dominant color and rough dimensions of the asset, for example "mostly blue image, about 120 by 120 points"',
    ],
    answer: 0,
    explanation:
      "With no label, VoiceOver falls back to reading the image's **file name** (\"profile avatar 2x\"). That's almost never useful, which is the whole reason images need an explicit `.accessibilityLabel`.",
  },
  {
    id: "a11y-four-properties-match",
    type: "mcq",
    prompt: "For a custom slider, which accessibility property should hold the text \"50 percent\"?",
    options: [
      "value — it reports the element's current, changeable state, while the label names the control",
      "label — the current setting is the single most identifying piece of text so it belongs in the name of the control",
      "hint — anything describing the present state of an interactive control is supplementary and read after a deliberate pause",
      "trait — numeric state is expressed by combining flags like isAdjustable with the raw stored numeric value on the element",
    ],
    answer: 0,
    explanation:
      "**Value** reports current, changeable state (\"50 percent\"). The **label** names the control (\"Volume\"), the **hint** says what an action does, and **traits** describe kind/state. VoiceOver reads \"Volume, 50 percent.\"",
  },
  {
    id: "a11y-trait-fill",
    type: "fill",
    prompt:
      "So VoiceOver announces a tappable custom image as a button and offers a double-tap, you add the .isButton accessibility ___.",
    answers: ["trait", "traits"],
    hint: "The category of flag that describes an element's kind (button, header) and state (selected, disabled).",
    explanation:
      "A **trait** describes an element's kind and state. `.accessibilityAddTraits(.isButton)` makes VoiceOver append \"button\" and offer the double-tap activation gesture.",
  },
  {
    id: "a11y-combine-predict",
    type: "predict",
    prompt: "A profile card is an HStack of an avatar, two Text views, and a chevron. What changes after adding this modifier?",
    code:
      'HStack {\n' +
      '    Image("avatar")\n' +
      '    VStack { Text("Ada Lovelace"); Text("Engineer") }\n' +
      '    Image(systemName: "chevron.right")\n' +
      '}\n' +
      '.accessibilityElement(children: .combine)',
    options: [
      'The whole card becomes one element that reads "Ada Lovelace, Engineer" in a single swipe',
      'Each of the four subviews stays a separate element but they are now read in a fixed, guaranteed left-to-right sequence',
      'The card is removed from the accessibility tree completely, since combine collapses its children down to nothing at all',
      'VoiceOver reads all four subviews at once but only when the user performs a special two-finger double-tap magic gesture',
    ],
    answer: 0,
    explanation:
      "`.accessibilityElement(children: .combine)` merges the children into **one** element, so a single swipe reads \"Ada Lovelace, Engineer\" instead of four separate stops.",
  },
  {
    id: "a11y-dynamic-type-mcq",
    type: "mcq",
    prompt: "Which font choice lets text grow when the user increases their preferred size in Settings?",
    options: [
      "A text style such as .font(.body), a semantic size iOS maps to real points from the user's preference",
      "A fixed point size like .font(.system(size: 15)), which pins the text and is fastest for the layout engine to measure",
      "Any custom font loaded from a bundled .ttf file, because registered custom fonts are always scaled by the system automatically",
      "A .font(.system(size: 15)) wrapped in a GeometryReader so the size can be recomputed against the container's width each layout pass",
    ],
    answer: 0,
    explanation:
      "A **text style** like `.body` is semantic — iOS maps it to real points from the user's Dynamic Type setting, so it scales. A fixed `.system(size: 15)` stays frozen regardless of preference.",
  },
  {
    id: "a11y-scaledmetric-fill",
    type: "fill",
    prompt:
      "To make an icon's frame size grow in step with Dynamic Type text, you declare its base value with the @___ property wrapper.",
    answers: ["ScaledMetric", "scaledmetric"],
    hint: "A property wrapper: '@___ var iconSize: CGFloat = 24'.",
    explanation:
      "`@ScaledMetric` takes a base value at the default text size and scales it by the same factor Dynamic Type applies to text, keeping non-text values in proportion.",
  },
  {
    id: "a11y-must-knows-multi",
    type: "multi",
    prompt: "Select **all** accessibility practices that are correct as stated.",
    options: [
      "Mark a purely decorative image .accessibilityHidden(true) so it is removed from the accessibility tree",
      "Make every tappable control at least 44 by 44 points so it is reachable by users with motor impairments",
      "Aim for at least a 4.5:1 contrast ratio for normal-size body text against its background for legibility",
      "Put the control's essential instructions only in its hint, since VoiceOver always reads the hint before the label",
    ],
    answers: [0, 1, 2],
    explanation:
      "Hiding decoration, 44pt hit targets, and 4.5:1 contrast are all correct. The last is false: hints are read **last**, after a pause, and users can turn them off — never put essential info only in a hint.",
  },
  {
    id: "a11y-accessibility-size-senior",
    type: "mcq",
    prompt: "At the very largest accessibility text sizes a tidy HStack of an icon and label starts to clip. What's the idiomatic fix?",
    options: [
      "Read \\.dynamicTypeSize from the environment and, when isAccessibilitySize is true, switch the HStack to a VStack",
      "Clamp the row's font with .dynamicTypeSize(...(.large)) so the text can never grow past the point where it would clip",
      "Wrap the row in a ScrollView(.horizontal) so the icon and its label can be scrolled sideways once they overflow the width",
      "Shrink the font with .minimumScaleFactor(0.5) at large sizes, letting the text scale itself back down to fit inside the HStack",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Read `\\.dynamicTypeSize`, check `isAccessibilitySize`, and reflow an `HStack` into a `VStack`. Clamping or shrinking the text (options 2 and 4) defeats Dynamic Type — the user asked for big text on purpose.",
  },
  {
    id: "a11y-combine-vs-ignore-senior",
    type: "mcq",
    prompt: "You draw a 5-star rating out of shapes and VoiceOver reads \"star, star, star, star, star.\" Best fix?",
    options: [
      "Use .accessibilityElement(children: .ignore) and set one label like \"Rating: 4 out of 5 stars\"",
      "Add .accessibilityLabel to each of the five star shapes individually so every star announces its own filled-or-empty state",
      "Apply .accessibilityElement(children: .combine), which keeps all five child stars but reads their merged labels in one swipe",
      "Leave the stars as-is and rely on the Accessibility Audit to auto-generate a single summary label for the whole group at runtime",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The stars are decorative pieces you can describe better in one phrase, so `.ignore` the children and supply one clean label. `.combine` would still surface the five stars; the audit does not synthesize labels for you.",
  },
  {
    id: "a11y-flashcard",
    type: "flashcard",
    prompt:
      "Explain how you'd make a custom control accessible: the accessibility tree, the four properties, and how text scales with Dynamic Type. Answer aloud, then reveal.",
    modelAnswer:
      "VoiceOver — the built-in screen reader — navigates a parallel **accessibility tree** of elements, not your raw views, so a custom control must expose a good element. Each element carries up to four things, spoken in order: **label** (what it is, e.g. \"Favorite\"), **value** (its current changeable state, e.g. \"50 percent\"), **hint** (what an action does, e.g. \"Double tap to favorite\" — read last, can be turned off, so never put essential info there), and **traits** (its kind/state, like `.isButton` or `.isHeader`). In SwiftUI you set these with `.accessibilityLabel`, `.accessibilityValue`, `.accessibilityHint`, and `.accessibilityAddTraits`; UIKit has the same as plain properties. Merge a multi-view card into one element with `.accessibilityElement(children: .combine)`, or `.ignore` the children and write one label; hide decoration with `.accessibilityHidden(true)`. For **Dynamic Type**, use semantic text styles like `.font(.body)` instead of fixed point sizes so text scales with the user's setting, use `@ScaledMetric` to scale non-text values (icon sizes, padding) in step, and check `\\.dynamicTypeSize.isAccessibilitySize` to reflow layouts at the largest sizes. Verify with the Accessibility Inspector, the Xcode Accessibility Audit, and by turning VoiceOver on and completing a task without looking.",
    keyPoints: [
      "VoiceOver reads a parallel accessibility tree of elements, not raw views",
      "Label = what it is, value = current state, hint = what an action does, traits = kind/state",
      ".accessibilityLabel/Value/Hint/AddTraits in SwiftUI; same as properties in UIKit",
      "Combine or ignore children to group; accessibilityHidden hides decoration",
      "Dynamic Type: text styles not fixed sizes; @ScaledMetric for non-text values",
      "Test with Accessibility Inspector, Xcode Audit, and real on-device VoiceOver",
    ],
    explanation:
      "A strong answer names the accessibility tree, defines all four properties in order, distinguishes text styles from fixed sizes, mentions @ScaledMetric and reflowing at accessibility sizes, and ends with concrete testing tools.",
  },
];

export default quiz;
