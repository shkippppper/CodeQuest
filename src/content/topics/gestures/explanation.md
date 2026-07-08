## Detecting a tap by hand is miserable

You already know views can receive raw touches. So detecting a double-tap should be easy, right?

```swift
override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    // is this the second tap? within what time window?
    // did the finger stay near the first tap's location?
    // what if a third finger arrived? what if the touch moved and it's really a drag?
}
```

Every question in those comments is your problem. Timers, distance thresholds, touch counting, cancellation — for *one* gesture. Pinch-to-zoom by hand means tracking two fingers and doing trigonometry.

UIKit already solved this. A **`UIGestureRecognizer`** is an object that watches the raw touch stream on a view and announces "that was a tap" or "that's a pinch in progress." It sits on top of the touch and responder machinery and turns messy touch sequences into clean, named gestures.

## Attach a recognizer, get a callback

Here is the double-tap, done properly:

```swift
let doubleTap = UITapGestureRecognizer(target: self, action: #selector(handleDoubleTap))
doubleTap.numberOfTapsRequired = 2
imageView.addGestureRecognizer(doubleTap)
```

Three lines. Create the recognizer with a **target-action** pair — an object to notify plus the method to call — configure it, attach it to a view.

One requirement bites beginners: the view must accept touches at all.

```swift
imageView.isUserInteractionEnabled = true   // UIImageView defaults to false!
```

`UIImageView` and `UILabel` ship with interaction disabled, so a recognizer on them silently never fires until you flip this.

The handler receives the recognizer itself, which knows where things happened:

```swift
@objc func handleDoubleTap(_ gr: UITapGestureRecognizer) {
    let point = gr.location(in: imageView)   // where the taps landed
    zoom(to: point)
}
```

## The built-in recognizers

UIKit ships a concrete subclass for each common gesture, each with its own useful knobs:

- `UITapGestureRecognizer` — taps; configure `numberOfTapsRequired` and `numberOfTouchesRequired`.
- `UIPanGestureRecognizer` — dragging; exposes `translation(in:)` and `velocity(in:)`.
- `UILongPressGestureRecognizer` — press and hold.
- `UISwipeGestureRecognizer` — quick directional flicks.
- `UIPinchGestureRecognizer` — two-finger zoom; exposes `scale`.
- `UIRotationGestureRecognizer` — two-finger twist; exposes `rotation`.
- `UIScreenEdgePanGestureRecognizer` — pans that start at a screen edge, like back-swipe.

When none of these fit, you subclass `UIGestureRecognizer` yourself — that's the last section of this lesson.

## Discrete gestures fire once, continuous ones fire a stream

A tap either happened or it didn't — the action fires exactly once. Gestures like that are called **discrete**.

Now attach a pan and watch what arrives:

```swift
let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan))
cardView.addGestureRecognizer(pan)
```

As the finger drags, `handlePan` is called *dozens of times per second*. A gesture that reports progress while it happens is **continuous** — pan, pinch, rotation, and long-press all are.

A continuous handler therefore always switches on the recognizer's `state`:

```swift
@objc func handlePan(_ gr: UIPanGestureRecognizer) {
    switch gr.state {
    case .began:
        // finger started dragging — remember the starting position
    case .changed:
        // fires repeatedly — move the card by gr.translation(in: view)
    case .ended, .cancelled:
        // finger lifted (or a phone call interrupted) — settle or snap back
    default:
        break
    }
}
```

Treat `.cancelled` like `.ended` with cleanup: the system can kill a gesture mid-flight, and your card shouldn't be left stranded halfway.

## When two gestures want the same touch

Attach both a single-tap and a double-tap recognizer to the same view. The user double-taps.

Predict: what fires?

Answer: the *single-tap* fires — on the first tap, before the second even lands. The single-tap recognizer has no reason to wait; a tap arrived, so it announces it. Your double-tap handler may fire too, after — but the single-tap has already done its (wrong) thing.

Why did they both get a say at all? Because by default, gesture recognizers are *mutually exclusive per touch sequence* — once one recognizes, others are forced to fail — but the single-tap recognized *first*. The default rules pick a winner; they just picked the one you didn't want.

### Ordering: make one gesture wait for another

The fix is an explicit dependency:

```swift
singleTap.require(toFail: doubleTap)
```

Read it as: "single-tap may only succeed once double-tap has *failed*." Now a first tap makes the single-tap recognizer hold its breath; if a second tap arrives in time, the double-tap wins and the single-tap fails. If no second tap comes, the double-tap fails and the single-tap fires — slightly delayed, correctly.

