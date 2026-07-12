## The problem: every screen writing its own URLSession call

Here's how a networking bug usually starts — one screen fetching a profile:

```swift
let (data, _) = try await URLSession.shared.data(from: profileURL)
let profile = try JSONDecoder().decode(Profile.self, from: data)
```

That's fine, once. Now imagine forty screens each doing this: forty places that build headers by hand, forty places that decide how to handle a 401, forty places that either retry on a timeout or silently don't. Fix a bug in how you attach an auth token and you're hunting through forty call sites. This lesson designs the layer that exists specifically so that never happens — one place that knows how to make a request, refresh a token, retry, cache, and report a failure, that every screen calls into the same way.

The `urlsession` and `rest-json` topics in this course cover the request/response mechanics and `Codable` pipelines this layer sits on top of — this lesson assumes that ground and focuses on the architecture around it.

## Request abstraction: one shape for every endpoint

The first design decision is what a "thing you can send" looks like. Instead of forty call sites each building a `URLRequest` by hand, define one type that describes an endpoint declaratively:

```swift
protocol Endpoint {
    var path: String { get }
    var method: String { get }
    var body: Encodable? { get }
}
```

A concrete endpoint is now just data:

```swift
struct FetchProfile: Endpoint {
    let userId: String
    var path: String { "/users/\(userId)" }
    var method: String { "GET" }
    var body: Encodable? { nil }
}
```

One piece of code turns any `Endpoint` into an actual request and decodes the response — this is the layer everything else in this lesson attaches to:

```swift
protocol NetworkClient {
    func send<T: Decodable>(_ endpoint: Endpoint) async throws -> T
}
```

Notice what changed: call sites no longer know about `URLSession`, headers, or JSON at all. They ask for `FetchProfile(userId: "42")` and get back a `Profile` — everything else in this lesson is stuff that lives *inside* `send(_:)`, invisible to the caller.

```swift
let profile: Profile = try await client.send(FetchProfile(userId: "42"))
```

## Auth & token refresh: the request that needs two requests

A logged-in request needs an access token attached, but the interesting design problem is what happens when that token has expired mid-session. Start with the naive version:

```swift
func send<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
    var request = build(endpoint)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    let (data, response) = try await session.data(for: request)
    return try decode(data)
}
```

This works until `token` expires, at which point every in-flight and future request starts failing with a 401 until the user logs in again — not acceptable for a session that's supposed to stay alive for weeks. The fix is to detect the 401, get a new token, and transparently replay the request:

```swift
func send<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
    var request = build(endpoint)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    let (data, response) = try await session.data(for: request)

    if (response as? HTTPURLResponse)?.statusCode == 401 {
        token = try await refreshToken()          // new access token
        return try await send(endpoint)            // replay once, with fresh token
    }
    return try decode(data)
}
```

Predict: what happens if fifteen requests are in flight and the token expires at the same moment they all get their 401s?

Answer: without extra care, all fifteen call `refreshToken()` independently — fifteen refresh requests hit the server, and some refresh tokens are single-use, so fourteen of those calls fail and invalidate each other. The fix is to make refresh a **single shared in-flight task**: the first 401 kicks off one refresh, and every other request that hits a 401 while that refresh is already running awaits the *same* task instead of starting its own.

```swift
var refreshTask: Task<String, Error>?

func getValidToken() async throws -> String {
    if let existing = refreshTask { return try await existing.value }
    let task = Task { try await refreshToken() }
    refreshTask = task
    defer { refreshTask = nil }
    return try await task.value
}
```

Now fifteen simultaneous 401s trigger exactly one network call to the refresh endpoint, and all fifteen requests replay once it resolves.

## Retry/backoff: knowing what's safe to retry

Not every failure should be retried, and retrying blindly can make things worse. Start by splitting failures into two buckets:

```swift
enum Failure {
    case transient   // timeout, 503, no connection — try again
    case permanent   // 400, 404, 422 — retrying changes nothing
}
```

A `404` means the resource doesn't exist; sending the exact same request again gets the exact same `404`. A timeout might just mean the network hiccuped for a second — trying again is often all it takes. Retrying only the transient bucket, with the same exponential-backoff-plus-jitter idea from this course's chat-system-design lesson, avoids hammering a server that's already struggling:

```swift
func send<T: Decodable>(_ endpoint: Endpoint, attempt: Int = 0) async throws -> T {
    do {
        return try await performRequest(endpoint)
    } catch let error as Failure where error == .transient && attempt < 3 {
        let delay = pow(2.0, Double(attempt)) + Double.random(in: 0...0.5)
        try await Task.sleep(for: .seconds(delay))
        return try await send(endpoint, attempt: attempt + 1)
    }
}
```

