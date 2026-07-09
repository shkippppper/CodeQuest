## The problem: four things hiding behind one dot

Read these two lines:

```swift
user.name
rect.area
```

They look identical — a dot, a name, a value comes back. But behind the dot, completely different things can be happening. `name` might be read straight out of memory. `area` might run code that multiplies two other values on every single access. A third property might quietly fire observer code when assigned. A fourth might build itself the first time anyone looks at it.

Swift gives you all four flavors under the same syntax. This lesson is about telling them apart — because mixing them up produces subtle bugs: expensive work on every read, observers that never fire, values drifting out of sync.

## Stored properties: a box in the instance

The simplest kind first:

```swift
struct User {
    var name: String
    let id: Int
}

var user = User(name: "Ada", id: 1)
user.name = "Grace"   // fine — var property, var instance
user.id = 2           // compile error — id is let
```

A **stored property** is an actual box in the instance's memory — each `User` carries its own `name` and `id`. A `let` stored property is set once during initialization and frozen; a `var` can change afterwards.

Structs and classes both have stored properties. Enums do not — an enum instance stores only which case it is, plus any associated values.

One struct-specific wrinkle:

```swift
let frozen = User(name: "Ada", id: 1)
frozen.name = "Grace"   // compile error — even though name is var
```

Declaring a *struct* instance with `let` freezes the whole thing, `var` properties included. That's value-type behavior from the Structs vs Classes lesson — we'll come back to it at the end, because classes behave differently.

## Computed properties: code that runs on every read

Now a property with no box at all:

```swift
struct Rectangle {
    var width: Double
    var height: Double

    var area: Double {
        width * height
    }
}
```

`area` is a **computed property** — it stores nothing. Every time you read `rect.area`, the body runs and multiplies the current `width` and `height`. Change `width`, and the next read of `area` reflects it automatically.

That's exactly why you'd choose computed over stored here. If `area` were a stored property, someone would have to remember to update it every time `width` or `height` changed — and one forgotten update means a stale value. A derived value that's *computed* can never drift out of sync with its inputs.

The version above is read-only, using a shorthand: when there's no setter, you can skip writing `get { }` and just give the expression. The full form has both halves:

```swift
var isSquare: Bool {
    get { width == height }
    set {
        if newValue { height = width }
    }
}
```

The setter receives whatever value was assigned under the automatic name `newValue` — writing `square.isSquare = true` runs the `set` body with `newValue == true`. If you want a different name, declare it: `set(flag) { ... }`.

One rule surprises people: a computed property must be declared `var`, even when it's read-only. `let` promises a value that never changes — but `area` changes whenever `width` does, so `let` would be a lie. Read-only is expressed by *omitting the setter*, not by `let`.

## Property observers: reacting to change

Sometimes you want a normal stored property, but with a hook that fires when it changes:

```swift
class StepCounter {
    var steps: Int = 0 {
        willSet { print("about to set to \(newValue)") }
        didSet  { print("changed from \(oldValue) to \(steps)") }
    }
}

let counter = StepCounter()
counter.steps = 100
// about to set to 100
// changed from 0 to 100
```

`willSet` runs just *before* the assignment lands, and sees the incoming value as `newValue`. `didSet` runs just *after*, and sees the previous value as `oldValue`. The property itself is still stored — observers just wrap its assignments.

Now two gotchas that interviews love. First, predict: what does this print?

```swift
let counter = StepCounter()   // steps gets its initial value 0 here
```

Answer: nothing. Observers do *not* fire while the property is being given its initial value during initialization. They only observe changes to an already-initialized property. If you need setup logic to run for the initial value too, you have to call it yourself from `init`.

Second: inside `didSet`, you're allowed to assign to the property again — say, to clamp it:

```swift
var steps: Int = 0 {
    didSet {
        if steps < 0 { steps = 0 }   // does this loop forever?
    }
}
```

It doesn't. Setting a property from within its own `didSet` does not re-trigger the observers — Swift breaks the recursion for you. Clamping in `didSet` is a normal, safe pattern.

## Lazy properties: pay on first use

Suppose a class owns something expensive to build:

```swift
class DataManager {
    lazy var heavyResource = ExpensiveThing()
}

let manager = DataManager()      // ExpensiveThing NOT built yet
manager.heavyResource.use()      // built here, on first access
```

The `lazy` keyword defers a stored property's initialization until the first time someone reads it. Create a thousand `DataManager`s and never touch `heavyResource`, and `ExpensiveThing()` never runs.

