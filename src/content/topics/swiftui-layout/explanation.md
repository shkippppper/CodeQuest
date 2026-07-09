## The problem: nobody told this text how big to be

Put one view on screen:

```swift
Text("Hello")
```

It shows up neatly sized — big enough for the word, not a pixel more. But look at what you *didn't* write: no width, no height, no coordinates, no constraint of any kind.

Now try a rectangle of color:

```swift
Color.blue
```

This one fills the entire screen. Same amount of sizing code — none — and a completely different result.

So something is deciding sizes, and different views clearly get different answers. That something is a short negotiation that runs for every view on screen. Once you can replay that negotiation in your head, "why is my view the wrong size?" stops being guesswork.

## The negotiation: parent proposes, child decides

Every view in SwiftUI has a parent — the screen itself, a stack, a frame. Sizing is a three-step conversation between them:

```
1. Parent → child:  "I have 390×844 available. How big do you want to be?"
2. Child  → parent: "I'll be 87×20, thanks."
3. Parent places the child somewhere inside itself, at that size.
```

Step 1 is called the **proposed size** — the parent's offer of available room. The crucial rule lives in step 2: the child *chooses its own size*. It can accept the offer, ignore it, or pick something completely different. The parent must respect the answer; all it controls afterward is *where* the child sits.

The mantra to memorize: parent proposes, child decides.

Now the opening mystery dissolves. Each view type has its own policy for answering the proposal:

```swift
Text("Hello")   // "I need 87×20 for my letters" — takes only what content needs
Color.blue      // "I'll take everything you offered" — accepts the full proposal
Image("logo")   // "I'm 120×120" — reports its natural pixel size, ignoring the offer
```

`Text` is content-hugging: offered the whole screen, it still sizes to its characters. Offered *too little* width, it doesn't overflow — it wraps to more lines, or truncates with an ellipsis. `Color` — and shapes like `Rectangle` and `Circle` — are **greedy**: they accept whatever is proposed, which is why `Color.blue` filled the screen. `Image` defaults to its intrinsic size, meaning the natural dimensions baked into the image file.

Nearly every layout bug is a misunderstanding of one view's answer policy. Learn the policies and the bugs become predictable.

## Stacks: parents that split the proposal

Real screens compose views with `HStack`, `VStack`, and `ZStack`. Stacks are parents, so they run the same negotiation — their job is deciding how to split their own proposal among several children.

```swift
HStack {
    Text("Name")     // wants ~50 points of width
    Color.blue       // wants... everything
}
```

Predict: the screen offers this `HStack` 390 points of width. How much does each child get?

Answer: the text gets its ~50, and the color gets all the rest. Here's the order of operations that produces that: a stack proposes to its *least flexible* children first. `Text` has a firm opinion about its size, so it answers first and claims ~50 points. Whatever remains is then divided among the flexible, greedy children — here just `Color.blue`, which happily takes the leftover ~340.

Once every child has answered, the stack sizes *itself* to fit the results and reports that to its own parent. The negotiation is the same at every level of the tree.

The three stacks differ only in geometry:

- `HStack` divides its proposed width among children, side by side.
- `VStack` divides its proposed height, top to bottom.
- `ZStack` doesn't divide at all — children overlap, each offered the full proposal, and the stack sizes itself to the largest child.

## Spacer: an empty view that shoves

A common need: title on the left, button on the right, gap in the middle. The tool is `Spacer`:

```swift
HStack {
    Text("Title")
    Spacer()          // greedy, invisible, expands along the stack's axis
    Button("Edit") { }
}
```

`Spacer` is a view that draws nothing and has one behavior: along its stack's axis, it's greedy — it takes all the space the inflexible children left behind. The text and button claim their content sizes; the spacer swallows the middle; the two ends get pushed apart. Two spacers around one view center it; a single leading spacer pushes content to the trailing edge.

## .frame: a proposal, not a command

Here's the modifier everyone misreads at first:

```swift
Text("Hi")
    .frame(width: 300, height: 300)
    .background(.blue)
```

Predict: does the text become 300×300? How big is the blue area?

Answer: the blue square is 300×300 — but the text is still tiny, sitting centered in the middle of the blue.

The reason changes how you read every modifier from now on: `.frame` doesn't reach into the text and resize it. It *wraps* the text in a new invisible container view. That container tells its own parent "I'm 300×300," and then turns to the text and runs the standard negotiation — proposing 300×300. And what does `Text` do with any proposal? Takes only what its content needs. The frame can't force it; parent proposes, child decides applies even here. All the frame can do with the leftover room is position the child in it — centered by default, adjustable with an `alignment` argument.

The most-used frame variant proposes flexibility instead of a fixed number:

```swift
Text("Hi")
    .frame(maxWidth: .infinity)   // "be as wide as whatever is offered"
    .background(.blue)            // blue now spans the full width
```

`maxWidth: .infinity` makes the frame container greedy in width: it accepts however much its parent offers, then proposes that to the text. The text still hugs its content — but the *frame* is full-width, so the background stretches edge to edge. This is the standard idiom for "fill the available width."

