import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "buildtime-diagnose-mcq",
    type: "mcq",
    prompt: "What's the recommended first step when investigating a slow Swift build?",
    options: [
      "Measure with Xcode's build timing summary and compiler flags like `-warn-long-expression-type-checking` before changing anything",
      "Immediately split the app into more modules so each compiles independently on a separate CPU core",
      "Enable Whole Module Optimization in Debug to let the compiler skip unchanged function bodies entirely",
      "Delete derived data and perform a full clean build on every single run so you have a reproducible, cache-free baseline measurement to compare against",
    ],
    answer: 0,
    explanation:
      "Guessing at the cause wastes more time than measuring it. The build timing summary and the `-warn-long-*` compiler flags point directly at the slow files, functions, or expressions before you touch project structure.",
  },
  {
    id: "buildtime-flag-fill",
    type: "fill",
    prompt: "The Swift compiler flag `-Xfrontend -warn-long-expression-___-checking=100` warns when a single expression takes over 100ms to resolve its types.",
    answers: ["type"],
    hint: "It's about what the compiler is checking, not what it's compiling.",
    explanation:
      "`-warn-long-expression-type-checking` prints a warning with the exact line and duration whenever type inference on one expression exceeds the given millisecond threshold.",
  },
  {
    id: "buildtime-inference-predict",
    type: "predict",
    prompt: "Which of these two lines is slower to type-check?",
    code: `let a = 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10

let b: Int = 1
let c = b + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10`,
    options: [
      "`a` — every literal is untyped, forcing a combinatorial search over overload/type possibilities",
      "`c` — each additional named binding introduces a separate type-check scope that the compiler resolves sequentially",
      "They take identical time because the Swift type checker caches literal type decisions across the whole file",
      "Neither compiles because chaining more than nine numeric literals in one expression is a language-level restriction",
    ],
    answer: 0,
    explanation:
      "Anchoring `b` to a concrete `Int` gives the type checker a starting point, collapsing the search. Without any annotation, `a`'s untyped literal chain forces the checker to explore many operator-overload and literal-type combinations together.",
  },
  {
    id: "buildtime-module-mcq",
    type: "mcq",
    prompt: "Why does splitting a large app into feature modules speed up team builds?",
    options: [
      "A module's compiled public interface acts as a cache boundary — unrelated modules don't get invalidated by changes elsewhere",
      "Modules always compile fully in parallel with zero additional configuration required from either the developer or the underlying build system",
      "Modules disable cross-file type inference entirely, so the type checker only needs to resolve one file at a time",
      "It has no measurable build-time effect whatsoever and only provides organizational and namespace benefits",
    ],
    answer: 0,
    explanation:
      "Once a module is compiled, its `public`/`open` interface is cached. Other modules that depend on it don't get rebuilt just because unrelated internal files changed inside it — a real caching boundary that a single giant app target doesn't have.",
  },
  {
    id: "buildtime-incremental-multi",
    type: "multi",
    prompt: "Select all statements that are true of Swift's incremental build system.",
    options: [
      "Changing a function's body without changing its signature can avoid invalidating its callers",
      "Changing a public function's signature can cascade into recompiling every caller",
      "Bridging headers let the compiler track dependencies as finely as pure Swift files",
      "A Clean Build Folder throws away all incremental caching",
    ],
    answers: [0, 1, 3],
    explanation:
      "Incremental builds track dependencies at declaration granularity — body-only changes often don't ripple, but signature changes do. Bridging headers/Objective-C interop are the opposite of fine-grained: any change to a referenced header can invalidate every Swift file that imports the bridging header (option 2 is false).",
  },
  {
    id: "buildtime-wmo-fill",
    type: "fill",
    prompt: "Compiling an entire module as one unit, so the optimizer can inline and optimize across file boundaries, is called ___ module optimization.",
    answers: ["whole"],
    hint: "The setting's name literally describes its scope.",
    explanation:
      "Whole Module Optimization (WMO) treats the module as a single compilation unit, enabling cross-file inlining and faster generated code — at the cost of losing per-file incremental rebuilds.",
  },
  {
    id: "buildtime-wmo-debug-senior",
    type: "mcq",
    prompt: "Why is enabling Whole Module Optimization in a Debug configuration usually a mistake?",
    options: [
      "It sacrifices incremental rebuilds — the fast edit-compile-run loop — for a runtime optimization nobody benefits from until Release ships",
      "WMO is not supported outside of Release builds; the compiler silently ignores the flag in Debug configurations",
      "It causes repeated compiler crashes because the whole-module dependency graph exceeds the default memory limit",
      "It has absolutely zero measurable effect on build times in either direction, so enabling WMO in a Debug configuration is a completely harmless no-op",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Debug's whole point is fast iteration; WMO removes the file-by-file caching that makes incremental Debug builds quick, in exchange for optimized code that only matters for a shipped Release binary — a bad trade during active development.",
  },
  {
    id: "buildtime-signature-vs-body-senior",
    type: "predict",
    prompt: "In this two-file setup, which edit is more likely to trigger a rebuild of FileB.swift?",
    code: `// FileA.swift
func fetchUser(id: String) -> User {
    // ... body ...
}

// FileB.swift
let user = fetchUser(id: "42")`,
    options: [
      "Changing fetchUser's parameter list or return type — a signature change invalidates known callers",
      "Changing only a comment or a local variable name that is private to fetchUser's body",
      "Both changes always trigger identical rebuild scope because Swift tracks file-level dependencies, not declaration-level ones",
      "Neither change can ever cause FileB.swift to recompile since it only reads the function result, not the definition",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Swift's incremental build tracks dependencies at the declaration level. FileB depends on fetchUser's signature, not its implementation, so body-only edits typically leave FileB's compiled state valid while signature changes invalidate it.",
  },
  {
    id: "buildtime-flashcard",
    type: "flashcard",
    prompt: "Explain how to diagnose and fix slow Swift build times end to end. Answer aloud, then reveal.",
    modelAnswer:
      "Start by measuring, not guessing: Xcode's **build timing summary** shows per-target/per-file compile time, and the compiler flags `-warn-long-function-bodies`/`-warn-long-expression-type-checking` pinpoint specific slow functions and expressions with a millisecond threshold. Slow expressions are usually a **type-inference** problem — untyped chains of operator overloads and numeric literals force the type checker into a combinatorial search over possible interpretations; an explicit type annotation anchors the search and collapses it. At the architecture level, a **module** boundary caches a compiled `public` interface, so splitting a large single-target app into feature modules stops unrelated changes from invalidating each other's builds — this is the highest-leverage structural fix for team build times. Within a module, Swift's **incremental build** system tracks dependencies at the declaration level: changing a function's body typically doesn't invalidate its callers, but changing its signature does; bridging headers defeat this fine-grained tracking because Objective-C interop can't be tracked as precisely. Finally, **Whole Module Optimization (WMO)** compiles the whole module as one unit for better runtime performance via cross-file inlining, but sacrifices incremental rebuilds — which is exactly why Debug defaults to Incremental and Release defaults to WMO.",
    keyPoints: [
      "Measure first: build timing summary + -warn-long-expression-type-checking / -warn-long-function-bodies",
      "Untyped literal/operator chains cause combinatorial type-checker search — annotate to fix",
      "Module boundaries cache compiled public interfaces, isolating unrelated changes",
      "Incremental builds track declaration-level deps: signature changes cascade, body changes often don't",
      "Bridging headers defeat fine-grained incremental tracking",
      "WMO trades incrementality for cross-file runtime optimization — right for Release, wrong for Debug",
    ],
    explanation:
      "A senior answer connects each diagnostic tool to the underlying compiler behavior it's exposing, and distinguishes build-time fixes (modules, incremental builds) from runtime-performance fixes (WMO) rather than conflating them.",
  },
];

export default quiz;
