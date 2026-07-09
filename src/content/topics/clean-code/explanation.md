## The problem: code that only makes sense to the person who wrote it

Here's a real function, lightly disguised:

```swift
func proc(_ d: [Int], _ f: Bool) -> Int {
    var t = 0
    for x in d { if f { t += x * 2 } else { t += x } }
    return t
}
```

It compiles, it passes its tests, and six months from now nobody — including the original author — will know what `f` means without reading the whole body. Every name in it (`proc`, `d`, `f`, `t`, `x`) forces the reader to reverse-engineer intent from behavior instead of just reading it off the page.

**Clean code** is the collection of small habits that keep this from happening: code whose intent is visible from its shape, not just recoverable by tracing execution. None of the habits in this lesson are clever. That's the point — cleverness is usually what makes code hard to read later.

## Naming: say what, not how

Rename everything in the function above based on what it actually represents:

```swift
func total(of prices: [Int], doublePriority: Bool) -> Int {
    var sum = 0
    for price in prices {
        sum += doublePriority ? price * 2 : price
    }
    return sum
}
```

Same logic, same behavior — but now the signature alone tells you what the function computes and what its flag controls. `doublePriority` isn't a great name either (why would priority double a price?), which is itself useful: bad names often surface a design problem, not just a labeling problem. Once you try to name it honestly, you notice this function is doing two unrelated things wrapped in one boolean.

A few concrete naming rules pay for themselves constantly in Swift:

```swift
var flag: Bool                    // bad: what does true mean?
var isEmailVerified: Bool         // good: reads as a statement at the call site

func data() -> [Item]             // bad: data about what?
func fetchFavoriteItems() -> [Item]  // good: verb + subject

let d: Double                     // bad: single letter, no unit
let heightInMeters: Double        // good: what it is AND its unit
```

A name should let a reader answer "what is this, and what does it do" without opening the implementation. If you need a comment next to a variable to explain its name, the name lost.

## Small functions: one level of abstraction per function

`proc` also breaks a second rule: it mixes *what* the computation means with *how* it's carried out, all in one block. Split it so each function stays at one level of abstraction:

```swift
func doubledIfPriority(_ price: Int, isPriority: Bool) -> Int {
    isPriority ? price * 2 : price
}

func total(of prices: [Int], priorityFlags: [Bool]) -> Int {
    zip(prices, priorityFlags)
        .map(doubledIfPriority)
        .reduce(0, +)
}
```

`total(of:priorityFlags:)` now reads like a sentence: take the prices, double the priority ones, add them up. The per-item rule for what counts as "doubled" lives in its own small function with its own name, so a reader who trusts the name doesn't need to open the body to follow the outer function.

The test for "small enough" isn't a line count — it's whether the function does one thing you could describe without the word "and." `total(of:priorityFlags:)` computes a total. `doubledIfPriority` decides one price's doubled value. Neither does two things.

## Comments: say why, not what

Comments have a bad reputation in clean code circles, and it's earned — most comments restate code that was already clear:

```swift
// increment count by 1
count += 1
```

This comment adds nothing; delete it. Comments justify their existence when they explain something the code *can't* say for itself — a **why**, not a **what**:

```swift
// Apple's payment sandbox occasionally returns a stale receipt on
// the first call after login; retrying once resolves it in practice.
if attempt == 0, receipt.isStale { return try await verify(attempt: 1) }
```

No amount of good naming would let the code alone communicate "this is a known sandbox quirk, not a real bug." That context only exists in someone's head until a comment puts it on the page.

The stronger fix, when it's available, is to make the comment unnecessary by naming the thing it was explaining:

```swift
// bad: comment carrying meaning the code should carry
// check if user can edit (must be owner and post not locked)
if user.id == post.ownerID && !post.isLocked { editPost() }

// good: the name carries the meaning, no comment needed
if post.canBeEdited(by: user) { editPost() }
```

Reach for a comment only after asking whether a better name or a small extracted function would have made it unnecessary.

## Guard clauses: handle the exception, then get out of the way

Compare two versions of the same validation:

```swift
func register(_ user: User) -> Result<Void, RegistrationError> {
    if user.email.contains("@") {
        if user.age >= 13 {
            if !user.password.isEmpty {
                // the actual registration logic, three levels deep
                return .success(())
            } else {
                return .failure(.missingPassword)
            }
        } else {
            return .failure(.tooYoung)
        }
    } else {
        return .failure(.invalidEmail)
    }
}
```

