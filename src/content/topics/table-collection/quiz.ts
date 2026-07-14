import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "datasource-vs-delegate",
    type: "mcq",
    prompt: "How do the data source and delegate responsibilities split for a UITableView?",
    options: [
      "Data source supplies content (counts + cellForRowAt); delegate handles behavior (selection, heights, swipes)",
      "Data source exclusively responds to user tap events while the delegate provides cells and all row content",
      "They are in fact the same single protocol with method groups artificially separated for organizational clarity only",
      "The delegate stores and fully owns all model data while the data source converts that data into rendered cell views",
    ],
    answer: 0,
    explanation:
      "The **data source** answers 'how many rows' and 'which cell'. The **delegate** handles interaction/appearance (selection, height, swipe actions, willDisplay).",
  },
  {
    id: "cell-reuse-mechanism",
    type: "mcq",
    prompt: "How does a table view avoid creating a cell view per row for a huge list?",
    options: [
      "Cell reuse — off-screen cells go into a pool and are recycled via dequeueReusableCell",
      "It pre-renders all cells in a single pass at load time and caches the resulting layer bitmaps",
      "It hard-caps the total number of visible list rows at 100 to prevent memory pressure",
      "It creates and configures all cell objects on a background thread before the first scroll event",
    ],
    answer: 0,
    explanation:
      "Only ~a screenful of cells exist; as they scroll off they're recycled through `dequeueReusableCell(withIdentifier:for:)`. `cellForRowAt` is called lazily for cells about to appear.",
  },
  {
    id: "reuse-bug",
    type: "predict",
    prompt: "🧠 Trick question — a cell that showed an image on row 0 shows that same image on row 20 after scrolling. Why?",
    code: `func tableView(_ t: UITableView, cellForRowAt ip: IndexPath) -> UITableViewCell {
    let cell = t.dequeueReusableCell(withIdentifier: "C", for: ip) as! MyCell
    if let img = items[ip.row].image { cell.imageView?.image = img }
    return cell   // no else-branch to clear a missing image
}`,
    options: [
      "The dequeued cell still holds the previous row's image; you must reset all state (in prepareForReuse and/or set it every time)",
      "UITableView maintains a process-wide global image cache keyed by index path that becomes stale on cell reuse",
      "It is a confirmed UIKit regression that was introduced in iOS 16 and has not yet been resolved by Apple in any release",
      "The image asset is loaded from disk twice in parallel — once for the original row and a second time for the reused destination row",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Recycled cells carry over prior state. Because the code only sets the image when present, a reused cell keeps the old one when `items[row].image` is nil. Fix: reset in `prepareForReuse()` and/or always set every property (an explicit `else { cell.imageView?.image = nil }`).",
  },
  {
    id: "self-sizing-fill",
    type: "fill",
    prompt: "For dynamic-height (self-sizing) cells, set rowHeight to automatic and provide an ___RowHeight so the table can size the scroll content without measuring every row.",
    answers: ["estimated", "estimatedRow"],
    hint: "estimate the height.",
    explanation:
      "`estimatedRowHeight` (with `rowHeight = .automatic` and proper Auto Layout in the cell) lets the table self-size rows while avoiding measuring all of them up front.",
  },
  {
    id: "delete-sync",
    type: "mcq",
    prompt: "When the user deletes a row, what must you do?",
    options: [
      "Update both the model and the table (e.g. deleteRows(at:with:)) so counts stay in sync",
      "Only call reloadData on the table without touching the underlying data model at all",
      "Only remove the item from the model array; the table view automatically detects and reflects the change",
      "Nothing — the table view handles both model mutation and visual deletion entirely on its own",
    ],
    answer: 0,
    explanation:
      "The table's row count must match the data source. Remove from the model AND tell the table (`deleteRows`), or you crash with 'invalid number of rows in section'.",
  },
  {
    id: "table-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about table/collection views.",
    options: [
      "`cellForRowAt` is called lazily, only for cells about to be shown",
      "`prepareForReuse` is a good place to reset per-cell state",
      "Collection views size cells via a layout object rather than a rowHeight",
      "Dequeued cells are always blank and need no reconfiguration",
    ],
    answers: [0, 1, 2],
    explanation:
      "Lazy cellForRowAt, prepareForReuse resets, and collection-view layout sizing are correct. Dequeued cells are **recycled with old state** and must be fully reconfigured (option 3 is false).",
  },
  {
    id: "image-cancel-senior",
    type: "mcq",
    prompt: "A cell asynchronously loads an image; while it loads, the cell is reused for another row. What's the bug and fix?",
    options: [
      "The old load completes and shows the wrong image in the recycled cell — cancel the in-flight load on reuse (and/or tag the request with the index path)",
      "Nothing at all — UIKit internally guarantees that all async image loads always complete into the correct target cell",
      "The app crashes exactly at the point of image assignment because UIKit validates the cell's index path before allowing any write",
      "Cell reuse must be completely disabled for every single row type that ever contains an image loaded asynchronously from a remote network source, otherwise the table breaks",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "An async image request finishing after the cell was reused sets the wrong image ('image flashing'). Cancel the request in `prepareForReuse` (or verify the cell still represents the same item before applying), so a stale load can't clobber the recycled cell.",
  },
  {
    id: "cellforrow-cheap-senior",
    type: "mcq",
    prompt: "Why must `cellForRowAt` stay cheap for smooth scrolling?",
    options: [
      "It runs on the main thread for each appearing cell during scroll — heavy work there drops frames",
      "UIKit dispatches cellForRowAt to a private serial background thread where it can also block on disk I/O",
      "It only executes a single time during table initialization, making its computational cost completely irrelevant to scroll performance",
      "It is the method that sets the app-wide per-row memory ceiling beyond which the OS delivers a low-memory warning to the app",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`cellForRowAt` executes on the main thread as cells scroll in. Expensive work (image decoding, heavy layout, sync I/O) there causes hitches. Move decoding/downsampling off-main, cache results, and keep configuration lightweight.",
  },
  {
    id: "supplementary-views-senior",
    type: "mcq",
    prompt: "In a UICollectionView, what are 'supplementary views'?",
    options: [
      "Non-item views like section headers, footers, and badges positioned by the layout",
      "Extra blank cells automatically inserted at section boundaries to provide visual padding",
      "Dedicated background rendering threads that UICollectionView uses for off-screen cell preparation",
      "The internal pool from which dequeueReusableCell retrieves recycled cell objects",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Collection views generalize table headers/footers into **supplementary views** — headers, footers, decoration/badge views — whose placement is defined by the layout object. They're dequeued and reused just like cells.",
  },
  {
    id: "table-collection-flashcard",
    type: "flashcard",
    prompt:
      "Explain the data source/delegate split, cell reuse, and the key performance rules for tables/collections. Answer aloud, then reveal.",
    modelAnswer:
      "`UITableView`/`UICollectionView` split work between a **data source** (content: section/row counts and the cell for each `indexPath` via `cellForRowAt`, called lazily for about-to-appear cells) and a **delegate** (behavior: selection, heights, swipe actions). The performance core is **cell reuse**: only ~a screenful of cells exist; off-screen ones enter a pool and are recycled via **`dequeueReusableCell(withIdentifier:for:)`**. The trademark bug is that **recycled cells keep prior state**, so you must fully reconfigure them — reset in **`prepareForReuse()`** and set every property in `cellForRowAt` (e.g. the wrong image showing on a reused row). Sizing: fixed `rowHeight` is fastest; **self-sizing** needs `rowHeight = .automatic` + `estimatedRowHeight` + Auto Layout (collection views size via a layout object). Editing/**deletion must update model and table together** or you crash. For smooth scrolling, keep `cellForRowAt` cheap, decode/downsample images **off the main thread**, cache, and **cancel in-flight loads on reuse** to prevent stale-image flashing. Collection views generalize headers into **supplementary views**, and **diffable data sources** are the modern way to apply animated updates.",
    keyPoints: [
      "Data source = content (counts + cellForRowAt, lazy); delegate = behavior",
      "Cell reuse via dequeueReusableCell; reset state in prepareForReuse",
      "Recycled cells keep old state → fully reconfigure every time",
      "Self-sizing: rowHeight .automatic + estimatedRowHeight + Auto Layout",
      "Perf: cheap cellForRowAt, off-main image decode, cancel loads on reuse; keep model+view in sync",
    ],
    explanation:
      "Senior answers stress the reuse-state bug (and image-flash + cancel-on-reuse), off-main image work, self-sizing setup, and model/view sync on deletion.",
  },
];

export default quiz;
