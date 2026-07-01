# CodeQuest

A gamified, **offline-first** study portal for acing Swift developer interviews — junior fundamentals through mid/senior depth. Each topic is a short lesson → code-driven quiz → worked examples. Users earn XP, level up, and unlock badges. Everything runs in the browser: **no backend, no accounts**, all progress in `localStorage`. Deploys as plain static files.

> This repo lives at `/Users/atitberidze/Desktop/CodeQuest`. Do not confuse it with the unrelated GAOA conference site.

## Tech stack

- **Build**: Vite 6 · **UI**: React 18 + TypeScript · **PM**: npm
- **Styling**: Tailwind CSS 4 — `@import "tailwindcss"` + `@theme` tokens + `@custom-variant dark` (no `tailwind.config.js`; everything is in `src/index.css`)
- **Routing**: React Router DOM 7 (BrowserRouter, NavLink, Routes)
- **Markdown**: react-markdown + remark-gfm (lessons imported as raw `.md` strings)
- **Highlighting**: Shiki via `shiki/core` + `createOnigurumaEngine(import("shiki/wasm"))`. Oniguruma is **required** for Swift — the JS regex engine cannot parse the Swift TextMate grammar. Lazy-loads a ~230 KB gzip WASM chunk on first code render.
- **Animation**: `motion` (Framer Motion) — `import { motion, AnimatePresence } from "motion/react"`
- **Icons**: lucide-react

## Commands

```bash
npm install
npm run dev      # vite dev server
npm run build    # tsc -b && vite build  → dist/
npm run preview  # preview production build
```

Typecheck alone: `npx tsc -b`. Build is ~354 KB gzip main + 230 KB lazy WASM.

## Project structure

```
src/
├── content/
│   ├── types.ts        # Topic/Question types, CATEGORIES, DIFFICULTY_META, CategoryId union
│   ├── registry.ts     # auto-discovers topics via import.meta.glob; sampling helpers for Challenge
│   └── topics/<slug>/  # one folder per topic → meta.ts · explanation.md · quiz.ts
├── components/         # Sidebar, TopBar, Layout, CodeBlock, Markdown, RightToc, RewardLayer, quiz/*
├── pages/              # Dashboard, TopicPage, ChallengePage, ReviewPage, BookmarksPage, SettingsPage, NotFoundPage
├── game/               # store.tsx (localStorage state), levels.ts, badges.ts, rewardBus.ts
├── lib/                # highlighter.ts, cn.ts
├── theme/              # ThemeContext (light/dark)
└── index.css           # design tokens + prose + animations
```

## Content model (how lessons work)

Content is **auto-discovered — no registration step**. `registry.ts` uses `import.meta.glob` to scan `topics/*/{meta.ts,explanation.md,quiz.ts}`, builds the `TOPICS[]` array, sorts by category order then `meta.order`, and derives everything (sidebar, dashboard, Challenge pool, prev/next nav).

**To add a topic**: create `src/content/topics/<slug>/` with three files. It appears everywhere automatically. There is a Claude Code skill that walks through this end to end — `.claude/skills/author-topic/SKILL.md`. Existing topics `optionals` and `async-await` are the quality bar to copy.

