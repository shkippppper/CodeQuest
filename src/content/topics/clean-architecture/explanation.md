## The problem: business rules held hostage by frameworks

When your core logic is tangled with UIKit, URLSession, and Core Data, changing a framework — or testing a rule — means dragging the whole stack along. **Clean Architecture** (Robert C. Martin) inverts that: put the **business rules at the center**, independent of any framework, and push UI, networking, and databases to the **outer edge** as replaceable details. The tool that enforces it is one simple rule about which way dependencies may point.

## Layers & the dependency rule

Picture concentric circles, most abstract in the middle:

1. **Entities** (center) — enterprise-wide business objects and rules.
2. **Use Cases** — application-specific business logic ("register user", "load feed").
3. **Interface Adapters** — presenters, view models, gateways: translate between use cases and the outside world.
4. **Frameworks & Drivers** (edge) — UIKit/SwiftUI, URLSession, Core Data, third-party SDKs.

The **Dependency Rule**: source-code dependencies point **only inward**. An inner layer never knows about an outer one. Entities don't import the UI; use cases don't import URLSession. The center could be compiled with zero Apple frameworks.

## Entities & use cases

- **Entities** are plain types encoding the most stable rules (a `Money` type that can't go negative). They rarely change.
- **Use cases** (a.k.a. interactors) orchestrate entities to fulfill one application action. A use case depends on **abstractions** (protocols) for anything external:

```swift
protocol UserRepository {                 // a boundary the use case owns
    func save(_ user: User) async throws
}

struct RegisterUser {                      // a use case
    let repository: UserRepository         // depends on the abstraction
    func callAsFunction(_ user: User) async throws {
        guard user.email.contains("@") else { throw ValidationError.email }
        try await repository.save(user)
    }
}
```

`RegisterUser` has no idea whether `UserRepository` is backed by Core Data, a network API, or an in-memory mock — that's the point.

## Interface adapters

This layer **adapts** the inner world to the outer. Presenters/ViewModels convert use-case output into view state; **gateways/repositories** implement the inner protocols using concrete frameworks. The concrete `CoreDataUserRepository: UserRepository` lives here, satisfying the protocol the use case declared inward.

## Frameworks at the edge

UIKit, SwiftUI, URLSession, Core Data, Firebase — all live at the outermost ring as **details**. Because inner layers depend only on protocols, you can swap Core Data for SwiftData, or URLSession for a mock, **without touching business logic**. Frameworks become plugins to your app, not its foundation.

## Dependency inversion makes it work

How can a use case *call* the database without depending on it? **Dependency inversion**: the use case **owns the protocol** (`UserRepository`) it needs; the outer layer **implements** it and is injected in. The arrow that would naturally point outward (use case → database) is flipped by putting an interface in the middle — which is exactly the "D" in SOLID.

## Mapping to iOS & pros/cons

A pragmatic iOS mapping: **Domain** module (Entities + Use Cases + repository protocols, no Apple frameworks) ← **Data** module (repository implementations: network, persistence) and **Presentation** (SwiftUI/UIKit + ViewModels). Wiring happens at the composition root.

**Pros:** business logic is framework-independent and trivially unit-testable (inject mocks); frameworks are swappable; boundaries are explicit.
**Cons:** lots of protocols, mapping types across boundaries, and indirection — real overhead that's overkill for small apps. Purist layering can feel ceremonious; most teams apply a pragmatic subset.

## The interview lens

The heart of it: *"What's the Dependency Rule?"* — source dependencies point **only inward**; inner layers (Entities, Use Cases) know nothing of outer layers (UI, DB, network), so **business logic is independent of frameworks and fully testable**. Explain that this is achieved by **dependency inversion**: the inner layer defines the protocol it needs and the outer layer implements it, injected at the composition root — flipping the natural dependency arrow.

Be ready to map it to iOS (Domain/Data/Presentation modules) and to give the honest trade-off: framework-independence and testability vs. **boilerplate, type-mapping across boundaries, and indirection** that's overkill for small projects. Note VIPER is Clean Architecture applied per screen. The mature answer applies the *principles* (inward dependencies, use cases, injected boundaries) pragmatically rather than dogmatically drawing every circle.
