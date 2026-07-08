## The crash that made Apple redesign the API

Delete one item from your model, then tell the collection view exactly what you did:

```swift
items.remove(at: 3)
collectionView.deleteItems(at: [IndexPath(item: 3, section: 0)])
```

This is the old contract. You change your data, then you describe the precise insert/delete/move deltas to the view.

Get the description slightly wrong — one forgotten insert, one stale count — and the app dies at runtime:

```
Invalid number of items in section 0. The number of items after the update (9)
must be equal to the number of items before the update (10), plus or minus
the number of items inserted or deleted.
```

`performBatchUpdates` animates nicely, but *you* do the delta math and the framework only checks your work. This exactness requirement made manual batch updates a famous source of production crashes.

## The blunt alternative: reload everything

There has always been an escape hatch:

```swift
collectionView.reloadData()
```

No crash — but it throws away the entire view and rebuilds it. No animation, selection and scroll subtleties get lost.

Worse, because `reloadData` never verifies anything, it quietly *masks* the same model inconsistencies that would have crashed batch updates. The bug is still there; you just stopped hearing about it.

So before iOS 13 the choice was: safe but ugly, or animated but crash-prone. On the layout side there was a matching pain — `UICollectionViewFlowLayout` handles uniform grids fine but fights you on anything fancier.

iOS 13 shipped two APIs that replace both halves: **diffable data sources** for updates, and **compositional layout** for layout. This lesson walks through each.

## Describe the state, not the changes

Here is the entire new update model:

```swift
var snapshot = NSDiffableDataSourceSnapshot<Section, Item>()
snapshot.appendSections([.main])
snapshot.appendItems(currentItems, toSection: .main)
dataSource.apply(snapshot, animatingDifferences: true)
```

Read it as a sentence: "here is what the list should look like *now*." A **snapshot** is a plain value describing the desired end state — which sections exist, which items, in what order.

You never say "delete row 3". You hand over the new truth, and `apply` *diffs* it — compares the new snapshot against the previous one and computes the inserts, deletes, and moves itself.

The delta math you used to hand-write is now the framework's job. A count-mismatch crash is impossible, because you never state counts or index paths at all.

### Set up the data source once

Before applying snapshots, you create the data source with a **cell provider** — a closure that plays the role `cellForItemAt` used to:

```swift
dataSource = UICollectionViewDiffableDataSource<Section, Item>(
    collectionView: collectionView
) { collectionView, indexPath, item in
    // dequeue a cell and configure it for `item`
}
```

You write this once. From then on, every update in the app is "build snapshot, apply" — there is no other update path, no `insertItems`, no `deleteItems`.

## Identifiers are the whole game

Look again at the generic parameters: `NSDiffableDataSourceSnapshot<Section, Item>`. Both types must conform to `Hashable`, because the snapshot doesn't store your rows — it stores **identifiers** for them.

The diff is computed by comparing identifier sets and their order. That leads to two rules people learn the hard way.

### Rule one: identifiers must be unique and stable

```swift
snapshot.appendItems([itemA, itemA])   // crash — duplicate identifier
```

The same identifier appearing twice in one snapshot is a crash, full stop.

Stability matters too. If an item's identifier changes between snapshots, the diff reads it as "old item deleted, new item inserted" — not as the same row.

### Rule two: the diff sees identity, not content

Time to predict. Your `Item` is identified by its `id`. You change one item's `title`, keep its `id` the same, build a fresh snapshot, and apply it. What happens on screen?

Answer: *nothing changes.* The diff compares identifiers, and every identifier is the same as before — so it reports "no changes" and never touches the visible cell.

The fix is to tell the snapshot explicitly which items need re-rendering:

```swift
snapshot.reconfigureItems([changedItem])   // iOS 15+: update the existing cell in place
snapshot.reloadItems([changedItem])        // older: replace the cell entirely
```

`reconfigureItems` re-runs your cell provider for the cell that's already on screen — cheaper than `reloadItems`, which swaps in a fresh cell.

### Which identifier should you use?

Use the model's stable `id`, not the whole struct:

