# Interview Simulator — Design

> Status: approved (2026-07-15). A timed, scored mock-interview mode for CodeQuest,
> reusing the existing quiz engine. Scoped to the active subject.

## Goal

Add an **Interview Simulator**: a 10-question, per-question-timed mock interview that
ends in an interview-style **scorecard + verdict**. It should feel like a real screen —
pressure, no going back, a summary of how you did — rather than a relaxed quiz. Flashcards
gain a 3D **flip** animation (global, not simulator-only).

## Locked decisions

- **Round shape**: fixed **10 questions**, random difficulty/category, from the **active subject** (`sampleQuestions(10, "mixed", subject)`).
- **Timing**: **per-question countdown**. On expiry the question auto-grades **incorrect** and reveals the answer. After grading, the timer stops; the user reads the explanation and clicks **Next** (last → scorecard).
- **Recording**: simulator answers record to progress exactly like Challenge (`recordAnswer`/`recordFlashcard`) → XP, badges, and the Review queue all keep working. **Timeouts count as wrong** and therefore enter Review.
- **Flashcard flip**: global enhancement to `QuestionCard` (flashcards flip everywhere), not gated to the simulator.
- **No unit tests** (personal-project preference) — verify by running the round in the browser.

## Current architecture (facts, with paths)

- `src/pages/ChallengePage.tsx` — the closest existing flow: `config` → `run` (a `Runner` that steps through `FlatQuestion[]`, records via `useProgress`, shows Next) → `done` (score screen). The Simulator mirrors this shape.
- `src/components/quiz/QuestionCard.tsx` — renders + grades all 5 question types; calls `onGraded(correct, score?)` exactly once. Flashcard branch: "Reveal answer" → model answer + keyPoints → "Need more review" / "I knew it".
- `src/content/registry.ts` — `sampleQuestions(count, difficulty, subject?)` returns `FlatQuestion[]` (`{ topic, question, difficulty }`); already subject-aware.
- `src/game/store.tsx` — `useProgress()` with `recordAnswer(topicId, qId, correct, opts)` and `recordFlashcard(topicId, qId, knewIt, opts)`. XP/badges/wrongLog handled inside.
- `src/game/subject.tsx` — `useSubject()` gives the active `subject`.
- `src/App.tsx` — routes; `src/components/Sidebar.tsx` — primary nav (`SideLink`); `src/pages/Dashboard.tsx` — hero entry points.
- Animation lib: **motion/react** (Framer Motion) is already used across pages.

## Components & changes

### 1. `QuestionCard` — opt-in timer (new prop)

Add an optional prop `timeLimitSec?: number`. Behavior when set:

- Render a slim countdown indicator in the card header (a shrinking bar or a small ring + seconds), colored calm → warning → danger as it runs low.
- Runs only during the answering phase. When it reaches 0 and the question is **not yet graded**, auto-grade **incorrect**:
  - mcq/predict/multi/fill → `grade(false)` (reveals the correct answer highlighting as usual).
  - flashcard → auto-flip to reveal, then `grade(false)` ("need more review").
- Once graded (by the user or by timeout), the timer stops and disappears; the explanation view is untimed.
- When the prop is **absent** (Topic quiz, Challenge, Review), there is no timer — behavior is exactly as today.

Implementation note: a `useEffect` countdown keyed on `question.id`, cleared on grade/unmount. The card already re-mounts per question in runners (via `key`), so timer state resets naturally.

### 2. `QuestionCard` — flashcard flip (global)

Replace the flashcard reveal with a 3D flip:

- A card container with `transform-style: preserve-3d` and a `rotateY(180deg)` toggle on reveal (CSS transition or a motion animation).
- **Front**: the prompt recap / "Answer aloud, then flip." **Back**: `modelAnswer` + the "Did you mention…" key points.
- The existing "Reveal answer" action triggers the flip; the self-grade buttons ("Need more review" / "I knew it") appear after the flip completes.
- Respect `prefers-reduced-motion`: fall back to an instant cross-fade (no rotation) when reduced motion is requested.
- This changes flashcard presentation **everywhere** (Topic quiz, Review, Challenge, Simulator) — intended.

### 3. `SimulatorPage.tsx` (new) + route `/simulator`

Three phases, `useState` machine like `ChallengePage`:

