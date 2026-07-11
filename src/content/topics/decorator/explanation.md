## The problem: adding behavior without a subclass explosion

Start with a plain coffee order:

```swift
protocol Beverage {
    var cost: Double { get }
    var description: String { get }
}

struct Espresso: Beverage {
    var cost: Double { 2.50 }
    var description: String { "Espresso" }
}
```

Now the shop wants to sell espresso with milk, or with milk *and* caramel, or with caramel alone, or with two shots of caramel. If you reach for subclassing, you need a class for every combination: `EspressoWithMilk`, `EspressoWithCaramel`, `EspressoWithMilkAndCaramel`, `EspressoWithDoubleCaramel`... Each new topping doubles the number of classes you need. That's the problem this lesson solves.

## Wrapping instead of subclassing

The fix is to make a topping *wrap* a beverage instead of subclassing it:

```swift
struct MilkDecorator: Beverage {
    let wrapped: Beverage
    var cost: Double { wrapped.cost + 0.50 }
    var description: String { wrapped.description + " + Milk" }
}
```

`MilkDecorator` conforms to the same `Beverage` protocol as `Espresso`, and it holds one internally — that's the `wrapped` property. When you ask a `MilkDecorator` for its `cost`, it doesn't know the price of milk in isolation; it asks the beverage it's wrapping for its cost, then adds its own contribution on top.

```swift
let espresso = Espresso()
let withMilk = MilkDecorator(wrapped: espresso)
print(withMilk.cost)         // 3.00
print(withMilk.description)  // "Espresso + Milk"
```

This is the **decorator** pattern: a type that implements the same interface as the object it wraps, forwards most calls to that wrapped object, and adds its own behavior around the forwarding. It's called decoration because each layer decorates — adds a little something to — the layer underneath, the same way a real decorator adds furniture to a room without rebuilding the walls.

## Stacking decorators

Add a second topping — caramel — as its own decorator:

```swift
struct CaramelDecorator: Beverage {
    let wrapped: Beverage
    var cost: Double { wrapped.cost + 0.75 }
    var description: String { wrapped.description + " + Caramel" }
}
```

Because `CaramelDecorator` also conforms to `Beverage`, it can wrap *anything* that's a `Beverage` — including another decorator:

```swift
let fancy = CaramelDecorator(wrapped: MilkDecorator(wrapped: Espresso()))
print(fancy.cost)         // 3.75
print(fancy.description)  // "Espresso + Milk + Caramel"
```

Predict before reading on: what does `fancy.cost` evaluate to, step by step?

Answer: it's a chain. `fancy.cost` asks its wrapped `MilkDecorator` for its cost (which asks *its* wrapped `Espresso` for 2.50, then adds 0.50 for milk = 3.00), then `CaramelDecorator` adds its own 0.75 on top = 3.75. Each layer only knows about the layer directly inside it — no layer needs to know the whole stack exists.

Want double caramel? Wrap a `CaramelDecorator` in another `CaramelDecorator` — no new type needed:

```swift
let doubleCaramel = CaramelDecorator(wrapped: CaramelDecorator(wrapped: Espresso()))
print(doubleCaramel.cost)  // 4.00
```

Every combination of toppings is now just a different nesting order, built at runtime from a handful of small types, instead of one hardcoded class per combination.

## Protocol decorators

The coffee example decorates a value that computes properties. Decorators are just as common wrapping something that *does* things — a service with a method, not just data. This is where the pattern earns the name **protocol decorator**: a type that implements a protocol by wrapping another implementer of the same protocol.

```swift
protocol ImageLoader {
    func load(url: URL) async throws -> UIImage
}

struct NetworkImageLoader: ImageLoader {
    func load(url: URL) async throws -> UIImage {
        let (data, _) = try await URLSession.shared.data(from: url)
        guard let image = UIImage(data: data) else { throw LoaderError.badData }
        return image
    }
}
```

Now decorate it with caching, without touching `NetworkImageLoader` at all:

