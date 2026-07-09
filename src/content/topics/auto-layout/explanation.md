## The problem: a frame that's only right on one phone

Position a label the direct way:

```swift
label.frame = CGRect(x: 16, y: 400, width: 343, height: 24)
```

On the phone you tested, it looks perfect. Rotate to landscape — it's in the wrong place. Run on a smaller phone — it's clipped. Turn on a larger accessibility font — the text no longer fits in 24 points of height. The numbers were only ever true for one screen, one orientation, one font size.

**Auto Layout** replaces the numbers with *relationships*: "this label sits 16 points from the leading edge, centered vertically." You state the rules; the system solves for the actual frames — on every device, orientation, language, and font size, recomputing whenever anything changes.

## A constraint is an equation

Here's the same label, expressed as rules:

```swift
label.translatesAutoresizingMaskIntoConstraints = false
NSLayoutConstraint.activate([
    label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
    label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
])
```

Each of those lines creates a **constraint** — one rule relating an attribute of one view to an attribute of another. Every constraint, under the hood, is the same simple linear equation:

```swift
// view1.attribute = multiplier × view2.attribute + constant
// "label.leading  =     1      × view.leading    +   16"
```

Because every rule is an equation, the layout engine is literally a *solver*: it gathers all the equations and computes values for every view's x, y, width, and height that satisfy them.

Two mechanical essentials in that snippet. First, the odd-looking line at the top:

```swift
label.translatesAutoresizingMaskIntoConstraints = false
```

Views made in code carry a legacy sizing system called the autoresizing mask, and by default UIKit *translates* it into constraints automatically. Those auto-generated constraints will fight the ones you write. Setting this flag to `false` says "I'm constraining this view myself" — forget it, and you get instant conflicts.

Second, the `leadingAnchor` style. Anchors — `leadingAnchor`, `topAnchor`, `widthAnchor`, and friends — are the modern, type-checked way to build constraints. The older `NSLayoutConstraint(item:attribute:...)` initializer does the same thing with ten stringly arguments; prefer anchors.

### How many constraints are enough?

The solver must be able to pin down four values per view: x, y, width, height. Look at the label above — we gave it *two* constraints, position only. Is that enough?

For a label, yes — and the reason is the next section.

## Views that know their own size

Ask a label how big it wants to be:

```swift
label.text = "Hello"
label.intrinsicContentSize   // e.g. (44, 20) — just big enough for "Hello"
```

A label can measure its own text, so it has a natural size built in. That built-in size is its **intrinsic content size**, and the layout engine treats it as automatic width and height constraints. Buttons size to their title, image views to their image, labels to their text.

That's why the two position constraints were enough: position came from your rules, size came from the content. This is the default rhythm of Auto Layout — pin *where*, let the content decide *how big*.

If you build a custom view with its own natural size, you participate in the same system:

```swift
class BadgeView: UIView {
    var count = 0 {
        didSet { invalidateIntrinsicContentSize() }  // "my natural size changed"
    }
    override var intrinsicContentSize: CGSize {
        CGSize(width: 20 + digits(of: count) * 8, height: 20)
    }
}
```

`invalidateIntrinsicContentSize()` tells the engine to re-ask for the size and re-solve. Forgetting this call is why custom views "don't resize when the content changes".

## When content and space disagree

Intrinsic size is a *preference*, not a law. Put a long label in a narrow screen and something has to give. Two per-view priorities decide how a view fights for its size:

```swift
label.setContentHuggingPriority(.defaultHigh, for: .horizontal)
label.setContentCompressionResistancePriority(.required, for: .horizontal)
```

**Content hugging** is the view's resistance to being stretched *larger* than its intrinsic size — "hug your content, don't grow." Higher hugging means less willing to stretch.

**Compression resistance** is its resistance to being squeezed *smaller* than its intrinsic size. Higher resistance means less willing to truncate or clip.

Now the classic scenario. Two labels share one row, pinned edge to edge, and the row is too narrow for both. Predict: which label truncates?

```swift
// nameLabel — compression resistance 750 (default)
// timeLabel — compression resistance 751
[ nameLabel ][ timeLabel ]
```

Answer: `nameLabel` truncates. When space runs short, the engine squeezes the view with the *lower* compression resistance. One point of difference is enough — the time stays whole, the name gets the ellipsis. "Which label truncates?" is always answered by comparing compression resistance; "which label stretches?" by comparing hugging (lower hugging stretches).

## Priorities: rules that can bend

The hugging and resistance numbers weren't special — *every* constraint carries a priority from 1 to 1000:

```swift
let preferred = card.widthAnchor.constraint(equalToConstant: 400)
preferred.priority = .defaultHigh   // 750 — "please, if possible"
preferred.isActive = true

card.widthAnchor.constraint(lessThanOrEqualTo: view.widthAnchor)
    .isActive = true                // default 1000 — non-negotiable
```

