## The problem: failures you can forget to check

Look at this call:

```swift
let data = readFile("config.json")   // nil… but why?
```

Suppose `readFile` returns an optional — `nil` when anything goes wrong. Something just went wrong. Was the file missing? Locked? Corrupted halfway through? A `nil` can't tell you.

There's a second problem: nothing *forces* you to check. Forget the `if let`, and bad data flows quietly onward until something crashes far from the real cause.

Swift's error handling fixes both. A function that can fail says so in its signature, every call to it must be visibly marked, and the failure itself is a real value that carries detail. Failures become explicit and un-ignorable.

## Any type can be an error

Start with the error itself:

```swift
enum NetworkError: Error {
    case offline
    case badStatus(code: Int)
}
```

`Error` is a protocol with *no requirements* — conforming to it just declares "values of this type can be thrown." Any type can conform, but an enum is the idiomatic choice: one case per way things can fail.

Associated values carry the detail. `badStatus(code: 400)` doesn't just say "bad status" — it says *which* status.

You can even wrap one error inside another:

```swift
enum NetworkError: Error {
    case offline
    case badStatus(code: Int)
    case decodingFailed(underlying: Error)   // carries the inner error
}
```

That last case stores whatever lower-level error caused the decoding to fail, so no information is lost on the way up.

## Throw an error and watch it travel

A function that can fail is marked `throws`, right in the signature:

```swift
func loadUser(id: Int) throws -> User {
    guard id > 0 else { throw NetworkError.badStatus(code: 400) }
    // ... fetch and return the user
}
```

`throw` works like a `return` that carries a failure instead of a value. The function stops on that line, and the error starts traveling toward whoever called it.

At the call site, you must write `try` — a visible flag that says "this line can fail":

```swift
do {
    let user = try loadUser(id: 42)
    print(user)
} catch {
    print("failed: \(error)")
}
```

The `do` block is the region where failures are expected. If any `try` inside it throws, execution jumps straight to `catch`, skipping everything in between. In a bare `catch`, the thrown value is bound to a constant named `error` automatically.

You can also catch specific cases:

```swift
do {
    let user = try loadUser(id: 42)
    print(user)
} catch NetworkError.badStatus(let code) {
    print("HTTP \(code)")                     // matches only this case
} catch {
    print("other error: \(error)")            // catches everything else
}
```

`catch` patterns match exactly like a `switch`: you can name a case, bind its associated values, and fall through to a bare `catch` for the rest.

### What if nobody catches it?

Predict what happens here — `showUser` calls a throwing function with no `do`/`catch` in sight:

```swift
func showUser() throws {
    let user = try loadUser(id: -1)   // this throws
    print(user)                        // does this line run?
}
```

Answer: `print` never runs. `showUser` stops on the `try` line and hands the error to *its* caller. This is **propagation** — an uncaught error climbs the call stack, function by function, until some `do`/`catch` handles it.

That's why `showUser` must itself be marked `throws`. A function either handles the errors of its callees or admits in its signature that it passes them along. The compiler enforces this chain.

## Two shorthands: try? and try!

Sometimes you don't want a whole `do`/`catch`. Swift gives two conversions:

```swift
let a = try? loadUser(id: 42)   // type: User? — nil on any error
```

`try?` collapses the throwing call into an optional. Success gives you the value; *any* error gives you `nil`. Which error? Gone — `try?` discards that information. Use it when you genuinely only care whether it worked.

```swift
let b = try! loadUser(id: 42)   // type: User — crashes if it throws
```

`try!` asserts the call cannot fail. If it does throw, your app **traps** — it stops immediately with a crash, on purpose. This is the same bargain as force-unwrapping an optional: use it only when failure is truly impossible, like loading a resource bundled inside your own app.

## defer: cleanup that always runs

Here's a resource that must be closed no matter what:

```swift
func process(path: String) throws {
    let file = open(path)
    defer { close(file) }        // registered now, runs later
    try validate(file)           // may throw!
    // ... more work
}
```

A **defer** block runs when the current scope exits — *however* it exits. Normal return, thrown error, early `break`: the deferred code runs on every path out.

Trace the failure path: if `validate` throws, execution leaves `process` immediately — but on the way out, `defer` fires and the file closes. Without `defer`, every `try` line would be a potential leak.

### Multiple defers

Predict the output:

