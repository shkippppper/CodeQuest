## The problem: a link should land inside the app

A push notification arrives: "Your order shipped." The user taps it. Where do they end up?

If they land on the home screen and have to hunt for the order themselves, you failed. The tap carried an intent — *this specific order* — and you threw it away.

The same problem shows up everywhere: an email with a link to a chat, a web page with an "Open in app" button, a marketing link to one product. In every case, something outside the app hands you a piece of text and expects the app to open straight to the matching screen:

```
myapp://product/42
```

Turning a URL like this into real in-app navigation is **deep linking**. This lesson is about the two ways the system delivers that URL to you, how to parse it, and the one launch case that breaks naive code.

## Custom URL schemes: the app claims a made-up prefix

The oldest mechanism is a **custom URL scheme** — a made-up prefix like `myapp://` that belongs to your app. You register it in `Info.plist`:

```xml
<key>CFBundleURLSchemes</key>
<array>
    <string>myapp</string>
</array>
```

Now when anything on the device opens a URL that starts with `myapp://`, the system launches your app and hands you the URL:

```
myapp://product/42
```

The system stops at the scheme. It sees `myapp`, finds your app registered for it, and delivers the whole URL. What `product/42` means is entirely up to you.

That's the appeal — it's simple, and it works for app-to-app handoffs. But there are two real downsides.

First, *any* app can claim any scheme. Nothing stops a second app from also registering `myapp://`, and which one wins is undefined. The link is **unverified** — the system never checks that you own it.

Second, these URLs are ugly and only work if the app is installed. Tap `myapp://product/42` in a browser with the app missing, and you get an error, not a fallback.

## Universal Links: real https links that open the app

**Universal Links** fix both problems. A Universal Link is an ordinary `https://` web URL:

```
https://shop.example.com/product/42
```

Tap it with the app installed, and iOS opens the app straight to product 42. Tap it *without* the app installed, and it opens the same URL in the browser — a normal web page. One link, two graceful outcomes.

Predict: a friend without your app taps a Universal Link. What happens?

Answer: it opens the website. That's the whole point — the link is a real web address that works with or without the app. There's no dead end and no "app not installed" error.

For this to work, two things must line up.

You add the **Associated Domains** entitlement to the app, listing the domains you claim:

```
applinks:shop.example.com
```

And on the server behind that domain, you host a small file called the **apple-app-site-association** file — the AASA. The AASA is a JSON file, served over HTTPS at a fixed path, that lists which URL paths on the domain should open the app:

```
https://shop.example.com/.well-known/apple-app-site-association
```

Its contents map your app's ID to the paths it handles:

```json
{
  "applinks": {
    "details": [
      { "appID": "TEAMID.com.example.shop", "paths": ["/product/*"] }
    ]
  }
}
```

Here's why this is the recommended path: the two pieces cross-check each other. The entitlement says "the app claims this domain," and the AASA — which only the domain's real owner can host — says "this domain vouches for this app." Because you must control the server to publish the AASA, the link is **verified**: no other app can hijack your `https://` links. That's the guarantee custom schemes can never give.

## Receiving the URL in code

However the URL arrives, your code has to catch it. In SwiftUI there are two modifiers, one per mechanism.

A custom-scheme URL arrives through `onOpenURL`:

```swift
WindowGroup {
    ContentView()
        .onOpenURL { url in
            handle(url)   // url == myapp://product/42
        }
}
```

A Universal Link arrives as a **user activity** — the system's way of representing "the user was browsing the web and continued into your app." You catch it with `onContinueUserActivity`:

```swift
.onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
    if let url = activity.webpageURL {
        handle(url)
    }
}
```

In UIKit the same two events land on the scene delegate: custom schemes in `scene(_:openURLContexts:)`, and Universal Links in `scene(_:continue:)` via the `userActivity`. Different entry points, but notice both funnel into one `handle(url)` — that shared function is where the real work begins.

## Parsing the URL into navigation state

`handle(url)` should not push screens directly. It should turn the raw `URL` into a typed **route** — a small value describing *where to go* — and let your navigation layer act on it.

Define the routes as an enum:

```swift
enum Route: Hashable {
    case product(id: Int)
    case chat(id: String)
}
```

Then parse the URL into one. Use `URLComponents`, which splits a URL into its pieces so you don't hand-slice strings:

```swift
func route(from url: URL) -> Route? {
    let parts = url.pathComponents.filter { $0 != "/" }
    // for /product/42 → ["product", "42"]
    switch parts.first {
    case "product":
        if let id = parts.dropFirst().first.flatMap({ Int($0) }) {
            return .product(id: id)
        }
    case "chat":
        if let id = parts.dropFirst().first {
            return .chat(id: id)
        }
    default:
        break
    }
    return nil
}
```

Once you have a `Route`, drive a `NavigationStack` by appending it to the stack's path:

```swift
if let route = route(from: url) {
    navigationPath.append(route)
}
```

Keep all of this parsing in one place. A single `route(from:)` function means every entry point — custom scheme, Universal Link, cold launch — produces routes the same way, and there's one spot to fix when a URL format changes. This is exactly the typed-route, path-driven navigation covered in depth in the routing-architecture lesson; deep linking just feeds URLs into that same machine.

## Cold launch vs warm launch: the classic bug

Now the case that trips everyone up.

A **warm launch** is when the app is already running in the background. The URL arrives through `onOpenURL` or `onContinueUserActivity`, your navigation stack already exists, and appending a route just works.

A **cold launch** is when the app was *not* running and the URL is what starts it. Here the URL is delivered as part of the launch itself — through the scene's connection options or the initial `userActivity` — and it may arrive *before* your navigation UI has finished building.

Predict: your `onOpenURL` handler appends a route to `navigationPath`, but on a cold launch the stack hasn't been created yet. What happens?

Answer: the append lands on a path that no view is observing yet, and the route is silently dropped. The app opens to the home screen and the deep link vanishes. This is the single most common deep-linking bug.

The fix is to **buffer** the route instead of applying it immediately:

```swift
final class DeepLinkRouter: ObservableObject {
    @Published var pending: Route?

    func handle(_ url: URL) {
        pending = route(from: url)   // store it, don't navigate yet
    }
}
```

Your root view, once it exists, watches `pending` and consumes it when it's ready:

```swift
.onChange(of: router.pending) { _, route in
    if let route { navigationPath.append(route) }
    router.pending = nil
}
```

The route waits in `pending` until the UI is set up to receive it. Warm launches consume it instantly; cold launches consume it the moment the stack appears. Either way the link is honored.

## Testing deep links

You can fire a link at the simulator without a notification or an email. Use `simctl`:

```
xcrun simctl openurl booted "myapp://product/42"
```

Swap in an `https://` Universal Link and the same command tests that path — a fast way to hit both cold and warm launches by toggling whether the app is running first.

Universal Links have their own validation gotchas, and the AASA file is where they hide:

- It must be served over **HTTPS**. Plain `http` is rejected outright.
- It must return with **no redirects** — the system fetches the exact URL and won't follow a 301 to somewhere else.
- iOS **caches** the AASA at install time. Change the file on your server and an already-installed app may keep the stale copy; reinstalling forces a fresh fetch.

Most "my Universal Link opens the website instead of the app" reports trace back to one of these three — a bad AASA, a redirect, or a cached old version — not to your code.

## Common pitfalls

- **Trusting a custom scheme as identity.** Any app can register `myapp://`; the link is unverified. Use Universal Links when it must be provably yours.
- **Navigating directly in the URL handler.** On a cold launch the nav stack may not exist yet and the route is dropped. Buffer the route and consume it when the UI is ready.
- **Forgetting the AASA constraints.** HTTPS only, no redirects, and it's cached at install — a stale or redirected AASA silently falls back to the browser.
- **Scattering URL parsing.** Parse in one `route(from:)` function so every entry point behaves identically.

## Interview lens

If asked to compare custom schemes and Universal Links, lead with verification: a custom scheme (`myapp://`) is a made-up prefix any app can claim, so it's unverified and only works if the app is installed. A Universal Link is a real `https://` URL backed by the Associated Domains entitlement plus an AASA file you host on your server — so it's provably yours, and it falls back to the website when the app is missing. That fallback is a feature, not a bug.

Expect a follow-up on *how you receive and route* the URL. Say: SwiftUI catches custom schemes in `onOpenURL` and Universal Links in `onContinueUserActivity`; both funnel into one function that parses the URL with `URLComponents` into a typed route, which drives a `NavigationStack`. Centralizing the parsing is the point.

The senior signal is the cold-vs-warm launch distinction. Volunteer it: on a warm launch the nav stack already exists, but on a cold launch the URL can arrive before the UI is built, so you must buffer the route and apply it once the stack is ready — otherwise the deep link is silently lost. Mentioning `xcrun simctl openurl` for testing, and the AASA's HTTPS/no-redirect/caching rules, shows you've actually shipped this.
