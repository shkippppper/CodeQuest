# Lesson Rewrite: Step-by-Step Code Narration Style

**Date:** 2026-07-08
**Status:** Approved (style, pain points, and depth chosen explicitly by the user)

## Problem

The user is learning Swift through CodeQuest but finds the existing lessons hard to learn from. Diagnosed pain points (all confirmed by the user):

1. **Too dense / packed** — sentences cram several ideas with parentheses and asides.
2. **Jargon before meaning** — terms like "deterministic", "discriminator", "autoclosure" appear before being explained in plain words.
3. **Assumes prior knowledge** — leans on other languages and not-yet-learned topics.
4. **Interview-cram tone** — bold keywords everywhere, written to memorize rather than understand.

## Chosen style: step-by-step code narration

The user compared three candidate styles on the same passage and picked **step-by-step code narration**: minimal prose, tiny code examples that grow line by line, each explained right after you see it.

**Depth decision:** keep **everything** — all senior nuances and the closing "Interview lens" section survive; only the delivery changes.

## Deliverables

1. `docs/STYLE_GUIDE.md` — the rewrite bible every authoring agent follows (rules + before/after examples + checklist).
2. `src/content/topics/arc/explanation.md` rewritten by the lead session as the gold-standard exemplar, referenced from the guide.
3. All 73 existing `explanation.md` files rewritten by parallel agents (~8 topics per agent). Agents touch **only** `explanation.md`; `meta.ts` and `quiz.ts` stay untouched.
4. Housekeeping: CURRICULUM.md stale status marks fixed, CLAUDE.md and `.claude/skills/author-topic` updated to point at the style guide.
5. Remaining ~85 planned topics from CURRICULUM.md created in the new style (requires extending `CategoryId` union in `src/content/types.ts` first for new categories).

## Out of scope

- `explanation` fields inside `quiz.ts` (short 1–3 sentence blurbs; different beast — revisit only if the user asks).
- Any UI/component changes.
- Quiz content changes for existing topics.

## Verification

- `npx tsc -b` exits 0 and `npm run build` succeeds after each phase.
- Spot-check a sample of rewritten lessons against the guide's checklist.
- Lesson headings must remain `##`-level so RightToc navigation keeps working.
