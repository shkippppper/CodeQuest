import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "capture-default",
    type: "mcq",
    prompt: "By default, how does a closure capture the variables it uses?",
    options: [
      "By reference, strongly — keeping referenced objects alive and seeing later mutations",
      "By value, always making a copy of every variable at the moment the closure is created",
      "Weakly, since Swift automatically avoids retain cycles by never using strong references inside closures",
      "It doesn\\'t capture anything at all; variables from the enclosing scope are passed in as hidden parameters",
    ],
    answer: 0,
    explanation:
      "Closures capture references strongly by default, so they observe later changes and keep referenced class instances alive. That strong capture of `self` is what causes cycles in escaping/stored closures.",
  },
  {
    id: "weak-self-optional",
    type: "mcq",
    prompt: "Inside a closure with `[weak self]`, what is `self`?",
    options: [
      "An optional that auto-nils if the instance is deallocated",
      "A non-optional guaranteed to exist because the weak capture prevents the instance from ever being released",
      "A bitwise copy of the instance made at the point the closure was created, independent of the original",
      "Completely unavailable; a weakly captured self cannot be referenced at all inside the closure body",
    ],
    answer: 0,
    explanation:
      "`[weak self]` captures `self` weakly, so inside it's an optional (`self?`) that becomes `nil` if the instance is freed — safe access, no dangling pointer.",
  },
  {
    id: "unowned-self-crash",
    type: "mcq",
    prompt: "What's the risk of `[unowned self]`?",
    options: [
      "If `self` is deallocated before the closure runs, accessing it crashes",
      "It leaks memory by keeping a hidden strong reference despite appearing to avoid retain cycles",
      "It is significantly slower than weak because it skips nil checks but must still traverse the reference count table",
      "It silently captures self by value, creating an independent copy that stays alive even after the original deinits",
    ],
    answer: 0,
    explanation:
      "`[unowned self]` is non-optional and doesn't keep `self` alive; using it after `self` is gone is a dangling access → crash. Only use it when `self` is guaranteed to outlive the closure.",
  },
  {
    id: "capture-value-predict",
    type: "predict",
    prompt: "What does this print?",
    code: `var x = 1
let a = { [x] in print(x) }
let b = { print(x) }
x = 99
a()
b()`,
    options: ["1, then 99", "99, then 99", "1, then 1", "99, then 1"],
    answer: 0,
    explanation:
      "`[x]` snapshots the value `1` at closure creation, so `a()` prints `1`. `b` captures the reference and sees the later `x = 99`, so it prints `99`. Capture lists can freeze a value.",
  },
  {
    id: "guard-let-self-fill",
    type: "fill",
    prompt: "With [weak self], re-bind once at the top: `guard let ___ else { return }` to hold self for the whole closure run.",
    answers: ["self"],
    hint: "The instance itself.",
    explanation:
      "`guard let self else { return }` (Swift 5.7+) unwraps weak `self` once and keeps it alive for that closure execution — cleaner than `self?.` everywhere and avoids mid-run inconsistency.",
  },
  {
    id: "capture-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about capture lists.",
    options: [
      "`[weak self]` is the default choice for escaping closures",
      "Capture lists can snapshot a value by naming it (`[x]`)",
      "Accessing a property like `{ someProp }` also captures self",
      "Non-escaping closures require `[weak self]` to avoid cycles",
    ],
    answers: [0, 1, 2],
    explanation:
      "Weak-self default, value snapshots, and implicit self-capture via properties are correct. Non-escaping closures generally **don't** cause cycles, so they don't need `[weak self]` (option 3 is false).",
  },
  {
    id: "nonescaping-noise-senior",
    type: "predict",
    prompt: "🧠 Trick question — is `[weak self]` needed here?",
    code: `let names = items.map { self.name(for: $0) }   // map is non-escaping`,
    options: [
      "No — map's closure is non-escaping and doesn't outlive the call, so there's no cycle; [weak self] just adds noise",
      "Yes — always use [weak self] whenever self is referenced inside any closure, escaping or not, as a safety default",
      "Yes — map stores the closure in an internal buffer and uses it after the synchronous call returns",
      "It won\\'t compile without it because referencing self inside a non-annotated closure is a compile-time error",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`map` takes a **non-escaping** closure that runs and returns immediately — it can't be stored or outlive the call, so capturing `self` strongly is fine. Adding `[weak self]` (forcing `self?`) is unnecessary noise. Reserve capture lists for escaping/stored closures.",
  },
  {
    id: "weak-nil-midrun-senior",
    type: "mcq",
    prompt: "Why prefer `guard let self` over sprinkling `self?.` in a weak-self closure that calls several methods?",
    options: [
      "It holds self for the whole run, avoiding the case where self deallocates mid-closure so later `self?.` calls silently no-op",
      "It is faster to type and produces marginally smaller compiled output by eliminating repeated optional chains",
      "It automatically promotes self from a weak reference capture to an unowned one for the entire remaining duration of the closure body",
      "It captures self by value at the guard statement site, freezing the instance\\'s state for the closure\\'s lifetime",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "With bare `self?.a()` then `self?.b()`, `self` could become nil between the two, running `a` but skipping `b` — an inconsistent partial update. `guard let self else { return }` binds `self` strongly for the closure's duration, so it's all-or-nothing.",
  },
  {
    id: "implicit-self-capture-senior",
    type: "mcq",
    prompt: "Given `[weak self]`, does `{ [weak self] in doWork(with: property) }` (where `property` is on self) still capture self?",
    options: [
      "Reaching `property` requires `self`, so you must write `self?.property` — the weak capture applies but you access through the optional",
      "No — stored properties are captured independently of self, each with their own retain count separate from the instance",
      "It captures a frozen value copy of property at capture-list evaluation time, not a reference to self at all",
      "It captures self strongly regardless of any capture list present, because accessing any stored property always implies a full strong reference to self",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A bare `property` implicitly means `self.property`, so it needs `self`. Under `[weak self]`, `self` is optional, so you must go through it (`self?.property` or after `guard let self`). Forgetting this is a common source of accidental strong capture when you *don't* use a capture list.",
  },
  {
    id: "capture-lists-flashcard",
    type: "flashcard",
    prompt:
      "Explain capture lists: default capture, weak/unowned self, value snapshots, and guard let self. Answer aloud, then reveal.",
    modelAnswer:
      "Closures **capture references strongly by default**, seeing later mutations and keeping referenced objects alive — which forms a retain cycle when an **escaping/stored** closure captures `self` (and `self` holds the closure). A **capture list** (the `[ ... ]` at the closure's start) changes this: **`[weak self]`** captures `self` weakly so inside it's an **optional** that auto-nils (safe — the default for escaping closures); **`[unowned self]`** is non-optional and doesn't keep `self` alive, so it **crashes** if `self` is gone (use only when `self` is guaranteed to outlive the closure) — same relative-lifetime rule as property `weak`/`unowned`. Capture lists also **snapshot values** when you name a variable (`[x]` copies the value at creation time, ignoring later changes). With `[weak self]`, use the **`guard let self else { return }`** idiom to unwrap once and hold `self` for the whole closure run — cleaner than `self?.` everywhere and avoids `self` nil-ing mid-run for an inconsistent partial update. Common mistakes: forgetting `[weak self]` on escaping closures (leak); over-using it on **non-escaping** closures like `map` (needless noise); `[unowned self]` where `self` can die first (crash); and forgetting that touching a property implicitly captures `self`.",
    keyPoints: [
      "Default: strong reference capture (keeps objects alive)",
      "[weak self] = optional, auto-nil, safe (default for escaping); [unowned self] = non-optional, crashes if gone",
      "Capture lists also snapshot values: [x] copies now",
      "guard let self else { return } holds self for the whole run",
      "Escaping/stored closures need capture lists; non-escaping usually don't",
    ],
    explanation:
      "Senior answers cover weak-vs-unowned self, guard-let-self (avoiding mid-run nil), value snapshots, and that non-escaping closures don't need capture lists.",
  },
];

export default quiz;
