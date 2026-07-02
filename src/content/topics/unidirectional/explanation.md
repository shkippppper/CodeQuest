## The problem: state that changes from everywhere

In two-way-bound or delegate-heavy apps, state can be mutated from many places — a view, a callback, a notification, another view model — and reproducing a bug means guessing which path fired. **Unidirectional Data Flow (UDF)**, popularized by **Redux** in the web world, imposes one rule: state changes flow in a **single direction** through well-defined stages, so there's exactly one way anything can change. TCA (previous topic) is one Swift implementation; here we cover the general pattern.

## The one-way cycle

Data moves in a loop, always the same way:

```
State  →  View  →  Action  →  Reducer  →  new State  →  View  →  ...
```

1. The **View** renders from the current **State**.
2. User interaction dispatches an **Action** (a description of *what happened*).
3. A **Reducer** computes the **new State** from the old state + action.
4. The View re-renders from the new state.

The view never mutates state directly — it can only **dispatch actions**. That single constraint is what makes the whole system predictable.

## Single source of truth

All app state lives in **one store** (or a well-defined tree of state), not scattered across view models and controllers. Every screen derives what it shows from that one source, so two views can never disagree, and there's one place to inspect, persist, or restore the entire app state.

## Actions & reducers

- An **Action** is a value describing an event: `.buttonTapped`, `.dataLoaded(items)`. It carries *what* happened, never *how* to change state.
- A **Reducer** is a **pure function** `(State, Action) -> State` (Swift often uses `(inout State, Action)`). Given the same state and action, it always produces the same result — no I/O, no randomness, no clocks.

```swift
enum Action { case increment, setName(String) }

func reducer(state: inout AppState, action: Action) {
    switch action {
    case .increment:        state.count += 1
    case .setName(let n):   state.name = n
    }
}
```

Purity is the key: because reducers are deterministic, you can replay actions, snapshot state, and test trivially.

## Side effects & middleware

Reducers are pure, so **side effects** (network, disk, timers) can't live inside them. They're handled *outside* the reducer:

- **Middleware** (classic Redux) sits between dispatch and the reducer, intercepting actions to run async work and dispatching **result actions** back into the loop.
- Swift implementations often use an **Effect** return value (as in TCA) instead of middleware, but the principle is identical: the effect runs outside the pure reducer and its outcome re-enters as a new action.

```
Action → [Middleware runs async work] → dispatches resultAction → Reducer → State
```

Either way, the async result comes back through the *same* one-way cycle — nothing bypasses it.

## Predictability & debugging

The payoff of one-way flow:

- **Reproducibility** — the state at any moment is a pure function of the initial state plus the ordered list of actions. Record the actions, replay them, get the same state.
- **Time-travel debugging** — step backward/forward through actions.
- **Testability** — pure reducers need no mocks; feed state+action, assert new state.
- **One place to look** — a bug is either in a reducer (state math) or an effect (async), never "somewhere in the two-way binding graph."

The cost is **boilerplate** (actions/reducers for everything) and a mindset shift; it can feel heavy for small, simple screens.

## Comparison to MVVM

| | Unidirectional (Redux/UDF) | MVVM |
|---|---|---|
| State location | Single source of truth (store) | Per-screen view models |
| Mutation | Only via actions → reducer | View model methods mutate directly |
| Data flow | Strictly one-way | Two-way binding common |
| Side effects | Outside reducer (middleware/effects) | Inside/around the view model |
| Predictability | Very high (replayable) | Depends on discipline |
| Boilerplate | Higher | Lower |

MVVM is lighter and fine for most screens; UDF wins when app-wide, shared, complex state needs to be predictable and debuggable. They can coexist (UDF for a complex feature, MVVM elsewhere).

## The interview lens

State the cycle: **State → View → Action → Reducer → new State**, with the view **only dispatching actions**, a **single source of truth** for state, and **pure reducers** `(State, Action) -> State`. Because reducers are pure, **side effects live outside** them — in **middleware** (Redux) or as **Effect** values (TCA) — with results re-entering as new actions.

The senior framing is *why*: one-way flow makes state a **replayable function of actions**, enabling time-travel debugging, easy testing, and a single place to reason about changes — at the cost of boilerplate. Contrast with MVVM (per-screen state, two-way binding, lighter but less globally predictable), and note **TCA/Redux are concrete implementations** of this pattern.
