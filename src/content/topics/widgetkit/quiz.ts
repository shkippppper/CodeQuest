import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "widget-not-a-miniapp",
    type: "mcq",
    prompt: "Why can't a home-screen widget just poll a server in a loop to stay current?",
    options: [
      "A widget isn't a continuously running app — the system renders it from precomputed snapshots to save battery, so there's nowhere to put a loop",
      "The networking stack is disabled inside widget extensions, so any URL request you attempt from a provider immediately fails with a permissions error",
      "Widgets are allowed exactly one network call across their entire lifetime, after which every further request is silently dropped by the OS",
      "Polling is technically permitted but the compiler refuses to build any widget target that contains a while-loop or a repeating timer anywhere",
    ],
    answer: 0,
    explanation:
      "A widget is **not a mini-app**. It doesn't run continuously; the system draws it from snapshots you prepared in advance. There's no place for a polling loop — you supply a timeline and the OS decides when to render.",
  },
  {
    id: "widget-three-parts",
    type: "mcq",
    prompt: "A `Widget` is built from which three parts?",
    options: [
      "A configuration, a `TimelineProvider` that supplies snapshots, and a SwiftUI view that draws one entry",
      "A background service, a websocket connection to the app, and a storyboard scene that the system instantiates on demand",
      "A URLSession, a Core Data stack it shares directly with the host app, and a UIViewController wrapped for the home screen",
      "A launch agent, a persistent timer object, and an interface builder file describing every family the widget supports",
    ],
    answer: 0,
    explanation:
      "A widget = **configuration** (names it and wires things together) + a **`TimelineProvider`** (supplies dated snapshots) + a **SwiftUI view** (renders one entry). No background service or continuous connection is involved.",
  },
  {
    id: "timeline-entry-fill",
    type: "fill",
    prompt:
      "A single dated snapshot of what a widget should show — a `date` plus the data to display — is called a timeline ___.",
    answers: ["entry"],
    hint: "The type conforms to `TimelineEntry`; it's one frozen frame.",
    explanation:
      "A timeline **entry** is one frozen frame: a `date` (when to show it) plus the data (what to show). The provider returns a list of entries; the view renders one at a time.",
  },
  {
    id: "timeline-render-predict",
    type: "predict",
    prompt:
      "The provider returns this timeline at noon. When does the system display the 72° entry, and does it run your provider code to make that happen?",
    code: [
      "let noon = Date()",
      "let oneHour = Calendar.current.date(byAdding: .hour, value: 1, to: noon)!",
      "let entries = [",
      "    WeatherEntry(date: noon, temperature: 70),",
      "    WeatherEntry(date: oneHour, temperature: 72),",
      "]",
      "completion(Timeline(entries: entries, policy: .atEnd))",
    ].join("\n"),
    options: [
      "The system displays 72° at 1pm on its own, without waking your provider — you already handed it that future frame",
      "The provider is re-invoked at exactly 1pm on a dedicated background thread to recompute and then return the 72° frame",
      "72° shows the instant the timeline is returned, because entries render immediately regardless of the dates stamped on them",
      "Nothing shows until the user taps the widget, at which point the provider runs again and rebuilds both entries from scratch",
    ],
    answer: 0,
    explanation:
      "You precomputed the future. The OS is a slideshow projector: it shows 70° now and swaps to 72° at 1pm from the frames you already provided — **without** waking your code in between.",
  },
  {
    id: "reload-policy-fill",
    type: "fill",
    prompt:
      "In `Timeline(entries: entries, policy: ___)`, which policy means 'after the last entry's time passes, ask me for a fresh timeline'?",
    answers: [".atEnd", "atEnd"],
    hint: "The other options are `.after(date)` and `.never`.",
    explanation:
      "`.atEnd` asks the system to request a new timeline once the final entry expires. `.after(date)` waits until a specific date; `.never` waits for an explicit nudge.",
  },
  {
    id: "reload-budget-mcq",
    type: "mcq",
    prompt:
      "You set `.atEnd` and your last entry expires at 3:00pm. What actually determines when the widget refreshes?",
    options: [
      "A system reload budget — roughly dozens of wake-ups a day, spaced by the OS based on battery and usage; 'around 3pm, budget permitting'",
      "A hard guarantee that your provider is re-invoked at 3:00:00pm precisely, since `.atEnd` is a firm contract the scheduler always honors",
      "The refresh happens exactly when the user next unlocks the phone after 3pm, and never at any other moment regardless of budget",
      "Your app's background-fetch interval in the Info.plist, which overrides the widget timeline and controls every reload the widget performs",
    ],
    answer: 0,
    explanation:
      "Reloads are governed by a **budget** — roughly dozens per day, spaced by the system. `.atEnd` means 'refresh around then, budget permitting,' never a to-the-second guarantee.",
  },
  {
    id: "reload-nudge-fill",
    type: "fill",
    prompt:
      "To ask the system to rebuild a widget's timeline soon after your data changed, you call `WidgetCenter.shared.___(ofKind:)`.",
    answers: ["reloadTimelines"],
    hint: "There's also a `reloadAllTimelines()` variant with no arguments.",
    explanation:
      "`WidgetCenter.shared.reloadTimelines(ofKind:)` nudges the system to rebuild that widget's timeline. It still spends from the budget and isn't instantaneous, but it's how you say 'please refresh now.'",
  },
  {
    id: "app-group-mcq",
    type: "mcq",
    prompt:
      "Your app fetched a new temperature and stored it in its normal storage, but the widget still shows the old value. Why, and what's the fix?",
    options: [
      "The widget runs in a separate extension process that can't see the app's storage — share the value through an App Group container or shared UserDefaults",
      "The widget caches its last render forever and must be deleted and re-added by the user before it will ever pick up any newly written value",
      "The app wrote on a background thread the widget can't observe, so you must marshal the write back onto the main thread for the widget to read it",
      "SwiftUI diffed the entry against the previous frame and skipped the update, so you need to give the widget view a brand-new explicit `.id(...)` value each time the temperature changes at all",
    ],
    answer: 0,
    explanation:
      "The widget is a **separate extension process** and can't see the app's private storage. Route shared data through an **App Group** (shared container / shared `UserDefaults`), then call `reloadTimelines`.",
  },
  {
    id: "app-group-suite-predict",
    type: "predict",
    prompt:
      "For the app's write to be visible to the widget, what must be true of the two `UserDefaults(suiteName:)` calls (one in the app, one in the widget)?",
    code: [
      "// In the app:",
      'let a = UserDefaults(suiteName: "group.com.example.weather")!',
      'a.set(72, forKey: "latestTemp")',
      "",
      "// In the widget's provider:",
      'let b = UserDefaults(suiteName: "???")!',
      'let temp = b.integer(forKey: "latestTemp")',
    ].join("\n"),
    options: [
      "Both must use the identical App Group suite name, enabled on both targets — that's the only shared store the two processes can both reach",
      "The widget's suite name may be anything as long as the key string 'latestTemp' matches, since keys are what bridge the two processes",
      "The widget must instead read `UserDefaults.standard`, because group suites are write-only from the app side and can't be read by an extension",
      "The suite names must differ so the OS can route the value, and the system copies it from the app's suite into the widget's suite on reload",
    ],
    answer: 0,
    explanation:
      "Both sides must open the **same App Group suite name** (enabled on both targets). That shared container is the only store the app process and the widget process can both reach.",
    difficulty: "senior",
  },
  {
    id: "widget-family-mcq",
    type: "mcq",
    prompt:
      "One widget definition needs to render differently at `.systemSmall` versus `.accessoryCircular`. How do you know which size the system is drawing?",
    options: [
      "Read `@Environment(\\.widgetFamily)` inside the view and branch on it; declare the sizes you support with `.supportedFamilies([...])`",
      "Register a separate `Widget` type per family and let the system pick whichever one matches the slot the user dropped it into",
      "Inspect the view's `GeometryReader` size at runtime and infer the family from the measured width and height of the container",
      "Query `WidgetCenter.shared.currentConfigurations()` in the body, which returns the active family for the widget currently being rendered",
    ],
    answer: 0,
    explanation:
      "`@Environment(\\.widgetFamily)` tells the view which size is being rendered, so one definition serves every slot. You list the sizes you handle with `.supportedFamilies([...])`.",
  },
  {
    id: "live-activity-mcq",
    type: "mcq",
    prompt:
      "A food-delivery app wants a Lock Screen and Dynamic Island display that updates as the driver gets closer. Which tool fits, and what's a key constraint?",
    options: [
      "A Live Activity via ActivityKit — updated with `Activity.update` or push — and it's time-limited, auto-ending after a few hours",
      "A home-screen widget with a `.after(date)` timeline that recomputes the driver's distance once every single second until arrival",
      "A silent background app refresh that redraws a custom Lock Screen overlay directly, bypassing WidgetKit and ActivityKit entirely",
      "A `.systemLarge` widget pinned to the Lock Screen permanently, since large widgets are the only family allowed to update in real time",
    ],
    answer: 0,
    explanation:
      "An ongoing event on the Lock Screen / Dynamic Island is a **Live Activity** (ActivityKit), updated via `Activity.update` or push. It's deliberately **time-limited** and auto-ends after a few hours.",
  },
  {
    id: "activity-attributes-multi",
    type: "multi",
    prompt: "Select **all** statements that are true of ActivityKit Live Activities.",
    options: [
      "`ActivityAttributes` splits fixed data from a nested `ContentState` holding the values that change over time",
      "`Activity.request`, `Activity.update`, and `Activity.end` drive the start, refresh, and dismissal lifecycle",
      "They can be updated in the background by a push notification delivered straight to the activity",
      "They run indefinitely with no system-imposed time limit, making them a good permanent replacement for a widget",
    ],
    answers: [0, 1, 2],
    explanation:
      "The first three are correct: attributes split fixed vs. changing (`ContentState`) data, the `request`/`update`/`end` methods drive the lifecycle, and push can update them. They are **time-limited**, so option 4 is false.",
  },
  {
    id: "widget-interactivity-mcq",
    type: "mcq",
    prompt:
      "You want a button inside a widget that toggles a value without opening the app. What's actually possible?",
    options: [
      "Add a button or toggle backed by an `AppIntent` — the system runs that declared action; arbitrary gesture-driven UI still isn't allowed",
      "Attach any SwiftUI `.gesture(...)` you like, exactly as in a normal app, since widgets share the full interaction model with regular views",
      "Present a sheet from the widget and handle taps in its view controller, provided the memory budget for the extension is raised first",
      "Nothing — widgets are strictly non-interactive and every tap must open the host app before any state change can be performed at all",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Interactivity is limited to buttons/toggles backed by an **AppIntent** — a declared action the system runs. Arbitrary gestures, sheets, and scrolling still aren't available in a widget.",
  },
  {
    id: "widgetkit-flashcard",
    type: "flashcard",
    prompt:
      "Explain the WidgetKit model: why a widget can't run continuously, how the timeline + reload budget work, how data reaches it from the app, and when you'd reach for a Live Activity instead. Answer aloud, then reveal.",
    modelAnswer:
      "A home-screen **widget is not a mini-app** — it doesn't run continuously, so it can't poll or loop. The system renders it from **precomputed snapshots** to save battery. A `Widget` is a **configuration** + a **`TimelineProvider`** + a **SwiftUI view**. The provider has three jobs: `placeholder` (instant fake skeleton), `getSnapshot` (one representative frame, e.g. for the gallery), and `getTimeline` (a list of dated **entries** plus a **reload policy** — `.atEnd`, `.after(date)`, or `.never`). Each entry is a frozen frame with a `date`; the OS displays each at its stamped time **without waking your code** in between — you hand the OS the future. Refresh frequency is governed by a **reload budget** (roughly dozens a day, exact timing the system's call); `WidgetCenter.shared.reloadTimelines` nudges a rebuild but isn't instant. Widgets render at different **families** (`.systemSmall/.medium/.large`, `.accessoryCircular`, etc.), read via `@Environment(\\.widgetFamily)`. Because the widget runs in a **separate extension process**, the app shares data through an **App Group** (shared container / shared `UserDefaults`), then calls `reloadTimelines`. For an **ongoing event** (a ride, a score) on the Lock Screen / Dynamic Island, use a **Live Activity** via **ActivityKit**: describe data with `ActivityAttributes` (fixed data + a nested `ContentState` that changes), drive it with `Activity.request/update/end`, update via app or push — and it's **time-limited**. Constraints throughout: no scrolling, no video, interactivity only via **AppIntent**-backed buttons, and a tight memory budget.",
    keyPoints: [
      "Widget isn't a mini-app — no continuous run; rendered from precomputed snapshots",
      "Widget = configuration + TimelineProvider + SwiftUI view; entry = dated frame",
      "Provider: placeholder, getSnapshot, getTimeline (entries + reload policy)",
      "Reload budget: dozens/day, system-controlled; reloadTimelines nudges",
      "Separate extension process → share data via App Group / shared UserDefaults",
      "Families read via @Environment(\\.widgetFamily)",
      "Live Activities (ActivityKit): ongoing events, ActivityAttributes/ContentState, request/update/end, time-limited",
    ],
    explanation:
      "A senior answer leads with 'not a mini-app / precomputed snapshots,' explains the timeline + budget, names the App Group as the cross-process bridge, and draws the widget-vs-Live-Activity line with ActivityKit specifics.",
  },
];

export default quiz;
