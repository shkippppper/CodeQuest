import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "diffable-describe-state",
    type: "mcq",
    prompt: "How do you update a diffable data source?",
    options: [
      "Build a snapshot of the desired state and `apply` it; the framework diffs and animates the changes",
      "Call insertRows/deleteRows with the exact deltas that match the before/after model counts precisely",
      "Always call reloadData() so the collection view discards its current state and rebuilds every cell from scratch",
      "Mutate the visible cells directly through cellForItemAt and update the model afterward",
    ],
    answer: 0,
    explanation:
      "You describe *state*, not *changes*: construct an `NSDiffableDataSourceSnapshot` and `apply` it. The framework computes the inserts/deletes/moves — no manual delta math, no count-mismatch crashes.",
  },
  {
    id: "snapshot-identifiers",
    type: "mcq",
    prompt: "What does a diffable snapshot store to identify sections and items?",
    options: [
      "Hashable identifiers (unique and stable), not indices",
      "The integer index paths of each section and item at the moment the snapshot is constructed",
      "The live cell instances from the currently visible collection view, captured by reference",
      "The raw view frame rectangles computed by the layout at snapshot creation time",
    ],
    answer: 0,
    explanation:
      "Snapshots hold `Hashable` **identifiers** for sections/items; the diff compares identifier sets and order. Identifiers must be unique and stable — duplicates crash.",
  },
  {
    id: "duplicate-id-crash",
    type: "predict",
    prompt: "🧠 Trick question — you append two items with the same identifier to a snapshot. What happens?",
    code: `snapshot.appendItems([item, item])   // same identifier twice`,
    options: [
      "It crashes — diffable snapshots require unique identifiers",
      "The duplicate is silently ignored, and only the first occurrence of the identifier is retained in the snapshot",
      "Both items render fine in the collection view, displaying side by side with the same identifier",
      "The snapshot merges both items into a single cell that displays the combined content of the two duplicates",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Diffable data sources require **unique** identifiers within a snapshot. Appending a duplicate is a fatal error at apply time. Ensure your identifier (often a model `id`) is genuinely unique.",
  },
  {
    id: "content-change-reconfigure",
    type: "predict",
    prompt: "🧠 Trick question — an item's identity is unchanged but its content changed. Why doesn't applying a new snapshot update the cell?",
    code: `// same item id, new title; apply(snapshot) shows the OLD title`,
    options: [
      "Diffing is by identity, not content — same id means 'no change', so use reconfigureItems/reloadItems",
      "Diffable data source snapshots never update the content of existing cells under any circumstances",
      "You must discard the data source and call reloadData on the collection view to force the cell to reflect new content",
      "The visible cell is broken and must be removed from the collection view before re-inserting it with the corrected content",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The diff compares **identifiers**, not content. If the id is the same, the framework sees no change and won't refresh the cell. Call `reconfigureItems(_:)` (or `reloadItems`) to update the visible cell for a content-only change. This is why you use stable ids, not whole structs, as identifiers.",
  },
  {
    id: "compositional-hierarchy-fill",
    type: "fill",
    prompt: "Compositional layout composes a hierarchy: items → ___ → sections → layout.",
    answers: ["groups", "group"],
    hint: "Items are placed into these (horizontal/vertical).",
    explanation:
      "`NSCollectionLayoutItem`s go into `NSCollectionLayoutGroup`s (horizontal/vertical), groups into `NSCollectionLayoutSection`s, and sections into the `UICollectionViewCompositionalLayout`.",
  },
  {
    id: "diffable-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements.",
    options: [
      "`apply(_:animatingDifferences:)` animates the computed diff automatically",
      "Compositional layout can use a different layout per section",
      "Diffable snapshots identify items by index path",
      "Diffable data sources remove the manual insertRows/deleteRows delta math",
    ],
    answers: [0, 1, 3],
    explanation:
      "Automatic animated diffs, per-section compositional layouts, and eliminating manual deltas are correct. Snapshots identify by **Hashable identifier**, not index path (option 3 is false).",
  },
  {
    id: "reload-vs-batch-senior",
    type: "mcq",
    prompt: "What problem with manual `performBatchUpdates` do diffable data sources solve?",
    options: [
      "The crash-prone requirement that your described deltas exactly match before/after model counts",
      "That performBatchUpdates cannot animate insertions and deletions; all changes appear instantly without transition",
      "That UICollectionView with performBatchUpdates cannot have more than one section at a time",
      "That cells dequeued inside performBatchUpdates cannot be reused from the reuse pool during the update",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Manual batch updates crash ('invalid number of items') if your inserts/deletes/moves don't perfectly reconcile with the model counts. Diffable computes the exact diff from your snapshot, so that class of crash disappears.",
  },
  {
    id: "compositional-benefit-senior",
    type: "mcq",
    prompt: "What can compositional layout express easily that UICollectionViewFlowLayout struggles with?",
    options: [
      "Complex, per-section layouts like orthogonally-scrolling carousels and mixed grids without subclassing UICollectionViewLayout",
      "Only uniform grids where every item shares the same fixed size and inter-item spacing throughout the collection",
      "Single-column list layouts only, since FlowLayout already handles all multi-column and grid use cases without any extension",
      "Nothing meaningfully beyond what UICollectionViewFlowLayout already provides; compositional layout is just a more verbose way to express the same constraints",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Compositional layout composes items/groups/sections declaratively, enabling magazine-style screens: a carousel section, a grid section, a list section — each different — plus orthogonal scrolling and supplementary items, all without a custom layout subclass.",
  },
  {
    id: "apply-threading-senior",
    type: "mcq",
    prompt: "Where should you apply a diffable snapshot?",
    options: [
      "On the main thread (you may build it in the background and apply on main)",
      "Always on a dedicated background thread, since applying a snapshot on the main thread blocks the UI during the diff computation",
      "Only from viewDidLoad, because applying a snapshot after the view has appeared causes the collection view to reset its scroll position",
      "Inside cellForItemAt, so each cell can pull its own section of the snapshot during the dequeue cycle",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Snapshots are applied on the **main thread** (they update UI). You can construct the snapshot off the main thread and then hop to main to `apply` it — useful for large data sets.",
  },
  {
    id: "diffable-flashcard",
    type: "flashcard",
    prompt:
      "Explain diffable data sources and compositional layout, with the identity gotchas. Answer aloud, then reveal.",
    modelAnswer:
      "**Diffable data sources** replace `reloadData` (no animation) and crash-prone manual `performBatchUpdates` (deltas must exactly match model counts) with a **describe-state** model: build an **`NSDiffableDataSourceSnapshot`** of the desired sections/items and **`apply`** it; the framework **diffs** against the previous snapshot and performs (and animates) the inserts/deletes/moves. You register a cell provider once. Sections/items are keyed by **`Hashable` identifiers** that must be **unique** (duplicates **crash**) and **stable** — and the diff is **identity-based, not content-based**, so a content-only change on the same id won't refresh the cell (use **`reconfigureItems`**); use stable ids (a model `id`), not whole structs, so edits aren't treated as delete+insert. Apply on the **main thread** (build off-main if large). Pair it with **`UICollectionViewCompositionalLayout`**, which composes **item → group → section → layout**, enabling per-section layouts, carousels, and grids without subclassing `UICollectionViewLayout`. Both are iOS 13+ and the modern default.",
    keyPoints: [
      "Snapshot describes state; apply → framework diffs & animates",
      "Identifiers are Hashable, unique (dup = crash), stable",
      "Diff is by identity, not content → reconfigureItems for content changes",
      "Eliminates manual insert/delete delta crashes",
      "Compositional layout: item→group→section→layout; per-section layouts",
    ],
    explanation:
      "Senior answers stress describe-state-not-changes, the unique/stable identifier rules, the identity-vs-content reconfigure gotcha, and compositional layout's composition hierarchy.",
  },
];

export default quiz;
