## The problem: a widget must look live but can't stay awake

Picture the weather widget on your home screen. It shows the current temperature, and it looks like it's watching the sky in real time.

It isn't. Try writing the naive version in your head:

```swift
// The tempting, WRONG mental model:
while true {
    let temp = fetchTemperatureFromServer()
    display(temp)
    sleep(1)
}
```

If every widget ran a loop like this, your battery would be dead by lunch. So the system forbids it. A widget is **not a mini-app** — it does not run continuously, it does not sit in a loop, and most of the time it isn't executing any of your code at all.

Instead, the system renders your widget from **precomputed snapshots** — pictures of what to show, prepared in advance. Your job is not to *keep the widget updated*; it's to *hand the system a schedule of future snapshots* and let the system draw them when it chooses. This one constraint shapes every API in WidgetKit.

## What a widget is made of

A widget is three parts bolted together:

```swift
struct WeatherWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "WeatherWidget", provider: WeatherProvider()) { entry in
            WeatherView(entry: entry)
        }
    }
}
```

Read it piece by piece:

- The **configuration** (`StaticConfiguration`) names the widget and wires the other two parts together.
- The **provider** (`WeatherProvider`, a `TimelineProvider`) supplies the snapshots. This is where the interesting work lives.
- The **SwiftUI view** (`WeatherView`) draws one snapshot. It's an ordinary view, handed one `entry` to display.

That `entry` is the key word. A **timeline entry** is a single dated snapshot — a bundle of "here is what to show, and here is the moment to show it":

```swift
struct WeatherEntry: TimelineEntry {
    let date: Date       // WHEN to display this
    let temperature: Int // WHAT to display
}
```

An entry is a frozen frame. Your view turns one frame into pixels. The provider decides which frames exist and when.

## The TimelineProvider: handing the OS the future

A `TimelineProvider` has three jobs. Here's the whole shape, then we'll walk each method:

```swift
struct WeatherProvider: TimelineProvider {
    func placeholder(in context: Context) -> WeatherEntry { ... }
    func getSnapshot(in context: Context, completion: @escaping (WeatherEntry) -> Void) { ... }
    func getTimeline(in context: Context, completion: @escaping (Timeline<WeatherEntry>) -> Void) { ... }
}
```

### placeholder — the skeleton

```swift
func placeholder(in context: Context) -> WeatherEntry {
    WeatherEntry(date: Date(), temperature: 0)
}
```

`placeholder` returns instantly with fake, generic data. The system shows it as a greyed-out skeleton while real content loads — so it must never fetch or block.

### getSnapshot — the gallery preview

```swift
func getSnapshot(in context: Context, completion: @escaping (WeatherEntry) -> Void) {
    completion(WeatherEntry(date: Date(), temperature: 72))
}
```

`getSnapshot` returns *one* representative entry, fast. The system calls it when it needs a quick single frame — most visibly in the widget **gallery**, the picker where the user adds a widget. Show something nice and plausible here.

### getTimeline — the real schedule

This is the heart of WidgetKit. You return a `Timeline`: a list of future entries plus a **reload policy** telling the system what to do after the last entry is shown.

```swift
func getTimeline(in context: Context, completion: @escaping (Timeline<WeatherEntry>) -> Void) {
    let now = Date()
    var entries: [WeatherEntry] = []
    for hourOffset in 0..<5 {
        let date = Calendar.current.date(byAdding: .hour, value: hourOffset, to: now)!
        entries.append(WeatherEntry(date: date, temperature: 70 + hourOffset))
    }
    let timeline = Timeline(entries: entries, policy: .atEnd)
    completion(timeline)
}
```

You just handed the OS five frames covering the next five hours. The system will display the 70° frame now, swap to 71° in an hour, and so on — **without waking your code up** in between. You precomputed the future; the OS is a slideshow projector clicking through your slides at the times you stamped on them.

The **reload policy** is the last argument:

