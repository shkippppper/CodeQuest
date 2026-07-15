import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "intent-what-is",
    type: "mcq",
    prompt: "What is an `AppIntent` in the App Intents framework?",
    options: [
      "A single, system-invokable app action — a struct with a `title` and a `perform()` the system can run from Siri, Shortcuts and more",
      "A background service that continuously listens for spoken commands and forwards every recognized phrase to your running app for handling",
      "A configuration file that lists which of Apple's predefined SiriKit domains, such as messaging or payments, your particular application supports",
      "A SwiftUI view modifier that decorates a button so that tapping it deep-links the user straight into a specific screen inside the app",
    ],
    answer: 0,
    explanation:
      "An intent is one action the system can invoke. You write a struct conforming to `AppIntent` with a `static var title` and an `async perform()`; the system runs it from Siri, Spotlight, Shortcuts, widgets and more.",
  },
  {
    id: "intent-perform-return",
    type: "predict",
    prompt: "This intent's `perform()` finishes its work. What does `return .result()` (with no arguments) mean?",
    code: [
      "func perform() async throws -> some IntentResult {",
      "    WaterStore.shared.logWater(amount: 250)",
      "    return .result()",
      "}",
    ].join("\n"),
    options: [
      "The action completed successfully and hands nothing back for a following step or a spoken reply",
      "The action was cancelled by the user partway through, so the system should discard any state it changed",
      "The action must be retried later because a required parameter could not be resolved at invocation time",
      "The action returns a Boolean success flag that the enclosing Shortcuts automation is expected to branch on next",
    ],
    answer: 0,
    explanation:
      "`.result()` with no arguments just signals success with no returned value and no dialog. To pass data onward or have Siri speak, you'd use `.result(value:dialog:)`.",
  },
  {
    id: "parameter-role",
    type: "mcq",
    prompt: "What does marking a stored property with `@Parameter` do?",
    options: [
      "Makes it an input the system supplies before `perform()`, editable in Shortcuts and prompted for when missing",
      "Marks it as private state that only the intent's own `perform()` method is allowed to read from and write to directly",
      "Registers it as an app entity so the system can list and search every saved instance of that property's declared type",
      "Persists its value to disk automatically between runs so the next invocation reuses whatever the user last entered before",
    ],
    answer: 0,
    explanation:
      "A `@Parameter` is an input the system resolves before calling `perform()`. It becomes an editable field in the Shortcuts editor, and if it's missing at invocation the system prompts the user for it (parameter resolution).",
  },
  {
    id: "app-shortcut-phrase-token",
    type: "fill",
    prompt: "In an `AppShortcut` phrase, you must include the `\\(.___)` token so Siri knows which app to route the phrase to.",
    answers: ["applicationName", "appName"],
    hint: "It stands in for your app's name (and its localized nicknames).",
    explanation:
      "`\\(.applicationName)` is required in an app-shortcut phrase. Siri needs the app name in the phrase to route it to you, and it accepts the app's name plus its localized nicknames automatically.",
  },
  {
    id: "siri-no-training-predict",
    type: "predict",
    prompt: "You register this `AppShortcut`. To make the phrase work by voice, what extra setup is required?",
    code: [
      "AppShortcut(",
      "    intent: LogWaterIntent(),",
      '    phrases: ["Log water in \\(.applicationName)"],',
      '    shortTitle: "Log Water",',
      '    systemImageName: "drop.fill"',
      ")",
    ].join("\n"),
    options: [
      "Nothing more — registering the phrase in an `AppShortcutsProvider` is the entire Siri setup",
      "You must train a custom voice-recognition model on sample recordings and bundle it inside the app",
      "You must add a separate Intents app extension target that handles the spoken request at runtime",
      "You must declare the phrase inside a `.intentdefinition` file so the build system can generate it",
    ],
    answer: 0,
    explanation:
      "An app-shortcut phrase is enough. The system handles speech recognition and matching — there's no voice-model training, no `.intentdefinition` file, and no separate extension. That's a headline win of App Intents over old SiriKit.",
  },
  {
    id: "entity-query-purpose",
    type: "mcq",
    prompt: "Why does an `AppEntity` usually need an `EntityQuery`?",
    options: [
      "It teaches the system how to fetch entities by id and how to list or search them for a picker",
      "It compresses each entity into a compact binary blob so the Shortcuts app can cache the full object between runs",
      "It defines the localized display name and SF Symbol shown for the entity's type in every one of the system's menus",
      "It grants the intent permission to write changes back to the entity's underlying store after `perform()` has finished",
    ],
    answer: 0,
    explanation:
      "An `EntityQuery` tells the system how to work with your entities: `entities(for:)` rehydrates saved ids into full objects, and `suggestedEntities()` supplies the default list a picker shows. Without it the system can't fetch or list them.",
  },
  {
    id: "where-intents-surface-multi",
    type: "multi",
    prompt: "Select **all** the places a single `AppIntent` can surface without per-surface code.",
    options: [
      "Siri, via a spoken app-shortcut phrase",
      "The Shortcuts app, as an action users drag into automations",
      "An interactive widget button using `Button(intent:)`",
      "Spotlight search results, when registered as an app shortcut",
    ],
    answers: [0, 1, 2, 3],
    explanation:
      "All four are real surfaces for the same intent. You describe the action once; the system exposes it through Siri, Shortcuts, interactive widgets/Control Center, Focus filters, and Spotlight — no separate code per surface.",
  },
  {
    id: "widget-button-intent-senior",
    type: "predict",
    prompt: "A Home-Screen widget uses `Button(intent: LogWaterIntent())`. The user taps it. What happens?",
    code: [
      "Button(intent: LogWaterIntent()) {",
      '    Label("Log", systemImage: "drop.fill")',
      "}",
    ].join("\n"),
    options: [
      "The intent's `perform()` runs in the background and the widget refreshes, without launching the full app",
      "The system opens the app to its main screen first and then forwards the tap to the intent once the UI is ready",
      "The tap is queued until the next widget-timeline reload, at which point the intent finally runs as a batch",
      "The button is rendered inert, because widgets can only display data and are never permitted to run any action",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Button(intent:)` runs the intent's `perform()` in the background and lets the widget reload — no app launch, no navigation. That's the point of interactive widgets: an intent-backed button that acts without opening the app.",
  },
  {
    id: "parameter-summary-senior",
    type: "mcq",
    prompt: "What does providing a `parameterSummary` (via `Summary(...)`) change for an intent?",
    options: [
      "How the action reads in the Shortcuts editor — its parameters slot into a natural one-line sentence",
      "Which Focus modes the intent is allowed to appear under when the user configures a per-mode filter",
      "The order the system resolves multiple parameters in, so required ones are always asked about before optional ones",
      "Whether the intent may return a value to a following step, by summarizing the shape of its output for the next action",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A `ParameterSummary` shapes how the action reads in the Shortcuts editor: `Summary(\"Log \\(\\.$amount) ml of water\")` makes it a natural sentence with the parameter as a tappable blank, instead of a bare title with a separate field.",
  },
  {
    id: "vs-sirikit-senior",
    type: "mcq",
    prompt: "How does App Intents (2022+) differ from the older SiriKit approach it replaced?",
    options: [
      "App Intents are plain Swift structs needing no `.intentdefinition` file and, for most apps, no separate Intents extension",
      "App Intents can only expose Apple's predefined domains, whereas SiriKit was the framework that allowed fully custom actions",
      "App Intents require you to hand-write the generated `INIntent` subclasses that SiriKit used to produce for you automatically",
      "App Intents move all of your action-handling logic out into a dedicated app extension target with its very own lifecycle",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "SiriKit meant a `.intentdefinition` file, code-generated `INIntent` subclasses, a separate Intents extension, and mostly Apple's predefined domains. App Intents are plain Swift structs — no definition file, no code gen, no extra target for most apps, and arbitrary custom actions.",
  },
  {
    id: "app-intents-flashcard",
    type: "flashcard",
    prompt:
      "Explain the App Intents framework: what an intent is, how parameters and app entities work, how app shortcuts give Siri support, and how it differs from SiriKit. Answer aloud, then reveal.",
    modelAnswer:
      "**App Intents** lets you describe your app's actions once in plain Swift so the system can run them from outside the app. An **intent** is a struct conforming to `AppIntent` with a `static var title` and an `async throws perform()` that does the work and returns an `IntentResult` (optionally with a `value:` for the next automation step and a `dialog:` Siri speaks). Inputs are **`@Parameter`** properties — the system resolves them, shows them as editable fields in Shortcuts, and prompts the user when one is missing; a **`ParameterSummary`** turns the action into a natural one-line sentence in the editor. To let an intent pick one of your app's nouns, model it as an **`AppEntity`** (with an `id` and a `displayRepresentation`) backed by an **`EntityQuery`** that fetches entities by id (`entities(for:)`) and lists suggestions (`suggestedEntities()`), giving the user a searchable picker. An **`AppShortcutsProvider`** registers **`AppShortcut`s** that pair an intent with spoken **phrases** — each phrase must contain `\\(.applicationName)` — and that alone gives Siri and Spotlight support with **no voice training and no separate extension**. The same intent surfaces across Siri, Spotlight, the Shortcuts app, Focus filters, and interactive widgets/Control Center via `Button(intent:)`, which runs `perform()` in the background without launching the app. App Intents (2022+) replaced **SiriKit**, which needed a `.intentdefinition` file, code-generated `INIntent` subclasses, a separate Intents extension, and mostly Apple's predefined domains.",
    keyPoints: [
      "Intent = struct conforming to AppIntent with title + async perform() returning IntentResult",
      "@Parameter inputs are system-resolved and prompted; ParameterSummary makes a natural sentence",
      "AppEntity + EntityQuery model app nouns so an intent can pick 'which one?' from a searchable list",
      "AppShortcut phrases (with \\(.applicationName)) give Siri/Spotlight — no voice training, no extension",
      "Same intent surfaces in Siri, Spotlight, Shortcuts, Focus filters, and interactive widgets (Button(intent:))",
      "Replaced SiriKit's .intentdefinition + generated INIntent + separate extension + predefined domains",
    ],
    explanation:
      "A strong answer defines the intent and perform(), explains parameters and entities/queries, nails the app-shortcut phrase as zero-setup Siri, lists the surfaces, and contrasts against SiriKit.",
  },
];

export default quiz;
