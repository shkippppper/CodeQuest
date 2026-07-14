import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sendable-meaning",
    type: "mcq",
    prompt: "What does conforming to `Sendable` assert about a type?",
    options: [
      "It can be safely shared across concurrency boundaries without data races",
      "It can be serialized to JSON using JSONEncoder without any additional configuration",
      "It always executes its methods on the main thread, preventing concurrent access from background tasks",
      "It must be a reference type, since value types cannot safely cross concurrency boundaries",
    ],
    answer: 0,
    explanation:
      "`Sendable` is a marker protocol asserting a value is safe to pass between concurrency domains (tasks, actors). The compiler uses it to prove there's no way to mutate the value from two places at once.",
  },
  {
    id: "value-auto-sendable",
    type: "mcq",
    prompt: "When is a `struct` automatically `Sendable`?",
    options: [
      "When all of its stored properties are themselves `Sendable`",
      "Never — you must always write an explicit Sendable conformance declaration and verify each property yourself",
      "Only if it's marked `@unchecked Sendable`, which disables compiler validation for the entire type",
      "Only if it has no stored properties at all, since any property could introduce unsafe shared state",
    ],
    answer: 0,
    explanation:
      "Value types get **automatic** `Sendable` conformance when every stored property is Sendable. Copies are independent, so there's nothing to race — most standard structs qualify for free.",
  },
  {
    id: "mutable-class-not-sendable",
    type: "predict",
    prompt: "Is `class Box { var n = 0 }` `Sendable`?",
    code: `class Box { var n = 0 }`,
    options: [
      "No — a mutable class can be mutated through a shared reference from multiple tasks",
      "Yes — all classes are implicitly Sendable because ARC guarantees their memory is always valid",
      "Yes — because `n` is an Int, and Int is Sendable, so the class inherits Sendable from its stored properties",
      "Only if it's `final`, because subclasses could add mutable state that breaks the Sendable guarantee",
    ],
    answer: 0,
    explanation:
      "A **mutable** class is not `Sendable`: two tasks holding the same reference could both write `n`, a data race. Make it safe with an actor, an internal lock (`@unchecked Sendable`), or by making it immutable + `final`.",
  },
  {
    id: "sendable-closure-fill",
    type: "fill",
    prompt: "A closure that crosses a concurrency boundary (e.g. a `Task`'s body) must be marked ___ — requiring all its captures to be Sendable.",
    answers: ["@Sendable", "Sendable"],
    hint: "Starts with @, same word as the protocol.",
    explanation:
      "`@Sendable` closures can only capture Sendable values and can't capture mutable state by reference. `Task { }`'s closure is `@Sendable`, which is why capturing a mutable `var` triggers a warning/error.",
  },
  {
    id: "actor-implicitly-sendable",
    type: "mcq",
    prompt: "Are actors `Sendable`?",
    options: [
      "Yes — actors are implicitly Sendable because their state is isolated",
      "No — actors can never cross concurrency boundaries because their isolated state must remain on their own executor",
      "Only if explicitly marked `@unchecked Sendable`, since the compiler cannot prove actor isolation is sufficient",
      "Only if they have no stored properties, since properties on an actor could still be accessed unsafely from nonisolated contexts",
    ],
    answer: 0,
    explanation:
      "Actors are **implicitly `Sendable`**: since their mutable state is isolated and accessed one task at a time, a reference to an actor is safe to share. That's core to how you pass actors around.",
  },
  {
    id: "sendable-truths-multi",
    type: "multi",
    prompt: "Select **all** types/values that are (or can be) `Sendable`.",
    options: [
      "A struct whose stored properties are all Sendable",
      "A `final` class with only immutable `let` properties",
      "An actor",
      "A class with a mutable `var` property and no synchronization",
    ],
    answers: [0, 1, 2],
    explanation:
      "Value types of Sendable members, immutable final classes, and actors are all Sendable. An unsynchronized **mutable** class is not (option 3) — that's exactly the unsafe case Sendable is designed to catch.",
  },
  {
    id: "unchecked-sendable-senior",
    type: "mcq",
    prompt: "You have a `final class Cache` that guards its dictionary with an internal `NSLock`. The compiler still won't accept it as Sendable. What's the correct tool?",
    options: [
      "`@unchecked Sendable` — you assert it's thread-safe and take responsibility",
      "Remove the internal lock so the compiler can see immutable storage and infer Sendable automatically",
      "Make it a struct so the compiler synthesizes Sendable from its stored properties without any annotation",
      "Mark every method `nonisolated` so the compiler treats each call site as free of concurrency restrictions",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The compiler can't see that your lock makes access safe, so you use **`@unchecked Sendable`** to assert safety yourself. It disables the checks for that type — correct here, but dangerous if your synchronization is actually wrong.",
  },
  {
    id: "task-capture-senior",
    type: "predict",
    prompt: "🧠 Trick question — why does the compiler complain here (under strict concurrency)?",
    code: `class Box { var n = 0 }
let box = Box()
Task {
    box.n += 1
}`,
    options: [
      "`Task`'s closure is @Sendable, but `box` is a non-Sendable mutable class captured across the boundary",
      "You can't use Task at file scope; Task initializers are only valid inside async function bodies or actor methods",
      "`n += 1` isn't valid syntax inside a closure because compound assignment operators require an inout parameter",
      "Task closures can't capture any variables from the enclosing scope; all values must be passed as arguments instead",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Task { }` takes an `@Sendable` closure, so everything captured must be Sendable. `box` is a mutable class (not Sendable), so capturing and mutating it across the task boundary is a potential data race — flagged at compile time. Wrap the state in an actor to fix it.",
  },
  {
    id: "swift6-mode-senior",
    type: "mcq",
    prompt: "What changes about Sendable violations in Swift 6 language mode (complete concurrency checking)?",
    options: [
      "They become hard compile errors rather than warnings",
      "Sendable is removed and replaced by a new isolation-based system that doesn't require explicit protocol conformance",
      "All types become Sendable automatically, since Swift 6 assumes value types are safe to share unless marked otherwise",
      "Checking is disabled for performance, since complete concurrency checking proved too slow for large codebases",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Under **complete** concurrency checking (the default in Swift 6 mode), Sendable violations that were warnings become **errors**. The payoff: code that compiles is statically guaranteed free of data races — you migrate incrementally via minimal → targeted → complete checking.",
  },
  {
    id: "sendable-flashcard",
    type: "flashcard",
    prompt:
      "What is Sendable, which types qualify, and what are @Sendable closures and @unchecked Sendable? Answer aloud, then reveal.",
    modelAnswer:
      "**`Sendable`** is a marker protocol asserting a type is safe to pass across concurrency boundaries (into tasks, to actors) with no risk of simultaneous mutation — the compiler checks it to make **data-race safety a compile-time property**. Who qualifies: **value types** are auto-Sendable when all stored properties are Sendable; **immutable `final` classes** can be; **actors** are implicitly Sendable; **mutable, unsynchronized classes are not**. **`@Sendable` closures** (like `Task {}`'s body) require every capture to be Sendable and forbid capturing mutable state by reference. **`@unchecked Sendable`** is the escape hatch for a class you know is thread-safe (e.g. lock-guarded) but the compiler can't prove — it turns off the checks, so you own the correctness. Under Swift 6's complete checking, violations become hard errors.",
    keyPoints: [
      "Sendable = safe to cross concurrency boundaries; compiler-checked",
      "Value types (of Sendables) auto; immutable final classes; actors implicit",
      "Mutable unsynchronized classes are NOT Sendable",
      "@Sendable closures: all captures must be Sendable",
      "@unchecked Sendable = assert safety yourself; Swift 6 = errors not warnings",
    ],
    explanation:
      "Senior answers connect Sendable to the compile-time data-race guarantee, get the class rules right, and know @Sendable closures + the @unchecked escape hatch.",
  },
];

export default quiz;