Priority 1000 is `.required`: the solver *must* satisfy it, no exceptions. Anything lower is optional — a preference the solver honors when it can and bends when it must. Here the card wants to be 400 points wide, but on a narrow screen the required "no wider than the screen" rule wins and the 750 width gracefully gives way.

This is how you express "prefer this, but allow that" without conflicts: make one side of the competition optional. Two *required* constraints that disagree are an error; a required constraint and an optional one are a policy.

## Stack views: constraints you don't write

Most real layouts are just things in a row or column. `UIStackView` handles that whole category:

```swift
let stack = UIStackView(arrangedSubviews: [icon, label])
stack.axis = .horizontal
stack.spacing = 8
stack.alignment = .center
```

You constrain the *stack* into place; the stack generates all the constraints between its arranged subviews internally. Four dials control it: `axis` (row or column), `spacing` (gaps), `alignment` (positioning perpendicular to the axis), and `distribution` (how views share space along the axis).

The important mental model: a stack view isn't a different layout system. It distributes space using exactly the machinery you just learned — the arranged subviews' intrinsic sizes, hugging, and compression resistance. When a stack squeezes one label and not another, it's the compression-resistance comparison deciding, same as before. Stack views are the recommended default for linear layouts precisely because they remove hand-written constraints without removing the rules.

## When the solver can't win

Give the engine contradictory required rules:

```swift
label.widthAnchor.constraint(equalToConstant: 100).isActive = true
label.widthAnchor.constraint(equalToConstant: 200).isActive = true
```

At runtime the console prints the infamous wall of text:

```swift
// Unable to simultaneously satisfy constraints.
//   Probably at least one of the constraints in the following list
//   is one you don't want...
```

UIKit doesn't crash. It picks one constraint, breaks it, and carries on with a wrong-looking layout — the log tells you which ones conflicted and which one it broke.

Reading that log is a skill. Two things make it easier. First, name your constraints:

```swift
let width = label.widthAnchor.constraint(equalToConstant: 100)
width.identifier = "label-preferred-width"   // this name appears in the log
```

Second, use Xcode's view debugger — Debug View Hierarchy — which draws the live view tree with every constraint visualized, so you can see the fight instead of parsing it.

There's a second failure mode that logs nothing: too *few* constraints. If the engine can't uniquely determine some view's position or size, the layout is *ambiguous* — the view lands somewhere arbitrary, often wherever the first solve happened to put it, and may jump around. Different disease, different diagnosis:

```swift
view.hasAmbiguousLayout                     // true if underconstrained (debug only)
view.constraintsAffectingLayout(for: .horizontal)  // what IS constraining it
```

So: conflicting means too many rules — the fix is usually lowering one side's *priority*, not deleting constraints blindly. Ambiguous means too few rules — the fix is adding the missing constraint. Knowing which one you have is half the debugging.

## Common pitfalls

- **Forgetting `translatesAutoresizingMaskIntoConstraints = false`** on a code-constrained view. The auto-translated mask constraints conflict with yours. It's the first thing to check on any constraint error.
- **Giving a label explicit width and height it doesn't need.** Labels size themselves; redundant size constraints fight the intrinsic size when the text changes. Pin position, let content size.
- **Two required constraints in competition.** "Width 400" and "fit the screen" can't both be required on a small phone. Make the preference optional (750) and the boundary required.
- **Custom view never resizing.** Its content changed but nobody called `invalidateIntrinsicContentSize()`.
- **Deleting constraints until the error goes away.** You usually trade a conflict for an ambiguity. Diagnose with the log and `constraintsAffectingLayout`, then adjust a priority.

## Interview lens

If asked "how does Auto Layout work?", describe it as a constraint solver: each constraint is a linear equation — attribute equals multiplier times attribute plus constant — and the engine solves the system for every view's x, y, width, and height. Add the two practical must-knows: enough constraints to make each view unambiguous, and `translatesAutoresizingMaskIntoConstraints = false` on anything you constrain in code.

The senior differentiators are intrinsic content size and the hugging/resistance pair. Explain that content-sized views like labels supply their own dimensions, so you usually constrain position only. Then nail the classic: hugging resists growing, compression resistance resists shrinking, and when two labels share a row, the one with lower compression resistance truncates. Interviewers ask that exact question.

On priorities, say that required (1000) constraints must hold while lower priorities yield in order — and that "prefer X but allow Y" is expressed with an optional constraint against a required one, never two required ones.

If debugging comes up, distinguish the two failure modes: "unable to simultaneously satisfy constraints" means contradictory rules and the fix is usually a priority adjustment, while an ambiguous layout means missing rules — `hasAmbiguousLayout` and `constraintsAffectingLayout(for:)` diagnose it. Mentioning constraint `identifier`s and the view debugger signals you've actually fought these logs.