- `.atEnd` — after the final entry's time passes, ask me for a fresh timeline.
- `.after(date)` — don't ask me again until this specific date.
- `.never` — don't ask me again until something explicitly nudges you (more on that below).

### Predict-then-reveal

Question: can a widget poll a server every second to stay live?

Answer: **No.** There is no place to put a polling loop. You provide a timeline — a batch of dated snapshots — and the system decides when to render each one. If you need data that changes by the second (a stopwatch, a live score), a home-screen widget is the wrong tool; that's what Live Activities are for, later in this lesson.

## The reload budget: you propose, the system disposes

Your reload policy is a *request*, not a command. The system enforces a **reload budget** — a rough daily cap on how often it will wake your provider to build a new timeline. In practice that's on the order of dozens of refreshes a day, not hundreds, and the exact spacing is the system's call, shaped by battery, how often the user looks at the widget, and overall device load.

So `.atEnd` does not guarantee an instant refresh the moment your last entry expires. It means "refresh me around then, budget permitting."

When something genuinely changed — the user completed a task, new data arrived via a push — you can *nudge* the system:

```swift
WidgetCenter.shared.reloadTimelines(ofKind: "WeatherWidget")
```

This asks the system to rebuild that widget's timeline soon. It still isn't instantaneous and it still spends from the budget, but it's how you say "please refresh now" rather than waiting for the schedule. There's also `reloadAllTimelines()` for every widget you vend.

## Families: one widget, many sizes

The same widget can appear at different sizes, called **families**. You declare which ones you support and adapt the view to each:

```swift
StaticConfiguration(kind: "WeatherWidget", provider: WeatherProvider()) { entry in
    WeatherView(entry: entry)
}
.supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular])
```

The common families:

- `.systemSmall`, `.systemMedium`, `.systemLarge` — the home-screen tiles.
- `.accessoryCircular`, `.accessoryRectangular`, `.accessoryInline` — the tiny Lock Screen widgets (and watchOS complications).

Inside the view, read the current family from the environment and branch on it:

```swift
struct WeatherView: View {
    @Environment(\.widgetFamily) var family
    let entry: WeatherEntry

    var body: some View {
        switch family {
        case .systemSmall:  SmallWeather(entry: entry)
        case .accessoryCircular: CircularWeather(entry: entry)
        default: MediumWeather(entry: entry)
        }
    }
}
```

`@Environment(\.widgetFamily)` tells you which size the system is currently rendering, so one widget definition serves every slot.

## Sharing data: the widget lives in another process

Here's a fact that surprises people. Your widget is **not** part of your app's process. It's a separate **widget extension** — its own bundle, its own process, launched by the system on its own schedule. When your app writes something to a normal variable or its private storage, the widget cannot see it. They don't share memory, and they don't share a sandbox.

The bridge is an **App Group**: a shared container that both the app and the extension are granted access to. You enable the same App Group ID on both targets, and then they can read and write a common storage area.

The simplest form is a shared `UserDefaults`:

```swift
// In the main app, after new data arrives:
let shared = UserDefaults(suiteName: "group.com.example.weather")!
shared.set(72, forKey: "latestTemp")

// Later, in the widget's provider:
let shared = UserDefaults(suiteName: "group.com.example.weather")!
let temp = shared.integer(forKey: "latestTemp")
```

Both sides open `UserDefaults(suiteName:)` with the *same* App Group ID, and now they share a store. (You can also share files or a database in the group container — the principle is identical.)

The usual pattern: the app fetches fresh data, writes it into the App Group, then calls `WidgetCenter.shared.reloadTimelines(...)` so the widget rebuilds its timeline reading the new values.

## Live Activities: for events happening right now

A timeline is great for content that changes on a *schedule* — a calendar, a weather forecast. It's wrong for a **live, ongoing event**: a ride arriving, a sports score, a pizza in the oven. Those need frequent, event-driven updates on the Lock Screen and in the Dynamic Island. That's what **Live Activities**, powered by **ActivityKit**, are for.

