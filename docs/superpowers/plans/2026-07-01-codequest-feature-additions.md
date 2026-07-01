# CodeQuest Feature Additions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four features to CodeQuest — a multi-select ("select all that apply") question type with partial-credit/fractional XP, a global ⌘K command palette, per-topic mastery tiers, and progress export/import.

**Architecture:** All work stays inside the existing offline-first React app (state in `localStorage`, no backend). Multi-select adds a fifth discriminated-union member to `Question` and threads a transient `score` through the quiz→store XP path (not persisted). Mastery is a pure helper derived from existing `answered`/`wrongLog` state, surfaced in the sidebar and dashboard. Export/import adds two store methods and a Settings section. The palette is a self-contained overlay mounted once in `Layout`.

**Tech Stack:** Vite 6, React 18 + TypeScript, Tailwind 4 (CSS tokens in `src/index.css`), React Router 7, motion, lucide-react.

**Verification convention (project preference — NO unit tests):** CodeQuest has no test runner and the user's standing preference is to skip unit tests on this personal project and verify by building/running. Every task is verified with:
- `npx tsc -b` → must exit 0
- `npm run build` → must succeed
- Preview spot-check where the change is visible (dev server on port 5174 via `.claude/launch.json`).

---

## File map

- `src/content/types.ts` — add `MultiQuestion`, extend `Question` union. *(Task 1)*
- `src/game/store.tsx` — `score` in `RecordOpts` + XP scaling; `exportState`/`importState`. *(Tasks 1, 7)*
- `src/components/quiz/QuestionCard.tsx` — `multi` render branch + `onGraded` signature. *(Task 2)*
- `src/components/quiz/Quiz.tsx`, `src/pages/ChallengePage.tsx`, `src/pages/ReviewPage.tsx` — thread `score`. *(Task 2)*
- `src/content/topics/optionals/quiz.ts` — one example `multi` question. *(Task 3)*
- `.claude/skills/author-topic/SKILL.md` — document the `multi` type. *(Task 3)*
- `src/lib/mastery.ts` — **new**, mastery tier logic. *(Task 4)*
- `src/components/Sidebar.tsx` — mastery indicator per topic. *(Task 5)*
- `src/pages/Dashboard.tsx` — mastery breakdown card. *(Task 6)*
- `src/pages/SettingsPage.tsx` — Backup (export/import) section. *(Task 8)*
- `src/components/CommandPalette.tsx` — **new**, ⌘K overlay. *(Task 9)*
- `src/components/Layout.tsx`, `src/components/TopBar.tsx` — mount palette + hint button. *(Task 10)*

---

## Task 1: Multi-select data model + store XP scaling

**Files:**
- Modify: `src/content/types.ts`
- Modify: `src/game/store.tsx`

- [ ] **Step 1: Add the `MultiQuestion` interface and extend the union**

In `src/content/types.ts`, after the `FlashcardQuestion` interface (currently ending line 52) and before the `Question` type alias, add:

```ts
export interface MultiQuestion extends BaseQuestion {
  type: "multi";
  options: string[];
  /** indices of every correct option (at least one) */
  answers: number[];
}
```

Then change the `Question` union to include it:

```ts
export type Question = MCQQuestion | PredictQuestion | FillQuestion | FlashcardQuestion | MultiQuestion;
```

- [ ] **Step 2: Add `score` to `RecordOpts`**

In `src/game/store.tsx`, replace the `RecordOpts` interface (currently lines 68-70):

```ts
interface RecordOpts {
  isReview?: boolean;
  /** 0..1 correctness fraction for partial-credit (multi-select) questions. Defaults to correct?1:0. Transient — never persisted. */
  score?: number;
}
```

- [ ] **Step 3: Scale XP by score in `recordAnswer`**

In `src/game/store.tsx`, replace the XP block inside `recordAnswer` — the current block is:

```ts
      if (correct) {
        if (opts?.isReview && wasWronglyLogged) {
          s = { ...s, redemptions: s.redemptions + 1 };
          s = applyXp(s, XP.reviewRedemption, "Redemption");
        } else {
          s = applyXp(s, firstAttempt ? XP.correctFirstTry : XP.correctRetry, "Correct");
        }
      }
```

with:

```ts
      const score = opts?.score ?? (correct ? 1 : 0);
      if (score > 0) {
        if (correct && opts?.isReview && wasWronglyLogged) {
          s = { ...s, redemptions: s.redemptions + 1 };
          s = applyXp(s, XP.reviewRedemption, "Redemption");
        } else {
          const base = firstAttempt ? XP.correctFirstTry : XP.correctRetry;
          s = applyXp(s, Math.round(base * score), "Correct");
        }
      }
```

