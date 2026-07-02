## The problem: even MVVM/MVP concentrate too much

MVVM and MVP pull *presentation* logic out of the view — but business logic, navigation, and data access can still cluster in the ViewModel/Presenter. **VIPER** takes single-responsibility to its logical extreme: it splits a screen into **five** roles, each with one job, connected by explicit protocols. The payoff is very testable, very modular code; the cost is a lot of boilerplate. VIPER is Uncle Bob's Clean Architecture mapped onto a per-screen module.

## The five roles

- **View** — passive UI. Forwards user actions to the Presenter; displays what it's told. (The `UIViewController`.)
- **Interactor** — the **business logic** for the use case. Fetches/saves data, applies rules. Knows nothing about UIKit.
- **Presenter** — the coordinator in the middle: receives view events, asks the Interactor for data, formats results into display-ready form, and tells the View and Router what to do.
- **Entity** — the plain model objects the Interactor works with.
- **Router** (a.k.a. Wireframe) — **navigation**: creates the module and pushes/presents the next screen.

A useful mnemonic: **View** shows, **Interactor** does the work, **Presenter** decides what to show, **Entity** is the data, **Router** moves between screens.

## Boundaries & protocols

Every connection between roles is a **protocol**, so each piece depends on abstractions, not concretions — and each is independently mockable/testable.

```swift
protocol ProfileViewProtocol: AnyObject { func show(_ title: String) }
protocol ProfilePresenterProtocol { func viewDidLoad(); func didTapSettings() }
protocol ProfileInteractorProtocol { func loadUser() async -> User }
protocol ProfileRouterProtocol { func routeToSettings() }

final class ProfilePresenter: ProfilePresenterProtocol {
    weak var view: ProfileViewProtocol?
    var interactor: ProfileInteractorProtocol!
    var router: ProfileRouterProtocol!

    func viewDidLoad() {
        Task { let user = await interactor.loadUser(); view?.show(user.name) }
    }
    func didTapSettings() { router.routeToSettings() }
}
```

The Presenter never imports UIKit; the Interactor never knows about the View; the Router owns navigation. Data flows View → Presenter → Interactor and back.

## Routing

The **Router** is VIPER's distinctive piece: it both **assembles the module** (wires View/Interactor/Presenter/Router together with their dependencies) and performs **navigation** to other modules. Pulling navigation into its own object (like the Coordinator pattern) is one of VIPER's genuinely good ideas — it keeps flow logic out of the view and presenter.

## Trade-offs & boilerplate

The honest ledger:

**Pros**
- Extreme separation → each role is tiny and unit-testable in isolation.
- Consistent structure across a large team/codebase.
- Business logic (Interactor) is fully decoupled from UIKit.

**Cons**
- **Massive boilerplate** — five types plus four+ protocols for *every* screen, even a trivial one. Teams use code generators (Generamba, templates) to cope.
- Steep learning curve; lots of indirection to follow a single action.
- Overkill for small apps or simple screens.

## When it's justified

VIPER pays off in **large, long-lived apps with big teams** where consistency and testability outweigh ceremony, and where screens are genuinely complex. For small apps, simple screens, or SwiftUI (whose declarative model fits it poorly), the boilerplate isn't worth it — MVVM or a lighter Clean-ish split is usually better. "Use VIPER everywhere" is a red flag; "use it where its structure earns its cost" is the mature stance.

## The interview lens

Be able to name the five roles and their **single** responsibilities: **V**iew (passive UI), **I**nteractor (business logic, UIKit-free), **P**resenter (mediator/formatting), **E**ntity (models), **R**outer (navigation + module assembly), all wired via protocols for testability. Stress that VIPER is essentially **Clean Architecture per screen** and that its standout idea — a dedicated **Router** for navigation — echoes the Coordinator pattern.

The senior judgment call is the trade-off: VIPER buys maximal separation and testability at the cost of **heavy boilerplate and indirection**, so it's justified in **large team codebases with complex screens**, and overkill for small apps or SwiftUI. Interviewers want to hear you weigh cost vs benefit, not evangelize.
