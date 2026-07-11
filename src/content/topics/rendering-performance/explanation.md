## The problem: a scroll that stutters instead of gliding

Scroll a list of cards, each with a rounded corner, a subtle shadow, and a profile image. It scrolls fine for a few rows, then visibly stutters — a brief freeze-and-jump instead of a smooth glide.

```swift
struct CardView: View {
    var body: some View {
        HStack {
            Image("avatar")
                .clipShape(Circle())
            Text("Ada Lovelace")
        }
        .background(Color.white)
        .cornerRadius(12)
        .shadow(radius: 4)
    }
}
```

Nothing here looks expensive. No network call, no loop, no heavy computation — just a few view modifiers. The stutter isn't a CPU problem in the usual sense; it's a rendering problem, and this lesson is about why modifiers like this one can be surprisingly costly to draw.

## The frame budget

Your screen redraws at a fixed rate — 60 times a second on older devices, up to 120 times a second on ProMotion displays. Each redraw is a **frame**, and the system gives you a fixed window of time to produce it: at 60Hz that's about 16.7ms per frame; at 120Hz it's about 8.3ms. That window is the **frame budget**.

Predict: your card list takes 20ms to draw one frame on a 60Hz device. What does the user actually see?

Answer: *a dropped frame* — a **hitch**. The system can't show a half-finished frame, so it shows the previous frame again and tries the new one on the next cycle. Visually this reads as a brief stutter, and if it happens repeatedly during a scroll, the whole gesture feels janky instead of smooth. At 120Hz the budget is half as long, so the same 20ms of work that caused one dropped frame at 60Hz can drop two or three frames at 120Hz — the higher refresh rate raises the bar for what counts as "fast enough."

## Offscreen rendering

Go back to the card's `.shadow(radius: 4)`. A shadow needs the renderer to know the exact silhouette of everything behind it — but that's not something the GPU can compute while compositing the view directly onto the screen in one pass. Instead, it first draws the view into a separate, invisible buffer, computes the shadow from that buffer, and only then composites the result onto the screen. That extra buffer-and-compose detour is called **offscreen rendering**, and it costs an entire extra render pass per view that needs it, on top of the normal one.

`cornerRadius` combined with `clipsToBounds`/`clipShape`, shadows, and blur effects are the most common triggers. One card with a shadow is cheap. A hundred cards scrolling past, each triggering its own offscreen pass every frame, adds up fast — that's the stutter from the opening example.

You can see this directly: in the Simulator, Debug → Color Off-screen Rendered (or the equivalent Core Animation option when profiling a device), any view rendered offscreen gets tinted yellow. A card list lighting up yellow across every row is the visual confirmation that shadows or corner-radius clipping are the culprit, not a guess.

```swift
// Cheaper: pre-render the shadow into the image asset itself,
// or rasterize once instead of recomputing every frame
.background(
    Image("card-background-with-shadow")   // shadow baked into the asset
)
```

Where you can't avoid a shadow entirely, giving the layer a `shadowPath` (in UIKit, `layer.shadowPath = UIBezierPath(...).cgPath`) tells the renderer the exact shape up front instead of computing it from the content every frame, which is dramatically cheaper.

## Overdraw and blending

A second, separate cost: how many times does the GPU paint the same pixel in one frame? Stack a background color, a card color, a translucent overlay, and text on top of each other, and the pixels underneath all still get painted even though only the top layer is visible. Painting the same pixel more than once per frame is called **overdraw**, and each additional layer painted on top of an already-opaque layer is wasted GPU work.

```swift
ZStack {
    Color.gray                    // painted
    Color.white.opacity(0.95)     // painted on top, gray mostly hidden but still drawn
    CardContent()                 // painted on top of that
}
```

Related to overdraw is **blending** — combining a semi-transparent layer with what's beneath it, which costs more than drawing a fully opaque layer because the GPU has to read the existing pixel color, not just overwrite it. `.opacity()` values below 1.0, and any view with a transparent background, force blending. Marking a view's background fully opaque where visually possible (`Color.white` instead of `Color.white.opacity(0.99)`), and removing background colors that are never actually visible under other content, are the two easy wins.

