import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "noncopyable-why",
    type: "mcq",
    prompt: "Why would you mark a type `~Copyable`?",
    options: [
      "It models a unique resource where an accidental copy would leave two owners releasing the same thing",
      "It makes the type faster to copy by switching every assignment over to a lightweight shared-buffer copy-on-write scheme",
      "It forces every instance of the type to be allocated on the heap and reference-counted exactly like an ordinary class is",
      "It automatically gives the struct thread-safety by serializing all reads and writes to its stored properties behind a lock",
    ],
    answer: 0,
    explanation:
      "`~Copyable` fits types that wrap a **unique resource** — a file handle, lock, or connection — where copying would give two owners a claim on one resource. It is not about performance-copying, heap allocation, or thread-safety.",
  },
  {
    id: "noncopyable-tilde-meaning",
    type: "fill",
    prompt: "A noncopyable struct is declared `struct FileHandle: ___ {}` to suppress the implicit copy.",
    answers: ["~Copyable", "~ Copyable"],
    hint: "A tilde (meaning 'not') in front of a protocol name.",
    explanation:
      "`~Copyable` reads as 'not copyable'. Writing it in the inheritance clause removes the type's default copy ability.",
  },
  {
    id: "noncopyable-assign-moves",
    type: "predict",
    prompt: "`FileHandle` is `~Copyable`. What does the compiler do with this code?",
    code: "let a = FileHandle(fd: 7)\nlet b = a\nprint(a.fd)",
    options: [
      "Rejects it: 'let b = a' moves the value out of a, so 'print(a.fd)' uses a after it was consumed",
      "Accepts it and prints 7, because reading a stored property never counts as consuming the noncopyable value",
      "Accepts it but prints garbage, since a and b now alias the same file descriptor stored at one shared address",
      "Rejects it for a different reason: noncopyable structs are not allowed to expose their stored properties at all",
    ],
    answer: 0,
    explanation:
      "Copying is forbidden, so `let b = a` is a **move**: the value leaves `a` and lives in `b`. `a` is now consumed, so `print(a.fd)` fails to compile — 'used after consume'.",
  },
  {
    id: "noncopyable-owner-count",
    type: "mcq",
    prompt: "How many valid owners does a noncopyable value have at any one moment?",
    options: [
      "Exactly one — assignment moves ownership and the source binding becomes unusable afterward",
      "As many bindings as currently reference it, each keeping its own independent live copy of the value",
      "Zero or one — it starts with no owner and only gains one after you explicitly call a consume operator",
      "It depends on the reference count, which rises by one for every additional binding that points at the value",
    ],
    answer: 0,
    explanation:
      "A noncopyable value has **exactly one owner** at a time. Assignment moves that ownership and invalidates the source. There is no reference count and no second live copy.",
  },
  {
    id: "noncopyable-borrowing",
    type: "predict",
    prompt: "Given `func peek(_ f: borrowing FileHandle)`, does the last line compile?",
    code: "func peek(_ f: borrowing FileHandle) { print(f.fd) }\nlet a = FileHandle(fd: 7)\npeek(a)\nprint(a.fd)",
    options: [
      "Yes — borrowing is only temporary read access, so the caller keeps ownership and a stays valid after the call",
      "No — passing a to any function always moves it, leaving a consumed regardless of the parameter's ownership convention",
      "No — a borrowing parameter permanently transfers the value into peek, so a is invalid on every line that follows the call",
      "Yes, but only because print does not mutate a; had peek written to f, the whole downstream program would fail",
    ],
    answer: 0,
    explanation:
      "A `borrowing` parameter is temporary read access — the caller retains ownership. So `a` is still valid after `peek(a)`, and the final `print(a.fd)` compiles.",
  },
  {
    id: "noncopyable-consuming-param",
    type: "mcq",
    prompt: "What does a `consuming` parameter do to the caller's binding?",
    options: [
      "It takes ownership of the value, so the caller's binding is invalid and can't be used after the call",
      "It hands the callee a snapshot copy while the caller keeps a fully usable original binding of its own",
      "It borrows the value for the duration of the call and then returns ownership to the caller at the end",
      "It requires the caller to first wrap the value in an Optional so ownership can be handed back as nil",
    ],
    answer: 0,
    explanation:
      "`consuming` means the callee **takes ownership**. The value moves into the function and the caller's binding is consumed — unusable afterward.",
  },
  {
    id: "noncopyable-deinit-order",
    type: "predict",
    prompt: "With this `deinit` and `consuming` function, in what order do the prints happen?",
    code: [
      "struct FileHandle: ~Copyable {",
      "    let fd: Int32",
      "    deinit { print(\"closing\") }",
      "}",
      "func take(_ f: consuming FileHandle) { print(\"inside\") }",
      "let a = FileHandle(fd: 7)",
      "take(a)",
      "print(\"after\")",
    ].join("\n"),
    options: [
      "inside, then closing, then after — take owns the value, so its deinit fires when take returns, before 'after'",
      "inside, then after, then closing — the deinit is deferred until the enclosing scope of the caller finally exits",
      "closing, then inside, then after — the value is destroyed at the moment of the call before take's body runs",
      "inside, then after only — a consuming call moves the value without ever triggering the type's deinit at all",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`take` becomes the owner, so when it returns the value has no owner left and its `deinit` runs right there — printing 'closing' before 'after'.",
  },
  {
    id: "noncopyable-consume-operator",
    type: "fill",
    prompt: "To explicitly end a binding's lifetime and move its value out, you write `let b = ___ a`.",
    answers: ["consume"],
    hint: "An operator keyword; the same word used for the parameter convention that takes ownership.",
    explanation:
      "The `consume` operator ends `a`'s lifetime and yields its value to move into `b`. After `consume a`, using `a` is a compile error.",
  },
  {
    id: "noncopyable-struct-deinit",
    type: "multi",
    prompt: "Select **all** statements that are true about `deinit` on structs.",
    options: [
      "A noncopyable (~Copyable) struct is allowed to have a deinit",
      "An ordinary copyable struct cannot have a deinit",
      "The deinit runs when the value's single owner's lifetime ends",
      "Adding a deinit turns the struct into a heap-allocated class",
    ],
    answers: [0, 1, 2],
    difficulty: "senior",
    explanation:
      "Only `~Copyable` structs may declare a `deinit`, and it fires deterministically when the sole owner dies. Copyable structs can't have one. A `deinit` does **not** make a struct a class — it stays a value type (option 4 is false).",
  },
  {
    id: "noncopyable-flashcard",
    type: "flashcard",
    prompt:
      "Explain noncopyable types and the ownership model: what ~Copyable does, how moves work, borrowing vs consuming, and why deinit now works on a struct. Answer aloud, then reveal.",
    modelAnswer:
      "A **noncopyable** type is one marked `~Copyable` ('not copyable'), which tells the compiler to **forbid the implicit copy** on assignment or passing. It suits a **unique resource** — a file handle, lock, socket, or connection — where an accidental copy would leave two owners releasing the same thing (e.g. a double-close). Because copying is off, assignment is a **move**: the value leaves the source binding and lives in the destination, and the source becomes **consumed** — any later use is a compile error ('used after consume'). So a noncopyable value has **exactly one owner at a time**; there is no reference count and no second live copy. To pass one into a function you pick an ownership convention: a **borrowing** parameter is *temporary read access* and the caller **keeps** ownership (still valid after the call); a **consuming** parameter **takes** ownership, so the value moves in and the caller's binding is dead afterward — and the value's `deinit` can fire when that function returns. The **`consume` operator** (`let b = consume a`) is the explicit way to end a binding's lifetime and move the value out. Finally, a `~Copyable` struct **may have a `deinit`** — copyable structs can't, because they're duplicated freely and have no single 'last owner'. With one owner, cleanup is **deterministic**: the resource is released at the exact point that owner dies. Use it for unique resources, performance, and correctness — not for everyday value types you want to copy freely.",
    keyPoints: [
      "~Copyable ('not copyable') suppresses the implicit copy",
      "Fits unique resources: file handle, lock, connection — copy = bug",
      "Assignment moves the value; the source is consumed and unusable",
      "Exactly one owner at a time; no reference count, no second copy",
      "borrowing = temporary read, caller keeps ownership",
      "consuming = callee takes ownership, caller's binding dies (deinit can fire)",
      "consume operator explicitly ends a binding and moves the value out",
      "~Copyable structs may have deinit → deterministic resource cleanup",
    ],
    explanation:
      "A senior answer leads with the unique-resource problem, explains move semantics and one-owner-at-a-time, contrasts borrowing vs consuming, mentions the consume operator, and ties deinit-on-a-struct to deterministic cleanup.",
  },
];

export default quiz;
