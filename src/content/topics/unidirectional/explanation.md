## The problem: state that changes from everywhere

A bug report comes in: some value on screen is wrong, but only sometimes. You start hunting for where it could have been set — a view's two-way binding, a delegate callback, a notification handler, a different view model reaching in. In a codebase where state can be mutated from anywhere, "where did this change come from" is often the hardest question to answer.

**Unidirectional Data Flow**, popularized on the web by **Redux**, removes the guesswork with one rule: state changes are only ever allowed to flow in a single direction, through a fixed set of stages. There's exactly one path a change can take, so there's exactly one place to look. TCA, covered in the previous lesson, is one Swift implementation of this idea — this lesson is about the general pattern underneath it.

## The one-way cycle

Here's the shape, before any code:

```
State  →  View  →  Action  →  Reducer  →  new State  →  View  →  ...
```

Four stages, always in this order. The **View** renders from the current **State**. A user interaction dispatches an **Action** — a value describing what happened, not what should change. A **Reducer** computes the next **State** from the old state plus that action. The View re-renders from the new state, and the cycle repeats.

The one rule that makes this work: the view can only dispatch actions. It is never allowed to reach in and set state directly. Every single change, no matter how small, has to travel through that same four-stage loop.

## Single source of truth

Predict: if every screen pulls what it displays from one shared store instead of its own local copy, what bug class becomes impossible?

Answer: two views showing contradictory information. If `ScreenA` and `ScreenB` both render from the same store, they can never disagree — there's only one value to disagree about.

This is what "**single source of truth**" means in practice: all app state — or a well-defined tree of it — lives in one place, not scattered across independent view models. That one place is also the only place you ever need to look to inspect, log, persist, or restore the entire app's state.

## Actions & reducers

An action is deliberately dumb. It's just a value:

```swift
enum Action { case increment, setName(String) }
```

`.increment` says *what happened* — a button was tapped — and nothing about *how* to respond to it. That decision belongs entirely to the reducer:

```swift
func reducer(state: inout AppState, action: Action) {
    switch action {
    case .increment:        state.count += 1
    case .setName(let n):   state.name = n
    }
}
```

Notice the shape: `(State, Action) -> State` (Swift usually writes it as `inout State` to avoid returning a whole new struct). Feed it the same state and the same action twice, and it produces the exact same result both times — no network call, no random number, no reading the clock. That property is called **purity**, and it's what turns state changes from "something that happened" into "something you can predict, replay, and test."

## Side effects & middleware

A pure reducer can't make a network call — so where does an async response go once it comes back? It can't just mutate state from outside the loop; that would break the one rule.

The answer is to route it back through the *same* cycle, via a stage that sits outside the reducer. In classic Redux this stage is called **middleware**: code that intercepts an action before it reaches the reducer, kicks off async work, and — when that work finishes — dispatches a *new* action carrying the result.

```
Action → [Middleware runs async work] → dispatches resultAction → Reducer → State
```

Swift implementations, TCA included, more often use an **Effect** value returned from the reducer itself instead of a separate middleware layer — but the principle underneath is identical. The async work runs outside the pure function, and its result re-enters the loop as an ordinary action, just like a button tap would. Nothing — not even a network response — is allowed to bypass the cycle.

## Predictability & debugging

Because every change is an action, and reducers are pure, the current state is nothing more than the *starting* state plus the ordered list of every action that has happened since. That single fact unlocks a handful of things that are otherwise hard to get:

- **Reproducibility.** Record the sequence of actions from a bug report, replay them against the same starting state, and you get the identical bug — every time.
- **Time-travel debugging.** Since state is just "actions applied so far," you can step backward and forward through them like frames in a video.
- **Trivial testing.** A reducer needs no mocks, no setup, no teardown — just call it with a state and an action, and assert what comes out.
- **One place to look.** Any bug is either bad math in a reducer, or a bad result from an effect. It is never "somewhere in a web of two-way bindings."

None of this is free. Every change — even a text field keystroke — needs an action and a reducer case, which is real boilerplate, and it's a mindset shift for anyone used to just setting a property. For a small, simple screen, that overhead can outweigh the benefit.

## Comparison to MVVM

| | Unidirectional (Redux/UDF) | MVVM |
|---|---|---|
| State location | Single store, shared | Per-screen view models |
| Mutation | Only via action → reducer | View model methods mutate directly |
| Data flow | Strictly one-way | Two-way binding common |
| Side effects | Outside the reducer (middleware/effects) | Inside or around the view model |
| Predictability | High — state is replayable | Depends on the team's discipline |
| Boilerplate | Higher | Lower |

MVVM is lighter, and it's the right default for most screens. Unidirectional flow earns its cost when state is shared across many screens, complex, and needs to be predictable enough to debug from a bug report alone. The two aren't mutually exclusive — a complex, shared feature can use UDF while the rest of the app stays plain MVVM.

## Common pitfalls

- **Letting a view mutate state directly "just this once."** Even one exception breaks the single-path guarantee the whole pattern is built on.
- **Putting async work inside the reducer.** A reducer that awaits a network call is no longer pure, and every benefit in the previous section quietly stops being true.
- **Treating every screen as needing this.** UDF's ceremony is worth it for shared, complex state — not for a form with three text fields.

## Interview lens

State the cycle out loud, in order: **State → View → Action → Reducer → new State**, with the view only ever allowed to dispatch actions, never mutate state directly. Name the two properties doing all the work: a **single source of truth** for state, and a **pure** reducer function, `(State, Action) -> State`.

Explain why purity forces side effects outside the reducer — into **middleware** in classic Redux, or **Effect** values in something like TCA — with results re-entering the loop as ordinary actions, same as any user interaction.

For the senior framing, explain the *payoff*, not just the mechanics: because state is a pure function of the initial state plus the action history, you get replayable bugs, time-travel debugging, and reducers that test without mocks — at the cost of more boilerplate than a typical MVVM screen. Be ready to contrast the two directly, and mention that TCA and Redux are concrete, productized implementations of this same underlying pattern, not the pattern itself.