```swift
snapshot.appendItems(items.map(\.id), toSection: .main)
```

If the whole struct is the identifier, then editing *any* field changes the hash — and the diff sees a delete plus an insert. Your edited row flickers out and back instead of updating in place.

## Build layouts from small pieces

Now the layout half. With **compositional layout** you don't subclass `UICollectionViewLayout` — you compose a hierarchy of small descriptions. Start with one:

```swift
let itemSize = NSCollectionLayoutSize(
    widthDimension: .fractionalWidth(0.5),
    heightDimension: .absolute(100))
let item = NSCollectionLayoutItem(layoutSize: itemSize)
```

An *item* describes one cell's size. This one is half its container's width and 100 points tall.

Items go into a group:

```swift
let groupSize = NSCollectionLayoutSize(
    widthDimension: .fractionalWidth(1.0),
    heightDimension: .absolute(100))
let group = NSCollectionLayoutGroup.horizontal(layoutSize: groupSize,
                                               subitems: [item])
```

A *group* is a row or column of items. This group is full-width and lays items out horizontally — so two half-width items fill each row.

Groups go into a section, and the section into the layout:

```swift
let section = NSCollectionLayoutSection(group: group)
let layout = UICollectionViewCompositionalLayout(section: section)
```

That's a two-column grid in about eight lines. The whole mental model is one chain: item → group → section → layout, each level a small value you configure.

Sections can also carry supplementary items — headers, footers, badges — attached declaratively, with no layout subclassing for a sticky header.

### A different layout for every section

The layout initializer also accepts a closure that returns a section layout per section index:

```swift
let layout = UICollectionViewCompositionalLayout { sectionIndex, environment in
    sectionIndex == 0 ? makeCarouselSection() : makeGridSection()
}
```

This is how magazine-style screens are built: a carousel up top, a grid below, each section described independently.

The carousel itself needs exactly one extra line:

```swift
carouselSection.orthogonalScrollingBehavior = .continuous
```

The section now scrolls *horizontally* inside the vertically scrolling collection view. Before this API, that effect required nesting a collection view inside a cell.

## Animation and threading

Set `animatingDifferences: true` and the computed diff animates for free — inserts slide in, deletes fade out, moves reposition. You write zero animation code.

Two threading rules keep it safe:

```swift
DispatchQueue.global().async {
    let snapshot = buildSnapshot()          // fine — a snapshot is a cheap value
    DispatchQueue.main.async {
        dataSource.apply(snapshot, animatingDifferences: true)   // apply on main
    }
}
```

Build snapshots wherever you like; apply them on the *main thread*.

And remember the identity rule from earlier: when only an item's *content* changed, use `reconfigureItems` instead of rebuilding membership — the visible cell updates without a full re-diff.

## Common pitfalls

- **Duplicate identifiers in one snapshot.** Instant crash. Identifiers must be unique.
- **A cell that doesn't update after you edit the model.** The diff is identity-based; the identity didn't change. Call `reconfigureItems` (or `reloadItems`).
- **Rows flicker out and back on every edit.** You used the whole struct as the identifier, so edits hash differently and read as delete + insert. Use a stable `id`.
- **Applying a snapshot off the main thread.** Build anywhere; apply on main.

## Interview lens

If asked why diffable data sources exist, lead with the phrase "describe state, not changes." You build a snapshot of the desired end state and apply it, and the framework computes and animates the diff — versus `reloadData`, which has no animation, and manual `performBatchUpdates`, which crashes whenever your hand-computed deltas don't match your counts.

Expect the identifier follow-up. Say that identifiers must be `Hashable`, unique, and stable — duplicates crash — and that diffing compares identity, not content. That sets up the classic gotcha: "my cell didn't update" means the identity didn't change, and the fix is `reconfigureItems`. Add that you use a model's stable `id` rather than the whole struct, so edits don't turn into delete + insert.

For compositional layout, recite the hierarchy — item, group, section, layout — and give one concrete win: per-section layouts and orthogonally scrolling carousels without subclassing `UICollectionViewLayout`. Close by noting both APIs arrived in iOS 13 and are the modern default over flow layout plus manual batch updates.