You start by describing the activity's data with `ActivityAttributes`:

```swift
struct DeliveryAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var driverName: String
        var minutesAway: Int      // the part that changes over time
    }
    var orderNumber: String       // fixed for the whole activity
}
```

Split it in two: the outer struct holds values fixed for the activity's life (`orderNumber`), and the nested `ContentState` holds the values that *change* as the event unfolds (`minutesAway`).

Then you drive its lifecycle from your app:

```swift
// Start it:
let activity = try Activity.request(
    attributes: DeliveryAttributes(orderNumber: "1234"),
    content: .init(state: .init(driverName: "Ada", minutesAway: 12), staleDate: nil)
)

// Update it as things change:
await activity.update(using: .init(driverName: "Ada", minutesAway: 5))

// End it when the event is over:
await activity.end(nil, dismissalPolicy: .immediate)
```

`Activity.request` presents the Live Activity, `update` pushes a new `ContentState` to the Lock Screen and Dynamic Island, and `end` dismisses it. Updates can come from the app while it's running, or — for background freshness — from a **push notification** the system delivers straight to the activity.

Live Activities are deliberately **time-limited**: the system ends them automatically after a maximum lifetime (a few hours), because they're for a current event, not a permanent fixture.

## The constraints, collected

Widgets and Live Activities are intentionally boxed in. Keep the limits straight:

- **No continuous execution.** No loops, no timers driving the UI, no background polling. You supply snapshots; the system renders them.
- **No scrolling and no video.** A widget is a static frame. It can't scroll a list or play a movie.
- **Limited interactivity.** Early widgets were tap-only (opening the app). Now a widget can host buttons and toggles, but only ones backed by an **AppIntent** — a small declared action the system runs. You still can't put arbitrary gesture-driven UI in a widget.
- **A tight memory budget.** The extension gets far less memory than a full app. Loading a huge image or heavy dataset to render a frame will get the widget killed.

Every one of these traces back to the opening idea: a widget is a cheap, precomputed picture, not a running program.

## Common pitfalls

- **Trying to poll or run a timer in the provider.** There's no continuous execution — build a timeline of dated entries instead, and nudge with `reloadTimelines` when data changes.
- **Expecting `.atEnd` to refresh instantly.** The reload budget rate-limits you; treat refresh timing as "soon-ish," never guaranteed to the second.
- **Reading the app's own storage from the widget.** Different process — it can't see it. Route shared data through an App Group container or shared `UserDefaults`.
- **Using a Live Activity as a permanent widget.** They're time-limited by design and auto-end after a few hours; a persistent display belongs in a home-screen widget.
- **Blowing the memory budget rendering a frame.** Downsample images and keep per-entry data small, or the extension gets terminated.

## Interview lens

If asked "how does a widget stay up to date if it can't run in the background?", lead with the timeline model: you don't update the widget, you hand the system a *timeline* of dated snapshots plus a reload policy, and the system renders each entry at its stamped time without running your code in between. Saying "you give the OS the future" shows you actually get the design.

Expect a follow-up on refresh frequency. Say that reloads are governed by a system **budget** — roughly dozens a day, exact timing not yours to control — and that `WidgetCenter.reloadTimelines` requests a refresh but doesn't force an instant one.

If they ask how the widget gets data from the app, the one-word answer is **App Group**: the widget runs in a separate extension process, so shared state goes through a shared container / shared `UserDefaults`, not the app's own storage. Getting the "separate process" part right is the tell that you've shipped one.

Finally, know the WidgetKit-vs-Live-Activity line: home-screen widgets are for scheduled content and refresh on a budget; Live Activities (ActivityKit) are for a current, ongoing event on the Lock Screen and Dynamic Island, are updated via `Activity.update` or push, and are time-limited. Naming `ActivityAttributes` and its `ContentState` split — fixed data versus the changing part — signals hands-on experience.
