# Plan: Subject layer + SQL & Databases curriculum

> **Handoff doc.** Written to be picked up cold by a fresh session on another machine.
> Everything needed to execute is here: current architecture, locked decisions, exact
> schema changes, the full SQL curriculum, the authoring workflow, and a phased checklist.

## Goal

CodeQuest is currently a Swift/iOS interview-prep site. We want to:

1. Introduce a **subject** layer above `category`, so content splits cleanly into
   **Swift & iOS** (existing 175 topics) and **SQL & Databases** (new), extensible to more later.
2. Author a full **SQL & Databases** curriculum (~31 topics).
3. Keep the door open for the parked **new Swift ideas** at the bottom.

## Locked decisions (defaults chosen — change here if we reconsider)

- **(a) UX shape → in-sidebar subject switcher.** A compact pill row at the top of the
  sidebar (`Swift & iOS` · `SQL & Databases`). The selected subject filters the category
  tree below and the Dashboard "Learning paths." Hero copy adapts per subject. Selection
  persisted in `localStorage` (`cq_subject`). Rejected alternatives: a landing
  subject-picker page (more separation, more work) and a nested super-group tree (least distinct).
- **(b) Progress → global.** One XP/level/badge identity across all subjects. Each subject
  shows its own **completion %**. No storage-schema migration needed. (Per-subject XP is a
  future option; would require a `cq_progress` version bump.)

---

## Current architecture (facts, with paths)

- **Content**: `src/content/topics/<slug>/{meta.ts, explanation.md, quiz.ts}`.
  Auto-discovered by `import.meta.glob` in `src/content/registry.ts` — **no registration step**.
- **Types**: `src/content/types.ts`
  - `CategoryId` union (15 ids) + `CATEGORIES: Record<CategoryId, CategoryInfo>`
    (`id, label, order, blurb, icon (lucide name), accent (hex)`).
  - `TopicMeta { id, title, category, difficulty, order, summary, est, tags? }`.
  - `Difficulty = "junior" | "mid" | "senior"`; `DIFFICULTY_META`.
- **Registry** (`registry.ts`): `TOPICS` (sorted by `CATEGORIES[cat].order` then `meta.order`),
  `groupedByCategory()`, `ALL_QUESTIONS`, `sampleQuestions()`, `adjacentTopics()`,
  `TOTAL_TOPICS`, `TOTAL_QUESTIONS`.
- **UI consumers of categories**: `src/components/Sidebar.tsx` (category tree),
  `src/pages/Dashboard.tsx` ("Learning paths" cards + hero copy),
  `src/components/CommandPalette.tsx`, `src/pages/{ChallengePage,ReviewPage,BookmarksPage,TopicPage}.tsx`,
  `src/game/badges.ts` (`categoryComplete(s, "language")` etc.).
- **Progress**: `src/game/store.tsx`, `localStorage` key `cq_progress_v1`. Global XP/level/badges.
- **Routing**: `src/App.tsx` — `/`, `/learn/:topicId`, `/review`, `/challenge`, `/bookmarks`, `/settings`.
- **Branding**: `TopBar.tsx` ("CodeQuest"); Dashboard hero hardcodes "Master Swift, level by level."

---

## Phase 1 — Subject layer scaffolding (types + registry)

### 1.1 `src/content/types.ts`

```ts
export type SubjectId = "swift" | "sql";

export interface SubjectInfo {
  id: SubjectId;
  label: string;      // "Swift & iOS"
  tagline: string;    // hero copy, e.g. "Master Swift, level by level."
  blurb: string;
  icon: string;       // lucide name
  accent: string;     // hex
  order: number;
}

export const SUBJECTS: Record<SubjectId, SubjectInfo> = {
  swift: {
    id: "swift", label: "Swift & iOS",
    tagline: "Master Swift, level by level.",
    blurb: "The language, the frameworks, and the iOS interview surface.",
    icon: "Braces", accent: "#4d6699", order: 1,
  },
  sql: {
    id: "sql", label: "SQL & Databases",
    tagline: "Master SQL, query by query.",
    blurb: "Relational modeling, querying, transactions and performance.",
    icon: "Database", accent: "#2f9e8f", order: 2,
  },
};
```

- Add `subject: SubjectId` to `CategoryInfo`.
- Set `subject: "swift"` on all 15 existing categories (mechanical edit; no other change).
- Append the 8 new SQL categories (see Phase 3) with `subject: "sql"` and `order` 101–108.

### 1.2 `src/content/registry.ts`

- Add:
  ```ts
  export function subjectOfTopic(t: Topic): SubjectId {
    return CATEGORIES[t.meta.category].subject;
  }
  export function groupedBySubject(): { id: SubjectId; groups: CategoryGroup[] }[] { ... }
  export function topicsForSubject(s: SubjectId): Topic[] { ... }
  export function questionsForSubject(s: SubjectId): FlatQuestion[] { ... }
  ```
