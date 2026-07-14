import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "spm-manifest-role",
    type: "mcq",
    prompt: "What is the role of `Package.swift`?",
    options: [
      "A Swift file, evaluated by the compiler, that describes a package's targets, products, and dependencies",
      "A JSON configuration file that Xcode reads to configure the project's build settings and dependency graph",
      "A shell script that SPM executes as a pre-build phase before compiling any target source files",
      "A plain text file that lists only the remote third-party dependency URLs, with versions managed separately",
    ],
    answer: 0,
    explanation:
      "`Package.swift` is real Swift code using the `PackageDescription` API. SPM evaluates it to learn the package's name, targets, products, dependencies, and platform requirements.",
  },
  {
    id: "spm-target-vs-product",
    type: "mcq",
    prompt: "What's the difference between a target and a product in SPM?",
    options: [
      "A target is a compiled module of source files; a product is what's exposed for consumers to import",
      "They're two names for the same concept — SPM uses them interchangeably throughout the PackageDescription API",
      "A product contains the raw source code while a target is the compiled binary artifact that SPM caches between builds",
      "Targets are exclusively for app executables, while products are exclusively for library modules consumed by other packages",
    ],
    answer: 0,
    explanation:
      "A target compiles a folder of source files as a unit. A product (like `.library`) exposes one or more targets to consumers. A target with no product stays an internal implementation detail.",
  },
  {
    id: "spm-missing-dependency-predict",
    type: "predict",
    prompt: "`Networking` imports a type from `NetworkingCore`, but the manifest is missing the dependency link. What happens?",
    code: `targets: [
    .target(name: "NetworkingCore"),
    .target(name: "Networking"), // no dependencies: ["NetworkingCore"]
]`,
    options: [
      "Compile error in Networking — SPM only links targets explicitly listed as dependencies",
      "It compiles fine because SPM scans adjacent target folders and automatically links any types it finds imported",
      "SPM auto-detects the import statement and silently adds the missing dependency link to the resolved graph",
      "It links successfully in Release builds only; Debug builds enforce explicit dependency declarations more strictly",
    ],
    answer: 0,
    explanation:
      "SPM never infers dependencies from folder layout or import statements. Without `dependencies: [\"NetworkingCore\"]` on the `Networking` target, the build fails even though the code sits right next door.",
  },
  {
    id: "spm-resolved-fill",
    type: "fill",
    prompt: "SPM pins exact resolved dependency versions in a lockfile called Package.___.",
    answers: ["resolved", "Package.resolved"],
    hint: "Same word used for conflict resolution.",
    explanation:
      "`Package.resolved` records the exact version (and commit) picked for every dependency, so builds are reproducible across machines and CI runs. It should be committed to source control.",
  },
  {
    id: "spm-version-rules-multi",
    type: "multi",
    prompt: "Select **all** true statements about SPM dependency version requirements.",
    options: [
      "`from: \"1.5.0\"` allows any compatible version up to but not including 2.0.0",
      "`exact:` pins a single specific version",
      "`branch:` gives fully reproducible builds because the branch name never changes",
      "A range like `\"1.0.0\"..<\"1.8.0\"` is a valid requirement",
    ],
    answers: [0, 1, 3],
    explanation:
      "`from:` follows semantic versioning up to (not including) the next major version. `exact:` pins one version. Explicit ranges are valid. `branch:` is **not** reproducible — the branch's underlying commits change over time even though the name stays the same.",
  },
  {
    id: "spm-path-dependency",
    type: "mcq",
    prompt: "What happens when a package dependency is declared with `.package(path: \"../NetworkingKit\")`?",
    options: [
      "SPM builds directly from that filesystem path with no version resolution, live",
      "SPM still resolves and records a pinned version in Package.resolved, using the local folder's git tag as the version",
      "It only works if the path points to a directory containing a valid Git repository with at least one tagged commit",
      "It is functionally identical to a `url:` dependency but resolves faster since no network fetch is required",
    ],
    answer: 0,
    explanation:
      "A `path:` dependency skips version resolution entirely — SPM compiles whatever is currently on disk. It's a local-development convenience and isn't portable to teammates without that same folder layout.",
  },
  {
    id: "spm-resources-fill",
    type: "fill",
    prompt: "A target that bundles resources gets a synthesized ___.module accessor to locate them at runtime.",
    answers: ["Bundle"],
    hint: "The Foundation type used to locate bundled files.",
    explanation:
      "Declaring `resources: [.process(...)]` or `.copy(...)` on a target makes SPM synthesize `Bundle.module`, which your code uses to find the bundled files at runtime.",
  },
  {
    id: "spm-tools-version-senior",
    type: "predict",
    prompt: "Why does the `// swift-tools-version:5.9` line at the top of the manifest matter more than an ordinary comment?",
    code: `// swift-tools-version:5.9
import PackageDescription`,
    options: [
      "SPM parses it before compiling the manifest to select which PackageDescription API version is available",
      "It's purely documentation with no effect on the build; SPM ignores comments and infers the tools version from the Swift compiler",
      "It sets the minimum iOS deployment target for all platforms declared in the manifest's platforms array",
      "It controls which Swift compiler version is used to optimize the package's final binary output",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "SPM reads the tools-version comment before evaluating the rest of the manifest. It picks the matching `PackageDescription` API surface — use APIs from a newer tools version than declared and the manifest itself fails to compile.",
  },
  {
    id: "spm-flashcard",
    type: "flashcard",
    prompt:
      "Explain how Swift Package Manager turns a Package.swift manifest into a buildable, versioned dependency graph. Answer aloud, then reveal.",
    modelAnswer:
      "**Swift Package Manager** reads `Package.swift`, a Swift file evaluated using the `PackageDescription` API, guarded by a **`swift-tools-version`** comment that selects which API surface is available. The manifest declares **targets** — folders of source compiled as units, linked to each other only via explicit `dependencies:` entries, never by folder proximity or imports. **Products**, like `.library`, expose a subset of targets to external consumers; targets left off every product stay internal implementation details. External dependencies are declared with a Git `url:` and a version requirement (`from:`, `exact:`, a range, or `branch:`), and SPM resolves compatible versions for the whole graph, recording exact pins in **`Package.resolved`** — a lockfile that must be committed for reproducible builds. During local development, a `.package(path:)` dependency skips resolution entirely and builds live off disk, which is convenient but not portable to teammates. Targets can also declare `resources:` (`.process` or `.copy`), which synthesizes a `Bundle.module` accessor, and can run **plugins** — small programs SPM executes during the build, either generating source (build-tool plugins) or running on demand (command plugins).",
    keyPoints: [
      "Package.swift is Swift code gated by swift-tools-version",
      "Targets are compiled units; products expose targets to consumers",
      "Dependencies must be explicit — no inference from folders or imports",
      "Package.resolved pins versions for reproducible builds; commit it",
      "path: dependencies skip resolution and build live from disk",
      "resources: + Bundle.module; plugins run during the build, not in the shipped binary",
    ],
    explanation:
      "A senior answer connects the manifest, target/product distinction, dependency resolution, and the resolved-lockfile reproducibility story in one coherent picture.",
  },
];

export default quiz;
