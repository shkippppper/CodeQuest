import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "async-let-parallel",
    type: "mcq",
    prompt: "How does `async let a = f(); async let b = g()` differ from `let a = await f(); let b = await g()`?",
    options: [
      "`async let` runs f and g concurrently; the sequential `await` version runs them one after another",
      "They are identical — both forms start f and g at the same time; the difference is only stylistic",
      "`async let` runs them sequentially, just like the plain await form, but using a slightly different internal scheduler path",
      "The `await` version is concurrent because each await suspends the caller and lets the other task run on a free thread",
    ],
    answer: 0,
    explanation:
      "`async let` starts each child task **immediately**, so `f()` and `g()` run in parallel; you `await` their results later. Writing `let a = await f()` blocks until `f` finishes before `g` even starts — sequential.",
  },
  {
    id: "taskgroup-dynamic",
    type: "mcq",
    prompt: "When should you use a `TaskGroup` instead of `async let`?",
    options: [
      "When the number of child tasks is dynamic (e.g. one per element of a list)",
      "When you have exactly two tasks, since async let only supports a single concurrent binding at a time",
      "When you don't need results and want to fire-and-forget work without collecting return values",
      "Never — async let fully replaces TaskGroup even for dynamic counts, because you can put async let inside a loop",
    ],
    answer: 0,
    explanation:
      "`async let` is for a **fixed**, compile-time-known set of concurrent tasks. A `TaskGroup` handles a **dynamic** count — you `addTask` in a loop and collect results as they finish.",
  },
  {
    id: "cancellation-cooperative-fill",
    type: "fill",
    prompt: "Call `Task.____()` to throw a `CancellationError` if the current task has been cancelled.",
    answers: ["checkCancellation"],
    hint: "Task.____() — it 'checks' the cancel flag.",
    explanation:
      "`Task.checkCancellation()` throws `CancellationError` when cancelled. Alternatively read `Task.isCancelled` and bail manually. Cancellation is cooperative — marking a task cancelled doesn't stop it; the code must check.",
  },
  {
    id: "taskgroup-order",
    type: "mcq",
    prompt: "In what order do results arrive when iterating `for await x in group`?",
    options: [
      "Completion order — whichever child finishes first",
      "The order tasks were added with addTask, preserving the original submission sequence regardless of how long each takes",
      "Reverse order — results arrive last-in, first-out based on when each child task was scheduled",
      "Sorted order — the group sorts results by their return value before yielding them to the for-await loop",
    ],
    answer: 0,
    explanation:
      "A task group yields results in **completion order**, not submission order. If you need submission order, collect into a dictionary keyed by index and reorder afterward.",
  },
  {
    id: "parent-waits-predict",
    type: "mcq",
    prompt: "In structured concurrency, can a child task (via `async let` / `TaskGroup`) outlive the scope that created it?",
    options: [
      "No — the parent scope cannot return until all its children finish",
      "Yes — children run independently forever; the parent can return early and the runtime keeps child tasks alive on their own",
      "Only if the async let binding is marked @escaping to opt the child out of the structured lifetime guarantee",
      "Only detached tasks can have children; async let and TaskGroup don't create real parent-child relationships",
    ],
    answer: 0,
    explanation:
      "That's the defining property of *structured* concurrency: children are bound to the parent scope, which won't return until they complete (or are cancelled). No child silently outlives its parent.",
  },
  {
    id: "structured-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about structured concurrency.",
    options: [
      "Child tasks inherit the parent's priority and task-local values",
      "Cancelling a parent propagates cancellation to its children",
      "`Task { }` creates a child bound to the enclosing scope",
      "If a TaskGroup child throws, the group cancels its siblings and propagates the error",
    ],
    answers: [0, 1, 3],
    explanation:
      "Children inherit context, cancellation flows down the tree, and a throwing group child cancels siblings. But `Task { }` is **unstructured** — its lifetime is NOT bound to the enclosing scope (option 3 is false).",
  },
  {
    id: "unstructured-task-senior",
    type: "mcq",
    prompt: "You start work with a bare `Task { await doWork() }` inside a view. What's your responsibility?",
    options: [
      "It's unstructured — you must store the handle and cancel it yourself (e.g. on disappear)",
      "Nothing — it's cancelled automatically with the enclosing view or scope, just like a structured child task would be",
      "It runs on a detached thread with no actor context and no inherited priority from the call site",
      "It blocks the caller until done, suspending the current actor just like a plain await expression would",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Task { }` is **unstructured**: it inherits actor context and priority but its lifetime isn't tied to any scope, so nothing cancels it for you. Store the handle and call `.cancel()` when appropriate. (SwiftUI's `.task` modifier *does* auto-cancel, which is why it's preferred there.)",
  },
  {
    id: "detached-senior",
    type: "mcq",
    prompt: "How does `Task.detached { }` differ from `Task { }`?",
    options: [
      "Detached inherits nothing — no priority, no actor isolation, no task-local values",
      "Detached is always faster because it skips the overhead of copying actor context and priority from the parent task",
      "Detached is automatically cancelled when the calling scope exits, the same way a structured child task would be",
      "There is no difference — both Task and Task.detached produce unstructured tasks that inherit all the same context from the caller",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Task { }` inherits the current actor, priority, and task-locals. `Task.detached { }` inherits **none** of that — a clean slate. It's rarely the right tool; you usually want the inherited context, so reach for detached only deliberately.",
  },
  {
    id: "async-let-no-await-senior",
    type: "predict",
    prompt: "🧠 Trick question — you write `async let x = slowWork()` but the function returns without ever `await`ing `x`. What happens?",
    code: `func run() async {
    async let x = slowWork()
    return   // x is never awaited
}`,
    options: [
      "The child task is automatically cancelled and awaited as the scope exits",
      "x keeps running forever in the background, since the runtime has no way to know the caller abandoned the binding",
      "Compile error — the compiler requires you to explicitly await every async let binding before the enclosing scope returns",
      "It leaks the task indefinitely; the async let binding holds a strong reference that prevents the task from being deallocated",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Structured concurrency guarantees no child outlives its scope. If you never `await` an `async let`, the runtime **implicitly cancels and awaits** it as the scope exits — so it can't leak or run forever. (You'll usually get a warning nudging you to await it.)",
  },
  {
    id: "priority-escalation-senior",
    type: "mcq",
    prompt: "A `.high` priority task awaits the result of a `.low` priority task. What does the runtime do to avoid priority inversion?",
    options: [
      "Priority escalation — it temporarily raises the low task's priority",
      "It deadlocks when both tasks share the same serial actor, since the high-priority waiter blocks the actor the low-priority task needs",
      "It cancels the low task and restarts it at high priority so the waiter can proceed without being blocked indefinitely",
      "Nothing — the high task just waits at low speed, accepting the inversion as an unavoidable consequence of cooperative scheduling",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Swift concurrency performs **priority escalation**: when a high-priority task depends on a lower-priority one, the runtime boosts the dependency's priority so the waiter isn't starved — the same problem GCD's QoS system also addresses.",
  },
  {
    id: "structured-flashcard",
    type: "flashcard",
    prompt:
      "What makes concurrency 'structured', and how do async let, TaskGroup, and Task { } differ? Answer aloud, then reveal.",
    modelAnswer:
      "**Structured** means child tasks form a **tree bound to a scope**: a parent can't return until its children finish, children inherit priority/task-locals, and **cancellation and errors propagate automatically** through the tree. **`async let`** starts a fixed, compile-time-known set of children in parallel that you `await` later. **`TaskGroup`** (`withTaskGroup`/`withThrowingTaskGroup`) handles a **dynamic** number of children (`addTask` in a loop; results arrive in completion order; a throwing child cancels siblings). Both are structured. **`Task { }`** is **unstructured** — it inherits actor context and priority but its lifetime is NOT scoped, so you must store and cancel it yourself. **`Task.detached { }`** inherits nothing and should be rare. Cancellation is cooperative everywhere: it only marks tasks; code must `Task.checkCancellation()` or check `Task.isCancelled`.",
    keyPoints: [
      "Structured = child tasks scoped to a parent that awaits them",
      "async let = fixed parallel tasks; TaskGroup = dynamic count",
      "Cancellation & errors propagate through the tree, cooperatively",
      "Task { } is unstructured (manage lifetime); Task.detached inherits nothing",
      "Results from a group arrive in completion order",
    ],
    explanation:
      "The senior signal is the tree/scope framing with automatic cancellation, correctly separating async let vs TaskGroup vs unstructured Task, and noting cooperative cancellation.",
  },
];

export default quiz;
