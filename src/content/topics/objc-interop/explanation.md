## The problem: half of Apple's SDK predates Swift

Wire a button to a method the way UIKit expects, in pure Swift:

```swift
button.addTarget(self, action: #selector(handleTap), for: .touchUpInside)
```

That `#selector(handleTap)` compiles only if `handleTap` is visible to an older machinery underneath — the **Objective-C runtime**, the system that powered Apple's frameworks for two decades before Swift existed.

Target-action (a button remembering "call *this* method on *that* object"), key-value observing, `NSCoding`, the responder chain — all of it is built on that runtime. It finds methods by *name*, at runtime, on the fly.

Swift's own dispatch is faster and more static, so it doesn't automatically hand your code to that older system. When you need target-action or KVO, you have to opt **in**. This lesson is about how you opt in, what the two magic words `@objc` and `dynamic` really do, and what each one costs.

## Two ways to answer "which method runs?"

Every method call has to be resolved to an actual chunk of code. There are two broad strategies, and the whole lesson hinges on the difference.

Swift's default is **static dispatch**: the compiler figures out at compile time exactly which function to call and bakes the address right in. For methods reached through a protocol or a non-`final` class, it uses **witness-table / vtable dispatch** — a small lookup table of function pointers the compiler builds, one slot per method. Fast, and open to inlining.

Objective-C uses **message dispatch**. A call isn't "jump to this address" — it's "send the message named `handleTap` to this object, and let the runtime find a method with that name right now." The runtime function that does this is `objc_msgSend`. It looks the method up by its **selector** — the method's name as a runtime string-like key.

The trade is speed versus flexibility. Message dispatch does a lookup on every call and can't be inlined, so it's slower. But because it resolves by name at runtime, you can add, swap, or observe methods while the program runs — which is exactly what target-action and KVO need.

## `@objc`: make Swift visible to the runtime

Mark a member `@objc` and the compiler generates the Objective-C metadata for it — a selector, an entry in the runtime's tables — so the older machinery can find it by name:

```swift
class ViewController {
    @objc func handleTap() {
        print("tapped")
    }
}
```

Now `handleTap` has a selector, so `#selector(handleTap)` resolves and `addTarget(_:action:)` can call it later.

Important: `@objc` exposes the method *and* makes it callable through messaging, but it does **not** force your Swift-side calls to go through messaging. A direct Swift call to `handleTap()` still uses fast dispatch. `@objc` is about visibility, not about changing how you call it yourself.

## `@objc dynamic`: force message dispatch

`dynamic` is the stronger word. It tells the compiler: *never* resolve this statically — route every call through the Objective-C runtime's messaging:

```swift
class Model {
    @objc dynamic var title: String = ""
}
```

`@objc` alone would only make `title` visible. `@objc dynamic` guarantees that every access goes through `objc_msgSend`, which means the implementation can be *replaced or intercepted at runtime*. That single guarantee is what makes a property observable by KVO and swappable by swizzling — both covered below.

Rule of thumb: `@objc` = "the runtime can see this." `@objc dynamic` = "the runtime is *in charge of* dispatching this."

## Selectors and target-action

A **selector** is the runtime's name for a method — think of it as the method's identity as a lookup key, written `#selector(...)` in Swift:

```swift
let sel = #selector(handleTap)
button.addTarget(self, action: sel, for: .touchUpInside)
```

`addTarget(_:action:)` stores the pair "this object, this selector." When the button is tapped, UIKit sends that selector as a message to that object — pure message dispatch. The runtime has to find a method by that name, which is only possible if `handleTap` was exposed with `@objc`. Forget the `@objc` and `#selector(handleTap)` won't even compile; the tell is a "method not exposed to Objective-C" error.

## KVC and KVO

Two related runtime features, both leaning on message dispatch.

**Key-value coding (KVC)** is reading and writing a property *by its string name* instead of directly:

```swift
let t = model.value(forKey: "title")   // instead of model.title
```

The runtime takes the string `"title"`, finds the matching accessor by selector, and messages it. Handy for generic code that doesn't know the property at compile time.

**Key-value observing (KVO)** builds on that: it lets one object get a callback whenever another object's property changes:

```swift
let token = model.observe(\.title) { obj, change in
    print("title is now", obj.title)
}
```

For KVO to fire, the observed property must be `@objc dynamic`:

