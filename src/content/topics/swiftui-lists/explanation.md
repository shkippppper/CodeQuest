## The problem: a thousand rows and a moving target

Showing a collection looks like the easy part of SwiftUI:

```swift
List {
    ForEach(items) { item in
        RowView(item: item)
    }
}
```

And then reality arrives. A row's expanded state jumps to a *different* row after a delete. An insertion animates as a weird full-list flash. Scrolling stutters once the data hits a few thousand elements.

Every one of those symptoms traces back to one of two questions SwiftUI has to answer about your collection:

- *Which row is which?* When the data changes, SwiftUI must match old rows to new rows. That's identity.
- *Which rows exist right now?* Building ten thousand row views for a screen that shows twelve is a waste. That's laziness.

This lesson is those two ideas, in that order.

## List and ForEach: the two roles

The snippet above contains two different tools doing two different jobs:

```swift
List {                          // the CONTAINER: scrolling, row styling
    ForEach(items) { item in    // the GENERATOR: one view per element
        RowView(item: item)
    }
}
```

`List` is the container. It provides the platform look — separators, selection highlighting, swipe actions — plus scrolling, and it's lazy: rows are built only as they scroll into view.

`ForEach` is the generator. It walks a collection and produces one view per element. It isn't tied to `List` — the same `ForEach` works inside stacks and grids too, which matters later in this lesson.

Because `ForEach` knows the collection, row-level editing hangs off it:

```swift
ForEach(items) { item in
    RowView(item: item)
}
.onDelete { offsets in
    items.remove(atOffsets: offsets)   // swipe-to-delete updates the data
}
```

The user swipes, SwiftUI hands you the positions to remove, you mutate the array — and the row animates away. How SwiftUI knows *which* row to animate away is the crux of everything.

## Identity: how SwiftUI tells rows apart

Look again at the loop:

```swift
ForEach(items) { item in ... }
```

For this to compile, `items`' elements must conform to `Identifiable` — a protocol with a single requirement, an `id` property:

```swift
struct Reminder: Identifiable {
    let id = UUID()      // a random unique value, fixed at creation
    var title: String
}
```

That `id` is the element's name tag. When the array changes, SwiftUI doesn't compare rows by position or by content — it compares `id`s: "is the row with id `A83F...` still here?"

Two alternative spellings supply identity when the type isn't `Identifiable`:

```swift
ForEach(items, id: \.uuid) { ... }    // point at any stable, unique property
ForEach(names, id: \.self) { ... }    // use the value itself as its own id
```

Whatever the spelling, identity must satisfy two rules: stable — the same element keeps the same id across updates — and unique — no two elements share one. Break either rule and you get the bugs this lesson opened with. Let's watch one happen.

## Watch identity break

The most tempting wrong answer is using the array position as the id:

```swift
ForEach(items.indices, id: \.self) { i in
    RowView(item: items[i])
}
```

Suppose each `RowView` keeps a little local state — say `@State private var isExpanded`. The user expands the *second* row, "Buy milk". Then the first row gets deleted.

Predict: after the delete, which row is expanded?

Answer: "Buy milk" — now the *first* row — is collapsed, and whatever slid into second place is expanded instead. The expansion stayed at index 1 while the data moved underneath it.

Here's the mechanism. To SwiftUI, the row's identity was the number `1`, not "Buy milk". After the delete there is still a row with id `1` — so SwiftUI concludes that row survived and keeps its state storage, merely updating its content to the new occupant. Recall from the state lesson that `@State` lives and dies with identity — the state was faithfully preserved for id `1`, and id `1` is simply the wrong thing to be loyal to. This is the classic bug called state hopping between cells.

`id: \.self` has the same failure mode in different clothes: if two elements are equal (two reminders titled "Call"), their ids collide — uniqueness broken. If an element's value mutates (the title is edited), its id changes — stability broken, and SwiftUI sees a delete plus an insert instead of an edit.

The reliable answer is a genuine stable key: `Identifiable` with a `UUID` or your backend's model id — something that names the *thing*, not its position or its current contents.

## Diffing: what SwiftUI does with those ids

Now the payoff for getting identity right. When `items` changes, SwiftUI runs a diff — a comparison of old ids against new ids:

```
old ids:  [A, B, C]
new ids:  [A, C, D]

A → still present            → update the row in place
B → missing from new         → remove its row (animated out)
C → present, moved up        → move the row (animated slide)
D → new                      → insert a row (animated in)
```