Xcode's Debug → Color Blended Layers option tints blended regions red — heavy red across your screen means the GPU is repeatedly blending pixels it didn't need to.

## Hitch debugging

You don't have to guess where hitches happen. Instruments has a dedicated **Hitches** track (part of the Animation Hitches instrument, or visible directly in the SwiftUI instrument), which marks every dropped-frame moment on the timeline with how many milliseconds over budget that frame ran.

Record while performing the exact gesture that stutters — the scroll, the transition, the tap-and-animate — then click a hitch marker. Instruments shows you the call stack running during that frame, the same way Time Profiler shows a hot function, except scoped to exactly the frame that missed its budget. This turns "the list feels janky somewhere" into "frame 340 took 24ms because `CardView.body` re-evaluated for all 40 visible rows instead of just the one that changed."

## SwiftUI and UIKit specifics

In UIKit, most of the levers above apply directly to `CALayer` properties: `shadowPath`, `shouldRasterize` (cache a static-looking layer's rendered output instead of redrawing it every frame — useful for content that doesn't change but expensive if applied to something that does), and `isOpaque` on views/layers that never show transparency.

SwiftUI adds its own failure mode on top: **unnecessary re-evaluation**. A SwiftUI `View`'s `body` re-runs whenever any state it reads changes — including state that's `@Published` on an `ObservableObject` further up the hierarchy, even if only one property changed and this particular view doesn't display it.

```swift
class FeedViewModel: ObservableObject {
    @Published var items: [Post] = []
    @Published var scrollOffset: CGFloat = 0   // updates on every scroll frame
}

struct RowView: View {
    @ObservedObject var viewModel: FeedViewModel   // re-evaluates on ANY @Published change
    let post: Post
    var body: some View {
        Text(post.title)   // doesn't even read scrollOffset, but re-runs on every scroll tick
    }
}
```

Because `RowView` observes the whole `FeedViewModel`, every `scrollOffset` update — which fires continuously during a scroll — re-evaluates every row's `body`, even though `RowView` never reads `scrollOffset`. The fix is narrowing what each view observes: pass `post` alone instead of the whole view model, or split `scrollOffset` into a separate object that only the view that actually needs it observes. The same discipline — give each view the smallest slice of state it actually needs — is what keeps SwiftUI's automatic re-rendering from becoming its own performance bug.

## Common pitfalls

- **Adding shadows and corner radius everywhere by default.** Each one is an offscreen render pass; on a list of dozens of cells this is often the single biggest hitch cause, and it's invisible in code review because nothing looks "slow."
- **Ignoring `.opacity()` on backgrounds.** A transparent background that's never actually visible under anything (because it's fully covered) still forces blending on every frame.
- **Passing a whole `ObservableObject` into a leaf view.** The leaf re-evaluates on every published change to the object, not just the properties it reads — narrow what's passed down instead.

## Interview lens

If asked what makes a scroll janky, anchor the answer in the frame budget: at 60Hz you have about 16.7ms (about 8.3ms at 120Hz) to produce a frame, and any frame that misses that budget causes a visible hitch. Then name the two GPU-side costs that eat that budget — offscreen rendering (shadows, corner-radius clipping needing an extra render pass) and overdraw/blending (painting the same pixel more than once, or reading-and-combining instead of overwriting for translucent layers).

If asked how you'd debug a specific hitch, describe Instruments' Hitches track for pinpointing the exact frame and its call stack, plus the Simulator's Color Off-screen Rendered and Color Blended Layers debug overlays for a visual, immediate read on which views are triggering the expensive paths.

If the conversation is SwiftUI-specific, bring up unnecessary re-evaluation: a view re-runs its `body` whenever any state it observes changes, so a leaf view holding a reference to a large `ObservableObject` re-renders far more often than it needs to. The fix — passing narrower, more specific state down instead of the whole object — is the kind of answer that signals real production experience with SwiftUI performance, not just textbook knowledge.
