## The problem: your app needs data that lives on someone else's server

Try this and nothing happens:

```swift
let url = URL(string: "https://api.example.com/articles")!
```

A `URL` is just a parsed string — a value type describing *where* something is. It doesn't fetch anything. To actually talk to a server, open a connection, send a request, and read back a response, you need something that manages that whole round trip. In Foundation, that something is **`URLSession`** — the object responsible for network requests: connection pooling, TLS, redirects, caching, cookies, and delivering you a response.

This lesson walks through how to use it, from the simplest fetch to authentication challenges.

## The simplest request: async URLSession

The shortest path from a URL to data is one line:

```swift
let (data, response) = try await URLSession.shared.data(from: url)
```

`URLSession.shared` is a ready-made singleton session with default settings — fine for one-off requests. Calling `.data(from:)` suspends the current task, performs the HTTP request, and resumes with two things once the server replies: the raw `Data` bytes and a `URLResponse` describing what came back (status code, headers, MIME type).

Because this is an `async` function, it must run inside an `async` context and be marked `try` — the network can fail, so it can throw.

```swift
func fetchArticles() async throws -> Data {
    let url = URL(string: "https://api.example.com/articles")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return data
}
```

That's the whole modern happy path: one call, one await, data in hand. Everything else in this lesson is about the pieces this one-liner is quietly using — and what to do when things aren't this simple.

## Building the actual request

`.data(from:)` takes a bare `URL`, which only works for a plain `GET`. Real APIs need a method, headers, and sometimes a body — for that you build a **`URLRequest`**, a value type that bundles a URL with everything else describing the HTTP request.

```swift
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.httpBody = try JSONEncoder().encode(newArticle)
```

Four lines build a complete `POST` request: the target URL, the HTTP method, one header, and a JSON body encoded from a Swift value. `URLSession` has an overload of `.data(from:)` that takes a `URLRequest` instead of a `URL`:

```swift
let (data, response) = try await URLSession.shared.data(for: request)
```

Note the label change: `data(from:)` for a `URL`, `data(for:)` for a `URLRequest`. Both return the same `(Data, URLResponse)` pair.

## Reading the status code

`URLResponse` is deliberately generic — it covers non-HTTP protocols too, so it doesn't have a `statusCode` property. For HTTP work you downcast it to **`HTTPURLResponse`**, the HTTP-specific subclass that adds `statusCode` and `allHeaderFields`.

```swift
guard let http = response as? HTTPURLResponse else {
    throw URLError(.badServerResponse)
}
print(http.statusCode)   // e.g. 200, 404, 500
```

Predict: does `URLSession` throw an error for a `404 Not Found` response?

Answer: no. A 404 is still a successful *network* round trip — the server responded, it just responded with "not found". `.data(for:)` only throws for actual transport failures: no connection, DNS failure, timeout, cancelled task. Checking whether the status code means success is entirely your job:

```swift
guard (200...299).contains(http.statusCode) else {
    throw URLError(.badServerResponse)
}
```

This is the single most common networking bug in interviews and in real code: forgetting that a non-2xx response arrives as normal data, not as a thrown error.

## The three task types: data, download, upload

`.data(for:)` is built on top of a **`URLSessionDataTask`** — the task type that loads a response entirely into memory as `Data`. That's right for JSON APIs, but wrong for a 2 GB video: loading it all into memory would be wasteful or crash the app.

For large files, `URLSession` has two more task types:

```swift
let (fileURL, response) = try await URLSession.shared.download(from: url)
```

A **`URLSessionDownloadTask`** streams the response straight to a temporary file on disk instead of into memory, and it can be paused and resumed — useful for a large download that might get interrupted.

```swift
let (data, response) = try await URLSession.shared.upload(for: request, from: fileData)
```

A **`URLSessionUploadTask`** is the mirror image: it streams a file or `Data` blob *up* to the server, which matters for large `POST` bodies where you don't want to hold the whole thing in one in-memory request object at once (upload tasks also support background upload, covered below).

