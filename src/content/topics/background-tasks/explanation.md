## The problem: your app stops running the moment it's backgrounded

Press the home button and your app doesn't keep running like a desktop program would. Within seconds, iOS moves it to the **suspended** state — frozen in memory, not executing a single line of code — to free up CPU and battery for whatever app the user is actually looking at.

That's great for the phone's battery, but it breaks things you'd want to keep happening: finishing an upload that was mid-flight, syncing new messages before the user reopens the app, refreshing a widget's data overnight. iOS gives you a small, tightly controlled set of ways to keep doing work anyway — this lesson covers what they are and how to use them without becoming the app users blame for their battery drain.

## Background modes: telling iOS what kind of work you need

The starting point is your app's `Info.plist`, where you declare **background modes** — categories of work the system permits while your app isn't in the foreground. Common ones:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>fetch</string>
    <string>processing</string>
    <string>remote-notification</string>
</array>
```

Each string unlocks a specific capability, not a blanket "run whenever you want":

- `audio` — keep running while playing or recording audio (a music player, a podcast app).
- `fetch` — periodically wake briefly to fetch new content (legacy Background App Refresh).
- `processing` — run longer, deferrable maintenance tasks, scheduled through `BGTaskScheduler`.
- `remote-notification` — wake briefly when a silent push notification arrives.

Declaring a mode is a *request*, not a guarantee. The system still decides when — and whether — to actually grant your app time, based on the user's habits, battery level, and Low Power Mode.

## BGTaskScheduler: asking for a window to run in

Modern background work goes through `BGTaskScheduler`, which replaced the older `beginBackgroundTask` and `performFetchWithCompletionHandler` APIs. It has two task flavors for two different needs.

**`BGAppRefreshTask`** — short, for keeping content fresh (think: "check for new messages"):

```swift
func scheduleAppRefresh() {
    let request = BGAppRefreshTaskRequest(identifier: "com.app.refresh")
    request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)   // no sooner than 15 min
    try? BGTaskScheduler.shared.submit(request)
}
```

`earliestBeginDate` is a floor, not a promise — it says "not before this time," while the actual run time is chosen by iOS based on usage patterns.

**`BGProcessingTask`** — longer, for deferrable maintenance (think: "reindex the local database"), and can require power or network conditions:

```swift
func scheduleDatabaseCleanup() {
    let request = BGProcessingTaskRequest(identifier: "com.app.cleanup")
    request.requiresNetworkConnectivity = false
    request.requiresExternalPower = true   // only run while charging
    try? BGTaskScheduler.shared.submit(request)
}
```

`requiresExternalPower: true` is the key knob here — it tells the system this task is allowed to be heavier, because it will only run when the device is plugged in and battery isn't a concern.

Registering the handler happens at launch, before the app finishes launching:

```swift
func application(_ application: UIApplication,
                  didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.app.refresh", using: nil) { task in
        self.handleAppRefresh(task: task as! BGAppRefreshTask)
    }
    return true
}
```

Inside the handler, you must call `setTaskCompleted` — and set an **expiration handler**, which iOS calls if your task is about to be killed for overrunning its time budget:

```swift
func handleAppRefresh(task: BGAppRefreshTask) {
    scheduleAppRefresh()   // re-schedule the next one — each run only covers itself

    let operation = RefreshOperation()
    task.expirationHandler = { operation.cancel() }   // system is out of patience — stop now
    operation.completionBlock = { task.setTaskCompleted(success: !operation.isCancelled) }
    OperationQueue().addOperation(operation)
}
```

Two details that catch people out: each scheduled task runs *once*, so you re-submit the request for the next run inside the handler itself, and skipping the expiration handler risks the OS forcibly terminating your process — which is worse for your next refresh request than finishing early would have been.

## Energy impact: why the system is stingy

None of this is generous by accident. Every wake-up, every radio use, every CPU burst costs battery, and iOS tracks which apps are draining it — visible to the user in Settings → Battery. An app that's a repeat offender gets throttled: fewer scheduled task grants, less generous Background App Refresh windows.

The system reasons about three costs in particular:

- CPU wake-ups — waking the processor from a low-power state has a fixed energy cost *before any of your code even runs*, so batching several small wake-ups into one is nearly always cheaper than doing them separately.
- Radio usage — turning on the cellular or Wi-Fi radio is one of the most expensive operations on the whole device; a burst of several requests back to back is far cheaper than the same requests spread out, because the radio can power down between bursts instead of staying "high power" the whole time.
- Location and sensors — continuous GPS or accelerometer use in the background is a battery bill users notice within a day; prefer significant-change location updates over continuous tracking unless you genuinely need meter-level precision.

Xcode's Energy Log and Instruments' Energy template make this visible during development, breaking a session down into CPU, network, location, and display cost so you can see exactly which of your background operations is the expensive one.

## QoS: telling the system how urgent your work is

Every unit of work you dispatch — a `DispatchQueue` block, an `Operation`, a `Task` — can carry a **quality of service** class, a hint that tells the scheduler how to prioritize CPU time and energy against other work on the device.

```swift
DispatchQueue.global(qos: .utility).async {
    downloadAndProcessBackup()
}
```

The four you'll actually choose between:

- `.userInteractive` — for work blocking the UI right now (animations, event handling). Never appropriate for background work.
- `.userInitiated` — the user is waiting on this, but it isn't a UI-render deadline (loading a file they just tapped to open).
- `.utility` — long-running work the user knows is happening but isn't actively waiting on — progress bars, imports, most background-mode work. This is the default choice for a `BGProcessingTask` body.
- `.background` — work the user has no visibility into at all, and the system can defer as long as it wants — prefetching, cleanup, indexing.

Predict: which QoS should a nightly "clean up old cached files" task use — `.utility` or `.background`?

Answer: `.background`. There's no user waiting, no progress bar, and no urgency — giving it `.background` lets the system schedule it fully around whatever the user is actively doing, which is exactly the point of picking a QoS honestly instead of defaulting everything to a higher class "to be safe."

Picking a QoS too high doesn't make your work finish faster in the way people assume — it just means the system spends more energy running it sooner, competing with the user's actual foreground work, which is precisely the behavior that gets an app flagged as a battery drain.

## Network efficiency: batching over chatting

Background network requests are where energy cost and code design meet most directly. A background sync that fires ten separate small requests, each waking the radio, is dramatically more expensive than one request that batches the same data.

```swift
// Costly: ten radio wake-ups
for id in pendingIDs { api.fetchItem(id) { ... } }

