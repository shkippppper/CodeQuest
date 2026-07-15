import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "gql-core-idea",
    type: "mcq",
    prompt: "What is the core thing GraphQL changes compared to REST?",
    options: [
      "The client sends a query describing exactly the fields and shape it wants, and gets back exactly that in one request",
      "It replaces JSON with a faster binary wire format that the server continuously streams to the client over a single raw persistent TCP socket",
      "It removes the server entirely and lets the client query the database directly using a SQL-like dialect",
      "It caches every HTTP response body on disk automatically so that repeated screens never need a second request",
    ],
    answer: 0,
    explanation:
      "GraphQL flips who decides the response shape: the client asks for a precise nested set of fields at a single endpoint, eliminating REST's over-fetching (extra fields) and under-fetching (many round-trips).",
  },
  {
    id: "gql-overfetch-fill",
    type: "fill",
    prompt: "A REST `/user` endpoint that returns 30 fields when you needed only the name is an example of ___-fetching.",
    answers: ["over", "overfetching", "over-fetching"],
    hint: "The opposite of under-fetching (too many round-trips).",
    explanation:
      "Over-fetching is receiving more data than you asked for. Under-fetching is the N+1 problem: needing many dependent requests to assemble one screen. GraphQL avoids both.",
  },
  {
    id: "gql-operations",
    type: "mcq",
    prompt: "What are the three GraphQL operation types?",
    options: [
      "Query to read, mutation to write, and subscription to receive a live stream of changes",
      "Get to read, post to write, and socket to subscribe, mapping one-to-one onto raw HTTP verbs and methods",
      "Fetch, cache, and invalidate — the three phases every GraphQL request passes through on the client side",
      "Select, insert, and delete, borrowed directly from SQL and executed verbatim against the backing store",
    ],
    answer: 0,
    explanation:
      "A **query** reads, a **mutation** writes (and returns the changed object), and a **subscription** opens a long-lived stream (usually over WebSocket) for live data like chat or scores.",
  },
  {
    id: "gql-schema-multi",
    type: "multi",
    prompt: "Select **all** true statements about the GraphQL schema.",
    options: [
      "It is a strongly-typed description of every type, field, and relationship the server offers",
      "It lets tools validate a query against it at build time, before the app runs",
      "It acts as the contract between client and server for what can be requested",
      "It is generated fresh on every request from whatever fields the client happened to ask for",
    ],
    answers: [0, 1, 2],
    explanation:
      "The schema is the fixed, typed contract the server publishes; because it's machine-readable, queries can be checked against it at build time. It is not regenerated per request (option 4 is false).",
  },
  {
    id: "gql-apollo-codegen",
    type: "mcq",
    prompt: "What does Apollo iOS's code generation give you?",
    options: [
      "Typed Swift models generated from your queries and the schema, so field access is checked by the compiler",
      "A background daemon that keeps your local database schema perfectly in sync with the remote server at all times",
      "An automatic UIKit screen for every query in the project, wired up to the network with zero additional code",
      "A runtime reflection layer that inspects arbitrary JSON responses and guesses the Swift types on the fly",
    ],
    answer: 0,
    explanation:
      "Apollo runs codegen over your `.graphql` files plus the schema to produce typed models. `result.data?.user?.name` becomes a real typed property — a field you didn't request isn't even on the type, so misuse is a compile error.",
  },
  {
    id: "gql-error-200-predict",
    type: "predict",
    prompt: "A GraphQL request returns HTTP 200 with this body. Did the request 'fail'?",
    code: `{\n  "data": { "user": { "name": "Ada", "posts": null } },\n  "errors": [ { "message": "posts: permission denied" } ]\n}`,
    options: [
      "Partially — you got the name, but posts failed; you must check the errors array, not just the status code",
      "No — HTTP 200 is a guaranteed success, so the errors array can be safely ignored by the client entirely",
      "Yes completely — any non-empty errors array means the whole response is invalid and all data must be discarded",
      "It cannot happen — GraphQL always returns a 4xx or 5xx status whenever any single requested field fails to resolve",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "GraphQL can return HTTP 200 with partial `data` AND an `errors` array, because one request touches many fields. Never trust the status code alone — check both the errors array and the fields you needed.",
  },
  {
    id: "gql-normalized-cache-predict",
    type: "predict",
    prompt: "Two queries both return Post #7 (one in a feed, one on a detail screen). You like it on the detail screen. With Apollo's normalized cache, what does the feed show?",
    code: `// feed query and detail query both include Post id: 7\n// a likePost mutation updates Post 7 likeCount`,
    options: [
      "The updated like count — both queries point at the same Post:7 cache entry, so the change propagates",
      "The old like count, because each query keeps its own private and fully independent copy of the post object",
      "Nothing changes anywhere until the entire feed query is manually refetched from the server over the network",
      "A duplicated Post 7 appears in the feed, since the mutation inserts a brand-new object rather than updating one",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A normalized cache stores each object once, keyed by id (`Post:7`). Every query referencing that id shares the entry, so updating it updates all screens — something a response-blob cache like `URLCache` cannot do.",
  },
  {
    id: "gql-cache-fill",
    type: "fill",
    prompt: "Apollo splits each response into individual objects keyed by id and stores each once — this kind of cache is called a ___ cache.",
    answers: ["normalized", "normalised"],
    hint: "As opposed to caching whole opaque response blobs.",
    explanation:
      "A normalized cache keys objects by id so they're shared across queries, keeping unrelated screens consistent. `URLCache` instead caches whole responses as opaque blobs and can't do this.",
  },
  {
    id: "gql-vs-rest-senior",
    type: "mcq",
    prompt: "Which is a genuine trade-off that can favor REST over GraphQL?",
    options: [
      "REST gets HTTP-level caching and CDNs for free, while GraphQL's single POST endpoint bypasses most of that",
      "REST responses are always strongly typed at build time, whereas GraphQL can only ever be parsed dynamically at runtime",
      "REST supports nested relationships in one request, but GraphQL is fundamentally limited to a single flat object per call",
      "REST can express live subscriptions natively, while GraphQL has no mechanism at all for streaming server-pushed updates",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "REST's per-URL GETs cache well via HTTP and CDNs; GraphQL's single POST endpoint mostly bypasses that and pushes more resolution work onto the server. (GraphQL *does* support nesting and subscriptions, so the other options are false.)",
  },
  {
    id: "graphql-flashcard",
    type: "flashcard",
    prompt:
      "Explain GraphQL on iOS: the problem it solves, operation types, the schema, Apollo codegen, caching, error handling, and when to prefer REST. Answer aloud, then reveal.",
    modelAnswer:
      "**GraphQL** lets the client send a query describing exactly the nested fields it wants to a single endpoint (usually `POST /graphql`) and get back exactly that shape in one request. This fixes REST's twin problems: **over-fetching** (endpoints return fields you don't need) and **under-fetching**/N+1 (many round-trips to assemble one screen). There are three **operation types**: **query** (read), **mutation** (write, returns the changed object), and **subscription** (a live stream, usually over WebSocket). The server publishes a strongly-typed **schema** — the contract of every type and field — and because it's machine-readable, queries are **validated at build time**, not discovered as runtime `nil`s. On iOS, **Apollo iOS** does **code generation**: from your `.graphql` files plus the schema it produces typed Swift models, so `data.user.name` is compiler-checked (like `Codable`, but generated from the query). Apollo also uses a **normalized cache** that stores each object once keyed by id (`Post:7`), so updating one object updates every query showing it — unlike `URLCache`'s response-blob caching. **Error handling** is a gotcha: a request can return **HTTP 200 with partial `data` AND an `errors` array**, since one request touches many fields — always check both. **When to choose:** GraphQL for nested, varied data with many clients; REST for simple CRUD APIs that benefit from free HTTP caching and CDNs.",
    keyPoints: [
      "Client asks for exact nested fields at one endpoint → kills over- and under-fetching",
      "Operations: query (read), mutation (write), subscription (stream)",
      "Schema is the typed contract; queries validated at build time",
      "Apollo codegen → typed Swift models (compile-time safety)",
      "Normalized cache keys objects by id → cross-screen consistency",
      "HTTP 200 can carry partial data + errors array → check both",
      "GraphQL for complex graph data/many clients; REST for simple CRUD + HTTP caching",
    ],
    explanation:
      "A senior answer leads with over-/under-fetching, names the three operations and the schema-driven build-time validation, explains Apollo codegen and the normalized cache, flags the HTTP-200-with-errors gotcha, and gives a balanced GraphQL-vs-REST call.",
  },
];

export default quiz;
