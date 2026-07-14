import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "observer-intent",
    type: "mcq",
    prompt: "What is the core intent of the observer pattern?",
    options: [
      "A subject keeps a list of observers and notifies all of them when it changes, without knowing what each observer does",
      "One object holds a single weak reference to another object and polls it on a repeating timer to ask whether any relevant state has changed since the last check",
      "A subclass overrides a virtual method defined in the parent class to change its runtime behavior without modifying any line of the parent class source code",
      "Objects are instantiated through a shared factory object that inspects runtime parameters and routes each construction request to the appropriate concrete subclass implementation",
    ],
    answer: 0,
    explanation:
      "Observer decouples a **one-to-many** notification: the subject broadcasts a change to every registered observer, none of which it needs to know the concrete type of.",
  },
  {
    id: "observer-vs-delegate-mcq",
    type: "mcq",
    prompt: "How does the observer pattern differ from delegation in shape?",
    options: [
      "Observer is one-to-many (a list of listeners); delegation is one-to-one (a single delegate property)",
      "They implement the same structural relationship under different names — both broadcast to a fixed set of typed recipients using the same underlying mechanism",
      "Delegation is always implemented through NotificationCenter string-keyed broadcasts, while observer requires a typed protocol the subject directly retains",
      "Observer can only be implemented using KVO on an NSObject subclass, whereas delegation is protocol-based and available to any Swift type",
    ],
    answer: 0,
    explanation:
      "Delegation hands a job to exactly one object via a typed property. Observer broadcasts to however many listeners have subscribed — the subject doesn't track a fixed count.",
  },
  {
    id: "observer-kvo-fill",
    type: "fill",
    prompt: "For KVO to work on a Swift property, the property must be marked @objc ___ so it's exposed to the Objective-C runtime and uses dynamic dispatch.",
    answers: ["dynamic"],
    hint: "Same word used for dynamic dispatch/method lookup.",
    explanation:
      "KVO intercepts property access through the Objective-C runtime, which requires `@objc dynamic` — plain Swift properties on non-`NSObject` types can't be observed this way.",
  },
  {
    id: "observer-notificationcenter-predict",
    type: "predict",
    prompt: "A listener registers for a notification named \"cartDidChange\" but the poster actually posts \"CartDidChange\" (different capitalization). What happens at compile time and at runtime?",
    code: `NotificationCenter.default.post(name: Notification.Name("CartDidChange"), object: nil)

NotificationCenter.default.addObserver(
    forName: Notification.Name("cartDidChange"), object: nil, queue: .main
) { _ in print("got it") }`,
    options: [
      "Compiles fine; the listener's closure simply never runs because the names don't match",
      "A compile-time error flagging the mismatched notification name strings as an unresolved identifier",
      "A runtime crash with an NSException listing both names and explaining that no registered observer matched the posted notification",
      "Swift automatically normalizes both names to lowercase before comparing, so they are treated as equal and the listener's closure runs",
    ],
    answer: 0,
    explanation:
      "Notification names are plain strings. There's no compile-time check, so a typo or case mismatch silently means the listener never fires — one of NotificationCenter's coupling costs.",
  },
  {
    id: "observer-tradeoffs-multi",
    type: "multi",
    prompt: "Select all true statements about NotificationCenter, KVO, and Combine as observer implementations.",
    options: [
      "NotificationCenter payloads (userInfo) require a runtime cast, giving up compile-time type safety",
      "KVO only works on NSObject subclasses with @objc dynamic properties",
      "Combine's @Published works on plain Swift classes without inheriting from NSObject",
      "NotificationCenter requires the poster to hold a direct reference to every listener",
    ],
    answers: [0, 1, 2],
    explanation:
      "NotificationCenter, KVO, and Combine each have real constraints, but NotificationCenter's whole point is that the poster does NOT need a reference to listeners — it broadcasts by name.",
  },
  {
    id: "observer-choose-tool",
    type: "mcq",
    prompt: "You need a dozen unrelated screens across the app, none aware of each other, to react when the user logs out. Which tool fits best?",
    options: [
      "NotificationCenter — loose, string-based broadcast is ideal for many unrelated, decoupled listeners",
      "KVO on a single NSObject property shared between all screens, using the change dictionary to distinguish which screen should react",
      "A single weak delegate property on the authentication manager, updated to point to whichever screen is currently in the foreground",
      "Passing a direct closure reference to each of the 12 screens manually at startup, storing them in an array the auth manager iterates when the user logs out",
    ],
    answer: 0,
    explanation:
      "NotificationCenter is built for exactly this: app-wide events with many unrelated listeners, where loose string-based coupling is a feature rather than a liability.",
  },
  {
    id: "observer-token-senior",
    type: "predict",
    prompt: "This code compiles and runs without crashing, but the print statement never executes after the first change. Why?",
    code: `func setupObserving() {
    let cancellable = cart.$items.sink { items in
        print("count: \\(items.count)")
    }
}
setupObserving()
cart.items.append("apple")`,
    options: [
      "The AnyCancellable returned by sink is a local variable that goes out of scope at the end of setupObserving(), so the subscription is cancelled immediately",
      "Combine publishers deliver values only once per app launch per unique subscriber, after which the upstream publisher sends a completion event and closes the stream permanently",
      "@Published requires the enclosing class to inherit from NSObject because Combine uses Key-Value Observing as its underlying change-notification mechanism for all @Published properties",
      "Closures passed to sink cannot capture class instances like cart by strong reference; Swift automatically downgrades the capture to unowned, which becomes nil before the first upstream event fires",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`sink` returns an `AnyCancellable` that must be retained (e.g. as a stored property or in a `Set<AnyCancellable>`) for the subscription to stay alive. A local `cancellable` deallocates when the function returns, silently cancelling the subscription — the same failure mode as an unretained KVO token.",
  },
  {
    id: "observer-observation-senior",
    type: "mcq",
    prompt: "How does the newer Observation framework (@Observable) improve on Combine's @Published for SwiftUI view updates?",
    options: [
      "It tracks exactly which properties a view reads and only redraws that view when one of those specific properties changes, rather than redrawing every subscriber on any change",
      "It eliminates the need to ever store or cancel subscriptions because the Observation framework automatically manages the full lifetime of every token it internally creates",
      "It is restricted to NSObject subclasses, which gives the runtime stronger guarantees about object identity, deallocation ordering, and thread safety during active observations",
      "It is a full drop-in replacement for NotificationCenter and cannot be used in any codebase that still has NotificationCenter observers, because the two systems produce duplicate notifications for the same event",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`@Observable` performs fine-grained, per-property change tracking based on what a view actually reads, avoiding the coarser 'redraw on any @Published change' behavior of ObservableObject.",
  },
  {
    id: "observer-flashcard",
    type: "flashcard",
    prompt: "Explain the observer pattern and compare NotificationCenter, KVO, and Combine/Observation as its three Swift-native implementations. Answer aloud, then reveal.",
    modelAnswer:
      "The **observer pattern** has a subject notify a list of registered listeners whenever it changes, without knowing what any listener does with that information — a **one-to-many** relationship, unlike delegation's one-to-one. `NotificationCenter` implements this as a loosely coupled, string-keyed broadcast: poster and listener only need to agree on a notification name, not a shared type, but that looseness means no compile-time name checking and a runtime-cast `userInfo` payload. **Key-Value Observing (KVO)** watches a specific `@objc dynamic` property on an `NSObject` subclass via the Objective-C runtime, returning an `NSKeyValueObservation` token that must be retained for the observation to stay alive — it's the standard tool in older UIKit/AppKit code but can't observe plain Swift types. **Combine**'s `@Published` and the newer **Observation** framework's `@Observable` are the fully typed, compiler-checked modern equivalents: Combine exposes a subscribable stream (via `AnyCancellable`, which must also be retained), while Observation goes further by tracking exactly which properties a SwiftUI view reads and redrawing only on changes to those specific properties. Pick NotificationCenter for many unrelated, decoupled listeners; KVO only when stuck in `NSObject`-based legacy code; Combine/Observation for new, typed, in-module reactive state.",
    keyPoints: [
      "Observer = one-to-many notify, contrasted with delegation's one-to-one",
      "NotificationCenter: string-keyed, loosest coupling, no compile-time safety",
      "KVO: NSObject + @objc dynamic only, token must be retained",
      "Combine/Observation: fully typed, cancellable/subscription must be retained",
      "Observation adds fine-grained per-property view invalidation over @Published",
    ],
    explanation:
      "A senior answer distinguishes observer from delegate by cardinality, and picks the right tool per scenario rather than treating them as interchangeable.",
  },
];

export default quiz;
