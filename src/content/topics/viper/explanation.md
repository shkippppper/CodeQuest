## Even a good ViewModel collects too many jobs

MVVM and MVP pulled presentation logic out of the view. But watch what a real ViewModel looks like six months into a project:

```swift
final class ProfileViewModel: ObservableObject {
    func load() async { /* fetch, decode, cache */ }          // data access
    func applyDiscount() { /* pricing rules */ }              // business logic
    func formatJoinDate() -> String { /* ... */ }             // presentation
    func openSettings() { /* build & push a screen */ }       // navigation
}
```

Four unrelated jobs, one class. The view is clean now — but the clutter didn't disappear, it moved.

**VIPER** takes the single-responsibility idea to its logical extreme: split every screen into *five* roles, each with exactly one job, connected only by protocols. The payoff is very testable, very modular code. The cost is a lot of typing. This lesson shows both honestly.

## Five roles, one job each

The name is an acronym. Here's each letter, with its single responsibility:

- **View** — passive UI, the `UIViewController`. Forwards user actions to the Presenter; displays what it's told. Decides nothing.
- **Interactor** — the *business logic* for this use case. Fetches and saves data, applies rules. Knows nothing about UIKit.
- **Presenter** — the hub. Receives view events, asks the Interactor for data, formats results into display-ready form, tells the View what to show and the Router where to go.
- **Entity** — the plain model objects the Interactor works with.
- **Router** — *navigation*. Builds this screen's module and pushes or presents the next one.

A mnemonic that sticks: the View shows, the Interactor does the work, the Presenter decides what to show, the Entity is the data, the Router moves between screens.

Notice the lineage — View and Presenter are exactly MVP's passive view and presenter. VIPER's additions are the Interactor, so business logic stops squatting in the presenter, and the Router, so navigation stops squatting in the view controller.

## Every boundary is a protocol

No role holds a concrete reference to another. Each connection is a protocol, so every piece depends on an abstraction it can be handed a fake of:

```swift
protocol ProfileViewProtocol: AnyObject { func show(_ title: String) }
protocol ProfilePresenterProtocol      { func viewDidLoad(); func didTapSettings() }
protocol ProfileInteractorProtocol     { func loadUser() async -> User }
protocol ProfileRouterProtocol         { func routeToSettings() }
```

Four protocols before a line of implementation. Keep that in mind for the trade-offs section.

Now watch the Presenter sit at the hub, touching everything only through those abstractions:

```swift
final class ProfilePresenter: ProfilePresenterProtocol {
    weak var view: ProfileViewProtocol?
    var interactor: ProfileInteractorProtocol!
    var router: ProfileRouterProtocol!
}
```

The `weak var view` is MVP's rule again — the view owns the presenter, so the back-reference must be weak or the pair retain each other.

Fill in the two events:

```swift
    func viewDidLoad() {
        Task {
            let user = await interactor.loadUser()   // Interactor does the work
            view?.show(user.name)                    // View displays the result
        }
    }

    func didTapSettings() {
        router.routeToSettings()                     // Router handles navigation
    }
```

Trace the dependencies: the Presenter never imports UIKit. The Interactor has no idea a View exists. The Router alone knows what "go to settings" means. Data flows View → Presenter → Interactor and back up the same path.

### Predict: which roles does a tap touch?

The user taps the Settings button. Which of the five roles participate before the settings screen appears?

Answer: three — View, Presenter, Router. The View forwards `didTapSettings()` to the Presenter; the Presenter tells the Router; the Router builds and presents the next module. The Interactor and Entity are never involved, because no business logic ran. Each role only wakes up when its one job is needed — that's the design working.

## The Router assembles and navigates

The Router is VIPER's most distinctive piece, and it has two duties. The obvious one is navigation. The less obvious one: it *builds the module* — creating all five pieces and wiring them together:

