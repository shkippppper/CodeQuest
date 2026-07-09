## The problem: one-off URLSession calls don't scale

The previous lesson got you a single request working:

```swift
let (data, response) = try await URLSession.shared.data(for: request)
```

That's fine for one call. Now imagine your app has thirty endpoints — articles, comments, profile, search, upload — each needing its own URL, method, headers, and JSON decoding. Copy-pasting that block thirty times means thirty places to fix when the base URL changes, thirty places that might forget to check the status code, thirty slightly different ways of decoding a date.

This lesson is about building a small **request layer** — a single, reusable pipeline that every feature routes through — so the app has *one* place that knows how to talk to the network, and every call site just describes *what* it wants.

## Modeling an endpoint as data

Start by describing a request as a value, not as scattered `URLRequest` code:

```swift
struct Endpoint {
    var path: String
    var method: String = "GET"
    var queryItems: [URLQueryItem] = []
}
```

An `Endpoint` doesn't know how to *perform* a request — it just describes one: which path, which HTTP method, which query parameters. That separation matters: the description is easy to test and easy to construct, and turning it into a real request is one function's job.

```swift
let articles = Endpoint(path: "/articles", queryItems: [URLQueryItem(name: "page", value: "1")])
```

Now grow it to actually build a `URLRequest`:

```swift
extension Endpoint {
    func makeRequest(baseURL: URL) -> URLRequest {
        var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        components.queryItems = queryItems.isEmpty ? nil : queryItems
        var request = URLRequest(url: components.url!)
        request.httpMethod = method
        return request
    }
}
```

`URLComponents` builds a URL piece by piece — scheme, host, path, query — instead of you hand-concatenating strings, which is exactly how a stray `?` or unescaped `&` sneaks into a URL and breaks a request. The whole point of the `Endpoint` type is that call sites never touch `URLComponents` or `URLRequest` directly — they just describe what they want.

Real APIs need more than a path and method — headers, a request body, whether it needs auth — but the shape stays the same: add fields to `Endpoint`, and one function turns the description into a `URLRequest`.

## The request layer: one function everything goes through

With endpoints as values, the actual network call collapses into one generic function:

```swift
struct APIClient {
    let baseURL: URL
    let session: URLSession = .shared

    func send(_ endpoint: Endpoint) async throws -> Data {
        let request = endpoint.makeRequest(baseURL: baseURL)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw APIError.badStatus
        }
        return data
    }
}
```

Every feature in the app calls `client.send(endpoint)`. The status-code check lives in exactly one place now, not scattered across thirty call sites. This is the payoff of the request layer: adding a new endpoint means adding a new `Endpoint` value, not writing new networking code.

## Decoding into models

`send(_:)` above returns raw `Data`. The next step is turning JSON bytes into a typed Swift value using **`Codable`** — the protocol pair (`Decodable` + `Encodable`) that lets `JSONDecoder`/`JSONEncoder` convert between JSON and your structs automatically.

```swift
struct Article: Decodable {
    let id: Int
    let title: String
    let publishedAt: Date
}
```

A plain `JSONDecoder()` expects the JSON to already match Swift's naming and date format exactly, which real APIs rarely do. Two decoder settings handle the common mismatches:

```swift
let decoder = JSONDecoder()
decoder.keyDecodingStrategy = .convertFromSnakeCase   // published_at -> publishedAt
decoder.dateDecodingStrategy = .iso8601                 // "2024-03-01T12:00:00Z" -> Date
```

`.convertFromSnakeCase` maps JSON's `published_at` onto Swift's `publishedAt` automatically, and `.iso8601` parses ISO-formatted date strings straight into `Date` — both without you writing custom `CodingKeys` or `init(from:)` for the common case.

Now add a generic decode step to the client:

```swift
extension APIClient {
    func send<T: Decodable>(_ endpoint: Endpoint, decoding type: T.Type) async throws -> T {
        let data = try await send(endpoint)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }
}
```

Call sites now get a fully typed model with one line: `let articles = try await client.send(endpoint, decoding: [Article].self)`. Notice the `do`/`catch` wrapping the decode call — a decoding failure gets *re-thrown* as an `APIError`, not left as a raw `DecodingError`. That leads into the next problem: what error type should the rest of the app actually see?

## Error mapping: giving the app one error type to handle

Right now `APIError.badStatus` and `APIError.decoding` are two cases of one type — but a real client faces several distinct failure sources: no connection, a bad status code, malformed JSON, an expired token. If every call site has to `catch` `URLError`, `DecodingError`, *and* your own type separately, every screen ends up duplicating the same triage logic.

