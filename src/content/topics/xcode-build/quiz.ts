import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "xb-target-membership",
    type: "mcq",
    prompt: "You add a new Swift file to the project, but the app fails to see the type it defines. Most likely cause?",
    options: [
      "The file's Target Membership checkbox isn't checked for the app target",
      "Xcode needs to be restarted",
      "Swift files must be added via a Run Script phase",
      "The file needs its own scheme",
    ],
    answer: 0,
    explanation:
      "Adding a file to the project navigator doesn't automatically compile it into every target. Target Membership (in the File Inspector) decides which target(s) actually build the file.",
  },
  {
    id: "xb-scheme-vs-config",
    type: "mcq",
    prompt: "What's the relationship between a scheme and a build configuration?",
    options: [
      "A scheme decides which configuration each action (run/test/archive) uses; they're independent settings",
      "They're the same thing, just different names",
      "A configuration always determines exactly one scheme",
      "Schemes only exist for Release builds",
    ],
    answer: 0,
    explanation:
      "A configuration is a named bag of build setting values (Debug/Release). A scheme maps each action — Run, Test, Profile, Analyze, Archive — to a configuration and a set of targets. You can even point Run at Release if needed.",
  },
  {
    id: "xb-profile-predict",
    type: "predict",
    prompt: "Code inside `#if DEBUG { print(\"verbose log\") }` — you run the Profile action in Instruments. Does the log print?",
    code: `#if DEBUG
print("verbose log")
#endif`,
    options: [
      "No — Profile builds with the Release configuration by default, where DEBUG isn't defined",
      "Yes — Profile always uses Debug",
      "Only on the first run",
      "It crashes",
    ],
    answer: 0,
    explanation:
      "The Profile action builds Release by default, so `DEBUG` isn't defined and the block is compiled out entirely — a common surprise when debug-only logging vanishes under Instruments.",
  },
  {
    id: "xb-xcconfig-fill",
    type: "fill",
    prompt: "Build settings can be defined as plain, diffable text in a file with the ___ extension instead of clicking through the GUI.",
    answers: ["xcconfig", ".xcconfig"],
    hint: "Assigned to a configuration under Project > Info > Configurations.",
    explanation:
      "An `.xcconfig` file holds KEY = value build settings as plain text — reviewable in a pull request, unlike the sprawling XML of `project.pbxproj`. It's the standard way to manage per-environment settings.",
  },
  {
    id: "xb-optimization-multi",
    type: "multi",
    prompt: "Select **all** true statements about `SWIFT_OPTIMIZATION_LEVEL`.",
    options: [
      "Debug typically uses -Onone for fast, debuggable builds",
      "Release typically uses -O for aggressive optimization",
      "It has no effect on whether a bug reproduces",
      "A bug can appear only in Release because -O reorders/inlines code differently than -Onone",
    ],
    answers: [0, 1, 3],
    explanation:
      "`-Onone` (Debug) disables optimization for fast builds and reliable debugging; `-O` (Release) aggressively optimizes and can expose latent bugs — like code relying on unspecified evaluation order — that Debug's simpler codegen hid.",
  },
  {
    id: "xb-run-script-inputs",
    type: "mcq",
    prompt: "A Run Script build phase reruns on every single build, even when nothing relevant changed. What's the likely fix?",
    options: [
      "Declare explicit Input/Output Files so Xcode can skip the phase when nothing changed",
      "Move the script to the end of Compile Sources",
      "Rename the script phase",
      "Disable the scheme's Test action",
    ],
    answer: 0,
    explanation:
      "Without declared Input/Output Files, Xcode can't tell whether the script's inputs changed, so it reruns it every build. Declaring them (plus \"Based on dependency analysis\") lets Xcode skip the phase when nothing relevant changed.",
  },
  {
    id: "xb-workspace-purpose",
    type: "mcq",
    prompt: "Why would you open a `.xcworkspace` instead of the `.xcodeproj` inside it?",
    options: [
      "A workspace lets targets in separate .xcodeproj files reference each other and share a build folder",
      "A workspace is required for every Xcode project, even single-project ones",
      "Workspaces replace schemes entirely",
      "It's purely cosmetic — no functional difference",
    ],
    answer: 0,
    explanation:
      "A project only knows about its own targets. A workspace groups multiple .xcodeproj files (and Swift packages) so cross-project dependencies resolve — this is what CocoaPods sets up automatically, and what multi-project setups need by hand.",
  },
  {
    id: "xb-no-such-module-senior",
    type: "predict",
    prompt: "\"No such module 'NetworkingKit'\" appears even though NetworkingKit.swift compiles fine on its own. What's the most likely root cause?",
    code: `import NetworkingKit // error: No such module 'NetworkingKit'`,
    options: [
      "The importing target is missing a dependency link or the framework isn't added under Link Binary with Libraries",
      "A typo in the import statement itself",
      "The Swift file needs a semicolon",
      "The project needs to be reinstalled",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "\"No such module\" almost always means the module was never linked into the target that's importing it — either a missing target dependency or a missing entry in \"Link Binary with Libraries,\" not a source-level typo.",
  },
  {
    id: "xb-flashcard",
    type: "flashcard",
    prompt:
      "Explain how targets, schemes, configurations, and build phases fit together in an Xcode build. Answer aloud, then reveal.",
    modelAnswer:
      "A **target** is a buildable unit — its own sources, settings, and product (app, test bundle, extension); files must be explicitly added via **Target Membership** or the target's compiler never sees them. A **configuration** (Debug/Release, or custom ones like Staging) is a named bag of build setting values — things like `SWIFT_OPTIMIZATION_LEVEL` differ per configuration, which explains most 'works in Debug, breaks in Release' bugs. A **scheme** is the third axis: it maps each action (Run, Test, Profile, Analyze, Archive) to a configuration and a set of targets to build — Run typically uses Debug, Archive and Profile typically use Release. Settings can also live in `.xcconfig` text files instead of the GUI, which makes them diffable and reviewable, and is the standard way to manage per-environment values like API URLs. Inside a single target build, **build phases** run in order — Compile Sources, Link Binary, Copy Bundle Resources, and any number of **Run Script** phases, which need declared **Input/Output Files** to avoid rerunning on every build. When multiple `.xcodeproj` files (or Swift packages) need to reference each other, a **workspace** ties them together and shares one build folder.",
    keyPoints: [
      "Target = buildable unit; Target Membership gates which target compiles a file",
      "Configuration = named build-setting bucket (Debug/Release/custom)",
      "Scheme maps each action to a configuration + targets — independent axis from configuration",
      ".xcconfig moves settings into reviewable plain text",
      "Build phases run in order; Run Script needs Input/Output Files to avoid rerunning every time",
      "Workspace ties multiple .xcodeproj/packages together for cross-project references",
    ],
    explanation:
      "A senior answer keeps target, scheme, and configuration as three clearly independent axes and explains why each build-error category (missing module, duplicate output, undefined symbol) traces back to one of them.",
  },
];

export default quiz;
