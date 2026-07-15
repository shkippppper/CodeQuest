import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "objc-what-does-objc-do",
    type: "mcq",
    prompt: "What does marking a Swift method `@objc` actually do?",
    options: [
      "It exposes the method to the Objective-C runtime — giving it a selector so the runtime can find it by name",
      "It forces every call to that method to be resolved statically at compile time for the fastest possible dispatch path",
      "It rewrites your Swift call sites so they go through message dispatch even when you invoke the method directly yourself",
      "It automatically generates a completion-handler twin of the method so older callback-based APIs can reach it too",
    ],
    answer: 0,
    explanation:
      "`@objc` makes the member *visible* to the Objective-C runtime by generating a selector and metadata. It does not force your own Swift-side calls through messaging — that's what `dynamic` adds.",
  },
  {
    id: "objc-dispatch-kinds",
    type: "mcq",
    prompt: "How does Objective-C message dispatch differ from Swift's default static dispatch?",
    options: [
      "Message dispatch looks the method up by selector at runtime via objc_msgSend; static dispatch bakes the address in at compile time",
      "Message dispatch is resolved entirely at compile time whereas static dispatch defers the whole lookup until the first runtime call",
      "Message dispatch always inlines the call for speed while static dispatch keeps a separate function-pointer table for every method",
      "Message dispatch only applies to protocol methods and static dispatch is reserved exclusively for final classes and value types",
    ],
    answer: 0,
    explanation:
      "Message dispatch sends a named message the runtime resolves by selector on every call (`objc_msgSend`). Static dispatch is decided at compile time and the exact address is baked in — faster, and inlinable.",
  },
  {
    id: "objc-dynamic-vs-objc",
    type: "mcq",
    prompt: "Why does `@objc dynamic` enable KVO and swizzling when plain `@objc` does not?",
    options: [
      "`dynamic` forces every access through message dispatch, so the implementation can be replaced or intercepted at runtime",
      "`dynamic` copies the property into a separate observable storage container that the runtime is then free to watch for writes",
      "`dynamic` registers a compile-time diagnostic that warns you whenever an observer or a swizzle is attached to the member later",
      "`dynamic` marks the property as thread-safe, which is the specific precondition the KVO and swizzling machinery both require",
    ],
    answer: 0,
    explanation:
      "`@objc` only makes the member visible. `dynamic` guarantees dispatch *through* the runtime, so KVO can install an overriding setter and swizzling can exchange implementations. Interception needs message dispatch.",
  },
  {
    id: "objc-selector-fill",
    type: "fill",
    prompt:
      "For `#selector(handleTap)` to compile, the `handleTap` method must be annotated with ___ so the runtime can find it by name.",
    answers: ["@objc", "objc"],
    hint: "An attribute starting with an @ sign.",
    explanation:
      "`#selector` produces a runtime name (a selector), which only exists if the method was exposed with `@objc`. Otherwise you get a 'not exposed to Objective-C' error.",
  },
  {
    id: "objc-kvo-plain-var-predict",
    type: "predict",
    prompt: "The observed property is a plain `var` with no attributes. Does the observe callback fire when `title` changes?",
    code:
      "class Model: NSObject {\n" +
      "    var title: String = \"\"\n" +
      "}\n" +
      "let m = Model()\n" +
      "let token = m.observe(\\.title) { obj, _ in\n" +
      "    print(\"changed to\", obj.title)\n" +
      "}\n" +
      "m.title = \"Hello\"",
    options: [
      "No — without @objc dynamic the setter is dispatched statically, so KVO has nothing to intercept and the callback never fires",
      "Yes — inheriting from NSObject is on its own entirely enough for KVO to automatically observe any stored property the subclass declares",
      "Yes, but only the very first assignment is ever reported; all subsequent writes to the title property are then silently dropped by the observer",
      "No — it immediately traps at runtime with an 'observing a non-dynamic property' exception the very moment the observer is registered on it",
    ],
    answer: 0,
    explanation:
      "KVO works by swapping in a subclass whose setter sends change notifications, which requires the setter to go through message dispatch. A plain `var` uses static dispatch, so the callback silently never fires.",
  },
  {
    id: "objc-swizzling-def",
    type: "mcq",
    prompt: "What does method swizzling do?",
    options: [
      "Exchanges two methods' implementations at runtime by selector, so sending one selector runs the other's code",
      "Generates a brand-new subclass at compile time whose overrides forward every message back to the original superclass",
      "Rewrites the compiled binary's method table during app launch so the changed dispatch survives across process restarts",
      "Wraps a method in a thread-safe proxy that serializes all concurrent calls to it through a single private dispatch queue",
    ],
    answer: 0,
    explanation:
      "Swizzling uses runtime APIs like `method_exchangeImplementations` to swap two methods' implementations. Because message dispatch resolves by selector, sending the selector afterward runs the swapped-in code.",
  },
  {
    id: "objc-kvc-fill",
    type: "fill",
    prompt:
      "Reading a property by its string name, like `model.value(forKey: \"title\")`, uses key-value ___ (a three-word Objective-C runtime feature abbreviated KVC).",
    answers: ["coding"],
    hint: "KV_ — the C in KVC.",
    explanation:
      "Key-value coding (KVC) accesses properties by string name. The runtime finds the matching accessor by selector and messages it — the basis KVO builds on.",
  },
  {
    id: "objc-costs-multi",
    type: "multi",
    prompt: "Select **all** real costs or downsides of leaning on the Objective-C runtime from Swift.",
    options: [
      "`dynamic` message dispatch is slower and blocks inlining and most optimizations",
      "Every `@objc` member generates extra metadata that adds to binary size",
      "Swizzling is global and order-dependent, making bugs hard to trace",
      "`@objc` silently disables ARC for the annotated class, forcing manual retain/release",
    ],
    answers: [0, 1, 2],
    explanation:
      "Slower dispatch, larger binary, and fragile global swizzling are all genuine costs. `@objc` has no effect on ARC — reference counting works exactly the same (option 4 is false).",
  },
  {
    id: "objc-kvo-requirements-senior",
    type: "mcq",
    prompt: "A senior engineer says 'my `observe(\\.count)` never fires.' What is the most likely cause?",
    options: [
      "The `count` property isn't `@objc dynamic` on an NSObject subclass, so its setter uses static dispatch and can't be intercepted",
      "The observation token was stored, which retains the observer and thereby suppresses every change notification until it is released",
      "KVO requires the key path to be spelled as a plain string literal, and the `\\.count` shorthand quietly registers no observation at all",
      "The property was declared with `let`, and KVO is only able to deliver callbacks for computed properties backed by an explicit getter",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "KVO installs an overriding setter at runtime, which only works when the property is `@objc dynamic` on an `NSObject` subclass. Missing `dynamic` is the classic reason callbacks silently never arrive.",
  },
  {
    id: "objc-swizzle-order-senior",
    type: "predict",
    prompt: "Two unrelated libraries both swizzle `viewDidLoad` on the same class at launch. What's the realistic outcome?",
    code:
      "// Library A, at launch:\n" +
      "method_exchangeImplementations(original, a_impl)\n" +
      "// Library B, at launch (same class, same selector):\n" +
      "method_exchangeImplementations(original, b_impl)",
    options: [
      "The result depends on load order — the swaps can chain, cancel, or double-apply, which is exactly why swizzling is fragile",
      "The runtime detects the conflict and cleanly rejects the second exchange, so only Library A's swizzle stays installed on the class",
      "Both swizzles apply completely independently, because each separate library is handed its own private copy of the class's method table",
      "The second exchange throws a fatal duplicate-selector error at launch, and the whole app fails to start until one library is removed",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Swizzling mutates one shared, global method table. Two swaps on the same selector interact in load-order-dependent ways — chaining, cancelling, or double-applying — with no runtime protection. This is the core danger of swizzling.",
  },
  {
    id: "objc-flashcard",
    type: "flashcard",
    prompt:
      "Explain Objective-C runtime interop: message dispatch vs Swift dispatch, `@objc` vs `dynamic`, what needs each (selectors, KVO, swizzling), and the costs. Answer aloud, then reveal.",
    modelAnswer:
      "Swift normally uses **static dispatch** (address baked in at compile time) or **witness-table/vtable dispatch** (a lookup table the compiler builds). Objective-C uses **message dispatch**: a call is a *message* named by a **selector** that the runtime resolves at runtime via `objc_msgSend` — slower, uninlinable, but replaceable on the fly. Much of Apple's SDK (target-action, KVO, NSCoding, the responder chain) runs on this, so Swift must opt in. **`@objc`** exposes a member to the runtime — it gets a selector and can be found by name; this is what `#selector(...)` and `addTarget(_:action:)` need. **`@objc dynamic`** goes further and forces *every* call through message dispatch, so the implementation can be intercepted or replaced at runtime. That's the requirement for **KVO** (which subclasses the type and overrides the setter to post change notifications — only possible with a dynamically dispatched setter on an `NSObject` subclass) and for **swizzling** (`method_exchangeImplementations` swapping two selectors' implementations, used by analytics libs but global, order-dependent, and invisible in source). **KVC** reads/writes a property by string name (`value(forKey:)`); KVO builds on it. **Bridging**: a bridging header exposes Objective-C code to Swift; the generated `YourModule-Swift.h` exposes `@objc` Swift code back to Objective-C. **Costs**: dynamic dispatch is slower and blocks inlining/optimization, `@objc` bloats the binary with metadata, and swizzling is a debugging hazard.",
    keyPoints: [
      "Swift = static/witness-table dispatch; ObjC = message dispatch (objc_msgSend, by selector)",
      "@objc = visible to the runtime (selector); needed for #selector and target-action",
      "@objc dynamic = force message dispatch; needed for KVO and swizzling",
      "KVO subclasses + overrides the setter — requires @objc dynamic on an NSObject subclass",
      "KVC = access by string name; swizzling = swap implementations by selector (global, fragile)",
      "Bridging header (ObjC→Swift) and generated -Swift.h (Swift→ObjC)",
      "Costs: slower uninlinable dispatch, larger binary, order-dependent swizzling",
    ],
    explanation:
      "A senior answer separates `@objc` (visibility) from `dynamic` (forced message dispatch), ties KVO/swizzling to the dispatch mechanism, and names the concrete costs.",
  },
];

export default quiz;
