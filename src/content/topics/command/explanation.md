## The problem: "do this" and "undo it later" need to be the same thing

A text editor lets you type, delete, and format text. Add an undo button, and suddenly every single action needs a matching "un-action":

```swift
class Document {
    var text = ""

    func insert(_ string: String, at index: Int) {
        text.insert(contentsOf: string, at: text.index(text.startIndex, offsetBy: index))
    }
}
```

Calling `insert("Hi", at: 0)` mutates `text` directly and immediately forgets what happened. There's no record anywhere of *what just changed*, so there's nothing an undo button could reverse. You'd need to somehow remember "an insert of 'Hi' at index 0 just occurred" — and remember it in a form you can act on later.

## Intent: turn a request into an object

The **command pattern** wraps a request — "do this specific thing, with these specific parameters, to this specific receiver" — inside its own object, instead of executing it immediately and forgetting it. Once an action is an object, you can store it in an array, pass it around, delay it, log it, or reverse it, the same way you'd do any of those things with any other value.

```swift
protocol Command {
    func execute()
}
```

One method: `execute()`. Nothing about *what* it does — that's the whole point. The caller holding a `Command` doesn't need to know if it's an insert, a delete, or a network request; it just knows it can call `execute()`.

## Encapsulating actions

Wrap the insert operation from the example above as a `Command`:

```swift
class InsertTextCommand: Command {
    let document: Document
    let text: String
    let index: Int

    init(document: Document, text: String, index: Int) {
        self.document = document
        self.text = text
        self.index = index
    }

    func execute() {
        document.insert(text, at: index)
    }
}
```

Notice what moved: the *what* (insert "Hi" at index 0) and the *who* (this document) are now bundled together into one object, separate from the *when* (whenever `execute()` gets called). The three used to be fused into a single method call; now they're independent.

```swift
let command = InsertTextCommand(document: document, text: "Hi", index: 0)
// ... time passes, maybe a queue, maybe a button tap ...
command.execute()
```

Predict: what's different about calling `command.execute()` here versus calling `document.insert("Hi", at: 0)` directly, in terms of *when* the insert can happen?

Answer: nothing forces `execute()` to run right away. The command object can sit in a variable, get passed to another function, or wait in a list — the insert only actually happens the moment something calls `execute()` on it, which could be immediately or much later.

## Undo/redo: storing the reversal alongside the action

An `execute()`-only command can run later, but it still can't be undone — nothing recorded how to reverse it. Extend the protocol:

```swift
protocol Command {
    func execute()
    func undo()
}
```

Every concrete command now has to know how to reverse itself:

```swift
class InsertTextCommand: Command {
    let document: Document
    let text: String
    let index: Int

    init(document: Document, text: String, index: Int) {
        self.document = document
        self.text = text
        self.index = index
    }

    func execute() {
        document.insert(text, at: index)
    }

    func undo() {
        document.removeRange(from: index, length: text.count)
    }
}
```

A document keeps a history of executed commands so it knows what to reverse and in what order:

```swift
class Document {
    var text = ""
    private var history: [Command] = []

    func perform(_ command: Command) {
        command.execute()
        history.append(command)
    }

    func undoLast() {
        guard let last = history.popLast() else { return }
        last.undo()
    }
}
```

```swift
document.perform(InsertTextCommand(document: document, text: "Hi", index: 0))   // text: "Hi"
document.perform(InsertTextCommand(document: document, text: "!", index: 2))    // text: "Hi!"
document.undoLast()                                                             // text: "Hi"
document.undoLast()                                                             // text: ""
```

Each `undoLast()` pops the most recently performed command off `history` and calls its own `undo()` — the document itself never needs an `if` statement to figure out how to reverse an insert versus some other kind of edit. That knowledge lives inside each command.

**Redo** is the same idea with a second stack: when you undo a command, instead of throwing it away, push it onto a `redoStack`; a fresh `perform()` call clears that stack (a new action invalidates any redo history that came before it).

```swift
class Document {
    var text = ""
    private var history: [Command] = []
    private var redoStack: [Command] = []

    func perform(_ command: Command) {
        command.execute()
        history.append(command)
        redoStack.removeAll()
    }

    func undoLast() {
        guard let last = history.popLast() else { return }
        last.undo()
        redoStack.append(last)
    }

    func redoLast() {
        guard let last = redoStack.popLast() else { return }
        last.execute()
        history.append(last)
    }
}
```

## Command queues

Because a command is just an object, a **command queue** — an ordered list of pending commands waiting to run — is a to-do list the receiver can work through at its own pace:

```swift
class CommandQueue {
    private var pending: [Command] = []

    func enqueue(_ command: Command) {
        pending.append(command)
    }

    func runAll() {
        pending.forEach { $0.execute() }
        pending.removeAll()
    }
}
```

This is the same shape `OperationQueue` and Combine's scheduling primitives use under the hood — accept work as discrete units, run them later, possibly reorder or throttle them, possibly run several concurrently. Wrapping each edit as a `Command` object is what makes any of that possible; a bare function call has already finished by the time you'd want to queue, retry, or reorder it.

A queue also gives you a natural place to add cross-cutting behavior without touching any individual command: logging every command before it runs, retrying a failed one, or persisting the queue to disk so pending work survives an app relaunch.

```swift
func runAll() {
    pending.forEach { command in
        print("running \(type(of: command))")
        command.execute()
    }
    pending.removeAll()
}
```

## Examples elsewhere

Menu items and toolbar buttons in traditional UIKit/AppKit apps are commands under the hood — `UIMenuItem` and `NSMenuItem` **target-action** pairs (a stored reference to "who receives this" plus "what selector to call") bundle those two things together, deliberately decoupling the button from the code it triggers, the same separation `Command` gives you explicitly. `Operation` (as opposed to a raw closure passed to `DispatchQueue`) is a command with extra structure: it can be cancelled, made dependent on other operations, and queued — all things a plain function call can't do once it's already running.

```swift
class SaveDocumentOperation: Operation {
    let document: Document
    init(document: Document) { self.document = document }
    override func main() {
        guard !isCancelled else { return }
        document.save()
    }
}
```

## Common pitfalls

- **Only implementing `execute()`, then bolting undo on later as an afterthought.** If undo is a requirement, design the `undo()` method into the protocol from the start — retrofitting it means auditing every existing command for what state it needs to remember.
- **Forgetting to clear the redo stack on a new action.** Without clearing it, undoing, performing a new edit, then hitting redo would replay a command against text that no longer matches what it expects.
- **Using a command object where a plain function call would do.** If nothing ever needs to queue, log, undo, or delay the action, wrapping it as a `Command` is unnecessary ceremony — reach for this pattern when *when* and *what* genuinely need to be decoupled.

## Interview lens

If asked "what is the command pattern," lead with the reframe: turning a request — receiver, action, and parameters — into an object, so it can be stored, passed around, delayed, or reversed instead of executing and being forgotten immediately.

If asked how undo/redo works, describe the two-stack shape: a history stack of executed commands to pop and `undo()`, and a redo stack that receives undone commands and gets cleared the moment a new command is performed — that clearing detail is the part people forget and interviewers probe for.

If asked for real-world examples, `Operation`/`OperationQueue` and target-action in UIKit/AppKit are the strongest ones to name — they show you recognize the pattern in framework code, not just as a textbook diagram, which is usually the signal a senior-level answer is going for.
