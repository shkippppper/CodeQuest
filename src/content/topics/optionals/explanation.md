## What is an optional?

An **optional** is Swift's way of saying "this might hold a value, or it might hold nothing at all." Instead of using a magic value like `-1` or a `null` pointer that can crash your app, Swift makes absence an explicit, type-checked part of the language.

A value of type `String` *always* contains a string. A value of type `String?` (note the `?`) contains *either* a `String` *or* `nil`. The compiler forces you to handle the `nil` case before you can use the value — that's the whole point.

```swift
var name: String = "Ada"   // always a String
var nickname: String? = nil // a String, or nothing
```

Under the hood an optional is just an `enum` with two cases:

```swift
enum Optional<Wrapped> {
    case none            // written as nil
    case some(Wrapped)   // the actual value, "wrapped" inside
}
```

So `String?` is really `Optional<String>`. The `?` is syntactic sugar. This is why you'll hear the phrase "unwrap the optional" — you're pulling the value out of the `.some` case.

## Why optionals exist

Many languages let any reference be `null`. Forgetting to check for it causes the infamous null-pointer crash. Swift flips the default: a normal type can **never** be `nil`, and the moment you want absence you must opt in with `?`. The danger becomes visible in the type system, so a whole category of runtime bugs turns into compile-time errors.

> Tony Hoare, who introduced null references in 1965, later called them his "billion-dollar mistake." Optionals are Swift's answer to that mistake.

## Unwrapping: getting the value out

You can't use an optional directly where a non-optional is expected — you must unwrap it first. Here are your tools, from most dangerous to safest.

### Force unwrapping with `!`

The `!` operator says "I'm certain this isn't nil — give me the value." If you're wrong, your app **crashes**.

```swift
var age: Int? = 30
print(age! + 1) // 31

var missing: Int? = nil
print(missing!) // 💥 runtime crash: unexpectedly found nil
```

Treat `!` as a code smell. It's occasionally justified (e.g. a value you set in `viewDidLoad` and know exists), but in interviews you should reach for safer tools first.

### Optional binding with `if let`

`if let` unwraps the optional into a new constant *only if* it contains a value. Inside the block, the constant is the non-optional `Wrapped` type.

```swift
let response: String? = "200 OK"

if let response {
    // `response` here is a plain String, not String?
    print("Got: \(response)")
} else {
    print("No response")
}
```

Since Swift 5.7 you can write the shorthand `if let response` instead of `if let response = response`.

### `guard let` for early exit

`guard let` unwraps too, but if the value is `nil` it forces you to leave the current scope (`return`, `throw`, `break`, `continue`). Crucially, the unwrapped value stays in scope for the **rest of the function** — no extra nesting.

```swift
func greet(_ name: String?) {
    guard let name else {
        print("Nobody to greet")
        return
    }
    // `name` is usable for the whole rest of the function
    print("Hello, \(name)!")
}
```

`guard` is the idiomatic choice for validating inputs at the top of a function. It keeps the "happy path" un-indented.

### Nil-coalescing with `??`

The `??` operator provides a default when the optional is `nil`. The result is non-optional.

```swift
let typed: String? = nil
let username = typed ?? "guest"
print(username) // guest
```

### Optional chaining with `?.`

Optional chaining lets you call a property, method, or subscript on an optional. If any link in the chain is `nil`, the whole expression evaluates to `nil` (and the rest is skipped). **The result is always optional.**

```swift
struct Address { var city: String }
struct User { var address: Address? }

let user: User? = User(address: Address(city: "Tbilisi"))
let city = user?.address?.city  // type is String?
print(city ?? "unknown")        // Tbilisi
```

## Implicitly unwrapped optionals

Declared with `!` instead of `?`, an implicitly unwrapped optional (IUO) is an optional that auto-unwraps every time you use it. It's a promise to the compiler that "this will be nil briefly during setup, but always have a value by the time anyone reads it."

```swift
var label: String! = nil
label = "Ready"
print(label) // Ready — no unwrapping needed
```

Reading an IUO while it's `nil` crashes, exactly like force unwrapping. They're mostly seen in legacy UIKit `@IBOutlet`s. Prefer regular optionals unless you have a specific reason.

## Under the hood: senior nuances

Optionals look beginner-friendly, but interviewers probe the corners. Four worth knowing cold:

### `??` short-circuits — its right side is an `@autoclosure`

The right-hand operand of `??` is declared `@autoclosure`, so it is only evaluated when the left side is `nil`. An expensive default costs nothing on the happy path.

```swift
func expensiveDefault() -> Int { print("computed"); return 0 }
let x: Int? = 42
let y = x ?? expensiveDefault()  // "computed" is NOT printed — x wasn't nil
```

### Double optionals

Wrapping an optional in another optional (`Int??`) is real, and it bites when a transform over an optional itself returns an optional. `map` adds a layer; `flatMap` collapses one.

```swift
let raw: String? = "42"
let mapped = raw.map { Int($0) }      // Int??  — two layers
let flat   = raw.flatMap { Int($0) }  // Int?   — flattened
```

Dictionary lookups nest the same way when the *value* type is already optional: the subscript of `[String: Int?]` is `Int??`.

### Memory: optionals are (usually) free

For reference types, `Optional` costs **nothing** extra: a class reference has a spare all-zero bit pattern that Swift reuses for `.none`, so `MemoryLayout<UIView?>.size == MemoryLayout<UIView>.size`. A type with no spare representation (like `Int`) gets a one-byte discriminator, so `MemoryLayout<Int?>.size` is 9 while `MemoryLayout<Int>.size` is 8. This "spare-bit / null-pointer optimization" makes optional references as cheap as raw C pointers — without the crashes.

### Pattern matching the enum directly

Because an optional *is* an enum, you can match its cases. `case let x?` is sugar for `case .some(let x)`:

```swift
switch someValue {
case let x?: print("got a value: \(x)")
case nil:    print("empty")
}

for case let name? in ["a", nil, "b"] {  // skips nil, unwraps the rest
    print(name)                          // a, then b
}
```

## Common pitfalls

- **Double optionals.** Mapping over an optional that returns an optional gives you `String??`. Use `flatMap` to flatten it.
- **`??` precedence.** `a ?? b + c` parses as `a ?? (b + c)`. Add parentheses when mixing operators.
- **Force-unwrapping dictionary lookups.** `dict["key"]!` crashes the moment the key is missing. Use `if let` or `??`.
- **Comparing optionals.** `someOptionalInt == 5` works and is `true` only when it wraps `5` — but `nil < 5` behavior was removed; don't rely on ordering of optionals.

## The interview lens

Expect questions like *"What's the difference between `if let` and `guard let`?"* The crisp answer: both unwrap, but `guard` exits early on failure and keeps the unwrapped value in scope for the remainder of the function, whereas `if let` scopes the value to its block. `guard` reduces nesting; `if let` is for when you genuinely branch.

Also be ready to explain that an optional is an `enum` — interviewers love when you mention `.some`/`.none`, because it shows you understand there's no runtime "null," just a value-type wrapper.
