import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "clean-naming-mcq",
    type: "mcq",
    prompt: "Which variable name follows good naming practice?",
    options: [
      "isEmailVerified: Bool",
      "flag: Bool — a generic word that forces callers to read the implementation to understand its meaning",
      "d: Double — a single-letter name that reveals nothing about the value's domain or purpose",
      "temp: [Item] — a placeholder name that says the array is temporary but not what it actually holds",
    ],
    answer: 0,
    explanation:
      "A boolean name should read as a statement at the call site — `isEmailVerified` tells you what `true` means without reading the implementation. `flag`, `d`, and `temp` describe the variable's type or role in the language, not its meaning.",
  },
  {
    id: "clean-name-diagnostic",
    type: "predict",
    prompt: "A function is named canBeEdited(by:) but its body also saves the post to disk as a side effect. What does this mismatch usually indicate?",
    code: `extension Post {
    func canBeEdited(by user: User) -> Bool {
        lastCheckedAt = Date()   // side effect!
        return user.id == ownerID && !isLocked
    }
}`,
    options: [
      "The name is lying about what the function does — either rename it or remove the side effect",
      "Nothing — side effects in query-shaped functions are idiomatic Swift and expected by callers at the call site",
      "The function should be renamed to canBeEditedAndSaved to reflect both actions it performs",
      "This is a compiler error waiting to happen because mutating methods must be marked mutating on value types",
    ],
    answer: 0,
    explanation:
      "A name that reads as a pure question (`canBeEdited`) but performs a mutation is a mismatch between name and behavior — a classic clean-code smell, and also a command/query separation violation.",
  },
  {
    id: "clean-comment-fill",
    type: "fill",
    prompt: "A comment earns its place when it explains ___ the code does something the reader couldn't otherwise know — not what the next line already says.",
    answers: ["why"],
    hint: "One three-letter word, contrasted with 'what' in the lesson.",
    explanation:
      "Good comments capture context the code can't express on its own — reasoning, history, external quirks. A comment that restates the next line adds nothing and should be deleted.",
  },
  {
    id: "clean-guard-predict",
    type: "predict",
    prompt: "A fourth validation rule (reject already-registered emails) needs to be added to this function. Which version requires less restructuring?",
    code: `// Version A
guard user.email.contains("@") else { return .failure(.invalidEmail) }
guard user.age >= 13 else { return .failure(.tooYoung) }
guard !user.password.isEmpty else { return .failure(.missingPassword) }
return .success(())

// Version B
if user.email.contains("@") {
    if user.age >= 13 {
        if !user.password.isEmpty { return .success(()) }
        else { return .failure(.missingPassword) }
    } else { return .failure(.tooYoung) }
} else { return .failure(.invalidEmail) }`,
    options: [
      "Version A — add one more guard line at the top; the success path doesn't move",
      "Version B — nested ifs make it clearer exactly which branch to extend without touching the success path",
      "Both require the same amount of restructuring since each adds one branch regardless of style",
      "Neither can be extended cleanly without a full rewrite into a validation pipeline or strategy pattern",
    ],
    answer: 0,
    explanation:
      "With guard clauses, each new rule is one more line at the top and the success path stays unindented. With nested if/else, adding a rule means threading a new branch into an already-deep pyramid.",
  },
  {
    id: "clean-small-fn-mcq",
    type: "mcq",
    prompt: "What's the actual test for whether a function is 'small enough,' per this lesson?",
    options: [
      "Whether it does one thing you could describe without the word 'and'",
      "Whether it is under 5 lines long, since longer functions necessarily mix concerns and should be split",
      "Whether it has zero parameters, because parameters introduce coupling between the caller and callee",
      "Whether it avoids using loops, which always signal that a function should delegate to a helper method",
    ],
    answer: 0,
    explanation:
      "Line count isn't the measure — a function is at the right size when it operates at one level of abstraction and its purpose can't be honestly split with the word 'and.'",
  },
  {
    id: "clean-cqs-multi",
    type: "multi",
    prompt: "Select all statements consistent with command/query separation as described in this lesson.",
    options: [
      "A query answers a question without changing state; a command changes state without returning a meaningful value",
      "Command/query separation is an absolute rule with zero real-world exceptions",
      "Array.removeLast() is a defensible, well-known exception that combines command and query",
      "The principle is meant as a default preference, not an inviolable law",
    ],
    answers: [0, 2, 3],
    explanation:
      "CQS is a strong default, not an absolute rule — the standard library itself breaks it in well-understood, idiomatic ways like `removeLast()`. The core distinction (query = answer without mutation, command = mutation without a meaningful return) is correct.",
  },
  {
    id: "clean-cqs-fill",
    type: "fill",
    prompt: "In command/query separation terms, a method that only reports state without changing anything is called a ___.",
    answers: ["query"],
    hint: "The opposite of a command.",
    explanation:
      "A query asks a question and returns an answer with no side effects — safe to call any number of times, like the `top` computed property in the Stack example.",
  },
  {
    id: "clean-nesting-senior",
    type: "mcq",
    prompt: "A senior reviewer flags a PR for 'accidental complexity from mixed abstraction levels' in this function. What's the issue?",
    code: `func total(_ prices: [Int], _ flags: [Bool]) -> Int {
    var t = 0
    for i in 0..<prices.count {
        t += flags[i] ? prices[i] * 2 : prices[i]
    }
    return t
}`,
    options: [
      "The loop mixes 'what is being computed' (a total) with 'how one item's contribution is decided' (the doubling rule) in a single block instead of splitting them into named functions",
      "The function uses a for loop instead of map or reduce, which is always the wrong choice in Swift regardless of context or readability",
      "The function is far too short and self-contained to ever warrant a senior review comment about mixed abstraction levels",
      "There is no real issue at all — the ternary operator is purely a style preference, the logic is correct, and the function is already as minimal and focused as it could possibly be written",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Splitting 'decide one item's doubled value' into its own named function (e.g. doubledIfPriority) lets the outer function read as a single level of abstraction — summing a sequence of already-decided values — instead of mixing the overall goal with the per-item rule.",
  },
  {
    id: "clean-code-flashcard",
    type: "flashcard",
    prompt:
      "Explain the core clean-code habits — naming, small functions, comments, guard clauses, and command/query separation — and the single goal tying them together. Answer aloud, then reveal.",
    modelAnswer:
      "Every clean-code habit serves one goal: **readability** — a reader who's never seen the code should follow it without tracing execution in their head. **Naming** means a name should answer 'what is this and what does it do' on its own; booleans read as statements (`isValid`), functions start with a verb, and a name that needs a comment beside it has failed. **Small functions** stay at one level of abstraction — a function should do one thing describable without the word 'and'; mixing 'what is computed' with 'how one piece is computed' should be split into a named helper. **Comments** should explain **why**, not **what** — anything the code already says on its own doesn't need restating, but context the code can't express (a workaround, a history, an external quirk) earns a comment. **Guard clauses** (early return) handle failure conditions up front and exit immediately, keeping the success path at a constant, unindented level — adding a new validation rule becomes a one-line insertion instead of restructuring a nested pyramid. **Command/query separation** says a **query** should answer a question with no side effects, and a **command** should change state without a meaningful return value — as a default preference, not an absolute rule (Array's `removeLast()` is a well-known, idiomatic exception).",
    keyPoints: [
      "All habits serve one goal: readability without tracing execution",
      "Names should be honest about meaning; a mismatched name signals a design problem",
      "Functions should hold one level of abstraction, not mix what and how",
      "Comments explain why, not what — delete ones that restate the code",
      "Guard clauses keep the success path unindented and easy to extend",
      "CQS: queries return without mutating, commands mutate without meaningful return — a default, not a law",
    ],
    explanation:
      "A senior answer ties every individual habit back to the same underlying goal (readability for an unfamiliar reader) and correctly frames CQS as a strong default rather than an inviolable rule.",
  },
];

export default quiz;
