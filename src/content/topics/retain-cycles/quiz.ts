import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "cycle-definition",
    type: "mcq",
    prompt: "What is a retain cycle?",
    options: [
      "Two or more objects strongly referencing each other, so their counts never reach 0 and none is freed",
      "An object referenced too many times",
      "A loop that runs too long",
      "A stack overflow",
    ],
    answer: 0,
    explanation:
      "A strong reference loop keeps every object in it alive independent of external references — ARC's counts stay above 0, so nobody deinits. It's a leak ARC can't collect.",
  },
  {
    id: "cycle-symptom",
    type: "mcq",
    prompt: "What's the telltale symptom of a retain cycle?",
    options: [
      "`deinit` never runs even after you drop all references",
      "The app crashes immediately",
      "A compile error",
      "Slow launch time",
    ],
    answer: 0,
    explanation:
      "Because the objects keep each other alive, their `deinit` never fires when you expect. Logging `deinit` is the simplest way to catch it.",
  },
  {
    id: "closure-cycle-predict",
    type: "predict",
    prompt: "🧠 Trick question — why does this leak?",
    code: `class VM {
    var onChange: (() -> Void)?
    func setup() {
        onChange = { self.reload() }   // stored closure captures self
    }
    func reload() {}
}`,
    options: [
      "self holds onChange, and onChange captures self strongly → closure ⇄ self cycle; fix with [weak self]",
      "reload() is missing a body",
      "Closures can't capture self",
      "It doesn't leak",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`self` stores the closure, and the closure captures `self` strongly, forming a closure↔self cycle so neither is freed. Add a capture list `{ [weak self] in self?.reload() }` to break it.",
  },
  {
    id: "break-cycle-fill",
    type: "fill",
    prompt: "To break a retain cycle, make one reference in the loop non-owning — declare it `___` (or unowned).",
    answers: ["weak"],
    hint: "The safe non-owning qualifier.",
    explanation:
      "Making one link `weak` (or `unowned`) turns the strong loop into a line, so one object's count can reach 0. Usually the back-reference (child→parent, delegate→owner) is the one made weak.",
  },
  {
    id: "weak-delegate",
    type: "mcq",
    prompt: "Why are delegate properties usually declared `weak`?",
    options: [
      "To avoid a strong cycle where the owner holds the object and the object's delegate points back at the owner",
      "To make them faster",
      "Because delegates are value types",
      "Delegates must be optional strings",
    ],
    answer: 0,
    explanation:
      "A strong delegate creates owner ⇄ object. `weak var delegate` breaks it (and is why delegate protocols are `AnyObject`-constrained — `weak` requires a class).",
  },
  {
    id: "cycles-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about retain cycles.",
    options: [
      "You only need to break one link in a cycle",
      "An escaping/stored closure capturing self can cause a cycle",
      "The Memory Graph Debugger helps find leaked objects and the refs keeping them alive",
      "ARC automatically detects and breaks retain cycles",
    ],
    answers: [0, 1, 2],
    explanation:
      "Breaking one link, escaping-closure cycles, and the Memory Graph Debugger are correct. ARC does **not** detect cycles — that's your job (option 3 is false).",
  },
  {
    id: "nonescaping-no-cycle-senior",
    type: "predict",
    prompt: "🧠 Trick question — does a NON-escaping closure that captures self strongly cause a retain cycle?",
    code: `func run(_ work: () -> Void) { work() }   // non-escaping param
run { self.doThing() }`,
    options: [
      "No — a non-escaping closure runs and returns within the call, so it doesn't outlive self or get stored",
      "Yes — any capture of self leaks",
      "Only on classes",
      "It won't compile",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A non-escaping closure can't be stored and doesn't outlive the function call, so capturing `self` strongly is fine — there's no lasting reference to form a cycle. Cycles come from **escaping/stored** closures. (That's also why non-escaping closures don't force explicit `self.`)",
  },
  {
    id: "parent-child-weak-senior",
    type: "mcq",
    prompt: "In a Parent ⇄ Child cycle, which reference do you typically make weak, and why?",
    options: [
      "The child's `parent` back-reference — the child doesn't own its parent",
      "The parent's `child` reference — the parent shouldn't own the child",
      "Both, to be safe",
      "Neither — use strong both ways",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The owning direction (parent → child) stays strong; the non-owning back-reference (child → parent) becomes `weak`. Making the child weak instead would let the child be freed while the parent still needs it. You only weaken the logically non-owning link.",
  },
  {
    id: "detect-tools-senior",
    type: "mcq",
    prompt: "Which tools help you detect a suspected retain cycle?",
    options: [
      "deinit logging, Xcode's Memory Graph Debugger, and Instruments' Leaks/Allocations",
      "The Swift compiler at build time",
      "SwiftLint",
      "The App Store review process",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Cycles are silent at compile time. You find them at runtime: `deinit` that never prints, the Memory Graph Debugger (which draws the graph and flags leaks), and Instruments' Leaks/Allocations tracking objects that persist.",
  },
  {
    id: "retain-cycles-flashcard",
    type: "flashcard",
    prompt:
      "Explain retain cycles: the two canonical forms, how to break them, and how to detect them. Answer aloud, then reveal.",
    modelAnswer:
      "A **retain cycle** is a loop of **strong** references — objects that hold each other strongly, so ARC's counts never reach 0 and **none deinits** (a leak ARC can't collect). The telltale symptom is a **`deinit` that never runs**. Two canonical forms: **object ⇄ object** (e.g. Parent and Child both strong — fixed by making the back-reference, `child.parent`, **`weak`**) and **closure ⇄ self** (an **escaping/stored** closure captures `self` strongly while `self` holds the closure — fixed with a capture list **`[weak self]`**, or `[unowned self]` if `self` is guaranteed to outlive it). The **strong-delegate** cycle (owner holds object, object's delegate points back strongly) is fixed by a **`weak` delegate** — why delegate protocols are `AnyObject`-constrained. You only need to break **one** link per cycle, usually the logically non-owning one. **Non-escaping** closures generally don't cause cycles (they don't outlive the call). **Detect** with `deinit` logging, Xcode's **Memory Graph Debugger**, or Instruments' Leaks/Allocations. Mental model: a cycle is a strong loop — cut one link to make it a line.",
    keyPoints: [
      "Strong loop → counts never hit 0 → deinit never runs (leak)",
      "object ⇄ object: weak back-reference (child.parent)",
      "closure ⇄ self: [weak self] on escaping/stored closures",
      "Strong delegate cycle → weak delegate (AnyObject)",
      "Break one link; non-escaping closures usually safe; detect via deinit/Memory Graph/Instruments",
    ],
    explanation:
      "Senior answers give both cycle forms with fixes, note escaping-vs-non-escaping closures, break only one link, and cite the detection tools.",
  },
];

export default quiz;