## Lining things up: alignment guides

Stacks also take an alignment for their *cross* axis — the direction they don't stack in:

```swift
VStack(alignment: .leading) {   // a VStack stacks vertically; .leading aligns horizontally
    Text("Short")
    Text("A much longer line")
}
```

Both texts now share a left edge instead of being centered. Under the hood this works through **alignment guides**: every view can report where its `.leading`, `.center`, `.trailing`, or `.firstTextBaseline` sits within its own bounds, and the stack shifts children until the requested guides line up.

Usually the defaults are right. When they aren't, you can override one view's reported guide:

```swift
HStack(alignment: .firstTextBaseline) {
    Image(systemName: "star")
        .alignmentGuide(.firstTextBaseline) { d in d[VerticalAlignment.center] }
    Text("Starred")
}
```

An image has no text baseline, so by default it aligns awkwardly next to text. The `.alignmentGuide` override says: when someone asks this image for its `.firstTextBaseline`, hand back its vertical center instead. Now the icon's middle sits on the label's baseline — the polished look that default alignment can't produce.

## GeometryReader: asking how much room there is

Occasionally a view genuinely needs a number — "make me exactly half the available width." The negotiation normally hides the proposal from your code; `GeometryReader` exposes it:

```swift
GeometryReader { proxy in
    Rectangle()
        .frame(width: proxy.size.width * 0.5)   // half of whatever was proposed
}
```

The `proxy` carries the size the parent proposed, as plain numbers you can compute with. Proportional layouts and custom drawing are the legitimate uses.

But `GeometryReader` has a footgun baked into its own answer policy. Predict: you drop a `GeometryReader` into a `VStack` between two texts — what happens to the layout?

Answer: the `GeometryReader` behaves like `Color` — it's greedy, accepting the *entire* proposal. It balloons to fill all available space, shoving the texts to the edges and "taking over" the layout. That's the surprise that bites almost everyone the first time.

So use it deliberately and scope it tightly — wrap only the view that needs the measurement, not a whole screen. And treat frequent reaching for `GeometryReader` as a smell: it usually means you're fighting the negotiation with manual math where stacks, frames, and spacers would express the layout directly.

## The Layout protocol: writing your own negotiator

Some arrangements no stack can express — tags that flow onto new lines like text, buttons fanned in a circle. For those, the **`Layout`** protocol lets you implement a container's side of the negotiation yourself, with two requirements:

```swift
struct FlowLayout: Layout {
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        // step 2 of the negotiation: given the parent's proposal, report MY size
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        // step 3: propose sizes to each subview and position it
    }
}
```

`sizeThatFits` answers your parent's proposal; `placeSubviews` proposes to and positions your children. Nothing new was invented for this protocol — it's the exact same proposal conversation every built-in container runs, opened up so your custom container plugs into the system as a first-class citizen:

```swift
FlowLayout {
    ForEach(tags) { TagView($0) }   // used exactly like an HStack
}
```

## Common pitfalls

- **Expecting `.frame(width:height:)` to resize the child.** It sizes the new wrapper and merely *proposes* to the child; a `Text` stays content-sized, centered inside. If the small-thing-centered-in-big-area look surprises you, this is why.
- **A background that doesn't span the width.** `.background` covers the view's chosen size, and `Text` hugs content. Add `.frame(maxWidth: .infinity)` before the background.
- **A `GeometryReader` that ate the layout.** It's greedy by design. Scope it to the one view that needs measuring, or restructure with stacks and spacers.
- **Fighting flexible views with fixed numbers.** Hard-coded widths break on other devices. Prefer expressing intent — spacers, `maxWidth: .infinity`, proportions — and let the negotiation adapt.

## Interview lens

The must-know is the negotiation, stated in its three steps: the parent proposes a size, the child chooses its own size, and the parent positions the child. If you say "parent proposes, child decides" and can walk through the steps, you've cleared the bar most candidates miss.

The follow-up is usually "so what does *X* do with the proposal?" Have the policies ready: `Text` takes only what its content needs and wraps or truncates when offered less; `Color`, shapes, and `GeometryReader` are greedy and take everything offered; `Image` defaults to its intrinsic size. Explain that these policies are why views end up "the wrong size" — the bug is almost always a wrong assumption about one view's answer.

Nail the `.frame` subtlety, because interviewers use it to separate readers-of-tutorials from people who understand the system: `.frame` wraps the view in a new container that proposes a size and centers the child — it cannot force the child's size. And `.frame(maxWidth: .infinity)` is the idiom for filling available width.

Round out with the supporting cast: `Spacer` is a greedy invisible filler along the stack's axis; cross-axis alignment works through alignment guides, customizable with `.alignmentGuide`; `GeometryReader` exposes the proposed size but is greedy — a known footgun to scope tightly; and the `Layout` protocol (`sizeThatFits` plus `placeSubviews`) lets a custom container implement the very same proposal mechanism the built-ins use. Mentioning that last one signals you know the system is open, not magic.
