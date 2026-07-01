import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "default-access-level",
    type: "mcq",
    prompt: "If you write no access modifier on a declaration, what access level does it get?",
    options: ["`internal`", "`public`", "`private`", "`fileprivate`"],
    answer: 0,
    explanation:
      "The default is **`internal`** — visible everywhere in the same module, hidden outside it. That's why most single-target app code needs no access keywords at all.",
  },
  {
    id: "private-vs-fileprivate",
    type: "mcq",
    prompt: "What is the difference between `private` and `fileprivate`?",
    options: [
      "`private` limits access to the enclosing declaration; `fileprivate` limits to the whole source file",
      "They are identical",
      "`private` is file-scoped; `fileprivate` is type-scoped",
      "`fileprivate` works across modules",
    ],
    answer: 0,
    explanation:
      "`private` restricts a member to its enclosing type (and that type's extensions in the same file). `fileprivate` widens that to the **entire file**, so other types in the same file can access it too.",
  },
  {
    id: "open-vs-public",
    type: "mcq",
    prompt: "A framework exposes a class as `public` (not `open`). What can a consuming module NOT do?",
    options: [
      "Subclass it or override its members",
      "Create instances of it",
      "Call its public methods",
      "Import the framework",
    ],
    answer: 0,
    explanation:
      "`public` lets other modules **use** the class but not **subclass/override** it. `open` is required to permit subclassing across module boundaries — the distinction only matters for library authors, and only for classes.",
  },
  {
    id: "testable-import-fill",
    type: "fill",
    prompt: "Which attribute on an `import` lets a test module reach the imported module's `internal` declarations?",
    answers: ["@testable", "testable"],
    hint: "`____ import MyApp`",
    explanation:
      "`@testable import MyApp` promotes the module's `internal` API to the test module so you can test it without making it `public`. It does not expose `private`/`fileprivate`.",
  },
  {
    id: "access-order-fill",
    type: "fill",
    prompt: "Name the single most-visible access level — the one that also allows subclassing/overriding from other modules.",
    answers: ["open"],
    hint: "4 letters — the opposite of closed.",
    explanation:
      "`open` is the most permissive: usable AND subclassable/overridable from other modules. The full order is `open > public > internal > fileprivate > private`.",
  },
  {
    id: "access-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about Swift access control.",
    options: [
      "`internal` is the default access level",
      "`@testable import` exposes a module's `internal` (but not `private`) declarations to tests",
      "`open` allows subclassing across module boundaries; `public` does not",
      "`private` members are visible throughout the whole source file",
    ],
    answers: [0, 1, 2],
    explanation:
      "Internal is the default, `@testable` promotes internal to tests, and open (unlike public) permits cross-module subclassing. `private` is scoped to the enclosing declaration — it's **fileprivate** that spans the whole file, so option 3 is false.",
  },
  {
    id: "member-cant-exceed-type-senior",
    type: "mcq",
    prompt: "You declare a `public func` inside an `internal struct`. What is the method's effective visibility to other modules?",
    options: [
      "Effectively `internal` — a member can't be more visible than its enclosing type",
      "`public` — the method keyword wins",
      "Compile error — you can't mix levels",
      "`open`",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Access can't exceed the container: a `public` member of an `internal` type is only reachable where the type is — i.e. **internal**. To truly expose the method to other modules, the struct itself must be `public`.",
  },
  {
    id: "private-extension-samefile-senior",
    type: "predict",
    prompt: "Does this compile? (both in the same file)",
    code: `struct Account {
    private var balance = 0.0
}
extension Account {
    var isEmpty: Bool { balance == 0 }
}`,
    options: [
      "Yes — a same-file extension of the type can see its `private` members",
      "No — `private` blocks all extensions",
      "No — the extension must be marked `private`",
      "Only if the extension is in a different file",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Since Swift 4, `private` includes the type's **extensions in the same file**. So `isEmpty` can read `balance`. Put the extension in a *different* file and it would need `fileprivate`/`internal` to see `balance`.",
  },
  {
    id: "private-set-senior",
    type: "mcq",
    prompt: "What does `public private(set) var count = 0` express?",
    options: [
      "Readable from other modules, but writable only within the defining module",
      "Both read and write are private",
      "Read is private, write is public",
      "It's a compile error",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "You can give a property's **setter** a stricter level than its getter. `public private(set)` means everyone can read `count`, but only code in the defining module (here, effectively the type) can mutate it — a clean way to expose read-only state.",
  },
  {
    id: "access-public-memberwise-init-trick",
    type: "mcq",
    prompt: "🧠 Trick question — you ship `public struct Config { public var timeout = 30 }` in a framework. Why can't another module write `Config(timeout: 5)`?",
    options: [
      "The synthesized memberwise init is `internal`, not `public` — you must write a `public init` yourself",
      "Structs can't be `public`",
      "`timeout` must be `open`",
      "You can — it works fine",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Swift synthesizes the memberwise initializer as **`internal`**, even for a `public` struct. So consumers of your framework can't construct it across the module boundary — a classic library-author trap. You must declare an explicit `public init(...)` to expose construction.",
  },
  {
    id: "access-control-flashcard",
    type: "flashcard",
    prompt:
      "List Swift's access levels, the default, and explain the two subtle pairs (private/fileprivate, open/public). Answer aloud, then reveal.",
    modelAnswer:
      "Five levels, most to least visible: **`open`** (usable + subclassable/overridable across modules), **`public`** (usable across modules, not subclassable outside), **`internal`** (same module — the **default**), **`fileprivate`** (same file), **`private`** (enclosing declaration + its same-file extensions). Two subtle pairs: **`private` vs `fileprivate`** — private is scoped to the type/declaration (and same-file extensions), fileprivate to the whole file, so sibling types in one file can share a fileprivate member. **`open` vs `public`** — a library concern for classes: public lets other modules use the class, open additionally lets them subclass/override. Access is defined relative to a **module**, a member can't exceed its type's visibility, and `@testable import` promotes `internal` (not `private`) so tests reach it without weakening your real API.",
    keyPoints: [
      "open > public > internal > fileprivate > private; internal is default",
      "private = enclosing decl (+ same-file extensions); fileprivate = whole file",
      "open = subclassable across modules; public = not",
      "Access is relative to a module; member ≤ its type's visibility",
      "@testable import exposes internal (not private) to tests",
    ],
    explanation:
      "Strong answers nail both subtle pairs and mention `@testable import` for testing internal code plus `private(set)` for read-only exposure — showing practical command, not just keyword recall.",
  },
];

export default quiz;
