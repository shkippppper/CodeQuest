import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "foreach-identity",
    type: "mcq",
    prompt: "Why does `ForEach` need a stable, unique identity for its elements?",
    options: [
      "So SwiftUI can diff by identity — update/insert/remove the right rows and animate transitions",
      "To sort the list alphabetically",
      "To reduce memory usage only",
      "It doesn't — identity is optional",
    ],
    answer: 0,
    explanation:
      "SwiftUI matches elements across updates by identity. Stable, unique ids let it update matching rows in place, remove/insert others, and animate correctly. Wrong identity breaks all of that.",
  },
  {
    id: "list-lazy",
    type: "mcq",
    prompt: "How does `List` handle a large number of rows?",
    options: [
      "It's lazy — it builds rows as they scroll into view",
      "It builds every row up front",
      "It caps at 100 rows",
      "It renders rows on a background thread",
    ],
    answer: 0,
    explanation:
      "`List` (like the `Lazy*` containers) builds rows on demand as they appear, so it scales to large data. Plain `VStack`/`HStack` build all children immediately.",
  },
  {
    id: "lazyvstack-fill",
    type: "fill",
    prompt: "Inside a ScrollView, use a ___VStack (not a plain VStack) so rows are built on demand for large collections.",
    answers: ["Lazy", "LazyV", "lazy"],
    hint: "The prefix meaning 'on demand'.",
    explanation:
      "`LazyVStack` builds children as they scroll into view. A plain `VStack` builds all of them immediately, which is wasteful for large lists.",
  },
  {
    id: "index-identity-bug",
    type: "predict",
    prompt: "🧠 Trick question — what goes wrong using the array index as ForEach identity when the list reorders?",
    code: `ForEach(0..<items.count, id: \\.self) { i in
    RowView(item: items[i])   // identity = index
}`,
    options: [
      "Indices shift on reorder/insert, so SwiftUI attributes changes to the wrong rows — broken animations and @State hopping between cells",
      "Nothing — indices are perfectly stable identities",
      "It crashes immediately",
      "Rows render in reverse",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Index-based identity isn't stable: when items are inserted/reordered, index N now refers to a different element, so SwiftUI thinks that row's content changed and mis-animates — and any per-row `@State` sticks to the index, appearing to 'hop' to a different cell. Use a real stable id (Identifiable / UUID).",
  },
  {
    id: "identifiable-preferred",
    type: "mcq",
    prompt: "What's the most robust way to give ForEach elements identity?",
    options: [
      "Conform the model to `Identifiable` with a stable unique `id` (e.g. a UUID or backend id)",
      "Use the array index",
      "Use `id: \\.self` on a mutable struct",
      "Use the element's description string",
    ],
    answer: 0,
    explanation:
      "A stable, unique `id` on the model (via `Identifiable`) survives reorders and edits. Index-based or `\\.self`-on-mutable-value identities are fragile and cause diffing bugs.",
  },
  {
    id: "lists-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about SwiftUI lists & performance.",
    options: [
      "`List` and `Lazy*` containers build rows on demand",
      "Plain `VStack` builds all its children immediately",
      "Array index is a reliable stable identity for dynamic data",
      "SwiftUI diffs collections by identity to animate inserts/removes/moves",
    ],
    answers: [0, 1, 3],
    explanation:
      "Lazy building, eager VStack, and identity-based diffing are correct. The array **index** is NOT a reliable identity for data that reorders/inserts (option 3 is false).",
  },
  {
    id: "row-body-cheap-senior",
    type: "mcq",
    prompt: "Why keep a row's `body` cheap in a large list?",
    options: [
      "Row bodies are recomputed frequently as you scroll/update — expensive work there causes scroll stutter",
      "Bodies can only contain 10 views",
      "Rows run on the main actor only in lists",
      "It has no effect on performance",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "As rows scroll in/out and data updates, their `body` runs repeatedly. Heavy formatting, date math, or allocations there hurt scrolling. Precompute/format outside `body` and keep the view description lean.",
  },
  {
    id: "whole-list-invalidation-senior",
    type: "mcq",
    prompt: "Rows backed by a shared `ObservableObject` all re-render when any one item changes. Why, and what helps?",
    options: [
      "ObservableObject observation is object-level; `@Observable` (fine-grained) or per-item models limit re-renders",
      "SwiftUI always re-renders every view",
      "Because List disables diffing",
      "Because rows share @State",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`ObservableObject`/`@Published` fires `objectWillChange` for any change, so every observing row invalidates. Migrating to `@Observable` (per-property tracking) or giving each row its own smaller observed model limits re-renders to what actually changed.",
  },
  {
    id: "anyview-senior",
    type: "mcq",
    prompt: "Why avoid wrapping list rows in `AnyView` unnecessarily?",
    options: [
      "Type erasure hides the concrete view type, defeating some of SwiftUI's diffing/optimization — prefer @ViewBuilder/concrete types",
      "AnyView is not allowed in lists",
      "AnyView makes rows immutable",
      "It changes the row's identity",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`AnyView` erases the static type SwiftUI uses to optimize updates, so overusing it can hurt performance and diffing. Use `@ViewBuilder` and concrete return types where possible; reach for `AnyView` only when you genuinely need heterogeneous erased views.",
  },
  {
    id: "lists-flashcard",
    type: "flashcard",
    prompt:
      "Explain identity in ForEach and the performance rules for SwiftUI lists. Answer aloud, then reveal.",
    modelAnswer:
      "SwiftUI renders collections with **`List`** (styled, lazy, scrollable) and **`ForEach`** (generates views from data). The crux is **identity**: `ForEach` needs a **stable, unique id** per element — via **`Identifiable`** (a UUID/backend id) or an explicit key path — because SwiftUI **diffs by identity** to update matching rows in place, insert/remove others, and animate moves. The classic bug is using the **array index** (or `\\.self` on non-unique/mutable data) as identity: indices shift on reorder/insert, so SwiftUI attributes changes to the **wrong rows**, causing broken animations and per-row **`@State` hopping between cells**. Performance: **`List` and `Lazy*` containers build rows on demand**, while plain `VStack`/`HStack` build **everything up front** — so large data needs lazy containers. Also keep each row's **`body` cheap** (it recomputes as you scroll), beware **whole-list invalidation** from object-level `ObservableObject` (use `@Observable`/per-item models), and avoid unnecessary **`AnyView`** type erasure.",
    keyPoints: [
      "ForEach needs stable, unique identity (Identifiable / key path)",
      "SwiftUI diffs by identity → correct updates & animations",
      "Index / \\.self-on-mutable identity → wrong-row changes, @State hopping",
      "List & Lazy* build rows on demand; plain stacks build all up front",
      "Cheap row body; @Observable to limit re-renders; avoid gratuitous AnyView",
    ],
    explanation:
      "Senior answers center on stable identity and the index-identity bug (state hopping/mis-animation), plus lazy containers and keeping row bodies cheap.",
  },
];

export default quiz;