```swift
final class ProfileRouter: ProfileRouterProtocol {
    weak var viewController: UIViewController?

    static func makeModule() -> UIViewController {
        let view = ProfileViewController()
        let presenter = ProfilePresenter()
        let interactor = ProfileInteractor()
        let router = ProfileRouter()

        view.presenter = presenter           // wire every connection
        presenter.view = view
        presenter.interactor = interactor
        presenter.router = router
        router.viewController = view
        return view
    }

    func routeToSettings() {
        let settings = SettingsRouter.makeModule()   // ask the next module's router
        viewController?.navigationController?.pushViewController(settings, animated: true)
    }
}
```

A **module** is VIPER's word for one screen's complete five-piece unit. Modules talk to each other router-to-router: to leave a screen, your router asks the destination's router for a built module and presents it.

Pulling navigation into its own object is one of VIPER's genuinely good ideas — flow logic stays out of the view and the presenter. If it sounds familiar, it should: it's the same instinct as the Coordinator pattern, which has its own lesson.

## The honest ledger

You've now seen the price tag: four-plus protocols, five types, and a wiring function — for *one* screen. Here's the full accounting.

What you gain:

- Extreme separation — each role is tiny and unit-testable in isolation, with every neighbor mockable through its protocol.
- Consistent structure — in a large codebase, every screen looks the same, so any engineer can navigate any module.
- Business logic in the Interactor is fully decoupled from UIKit.

What you pay:

- Boilerplate, massively — five types plus the protocol stack for every screen, even a trivial static one. Teams cope with code generators like Generamba or Xcode templates that stamp out module skeletons.
- A steep learning curve, and heavy indirection — following one button tap means hopping across three or four files.
- Real overkill for small apps and simple screens.

VIPER is Uncle Bob's Clean Architecture mapped onto a per-screen module — Clean Architecture gets its own lesson, but the shared DNA is worth knowing now: dependencies point inward, business logic at the center knows nothing about frameworks at the edge.

## When the price is worth paying

The pattern earns its cost in large, long-lived apps with big teams — where enforced consistency and per-role testability outweigh ceremony, and where screens are genuinely complex.

It's the wrong tool for small apps, simple screens, and SwiftUI — whose declarative, state-driven views fit VIPER's imperative command-the-view structure poorly. There, MVVM or a lighter Clean-ish split serves better.

The mature stance, and the one interviews reward: "use VIPER everywhere" is a red flag; "use it where its structure earns its cost" is the answer.

## Common pitfalls

- **Logic drifting into the Presenter.** If the Presenter starts fetching or applying business rules, you've rebuilt a fat ViewModel with extra protocols. Work goes in the Interactor; the Presenter formats and coordinates.
- **A strong `view` reference in the Presenter.** Same retain cycle as MVP — view owns presenter, so the back-reference is `weak`.
- **Skipping the protocols "to save time."** Concrete cross-references quietly delete the mockability that justified the boilerplate.
- **Adopting VIPER for a three-screen app.** The ceremony has a real cost; spend it where complexity and team size repay it.

## Interview lens

First, be able to name the five roles with one-line responsibilities, without hesitating: View is passive UI, Interactor is UIKit-free business logic, Presenter mediates and formats, Entity is the plain models, Router does navigation plus module assembly — all wired through protocols so each piece tests in isolation. Saying "the Router also *builds* the module" marks you as someone who has actually written one.

Second, place it in the family tree: VIPER is essentially Clean Architecture applied per screen, its View–Presenter pair is MVP's, and its standout idea — a dedicated Router — is the same instinct as the Coordinator pattern.

Third, and most important: the trade-off is the real question. Say plainly that VIPER buys maximal separation and testability at the price of heavy boilerplate and indirection — five types and four-plus protocols per screen, code generators just to cope — so it's justified in large-team, long-lived, complex codebases and overkill for small apps or SwiftUI. Interviewers are testing whether you weigh cost against benefit, not whether you can evangelize.
