## The problem: a hierarchy that no longer fits reality

Start with a small class hierarchy for game characters:

```swift
class Character {
    var health = 100
    func attack() { print("swings a weapon") }
}

class FlyingCharacter: Character {
    func fly() { print("takes off") }
}
```

This works fine until design adds a `Dragon`. A dragon flies *and* attacks with fire instead of a weapon *and* can also swim across rivers. Where does `Dragon` go in this tree? It isn't quite a `FlyingCharacter` (its attack is wrong), and Swift classes only allow a single parent — so it can't also inherit swimming behavior from some `SwimmingCharacter` class you'd want to write.

This is the core problem with building behavior through **inheritance** — a class taking on the properties and methods of a parent class by subclassing it. It models "what a thing *is*" as a single fixed line of ancestry, and real-world capabilities don't usually arrange themselves into one line.

## Inheritance pitfalls

Watch what happens as the hierarchy grows to fit new requirements:

```swift
class Character { func attack() { print("swings a weapon") } }
class FlyingCharacter: Character { func fly() { print("takes off") } }
class FireBreathingFlyingCharacter: FlyingCharacter {
    override func attack() { print("breathes fire") }
}
```

Every new combination of abilities forces a new subclass. Add swimming and you need `FireBreathingFlyingSwimmingCharacter`. This is the **combinatorial explosion** problem: N independent abilities need up to 2^N classes to cover every combination, because a class tree only has one branch per type.

There's a second, sharper problem. Look at `override func attack()` above — the subclass is *replacing* behavior the parent promised. Now imagine code that trusts the parent's contract:

```swift
func startBattle(_ character: FlyingCharacter) {
    character.attack()   // caller expects "swings a weapon" behavior
}
```

Predict: does `startBattle` still behave the way its author expected once it's called with a `FireBreathingFlyingCharacter`?

Answer: not necessarily. The caller wrote `attack()` expecting weapon-swinging semantics — timing, messaging, whatever the base class promised — and the override silently changed that. This is exactly the trap the **Liskov Substitution Principle** warns about: a subclass should be usable anywhere its parent is expected, without surprising the caller. Deep inheritance trees make that promise harder to keep, because every layer down can override and quietly rewrite what a method means.

Deep hierarchies also create **tight coupling**: a change to `Character` can ripple through every subclass several layers down, and a bug fix in the base class might break behavior three levels away that nobody remembers depends on it.

## Composition & protocols

The alternative is to stop asking "what is this thing, in one line of ancestry?" and instead ask "what can this thing *do*?" — then assemble those capabilities as separate, swappable parts.

```swift
protocol Flying {
    func fly()
}

protocol Attacking {
    func attack()
}
```

A capability becomes its own small piece, not a slot in a family tree. Now build the dragon by *holding* implementations of each capability rather than inheriting them:

```swift
struct FireBreath: Attacking {
    func attack() { print("breathes fire") }
}

struct Wings: Flying {
    func fly() { print("takes off") }
}

class Dragon {
    let flying: Flying = Wings()
    let attacking: Attacking = FireBreath()

    func startTurn() {
        flying.fly()
        attacking.attack()
    }
}
```

`Dragon` doesn't inherit fire-breathing or flight — it *has* an object that knows how to do each one, and delegates to it. This is **composition**: building a type's behavior by combining smaller, independent objects instead of subclassing. Add swimming by giving `Dragon` a third stored property that conforms to a `Swimming` protocol — no new class needed anywhere in a tree, and no existing type has to change.

## Has-a vs is-a

The names for these two relationships are worth knowing cold, because they're how you'll justify a design choice in review:

```swift
class FlyingCharacter: Character { }   // is-a: FlyingCharacter IS-A Character
class Dragon {
    let flying: Flying = Wings()       // has-a: Dragon HAS-A Flying capability
}
```

**Is-a** relationships (inheritance) make sense when a subtype really is a more specific version of its parent, in every context the parent is used — a `Square` really is a `Shape` for every operation a `Shape` supports. **Has-a** relationships (composition) make sense when a type merely *uses* or *contains* a capability that could plausibly change independently, or that other unrelated types also need.

The dragon case is has-a: flying isn't what makes a dragon a dragon, it's one thing a dragon happens to do — and plenty of unrelated types (birds, planes, spells) also fly. Reach for composition whenever you catch yourself modeling a *capability* as if it were an *identity*.

## Protocol-oriented composition

Swift pushes this further than "hold a protocol-typed property." Protocols can supply **default implementations** through extensions, so a capability comes with working behavior for free, not just a method signature to fill in:

```swift
protocol Loggable {
    var id: String { get }
}

extension Loggable {
    func log(_ message: String) {
        print("[\(id)] \(message)")
    }
}
```

Any type — struct, class, or enum — that conforms to `Loggable` gets `log(_:)` automatically, with zero subclassing:

```swift
struct Order: Loggable {
    let id: String
}

let order = Order(id: "A-1")
order.log("created")   // "[A-1] created"
```

This is **protocol-oriented composition**: mixing in ready-made behavior by conforming to protocols, rather than inheriting it from a single superclass. A type can conform to as many protocols as it needs — there's no single-parent limit — so `Order` could also conform to `Cacheable`, `Comparable`, and `Codable` at once, picking up default behavior from each independently.

## Examples: rebuilding the dragon fully

Put it together — a character type with no inheritance tree at all, just composed capabilities:

```swift
protocol Flying { func fly() }
protocol Swimming { func swim() }
protocol Attacking { func attack() }

struct Wings: Flying { func fly() { print("takes off") } }
struct Fins: Swimming { func swim() { print("dives in") } }
struct FireBreath: Attacking { func attack() { print("breathes fire") } }

struct Dragon {
    let flying: Flying
    let swimming: Swimming
    let attacking: Attacking
}

let dragon = Dragon(flying: Wings(), swimming: Fins(), attacking: FireBreath())
```

Compare a `Mermaid` that swims and attacks but never flies — it simply omits the `flying` capability, with no awkward "empty override" of a `fly()` method it doesn't want:

```swift
struct Mermaid {
    let swimming: Swimming = Fins()
    let attacking: Attacking = FireBreath()
}
```

Neither type sits in a shared class hierarchy, yet both reuse the exact same `Fins` and `FireBreath` implementations. That reuse without a shared ancestor is the payoff composition is built for.

## Common pitfalls

- **Reaching for a protocol for every single method.** A type with one trivial behavior and no plausible variation doesn't need a capability protocol — that's ceremony without benefit.
- **Forcing composition where is-a genuinely fits.** A `Square` really is a `Shape` for every shape operation; inheritance isn't wrong everywhere, just wrong as the default for capabilities.
- **Composing so many tiny protocols that the type's own responsibility gets lost** in a pile of delegated properties — group capabilities that actually belong together.

## Interview lens

If asked "why prefer composition over inheritance," lead with the concrete failure modes: inheritance caps you at one parent, so combining independent abilities forces a combinatorial explosion of subclasses, and deep hierarchies make it easy to violate Liskov substitution by silently overriding what a method means several layers down.

If asked how Swift specifically supports this, mention protocols with **default implementations via extensions** — a type can conform to many protocols and pick up ready-made behavior from each, with no "one parent" ceiling.

If given a design with a deep class tree, ask out loud whether each relationship is really is-a or actually has-a — that question alone usually reveals which layers should become protocols a type holds instead of a superclass it inherits.
