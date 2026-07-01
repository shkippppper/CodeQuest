## The problem: failures that can't be ignored

Some operations fail for reasons you must handle — a file is missing, JSON is malformed, the network times out. Swift's error handling makes those failures **explicit and un-ignorable**: a function that can fail is marked `throws`, and every call to it must visibly acknowledge that with `try`. No silent error codes, no forgotten checks.

## The `Error` protocol

Any type can represent an error by conforming to the empty **`Error`** protocol. Enums are the idiomatic choice — one case per failure mode, with associated values for detail.

```swift
enum NetworkError: Error {
    case offline
    case badStatus(code: Int)
    case decodingFailed(underlying: Error)
}
```

## `throws`, `try`, `catch`

A function that can fail is marked `throws`. Inside it, `throw` raises an error. At the call site you write `try`, and handle failures with `do`/`catch`.

```swift
func loadUser(id: Int) throws -> User {
    guard id > 0 else { throw NetworkError.badStatus(code: 400) }
    // ...
}

do {
    let user = try loadUser(id: 42)
    print(user)
} catch NetworkError.badStatus(let code) {
    print("HTTP \(code)")
} catch {
    print("other error: \(error)")   // `error` is bound implicitly
}
```

`catch` patterns match like a `switch`; a bare `catch` catches everything and binds the value to `error`. A `throws` function propagates any error you don't catch up to its caller.

## `try?` and `try!`

Two shorthands convert a throwing call into something non-throwing:

```swift
let a = try? loadUser(id: 42)   // User?  — nil on any error
let b = try! loadUser(id: 42)   // User   — CRASHES if it throws
```

- **`try?`** turns the result into an **optional** — you get `nil` if it throws, discarding *which* error. Good when you only care whether it succeeded.
- **`try!`** asserts it won't throw; if it does, your app **traps**. Use only when failure is truly impossible (like force-unwrapping).

## `defer`

A `defer` block runs when the current scope exits — **however** it exits (normal return, thrown error, or `break`). It's how you guarantee cleanup regardless of the path.

```swift
func process(path: String) throws {
    let file = open(path)
    defer { close(file) }        // runs no matter how we leave
    try validate(file)           // even if this throws, file closes
    // ...
}
```

Multiple `defer`s run in **reverse** order (last-registered first), mirroring how resources should unwind.

## Typed throws

Historically a `throws` function could throw *any* `Error`. Recent Swift adds **typed throws** — you can constrain a function to a specific error type:

```swift
func parse() throws(NetworkError) -> Data {
    throw .offline    // only NetworkError allowed
}
```

This makes the error type part of the signature (useful in libraries, embedded, and for exhaustive `catch`), but plain `throws` (equivalent to `throws(any Error)`) remains the common default.

## The `Result` type

`Result<Success, Failure>` captures "either a value or an error" as a **value** you can store and pass around — handy for completion handlers and bridging async callbacks.

```swift
func fetch(completion: (Result<Data, NetworkError>) -> Void) { }

fetch { result in
    switch result {
    case .success(let data): print(data)
    case .failure(let error): print(error)
    }
}
```

You can hop between the two worlds: `Result(catching: { try something() })` wraps a throwing call, and `try result.get()` unwraps back into the `throws` world.

## Errors vs optionals vs crashes

Swift gives you three ways to model "it didn't work" — pick by *why*:

- **Optional (`nil`)** — absence with **one obvious reason** and no detail needed (a missing dictionary key). No error type, no `try`.
- **Thrown error** — failure with **multiple causes** or detail the caller may want to inspect/report (parsing, I/O, networking).
- **Trap / `fatalError`** — a **programmer bug** or truly impossible state (an invariant violated). Not for expected runtime failures.

Using the wrong tool is a code smell: force-unwrapping to "handle" a recoverable failure, or throwing where a simple optional would do.

## The interview lens

A frequent question: *"`try?` vs `try!` vs `do/catch` — when each?"* Use `do/catch` when you want to inspect and react to the specific error; `try?` when you only care success/failure and are fine collapsing all errors to `nil`; `try!` only when a throw is genuinely impossible (it traps otherwise).

The design question — *"error vs optional vs crash?"* — signals seniority: optionals for single-reason absence, thrown errors for recoverable failures with detail, traps for programmer mistakes. Bonus points for knowing `defer` runs on **every** exit path (in reverse order) — the reliable cleanup mechanism — and that `Result` is the value-form of throwing, bridged via `Result(catching:)` and `.get()`.
