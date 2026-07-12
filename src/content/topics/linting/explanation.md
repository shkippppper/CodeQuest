## The problem: style drifts, and some bugs are just typos

Look at this function:

```swift
func  fetchUser(id : Int ,completion: (User?)->Void) {
  if id == 1 { completion(nil) }
  else{
completion(User(id: id))
}
}
```

It compiles. It also has three inconsistent indent styles, a stray double space, and a brace on the wrong line. None of that fails the build — but a teammate reading this loses a few seconds every time, and in a big diff those seconds add up to real review friction.

Worse, some mistakes look like style but are actually bugs waiting to happen:

```swift
if user.name = "Ada" {   // meant ==, assigned instead of compared
```

A human reviewer might miss that in a long diff. A tool that reads every line, every time, on every save, won't.

That's what **linting** is: running a program that reads your source and flags patterns — style violations, likely bugs, or anti-patterns — without executing the code. In Swift, the standard linter is **SwiftLint**.

## Running SwiftLint on real code

Point it at the function above:

```
$ swiftlint
UserService.swift:1:6: warning: Vertical Whitespace Violation: Limit vertical whitespace to a single empty line
UserService.swift:1:19: warning: Colon Violation: Colons should be next to the identifier
UserService.swift:3:14: warning: Opening Brace Violation: Opening braces should be preceded by a single space
```

Each line is a **rule** — a specific, named check (`vertical_whitespace`, `colon`, `opening_brace`) — reporting a file, line, column, and severity. SwiftLint ships with over 200 rules, roughly half enabled by default, covering everything from whitespace to force-unwrapping to cyclomatic complexity.

## Configuring which rules run

Drop a `.swiftlint.yml` in your repo root and SwiftLint picks it up automatically:

```yaml
disabled_rules:
  - trailing_whitespace
opt_in_rules:
  - force_unwrapping
  - empty_count
excluded:
  - Pods
  - .build
```

`disabled_rules` turns off checks you don't want — maybe your team doesn't care about trailing whitespace because the editor strips it on save. `opt_in_rules` turns *on* checks that are too strict for every codebase by default, like flagging every `!` force-unwrap. `excluded` keeps the linter out of generated or vendored code, where warnings would just be noise.

You can also tune an individual rule's thresholds instead of an on/off switch:

```yaml
line_length:
  warning: 120
  error: 160
```

Now a 130-character line is a warning, but a 170-character line is an **error** — a severity that, depending on your setup, can fail the build outright instead of just printing a message.

## Auto-fixing what can be auto-fixed

Some violations have one unambiguous correct form — a missing space before a brace, for instance. SwiftLint can fix those for you:

```
$ swiftlint --fix
Correcting UserService.swift
```

But `--fix` only touches rules marked as auto-correctable. A rule like `cyclomatic_complexity` — "this function has too many branching paths" — has no single mechanical fix; a human has to decide how to restructure the code. Those stay as warnings for you to address by hand.

## SwiftFormat: a different tool, a different job

SwiftLint mostly *reports* problems (with some auto-fixing bolted on). **SwiftFormat** is built the other way around: its whole job is rewriting your source into a consistent shape, every time.

```
$ swiftformat .
Formatting Sources/UserService.swift
```

Run it on the messy function from the top of this lesson and it comes out normalized — consistent indentation, spacing, and brace placement — with zero manual edits. SwiftFormat has its own config file, `.swiftformat`, using flag-style syntax instead of YAML:

```
--indent 4
--allman false
--self insert
```

In practice, teams run SwiftFormat first to normalize whitespace and structure, then SwiftLint to catch anything formatting can't fix — unused variables, force-unwraps, overly complex functions.

## Writing a custom rule

The built-in rules cover general Swift style, but every codebase has its own conventions — a banned API, a required comment pattern. SwiftLint supports **custom rules**: project-specific checks defined without writing Swift code, using a regular expression.

```yaml
custom_rules:
  no_print:
    name: "No print statements"
    regex: 'print\('
    match_kinds: comment
    message: "Use the Logger, not print(), so output is filtered by build config."
    severity: warning
```

This rule fires whenever the literal text `print(` shows up in code the linter treats as non-comment source. `match_kinds` restricts *where* the regex is allowed to match — here excluding comments so a docstring that mentions `print(` doesn't trigger a false warning. Custom rules are how a linter learns your team's specific rules, not just Swift's general ones.

## Catching problems before they're committed

Predict: if a linter only runs when someone remembers to type `swiftlint`, how often does it actually run?

Answer: inconsistently — exactly the failure mode linting is supposed to prevent. The fix is to make it run automatically, before code even leaves a developer's machine.

A **pre-commit hook** is a script Git runs automatically right before a commit is finalized; if the script exits with a failure, the commit is blocked.

```
# .git/hooks/pre-commit
#!/bin/sh
swiftlint lint --strict
```

`--strict` makes SwiftLint treat *warnings* as failures too, not just errors — so this hook rejects the commit if there's a single unaddressed warning. Now a developer can't commit code that hasn't passed the linter, because the check happens locally, automatically, every time.

## Enforcing it in CI

A pre-commit hook lives in `.git/hooks/`, which Git does not track or share — it's a local file each developer has to install themselves, and nothing stops someone from deleting it or committing with `--no-verify`. That's why teams also run linting in **CI** (continuous integration) — an automated pipeline that runs checks on every pushed commit, on a server nobody can skip.

```yaml
# .github/workflows/lint.yml
- name: Run SwiftLint
  run: swiftlint lint --strict --reporter github-actions-logging
```

The `github-actions-logging` reporter formats violations so GitHub annotates them directly on the diff in a pull request — a reviewer sees the exact line SwiftLint flagged without leaving the PR. If this step exits non-zero, the whole CI run fails, and depending on branch protection rules, the PR can't be merged until it's fixed.

The pre-commit hook and CI check use the *same* `.swiftlint.yml`, so there's one source of truth for the rules — the hook just catches problems earlier, before a push even happens.

## Common pitfalls

- **Only running the linter locally.** Without a CI check, a contributor who skips the hook (or never installed it) can merge unlinted code.
- **Treating every warning as equally important.** A blanket `--strict` on a legacy codebase with thousands of existing warnings will fail every single commit; teams usually baseline first, then tighten.
- **Letting SwiftLint and SwiftFormat fight each other.** If their configs disagree on indentation or spacing, they can flip-flop the same lines back and forth on every run — keep the two configs in sync.

## Interview lens

If asked "what's the difference between SwiftLint and SwiftFormat," the clean answer is: SwiftLint is primarily a *reporter* — it flags style and correctness issues, with limited auto-fixing — while SwiftFormat is a *rewriter* whose entire job is producing a consistent output. Most real projects run both, formatter first.

If asked how you'd roll linting into a team's workflow, mention both layers: a pre-commit hook for fast local feedback, and a CI step as the actual enforcement gate, since hooks are local and skippable. Naming `.swiftlint.yml`, `opt_in_rules`, and `--strict` signals you've actually configured one of these, not just read about it.

If pushed on custom rules, the interviewer is checking whether you understand linting is *configurable to a team's own conventions*, not just Apple's or the community's defaults — a `custom_rules` regex banning a deprecated API is a concrete example to have ready.