// Cheaper: one radio wake-up, one round trip
api.fetchItems(ids: pendingIDs) { items in ... }
```

For background transfers specifically, `URLSession` has a dedicated mode that hands the transfer off to the OS itself:

```swift
let config = URLSessionConfiguration.background(withIdentifier: "com.app.upload")
config.isDiscretionary = true       // let the system pick an optimal, efficient time
config.sessionSendsLaunchEvents = true
let session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
```

A **background `URLSession`** transfer continues even if your app is suspended or terminated — the OS's networking daemon does the actual transfer, and relaunches your app briefly via a delegate callback when it completes. `isDiscretionary: true` lets the system choose *when* to run the transfer for maximum efficiency (for example, waiting for Wi-Fi instead of burning cellular data), which is the right default for anything that isn't urgent, like a photo backup.

## Common pitfalls

- **Treating `earliestBeginDate` as a schedule.** It's a floor, not a promise — the OS decides the actual run time based on usage patterns and system state.
- **Forgetting to re-submit inside the handler.** `BGTaskScheduler` requests are one-shot; the handler must schedule its own next run.
- **Skipping the expiration handler.** Without it, an overrunning task risks the OS killing your process outright instead of you finishing gracefully.
- **Defaulting everything to `.userInitiated` or higher.** Over-prioritizing background work burns more energy and invites system throttling, without actually making anything feel faster to the user.
- **Firing many small background requests instead of batching.** Each one pays a fresh radio wake-up cost that batching avoids.

## Interview lens

If asked how you'd keep an app's data fresh in the background, name `BGTaskScheduler` specifically and the two task types: `BGAppRefreshTask` for short "check for new content" work, `BGProcessingTask` for longer deferrable maintenance that can require power or network conditions. Mention that `earliestBeginDate` is only a floor — the actual grant is entirely up to the system, driven by the user's usage patterns.

On energy, the strong answer names concrete costs rather than saying "battery efficient": CPU wake-ups have a fixed cost before any work runs, and radio usage is expensive enough that batching several requests into one is nearly always worth doing. Tie QoS into this — `.background` for invisible maintenance, `.utility` for visible-but-not-urgent — and note that over-prioritizing work doesn't make it faster, it just burns more energy and can get an app throttled by the system.

If the conversation goes to networking specifically, mention background `URLSession` and `isDiscretionary` — that's the detail that signals you've actually shipped an upload/download feature that needs to survive app suspension, not just read about `BGTaskScheduler` in the abstract.
