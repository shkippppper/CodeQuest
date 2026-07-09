## The problem: passing behavior around

You already pass *data* to functions:

```swift
let doubled = double(21)   // pass a number, get a number
```

Now look at this call:

```swift
let doubled = [1, 2, 3].map { $0 * 2 }   // [2, 4, 6]
```

The thing between the braces isn't data — it's *behavior*. You handed `map` a small chunk of code and it ran that code once per element. Code you can store in a variable and pass around like a value is called a **closure**, and it's the second half of this lesson.

First, though, the functions themselves — Swift's function syntax has a few features (labels, defaults, `inout`, variadics) that interviews like to poke at.

## Functions: the anatomy

```swift
func greet(name: String, times: Int) -> String {
    return String(repeating: "hi \(name) ", count: times)
}

greet(name: "Ada", times: 2)   // "hi Ada hi Ada "
```

The arrow `->` declares what the function gives back. A function that returns nothing omits the arrow entirely — behind the scenes it returns the empty value `Void`, also written `()`.

Try to modify a parameter inside the body:

```swift
func greet(name: String) {
    name = name.uppercased()   // compile error
}
```

Parameters arrive as constants — you can't reassign them. If you need a modified copy, make one with `var local = name`.

## Two names per parameter

Look closely at this function — each parameter has *two* names:

```swift
func move(from start: Int, to end: Int) { }

move(from: 0, to: 10)
```

`from` and `to` are **argument labels** — the names callers write. `start` and `end` are the parameter names used inside the body. Two names, two audiences: the call site reads like a sentence ("move from 0 to 10"), while the body gets sensible variable names.

When you write only one name, it plays both roles — that's what `greet(name:)` did above. And when a label would be pure noise, silence it with `_`:

```swift
func log(_ message: String) { }

log("hello")   // no label needed
```

A parameter can also carry a default value, letting callers skip it:

```swift
func connect(timeout: Int = 30, retries: Int = 3) { }

connect()                // both defaults
connect(timeout: 5)      // override just one
connect(retries: 10)     // or just the other
```

Defaults plus labels are how Swift APIs offer many knobs without forcing every caller to set all of them.

## Variadics: zero or more of something

Sometimes "how many arguments" shouldn't be fixed:

```swift
func sum(_ numbers: Int...) -> Int {
    numbers.reduce(0, +)
}

sum(1, 2, 3)      // 6
sum()             // 0 — zero arguments is allowed
```

The `...` after the type makes the parameter **variadic** — the caller passes any number of values, and inside the body they arrive bundled as a plain array. `numbers` here is an `[Int]`.

## inout: letting a function change your variable

Normal parameters are copies — the function can't touch the caller's variable. `inout` changes that:

```swift
func double(_ x: inout Int) {
    x *= 2
}

var n = 5
double(&n)
print(n)   // 10 — the caller's variable changed
```

Two markers make the mutation visible: `inout` in the declaration, and `&` at the call site. The `&` is mandatory — you can always spot, at a glance, which calls might change your variable.

The senior detail: `inout` is *not* a live reference into the caller's memory. It works as copy-in, copy-out — the value is copied into the function, the function works on its copy, and the result is copied back when the function returns. Usually indistinguishable from a reference, but it means you can't alias the same variable through two `inout` parameters at once (the compiler forbids it), and the write-back lands only at return time.

## Closures: code as a value

Back to the opening idea. Store some behavior in a constant:

```swift
let add = { (a: Int, b: Int) -> Int in
    return a + b
}

add(2, 3)   // 5
```

Everything before `in` is the signature — parameters and return type, just like a function. Everything after `in` is the body. `add` now holds a value of type `(Int, Int) -> Int`, and calling it looks exactly like calling a function.

That full form is verbose, and Swift lets context shrink it. Watch the same closure passed to `map`, shortening step by step:

```swift
nums.map({ (n: Int) -> Int in return n * 2 })   // 1. full form
nums.map({ n in return n * 2 })                  // 2. types inferred from map
nums.map({ n in n * 2 })                         // 3. single expression → implicit return
nums.map({ $0 * 2 })                             // 4. positional names
nums.map { $0 * 2 }                              // 5. trailing closure
```

Each step drops something the compiler can already figure out:

- Step 2: `map` on an `[Int]` already knows the closure takes an `Int` — no need to repeat it.
- Step 3: when the body is one single expression, its value is returned automatically. No `return`.
- Step 4: skip naming parameters at all; `$0` is the first argument, `$1` the second, and so on.
- Step 5 is its own feature — next section.

All five lines mean exactly the same thing. Reading real Swift means being comfortable at every point on this ladder.

## Trailing closures

When a closure is the *last* argument to a function, Swift lets you move it out of the parentheses:

```swift
fetch(url: url, completion: { data in print(data) })   // closure inside parens

fetch(url: url) { data in                               // trailing form
    print(data)
}
```

Same call, but multi-line closures no longer trap you inside a parenthesis sandwich. If the closure is the *only* argument, the parentheses disappear entirely — that's why step 5 above was `nums.map { $0 * 2 }` with no parens at all.

A function can even take several closures. The first one trails without a label; the rest keep their labels:

```swift
Button {
    submit()
} label: {
    Text("Submit")
}
```

That's not special SwiftUI syntax — it's plain Swift multiple-trailing-closure syntax, on a `Button` initializer that takes two closures: the action and the label.

## Closures remember their surroundings

Here's where closures stop being "just inline functions". Predict what this prints:

```swift
func makeCounter() -> () -> Int {
    var count = 0
    return { count += 1; return count }
}

let next = makeCounter()
print(next())
print(next())
```

Answer: `1`, then `2`.

