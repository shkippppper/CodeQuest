## The problem: the client and server are built by different people, on different schedules

Your iOS app calls a backend team's API. Neither of you ships on the same day — the server might deploy five times before your app update reaches the App Store, and once it does, some users still won't have upgraded for weeks.

```swift
struct Comment: Codable {
    let id: String
    let text: String
}
```

That's the whole contract today. It works — until the backend team adds a `likeCount` field, or renames `text` to `body`, or a client on last year's app version hits an endpoint that now behaves differently. **API design** is the discipline of shaping that contract so both sides can keep changing independently without breaking each other. This lesson walks through the decisions that make that possible: how you name things, how you page through lists, how you report errors, and how you change your mind later without breaking every app already installed on a phone.

## Resource modeling: naming the nouns, not the actions

Start with the object your app actually needs: a comment on a post.

```swift
struct Comment: Codable {
    let id: String
    let postID: String
    let authorID: String
    let text: String
    let createdAt: Date
}
```

A **resource** is a named "thing" the API exposes — here, a comment — and REST-style API design gives each resource a URL built from its plural noun:

```
GET    /posts/{postID}/comments        // list comments on a post
POST   /posts/{postID}/comments        // create a comment
GET    /posts/{postID}/comments/{id}   // read one comment
PATCH  /posts/{postID}/comments/{id}   // update one comment
DELETE /posts/{postID}/comments/{id}   // delete one comment
```

Notice what's *not* there: no `/getComments`, no `/deleteComment?id=5`. The HTTP verb (`GET`, `POST`, `PATCH`, `DELETE`) carries the action; the URL only ever names the resource. This isn't a style preference — it's what lets a generic HTTP cache, a logging proxy, or a rate limiter reason about your API without knowing anything about comments specifically. They just see "a `DELETE` on some resource," which they already know is safe to not retry blindly.

Nesting `comments` under `/posts/{postID}` also encodes an ownership relationship for free: a comment doesn't exist independently of its post, and the URL says so before you've read a single field.

## Pagination & filtering contracts

A post with ten thousand comments can't come back as one JSON array — the request would be enormous and mostly wasted, since nobody scrolls that far. The API needs to hand back comments in pages.

```
GET /posts/{postID}/comments?limit=20
```

```json
{
  "items": [ { "id": "c1", "text": "..." }, ... ],
  "nextCursor": "eyJpZCI6ImMyMCJ9"
}
```

The client asks for a `limit`; the server returns that many items plus a **cursor** — an opaque token pointing at "where to resume" for the next page. To get more, the client sends the cursor straight back:

```
GET /posts/{postID}/comments?limit=20&cursor=eyJpZCI6ImMyMCJ9
```

This is **cursor-based pagination**, and it's worth contrasting with the more obvious-looking alternative: offset-based paging (`?offset=20&limit=20`, "skip 20, give me 20 more"). Predict: if someone posts a new comment *while* a user is scrolling through page 2 with offset pagination, what goes wrong?

Answer: every comment after it shifts down by one position, so offset 20 now points at a different comment than it did a moment ago — the user sees a duplicate or skips one entirely. A cursor anchored to a specific item (like "everything after comment `c20`") doesn't shift when new items are inserted elsewhere, so it doesn't have this bug. That's why most modern paginated APIs — including ones backing infinite-scroll feeds — use cursors, not offsets.

Filtering rides on the same query-string contract, and the design rule is: filters are optional query parameters, never new endpoints.

```
GET /posts/{postID}/comments?limit=20&authorID=u42
GET /posts/{postID}/comments?limit=20&since=2026-06-01T00:00:00Z
```

One endpoint, composable parameters — versus `/posts/{postID}/commentsByAuthor` and `/posts/{postID}/commentsSince`, which multiply endlessly as filter combinations grow.

## Error contracts

A failed request still needs a *shape* the client can parse, not just an HTTP status code and a prayer.

```json
{
  "error": {
    "code": "comment_too_long",
    "message": "Comments must be under 500 characters.",
    "field": "text"
  }
}
```

```swift
struct APIError: Codable {
    let error: ErrorBody
    struct ErrorBody: Codable {
        let code: String
        let message: String
        let field: String?
    }
}
```

The **error contract** is a fixed, predictable JSON shape for every failure — no matter which endpoint threw it. The `code` field matters more than it looks: a client should never branch on `message`, because that string is meant for a human and the backend team will reword it without warning. `code` is meant for code — stable, documented, safe to `switch` on.

