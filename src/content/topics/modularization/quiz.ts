import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "modularization-build-time",
    type: "mcq",
    prompt: "How does modularization primarily help build times?",
    options: [
      "Editing one module recompiles only that module and its dependents, not the whole app",
      "It disables the type checker",
      "It removes the need to compile Swift",
      "It caches the app binary in the cloud",
    ],
    answer: 0,
    explanation:
      "With modules, incremental builds localize recompilation to the changed module and whatever depends on it — a big speedup versus one giant target where many changes rebuild the world.",
  },
  {
    id: "modularization-access",
    type: "mcq",
    prompt: "Why does splitting into modules make access control meaningful?",
    options: [
      "Across modules, only `public` is visible — `internal` implementation is truly hidden from consumers",
      "It makes everything public by default",
      "It disables access control",
      "`private` starts working across files",
    ],
    answer: 0,
    explanation:
      "In a single target, `internal` (the default) spans the whole app. Across modules, `internal` is confined to its module, so you deliberately expose a small **public** API and hide the rest — the compiler now enforces boundaries.",
  },
  {
    id: "spm-fill",
    type: "fill",
    prompt: "The modern Apple tool for defining modules as targets/products with explicit dependencies is Swift ___ Manager (SPM).",
    answers: ["Package", "package"],
    hint: "Swift ___ Manager.",
    explanation:
      "Swift Package Manager defines each module as a target in `Package.swift` with declared dependencies, making the dependency graph explicit and compiler-checked.",
  },
  {
    id: "feature-modules",
    type: "mcq",
    prompt: "In a typical modular iOS app, what is the App target's role?",
    options: [
      "A thin shell that composes feature modules together (the composition root)",
      "The place where all business logic lives",
      "A core module every feature imports",
      "The networking layer",
    ],
    answer: 0,
    explanation:
      "The App becomes a thin shell wiring features together on top of shared core modules. Features are self-contained and generally don't depend on each other directly.",
  },
  {
    id: "modularization-cycle",
    type: "mcq",
    prompt: "What happens if two modules depend on each other (a circular dependency)?",
    options: [
      "It won't link — module dependency graphs must be acyclic (a DAG)",
      "It builds but runs slowly",
      "SPM merges them automatically",
      "Nothing — cycles are fine",
    ],
    answer: 0,
    explanation:
      "Circular **module** dependencies don't link and signal tangled design. Keep the graph a DAG; break feature↔feature cycles by depending on a shared abstraction instead of importing each other.",
  },
  {
    id: "modularization-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about modularization.",
    options: [
      "Cross-module access control forces you to design a small public API per module",
      "Feature modules should ideally avoid depending directly on each other",
      "More modules always means faster clean builds",
      "SPM makes the dependency graph explicit and compiler-checked",
    ],
    answers: [0, 1, 3],
    explanation:
      "Public-API discipline, avoiding feature↔feature deps, and explicit SPM graphs are all correct. Clean builds can get *slightly slower* with many targets (linking overhead); it's **incremental** builds that win (option 3 is false).",
  },
  {
    id: "feature-to-feature-senior",
    type: "predict",
    prompt: "🧠 Trick question — Feed needs to open a Profile screen. What's the clean way to avoid coupling the Feed module to the Profile module?",
    code: `// Feed module must NOT import Profile module directly`,
    options: [
      "Depend on a protocol in a shared interfaces module that Profile implements; inject the implementation at the app level",
      "Import the Profile module into Feed",
      "Make both modules public",
      "Put Feed and Profile in one module",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Direct feature↔feature imports create coupling and risk cycles. Instead, Feed depends on an **abstraction** (e.g. a `ProfileRouting` protocol) declared in a shared module; Profile provides the concrete implementation, wired at the **composition root**. Features stay independent and the graph stays acyclic.",
  },
  {
    id: "over-modularization-senior",
    type: "mcq",
    prompt: "What's the downside of over-modularizing (many tiny modules)?",
    options: [
      "Added wiring, cross-module type mapping, and per-module overhead — and clean builds can slow down",
      "It's impossible to have too many modules",
      "It makes access control stop working",
      "It removes the ability to test",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Every module has fixed overhead (manifest, public API, wiring). Splitting too finely adds boilerplate and linking cost without cohesion benefits. Modularize into **cohesive units**, not one-file packages.",
  },
  {
    id: "dependency-direction-senior",
    type: "mcq",
    prompt: "Which direction should dependencies point in a healthy modular graph?",
    options: [
      "Features → stable core modules; never core → features",
      "Core modules → features",
      "Every module → every other module",
      "It doesn't matter",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Dependencies should flow toward **stable, low-level core** modules (Networking, Models, DesignSystem). A core module depending back up on a feature creates cycles and instability — the same 'depend on stable abstractions' idea as Clean Architecture, at the module scale.",
  },
  {
    id: "modularization-flashcard",
    type: "flashcard",
    prompt:
      "Why modularize an app, and what keeps a modular codebase healthy? Answer aloud, then reveal.",
    modelAnswer:
      "**Modularization** splits an app into modules (SPM targets/packages): a thin **App** shell composing **feature** modules on top of shared **core** modules (Networking, DesignSystem, Models). Benefits: faster **incremental builds** (only the changed module + dependents recompile), **enforced boundaries** (across modules only `public` is visible, so `internal` implementation is truly hidden — access control gains teeth), and **team scalability** (parallel work, isolated build/test). Keep it healthy by keeping the **dependency graph acyclic** — circular module deps **won't link** — and by having features depend on **abstractions** (a protocol in a shared module, implementation injected at the composition root) rather than importing each other; dependencies should point toward **stable core** modules, never core→feature. Caveat: **over-modularization** (many tiny modules) adds wiring/mapping overhead and can slow clean builds, so split into cohesive units, not for its own sake.",
    keyPoints: [
      "SPM modules: thin App shell + feature modules + shared core",
      "Wins: incremental build speed, real boundaries (public API), team scale",
      "Graph must be acyclic — circular module deps don't link",
      "Avoid feature↔feature coupling via shared abstractions + injection",
      "Deps point toward stable core; don't over-modularize",
    ],
    explanation:
      "Senior answers cite incremental (not clean) build wins, access-control-as-boundary-enforcement, the acyclic-graph/feature-decoupling rules, and the over-modularization caveat.",
  },
];

export default quiz;
