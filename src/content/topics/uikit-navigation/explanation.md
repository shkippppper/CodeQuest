## The problem: moving between screens (and getting data back)

UIKit navigation is imperative: you tell a controller to show another. The questions that trip people up are *which* mechanism to use (push vs present vs segue), and — the perennial one — **how to pass data forward and, harder, backward**. Getting the data-back pattern right (delegate/closure, not reaching into the presenting VC) is the difference between clean and tangled code.

## `UINavigationController`

A **navigation controller** manages a **stack** of view controllers with a nav bar and automatic back button. You push to go deeper, pop to go back.

```swift
navigationController?.pushViewController(detailVC, animated: true)
navigationController?.popViewController(animated: true)
navigationController?.popToRootViewController(animated: true)
```

The nav controller owns the `viewControllers` stack; pushing a VC adds it, the back button (or swipe-back) pops it. It's for **hierarchical** "drill-down" flows.

## Modal presentation

For a **temporary, self-contained** task (compose, login, a picker), you **present** a VC modally instead of pushing:

```swift
present(composeVC, animated: true)
dismiss(animated: true)
```

`modalPresentationStyle` controls the appearance (`.pageSheet` default on iOS 13+, `.fullScreen`, `.formSheet`, etc.). Key distinction: **push** = part of a navigation hierarchy (back button); **present** = a modal interruption (dismiss). A presented VC can itself contain a navigation controller if it needs its own bar/stack.

## Segues vs programmatic

Two ways to wire it up:

- **Segues** (storyboard) — connect VCs visually; the transition fires automatically or via `performSegue(withIdentifier:sender:)`, and you configure the destination in **`prepare(for:sender:)`**.
- **Programmatic** — instantiate and push/present in code (as above). More explicit, testable, and refactor-friendly; avoids storyboard merge conflicts.

```swift
override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
    if let vc = segue.destination as? DetailVC { vc.item = selectedItem }  // pass data forward
}
```

Many teams prefer programmatic navigation (or coordinators) for larger apps; segues are convenient for small storyboard-driven screens.

## Passing data forward vs back

- **Forward** (to the next screen) is easy: set properties on the destination before pushing/presenting (or in `prepare(for:)`).
- **Backward** (returning a result to the previous screen) is the tricky one. **Don't** have the child reach into or import its parent. Use a **delegate protocol** or a **closure callback** the parent sets:

```swift
protocol EditDelegate: AnyObject { func didSave(_ value: String) }

final class EditVC: UIViewController {
    weak var delegate: EditDelegate?        // weak — avoid retain cycle
    // ... on save:
    // delegate?.didSave(text); navigationController?.popViewController(animated: true)
}
```

Or a closure: `editVC.onSave = { [weak self] value in ... }`. The child stays reusable because it knows only the abstraction, not its caller.

## The Coordinator pattern

As flows grow, putting `pushViewController`/`present` calls inside view controllers couples them to the flow. The **Coordinator pattern** (its own topic) extracts navigation into a separate object: VCs report events (delegate/closure) and the coordinator decides where to go — making controllers reusable and flow logic centralized. UIKit navigation and coordinators pair naturally.

## The interview lens

Contrast the mechanisms: **`UINavigationController`** manages a **push/pop stack** for hierarchical drill-down (back button); **modal presentation** (`present`/`dismiss`) is for a **self-contained interruption**. Know **segue vs programmatic** (storyboard `prepare(for:)` vs code) and why teams often prefer programmatic/coordinators at scale.

The question interviewers love is **passing data back**: forward is trivial (set properties before pushing), but backward should use a **delegate protocol or closure** the parent provides — with a **`weak` delegate** to avoid a retain cycle — **never** the child importing/reaching into its parent. Bonus: mention that the **Coordinator pattern** extracts these push/present calls out of view controllers so navigation logic lives in one place and controllers stay reusable.