- `sampleQuestions()` gains an optional `subject?: SubjectId` filter (Challenge/Review scope
  to the active subject). Keep signature backward-compatible (default = all subjects).

### 1.3 Gate

`npx tsc -b` must pass with categories carrying `subject` and the two subjects defined,
**before** touching UI.

---

## Phase 2 — UI wiring

- **New state**: a tiny `useSubject()` hook (or context) reading/writing `localStorage` `cq_subject`,
  default `"swift"`. Simplest: a React context in `src/game/` or `src/lib/`.
- **Sidebar** (`Sidebar.tsx`): render a pill row of `SUBJECTS` above the search box; clicking
  sets active subject. Replace `groupedByCategory()` with the active subject's groups
  (`groupedBySubject()` filtered). Existing search/difficulty filters unchanged.
- **Dashboard** (`Dashboard.tsx`): hero uses `SUBJECTS[active].tagline`; "Learning paths" shows
  only the active subject's categories. Add a small **subject strip** (2 cards) near the top so
  users can see/switch subjects and each subject's completion %. Global stats (XP, badges) stay.
- **CommandPalette / Challenge / Review**: scope to active subject where it makes sense
  (Challenge & Review pull from `questionsForSubject(active)`; palette can search all).
- **Badges** (`badges.ts`): existing Swift category badges stay valid (they name Swift categories).
  Optionally add 1–2 SQL badges once SQL content lands (e.g. "SQL Foundations complete").
- **Gate**: `npx tsc -b && npm run build` green; manual smoke — switch subjects, tree + hero update,
  Challenge respects subject.

---

## Phase 3 — SQL & Databases content (~31 topics)

Standard SQL, with dialect notes (SQLite / PostgreSQL) and an iOS tie-in where natural
(SQLite / GRDB / Core Data / SwiftData sit on top of these ideas). Same lesson format and
question mix as Swift topics.

**8 new categories** (subject `sql`), suggested `order` / lucide `icon` / teal-family `accent`:

| id | label | order | icon | accent |
|---|---|---|---|---|
| `sql-foundations` | SQL Foundations | 101 | `Database` | `#2f9e8f` |
| `sql-querying` | Querying | 102 | `Search` | `#38ac9b` |
| `sql-aggregation` | Aggregation & Grouping | 103 | `Sigma` | `#2a8f83` |
| `sql-joins` | Joins & Sets | 104 | `GitMerge` | `#43b0a0` |
| `sql-subqueries` | Subqueries & CTEs | 105 | `ListTree` | `#268076` |
| `sql-ddl` | Schema Design (DDL) | 106 | `Table2` | `#4fb7a8` |
| `sql-dml-transactions` | DML & Transactions | 107 | `ArrowLeftRight` | `#1f736b` |
| `sql-indexing` | Indexing & Performance | 108 | `Gauge` | `#57c0b0` |

**Topics** (slug · difficulty):

**SQL Foundations**
- `sql-what-is-rdb` · junior — What a relational database is (vs spreadsheets/NoSQL)
- `sql-tables-keys` · junior — Tables, rows, columns, primary & foreign keys
- `sql-language-shape` · junior — The shape of SQL (DDL/DML/DQL/TCL/DCL)
- `sql-data-types` · junior — Data types & how dialects differ
- `sql-null` · mid — `NULL` and three-valued logic

**Querying**
- `sql-select-where` · junior — `SELECT` & `WHERE`
- `sql-order-limit` · junior — `ORDER BY`, `LIMIT`, `DISTINCT`
- `sql-operators` · mid — Operators, `LIKE`, `IN`, `BETWEEN`
- `sql-case` · mid — `CASE` expressions & conditional logic

**Aggregation & Grouping**
- `sql-group-by` · mid — `GROUP BY` & aggregate functions
- `sql-having` · mid — `HAVING` vs `WHERE`
- `sql-window-functions` · senior — Window functions

**Joins & Sets**
- `sql-inner-outer-joins` · mid — `INNER` vs `LEFT/RIGHT/FULL OUTER`
- `sql-self-cross-joins` · mid — Self joins & cross joins
- `sql-set-operations` · mid — `UNION` / `INTERSECT` / `EXCEPT`

**Subqueries & CTEs**
- `sql-subqueries` · mid — Subqueries
- `sql-correlated-subqueries` · senior — Correlated subqueries
- `sql-ctes` · mid — Common table expressions (`WITH`)
- `sql-recursive-ctes` · senior — Recursive CTEs

