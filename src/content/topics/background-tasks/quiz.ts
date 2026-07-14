import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "bgtask-earliest-begin",
    type: "mcq",
    prompt: "What does `BGAppRefreshTaskRequest.earliestBeginDate` actually guarantee?",
    options: [
      "Only that the task won't run before that time — the actual run time is chosen by the system",
      "The exact time the task will run, with OS-level precision guaranteed by the scheduler",
      "The task will run within one minute of that time, using an internal timer backed by the kernel watchdog",
      "Nothing — the property is silently discarded by the BGTaskScheduler at registration time",
    ],
    answer: 0,
    explanation:
      "`earliestBeginDate` is a floor, not a schedule. iOS decides the real run time based on usage patterns, battery state, and system load — it may run much later than the requested time, or not at all if conditions never look favorable.",
  },
  {
    id: "bgtask-two-types",
    type: "mcq",
    prompt: "What's the difference between `BGAppRefreshTask` and `BGProcessingTask`?",
    options: [
      "BGAppRefreshTask is short, for keeping content fresh; BGProcessingTask is longer and deferrable, for maintenance work that can require power/network conditions",
      "They are interchangeable aliases registered under different identifiers in the same BGTaskScheduler queue",
      "BGProcessingTask can only run in the foreground while the app is visible to the user",
      "BGAppRefreshTask requires external power and a Wi-Fi connection while BGProcessingTask runs freely on battery with any available network and no scheduling constraints",
    ],
    answer: 0,
    explanation:
      "BGAppRefreshTask suits quick freshness checks. BGProcessingTask is for heavier, deferrable work (like database cleanup or reindexing) and can set requirements like `requiresExternalPower` or `requiresNetworkConnectivity`.",
  },
  {
    id: "bgtask-expiration-fill",
    type: "fill",
    prompt: "Inside a background task handler, you must set a(n) ___ handler that iOS calls when it's about to forcibly terminate the task for overrunning its time budget.",
    answers: ["expiration"],
    hint: "It fires when the system runs out of patience.",
    explanation:
      "The expiration handler is your last chance to clean up gracefully (e.g. cancel an in-flight operation) before the system kills the task outright.",
  },
  {
    id: "bgtask-resubmit-predict",
    type: "predict",
    prompt: "A developer registers a BGAppRefreshTask handler but never calls `BGTaskScheduler.shared.submit(...)` again inside it. What happens after the first scheduled run?",
    code: `func handleAppRefresh(task: BGAppRefreshTask) {
    // ... does work, calls task.setTaskCompleted(success: true) ...
    // forgot to re-submit a new request here
}`,
    options: [
      "No further refreshes are scheduled — each request is one-shot and must be resubmitted for the next run",
      "iOS automatically reschedules it at the same earliestBeginDate interval forever without requiring any developer action",
      "The task runs in a continuous background loop until the expiration handler fires and stops it",
      "The app crashes on the next launch because BGTaskScheduler detects the missing re-submission",
    ],
    answer: 0,
    explanation:
      "BGTaskScheduler requests are single-use. The idiomatic pattern is to call `submit` again at the start of the handler so the next refresh gets scheduled before the current one even finishes.",
  },
  {
    id: "bgtask-qos-choice",
    type: "mcq",
    prompt: "Which QoS class fits a nightly cache-cleanup task with no user waiting and no progress UI?",
    options: [
      ".background",
      ".userInteractive",
      ".userInitiated",
      ".utility with maximum priority",
    ],
    answer: 0,
    explanation:
      "`.background` is for work the user has no visibility into and the system can defer freely — exactly a nightly cleanup task. Higher QoS classes compete with foreground work and cost more energy without benefiting the user.",
  },
  {
    id: "bgtask-qos-truths-multi",
    type: "multi",
    prompt: "Select all true statements about quality-of-service (QoS) classes.",
    options: [
      "Higher QoS makes work more likely to compete with foreground work for CPU/energy",
      "`.utility` suits long-running work the user knows about but isn't actively blocked on",
      "Picking a higher QoS always makes background work finish measurably sooner",
      "`.userInteractive` is appropriate for most background-mode work",
    ],
    answers: [0, 1],
    explanation:
      "QoS is a priority hint, not a performance multiplier — over-prioritizing background work doesn't reliably speed it up, it just burns more energy and can get an app throttled (option 2 is false). `.userInteractive` is reserved for work actively blocking the UI, never background-mode work (option 3 is false).",
  },
  {
    id: "bgtask-energy-senior",
    type: "mcq",
    prompt: "Why is batching several small network requests into one request more energy-efficient in the background?",
    options: [
      "Radio wake-ups are one of the most expensive operations on the device, and batching avoids paying that cost repeatedly",
      "Batched requests always transmit fewer total bytes because headers are deduplicated by the network stack",
      "iOS refuses to grant more than one concurrent background task slot regardless of request count",
      "It has no measurable energy effect at all; the cellular and Wi-Fi radios drain exactly the same total power regardless of whether requests are spread out or grouped",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Powering up the cellular/Wi-Fi radio has a high fixed energy cost. A burst of several requests lets the radio power down once afterward, while spreading the same requests out keeps it in a high-power state longer — hence CodeQuest-style advice to batch background network calls.",
  },
  {
    id: "bgtask-discretionary-senior",
    type: "predict",
    prompt: "What does setting `config.isDiscretionary = true` on a background `URLSessionConfiguration` do?",
    code: `let config = URLSessionConfiguration.background(withIdentifier: "com.app.upload")
config.isDiscretionary = true`,
    options: [
      "Lets the system choose an optimal time and network (e.g. wait for Wi-Fi) to run the transfer efficiently",
      "Forces the transfer to start immediately on the current network connection regardless of available Wi-Fi or remaining battery state",
      "Disables the background URLSession entirely, falling back to foreground-only session behavior",
      "Makes the transfer run synchronously on the calling thread, blocking until the transfer completes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`isDiscretionary` hands scheduling control to the OS, which can defer non-urgent transfers to a more efficient moment — such as waiting for Wi-Fi instead of burning cellular data — the right default for things like automatic photo backups.",
  },
  {
    id: "bgtask-flashcard",
    type: "flashcard",
    prompt: "Explain how background work operates on iOS: modes, scheduling, energy, QoS, and networking. Answer aloud, then reveal.",
    modelAnswer:
      "An app is quickly moved to the **suspended** state when backgrounded and stops executing entirely. To do work anyway, it declares **background modes** in Info.plist (audio, fetch, processing, remote-notification) and schedules actual runs through `BGTaskScheduler`: **`BGAppRefreshTask`** for short freshness checks, **`BGProcessingTask`** for longer deferrable maintenance that can require power or network. `earliestBeginDate` is only a floor — the system decides real run times based on usage patterns — and every handler must set an **expiration handler** to clean up gracefully before the OS kills an overrunning task. The system is stingy because CPU wake-ups and radio usage both carry high fixed energy costs, so batching work (including network requests) is far cheaper than spreading it out. Every dispatched unit of work should carry an honest **quality of service** class — `.background` for invisible maintenance, `.utility` for visible-but-not-urgent work — since over-prioritizing doesn't make things faster, just more expensive and prone to system throttling. For transfers that must survive suspension or termination, a **background `URLSession`** hands the transfer to the OS's networking daemon, and `isDiscretionary: true` lets the system pick an efficient time and network to run it.",
    keyPoints: [
      "Background modes (Info.plist) unlock capabilities, not guaranteed run time",
      "BGAppRefreshTask (short) vs BGProcessingTask (long, deferrable, conditions)",
      "earliestBeginDate is a floor; must resubmit each run; must set expirationHandler",
      "CPU wake-ups and radio usage are expensive — batch work and network calls",
      "QoS is a priority hint (.background/.utility for non-urgent work), not a speed guarantee",
      "Background URLSession + isDiscretionary lets transfers survive suspension efficiently",
    ],
    explanation:
      "A senior answer ties scheduling APIs to the underlying energy costs (CPU wake-ups, radio usage) that motivate them, rather than reciting the API surface in isolation.",
  },
];

export default quiz;
