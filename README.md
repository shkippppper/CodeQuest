# CodeQuest

A gamified, offline-first study portal for acing Swift developer interviews — from junior fundamentals to mid/senior depth. Each topic is a short lesson, followed by a code-driven quiz and worked examples. You earn XP, level up, and unlock badges as you go.

Everything runs in the browser. There is no backend and no account: all progress lives in `localStorage`, so the app deploys as plain static files (Cloudflare Pages, Netlify, GitHub Pages, anything).

## Highlights

- **Lesson → Quiz → Examples** flow for every topic, with an always-visible topic sidebar.
- **Four question types** — multiple choice, "predict the output", fill-in-the-blank, and self-graded flashcards.
- **Challenge mode** — pulls a random set of questions (10/20/30) from *all* topics, filtered by difficulty (Junior / Mid / Senior) or Mixed.
- **Review system** — every question you miss is logged automatically so you can drill it later; clearable from Settings.
- **Gamification** — XP, levels with ranks, and a 22-badge achievement set.
- **Real Swift syntax highlighting** via Shiki (Oniguruma WASM engine), with copy + "Run in SwiftFiddle" on every snippet.
- **Light / dark themes**, calm sequential single-hue palette, and motion-based animations.

## Tech stack

| Concern | Choice |
|---|---|
| Build | Vite 6 |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS 4 (`@theme` tokens) |
| Routing | React Router DOM 7 |
| Markdown | react-markdown + remark-gfm |
| Highlighting | Shiki (`shiki/core` + Oniguruma) |
| Animation | motion (Framer Motion) |
| Icons | lucide-react |

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build to dist/
npm run preview  # preview the production build
```

## Project structure

```
src/
├── content/
│   ├── types.ts              # Topic/Question types, CATEGORIES, DIFFICULTY_META
│   ├── registry.ts           # auto-discovers topics via import.meta.glob + sampling helpers
│   └── topics/<slug>/        # one folder per topic
│       ├── meta.ts           #   title, category, difficulty, order, summary
│       ├── explanation.md    #   the lesson (plain Markdown, ?raw imported)
│       └── quiz.ts           #   the question array
├── components/               # Sidebar, TopBar, CodeBlock, Markdown, quiz/*, RewardLayer …
├── pages/                    # Dashboard, TopicPage, ChallengePage, ReviewPage, Bookmarks, Settings …
├── game/                     # store (localStorage state), levels, badges, rewardBus
├── lib/                      # highlighter, cn/slugify helpers
├── theme/                    # ThemeContext (light/dark)
└── index.css                 # design tokens + prose + animations
```

## Adding a learning topic

Content is **auto-discovered** — no registration step. Create a folder under `src/content/topics/<slug>/` with three files (`meta.ts`, `explanation.md`, `quiz.ts`) and it appears in the sidebar, dashboard, and Challenge pool automatically.

The repo ships a Claude Code skill that walks through authoring a high-quality topic end to end — see `.claude/skills/author-topic/`. Existing topics (`optionals`, `async-await`) are the quality bar to copy from.

> **Markdown, not MDX.** Lessons are plain `.md` imported as raw strings. This is deliberate: Swift's `<>` generics and `{}` closures break MDX's JSX parser. Write normal Markdown with fenced ` ```swift ` code blocks.

## Deployment (Cloudflare Pages)

- Build command: `npm run build`
- Output directory: `dist`
- `public/_redirects` contains `/* /index.html 200` so client-side routes resolve on refresh/deep-link.

## Notes

- All state is keyed under `cq_progress_v1` in `localStorage`; theme under `cq_theme`. "Clear all history" in Settings wipes progress.
- Swift highlighting requires the Oniguruma engine (the JS regex engine cannot parse the Swift TextMate grammar), which lazy-loads a ~230 KB gzipped WASM chunk on first code render.