Matching ids update in place and keep their state; missing ids are removed; new ids are inserted; and every one of those transitions gets the correct animation for free. A reorder animates as rows *sliding* to new positions — because SwiftUI can see it's the same ids in a new order.

Run the same reorder with index-based ids and the diff sees something else entirely: ids `0, 1, 2` before, ids `0, 1, 2` after — "same rows, but every row's *content* changed." No moves, no slides; every row flashes its new content in place, and any row state stays welded to its index. Same data change, garbage result — the diff is only as good as the ids you feed it.

## Laziness: only build what's on screen

Second question: which rows should exist as views at all? Try a big collection in a plain stack:

```swift
ScrollView {
    VStack {
        ForEach(tenThousandItems) { RowView(item: $0) }
    }
}
```

`VStack` builds *all* its children immediately — all ten thousand `RowView`s, constructed up front before anything appears on screen. For a handful of views that's fine; here it's a multi-second hang.

Swap in the lazy cousin:

```swift
ScrollView {
    LazyVStack {
        ForEach(tenThousandItems) { RowView(item: $0) }   // built as they appear
    }
}
```

`LazyVStack` builds each child on demand, as scrolling brings it near the viewport. Launch cost is now proportional to one screenful, not the whole dataset. The family:

- `LazyVStack` / `LazyHStack` — lazy linear layout inside a `ScrollView`.
- `LazyVGrid` / `LazyHGrid` — lazy grids, with columns or rows described by `GridItem`:

```swift
ScrollView {
    LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))]) {
        ForEach(photos) { PhotoCell(photo: $0) }   // as many columns as fit
    }
}
```

And remember `List` is lazy already. The rule of thumb: `List` or a `Lazy*` container for anything large or unbounded; plain `VStack`/`HStack` only for small, fixed content like a form's fields.

## Keeping big lists fast

Identity and laziness solve the structural problems. A few habits keep the remaining performance on the table:

- **Keep row `body` cheap.** A visible row's `body` re-runs constantly — on scroll, on data change, on parent updates. Formatting dates, sorting, or decoding images inside it multiplies that cost by the row count. Precompute in the model and let the row just display.
- **Beware whole-list invalidation.** With `ObservableObject`, observation is object-level — any `@Published` change re-renders *every* observing row, even the ones whose data didn't change. The `@Observable` macro's per-property tracking fixes this; on older setups, splitting one big observed object into smaller per-row models limits the blast radius.
- **Avoid gratuitous `AnyView`.** `AnyView` is a wrapper that hides a view's concrete type. SwiftUI's diffing uses types as part of structure, so erasing them in row content defeats optimizations. Prefer concrete types and `@ViewBuilder` for branching.

## Common pitfalls

- **Index or offset as identity.** Shifting positions make SwiftUI mis-attribute changes: state hops between cells, animations break. Use a stable per-element id.
- **`id: \.self` on non-unique or mutable values.** Duplicates collide; edits look like delete-plus-insert. Same fix: a real id.
- **A plain `VStack` for large data.** Every row is built up front. Use `List` or `LazyVStack` in a `ScrollView`.
- **Heavy work inside row `body`.** It runs far more often than you think. Precompute outside.
- **One giant `ObservableObject` behind every row.** Any published change redraws the whole list. Use `@Observable` or split the model.

## Interview lens

The headline answer in this area is identity. Say it in one breath: `ForEach` needs a stable, unique id per element — via `Identifiable` or an explicit `id:` key path — because SwiftUI diffs by identity to decide which rows to update, insert, remove, or move, and to animate those transitions correctly.

Then tell the bug story, because it's what the interviewer is fishing for: using the array index (or `\.self` on non-unique or mutable data) as identity means that when the collection shifts, SwiftUI attributes changes to the wrong rows — animations break and per-row `@State` hops between cells. Being able to explain *why* the state hops — state is keyed to identity, and the identity stayed at the index — is the senior version of the answer.

For performance, lead with laziness: `List` and the `Lazy*` containers build rows on demand as they scroll into view, while plain stacks build everything eagerly, so large collections need lazy containers. Then stack up the deeper cuts: keep row `body` cheap because it runs constantly; object-level `ObservableObject` observation invalidates the whole list on any published change, which fine-grained `@Observable` (or splitting state) fixes; and avoid unnecessary `AnyView` in rows since type erasure defeats diffing optimizations.
