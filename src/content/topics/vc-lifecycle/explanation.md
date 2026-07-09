## The problem: the right work at the wrong moment

Here's a bug you will absolutely write someday:

```swift
class ProfileViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        avatarView.layer.cornerRadius = avatarView.bounds.width / 2
    }
}
```

The avatar is supposed to be a circle. On screen, it's a rectangle with slightly rounded corners.

The code is "correct" — it's just running at the wrong *moment*. At the time `viewDidLoad` runs, `avatarView` doesn't have its real size yet, so the math uses a placeholder width.

A view controller's screen isn't alive all at once. Its view gets created, appears, lays out, disappears, maybe comes back. UIKit calls a method on your controller at each of these moments, and each method comes with different guarantees. Put work in the wrong one and you get bugs like the square avatar. This lesson walks the whole sequence.

## Watch the callbacks fire, in order

Put a print in each lifecycle method and present the screen:

```swift
class DemoViewController: UIViewController {
    override func viewDidLoad()  { super.viewDidLoad();  print("didLoad") }
    override func viewWillAppear(_ a: Bool) { super.viewWillAppear(a); print("willAppear") }
    override func viewDidAppear(_ a: Bool)  { super.viewDidAppear(a);  print("didAppear") }
}
```

The console shows:

```swift
// didLoad
// willAppear
// didAppear
```

Three moments, in a fixed order. `viewDidLoad` fires when the view has just been created in memory — nothing is on screen yet. `viewWillAppear` fires just before the view becomes visible. `viewDidAppear` fires once it's actually on screen.

Now navigate away and come back. Push another screen on top, then pop back to this one. Predict: which lines print the second time?

Answer:

```swift
// willAppear
// didAppear
```

No `didLoad`. The view was already created — it never went away, so it doesn't load again. Only the *appearance* pair repeats.

That's the single most-tested fact in this topic: `viewDidLoad` runs *once* per view controller's lifetime; `viewWillAppear` and `viewDidAppear` run *every* time the view comes on screen. So the rule of thumb writes itself:

```swift
override func viewDidLoad() {
    super.viewDidLoad()
    // one-time setup: build subviews, wire data sources, start observers
}

override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    // every-appearance refresh: re-fetch data that may have gone stale
    // while another screen was on top
}
```

Keep `viewWillAppear` light — it runs on every return to the screen, so heavy work here makes navigation feel sluggish. `viewDidAppear` is where you start animations, kick off expensive work, or start analytics timers, because the screen is now genuinely visible.

## Going away mirrors coming in

When the user leaves the screen, the same pattern runs in reverse:

```swift
override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)
    // about to leave: pause video, resign the keyboard
}

override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    // gone: stop timers, save state
}
```

`viewWillDisappear` fires as the exit begins; `viewDidDisappear` fires once the view is fully off screen. Timers and observers you started in an appear callback should be stopped in the matching disappear callback — otherwise they keep running for a screen nobody can see.

## Before viewDidLoad: where the view comes from

One step happens before everything you've seen so far. Someone has to *create* the view:

```swift
override func loadView() {
    view = MapCanvasView()   // this custom view IS the controller's root view
}
```

`loadView()` is the method whose job is to create and assign `self.view`. You almost never write it — storyboards and xibs implement it for you, and even a plain code-only controller gets a default empty `UIView`. You override it for exactly one reason: you're building the entire hierarchy in code and want a *custom class* as the root view itself.

Two rules when you do override it. First, don't call `super.loadView()` — you're fully replacing the view, and super would create a default one you'd immediately throw away. Second, never *read* `self.view` inside `loadView`. Accessing `view` before it's assigned triggers loading... which calls `loadView`... which reads `view` — an infinite recursion.

For everything that isn't "swap the root view class", `viewDidLoad` is the right home. Most apps never touch `loadView` at all.

## When does the view get its real size?

Back to the square avatar from the top. The view exists in `viewDidLoad`, but its size is still whatever placeholder came from the storyboard or an initial estimate — the real, final size arrives later, during *layout*. Layout has its own pair of callbacks:

```swift
override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    avatarView.layer.cornerRadius = avatarView.bounds.width / 2  // now it's a circle
}
```

