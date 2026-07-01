# CodeQuest — Feature Additions Design

**Date:** 2026-07-01
**Status:** Approved for planning

Four independent-but-related additions to the CodeQuest Swift interview-prep app:
multi-select questions, a ⌘K command palette, per-topic mastery tiers, and
progress export/import. All work stays within the existing offline-first,
`localStorage`-only architecture and the sequential slate-indigo design system.

---

## 1. Multi-select question type (partial credit → fractional XP)

### Data model (`src/content/types.ts`)

Add a fifth question type:

```ts
export interface MultiQuestion extends BaseQuestion {
  type: "multi";
  options: string[];
  /** indices of every correct option (at least one) */
  answers: number[];
}
```

- Add `MultiQuestion` to the `Question` union.
- `answers` holds 1+ indices. No schema constraint beyond the array being
  non-empty (authoring convention, not enforced by types).

### UI (`src/components/quiz/QuestionCard.tsx`)

- Add `multi` to `TYPE_LABEL`: label `"Select all that apply"`, icon
  `ListChecks` (lucide).
- New render branch, checkbox-style: options toggle independently. Track a
  `Set<number>` of selected indices instead of the single `selected` number
  used by mcq/predict.
- Submit button disabled until at least one option is selected.
- On submit, compute the score (see below), then render per-option state:
  - correct **and** picked → ✓ (ok color)
  - correct **and** missed → highlighted as "should have picked"
  - wrong **and** picked → ✗ (bad color)
  - wrong **and** not picked → neutral
- Show a "You got X of N" line alongside the standard explanation block.

### Scoring

```
correctPicked = |selected ∩ answers|
wrongPicked   = |selected \ answers|
raw           = correctPicked - wrongPicked      // wrong picks cancel correct ones
score         = clamp(raw, 0, answers.length) / answers.length   // 0..1
```

`correct` (boolean) = `score === 1`.

### Wiring the fractional score through the pass/fail systems

Decision: **fractional XP, threshold review.** The user sees their partial
score; XP scales with it; a question only "passes" at a perfect 1.0.

- `QuestionCard` `onGraded` signature becomes
  `(correct: boolean, score?: number) => void`. Existing call sites for
  mcq/predict/fill/flashcard pass `correct` only (score defaults to 1).
- `Quiz.handleGraded` (`src/components/quiz/Quiz.tsx`) accepts and forwards the
  optional `score` into `recordAnswer(topicId, qId, correct, { isReview, score })`.
  The `results[]` array stays `(boolean | null)[]` keyed on `correct`, so the
  quiz progress bar, per-topic score, and completion logic are unchanged.
- `recordAnswer` (`src/game/store.tsx`) gains an optional `score` in
  `RecordOpts` (default `1`). XP award is scaled: `Math.round(baseXP * score)`.
  `correct` still governs the review log (`wrongLog`) and accuracy
  (`totalCorrect`/`topicProgress`), so those stay boolean. Redemption path
  (review + previously wrong) is unaffected — it already keys off `correct`.
- `score` is **transient** — used only to compute the XP award. It is NOT
  persisted in `AnswerRecord`, so `STORAGE_KEY`/`VERSION` are unchanged.

### Non-goals

- No partial credit for mcq/predict/fill (they remain strict boolean).
- No fractional accuracy or fractional per-topic score.

---

## 2. ⌘K command palette (`src/components/CommandPalette.tsx`)

A new global overlay, mounted once in `Layout`. The existing sidebar
filter-as-you-type stays exactly as-is; this is additive.

### Behavior

- Opens on **⌘K** (mac) / **Ctrl+K** (win/linux), and via a small clickable
  hint (optional, e.g. in `TopBar`). Closes on **Esc**, on backdrop click, or
  after selecting an item.
- Single text input, auto-focused on open.
- Two result groups, filtered by a simple fuzzy/substring match:
  1. **Topics** — matched on `title`, `summary`, and `tags`. Selecting
     navigates to `/learn/<id>`.
  2. **Actions** — a fixed list: Dashboard (`/`), Challenge (`/challenge`),
     Review (`/review`), Bookmarks (`/bookmarks`), Settings (`/settings`),
     and "Toggle theme" (calls `useTheme().toggle`).
- Keyboard nav: **↑/↓** move the highlighted item across the combined flat
  result list, **Enter** activates it.

### Implementation notes

- Navigation via `useNavigate()` (real client-side routing — unlike the
  preview-DOM-click caveat, in-app this works normally).
