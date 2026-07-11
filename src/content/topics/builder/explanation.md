## The problem: one initializer with too many optional pieces

Look at this initializer call:

```swift
let request = HTTPRequest(url: url, method: "GET", headers: [:], body: nil, timeout: 30, retries: 0, cachePolicy: .useProtocolCachePolicy)
```

Most of the time you only care about two or three of these seven parameters — the rest are just defaults being repeated at every call site. Read that line back: which arguments matter for *this particular* request? You can't tell without counting positions.

The **builder** pattern's intent is to separate *assembling* a complex object, piece by piece, from the object's final, immutable shape — so each call site sets only what it actually cares about, in whatever order makes sense to read.

## Fluent builders

Start with a plain builder class that collects settings one at a time:

```swift
final class RequestBuilder {
    private var url: URL
    private var method = "GET"
    private var headers: [String: String] = [:]

    init(url: URL) { self.url = url }

    func method(_ method: String) -> RequestBuilder {
        self.method = method
        return self
    }

    func header(_ key: String, _ value: String) -> RequestBuilder {
        headers[key] = value
        return self
    }
}
```

Each method mutates one piece of state, then returns `self`. Returning `self` is what makes the next line able to call another method directly on the result — this chaining style is called a **fluent interface**.

```swift
let builder = RequestBuilder(url: url)
    .method("POST")
    .header("Authorization", "Bearer abc123")
    .header("Content-Type", "application/json")
```

Only the pieces that matter for this request appear at the call site — no `retries: 0` or `cachePolicy: .useProtocolCachePolicy` cluttering the line when the caller doesn't care.

Add a final step that turns the accumulated state into the real, immutable object:

```swift
struct HTTPRequest {
    let url: URL
    let method: String
    let headers: [String: String]
}

extension RequestBuilder {
    func build() -> HTTPRequest {
        HTTPRequest(url: url, method: method, headers: headers)
    }
}

let request = RequestBuilder(url: url)
    .method("POST")
    .header("Authorization", "Bearer abc123")
    .build()
```

Notice the split: `RequestBuilder` is mutable and mid-assembly, but `HTTPRequest` — the thing `.build()` hands back — is a plain `let`-only struct. The builder absorbs all the messy, step-by-step mutation so the finished object never has to be anything but immutable and complete.

## Result-builder DSLs

Swift has a second, more powerful way to build up a structure: **result builders** — a compiler feature (the same one behind SwiftUI's `body`) that lets a function parameter be written as a block of statements instead of a single expression, which the compiler then combines for you.

Here's a minimal one that assembles a list of menu items:

```swift
@resultBuilder
struct MenuBuilder {
    static func buildBlock(_ items: MenuItem...) -> [MenuItem] {
        items
    }
}
```

`buildBlock` is the piece the compiler calls with every statement inside the block, collected as one call. Use it by writing a function whose last parameter is marked `@MenuBuilder`:

```swift
struct MenuItem { let name: String; let price: Double }

func makeMenu(@MenuBuilder _ items: () -> [MenuItem]) -> [MenuItem] {
    items()
}
```

Now the caller writes plain-looking statements, and the compiler quietly turns them into the array:

```swift
let menu = makeMenu {
    MenuItem(name: "Coffee", price: 3.5)
    MenuItem(name: "Croissant", price: 2.75)
}
```

There's no `.append` and no comma-separated array literal — each line just *is* an item, and `buildBlock` stitches them together behind the scenes. This is the exact mechanism SwiftUI uses for `VStack { Text("Hi"); Image(...) }`: the view builder collects each line into one combined view tree, the same way `MenuBuilder` collects lines into an array.

What does adding conditional logic require? Predict: can you write `if someCondition { MenuItem(...) }` inside `makeMenu`'s block as-is?

Answer: not with only `buildBlock` — that needs an extra method, `buildEither` or `buildOptional`, so the result builder knows how to combine a branch that might not run. Real result builders like `@ViewBuilder` implement several of these methods; a fluent builder needs none of that, which is why it's often the simpler tool for a plain object.

## Builder vs default args

Both examples above are solving the same problem `HTTPRequest`'s seven-parameter initializer had. But Swift's plain **default arguments** already solve the simple version of it:

```swift
struct HTTPRequest {
    let url: URL
    let method: String = "GET"
    let headers: [String: String] = [:]
    let timeout: TimeInterval = 30
}

let request = HTTPRequest(url: url, method: "POST")
```

This call site is just as readable as the builder version, with far less code — no separate builder class, no `.build()` call. So when does a builder actually earn its keep over default arguments?

- The construction has steps, not just fields: if setting one property depends on the value of another, or a step needs to run validation before continuing, a builder's methods can enforce that order; a struct initializer with defaults cannot.
- The object is assembled incrementally across different places in the code, not in one call — e.g. a builder passed through several configuration functions before `.build()` is finally called.
- You want to reuse a partially-configured builder as a template for several similar objects, changing only a couple of settings each time.

If none of those apply — if it's really just "some parameters are optional" — default arguments give you the same readability with a fraction of the code. Reaching for a builder class by default, out of habit, is adding a layer the simpler tool already covers.

## Examples

A realistic case where the extra structure pays off: building an alert with a variable number of buttons, where each button needs its own style and handler.

```swift
final class AlertBuilder {
    private var title = ""
    private var message = ""
    private var actions: [(String, () -> Void)] = []

    func title(_ title: String) -> AlertBuilder { self.title = title; return self }
    func message(_ message: String) -> AlertBuilder { self.message = message; return self }

    func action(_ label: String, handler: @escaping () -> Void) -> AlertBuilder {
        actions.append((label, handler))
        return self
    }

    func build() -> UIAlertController {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        for (label, handler) in actions {
            alert.addAction(UIAlertAction(title: label, style: .default) { _ in handler() })
        }
        return alert
    }
}

let alert = AlertBuilder()
    .title("Delete item?")
    .message("This can't be undone.")
    .action("Cancel") { }
    .action("Delete") { deleteItem() }
    .build()
```

`UIAlertController` itself has no initializer that takes a variable-length list of actions — this is exactly the "steps, not just fields" case: actions accumulate one call at a time before the alert is finally assembled.

## Common pitfalls

- **Forgetting `.build()` isn't automatic.** Unlike a struct literal, a fluent builder only produces the final object when you explicitly ask for it — a builder left un-built is just discarded state.
- **Mutating a builder after sharing it.** If you hand a `RequestBuilder` to two different functions and both call `.method(...)`, whichever call happens last silently wins — treat a builder as owned by one assembly path at a time.
- **Reaching for a builder or a result-builder DSL when default arguments would do.** Both add real complexity (a second type, or a compiler-feature attribute); use them when construction genuinely has steps or is assembled across multiple places, not just because an initializer has several optional parameters.

## Interview lens

If asked to implement a builder, write a class with private mutable state, chainable methods that mutate a property and `return self`, and a final `.build()` that produces an immutable result type — and say out loud that the split between mutable builder and immutable final object is the whole point.

If asked about result builders, connect them to SwiftUI directly: `@resultBuilder` is the compiler feature that lets you write a block of statements instead of an array literal or method chain, and `buildBlock` (plus `buildEither`/`buildOptional` for conditionals) is what combines those statements — it's the exact mechanism behind `VStack { ... }`.

If asked when *not* to use a builder, say default arguments already solve "some parameters are optional" with less code; a builder earns its complexity only when construction has real steps, spans multiple places in the code, or needs to be reused as a partially-configured template.
