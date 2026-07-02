## The problem: consistent state management at scale

Ad-hoc MVVM works until an app has dozens of interacting screens, shared state, side effects everywhere, and flaky tests. **The Composable Architecture (TCA)** — from Point-Free — is an opinionated library that imposes a single, **unidirectional** pattern for the whole app: all state in one place, all changes through pure reducers, all side effects modeled explicitly, and everything **composable** and **exhaustively testable**. It's Redux, adapted idiomatically to Swift/SwiftUI.

## State, Action, Reducer, Store

Four core pieces:

- **State** — a value type holding everything a feature needs to render.
- **Action** — an enum of every event that can happen (user taps, responses arriving).
- **Reducer** — a **pure function** `(inout State, Action) -> Effect` that mutates state for an action and returns any side effects to run.
- **Store** — the runtime object that holds the state, receives actions, runs the reducer, and drives the SwiftUI view.

```swift
@Reducer
struct Counter {
    @ObservableState
    struct State { var count = 0 }

    enum Action { case increment, decrement }

    var body: some Reducer<State, Action> {
        Reduce { state, action in
            switch action {
            case .increment: state.count += 1; return .none
            case .decrement: state.count -= 1; return .none
            }
        }
    }
}
```

The view sends actions to the store (`store.send(.increment)`) and renders `store.count`. State only ever changes **inside the reducer** — that's the unidirectional guarantee.

## Effects & dependencies

Reducers must stay **pure** (no networking, no clocks, no randomness inline), so side effects are returned as **`Effect`** values the store runs, feeding results back in as new actions:

```swift
case .loadTapped:
    return .run { send in
        let user = try await apiClient.fetchUser()
        await send(.userResponse(user))
    }
```

External systems (API clients, date, UUID, database) are injected through TCA's **`@Dependency`** system, so in tests you substitute controlled versions. This is what makes the whole app deterministic.

## Composition & scoping

The "Composable" part: large features are **built from smaller reducers**. A parent's State embeds children's State, its Action wraps children's Actions, and `Scope`/`ifLet`/`forEach` operators glue child reducers into the parent — so you compose an app from independently-developed, independently-tested feature modules.

```swift
Scope(state: \.tab1, action: \.tab1) { Tab1() }
Scope(state: \.tab2, action: \.tab2) { Tab2() }
```

## Testing

TCA's headline strength is **exhaustive testing** via `TestStore`. You send an action and must assert **exactly** how state changed; unaccounted changes or un-received effect actions **fail the test**.

```swift
let store = TestStore(initialState: Counter.State()) { Counter() }
await store.send(.increment) { $0.count = 1 }   // must describe every mutation
```

Because dependencies are injected and reducers are pure, tests are fully deterministic — no mocking frameworks, no flakiness. This rigor is a big reason teams adopt TCA.

## Trade-offs

**Pros:** one consistent pattern app-wide; pure, predictable state changes; explicit, testable side effects; powerful composition; excellent tooling and debugging (time-travel, exhaustive tests).

**Cons:** it's a **third-party dependency** you're coupling your architecture to; a **steep learning curve**; **boilerplate** for small features; you buy into its idioms wholesale; and historically some **compile-time/performance** overhead on large reducers. Great for large, stateful, team apps; heavy for a simple one.

## The interview lens

Describe the loop: **State** (single source of truth) → **Action** (enum of events) → **Reducer** (pure `(inout State, Action) -> Effect`) → **Store** (runs it, drives the view); side effects are returned as **Effects** and their results come back as actions, with external systems injected via **dependencies**. Emphasize it's **unidirectional** — state only mutates inside the reducer — which is what makes it predictable and debuggable.

The senior notes: **composition** (build big features from small reducers via `Scope`/`ifLet`/`forEach`) and **exhaustive testing** (`TestStore` forces you to assert every state change, and injected dependencies make it deterministic) are TCA's signature strengths. Give the honest trade-off: consistency + testability vs. a **third-party dependency, learning curve, and boilerplate** — justified at scale, overkill for small apps. It's essentially **Redux/unidirectional data flow** productized for Swift.