Rationale: for the four existing types no `score` is passed, so `score` becomes `correct ? 1 : 0` and behavior is identical to before (full XP when correct, none when wrong, redemption unchanged). For multi-select, callers pass a fractional `score`, awarding proportional XP even when `correct` is `false`. `totalCorrect`/`wrongLog` still key off `correct` (already computed above this block), so accuracy and the review log only "pass" at `score === 1`.

- [ ] **Step 4: Verify build**

⚠️ Ordering note: extending the `Question` union here makes the exhaustive `Record<Question["type"], …>` for `TYPE_LABEL` in `QuestionCard.tsx` incomplete, so `npx tsc -b` will FAIL until Task 2 Step 2 adds the `multi` entry. That is expected — do not add the `multi` label early. The tree becomes green again at the end of Task 2. Commit this task's changes anyway (a brief one-commit red window is normal on a multi-commit branch); the authoritative green checkpoints are at the end of Task 2 and Task 3.

- [ ] **Step 5: Commit**

```bash
git add src/content/types.ts src/game/store.tsx
git commit -m "feat: add multi-select question type and score-scaled XP in store"
```

---

## Task 2: Multi-select UI + thread score through quiz flows

**Files:**
- Modify: `src/components/quiz/QuestionCard.tsx`
- Modify: `src/components/quiz/Quiz.tsx`
- Modify: `src/pages/ChallengePage.tsx`
- Modify: `src/pages/ReviewPage.tsx`

- [ ] **Step 1: Update imports and `onGraded` signature in `QuestionCard.tsx`**

In `src/components/quiz/QuestionCard.tsx`, add `ListChecks` to the lucide import (line 2):

```ts
import { Check, X, Eye, Lightbulb, HelpCircle, Brain, Terminal, ListChecks } from "lucide-react";
```

Change the `Props` interface `onGraded` (lines 8-12) to:

```ts
interface Props {
  question: Question;
  /** called exactly once, when the user grades/answers the question. `score` is the 0..1 fraction for partial-credit types; omit for pass/fail. */
  onGraded: (correct: boolean, score?: number) => void;
}
```

- [ ] **Step 2: Add `multi` to the type-label map**

In `src/components/quiz/QuestionCard.tsx`, add an entry to `TYPE_LABEL` (currently lines 14-19):

```ts
const TYPE_LABEL: Record<Question["type"], { label: string; icon: typeof HelpCircle }> = {
  mcq: { label: "Multiple choice", icon: HelpCircle },
  predict: { label: "Predict the output", icon: Terminal },
  fill: { label: "Fill in the blank", icon: Lightbulb },
  flashcard: { label: "Flashcard", icon: Brain },
  multi: { label: "Select all that apply", icon: ListChecks },
};
```

- [ ] **Step 3: Add multi-select state and update `grade`**

In `src/components/quiz/QuestionCard.tsx`, add two state hooks after the existing `useState` calls (after line 31 `showHint`):

```ts
  const [multiSel, setMultiSel] = useState<Set<number>>(new Set());
  const [multiResult, setMultiResult] = useState<{ correctPicked: number; total: number } | null>(null);
```

Replace the `grade` function (currently lines 36-40) with a version that accepts an optional score:

```ts
  function grade(isCorrect: boolean, score?: number) {
    setCorrect(isCorrect);
    setGraded(true);
    onGraded(isCorrect, score);
  }

  function gradeMulti() {
    if (question.type !== "multi") return;
    const answerSet = new Set(question.answers);
    let correctPicked = 0;
    let wrongPicked = 0;
    multiSel.forEach((i) => {
      if (answerSet.has(i)) correctPicked++;
      else wrongPicked++;
    });
    const raw = Math.max(0, correctPicked - wrongPicked);
    const total = answerSet.size;
    const score = total ? Math.min(raw, total) / total : 0;
    setMultiResult({ correctPicked, total });
    grade(score === 1, score);
  }
```

- [ ] **Step 4: Add the multi render branch**

In `src/components/quiz/QuestionCard.tsx`, insert this block immediately after the closing of the MCQ/PREDICT block (after its `)}` on what is currently line 110, before the `{/* ---- FILL ---- */}` comment):

