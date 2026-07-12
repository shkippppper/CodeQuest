## The problem: a feed is a list that never stops changing

Open a social app and the first screen you see is usually a feed — a scrolling list of other people's posts, ranked or chronological. It looks like "just a list," but three things make it harder than any static list you've built before: it's too long to load at once, it goes stale while you're not looking at it, and other people are adding to the *front* of it while you scroll.

This lesson designs that screen using the framework from the previous lesson — requirements, components, API contract, data flow, trade-offs, bottlenecks — but moves quickly through the parts that repeat and spends its time on what's specific to a feed: pagination, caching, media, offline behavior, and scroll performance.

## Requirements: what makes a feed a feed

Scope it the way you would in an interview: a home feed of posts from accounts the user follows, text plus a single optional image per post, ranked reverse-chronologically for simplicity (a ranking algorithm is its own topic). Functional requirements:

- Load an initial page of posts on open.
- Load more as the user scrolls down.
- Show new posts that arrived after the initial load, without silently reordering what's already on screen.

Non-functional requirements — the ones that will drive every trade-off below:

- Scrolling never stutters, even with images loading in.
- Reopening the app after a few minutes shows *something* instantly, even before the network responds.
- A post the user just liked or posted themselves should never look wrong, even for a moment.

## Pagination & prefetch

Start with the contract from the framework lesson, adapted to a feed:

```swift
// GET /feed?cursor={cursor}&limit=20
struct FeedPage: Decodable {
    let posts: [PostDTO]
    let nextCursor: String?
}
```

A cursor works here for the same reason it worked for the photo grid: posts are inserted at the *top* of the feed constantly, and a page-number scheme would re-shift under your feet mid-scroll. But a feed adds a wrinkle the grid didn't have — the cursor has to be **stable against inserts at the front**, not just deletes. The usual fix is a cursor built from the last item's timestamp or ID rather than its position: "give me everything older than post `X`" doesn't care how many new posts appeared above `X` since you last asked.

Now the loading trigger. Fetching page 2 only once the user hits the exact bottom pixel guarantees a visible loading spinner, because the network call starts *after* the user has already run out of content. **Prefetching** fixes this: trigger the next page's fetch when the user is still a few screens away from the bottom, so the response is usually back before they arrive there.

```swift
func scrollViewDidScroll(_ scrollView: UIScrollView) {
    let remaining = scrollView.contentSize.height - scrollView.contentOffset.y - scrollView.bounds.height
    if remaining < threeScreensWorth, !isLoadingNextPage {
        loadNextPage()
    }
}
```

The `isLoadingNextPage` guard matters as much as the threshold: without it, every scroll tick past the threshold fires another request for the same page.

## Caching & freshness

Predict: the user backgrounds the app for two minutes, then reopens it. Should the feed show the exact same posts they left on, or refetch from the top?

Answer: it depends on how stale is acceptable — which is exactly the trade-off the previous lesson said to defend with a requirement. Here the requirement was "reopening shows something instantly," which points at showing the **cached** feed immediately, then quietly checking for new posts in the background rather than blocking on a network call.

That gives two separate concerns that are easy to conflate: *serving* cached data fast, and *refreshing* it. A reasonable default:

```
On screen appear:
  1. Render the cached FeedPage immediately (instant, possibly stale)
  2. In the background, fetch the newest posts since the cached cursor
  3. If new posts arrived, show a non-disruptive "N new posts" banner at the top
     rather than silently inserting them above the user's current scroll position
```

Step 3 is the detail that separates a feed from the profile grid in the previous lesson. There, write-through made sense because the user's *own* edits should appear instantly. Here, silently splicing other people's new posts above the user mid-read would yank their scroll position around — worse than a moment of staleness. Same underlying trade-off (write-through vs. lazier), opposite default, because the requirement being protected is different: "don't disorient the reader" instead of "reflect my own edit immediately."

## Media handling

