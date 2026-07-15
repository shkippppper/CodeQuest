## The problem: your app's actions are trapped inside your app

Say your app logs how much water someone drinks. The button lives on a screen:

```swift
Button("Log a glass") { store.logWater(amount: 250) }
```

That works — as long as the user opens your app, finds the screen, and taps. But the user wants to say "Hey Siri, log my water" while their hands are wet. Or drag a "Log water" step into a morning-routine automation. Or tap a Home-Screen widget without launching anything.

Every one of those places lives *outside* your app. The system runs them, not you. So the system needs a description of the action it can hold onto and run on its own — a little packaged unit that says "here is a thing this app can do, here is what it needs, here is how to do it."

**App Intents** is the framework that lets you write those packaged actions in plain Swift. This lesson is about the four pieces: the intent itself, its parameters, the app's nouns, and the ready-made shortcuts you hand to Siri.

## An intent is one system-runnable action

Start with the smallest possible intent:

```swift
struct LogWaterIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Water"

    func perform() async throws -> some IntentResult {
        WaterStore.shared.logWater(amount: 250)
        return .result()
    }
}
```

An **intent** is a single action the system can invoke — one struct conforming to `AppIntent`. Read the two required pieces:

- `static var title` is the human-readable name. It's what shows up in the Shortcuts app's action list and in Siri's confirmation.
- `perform()` is the work. The system calls it when the action fires — from Siri, from a widget, from anywhere. It's `async` and can `throw`, and it returns an `IntentResult`.

`return .result()` means "done, nothing to hand back." That's the whole action. You didn't write any Siri code, any Spotlight code, any widget code — you described *what the action does* once, and the system can now run it from all of those places.

## perform() can return a value, not just finish

An action often has an answer worth showing. Give `perform()` a result that carries a value and a spoken reply:

```swift
func perform() async throws -> some IntentResult & ReturnsValue<Int> {
    let total = WaterStore.shared.logWater(amount: 250)
    return .result(
        value: total,
        dialog: "Logged. You're at \(total) millilitres today."
    )
}
```

The `value:` is data the system can pass into the *next* step of a Shortcuts automation. The `dialog:` is what Siri speaks back. So one intent can be both a link in an automation chain and a voice interaction, from the same code.

## Parameters: inputs the system prompts for

A fixed 250 ml is rigid. Let the user choose the amount:

```swift
struct LogWaterIntent: AppIntent {
    static var title: LocalizedStringResource = "Log Water"

    @Parameter(title: "Amount (ml)")
    var amount: Int

    func perform() async throws -> some IntentResult {
        WaterStore.shared.logWater(amount: amount)
        return .result()
    }
}
```

A `@Parameter` property is an **input the system supplies** before it calls `perform()`. When the user adds this action in Shortcuts, `amount` becomes an editable field. When they trigger it by voice without saying a number, the system *prompts* them for it — "How much?" — using the `title` you gave. This automatic asking-for-missing-inputs is called **parameter resolution**, and you get it for free just by declaring the property.

You can shape how the action reads in the Shortcuts editor with a **parameter summary** — a one-line sentence template with the parameter slotted in:

```swift
static var parameterSummary: some ParameterSummary {
    Summary("Log \(\.$amount) ml of water")
}
```

Now the action reads "Log [250] ml of water" as a natural sentence in the editor, with `amount` as a tappable blank, instead of a bare title with a separate field below.

## App Entities: modelling your app's nouns

Amounts are simple values. But what if the action needs to pick *one of your app's things* — "add a task to **which** project?" A raw string won't do; you want the system to show a real list of the user's projects and let them search it.

An **app entity** is your app's noun made visible to the system:

```swift
struct ProjectEntity: AppEntity {
    let id: UUID
    let name: String

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Project"

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)")
    }

    static var defaultQuery = ProjectQuery()
}
```

`id` gives each project a stable identity. `displayRepresentation` is how one project shows up in a picker — the row's title. `typeDisplayRepresentation` names the *kind* ("Project") in the system UI.

The `defaultQuery` is the other half. An **entity query** teaches the system how to fetch your entities — how to look one up by id, and how to list or search them:

```swift
struct ProjectQuery: EntityQuery {
    func entities(for ids: [UUID]) async throws -> [ProjectEntity] {
        ProjectStore.shared.projects(withIDs: ids)
    }
    func suggestedEntities() async throws -> [ProjectEntity] {
        ProjectStore.shared.recentProjects()
    }
}
```

