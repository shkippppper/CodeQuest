---
name: author-topic
description: Author a new CodeQuest learning topic (lesson + quiz). Use when adding Swift interview-prep content — creating or editing a topic folder under src/content/topics, writing explanation.md lessons, or writing quiz.ts questions (mcq/predict/fill/flashcard/multi).
---

# Authoring a CodeQuest topic

A topic is a self-contained folder under `src/content/topics/<slug>/`. The registry auto-discovers it via `import.meta.glob` — there is **no registration step**. Create the three files correctly and the topic appears in the sidebar, dashboard, category progress, and the Challenge question pool automatically.

```
src/content/topics/<slug>/
├── meta.ts          # metadata: where it sits, how hard, how long
├── explanation.md   # the lesson — plain Markdown imported as a raw string
└── quiz.ts          # the question array
```

**All lessons follow `docs/STYLE_GUIDE.md` (step-by-step code narration).** Read it plus the gold-standard exemplar `arc/explanation.md` before writing a new lesson.

## Step 1 — `meta.ts`

```ts
import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "value-vs-reference",          // MUST equal the folder name; used in the URL /learn/<id>
  title: "Value vs Reference Types",
  category: "language",               // "language" | "concurrency" | "ui" | "architecture"
  difficulty: "junior",               // "junior" | "mid" | "senior"
  order: 2,                           // sort order WITHIN its category (1-based)
  summary: "How structs and classes differ in identity, copying, and mutation.",
  est: 10,                            // estimated minutes to read + quiz
  tags: ["struct", "class", "copy-on-write"],
};

export default meta;
```

Rules:
- `id` must match the folder name exactly.
- `order` is per-category. Check sibling topics so two don't collide.
- `difficulty` drives the sidebar dot, the difficulty filter, and Challenge-mode bucketing.

## Step 2 — `explanation.md`

Plain Markdown, imported with `?raw`. **Do not use MDX/JSX** — Swift's `<>` generics and `{}` closures break JSX parsing. Write normal Markdown only.

**The writing style is defined in `docs/STYLE_GUIDE.md` — follow it exactly** (code before prose, examples that grow line by line, one idea per paragraph, no jargon before a plain-words definition, predict-then-reveal moments, bold only first-use terms, full depth kept). The exemplar to copy is `src/content/topics/arc/explanation.md`.

Mechanical conventions:
- Open with the *problem* the feature solves, not the definition.
- Use `## H2` for major sections and `### H3` for sub-sections — these auto-generate the right-hand table of contents and scroll-spy, so write plain-statement headings.
- Fence Swift with ` ```swift `. Snippets get Shiki highlighting, copy, and a "Run in SwiftFiddle" button.
- To show expected console output under a snippet, use a fenced block tagged ` ```output ` or ` ```console ` — it renders as a muted output panel instead of an editor.
- Close with an `## Interview lens` section written as plain direct advice.

## Step 3 — `quiz.ts`

```ts
import type { Question } from "../../types";

const quiz: Question[] = [
  // ... questions ...
];

export default quiz;
```

Every question needs a unique `id` (within the file), a `prompt` (Markdown), and an `explanation` (Markdown, shown after answering). Optional: `code` (a Swift snippet rendered with the question) and `difficulty` (overrides the topic's difficulty for Challenge-mode bucketing — usually omit).

### The five question types

**`mcq`** — concept check. `answer` is the 0-based index into `options`.
```ts
{
  id: "struct-copy",
  type: "mcq",
  prompt: "What happens when you assign a struct value to a new variable?",
  options: ["A reference is shared", "The value is copied", "It throws", "Nothing until mutated"],
  answer: 1,
  explanation: "Structs are **value types** — assignment copies. The two variables are independent.",
}
```

**`predict`** — "what does this print / what's the result". Same shape as `mcq` plus a `code` snippet; options render in monospace.
```ts
{
  id: "mutate-copy",
  type: "predict",
  prompt: "What is printed?",
  code: `var a = Point(x: 1)\nvar b = a\nb.x = 99\nprint(a.x)`,
  options: ["1", "99", "Compile error", "nil"],
  answer: 0,
  explanation: "`b` is a copy, so mutating it leaves `a` untouched. Prints `1`.",
}
```

**`fill`** — type the keyword/term. `answers` lists every acceptable string (matched case-insensitively, trimmed, trailing semicolon stripped). Add a `hint`.
```ts
{
  id: "cow-keyword",
  type: "fill",
  prompt: "Arrays use ___-on-write to avoid copying until a mutation happens.",
  answers: ["copy"],
  hint: "Two words, hyphenated with 'on-write'.",
  explanation: "Copy-on-write defers the actual copy until the first mutation.",
}
```

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

**`flashcard`** — open recall, self-graded. Provide a `modelAnswer` (Markdown "back" of the card) and `keyPoints` the learner should have hit.
```ts
{
  id: "explain-cow",
  type: "flashcard",
  prompt: "Explain copy-on-write and why Swift uses it. Answer aloud, then reveal.",
  modelAnswer: "**Copy-on-write (COW)** stores a value type's buffer by reference internally and only makes a real copy when a unique-ref check fails on mutation…",
  keyPoints: [
    "Value semantics preserved for the caller",
    "Buffer shared until first mutation",
    "Uniqueness checked with isKnownUniquelyReferenced",
  ],
  explanation: "A senior answer stresses value semantics preserved despite a shared buffer.",
}
```

### Writing options — avoid the length tell

For `mcq`, `predict`, and `multi`, **do not let the correct answer be the longest option.** A learner who spots that the longest choice is always right stops reading the Swift and just picks by length. Write each distractor to be **as long as or longer than the correct answer** — some can be short, but the correct one must never be the systematically longest. Make wrong options plausible and specific (a real-sounding but incorrect reason), not obviously-throwaway stubs like "It throws" next to a full sentence. The `answer` index can sit anywhere; a render-time shuffle varies the on-screen position, so balance by *length*, not by slot.

### Swift code in quiz strings — gotcha

`code`, `prompt`, etc. are usually written as template literals (backtick strings) so newlines are easy. Swift string interpolation `\(...)` and JS template `${...}` both use braces — **a literal `${` or a backtick inside the Swift code will break the JS template literal.** If your snippet contains those, use `\n`-joined regular `"..."` strings or escape carefully. The existing quizzes avoid backticks/`${` inside snippets for this reason.

## Step 4 — verify

```bash
npm run build   # tsc -b + vite build — catches type errors and bad imports
npm run dev     # eyeball the topic page, take the quiz, check the ToC
```

Checklist before calling it done:
- [ ] Folder name == `meta.id`.
- [ ] `order` doesn't clash with a sibling in the same category.
- [ ] Lesson passes the self-check list at the bottom of `docs/STYLE_GUIDE.md`.
- [ ] Lesson opens with the problem, uses `##`/`###` headings, ends with an interview lens.
- [ ] Quiz has a mix of types (aim for all five), each with a clear `explanation`.
- [ ] `npm run build` passes.
