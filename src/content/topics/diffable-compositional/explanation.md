## The problem: batch updates and layout that don't scale

Classic `reloadData()` throws away everything and rebuilds — no animation, and it hides bugs. The alternative, manual `performBatchUpdates` with `insertRows`/`deleteRows`, is notoriously crash-prone: if your before/after counts don't exactly match the deltas you describe, the app throws "invalid number of rows." Meanwhile, `UICollectionViewFlowLayout` struggles with anything beyond a uniform grid. iOS 13 introduced two APIs that fix both: **diffable data sources** (describe *state*, not *changes*) and **compositional layout** (compose complex layouts from small pieces).

## The reload-vs-diff problem

- **`reloadData()`** — simple but nukes the whole view: no animation, loses scroll/selection nuance, and masks inconsistencies.
- **Manual batch updates** — animate, but you must hand-compute inserts/deletes/moves and keep them **perfectly consistent** with your model counts, or you crash. This is error-prone and a common source of production bugs.

Diffable data sources let you skip the delta math entirely.

## `NSDiffableDataSourceSnapshot`

The new model: you never describe *changes*. You build a **snapshot** — a value describing the **current desired state** (which sections, which items, in order) — and **apply** it. The framework **diffs** the new snapshot against the old and performs the correct inserts/deletes/moves for you.

```swift
var snapshot = NSDiffableDataSourceSnapshot<Section, Item>()
snapshot.appendSections([.main])
snapshot.appendItems(currentItems, toSection: .main)
dataSource.apply(snapshot, animatingDifferences: true)   // framework computes the diff
```

You register a **cell provider** closure once (like `cellForRowAt`), and thereafter you just apply snapshots. No more `insertRows`/`deleteRows`, no more count-mismatch crashes.

## Section & item identifiers

The critical requirement: sections and items are identified by **`Hashable` identifiers**, not by index. The snapshot stores **identifiers**, and the diff is computed by comparing identifier sets and order.

Two rules that trip people up:
- **Identifiers must be unique and stable.** Duplicate identifiers in a snapshot **crash**.
- **Diffing is by identity, not content.** If an item's *identity* stays the same but its *content* changes, the diff sees "no change" and won't refresh that cell — use `reconfigureItems(_:)` (or `reloadItems`) to update the visible cell. Prefer identifiers that are stable ids (a model's `id`), not the whole struct, so edits don't count as delete+insert.

## Compositional layout

**`UICollectionViewCompositionalLayout`** builds a layout by composing a hierarchy: **items** go into **groups** (horizontal/vertical), groups into **sections**, sections into the layout.

```swift
let item = NSCollectionLayoutItem(layoutSize: ...)
let group = NSCollectionLayoutGroup.horizontal(layoutSize: ..., subitems: [item])
let section = NSCollectionLayoutSection(group: group)
let layout = UICollectionViewCompositionalLayout(section: section)
```

This expresses grids, orthogonally-scrolling carousels, mixed layouts per section, and supplementary items far more easily than subclassing `UICollectionViewLayout`. You can even return a **different section layout per section index** for magazine-style screens.

## Animating updates

`apply(_:animatingDifferences:)` animates the computed diff automatically — inserts fade/slide in, deletes out, moves reposition — with no manual animation code. Apply snapshots on the **main thread**; you can build them on a background thread and apply on main. For a change that only affects content (not membership), use `reconfigureItems` so cells update without a full re-diff.

## The interview lens

Frame it as **describe state, not changes**: instead of `reloadData` (no animation) or crash-prone manual `performBatchUpdates`, you build an **`NSDiffableDataSourceSnapshot`** of the desired state and **`apply`** it — the framework **diffs and animates** the inserts/deletes/moves for you. Sections/items are keyed by **`Hashable` identifiers** (unique + stable; **duplicates crash**), and the diff is **identity-based**, so a content-only change needs **`reconfigureItems`** (the "my cell didn't update" gotcha) — and you should use stable **ids** as identifiers so edits aren't seen as delete+insert.

Pair it with **compositional layout**: compose **item → group → section → layout**, enabling per-section layouts, carousels, and grids without subclassing `UICollectionViewLayout`. Bonus: apply snapshots on the **main thread**; both APIs (iOS 13+) are the modern default over flow layout + manual batch updates.
