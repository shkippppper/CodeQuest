import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "dm-why-exist",
    type: "mcq",
    prompt: "What core problem does a dependency manager solve?",
    options: [
      "It fetches a library, records its exact version, pulls in that library's own dependencies, and wires it into your build",
      "It rewrites the third-party library's source code to match your project's own naming conventions and code style automatically",
      "It runs the third-party library's unit tests on every build to guarantee the dependency has no remaining bugs whatsoever",
      "It compiles your entire app on a remote server so that local machines never have to build any dependency source at all",
    ],
    answer: 0,
    explanation:
      "Managers automate fetching, versioning, transitive dependency resolution, and linking — replacing the fragile 'copy the source files by hand' approach with a recorded, reproducible setup.",
  },
  {
    id: "dm-cocoapods-workspace-predict",
    type: "predict",
    prompt: "After running `pod install` on a CocoaPods project, which file must you open to build?",
    code: `pod install\n// CocoaPods finishes and prints a note about the workspace`,
    options: [
      "The generated `.xcworkspace`, because CocoaPods wires the pods and your app together through the workspace",
      "The original `.xcodeproj`, since CocoaPods injects the pods directly into the existing project target instead",
      "Either file works identically, because CocoaPods keeps the project and the workspace perfectly in sync at all times",
      "A new top-level `Package.swift`, which CocoaPods emits so that Xcode can resolve the pods as Swift packages",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "CocoaPods generates a `.xcworkspace` that stitches your app and the pods together. Opening the plain `.xcodeproj` instead is a classic mistake — the pods won't be linked.",
  },
  {
    id: "dm-carthage-fill",
    type: "fill",
    prompt: "Carthage builds your dependencies into prebuilt ___ and then stops, leaving you to add them to the project by hand.",
    answers: ["frameworks", "framework"],
    hint: "The .framework bundles it compiles.",
    explanation:
      "Carthage is non-invasive: `carthage update` checks out and builds prebuilt frameworks but never touches your project file. You manually link the built frameworks and add the build phase yourself.",
  },
  {
    id: "dm-centralized-vs-decentralized",
    type: "mcq",
    prompt: "What does it mean that CocoaPods is 'centralized' while Carthage and SPM are 'decentralized'?",
    options: [
      "CocoaPods looks pods up in a shared master index, whereas Carthage and SPM point straight at git repositories",
      "CocoaPods stores all downloaded source on Apple's servers, whereas Carthage and SPM keep every dependency purely on-device",
      "CocoaPods can only be used by one developer at a time, whereas Carthage and SPM allow an unlimited number of concurrent users",
      "CocoaPods resolves versions on a central build farm, whereas Carthage and SPM must resolve every version locally by hand",
    ],
    answer: 0,
    explanation:
      "Centralized means pod names resolve through the CocoaPods trunk spec repo. Carthage and SPM are decentralized — a `Cartfile`/`Package.swift` points directly at a git URL, with no master registry.",
  },
  {
    id: "dm-spm-won-multi",
    type: "multi",
    prompt: "Select **all** reasons Swift Package Manager became the default for new projects.",
    options: [
      "It's built into Xcode, with no separate tool to install",
      "It's Apple's first-party manager, so it tracks new Swift versions immediately",
      "It needs no Ruby and generates no separate workspace to juggle",
      "It is the only one of the three that can resolve transitive dependencies at all",
    ],
    answers: [0, 1, 2],
    explanation:
      "SPM's wins are being native/built-in, first-party (fast Swift-version tracking), and free of Ruby and generated workspaces. Transitive resolution is NOT unique to it — all three do it (option 4 is false).",
  },
  {
    id: "dm-lockfile",
    type: "mcq",
    prompt: "What is the purpose of `Podfile.lock` / `Cartfile.resolved` / `Package.resolved`?",
    options: [
      "They record the exact resolved versions so every teammate and CI machine builds against identical dependencies",
      "They store an encrypted copy of each dependency's source so the code can be restored if a remote git repo disappears",
      "They lock the project file itself so that only one developer at a time is permitted to add or remove any dependency",
      "They list every dependency that was considered and then rejected during the version resolution step of the build",
    ],
    answer: 0,
    explanation:
      "A lockfile pins the exact resolved versions. Committing it is what makes builds reproducible — everyone checks out precisely what's recorded rather than 'whatever's newest'.",
  },
  {
    id: "dm-lockfile-reproducible-predict",
    type: "predict",
    prompt: "Two developers clone the repo a week apart; a dependency shipped a new patch in between. Do they get the same version?",
    code: `// The lockfile is committed to git.\n// Dependency 5.8.0 -> 5.8.1 was released mid-week.`,
    options: [
      "Yes — the committed lockfile pins the resolved version, so both check out exactly what's recorded",
      "No — each clone always re-resolves to the newest matching patch, so the second developer silently gets 5.8.1",
      "Only if both developers manually run an explicit update command immediately after cloning the repository",
      "No — lockfiles record ranges rather than exact versions, so the two resolutions can legitimately diverge",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "With the lockfile committed, both developers resolve to the exact pinned version, not the newest. That reproducibility is the entire reason to commit the lockfile.",
  },
  {
    id: "dm-buildtime-senior",
    type: "mcq",
    prompt: "How does Carthage's delivery model differ from CocoaPods in terms of build time?",
    options: [
      "Carthage ships prebuilt frameworks so dependencies aren't recompiled, while CocoaPods compiles pod source as part of your build",
      "Carthage recompiles every dependency on each incremental build, while CocoaPods caches compiled pods permanently after the first run",
      "Both compile all dependency source on every clean build, making their build-time characteristics effectively identical in practice",
      "Carthage offloads all compilation to Apple's servers, while CocoaPods is the only manager that compiles anything locally at all",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Carthage builds frameworks once up front, so your app build just links them. CocoaPods compiles pod source within your build, which can make incremental builds slower — a real reason some teams preferred Carthage.",
  },
  {
    id: "dm-reality-fill",
    type: "fill",
    prompt: "Today, new iOS projects default to ___ (Apple's first-party manager), while many legacy apps still carry CocoaPods.",
    answers: ["spm", "swift package manager", "swiftpm", "swift package manager (spm)"],
    hint: "The three-letter abbreviation for the built-in manager.",
    explanation:
      "The ecosystem consolidated on SPM for new work because it's native and needs no extra tooling. CocoaPods persists in older codebases; Carthage is niche now.",
  },
  {
    id: "dependency-managers-flashcard",
    type: "flashcard",
    prompt:
      "Compare CocoaPods, Carthage, and SPM: how each works, centralized vs decentralized, invasiveness, lockfiles, and which to pick today. Answer aloud, then reveal.",
    modelAnswer:
      "A **dependency manager** automates fetching a library, recording its exact version, resolving its transitive dependencies, and linking it — replacing fragile copy-the-files-by-hand. Three exist on iOS. **CocoaPods**: a `Podfile`, `pod install`; **centralized** (names resolve through the trunk spec repo) and **invasive** — it generates a `.xcworkspace` you must open instead of the `.xcodeproj`, compiles pod source in your build, and runs as a Ruby tool. **Carthage**: a `Cartfile`; **decentralized** (points at git URLs) and **hands-off** — `carthage update` builds **prebuilt frameworks** and stops, so you manually link them; it never touches your project, and prebuilt frameworks avoid recompiling dependencies. **Swift Package Manager (SPM)**: Apple's **first-party** manager built into Xcode, a `Package.swift` manifest, decentralized, no Ruby and no generated workspace — which is why it **won for new projects** and tracks new Swift versions immediately. All three use **semantic versioning** (`~> 5.8`, `from: 5.8.0`) and write a **lockfile** (`Podfile.lock` / `Cartfile.resolved` / `Package.resolved`); committing it pins exact versions so teammates and CI build identically. **Today:** pick SPM for anything new; expect CocoaPods in legacy apps; Carthage is niche.",
    keyPoints: [
      "Manager = fetch + version + transitive resolve + link (vs copying files)",
      "CocoaPods: centralized, invasive (generates .xcworkspace), compiles source, Ruby",
      "Carthage: decentralized, hands-off, prebuilt frameworks, manual linking",
      "SPM: first-party, built into Xcode, no Ruby/workspace — default for new projects",
      "All use semver + a committed lockfile for reproducible builds",
      "Pick SPM today; CocoaPods lingers in legacy; Carthage niche",
    ],
    explanation:
      "A strong answer contrasts on centralized-vs-decentralized and invasiveness, names each man's config file and delivery model, explains the lockfile's reproducibility role, and recommends SPM for new work while acknowledging CocoaPods' legacy footprint.",
  },
];

export default quiz;
