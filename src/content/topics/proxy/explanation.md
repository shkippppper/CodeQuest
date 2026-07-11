## The problem: loading every image up front is wasteful

A profile screen shows a user's avatar:

```swift
protocol Avatar {
    func render() -> UIImage
}

struct RemoteAvatar: Avatar {
    let url: URL
    private let image: UIImage

    init(url: URL) {
        self.url = url
        self.image = RemoteAvatar.download(url)   // runs immediately, in init
    }

    func render() -> UIImage { image }
}
```

If a screen creates a hundred `RemoteAvatar` values — say, for a contact list — every single one downloads its image in `init`, immediately, even for the ninety rows the user never scrolls to see. That's a hundred network requests fired the instant the list is built, for images that may never be rendered.

## A stand-in that defers the real work

A **proxy** is a type that implements the same interface as a "real" object, but doesn't do the real object's expensive or sensitive work directly — it stands in for that object and controls access to it. Here, the proxy defers downloading until `render()` is actually called:

```swift
final class AvatarProxy: Avatar {
    private let url: URL
    private var real: RemoteAvatar?

    init(url: URL) { self.url = url }   // no download here

    func render() -> UIImage {
        if let real { return real.render() }
        let loaded = RemoteAvatar(url: url)   // download happens on first use
        real = loaded
        return loaded.render()
    }
}
```

`AvatarProxy` conforms to the same `Avatar` protocol as `RemoteAvatar`, so any code expecting an `Avatar` can't tell the difference:

```swift
let avatars: [Avatar] = urls.map { AvatarProxy(url: $0) }   // instant — nothing downloaded yet
// ... later, only for rows the user actually scrolls to ...
imageView.image = avatars[3].render()   // downloads now, first time render() is called
```

Creating a hundred `AvatarProxy` values is essentially free. The download cost only happens for the rows that actually get rendered, and only once per row — the second call to `render()` reuses `real`.

This particular flavor is called a **virtual proxy**: it stands in for an object that's expensive to create, and creates the real one lazily, on first real use.

## Predict: what does this print?

```swift
let proxy = AvatarProxy(url: someURL)
print("proxy created")
_ = proxy.render()
print("first render done")
_ = proxy.render()
print("second render done")
```

Answer: `"proxy created"` prints immediately — no download yet. The first `render()` call triggers the download, so there's a real delay before `"first render done"` prints. The second `render()` call reuses the already-loaded `real`, so it returns instantly and `"second render done"` prints right after, with no additional delay.

## Protection proxy: guarding access, not deferring it

Not every proxy is about laziness. A **protection proxy** stands in front of the real object to check permission before forwarding a call:

```swift
protocol DocumentStore {
    func delete(_ documentId: String) throws
}

struct RealDocumentStore: DocumentStore {
    func delete(_ documentId: String) throws { /* actually deletes from disk */ }
}

struct ProtectedDocumentStore: DocumentStore {
    let wrapped: DocumentStore
    let currentUser: User

    func delete(_ documentId: String) throws {
        guard currentUser.role == .admin else {
            throw AccessError.forbidden
        }
        try wrapped.delete(documentId)
    }
}
```

`ProtectedDocumentStore` looks like a decorator — it wraps another `DocumentStore` and forwards the call — but the intent is different. A decorator *adds* behavior (logging, caching, extra formatting) to every call. A proxy *controls whether the call happens at all*, and forwards unchanged when it does. Here, the real store's `delete` logic isn't touched or extended — it's just gated behind a permission check.

## Remote proxy: hiding a network boundary

A **remote proxy** stands in for an object that actually lives somewhere else — another process, another machine — and makes calling it look like a local method call:

```swift
protocol WeatherService {
    func currentTemperature(city: String) async throws -> Double
}

final class RemoteWeatherProxy: WeatherService {
    func currentTemperature(city: String) async throws -> Double {
        let (data, _) = try await URLSession.shared.data(from: weatherURL(city))
        return try JSONDecoder().decode(WeatherResponse.self, from: data).temperature
    }
}
```

Code that calls `weatherService.currentTemperature(city: "Batumi")` doesn't need to know whether that's a local computation or a network round trip across the world — the proxy hides the network boundary behind the same `async throws` interface a local implementation would have. This is the same shape XPC and gRPC-generated clients use: a local-looking object whose methods secretly serialize a request, send it elsewhere, and deserialize the response.

## The three flavors side by side

| Kind | What it guards against | What triggers the real work |
|---|---|---|
| Virtual proxy | Expensive creation you don't always need | First real use (e.g. first `render()`) |
| Protection proxy | Unauthorized access | A permission check passing |
| Remote proxy | The complexity of a network/process boundary | Any call — always forwards over the wire |

All three share the same skeleton: conform to the real object's interface, hold a reference to (or a way to create) the real thing, and decide — lazily, conditionally, or transparently — when and how to forward the call.

## Proxy vs decorator, precisely

Both wrap something and implement the same interface, which is why they're easy to confuse. The difference is intent: a decorator's job is to *add* behavior around every call and typically wraps something that already exists and is cheap to hold. A proxy's job is to *control access* to something — deferring its creation, gatekeeping it, or hiding its location — and often the whole point is that the real object might never be created or called at all. If you're stacking multiple layers to combine independent features, that's decoration. If you're guarding, deferring, or relocating access to one specific real object, that's a proxy.

## Common pitfalls

- **Confusing proxy with decorator and stacking proxies like decorators.** Multiple protection proxies checking different permissions in sequence usually means the permission logic should be a single composed check, not a chain of wrapper types.
- **Forgetting to cache the real object in a virtual proxy.** If `render()` re-downloads on every call instead of storing `real`, you've built something slower than not having a proxy at all.
- **Leaking the real type through error messages or logging**, which defeats a protection proxy — the whole point is that unauthorized callers shouldn't learn anything about the guarded object.

## Interview lens

If asked what a proxy is, define it by intent, not just shape: a stand-in that implements the real object's interface and controls access to it — deferring creation (virtual), checking permission (protection), or hiding a location boundary (remote) — rather than adding new behavior to every call.

If asked to distinguish it from decorator, say it directly: decorator adds behavior around something that already exists and is cheap; proxy controls whether/when/how the real, often-expensive-or-guarded object gets involved at all. Interviewers use this pair specifically to check you're not treating "wraps another object" as one single pattern.

If asked for a lazy-loading example, walk through the `render()` cache: nothing downloads in `init`, the real object is created and cached on first use, and every subsequent call is free — that's the concrete mechanic behind "virtual proxy" that shows you understand it beyond the definition.
