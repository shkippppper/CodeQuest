## The problem: remind the user later, with no server

A to-do app needs to buzz the phone when a task is due at 5pm. A cooking timer needs to fire when three minutes are up. In both cases nothing is coming from the internet — the reminder is about something *this device* already knows.

You could try to keep your app awake in the background counting down. iOS won't let you: your app gets suspended seconds after the user leaves it. So who fires the alert at 5pm?

The answer is the system. You hand iOS a description of the notification *ahead of time*, and iOS delivers it at the right moment even if your app is closed. This is a **local notification** — scheduled on the device, by the device, for the device.

It's worth contrasting with the other kind right away. A push notification comes *from a server*, travels through Apple's APNs infrastructure, and lands on the phone from outside. A local notification never touches a network — you schedule it on-device and the device delivers it. This lesson is entirely about the local kind, built with the **UserNotifications** framework.

## First you have to ask permission

A notification interrupts the user, so iOS requires their consent before you can post one. You ask through the shared notification center:

```swift
import UserNotifications

let center = UNUserNotificationCenter.current()
let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
```

`UNUserNotificationCenter.current()` is the one object you route everything through — asking permission, scheduling, cancelling. The `requestAuthorization` call is async and shows the system prompt the first time it runs.

The `options` array says what kinds of interruption you want: `.alert` for the banner, `.sound` to play a sound, `.badge` to put a number on the app icon. The call returns a `Bool` — `granted` — telling you whether the user said yes.

Two things matter here. First, ask at a *meaningful* moment, not on first launch: prompt when the user actually sets their first reminder, so the request makes sense. Second, always handle a `false`:

```swift
if !granted {
    // no permission — hide the "remind me" toggle, or explain how to enable it in Settings
}
```

If the user denies permission, your scheduled notifications simply never appear. There's no error thrown later — they just silently don't show. Check `granted` and adjust your UI so you never promise a reminder you can't deliver.

## Building what the notification says

A notification's visible parts live in a content object you fill in:

```swift
let content = UNMutableNotificationContent()
content.title = "Task due"
content.body = "Submit the quarterly report"
```

`UNMutableNotificationContent` is the mutable ("you can set its fields") container for everything the user sees. `title` is the bold first line; `body` is the smaller text beneath it.

Add the finishing touches:

```swift
content.sound = .default          // play the standard notification sound
content.badge = 1                 // show a 1 on the app icon
```

`sound` controls the audio, and `.default` is the standard chime. `badge` is the little red number on the app icon. That's the whole message — but a message with no *when* attached to it does nothing yet.

## Triggers: the "when" of a notification

A **trigger** is the condition that decides *when* iOS delivers the notification — a timer, a clock time, or arriving somewhere. You attach one trigger to each notification. There are three kinds.

### Fire after N seconds

`UNTimeIntervalNotificationTrigger` fires once a stretch of time has elapsed:

```swift
let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 180, repeats: false)
```

This fires 180 seconds (three minutes) from when you schedule it — perfect for a cooking timer. Set `repeats: true` and it fires again every interval; a repeating interval trigger must be at least 60 seconds.

### Fire at a clock time

`UNCalendarNotificationTrigger` fires when the calendar reaches a set of date pieces you specify:

```swift
var date = DateComponents()
date.hour = 9
date.minute = 0
let trigger = UNCalendarNotificationTrigger(dateMatching: date, repeats: true)
```

You describe the moment with `DateComponents` — a bag of calendar fields like hour, minute, weekday. Here only `hour` and `minute` are set, so with `repeats: true` it fires **every day at 9:00am**. Fill in more fields (a `weekday`, a `day`) to narrow it to, say, every Monday.

### Fire on arriving somewhere

`UNLocationNotificationTrigger` fires when the device enters (or leaves) a geographic region:

```swift
let region = CLCircularRegion(center: storeCoordinate, radius: 100, identifier: "store")
region.notifyOnEntry = true
let trigger = UNLocationNotificationTrigger(region: region, repeats: false)
```

The `region` is a circle on the map; the notification fires when the user crosses into it — "you're near the grocery store, here's your list." This one needs location permission on top of notification permission.

## Scheduling: bundling content and trigger into a request

Content is *what*, a trigger is *when*. You marry them in a request and hand it to the center:

```swift
let request = UNNotificationRequest(
    identifier: "task-42",
    content: content,
    trigger: trigger
)
try await center.add(request)
```

`UNNotificationRequest` packages the three things iOS needs: a unique `identifier` string, the `content`, and the `trigger`. Calling `center.add(request)` registers it — from that point iOS owns the schedule, and your app can close.

