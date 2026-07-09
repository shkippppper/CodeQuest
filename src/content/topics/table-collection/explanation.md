## The problem: ten thousand rows, twelve visible

Say your model has ten thousand items:

```swift
let items = loadSongs()   // 10,000 songs
```

The naive plan — create a view for each item and stack them — means building ten thousand views, with all their labels and images, for a screen that shows about twelve at a time. Memory balloons, scrolling stutters, launch crawls.

`UITableView` and `UICollectionView` exist to make this exact situation cheap. They do it with two ideas: ask for content *only when it's about to appear*, and recycle a small pool of cell views forever instead of creating new ones. A table view gives you single-column lists; a collection view generalizes to grids and arbitrary layouts — but the two ideas underneath are the same for both, so this lesson mostly speaks table and notes where collections differ.

## The table asks; you answer

You never hand a table view your array. Instead, the table asks *you* questions through a protocol, and you answer:

```swift
func tableView(_ t: UITableView, numberOfRowsInSection s: Int) -> Int {
    items.count       // question 1: "how many rows?"
}
```

The object that answers content questions is the table's **data source** — the `UITableViewDataSource` protocol. Its second, central question is "give me the cell for this position":

```swift
func tableView(_ t: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = t.dequeueReusableCell(withIdentifier: "Cell", for: indexPath) as! SongCell
    cell.configure(with: items[indexPath.row])
    return cell
}
```

The crucial property of this design: the table calls `cellForRowAt` *lazily* — only for rows about to scroll into view. With 10,000 items, it asks for maybe fifteen cells, then a few more as you scroll. It never asks about row 9,000 until you're nearly there.

Content is only half the job. Behavior — taps, heights, swipes — goes through a second protocol, the **delegate** (`UITableViewDelegate`):

```swift
func tableView(_ t: UITableView, didSelectRowAt indexPath: IndexPath) {
    play(items[indexPath.row])   // the user tapped a row
}
```

The split to remember: data source supplies *what to show* (counts, cells); delegate handles *how it behaves* (selection, heights, swipe actions, will-display notifications).

## Cell reuse: the recycling machine

Look again at the odd word in `cellForRowAt`: *dequeue*, not *create*.

```swift
t.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
```

Here's what it does. When a cell scrolls off the top of the screen, the table doesn't destroy it — it drops it into a *reuse pool*, a small bucket of idle cells. When a new row is about to appear at the bottom, `dequeueReusableCell` grabs a cell out of that pool and hands it to you to fill with the new row's content. Only if the pool is empty does it create a fresh cell.

You wire this up once, by registering a cell class under an identifier:

```swift
tableView.register(SongCell.self, forCellReuseIdentifier: "Cell")
```

The result: a 10,000-row table creates roughly *screen-height-worth* of cells — a dozen or two — and recycles them for the entire scroll. That's the whole performance trick.

### The bug that reuse guarantees

Reuse has a trademark bug, and it's worth feeling it once. Say your cell shows a checkmark for downloaded songs:

```swift
func tableView(_ t: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = t.dequeueReusableCell(withIdentifier: "Cell", for: indexPath) as! SongCell
    cell.titleLabel.text = items[indexPath.row].title
    if items[indexPath.row].isDownloaded {
        cell.checkmark.isHidden = false
    }
    return cell
}
```

Row 3 is downloaded, so you scroll it off screen, and its cell — checkmark visible — goes into the pool. Predict: what happens when that cell is dequeued for row 47, which is *not* downloaded?

Answer: row 47 shows a checkmark. The `if` only ever *shows* the checkmark; nothing hides it. The recycled cell arrived carrying row 3's state, and your code didn't overwrite it. As you scroll, phantom checkmarks scatter across random rows.

The rule: a dequeued cell is never blank — it's *somebody else's old cell*. So set every visible property, both branches, every time:

```swift
cell.checkmark.isHidden = !items[indexPath.row].isDownloaded   // always assign
```

Cells also get a hook to clean themselves up when they enter the pool:

```swift
class SongCell: UITableViewCell {
    override func prepareForReuse() {
        super.prepareForReuse()
        artworkView.image = nil
        imageLoadTask?.cancel()    // stop fetching the OLD row's artwork
    }
}
```

`prepareForReuse()` runs just before a cell is handed out again. It's the place to reset transient state — and, critically, to cancel any in-flight async work like image downloads. We'll see why that cancel matters in the performance section.

## How tall is a row?

The cheapest answer is one number for every row:

```swift
tableView.rowHeight = 56   // fixed height — fastest option
```

Fixed height means the table can compute everything — total content height, scroll bar, which rows are visible — with pure arithmetic. When all rows genuinely are the same height, use this.

When rows must fit their content — multi-line text, dynamic type — you switch to self-sizing:

```swift
tableView.rowHeight = UITableView.automaticDimension
tableView.estimatedRowHeight = 72
```

With `automaticDimension`, the table sizes each row by running Auto Layout on the cell's content — which requires the cell's constraints to fully determine its height, top to bottom.

Why the `estimatedRowHeight` companion? Without an estimate, knowing the total content height would require *measuring all 10,000 rows up front* — exactly the work the table exists to avoid. The estimate lets it fake the total (10,000 × 72) for the scroll bar and content size, then substitute real measured heights only for rows that actually appear.

Collection views answer the sizing question differently: there is no `rowHeight`, because there are no rows. Instead a separate **layout object** — `UICollectionViewFlowLayout` for line-by-line flows, or a compositional/custom layout for anything else — decides every item's size and position. Same lazy machinery, pluggable geometry; compositional layout has its own lesson.

