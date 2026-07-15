## The problem: REST gives you the wrong amount of data

You need a user's name and the titles of their posts. With a REST API you might write:

```swift
let user = try await get("/user/42")          // returns 30 fields you don't need
let posts = try await get("/user/42/posts")   // a second round-trip
```

Two problems show up immediately. The `/user` endpoint returns a big object full of fields — avatar, bio, settings — when you wanted only the name. That's **over-fetching**: the server sent more than you asked for.

And to get the posts you had to make a *second* request. If each post then needed its comments, you'd make one more request per post. Making many small dependent requests to assemble one screen is called **under-fetching**, or the "N+1 round-trips" problem.

**GraphQL** flips who decides. Instead of the server defining fixed endpoints, the *client* sends a query describing exactly the shape of data it wants — and gets back exactly that, in one request. This lesson is about how that works and what it costs on iOS.

## One query, exactly the fields you asked for

A GraphQL API has a single endpoint, usually `POST /graphql`. You don't hit different URLs; you send a query in the request body:

```graphql
query {
  user(id: 42) {
    name
    posts {
      title
    }
  }
}
```

Read it top-down: "give me user 42, and from that user I want `name`, and from their `posts` I want each `title`." The nesting in the query mirrors the nesting you want back.

The response is JSON shaped like the query — nothing more:

```json
{ "data": { "user": { "name": "Ada", "posts": [ { "title": "ARC" } ] } } }
```

No avatar, no bio, no second request. You asked for two fields across two levels; you got two fields across two levels. That precise-fetch property is GraphQL's whole reason to exist.

## Three kinds of operation

Everything you send is one of three operation types.

A **query** reads data — it's the read-only kind you just saw. A **mutation** writes data (create, update, delete) and returns the changed object:

```graphql
mutation {
  likePost(id: 7) { id likeCount }
}
```

A **subscription** opens a long-lived stream — the server pushes new data as it changes, typically over a WebSocket. Use it for live things like a chat or a score.

So: query to read, mutation to write, subscription to receive a stream. Same query language, three verbs.

## The schema is the contract

How does the client know `user` has a `name` and `posts`? Because the server publishes a **schema** — a strongly-typed description of every type, field, and relationship it offers:

```graphql
type User {
  id: ID!
  name: String!
  posts: [Post!]!
}
```

The `!` means non-null. The schema is the contract between client and server: it lists exactly what you can ask for and what type each field is.

Here's the payoff — because the schema is machine-readable, tools can check your query *against it at build time*. Ask for a field that doesn't exist, or the wrong type, and you find out before the app ever runs. That's the opposite of REST, where a typo in a JSON key surfaces as a `nil` at runtime.

## Apollo iOS turns queries into typed Swift

On iOS the dominant client is **Apollo iOS**. Its headline feature is **code generation**: you write your queries in `.graphql` files, point Apollo at the server's schema, and it generates typed Swift models for every query.

```swift
// Generated from your query — fully typed, no dictionaries:
let query = UserQuery(id: 42)
apollo.fetch(query: query) { result in
    let name = result.data?.user?.name   // String?, checked by the compiler
}
```

Compare that to decoding a raw dictionary and reaching for `json["user"]["name"] as? String`. With codegen, `result.data?.user?.name` is a real typed property. A field you didn't request isn't even on the generated type, so misuse is a compile error, not a crash.

The workflow: write query files, run codegen (a build step), get typed models. It's the same idea as `Codable` giving you typed decoding — but the types are generated *from the query and schema* rather than hand-written.

## Caching by object, not by response

Predict this: two different queries both return post #7 — one as part of a feed, one on a detail screen. You like the post on the detail screen. Should the feed now show the new like count?

With ordinary HTTP caching (like `URLCache`) the answer is no — it caches whole *responses* as opaque blobs, and those two responses are unrelated.

Apollo uses a **normalized cache** instead. It splits every response into individual objects keyed by their id, and stores each once:

```
Post:7  →  { id: 7, title: "ARC", likeCount: 12 }
```

Both queries point at the same `Post:7` entry. Update it via the mutation, and *every* query showing that post sees the new value automatically. Normalizing by object id is why a GraphQL cache can keep unrelated screens consistent — something a response-blob cache can't do.

## Errors: HTTP 200 can still carry failures

A REST call tells you it failed with a status code — 404, 500. GraphQL is different, and it trips people up.

Because one request can touch many fields, some can succeed while others fail. So the server usually returns **HTTP 200** with a body that has *both* a partial `data` object and an `errors` array:

```json
{
  "data": { "user": { "name": "Ada", "posts": null } },
  "errors": [ { "message": "posts: permission denied", "path": ["user","posts"] } ]
}
```

Did this request "fail"? Partially. You got the name, but `posts` came back `null` with an entry in `errors`. The rule: never trust the status code alone — always check the `errors` array *and* the fields you needed. A non-empty `errors` with usable `data` is normal, not an exception.

## When GraphQL, and when REST

GraphQL isn't automatically better — it's a trade.

It shines when data is **nested and varied**, and many different clients (iOS, web, watch) each need different slices of it. One flexible endpoint beats maintaining dozens of bespoke REST endpoints, and it kills over- and under-fetching.

REST stays simpler for small or CRUD-shaped APIs, and it gets easy HTTP caching, CDNs, and status-code semantics for free. GraphQL's single POST endpoint bypasses most HTTP caching, and the server pays more to resolve arbitrary queries.

A balanced answer names both: GraphQL for complex graph-shaped data with many consumers; REST for simple resource APIs that benefit from HTTP-level caching.

## Common pitfalls

- **Treating HTTP 200 as success.** GraphQL returns 200 with a partial `data` and an `errors` array; check both, not just the status code.
- **Skipping codegen and hand-parsing JSON.** You lose the compile-time safety that is GraphQL's main iOS advantage. Let Apollo generate the types.
- **Expecting `URLCache` to help.** GraphQL's single POST endpoint isn't cached by HTTP; use Apollo's normalized cache for cross-screen consistency.
- **Over-fetching anyway.** Selecting `{ ...everything }` out of habit throws away the whole point — ask for only the fields the screen shows.

## Interview lens

If asked "why GraphQL over REST?", lead with the fetch problem: REST endpoints over-fetch (fields you don't need) and under-fetch (many round-trips for one screen), while GraphQL lets the client request exactly the nested shape it needs in a single query. That one sentence shows you understand the *why*, not just the syntax.

Expect a follow-up on the downsides. Say: GraphQL bypasses HTTP caching (one POST endpoint), pushes more work onto the server to resolve arbitrary queries, and adds a codegen build step — so REST is often the simpler choice for small CRUD APIs.

Two details signal real experience. First, error handling: GraphQL can return HTTP 200 with partial `data` plus an `errors` array, so you check both. Second, caching: Apollo's normalized cache keys objects by id, so updating one object updates every query showing it — unlike a response-blob cache. Mentioning the schema-driven codegen (typed models, build-time validation) ties it all together.
