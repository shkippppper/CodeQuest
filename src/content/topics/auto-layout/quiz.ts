import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "translates-mask",
    type: "mcq",
    prompt: "What must you do before adding Auto Layout constraints to a view created in code?",
    options: [
      "Set `translatesAutoresizingMaskIntoConstraints = false`",
      "Call `layoutIfNeeded()` first",
      "Set its frame to zero",
      "Add it to a UIStackView",
    ],
    answer: 0,
    explanation:
      "Otherwise the view's autoresizing mask is converted into constraints that conflict with yours. Setting it to `false` lets your explicit constraints take over.",
  },
  {
    id: "intrinsic-content-size",
    type: "mcq",
    prompt: "What is a view's intrinsic content size?",
    options: [
      "The natural size it derives from its content (e.g. a label from its text)",
      "The size of its superview",
      "Always 44×44 points",
      "The screen size",
    ],
    answer: 0,
    explanation:
      "Content-driven views (labels, buttons, image views) report an intrinsic size, so you often only constrain position and let intrinsic size supply width/height. Call `invalidateIntrinsicContentSize()` when the content changes.",
  },
  {
    id: "hugging-vs-resistance",
    type: "mcq",
    prompt: "What do content hugging and compression resistance control?",
    options: [
      "Hugging resists growing beyond intrinsic size; compression resistance resists shrinking below it",
      "Hugging resists shrinking; compression resistance resists growing",
      "Both control color",
      "They set the frame directly",
    ],
    answer: 0,
    explanation:
      "Hugging = 'don't stretch past my content'. Compression resistance = 'don't squeeze me below my content'. They decide how views share extra or scarce space.",
  },
  {
    id: "which-truncates-senior",
    type: "predict",
    prompt: "🧠 Trick question — two labels sit side by side and there isn't room for both. Which one truncates?",
    code: `// labelA and labelB in a horizontal row, not enough width`,
    options: [
      "The label with the LOWER horizontal compression-resistance priority",
      "The label with the higher compression resistance",
      "The one added first",
      "Both truncate equally",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Compression resistance is 'resistance to shrinking below intrinsic size'. When space is tight, the label with **lower** compression resistance yields and truncates, while the higher-priority one stays full. Raise one label's compression-resistance priority to protect it.",
  },
  {
    id: "priority-fill",
    type: "fill",
    prompt: "A required constraint has priority ___ (the maximum); lower priorities are optional and yield in conflicts.",
    answers: ["1000"],
    hint: "Priorities range 1–1000.",
    explanation:
      "`.required` is 1000 and must hold. Optional constraints (e.g. `.defaultHigh` = 750) are satisfied in priority order as space allows, which is how you express 'prefer this, but allow that'.",
  },
  {
    id: "stackview-role",
    type: "mcq",
    prompt: "What does `UIStackView` do for you?",
    options: [
      "Generates and manages the constraints for its arranged subviews based on axis/distribution/alignment/spacing",
      "Renders faster than any other view",
      "Replaces the need for view controllers",
      "Disables Auto Layout",
    ],
    answer: 0,
    explanation:
      "A stack view internally creates the constraints to arrange its subviews, using their intrinsic sizes and hugging/resistance priorities. It's the recommended default for linear layouts, cutting hand-written constraints dramatically.",
  },
  {
    id: "autolayout-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about Auto Layout.",
    options: [
      "A constraint is a linear equation relating two view attributes",
      "You need enough constraints to make each view's position and size unambiguous",
      "Higher content hugging makes a view more likely to stretch",
      "Priorities resolve competition between constraints",
    ],
    answers: [0, 1, 3],
    explanation:
      "Linear-equation constraints, unambiguous layout, and priority resolution are correct. Higher hugging makes a view **less** likely to stretch (it 'hugs' its content) — option 3 is false.",
  },
  {
    id: "conflict-log-senior",
    type: "mcq",
    prompt: "You see 'Unable to simultaneously satisfy constraints' in the console. What does it mean and how do you usually fix it?",
    options: [
      "Constraints are contradictory; UIKit broke one to recover — usually fix by adjusting a constraint's priority, not deleting blindly",
      "The app is out of memory",
      "A view is missing from the hierarchy",
      "Auto Layout is disabled",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "It means your constraints can't all hold, so UIKit dropped one, leaving a broken layout. Read the logged conflicting constraints (name them via `identifier`), use the view debugger, and typically **lower a priority** so one constraint can yield gracefully.",
  },
  {
    id: "ambiguous-vs-conflicting-senior",
    type: "mcq",
    prompt: "What's the difference between ambiguous and conflicting layout?",
    options: [
      "Ambiguous = too few constraints (position/size undetermined); conflicting = too many/contradictory constraints",
      "They are the same thing",
      "Ambiguous means the view is offscreen",
      "Conflicting means the view has no superview",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "**Ambiguous** layout lacks enough constraints to determine a unique solution (`hasAmbiguousLayout`, `constraintsAffectingLayout(for:)` help). **Conflicting** layout has contradictory required constraints (the 'unable to simultaneously satisfy' log). The fixes differ: add constraints vs. relax priorities.",
  },
  {
    id: "autolayout-flashcard",
    type: "flashcard",
    prompt:
      "Explain Auto Layout: constraints, intrinsic size, hugging vs compression resistance, and priorities. Answer aloud, then reveal.",
    modelAnswer:
      "**Auto Layout** is a constraint solver: you declare linear relationships (`item.attr = multiplier × item2.attr + constant`) via layout **anchors**, and the engine computes frames for any device — you need enough constraints to make each view **unambiguous**, and must set **`translatesAutoresizingMaskIntoConstraints = false`** on code-constrained views. Many views have an **intrinsic content size** (a label from its text, a button from its title), so you often constrain only position and let intrinsic size supply the dimensions. Two priorities govern how views react to space: **content hugging** resists **growing** beyond intrinsic size, **compression resistance** resists **shrinking** below it — so when two labels can't both fit, the one with **lower compression resistance** truncates. Every constraint has a **priority** (1–1000; `.required` = 1000 must hold, lower ones are optional and yield), which resolves conflicts. **`UIStackView`** manages constraints for linear layouts automatically. Debug conflicts via the 'unable to simultaneously satisfy constraints' log + view debugger, usually fixing by **adjusting priorities** — and distinguish **ambiguous** (too few constraints) from **conflicting** (too many).",
    keyPoints: [
      "Constraints = linear equations via anchors; set translatesAutoresizing…=false",
      "Intrinsic content size supplies dimensions for content-driven views",
      "Hugging resists growing; compression resistance resists shrinking",
      "Lower compression resistance → that view truncates",
      "Priorities (required 1000 vs optional) resolve conflicts; UIStackView automates; debug via the conflict log",
    ],
    explanation:
      "Senior answers nail hugging-vs-compression-resistance (and the which-label-truncates question), priorities for conflict resolution, and the ambiguous-vs-conflicting debugging distinction.",
  },
];

export default quiz;
