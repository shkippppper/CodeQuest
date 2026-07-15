import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "macro-when-runs",
    type: "mcq",
    prompt: "When does a Swift macro do its work?",
    options: [
      "During compilation — it takes source as input and generates more Swift the compiler then checks",
      "At app launch, by scanning every annotated type once through reflection before the very first screen is drawn on device",
      "Lazily at runtime, the first time the annotated declaration is actually accessed by any code path in the running app",
      "On a background build server that regenerates all of the project's sources in between each incremental compile run",
    ],
    answer: 0,
    explanation:
      "A macro is a compile-time program: it receives your code as syntax and returns new syntax that the compiler drops in place and type-checks. By runtime there is no macro left — only the generated code.",
  },
  {
    id: "macro-freestanding-vs-attached",
    type: "mcq",
    prompt: "What distinguishes a freestanding macro from an attached macro?",
    options: [
      "Freestanding macros start with `#` and produce an expression/declaration at a call site; attached macros start with `@` and augment an existing declaration",
      "Freestanding macros run their expansion at compile time while attached macros are instead resolved lazily during the app's normal runtime execution phase",
      "Freestanding macros are allowed to delete members whereas attached macros are strictly restricted to only ever adding brand-new members and nothing else",
      "Freestanding macros are written directly in SwiftSyntax but attached macros are configured entirely through options in the Package.swift manifest file instead",
    ],
    answer: 0,
    explanation:
      "The syntax signals the kind: `#name(...)` is freestanding (stands alone as an expression or declaration), `@Name` is attached (sits on a declaration and adds to it, e.g. `@Observable`).",
  },
  {
    id: "macro-additive-predict",
    type: "predict",
    prompt: "An attached member macro `@AddInit` sits on this struct. After expansion, which stored properties does `Endpoint` have?",
    code: `@AddInit\nstruct Endpoint {\n    let host: String\n    let path: String\n}`,
    options: [
      "Still exactly host and path — macros are additive and never remove or change what you wrote",
      "Only host, because the macro consumes the last property to build its generated initializer",
      "None directly on the struct; the macro relocates both into a generated storage container type",
      "host, path, and a renamed backing pair the macro substitutes for the originals during rewriting",
    ],
    answer: 0,
    explanation:
      "Macros can only **add** code — members, peers, or conformances. Your original declaration stays exactly as typed, so `Endpoint` keeps `host` and `path`; the macro merely inserts an initializer beside them.",
  },
  {
    id: "macro-role-fill",
    type: "fill",
    prompt: "An attached macro that adds new declarations inside the type it's attached to (like a generated initializer) plays the ___ role.",
    answers: ["member"],
    hint: "As opposed to 'peer' (beside) or 'extension' (conformance).",
    explanation:
      "A **member** macro injects new members inside the type. A **peer** macro adds declarations beside the attached one, and an **extension** macro adds a protocol conformance.",
  },
  {
    id: "macro-where-implementation-lives",
    type: "mcq",
    prompt: "Where does a macro's implementation code end up?",
    options: [
      "In a separate compiler-plugin module the compiler loads at build time — it never links into your app binary",
      "Inlined directly into your own app target so the generated output is able to call back into it during runtime",
      "In a dynamic framework that is shipped inside the app bundle and then loaded on demand during execution",
      "Embedded within the compiled binary's metadata section so that the debugger can re-expand it later on the fly",
    ],
    answer: 0,
    explanation:
      "A macro is two pieces: the `macro` declaration (with your code) and the implementation in a separate plugin target referenced by `#externalMacro`. The plugin runs inside the compiler and is discarded — zero runtime cost.",
  },
  {
    id: "macro-vs-alternatives-multi",
    type: "multi",
    prompt: "Select **all** genuine advantages of macros over reflection (`Mirror`) or an external generator like Sourcery.",
    options: [
      "Mistakes can surface as compile-time errors instead of runtime crashes",
      "There's no separate build-time tool to wire up and keep in sync",
      "The generated code is real Swift the compiler type-checks and you can inspect",
      "They let you modify or delete the properties a type already declares",
    ],
    answers: [0, 1, 2],
    explanation:
      "Compile-time checking, no external tool, and inspectable real Swift are all true wins. Modifying/deleting existing declarations is **not** possible — macros are strictly additive (option 4 is false).",
  },
  {
    id: "macro-observable-senior",
    type: "mcq",
    prompt: "`@Observable` injects tracking members AND conforms the class to the `Observable` protocol. What does that tell you about it?",
    options: [
      "A single attached macro can fill several roles at once — here both a member macro and an extension (conformance) macro",
      "It must actually be a freestanding macro, on the grounds that only freestanding macros are ever permitted to add protocol conformances",
      "Conformance synthesis is proof that the macro edits the class in place rather than only adding to it in the usual additive way",
      "It secretly runs twice on every build — once as a member-injection pass and then again later as an entirely unrelated conformance pass",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "One attached macro can declare multiple roles. `@Observable` is a member macro (adds observation-tracking members) and an extension macro (adds the `Observable` conformance) simultaneously.",
  },
  {
    id: "macro-syntax-not-value-senior",
    type: "predict",
    prompt: "`#stringify(1 + 2)` returns `(3, \"1 + 2\")`. How did it get the string \"1 + 2\"?",
    code: `let (value, text) = #stringify(1 + 2)`,
    options: [
      "The macro received the source syntax `1 + 2` as a tree and read it back out as text, before any evaluation",
      "It called `String(describing:)` on the already-computed result and then reverse-engineered the two operands back out from 3",
      "The compiler fully evaluated the expression first and afterwards stored a nicely formatted copy of each of the numeric literals",
      "SwiftSyntax quietly kept a runtime log of every expression and the macro simply looked the original source text up inside that log",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A macro operates on **syntax, not values**. It's handed a tree describing `1 + 2` (not the number 3), so it can emit both the evaluated result and the original source text. A normal function never sees the source it was passed.",
  },
  {
    id: "macro-error-reporting-senior",
    type: "mcq",
    prompt: "A macro is applied to a declaration it can't handle (e.g. `@AddInit` on an enum). What's the ideal behavior?",
    options: [
      "It emits a compile-time diagnostic pointing at the bad usage, so the error appears in Xcode before the app runs",
      "It silently expands to nothing at all, quietly leaving the programmer to discover the missing generated code much later at runtime",
      "It throws an ordinary Swift error that the surrounding call-site code is then required to catch using a do/try/catch block",
      "It quietly falls back to a slower reflection-based implementation so that the requested feature still works, just less efficiently",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Because a macro runs inside compilation, it can fail the build with a real diagnostic — a red error in Xcode pointing at the offending line. Catching misuse at compile time (not runtime) is the whole advantage over reflection.",
  },
  {
    id: "macros-flashcard",
    type: "flashcard",
    prompt:
      "Explain Swift macros: what they do, freestanding vs attached (and roles), where the implementation lives, and why they beat the alternatives. Answer aloud, then reveal.",
    modelAnswer:
      "A **Swift macro** is code that runs **at compile time**, takes your source as **syntax** (a tree, not evaluated values), and generates **additional Swift** the compiler then type-checks. Two families: **freestanding** macros start with `#` and produce an expression or declaration at a call site (`#stringify`, `#URL`); **attached** macros start with `@` and augment an existing declaration (`@Observable`). Attached macros declare a **role**: a **member** macro adds members inside the type (e.g. a generated `init`), a **peer** macro adds declarations beside it (e.g. a callback twin of an async function), and an **extension** macro adds a protocol conformance — and one macro can fill several roles at once. Crucially, macros are **additive**: they only add members/peers/conformances and never modify or delete what you wrote, so the original declaration is untouched and you can 'Expand Macro' to see the real generated source. The implementation is a **two-module split**: the `macro` declaration lives with your code (pointing via `#externalMacro` at) an implementation in a **separate compiler-plugin module** built on **SwiftSyntax**. That plugin runs inside the compiler and is discarded — **zero runtime cost**. Macros beat the alternatives because errors surface at **compile time** not runtime (unlike `Mirror` reflection), there's **no external build tool** to wire up (unlike Sourcery), and the output is inspectable real Swift.",
    keyPoints: [
      "Compile-time code generation; operates on syntax, not runtime values",
      "Freestanding (#) produce at a call site; attached (@) augment a declaration",
      "Attached roles: member (inside), peer (beside), extension (conformance)",
      "Additive only — never modifies or deletes existing code",
      "Two-module split: declaration + separate SwiftSyntax plugin; zero runtime cost",
      "Wins: compile-time errors, no external tool, inspectable generated Swift",
    ],
    explanation:
      "A senior answer leads with compile-time + syntax + additive, names both families with roles and a real example like @Observable, explains the plugin split and zero runtime cost, and contrasts against reflection and Sourcery.",
  },
];

export default quiz;
