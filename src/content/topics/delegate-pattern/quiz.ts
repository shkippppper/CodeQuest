import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "delegate-what",
    type: "mcq",
    prompt: "What is the delegate pattern, mechanically?",
    options: [
      "A protocol defines a contract; the delegating object holds a reference typed as that protocol and calls its methods for relevant events",
      "A subclass overrides a superclass method",
      "A global singleton that all objects call into",
      "A closure stored in a dictionary keyed by event name",
    ],
    answer: 0,
    explanation:
      "Delegation hands a well-defined job to another object through a shared **protocol** — the delegating object never needs to know the delegate's concrete type.",
  },
  {
    id: "delegate-weak-why",
    type: "mcq",
    prompt: "Why is a delegate property almost always declared `weak`?",
    options: [
      "Because the object that owns the delegating instance is usually the same object being delegated to, so a strong reference would create a retain cycle",
      "Because weak references are faster to call",
      "Because protocols cannot be used with strong references",
      "Because `weak` makes the delegate optional",
    ],
    answer: 0,
    explanation:
      "The owner (e.g. a view controller) typically sets itself as its own child's delegate. A strong `delegate` property would mean each object keeps the other alive forever — a retain cycle.",
  },
  {
    id: "delegate-anyobject-fill",
    type: "fill",
    prompt: "A delegate protocol must inherit from ___ so that conforming types are guaranteed to be reference types, which is required to declare the delegate property `weak`.",
    answers: ["AnyObject"],
    hint: "It's the protocol every class implicitly conforms to.",
    explanation:
      "Only reference types (classes) support weak references. Constraining a protocol to `AnyObject` guarantees any conformer can be held weakly.",
  },
  {
    id: "delegate-predict-cycle",
    type: "predict",
    prompt: "`delegate` is declared as a plain (strong) `var` instead of `weak var`. What happens after the view controller is dismissed?",
    code: `class FileDownloader {
    var delegate: FileDownloaderDelegate?   // NOT weak
}

class DownloadViewController: UIViewController, FileDownloaderDelegate {
    let downloader = FileDownloader()
    override func viewDidLoad() {
        downloader.delegate = self
    }
    func downloader(_ d: FileDownloader, didFinishWith result: Data) {}
}`,
    options: [
      "Neither object is deallocated — they keep each other alive, leaking memory",
      "The app crashes immediately",
      "Swift automatically breaks the cycle at dismissal",
      "Only the downloader is deallocated",
    ],
    answer: 0,
    explanation:
      "The view controller strongly owns `downloader`, and `downloader.delegate` strongly points back at the view controller — a classic retain cycle. Neither can be freed.",
  },
  {
    id: "delegate-vs-closure-multi",
    type: "multi",
    prompt: "Select all statements that are true when comparing delegates, closures, and Combine for a completion callback.",
    options: [
      "A closure that captures self strongly can leak just like a strong delegate property",
      "A delegate protocol forces every required method to be implemented, unlike an optional closure property",
      "Combine's PassthroughSubject is well-suited when multiple subscribers need the same event",
      "Delegates are the only option that can ever cause a retain cycle",
    ],
    answers: [0, 1, 2],
    explanation:
      "Closures risk the same retain-cycle problem via strong `self` captures. Delegate protocols enforce implementation at compile time. Combine naturally supports many subscribers. Delegates are not uniquely at risk — closures and even strong Combine sink captures can leak too.",
  },
  {
    id: "delegate-datasource-split",
    type: "mcq",
    prompt: "Why does `UITableView` use separate `delegate` and `dataSource` protocols instead of one combined protocol?",
    options: [
      "They split pull-style questions (what to display) from push-style events (what the user did), so a read-only table can adopt just one",
      "Apple did it for no technical reason",
      "dataSource is deprecated in favor of delegate",
      "Delegate methods run on a background queue while dataSource methods run on the main thread",
    ],
    answer: 0,
    explanation:
      "`dataSource` answers pull questions (row count, row content); `delegate` handles push events (selection, scrolling). Splitting them means each protocol's responsibility is obvious and a read-only table can skip the delegate.",
  },
  {
    id: "delegate-multicast-senior",
    type: "predict",
    prompt: "Three different screens all need to react whenever a shared NetworkMonitor's connectivity changes. What's the best fit?",
    code: `class NetworkMonitor {
    weak var delegate: NetworkMonitorDelegate?   // only one slot
}`,
    options: [
      "Switch to a multicast mechanism (a weak-referencing list of listeners) or NotificationCenter/Combine, since plain delegation is one-to-one",
      "Add three separate `weak var delegate1/2/3` properties",
      "Make the delegate property strong so it can hold multiple values",
      "Have each screen poll the monitor on a timer instead",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A single `weak var delegate` can only point at one listener. Broadcasting to many listeners is a one-to-many problem — reach for a multicast delegate helper, `NotificationCenter`, or Combine, all of which are natively one-to-many.",
  },
  {
    id: "delegate-flashcard",
    type: "flashcard",
    prompt: "Explain the delegate pattern: what it is, why weak matters, and how it compares to closures and Combine. Answer aloud, then reveal.",
    modelAnswer:
      "**Delegation** hands a well-defined job to another object through a shared **protocol** contract. The delegating object holds a reference typed as that protocol — usually a **weak** property, because the delegate is often the same object that owns the delegating instance, and a strong reference both ways would create a **retain cycle**. Delegation is inherently one-to-one. Compared to a stored **closure** callback, a delegate protocol forces every required method to be implemented at compile time, while a closure is quicker for a single one-off callback but risks the same retain-cycle problem if it captures `self` strongly. **Combine**'s `PassthroughSubject` fits when there are multiple subscribers or the event is really a stream over time, since it composes with operators and is natively one-to-many. Cocoa's `UITableView` splits `dataSource` (pull: row count, row content) from `delegate` (push: selection, scroll events) — a deliberate separation of responsibilities. When several unrelated listeners need the same event, a plain single delegate slot doesn't scale; a **multicast** delegate (a weak-referencing list) or NotificationCenter/Combine is the better tool.",
    keyPoints: [
      "Protocol contract; delegating object holds a typed reference to the delegate",
      "weak because the delegate is often the owner — strong would retain-cycle",
      "One-to-one by design; delegate vs closure vs Combine differ in shape, not superiority",
      "dataSource (pull) vs delegate (push) split, e.g. UITableView",
      "Multiple listeners need multicast/NotificationCenter/Combine, not plain delegation",
    ],
    explanation:
      "A senior answer stresses the retain-cycle reasoning for `weak`, the one-to-one vs one-to-many distinction, and recognizing when delegation is the wrong tool.",
  },
];

export default quiz;