The real work — the success path — is buried three `if`s deep, wrapped in the exact conditions that make it *not* run. Rewrite it with **guard clauses**: check each failure condition up front and exit immediately, so nothing is nested.

```swift
func register(_ user: User) -> Result<Void, RegistrationError> {
    guard user.email.contains("@") else { return .failure(.invalidEmail) }
    guard user.age >= 13 else { return .failure(.tooYoung) }
    guard !user.password.isEmpty else { return .failure(.missingPassword) }

    // the actual registration logic, at the top level, unindented
    return .success(())
}
```

Predict: which version is easier to extend with a fourth validation rule — say, rejecting already-registered emails?

Answer: the guard version. Add one more `guard ... else { return ... }` line at the top; the success path doesn't move or re-indent. In the nested version, adding a rule means threading a new `if`/`else` into the middle of an already-deep pyramid.

This pattern — validate and exit early, then write the common case unindented — is sometimes called **early return**, and it's why Swift's `guard` exists as its own keyword rather than making you write `if !condition { return }` by hand.

## Command/query separation: don't make one call do two jobs

A **query** asks a question and returns an answer without changing anything. A **command** changes something and doesn't hand back an answer to inspect. **Command/query separation** says: don't build a method that tries to be both.

Here's a violation — a method that mutates state *and* returns a meaningful value:

```swift
final class Stack<Element> {
    private var items: [Element] = []

    func pop() -> Element? {
        guard let last = items.popLast() else { return nil }
        print("popped \(last)")   // side effect
        return last               // AND a return value
    }
}
```

`pop()` isn't actually the problem by itself — plenty of good APIs pop and return in one call. The trouble shows up once a method's return value gets used to *decide* whether a mutation should have happened, which forces awkward code at the call site:

```swift
if let popped = stack.pop() {
    // did this line both check AND mutate? re-reading the call, you can't tell
    // without knowing pop()'s implementation
}
```

Separating the two makes both operations obvious on their own:

```swift
extension Stack {
    var top: Element? { items.last }        // query: look, don't touch
    func removeTop() {                      // command: change, return nothing
        guard !items.isEmpty else { return }
        items.removeLast()
    }
}
```

Now `stack.top` is safe to call anywhere, any number of times, with zero risk of side effects — you can sprinkle it through debugging code without fear. `stack.removeTop()` is unambiguous about doing something. Neither call requires you to remember whether it's safe to call twice.

This isn't an absolute rule — `Array`'s own `removeLast()` returns the removed element, and that's a defensible, well-known exception. The principle is a *default*: prefer splitting query and command apart, and only combine them when the combination is genuinely idiomatic and well understood, like `removeLast()` is.

## Readability as the actual goal

Every habit in this lesson — names, function size, comments, guard clauses, command/query separation — serves one goal: a reader who has never seen this code before should be able to follow it without running it in their head. That reader is very often you, eight months later, with no memory of why any of it works.

A quick self-test for a function you've just written: read only its name and signature, and try to guess what it does. Then read the body. If the guess was wrong, the name lied — fix the name or the body, whichever one is actually true. This one check catches a surprising fraction of clean-code violations at once, because a mismatched name is usually a symptom of a function doing more (or less, or something different) than it claims to.

## Common pitfalls

- **Naming things for what they are today, not what they mean.** `flag`, `data`, `temp`, `d` all describe a variable's type or role in the language, not its meaning in the domain.
- **Comments that restate the next line.** If deleting the comment loses no information, delete it.
- **Deep nesting instead of guard clauses.** Each extra level of `if`/`else` is one more thing the reader has to hold in their head to reach the actual logic.
- **A getter that also mutates.** If calling something twice produces a different result, or skips a call changes behavior, it's secretly a command wearing a query's name.

## Interview lens

If asked "what makes code clean," resist listing style preferences (tabs, brace placement) — those aren't what interviewers mean. Lead with intent: a name, function, or comment is clean when it tells the reader *what* and *why* without forcing them to trace execution to find out.

On naming, the strong answer is specific: booleans read as statements (`isValid`, not `flag`), functions start with a verb, and a name that needs an adjacent comment to explain itself has already failed.

On guard clauses, be ready to explain *why* early return beats nested `if`/`else`, not just that it does: the success path stays at a constant indentation level, so adding a new validation rule is a one-line insertion instead of restructuring a pyramid.

On command/query separation, the trap answer is "never combine a mutation and a return value" — Swift's own standard library breaks that rule (`removeLast()`, `popLast()`). The precise answer: prefer separating them by default, and treat combining them as an intentional, well-documented exception, not something to reach for by habit.
