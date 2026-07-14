import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "linting-what",
    type: "mcq",
    prompt: "What does a linter like SwiftLint fundamentally do?",
    options: [
      "Reads source code without executing it and flags style or likely-bug patterns",
      "Compiles the code faster by skipping type checking, caching resolved symbol types across incremental builds to avoid redundant analysis",
      "Runs your unit tests automatically and reports which test cases failed along with the line numbers of the assertions",
      "Rewrites your code into a binary by running the full compiler pipeline and optimizing the output for the target architecture",
    ],
    answer: 0,
    explanation:
      "A linter statically analyzes source text against a set of **rules** and reports violations — it never runs your code.",
  },
  {
    id: "linting-vs-format",
    type: "mcq",
    prompt: "What's the core difference between SwiftLint and SwiftFormat?",
    options: [
      "SwiftLint primarily reports violations; SwiftFormat rewrites source into a consistent shape",
      "They are two names for the exact same tool — both read a shared .swiftlint.yml config and report or auto-fix the same set of style rules",
      "SwiftFormat only works on Objective-C files because its underlying parser targets the Clang AST rather than the Swift compiler's syntax tree",
      "SwiftLint compiles code to detect type-level bugs and SwiftFormat lints it for style violations using static analysis without building",
    ],
    answer: 0,
    explanation:
      "SwiftLint is mostly a reporter (with limited auto-fixing); SwiftFormat's entire job is rewriting code to a consistent style, every run.",
  },
  {
    id: "linting-config-predict",
    type: "predict",
    prompt: "Given this .swiftlint.yml, what happens to a 170-character line?",
    code: `line_length:\n  warning: 120\n  error: 160`,
    options: [
      "It's reported as an error (which can fail the build), since 170 exceeds the error threshold",
      "Nothing — line_length only warns, never errors, regardless of the value specified under the error key in the config",
      "SwiftLint automatically truncates the line to the error threshold and rewrites the source file in place without prompting",
      "It's ignored because no severity was set to 'ignore', and SwiftLint requires an explicit ignore entry before it can apply either warning or error thresholds",
    ],
    answer: 0,
    explanation:
      "170 characters exceeds the `error: 160` threshold, so this is reported at error severity rather than just a warning.",
  },
  {
    id: "linting-fix-fill",
    type: "fill",
    prompt: "The flag that tells SwiftLint to automatically correct every violation it knows how to fix is --___.",
    answers: ["fix"],
    hint: "One word, same as the general concept of correcting something.",
    explanation:
      "`swiftlint --fix` auto-corrects violations marked as auto-correctable; rules like cyclomatic complexity have no mechanical fix and stay as warnings.",
  },
  {
    id: "linting-hook-fill",
    type: "fill",
    prompt: "A Git ___-___ hook is a script that runs automatically right before a commit is finalized, and can block it.",
    answers: ["pre-commit", "precommit", "pre commit"],
    hint: "Runs before the commit, hyphenated.",
    explanation:
      "A pre-commit hook lives in `.git/hooks/` and, if it exits with failure, blocks the commit — useful for fast local linting feedback.",
  },
  {
    id: "linting-ci-multi",
    type: "multi",
    prompt: "Select all true statements about enforcing linting in CI versus a local pre-commit hook.",
    options: [
      "A pre-commit hook lives in .git/hooks/, which Git doesn't track or share",
      "CI runs on a server, so it can't be skipped the way a local hook can with --no-verify",
      "CI and pre-commit hooks should use different, unrelated rule configs",
      "CI failing on lint violations can block a PR from merging via branch protection",
    ],
    answers: [0, 1, 3],
    explanation:
      "Pre-commit hooks are local and skippable; CI is the actual enforcement gate. They should share the *same* `.swiftlint.yml` so there's one source of truth — option 2 is false.",
  },
  {
    id: "linting-custom-rules",
    type: "mcq",
    prompt: "What are SwiftLint custom_rules for?",
    options: [
      "Defining project-specific checks (e.g. via regex) that general Swift style rules don't cover",
      "Disabling SwiftLint entirely for a file so that none of the built-in or custom rules are applied during CI or pre-commit validation",
      "Replacing SwiftFormat by providing auto-correct rewrites for every rule defined under the custom_rules key in the config file",
      "Speeding up compilation by caching parsed syntax trees so repeated linting passes can skip re-parsing unchanged source files",
    ],
    answer: 0,
    explanation:
      "`custom_rules` let a team encode its own conventions — like banning `print(` in favor of a Logger — as regex-based checks with no Swift code required.",
  },
  {
    id: "linting-strict-senior",
    type: "predict",
    prompt: "🧠 A team runs `swiftlint lint --strict` as a pre-commit hook on a 5-year-old codebase with 3,000 existing warnings. What's the most likely outcome?",
    code: `# .git/hooks/pre-commit\nswiftlint lint --strict`,
    options: [
      "Every single commit fails immediately, because --strict treats existing warnings as blocking errors",
      "Only new violations introduced since the last passing commit block the commit, because --strict compares the current diff against the baseline stored in .swiftlint-baseline.json",
      "SwiftLint automatically ignores legacy files by reading the file creation date from git history and applying a grace period to files older than one year",
      "Nothing changes — --strict has no effect on pre-commit hooks because hook scripts run outside the SwiftLint process that reads the severity configuration",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`--strict` treats warnings as failures. On a codebase with thousands of pre-existing warnings, this blocks every commit — teams typically baseline existing violations first, then tighten enforcement going forward.",
  },
  {
    id: "linting-flashcard",
    type: "flashcard",
    prompt: "Explain how SwiftLint, SwiftFormat, pre-commit hooks, and CI fit together in a real workflow. Answer aloud, then reveal.",
    modelAnswer:
      "**SwiftLint** statically analyzes code against configurable **rules** (`.swiftlint.yml`: `disabled_rules`, `opt_in_rules`, `excluded`, per-rule thresholds) and reports violations, with limited `--fix` auto-correction. **SwiftFormat** is a separate tool whose whole job is rewriting source into a consistent shape on every run, using its own `.swiftformat` flag-style config. Teams typically run SwiftFormat first, then SwiftLint to catch what formatting can't fix. `custom_rules` (regex-based) let teams encode project-specific conventions beyond the built-in set. For enforcement: a **pre-commit hook** in `.git/hooks/` runs the linter automatically before a commit is finalized and can block it, giving fast local feedback — but it's local, untracked by Git, and skippable with `--no-verify`. **CI** runs the same checks on a server on every push, using the same config, and is the real enforcement gate — a failing lint step can block a PR from merging via branch protection.",
    keyPoints: [
      "SwiftLint reports/auto-fixes some violations; SwiftFormat rewrites consistently",
      ".swiftlint.yml: disabled_rules, opt_in_rules, excluded, per-rule severity thresholds",
      "custom_rules use regex for project-specific checks",
      "pre-commit hook = fast local gate, but skippable and untracked by Git",
      "CI = the real enforcement gate, same config as the hook, can block merges",
    ],
    explanation:
      "A senior answer stresses the two-layer enforcement model — local hook for speed, CI for actual guarantees — sharing one config as the source of truth.",
  },
];

export default quiz;
