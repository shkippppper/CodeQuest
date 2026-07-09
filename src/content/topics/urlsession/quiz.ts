import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "urlsession-what",
    type: "mcq",
    prompt: "What is `URLSession` responsible for?",
    options: [
      "Managing network requests: connections, TLS, redirects, caching, and delivering responses",
      "Only parsing URL strings",
      "Rendering JSON into SwiftUI views",
      "Encrypting local files on disk",
    ],
    answer: 0,
    explanation:
      "`URLSession` is Foundation's networking object — it manages the full request/response round trip, including connection pooling, TLS, redirects, caching, and cookies.",
  },
  {
    id: "urlsession-status-predict",
    type: "predict",
    prompt: "Does this line throw when the server responds with a 404?",
    code: `let (data, response) = try await URLSession.shared.data(for: request)
// server responds 404 Not Found`,
    options: [
      "No — a 404 is still a successful network round trip; it does not throw",
      "Yes — any non-200 status throws automatically",
      "Only if the body is empty",
      "It throws a decoding error",
    ],
    answer: 0,
    explanation:
      "`URLSession` only throws for transport failures (no connection, DNS failure, timeout). A 404 is a normal, successfully-delivered HTTP response — you must check `HTTPURLResponse.statusCode` yourself.",
  },
  {
    id: "urlsession-response-cast-fill",
    type: "fill",
    prompt: "To read the HTTP status code, you downcast the generic `URLResponse` to ___.",
    answers: ["HTTPURLResponse"],
    hint: "The HTTP-specific subclass that adds statusCode.",
    explanation:
      "`URLResponse` is protocol-agnostic and has no `statusCode`. `HTTPURLResponse` is the HTTP subclass that adds `statusCode` and `allHeaderFields`.",
  },
  {
    id: "urlsession-task-types-multi",
    type: "multi",
    prompt: "Select all statements that correctly describe URLSession task types.",
    options: [
      "A data task loads the response entirely into memory",
      "A download task streams the response to a temporary file and supports resuming",
      "An upload task streams a body up to the server and can run in the background",
      "All three task types require a `.background` configuration to work at all",
    ],
    answers: [0, 1, 2],
    explanation:
      "Data, download, and upload tasks behave as described. The fourth option is false — data and upload tasks work fine on `.default` or `.shared`; `.background` is only required if you want the transfer to survive app suspension.",
  },
  {
    id: "urlsession-config-mcq",
    type: "mcq",
    prompt: "What distinguishes `URLSessionConfiguration.ephemeral` from `.default`?",
    options: [
      "Ephemeral keeps cache, cookies, and credentials in memory only, with nothing persisted to disk",
      "Ephemeral is faster because it skips TLS",
      "Ephemeral disables background transfers only",
      "There is no functional difference",
    ],
    answer: 0,
    explanation:
      "`.ephemeral` never touches disk — cache, cookies, and credentials all live in memory and vanish when the session ends. `.default` persists them, similar to `URLSession.shared`.",
  },
  {
    id: "urlsession-resume-fill",
    type: "fill",
    prompt: "The completion-handler API `dataTask(with:completionHandler:)` returns a task that is created suspended — you must call ___() to start it.",
    answers: ["resume"],
    hint: "Same word used to unpause the task.",
    explanation:
      "Unlike the `async` `data(for:)` calls, the older completion-handler task objects start suspended; forgetting `.resume()` is a classic bug where nothing ever happens.",
  },
  {
    id: "urlsession-background-senior",
    type: "mcq",
    prompt: "Why does a background `URLSessionConfiguration` require a delegate rather than the async/await task APIs?",
    options: [
      "Because the OS itself may run the transfer while the app is suspended or terminated, and can only deliver the result by relaunching the app and calling a delegate method",
      "Because background sessions don't support HTTPS",
      "Because delegates are required for all URLSession usage",
      "Background sessions are identical to ephemeral sessions",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A background session hands the transfer to the OS. Since your app process may not even be running when it finishes, the only way to get the result back is a delegate callback the system invokes on relaunch — there's no in-process `await` to resume.",
  },
  {
    id: "urlsession-challenge-senior",
    type: "predict",
    prompt: "What happens if you never implement `urlSession(_:didReceive:completionHandler:)` for a plain HTTPS API request against a normal, trusted server?",
    code: `let session = URLSession(configuration: .default) // no delegate set
let (data, response) = try await session.data(for: request)`,
    options: [
      "Nothing goes wrong — with no delegate, the session falls back to default handling, which succeeds for ordinary trusted HTTPS servers",
      "The request always fails with an authentication error",
      "It silently sends the request over plain HTTP instead",
      "It throws a compile-time error",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The authentication-challenge delegate method is only needed for special cases like self-signed certs, client certificates, or HTTP Basic/Digest auth. Without a delegate, `URLSession` performs default system handling, which is exactly right for ordinary trusted HTTPS endpoints — most requests never touch this at all.",
  },
  {
    id: "urlsession-flashcard",
    type: "flashcard",
    prompt: "Explain how you'd structure a network call with URLSession: what you build, what you check, and why. Answer aloud, then reveal.",
    modelAnswer:
      "Build a **`URLRequest`** from a `URL` with method, headers, and an encoded body if needed. Call **`try await session.data(for: request)`**, which returns `(Data, URLResponse)` and only throws for transport failures (no connection, timeout, cancellation) — not for HTTP error status codes. Downcast the response to **`HTTPURLResponse`** and check `statusCode` is in the 200...299 range yourself, since a 404 or 500 arrives as ordinary data, not a thrown error. Choose the right task type: a **data task** for JSON-sized payloads in memory, a **download task** for large files that should stream to disk and support resuming, an **upload task** for large request bodies. Pick a **`URLSessionConfiguration`**: `.default` for normal persisted caching/cookies, `.ephemeral` for in-memory-only privacy, `.background` when the transfer must survive app suspension (delivered back via a delegate callback on relaunch). Authentication is usually just an `Authorization` header; the delegate-based `URLAuthenticationChallenge` flow only kicks in for TLS trust decisions or Basic/Digest challenges.",
    keyPoints: [
      "URLRequest carries method/headers/body; data(for:) returns (Data, URLResponse)",
      "Only transport failures throw — HTTP status codes must be checked manually via HTTPURLResponse",
      "Three task types: data (memory), download (disk, resumable), upload (streams up, background-capable)",
      "Configuration choice: default (persisted) vs ephemeral (memory-only) vs background (survives suspension)",
      "Token auth = header; challenge delegate only for TLS trust / Basic-Digest",
    ],
    explanation:
      "A senior answer sequences the whole pipeline — request building, the async call, manual status-code checking, task-type choice, configuration choice, and where authentication actually plugs in.",
  },
];

export default quiz;
