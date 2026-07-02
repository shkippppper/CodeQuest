## The problem: doing the right work at the right moment

A `UIViewController` isn't alive all at once — its view loads, appears, disappears, and may be torn down, each at a distinct moment. Put setup in the wrong callback and you get bugs: work that runs repeatedly when it should run once, layout math done before the view has its real size, or timers that never stop. Knowing the **lifecycle order** and what each stage guarantees is UIKit fundamentals.

## `viewDidLoad` → `viewDidAppear` order

The core sequence when a VC is presented:

1. **`loadView()`** — creates the `view` (only override for a fully code-built view hierarchy).
2. **`viewDidLoad()`** — the view is loaded into memory. Called **once** per VC lifetime. Do one-time setup here (configure subviews, set up data sources, start observers).
3. **`viewWillAppear(_:)`** — the view is about to become visible. Called **every** time it appears (including returning from another screen). Good for refreshing data/UI that may have changed.
4. **`viewDidAppear(_:)`** — the view is on screen. Start animations, begin expensive work, start analytics timers.

Going away mirrors it: **`viewWillDisappear`** → **`viewDidDisappear`** (stop timers, save state).

The single most-tested fact: **`viewDidLoad` runs once; `viewWillAppear`/`viewDidAppear` run every time the view appears.** Put one-time setup in `viewDidLoad`, per-appearance refresh in `viewWillAppear`.

## `loadView`

`loadView()` is where the controller **creates its `view`**. Storyboard/xib-based VCs get this for free. You override it only when building the entire hierarchy in code and want to assign a custom root view. **Never call `super.loadView()` if you fully replace the view, and never access `view` inside `loadView` in a way that triggers a recursive load.** Most apps never touch it — `viewDidLoad` is the usual home for setup.

## Appearance callbacks & layout

Layout has its own callbacks interleaved with appearance:

- **`viewWillLayoutSubviews` / `viewDidLayoutSubviews`** — called (possibly multiple times) when the view's bounds change (rotation, size class, first layout). This is where you know the view has its **real size** — do frame-dependent math here, **not** in `viewDidLoad` (where the view's size is still the placeholder from the nib/estimate).

A classic bug: reading `view.bounds` or a subview's frame in `viewDidLoad` for layout calculations — at that point the size isn't final. Use `viewDidLayoutSubviews`.

## Memory warnings

`didReceiveMemoryWarning()` fires when the system is low on memory. Release recreatable resources (caches, offscreen data) here. On modern iOS, view controllers whose views are offscreen are **not** automatically unloaded (the old `viewDidUnload` was deprecated), so you manage heavy resources yourself.

## Container view controllers

Container VCs (`UINavigationController`, `UITabBarController`, or your own) manage **child** view controllers, and there's a containment API to do it correctly:

```swift
addChild(child)
view.addSubview(child.view)
child.didMove(toParent: self)
// removal:
child.willMove(toParent: nil)
child.view.removeFromSuperview()
child.removeFromParent()
```

Skipping `addChild`/`didMove(toParent:)` means the child doesn't receive appearance/rotation events correctly — a common source of "my child VC's `viewWillAppear` never fires."

## The interview lens

Nail the **order and cardinality**: `loadView` → `viewDidLoad` (**once**) → `viewWillAppear` → `viewDidAppear` (**every appearance**), and the disappear pair on the way out. State the rule: **one-time setup in `viewDidLoad`, per-appearance refresh in `viewWillAppear`.**

Two senior-flavored points: **don't do frame-dependent layout in `viewDidLoad`** — the view lacks its final size there; use **`viewDidLayoutSubviews`**. And know the **containment API** (`addChild` + `didMove(toParent:)`, and the `willMove(toParent: nil)` + `removeFromParent()` teardown) — omitting it breaks child appearance events. Bonus: `viewWillAppear` fires again when returning to a screen (so it's the place to refresh possibly-stale data, but avoid heavy work there).