Each retry waits longer than the last, with a little randomness so a batch of clients that all failed at once don't all retry in the same instant. One more rule matters here: only retry requests that are safe to repeat. A `GET` is naturally safe. A `POST` that creates a resource is not, unless it's been made idempotent the way the chat lesson's message-send is — otherwise a retried "create order" turns into two orders.

## Caching: not making the same request twice

Some data doesn't change every second — a user's own profile, a list of countries, a product catalog page. Refetching it on every screen visit wastes bandwidth and adds latency the user can feel. A cache sits in front of the request:

```swift
protocol ResponseCache {
    func get<T: Decodable>(for endpoint: Endpoint) -> T?
    func set<T: Encodable>(_ value: T, for endpoint: Endpoint, expiresIn: TimeInterval)
}
```

Wiring it in is a check before the network call, and a write after:

```swift
func send<T: Codable>(_ endpoint: Endpoint) async throws -> T {
    if let cached: T = cache.get(for: endpoint) { return cached }
    let result: T = try await performRequest(endpoint)
    cache.set(result, for: endpoint, expiresIn: 60)
    return result
}
```

The hard part isn't storing the response — it's deciding how long it's trustworthy for, called its **staleness** window. Sixty seconds is fine for a product catalog; it's much too long for a stock ticker and pointlessly short for a static terms-of-service page. Different endpoints need different expiry policies, which is why `expiresIn` is a parameter here rather than a global constant. The dedicated caching topic in this course goes deeper into invalidation strategies; here the point is just that caching is a decision made *per endpoint*, not a blanket setting.

## Error model: turning HTTP into something Swift can switch on

An HTTP response gives you a status code and some bytes. A caller writing business logic shouldn't have to know that 401 means "reauth" and 422 means "validation failed" — that mapping belongs in one place, so define a typed error every failure gets translated into:

```swift
enum NetworkError: Error {
    case unauthorized
    case notFound
    case validation(fields: [String: String])
    case serverError(statusCode: Int)
    case offline
    case decodingFailed
}
```

The translation happens right where the raw response comes back, so nothing downstream ever touches a bare status code:

```swift
func mapError(statusCode: Int, data: Data) -> NetworkError {
    switch statusCode {
    case 401: return .unauthorized
    case 404: return .notFound
    case 422: return .validation(fields: parseFieldErrors(data))
    default:  return .serverError(statusCode: statusCode)
    }
}
```

Now a screen showing a signup form can `switch` on `.validation(fields:)` and highlight the exact fields the server rejected, without knowing or caring that "422" was involved. This is the same instinct as the earlier `Endpoint` abstraction: hide the transport-level detail, expose something meaningful to the caller.

## Testability: making the network layer swappable

If `NetworkClient` is a concrete type wrapping `URLSession`, every unit test that touches a view model ends up making real network calls — slow, flaky, and dependent on a live server being up. Because `send(_:)` was defined as a protocol requirement from the very first section, this is already solved: any type conforming to `NetworkClient` can stand in for the real one.

```swift
final class MockNetworkClient: NetworkClient {
    var stubbedResult: Result<Any, Error> = .success(())
    func send<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        switch stubbedResult {
        case .success(let value): return value as! T
        case .failure(let error): throw error
        }
    }
}
```

A view model that depends on `NetworkClient` (the protocol) rather than a concrete `URLSessionNetworkClient` can be tested with the mock swapped in — no network, no server, deterministic results, including forcing exact failures like `.unauthorized` to verify the token-refresh path actually fires. This is **dependency injection**: passing a collaborator in from outside instead of the type constructing its own, and it's the reason the whole layer was designed around a protocol in the first place, not just for production flexibility.

## Common pitfalls

- **Building `URLRequest`s at every call site.** Duplicated header and auth logic that drifts out of sync; centralize it behind one `Endpoint`-driven client.
- **Retrying non-idempotent writes blindly.** Retrying a `POST` that isn't safe to repeat can create duplicate resources.
- **Letting concurrent 401s each trigger their own refresh.** Without a shared in-flight task, simultaneous requests race and can invalidate each other's refresh attempt.
- **Leaking status codes into UI code.** Switching on raw integers scattered across screens instead of one typed `NetworkError` makes every call site fragile to server changes.

## Interview lens

If asked to design a networking layer, open with the shape: a protocol-based `Endpoint` describing a request declaratively, and a `NetworkClient` protocol that turns any `Endpoint` into a decoded result. That single decision is what makes everything else — mocking, retry policy, caching — attachable in one place instead of scattered across call sites.

When the conversation turns to auth, the strongest signal is naming the race condition: many requests can hit a 401 at once, and without coalescing refresh attempts into one shared in-flight task, you get redundant or conflicting refresh calls. Bring this up before they ask.

If pushed on retries, be precise about what's safe: only transient failures (timeouts, 5xx) and only idempotent requests. Retrying a non-idempotent write blindly is a correctness bug dressed up as resilience, and interviewers listen for whether you catch that distinction unprompted.