Pause on how strange that is. `count` is a local variable of `makeCounter`, and `makeCounter` returned long ago — its locals should be gone. But the closure referenced `count`, so Swift kept `count` alive inside the closure. This is called **capturing**: a closure holds on to the outside variables it uses.

And it captures the *variable itself*, not a copy of its value. The closure sees later changes and can make changes of its own — that's exactly why `count` keeps incrementing across calls. Two closures created in the same scope even share the same captured variable:

```swift
var total = 0
let addOne = { total += 1 }
let addTen = { total += 10 }
addOne(); addTen()
print(total)   // 11 — both closures mutated the same variable
```

If you *want* a frozen snapshot instead, ask for it with a **capture list** — square brackets before the parameters:

```swift
var count = 0
let frozen = { [count] in print(count) }   // captures the VALUE now: 0
count = 99
frozen()   // prints 0, not 99
```

`[count]` copied the value at the moment the closure was created; later changes don't reach it.

Capturing has a dark side. When a closure inside a class captures `self`, it holds the object alive — and if the object also stores the closure, each keeps the other alive forever. That's a retain cycle, the classic Swift memory leak; the ARC lessons cover it fully. The same capture-list brackets are the fix — `{ [weak self] in ... }` captures `self` without keeping it alive.

## Escaping vs non-escaping

Two functions that both take a closure — spot the difference:

```swift
func runNow(_ work: () -> Void) {
    work()                        // runs before runNow returns
}

var handlers: [() -> Void] = []
func store(_ work: @escaping () -> Void) {
    handlers.append(work)         // runs... later. Maybe. After store returns.
}
```

In `runNow`, the closure's whole life happens inside the call. In `store`, the closure is saved and will outlive the call — it *escapes* the function. Swift makes you declare that with `@escaping`.

The default — no annotation — is **non-escaping**: the compiler guarantees the closure cannot be stored, cannot be dispatched to run later, and is finished with by the time the function returns. Try to append a non-escaping closure to an array and you get a compile error telling you to add `@escaping`.

Why does the language care? Two payoffs:

First, safety around `self`. Inside an escaping closure in a class, Swift forces you to write `self.` explicitly:

```swift
store {
    self.refresh()   // compiler demands the explicit `self.`
}
```

That requirement is a deliberate nudge: "this closure will outlive the current call and it's capturing `self` — did you mean to? Is this a retain cycle?" Non-escaping closures don't need the `self.` because they can't outlive the call, so they can't create a cycle.

Second, performance. A non-escaping closure never outlives the current call, so the compiler can keep its captured variables on the fast, short-lived side of memory and optimize the call aggressively. Escaping closures need their captures packaged up to survive on their own, which costs more.

The rule of thumb: completion handlers, stored callbacks, and anything async are `@escaping`; a closure you only call inside the function body stays non-escaping — and the default pushes you toward the cheap, safe option.

## Functions are values too

Closures aren't a separate species — named functions are values of the same function types, and you can pass them wherever a closure is expected. Functions that take or return other functions are called **higher-order** functions, and Swift's collection APIs — `map`, `filter`, `reduce`, `compactMap`, `sorted(by:)`, `forEach` — are all higher-order.

That means you can skip writing a closure when a function with the right shape already exists:

```swift
let names = ["bob", "amy"]

names.sorted(by: <)   // ["amy", "bob"]
```

`<` is just a function that takes two strings and returns a `Bool` — exactly what `sorted(by:)` wants — so you pass the operator itself instead of writing `{ $0 < $1 }`.

Methods work too:

```swift
names.map(String.uppercased)   // ["BOB", "AMY"]
```

Both lines say "use this existing behavior" without wrapping it in closure braces. Recognizing that functions, methods, operators, and closures are all the same kind of value is the mental unlock for this whole topic.

## Common pitfalls

- **Forgetting `&` on an `inout` call.** `double(n)` won't compile; the `&` in `double(&n)` is required so mutation is visible at the call site.
- **Assuming `inout` is a live reference.** It's copy-in/copy-out — the write-back happens at return, and you can't pass the same variable to two `inout` parameters at once.
- **Capturing `self` strongly in a stored closure.** If the object also stores the closure, neither is ever freed. Use `[weak self]` in escaping closures held by `self`.
- **Expecting a capture to be a snapshot.** Plain capture shares the variable — mutations flow both ways. Write `[x]` in the capture list when you want the value frozen at creation.
- **Marking everything `@escaping` "just in case".** It disables optimizations and invites accidental retain cycles. Only escape what genuinely outlives the call.

## Interview lens

The headline question is "escaping vs non-escaping — what's the difference and why does it matter?" Say: non-escaping is the default and means the closure is guaranteed dead by the time the function returns — it can't be stored, so it can't cause a retain cycle, and the compiler can optimize it. `@escaping` means the closure outlives the call — stored or run asynchronously — which is exactly when capturing `self` becomes dangerous, and that's why the compiler forces the explicit `self.` inside escaping closures. Connecting the annotation to retain-cycle risk is what makes the answer senior.

The natural follow-up is "what does a closure capture, and how?" Answer: it captures the variables it references from the enclosing scope, by reference — it shares the actual variable, sees later changes, and can mutate it. Use the counter example: the returned closure keeps a dead function's local variable alive and increments it across calls. Then mention capture lists as the way to opt into a by-value snapshot, and `[weak self]` as the cycle-breaker.

If asked something lighter — argument labels, `inout` — the details that score points are: labels exist so call sites read as sentences while bodies keep clean names; and `inout` is copy-in/copy-out rather than a reference, which is why the compiler bans aliasing the same variable twice. Tossing in that operators and methods can be passed directly where closures are expected (`sorted(by: <)`) shows fluency beyond syntax.
