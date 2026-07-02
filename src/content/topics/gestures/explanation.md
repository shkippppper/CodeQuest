## The problem: recognizing gestures without parsing raw touches

You *could* handle `touchesBegan/Moved/Ended` and compute whether the user tapped, swiped, or pinched — but that's tedious and error-prone. **`UIGestureRecognizer`** does the touch analysis for you: attach a recognizer to a view, and it fires an action when its gesture is detected. It sits on top of the raw touch/responder system and turns messy touch streams into clean, named gestures.

## Built-in recognizers

UIKit ships concrete subclasses for the common gestures:

- **`UITapGestureRecognizer`** — taps (configurable `numberOfTapsRequired`, `numberOfTouchesRequired`).
- **`UIPanGestureRecognizer`** — dragging (`translation(in:)`, `velocity(in:)`).
- **`UILongPressGestureRecognizer`** — press-and-hold.
- **`UISwipeGestureRecognizer`** — directional swipes.
- **`UIPinchGestureRecognizer`** / **`UIRotationGestureRecognizer`** — two-finger zoom/rotate (`scale`, `rotation`).
- **`UIScreenEdgePanGestureRecognizer`** — edge swipes.

You can also subclass `UIGestureRecognizer` for a fully custom gesture.

## Targets & actions

Recognizers use the **target-action** pattern: create one with a target/selector, then add it to a view (which must have `isUserInteractionEnabled = true`).

```swift
let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap))
view.addGestureRecognizer(tap)

@objc func handleTap(_ gr: UITapGestureRecognizer) {
    let point = gr.location(in: view)   // where it happened
}
```

**Discrete** gestures (tap, swipe) fire the action once when recognized. **Continuous** gestures (pan, pinch, long-press) fire **repeatedly** as they progress, so you check the recognizer's **`state`**:

```swift
@objc func handlePan(_ gr: UIPanGestureRecognizer) {
    switch gr.state {
    case .began:   // start
    case .changed: // update (fires many times) — use gr.translation(in:)
    case .ended, .cancelled: // finish
    default: break
    }
}
```

## Simultaneous recognition

By default, only **one** gesture recognizer wins per touch sequence — others fail. To let two recognize **at the same time** (e.g. pinch + rotate together), implement the delegate:

```swift
func gestureRecognizer(_ g: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool { true }
```

To express **ordering/priority** ("only start the pan if the swipe fails"), use **`require(toFail:)`**:

```swift
panGesture.require(toFail: swipeGesture)
```

This is how you disambiguate conflicting gestures (a classic: single-tap vs double-tap — make single-tap `require(toFail:)` the double-tap).

## Delegate methods

`UIGestureRecognizerDelegate` gives fine control:

- **`gestureRecognizerShouldBegin(_:)`** — allow/deny a gesture from starting.
- **`shouldRecognizeSimultaneouslyWith:`** — allow concurrent recognition.
- **`shouldReceive touch:`** — filter which touches count (e.g. ignore touches on a subview/button).
- **`shouldRequireFailureOf:` / `shouldBeRequiredToFailBy:`** — dynamic failure relationships.

These hooks resolve the "my button inside a pannable view doesn't tap" and "two gestures fight each other" problems.

## Custom gestures

Subclass `UIGestureRecognizer`, override `touchesBegan/Moved/Ended/Cancelled`, and set `state` (`.began`/`.changed`/`.recognized`/`.failed`) as you detect (or reject) your gesture. Setting `.failed` early lets other recognizers proceed. This is the escape hatch when the built-ins don't match your interaction.

## The interview lens

Frame recognizers as a **higher-level layer over raw touches**: attach a `UIGestureRecognizer` (built-in like tap/pan/pinch, or a custom subclass) to a view via **target-action**, and it fires when the gesture is detected — the view needs `isUserInteractionEnabled`. Distinguish **discrete** gestures (fire once) from **continuous** ones (fire repeatedly — switch on **`state`**: `.began`/`.changed`/`.ended`).

Senior specifics: by default gestures are **mutually exclusive**, so use the delegate's **`shouldRecognizeSimultaneouslyWith`** for concurrent gestures (pinch+rotate) and **`require(toFail:)`** for priority (single-tap requires the double-tap to fail). Know the delegate hooks (`gestureRecognizerShouldBegin`, `shouldReceive touch:`) for resolving conflicts like a button embedded in a pannable view. Bonus: relate to the responder chain — recognizers can intercept touches before they reach the view's `touchesBegan`.