- Styling uses existing CSS tokens; `motion` (`AnimatePresence` + fade/scale)
  for enter/exit, matching the app's animation style.
- Global key listener registered in the palette component (or `Layout`) via
  `useEffect`; guard against firing while typing in other inputs is
  unnecessary because ⌘/Ctrl+K is a dedicated chord.

### Non-goals

- No indexing of individual quiz questions (topics + actions only).
- Does not replace or modify the sidebar search.

---

## 3. Per-topic mastery tiers

The sidebar already shows completed ✓ / perfect ★ / not-started ○ and the store
already computes `topicProgress()`. This replaces that binary display with a
four-tier mastery model.

### Logic (`src/lib/mastery.ts`, or a helper on the store)

`topicMastery(topicId, totalQuestions)` returns a tier:

| Tier | Condition |
|---|---|
| `not-started` | no answered questions for the topic |
| `learning` | some answered, accuracy < 80% |
| `proficient` | accuracy ≥ 80% (but not mastered) |
| `mastered` | accuracy = 100% **and** no `wrongLog` entries for the topic |

- Accuracy = correct ÷ answered over `answered` records whose key starts with
  `"<topicId>::"` (reuse the scan already in `topicProgress`).
- "No wrong-log entries" = no key in `state.wrongLog` with `topicId` matching.
- Each tier has a color (sequential shades of the brand hue) and a label.

### Display

- **Sidebar** (`src/components/Sidebar.tsx`): replace the current
  ✓/★/○ icon selection with a mastery indicator (tier-colored dot/ring) +
  `title` tooltip showing the tier label.
- **Dashboard** (`src/pages/Dashboard.tsx`): add a "Mastery" breakdown card —
  counts of topics per tier across all topics, shown as a small stacked bar or
  four stat pills, using tier colors.

### Non-goals

- No time-based decay ("needs review after N days").
- No change to XP or badges from mastery.

---

## 4. Progress export / import (Settings)

A new "Backup" section in `src/pages/SettingsPage.tsx`.

### Store API additions (`src/game/store.tsx`)

- `exportState(): ProgressState` — returns the current state (for
  serialization by the page).
- `importState(parsed: unknown): boolean` — validates shape, and if valid,
  replaces progress via the existing `commit()` path (so it persists and
  re-renders). Returns success/failure.

### Validation

`importState` accepts an object only if it looks like a `ProgressState`:
has a numeric `version` and the expected top-level keys
(`xp`, `completedTopics`, `answered`, `wrongLog`, `bookmarks`, `badges`,
`totalCorrect`, `totalAnswered`, `redemptions`). Merge with `emptyState()`
(same defensive pattern as `load()`) so missing/extra fields are tolerated.
Invalid input → return `false`, write nothing.

### UI

- **Export**: button downloads `codequest-progress-YYYY-MM-DD.json` — a
  `Blob` of `JSON.stringify(exportState(), null, 2)` via an object URL.
- **Import**: hidden `<input type="file" accept="application/json">`; on file
  chosen, read text, `JSON.parse`, then a confirm step ("This will replace all
  current progress") before calling `importState`. Success/failure surfaced via
  an **inline message** in the Backup section — there is no general-purpose
  toast API (the `RewardLayer`/`rewardBus` toasts are reward-only: XP, level-up,
  badge). Do not repurpose `rewardBus` for import status.
- Replace semantics only (no merge).

### Non-goals

- No merge-import.
- No cloud sync (stays offline-first).

---

## Cross-cutting

- **Storage version:** unchanged (`cq_progress_v1`, `VERSION = 1`). None of the
  four features add persisted fields.
- **Author-topic skill:** update `.claude/skills/author-topic/SKILL.md` to
  document the new `multi` type (shape + authoring guidance). Add one real
  `multi` question to an existing topic (`optionals`) as a live example and to
  exercise the new code path.
- **Verification:** `npx tsc -b` must exit 0 and `npm run build` must succeed
  for every change. Spot-check the palette, mastery display, multi-select
  grading, and export/import in the preview.
- **Design system:** all new colors come from existing CSS tokens / sequential
  hue shades in `src/index.css`; no rainbow, no new hard-coded hex where a
  token exists.

## Suggested implementation order

1. Multi-select type + scoring wiring (touches types, QuestionCard, Quiz, store).
2. Mastery tiers (touches store/lib, Sidebar, Dashboard).
3. Export/import (touches store, SettingsPage).
4. Command palette (self-contained new component + Layout mount).
5. Author-topic skill update + example `multi` question.
