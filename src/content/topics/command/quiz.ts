import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "command-intent",
    type: "mcq",
    prompt: "What is the core intent of the command pattern?",
    options: [
      "Wrap a request (receiver, action, and parameters) as an object, so it can be stored, delayed, queued, or reversed instead of executing and being forgotten immediately",
      "Ensure a class has exactly one shared instance across the app by making the initializer private and exposing a static property or class method as the sole access point",
      "Provide a simplified, unified interface that hides the full complexity of a large or intricate subsystem behind a single, narrow facade entry point for clients to use",
      "Notify a variable number of loosely-coupled observers automatically whenever a subject's internal state changes, fully decoupling the publisher from every subscriber",
    ],
    answer: 0,
    explanation:
      "Command turns 'do this now and forget' into a first-class object, which unlocks storing, delaying, logging, queuing, and undoing that action later.",
  },
  {
    id: "command-execute-fill",
    type: "fill",
    prompt: "The minimal Command protocol has a single required method, conventionally named ___(), that performs the wrapped action.",
    answers: ["execute"],
    hint: "It's the verb for 'run this command now'.",
    explanation:
      "`execute()` is the one method every command must implement — what happens inside is opaque to whoever is holding the command.",
  },
  {
    id: "command-predict-undo",
    type: "predict",
    prompt: "What is `document.text` after this runs?",
    code: `document.perform(InsertTextCommand(document: document, text: "Hi", index: 0))   // "Hi"
document.perform(InsertTextCommand(document: document, text: "!", index: 2))    // "Hi!"
document.undoLast()
print(document.text)`,
    options: ["\"Hi\"", "\"Hi!\"", "\"\" (empty string)", "Compile error"],
    answer: 0,
    explanation:
      "`undoLast()` pops the most recently performed command — the insert of \"!\" — and calls its `undo()`, reversing only that one edit and leaving \"Hi\".",
  },
  {
    id: "command-redo-clear-mcq",
    type: "mcq",
    prompt: "Why must the redo stack be cleared whenever a brand-new command is performed?",
    options: [
      "Because a stale redo entry could replay a command against text that no longer matches what it was originally designed to reverse",
      "To recover memory, since Command objects can be very large in practice, though clearing the redo stack has no effect on correctness at all",
      "Because Swift arrays automatically discard all elements past the current insertion point whenever a new element is appended to them",
      "It doesn't actually need to be cleared — both stacks remain valid in all cases and redo always produces correct output regardless",
    ],
    answer: 0,
    explanation:
      "If you undo, perform a new unrelated edit, then redo, the redone command was recorded against a different document state — replaying it can corrupt the result. Clearing redo on a new action prevents this.",
  },
  {
    id: "command-encapsulation-multi",
    type: "multi",
    prompt: "Select all statements that are true about encapsulating an action as a Command object.",
    options: [
      "The 'what' (action + parameters) and 'who' (receiver) are bundled together, separate from 'when' it runs",
      "A command object can sit in a variable or list before execute() is ever called",
      "Wrapping every function call as a Command is always a net improvement in a codebase",
      "A command holding undo() must know how to reverse its own specific action",
    ],
    answers: [0, 1, 3],
    explanation:
      "Command decouples what/who from when — but wrapping every call as a Command when nothing needs queuing, delay, logging, or undo is unnecessary ceremony, not an improvement.",
  },
  {
    id: "command-queue-mcq",
    type: "mcq",
    prompt: "What capability does turning actions into Command objects unlock that a queue of raw function calls cannot easily provide?",
    options: [
      "The ability to store, reorder, retry, or delay units of work, since each is now a value rather than something already executing",
      "Faster execution of the underlying operation, because command objects bypass the normal Swift method dispatch overhead entirely",
      "Automatic thread safety for all enqueued work with no additional synchronization code required on the receiver or queue",
      "Permanent elimination of the receiver object, since the command object captures all required context and handles the action entirely on its own",
    ],
    answer: 0,
    explanation:
      "A raw function call has already run by the time you might want to reorder or retry it. A Command object is a value that can sit in a queue, be logged, retried, or reordered before it ever executes.",
  },
  {
    id: "command-operation-senior",
    type: "predict",
    prompt: "🧠 A senior engineer says Operation/OperationQueue is 'basically the command pattern with extra structure.' What extra structure justifies that claim?",
    code: `class SaveDocumentOperation: Operation {
    let document: Document
    init(document: Document) { self.document = document }
    override func main() {
        guard !isCancelled else { return }
        document.save()
    }
}`,
    options: [
      "Operation adds cancellation and dependency management on top of the basic execute-later shape a plain Command provides",
      "Operation has nothing in common with the command pattern, being defined purely by Apple's GCD concurrency model and not by the GoF pattern catalog",
      "Operation cannot be added to a queue after it has been created, unlike a plain Command object which is freely passed and scheduled anywhere",
      "Operation always executes synchronously on the calling thread, unlike a plain Command which always defers its action to an asynchronous queue",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Operation is a command (wraps an action as an object with a run entry point) plus cancellation (isCancelled) and inter-operation dependencies — capabilities a bare execute()-only Command doesn't have out of the box.",
  },
  {
    id: "command-design-tradeoff-senior",
    type: "mcq",
    prompt: "A junior teammate proposes wrapping every single button-tap handler in the app as its own Command class 'for consistency,' even though none of them need undo, queuing, or logging. What's the strongest objection?",
    options: [
      "It adds ceremony without benefit — command earns its cost when when/what genuinely need to be decoupled (undo, delay, queuing, logging), not as a blanket default",
      "Command classes always incur significantly more runtime overhead than closures because Swift must perform a full vtable dispatch on every execute() call",
      "Command objects cannot be used with SwiftUI buttons or any SwiftUI action handler at all, making the entire pattern incompatible with modern declarative UI code",
      "There is no valid objection since encapsulating every tap handler as its own explicitly named Command class always improves code readability and long-term maintainability",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Applying a pattern uniformly regardless of need is a common over-engineering trap. Command is worth its ceremony specifically when actions need to be stored, delayed, undone, or queued — not for every handler by default.",
  },
  {
    id: "command-flashcard",
    type: "flashcard",
    prompt: "Explain the command pattern, how undo/redo works with it, and how command queues extend it. Answer aloud, then reveal.",
    modelAnswer:
      "The **command pattern** wraps a request — a receiver, an action, and its parameters — inside an object with an `execute()` method, instead of running the action immediately and forgetting it. This decouples *what* runs and *who* it runs on from *when* it runs: the object can sit in a variable, be passed around, or wait in a list before `execute()` is ever called. Adding **undo/redo** means every command also implements `undo()`, and the receiver keeps a history stack of executed commands to pop and reverse; a second **redo stack** receives undone commands, but must be cleared whenever a brand-new command is performed — otherwise a stale redo could replay against document state it no longer matches. A **command queue** takes this further: since commands are just objects, a list of them is a to-do list of pending work that can be run later, reordered, retried, or logged before execution — something a plain function call, which is already running, can't offer. Real-world examples: UIKit/AppKit's target-action pairs, and `Operation`/`OperationQueue`, which is a command with added cancellation and dependency management.",
    keyPoints: [
      "Request becomes an object: receiver + action + params, single execute() entry point",
      "Decouples what/who from when — can be stored, delayed, passed around",
      "Undo/redo: history stack pops and calls undo(); redo stack cleared on new command",
      "Command queue: pending commands as values, enabling reorder/retry/logging",
      "Operation/OperationQueue and target-action are real command-pattern examples",
    ],
    explanation:
      "A senior answer connects the redo-stack-clearing detail and names Operation as command-plus-cancellation-plus-dependencies, not just a textbook definition.",
  },
];

export default quiz;
