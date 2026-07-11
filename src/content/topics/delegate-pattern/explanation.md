## The problem: one object needs to ask another "what should I do here?"

Picture a download manager:

```swift
class FileDownloader {
    func start() {
        // ... bytes arrive over time ...
    }
}
```

When the download finishes, something needs to know — maybe a view controller wants to hide a spinner, maybe a logger wants to record the time. `FileDownloader` shouldn't import `UIKit` or know anything about spinners. It just needs a way to say "I'm done" to *whoever is listening*, without knowing who that is.

## Define the conversation as a protocol

Start with a protocol that lists exactly what `FileDownloader` might need to report:

```swift
protocol FileDownloaderDelegate: AnyObject {
    func downloader(_ downloader: FileDownloader, didFinishWith result: Data)
}
```

This is the **delegation** idiom: one object (the *delegate*) is handed a well-defined job by another object (the one delegating), through a protocol both sides agree on. `FileDownloader` doesn't know or care what a `FileDownloaderDelegate` actually *is* — a view controller, a test double, anything — only that it can call this one method on it.

Give `FileDownloader` a property to hold that delegate:

```swift
class FileDownloader {
    weak var delegate: FileDownloaderDelegate?

    func start() {
        // ... download completes ...
        delegate?.downloader(self, didFinishWith: Data())
    }
}
```

Now a view controller can plug itself in:

```swift
class DownloadViewController: UIViewController, FileDownloaderDelegate {
    let downloader = FileDownloader()

    override func viewDidLoad() {
        super.viewDidLoad()
        downloader.delegate = self
        downloader.start()
    }

    func downloader(_ downloader: FileDownloader, didFinishWith result: Data) {
        spinner.stopAnimating()
    }
}
```

`FileDownloader` calls one method on whatever object is sitting in `delegate` — it never imports `UIKit`, never knows a spinner exists. The view controller supplies the *behavior*; the downloader just supplies the *event*.

## Why `weak`?

Look again at the property:

```swift
weak var delegate: FileDownloaderDelegate?
```

`DownloadViewController` owns `downloader` (it's a stored property). If `downloader.delegate` held a **strong** reference back to the view controller, you'd have two objects each keeping the other alive — a **retain cycle**, where neither can ever be deallocated because each is still "needed" by the other. The `weak` keyword makes the delegate reference *not* count toward keeping the view controller alive, so when the view controller goes away, the cycle never forms.

Predict: what would happen if `delegate` were a plain (strong) `var` instead of `weak var`, and nothing else changed?

Answer: the view controller and the downloader would keep each other alive forever, even after the screen is dismissed — a leak. This is why `weak` is part of the idiom, not an optional extra: `AnyObject`-constrained delegate protocols exist specifically so the property *can* be marked `weak` (only reference types support weak references).

## Delegate vs closure vs Combine

The same "tell me when you're done" problem has other solutions. Compare them on the same downloader:

```swift
// Delegate — a named protocol method
protocol FileDownloaderDelegate: AnyObject {
    func downloader(_ downloader: FileDownloader, didFinishWith result: Data)
}

// Closure — a stored callback
class FileDownloader {
    var onFinish: ((Data) -> Void)?
}

// Combine — a published stream
class FileDownloader {
    let finished = PassthroughSubject<Data, Never>()
}
```

Each has a different sweet spot. A **closure** is quickest to write for a single, one-off callback, but a closure captures its surrounding context — if it captures `self` strongly, you get the exact same retain-cycle risk delegates solve with `weak`, except now you write `[weak self]` by hand at every capture site instead of once on a property. **Combine**'s `PassthroughSubject` is the right tool when there are *multiple* interested parties, or when the event is really a stream over time (progress updates, not just one finish); it composes with operators like `map` and `debounce` that delegates and closures don't get for free.

A **delegate** wins when there's exactly one owner that should respond, the callback surface is more than one method (several related events, not just "finished"), and you want the compiler to enforce that every method is implemented — a protocol with no default implementations forces the delegate to handle each case, where a closure property could silently be left `nil`.

## DataSource: splitting "tell me what happened" from "tell me what to show"

`UITableView` uses two separate protocols instead of one, and the split is worth noticing:

```swift
protocol TableDataSource: AnyObject {
    func numberOfRows() -> Int
    func row(at index: Int) -> String
}

protocol TableDelegate: AnyObject {
    func didSelectRow(at index: Int)
}
```

A **dataSource** answers *pull* questions — the table asks "how many rows do you have?" and "what goes in row 3?" whenever it needs to redraw. A delegate handles *push* events — the table tells it "the user tapped row 3" after the fact. Keeping them as two protocols means a read-only table can adopt only `TableDataSource` and skip `TableDelegate` entirely, and it makes each protocol's job obvious from its name alone.

```swift
class ListViewController: UIViewController, TableDataSource, TableDelegate {
    let items = ["Apple", "Banana", "Cherry"]

    func numberOfRows() -> Int { items.count }
    func row(at index: Int) -> String { items[index] }
    func didSelectRow(at index: Int) { print("selected \(items[index])") }
}
```

## When one delegate isn't enough

A plain `weak var delegate` can only point at one object. Sometimes several parts of your app all need to hear the same event — several screens watching one shared network monitor, say. You can't just add a second `weak var` for each new listener; that doesn't scale and doesn't let listeners come and go freely.

The usual fix is a **multicast** helper that holds many weak references instead of one:

```swift
final class WeakBox {
    weak var value: AnyObject?
    init(_ value: AnyObject) { self.value = value }
}

class MulticastDelegate<T> {
    private var boxes: [WeakBox] = []

    func add(_ delegate: T) {
        boxes.append(WeakBox(delegate as AnyObject))
    }

    func invoke(_ action: (T) -> Void) {
        boxes = boxes.filter { $0.value != nil }   // drop deallocated listeners
        boxes.forEach { box in
            if let delegate = box.value as? T { action(delegate) }
        }
    }
}
```

Each entry is still held weakly, so a listener that's deallocated is simply dropped rather than kept alive by the multicast list. This is the point where the delegate pattern starts to strain — if you find yourself reaching for a broadcast-to-many list, that's usually a sign `NotificationCenter` or Combine's `PassthroughSubject` (both natively one-to-many) is a better fit than bolting multicast support onto delegation.

## Common pitfalls

- **Forgetting `weak`.** A strong `delegate` property is the single most common source of a retain cycle in UIKit code.
- **Making the protocol too big.** A delegate protocol with a dozen unrelated methods is a sign two responsibilities got merged — split it, the way `UITableView` splits delegate from dataSource.
- **Reaching for delegation when you need one-to-many.** Delegation is one-to-one by design; broadcasting to several listeners belongs to `NotificationCenter` or Combine.

## Interview lens

If asked "what is the delegate pattern," give the mechanical answer first: a protocol defines a contract, the delegating object holds a `weak` reference typed as that protocol, and calls its methods when relevant events happen — decoupling the delegating object from any concrete type.

If asked "why `weak`," go straight to the retain cycle: the delegate usually owns the object it's delegating to, so a strong back-reference would keep both alive forever.

If asked to compare delegate vs closure vs Combine, the strong answer is about shape, not "which is best": delegate for a fixed set of one-to-one callback methods with compiler-enforced implementation, closures for a single one-off callback, Combine when there are multiple subscribers or the event is really a stream. Mentioning dataSource/delegate as a deliberate pull-vs-push split shows you've read real UIKit source, not just a pattern textbook.
