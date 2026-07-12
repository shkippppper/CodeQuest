## The problem: "design Instagram" has no single right answer

An interviewer says: "Design the profile grid screen — the one showing a user's photos in a scrolling grid, like Instagram's profile tab." Then they lean back and wait.

There's no compiler here, no unit test that passes or fails. What actually gets scored is whether you *narrow the problem down* before you design anything, and whether you can *defend* every choice you make along the way. This lesson is a framework for doing that, one step at a time, using the profile grid as the running example. Later lessons in this section (feeds, image loading, offline sync) all assume you already know this framework — they'll move fast through these steps and spend their time on the topic-specific parts.

## Clarifying requirements before you draw a single box

The single biggest mistake in a system design interview is opening with a diagram. Before any box gets drawn, ask questions that shrink the problem:

- "Is this just the grid of photo thumbnails, or does it include tapping into a photo detail view?"
- "How many photos does a typical profile have — dozens, or tens of thousands?"
- "Does this need to work offline, or is a loading spinner acceptable when there's no network?"
- "Single device, or does 'my data' need to stay in sync across a phone and a tablet?"

Say the interviewer answers: grid only (no detail view), up to ~5,000 photos per profile, should show cached content offline, single device for now. That's now a **scoped problem** — a version of the question small enough to actually design in 30 minutes, with the boundaries stated out loud so everyone agrees what's in and out.

Skipping this step is the classic failure mode: you spend fifteen minutes designing a beautiful system for a problem the interviewer didn't ask about, then scramble when they redirect you.

## Functional vs non-functional requirements

Once the scope is fixed, split what the system must do from how well it must do it.

**Functional requirements** are the features — the things a user can observe:

- Show a grid of the current user's photo thumbnails, most recent first.
- Scroll to load more as the user reaches the bottom.
- Tapping a photo does nothing yet (out of scope, per the clarification above).

**Non-functional requirements** are the quality bar behind those features — things a user *feels* rather than describes:

- Scrolling stays smooth even on a five-year-old device (no dropped frames).
- The grid shows something useful within ~300ms of opening the screen, even on a slow connection.
- Cached thumbnails still render if the network is unavailable.

Notice the pattern: every functional requirement above could be satisfied by a system that's technically correct but unusable — a grid that loads correctly but jitters while scrolling, or takes eight seconds to appear. The non-functional list is what keeps the rest of your design honest. When you later choose between two approaches, you'll justify the choice by pointing back at one of these lines, not by taste.

## High-level components

With requirements fixed, sketch the pieces before any of their internals. For the profile grid:

```
[View] -- observes --> [ViewModel] -- requests photos from --> [Repository]
                                                                     |
                                                    +----------------+----------------+
                                                    |                                 |
                                              [Local Cache]                     [Network Client]
                                              (disk + memory)                   (talks to the API)
```

Each box is one responsibility, and that's the point of drawing it this way: the **View** only renders what it's told, the **ViewModel** holds and updates the screen's state, and the **Repository** is the single place that decides "do I have this data locally, or do I need the network?" Neither the view nor the view model needs to know that decision exists.

This is the same shape you'd get from any layered architecture lesson — the system design skill isn't inventing new boxes, it's *choosing which boxes matter* for this particular question and leaving the rest as "assume a standard MVVM stack here" so you don't burn interview time re-deriving architecture basics.

## Nail down the API contract

Before tracing data through the system, pin down exactly what crosses the network. A vague plan ("the app fetches photos from the server") is worth nothing to an interviewer — a concrete contract is:

```swift
// GET /users/{id}/photos?cursor={cursor}&limit={limit}
struct PhotosPage: Decodable {
    let photos: [PhotoDTO]
    let nextCursor: String?
}

struct PhotoDTO: Decodable {
    let id: String
    let thumbnailURL: URL
    let fullURL: URL
    let createdAt: Date
}
```

Two design decisions are already baked into these eight lines, and both are worth saying out loud:

- `cursor` instead of a page number, because photos can be added between requests — a cursor (an opaque pointer to "where you left off") stays correct even if the list shifts underneath you, while page numbers can skip or repeat items.
- `nextCursor` is `nil` when there's nothing more to load, so the client knows when to stop asking without a separate "hasMore" flag to keep in sync.

