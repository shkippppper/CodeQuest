## The problem: passing behavior around

Functions do work; closures let you pass *work itself* as a value — hand a chunk of behavior to `map`, a completion handler, or a button. Swift's function model is rich (labels, defaults, `inout`, variadics) and its closures come with two concepts that trip up interviewees constantly: **escaping** and **capturing**. Get those right and you avoid retain cycles and surprising mutations.

## Function syntax & parameters

```swift
func greet(name: String, times: Int) -> String {
    return String(repeating: "hi \(name) ", count: times)
}
```

Parameters are constants inside the body. The return arrow `->` names the result type; omit it (or return `Void`/`()`) for no result.

## Argument labels & defaults

Each parameter has an **argument label** (used at the call site) and a **parameter name** (used in the body). By default they're the same, but you can give a separate label — or `_` to omit it.

```swift
func move(from start: Int, to end: Int) { }
move(from: 0, to: 10)          // reads like a sentence

func log(_ message: String) { } // `_` drops the label
log("hello")
```

**Default values** let callers omit arguments:

```swift
func connect(timeout: Int = 30, retries: Int = 3) { }
connect()                 // uses both defaults
connect(timeout: 5)       // override one
```

## Variadic & `inout` parameters

A **variadic** parameter accepts zero-or-more values, available as an array:

```swift
func sum(_ numbers: Int...) -> Int { numbers.reduce(0, +) }
sum(1, 2, 3)   // 6
```

An **`inout`** parameter lets a function modify the caller's variable. You pass it with `&`.

```swift
func double(_ x: inout Int) { x *= 2 }
var n = 5
double(&n)     // n is now 10
```

`inout` is copy-in/copy-out, not a reference — the value is written back when the function returns.

## Closures & closure syntax

A **closure** is a self-contained block of behavior you can store and pass around. The full form mirrors a function:

```swift
let add = { (a: Int, b: Int) -> Int in
    return a + b
}
add(2, 3)   // 5
```

Swift shortens this aggressively using context. Inside `map`, all of these are equivalent:

```swift
nums.map({ (n: Int) -> Int in return n * 2 })  // full
nums.map { n in n * 2 }                          // inferred types, implicit return
nums.map { $0 * 2 }                              // shorthand argument names
```

`$0`, `$1`, … are the positional arguments; a single-expression closure returns implicitly.

## Trailing closures

When a closure is the **last** argument, you can move it outside the parentheses — the trailing-closure syntax that makes SwiftUI and completion-handler APIs read cleanly. If it's the only argument, drop the parentheses entirely.

```swift
// instead of fetch(url: url, completion: { data in ... })
fetch(url: url) { data in
    print(data)
}
```

Swift also supports **multiple trailing closures** (the second onward keep their labels), which is how `Button { } label: { }` works.

## Escaping vs non-escaping

By default a closure parameter is **non-escaping**: it must run (or not) *before the function returns*, and cannot be stored for later. Mark it **`@escaping`** if it outlives the call — e.g. saved to a property or dispatched asynchronously.

```swift
func runNow(_ work: () -> Void) { work() }              // non-escaping

var handlers: [() -> Void] = []
func store(_ work: @escaping () -> Void) {               // must be @escaping
    handlers.append(work)   // stored → outlives the call
}
```

Two consequences of `@escaping`: the compiler forces you to write `self.` explicitly inside it (a nudge that you may be creating a retain cycle), and non-escaping closures are cheaper and can't cause cycles.

## Capturing values

A closure **captures** the variables it references from its surrounding scope — by reference, so it sees later changes and can mutate them.

```swift
func makeCounter() -> () -> Int {
    var count = 0
    return { count += 1; return count }
}
let next = makeCounter()
next(); next()   // 1, then 2 — `count` lives on, captured
```

Because capture is by reference, an escaping closure that captures `self` (a class) keeps it alive — the classic **retain cycle**. Break it with a **capture list**: `{ [weak self] in ... }` or `{ [unowned self] in ... }`. You can also capture a snapshot by value: `{ [count] in ... }`.

## Higher-order functions

Functions that take or return functions are **higher-order**. Swift's collection APIs are built from them — `map`, `filter`, `reduce`, `compactMap`, `sorted(by:)`, `forEach`. Functions are first-class values: you can store them, pass them, and even pass a function name where a closure is expected.

```swift
let names = ["bob", "amy"]
names.sorted(by: <)          // pass the operator function
names.map(String.uppercased) // pass a method as a function value
```

## The interview lens

The headline question is *"escaping vs non-escaping — what's the difference and why does it matter?"* Non-escaping (the default) means the closure won't outlive the call, so it can't be stored and can't create a retain cycle; `@escaping` means it can outlive the call (stored or async), which is exactly when capturing `self` risks a **retain cycle** — hence the compiler makes you write `self.` explicitly and you reach for `[weak self]`.

Be ready for *"what does a closure capture, and how?"* — it captures referenced variables **by reference** (seeing and able to mutate later changes), which is why `makeCounter` keeps counting, and why capture lists exist. Bonus: mention that non-escaping closures are cheaper and that a plain function name can be passed anywhere a closure is expected.