## Sections and the views between them

Both views group content into **sections** — a header, a run of rows, maybe a footer. Position is therefore a two-part value:

```swift
indexPath.section   // which group
indexPath.row       // which row inside it (collections call it .item)
```

Your data source answers per section:

```swift
func numberOfSections(in t: UITableView) -> Int { albums.count }
func tableView(_ t: UITableView, numberOfRowsInSection s: Int) -> Int {
    albums[s].songs.count
}
func tableView(_ t: UITableView, titleForHeaderInSection s: Int) -> String? {
    albums[s].title
}
```

Table views give sections headers and footers. Collection views generalize the idea into **supplementary views** — extra views that aren't cells (headers, footers, badges, decorations), created through the same dequeue-and-reuse machinery and positioned by the layout object.

## Selection, swipes, and staying in sync

Taps arrive through the delegate, as you saw. Swipe actions do too:

```swift
func tableView(_ t: UITableView,
    trailingSwipeActionsConfigurationForRowAt indexPath: IndexPath)
    -> UISwipeActionsConfiguration? {
    let delete = UIContextualAction(style: .destructive, title: "Delete") { _, _, done in
        self.items.remove(at: indexPath.row)              // 1. update the MODEL
        t.deleteRows(at: [indexPath], with: .automatic)   // 2. update the TABLE
        done(true)
    }
    return UISwipeActionsConfiguration(actions: [delete])
}
```

Look at the two numbered lines — they're the load-bearing part. Deleting a row is *two* updates: your model array and the table's view of it. Do only one, and the table's next consistency check fails with the classic crash:

```swift
// 'Invalid update: invalid number of rows in section 0. The number of rows
//  contained in an existing section after the update (10) must be equal to
//  the number of rows before the update (10), plus or minus the number of
//  rows inserted or deleted (1 deleted)...'
```

The table counted your rows before and after, did the arithmetic, and caught you lying. Every insert, delete, and move must hit model and view together. Tables also support a full editing mode — insert/delete controls and drag-to-reorder — all governed by the same model-and-view-together rule.

## Keeping scrolling smooth

Everything above funnels into one performance truth: `cellForRowAt` runs *during scrolling*, once per appearing row, on the main thread. Whatever happens in there happens inside your frame budget. The checklist:

Reuse and reset — always dequeue, never construct cells per row, and reset in `prepareForReuse`. You have this already.

Move heavy work off the main thread. The classic offender is images:

```swift
cell.imageLoadTask = Task {
    let image = await loader.downsampledImage(for: song.artworkURL)  // background
    cell.artworkView.image = image                                    // back on main
}
```

Decoding and downsampling a large image can cost more than a frame; done in `cellForRowAt` directly, every new row hitches. Load and decode in the background, cache the result, and set the image when it arrives.

But async loading plus cell reuse creates a subtle bug — the *wrong image flash*. Cell loads row 3's artwork slowly; user scrolls; the same cell is recycled for row 47; row 3's download finally finishes and plants row 3's artwork on row 47. That's exactly why `prepareForReuse` cancels the in-flight task: a recycled cell must abandon its old row's pending work.

Keep per-row measurement cheap — self-sizing runs Auto Layout per cell, so deep constraint trees in cells cost real time; use estimated heights so the table never measures off-screen rows.

Finally, updating content: `reloadData()` rebuilds everything with no animation and is easy to misuse, while the batch-update APIs crash if your counts drift. The modern answer is the *diffable data source* — you hand it a snapshot of your data and it computes and animates the difference safely. It has its own lesson.

## Common pitfalls

- **Configuring only one branch of cell state.** Recycled cells carry old state; assign every visible property in `cellForRowAt`, unconditionally.
- **Skipping `prepareForReuse`.** Stale images and running tasks leak across rows. Reset transient state and cancel async work there.
- **Async image lands on a recycled cell.** Cancel in-flight loads on reuse, or verify the cell still represents the same item before setting the image.
- **Deleting from the model but not the table (or vice versa).** Guaranteed "invalid number of rows" crash. Model and view update together, always.
- **Heavy work in `cellForRowAt`.** Image decoding, formatting, layout — each appearing row pays it during scroll. Precompute, cache, or go off-main.
- **Self-sizing cells with incomplete constraints.** If the cell's constraints don't pin content top-to-bottom, `automaticDimension` has nothing to measure and heights collapse.

## Interview lens

If asked how table views work, lead with the two mechanisms: a data source that's queried lazily — counts plus `cellForRowAt`, called only for rows about to appear — and cell reuse, where off-screen cells enter a pool and `dequeueReusableCell` recycles them, so a huge list only ever creates a screenful of cells. Keep the protocol split crisp: data source is content, delegate is behavior.

The follow-up is almost always the reuse bug. Say it plainly: a dequeued cell carries the previous row's state, so you must set every visible property every time and reset transient state in `prepareForReuse()`. Bonus points for the async version — an in-flight image load finishing after the cell was recycled paints the wrong image, so you cancel loads on reuse.

Senior signals: self-sizing needs `automaticDimension` plus an `estimatedRowHeight`, and the estimate exists so the table never has to measure every row up front. Editing must update model and table together or you get the "invalid number of rows" crash — quote it and interviewers know you've met it. And know the modern landscape: collection views delegate geometry to a layout object with supplementary views for non-cell content, and diffable data sources are the safe, animated replacement for manual `reloadData` bookkeeping.
