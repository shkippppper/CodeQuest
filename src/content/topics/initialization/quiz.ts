import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "struct-memberwise",
    type: "mcq",
    prompt: "Which types get a free memberwise initializer synthesized by the compiler?",
    options: ["Structs", "Classes", "Both structs and classes", "Enums"],
    answer: 0,
    explanation:
      "Only **structs** get a synthesized memberwise initializer (`Point(x:y:)`). Classes have none — you write your own. Enums are initialized by choosing a case, not a memberwise init.",
  },
  {
    id: "failable-init",
    type: "predict",
    prompt: "What is the type and value of `a`?",
    code: `struct Age {
    let value: Int
    init?(_ n: Int) {
        guard n >= 0 else { return nil }
        value = n
    }
}
let a = Age(-5)`,
    options: ["`Age?` equal to nil", "`Age` equal to 0", "A runtime crash", "`Age?` equal to -5"],
    answer: 0,
    explanation:
      "`init?` is **failable**: it returns `Age?`. `-5` fails the guard, so the initializer returns `nil` — no crash, no instance.",
  },
  {
    id: "convenience-delegate",
    type: "mcq",
    prompt: "A `convenience` initializer must ultimately call…",
    options: [
      "another initializer in the same class (delegate across)",
      "its superclass's initializer directly (delegate up)",
      "nothing — it can set properties directly",
      "a `required` initializer only",
    ],
    answer: 0,
    explanation:
      "Convenience inits **delegate across** (`self.init(...)`), funneling to a designated init. Designated inits are the ones that **delegate up** (`super.init()`). Every chain ends at a designated initializer.",
  },
  {
    id: "deinit-classes-only",
    type: "mcq",
    prompt: "Which types can have a `deinit`?",
    options: ["Only classes", "Only structs", "Classes and structs", "Any type"],
    answer: 0,
    explanation:
      "Only **classes** have `deinit`, called by ARC just before deallocation. Value types (structs, enums) have no shared lifetime to clean up, so they don't have one.",
  },
  {
    id: "required-fill",
    type: "fill",
    prompt: "Which keyword on an initializer forces every subclass to implement (or inherit) it?",
    answers: ["required"],
    hint: "8 letters — you're 'required' to provide it.",
    explanation:
      "`required init` must appear on all subclasses (they mark their version `required` too). A common example is `required init?(coder:)` for `NSCoding`.",
  },
  {
    id: "two-phase-order",
    type: "predict",
    prompt: "Does this compile, and if not, why?",
    code: `class A { var a: Int; init() { a = 1 } }
class B: A {
    var b: Int
    override init() {
        super.init()
        b = 2
    }
}`,
    options: [
      "No — `b` must be set before `super.init()`",
      "Yes, it compiles fine",
      "No — you can't override `init`",
      "No — `A` needs a `required` init",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Phase 1 requires each class to initialize **its own** stored properties before calling `super.init()`. `b` is set after `super.init()`, so the compiler errors: property `b` not initialized at super.init call. Move `b = 2` above `super.init()`.",
  },
  {
    id: "init-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about Swift initialization.",
    options: [
      "A designated initializer must set every stored property of its class",
      "Adding a custom init in a struct's main declaration removes the synthesized memberwise init",
      "`convenience` initializers can call `super.init` directly",
      "`init?` returns an optional to signal possible failure",
    ],
    answers: [0, 1, 3],
    explanation:
      "Designated inits fully initialize the class; a custom struct init in the main declaration removes the memberwise one (define it in an `extension` to keep both); and `init?` is failable. Convenience inits delegate **across** (`self.init`), not up to `super` — so option 3 is false.",
  },
  {
    id: "struct-extension-init-senior",
    type: "mcq",
    prompt: "You want a custom initializer on a struct AND keep the free memberwise init. How?",
    options: [
      "Define the custom init in an `extension`, not the main type declaration",
      "Mark the struct `@memberwise`",
      "It's impossible — a custom init always removes it",
      "Declare the custom init as `convenience`",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Adding a custom init inside the struct's **main declaration** suppresses the synthesized memberwise init. Put the custom init in an **`extension`** and Swift keeps both — a handy trick for adding conveniences without losing `Point(x:y:)`.",
  },
  {
    id: "self-before-super-senior",
    type: "mcq",
    prompt: "During phase 1 of class initialization (before `super.init()` returns), what can you NOT do?",
    options: [
      "Call instance methods, read inherited properties, or otherwise use a not-yet-complete `self`",
      "Set your own stored properties",
      "Declare local variables",
      "Use literals",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Until the whole chain finishes phase 1, `self` isn't a fully valid object, so you can't call methods or read inherited state — only set your own stored properties, then call `super.init()`. Phase 2 (after `super.init()`) is where using `self` becomes safe.",
  },
  {
    id: "deinit-retain-cycle-senior",
    type: "mcq",
    prompt: "Your class's `deinit` never runs even after you drop all obvious references. Most likely cause?",
    options: [
      "A retain cycle is keeping the instance alive",
      "Swift never calls deinit for classes",
      "The deinit needs to be marked `required`",
      "Structs can't have deinit",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "ARC deallocates (and runs `deinit`) only when the last strong reference goes away. A `deinit` that never fires is the classic symptom of a **retain cycle** — often a closure capturing `self` strongly, or two objects holding each other. Break it with `weak`/`unowned`.",
  },
  {
    id: "initialization-flashcard",
    type: "flashcard",
    prompt:
      "Explain two-phase initialization and the practical rule it produces. Answer aloud, then reveal.",
    modelAnswer:
      "Swift initializes a class in **two phases**. **Phase 1** goes bottom-up: each class sets its own stored properties, then calls `super.init`, until the root class is reached and every stored property in the whole hierarchy has a value. During phase 1 you may not use `self` beyond setting your own properties — no method calls, no reading inherited state — because the object isn't fully formed. **Phase 2** goes top-down: once the chain is initialized, each initializer can customize further, call methods, and touch inherited members safely. The practical rule: **set your own stored properties before `super.init()`, and only use `self`/inherited members after it.** This is what guarantees you can never observe a partially-initialized object — a stronger safety property than most languages offer.",
    keyPoints: [
      "Phase 1 bottom-up: set own props, then super.init, up to root",
      "Phase 2 top-down: customize, now self is usable",
      "Rule: own properties before super.init(); self after",
      "Designated delegates up; convenience delegates across",
      "Prevents observing a half-initialized object",
    ],
    explanation:
      "The senior signal is stating the ordering rule precisely and explaining *why* it exists (no partially-initialized object is ever observable), plus the designated/convenience delegation directions.",
  },
];

export default quiz;