All three task types exist as both the modern `async` calls above and an older completion-handler form, `URLSession.shared.dataTask(with:completionHandler:)`, which you'll still see in older codebases and must call `.resume()` on to actually start.

## Configurations: sessions aren't all the same

Every `URLSession` is built from a **`URLSessionConfiguration`**, a value type describing *how* that session behaves — caching policy, timeout intervals, whether it allows cellular data, cookie handling.

```swift
let config = URLSessionConfiguration.default
let session = URLSession(configuration: config)
```

`.default` is what `URLSession.shared` effectively uses — disk-backed caching, shared cookie storage. Two other configurations change the fundamentals:

```swift
let ephemeral = URLSessionConfiguration.ephemeral
```

**`.ephemeral`** keeps everything — cache, cookies, credentials — in memory only, gone the instant the session is invalidated or the app quits. Use it for a private-browsing-style flow, or anywhere you don't want traces left on disk.

```swift
let background = URLSessionConfiguration.background(withIdentifier: "com.app.uploads")
```

**`.background`** hands the transfer off to the OS itself, so uploads and downloads keep running even if your app is suspended or terminated — the system relaunches your app in the background to deliver the result via a delegate callback. This is how apps upload large files reliably even if the user backgrounds the app mid-transfer.

## Handling authentication challenges

Some servers don't just want a bearer token in a header — they actively challenge the connection, most commonly for HTTPS certificate validation or HTTP Basic auth. `URLSession` surfaces this through a delegate method:

```swift
func urlSession(
    _ session: URLSession,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
) {
    if challenge.protectionSpace.authenticationMethod == .serverTrust {
        let credential = URLCredential(trust: challenge.protectionSpace.serverTrust!)
        completionHandler(.useCredential, credential)
    } else {
        completionHandler(.performDefaultHandling, nil)
    }
}
```

An **`URLAuthenticationChallenge`** describes what the server is asking for — its `protectionSpace` tells you the auth method (server trust for TLS, HTTP Basic/Digest, client certificate). You respond by calling the completion handler with a **disposition**: use a credential, cancel, or fall back to the system's default handling.

This delegate-based flow only exists on a session created with a delegate — `URLSession.shared` has no delegate, so it always falls back to default handling, which is exactly what you want for ordinary public HTTPS APIs and why most requests never touch this at all.

For everyday token-based auth (the far more common case), you don't need a challenge handler at all — you just set a header:

```swift
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
```

That's an ordinary header on the request, handled entirely by your code with no delegate involved.

## Common pitfalls

- **Treating a 404/500 as a thrown error.** It isn't — `URLSession` only throws for transport failures. Always check `HTTPURLResponse.statusCode` yourself.
- **Loading huge files with a data task.** Use a download task so the bytes stream to disk instead of filling memory.
- **Forgetting `.resume()` on the completion-handler API.** Unlike the `async` calls, `dataTask(with:completionHandler:)` returns a task that's created *suspended* — nothing happens until you call `.resume()`.
- **Assuming `URLSession.shared` handles background transfers.** It doesn't; background transfers need an explicit session built with a `.background` configuration.

## Interview lens

If asked "how do you make a network request in Swift," give the modern answer first: `try await URLSession.shared.data(for: request)`, then mention you have to downcast the `URLResponse` to `HTTPURLResponse` to read the status code, because a non-2xx response is *not* a thrown error.

If asked about task types, name all three and their purpose in one line each: data tasks load into memory, download tasks stream to disk and support resuming, upload tasks stream a body up and support background transfer.

If asked about `.default` vs `.ephemeral` vs `.background`, the crisp answer is: default persists cache/cookies to disk, ephemeral keeps everything in memory only, background lets the OS carry the transfer even if your app is suspended. Mentioning that background sessions relaunch the app via a delegate callback is the kind of detail that signals you've actually shipped a large-file-upload feature, not just read the docs.