```swift
class Model: NSObject {
    @objc dynamic var title: String = ""
}
```

Why? KVO works by swapping in a subclass that overrides the property's setter to send change notifications. That interception is only possible if the setter goes through message dispatch — which is precisely what `dynamic` guarantees.

Predict this. Given a plain Swift property with no attributes:

```swift
class Model: NSObject {
    var title: String = ""   // no @objc, no dynamic
}
```

Will `observe(\.title)` deliver change callbacks when `title` is set?

Answer: **no.** Without `@objc dynamic`, the setter uses static dispatch, so KVO has nothing to intercept. The observation silently never fires — no crash, no warning, just callbacks that never arrive. This exact omission is one of the most common KVO bugs.

## Method swizzling: swapping implementations at runtime

Because message dispatch resolves by selector, you can reach into the runtime and *exchange two methods' implementations* while the program runs:

```swift
let original = class_getInstanceMethod(cls, #selector(viewDidLoad))
let replacement = class_getInstanceMethod(cls, #selector(swizzled_viewDidLoad))
method_exchangeImplementations(original!, replacement!)
```

After that call, every send of `viewDidLoad` runs *your* code instead — and your code can call the original, since only the selectors were swapped, not erased. This is called **method swizzling**, and analytics and logging libraries use it to hook framework methods without subclassing.

It is also genuinely dangerous. The swap is **global** — it affects every instance of the class everywhere in the process. It's **order-dependent**: two libraries swizzling the same method can undo or double each other depending on load order. And it's **invisible** in the source, so a bug caused by a swizzle appears in code that looks perfectly innocent. Treat swizzling as a last resort, and only on methods you fully control.

## Bridging: crossing the language boundary

Sometimes you have actual Objective-C files in the project. To call that Objective-C code *from Swift*, you add a **bridging header** — a single header file listing the Objective-C headers you want exposed, which the compiler surfaces to Swift automatically.

For the reverse — using your Swift code *from Objective-C* — the compiler generates a header named `YourModule-Swift.h` that you import on the Objective-C side; only your `@objc`-exposed declarations appear in it.

## What it costs

None of this is free, and interviewers probe the costs.

Message dispatch does a runtime lookup on every call and **blocks inlining and most optimizations**, so `dynamic` methods are measurably slower than plain Swift ones — fine for a button tap, wasteful in a tight loop.

Every `@objc` member also generates Objective-C metadata, which **adds to binary size**. Sprinkling `@objc` across an entire class for no reason bloats the app.

And swizzling, as above, is order-dependent, global, and hard to debug — the runtime's power and its foot-gun are the same mechanism.

## Common pitfalls

- **Forgetting `@objc` on a selector target.** `#selector(handleTap)` won't compile until `handleTap` is `@objc`. The error mentions "not exposed to Objective-C."
- **Expecting KVO to fire on a plain `var`.** The observed property must be `@objc dynamic`, and the class must inherit from `NSObject`. Otherwise callbacks silently never arrive.
- **Confusing `@objc` with `dynamic`.** `@objc` makes a member *visible* to the runtime; `dynamic` forces *dispatch through* the runtime. KVO and swizzling need the second, not just the first.
- **Reaching for swizzling casually.** It's global and order-dependent. Prefer subclassing, delegation, or composition; swizzle only when there's truly no other hook.

## Interview lens

If asked "what does `@objc` do?", separate it cleanly from `dynamic`: `@objc` exposes a Swift member to the Objective-C runtime so it gets a selector and can be found by name; `@objc dynamic` goes further and forces every call to go through message dispatch, which is what makes the member swizzlable and KVO-able. Interviewers love watching people conflate the two.

Expect "why won't my KVO fire?" Answer with the mechanism: KVO installs an overriding setter at runtime, and that only works if the property is `@objc dynamic` on an `NSObject` subclass — a plain `var` uses static dispatch, so there's nothing to intercept.

If they bring up swizzling, show respect for it *and* wariness: it exchanges method implementations by selector at runtime, it's how analytics libraries hook UIKit, but it's global, order-dependent, and invisible in source — a debugging nightmare you reach for only as a last resort. Naming the cost of `dynamic` (slower dispatch, no inlining, bigger binary) signals you understand you're trading Swift's performance for the runtime's flexibility.