```tsx
      {/* ---- MULTI (select all that apply) ---- */}
      {question.type === "multi" && (
        <div className="mt-4 flex flex-col gap-2">
          {question.options.map((opt, i) => {
            const isAnswer = question.answers.includes(i);
            const isPicked = multiSel.has(i);
            let style: React.CSSProperties = { borderColor: "var(--border)", background: "var(--bg)" };
            if (graded) {
              if (isAnswer && isPicked) style = { borderColor: "var(--ok)", background: "color-mix(in srgb, var(--ok) 12%, transparent)" };
              else if (isAnswer && !isPicked) style = { borderColor: "var(--color-brand-500)", background: "color-mix(in srgb, var(--color-brand-500) 10%, transparent)" };
              else if (!isAnswer && isPicked) style = { borderColor: "var(--bad)", background: "color-mix(in srgb, var(--bad) 12%, transparent)" };
            } else if (isPicked) {
              style = { borderColor: "var(--color-brand-500)", background: "color-mix(in srgb, var(--color-brand-500) 10%, transparent)" };
            }
            return (
              <button
                key={i}
                disabled={graded}
                onClick={() =>
                  setMultiSel((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  })
                }
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                  !graded && "cursor-pointer hover:border-brand-400",
                )}
                style={style}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
                  style={{ borderColor: isPicked ? "var(--color-brand-500)" : "var(--border)", background: isPicked ? "var(--color-brand-500)" : "transparent" }}
                >
                  {isPicked && <Check size={13} color="#fff" />}
                </span>
                <span className="flex-1">
                  <InlineMarkdown>{opt}</InlineMarkdown>
                </span>
                {graded && isAnswer && !isPicked && (
                  <span className="text-xs font-semibold" style={{ color: "var(--color-brand-600)" }}>
                    missed
                  </span>
                )}
              </button>
            );
          })}
          {!graded && (
            <button
              disabled={multiSel.size === 0}
              onClick={gradeMulti}
              className="mt-2 w-fit cursor-pointer rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit answer
            </button>
          )}
          {graded && multiResult && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              You selected {multiResult.correctPicked} of {multiResult.total} correct option{multiResult.total === 1 ? "" : "s"}.
            </p>
          )}
        </div>
      )}
```

Note: the shared result/explanation block at the bottom of the component already renders for `question.type !== "flashcard"`, so multi automatically gets the "Correct!"/"Not quite." banner (based on the boolean `correct`) plus the explanation. The "You selected X of N" line adds the partial nuance.

- [ ] **Step 5: Thread `score` through `Quiz.tsx`**

In `src/components/quiz/Quiz.tsx`, replace `handleGraded` (currently lines 31-39):

```ts
  function handleGraded(correct: boolean, score?: number) {
    setResults((prev) => {
      const next = [...prev];
      next[index] = correct;
      return next;
    });
    if (q.type === "flashcard") recordFlashcard(topicId, q.id, correct, { isReview });
    else recordAnswer(topicId, q.id, correct, { isReview, score });
  }
```

- [ ] **Step 6: Thread `score` through `ChallengePage.tsx` Runner**

In `src/pages/ChallengePage.tsx`, replace `handleGraded` inside `Runner` (currently lines 188-193):

```ts
  function handleGraded(correct: boolean, score?: number) {
    setGraded(true);
    if (correct) setCorrectCount((c) => c + 1);
    if (current.question.type === "flashcard") recordFlashcard(current.topic.meta.id, current.question.id, correct);
    else recordAnswer(current.topic.meta.id, current.question.id, correct, { score });
  }
```

- [ ] **Step 7: Thread `score` through `ReviewPage.tsx`**

In `src/pages/ReviewPage.tsx`, replace `handleGraded` (currently lines 38-43):

```ts
  function handleGraded(correct: boolean, score?: number) {
    setGraded(true);
    if (correct) setFixed((f) => f + 1);
    if (current.question.type === "flashcard") recordFlashcard(current.topic.meta.id, current.question.id, correct, { isReview: true });
    else recordAnswer(current.topic.meta.id, current.question.id, correct, { isReview: true, score });
  }
```

- [ ] **Step 8: Verify build**

Run: `npx tsc -b` — Expected: exits 0. Then `npm run build` — Expected: succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/components/quiz/QuestionCard.tsx src/components/quiz/Quiz.tsx src/pages/ChallengePage.tsx src/pages/ReviewPage.tsx
git commit -m "feat: render multi-select questions with partial-credit grading"
```

---

## Task 3: Example multi question + author-topic skill docs

**Files:**
- Modify: `src/content/topics/optionals/quiz.ts`
- Modify: `.claude/skills/author-topic/SKILL.md`

- [ ] **Step 1: Add a `multi` question to the optionals quiz**

In `src/content/topics/optionals/quiz.ts`, insert this object into the `quiz` array immediately before the final flashcard entry (`id: "explain-optionals-flashcard"`, currently line 84). Add a trailing comma after the previous object if needed:

```ts
  {
    id: "optional-truths-multi",
    type: "multi",
    prompt: "Select **all** statements about Swift optionals that are correct.",
    options: [
      "`T?` is shorthand for `Optional<T>`",
      "`Optional` is an enum with `.some` and `.none` cases",
      "A non-optional `Int` can hold `nil`",
      "`if let` and `guard let` both unwrap optionals",
    ],
    answers: [0, 1, 3],
    explanation:
      "`T?` is sugar for the `Optional<T>` enum (`.some`/`.none`), and both `if let` and `guard let` unwrap it. A **non-optional** type can never hold `nil` — that is the entire point of optionals, so option 3 is false.",
  },