`lazy` earns its keep in two situations: deferring genuinely expensive setup, and initial values that need `self`. A normal stored property's default value is computed before the instance exists, so it can't mention other properties. A `lazy` one is computed later, when `self` is fully formed:

```swift
class Profile {
    var username: String
    lazy var greeting = "Hello, \(username)!"   // uses another property — only legal because lazy

    init(username: String) { self.username = username }
}
```

Three caveats, each interview-grade:

- `lazy` must be `var`. First access mutates the instance — the property flips from "not yet set" to "set" — and `let` can't be mutated.
- It runs *once* and caches. It's not a computed property that re-derives on every read. In the `Profile` example, change `username` after reading `greeting` and `greeting` stays stale.
- It is *not* thread-safe. Two threads racing the first access can both run the initializer, and one result is silently thrown away — or worse. Don't use a plain `lazy var` for anything shared across threads.

## Type properties: one value for the whole type

Every property so far belonged to an instance — each `User` had its own `name`. A **type property** belongs to the type itself, so there's exactly one, shared everywhere:

```swift
struct Physics {
    static let gravity = 9.81
    static var simulationsRun = 0
}

Physics.gravity              // read on the type, no instance needed
Physics.simulationsRun += 1  // one shared counter
```

`static` works on structs, enums, and classes. Classes get one extra option: writing `class var` instead of `static var` for a computed type property allows subclasses to override it — `static` means final, `class` means overridable.

Here's the detail that makes `static let` genuinely important: Swift guarantees every global and static `let` is initialized *lazily, exactly once, thread-safely* — even if multiple threads race the first access. That's the guarantee `lazy var` lacks, and it's why the standard singleton pattern is:

```swift
class APIClient {
    static let shared = APIClient()   // lazy + once + thread-safe, for free
    private init() {}
}
```

No locks, no `dispatch_once` ceremony — the language guarantees it.

## let vs var meets structs vs classes

One last interaction, and it trips people up constantly. Predict which lines compile:

```swift
struct Point { var x = 0 }
class Counter { var count = 0 }

let p = Point()
let c = Counter()

p.x = 5        // ?
c.count = 5    // ?
c = Counter()  // ?
```

Answer: `p.x = 5` fails, `c.count = 5` compiles, `c = Counter()` fails.

For a struct, the variable *is* the value — `let p` freezes the entire value, every stored property included. For a class, the variable holds a *reference* to an object living elsewhere — `let c` freezes only the reference. You can't point `c` at a different `Counter`, but the object it points at remains as mutable as its own `var` properties allow.

Same keyword, two different guarantees, decided by whether the type is a value type or a reference type.

## Common pitfalls

- **Heavy work in a computed property.** The getter runs on *every* read; a caller looping over `rect.area` re-multiplies each time. Keep getters cheap, or store-and-update instead.
- **Expecting observers during `init`.** `willSet`/`didSet` stay silent while the initial value is assigned. Call your handler manually from `init` if needed.
- **Using `lazy var` as a shared singleton.** It's not thread-safe. Use `static let`, which the language guarantees is initialized once.
- **Expecting `lazy` to recompute.** It caches the first result forever; if the value should track its inputs, you wanted a computed property.
- **Marking a computed property `let`.** Won't compile — computed properties are always `var`; read-only means "no setter", not `let`.

## Interview lens

The favorite opener is "stored vs computed — how do you decide?" Say: store independent state; compute anything *derived* from other properties, because a computed value can never drift out of sync with its inputs. Then volunteer the trade-off — the getter runs on every access, so it must stay cheap — and you've given the complete answer.

Expect the `didSet` gotchas as rapid-fire follow-ups: no, observers don't fire during initialization; and no, assigning to the property inside its own `didSet` doesn't recurse — clamping there is safe and idiomatic.

For `lazy`, the three facts to state are: it must be `var` because first access mutates the instance, it computes once and caches rather than re-deriving, and it isn't thread-safe. That last one sets up the classic closer — "so how do you make a thread-safe singleton?" — where the answer is `static let shared`, because Swift guarantees static `let` initialization is lazy, exactly-once, and thread-safe at the language level.

And if handed the `let` instance question — "why can I mutate a property through a `let` class reference but not a `let` struct?" — explain that `let` freezes what the variable directly holds: the whole value for a struct, just the reference for a class. Framing it that way shows you understand value versus reference semantics, not just the compiler error.
