## The problem: showing thousands of rows on a phone

A list might have 10,000 items, but the screen shows ~12. Creating 10,000 cell views would exhaust memory and stutter. `UITableView` and `UICollectionView` solve this with two ideas: a **data source** that supplies content on demand, and **cell reuse** that recycles a small pool of cells as you scroll. Table view = single-column lists; collection view = arbitrary layouts (grids, custom); the concepts are nearly identical.

## Data source & delegate

Two protocols split the responsibilities:

- **Data source** (`UITableViewDataSource`) — supplies the **content**: how many sections/rows, and the cell for each index path.
- **Delegate** (`UITableViewDelegate`) — handles **behavior/appearance**: selection, heights, swipe actions, will-display, etc.

```swift
func tableView(_ t: UITableView, numberOfRowsInSection s: Int) -> Int { items.count }

func tableView(_ t: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = t.dequeueReusableCell(withIdentifier: "Cell", for: indexPath) as! MyCell
    cell.configure(with: items[indexPath.row])
    return cell
}
```

The data source is called **lazily** — only for index paths about to be shown.

## Cell reuse

The heart of performance: cells scrolling off screen go into a **reuse pool** and are handed back for new content via **`dequeueReusableCell(withIdentifier:for:)`**. You register a cell class/nib for an identifier once; dequeue returns a recycled instance (or a fresh one if the pool is empty).

The classic reuse bug: **not fully re-configuring a dequeued cell.** Because cells are recycled, any state you set on one row persists into another unless you reset it. Implement **`prepareForReuse()`** to clear per-cell state (cancel image loads, reset labels), and always set *every* visible property in `cellForRowAt` — never assume a dequeued cell is blank.

## Heights & sizing

- **Fixed height**: set `rowHeight` — fastest.
- **Self-sizing** (dynamic, content-driven): set `rowHeight = .automatic` and provide an `estimatedRowHeight`; with proper Auto Layout constraints in the cell, the table sizes each row to its content.
- The **estimated** height lets the table compute its scroll indicator/content size without measuring every row up front — important for large lists.

Collection views size cells via a **layout** object (`UICollectionViewFlowLayout` or a custom/compositional layout) rather than a row height.

## Sections & supplementary views

Both support **sections** (grouping rows/items). Table views add section headers/footers; collection views generalize this to **supplementary views** (headers, footers, badges) positioned by the layout. `IndexPath` carries both `section` and `row`/`item`, and your data source answers per-section counts.

## Selection & editing

The **delegate** handles selection (`didSelectRowAt`), and tables support **editing** mode for insert/delete/move with swipe actions (`trailingSwipeActionsConfigurationForRowAt`) and reordering. When the user deletes a row, you must update **both** your model **and** the table (`deleteRows(at:with:)`) so they stay in sync — mismatches crash with "invalid number of rows."

## Performance

Smooth scrolling depends on keeping `cellForRowAt` cheap:

- **Reuse cells** (never build a cell per row) and **reset state** in `prepareForReuse`.
- **Do heavy work off the main thread** — decode/downsample images in the background, cache results, and cancel in-flight loads when a cell is reused (avoid the wrong image flashing in).
- Avoid expensive layout/measurement per row; use estimated heights.
- Prefer **diffable data sources** (own topic) for safe, animated updates over manual `reloadData`.

## The interview lens

Explain the split: **data source** provides content (counts + `cellForRowAt`), **delegate** handles behavior (selection, heights, swipes). The must-know mechanism is **cell reuse** via `dequeueReusableCell` — a small pool is recycled — and its trademark bug: **cells must be fully re-configured** because they carry over prior state, so reset in **`prepareForReuse()`** and set all properties in `cellForRowAt`.

Senior points: **self-sizing cells** need `estimatedRowHeight` + Auto Layout; **editing/deletion must update model and view together** or you crash; and for **performance**, keep `cellForRowAt` cheap and move image decoding off-main + **cancel loads on reuse** (the "wrong image flashes into a recycled cell" bug). Note collection views generalize this with a **layout object** and **supplementary views**, and that **diffable data sources** are the modern way to apply updates.
