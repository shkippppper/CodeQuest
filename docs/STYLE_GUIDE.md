# CodeQuest Lesson Style Guide

**Every `explanation.md` in this project follows this guide.** It exists because the original lessons were dense, jargon-heavy, and written like interview flashcards. The learner reading these lessons is smart but *new to the topic* — the goal is that they genuinely understand, not that they memorize.

The gold-standard exemplar is [`src/content/topics/arc/explanation.md`](../src/content/topics/arc/explanation.md). When in doubt, copy its feel.

## The core style: step-by-step code narration

The lesson is a guided walk through small, growing code examples. Code appears **first**, in tiny pieces; prose narrates what just happened. The reader should feel like they're watching the code run.

### Rule 1 — Code enters before prose

Never explain a concept in the abstract and then show code. Show 1–5 lines of code, then explain exactly what those lines do. Every concept gets introduced through an example the reader just saw.

**Bad (prose first, abstract):**
> Deallocation is deterministic: it happens immediately when the last strong reference disappears, and the object's `deinit` runs at that exact moment (synchronously, on the current thread).

**Good (code first, narrated):**
> ```swift
> var a: Person? = Person(name: "Ada")
> a = nil   // deinit runs on THIS line
> ```
> The moment the last variable pointing at Ada goes away, Swift destroys the object — right there on that line, not "sometime later". The `deinit` method runs at that exact moment.

### Rule 2 — Examples grow line by line

Start with the smallest possible snippet. Narrate it. Add a line or two. Show it again with the new lines. Never dump 15+ lines of code followed by one paragraph explaining it all.

When re-showing grown code, use comments to mark what's new or what each line does to hidden state:

```swift
var a: Person? = Person(name: "Ada")   // count: 1
var b = a                              // count: 2 — same object, second pointer
```

### Rule 3 — One idea per paragraph

A paragraph is 1–3 short sentences carrying **one** idea. No stacked parentheticals. No "X (which, by the way, also does Y — see below) causes Z". If a sentence carries three ideas, make it three sentences — or cut two ideas.

### Rule 4 — No jargon before meaning

The first time any technical term appears, explain it in plain words *in the same sentence*, or don't use it yet.

**Bad:** "Deallocation is deterministic."
**Good:** "You can predict the exact line where the object is destroyed — this is called *deterministic* deallocation."

Terms this applies to: deterministic, discriminator, existential, heap/stack (first use), reentrancy, memoization, variance, invariant, opaque, thunk, vtable, autoclosure, semantics, and anything similarly textbook-flavored. Once defined in a lesson, use the term freely for the rest of that lesson.

### Rule 5 — Assume only earlier topics

A lesson may rely only on topics that come **before** it in curriculum order (see CURRICULUM.md). No "like Java's finalizers" or "similar to Rust's ownership" — the reader may know no other language. If a later topic is genuinely needed, name-drop it with one plain sentence of context and a note that it has its own lesson.

### Rule 6 — Predict-then-reveal

Where natural (once or twice per lesson), pause and ask the reader to predict before showing the answer:

> What does this print?
> ```swift
> let x: Int? = 42
> let y = x ?? expensiveDefault()
> ```
> Answer: `expensiveDefault()` never runs. The right side of `??` only executes when the left side is `nil`.

This matches the quiz's `predict` questions and keeps the reader thinking instead of skimming.

### Rule 7 — Bold only the term being defined

**Bold** marks the first appearance of a term the reader must remember — roughly 3–8 bolds per lesson. Never bold for emphasis, never bold whole phrases like "**deallocates deterministically when the count hits 0**". Italics for light emphasis, sparingly.

### Rule 8 — Full depth stays

Nothing gets dumbed down or cut. Every senior nuance, edge case, and pitfall from the original lesson survives — it just gets the same incremental, code-first treatment. Deep material takes *more* space in this style, not less. That's fine.

### Rule 9 — Headings are plain statements

Section headings say what the reader is about to see, in plain words. Prefer "Watch an object live and die" over "Reference counting semantics". Questions make good headings too ("What happens when two objects point at each other?"). Keep headings `##` level (the right-hand table of contents is built from them).

### Rule 10 — Interview lens stays, in plain sentences

Every lesson still ends with an `## Interview lens` section. Rewrite it as direct, plain advice — "If asked X, say Y, because Z" — not a bold-studded summary paragraph. It should read like a friend telling you what the interviewer is fishing for.

## Structure template

```markdown
## <Plain-words hook: the problem this feature solves>
   Small motivating example of the problem — code first.

## <Core mechanic, shown step by step>
   The growing-example walk. Most of the lesson lives here,
   split into as many ## sections as the topic needs.

## <Edge cases / deeper mechanics>
   Same treatment. Senior nuances live here, narrated gently.

## Common pitfalls
   Short list; each pitfall shows the failing code + one-line fix.

## Interview lens
   Plain-sentence advice on what interviewers probe and how to answer.
```

The section topics from CURRICULUM.md (`Sections:` lists) still define *what* each lesson covers; this guide defines *how*.

## Technical constraints (unchanged from before)

- **Plain Markdown, never MDX.** Swift's `<>` generics and `{}` closures break JSX parsing. Imported as raw strings.
- Code blocks are fenced with ` ```swift `.
- Headings that should appear in the right-hand TOC are `##`. Use `###` for sub-steps within a walk.
- Tables are allowed but rare — only for genuine side-by-side comparisons (e.g. ARC vs GC), maximum one per lesson.
- No HTML, no images.

## Self-check before finishing a lesson

1. Read the first 10 lines: does code appear before the first abstract explanation?
2. Search for parentheses: any sentence with two `(...)` asides? Split it.
3. Search for bolds: more than ~8? Any bold that isn't a term's first definition? Fix.
4. Scan every technical term: is each explained in plain words at first use?
5. Any code block over ~12 lines that wasn't built up incrementally beforehand? Break it up.
6. Does every section from the original lesson (or CURRICULUM.md `Sections:` list) still exist in some form? Nothing dropped?
7. Is there at least one predict-then-reveal moment?
8. Does it end with `## Interview lens` in plain sentences?