The fix is **error mapping**: catching every underlying error at the edge of the request layer and translating it into one small, app-specific enum.

```swift
enum APIError: Error {
    case offline
    case unauthorized
    case badStatus(Int)
    case decoding(Error)
}
```

```swift
func send(_ endpoint: Endpoint) async throws -> Data {
    do {
        let request = endpoint.makeRequest(baseURL: baseURL)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.badStatus(-1) }
        if http.statusCode == 401 { throw APIError.unauthorized }
        guard (200...299).contains(http.statusCode) else { throw APIError.badStatus(http.statusCode) }
        return data
    } catch let urlError as URLError where urlError.code == .notConnectedToInternet {
        throw APIError.offline
    }
}
```

Now every screen in the app switches over one `APIError` enum — "show a login screen", "show an offline banner", "show a generic error" — instead of untangling `URLError` codes and status integers by hand at every call site.

## Retry and timeout

Some failures are worth retrying automatically — a dropped Wi-Fi packet, a momentary 503 — while others (a `404`, a decoding mismatch) will never succeed no matter how many times you ask. A retry wrapper around `send` handles the first kind:

```swift
func send(_ endpoint: Endpoint, retries: Int = 2) async throws -> Data {
    for attempt in 0...retries {
        do {
            return try await send(endpoint)
        } catch APIError.badStatus(let code) where code >= 500 && attempt < retries {
            try await Task.sleep(for: .seconds(Double(attempt + 1)))
            continue
        }
    }
    throw APIError.badStatus(-1)   // unreachable in practice, satisfies the compiler
}
```

Only a `5xx` server error triggers a retry, and the wait grows with each attempt — `1s`, then `2s` — a pattern called **exponential backoff**, which avoids hammering a struggling server with instant retries.

Timeouts prevent the opposite failure: a request that never resolves at all.

```swift
var request = endpoint.makeRequest(baseURL: baseURL)
request.timeoutInterval = 10   // seconds
```

If the server hasn't responded within the interval, `URLSession` cancels the request and throws a `URLError` with code `.timedOut` — which your error mapping above should route into `APIError` alongside every other failure.

## Mocking the network for tests

Testing `APIClient` against the real network is slow, flaky, and can't simulate a 500 error on demand. The fix is to make the client depend on a **protocol**, not on `URLSession` directly, so a test can swap in a fake:

```swift
protocol HTTPClient {
    func data(for request: URLRequest) async throws -> (Data, URLResponse)
}

extension URLSession: HTTPClient {}   // URLSession already matches this shape
```

`APIClient` now stores an `HTTPClient` instead of a concrete `URLSession`:

```swift
struct APIClient {
    let baseURL: URL
    let session: HTTPClient
}
```

In production you construct it with the real `URLSession.shared`. In tests, you construct it with a fake that returns canned data instantly:

```swift
struct MockHTTPClient: HTTPClient {
    var data: Data
    var statusCode: Int = 200
    func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        let response = HTTPURLResponse(url: request.url!, statusCode: statusCode, httpVersion: nil, headerFields: nil)!
        return (data, response)
    }
}
```

A test can now hand the client a `MockHTTPClient` returning a 500, and assert the retry logic actually retries — no real network, no flakiness, no waiting.

## Common pitfalls

- **Hand-concatenating URL strings.** A stray `&` or unescaped space breaks silently; build URLs with `URLComponents`.
- **Retrying every failure.** Retrying a `404` or a decode error just wastes time and battery — only retry transient failures like `5xx` or timeouts.
- **Testing against the real network.** Slow and flaky, and you can't simulate server errors on demand — depend on a protocol so tests can inject a mock.
- **Letting raw `DecodingError`/`URLError` leak to the UI layer.** Map every failure into one app-specific error type at the edge of the request layer.

## Interview lens

If asked how you'd structure networking in a real app, describe the layers in order: an `Endpoint` type that models a request as data, one `APIClient.send` function every call routes through, a `Codable` decode step with explicit key/date strategies, and an error-mapping layer that turns every failure into one app-specific enum.

If asked about retries, the sharp answer distinguishes retryable failures (timeouts, `5xx`) from non-retryable ones (`4xx`, decode errors) and names exponential backoff as the standard pattern — retrying instantly just adds load to an already-struggling server.

If asked how you'd unit test networking code, say you inject a protocol (not a concrete `URLSession`) into the client, so tests can hand it a mock that returns canned responses instantly, including simulated failures that would be hard to trigger against a real server.