- **Intro**: a framing card — title, one-line rules ("10 questions · timed · from {SUBJECTS[subject].label} · no going back · self-graded flashcards"), a Start button. Pulls the 10 questions on Start.
- **Run**: a `Runner` (local component) that:
  - Holds the `FlatQuestion[]` (snapshot on start), current index, and an accumulating `results` array.
  - Renders the current question in a `QuestionCard` with `timeLimitSec` chosen by type: mcq/predict/fill = 30, multi = 40, flashcard = 45.
  - Measures elapsed time per question (`Date.now()` at mount vs at `onGraded`); infers `timedOut = elapsed >= limit - epsilon`.
  - On `onGraded`, records to progress (`recordFlashcard` for flashcards, else `recordAnswer`) — same as Challenge — and pushes a result `{ correct, difficulty, category, timeMs, timedOut }`.
  - Progress bar + "Question N / 10"; a Next button after grading; last question → scorecard.
- **Scorecard**: computed from `results` (see below).

### 4. `Scorecard` (component within SimulatorPage)

Computed, animated (motion) reveal. Shows:

- **Headline**: verdict tier + overall `correct/10` and accuracy %.
  - Verdict by accuracy: **Strong Hire** ≥ 90%, **Hire** ≥ 75%, **Lean Hire** ≥ 60%, **Keep practicing** < 60%.
- **Time**: total time; count of timed-out questions ("ran out of time on N").
- **By difficulty**: junior / mid / senior — correct/total each (only rows that occurred).
- **By category**: correct/total per category that appeared, using `CATEGORIES[cat].label` + accent.
- **Strongest / weakest area**: best and worst category by accuracy (min 1 question), shown as a one-line takeaway.
- **Actions**: "New interview" (back to Intro, re-draws 10) and "Dashboard".

Note: with 10 random questions some difficulties/categories won't appear — the breakdown only lists what occurred, so it never shows empty 0/0 rows.

### 5. Navigation

- `Sidebar.tsx`: add a `SideLink` to `/simulator` in the primary nav (icon: `Gauge` or `ClipboardCheck`), below Challenge.
- `Dashboard.tsx`: a secondary hero button ("Mock interview") next to the existing CTAs, linking to `/simulator`.
- `App.tsx`: register the `/simulator` route inside the `Layout` route group.

## Data flow

```
SimulatorPage (intro)
  └─ Start → sampleQuestions(10, "mixed", subject) ─┐
Runner (run)                                        │
  ├─ QuestionCard timeLimitSec=byType  ── onGraded ─┤→ recordAnswer/recordFlashcard (XP, badges, review)
  │                                                 └→ results.push({correct,difficulty,category,timeMs,timedOut})
  └─ last question → phase = "scorecard"
Scorecard (scorecard)
  └─ derive verdict + breakdowns from results
```

No new persistent state, no storage-schema change. The Simulator is a transient session; only the per-answer records it writes (via the existing store) persist — identical to Challenge.

## Error / edge handling

- **Fewer than 10 questions in a subject**: `sampleQuestions` already caps at the pool size; the Runner uses `items.length` (not a hard 10) for progress and scoring, so a small subject still works. (SQL has ~260 questions, Swift more — non-issue in practice, but handled.)
- **Empty pool** (shouldn't happen): Intro disables Start if the pool is 0 and shows a note.
- **Reduced motion**: flip and scorecard animations degrade to fades.
- **Navigating away mid-round**: no special handling — the round is abandoned (already-recorded answers stand). Matches Challenge.

## Out of scope (YAGNI)

- Difficulty-arc/structured ordering (you chose fixed-10 random).
- Configurable length or per-question time tuning UI.
- Cross-subject rounds.
- Persisting past interview results / history.
- Spaced repetition, adaptive difficulty (separate parked features).

## Verification plan (browser, no unit tests)

1. `npx tsc -b` + `npx vite build` green.
2. Run a full round on the SQL subject: confirm the per-question timer counts down, and letting it hit 0 auto-fails the question and reveals the answer.
3. Confirm the flashcard flips (and self-grade buttons work post-flip); confirm it still flips in a Topic quiz (global change).
4. Confirm answers recorded: XP moves, a missed question appears in Review (subject-scoped), badges evaluate.
5. Verify scorecard math: correct/10, accuracy %, verdict tier at boundary values, per-difficulty and per-category tallies match the answers given.
6. Check reduced-motion fallback and a mobile-width viewport.
