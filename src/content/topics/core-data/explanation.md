## The problem: keeping objects alive between launches

An array of `Task` structs in memory disappears the moment your app quits. You need something that saves objects to disk, loads them back, and lets you search through thousands of them without reading the whole file into memory.

You could hand-roll this with JSON files, but querying "every incomplete task due this week" out of a JSON blob means loading everything and filtering in Swift — fine for 50 tasks, painful for 50,000. Core Data is Apple's framework for exactly this: an object graph backed by disk storage (usually SQLite under the hood), with real queries.

## The stack: container, context, coordinator

Three objects work together, and understanding what each one does is the foundation for everything else in this lesson.

```swift
let container = NSPersistentContainer(name: "TaskModel")
container.loadPersistentStores { _, error in
    if let error { fatalError("Failed to load store: \(error)") }
}
```

`NSPersistentContainer` is the setup object — point it at a model file name and it wires up the pieces underneath it. Two of those pieces matter for your day-to-day code:

```swift
let context = container.viewContext          // NSManagedObjectContext
let coordinator = container.persistentStoreCoordinator  // NSPersistentStoreCoordinator
```

The **coordinator** is the layer that actually talks to the SQLite file on disk — you rarely touch it directly. The **context** is the one you work with constantly: it's an in-memory scratchpad of objects you're viewing or editing, and nothing you do to it touches disk until you explicitly save.

```swift
let task = Task(context: context)   // exists only in the context so far
task.title = "Buy milk"
try context.save()                  // now it's written to disk
```

That gap between "created in the context" and "saved to disk" is deliberate — it's what lets you make several related edits and commit them together, or throw them all away with `context.rollback()` if something goes wrong.

## Entities and relationships

A Core Data model file (`.xcdatamodeld`) defines **entities** — think of them as the schema for a class, the blueprint that generates a `NSManagedObject` subclass like the `Task` used above. Each entity has attributes:

```swift
// Entity: Task
// Attributes: title (String), isDone (Bool), dueDate (Date?)
```

Entities can also point at each other with **relationships**. Say tasks belong to projects:

```swift
// Entity: Project — attribute: name (String)
// Entity: Task    — relationship: project (to-one Project)
// Entity: Project — relationship: tasks (to-many Task, inverse of Task.project)
```

Every relationship needs its **inverse** set in the model editor — the matching relationship on the other entity. Skip that and Core Data can't keep both sides in sync when you change one; you'd set `task.project = someProject` and `someProject.tasks` would never notice the new member.

With the inverse wired up, both directions just work:

```swift
let project = Project(context: context)
project.name = "Groceries"

let task = Task(context: context)
task.title = "Buy milk"
task.project = project              // sets task.project
// project.tasks now contains task automatically, via the inverse
```

*Delete rules* on a relationship decide what happens to the other side when one object is deleted — `.cascade` deletes the related objects too, `.nullify` just clears the pointer, `.deny` blocks the delete while related objects exist. Deleting a `Project` with `.cascade` on `tasks` deletes every task in it; `.nullify` would leave the tasks behind with `project` set to `nil`.

## Fetch requests and predicates

Reading objects back means building an `NSFetchRequest` and asking a context to run it:

```swift
let request = Task.fetchRequest()
let allTasks = try context.fetch(request)   // [Task]
```

That fetches everything. To filter, attach an `NSPredicate` — a string-based query, closer to SQL's `WHERE` clause than to a Swift closure:

```swift
request.predicate = NSPredicate(format: "isDone == NO")
let incomplete = try context.fetch(request)
```

Predicates compose with `AND`/`OR` and take `%@` as a placeholder for a Swift value, similar to a format string:

```swift
request.predicate = NSPredicate(
    format: "isDone == NO AND dueDate < %@", Date() as NSDate
)
```

Predict: what does this fetch return if `project` has 3 tasks and only one is done?

```swift
request.predicate = NSPredicate(format: "project == %@ AND isDone == YES", project)
```

Answer: exactly the one completed task belonging to that project — the predicate runs as a `WHERE` clause in SQLite, filtering before objects are even loaded into memory.

Add a *sort descriptor* to control ordering, since fetch results otherwise come back in no guaranteed order:

```swift
request.sortDescriptors = [NSSortDescriptor(keyPath: \Task.dueDate, ascending: true)]
```

