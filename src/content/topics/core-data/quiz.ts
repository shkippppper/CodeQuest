import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "cd-stack-roles",
    type: "mcq",
    prompt: "Which statement correctly describes the Core Data stack?",
    options: [
      "The persistent store coordinator talks to disk, the managed object context is your in-memory working set, and the container wires them together",
      "The context talks directly to SQLite and the coordinator is optional",
      "The container is the in-memory working set you edit objects in",
      "NSManagedObjectContext writes to disk on every property change",
    ],
    answer: 0,
    explanation:
      "The **coordinator** is the disk-facing layer, the **context** is your in-memory scratchpad of objects, and `NSPersistentContainer` sets both up for you. Nothing hits disk until you call `save()` on a context.",
  },
  {
    id: "cd-save-predict",
    type: "predict",
    prompt: "What has actually happened after these two lines run?",
    code: `let task = Task(context: context)
task.title = "Buy milk"`,
    options: [
      "The task exists only in the in-memory context; nothing has been written to disk yet",
      "The task is already saved to the SQLite file",
      "This throws because context requires a save immediately",
      "The task is discarded because no relationship was set",
    ],
    answer: 0,
    explanation:
      "Creating and editing a managed object only changes the context's in-memory state. Nothing touches disk until you explicitly call `context.save()`.",
  },
  {
    id: "cd-inverse-fill",
    type: "fill",
    prompt: "Every relationship in a Core Data model should have its ___ set on the model editor's other entity, or the two sides won't stay in sync.",
    answers: ["inverse"],
    hint: "The matching relationship on the other entity.",
    explanation:
      "Without the **inverse** relationship configured, setting one side (e.g. `task.project = project`) won't automatically update the other side (`project.tasks`).",
  },
  {
    id: "cd-predicate-mcq",
    type: "mcq",
    prompt: "What does `NSPredicate(format: \"isDone == NO AND dueDate < %@\", Date() as NSDate)` do when used as a fetch request's predicate?",
    options: [
      "Filters at the store level for incomplete tasks whose due date is before now",
      "Fetches every task and lets Swift filter afterward",
      "Sorts tasks by due date",
      "Throws because %@ can't be used with a Date",
    ],
    answer: 0,
    explanation:
      "The predicate is translated into a `WHERE` clause run by the store itself (typically SQLite), filtering before objects are loaded — far cheaper than fetching everything and filtering in Swift.",
  },
  {
    id: "cd-delete-rule-multi",
    type: "multi",
    prompt: "Select all true statements about Core Data delete rules on a to-many relationship.",
    options: [
      ".cascade deletes the related objects when the owning object is deleted",
      ".nullify clears the relationship pointer on related objects instead of deleting them",
      ".deny blocks the delete while related objects still exist",
      "A delete rule is required only for to-one relationships",
    ],
    answers: [0, 1, 2],
    explanation:
      "`.cascade`, `.nullify`, and `.deny` all describe real delete-rule behaviors. Delete rules apply to relationships generally, not just to-one ones.",
  },
  {
    id: "cd-frc-purpose",
    type: "mcq",
    prompt: "What does NSFetchedResultsController give you that a plain `context.fetch(request)` doesn't?",
    options: [
      "Live change notifications (inserts/deletes/updates) so a list view can animate diffs instead of reloading",
      "Faster raw fetch performance",
      "Automatic background threading",
      "The ability to skip predicates",
    ],
    answer: 0,
    explanation:
      "A plain fetch is a one-time snapshot. An FRC (what SwiftUI's `@FetchRequest` uses under the hood) subscribes to the context and reports exactly what changed, which is what drives table/collection view row animations.",
  },
  {
    id: "cd-viewcontext-thread",
    type: "fill",
    prompt: "`container.viewContext` is confined to the ___ queue/thread — accessing it off that queue is a common source of crashes and corrupted state.",
    answers: ["main"],
    hint: "The same queue the UI runs on.",
    explanation:
      "`viewContext` is main-queue-confined. Background work should use a separate context from `container.newBackgroundContext()`, accessed only via `perform`.",
  },
  {
    id: "cd-migration-senior",
    type: "mcq",
    prompt: "You're splitting one Core Data entity into two entities and moving some attributes to the new one. What's required?",
    options: [
      "An explicit mapping model, because this structural change can't be inferred automatically",
      "Nothing — lightweight migration handles any schema change automatically",
      "Deleting and recreating the persistent store on every launch",
      "Switching to SwiftData, since Core Data can't migrate structural changes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Lightweight migration only covers changes Core Data can infer — new/optional attributes, simple renames. Splitting an entity or transforming data during the move requires an explicit **mapping model**.",
  },
  {
    id: "cd-cross-context-senior",
    type: "predict",
    prompt: "🧠 A background context saves a new Task. Does `viewContext`'s fetched results immediately reflect it, and why?",
    code: `bgContext.perform {
    let t = Task(context: bgContext)
    t.title = "Imported"
    try? bgContext.save()
}
// viewContext already has automaticallyMergesChangesFromParent = true (default)`,
    options: [
      "Yes — after the background context saves, the container merges the change into viewContext automatically because automaticallyMergesChangesFromParent is on",
      "No — the two contexts can never share data without manual NSNotification handling",
      "Yes, but only after the app is force-quit and relaunched",
      "No — Task objects can't be created outside viewContext",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "With `automaticallyMergesChangesFromParent = true` (the default for contexts from the same `NSPersistentContainer`), a save on one context is merged into sibling contexts automatically — no manual notification observing needed, though the merge only happens after `save()` actually completes.",
  },
  {
    id: "cd-flashcard",
    type: "flashcard",
    prompt:
      "Explain the Core Data stack, how relationships stay consistent, and how contexts handle concurrency. Answer aloud, then reveal.",
    modelAnswer:
      "Core Data's stack has three parts: the **persistent store coordinator** talks to the on-disk store (usually SQLite), the **managed object context** is an in-memory scratchpad of objects you create/edit, and `NSPersistentContainer` sets both up and exposes a ready-to-use `viewContext`. Nothing reaches disk until you call `save()` on a context — that gap lets you batch edits or `rollback()` them. Entities are the schema (like a class blueprint) with attributes and **relationships**; every relationship needs its **inverse** configured in the model editor or the two sides won't stay synced when you set one. Delete rules (`.cascade`/`.nullify`/`.deny`) control what happens to related objects on delete. Reading data means building an `NSFetchRequest` with an optional `NSPredicate` (translated into a store-level `WHERE` clause, far cheaper than fetching everything and filtering in Swift) and optional sort descriptors. A plain fetch is a snapshot; `NSFetchedResultsController` (or SwiftUI's `@FetchRequest`) subscribes to the context and reports granular changes for animated UI updates. For concurrency, `viewContext` is main-queue-confined — background work needs its own context from `newBackgroundContext()`, accessed only inside `perform`. Contexts from the same container merge each other's saved changes automatically via `automaticallyMergesChangesFromParent`. For schema changes, lightweight migration handles additive/inferable changes automatically; structural changes need an explicit mapping model.",
    keyPoints: [
      "Coordinator = disk, context = in-memory working set, container wires them up",
      "Nothing persists until save(); relationships need an explicit inverse",
      "Predicates filter at the store level, not in Swift after fetching",
      "NSFetchedResultsController/@FetchRequest give live diffs vs a one-time fetch snapshot",
      "viewContext is main-thread only; background work needs its own context + perform",
      "Lightweight migration for additive changes; explicit mapping model for structural ones",
    ],
    explanation:
      "A senior answer connects concurrency rules (one context per queue) to the auto-merge mechanism between contexts, and clearly separates lightweight migration from mapping-model migration.",
  },
];

export default quiz;
