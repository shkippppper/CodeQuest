## The problem: forced to implement methods you don't need

A team building a document editor defines one protocol for every device that can output a document:

```swift
protocol Printer {
    func printDocument(_ doc: Document)
    func scanDocument() -> Document
    func faxDocument(_ doc: Document, to number: String)
}
```

Most printers in this office are cheap, print-only USB printers. But `Printer` demands three methods, so the print-only driver has to write something for the two it can't do:

```swift
struct BasicUSBPrinter: Printer {
    func printDocument(_ doc: Document) {
        // actually prints
    }
    func scanDocument() -> Document {
        fatalError("this printer can't scan")
    }
    func faxDocument(_ doc: Document, to number: String) {
        fatalError("this printer can't fax")
    }
}
```

Every caller holding a `Printer` now has to know, out of band, that some printers will crash if you call `scanDocument()`. The protocol *promised* scanning is available; `BasicUSBPrinter` can't keep that promise, so it lies and crashes instead. This is quietly the exact same trap as the `Penguin: Bird` example from the Liskov Substitution lesson — a conformance that can't honor part of what it signed up for.

## Fat interfaces

`Printer` is a **fat interface** — a protocol bundling multiple unrelated capabilities into one contract, so every conformer is forced to deal with all of them even if it only needs one.

The tell is the same "who asked for this" question from the Single Responsibility lesson, applied to a protocol instead of a class: printing, scanning, and faxing are three different capabilities that different hardware supports independently. Bundling them assumes every conformer needs all three, which is false the moment a print-only device shows up.

Fat interfaces don't only cause crashes like `BasicUSBPrinter`'s. They also create false coupling: code that only wants to print has to import and depend on a protocol that also talks about faxing, so a change to the faxing method's signature can force a recompile — or a review — of code that never used fax at all.

## Splitting protocols

The **Interface Segregation Principle** (ISP) says: clients shouldn't be forced to depend on methods they don't use. The fix for `Printer` is to split it along its actual capabilities:

```swift
protocol Printing {
    func printDocument(_ doc: Document)
}

protocol Scanning {
    func scanDocument() -> Document
}

protocol Faxing {
    func faxDocument(_ doc: Document, to number: String)
}
```

Now each device conforms to exactly what it can do:

```swift
struct BasicUSBPrinter: Printing {
    func printDocument(_ doc: Document) {
        // actually prints
    }
}

struct AllInOneDevice: Printing, Scanning, Faxing {
    func printDocument(_ doc: Document) { /* ... */ }
    func scanDocument() -> Document { /* ... */ }
    func faxDocument(_ doc: Document, to number: String) { /* ... */ }
}
```

`BasicUSBPrinter` no longer has a `scanDocument()` method at all — there's nothing to fake, nothing to crash. `AllInOneDevice` conforms to all three protocols because it genuinely can do all three, and Swift lets a type conform to as many protocols as it needs.

Code that only wants to print can now ask for exactly that, and nothing more:

```swift
func printReport(_ doc: Document, using printer: Printing) {
    printer.printDocument(doc)
}
```

Predict: can `printReport` be called with an `AllInOneDevice`, even though its parameter type is the narrower `Printing` protocol, not `Printing & Scanning & Faxing`?

Answer: yes. `AllInOneDevice` conforms to `Printing` (among others), so it satisfies the parameter requirement on its own. Splitting protocols doesn't stop a type from adopting several of them — it just stops *callers* from being forced to demand more than they need.

## Role interfaces

The pattern above — a protocol that names exactly one capability, kept small enough to describe the *role* a type plays rather than everything a type might do — is called a **role interface**. `Printing`, `Scanning`, and `Faxing` are each a role: "the printing role," "the scanning role."

Role interfaces compose. A type doesn't need one big protocol that anticipates every combination — it just conforms to every role protocol it actually fills:

```swift
struct NetworkPrinter: Printing, Faxing {
    func printDocument(_ doc: Document) { /* ... */ }
    func faxDocument(_ doc: Document, to number: String) { /* ... */ }
}
```