That `identifier` is not decoration. It's the handle you use to change your mind later:

```swift
// user edited the task's due time — replace the old one:
center.removePendingNotificationRequests(withIdentifiers: ["task-42"])
// ...then add a new request with the same identifier "task-42"
```

Scheduling a new request with an identifier that already has a pending notification *replaces* it. And `removePendingNotificationRequests(withIdentifiers:)` cancels a scheduled notification outright — the user deleted the task, so cancel its reminder. Use stable, meaningful identifiers (like the task's own id) so you can always find the notification again.

## What happens when the app is in the foreground?

Predict this. You schedule a notification to fire in 5 seconds, then keep the app open and on screen. Five seconds later — does the banner appear?

By default, no. If your app is in the foreground when a local notification fires, iOS *suppresses* it — the assumption being you're already showing the relevant screen, so a banner would be redundant.

To change that you implement a delegate method. A **delegate** is an object iOS calls back to let you make decisions (it has its own lesson). You set it once:

```swift
center.delegate = self   // self conforms to UNUserNotificationCenterDelegate
```

Then iOS asks you what to do each time a notification fires while you're in front:

```swift
func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification
) async -> UNNotificationPresentationOptions {
    return [.banner, .sound]   // show it anyway, with a banner and sound
}
```

`willPresent` runs *only* when the app is foregrounded as the notification fires. Whatever presentation options you return is how it shows; return an empty array to keep it hidden. This is the switch that overrides the default suppression.

## Handling the tap

The more important callback is the one for when the user *taps* a delivered notification. That's where you send them to the right screen:

```swift
func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse
) async {
    let id = response.notification.request.identifier   // "task-42"
    router.openTask(withID: id)
}
```

`didReceive response` fires when the user acts on the notification — most commonly by tapping it to open your app. The `response` carries the original request, so you can read its `identifier` (or custom data you stored in `content.userInfo`) and route to exactly the task that reminder was about. Without this, a tap just opens your app to wherever it left off — the reminder loses its point.

## Buttons on the notification itself

Sometimes the user shouldn't have to open the app at all. A reminder could offer "Complete" and "Snooze" right on the banner. Those buttons are **actions**, grouped into a **category**.

```swift
let done = UNNotificationAction(identifier: "COMPLETE", title: "Complete")
let snooze = UNNotificationAction(identifier: "SNOOZE", title: "Snooze")

let category = UNNotificationCategory(
    identifier: "TASK_REMINDER",
    actions: [done, snooze],
    intentIdentifiers: []
)
center.setNotificationCategories([category])
```

A `UNNotificationAction` is one button, with its own `identifier` and visible `title`. A `UNNotificationCategory` groups a set of buttons under a category `identifier` and registers them with `setNotificationCategories`. You do this registration once, usually at launch.

To make a notification show those buttons, stamp it with the category's id:

```swift
content.categoryIdentifier = "TASK_REMINDER"
```

Now the banner carries "Complete" and "Snooze." When the user taps one, the same `didReceive response` callback runs — and `response.actionIdentifier` tells you which button ("COMPLETE" or "SNOOZE") they pressed, so you can complete the task or reschedule it 10 minutes out without ever opening the app.

## Common pitfalls

- **Never handling denied permission.** If `granted` is `false`, every notification you schedule silently fails to appear. Check the bool and adjust the UI; don't promise reminders you can't send.
- **Reusing identifiers by accident.** Scheduling a new request with an existing identifier *replaces* the old one. Great when you mean to update; a silent bug when you didn't.
- **Expecting foreground delivery for free.** A notification firing while your app is open is suppressed unless you implement `willPresent` and return presentation options.
- **Confusing local with push.** If the trigger is a timer, a clock time, or a location the device already knows, it's local — no server, no APNs. Reach for push only when the event originates off-device.

## Interview lens

If asked how to schedule a reminder without a backend, name the **UserNotifications** framework and walk the four steps: request authorization, build a `UNMutableNotificationContent`, pick a trigger, wrap them in a `UNNotificationRequest` and `add` it. Being able to list the three trigger types — time interval, calendar, location — signals you've actually used the API.

The follow-up that catches people is "what happens if the app is in the foreground when it fires?" Say: by default iOS suppresses it, and you opt back in by implementing `willPresent` on the `UNUserNotificationCenterDelegate`. Mentioning `didReceive` for taps, and that you route using the request's `identifier` or `userInfo`, shows you've handled the full lifecycle, not just the scheduling.

If they ask how this differs from push notifications, keep it crisp: local is scheduled and delivered entirely on-device with no network; push originates from a server and arrives through APNs. Choose local whenever the triggering condition is something the device already knows about.
