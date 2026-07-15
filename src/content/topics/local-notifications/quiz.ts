import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "local-vs-push",
    type: "mcq",
    prompt: "What most fundamentally separates a local notification from a push notification?",
    options: [
      "A local notification is scheduled and delivered on the device itself with no network; a push originates from a server and arrives via APNs",
      "A local notification is always silent and invisible whereas a push notification is the only kind that can ever show a visible banner to the user",
      "A local notification can only display text while a push notification is the sole mechanism able to attach a sound, a badge, or any custom buttons",
      "A local notification requires a paid developer entitlement to use but a push notification works freely for everyone without any special configuration",
    ],
    answer: 0,
    explanation:
      "The dividing line is *origin*. A **local notification** is scheduled on-device and needs no network; a **push** comes from a server through APNs. Both can be visible, carry sound/badge, and show buttons.",
  },
  {
    id: "which-framework",
    type: "fill",
    prompt: "Local notifications are built with the ___ framework (import it to reach UNUserNotificationCenter).",
    answers: ["UserNotifications", "usernotifications"],
    hint: "One word, camel-cased; it's what you import at the top of the file.",
    explanation:
      "`import UserNotifications` gives you `UNUserNotificationCenter`, `UNMutableNotificationContent`, the trigger types, and the delegate protocol.",
  },
  {
    id: "authorization-denied",
    type: "mcq",
    prompt: "You call `requestAuthorization` and the user taps \"Don't Allow\". What happens to notifications you schedule afterward?",
    options: [
      "They are silently never delivered — no error is thrown at schedule time, they simply don't appear",
      "The very next call to `add(request)` throws a permission error you are then required to catch with do/try/catch",
      "They are queued by the system and delivered in a batch the moment the user later re-enables notifications in Settings",
      "They still appear normally, because authorization only governs sound and badges, never whether the banner is shown",
    ],
    answer: 0,
    explanation:
      "Denial fails *silently*: `add` still succeeds, but nothing ever shows. That's why you must check the returned `granted` bool and adjust your UI rather than promising a reminder you can't deliver.",
  },
  {
    id: "content-type-fill",
    type: "fill",
    prompt: "The mutable object you fill with `title`, `body`, `sound`, and `badge` is a UN___NotificationContent.",
    answers: ["Mutable", "mutable"],
    hint: "It's mutable so you can set its fields — the word goes between UN and NotificationContent.",
    explanation:
      "`UNMutableNotificationContent` is the settable container for everything the user sees. The non-mutable `UNNotificationContent` is what you read back from a delivered notification.",
  },
  {
    id: "trigger-types-multi",
    type: "multi",
    prompt: "Select **all** trigger types the UserNotifications framework provides for scheduling a local notification.",
    options: [
      "A time-interval trigger that fires after N seconds",
      "A calendar trigger that fires at matching DateComponents",
      "A location trigger that fires on entering a region",
      "A network-reachability trigger that fires when Wi-Fi connects",
    ],
    answers: [0, 1, 2],
    explanation:
      "The three real triggers are `UNTimeIntervalNotificationTrigger`, `UNCalendarNotificationTrigger`, and `UNLocationNotificationTrigger`. There is no reachability trigger — option 4 is invented.",
  },
  {
    id: "calendar-repeats-predict",
    type: "predict",
    prompt: "Only `hour` and `minute` are set on the DateComponents, and `repeats` is true. When does this notification fire?",
    code: [
      "var date = DateComponents()",
      "date.hour = 9",
      "date.minute = 0",
      "let trigger = UNCalendarNotificationTrigger(",
      "    dateMatching: date, repeats: true)",
    ].join("\n"),
    options: [
      "Every day at 9:00am, because only the unset fields are treated as wildcards that any value matches",
      "Exactly once, tomorrow at 9:00am, after which the trigger is discarded and never fires on any later day",
      "Immediately when scheduled and then again every nine hours, reading the hour field as a repeat interval",
      "Never, since a calendar trigger is rejected at add time unless the day and month components are also filled in",
    ],
    answer: 0,
    explanation:
      "A calendar trigger matches only the components you set and treats the rest as wildcards. With just `hour`/`minute` and `repeats: true`, every day's 9:00am matches — so it fires daily.",
  },
  {
    id: "identifier-purpose",
    type: "mcq",
    prompt: "Why does a `UNNotificationRequest` take a unique `identifier` string?",
    options: [
      "It lets you later update or cancel that specific pending notification via removePendingNotificationRequests",
      "It is shown to the user as the notification's headline text, appearing directly above the title and body",
      "It encrypts the notification payload so the delivered content cannot be read by other apps on the same device",
      "It determines the exact firing time, overriding whatever trigger you attached to the request when it fires",
    ],
    answer: 0,
    explanation:
      "The `identifier` is your handle on the scheduled notification. Re-adding with the same id *replaces* it, and `removePendingNotificationRequests(withIdentifiers:)` cancels it. It's never user-visible.",
  },
  {
    id: "foreground-delivery-predict",
    type: "predict",
    prompt: "You schedule this, then keep the app open and on screen. Five seconds later, does the banner appear by default?",
    code: [
      "let trigger = UNTimeIntervalNotificationTrigger(",
      "    timeInterval: 5, repeats: false)",
      "let request = UNNotificationRequest(",
      "    identifier: \"t\", content: content, trigger: trigger)",
      "try await center.add(request)",
    ].join("\n"),
    options: [
      "No — a notification firing while the app is foregrounded is suppressed unless you implement willPresent",
      "Yes — foreground notifications always show a banner, and willPresent only ever controls the sound",
      "Yes, but only the app icon badge updates; the banner and any sound are held back until the next launch",
      "No, and worse, the pending request is dropped entirely so it will not fire even after you background the app",
    ],
    answer: 0,
    explanation:
      "By default iOS suppresses a notification that fires while your app is in the foreground. You opt back in by implementing `willPresent` on the delegate and returning presentation options like `[.banner, .sound]`.",
  },
  {
    id: "delegate-tap-senior",
    type: "mcq",
    prompt: "The user taps a delivered reminder to open your app. Which delegate method runs, and how do you route to the right screen?",
    difficulty: "senior",
    options: [
      "didReceive response runs; read response.notification.request.identifier (or its userInfo) and navigate accordingly",
      "willPresent runs a second time on tap, and you inspect its returned presentation options to decide the destination",
      "applicationDidBecomeActive runs, and you diff the badge count against the last launch to infer which task was tapped",
      "No delegate fires on a tap; you must poll getDeliveredNotifications on every launch and guess the most recent one",
    ],
    answer: 0,
    explanation:
      "Taps land in `userNotificationCenter(_:didReceive:)`. The `response` carries the original request, so you read its `identifier` or `userInfo` to route to the exact task the reminder was about.",
  },
  {
    id: "actions-categories-senior",
    type: "mcq",
    prompt: "You want \"Complete\" and \"Snooze\" buttons on a reminder banner. How do you wire them up?",
    difficulty: "senior",
    options: [
      "Make UNNotificationActions, group them in a UNNotificationCategory, register it, and set content.categoryIdentifier to that category",
      "Add each button as an extra field on UNMutableNotificationContent, since actions are simply optional array properties that hang off the content object itself",
      "Return the buttons from willPresent each time the notification fires, because actions are computed fresh at presentation time",
      "Pass the button titles directly into the UNNotificationRequest initializer alongside the identifier, content, and trigger",
    ],
    answer: 0,
    explanation:
      "Buttons are `UNNotificationAction`s grouped into a `UNNotificationCategory`, registered once with `setNotificationCategories`. Tag a notification by setting `content.categoryIdentifier`. Taps arrive in `didReceive` via `response.actionIdentifier`.",
  },
  {
    id: "local-notifications-flashcard",
    type: "flashcard",
    prompt:
      "Walk through scheduling a local notification end to end: permission, content, triggers, the request, foreground behavior, taps, and action buttons. Answer aloud, then reveal.",
    modelAnswer:
      "A **local notification** is scheduled and delivered entirely **on-device** with no network — unlike a push, which comes from a server via **APNs**. It's built with the **UserNotifications** framework. (1) **Permission**: `await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])` returns a `granted` bool — ask at a meaningful moment and handle denial, because denied notifications fail *silently*. (2) **Content**: fill a `UNMutableNotificationContent` with `title`, `body`, `sound`, `badge`. (3) **Trigger** (the *when*): `UNTimeIntervalNotificationTrigger` (after N seconds, optionally repeating), `UNCalendarNotificationTrigger` (matching `DateComponents`, e.g. every day at 9am — unset fields are wildcards), or `UNLocationNotificationTrigger` (on entering a region). (4) **Schedule**: wrap content + trigger in a `UNNotificationRequest` with a unique **identifier** and call `center.add(request)`; the identifier lets you replace it (re-add same id) or cancel it (`removePendingNotificationRequests(withIdentifiers:)`). (5) **Foreground**: by default a notification firing while the app is open is **suppressed** — implement `willPresent` on the `UNUserNotificationCenterDelegate` and return `[.banner, .sound]` to show it. (6) **Taps**: `didReceive response` fires; read `response.notification.request.identifier` or `userInfo` to route. (7) **Buttons**: `UNNotificationAction`s grouped into a `UNNotificationCategory`, registered with `setNotificationCategories`, attached via `content.categoryIdentifier`; the pressed button arrives as `response.actionIdentifier`.",
    keyPoints: [
      "On-device scheduling, no network — contrast with push/APNs",
      "requestAuthorization returns granted; denial fails silently",
      "UNMutableNotificationContent holds title/body/sound/badge",
      "Three triggers: time-interval, calendar (DateComponents), location",
      "UNNotificationRequest + unique identifier to add/update/cancel",
      "Foreground fire suppressed unless willPresent returns options",
      "didReceive handles taps; route by identifier/userInfo",
      "Actions grouped in a category, attached via categoryIdentifier",
    ],
    explanation:
      "A strong answer leads with on-device vs push, lists the four scheduling steps, names all three triggers, and covers the delegate's willPresent/didReceive plus actions-in-a-category.",
  },
];

export default quiz;
