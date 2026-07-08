## The problem: a business rule trapped inside a view controller

Look at where this email rule lives:

```swift
final class RegistrationViewController: UIViewController {
    @IBAction func registerTapped() {
        guard emailField.text?.contains("@") == true else { return }  // business rule
        let entity = UserEntity(context: coreDataStack.context)       // Core Data
        entity.email = emailField.text
        try? coreDataStack.save()
    }
}
```

The rule "an email must contain @" is a fact about your business. It has nothing to do with UIKit or Core Data — yet here it can only run inside a view controller, next to a database call.

Now try to unit test that one rule. You need a `UIViewController`, a text field with text in it, and a live Core Data stack. Try to swap Core Data for a server API — you're editing UI code to do it.

**Clean Architecture** is Robert C. Martin's answer: put the business rules at the center of the app, and push UI, networking, and databases to the outer edge as replaceable details. One simple rule about which way code may depend on other code enforces the whole thing. This lesson builds that structure piece by piece.

## Four rings, one rule

Picture the app as concentric circles, most stable in the middle:

1. **Entities** — the center. Business objects and the rules that almost never change.
2. Use cases — application actions like "register a user" or "load the feed".
3. Interface adapters — translators: presenters, view models, repository implementations.
4. Frameworks and drivers — the edge. UIKit, SwiftUI, URLSession, Core Data, third-party SDKs.

The **Dependency Rule** governs everything: source-code dependencies point only inward. An inner ring never knows an outer ring exists.

Concretely: entities don't import the UI. Use cases don't import URLSession. The center of your app could compile with zero Apple frameworks linked.

The rest of this lesson walks the rings from the inside out, and then shows the trick that makes the rule physically possible.

## Entities: the rules that never change

Start at the center with a plain type:

```swift
struct Money {
    let amount: Decimal
    init?(amount: Decimal) {
        guard amount >= 0 else { return nil }   // money can't go negative
        self.amount = amount
    }
}
```

This is an entity. It encodes a rule the business has always had and will always have — no negative money. Nothing about screens, servers, or storage appears here.

Entities are the most stable code in the app. They change when the business changes, not when Apple ships a new framework.

## Use cases: one application action each

Move out one ring. A **use case** is a type that performs exactly one application action, orchestrating entities to do it. Some codebases call these interactors — same thing.

Here is "register a user", started small:

```swift
struct RegisterUser {
    func callAsFunction(_ user: User) async throws {
        guard user.email.contains("@") else { throw ValidationError.email }
        // ... now save the user. But where?
    }
}
```

The email rule from the view controller now lives here — plain Swift, trivially testable. But the use case has a problem: it needs to save the user, and saving means a database or a network. Both live at the outer edge, and the Dependency Rule forbids looking outward.

## How a use case talks to a database it can't see

The use case declares what it needs as a protocol, in its own ring:

```swift
protocol UserRepository {                    // owned by the use-case ring
    func save(_ user: User) async throws
}
```

Then it depends on that abstraction, never on anything concrete:

```swift
struct RegisterUser {
    let repository: UserRepository           // an abstraction, injected in
    func callAsFunction(_ user: User) async throws {
        guard user.email.contains("@") else { throw ValidationError.email }
        try await repository.save(user)      // calls outward — depends inward
    }
}
```

Quick prediction: what does this file need to import to compile — Core Data? URLSession?

Answer: nothing. `RegisterUser` has no idea whether `UserRepository` is backed by Core Data, a server API, or an in-memory dictionary in a test. That ignorance is the entire point.

This move has a name: **dependency inversion**. The natural arrow points outward — use case calls database. By putting a protocol in the middle, owned by the inner ring, the source-code arrow flips: the database code now depends on the use case's protocol. This is exactly the "D" in SOLID.

## Interface adapters: translators at the border

Move out another ring. The **interface adapters** layer translates between the inner world and the outer one, in both directions.

Going inward-to-outward, repository implementations satisfy the protocols the use cases declared:

