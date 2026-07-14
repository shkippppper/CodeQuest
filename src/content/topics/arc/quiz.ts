import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "arc-what",
    type: "mcq",
    prompt: "What does ARC do?",
    options: [
      "Inserts retain/release at compile time to track strong references and deallocate class instances at count 0",
      "Runs a periodic garbage collector at runtime that pauses the app in order to trace and then reclaim unreachable objects",
      "Manages the stack, deciding when local value types are pushed or popped during function calls",
      "Compresses heap memory by relocating live objects to remove fragmentation between allocations",
    ],
    answer: 0,
    explanation:
      "ARC is compile-time automatic reference counting: the compiler adds the retain/release calls, tracks strong references to class instances, and frees an object the instant its count reaches zero.",
  },
  {
    id: "arc-reference-types",
    type: "mcq",
    prompt: "Which kinds of types does ARC apply to?",
    options: [
      "Reference types — classes, actors, and closures",
      "Only structs, since value-type copies need reference counting to track how many owners are sharing the buffer",
      "All types including Int, Double, Bool, and String values, which are boxed on the heap when passed to functions",
      "Only enums with associated values, because plain enums are inlined and never heap-allocated by the compiler",
    ],
    answer: 0,
    explanation:
      "ARC counts references to **reference types**. Value types (structs/enums) are copied, not reference-counted — though a struct can contain a class that ARC tracks.",
  },
  {
    id: "arc-count-predict",
    type: "predict",
    prompt: "When does the Person deinit run?",
    code: `class Person { deinit { print("gone") } }
var a: Person? = Person()   // count 1
var b = a                   // count 2
a = nil                     // count 1
b = nil                     // count ?`,
    options: [
      "After `b = nil` — the count hits 0 and deinit runs immediately",
      "After `a = nil` — that drops the count to zero because `b` is a weak reference and doesn't count",
      "At the next garbage collection cycle, whenever the runtime decides to schedule it after both references drop",
      "Never — deinit only runs for class instances that have at least one override, not the default implementation",
    ],
    answer: 0,
    explanation:
      "Two strong references (`a`, `b`) make the count 2. `a = nil` → 1, `b = nil` → 0, so the instance deallocates right then and `deinit` prints. Deallocation is deterministic.",
  },
  {
    id: "arc-weak-count-fill",
    type: "fill",
    prompt: "A ___ reference (or an unowned one) does NOT increase the reference count, so it won't keep the object alive.",
    answers: ["weak"],
    hint: "The opposite of strong.",
    explanation:
      "`weak` and `unowned` references don't bump the count — that's how they avoid keeping an object alive and how you break retain cycles.",
  },
  {
    id: "arc-deinit-timing",
    type: "mcq",
    prompt: "When does an object's `deinit` run?",
    options: [
      "Immediately when the last strong reference goes away (deterministic)",
      "At app termination, when the OS reclaims all memory from the process regardless of reference counts",
      "Whenever a background garbage collection pass decides the object is eligible for collection",
      "One run loop iteration later, after the current event has finished processing and the pool has drained",
    ],
    answer: 0,
    explanation:
      "`deinit` runs synchronously the moment the reference count hits 0 — precise, deterministic timing that lets you rely on it for resource cleanup.",
  },
  {
    id: "arc-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about ARC.",
    options: [
      "ARC deallocates deterministically when the strong count reaches 0",
      "ARC cannot automatically reclaim reference cycles",
      "weak/unowned references increment the reference count",
      "ARC applies to classes, not to value types",
    ],
    answers: [0, 1, 3],
    explanation:
      "Deterministic deallocation, no auto cycle collection, and reference-type-only are correct. `weak`/`unowned` do **not** increment the count (option 3 is false).",
  },
  {
    id: "arc-vs-gc-senior",
    type: "mcq",
    prompt: "What's a key difference between ARC and a tracing garbage collector?",
    options: [
      "ARC frees deterministically with no collection pauses but can't collect cycles; a GC handles cycles but frees non-deterministically",
      "ARC is slower in every measurable case because retain/release calls add overhead to every assignment and function call",
      "A garbage collector always frees memory sooner than ARC does, because it runs speculatively before counts reach zero",
      "They are effectively identical — ARC is really just a compile-time shorthand that the runtime later converts into the very same tracing GC algorithm",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "ARC has predictable, immediate deallocation and no stop-the-world pauses, but it **can't detect reference cycles** — you must break them with `weak`/`unowned`. A tracing GC reclaims cycles automatically but runs non-deterministically with collection overhead.",
  },
  {
    id: "arc-deinit-never-senior",
    type: "predict",
    prompt: "🧠 Trick question — a class's `deinit` never prints even after you drop every obvious reference. Most likely cause?",
    code: `// all local references set to nil, yet deinit never runs`,
    options: [
      "A retain cycle (two objects strongly referencing each other, or a closure capturing self) keeps the count above 0",
      "ARC is disabled in the current build configuration, so the compiler never inserts the release calls that trigger deinit",
      "deinit only runs at app exit after the OS sends the termination signal and the app's cleanup handlers finish",
      "The object was declared as a struct instead of a class, and structs don't have deinit or reference counting at all",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "If `deinit` doesn't fire, something still holds a **strong** reference. The usual culprit is a **retain cycle** — e.g. two objects owning each other, or an escaping closure capturing `self` strongly — keeping the count above zero. Use the Memory Graph Debugger to find the strong path.",
  },
  {
    id: "arc-graph-senior",
    type: "mcq",
    prompt: "In graph terms, when is an object kept alive under ARC?",
    options: [
      "As long as there's a strong reference path to it from a live root",
      "As long as any weak or unowned reference points to it, because those still appear in the reference graph",
      "Until the next run loop tick, when the runtime checks for objects whose strong count recently dropped to zero",
      "Only while it's currently visible on screen, because the view hierarchy holds the only strong reference to it",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "An object survives while it's reachable via a **strong** path from a live root (local var, global, on-screen VC). Weak references don't keep it alive. A strong cycle keeps its members alive even after all external references are gone — the Memory Graph Debugger visualizes exactly this.",
  },
  {
    id: "arc-flashcard",
    type: "flashcard",
    prompt:
      "Explain ARC: what it does, determinism, and how it differs from GC. Answer aloud, then reveal.",
    modelAnswer:
      "**ARC (Automatic Reference Counting)** has the compiler insert **retain/release** calls at **compile time**, tracking the number of **strong** references to each **class instance** (also actors/closures — not value types). When the strong count reaches **0**, the object is **deallocated immediately** and its **`deinit`** runs synchronously — deterministic timing you can rely on for cleanup. `weak`/`unowned` references **don't** increment the count, which is how you avoid keeping objects alive. Versus a tracing **garbage collector**: ARC frees **deterministically** with **no collection pauses**, but it **cannot detect reference cycles** — a GC can — so breaking cycles (with `weak`/`unowned`) is **your** responsibility. Think of objects as a graph of strong references: an object lives while reachable via a strong path from a live root; a strong cycle (A→B→A) keeps its members alive even after all external references drop. The practical tell for a leak is a **`deinit` that never fires** — something still holds a strong reference (usually a retain cycle) — and Xcode's **Memory Graph Debugger** shows the strong path keeping it alive.",
    keyPoints: [
      "Compile-time retain/release; counts strong refs to class instances",
      "Count 0 → immediate, deterministic deallocation + deinit",
      "weak/unowned don't increment the count",
      "ARC vs GC: deterministic/no pauses BUT can't collect cycles (you break them)",
      "deinit never firing = strong ref still held (retain cycle); use Memory Graph Debugger",
    ],
    explanation:
      "Senior answers stress deterministic deallocation, the ARC-can't-collect-cycles vs GC distinction, and deinit-never-runs as the retain-cycle tell.",
  },
];

export default quiz;
