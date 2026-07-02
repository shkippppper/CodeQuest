## The problem: no frames, no constraints — so how does anything get sized?

Coming from UIKit Auto Layout, SwiftUI feels like magic: no explicit constraints, yet everything lays out. The magic is a simple, strict **negotiation** that runs top-down and bottom-up. Understanding it turns "why is my view the wrong size?" from guesswork into a predictable conversation between parents and children.

## The layout negotiation (proposed size)

SwiftUI layout is a three-step conversation, repeated for every view:

1. **The parent proposes a size** to its child ("here's how much room I have").
2. **The child chooses its own size** — it can accept, ignore, or take less/more than proposed.
3. **The parent positions the child** within itself based on that chosen size.

The key mental model: **parent proposes, child decides.** A `Text` takes only as much as its content needs (ignoring extra proposed width by wrapping/truncating); an `Image` is its intrinsic size by default; a `Color`/`Shape` accepts whatever is proposed (greedy). Layout bugs are almost always a misunderstanding of what a given view *does* with the proposal.

## Stacks (H/V/Z)

The workhorses are `HStack`, `VStack`, and `ZStack`:

- **`VStack`/`HStack`** propose space to children (dividing along their axis, giving flexible children shares) and size themselves to fit the result.
- **`ZStack`** overlays children on top of each other, sized to the largest.

Stacks propose to their children in order, handling inflexible children (like `Text`) first and distributing remaining space to flexible ones.

## Spacer & frames

- **`Spacer`** is a flexible, greedy view that expands to fill available space along a stack's axis — how you push content apart or to one side.
- **`.frame(...)`** proposes a specific size to the view it wraps. This is subtle: `.frame(width:height:)` doesn't *force* the child's size — it proposes that size and then centers the child in it. `.frame(maxWidth: .infinity)` proposes "as wide as offered," making a view greedily fill its parent.

```swift
Text("Hi")
    .frame(maxWidth: .infinity)   // fills the width offered by the parent
    .background(.blue)            // now the blue spans full width
```

A frequent gotcha: `.frame` adds a *new* wrapper view that proposes to the original — so a small `Text` inside a big `.frame` stays small but is *centered* in the frame's area.

## Alignment & guides

Stacks take an **alignment** for the cross axis (`VStack(alignment: .leading)`). Alignment works via **alignment guides** — each view reports where its `.leading`/`.center`/`.firstTextBaseline` etc. is, and the stack lines those guides up. You can customize a view's guide with `.alignmentGuide(...)` for fine control (e.g. aligning a label's baseline to an icon's center).

## `GeometryReader`

When a child genuinely needs to know its **proposed size** (for proportional layout, custom drawing), **`GeometryReader`** exposes it:

```swift
GeometryReader { proxy in
    Rectangle().frame(width: proxy.size.width * 0.5)   // half the available width
}
```

Caveat: `GeometryReader` is **greedy** — it accepts *all* the proposed space (like a `Color`), which surprises people when it "takes over" a layout. Use it deliberately and scope it tightly; reaching for it constantly is usually a sign you're fighting the layout system rather than using stacks/frames.

## The `Layout` protocol

For truly custom arrangements (a flow layout, a radial menu) that stacks can't express, the **`Layout`** protocol lets you implement the negotiation yourself. You override `sizeThatFits(proposal:...)` (report your size given a proposal) and `placeSubviews(in:...)` (position each subview). It plugs a custom container into the same proposal system every built-in view uses.

## The interview lens

The must-know is the **layout negotiation**: **parent proposes a size, child chooses its own size, parent positions the child.** Be able to say what common views do with the proposal — `Text` takes what it needs, `Color`/`Shape`/`GeometryReader` are **greedy** (take all offered), `Image` is intrinsic by default — because that explains virtually every "wrong size" bug.

Nail the **`.frame` subtlety**: it proposes a size and *centers* the child, it doesn't force the child to be that size; `.frame(maxWidth: .infinity)` is how you make a view fill available width. Mention **`Spacer`** (greedy filler), **alignment guides** for cross-axis alignment, that **`GeometryReader` is greedy** (a common footgun), and that the **`Layout` protocol** exists for custom containers using the same proposal mechanism.