```swift
final class CoreDataUserRepository: UserRepository {   // lives in the adapter ring
    func save(_ user: User) async throws {
        let entity = UserEntity(context: context)       // Core Data appears here,
        entity.email = user.email                       // and only here
        try context.save()
    }
}
```

Going outward-to-inward, presenters and view models convert use-case output into something a screen can render — turning a `User` into display strings and view state.

Notice the direction of knowledge. `CoreDataUserRepository` imports Core Data *and* knows about `UserRepository`. The use case knows about neither Core Data nor this class. All arrows still point inward.

## Frameworks live at the edge

The outermost ring holds UIKit, SwiftUI, URLSession, Core Data, Firebase — everything you didn't write. In this architecture they are details, not foundations.

Because inner rings depend only on protocols, swapping a detail touches one ring:

```swift
// Yesterday:
let register = RegisterUser(repository: CoreDataUserRepository())
// Today, after migrating storage:
let register = RegisterUser(repository: SwiftDataUserRepository())
```

The business logic did not change. Frameworks become plugins to your app — you can replace Core Data with SwiftData, or URLSession with a mock, without opening a single use case file.

That final wiring line lives at the **composition root** — the one place, near app launch, where concrete implementations are constructed and injected into the graph.

## Putting it on iOS

A pragmatic mapping onto an iOS project uses three modules:

- Domain — entities, use cases, and the repository protocols. No Apple frameworks beyond the standard library.
- Data — the repository implementations: networking, persistence, caching. Depends on Domain.
- Presentation — SwiftUI or UIKit plus view models. Also depends on Domain.

The app target is a thin shell that acts as the composition root, wiring Data implementations into Domain use cases and handing them to Presentation.

One related pattern worth naming: VIPER is essentially Clean Architecture applied per screen, with the same rings under different labels. It gets its own lesson.

## The honest trade-offs

What you gain:

- Business logic is framework-independent and trivially unit-testable — inject a mock repository and test `RegisterUser` in milliseconds, no simulator.
- Frameworks are swappable without touching rules.
- Boundaries are explicit; the compiler stops a use case from importing the UI.

What you pay:

- Lots of protocols, and mapping types across boundaries — a `UserEntity` in Data, a `User` in Domain, a `UserViewState` in Presentation.
- Indirection: following a call now hops through a protocol.
- For a small app, this is real overhead for little benefit.

Purist layering can feel ceremonious. Most teams apply a pragmatic subset — inward-pointing dependencies, use cases for real logic, injected boundaries where testing matters — rather than drawing every circle.

## Common pitfalls

- **Putting the protocol in the outer layer.** If `UserRepository` lives next to `CoreDataUserRepository`, the use case must import the data layer to see it — the arrow points outward again. The inner ring owns its protocols.
- **Layers as folders, not dependencies.** Folder names called `Domain/` mean nothing if `Domain` files import UIKit. The rule is about imports, and separate modules make the compiler enforce it.
- **Skipping the mapping and passing framework types inward.** Handing an `NSManagedObject` to a use case quietly welds the center to Core Data. Map to a plain entity at the boundary.
- **Applying the full ceremony to a two-screen app.** The cost is real; scale the architecture to the project.

## Interview lens

If asked "what's the Dependency Rule?", say: source-code dependencies point only inward — entities and use cases know nothing about UI, database, or network, so business logic compiles without frameworks and tests without mocking Apple. That single sentence is the core of Clean Architecture.

The natural follow-up is "how can the use case save to a database it doesn't know about?" That's your cue for dependency inversion: the use case owns a protocol describing what it needs, the outer layer implements it, and the concrete instance is injected at the composition root. The interviewer is checking you understand the arrow is *flipped* by the protocol, not just that "we use protocols".

Be ready to map it to an iOS project — Domain, Data, and Presentation modules with Domain framework-free — and to name VIPER as Clean Architecture applied per screen.

Finally, give the honest trade-off without being asked: you gain testability and swappable frameworks, you pay in protocols, cross-boundary type mapping, and indirection that's overkill for small apps. Saying "I apply the principles pragmatically, not every ring dogmatically" reads as experience, not laziness.
