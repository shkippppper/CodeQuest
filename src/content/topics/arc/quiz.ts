import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "arc-what",
    type: "mcq",
    prompt: "What does ARC do?",
    options: [
      "Inserts retain/release at compile time to track strong references and deallocate class instances at count 0",
      "Runs a periodic garbage collector at runtime",
      "Manages the stack",
      "Compresses memory",
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
      "Only structs",
      "All types including Int and String values",
      "Only enums",
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
      "After `a = nil`",
      "At the next garbage collection",
      "Never",
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
      "At app termination",
      "Whenever a background GC decides",
      "One run loop later",
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
      "ARC is slower in every case",
      "GC frees memory sooner than ARC always",
      "They are identical",
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
      "ARC is disabled",
      "deinit only runs at app exit",
      "The object was a struct",
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
      "As long as any weak reference points to it",
      "Until the next run loop tick",
      "Only while it's on screen",
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