Every post in this design carries an optional image, and images are the single biggest threat to the "never stutters" requirement. The contract should carry enough to avoid over-fetching:

```swift
struct PostDTO: Decodable {
    let id: String
    let author: String
    let text: String
    let imageURL: URL?
    let imageAspectRatio: Double?   // width / height
}
```

That `imageAspectRatio` field looks small but solves a real problem: without it, the cell can't know a post's height until the image finishes downloading, so every image load causes the whole list to reflow and jump. With the aspect ratio delivered up front in the API response, the cell can reserve the correct height immediately and let the image fade in without moving anything else on screen. Image loading itself — caching, decoding, cancellation — is deep enough to be its own lesson right after this one.

## Offline & optimistic updates

The third non-functional requirement was "a post the user just liked should never look wrong, even for a moment." Consider what happens without any special handling:

```swift
func likeButtonTapped(post: Post) {
    api.likePost(post.id) { result in
        if case .success = result {
            self.updateUI(post.id, liked: true)   // UI updates only after the network responds
        }
    }
}
```

On a slow connection, the button does nothing for a visible moment after being tapped — it *looks* broken even though it's working correctly. The fix is an **optimistic update**: change the local state immediately, as if the request already succeeded, then reconcile with the real response when it arrives.

```swift
func likeButtonTapped(post: Post) {
    updateUI(post.id, liked: true)          // update immediately, assume success
    api.likePost(post.id) { result in
        if case .failure = result {
            self.updateUI(post.id, liked: false)   // roll back only if it actually failed
        }
    }
}
```

This also answers the offline case for free: if there's no network at all, the UI still reflects the like instantly, and the request can be queued to send once connectivity returns (the queuing and retry mechanics get their own full treatment in the offline-sync lesson later in this section). The trade-off being accepted here: the UI can briefly show a state that turns out to be wrong if the request later fails — worth it because "looks broken" is a worse user experience than "rarely has to roll back."

## Scroll performance

The last non-functional requirement — no stutter — is a rendering problem more than a networking one. Two habits matter most in a feed specifically:

- **Cell reuse.** Recycling and reconfiguring existing cells as they scroll off-screen and back on, instead of creating a new one per post, is what keeps memory and allocation cost flat regardless of feed length. Both `UITableView`/`UICollectionView` and SwiftUI's `List`/`LazyVStack` do this for you, but only if cell content stays lightweight — heavy per-cell work (like decoding an image synchronously) defeats the benefit.
- **Off-main-thread decoding.** Decoding an image is CPU work; doing it on the main thread competes directly with the thread that has to draw the next frame every 16ms (60fps) or 8ms (120fps) to avoid a visible hitch. Decode off the main thread, and only hop back to it to assign the finished image.

## Common pitfalls

- **Page-number pagination on a feed.** Posts insert at the front constantly; a stable, ID-or-timestamp-based cursor is required, not optional.
- **Splicing new posts in silently.** Even though it's "fresher," yanking the user's scroll position feels broken. Surface new content as an explicit banner instead.
- **Optimistic updates with no rollback path.** Updating the UI immediately is only safe if you also handle the failure case — otherwise a failed request leaves the UI lying about the server's actual state.

## Interview lens

If asked to design a feed, lead with the tension that makes it different from a plain list: it's unbounded (needs pagination), it changes underneath the user (needs a freshness strategy), and it's rendering-heavy (needs scroll performance discipline). Naming that tension up front shows you understand *why* a feed is a system design question and not just a table view.

When you're asked about caching, don't default to "cache everything and refresh on a timer" — explain the specific tension between showing cached content instantly and not disorienting the user with content that shifts under their thumb, and resolve it with a soft "new posts available" affordance rather than a silent splice.

If pushed on optimistic updates, be ready to name the failure mode explicitly: the UI can briefly lie about server state, and the design has to include a rollback path for when the optimistic guess turns out wrong. Interviewers listen for whether you thought about the unhappy path or just the tap-and-it-works path.