- `meta.ts` — `export default` a `TopicMeta`: `{ id, title, category, difficulty, order, summary, est, tags? }`. `id` must equal the folder slug.
- `explanation.md` — the lesson. **Plain Markdown, NOT MDX** (imported `?raw`). This is deliberate: Swift's `<>` generics and `{}` closures break MDX's JSX parser. Use fenced ` ```swift ` blocks. Convention: every lesson ends with an **"Interview lens"** section.
- `quiz.ts` — `export default` a `Question[]`.

### Question types (`src/content/types.ts`)
- `mcq` — multiple choice (`options`, `answer` index)
- `predict` — "predict the output" (`options`, `answer` index)
- `fill` — fill-in-the-blank (`answers[]` matched case-insensitively after trim, optional `hint`)
- `flashcard` — self-graded (`modelAnswer` markdown, optional `keyPoints[]`)

Each question: `{ id, type, prompt, explanation, code?, difficulty? }`. A question's effective difficulty falls back to its topic's `difficulty` when omitted.

### Categories & difficulty (⚠ extend before adding new categories)
`CategoryId` is currently a **closed union**: `"language" | "concurrency" | "ui" | "architecture"`. CURRICULUM.md proposes ~16 finer-grained categories. **Before authoring topics in a new category you must extend the `CategoryId` union AND add an entry to the `CATEGORIES` map** (label, order, blurb, lucide `icon`, `accent` hex) in `types.ts` — otherwise TypeScript fails. `DIFFICULTY_META` maps junior/mid/senior → label + color.

## Gamification (`src/game/`)

- **store.tsx** — the single source of truth. Ref-based store (avoids React StrictMode double-invoke) + `useSyncExternalStore`-style subscription. Persists under `localStorage` key `cq_progress_v1` (VERSION 1). `load()` does `{...emptyState(), ...parsed}` so removed fields in old saves are harmlessly ignored. Exposes `useProgress()` → `{ state, level, reviewCount, recordAnswer, recordFlashcard, completeTopic, resetAll, ... }`. Also tracks bookmarks and an auto-logged **review** list (every missed question).
- **levels.ts** — XP awards: correctFirstTry 15, correctRetry 6, flashcardSelfPass 10, topicComplete 50, perfectTopicBonus 40, reviewRedemption 12. Level curve + rank names.
- **badges.ts** — 12 badges, tiered bronze/silver/gold. `newlyEarned(prev, state)` diffs to fire reward popups. (No streak badges — streak was removed; replacements are `curious_mind` and `completionist`.)
- **rewardBus.ts** — tiny pub/sub; `RewardLayer.tsx` renders XP/level/badge toasts and confetti.

> **The streak feature was intentionally removed** (daily streak, streak bonus XP, streak badges, TopBar pill, Settings stat). Do not reintroduce it unless asked.

## Notable features & pages

- **Learn flow**: `TopicPage` = lesson (Markdown + `RightToc` heading nav) → `Quiz` → examples.
- **Challenge mode** (`ChallengePage`, route `/challenge`): three phases `config → run → done`. Config picks difficulty (junior/mid/senior/**mixed**) with live counts from `countByDifficulty`, and length (10/20/30). `sampleQuestions(count, difficulty)` does Fisher–Yates then slice. `Runner` records answers (no `isReview`), shows a live score + progress bar, calls `onDone(correct, total)`. Done screen shows accuracy, "Flawless!" if perfect.
- **Review** (`/review`): drill every missed question; clearable from Settings.
- **Bookmarks** (`/bookmarks`), **Settings** (`/settings`, theme toggle + progress snapshot + "Clear all history" danger zone), **Dashboard** (`/`, hero + level ring + stats + learning-path progress + achievements grid).

## Design system

- **Sequential single-hue (slate-indigo) palette** — the user explicitly rejected the earlier rainbow look ("too much color, let's do something sequential"). All color lives as CSS token *values* in `src/index.css`, so Tailwind class usages (`text-brand-500`, gradients) adopt the palette automatically. Prefer repointing token values over renaming classes.
  - brand ramp 50→700 indigo (500 = `#4d6699`), quest 400/500/600, `--color-xp`.
  - Semantic feedback tokens: `--ok`/`--ok-strong` (green), `--bad`/`--bad-strong` (red), with light/dark variants. **Use these tokens for correctness UI, not raw hex.**
  - Category accents & difficulty colors are sequential shades of the same hue.
- Light/dark via `ThemeContext` (persisted under `cq_theme`); `.dark` class + `@custom-variant dark`.
- Motion: `fadeUp(delay)` staggered section reveals on Dashboard; AnimatePresence slide between quiz questions; spring on trophies.
- All interactive elements use `cursor-pointer`. Verified responsive at 375×812 (hamburger drawer, reflowing grids).

## Planning docs

- **CURRICULUM.md** — the master content plan: 16 categories, ~150 topics, each with slug, difficulty, build status (✅ `optionals` & `async-await`, ⬜ rest) and a `Sections:` list of lesson "paragraphs". Intended to feed a **separate content-generation session** (details are generated topic-by-topic, not stored in the plan). Includes the CategoryId→code mapping reminder and an implementation checklist.
- **README.md** — public-facing project overview.

## Deployment

Static host (Cloudflare Pages / Netlify / GitHub Pages). Build `npm run build`, output `dist/`. `public/_redirects` has `/* /index.html 200` so client-side routes survive refresh/deep-link.

## Working notes for future sessions

- Preview via the Preview MCP using `.claude/launch.json` (name `codequest`, `npm run dev`, port 5174). React Router client nav isn't triggered by a raw DOM click in preview — use `preview_eval` with `location.href = "/..."` (full reload) to navigate.
- Verify every change with `npx tsc -b` (must exit 0) and `npm run build`.
- When authoring `quiz.ts`, watch the template-literal gotcha: Swift string interpolation `\(...)` and backticks inside a JS template string need escaping.