```swift
final class CachingImageLoader: ImageLoader {
    private let wrapped: ImageLoader
    private var cache: [URL: UIImage] = [:]

    init(wrapped: ImageLoader) { self.wrapped = wrapped }

    func load(url: URL) async throws -> UIImage {
        if let cached = cache[url] { return cached }
        let image = try await wrapped.load(url: url)
        cache[url] = image
        return image
    }
}
```

`CachingImageLoader` conforms to `ImageLoader`, so anywhere the app expects an `ImageLoader`, a decorated one works exactly the same:

```swift
let loader: ImageLoader = CachingImageLoader(wrapped: NetworkImageLoader())
let image = try await loader.load(url: someURL)   // caller doesn't know or care it's cached
```

Stack another decorator for logging, the same way:

```swift
final class LoggingImageLoader: ImageLoader {
    private let wrapped: ImageLoader
    init(wrapped: ImageLoader) { self.wrapped = wrapped }

    func load(url: URL) async throws -> UIImage {
        print("loading \(url)")
        return try await wrapped.load(url: url)
    }
}

let loader: ImageLoader = LoggingImageLoader(wrapped: CachingImageLoader(wrapped: NetworkImageLoader()))
```

Logging, caching, and networking are three separate, independently testable types, composed in one line — none of them needed to know the others exist.

## Decorator vs subclassing

Both approaches let you extend behavior, but they extend it differently. Predict: with `LoggingImageLoader` wrapping `CachingImageLoader` wrapping `NetworkImageLoader`, can you swap the caching layer out at runtime — say, disable caching for one screen but keep it everywhere else?

Answer: yes, trivially — just build the stack without `CachingImageLoader` for that one screen: `LoggingImageLoader(wrapped: NetworkImageLoader())`. A subclass hierarchy can't do this. If `CachingImageLoader` were `NetworkImageLoader`'s *subclass*, caching would be baked into that one inheritance branch permanently; you couldn't opt out per call site without yet another subclass.

| | Decorator (composition) | Subclassing |
|---|---|---|
| Combine N behaviors | Nest N small wrapper types, any order | Need up to 2^N subclasses |
| Change behavior at runtime | Rebuild the stack you hand out | Fixed at compile time per subclass |
| Coupling | Each layer only depends on the protocol | Subclass depends on superclass internals |

Subclassing is still the right tool when behavior genuinely *is* a specialization — a `PremiumImageLoader` that really is a kind of `ImageLoader` with no wrapping involved. Decoration is the right tool when you're *adding* independent, combinable behaviors around something, especially when the number of combinations would otherwise explode.

## Common pitfalls

- **Forgetting to forward the call.** A decorator that doesn't call `wrapped.load(...)` (or whatever the wrapped method is) silently breaks the underlying behavior — always forward unless you deliberately mean to skip it.
- **Decorating in the wrong order and being surprised.** `LoggingImageLoader(wrapped: CachingImageLoader(...))` logs every call, even cache hits; swap the order and you'd only log on cache misses, since the logger would sit *inside* the cache instead of outside it.
- **Reaching for decorator when a simple parameter would do.** If the "extra behavior" is really just a configuration flag, a decorator adds indirection for no benefit — a plain `enum` option or default argument is simpler.

## Interview lens

If asked to explain decorator, lead with the shape: a type that conforms to the same protocol as the thing it wraps, holds a reference to it, forwards calls, and adds behavior before or after forwarding. Mention that it composes — decorators can wrap decorators — which is what makes it scale better than subclassing when behaviors combine.

If asked to compare it to subclassing, give the concrete number: N independent behaviors need up to 2^N subclasses to cover every combination, but only N decorator types nested in different orders. That's the practical reason interviewers care about this pattern — it's a direct antidote to combinatorial subclass explosion.

If asked for a real example, `URLSession`-wrapping caching or logging layers, or SwiftUI view modifiers (`.padding().background().cornerRadius()`, each returning a new wrapped view) are both genuine decorator usage in everyday Swift — worth naming to show you recognize the pattern outside of textbook code.
