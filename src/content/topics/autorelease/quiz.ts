import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ap-what",
    type: "mcq",
    prompt: "What is an autorelease pool?",
    options: [
      "A collection of deferred releases — objects whose `release` fires when the pool drains, not immediately",
      "A pool of reusable threads",
      "A cache of decoded images",
      "A garbage collector",
    ],
    answer: 0,
    explanation:
      "Some objects are returned **autoreleased** — their release is deferred and registered with a pool. When the pool drains, all pending releases are sent. The run loop drains a pool each iteration.",
  },
  {
    id: "ap-drain",
    type: "mcq",
    prompt: "When are objects in a `@autoreleasepool { ... }` block released?",
    options: [
      "When the block exits",
      "At app termination",
      "Immediately when created",
      "Never",
    ],
    answer: 0,
    explanation:
      "A local `@autoreleasepool` drains when its block exits, releasing anything autoreleased inside — rather than waiting for the next run-loop boundary.",
  },
  {
    id: "ap-loop-spike",
    type: "predict",
    prompt: "🧠 Trick question — a tight loop loads a million files and memory balloons. What fixes it?",
    code: `for i in 0..<1_000_000 {
    let data = try Data(contentsOf: url(for: i))  // temporaries pile up
    process(data)
}`,
    options: [
      "Wrap the loop body in `@autoreleasepool { }` so each iteration's temporaries are freed immediately",
      "Add more RAM",
      "Use a Set instead of an Array",
      "Nothing can be done",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Without returning to the run loop, autoreleased temporaries accumulate for the whole loop. Wrapping the body in `@autoreleasepool { ... }` drains each iteration, converting a huge spike into a flat, bounded footprint.",
  },
  {
    id: "ap-runloop-fill",
    type: "fill",
    prompt: "You usually don't manage pools manually because the main thread's ___ loop drains an autorelease pool each iteration.",
    answers: ["run", "runloop", "run loop"],
    hint: "The main event loop.",
    explanation:
      "Each run-loop iteration is wrapped in an autorelease pool, so temporaries created during normal event handling are cleaned up automatically — you only need an explicit pool for work that doesn't return to the run loop.",
  },
  {
    id: "ap-not-cycle",
    type: "mcq",
    prompt: "Will draining an autorelease pool free an object stuck in a retain cycle?",
    options: [
      "No — the object is still strongly referenced; autorelease affects release timing, not ownership",
      "Yes — pools break cycles",
      "Yes, but only on the main thread",
      "Only if it's an NSObject",
    ],
    answer: 0,
    explanation:
      "Autorelease pools defer *releases* for objects that would be freed anyway. A retain cycle keeps a strong reference alive, so no pool drain frees it — you must break the cycle with `weak`/`unowned`.",
  },
  {
    id: "ap-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about autorelease pools.",
    options: [
      "They matter mainly in tight loops and Objective-C/Cocoa bridging",
      "`@autoreleasepool` lets you drain deferred releases early",
      "Autorelease pools are part of ARC, controlling release timing",
      "They fix retain cycles",
    ],
    answers: [0, 1, 2],
    explanation:
      "Loops/bridging, early draining, and being an ARC timing mechanism are correct. They do **not** fix retain cycles (option 3 is false).",
  },
  {
    id: "ap-pure-swift-senior",
    type: "mcq",
    prompt: "Does a loop that only creates pure-Swift objects with `init` usually need `@autoreleasepool`?",
    options: [
      "Often no — ARC releases them promptly; the autorelease behavior comes mainly from Objective-C/Cocoa APIs",
      "Yes, always",
      "Only for structs",
      "Only if the loop runs more than 10 times",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Autorelease is an Objective-C convention for returning temporaries. Pure-Swift objects created via `init` are typically released promptly by ARC and don't accumulate, so an explicit pool is often unnecessary — measure first. It's Foundation/Cocoa calls returning autoreleased objects that cause the spike.",
  },
  {
    id: "ap-background-senior",
    type: "mcq",
    prompt: "Why might background work off the main thread need an explicit `@autoreleasepool`?",
    options: [
      "There's no run loop draining a pool for you, so autoreleased temporaries can accumulate until the work finishes",
      "Background threads can't use ARC",
      "The main thread blocks otherwise",
      "It speeds up the CPU",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The main run loop drains a pool each cycle, but a long-running background task doesn't get that automatic draining. Wrapping its work (especially loops touching Cocoa APIs) in `@autoreleasepool` keeps its memory bounded.",
  },
  {
    id: "ap-timing-senior",
    type: "mcq",
    prompt: "What does autorelease control, fundamentally?",
    options: [
      "The TIMING of releases (deferred to a pool drain), not object ownership or strong/weak semantics",
      "Whether an object is strong or weak",
      "The order objects are allocated",
      "Thread affinity",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Autorelease is purely about *when* a release happens — deferring it to a pool drain instead of firing immediately. It doesn't change ownership, reference qualifiers, or fix cycles; it just moves the release in time.",
  },
  {
    id: "autorelease-flashcard",
    type: "flashcard",
    prompt:
      "Explain autorelease pools: what they are, when they matter, and their relationship to ARC. Answer aloud, then reveal.",
    modelAnswer:
      "An **autorelease pool** is a stack of **deferred releases**: some objects (notably from Objective-C/Cocoa) are returned **autoreleased**, so their `release` fires when the pool **drains** rather than immediately. The main thread's **run loop drains a pool each iteration**, so temporaries from normal event handling are cleaned up automatically and you rarely think about it. The problem is a **tight loop that doesn't return to the run loop** (image processing, parsing thousands of files, background work) — autoreleased temporaries **accumulate** into a memory spike. The fix is wrapping the loop body in **`@autoreleasepool { ... }`**, which drains at the end of each iteration, turning a spike into a flat footprint. It matters mainly for **loops with many temporaries** and **ObjC/Cocoa bridging**; **pure-Swift `init` objects** are usually released promptly by ARC and don't need a pool (measure first). Autorelease pools are **part of ARC** — ARC just sometimes chooses to *autorelease* (defer) instead of *release* (immediate) and inserts the drain calls. Crucially, they control **release timing**, not ownership: `@autoreleasepool` will **not** break a retain cycle or change strong/weak semantics — a strongly-referenced (leaked) object won't be freed by a drain.",
    keyPoints: [
      "Autorelease = deferred release, fired when the pool drains",
      "Run loop drains a pool each iteration → usually automatic",
      "Tight loops w/o run loop pile up temporaries → wrap body in @autoreleasepool",
      "Matters for loops + ObjC/Cocoa bridging; pure-Swift init usually fine",
      "Part of ARC, controls release TIMING; doesn't fix cycles/ownership",
    ],
    explanation:
      "Senior answers stress the loop/bridging use case, that pure-Swift objects usually don't need it, and that it's about release timing (not fixing cycles or changing ownership).",
  },
];

export default quiz;
