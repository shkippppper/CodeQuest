import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "netlayer-endpoint-mcq",
    type: "mcq",
    prompt: "What's the main benefit of defining requests as an `Endpoint` protocol and a single `NetworkClient.send(_:)` entry point instead of building `URLRequest`s at every call site?",
    options: [
      "Auth, retry, caching, and error mapping live in one place instead of being duplicated and drifting out of sync across every screen",
      "It reduces the size of the JSON payloads sent over the wire by stripping unused fields before encoding",
      "It removes the need for JSONDecoder entirely, since the Endpoint protocol handles deserialization without a separate decoding step",
      "It automatically makes every outgoing request idempotent, so retrying on timeout can never create duplicate server-side resources",
    ],
    answer: 0,
    explanation:
      "Centralizing request construction behind one abstraction means cross-cutting concerns — auth headers, retry policy, caching, error translation — are implemented once and apply everywhere, instead of being copy-pasted and inconsistently maintained per screen.",
  },
  {
    id: "netlayer-refresh-race-predict",
    type: "predict",
    prompt: "Fifteen requests are in flight when the access token expires. Each independently calls `refreshToken()` on its own 401 with no coordination. What's the most likely outcome?",
    code: `func send<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
    // ... on 401:
    token = try await refreshToken()   // called independently, no sharing
    return try await send(endpoint)
}`,
    options: [
      "Up to fifteen simultaneous refresh calls, and if refresh tokens are single-use, most of them fail or invalidate each other",
      "Exactly one refresh call happens automatically, because URLSession detects identical endpoints and coalesces concurrent token-refresh requests behind the scenes",
      "All fifteen requests succeed with no issue, because the server accepts the same expired token for a short grace period after expiry",
      "The app crashes with an authentication error on the first 401 before any of the other in-flight requests can retry",
    ],
    answer: 0,
    explanation:
      "Without coalescing refresh attempts into a single shared in-flight task, every concurrent 401 kicks off its own refresh call — wasteful at best, and broken at worst if refresh tokens are single-use.",
  },
  {
    id: "netlayer-idempotent-fill",
    type: "fill",
    prompt: "A request that has the same effect whether it's sent once or replayed after a failure is called ___.",
    answers: ["idempotent"],
    hint: "Same word used for chat message sends being safely retryable.",
    explanation:
      "Idempotent requests are safe to retry blindly. A GET is naturally idempotent; a POST that creates a resource usually is not, unless designed to be (e.g. via a client-generated id the server dedupes on).",
  },
  {
    id: "netlayer-retry-bucket-mcq",
    type: "mcq",
    prompt: "Which of these failures should generally be retried automatically?",
    options: [
      "A request timeout",
      "A 404 Not Found",
      "A 422 validation error",
      "A 400 Bad Request",
    ],
    answer: 0,
    explanation:
      "A timeout is a transient failure — the same request might well succeed a moment later. 404, 422, and 400 are permanent failures: the request itself is wrong or the resource doesn't exist, and retrying sends the exact same failing request again.",
  },
  {
    id: "netlayer-caching-multi",
    type: "multi",
    prompt: "Select all true statements about caching in a networking layer.",
    options: [
      "Different endpoints generally need different expiry (staleness) windows",
      "A cache check should happen before making the network call",
      "Every endpoint should share one global cache expiry to keep things simple",
      "Caching decisions belong in the shared request layer rather than duplicated per screen",
    ],
    answers: [0, 1, 3],
    explanation:
      "Staleness tolerance varies by data (a stock price vs. a terms-of-service page), so a single global expiry is wrong. The cache should be checked before hitting the network, and living in the shared layer avoids per-screen duplication — same as the rest of this design.",
  },
  {
    id: "netlayer-error-model-mcq",
    type: "mcq",
    prompt: "Why translate HTTP status codes into a typed `NetworkError` enum instead of letting call sites switch on raw integers?",
    options: [
      "It gives call sites meaningful cases to switch on (like `.validation(fields:)`) without knowing or caring about the underlying status code",
      "Swift does not allow switching on raw Int values, so status codes must be converted to a named type before any pattern matching can occur",
      "It makes the network layer faster by reducing the number of integer comparisons performed at each response-handling site",
      "It removes the separate JSON decoding step, since the enum cases carry the decoded payload directly without an additional Codable conversion",
    ],
    answer: 0,
    explanation:
      "A typed error model hides transport-level detail behind cases that mean something to the caller — a signup screen can switch on `.validation(fields:)` directly instead of re-deriving meaning from a bare 422 at every call site.",
  },
  {
    id: "netlayer-testability-fill",
    type: "fill",
    prompt: "Passing a `NetworkClient` protocol into a view model from outside, instead of the view model constructing its own `URLSessionNetworkClient`, is called dependency ___.",
    answers: ["injection"],
    hint: "Two words: dependency ___.",
    explanation:
      "Dependency injection lets tests substitute a mock conforming to the same protocol, making view model tests deterministic and network-free.",
  },
  {
    id: "netlayer-nonidempotent-retry-senior",
    type: "predict",
    prompt: "🧠 A retry-on-timeout policy is applied uniformly to all requests, including `POST /orders` (creates a new order with no dedup key). A user's request times out but actually succeeded server-side just as the client gives up and retries. What happens?",
    code: `// POST /orders has no client-generated id or dedup key
// retry policy: retry any request on timeout, up to 3 attempts`,
    options: [
      "A second order is created — the retry has no way to know the first attempt already succeeded",
      "The server automatically detects and rejects the duplicate order, because HTTP POST requests carry an implicit idempotency guarantee",
      "Nothing happens on retry — a timeout always means the server never processed the original request, so retrying is always safe",
      "The client's local order cache intercepts the retry and prevents a second network request from being issued entirely",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A timeout doesn't tell you whether the server processed the request before or after the connection dropped. Retrying a non-idempotent write without a dedup mechanism (like a client-generated id the server can recognize) risks creating a duplicate resource — the same idempotency problem this course's chat lesson solves for message sends.",
  },
  {
    id: "netlayer-flashcard",
    type: "flashcard",
    prompt:
      "Explain how you'd architect a networking layer's auth refresh, retry policy, and testability. Answer aloud, then reveal.",
    modelAnswer:
      "Requests flow through a single `NetworkClient.send(_:)` built on an **`Endpoint`** abstraction, so every cross-cutting concern lives in one place instead of being duplicated per screen. For auth, attach the token per request and detect a 401 by replaying once after a refresh — but coalesce concurrent 401s into a **single shared in-flight refresh task**, so fifteen simultaneous expirations trigger exactly one refresh call instead of racing each other (a real risk with single-use refresh tokens). For retries, only retry **transient** failures (timeouts, 5xx) with exponential backoff and jitter, never permanent failures (4xx client errors), and never retry a non-idempotent write unless it's been made safe to repeat via a dedup key. Caching sits in front of the network call with a per-endpoint expiry — **staleness** tolerance differs wildly by data type, so it's never a single global setting. Every failure gets mapped to a typed `NetworkError` right where the response comes back, so call sites switch on meaning (`.validation`, `.unauthorized`) instead of raw status codes. Finally, defining the client as a protocol from the start enables **dependency injection**: view models depend on the protocol, tests swap in a mock, and no unit test ever touches the real network.",
    keyPoints: [
      "Endpoint protocol + single NetworkClient.send(_:) centralizes cross-cutting concerns",
      "401 handling coalesces concurrent refreshes into one shared in-flight task",
      "Retry only transient failures, with backoff+jitter, and only idempotent requests",
      "Cache expiry (staleness) is set per endpoint, not globally",
      "Status codes map to a typed NetworkError so call sites never see raw integers",
      "Protocol-based client enables dependency injection for network-free unit tests",
    ],
    explanation:
      "A strong answer treats the refresh race condition and the idempotent-retry distinction as the two signals of real production experience, not just describing the happy path.",
  },
];

export default quiz;