Writing the actual request shape, not just describing it in prose, is what separates a candidate who's *designed* systems from one who's only read about them. It also gives you something concrete to point at during the trade-off discussion later.

## Trace the data flow through the components

Now walk a single user action through the boxes you drew, in order:

```
1. View appears → ViewModel.loadInitialPage()
2. ViewModel → Repository.photos(cursor: nil)
3. Repository checks Local Cache first
     cache hit  → return cached PhotosPage immediately (feels instant)
     cache miss → Network Client fetches PhotosPage, Repository writes it to cache, then returns it
4. Repository → ViewModel gets a PhotosPage back
5. ViewModel maps PhotoDTO → view state, View renders the grid
6. User scrolls near the bottom → ViewModel.loadNextPage(cursor: page.nextCursor)
     → repeats steps 2-5 with the new cursor
```

This is where the non-functional requirement about a 300ms first render actually gets satisfied: step 3's cache-first check is *why* a returning user sees photos almost instantly, instead of waiting on a network round trip every time they open the screen. Notice that requirement wasn't just decoration — it directly justified a design decision here.

## Trade-off discussion: the interviewer's real question

Every non-trivial choice in a design has a competing alternative, and the interviewer wants to hear you weigh them, not just declare a winner. Take the cache in step 3: it could be **write-through** (every network response updates the cache before returning, keeping cache and server never more than one request apart) or lazier, only refreshing the cache on a timer.

Predict: for a profile grid the user owns and edits themselves (adds and deletes their own photos), which is the better default?

Answer: write-through. If you delete a photo and immediately reopen the grid, a lazy cache could still show the deleted photo until its timer fires — a jarring bug for content the user just changed. A feed of *other people's* posts (the next lesson's topic) tolerates staleness much better than your own edited content does, which is exactly why that lesson reaches a different default. The "right" answer depends on the requirement you're protecting, and saying that dependency out loud is the actual skill being tested.

## Bottlenecks: where this design breaks first

Finally, stress-test your own design instead of waiting for the interviewer to find the hole. Ask "what breaks first as this scales?" For the profile grid:

- **5,000 photos in the cache.** Keeping all of them in memory at once is wasteful — most are off-screen. The fix is bounding the in-memory cache to roughly what's visible plus a small buffer, and relying on the disk cache (and re-fetching) for the rest. This exact trade-off gets its own lesson (image loading) because it's deep enough to deserve one.
- **Main-thread decoding.** Decoding a few dozen JPEGs while scrolling can stutter the UI if it happens on the same thread that's drawing frames. The fix is decoding off the main thread and only touching UI state with the finished result.
- **Cold start.** The very first load has no cache to hit, so step 3 always takes the network path. If the non-functional requirement really is "useful content within 300ms," a first-open skeleton or shimmer state is what keeps that promise even on the slow path.

Naming bottlenecks before the interviewer asks shows you're thinking about the system under load, not just the happy path — and it sets up naturally into "how would you fix that," which is usually where the conversation goes next.

## Common pitfalls

- **Diagramming before scoping.** A gorgeous architecture for the wrong-sized problem wastes the interview. Always clarify first.
- **Treating trade-offs as trivia.** "Use a cursor because it's best practice" is weaker than "use a cursor because page numbers break under concurrent inserts, and here that matters because photos get added constantly."
- **Never revisiting non-functional requirements.** If you stated "must feel instant on reopen" in step one, every later decision should be checked against it — don't let it become a line you said once and forgot.

## Interview lens

When the prompt is open-ended ("design X"), the strongest opening move is to *not* start designing — spend the first few minutes clarifying scope and stating functional vs non-functional requirements out loud, even if the interviewer doesn't ask you to. It signals you know the difference between a feature list and a quality bar.

When you present components, keep each box to one responsibility and be ready to say what crosses the network between them — a real request/response shape beats a vague arrow every time.

When the interviewer pushes on a trade-off, don't reach for a universal "best practice." Tie your answer back to a specific requirement from step one — "I chose write-through *because* we said edits must feel immediate" is a senior answer; "write-through is generally better" is not. And always volunteer at least one bottleneck yourself before being asked; it shows you're evaluating your own design rather than defending it blindly.
