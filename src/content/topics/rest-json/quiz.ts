import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "restjson-endpoint-purpose",
    type: "mcq",
    prompt: "What is the main benefit of modeling an `Endpoint` as a plain struct instead of building `URLRequest`s inline at every call site?",
    options: [
      "It centralizes request construction so call sites describe *what* they want and only one place knows *how* to build a URLRequest",
      "It makes requests execute faster over the network",
      "It removes the need for a base URL",
      "It automatically retries failed requests",
    ],
    answer: 0,
    explanation:
      "An `Endpoint` value separates *describing* a request from *performing* one. Every feature constructs a simple value; one function turns it into a `URLRequest`, so fixes and improvements happen in one place.",
  },
  {
    id: "restjson-urlcomponents-fill",
    type: "fill",
    prompt: "To safely assemble a URL from a base, path, and query items without hand-concatenating strings, you use ___.",
    answers: ["URLComponents"],
    hint: "A Foundation type that builds URLs piece by piece.",
    explanation:
      "`URLComponents` builds the URL from scheme/host/path/query parts, avoiding the classic bug of a stray unescaped `&` or `?` breaking a hand-built URL string.",
  },
  {
    id: "restjson-decoding-predict",
    type: "predict",
    prompt: "This JSON key is `published_at` and the Swift property is `publishedAt`. What happens with a plain `JSONDecoder()` and no custom CodingKeys?",
    code: `struct Article: Decodable { let publishedAt: Date }
let decoder = JSONDecoder()
// decoder.keyDecodingStrategy left at default
try decoder.decode(Article.self, from: json)`,
    options: [
      "It throws a decoding error — the default strategy expects an exact key match",
      "It silently decodes publishedAt as nil",
      "It automatically converts snake_case to camelCase",
      "It ignores the mismatched key and uses today's date",
    ],
    answer: 0,
    explanation:
      "`JSONDecoder`'s default `keyDecodingStrategy` requires exact key names. `published_at` won't match `publishedAt` unless you set `.convertFromSnakeCase` or provide custom `CodingKeys`.",
  },
  {
    id: "restjson-error-mapping-mcq",
    type: "mcq",
    prompt: "Why map every networking failure (URLError, DecodingError, bad status codes) into one app-specific error enum?",
    options: [
      "So every screen can switch over one small error type instead of duplicating triage logic for several unrelated error types at every call site",
      "Because Swift requires all thrown errors to be the same type",
      "It makes the network requests faster",
      "It removes the need for a status-code check",
    ],
    answer: 0,
    explanation:
      "Error mapping happens once at the edge of the request layer. Every call site then handles one small `APIError` enum instead of separately triaging `URLError`, `DecodingError`, and raw status integers.",
  },
  {
    id: "restjson-retry-multi",
    type: "multi",
    prompt: "Select all statements that describe good retry behavior for a network client.",
    options: [
      "Retry transient failures like 5xx server errors and timeouts",
      "Retry a 404 Not Found repeatedly, since the resource might appear",
      "Increase the delay between retries (exponential backoff) instead of retrying instantly",
      "Retry a decoding error, since the same bytes might decode differently next time",
    ],
    answers: [0, 2],
    explanation:
      "Only transient, likely-to-succeed-next-time failures (5xx, timeouts) are worth retrying, with growing delays (backoff) to avoid hammering a struggling server. A 404 or a decoding error will fail identically every time — retrying wastes time and battery.",
  },
  {
    id: "restjson-mock-fill",
    type: "fill",
    prompt: "To let a test inject fake network responses, `APIClient` should depend on a ___ (an abstraction), not a concrete `URLSession`.",
    answers: ["protocol"],
    hint: "The Swift language feature that lets both URLSession and a fake conform to the same interface.",
    explanation:
      "Depending on a small protocol (e.g. `HTTPClient`) that `URLSession` already conforms to lets tests substitute a mock implementation returning canned data instantly, with no real network calls.",
  },
  {
    id: "restjson-status-401-senior",
    type: "predict",
    prompt: "A request layer maps status codes to `APIError`. What's the strongest reason to give `401 Unauthorized` its own case (`.unauthorized`) instead of folding it into a generic `.badStatus(Int)`?",
    code: `enum APIError: Error {
    case unauthorized
    case badStatus(Int)
    // ...
}`,
    options: [
      "A 401 usually means the app should react specially — e.g. clear the stored token and show a login screen — which is different behavior from a generic server error",
      "401 is not a valid HTTP status code",
      "It makes JSON decoding faster",
      "There's no real difference; badStatus(401) would behave identically everywhere",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Distinguishing `.unauthorized` lets calling code react specifically — e.g. trigger a re-login flow — rather than showing a generic error message for what is actually an auth-state problem distinct from a server malfunction.",
  },
  {
    id: "restjson-backoff-senior",
    type: "mcq",
    prompt: "Why does exponential backoff matter for retries, beyond just 'adding a delay'?",
    options: [
      "Growing the delay between attempts reduces load on an already-struggling server instead of hitting it with a burst of immediate retries, which can make an outage worse",
      "It guarantees the request will eventually succeed",
      "It's required by the HTTP spec",
      "It makes JSONDecoder faster on subsequent attempts",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "If every failing client retries instantly and simultaneously, that burst of traffic can worsen an already-degraded server — sometimes called a retry storm. Exponential backoff spreads retries out over time, reducing added load.",
  },
  {
    id: "restjson-flashcard",
    type: "flashcard",
    prompt: "Walk through the full request layer pipeline: from an app feature calling for data, to a typed model arriving, to how errors and tests fit in. Answer aloud, then reveal.",
    modelAnswer:
      "A feature describes what it wants as an **`Endpoint`** value (path, method, query items) rather than building a `URLRequest` directly. One `makeRequest(baseURL:)` function turns that description into a real `URLRequest`, using **`URLComponents`** to assemble the URL safely. `APIClient.send` performs the request, checks the `HTTPURLResponse.statusCode`, and — critically — **maps every failure** (bad status, `URLError`, `DecodingError`) into one small app-specific `APIError` enum so the rest of the app only ever handles one error type. A generic decode overload runs the bytes through a **`JSONDecoder`** configured with `.convertFromSnakeCase` and `.iso8601` (or custom `CodingKeys`) to produce a typed **`Codable`** model. A **retry wrapper** re-attempts only transient failures (5xx, timeouts) with **exponential backoff**, leaving permanent failures (404, decode errors) to fail immediately. For testing, `APIClient` depends on a small **protocol** instead of concrete `URLSession`, so a test can inject a mock returning canned data — including simulated failures — with no real network call.",
    keyPoints: [
      "Endpoint models a request as data; one function builds the URLRequest",
      "APIClient.send checks status code and maps every failure into one APIError enum",
      "JSONDecoder key/date strategies bridge JSON naming to Swift Codable models",
      "Retry only transient failures (5xx/timeout) with exponential backoff",
      "Protocol-based HTTPClient dependency makes the client mockable in tests",
    ],
    explanation:
      "A strong answer names every layer in the pipeline in order and explains *why* each exists — not just what it does.",
  },
];

export default quiz;
