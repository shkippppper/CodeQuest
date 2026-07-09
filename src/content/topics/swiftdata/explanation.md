## The problem: Core Data's ceremony, for a simple model

Storing a list of tasks with Core Data means a separate `.xcdatamodeld` file, a generated `NSManagedObject` subclass, and juggling a context object just to read a `title` string. For plenty of apps that's more ceremony than the data deserves.

```swift
import SwiftData

@Model
class Task {
    var title: String
    var isDone: Bool

    init(title: String, isDone: Bool = false) {
        self.title = title
        self.isDone = isDone
    }
}
```

That's the whole schema — an ordinary Swift class with an attached macro. **SwiftData** is Apple's newer persistence framework: it stores objects the same way Core Data does under the hood, but the schema is Swift code instead of a separate model file, and there's no generated subclass to manage.

## @Model: turning a class into a persisted schema

The **`@Model`** macro rewrites the class at compile time so every stored property becomes something SwiftData can save and query — you write plain Swift, and the macro adds the persistence machinery behind the scenes.

```swift
@Model
class Task {
    var title: String
    var isDone: Bool = false
    var dueDate: Date?
}
```

Optional properties, like `dueDate` here, are just optional Swift properties — no special "nullable" flag to set anywhere, unlike Core Data's model editor where optionality is a checkbox on each attribute.

You can still mark a property `@Attribute` for finer control, most commonly to enforce uniqueness:

```swift
@Model
class Task {
    @Attribute(.unique) var id: UUID
    var title: String
}
```

`.unique` tells SwiftData to treat `id` as a constraint — inserting a second `Task` with the same `id` updates the existing row instead of creating a duplicate.

## ModelContainer and ModelContext: the same two jobs, less setup

SwiftData splits work across two objects that map directly onto Core Data's context and container, doing the same two jobs with far less boilerplate to wire up.

```swift
let container = try ModelContainer(for: Task.self)
let context = container.mainContext
```

**`ModelContainer`** sets up the on-disk store for the model types you give it — the equivalent of Core Data's persistent container plus its coordinator, collapsed into one call. **`ModelContext`** is the in-memory working set you actually insert, edit, and query through — the same role `NSManagedObjectContext` played.

```swift
let task = Task(title: "Buy milk")
context.insert(task)
try context.save()
```

Just like Core Data, nothing reaches disk until `save()` runs — `insert` only stages the object in the context. In a SwiftUI app you rarely call any of this by hand: `.modelContainer(for: Task.self)` on your `WindowGroup` creates the container for you and injects a context into the environment.

## Queries: @Query replaces the fetch request

Instead of building an `NSFetchRequest`, a SwiftUI view declares what it wants with the **`@Query`** property wrapper, and SwiftData keeps the result live:

```swift
struct TaskListView: View {
    @Query var tasks: [Task]

    var body: some View {
        List(tasks) { task in Text(task.title) }
    }
}
```

`tasks` isn't a one-time snapshot — insert or delete a `Task` anywhere in the app, and this view updates automatically, the same guarantee `NSFetchedResultsController` gave Core Data's table views, but without constructing a controller or writing a delegate.

Filtering and sorting look like ordinary Swift, using a `#Predicate` macro instead of `NSPredicate`'s format strings:

```swift
@Query(filter: #Predicate<Task> { !$0.isDone },
       sort: \Task.dueDate)
var incompleteTasks: [Task]
```

Predict: what changes if another view inserts a new incomplete task while `TaskListView` is on screen?

Answer: `incompleteTasks` updates on its own and the list re-renders — `@Query` observes the context the same way `@Query`'s Core Data ancestor, `@FetchRequest`, observed its context, just with compile-time-checked Swift predicates instead of string-based ones.

## Relationships

Relating two `@Model` types is a plain Swift property, and SwiftData infers the storage from the type itself:

```swift
@Model
class Project {
    var name: String
    @Relationship(deleteRule: .cascade) var tasks: [Task] = []
}

@Model
class Task {
    var title: String
    var project: Project?
}
```

