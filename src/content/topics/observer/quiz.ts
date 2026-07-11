import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "observer-intent",
    type: "mcq",
    prompt: "What is the core intent of the observer pattern?",
    options: [
      "A subject keeps a list of observers and notifies all of them when it changes, without knowing what each observer does",
      "One object holds a single weak reference to another and asks it questions",
      "A subclass overrides a method to change behavior",
      "Objects are created through a shared factory",
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
      "They are the same pattern with different names",
      "Delegation always uses NotificationCenter; observer never does",
      "Observer can only be implemented with KVO",
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
      "A compile-time error about mismatched notification names",
      "A runtime crash",
      "Swift automatically treats the names as equal since they're the same word",
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
      "KVO on a single NSObject property",
      "A single weak delegate property",
      "Passing a direct closure reference to each of the 12 screens manually",
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
      "Combine publishers only fire once per app launch",
      "@Published requires NSObject to work",
      "sink closures cannot capture cart",
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
      "It removes the need to ever cancel subscriptions",
      "It only works with NSObject subclasses, giving stronger runtime guarantees",
      "It replaces NotificationCenter entirely and cannot be used alongside it",
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
