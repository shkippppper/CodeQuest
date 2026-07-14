import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "modularization-build-time",
    type: "mcq",
    prompt: "How does modularization primarily help build times?",
    options: [
      "Editing one module recompiles only that module and its dependents, not the whole app",
      "It disables the type checker so the compiler can skip semantic analysis and produce a binary purely from the parsed syntax tree without validating types",
      "It removes the need to compile Swift because each module is precompiled to a binary framework that the linker can include without touching the source files",
      "It caches the app binary in the cloud so CI machines can download a pre-built artifact instead of compiling from scratch on each pull request run",
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
      "It makes everything public by default, removing the need to annotate each declaration and letting the compiler infer the widest possible visibility for all types",
      "It disables access control entirely, because module boundaries already enforce separation and duplicating access control on top of them is redundant",
      "`private` starts working across files within a module, allowing types in different source files to share private implementation details without needing internal",
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
      "The place where all business logic lives, because the App target is the only module that can access every feature and therefore the only safe home for cross-cutting rules",
      "A core module every feature imports to access shared types, networking utilities, and design system components that are needed across the whole app",
      "The networking layer that owns URLSession, authentication tokens, and request retry logic so that feature modules do not need to manage HTTP concerns directly",
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
      "It builds but runs slowly because the compiler must repeatedly resolve each module against the other until a fixed point is reached, adding significant overhead",
      "SPM merges them automatically into a single combined module with a synthesized interface that exports all public declarations from both originals",
      "Nothing — cycles are fine as long as neither module imports the other's internal types directly, only its public protocol conformances",
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
      "Import the Profile module into Feed directly, accepting the coupling as a necessary cost since navigation inherently requires knowledge of the destination screen's public interface",
      "Make both modules public, because public visibility removes the dependency constraint and allows unrestricted cross-module type access without explicit imports",
      "Put Feed and Profile in one module, since tightly related features that navigate to each other are by definition a single bounded context and should share a module boundary",
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
      "It is impossible to have too many modules, because the Swift compiler handles arbitrarily large dependency graphs without any performance degradation",
      "It makes access control stop working because public declarations in one module become invisible to modules that import it",
      "It removes the ability to write unit tests, because XCTest cannot import targets that are structured as standalone Swift packages",
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
      "Core modules → features, so that the core can trigger feature-specific behavior without requiring the feature to import the core first",
      "Every module → every other module, because maximizing cross-module awareness reduces code duplication and keeps shared logic in one place",
      "Direction does not matter as long as every module boundary is guarded by access control and no public types escape their intended scope",
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
