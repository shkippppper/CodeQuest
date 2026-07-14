import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sd-model-what",
    type: "mcq",
    prompt: "What does the `@Model` macro do to a Swift class?",
    options: [
      "Rewrites it at compile time so its stored properties can be saved and queried by SwiftData, without a separate model file",
      "Turns it into a struct for value semantics, removing reference-type behavior and making instances safe to pass across threads",
      "Generates a UIKit view controller wired to the class so it can be presented and bound to the model's data automatically",
      "Makes every property @Published automatically, so any SwiftUI view holding the object will re-render when a property changes",
    ],
    answer: 0,
    explanation:
      "`@Model` is a macro that adds SwiftData's persistence machinery to an ordinary Swift class — no separate `.xcdatamodeld` file and no generated `NSManagedObject` subclass like Core Data requires.",
  },
  {
    id: "sd-container-context",
    type: "mcq",
    prompt: "Which pairing correctly matches SwiftData's objects to their Core Data equivalents?",
    options: [
      "ModelContainer ≈ persistent container + coordinator; ModelContext ≈ NSManagedObjectContext",
      "ModelContainer ≈ NSManagedObjectContext because it holds the active objects; ModelContext ≈ NSFetchRequest because it describes queries",
      "ModelContext is only used for reading, never for inserting objects, so all writes must go through the ModelContainer directly",
      "ModelContainer is the SwiftUI view modifier that automatically displays your @Model objects in a list without any additional code",
    ],
    answer: 0,
    explanation:
      "`ModelContainer` sets up the on-disk store (playing the role of Core Data's persistent container and coordinator together), while `ModelContext` is the in-memory working set you insert, edit, and query through — the same role `NSManagedObjectContext` played.",
  },
  {
    id: "sd-save-predict",
    type: "predict",
    prompt: "What's true immediately after this line runs, before `context.save()` is called?",
    code: `let task = Task(title: "Buy milk")
context.insert(task)`,
    options: [
      "The task exists only in the in-memory context; it hasn't been written to disk yet",
      "The task is already persisted to disk, because SwiftData automatically flushes every insert synchronously to avoid data loss",
      "insert() throws unless save() is called in the same expression, since the two must be atomic to satisfy the context's write invariants",
      "The task is discarded because no @Query is observing it, and SwiftData only retains inserted objects that have an active subscriber",
    ],
    answer: 0,
    explanation:
      "Just like Core Data, `insert` only stages the object in the context. Nothing reaches disk until `save()` runs (though SwiftUI's autosave often does this for you automatically).",
  },
  {
    id: "sd-query-fill",
    type: "fill",
    prompt: "A view property declared with `@___ var tasks: [Task]` stays live — SwiftData updates it automatically when matching objects are inserted or deleted elsewhere in the app.",
    answers: ["Query"],
    hint: "The SwiftUI property wrapper that replaces NSFetchRequest.",
    explanation:
      "`@Query` is a live subscription into the model context, playing the role `NSFetchedResultsController`/`@FetchRequest` played for Core Data — no manual re-fetching needed.",
  },
  {
    id: "sd-relationship-inverse",
    type: "mcq",
    prompt: "How does SwiftData handle the inverse side of a relationship, compared to Core Data?",
    options: [
      "SwiftData infers the inverse automatically from the property types; Core Data required configuring it explicitly in the model editor",
      "SwiftData requires manual inverse configuration just like Core Data did, using a dedicated @Relationship(inverse:) parameter on both ends",
      "Neither framework supports two-way relationships; you must maintain referential integrity manually with post-save hooks",
      "Inverses are irrelevant in both frameworks unless using CloudKit, which requires bidirectional links to replicate correctly across devices",
    ],
    answer: 0,
    explanation:
      "This is one of the concrete simplifications SwiftData makes: it infers the relationship inverse from the property types, removing a classic Core Data footgun where a forgotten inverse silently left one side out of sync.",
  },
  {
    id: "sd-truths-multi",
    type: "multi",
    prompt: "Select all statements that are true of SwiftData.",
    options: [
      "@Model classes are ordinary Swift classes with a macro attached, not a generated subclass from a separate model file",
      "#Predicate is SwiftData's type-checked equivalent of NSPredicate's string-based format",
      "SwiftData persists through a completely different storage format than Core Data, incompatible with it",
      "@Relationship supports a deleteRule the same way Core Data relationships do",
    ],
    answers: [0, 1, 3],
    explanation:
      "SwiftData ultimately persists through the same underlying store format Core Data uses (option 2 is false) — which is exactly what allows an existing Core Data-backed app to adopt `@Model` types without a full export/import.",
  },
  {
    id: "sd-scene-modifier",
    type: "fill",
    prompt: "Attaching `.model___(for: Task.self)` to a WindowGroup creates the ModelContainer and injects its context into the SwiftUI environment automatically.",
    answers: ["Container", ".modelContainer"],
    hint: "The scene modifier name; the blank completes `.model___`.",
    explanation:
      "`.modelContainer(for:)` on a `Scene` sets up the container and puts a `ModelContext` into the environment, so `@Query` and `@Environment(\\.modelContext)` work anywhere below it in the view tree.",
  },
  {
    id: "sd-migration-senior",
    type: "mcq",
    prompt: "You need to split one @Model class into two and move some data across during the change. What migration approach is required?",
    options: [
      "A .custom migration stage in a SchemaMigrationPlan, since this structural change can't be inferred",
      "Nothing — .lightweight stages handle any schema change automatically, including splitting models and moving properties between them",
      "Manually deleting the ModelContainer's store on every app launch and rebuilding it from a remote JSON backup fetched at startup",
      "SwiftData has no migration support whatsoever; you must export the entire store to JSON, delete it, and reimport into the new schema",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "SwiftData's `.lightweight` migration stage is the direct equivalent of Core Data's inferred mapping model — it only covers additive/inferable changes. Structural changes, like splitting a model, need an explicit `.custom` stage, mirroring Core Data's explicit mapping model.",
  },
  {
    id: "sd-corebridge-senior",
    type: "predict",
    prompt: "🧠 A shipping app already stores its data with Core Data. The team wants to adopt @Model types for new screens without forcing a data migration on launch. Is this possible, and why?",
    code: `// existing Core Data .sqlite store on disk
// team wants to add @Model types reading/writing the same data`,
    options: [
      "Yes — SwiftData can open the same underlying store format Core Data uses, so existing data doesn't need a one-time export/import",
      "No — SwiftData and Core Data use fundamentally incompatible storage formats, making a full re-import unavoidable even on the same device",
      "Yes, but only if the app deletes all existing user data first and lets SwiftData recreate the store from scratch using @Model types",
      "No — SwiftData only works with brand-new, empty stores created at first launch; opening a pre-existing SQLite file always fails with an error",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Because SwiftData persists through the same store format Core Data does, an app can introduce `@Model` types against existing data without a forced export/import step — a key reason SwiftData is viable for incremental adoption rather than only greenfield apps.",
  },
  {
    id: "sd-flashcard",
    type: "flashcard",
    prompt:
      "Explain SwiftData's core pieces and how each maps to Core Data's equivalent. Answer aloud, then reveal.",
    modelAnswer:
      "SwiftData replaces Core Data's separate model file and generated `NSManagedObject` subclasses with the **`@Model`** macro on plain Swift classes — same underlying store format, far less ceremony. **`ModelContainer`** sets up the on-disk store (the combined role of Core Data's persistent container and coordinator); **`ModelContext`** is the in-memory working set you `insert` objects into and must `save()` to persist, exactly mirroring `NSManagedObjectContext`'s save semantics. **`@Query`** replaces `NSFetchRequest`/`NSFetchedResultsController` with a live SwiftUI property that updates automatically as matching objects change, using `#Predicate` (type-checked Swift) instead of `NSPredicate`'s string format. `@Relationship(deleteRule:)` mirrors Core Data's delete rules, but SwiftData infers the relationship's inverse automatically from the property types — Core Data required configuring that by hand, a classic source of bugs when forgotten. For schema evolution, `.lightweight` migration stages mirror Core Data's inferred mapping model (additive changes), while `.custom` stages mirror Core Data's explicit mapping model (structural changes). Because both frameworks share the same underlying store format, an existing Core Data app can adopt `@Model` types incrementally without a forced data export/import.",
    keyPoints: [
      "@Model = macro over a plain class, no separate model file or generated subclass",
      "ModelContainer/ModelContext mirror persistent container+coordinator / managed object context",
      "@Query + #Predicate mirror NSFetchedResultsController/@FetchRequest + NSPredicate",
      "Relationship inverses are inferred automatically, unlike Core Data",
      ".lightweight vs .custom migration stages mirror inferred vs explicit mapping models",
      "Same underlying store format as Core Data enables incremental adoption",
    ],
    explanation:
      "A senior answer draws the direct Core Data mapping for every SwiftData piece and calls out the two genuine differences: automatic inverse inference and shared store-format compatibility for incremental migration.",
  },
];

export default quiz;