**Schema Design (DDL)**
- `sql-create-alter-drop` · junior — `CREATE` / `ALTER` / `DROP`
- `sql-constraints` · mid — Constraints (PK / FK / `UNIQUE` / `CHECK` / `NOT NULL`)
- `sql-normalization` · senior — Normalization (1NF–3NF, when to denormalize)
- `sql-er-modeling` · mid — ER modeling & relationships (1:1, 1:N, M:N)

**DML & Transactions**
- `sql-insert-update-delete` · junior — `INSERT` / `UPDATE` / `DELETE` / upsert
- `sql-acid` · mid — ACID properties
- `sql-isolation-levels` · senior — Isolation levels & read anomalies
- `sql-locking-deadlocks` · senior — Locking & deadlocks

**Indexing & Performance**
- `sql-indexes` · mid — Indexes & B-trees
- `sql-explain` · senior — `EXPLAIN` & reading query plans
- `sql-index-tradeoffs` · senior — When indexes hurt (writes, selectivity)
- `sql-vs-nosql` · senior — SQL vs NoSQL (and when to pick which)

Then add an **§18 "SQL & Databases"** section to `CURRICULUM.md` mirroring this list.

---

## Authoring workflow & conventions (unchanged from the Swift batch)

Per topic, create `meta.ts` + `explanation.md` + `quiz.ts`. Follow
`.claude/skills/author-topic/SKILL.md` and `docs/STYLE_GUIDE.md`; exemplar lesson:
`src/content/topics/arc/explanation.md`.

**Lesson style**: problem-first opening (not a definition), code-before-prose, examples grow
line by line, one idea per paragraph, a predict-then-reveal moment, bold only first-use terms,
`##`/`###` plain-statement headings (drive the ToC), close with `## Interview lens`.

**Quiz**: 8–10 questions mixing `mcq` / `predict` / `fill` / `multi` / one `flashcard`.
Types live in `src/content/types.ts`.

**The length-tell rule (critical)**: the correct answer must **never** be the single longest
option. Distractors must be ≥ the correct answer in length, plausible, specific, and factually
wrong. **Never** fix a flag by changing the `answer` index — only lengthen distractors.

**Strings-with-code gotcha**: for `code` fields, use `\n`-joined regular double-quoted strings
(a literal backtick or `${` inside a template literal breaks the JS). In SQL snippets this is
rarely an issue, but still escape as needed.

**Verification gate per topic**:
- `node /tmp/checkslugs.mjs <slug>` → must be `OK` / `0 flagged` (the length-tell auditor;
  it esbuild-transforms the `.ts` and prints per-question option lengths). If `/tmp/checkslugs.mjs`
  is absent on the new machine, re-create it (it loads each `quiz.ts`, and for every
  `mcq`/`predict` question flags when the `answer` option is the unique maximum length).
- `npx tsc -b` → exit 0.
- Final batch gate: `npx tsc -b && npm run build` green. **No test runner** in this repo.

**Suggested execution**: pilot one SQL topic end-to-end to lock the quality bar, then fan out
the rest in small parallel waves of subagents (watch for rate limits; finish stragglers in the
main thread). This mirrors how the 18-topic Swift batch was done.

---

## Parked: new Swift ideas (backlog, not this task)

**Features**: spaced-repetition (SM-2) for Review · Interview Simulator (timed mixed round +
scorecard) · daily streak & goal · code-typing fill-in challenges · company/role question presets ·
adaptive difficulty.

**Content**: Swift 6 language mode & data-race safety · Observation (`@Observable`) deep-dive ·
Combine → `AsyncSequence` migration · Embedded Swift / Swift-on-server overview · Vision/CoreML basics.

---

## Task checklist

- [ ] **P1** Add `SubjectId` / `SubjectInfo` / `SUBJECTS` to `types.ts`; add `subject` to
      `CategoryInfo`; set `subject: "swift"` on 15 existing categories; add 8 `sql` categories.
- [ ] **P1** Registry helpers: `subjectOfTopic`, `groupedBySubject`, `topicsForSubject`,
      `questionsForSubject`; optional `subject` arg on `sampleQuestions`. `tsc -b` green.
- [ ] **P2** `useSubject()` + `cq_subject` persistence.
- [ ] **P2** Sidebar subject pills + subject-filtered tree.
- [ ] **P2** Dashboard hero/paths per subject + subject strip with completion %.
- [ ] **P2** Scope Challenge/Review to active subject; palette optional. Build green + smoke test.
- [ ] **P3** Pilot one SQL topic (recommend `sql-select-where`), verify quality bar.
- [ ] **P3** Author remaining 30 SQL topics in waves; each passes checkslugs + tsc.
- [ ] **P3** Add §18 SQL section to `CURRICULUM.md`.
- [ ] **Final** `npx tsc -b && npm run build` green; commit.
