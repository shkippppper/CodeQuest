## The problem: the branch you forgot

Run this in your head:

```swift
let score = 60

if score >= 60 {
    print("pass")
} else {
    print("fail")
}
```

It prints `"pass"`. Nothing surprising — every language has `if`. Swift's twist is what happens on the paths you *didn't* think about. Its control flow is designed so the compiler catches the branch you forgot: a `switch` that misses a case won't compile, and `guard` forces you to deal with failure before the real work starts.

This lesson walks through each tool, then through `switch`'s real superpower: matching the *shape* of a value, not just its equality.

## if: branching on a real Bool

One rule sets Swift's `if` apart. The condition must be an actual `Bool`:

```swift
let count = 0

if count { }        // compile error
if count == 0 { }   // fine
```

There is no "truthy" or "falsy" in Swift. `0` is not false, an empty string is not false, and `nil` is not false — you must write a comparison that produces a genuine `true` or `false`. This kills a whole family of bugs where `if (x = 5)` or `if (someNumber)` compiles but means the wrong thing.

## guard: handle failure first, then forget about it

Here's a function that receives input which might be missing or empty:

```swift
func process(_ input: String?) {
    guard let input, !input.isEmpty else {
        return
    }
    print(input)   // input is a plain, non-empty String here
}
```

Read `guard` as "make sure this is true — otherwise leave." The `else` block runs when the condition *fails*, and here's the rule that makes `guard` special: that `else` block *must exit* the current scope. It has to `return`, `throw`, `break`, `continue`, or call a function that never returns like `fatalError()`.

Try to cheat and the compiler stops you:

```swift
guard let input else {
    print("missing")   // error: 'guard' body must not fall through
}
```

Why insist on exiting? Because of what happens *after* the guard. The `let input` unwrapped an optional — and since the failure path provably left the function, Swift lets the unwrapped `input` stay in scope for everything below. That's the payoff: check once at the top, then write the rest of the function as if the value was never optional.

Compare the same logic with `if`:

```swift
func process(_ input: String?) {
    if let input, !input.isEmpty {
        print(input)       // input only exists inside these braces
        // ...entire function body nests in here...
    }
}
```

With `if`, the happy path lives indented inside braces, and every extra check nests deeper. With `guard`, failures exit early at the top and the happy path runs straight down the left margin. That flat shape is why Swift code leans on `guard` so heavily.

## switch: every case, or it doesn't compile

Start with an enum and a `switch` over it:

```swift
enum Direction { case north, south, east, west }

func describe(_ d: Direction) -> String {
    switch d {
    case .north: return "up"
    case .south: return "down"
    case .east:  return "right"
    case .west:  return "left"
    }
}
```

No `default` case — and that's deliberate. A Swift `switch` must be **exhaustive**: it has to cover every possible value, and the compiler rejects it otherwise. Since all four directions are handled, nothing else can happen, so no `default` is needed.

Now the payoff. Suppose the enum grows next month:

```swift
enum Direction { case north, south, east, west, up, down }
```

Every `switch` over `Direction` that doesn't handle `.up` and `.down` instantly becomes a compile error — the compiler hands you a list of every place that needs updating. If those switches had used `default`, they'd silently swallow the new cases instead. That's why experienced Swift developers avoid `default` when they can list the cases: an exhaustive switch is refactoring insurance.

One more difference from C-family switches. What does this print?

```swift
let n = 1

switch n {
case 1:  print("one")
case 2:  print("two")
default: print("many")
}
```

Answer: just `"one"`. Swift has **no implicit fall-through** — each case ends by itself, no `break` needed, and execution never leaks into the next case by accident. On the rare occasion you genuinely want to continue into the next case, you say so explicitly with the `fallthrough` keyword:

```swift
switch n {
case 1:
    print("one")
    fallthrough        // deliberately continue into the next case
case 2:
    print("one or two territory")
default:
    break
}
```

Note `fallthrough` jumps into the next case's body *without checking its pattern* — it's a raw "keep going", used rarely.

## Matching shapes, not just values

So far `switch` looks like a tidier `if`/`else` chain. Here's where it becomes something more. A `switch` compares its value against **patterns** — descriptions of a value's shape — and runs the first case whose pattern matches.

Start with a tuple:

```swift
let http = (code: 404, method: "GET")

switch http {
case (200, _):
    print("ok")
}
```

The pattern `(200, _)` says: first element equals 200, second element is anything. The underscore `_` is a **wildcard** — a pattern that matches any value and ignores it. Our 404 doesn't match, and this switch isn't exhaustive yet, so let's grow it:

```swift
switch http {
case (200, _):
    print("ok")
case (400..<500, let m):
    print("client error via \(m)")
case (let code, _):
    print("other: \(code)")
}
```

Two new pattern kinds appeared:

- `400..<500` is a range pattern. The case matches when the code falls anywhere in 400–499 — no chain of `||` comparisons.
- `let m` **binds** the matched piece to a name. When the second case matches, `m` holds the method string, ready to use in the body.

Our 404 hits the second case and prints `"client error via GET"`. The last case, `(let code, _)`, matches *any* tuple — binding the first element — which is what makes the whole switch exhaustive without a `default`.

The same machinery pulls data out of enums. Given a result-style enum with attached values:

```swift
enum LoadResult {
    case success(String)
    case failure(Int)
}

let result = LoadResult.failure(500)

switch result {
case .success(let text): print("got: \(text)")
case .failure(let code): print("failed: \(code)")
}
```

