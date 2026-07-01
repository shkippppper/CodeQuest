## The problem: branching without bugs

Every language has `if` and loops. Swift's twist is that its control flow is built to make the *dangerous* paths visible: switches must be exhaustive, `guard` forces you to handle failure early, and `switch` is really a full **pattern-matching** engine, not just a chain of equality checks. Used well, the compiler catches the branch you forgot.

## `if`, `guard`, and `switch`

`if` branches on a `Bool`. Its condition must be a genuine boolean — there's no "truthy" `0`/`nil`/`""`.

```swift
if score >= 60 {
    print("pass")
} else {
    print("fail")
}
```

`guard` handles the failure case and **must exit** the current scope (`return`, `throw`, `break`, `continue`). It keeps the happy path un-indented and any unwrapped values in scope afterwards.

```swift
func process(_ input: String?) {
    guard let input, !input.isEmpty else { return }
    // input is a non-empty String for the rest of the function
    print(input)
}
```

`switch` compares a value against a series of patterns and runs the first that matches. In Swift it does far more than a C `switch` (see below).

## Exhaustive switches

A `switch` must cover **every possible value** — the compiler rejects an incomplete one. Cover all cases and you don't need a `default`.

```swift
enum Direction { case north, south, east, west }

func describe(_ d: Direction) -> String {
    switch d {
    case .north: return "up"
    case .south: return "down"
    case .east:  return "right"
    case .west:  return "left"
    }   // no default needed — all cases handled
}
```

The payoff: add a `case` to `Direction` later and every non-exhaustive switch becomes a **compile error** pointing at code to update. There's also **no implicit fall-through** — each case ends on its own; use `fallthrough` explicitly if you truly want it.

## `where` clauses

A `where` clause adds a condition to a pattern — the case matches only if the pattern *and* the condition hold.

```swift
switch point {
case let (x, y) where x == y:
    print("on the diagonal")
case let (x, y) where x == -y:
    print("on the anti-diagonal")
default:
    print("somewhere else")
}
```

`where` also filters `for` loops: `for n in numbers where n.isMultiple(of: 2)` iterates only the evens.

## Pattern matching with tuples & enums

`switch` matches structure, not just equality. You can match tuples, ranges, and enum cases with associated values, binding pieces as you go.

```swift
let http = (code: 404, method: "GET")

switch http {
case (200, _):            print("ok")
case (400..<500, let m):  print("client error via \(m)")
case (let code, _):       print("other: \(code)")
}
```

- `_` is a wildcard that matches anything.
- `400..<500` matches a **range**.
- `let m` **binds** the matched element for use in the body.

This is why Swift enums with associated values are so expressive — `switch` pulls the payload out as it matches.

## `case let` binding

`let` (or `var`) inside a pattern binds the matched value. You'll see it three ways:

```swift
// in a switch case
case let .success(value): print(value)

// as a lightweight one-case check with `if case`
if case let .failure(error) = result {
    print(error)
}

// filtering a loop with `for case`
for case let .success(v) in results {
    print(v)   // only the .success elements
}
```

`if case`/`for case` are the compact tools when a full `switch` is overkill.

## Loops & control transfer

Swift has `for-in` (over any `Sequence`), `while`, and `repeat-while` (runs the body at least once). Control-transfer statements steer them:

```swift
outer: for row in grid {
    for cell in row {
        if cell == target { break outer }   // labeled break
        if cell == 0 { continue }            // skip to next iteration
    }
}
```

- `break` leaves the loop (or a labeled loop with `break label`).
- `continue` skips to the next iteration.
- **Labels** let you break/continue an outer loop from inside a nested one.

## The interview lens

The staple is *"`if let` vs `guard let`"* (covered in Optionals), but control-flow interviews dig into **`switch`**. Be ready to explain that Swift switches are **exhaustive** (compile error if you miss a case, which is a *feature* — refactoring safety), have **no implicit fall-through**, and are a full **pattern-matching** construct: tuples, ranges, `where` conditions, and `case let` binding of associated values.

A common trap: *"When would you use `if case` instead of `switch`?"* — when you care about exactly one case and a full exhaustive switch would be noise. And knowing that `guard` must transfer control out of scope (unlike `if`) signals you understand *why* it keeps the unwrapped value alive afterward.