`viewWillLayoutSubviews` and `viewDidLayoutSubviews` fire when the view's bounds change — the first layout pass, a rotation, a size-class change. Inside `viewDidLayoutSubviews`, the frames are real. This is the only safe place for math that depends on a view's actual size.

One caution: these callbacks can fire *many times*, not once. Rotation, keyboard appearance, and content changes all re-trigger layout. Code here must be cheap and safe to repeat — don't add subviews or start network calls in a layout callback.

## Memory warnings

When the whole device runs low on memory, the system pokes every view controller:

```swift
override func didReceiveMemoryWarning() {
    super.didReceiveMemoryWarning()
    imageCache.removeAllObjects()   // drop anything you can rebuild later
}
```

The contract: release resources you can recreate — caches, prefetched images, offscreen data. Don't release anything you can't rebuild, because the user may return to this screen any moment.

A bit of history interviewers sometimes probe: old iOS used to automatically unload the *views* of offscreen view controllers under memory pressure, with a `viewDidUnload` callback to match. That's gone — `viewDidUnload` is deprecated, views stay loaded, and managing heavy resources under pressure is entirely your job via `didReceiveMemoryWarning`.

## Containers: view controllers inside view controllers

`UINavigationController` and `UITabBarController` don't show content of their own — they manage *other* view controllers. Any controller that embeds another one this way is a **container view controller**, and you can build your own.

The naive version looks like it works:

```swift
view.addSubview(child.view)   // child's view shows up... but something's broken
```

The child's view appears on screen — but the child *controller* has no idea it's been embedded. Its `viewWillAppear` never fires. Rotation callbacks skip it. UIKit forwards lifecycle events down the parent–child chain, and you never linked the chain.

The correct embed is three steps:

```swift
addChild(child)                    // 1. link the controllers — events now forward
view.addSubview(child.view)        // 2. put the child's view in the hierarchy
child.didMove(toParent: self)      // 3. tell the child the move is complete
```

And removal is the mirror image, in the opposite order:

```swift
child.willMove(toParent: nil)      // 1. warn the child it's leaving
child.view.removeFromSuperview()   // 2. pull its view out
child.removeFromParent()           // 3. unlink the controllers
```

If you ever hear "my child controller's `viewWillAppear` never fires" — this is why. Someone added the view and skipped `addChild`/`didMove(toParent:)`.

## Common pitfalls

- **Frame math in `viewDidLoad`.** The view has no final size there. Move size-dependent code to `viewDidLayoutSubviews`.
- **One-time setup in `viewWillAppear`.** It runs on every return to the screen, so observers get added twice, targets get registered twice. One-time work goes in `viewDidLoad`.
- **Heavy work in `viewWillAppear`.** It runs before every appearance — slow code here makes every back-navigation stutter. Defer to `viewDidAppear` or cache.
- **A timer started in `viewDidAppear` with no matching stop.** Pair it with `viewDidDisappear`, or it ticks forever behind other screens.
- **`addSubview` on a child controller's view without the containment calls.** The child's lifecycle events silently break. Use `addChild` + `didMove(toParent:)`.
- **Reading `view` inside `loadView`.** Triggers a recursive load. Assign `view`; never read it there.

## Interview lens

If asked to walk the lifecycle, give the order with the cardinality attached, because the cardinality is what they're really testing: `loadView` creates the view, `viewDidLoad` fires once per controller lifetime, then `viewWillAppear` and `viewDidAppear` fire on every appearance, mirrored by `viewWillDisappear` and `viewDidDisappear` on the way out. Then state the rule: one-time setup in `viewDidLoad`, per-appearance refresh in `viewWillAppear`.

Two answers that mark you as senior. First: never do frame-dependent work in `viewDidLoad` — the view's size isn't final there; the safe place is `viewDidLayoutSubviews`, remembering it can fire repeatedly. Second: know the containment API cold — `addChild` plus `didMove(toParent:)` to embed, `willMove(toParent: nil)` plus `removeFromParent()` to remove — and explain that skipping it is why a child's appearance callbacks go silent.

If memory comes up, mention that `didReceiveMemoryWarning` is for dropping recreatable resources, and that modern iOS no longer unloads offscreen views automatically — `viewDidUnload` is long deprecated, so resource management under pressure is on you.