```

- [ ] **Step 2: Verify the example renders**

Run: `npx tsc -b` — Expected: exits 0. Then `npm run build` — Expected: succeeds. Then start the dev server and open the optionals quiz to confirm the multi question renders with checkboxes, grades partially, and shows "You selected X of N".

Run: `npm run dev` (server on port 5174), navigate to `/learn/optionals`, scroll to the quiz, answer the multi question with a partial selection.
Expected: checkboxes toggle independently; Submit disabled until ≥1 checked; after submit, correct picks show green, missed correct options show "missed", wrong picks show red, and the "You selected X of N" line appears.

- [ ] **Step 3: Document the `multi` type in the author-topic skill**

In `.claude/skills/author-topic/SKILL.md`, update the frontmatter `description` (line 3) to mention multi — change the parenthetical `(mcq/predict/fill/flashcard)` to `(mcq/predict/fill/flashcard/multi)`.

Change the heading "### The four question types" (line 70) to "### The five question types".

Then insert this subsection immediately after the `fill` example block (after its closing ``` fence, currently line 107) and before the `flashcard` heading:

````md
**`multi`** — "select all that apply". Like `mcq` but `answers` is an array of every correct 0-based index (one or more). Grading is partial-credit: score = (correct picks − wrong picks, floored at 0) ÷ number of correct answers; it only counts as a full pass at 100%.
```ts
{
  id: "value-type-traits",
  type: "multi",
  prompt: "Select all statements that are true of Swift structs.",
  options: ["They are value types", "Assignment copies them", "They support inheritance", "They can conform to protocols"],
  answers: [0, 1, 3],
  explanation: "Structs are copied value types that can conform to protocols, but they do **not** support inheritance (only classes do).",
}
```
````

Also update the checklist line (currently line 140) from:

```md
- [ ] Quiz has a mix of types (aim for all four), each with a clear `explanation`.
```

to:

```md
- [ ] Quiz has a mix of types (aim for all five), each with a clear `explanation`.
```

- [ ] **Step 4: Commit**

```bash
git add src/content/topics/optionals/quiz.ts .claude/skills/author-topic/SKILL.md
git commit -m "docs: add multi-select example question and author-topic guidance"
```

---

## Task 4: Mastery tier helper

**Files:**
- Create: `src/lib/mastery.ts`

- [ ] **Step 1: Create the mastery helper**

Create `src/lib/mastery.ts` with:

```ts
import type { ProgressState } from "../game/store";

export type MasteryTier = "not-started" | "learning" | "proficient" | "mastered";

export const MASTERY_TIERS: MasteryTier[] = ["not-started", "learning", "proficient", "mastered"];

const TIER_LABEL: Record<MasteryTier, string> = {
  "not-started": "Not started",
  learning: "Learning",
  proficient: "Proficient",
  mastered: "Mastered",
};

// Sequential slate-indigo shades; mastered uses the positive "ok" token.
const TIER_COLOR: Record<MasteryTier, string> = {
  "not-started": "var(--border)",
  learning: "var(--color-brand-300)",
  proficient: "var(--color-brand-500)",
  mastered: "var(--ok)",
};

export interface MasteryInfo {
  tier: MasteryTier;
  label: string;
  color: string;
  /** 0..1 over answered questions in the topic; 0 when none answered */
  accuracy: number;
  answered: number;
}

export function masteryLabel(tier: MasteryTier): string {
  return TIER_LABEL[tier];
}

export function masteryColor(tier: MasteryTier): string {
  return TIER_COLOR[tier];
}

export function topicMastery(state: ProgressState, topicId: string): MasteryInfo {
  const prefix = `${topicId}::`;
  let answered = 0;
  let correct = 0;
  for (const [key, rec] of Object.entries(state.answered)) {
    if (key.startsWith(prefix)) {
      answered++;
      if (rec.correct) correct++;
    }
  }
  const hasWrong = Object.values(state.wrongLog).some((w) => w.topicId === topicId);
  const accuracy = answered > 0 ? correct / answered : 0;

  let tier: MasteryTier;
  if (answered === 0) tier = "not-started";
  else if (accuracy >= 1 && !hasWrong) tier = "mastered";
  else if (accuracy >= 0.8) tier = "proficient";
  else tier = "learning";

  return { tier, label: TIER_LABEL[tier], color: TIER_COLOR[tier], accuracy, answered };
}
```