## NSFetchedResultsController: keeping a list view in sync

A plain fetch gives you a snapshot — if another part of the app inserts a task afterward, your array doesn't know. `NSFetchedResultsController` (often shortened to **FRC**) wraps a fetch request and *watches* the context, telling you exactly what changed so a table or collection view can animate the difference instead of reloading everything.

```swift
let frc = NSFetchedResultsController(
    fetchRequest: request,
    managedObjectContext: context,
    sectionNameKeyPath: nil,
    cacheName: nil
)
frc.delegate = self
try frc.performFetch()
```

The delegate gets called with the specific inserted, deleted, or updated index paths, which is what powers the classic insert/delete row animations in a `UITableView` bound to Core Data. In SwiftUI, `@FetchRequest` does the equivalent job for you under the hood — you rarely construct an `NSFetchedResultsController` by hand in SwiftUI code, but it's the same mechanism.

## Concurrency: one context per thread of work

The context you've used so far — `container.viewContext` — is tied to the main queue. Calling it from a background thread, or running a slow fetch on it, are both common review-flagged mistakes: the first crashes or corrupts state, the second freezes your UI.

For background work, create a separate context instead:

```swift
let bgContext = container.newBackgroundContext()
bgContext.perform {
    let task = Task(context: bgContext)
    task.title = "Imported task"
    try? bgContext.save()
}
```

`perform` (and its throwing/async sibling `perform(schedule:)`) runs the closure on that context's own private queue — you must always route work through it rather than touching a context from an arbitrary thread. Each context sees its own in-memory changes immediately, but only sees *another* context's saved changes after that context calls `save()` and yours refreshes or refetches.

```swift
bgContext.perform {
    // ... make edits, then:
    try? bgContext.save()
}
// viewContext picks up the change automatically because container
// sets automaticallyMergesChangesFromParent = true by default
```

That auto-merge flag is what lets a background import show up in your UI without manual bookkeeping — but it only works because both contexts share the same persistent container.

## Migrations: when the model changes

Ship v2 of your app with a new attribute on `Task`, and every device still has v1's SQLite file on disk. A **migration** is the process of transforming that stored data to match the new model so old data isn't lost.

For additive changes — a new optional attribute, a renamed entity with a mapping — Core Data can usually infer the mapping itself:

```swift
let description = NSPersistentStoreDescription()
description.shouldInferMappingModelAutomatically = true
description.shouldMigrateStoreAutomatically = true
container.persistentStoreDescriptions = [description]
```

This is called a *lightweight migration*, and it covers most day-to-day schema changes: add an attribute, add an entity, make an attribute optional. For structural changes it can't infer — splitting one entity into two, transforming data during the move — you write an explicit **mapping model** that tells Core Data exactly how to convert each old record into the new shape.

## Common pitfalls

- **Touching `viewContext` off the main thread.** It's main-queue-confined; do background work on a `newBackgroundContext()` instead.
- **Forgetting a relationship's inverse.** Without it, setting one side silently fails to update the other.
- **Fetching everything and filtering in Swift.** Push filtering into the `NSPredicate` so SQLite does the work, not your app's memory.
- **Assuming a plain fetch stays live.** A fetched array is a snapshot; use `NSFetchedResultsController`/`@FetchRequest` if you need it to track changes.

## Interview lens

If asked to describe the Core Data stack, name all three pieces and their jobs in one breath: the **persistent store coordinator** talks to disk, the **managed object context** is your in-memory working set, and the **persistent container** wires them together. Emphasize that nothing hits disk until `save()`.

If asked about threading, the answer interviewers are fishing for is "one context per queue of work" — `viewContext` on main, a `newBackgroundContext()` for imports or heavy writes, everything routed through `perform`/`performAndWait`, and changes propagating between contexts via save-and-merge rather than shared mutable state.

If asked to compare a plain fetch to `NSFetchedResultsController`, say a fetch is a one-time snapshot while an FRC (or SwiftUI's `@FetchRequest`) subscribes to the context and reports granular inserts/deletes/updates — that's the mechanism behind animated table view diffs. And if migrations come up, know the split: lightweight migration handles additive, inferable changes automatically; anything structural needs an explicit mapping model.
