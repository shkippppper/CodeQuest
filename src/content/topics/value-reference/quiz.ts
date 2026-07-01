import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "struct-copy-semantics",
    type: "predict",
    prompt: "What does this print?",
    code: `struct P { var x: Int }
var a = P(x: 1)
var b = a
b.x = 99
print(a.x, b.x)`,
    options: ["1 99", "99 99", "1 1", "Compile error"],
    answer: 0,
    explanation:
      "`P` is a **struct** (value type), so `var b = a` makes an independent copy. Mutating `b.x` leaves `a` untouched, giving `1 99`.",
  },
  {
    id: "class-share-semantics",
    type: "predict",
    prompt: "And this one?",
    code: `class P { var x: Int; init(x: Int) { self.x = x } }
let a = P(x: 1)
let b = a
b.x = 99
print(a.x, b.x)`,
    options: ["99 99", "1 99", "1 1", "Compile error"],
    answer: 0,
    explanation:
      "`P` is a **class** (reference type). `let b = a` copies the *reference*, not the object, so `a` and `b` point at the same instance. Mutating through `b` is visible through `a`: `99 99`. Note the `let` doesn't stop it — `let` freezes the reference, not the object's contents.",
  },
  {
    id: "value-reference-choose-value",
    type: "mcq",
    prompt: "Which is the **best** default reason to model a type as a `struct`?",
    options: [
      "You need several places to share and mutate one instance",
      "You want independent copies with no shared mutable state",
      "You need to subclass it later",
      "You need a `deinit` to release resources",
    ],
    answer: 1,
    explanation:
      "Value semantics — independent copies, no aliasing — is the reason to prefer structs, and why they're safer and easier to reason about (especially across threads). The other three options are exactly the cases that call for a **class**.",
  },
  {
    id: "identity-operator",
    type: "fill",
    prompt: "Type the operator that checks whether two class references point to the **same object** in memory.",
    answers: ["===", "identical to"],
    hint: "Three characters — one more than the equality operator.",
    explanation:
      "`===` tests **identity** (same instance) and only applies to reference types. `==` tests **equality** (same contents) and is provided via `Equatable`. Value types have no identity, so `===` isn't available for them.",
  },
  {
    id: "mutating-keyword",
    type: "fill",
    prompt: "A method on a `struct` that changes its own stored properties must be marked with the ___ keyword.",
    answers: ["mutating"],
    hint: "It goes right before `func`.",
    explanation:
      "`mutating` signals that the method changes the value, so Swift only lets you call it on a `var` instance. Classes don't need it — you mutate the object through a reference, even a `let` one.",
  },
  {
    id: "struct-truths-multi",
    type: "multi",
    prompt: "Select **all** statements that are true of Swift structs.",
    options: [
      "They are value types and are copied on assignment",
      "They can conform to protocols",
      "They support inheritance from other structs",
      "A method that mutates stored properties needs `mutating`",
    ],
    answers: [0, 1, 3],
    explanation:
      "Structs are copied value types, can conform to protocols, and require `mutating` to change themselves. They do **not** support inheritance — only classes do (option 3 is false).",
  },
  {
    id: "let-object-mutation",
    type: "mcq",
    prompt: "Given `let obj = SomeClass()`, why can you still write `obj.property = 5`?",
    options: [
      "Because classes ignore `let`",
      "Because `let` freezes the reference, not the object it points to",
      "Because the property is implicitly `var` on all classes",
      "You can't — it's a compile error",
    ],
    answer: 1,
    explanation:
      "`let` makes the *binding* constant — you can't reassign `obj` to a different instance — but the object it references is still mutable (assuming the property is a `var`). For a value type, the binding *is* the value, so a `let` struct is fully immutable.",
  },
  {
    id: "cow-unique-ref",
    type: "mcq",
    prompt:
      "You're hand-rolling copy-on-write for a value type that wraps a class buffer. Which check tells you it's safe to mutate the buffer **in place** instead of copying it?",
    options: [
      "`isKnownUniquelyReferenced(&buffer)`",
      "`buffer === buffer`",
      "`CFGetRetainCount(buffer) == 1`",
      "`MemoryLayout.size(ofValue: buffer)`",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`isKnownUniquelyReferenced(&x)` returns `true` when yours is the only strong reference, so you can mutate the shared buffer without breaking value semantics. If it's `false`, you deep-copy first, then mutate. That uniqueness check is the heart of copy-on-write.",
  },
  {
    id: "nested-reference-copy",
    type: "predict",
    prompt: "What does this print?",
    code: `class Box { var n = 0 }
struct S { var box = Box(); var tag = 0 }
var a = S()
var b = a
b.tag = 1
b.box.n = 9
print(a.tag, a.box.n)`,
    options: ["0 9", "1 9", "0 0", "1 0"],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Copying `a` into `b` copies the struct's stored properties. `tag` is an `Int` (value type), so it's independent — `a.tag` stays `0`. But `box` is a **class reference**; the copy shares the same `Box`, so `b.box.n = 9` is visible through `a.box.n`. Prints `0 9`. A struct only gives value semantics as deep as its value-type contents.",
  },
  {
    id: "static-vs-dynamic-dispatch",
    type: "mcq",
    prompt: "Why can a method call on a `struct` be cheaper than on a non-`final` `class`?",
    options: [
      "The struct call can use static dispatch (often inlined) and avoids ARC on a reference",
      "Structs cache all their methods at app launch",
      "Classes must re-read their methods from disk on each call",
      "There is no possible performance difference",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A non-overridden struct method uses **static dispatch** — the target is known at compile time and can be inlined — and value types carry no ARC retain/release traffic. A non-`final` class method may dispatch **dynamically** through a vtable, plus ARC on the reference. Marking a class `final` lets the compiler devirtualize.",
  },
  {
    id: "value-mutating-self-trick",
    type: "predict",
    prompt: "🧠 Trick question — what does this print?",
    code: `struct Point {
    var x = 0
    mutating func reset() { self = Point() }
}
var p = Point(x: 5)
p.reset()
print(p.x)`,
    options: ["0", "5", "Compile error", "nil"],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A `mutating` method on a value type can reassign `self` **wholesale** to a brand-new value. `reset()` replaces the entire struct with `Point()` (whose `x` is `0`), so it prints `0`. This is impossible on a class — you can't reassign `self` on a reference type.",
  },
  {
    id: "value-reference-flashcard",
    type: "flashcard",
    prompt:
      "In an interview: explain the difference between a struct and a class, and why Swift's standard library favours structs. Answer aloud, then reveal.",
    modelAnswer:
      "**Structs are value types; classes are reference types.** Assigning or passing a struct copies it, so each copy is independent — there's no shared mutable state and no identity (`===` doesn't apply). A method that mutates a struct needs `mutating`, and a `let` struct is fully immutable. Classes are shared by reference: assignment copies the pointer, mutation is visible through every reference, they have identity, support inheritance and `deinit`. Swift's stdlib is built from structs (with copy-on-write) because value semantics make code easier to reason about and safe across threads — no aliasing bugs.",
    keyPoints: [
      "Value type (copied, independent) vs reference type (shared)",
      "Identity: `===` only for classes; copies have no identity",
      "`mutating` + `let` struct is immutable; `let` class freezes only the reference",
      "Classes add inheritance, `deinit`, ObjC interop",
      "Value semantics → thread-safety-by-default, no aliasing",
    ],
    explanation:
      "Strong answers lead with *semantics* (copy vs share) and connect it to consequences — safety, no aliasing, why the stdlib is struct-based — rather than just listing syntax differences.",
  },
];

export default quiz;
