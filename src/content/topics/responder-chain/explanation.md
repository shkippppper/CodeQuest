## A tap has to land somewhere

Your screen is a tree of views — a window containing a controller's view, containing a card, containing a button:

```swift
window
└─ ViewController.view
   └─ cardView
      └─ likeButton
```

A finger touches the glass. UIKit now has two problems to solve.

First: *which* of those views should receive the touch? Second: if that view doesn't handle the event, *who gets it next*?

Two mechanisms answer them. **Hit testing** finds the initial view for a touch, walking *down* the tree. The **responder chain** routes unhandled events *up* a well-defined ladder of handlers. Keyboard shortcuts and menu commands ride the same ladder. This lesson walks both directions.

## Everything that can handle an event is a UIResponder

Look at the handler you'd write for a raw touch:

```swift
class CardView: UIView {
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        print("card touched")
    }
}
```

You can override `touchesBegan` here because `UIView` inherits from **`UIResponder`** — the base class for anything that can receive and handle events.

The cast of responders is worth memorizing, because it becomes the chain later: `UIView`, `UIViewController`, `UIWindow`, `UIApplication`, and your `AppDelegate` are all responders.

Responders get a family of event methods to override — `touchesBegan` for touches, `pressesBegan` for hardware buttons and keyboards, `motionBegan` for shakes. And every responder has one crucial property:

```swift
view.next   // the responder that gets the event if this one doesn't handle it
```

`next` is the link. Chain the links together and you get the routing system for the whole app.

## Hit testing walks down to find the touched view

Touches come with a location, so UIKit starts at the window and asks the tree who owns that point:

```swift
let target = window.hitTest(touchPoint, with: event)
```

**`hitTest(_:with:)`** recursively walks the view tree from the window *downward* and returns the deepest view that contains the point. Deepest wins — a tap on `likeButton` returns the button, not the card behind it.

To decide "does this view contain the point?", hit testing asks each view a simpler question:

```swift
override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    bounds.contains(point)    // the default answer
}
```

So the algorithm is: check `point(inside:)`, and if true, recurse into subviews from front to back.

### Three kinds of views are invisible to touches

Hit testing skips a view — and its entire subtree — when any of these hold:

```swift
view.isHidden = true                  // hidden
view.isUserInteractionEnabled = false // interaction off
view.alpha = 0.005                    // effectively transparent (alpha < 0.01)
```

An `alpha` of 0.05 is nearly invisible to eyes but still tappable; 0.005 is not. The cutoff is 0.01.

### Predict: the button hanging outside its parent

A button is a subview of `cardView`, but it's positioned so it pokes out below the card's bounds. The user taps the poking-out part. What happens?

Answer: nothing. When hit testing asks `cardView` "is this point inside you?", the card says no — and the walk never descends to the button. A subview drawn outside its parent's bounds is visible but *not tappable*.

The fix is to override the question at the parent:

```swift
override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    bounds.insetBy(dx: -20, dy: -20).contains(point)   // grow the tappable area
}
```

The same override is how you expand a too-small tap target without resizing the view.

### Making a view let touches through

The opposite trick — an overlay that should ignore touches and let the content behind it react:

```swift
override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let view = super.hitTest(point, with: event)
    return view == self ? nil : view    // "not me" — pass through
}
```

Returning `nil` tells the walk "nobody here," so the search continues to whatever is behind. Subviews still get their touches; only the overlay itself becomes transparent to them.

## Unhandled events climb the responder chain

Hit testing picked a view; the touch is delivered to it. Suppose that view *doesn't* override `touchesBegan`. Now the second mechanism kicks in: the event walks the `next` links upward.

The ladder has a fixed shape:

```
UIView → superview → ... → owning UIViewController → UIWindow → UIApplication → AppDelegate
```

A view's `next` responder is normally its superview. The one twist: a view controller's *root* view points to the view controller itself, not to the root view's superview. After the controller comes the window, then the application, then the app delegate.

Any responder along the way can handle the event and stop the climb. Keep the default behavior alive by calling up:

```swift
override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    print("saw the touch")
    super.touchesBegan(touches, with: event)   // keep it moving up the chain
}
```