Note: `ProgressState` is exported as an interface from `src/game/store.tsx`; this is a type-only import, so no runtime cycle is introduced.

- [ ] **Step 2: Verify build**

Run: `npx tsc -b` — Expected: exits 0. Then `npm run build` — Expected: succeeds. (The module is unused so far; this confirms it type-checks.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/mastery.ts
git commit -m "feat: add per-topic mastery tier helper"
```

---

## Task 5: Mastery indicator in the sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Update imports**

In `src/components/Sidebar.tsx`, change the lucide import (line 3) to swap the topic-status icons for tier icons (keep the nav icons):

```ts
import { Search, Bookmark, LayoutGrid, RotateCcw, Swords, X, Circle, CircleDashed, CircleDot, CheckCircle2 } from "lucide-react";
```

Add the mastery import after the store import (after line 6):

```ts
import { topicMastery, type MasteryTier } from "../lib/mastery";
```

- [ ] **Step 2: Add a tier→icon map**

In `src/components/Sidebar.tsx`, after the `ALL_DIFF` constant (line 9), add:

```ts
const TIER_ICON: Record<MasteryTier, typeof Circle> = {
  "not-started": Circle,
  learning: CircleDashed,
  proficient: CircleDot,
  mastered: CheckCircle2,
};
```

- [ ] **Step 3: Replace the per-topic status icon**

In `src/components/Sidebar.tsx`, inside the `g.topics.map((t) => { ... })` block, replace the `completed`/`perfect` computation and the icon JSX. The current code is:

```tsx
                  const completed = !!state.completedTopics[t.meta.id];
                  const perfect = (state.completedTopics[t.meta.id]?.bestScore ?? 0) >= 1;
                  return (
```

Replace those two `const` lines with:

```tsx
                  const mastery = topicMastery(state, t.meta.id);
                  const TierIcon = TIER_ICON[mastery.tier];
                  return (
```

Then replace the icon block (currently lines 137-143):

```tsx
                      {perfect ? (
                        <Star size={15} className="shrink-0" fill="var(--color-brand-500)" color="var(--color-brand-500)" />
                      ) : completed ? (
                        <CheckCircle2 size={15} className="shrink-0" color="var(--ok)" />
                      ) : (
                        <Circle size={15} className="shrink-0" style={{ color: "var(--border)" }} />
                      )}
```

with:

```tsx
                      <span className="flex shrink-0" title={`${mastery.label}${mastery.answered > 0 ? ` · ${Math.round(mastery.accuracy * 100)}%` : ""}`}>
                        <TierIcon size={15} color={mastery.color} />
                      </span>
```

(The `Star` import is no longer used — it was already removed from the import list in Step 1.)

- [ ] **Step 4: Verify build and appearance**

Run: `npx tsc -b` — Expected: exits 0 (and confirms no unused `Star`/leftover references). Then `npm run build` — Expected: succeeds.

Run: `npm run dev`, open the app. Expected: each sidebar topic shows a tier icon (hollow circle = not started; dashed = learning; dotted = proficient; check = mastered), with a tooltip showing the tier and accuracy.

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: show mastery tier per topic in the sidebar"
```

---

## Task 6: Mastery breakdown on the dashboard

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Update imports**

In `src/pages/Dashboard.tsx`, add `useMemo` to the react import — the file currently imports only from other modules, so add at the top (line 1 area):

```ts
import { useMemo } from "react";
```

Add `Layers` to the direct lucide import (line 4):

```ts
import { ArrowRight, Star, Target, CheckCircle2, Zap, RotateCcw, Trophy, Lock, Layers } from "lucide-react";
```

Add the mastery import after the badges import (after line 8):

```ts
import { topicMastery, masteryColor, masteryLabel, MASTERY_TIERS, type MasteryTier } from "../lib/mastery";
```

- [ ] **Step 2: Compute mastery counts**

In `src/pages/Dashboard.tsx`, inside the `Dashboard` component after `const groups = groupedByCategory();` (line 30), add:

```ts
  const masteryCounts = useMemo(() => {
    const counts: Record<MasteryTier, number> = { "not-started": 0, learning: 0, proficient: 0, mastered: 0 };
    for (const t of TOPICS) counts[topicMastery(state, t.meta.id).tier]++;
    return counts;
  }, [state]);
```

- [ ] **Step 3: Add the mastery section**

In `src/pages/Dashboard.tsx`, insert this `motion.section` immediately after the closing `</motion.section>` of the stats grid (the block that ends right before `{/* category progress */}`, currently line 95):

```tsx
      {/* mastery breakdown */}
      <motion.section
        {...fadeUp(0.12)}
        className="mt-5 rounded-2xl border p-5"
        style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <Layers size={18} color="var(--color-brand-500)" />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Mastery
          </h2>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
          {MASTERY_TIERS.map((tier) => {
            const n = masteryCounts[tier];
            if (n === 0 || TOTAL_TOPICS === 0) return null;
            return (
              <div
                key={tier}
                style={{ width: `${(n / TOTAL_TOPICS) * 100}%`, background: masteryColor(tier) }}
                title={`${masteryLabel(tier)}: ${n}`}
              />
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MASTERY_TIERS.map((tier) => (
            <div key={tier} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: masteryColor(tier), border: "1px solid var(--border)" }} />
              <span style={{ color: "var(--text-muted)" }}>{masteryLabel(tier)}</span>
              <span className="ml-auto font-bold">{masteryCounts[tier]}</span>
            </div>
          ))}
        </div>
      </motion.section>
```

- [ ] **Step 4: Verify build and appearance**

Run: `npx tsc -b` — Expected: exits 0. Then `npm run build` — Expected: succeeds.

Run: `npm run dev`, open `/`. Expected: a "Mastery" card appears under the stats row with a stacked bar and a four-tier legend showing counts that sum to the total topic count.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: add mastery breakdown card to the dashboard"
```

---

## Task 7: Export / import store API

**Files:**
- Modify: `src/game/store.tsx`

- [ ] **Step 1: Add method signatures to `ProgressApi`**

In `src/game/store.tsx`, add these two members to the `ProgressApi` interface (after `resetAll` on line 80):

```ts
  exportState: () => ProgressState;
  importState: (parsed: unknown) => boolean;
```

- [ ] **Step 2: Implement the two methods**

In `src/game/store.tsx`, after the `resetAll` `useCallback` (currently lines 239-241), add:

```ts
  const exportState = useCallback(() => ref.current, []);

  const importState = useCallback(
    (parsed: unknown): boolean => {
      if (!parsed || typeof parsed !== "object") return false;
      const p = parsed as Record<string, unknown>;
      if (typeof p.version !== "number") return false;
      const required = [
        "xp",
        "completedTopics",
        "answered",
        "wrongLog",
        "bookmarks",
        "badges",
        "totalCorrect",
        "totalAnswered",
        "redemptions",
      ];
      for (const k of required) {
        if (!(k in p)) return false;
      }
      const next = { ...emptyState(), ...(parsed as Partial<ProgressState>), version: VERSION };
      commit(next);
      return true;
    },
    [commit],
  );
```

- [ ] **Step 3: Expose them on the api object**

In `src/game/store.tsx`, add `exportState` and `importState` to the returned `api` object inside `useMemo` (after `resetAll,` on line 251):

```ts
      resetAll,
      exportState,
      importState,
```

And add them to the `useMemo` dependency array (currently line 268) so it reads:

```ts
  }, [recordAnswer, recordFlashcard, completeTopic, toggleBookmark, resetAll, exportState, importState, ref.current]);
```

- [ ] **Step 4: Verify build**

Run: `npx tsc -b` — Expected: exits 0. Then `npm run build` — Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/game/store.tsx
git commit -m "feat: add exportState/importState to progress store"
```

---

## Task 8: Backup section in Settings

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Update imports and pull new store methods**

In `src/pages/SettingsPage.tsx`, add `Download`, `Upload` to the lucide import (line 2):

```ts
import { Moon, Sun, Trash2, AlertTriangle, Database, Star, Trophy, Target, Download, Upload } from "lucide-react";
```

Add `useRef` to the react import (line 1):

```ts
import { useRef, useState } from "react";
```

Change the destructure of `useProgress` (line 8) to include the new methods:

```ts
  const { state, level, resetAll, exportState, importState } = useProgress();
```

- [ ] **Step 2: Add export/import handlers and state**

In `src/pages/SettingsPage.tsx`, after `const [confirming, setConfirming] = useState(false);` (line 9), add:

```ts
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handleExport() {
    const data = JSON.stringify(exportState(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codequest-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        setImportMsg({ ok: false, text: "That file isn’t valid JSON." });
        return;
      }
      if (!window.confirm("Import will replace ALL current progress in this browser. Continue?")) return;
      const ok = importState(parsed);
      setImportMsg(
        ok
          ? { ok: true, text: "Progress imported successfully." }
          : { ok: false, text: "That file isn’t a valid CodeQuest backup." },
      );
    };
    reader.onerror = () => setImportMsg({ ok: false, text: "Could not read that file." });
    reader.readAsText(file);
  }
```

- [ ] **Step 3: Add the Backup section**

In `src/pages/SettingsPage.tsx`, insert this `<Section>` immediately before the `{/* danger zone */}` comment (currently line 48):

```tsx
      {/* backup */}
      <Section title="Backup">
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Progress lives only in this browser. Export a backup to move it to another device, then import it there.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:border-brand-400"
              style={{ borderColor: "var(--border)" }}
            >
              <Download size={16} /> Export progress
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:border-brand-400"
              style={{ borderColor: "var(--border)" }}
            >
              <Upload size={16} /> Import progress
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          </div>
          {importMsg && (
            <p className="text-sm font-medium" style={{ color: importMsg.ok ? "var(--ok-strong)" : "var(--bad-strong)" }}>
              {importMsg.text}
            </p>
          )}
        </div>
      </Section>
```

- [ ] **Step 4: Verify build and behavior**

Run: `npx tsc -b` — Expected: exits 0. Then `npm run build` — Expected: succeeds.

Run: `npm run dev`, open `/settings`. Expected: a "Backup" section with Export and Import buttons. Clicking Export downloads a `codequest-progress-YYYY-MM-DD.json`. Importing that file shows the confirm dialog, then "Progress imported successfully." Importing a non-JSON or unrelated file shows a red error and changes nothing.

- [ ] **Step 5: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "feat: add progress export/import to settings"
```

---

## Task 9: Command palette component

**Files:**
- Create: `src/components/CommandPalette.tsx`

- [ ] **Step 1: Create the palette component**

Create `src/components/CommandPalette.tsx` with:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Search, LayoutGrid, Swords, RotateCcw, Bookmark, Settings, SunMoon, FileText, CornerDownLeft } from "lucide-react";
import { TOPICS } from "../content/registry";
import { useTheme } from "../theme/ThemeContext";

interface Item {
  id: string;
  label: string;
  sub?: string;
  group: "Actions" | "Topics";
  icon: React.ComponentType<{ size?: number }>;
  keywords: string;
  run: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K toggles; a custom event lets other components open it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("cq:open-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cq:open-palette", onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const close = () => setOpen(false);
    const actions: Item[] = [
      { id: "go-dashboard", label: "Dashboard", group: "Actions", icon: LayoutGrid, keywords: "dashboard home", run: () => { navigate("/"); close(); } },
      { id: "go-challenge", label: "Challenge", group: "Actions", icon: Swords, keywords: "challenge quiz random", run: () => { navigate("/challenge"); close(); } },
      { id: "go-review", label: "Review", group: "Actions", icon: RotateCcw, keywords: "review missed drill", run: () => { navigate("/review"); close(); } },
      { id: "go-bookmarks", label: "Bookmarks", group: "Actions", icon: Bookmark, keywords: "bookmarks saved", run: () => { navigate("/bookmarks"); close(); } },
      { id: "go-settings", label: "Settings", group: "Actions", icon: Settings, keywords: "settings preferences backup", run: () => { navigate("/settings"); close(); } },
      { id: "toggle-theme", label: "Toggle theme", group: "Actions", icon: SunMoon, keywords: "theme dark light mode", run: () => { toggle(); close(); } },
    ];
    const topics: Item[] = TOPICS.map((t) => ({
      id: `topic-${t.meta.id}`,
      label: t.meta.title,
      sub: t.meta.summary,
      group: "Topics",
      icon: FileText,
      keywords: `${t.meta.title} ${t.meta.summary} ${(t.meta.tags ?? []).join(" ")}`.toLowerCase(),
      run: () => { navigate(`/learn/${t.meta.id}`); close(); },
    }));
    return [...actions, ...topics];
  }, [navigate, toggle]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.label.toLowerCase().includes(q) || it.keywords.includes(q));
  }, [items, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl"
            style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
            initial={{ scale: 0.96, y: -8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b px-4" style={{ borderColor: "var(--border)" }}>
              <Search size={16} style={{ color: "var(--text-muted)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search topics and actions…"
                className="w-full bg-transparent py-3.5 text-sm outline-none"
                style={{ color: "var(--text)" }}
              />
            </div>
            <div className="max-h-[52vh] overflow-y-auto py-2">
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  No matches.
                </p>
              )}
              {filtered.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                const Icon = it.icon;
                const isActive = i === active;
                return (
                  <div key={it.id}>
                    {header && (
                      <p className="px-4 pb-1 pt-2 text-[0.65rem] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        {header}
                      </p>
                    )}
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={it.run}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm"
                      style={isActive ? { background: "color-mix(in srgb, var(--color-brand-500) 12%, transparent)" } : undefined}
                    >
                      <Icon size={16} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium" style={{ color: "var(--text)" }}>
                          {it.label}
                        </span>
                        {it.sub && (
                          <span className="block truncate text-xs" style={{ color: "var(--text-muted)" }}>
                            {it.sub}
                          </span>
                        )}
                      </span>
                      {isActive && <CornerDownLeft size={14} style={{ color: "var(--text-muted)" }} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc -b` — Expected: exits 0. Then `npm run build` — Expected: succeeds. (Not mounted yet — this just confirms it compiles.)

- [ ] **Step 3: Commit**

```bash
git add src/components/CommandPalette.tsx
git commit -m "feat: add global command palette component"
```

---

## Task 10: Mount the palette + TopBar hint

**Files:**
- Modify: `src/components/Layout.tsx`
- Modify: `src/components/TopBar.tsx`

- [ ] **Step 1: Mount the palette in Layout**

In `src/components/Layout.tsx`, add the import after the `RewardLayer` import (line 6):

```ts
import { CommandPalette } from "./CommandPalette";
```

Then render it next to `<RewardLayer />` (currently line 50) — change:

```tsx
      <RewardLayer />
    </div>
```

to:

```tsx
      <RewardLayer />
      <CommandPalette />
    </div>
```

- [ ] **Step 2: Add a search hint button to the TopBar**

In `src/components/TopBar.tsx`, add `Search` to the lucide import (line 2):

```ts
import { Moon, Sun, Settings, Menu, Star, Search } from "lucide-react";
```

Then insert this button immediately after `<div className="flex-1" />` (currently line 31), before the level/xp `<Link>`:

```tsx
      <button
        onClick={() => window.dispatchEvent(new Event("cq:open-palette"))}
        className="hidden cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:border-brand-400 sm:flex"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        title="Search (Cmd/Ctrl + K)"
      >
        <Search size={14} />
        <span className="hidden md:inline">Search</span>
        <kbd className="rounded px-1 text-[0.65rem]" style={{ background: "color-mix(in srgb, var(--text) 8%, transparent)" }}>⌘K</kbd>
      </button>
```

- [ ] **Step 3: Verify build and behavior**

Run: `npx tsc -b` — Expected: exits 0. Then `npm run build` — Expected: succeeds.

Run: `npm run dev`. Expected:
- Pressing Ctrl+K (or ⌘K) opens the palette overlay from any page; Esc / backdrop click closes it.
- Typing filters topics and actions; ↑/↓ move the highlight; Enter navigates or toggles theme.
- The TopBar "Search ⌘K" button opens the same palette.

Note (preview caveat from CLAUDE.md): React Router client nav is not triggered by a raw DOM click in the Preview MCP. To verify palette navigation in preview, drive it with `preview_eval` or test key behavior manually; the `npm run build` gate is the authoritative check.

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout.tsx src/components/TopBar.tsx
git commit -m "feat: mount command palette and add topbar search hint"
```

---

## Final verification

- [ ] **Full build:** `npx tsc -b && npm run build` — Expected: both succeed with exit 0.
- [ ] **Smoke test in dev** (`npm run dev`, port 5174):
  - Optionals quiz multi question grades partially and awards partial XP (watch the XP toast).
  - Sidebar shows mastery tier icons; answering questions moves a topic through tiers.
  - Dashboard mastery card counts sum to total topics.
  - Settings export downloads JSON; import replaces progress after confirm; bad file shows an error.
  - ⌘K palette opens, filters, navigates, toggles theme; TopBar hint opens it.
- [ ] **Update CLAUDE.md** if desired: note the new `multi` question type and the command palette (optional, out of strict scope — confirm with the user).

---

## Notes for the implementer

- **DRY:** `topicMastery` is the single source of tier logic — Sidebar and Dashboard both call it; do not re-derive tiers inline.
- **YAGNI:** no partial credit for mcq/predict/fill, no question-level palette indexing, no import-merge, no mastery decay. Do not add them.
- **Design system:** every color above is an existing CSS token or a `color-mix` of one. Do not introduce new hex values.
- **Storage version stays 1** — `score` is transient and never written to `AnswerRecord`.
