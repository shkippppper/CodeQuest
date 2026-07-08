## Two lines that move between screens

Start with the most common navigation call in UIKit:

```swift
let detailVC = DetailViewController()
navigationController?.pushViewController(detailVC, animated: true)
```

The detail screen slides in from the right, and a back button appears automatically. UIKit navigation is *imperative* — you don't declare where screens live, you tell one controller to show another, line by line.

That simplicity hides the two questions that actually trip people up. Which mechanism do you use — push, present, or segue? And how do you pass data forward and, much harder, *backward*? This lesson answers both.

## The navigation stack

The object behind that first snippet is a **navigation controller** — a container that manages a *stack* of view controllers, plus a navigation bar and the automatic back button.

```swift
navigationController?.pushViewController(detailVC, animated: true)   // go deeper
navigationController?.popViewController(animated: true)             // go back one
navigationController?.popToRootViewController(animated: true)       // back to the start
```

Push adds a controller to the top of the stack. Pop removes the top one and reveals the screen underneath.

The stack is real, inspectable state:

```swift
navigationController?.viewControllers   // [HomeVC, ListVC, DetailVC]
```

The back button pops for you, and so does the edge-swipe gesture — you never write "handle back" code. This whole mechanism is for *hierarchical* flows: list to detail to sub-detail, drilling down and climbing back up.

## Modal presentation is for interruptions

Some screens aren't a step deeper — they're a temporary, self-contained task. Composing an email, logging in, picking a photo. For those you **present** the controller instead of pushing it:

```swift
present(composeVC, animated: true)   // slides up over the current screen
dismiss(animated: true)              // and away again
```

The screen arrives *over* the current one rather than beside it in a hierarchy. Notice there's no back button — a modal ends by being dismissed, not popped.

You control the look with one property:

```swift
composeVC.modalPresentationStyle = .fullScreen   // cover everything
```

Since iOS 13 the default is `.pageSheet` — a card that leaves the parent peeking out at the top. `.fullScreen` covers everything; `.formSheet` floats a centered card on iPad.

So the distinction to internalize: *push* means "part of a hierarchy, back button"; *present* means "a modal interruption, dismiss when done."

### A modal can carry its own stack

Predict: you present a plain view controller and set its `title`. Where does the title show up?

Answer: nowhere. A navigation bar belongs to a navigation controller, and a presented controller doesn't have one. If the modal task needs its own bar or its own drill-down, wrap it:

```swift
let nav = UINavigationController(rootViewController: composeVC)
present(nav, animated: true)
```

Now the modal has a bar, a title, and its own independent push/pop stack.

## Segues or code — two ways to wire it

Everything so far was programmatic. Storyboards offer a second wiring: a **segue** — a transition you draw between two controllers in Interface Builder.

A segue fires automatically from a tapped cell or button, or manually from code:

```swift
performSegue(withIdentifier: "showDetail", sender: self)
```

Either way, you get one chance to configure the destination before it appears:

```swift
override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
    if let vc = segue.destination as? DetailViewController {
        vc.item = selectedItem       // pass data forward
    }
}
```

`prepare(for:sender:)` hands you the destination just before the transition — that's where forward data goes in storyboard land.

The programmatic route is the same work in plain code: instantiate, set properties, push or present. It's more explicit, easier to test, friendlier to refactoring — and it avoids storyboard merge conflicts, which is why many teams prefer it for larger apps. Segues stay convenient for small, storyboard-driven screens.

## Passing data forward is the easy direction

Forward means "to the screen I'm about to show." You already own the destination object, so you just set its properties before the transition:

```swift
let detailVC = DetailViewController()
detailVC.item = selectedItem                 // forward: set before showing
navigationController?.pushViewController(detailVC, animated: true)
```

That's it — either directly like this, or inside `prepare(for:)` if a segue is doing the showing.

## Passing data back is the direction that separates candidates