`entities(for:)` turns saved ids back into full projects — needed because Shortcuts stores only the id and asks you to rehydrate it later. `suggestedEntities()` supplies the list the picker shows by default. With those in place, an intent can take a `@Parameter var project: ProjectEntity`, and the system draws a searchable list of the user's real projects to choose from.

## App shortcuts: Siri phrases with zero setup

An intent is runnable, but the user still has to go find it in the Shortcuts app. To get a spoken Siri phrase and a Spotlight entry with *no* action from the user, register an **app shortcut**:

```swift
struct WaterShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: LogWaterIntent(),
            phrases: [
                "Log water in \(.applicationName)",
                "Log a glass with \(.applicationName)"
            ],
            shortTitle: "Log Water",
            systemImageName: "drop.fill"
        )
    }
}
```

An `AppShortcutsProvider` is a type the system reads at install time. Each `AppShortcut` pairs an intent with **spoken phrases**. The `\(.applicationName)` token is required — Siri needs your app's name in the phrase to route it to you, and it automatically accepts the app's name and its localized nicknames.

Now pause and predict: to make "Log water in HydrateApp" work by voice, do you need to train a voice model, or ship a separate Intents extension like the old days?

Answer: neither. **An app shortcut phrase is enough.** You wrote a Swift string; the system handles speech recognition and matching. There's no voice training, no machine-learning bundle, no extra target — the phrase in `appShortcuts` is the entire Siri setup.

## Where intents show up

You wrote the action once. Here's everywhere the same intent can surface, with no per-surface code:

- **Siri** — spoken via an app-shortcut phrase.
- **Spotlight** — app shortcuts appear as searchable results; typing the short title runs the intent.
- **The Shortcuts app** — every intent is an action users can drag into their own automations.
- **Focus filters** — a special intent kind lets the user configure your app per Focus mode (Work vs Personal).
- **Interactive widgets and Control Center** — a widget button can run an intent directly, without launching the app:

```swift
Button(intent: LogWaterIntent()) {
    Label("Log", systemImage: "drop.fill")
}
```

That `Button(intent:)` is the same `LogWaterIntent` from the top of the lesson. Tapping it on the Home Screen runs `perform()` in the background and refreshes the widget — no app launch, no navigation.

## How this replaced the old SiriKit approach

Before 2022, exposing an action to Siri meant **SiriKit**: you defined intents in a special `.intentdefinition` file, the build system code-generated `INIntent` subclasses, and you handled them in a *separate Intents app extension* with its own target and lifecycle — plus you were mostly limited to Apple's predefined domains like messaging or payments. App Intents (introduced 2022) replaced all of that with plain Swift structs conforming to `AppIntent`: no `.intentdefinition` file, no code generation, and for most apps no separate extension at all — the intents live right in your app target. It's less machinery and it covers arbitrary custom actions, which is why new code uses App Intents and SiriKit is legacy.

## Common pitfalls

- **Forgetting `\(.applicationName)` in a phrase.** Siri can't route a phrase to your app without the app-name token, so the shortcut silently won't trigger.
- **A `@Parameter` with no way to resolve an entity.** If the parameter is an `AppEntity`, you must provide an `EntityQuery` (usually as its `defaultQuery`), or the system can't fetch or list it.
- **Doing heavy work off the main actor incorrectly.** `perform()` is `async`; touch your UI-bound state on the main actor, and don't assume the app is even launched — a widget-run intent may execute with no UI alive.
- **Expecting SiriKit and App Intents to be the same thing.** They're different frameworks; new work should use App Intents unless you're maintaining an old SiriKit domain intent.

## Interview lens

If asked "how do you expose an app action to Siri or Shortcuts today?", lead with App Intents: a struct conforming to `AppIntent` with a `title` and an `async perform()`. Say the key idea in one line — you describe the action *once* in Swift and the system surfaces it across Siri, Spotlight, Shortcuts, Focus filters, and interactive widgets.

Expect a follow-up on inputs. Explain that `@Parameter` properties are inputs the system resolves and prompts for, and that `AppEntity` + `EntityQuery` model your app's nouns so an intent can take "which one?" with a real searchable list.

If they ask about Siri specifically, make the sharp point: an `AppShortcut` with a phrase containing `\(.applicationName)` gives you voice support with no voice training and no separate extension. That's the line that shows you know App Intents replaced the older SiriKit `INIntent` / `.intentdefinition` / Intents-extension setup — name that contrast if they probe on "how is this different from before?"
