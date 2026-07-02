## The problem: one layout, many screen sizes

Hard-coding frames breaks the moment the screen size, font size, or language changes. **Auto Layout** lets you describe **relationships** ("this label is 16pt from the leading edge, vertically centered") and the system solves for actual frames on every device and orientation. It's a constraint solver: you give it rules, it computes positions and sizes.

## Constraints & the layout engine

A **constraint** is a linear equation relating two view attributes:

```
view1.attribute = multiplier × view2.attribute + constant
```

```swift
label.translatesAutoresizingMaskIntoConstraints = false
NSLayoutConstraint.activate([
    label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
    label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
])
```

Two essentials: set **`translatesAutoresizingMaskIntoConstraints = false`** on any view you constrain in code (otherwise its autoresizing mask generates conflicting constraints), and prefer **layout anchors** (`leadingAnchor`, etc.) over raw `NSLayoutConstraint(...)`. The engine needs enough constraints to **unambiguously** determine each view's x, y, width, and height.

## Intrinsic content size

Some views know their **natural size** from their content — a `UILabel` is as wide as its text, a `UIButton` fits its title, a `UIImageView` is its image's size. This is the **intrinsic content size**. Because of it you often don't specify width/height at all — you pin position and let intrinsic size supply the dimensions. Call `invalidateIntrinsicContentSize()` when a custom view's content changes its natural size.

## Content hugging & compression resistance

When there's extra or insufficient space, how does a view react? Two priorities decide:

- **Content Hugging** — resistance to **growing** larger than intrinsic size ("hug your content"). Higher hugging = less likely to stretch.
- **Compression Resistance** — resistance to **shrinking** below intrinsic size. Higher resistance = less likely to be clipped/truncated.

```swift
label.setContentHuggingPriority(.defaultHigh, for: .horizontal)
label.setContentCompressionResistancePriority(.required, for: .horizontal)
```

The classic use: two labels in a row — give the one that should stay full-size **higher compression resistance** so the *other* one truncates. "Which label truncates?" is answered by compression-resistance priority.

## Priorities

Every constraint has a **priority** (1–1000). `.required` (1000) must hold; lower priorities are optional and yield when they conflict. Priorities resolve competition: the solver satisfies required constraints, then satisfies optional ones in priority order as space allows. This is how you express "prefer this, but allow that" — e.g. a `.defaultHigh` (750) width that gives way when the screen is narrow.

## Stack views

`UIStackView` is the high-level tool that manages constraints for you: give it arranged subviews plus `axis`, `distribution`, `alignment`, and `spacing`, and it generates the constraints internally.

```swift
let stack = UIStackView(arrangedSubviews: [icon, label])
stack.axis = .horizontal
stack.spacing = 8
stack.alignment = .center
```

Stack views dramatically reduce hand-written constraints and are the recommended default for linear layouts (they use intrinsic sizes and the hugging/resistance priorities of their arranged subviews to distribute space).

## Debugging conflicts

When constraints can't all be satisfied, UIKit logs **"Unable to simultaneously satisfy constraints"** and breaks one to recover — leaving a broken layout. To debug:

- Read the console log; it lists the conflicting constraints (name them via `identifier` for readability).
- Use the **view debugger** (Debug View Hierarchy) to see constraints visually.
- **Ambiguous** layout (too few constraints) is different from **conflicting** (too many/contradictory); `hasAmbiguousLayout` and `constraintsAffectingLayout(for:)` help diagnose. Fixes usually mean adjusting **priorities** (lower one side) rather than deleting constraints blindly.

## The interview lens

Explain Auto Layout as a **constraint solver**: you declare linear relationships (`item.attr = m × item2.attr + c`) and it computes frames; you need enough constraints to make each view **unambiguous**, and you must set **`translatesAutoresizingMaskIntoConstraints = false`** on code-constrained views.

The senior differentiators are **intrinsic content size** (content-sized views like labels supply their own dimensions) and the **hugging vs compression-resistance** pair: **hugging resists growing**, **compression resistance resists shrinking** — and "which of two labels truncates?" is decided by the lower **compression resistance**. Mention **priorities** (required vs optional, resolving conflicts), **`UIStackView`** as the constraint-managing default, and how to debug the **"unable to simultaneously satisfy constraints"** log (usually a priority fix, and distinguishing ambiguous vs conflicting layouts).