Handle without calling `super` and the event is consumed. Call `super` and it continues climbing. That choice — consume or forward — is yours at every rung.

This climb is why a touch on a dumb, handler-less view can end up handled by its view controller: the controller is simply a few rungs up the same ladder.

## The first responder starts the non-touch events

Touches carry a location, so hit testing can find their target. Keyboard input carries no location — when the user types, *which* object should the key events go to?

The answer is a designated starting point called the **first responder** — the responder that gets first shot at events not tied to a screen position: keyboard input, shortcuts, menu actions, shake gestures.

You've triggered this a hundred times:

```swift
textField.becomeFirstResponder()   // start editing — the keyboard appears
textField.resignFirstResponder()   // stop editing — the keyboard goes away
```

"Show the keyboard" and "become first responder" are the same act: the text field volunteers to be where key events begin.

Custom views can volunteer too:

```swift
class GameView: UIView {
    override var canBecomeFirstResponder: Bool { true }
}
```

Now `gameView.becomeFirstResponder()` works, and hardware-keyboard commands defined with `UIKeyCommand` — UIKit's type for app keyboard shortcuts — start their search at this view. From the first responder, unhandled events climb the same chain as before.

## Actions with no target ride the chain too

Normally a button action names its target explicitly. But you can leave the target blank:

```swift
UIApplication.shared.sendAction(#selector(save(_:)), to: nil, from: self, for: nil)
```

A `nil` target means "I don't know who handles this — someone up the chain does." UIKit starts at the first responder and walks up until it finds a responder that actually implements `save(_:)`. That responder gets the call.

This is not an exotic trick — it's how the system edit menu works. `cut:`, `copy:`, and `paste:` are nil-targeted actions that land on whatever responder implements them, which is why copy/paste works in any text view without wiring. `UIKeyCommand` shortcuts and menu commands resolve their handlers the same way.

## Custom event handling, summarized

Everything custom you do with events is a combination of the pieces above:

- Handle an event at the right level by overriding `touchesBegan`, `pressesBegan`, or `motionBegan` on whichever responder should own it — view, controller, even the window.
- Decide consume-or-forward with `super`: skip it to stop the event, call it to pass the event up.
- Reshape *where touches land* with `hitTest` and `point(inside:)` — expand tap areas, pass touches through overlays.
- Let nil-targeted actions find their handler by implementing the selector anywhere on the chain.

## Common pitfalls

- **A subview outside its parent's bounds doesn't get taps.** The parent's `point(inside:)` says no before the walk reaches the child. Override `point(inside:)` or `hitTest` on the parent.
- **A view with `alpha` below 0.01, hidden, or `isUserInteractionEnabled = false` is skipped by hit testing** — along with all its subviews. Check these three before debugging anything fancier.
- **Forgetting `super` in a touch override.** The event stops with you; ancestors that expected it never see it. Call `super` unless consuming is intentional.
- **Expecting a keyboard with no first responder.** Key events need a starting point; something must `becomeFirstResponder`, and a custom view must also return `true` from `canBecomeFirstResponder`.

## Interview lens

The shape interviewers want is the two-phase story, told in order. Phase one, hit testing: for a touch, UIKit walks *down* the view tree with `hitTest(_:with:)`, asking `point(inside:with:)` at each step, skipping views that are hidden, interaction-disabled, or under 0.01 alpha, and returns the deepest view containing the point. Phase two, the responder chain: if that view doesn't handle the event, it climbs *up* the `next` links — view, superviews, owning view controller, window, application, app delegate.

Name that exact chain out loud; knowing the view controller sits between its root view and the window is what distinguishes a real answer from a vague one.

Then have the classics ready. A subview outside its parent's bounds isn't tappable — fixed by overriding `point(inside:)` or `hitTest`. Returning `nil` from `hitTest` passes touches through a view. And nil-targeted actions travel up the chain to the first responder that implements the selector — which is how `copy:`/`paste:` and `UIKeyCommand` find their handlers. If they ask about the first responder, define it as the entry point for non-positional events like keyboard input, entered via `becomeFirstResponder` and gated by `canBecomeFirstResponder`.