```swift
func demo() {
    defer { print("A") }
    defer { print("B") }
    print("body")
}
```

Answer:

```
body
B
A
```

Defers run in *reverse* order — last registered, first executed. That mirrors how resources should unwind: whatever you acquired most recently gets released first.

## Naming the exact error type

A plain `throws` function may throw *any* error:

```swift
func loadUser(id: Int) throws -> User   // could throw literally anything
```

Callers know it can fail, but not with what. Recent Swift adds **typed throws** — you can name the one error type a function is allowed to throw:

```swift
func parse() throws(NetworkError) -> Data {
    throw .offline    // only NetworkError cases allowed here
}
```

Now the error type is part of the signature. Callers can `catch` exhaustively — the compiler knows every possible case. This matters most for libraries and embedded code, where being precise about failures is worth the ceremony.

Plain `throws` is exactly equivalent to `throws(any Error)`, and it remains the everyday default.

## Result: a failure you can put in a box

Everything so far happens at the moment of the call. But sometimes you need to *store* an outcome, or hand it to a callback that runs later:

```swift
func fetch(completion: (Result<Data, NetworkError>) -> Void) { }
```

**Result** is an enum with two cases — `success` holding a value, `failure` holding an error. It turns "either it worked or it didn't" into a plain value you can store, pass around, and unpack whenever you're ready:

```swift
fetch { result in
    switch result {
    case .success(let data):  print(data)
    case .failure(let error): print(error)
    }
}
```

This is the classic shape of completion handlers and callback-based APIs.

You can hop between the two worlds in both directions:

```swift
let result = Result { try loadUser(id: 42) }   // throwing call → Result
let user = try result.get()                     // Result → back to throwing
```

`Result(catching:)` runs a throwing closure and packages the outcome. `.get()` does the reverse: returns the success value, or throws the stored failure.

## Three ways to say "it didn't work"

Swift gives you three failure tools, and choosing the right one is a design decision:

```swift
let value = dict["missing"]        // Optional — nil, no explanation needed
let user = try loadUser(id: 7)     // thrown error — detail the caller may need
fatalError("array index out of range")   // trap — a programmer bug
```

Use an optional when absence has *one obvious reason* and no detail is needed — a key isn't in the dictionary, end of story. No error type, no `try`.

Use a thrown error when failure has *multiple causes* or detail the caller may want to inspect or report: parsing, file I/O, networking.

Use a trap — `fatalError`, a failed `precondition`, `try!` — only for *programmer bugs*: states that should be impossible if the code is correct. Never for failures the real world can cause at runtime.

Using the wrong tool is a code smell. Force-unwrapping to "handle" a recoverable failure, or throwing an error where a simple optional would do, both tell a reviewer the failure model wasn't thought through.

## Common pitfalls

- **Swallowing errors with `try?` while debugging.** `try? decode(data)` returning `nil` tells you nothing. Use `do`/`catch` and print the error — it usually names the exact problem.
- **`try!` on anything the outside world influences.** Network responses, user files, server JSON — all can fail at runtime, and `try!` turns each failure into a crash.
- **Cleanup written after the `try` lines instead of in `defer`.** If the `try` throws, code below it never runs. `defer` runs on every exit path.
- **Modeling a programmer bug as a thrown error.** An impossible state should trap loudly, not get quietly caught and logged.

## Interview lens

If asked "`try?` vs `try!` vs `do`/`catch` — when do you use each?", say: `do`/`catch` when you want to inspect and react to the specific error; `try?` when you only care about success or failure and are happy collapsing every error into `nil`; `try!` only when a throw is genuinely impossible, because it traps otherwise.

The design question — "error, optional, or crash?" — is where interviewers gauge seniority. Say: optionals for single-reason absence with no detail, thrown errors for recoverable failures the caller may need to understand, traps for programmer mistakes and violated assumptions. Picking by *why it failed*, not by habit, is the signal they want.

Two details earn bonus points. First, `defer` runs on *every* exit path — return, throw, or break — and multiple defers run in reverse order, which is exactly the property that makes cleanup reliable. Second, `Result` is the value form of throwing: `Result(catching:)` wraps a throwing call, `.get()` unwraps back, and knowing that bridge shows you can move between callback-style and throws-style APIs.

If typed throws comes up, say it makes the error type part of the signature — `throws(NetworkError)` — enabling exhaustive catches, and that plain `throws` is just `throws(any Error)`.
