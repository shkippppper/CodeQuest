## The problem: the interface you need isn't the interface you have

Your app defines a clean protocol for anything that can report analytics events:

```swift
protocol AnalyticsClient {
    func track(event: String, properties: [String: Any])
}
```

Then you add a third-party crash-and-analytics SDK to the project. It ships its own type, with its own method names, that you can't edit:

```swift
final class VendorSDK {
    func logEvent(_ name: String, metadata: [String: Any]) { /* vendor internals */ }
}
```

`VendorSDK` does exactly what you need — it just doesn't speak `AnalyticsClient`. You can't add a protocol conformance to code you don't own, and you don't want every call site in the app to learn `VendorSDK`'s particular method names.

The **adapter** pattern's intent is to wrap an object with an incompatible interface inside a small type that *does* match the interface your code expects — translating calls on one side into calls on the other.

## Object adapter: wrap it in a new type

Write a small type that holds the vendor object and conforms to your protocol on its behalf:

```swift
final class VendorSDKAdapter: AnalyticsClient {
    private let sdk: VendorSDK

    init(sdk: VendorSDK) {
        self.sdk = sdk
    }

    func track(event: String, properties: [String: Any]) {
        sdk.logEvent(event, metadata: properties)
    }
}
```

`track(event:properties:)` is the method your app calls; `sdk.logEvent(_:metadata:)` is what actually runs. The adapter's only job is that one-line translation.

```swift
let client: AnalyticsClient = VendorSDKAdapter(sdk: VendorSDK())
client.track(event: "checkout_completed", properties: ["total": 42])
```

Every call site sees `AnalyticsClient` — nothing outside the adapter ever writes the name `VendorSDK` or `logEvent`. This is called an **object adapter**: it holds the incompatible object as a stored property and forwards calls to it. Because it's a separate wrapping object rather than the vendor type itself, this works even when `VendorSDK` is `final` or lives in a library you can't modify at all.

## Protocol adapter: extend the type directly

If the type you're adapting is one you *can* extend — your own type, or an open class from a library — you don't need a separate wrapper object. Swift lets you add a protocol conformance in an extension instead:

```swift
extension VendorSDK: AnalyticsClient {
    func track(event: String, properties: [String: Any]) {
        logEvent(event, metadata: properties)
    }
}
```

Now `VendorSDK` itself satisfies `AnalyticsClient` directly — no separate adapter instance to construct or hold onto:

```swift
let client: AnalyticsClient = VendorSDK()
```

This only works when you're allowed to extend the type in the first place. Predict: if `VendorSDK` is defined inside a closed-source binary framework with no public source you can extend from a different module in a way that conflicts with the framework's own future conformance, is this still safe to reach for?

Answer: usually yes for your own code, but it's worth naming the trade-off — extending a type you don't own to conform to a protocol you *do* own is fine, but you never know if the vendor will add their own conformance to a *different* protocol with a colliding method name in a future SDK version. An object adapter has no such risk, because it doesn't touch the vendor type at all — that's the real trade-off between the two approaches, not just "less code" versus "more code."

## Wrapping third-party APIs

Adapters show up constantly at the boundary between your app and code you don't control — not just SDKs, but Apple's own older APIs too. A classic case: bridging a delegate-based API to `async/await`.

```swift
protocol LocationFetching {
    func currentLocation() async throws -> CLLocation
}
```

`CLLocationManager` predates `async/await` and reports results through a delegate callback, not a return value:

```swift
final class LocationManagerAdapter: NSObject, LocationFetching, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var continuation: CheckedContinuation<CLLocation, Error>?

    func currentLocation() async throws -> CLLocation {
        try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            manager.delegate = self
            manager.requestLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        continuation?.resume(returning: locations[0])
        continuation = nil
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        continuation?.resume(throwing: error)
        continuation = nil
    }
}
```

The delegate callbacks (`didUpdateLocations`, `didFailWithError`) are `CLLocationManager`'s interface — the thing you don't control. `currentLocation() async throws` is the interface the rest of your app wants. The adapter's whole job is bridging one callback shape into the other, once, in one place — every caller elsewhere in the app just writes `try await locationFetcher.currentLocation()` and never touches a delegate method.

## Examples

Adapters are also the standard fix when two of *your own* modules were built independently and their models don't line up — no vendor involved at all.

```swift
// Networking layer's model
struct APIUser: Decodable {
    let id: String
    let full_name: String
}

// UI layer's model
struct DisplayUser {
    let id: String
    let name: String
}

extension APIUser {
    func asDisplayUser() -> DisplayUser {
        DisplayUser(id: id, name: full_name)
    }
}
```

`asDisplayUser()` is a small adapter in the loosest sense — it translates one shape into another so the UI layer never has to know the networking layer's field naming (`full_name`) or its decoding concerns at all.

## Common pitfalls

- **Letting the adapter leak the wrapped type.** If `VendorSDKAdapter` exposes a property that returns `VendorSDK` itself, callers can reach around the adapter and defeat the whole point of hiding it.
- **Putting business logic in the adapter.** An adapter translates calls and data shapes; it shouldn't also decide *what* those calls mean for your app — that belongs one layer up.
- **Choosing a protocol adapter (extension) for a type you don't fully control**, without weighing the risk of a future conflicting conformance from the vendor — an object adapter avoids that risk entirely.

## Interview lens

If asked to implement an adapter, describe the shape directly: a small type that stores (or extends) the incompatible object and implements *your* protocol by translating each call into the wrapped type's actual method names.

If asked "object adapter vs protocol adapter," the distinction is composition versus extension — an object adapter holds the incompatible type as a property and forwards to it, working even on `final` or unmodifiable types; a protocol adapter uses `extension SomeType: YourProtocol { ... }` directly on the type, which is less code but only works when you're allowed to extend it.

If asked where you've used this, the delegate-to-`async/await` bridge is the strongest real answer: wrapping `CLLocationManagerDelegate`'s callback-based interface in a type that exposes a single `async throws` method via `withCheckedThrowingContinuation`, so the rest of the app never touches the delegate protocol directly.
