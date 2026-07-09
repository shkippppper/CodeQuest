## The problem: consistent state management at scale

Picture a feature built the ordinary way: a view model holds `@Published` state, calls into a network client directly, and mutates itself from three different async closures. It works — until the app has dozens of these, all wired up slightly differently, and a bug report comes in that only reproduces "sometimes."

**The Composable Architecture**, or **TCA**, is a library from Point-Free that removes the "slightly differently" part. It forces every feature in the app through the exact same shape: one place for state, one path for changes, side effects declared instead of just called, and everything built to compose and to be tested exhaustively. If you've heard of Redux from the web world, TCA is that same idea, adapted idiomatically for Swift and SwiftUI.

## State, Action, Reducer, Store

Start with the smallest possible feature — a counter:

```swift
@ObservableState
struct State { var count = 0 }
```

`State` is a plain value type holding everything this one feature needs in order to render. Nothing more.

Now the events that can happen to it:

```swift
enum Action { case increment, decrement }
```

An `Action` is not a function call — it's just a value describing *what happened*: the user tapped a button. It carries no logic.

Something has to turn an action into a state change. That's the **reducer** — a function that takes the current state and an action, and produces the next state:

```swift
var body: some Reducer<State, Action> {
    Reduce { state, action in
        switch action {
        case .increment: state.count += 1; return .none
        case .decrement: state.count -= 1; return .none
        }
    }
}
```

A reducer is deliberately boring: no networking, no randomness, no reaching outside itself. Given the same state and the same action, it always produces the same result.

Put the three pieces together inside a `@Reducer` type, and TCA gives you the fourth piece — the **Store**, the runtime object that actually holds the live state, receives actions, and runs the reducer:

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

The view never touches `state.count` directly. It sends actions — `store.send(.increment)` — and reads `store.count` to render. State only ever changes in exactly one place: inside the reducer. That's the whole unidirectional guarantee, in four pieces.

## Effects & dependencies

A reducer has to stay pure, which is a problem the moment a feature needs to hit the network. Where does that code go?

```swift
case .loadTapped:
    return .run { send in
        let user = try await apiClient.fetchUser()
        await send(.userResponse(user))
    }
```

`.run` returns an **`Effect`** — a value describing work to run *outside* the reducer. The store executes it, and when the async work finishes, its result comes back in as an ordinary new action (`.userResponse`), flowing through the same reducer like any other action. The reducer itself never touched the network; it just described what should happen.

What does `apiClient` refer to inside that closure? Not a real network client — a **dependency**, pulled from TCA's `@Dependency` property wrapper:

```swift
@Dependency(\.apiClient) var apiClient
```

In production this resolves to the real network client. In a test, you swap in a controlled fake that returns a fixed value instantly. Because every external system — network, clock, UUID generation, database — goes through this same injection point, a whole feature becomes deterministic to test, with nothing left to accident or timing.

## Composition & scoping

The word "Composable" in the name is a promise: a large feature is built out of small ones, not written as one giant reducer.

A parent feature embeds a child's state as a property, and wraps the child's actions as a case:

```swift
struct State { var tab1 = Tab1.State(); var tab2 = Tab2.State() }
enum Action { case tab1(Tab1.Action); case tab2(Tab2.Action) }
```

To actually wire the child reducer's logic into the parent, use `Scope`:

```swift
var body: some Reducer<State, Action> {
    Scope(state: \.tab1, action: \.tab1) { Tab1() }
    Scope(state: \.tab2, action: \.tab2) { Tab2() }
}
```

Each `Scope` line says: "run `Tab1`'s reducer, but only against the `tab1` slice of state and the `tab1` case of action." The parent never has to know *how* a child works internally — only where it plugs in. This is what lets separate engineers build and test `Tab1` and `Tab2` in complete isolation, then snap them together.

## Testing

Predict: if a reducer is a pure function of `(state, action) -> new state`, what does testing it actually require?

Answer: no mocks, no UI, no async waiting for real work — just call it with an input and check the output. TCA builds a tool around exactly that idea, called `TestStore`:

```swift
let store = TestStore(initialState: Counter.State()) { Counter() }
await store.send(.increment) { $0.count = 1 }
```

That second line isn't optional narration — it's an assertion. `TestStore` requires you to describe *exactly* how state changed after every action. Leave out a mutation that actually happened, or forget to assert an effect's resulting action ever arrived, and the test fails. There's no way to accidentally under-test a reducer.

This exhaustiveness is only possible because of the first two sections: reducers are pure, and every external dependency is injectable. Nothing in a TCA test is ever flaky because nothing in it is ever real I/O.

## Trade-offs

**What you get:** one consistent shape for every feature in the app, state changes that are pure and predictable, side effects that are explicit and testable instead of buried in closures, real composition of small features into big ones, and tooling — time-travel debugging, exhaustive tests — that comes for free once you're inside the pattern.

**What it costs:** TCA is a third-party dependency your entire architecture now depends on. It has a genuinely steep learning curve. Small, simple screens end up with more boilerplate — a `State`, an `Action`, and a `Reducer` for something that might have been three lines of `@State`. And large reducer graphs have historically carried real compile-time and runtime overhead, though the library keeps improving this.

The rule of thumb: TCA earns its cost on a large, stateful, multi-team app where consistency and testability matter more than raw simplicity. On a small app, it's usually more machinery than the problem needs.

## Interview lens

Walk the loop out loud: **State** is the single source of truth for a feature, an **Action** is an enum describing every event that can happen, a **Reducer** is a pure `(inout State, Action) -> Effect` function that's the *only* place state changes, and the **Store** is the runtime object that ties them together and drives the view. Say explicitly that this makes the system unidirectional — nothing outside the reducer is allowed to touch state.

Then bring up the two things that make TCA more than "just Redux": **composition**, where a big feature's reducer is assembled from small, independently-testable child reducers via `Scope`; and **exhaustive testing**, where `TestStore` forces you to name every state change an action caused, with dependency injection making the whole thing deterministic.

If asked for the honest trade-off, give it: you're buying predictability and testability at the price of a third-party dependency, a learning curve, and boilerplate on small features — worth it at scale, overkill for a five-screen app. Framing TCA as "Redux's unidirectional data flow, productized for Swift" is the one-sentence summary that shows you understand where it sits in the bigger picture.