```swift
switch apiError.error.code {
case "comment_too_long": showFieldError(apiError.error.field, "Too long")
case "unauthenticated": promptLogin()
default: showGenericError(apiError.error.message)
}
```

Pair the body with the right HTTP status class, since infrastructure between your app and the server (proxies, CDNs, retry middleware) reads status codes without ever parsing JSON: `4xx` for the client's fault (bad input, not authenticated, not found), `5xx` for the server's fault (crashed, timed out). A `5xx` is usually safe to retry automatically; a `4xx` almost never is — retrying a 400 just resends the same bad request.

## Versioning strategies

Now the harder problem: the backend team wants to change the shape of `Comment` itself — say, replacing a single `authorID` string with a full nested `author` object. Every app version already on someone's phone still expects the old shape.

```json
// what every currently-installed app expects
{ "id": "c1", "text": "nice post", "authorID": "u42" }

// what the backend team wants to ship
{ "id": "c1", "text": "nice post", "author": { "id": "u42", "name": "Ada" } }
```

Ship the second shape to everyone immediately, and every installed app that decodes `authorID` as a required field crashes or silently drops the comment. **Versioning** is how an API changes its contract without doing that — by letting old and new clients each get the shape they were built for, at the same time.

The most common mechanism is a version segment in the URL itself:

```
GET /v1/posts/{postID}/comments   // old clients keep hitting this, unchanged
GET /v2/posts/{postID}/comments   // new clients get the new shape
```

The server runs both `v1` and `v2` simultaneously — often `v1` is even implemented as a thin adapter that calls the same underlying logic as `v2` and reshapes the response back down to the old contract. Other teams put the version in a header (`Accept: application/vnd.myapp.v2+json`) instead of the URL; the trade-off is mostly about visibility and cacheability, not correctness — a URL-visible version is easier to see in logs and easier for an HTTP cache to key on.

## Backward compatibility: the discipline that avoids needing a new version at all

Bumping the version number is the heavy tool. Most changes don't need it, if you follow one rule: **only add, never remove or repurpose.**

```json
// v1, before
{ "id": "c1", "text": "nice post", "authorID": "u42" }

// v1, after — adding a field is backward compatible
{ "id": "c1", "text": "nice post", "authorID": "u42", "likeCount": 3 }
```

An old app decoding this with `Codable` and an unrelated `likeCount` field it doesn't know about just ignores it — assuming the model wasn't written to reject unknown keys. New optional fields are free; existing clients don't even notice they're there.

Compare that to the changes that *do* break old clients, and would force a `v2`:

```
Renaming authorID -> author       // old clients can't find authorID anymore
Removing a field clients rely on  // decode fails or logic breaks
Changing a field's type           // "id": 5 -> "id": "5" fails to decode as Int
Making an optional field required // old requests that omitted it now get rejected
```

The practical habit this produces: when a backend change request comes in, the first question is "can this be an addition?" before reaching for a version bump. Version bumps aren't free either — running `v1` and `v2` side by side is real maintenance cost, indefinitely, until every client has upgraded off `v1`.

## Common pitfalls

- **Endpoints named after actions instead of resources.** `/getComments` and `/deleteComment` fight the HTTP verb instead of using it — stick to nouns and let `GET`/`POST`/`PATCH`/`DELETE` carry the verb.
- **Offset-based pagination on a list that changes while scrolling.** Inserts and deletes shift every offset after them, causing skipped or duplicated items — use a cursor anchored to a specific item instead.
- **Branching client code on an error `message` string.** Messages are for humans and change wording without notice; branch on a stable `code` field instead.
- **Treating every backend change as a v2.** Additive, optional fields are backward compatible for free — reserve version bumps for actual breaking changes (renames, removals, type changes, newly-required fields).

## Interview lens

If asked to design an API for a resource, walk through it in this order out loud: name the resource and its URLs (nouns, HTTP verbs carry the action), then pagination (cursor over offset, and say why — mutation during scroll), then the error shape (a stable `code` field, not a message string, driving client branching), then how you'd evolve it later without breaking existing clients.

On versioning specifically, the strong answer isn't "put `/v2/` in the URL" by itself — it's recognizing that most changes shouldn't need a version bump at all. Lead with backward compatibility (only add, never remove or repurpose) and treat a full version bump as the expensive fallback for genuinely breaking changes, because running two versions in parallel is ongoing maintenance cost, not a one-time fix.

If pressed on cursor pagination internals, be ready to say what the cursor actually encodes (commonly the last item's ID and sort key, base64-encoded so it's opaque to the client) — it signals you understand it's not magic, just a pointer the server hands back to itself.