`require(toFail:)` is the general tool for priority between conflicting gestures: pan waits for swipe, tap waits for long-press, and so on.

### Cooperation: let two gestures run together

Sometimes you want the opposite — pinch *and* rotate simultaneously on a photo. Exclusivity would force the user to pick one. Opt into cooperation via the recognizer's delegate:

```swift
func gestureRecognizer(_ g: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool {
    true   // pinch and rotation may both be active
}
```

Return `true` and both recognizers process the same touches at once — the user zooms and twists in one motion.

## The delegate hooks, in one place

`UIGestureRecognizerDelegate` is small but it resolves nearly every real-world gesture conflict:

```swift
func gestureRecognizerShouldBegin(_ g: UIGestureRecognizer) -> Bool {
    // veto a gesture before it starts — e.g. only allow horizontal pans
}
func gestureRecognizer(_ g: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
    // filter touches — e.g. ignore touches that land on a button
    !(touch.view is UIButton)
}
```

- `gestureRecognizerShouldBegin` — allow or deny the gesture at the last moment.
- `shouldReceive touch:` — decide per-touch whether this recognizer even sees it. This is the standard fix for "my button inside a pannable view won't tap": tell the pan recognizer to ignore touches on the button.
- `shouldRecognizeSimultaneouslyWith` — the cooperation hook from above.
- `shouldRequireFailureOf:` / `shouldBeRequiredToFailBy:` — `require(toFail:)` relationships, but decided dynamically at runtime instead of hard-wired at setup.

## Writing your own recognizer

When the built-ins don't match your interaction — say, a "draw a circle" gesture — you subclass `UIGestureRecognizer` and drive its state machine yourself:

```swift
class CircleGestureRecognizer: UIGestureRecognizer {
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        state = .began           // a continuous gesture starts
    }
    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
        if strayedTooFarFromCircle() {
            state = .failed      // give up early — frees other recognizers
        } else {
            state = .changed
        }
    }
    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        state = circleComplete() ? .recognized : .failed
    }
}
```

You receive the same raw `touchesBegan/Moved/Ended/Cancelled` a view would, and your only real job is setting `state` honestly. Setting `.failed` as early as possible matters: while your recognizer is undecided, it may be blocking others, so bail out the moment the touches can't be your gesture.

## Recognizers cut in line ahead of the view

One connection back to the responder chain lesson: a recognizer attached to a view analyzes touches *before* the view's own `touchesBegan` gets a normal chance. Once a recognizer recognizes, it cancels the view's touches — the view receives `touchesCancelled` and the recognizer owns the rest of the sequence.

So if a view's touch-handling code mysteriously stops mid-gesture, look for a recognizer that just recognized and stole the stream. That's by design: recognizers are the higher-level layer, and they win.

## Common pitfalls

- **Recognizer never fires on a `UIImageView` or `UILabel`.** Their `isUserInteractionEnabled` defaults to `false`. Turn it on.
- **Single-tap fires during every double-tap.** Defaults pick the first recognizer to succeed. Add `singleTap.require(toFail: doubleTap)`.
- **Pinch and rotate refuse to work together.** Recognition is exclusive by default; implement `shouldRecognizeSimultaneouslyWith` returning `true`.
- **A button inside a pannable area won't tap.** The pan recognizer is eating the touch; implement `shouldReceive touch:` to skip touches on the button.
- **Handling `.ended` but not `.cancelled`.** The system can cancel a gesture mid-flight; without cleanup your UI is left stranded.

## Interview lens

Frame recognizers as a layer above raw touches: instead of parsing `touchesBegan/Moved/Ended` with timers and thresholds, you attach a `UIGestureRecognizer` to a view via target-action and it fires when its gesture is detected. Mention `isUserInteractionEnabled` — interviewers like hearing you've hit the image-view default.

Be sharp on discrete versus continuous: tap and swipe fire once; pan, pinch, rotation, and long-press fire repeatedly, so the handler switches on `state` through `.began`, `.changed`, `.ended`, and `.cancelled`.

The senior territory is conflict resolution. Say that recognizers are mutually exclusive by default; `shouldRecognizeSimultaneouslyWith` opts into concurrency for pairs like pinch plus rotate, and `require(toFail:)` expresses priority — single-tap requiring the double-tap to fail is the canonical example. Know `gestureRecognizerShouldBegin` and `shouldReceive touch:` as the fix for a button trapped inside a pannable view. For custom gestures, describe subclassing `UIGestureRecognizer`, overriding the touch methods, and setting `state` — including failing early so you don't block other recognizers. And connect it to the responder chain: recognizers intercept touches before the view's own handlers and cancel them on recognition.
