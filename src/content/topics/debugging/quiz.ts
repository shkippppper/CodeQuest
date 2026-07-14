import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "debugging-what-lldb",
    type: "mcq",
    prompt: "What is LLDB?",
    options: [
      "The debugger that pauses a running app at an exact line and lets you inspect/change state interactively",
      "A static analysis linter for Swift that enforces code style rules and catches common bugs without ever running the program at all",
      "A build system designed to replace xcodebuild with a faster incremental compilation pipeline and parallel target scheduling",
      "A unit testing framework that integrates deeply with XCTest to provide richer assertion failure diagnostics and custom matchers",
    ],
    answer: 0,
    explanation:
      "LLDB is the debugger underlying Xcode's debugging UI — it pauses execution and gives you an interactive console into the running process's state.",
  },
  {
    id: "debugging-conditional-breakpoint",
    type: "mcq",
    prompt: "You want a breakpoint to pause execution only when `code == \"STUDENT50\"`, out of 200 possible discount codes. What do you add?",
    options: [
      "A condition on the breakpoint",
      "A symbolic breakpoint on UIViewController",
      "A watchpoint on the code variable",
      "A print statement instead",
    ],
    answer: 0,
    explanation:
      "A **conditional breakpoint** only pauses when its condition expression evaluates true — here, only on the one code value you care about.",
  },
  {
    id: "debugging-symbolic",
    type: "fill",
    prompt: "A ___ breakpoint stops execution whenever a named function is called anywhere in the app — including library code you don't have source for — rather than at a specific line.",
    answers: ["symbolic"],
    hint: "Named after the function's symbol, not its source location.",
    explanation:
      "A symbolic breakpoint (e.g. on `-[UIViewController viewDidAppear:]`) breaks by function name, useful when you don't know which line to click.",
  },
  {
    id: "debugging-expr-predict",
    type: "predict",
    prompt: "At a breakpoint you run `expr price = 50.0` in the console, then resume execution. What value does the function actually use going forward?",
    code: `(lldb) po price\n99.99\n(lldb) expr price = 50.0\n(lldb) continue`,
    options: [
      "50.0 — expr mutated the real variable in the running process",
      "99.99 — because expr evaluates expressions in a sandboxed context and any assignments it makes are discarded on resume",
      "The app crashes because LLDB's expr command is strictly read-only and raises a signal when an assignment is attempted",
      "Neither value — the variable is reset to its original declared value automatically when the debugger resumes execution",
    ],
    answer: 0,
    explanation:
      "`expr` evaluates and executes code in the paused process, including assignments — it mutates real state, so the function continues using `50.0`.",
  },
  {
    id: "debugging-po-relationship",
    type: "mcq",
    prompt: "What is the relationship between `po` and `expr`?",
    options: [
      "po is shorthand for expr -O -- ; they share the same underlying evaluator",
      "po only works on struct values and calls their description property, while expr is reserved for class instances and raw expressions",
      "po is a completely separate debugger command implemented in a different LLDB plugin with its own evaluation engine",
      "expr has been deprecated since Xcode 14 in favor of po, which now handles both printing and arbitrary code execution",
    ],
    answer: 0,
    explanation:
      "`po` (print object) is literally shorthand for `expr -O --` — same evaluator, formatted as a description. Both can execute arbitrary code, including mutations.",
  },
  {
    id: "debugging-stepping-multi",
    type: "multi",
    prompt: "Select all statements that correctly describe LLDB stepping commands.",
    options: [
      "next (step over) runs the current line without entering function calls it makes",
      "step (step into) enters a function call made on the current line",
      "finish (step out) runs until the current function returns",
      "continue pauses forever until you manually type a new breakpoint",
    ],
    answers: [0, 1, 2],
    explanation:
      "`next`/`step`/`finish` behave as described. `continue` resumes normal execution until the *next* breakpoint or watchpoint is hit — it doesn't pause forever (option 3 is false).",
  },
  {
    id: "debugging-watchpoint",
    type: "mcq",
    prompt: "You know `self.balance` is being corrupted somewhere, but not which line does it. What tool finds it fastest?",
    options: [
      "A watchpoint on self.balance",
      "A symbolic breakpoint on viewDidAppear",
      "A conditional breakpoint on the constructor",
      "Adding more print statements to guessed locations",
    ],
    answer: 0,
    explanation:
      "A **watchpoint** stops execution the instant a specific piece of memory changes, no matter which line changes it — exactly the case where you don't already know the culprit line.",
  },
  {
    id: "debugging-view-hierarchy",
    type: "fill",
    prompt: "Xcode's ___ ___ debugger freezes the screen and renders every view as a 3D exploded stack, so overlapping views become separate clickable layers.",
    answers: ["view hierarchy", "view hierarchy debugger"],
    hint: "Two words describing what it shows: the arrangement of on-screen views.",
    explanation:
      "The view hierarchy debugger is for layout bugs — views in the wrong place or hidden behind others — where sidebar variable values don't help.",
  },
  {
    id: "debugging-senior-watchpoint-vs-breakpoint",
    type: "predict",
    prompt: "🧠 A property is corrupted by a race from a background thread you didn't know existed. Which tool is most likely to reveal the culprit thread and line, and why?",
    code: `// self.balance changes to an unexpected value somewhere, from an unknown thread`,
    options: [
      "A watchpoint — it stops the instant the memory changes, regardless of which thread or line wrote it",
      "A symbolic breakpoint set on the property's synthesized getter, which fires on every read and lets you inspect the calling thread",
      "A conditional breakpoint placed on the most likely write site with a thread-name expression filter to catch the background thread",
      "Nothing in LLDB can detect a cross-thread memory corruption — you would need to add manual logging statements across all suspected write locations",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A watchpoint doesn't care which thread or line performs the write — it triggers on the memory change itself, which is exactly what's needed when the culprit location is unknown, including cross-thread races.",
  },
  {
    id: "debugging-flashcard",
    type: "flashcard",
    prompt: "Explain the main LLDB debugging tools and when you'd reach for each. Answer aloud, then reveal.",
    modelAnswer:
      "**LLDB** is Xcode's interactive debugger, pausing a running app at a **breakpoint** so you can inspect and change state without recompiling. A plain breakpoint fires every time its line runs; a **conditional breakpoint** adds an expression so it only fires when that's true (e.g. a specific input value); a **symbolic breakpoint** fires on a named function anywhere in the app, including library code, when you don't know which line to target. Once paused, `po` (print object, shorthand for `expr -O --`) evaluates and prints an expression, while `expr` can run arbitrary code including *mutating* real state in the process — both share the same evaluator. Stepping commands: `next` (step over, skip into calls), `step` (step into calls), `finish` (step out), `continue` (resume to next breakpoint). A **watchpoint** stops the instant a specific piece of memory changes, regardless of which line or thread changed it — the tool for 'this value is wrong somewhere and I don't know where.' For layout bugs, the **view hierarchy debugger** renders the screen as a 3D exploded stack of views, letting you click a layer to jump straight to the source that created it.",
    keyPoints: [
      "Breakpoint pauses at a line; conditional adds an expression filter; symbolic breaks by function name",
      "po is expr -O -- ; both can read AND mutate running state",
      "next/step/finish/continue control execution granularity",
      "Watchpoint triggers on a memory change, not a line — for unknown-culprit corruption bugs",
      "View hierarchy debugger = 3D exploded view for layout/z-order bugs, click-to-source",
    ],
    explanation:
      "A senior answer distinguishes 'stop at a place' tools (breakpoints) from 'stop at a change' tools (watchpoints), and knows expr/po can mutate, not just observe.",
  },
];

export default quiz;
