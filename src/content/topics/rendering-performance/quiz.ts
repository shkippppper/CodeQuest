import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "render-frame-budget",
    type: "mcq",
    prompt: "What is the 'frame budget' at 60Hz?",
    options: [
      "About 16.7ms — the time the system gives you to produce one frame before it must show something on screen",
      "60 seconds total per rendering pass, averaged across all frames so short frames can subsidize expensive ones",
      "Exactly 1ms on every device, regardless of display refresh rate, since Metal enforces a fixed GPU submission window",
      "The total time your app is allowed to run in the background before the OS suspends it to reclaim CPU resources",
    ],
    answer: 0,
    explanation:
      "At 60 frames per second, each frame has roughly 1000ms / 60 ≈ 16.7ms to be produced. At 120Hz (ProMotion) that window shrinks to about 8.3ms, which is why the same amount of work can cause more dropped frames on a 120Hz display.",
  },
  {
    id: "render-hitch-predict",
    type: "predict",
    prompt: "A frame takes 20ms to render on a 60Hz device. What does the user see?",
    code: `// frame render time: 20ms
// 60Hz frame budget: ~16.7ms`,
    options: [
      "A hitch — the system reshows the previous frame and the new one lands a cycle later, reading as a brief stutter",
      "Nothing different — 20ms is well within the 60Hz budget, since the budget is measured per-second not per-frame",
      "The screen goes black until the frame finishes rendering, then resumes normally with no visible dropped content",
      "The frame rate permanently drops to 30Hz, because the OS detects sustained budget overruns and halves the refresh rate",
    ],
    answer: 0,
    explanation:
      "Missing the frame budget means the new frame isn't ready in time, so the previous frame is shown again and the new content appears a cycle late — a dropped frame, perceived as a hitch.",
  },
  {
    id: "render-offscreen-fill",
    type: "fill",
    prompt: "Drawing a view into a separate invisible buffer first (to compute a shadow, for example) before compositing it onto the screen is called ___ rendering.",
    answers: ["offscreen"],
    hint: "Two words in the lesson describe this; the second is 'rendering'.",
    explanation: "Offscreen rendering adds an entire extra render pass per affected view, which is why shadows and clipped corner radii are common hitch sources on scrolling lists.",
  },
  {
    id: "render-offscreen-triggers-multi",
    type: "multi",
    prompt: "Select all common triggers of offscreen rendering.",
    options: [
      "shadow(radius:) / layer shadows without a shadowPath",
      "cornerRadius combined with clipping",
      "Blur effects",
      "A fully opaque Color background with no shadow or clipping",
    ],
    answers: [0, 1, 2],
    explanation:
      "Shadows, corner-radius clipping, and blur are the classic offscreen-rendering triggers. A plain opaque background with no shadow or clip is cheap — it's drawn directly in the normal compositing pass.",
  },
  {
    id: "render-overdraw-vs-blend",
    type: "mcq",
    prompt: "What's the difference between overdraw and blending?",
    options: [
      "Overdraw is painting the same pixel more than once per frame; blending is combining a translucent layer with what's underneath, which costs more than overwriting an opaque pixel",
      "They're two different names for exactly the same rendering problem — both describe wasted GPU work caused by repainting the same already-painted pixels multiple times in the framebuffer",
      "Overdraw only happens in UIKit because CALayer compositing is manual, while blending only happens in SwiftUI's declarative render pass",
      "Blending is cheaper than drawing an opaque layer because it skips the depth test and reuses the existing pixel color directly",
    ],
    answer: 0,
    explanation:
      "Overdraw is about how many times a pixel gets painted in one frame; blending is about the cost of combining a translucent layer with its background (a read-and-combine, not a simple overwrite). Stacked translucent views often cause both at once.",
  },
  {
    id: "render-shadowpath-fill",
    type: "fill",
    prompt: "Setting layer.___ = UIBezierPath(...).cgPath tells the renderer a shadow's exact shape up front, avoiding the cost of computing it from the layer's content every frame.",
    answers: ["shadowPath"],
    hint: "A CALayer property.",
    explanation: "shadowPath gives the renderer a fixed shape to use for the shadow, which is dramatically cheaper than deriving the silhouette from the view's actual content on every frame.",
  },
  {
    id: "render-debug-overlays",
    type: "mcq",
    prompt: "In the Simulator, which debug overlay would you use to visually confirm which views are triggering offscreen rendering?",
    options: [
      "Color Off-screen Rendered — tints affected views yellow",
      "Color Blended Layers — this overlay highlights offscreen rendering by tinting affected views in a distinct red overlay",
      "Slow Animations — it reduces the frame rate to 1Hz, which makes offscreen passes visible as a prolonged black flash",
      "There is no visual way to check offscreen rendering in the Simulator — you must use Instruments' GPU Frame Capture tool",
    ],
    answer: 0,
    explanation:
      "Debug → Color Off-screen Rendered tints views that trigger an offscreen render pass yellow. Color Blended Layers is the separate overlay (tinting red) for overdraw/blending, not offscreen rendering.",
  },
  {
    id: "render-swiftui-reeval-senior",
    type: "predict",
    prompt: "A RowView observes a FeedViewModel with @Published items and @Published scrollOffset, but RowView's body only reads post.title (passed in separately) — it never reads scrollOffset. What happens to RowView while the user scrolls?",
    code: `class FeedViewModel: ObservableObject {
    @Published var items: [Post] = []
    @Published var scrollOffset: CGFloat = 0
}
struct RowView: View {
    @ObservedObject var viewModel: FeedViewModel
    let post: Post
    var body: some View { Text(post.title) }
}`,
    options: [
      "RowView's body re-evaluates on every scrollOffset update even though it never reads that property, because it observes the whole object",
      "RowView never re-evaluates while scrolling because SwiftUI tracks property-level access and skips views that didn't read scrollOffset",
      "Only the first RowView that was created on screen re-evaluates, since it holds the initial observation subscription for that object",
      "SwiftUI automatically skips re-evaluation for any published property a view's body didn't explicitly access during the previous render pass",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Observing an ObservableObject means any @Published change on it triggers re-evaluation of every view holding that observation, regardless of which specific properties the view's body actually reads. Since scrollOffset updates continuously during a scroll, every row re-evaluates on every scroll tick — the fix is passing narrower state (like post alone) instead of the whole view model.",
  },
  {
    id: "render-flashcard",
    type: "flashcard",
    prompt: "Explain what causes a scrolling list to hitch and how you'd diagnose and fix it. Answer aloud, then reveal.",
    modelAnswer:
      "Every screen redraw has a fixed **frame budget** — about 16.7ms at 60Hz, about 8.3ms at 120Hz — and any frame that misses it causes a **hitch**: the previous frame is shown again while the new one lands a cycle late. Two GPU-side costs typically blow the budget on a scrolling list: **offscreen rendering**, where a view (usually one with a shadow or clipped corner radius) has to be drawn into a separate buffer first before compositing, adding a whole extra render pass per view; and **overdraw**/**blending**, where the same pixel gets painted more than once per frame or a translucent layer forces a read-and-combine instead of a cheap overwrite. Diagnose visually first with the Simulator's Color Off-screen Rendered (yellow) and Color Blended Layers (red) overlays, then confirm and localize with Instruments' **Hitches** track, which marks the exact over-budget frame and shows its call stack. Fixes: give shadows a `shadowPath` or bake them into image assets, avoid unnecessary `.opacity()` and transparent backgrounds that are never actually visible, and in SwiftUI specifically watch for **unnecessary re-evaluation** — a leaf view observing a whole `ObservableObject` re-runs its `body` on every `@Published` change to that object, not just the properties it reads, so pass narrower state down instead.",
    keyPoints: [
      "Frame budget ~16.7ms at 60Hz, ~8.3ms at 120Hz; missing it = a hitch",
      "Offscreen rendering: shadows/clipped corners need an extra render pass",
      "Overdraw/blending: repainting pixels, translucent layers cost more than opaque",
      "Diagnose with Color Off-screen Rendered / Color Blended Layers overlays and Instruments' Hitches track",
      "SwiftUI-specific: observing a whole ObservableObject re-evaluates views on unrelated @Published changes",
    ],
    explanation:
      "A senior answer ties the frame budget number to a concrete diagnosis workflow (visual overlays plus Instruments) and names the SwiftUI-specific re-evaluation trap on top of the general offscreen/overdraw causes.",
  },
];

export default quiz;