`NetworkPrinter` can print and fax but not scan, and that's expressible directly in its type — no `fatalError`, no documentation comment warning callers away from a method that's "there but doesn't work." The type system itself tells you what `NetworkPrinter` can do.

This is also why ISP and the Single Responsibility Principle reinforce each other: SRP asks a *type* to have one reason to change, and ISP asks a *protocol* to describe one role. A fat protocol tends to produce conformers with mixed responsibilities, because conforming to it drags in unrelated behavior whether the type wants it or not.

## ISP in Cocoa delegates

Apple's own frameworks show both the violation and the fix. `UITableViewDelegate` and `UITableViewDataSource` are deliberately two separate protocols, even though almost every table view needs both:

```swift
protocol UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell
    // ...
}

protocol UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath)
    // ...
}
```

Splitting "what data goes in the table" from "how the table behaves when tapped/scrolled" means a type that only supplies data — say, a headless data source used for calculating layout — doesn't have to stub out selection-handling methods it will never call. The two protocols are separate roles, adopted independently.

Contrast that with `UIScrollViewDelegate`, which is comparatively large — it bundles scroll position, zoom, and deceleration callbacks into one protocol. In practice this is a milder ISP trade-off Apple accepted deliberately: nearly every conformer that cares about scrolling ends up wanting several of these callbacks together, so splitting them further would mostly add boilerplate without preventing real forced dependencies. ISP is a spectrum, not an all-or-nothing rule — the right granularity is "split along genuinely independent capabilities," not "split every method into its own protocol."

## Default implementations

Swift protocol extensions offer a related but different tool: **default implementations**, which let a protocol provide a method body that conformers inherit for free unless they override it.

```swift
protocol Loggable {
    func log(_ message: String)
}

extension Loggable {
    func log(_ message: String) {
        print("[LOG] \(message)")
    }
}
```

Any type conforming to `Loggable` gets `log(_:)` automatically — no `fatalError`, no unimplemented-method crash, and no ISP violation, because the conformer isn't forced to *write* anything for a capability it doesn't want to customize. This looks similar to the `Printer` problem on the surface (a protocol method a conformer doesn't implement), but it's the opposite situation: with `BasicUSBPrinter`, calling the unimplemented method crashes; with `Loggable`, calling the un-overridden method runs a sensible, working default.

Default implementations are a good fit when a capability is genuinely optional *and* there's a reasonable default behavior every conformer can share. They are not a fix for a fat protocol — providing a default body for `scanDocument()` that silently does nothing would hide the missing capability instead of expressing it, which is worse than `BasicUSBPrinter`'s honest `fatalError`. ISP's real fix is always splitting the protocol along its roles; default implementations are for trimming boilerplate on methods every conformer legitimately has.

## Common pitfalls

- One protocol per method, with no real cohesion. Splitting `Printing`, `Scanning`, and `Faxing` makes sense because they're independent capabilities. Splitting a protocol like `Point { var x: Double; var y: Double }` into two one-property protocols does not — `x` and `y` are the same role.
- Papering over a fat protocol with default implementations that do nothing. A default `scanDocument()` that silently no-ops hides a real capability gap instead of removing it from the type's contract.
- Forgetting that a type can conform to many small protocols at once. ISP doesn't cost you polymorphism — `AllInOneDevice: Printing, Scanning, Faxing` is still one type usable through any of the three, individually or together (`Printing & Scanning`).

## Interview lens

If asked to define ISP, say it precisely: clients shouldn't be forced to depend on methods they don't use — and connect it to the concrete failure mode, a fat protocol that forces a conformer to write `fatalError` or a no-op stub for a capability it doesn't have.

If given a fat-protocol example, the fix is always the same shape: identify the independent capabilities bundled together, split each into its own protocol, and let types conform to exactly the ones they can honestly implement. Name `UITableViewDataSource`/`UITableViewDelegate` as a real-world example Apple already ships this way.

If asked about default implementations, be precise about what they're for: reducing boilerplate for a capability every conformer legitimately has, not a workaround for a capability some conformers don't have. Mixing those up — using a default no-op to quiet a compiler error on a method that shouldn't be there at all — is worse than the original ISP violation, because it hides the gap instead of surfacing it in the type.
