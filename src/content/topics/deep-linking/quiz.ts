import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "deeplink-scheme-vs-universal",
    type: "mcq",
    prompt:
      "What is the key advantage of a Universal Link over a custom URL scheme like `myapp://`?",
    options: [
      "It is a verified https link the system confirms you own, and it falls back to the website when the app isn't installed",
      "It launches noticeably faster because the system skips the whole entitlement and associated-domain verification step at open time",
      "It can carry far more query parameters than a custom scheme, whose total URL length is capped at a fixed number of characters",
      "It is the only mechanism that is able to deliver a URL to an app that happens to be running in the background already",
    ],
    answer: 0,
    explanation:
      "A Universal Link is a real `https://` URL backed by an entitlement plus a server-hosted AASA, so it is **verified** — no other app can claim it — and it opens the website when the app is missing. Custom schemes are unverified and only work if the app is installed.",
  },
  {
    id: "deeplink-not-installed",
    type: "mcq",
    prompt:
      "A user without your app installed taps a Universal Link. What happens?",
    options: [
      "The link opens in the browser, showing the corresponding web page — the graceful fallback the mechanism is designed for",
      "The system shows a modal prompting the user to install the matching app from the App Store before it will proceed",
      "Nothing happens at all, because a Universal Link is only ever delivered to an app that is already installed on the device",
      "It surfaces a scheme-not-registered error, exactly the way an unhandled custom `myapp://` URL would when its app is absent",
    ],
    answer: 0,
    explanation:
      "The link is an ordinary web URL, so with the app missing it simply opens the website. That two-outcome behavior — app if installed, site if not — is the whole point of Universal Links.",
  },
  {
    id: "deeplink-aasa-fill",
    type: "fill",
    prompt:
      "The JSON file you host on your server (at `/.well-known/`) that lists which URL paths open your app is the apple-app-site-___ file.",
    answers: ["association", "association file", "aasa"],
    hint: "Three words; the acronym is AASA.",
    explanation:
      "The **apple-app-site-association** (AASA) file maps your app's ID to the URL paths it handles. Only the domain's real owner can host it, which is what makes Universal Links verified.",
  },
  {
    id: "deeplink-receiving-modifier",
    type: "mcq",
    prompt:
      "In SwiftUI, which modifier receives a Universal Link (as opposed to a custom-scheme URL)?",
    options: [
      "`.onContinueUserActivity(NSUserActivityTypeBrowsingWeb)`, reading the URL from the activity's `webpageURL`",
      "`.onOpenURL { url in }`, which is the single unified entry point for every deep link regardless of its kind",
      "`.onAppear`, after you manually pull the launch URL out of the scene's connection options during startup",
      "`.handlesExternalEvents`, whose matching predicate returns the incoming web URL for you to parse and route",
    ],
    answer: 0,
    explanation:
      "A Universal Link arrives as a browsing **user activity**, caught with `onContinueUserActivity(NSUserActivityTypeBrowsingWeb)`. Custom schemes arrive through `onOpenURL`. Both should funnel into one shared handler.",
  },
  {
    id: "deeplink-parse-components",
    type: "predict",
    prompt:
      "Given `https://shop.example.com/product/42`, what should `route(from:)` return using `URLComponents` / path parsing?",
    code: "let url = URL(string: \"https://shop.example.com/product/42\")!\nlet route = route(from: url)",
    options: [
      ".product(id: 42) — the parser reads the path segments and builds a typed route from them",
      ".product(id: 0) — the numeric id string can't be read from the path and defaults to a zero placeholder",
      "nil, because the host `shop.example.com` doesn't match any of the registered custom URL schemes",
      ".unknown, because only the query string after a `?` is ever considered when a route is being resolved",
    ],
    answer: 0,
    explanation:
      "The parser splits the path into `[\"product\", \"42\"]`, matches `product`, and converts `\"42\"` to an `Int`, yielding `.product(id: 42)`. Path segments are the source of truth here, not the query string.",
  },
  {
    id: "deeplink-centralize-multi",
    type: "multi",
    prompt:
      "Select **all** reasons to funnel every deep-link entry point into one central `route(from:)` parser.",
    options: [
      "Every entry point — custom scheme, Universal Link, cold launch — produces routes identically",
      "There is a single place to update when a URL format or path changes",
      "A typed `Route` decouples URL shape from how the navigation stack is driven",
      "Centralizing the parser removes the need for the Associated Domains entitlement entirely",
    ],
    answers: [0, 1, 2],
    explanation:
      "Uniform routes, one place to change, and URL/navigation decoupling are all real wins. The entitlement is unrelated — it's still required for Universal Links no matter how you structure parsing (option 4 is false).",
  },
  {
    id: "deeplink-cold-launch-senior",
    type: "predict",
    prompt:
      "The app is NOT running. A Universal Link launches it, and the handler immediately appends the route to `navigationPath`. What's the likely result?",
    code: "func handle(_ url: URL) {\n    if let route = route(from: url) {\n        navigationPath.append(route)\n    }\n}",
    options: [
      "The route is dropped and the app opens to the home screen, because the nav stack isn't built yet on cold launch",
      "The app crashes with an index-out-of-range fault the instant it tries to append onto an empty navigation path",
      "The route is queued automatically by the framework and then replayed for you once the first view has appeared",
      "Two copies of the destination are pushed, since cold launch delivers the very same URL through two separate callbacks",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "On a **cold launch** the URL can arrive before the navigation UI exists, so the append lands on a path no view observes yet and is silently lost. The fix is to buffer the route and consume it once the stack is ready.",
  },
  {
    id: "deeplink-buffer-fill",
    type: "fill",
    prompt:
      "The fix for a cold-launch deep link is to ___ the route (store it as pending) and apply it once the navigation UI is ready, instead of navigating immediately.",
    answers: ["buffer", "buffering", "queue", "store"],
    hint: "Same word as holding data temporarily until the consumer is ready.",
    explanation:
      "You **buffer** the route in a `pending` property; the root view consumes it when it appears. Warm launches consume it instantly, cold launches consume it once the stack is built — either way the link is honored.",
  },
  {
    id: "deeplink-aasa-gotcha-senior",
    type: "mcq",
    prompt:
      "A Universal Link opens the website instead of the app, even though the code is correct. Which AASA problem is the most likely cause?",
    options: [
      "The AASA is served with a redirect or over plain http, or the device cached an older version at install time",
      "The AASA declares too many paths at once, so the system throttles it and silently ignores every rule beyond the first",
      "The app forgot to also register a matching custom URL scheme, which every Universal Link internally depends upon",
      "The NavigationStack path was typed as strings rather than a Hashable enum, so the route silently fails to resolve",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The AASA must be HTTPS with **no redirects**, and iOS **caches** it at install — a redirected, http, or stale-cached file makes the link fall back to the browser. These infra gotchas, not code, cause most such reports.",
  },
  {
    id: "deeplink-test-command-senior",
    type: "mcq",
    prompt:
      "How do you fire a deep link at the booted simulator without an email or push notification?",
    options: [
      "`xcrun simctl openurl booted \"myapp://product/42\"`, which delivers the URL to the app as if opened externally",
      "`xcrun instruments --launch-deeplink`, attaching a profiling session that then injects the URL during the trace",
      "`swift run --open-url`, a package-manager subcommand that compiles and hands the URL to the app in one step",
      "`xcodebuild deeplink -scheme App`, a build action whose sole purpose is to route a test URL into the running app",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`xcrun simctl openurl booted \"...\"` sends any URL — custom scheme or `https://` Universal Link — to the booted simulator, letting you test cold and warm launches by toggling whether the app is already running.",
  },
  {
    id: "deeplink-flashcard",
    type: "flashcard",
    prompt:
      "Explain deep linking end to end: custom schemes vs Universal Links, how you receive and parse the URL, and the cold-vs-warm launch gotcha. Answer aloud, then reveal.",
    modelAnswer:
      "**Deep linking** turns a URL from outside the app (a notification, email, or web page) into navigation to a specific screen. Two delivery mechanisms: a **custom URL scheme** is a made-up prefix like `myapp://` registered in Info.plist — simple, but **unverified** (any app can claim it) and only works if the app is installed. A **Universal Link** is a real `https://` URL backed by the **Associated Domains** entitlement (`applinks:domain`) plus an **apple-app-site-association (AASA)** JSON file you host at `/.well-known/` on your server listing which paths open the app. Because only the domain owner can publish the AASA, the link is **verified** and can't be hijacked; if the app isn't installed it gracefully opens the website. You receive them in SwiftUI via `onOpenURL` (custom scheme) and `onContinueUserActivity(NSUserActivityTypeBrowsingWeb)` (Universal Link) — in UIKit via the scene delegate. Both funnel into one `route(from:)` function that parses the URL with `URLComponents` into a typed `Route` enum, which drives a `NavigationStack` path (this is the routing-architecture machine). The classic bug is **cold vs warm launch**: on a warm launch the nav stack already exists and appending a route works; on a **cold launch** the URL can arrive before the UI is built, so you must **buffer** the route as `pending` and apply it once the stack appears — otherwise it's silently dropped. Test with `xcrun simctl openurl booted \"...\"`, and remember the AASA must be HTTPS with no redirects and is cached at install.",
    keyPoints: [
      "Custom scheme (myapp://): unverified, needs app installed",
      "Universal Link (https): entitlement + hosted AASA = verified, falls back to website",
      "Receive: onOpenURL (scheme) vs onContinueUserActivity browsing-web (Universal)",
      "Parse centrally with URLComponents into a typed Route driving a NavigationStack",
      "Cold launch: URL arrives before UI — buffer the route until the stack is ready",
      "Test with xcrun simctl openurl; AASA must be HTTPS, no redirects, cached at install",
    ],
    explanation:
      "A senior answer contrasts verified Universal Links against unverified schemes, names the AASA and entitlement, centralizes parsing into a typed route, and volunteers the cold-launch buffering bug plus the simctl test command.",
  },
];

export default quiz;
