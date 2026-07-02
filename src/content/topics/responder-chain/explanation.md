## The problem: which object handles this touch or action?

A tap lands somewhere on screen; a keyboard shortcut fires; a menu command is invoked. UIKit needs a systematic way to decide **which object receives the event** and, if it can't handle it, **who gets it next**. Two mechanisms cooperate: **hit testing** finds the initial view for a touch, and the **responder chain** routes events up a well-defined hierarchy of handlers.

## `UIResponder`

`UIResponder` is the base class for objects that can receive and handle events — **`UIView`, `UIViewController`, `UIApplication`, `UIWindow`, and `AppDelegate`** are all responders. Responders implement event methods (`touchesBegan`, `pressesBegan`, `motionBegan`) and can participate in the chain. If a responder doesn't handle an event, it passes it to its **`next`** responder.

## First responder

The **first responder** is the responder that gets the **first shot at events** not tied to a specific location — chiefly **keyboard input** and shortcuts. A `UITextField` becomes first responder when editing (showing the keyboard):

```swift
textField.becomeFirstResponder()   // start editing / show keyboard
textField.resignFirstResponder()   // end editing / dismiss keyboard
```

You can make a custom view first responder by overriding `canBecomeFirstResponder`. First-responder status is how keyboard events and menu/`UIKeyCommand` actions find their starting point.

## Hit testing

For **touches**, UIKit first finds the view under the finger via **hit testing**, walking the view tree from the top window **downward**:

- **`hitTest(_:with:)`** returns the deepest view containing the point that should receive the touch.
- It uses **`point(inside:with:)`** to ask each view "is this point inside you?"

Hit testing **ignores** views that are hidden, have `isUserInteractionEnabled = false`, or `alpha < 0.01`. Two classic consequences:
- A subview drawn **outside its parent's bounds** won't receive touches (the parent's `point(inside:)` returns false) — override `point(inside:)`/`hitTest` to expand the tappable area.
- To make a view **pass touches through** to what's behind it, return `nil`/the other view from `hitTest`.

Hit testing decides the **initial** view; the responder chain decides what happens if that view doesn't handle it.

## Touch event delivery

Once hit testing picks the view, the touch is delivered to it. If that view (a `UIResponder`) doesn't handle `touchesBegan/Moved/Ended`, the event travels up the **`next` responder** links.

## The responder chain

The chain is the ordered list of `next` responders an unhandled event walks:

```
UIView → (superviews…) → owning UIViewController → window → UIApplication → AppDelegate
```

A view's `next` is usually its superview; the top view's `next` is its view controller; the VC's is the window; then the application and app delegate. Any responder along the way can handle the event and stop the chain. This is how a control's action can be handled by an ancestor, and how `UIMenuController`/`UIKeyCommand`/`target: nil` actions find a handler.

## Custom event handling

- **`target: nil` actions** (`sendAction`) are dispatched **up the responder chain** until some responder implements the selector — the basis of first-responder actions like `cut:`/`copy:`/`paste:` and menu commands.
- Override `next` behavior by handling the event in the appropriate responder, or call `super` to keep it moving.
- For custom motion/press events, override the responder methods and decide whether to consume or forward.

## The interview lens

Separate the two phases: **hit testing** finds the **initial** view for a **touch** (`hitTest(_:with:)` walking down the tree via `point(inside:with:)`, skipping hidden/disabled/near-transparent views), while the **responder chain** routes an **unhandled** event **up** through `next` responders (view → superviews → view controller → window → application → app delegate). The **first responder** is the entry point for non-positional events (keyboard, shortcuts, menu actions).

Have the classic gotchas ready: a subview **outside its parent's bounds isn't tappable** (fix via `point(inside:)`/`hitTest`), returning `nil` from `hitTest` **passes touches through**, and **`target: nil` actions travel up the responder chain** to the first object implementing the selector (how copy/paste and `UIKeyCommand` work). Naming `UIView`/`UIViewController`/`UIApplication`/`AppDelegate` as responders shows you know the chain's shape.
