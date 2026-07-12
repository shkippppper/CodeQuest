## The problem: your app can't run code when it's not running

A message arrives for a user whose app isn't open — maybe it's not even running in the background. There's no code of yours executing on that phone to notice the message and show an alert. Something outside your app has to wake the device up on your behalf.

That something is **APNs** — Apple Push Notification service, Apple's own server infrastructure that keeps a persistent connection to every iOS device and can deliver a message to it even when your app is completely closed. This lesson walks through the full round trip: how a device becomes reachable, what a push actually contains, and what can go wrong along the way.

## The APNs flow, end to end

Picture a chat app. Ada sends Bob a message while Bob's phone is asleep in his pocket. Four parties are involved, in this order:

```
Ada's device → Your backend server → APNs → Bob's device
```

1. Ada's app sends the message to **your backend** over a normal API call — nothing push-specific yet.
2. Your backend looks up Bob's registered device and sends a push *request* to **APNs**, not to Bob's phone directly. Your server never talks to Bob's device at all.
3. APNs holds a persistent, always-on connection to every iOS device (including Bob's, even locked and asleep) and forwards the push down that connection.
4. Bob's device — specifically iOS itself, not your app's code — receives it and shows a banner, badge, or sound, and can wake your app to run a small amount of code.

The key thing to notice: your server is never connected to Bob's phone. It only ever talks to APNs, and APNs is the only party with a live connection to the device. That's why step 2 needs to know exactly *which* device to target — which brings up the first real design question.

## Token registration: how APNs knows which device is "Bob's"

Before your backend can push to Bob, Bob's device has to register itself with APNs and hand your server a way to address it.

```swift
func application(_ application: UIApplication,
                  didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    // send `token` to your backend, associated with Bob's account
    api.registerPushToken(token, for: currentUser.id)
}
```

That `deviceToken` is a **device token** — an opaque identifier APNs generates for this specific app installation on this specific device, and it's the only address your backend needs to reach it. Registration happens once per install (and again if the token rotates, which APNs can do):

```swift
UIApplication.shared.registerForRemoteNotifications()
// ...later, iOS calls didRegisterForRemoteNotificationsWithDeviceToken (success)
// or didFailToRegisterForRemoteNotificationsWithError (failure — no APNs, no entitlement, etc.)
```

Your backend now has a mapping: `userID -> [deviceToken]` — plural, because Bob might be signed in on an iPhone and an iPad, each with its own token. When your server wants to reach Bob, it sends one push per token, to APNs, addressed by that token — not by Bob's account. APNs has no idea who "Bob" is; your backend is the only place that mapping exists.

Predict: a token your backend stored six months ago suddenly starts failing every push. What's the most likely explanation?

Answer: the user uninstalled the app (or reinstalled it, which mints a fresh token), and the old one is now invalid. APNs tells your backend this explicitly rather than silently dropping pushes forever — which is why a production backend needs to *listen* for that signal and prune the dead token, not just fire-and-forget.

## Payloads and silent push

The push itself is a small JSON payload, capped at a few kilobytes — enough for a notification, not a message body.

```json
{
  "aps": {
    "alert": { "title": "Bob", "body": "hey, you free tonight?" },
    "sound": "default",
    "badge": 3
  },
  "conversationID": "c-882"
}
```

The `aps` dictionary is Apple-reserved and drives the visible notification directly — `alert`, `sound`, `badge` — with no app code required to display it. Anything outside `aps` (here, `conversationID`) is custom data your app reads if the user taps the notification, to jump straight to that conversation.

There's a second, very different kind of push worth knowing well: a **silent push** — a payload with no `alert`, `sound`, or `badge` at all, meant to wake your app quietly in the background to run code without showing anything to the user.

```json
{
  "aps": { "content-available": 1 },
  "action": "sync-conversation",
  "conversationID": "c-882"
}
```

`content-available: 1` tells iOS "wake this app briefly in the background," which triggers your app delegate's background fetch handler instead of a visible alert. A chat app might use this to pre-fetch a new message's full content so it's already on-device by the time the user opens the app — the visible notification banner and the silent data-sync push are often sent as two separate, purpose-built payloads rather than one payload trying to do both.

One constraint that trips people up: silent push is a *best-effort hint*, not a guarantee. iOS can throttle or skip silent pushes entirely — for a low-battery device, for an app the user rarely opens, or just because iOS decided not to spend the background time budget on it. Never build a feature that depends on a silent push definitely arriving; anything user-visible or correctness-critical needs a fallback path that doesn't depend on it (like syncing on next foreground launch).

## Notification service and content extensions

The plain payload above is text-only. Two app extensions let you go further, and it's worth knowing what each one is for.

A **Notification Service Extension** runs a small, separate process *between* APNs delivering the push and iOS displaying it — just long enough to modify the notification before it's shown.

```swift
override func didReceive(_ request: UNNotificationRequest,
                          withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    let content = request.content.mutableCopy() as! UNMutableNotificationContent
    // e.g. download an image URL from the payload, attach it, then hand back the enriched content
    downloadAttachment(from: content.userInfo["imageURL"] as! String) { localURL in
        content.attachments = [try! UNNotificationAttachment(identifier: "img", url: localURL)]
        contentHandler(content)
    }
}
```

This is how a chat notification ends up showing the actual photo Bob sent, instead of just "Bob sent an image" — the payload carries a URL, and the extension fetches and attaches the image before the banner appears. It runs under a strict time budget (a handful of seconds); if it doesn't call `contentHandler` in time, iOS shows the unmodified original content.

A **Notification Content Extension** is different: it doesn't modify the notification's content, it customizes the *UI* shown when the user long-presses or expands the notification — a fully custom SwiftUI/UIKit view instead of the default banner layout. A chat app might use one to show a mini message thread, or a ride-share app to show a live map, right inside the expanded notification.

## Reliability: pushes are a hint, not a guarantee

The single most important mental model for this whole system: APNs delivery is **best-effort**, not guaranteed. A push can be delayed, coalesced with others, or dropped — by a bad network, a device that's off, or iOS deciding not to spend the resources.

This has a direct design consequence: never treat "I sent a push" as "the user's app state is now up to date." A chat app can't assume Bob's device has the new message just because a push was sent — Bob might never have received it at all.

```swift
// Wrong: assume the push delivered the message content, don't verify
// Right: the push is a wake-up hint; on foreground/open, always sync from the server
func applicationDidBecomeActive(_ application: UIApplication) {
    Task { await conversationStore.syncLatestMessages() }
}
```

The push's real job is narrower than it looks: *tell the user something happened, and optionally nudge the app to sync* — not *be* the transport for the data itself. The source of truth is always a server fetch; the notification is a trigger that makes that fetch happen sooner, or tells the user to open the app and look.

## Common pitfalls

- **Treating a device token as permanent.** Tokens rotate on reinstall and can be explicitly invalidated by APNs — a backend that never prunes dead tokens keeps wasting sends (and can hit rate limits) on install after install.
- **Relying on silent push for correctness.** `content-available` is throttled and can be skipped entirely; anything the user's experience depends on needs a foreground-sync fallback, not just a background push.
- **Cramming real data into the alert payload.** The visible `aps.alert` payload is tiny and meant for display text — fetch the actual content from your server after the tap or the sync, don't try to squeeze a full message body into the push itself.
- **One extension trying to do both jobs.** A Notification Service Extension enriches content before display (like fetching an image); a Notification Content Extension customizes how the expanded notification looks. Confusing the two leads to reaching for the wrong tool.

## Interview lens

If asked to design push notifications for a feature, walk the four-party flow out loud first — device registers a token, backend stores it, backend asks APNs to push, APNs delivers to the device — and be explicit that your server never talks to the device directly. That single fact explains why token registration and pruning matter.

When the conversation turns to reliability, the answer that signals real experience is: push is best-effort, so never use it as the source of truth. State the fallback plainly — the app always re-syncs from the server on foreground, and the push is just a hint that makes that happen sooner (or, for a silent push, happens quietly in the background when iOS allows it).

If asked about rich notifications (images, custom layouts), name both extensions and their distinct jobs: a Service Extension enriches the payload's content before display under a tight time budget, a Content Extension customizes the expanded UI. Mixing them up in an answer is a common tell that the concept is only half-understood.