`deleteRule` works exactly like Core Data's — `.cascade` here means deleting a `Project` deletes every `Task` in its `tasks` array. Where Core Data forced you to configure an explicit *inverse* relationship in the model editor or the two sides would silently drift out of sync, SwiftData infers the inverse automatically from the property types, as long as one side points at the other's type. You still get a two-way link:

```swift
let project = Project(name: "Groceries")
let task = Task(title: "Buy milk")
task.project = project
// project.tasks now contains task — the inverse is inferred, not hand-configured
```

## Migrating from Core Data

If you already have a Core Data store, SwiftData can open the *same* underlying storage, because both frameworks ultimately persist through the same store format. That means an existing app can adopt `@Model` types without forcing every user through a one-time export/import.

For schema evolution once you're on SwiftData, the same two-tier idea from Core Data carries over:

```swift
enum SchemaV1: VersionedSchema {
    static var models: [any PersistentModel.Type] { [Task.self] }
}
enum SchemaV2: VersionedSchema {
    static var models: [any PersistentModel.Type] { [Task.self] }
}

enum TaskMigrationPlan: SchemaMigrationPlan {
    static var schemas: [any VersionedSchema.Type] { [SchemaV1.self, SchemaV2.self] }
    static var stages: [MigrationStage] {
        [.lightweight(fromVersion: SchemaV1.self, toVersion: SchemaV2.self)]
    }
}
```

Additive changes — a new property, a widened optional — go through a `.lightweight` stage, the direct equivalent of Core Data's inferred mapping model. Anything structural — splitting a model, transforming values during the move — needs a `.custom` stage with your own conversion code, playing the same role Core Data's explicit mapping model did.

## SwiftUI integration

The pieces click together at the app's entry point with almost no setup code:

```swift
@main
struct TasksApp: App {
    var body: some Scene {
        WindowGroup {
            TaskListView()
        }
        .modelContainer(for: Task.self)
    }
}
```

That one modifier creates the `ModelContainer`, puts its `ModelContext` into the environment, and every `@Query` and `@Environment(\.modelContext)` in the view tree downstream picks it up automatically — no `AppDelegate` boilerplate, no manually passing a context through initializers.

```swift
struct AddTaskButton: View {
    @Environment(\.modelContext) private var context

    var body: some View {
        Button("Add") {
            context.insert(Task(title: "New task"))
        }
    }
}
```

## Common pitfalls

- **Forgetting `try container.save()` isn't automatic.** `insert` stages an object in the context; SwiftUI's autosave (on by default) usually covers you, but explicit background writes still need an explicit `save()`.
- **Assuming `@Query` needs manual refresh.** It's a live subscription, like Core Data's `@FetchRequest` — re-fetching by hand defeats the point.
- **Expecting `@Relationship` inverses to need manual wiring.** Unlike Core Data's model editor, SwiftData infers the inverse from the property types — you don't configure it separately.
- **Skipping a migration plan for structural changes.** Additive changes are usually painless, but renaming/splitting models still needs an explicit `.custom` migration stage.

## Interview lens

If asked "what is SwiftData," the strong framing is: it's a Swift-native wrapper over the same underlying persistence model Core Data uses, replacing the separate model file and generated subclasses with a `@Model` macro on plain Swift classes — less ceremony, same guarantees (context/save semantics, live query updates, delete rules).

If asked to compare it to Core Data directly, map the vocabulary one-to-one: `ModelContainer`/`ModelContext` mirror the persistent container/managed object context, `@Query` mirrors `NSFetchedResultsController`/`@FetchRequest`, `#Predicate` mirrors `NSPredicate`, and `.lightweight`/`.custom` migration stages mirror inferred vs explicit mapping models. The one genuine difference worth calling out: SwiftData infers relationship inverses automatically, where Core Data required configuring them by hand — a real reduction in a classic source of bugs.

If asked when you'd still reach for Core Data over SwiftData, mention needing `NSFetchedResultsController`-level UIKit integration, complex custom migrations Apple's newer APIs don't yet cover as flexibly, or supporting OS versions older than SwiftData's minimum deployment target.
