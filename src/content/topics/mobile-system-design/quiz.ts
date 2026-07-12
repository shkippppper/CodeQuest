import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "msd-first-move",
    type: "mcq",
    prompt: "An interviewer says \"design a photo feed.\" What should your first move be?",
    options: [
      "Ask clarifying questions to scope the problem before designing anything",
      "Immediately draw the component diagram",
      "Immediately write the API contract",
      "Ask what programming language to use",
    ],
    answer: 0,
    explanation:
      "Scoping the problem first — what's in, what's out, rough scale — prevents you from designing a beautiful system for a question the interviewer didn't actually ask.",
  },
  {
    id: "msd-functional-vs-nonfunctional",
    type: "mcq",
    prompt: "Which pair correctly separates a functional requirement from a non-functional one?",
    options: [
      "Functional: \"show a grid of photos\"; Non-functional: \"scrolling stays smooth with no dropped frames\"",
      "Functional: \"scrolling stays smooth\"; Non-functional: \"show a grid of photos\"",
      "Both are functional requirements",
      "Both are non-functional requirements",
    ],
    answer: 0,
    explanation:
      "Functional requirements describe observable features (what the app does); non-functional requirements describe the quality bar behind them (how well it does it) — smoothness, latency, offline behavior.",
  },
  {
    id: "msd-cursor-predict",
    type: "predict",
    prompt: "A profile grid paginates with page numbers instead of a cursor. A user deletes a photo on page 1 while scrolling. What's the likely bug?",
    code: `// GET /photos?page=2&limit=20
// server always returns the "current" items 21-40`,
    options: [
      "An item shifts into page 2 that the client already showed on page 1, so it appears to repeat (or one gets skipped)",
      "Nothing — page numbers are always safe",
      "The app crashes",
      "The server silently caches the wrong page forever",
    ],
    answer: 0,
    explanation:
      "Deleting an earlier item shifts every later item's offset by one. Page-number pagination re-derives the page from a live list, so items can repeat or get skipped across the boundary — exactly what a cursor avoids by pointing at a stable position instead of an index.",
  },
  {
    id: "msd-cursor-fill",
    type: "fill",
    prompt: "A ___-based pagination scheme uses an opaque pointer to \"where you left off\" instead of a page index, so it stays correct even as the underlying list changes.",
    answers: ["cursor"],
    hint: "Same word used for the blinking thing in a text field.",
    explanation:
      "Cursor-based pagination points at a stable position in the list rather than an index, so concurrent inserts or deletes don't cause skipped or repeated items.",
  },
  {
    id: "msd-components-single-responsibility",
    type: "mcq",
    prompt: "In the layered sketch (View -> ViewModel -> Repository -> Cache/Network), what is the Repository's job?",
    options: [
      "Decide whether to serve data from the local cache or fetch it from the network — the only place that decision is made",
      "Render the grid of photos on screen",
      "Hold the screen's observable state for the View",
      "Parse the raw HTTP response bytes",
    ],
    answer: 0,
    explanation:
      "The Repository is the single source-of-truth decision point: cache-or-network. Keeping that decision out of the View and ViewModel means neither of them needs to know the data even has two possible sources.",
  },
  {
    id: "msd-tradeoffs-multi",
    type: "multi",
    prompt: "Select **all** statements that are true about defending a trade-off in a system design interview.",
    options: [
      "A strong answer ties the choice back to a specific stated requirement",
      "\"It's best practice\" is a sufficient justification on its own",
      "Different requirements can justify opposite defaults for the same trade-off (e.g. own content vs. others' content)",
      "You should wait for the interviewer to ask before mentioning any weakness in your design",
    ],
    answers: [0, 2],
    explanation:
      "Tying a decision to a concrete requirement is the strong move, and the right default genuinely can flip depending on what you're protecting (your own edited content vs. a feed of others' posts). \"Best practice\" alone is weak, and volunteering bottlenecks yourself (rather than waiting to be asked) is the stronger habit.",
  },
  {
    id: "msd-write-through-senior",
    type: "predict",
    prompt: "A user deletes their own photo, then immediately reopens the profile grid. The cache uses a 5-minute refresh timer instead of write-through. What do they see?",
    code: `// cache policy: refresh on a 5-minute timer, not on writes
// user deletes photo X, then reopens the grid within seconds`,
    options: [
      "The deleted photo X can still appear until the timer fires — a jarring bug for content the user just changed themselves",
      "The photo is guaranteed to disappear immediately regardless of cache policy",
      "The app throws a network error",
      "The cache is bypassed automatically after any delete",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A timer-based cache can lag behind a user's own edits. Write-through — updating the cache the moment the network call that caused the change completes — keeps cache and server in lockstep, which matters most for content the user directly controls.",
  },
  {
    id: "msd-bottleneck-senior",
    type: "mcq",
    prompt: "A candidate finishes their design and stops, waiting for the interviewer to poke holes in it. What's the stronger senior move instead?",
    options: [
      "Proactively name at least one bottleneck or scaling limit in their own design before being asked",
      "Ask the interviewer to grade the design out loud",
      "Add more boxes to the diagram to look thorough",
      "Restate the functional requirements verbatim",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Volunteering a bottleneck — cold start with no cache, main-thread decoding, unbounded memory cache — shows you're evaluating your own design under load rather than presenting it as flawless and waiting to be challenged.",
  },
  {
    id: "msd-flashcard",
    type: "flashcard",
    prompt:
      "Walk through the full mobile system design framework in order, and explain why the order matters. Answer aloud, then reveal.",
    modelAnswer:
      "Start by **clarifying requirements** — narrow an open-ended prompt into a **scoped problem** with agreed boundaries, before drawing anything. Then split what you learned into **functional requirements** (observable features) and **non-functional requirements** (the quality bar: latency, smoothness, offline behavior) — the non-functional list is what you'll justify every later decision against. Next sketch **high-level components**, each with one responsibility, leaving standard architecture (MVVM, repository pattern) assumed rather than re-derived. Pin down the **API contract** as an actual request/response shape (e.g. a cursor-paginated endpoint with concrete fields), not a vague description — it gives you something to point at later. Trace a **data flow** for one real user action through those components end to end, showing where a requirement (like a fast reopen) actually gets satisfied by a specific step (like a cache-first read). Then hold a **trade-off discussion**: for each non-trivial choice, name the alternative and justify your pick by tying it back to a specific requirement, not a generic best practice — and recognize the same trade-off can have a different right answer under different requirements (e.g. write-through for your own content vs. a lazier cache for a feed of others' posts). Finish by naming **bottlenecks** yourself — memory growth, main-thread work, cold start — before the interviewer has to ask. The order matters because each step constrains the next: you can't justify a component without a requirement, can't trace data flow without components, and can't defend a trade-off without a requirement to defend it against.",
    keyPoints: [
      "Clarify and scope before designing anything",
      "Split functional (features) vs non-functional (quality bar) requirements",
      "Sketch single-responsibility components, then a concrete API contract",
      "Trace one real data flow end to end through the components",
      "Defend trade-offs against a specific requirement, not \"best practice\"",
      "Volunteer bottlenecks yourself before being asked",
    ],
    explanation:
      "A senior answer keeps every later step tied back to an earlier one — components exist to serve requirements, trade-offs get justified by requirements, and bottlenecks are self-identified rather than interviewer-extracted.",
  },
];

export default quiz;