Now the reverse: an edit screen needs to hand its result to the list that pushed it. The tempting hack is to reach backward:

```swift
// inside EditViewController — DON'T do this
let list = navigationController?.viewControllers.first as? ListViewController
list?.items.append(newItem)
```

This welds the child to one specific parent. `EditViewController` now only works when a `ListViewController` sits below it — it can't be reused anywhere else, and it can't be tested alone.

### The delegate pattern

Instead, the child announces its result through a protocol and stays ignorant of who's listening:

```swift
protocol EditDelegate: AnyObject {
    func didSave(_ value: String)
}
```

The child holds a reference to *someone* conforming to it:

```swift
final class EditViewController: UIViewController {
    weak var delegate: EditDelegate?

    func saveTapped() {
        delegate?.didSave(textField.text ?? "")
        navigationController?.popViewController(animated: true)
    }
}
```

The parent conforms, sets itself as the delegate before pushing, and receives the result:

```swift
final class ListViewController: UIViewController, EditDelegate {
    func openEditor() {
        let editVC = EditViewController()
        editVC.delegate = self
        navigationController?.pushViewController(editVC, animated: true)
    }
    func didSave(_ value: String) { items.append(value) }
}
```

The child knows only the abstraction `EditDelegate` — any screen that conforms can use it. That's what keeps it reusable.

### Why the delegate must be weak

Predict: what happens if `delegate` is a strong reference instead of `weak`?

Answer: a retain cycle. The parent strongly holds the pushed child through the navigation stack, and the child would strongly hold the parent back — two objects keeping each other alive forever, and neither `deinit` ever runs. `weak var delegate` breaks the cycle, which is why you see it on virtually every delegate in UIKit.

### The closure alternative

The same idea, lighter ceremony — the parent hands the child a callback:

```swift
editVC.onSave = { [weak self] value in
    self?.items.append(value)
}
```

One closure property instead of a protocol. Note the `[weak self]` — it's doing the same cycle-breaking job the weak delegate did.

## When flows outgrow this

Every `pushViewController` and `present` call in this lesson lives *inside* a view controller. That means each controller knows which screen comes next — fine for a few screens, but in a big app it couples every controller to one fixed flow.

The **Coordinator pattern** fixes that by moving all navigation calls into separate flow objects: controllers just report events through delegates or closures, and a coordinator decides where to go. It has its own lesson later — for now, know that it's the standard answer to "my view controllers are doing too much navigating," and that it builds directly on the delegate/closure patterns you just saw.

## Common pitfalls

- **Reaching into `navigationController?.viewControllers` to send data back.** Couples the child to one parent; use a delegate or closure instead.
- **A strong delegate reference.** Retain cycle — parent and child keep each other alive. Delegates are `weak`.
- **Presenting a controller and wondering where the nav bar went.** Modals have no bar of their own; wrap the modal in a `UINavigationController`.
- **Pushing a modal-shaped screen (or presenting a drill-down).** Push is for hierarchy, present is for self-contained interruptions — mixing them confuses users' back-button expectations.

## Interview lens

If asked to contrast the mechanisms, keep it crisp: a `UINavigationController` manages a push/pop stack for hierarchical drill-down and gives you the back button; `present`/`dismiss` shows a self-contained modal interruption with no stack membership. Mention that a presented screen wraps itself in its own navigation controller when it needs a bar.

On segues versus programmatic: know that segues configure the destination in `prepare(for:sender:)`, and be ready to say why teams often go programmatic at scale — explicitness, testability, and no storyboard merge conflicts.

The question interviewers really love is passing data *back*. Forward is trivial — set properties before showing. Backward should go through a delegate protocol or a closure the parent provides, never the child reaching into its parent. Say the word "weak" out loud when you describe the delegate — the retain cycle is exactly what they're listening for. And earn a bonus point by noting the Coordinator pattern extracts these push/present calls out of controllers entirely, so flow logic lives in one place.
