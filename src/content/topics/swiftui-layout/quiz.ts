import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "layout-negotiation",
    type: "mcq",
    prompt: "What is SwiftUI's layout negotiation?",
    options: [
      "Parent proposes a size, child chooses its own size, parent positions the child",
      "The child forces its preferred intrinsic size on the parent regardless of the available space offered",
      "The system solves a global constraint graph like Auto Layout, resolving conflicts via priority levels",
      "Every view in the hierarchy receives the full screen size and clips any content that overflows it",
    ],
    answer: 0,
    explanation:
      "The core loop: the parent **proposes** available space, the child **decides** its size (accept, ignore, take less/more), and the parent **positions** it. 'Parent proposes, child decides' explains most layout behavior.",
  },
  {
    id: "text-vs-color-size",
    type: "mcq",
    prompt: "Given a large proposed size, how do `Text` and `Color` differ?",
    options: [
      "`Text` takes only what its content needs; `Color` is greedy and accepts all the proposed space",
      "Both views greedily fill the entire proposed space regardless of their content or intrinsic size",
      "Both views take only their intrinsic content size and shrink tightly to wrap their children",
      "`Color` ignores the proposed size and shrinks to a fixed 44-point minimum-touch-target square",
    ],
    answer: 0,
    explanation:
      "`Text` sizes to its content (wrapping/truncating). `Color`/`Shape` are greedy — they accept whatever is proposed. Knowing what each view does with the proposal explains most sizing surprises.",
  },
  {
    id: "frame-behavior",
    type: "predict",
    prompt: "🧠 Trick question — is the `Text` itself 300pt wide here?",
    code: `Text("Hi")
    .frame(width: 300, height: 100)
    .border(.red)`,
    options: [
      "No — .frame proposes a 300×100 area and CENTERS the small Text in it; the Text stays its intrinsic size",
      "Yes — .frame acts as a hard constraint that forces the Text to stretch to exactly 300 pt wide",
      "The Text auto-scales its font size upward until the character glyphs completely fill the 300 pt width",
      "It crashes at runtime with a fatal error because Text internally rejects any fixed-dimension frame modifier",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`.frame(width:height:)` adds a wrapper of that size and centers the child inside — it doesn't force the child's size. The red border shows the 300×100 frame, but 'Hi' stays small and centered. To make a view *fill* width, use `.frame(maxWidth: .infinity)`.",
  },
  {
    id: "maxwidth-infinity-fill",
    type: "fill",
    prompt: "To make a view greedily fill the width its parent offers, use `.frame(maxWidth: .___)`.",
    answers: ["infinity"],
    hint: "`.frame(maxWidth: .____)` — unbounded.",
    explanation:
      "`.frame(maxWidth: .infinity)` proposes 'as wide as offered', so the view expands to fill the available width (e.g. to make a background span full width).",
  },
  {
    id: "spacer-role",
    type: "mcq",
    prompt: "What does a `Spacer` do in a stack?",
    options: [
      "It's a greedy flexible view that expands to fill available space along the stack's axis",
      "It inserts a fixed 8pt gap between its two immediate neighbors, similar to the stack's spacing parameter",
      "It applies a clipping mask to any sibling views that extend beyond the stack's proposed bounds",
      "It aligns all sibling Text views inside the stack to a single shared baseline grid automatically",
    ],
    answer: 0,
    explanation:
      "`Spacer` expands to consume free space along the stack's axis, pushing content apart or to one side. It's flexible/greedy, unlike a fixed padding.",
  },
  {
    id: "layout-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about SwiftUI layout.",
    options: [
      "`ZStack` overlays children and sizes to the largest",
      "A stack's `alignment` parameter controls the cross-axis alignment via alignment guides",
      "`.frame(width:)` forces the child to be exactly that wide",
      "The `Layout` protocol lets you build custom containers using the same proposal system",
    ],
    answers: [0, 1, 3],
    explanation:
      "ZStack overlay, alignment via guides, and the `Layout` protocol are correct. `.frame(width:)` **proposes** a size and centers the child — it doesn't force the child's own size (option 3 is false).",
  },
  {
    id: "geometryreader-greedy-senior",
    type: "predict",
    prompt: "🧠 Why does wrapping content in a `GeometryReader` often 'take over' the layout unexpectedly?",
    code: `GeometryReader { proxy in
    Text("Hi")
}`,
    options: [
      "GeometryReader is greedy — it accepts ALL proposed space, so it expands to fill its parent",
      "It always shrinks down to exactly match the intrinsic size of its smallest direct child view",
      "It off-loads the entire layout measurement pass to a background thread so the main thread stays unblocked",
      "It internally renders two copies of its child — one invisible pass for measurement and one visible for display",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`GeometryReader` behaves like `Color`/`Shape`: it takes all the space offered so it can report a size. That's why it expands to fill and pushes siblings around. Scope it tightly and prefer stacks/frames when you don't actually need the measured size.",
  },
  {
    id: "layout-protocol-senior",
    type: "mcq",
    prompt: "When would you implement the `Layout` protocol?",
    options: [
      "For a custom arrangement stacks can't express (e.g. a flow/wrap layout or radial menu), overriding sizeThatFits and placeSubviews",
      "To apply custom text styling, font substitutions, or color transformations not exposed by standard built-in view modifiers",
      "To fetch remote data asynchronously and inject fresh values into the view hierarchy without @State or ObservableObject",
      "To replace @State entirely with a class-backed reference-type alternative whose storage survives full app termination and restarts",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Layout` lets you write a custom container that participates in the same proposal negotiation: `sizeThatFits(proposal:)` reports your size and `placeSubviews(in:)` positions children. Use it when stacks/grids can't express the arrangement.",
  },
  {
    id: "flexible-distribution-senior",
    type: "mcq",
    prompt: "In an HStack with a `Text` and a `Color`, how is width distributed?",
    options: [
      "The inflexible Text is sized first to its content; the greedy Color gets the remaining width",
      "Both children always receive exactly half the available total width regardless of their individual flexibility",
      "The Color is always sized first because greedy views are prioritized, leaving the Text to compete for the remainder",
      "The Text greedily fills the entire available width first, leaving absolutely zero remaining space for the Color",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Stacks handle **inflexible** children (like `Text`) first, giving them their needed size, then distribute the leftover to **flexible/greedy** children (like `Color`). This ordering is why a `Text` never gets squeezed to nothing next to a `Color`.",
  },
  {
    id: "layout-flashcard",
    type: "flashcard",
    prompt:
      "Explain SwiftUI's layout negotiation and the .frame / GeometryReader gotchas. Answer aloud, then reveal.",
    modelAnswer:
      "SwiftUI layout is a negotiation: the **parent proposes a size**, the **child chooses its own size** (accept, ignore, take less/more), and the **parent positions** the child. What a view does with the proposal explains everything: **`Text`** takes only what its content needs; **`Color`/`Shape`/`GeometryReader`** are **greedy** (take all offered); **`Image`** is intrinsic by default. Stacks size inflexible children (Text) first, then distribute remaining space to flexible ones (Color, `Spacer`), with cross-axis **alignment** via alignment guides. The **`.frame` gotcha**: `.frame(width:height:)` **proposes** that size and **centers** the child inside — it doesn't force the child's size; use `.frame(maxWidth: .infinity)` to make a view fill available width. **`GeometryReader` is greedy** — it accepts all proposed space to report a size, so it 'takes over' layouts (scope it tightly). For arrangements stacks can't express, implement the **`Layout`** protocol (`sizeThatFits`/`placeSubviews`) to plug into the same proposal system.",
    keyPoints: [
      "Parent proposes → child decides → parent positions",
      "Text = content size; Color/Shape/GeometryReader = greedy; Image = intrinsic",
      ".frame(w:h:) proposes + centers (doesn't force); maxWidth:.infinity to fill",
      "Stacks size inflexible children first, then distribute to flexible ones",
      "GeometryReader is greedy; Layout protocol for custom containers",
    ],
    explanation:
      "Senior answers lead with the proposal negotiation, correctly describe greedy vs content-sized views, and nail the .frame-centers and GeometryReader-greedy gotchas.",
  },
];

export default quiz;