The pattern `.failure(let code)` matches the case *and* extracts its payload in one step. This pairing is why enums with associated values are so central to Swift — `switch` is the tool built to take them apart. Enums get their own full lesson.

## where: a condition attached to a pattern

Sometimes a pattern alone isn't enough — you also need a computation on the bound values. A `where` clause bolts a boolean condition onto a pattern; the case matches only if the pattern fits *and* the condition is true:

```swift
let point = (3, 3)

switch point {
case let (x, y) where x == y:
    print("on the diagonal")
case let (x, y) where x == -y:
    print("on the anti-diagonal")
default:
    print("somewhere else")
}
```

The first case binds both coordinates, then checks the extra condition `x == y`. Our point `(3, 3)` passes, so it prints `"on the diagonal"`. Note the shorthand: `case let (x, y)` binds every name in the pattern at once — same as writing `case (let x, let y)`.

One caveat: the compiler can't reason about `where` conditions, so it can't prove these cases cover everything. A switch that relies on `where` clauses usually needs a `default` (or a bare catch-all pattern) to be exhaustive.

`where` also works directly on loops:

```swift
for n in 1...10 where n.isMultiple(of: 2) {
    print(n)   // 2, 4, 6, 8, 10
}
```

The loop still walks all ten numbers, but the body runs only for those passing the filter — a `for` and an `if` fused into one line.

## case let outside of switch

Sometimes you care about exactly one enum case, and a full exhaustive switch is ceremony. Swift gives the pattern-matching syntax two lighter homes.

`if case` checks a single pattern:

```swift
if case let .failure(code) = result {
    print("failed: \(code)")
}
```

Read it as: "if `result` matches the pattern `.failure(let code)`, bind `code` and run the body." No other cases, no exhaustiveness requirement. It's the pattern-matching sibling of `if let`.

`for case` filters a loop by pattern:

```swift
let results: [LoadResult] = [.success("a"), .failure(404), .success("b")]

for case let .success(text) in results {
    print(text)   // prints "a" then "b" — failures are skipped
}
```

Only elements matching the pattern enter the loop body; everything else is silently skipped. The rule of thumb: `switch` when you must handle every case, `if case`/`for case` when exactly one case matters.

## Loops and steering them

Swift has three loops. `for-in` walks anything that can produce a sequence of elements — arrays, ranges, dictionaries, strings:

```swift
for name in ["Ada", "Grace"] { print(name) }
for i in 0..<3 { print(i) }
```

`while` checks its condition before each pass, and `repeat-while` checks *after* — so a `repeat-while` body always runs at least once:

```swift
var tries = 0
repeat {
    tries += 1        // runs first, condition checked after
} while tries < 3
```

Predict: if the condition is false from the very start — say `while false` — how many times does each loop body run?

Answer: `while false { ... }` runs zero times; `repeat { ... } while false` runs exactly once. That "at least once" guarantee is the entire reason `repeat-while` exists.

Inside any loop, two statements steer execution. `continue` abandons the current pass and jumps to the next iteration. `break` abandons the whole loop:

```swift
for n in 1...10 {
    if n.isMultiple(of: 2) { continue }   // skip evens
    if n > 7 { break }                     // stop entirely at 9
    print(n)   // 1, 3, 5, 7
}
```

Now nest two loops and try to `break` out of *both*. A plain `break` only exits the innermost loop — to reach further, give the outer loop a **label**, a name you attach before the loop keyword:

```swift
outer: for row in grid {
    for cell in row {
        if cell == target {
            break outer     // exits BOTH loops
        }
    }
}
```

`break outer` jumps clear of the labeled loop; `continue outer` would skip to the outer loop's next iteration. Without the label you'd need an ugly flag variable checked in both loops — labels say it directly.

## Common pitfalls

- **Writing `default` in a switch over your own enum.** It compiles today, but when the enum gains a case, the switch silently routes it to `default` instead of failing loudly. List the cases; let the compiler guard the future.
- **Expecting fall-through.** Coming from C, people add `break` at the end of every case (harmless but noise) or assume case 1 flows into case 2 (it never does without `fallthrough`).
- **A `guard` else-block that doesn't exit.** The compiler rejects it — the whole design depends on the failure path provably leaving the scope, so the unwrapped values can live on after.
- **Treating values as booleans.** `if count`, `if name` — compile errors. Write `if count > 0`, `if !name.isEmpty`.
- **Relying on `where` cases for exhaustiveness.** The compiler ignores `where` logic when checking coverage; you'll need a catch-all case.

## Interview lens

The staple question, "`if let` vs `guard let`", belongs to the Optionals lesson — but the control-flow follow-ups dig into `guard` itself. If asked why `guard`'s else must exit the scope, say: it's what lets the unwrapped value remain in scope after the statement — the compiler knows the only way past the guard is with the value present. Mention the flat happy path as the practical benefit.

If asked what makes Swift's `switch` different, hit three points: it's exhaustive, so a missed case is a compile error rather than a silent bug — and adding an enum case later surfaces every switch that needs updating; there's no implicit fall-through, so no forgotten-`break` bugs; and it's a full pattern-matching construct — tuples, ranges, `where` conditions, and `case let` extraction of enum payloads, not just equality checks.

A common probe is "when would you use `if case` instead of `switch`?" The answer: when exactly one case matters and a full exhaustive switch would be noise — `if case let .failure(e) = result` reads like `if let` for enum cases.

If loops come up, the details worth volunteering are that `repeat-while` runs its body at least once, and that labeled `break`/`continue` exist for escaping nested loops without flag variables — small things, but they signal you've written real Swift rather than skimmed a syntax table.
