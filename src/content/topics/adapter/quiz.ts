import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "adapter-intent",
    type: "mcq",
    prompt: "What is the adapter pattern's intent?",
    options: [
      "Wrap an object with an incompatible interface inside a type that translates calls into the interface your code expects",
      "Guarantee only one instance of a type ever exists",
      "Decide which concrete type to construct at runtime",
      "Add new behavior to an object without subclassing it",
    ],
    answer: 0,
    explanation:
      "An adapter's whole job is translation: it sits between an interface you don't control and the interface your code wants, forwarding calls from one shape to the other.",
  },
  {
    id: "adapter-object-predict",
    type: "predict",
    prompt: "Given this adapter, what does `client.track(event:properties:)` actually call?",
    code: `final class VendorSDKAdapter: AnalyticsClient {\n    private let sdk: VendorSDK\n    init(sdk: VendorSDK) { self.sdk = sdk }\n    func track(event: String, properties: [String: Any]) {\n        sdk.logEvent(event, metadata: properties)\n    }\n}\nlet client: AnalyticsClient = VendorSDKAdapter(sdk: VendorSDK())\nclient.track(event: "checkout_completed", properties: ["total": 42])`,
    options: [
      "`sdk.logEvent(_:metadata:)` on the wrapped `VendorSDK` instance",
      "Nothing — `track` is never actually forwarded",
      "A new `VendorSDK` instance is created on every call",
      "It throws a runtime error because `VendorSDK` doesn't conform to `AnalyticsClient`",
    ],
    answer: 0,
    explanation:
      "The adapter's `track(event:properties:)` body calls `sdk.logEvent(event, metadata: properties)` — the call site only ever sees `AnalyticsClient`, but the actual work happens on the wrapped `VendorSDK`.",
  },
  {
    id: "adapter-object-vs-protocol-fill",
    type: "fill",
    prompt: "An adapter that holds the incompatible object as a stored property and forwards calls to it — rather than extending the type directly — is called an ___ adapter.",
    answers: ["object"],
    hint: "Named for what it wraps: an instance of the incompatible type, held inside it.",
    explanation:
      "An object adapter composes the incompatible type as a stored property. It works even when the wrapped type is `final` or defined in code you can't modify at all.",
  },
  {
    id: "adapter-protocol-adapter-mcq",
    type: "mcq",
    prompt: "What does a protocol adapter (`extension VendorSDK: AnalyticsClient { ... }`) require that an object adapter doesn't?",
    options: [
      "Permission to extend the type being adapted — it doesn't work if you can't add a conformance to that type",
      "A separate wrapper class",
      "The vendor type to already be `final`",
      "Marking every method `@objc`",
    ],
    answer: 0,
    explanation:
      "A protocol adapter extends the type directly with `extension SomeType: YourProtocol`, so it only works when you're allowed to extend that type. An object adapter avoids this requirement entirely by wrapping the type instead of touching it.",
  },
  {
    id: "adapter-object-vs-protocol-multi",
    type: "multi",
    prompt: "Select **all** true statements comparing object adapters and protocol adapters.",
    options: [
      "An object adapter works even if the wrapped type is `final`",
      "A protocol adapter requires no separate instance to construct or hold onto — the type itself conforms",
      "A protocol adapter carries a small risk: a future vendor update could add a conflicting conformance to the same type",
      "Object adapters can never be used with third-party SDKs",
    ],
    answers: [0, 1, 2],
    explanation:
      "Object adapters wrap rather than extend, so `final` doesn't matter to them. Protocol adapters skip the wrapper instance but only work when you can extend the type, and carry a small ongoing risk of colliding with a conformance the vendor adds later. Object adapters are actually the *more* common choice for third-party SDKs, precisely because they don't need extension rights.",
  },
  {
    id: "adapter-continuation-fill",
    type: "fill",
    prompt: "Bridging `CLLocationManager`'s delegate callbacks to a single `async throws` method uses `withCheckedThrowingContinuation`, which suspends the calling task until the ___ (the object captured inside the closure) is resumed from a delegate method.",
    answers: ["continuation"],
    hint: "The parameter name given to the closure in `withCheckedThrowingContinuation { continuation in ... }`.",
    explanation:
      "`withCheckedThrowingContinuation` hands you a `continuation` object; the delegate callback later calls `continuation.resume(returning:)` or `.resume(throwing:)`, which is what actually lets the suspended `async` function return.",
  },
  {
    id: "adapter-delegate-predict",
    type: "predict",
    prompt: "In `LocationManagerAdapter`, what happens if `locationManager(_:didFailWithError:)` fires after `locationManager(_:didUpdateLocations:)` already resumed the continuation for the same request?",
    code: `func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {\n    continuation?.resume(returning: locations[0])\n    continuation = nil\n}\nfunc locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {\n    continuation?.resume(throwing: error)\n    continuation = nil\n}`,
    options: [
      "Nothing happens — `continuation` was already set to `nil`, so `continuation?.resume(throwing:)` is a no-op",
      "The app crashes because a continuation was resumed twice",
      "The `async` function returns the location a second time",
      "The error silently replaces the earlier successful result",
    ],
    answer: 0,
    explanation:
      "Setting `continuation = nil` after the first resume is what makes this safe — a `CheckedContinuation` traps if resumed twice, so clearing the stored reference to `nil` turns any later delegate callback into a harmless no-op via optional chaining.",
  },
  {
    id: "adapter-tradeoff-senior",
    type: "mcq",
    prompt: "A vendor SDK type is defined in a closed-source binary framework you can extend from your own module. Which adapter approach avoids any risk of a future vendor SDK update introducing a conflicting method name?",
    options: [
      "An object adapter — because it wraps the vendor type as a stored property instead of adding a conformance directly to it",
      "A protocol adapter — extensions are always safer than composition",
      "Neither approach carries any risk",
      "Rewriting the vendor SDK's source code",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A protocol adapter adds a conformance directly onto a type you don't own — if the vendor's own future update adds a method with a colliding name or a conflicting conformance to the same protocol, that's a real risk. An object adapter never touches the vendor type, so it can't collide with anything the vendor adds later.",
  },
  {
    id: "adapter-flashcard",
    type: "flashcard",
    prompt:
      "Explain the adapter pattern, the difference between object and protocol adapters, and how it applies to bridging an older delegate-based API to async/await. Answer aloud, then reveal.",
    modelAnswer:
      "An **adapter** wraps an object whose interface you don't control inside a type that matches the interface your code expects, translating each call from one shape to the other. An **object adapter** holds the incompatible type as a stored property and forwards calls to it — this works even on `final` types or code in a framework you can't modify. A protocol adapter instead uses `extension SomeType: YourProtocol { ... }` to add the conformance directly, which needs no separate wrapper instance but only works when you're allowed to extend that type, and carries a small risk that a future update to the wrapped type could introduce a conflicting conformance or method. Adapters are the standard fix for bridging Apple's older delegate-based APIs — like `CLLocationManagerDelegate` — to `async/await`: the adapter conforms to the delegate protocol, stores a **continuation** captured inside `withCheckedThrowingContinuation`, and resumes that continuation from the delegate callback, exposing a single `async throws` method to the rest of the app that never has to touch the delegate protocol directly. Setting the stored continuation to `nil` after resuming it is what prevents a later, stray delegate callback from resuming it a second time and crashing.",
    keyPoints: [
      "Adapter: wraps an incompatible interface behind the interface your code expects",
      "Object adapter: composition, stores the wrapped type — works on final/unmodifiable types",
      "Protocol adapter: extension conformance directly on the type — needs extension rights, smaller risk of future collision",
      "Delegate-to-async bridge: adapter conforms to the delegate protocol, wraps a continuation, exposes one async throws method",
      "Nil out the stored continuation after resuming it, to avoid a double-resume crash from a stray later callback",
    ],
    explanation:
      "A senior answer distinguishes composition (object adapter) from extension (protocol adapter) with their respective trade-offs, and can walk through the delegate-to-continuation bridge as a concrete, real-world adapter.",
  },
];

export default quiz;
