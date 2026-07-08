## Testable UI logic, without the binding machinery

MVVM bought you testable presentation logic, but look at what the UIKit version cost:

```swift
viewModel.$title
    .receive(on: DispatchQueue.main)
    .sink { [weak self] in self?.titleLabel.text = $0 }
    .store(in: &cancellables)
```

A Combine subscription per property, cancellable storage, main-queue hops. In UIKit, binding is manual — and not every team wants a reactive layer in the project at all.

**MVP** — Model-View-Presenter — reaches the same destination, logic out of the view and fully testable, by a plainer road. No bindings, no observation. Just ordinary method calls:

```swift
view.showTitle("Ada")
view.showLoading(false)
```

An object called the presenter *tells* the view what to display, one imperative call at a time. This lesson builds that object.

## Presenter versus ViewModel: push versus pull

Both patterns extract logic from the view. The difference is the direction of the conversation.

A ViewModel exposes observable state and doesn't know the view exists — the view watches it:

```swift
@Published var title = ""        // the view binds to this and reacts
```

A **Presenter** flips it. It holds a reference to the view — through a protocol — and calls it directly:

```swift
view?.showTitle("Ada")           // the presenter commands, the view obeys
```

One line each, and the whole distinction is visible: MVVM is pull/observe, MVP is push/command. The presenter drives; the view obeys.

## The passive view

Because the presenter gives all the orders, the View in MVP is **passive** — it contains zero presentation logic. It does exactly two things: forward user events to the presenter, and execute "display this" commands.

In UIKit, the view controller *is* the View — but look how thin it gets:

```swift
final class ProfileViewController: UIViewController {
    var presenter: ProfilePresenter!

    override func viewDidLoad() {
        super.viewDidLoad()
        presenter.viewDidLoad()          // forward the event — decide nothing
    }

    @IBAction func didTapRefresh() {
        presenter.didTapRefresh()        // forward, decide nothing
    }
}
```

No formatting, no if-statements, no state. Every interesting decision now happens somewhere the tests can reach.

Now add the other half of its job — obeying display commands:

```swift
    // dumb display methods the presenter calls
    func showTitle(_ text: String) { titleLabel.text = text }
    func showLoading(_ on: Bool)   { spinner.isHidden = !on }
```

Each method is one line of pure UIKit plumbing. If a method in the view grows an `if`, logic is leaking back in.

## The contract: a pair of protocols

How does the presenter call the view without depending on `UIViewController`? MVP's defining structure is the **contract** — two protocols describing what each side may say to the other:

```swift
protocol ProfileView: AnyObject {           // what the presenter can tell the view
    func showTitle(_ text: String)
    func showLoading(_ on: Bool)
}

protocol ProfilePresenter {                 // what the view can tell the presenter
    func viewDidLoad()
    func didTapRefresh()
}
```

The view controller conforms to `ProfileView`. The presenter implementation conforms to `ProfilePresenter` and talks only to the abstraction:

```swift
final class ProfilePresenterImpl: ProfilePresenter {
    weak var view: ProfileView?

    func viewDidLoad() {
        view?.showLoading(true)
        // fetch the model, then:
        view?.showTitle("Ada")
        view?.showLoading(false)
    }

    func didTapRefresh() { viewDidLoad() }
}
```

The presenter never imports UIKit and never names a concrete view class. Anything conforming to `ProfileView` will do — which is the door the tests walk through.

### Why `weak var view`

Predict: the view controller strongly owns its presenter. The presenter holds a reference back to the view controller. If that back-reference were strong, what happens when the screen closes?

Answer: nothing gets freed. The two objects hold each other in a retain cycle, both `deinit`s stay silent, and every visit to the screen leaks another pair. `weak var view` breaks the cycle — the same rule as every delegate back-reference in UIKit. This is the one memory detail MVP interviews always touch.

## Testing: mock the view, assert the calls

Here's the payoff. The presenter only knows `ProfileView`, so a test can hand it a fake:

```swift
final class MockView: ProfileView {
    var titles: [String] = []
    func showTitle(_ text: String) { titles.append(text) }
    func showLoading(_ on: Bool) {}
}
```

The mock just records what it was told. Now exercise the presenter — no UIKit anywhere:

```swift
func testLoadShowsTitle() {
    let view = MockView()
    let presenter = ProfilePresenterImpl()
    presenter.view = view

    presenter.viewDidLoad()

    XCTAssertEqual(view.titles, ["Ada"])
}
```

Notice what the assertion checks: not a state value, but *which methods were called with what*. Verifying behavior by recording calls is called **interaction-based testing**, and MVP fits it naturally — the presenter's entire output is method calls on the view.

Contrast with MVVM, where you assert on published state values. Same confidence, different style of proof.

## MVP or MVVM — the honest comparison

| | MVP | MVVM |
|---|---|---|
| View sync | Presenter *calls* the view (imperative) | View *binds* to observable state |
| Who knows whom | Presenter holds the view, via protocol | ViewModel doesn't know the view exists |
| Needs a reactive layer? | No | Usually — Combine or observation |
| Test style | Interaction — mock the view, assert calls | State — assert published values |
| SwiftUI fit | Awkward — SwiftUI is binding-first | Natural |

The SwiftUI row deserves a word. SwiftUI views are declarative — they render from state and can't be "commanded" by an outside object — so a presenter that calls `view.showTitle(...)` has nothing idiomatic to call. MVP is a UIKit pattern.

So the placement rule: MVP shines in UIKit codebases that want testability without adopting a reactive stack; MVVM is the natural choice in SwiftUI. Both beat plain MVC on separation and testability — the choice between them is about binding appetite and framework.

## Common pitfalls

- **A strong `view` reference in the presenter.** Retain cycle with the view controller; both leak. The back-reference is `weak`.
- **Logic creeping into the "passive" view.** A `showUser(_ user: User)` method that formats dates in the view controller has smuggled presentation logic back into UIKit. Display methods take display-ready values.
- **A one-sided contract.** If only the view protocol exists and the view holds a concrete presenter class, the view can't be tested against a mock presenter. The contract is a *pair* of protocols.
- **Forcing MVP onto SwiftUI.** There's no imperative view to command; use MVVM there.

## Interview lens

The core question is "MVP versus MVVM?" and the answer that lands is the direction of the conversation: both pull logic out of the view for testability, but the presenter holds a reference to the view — through a protocol — and drives it imperatively with calls like `view.showTitle(...)`, while the ViewModel exposes observable state the view binds to and never knows the view exists. Add the practical consequence: MVP needs no reactive layer, MVVM usually leans on one.

Follow with the testing distinction, because it falls straight out of the design: MVP tests mock the view and assert on interactions — which methods were called with what — while MVVM tests assert on state values. Interviewers hear "interaction versus state testing" as a sign you've actually written both.

Then the checklist details that separate reciters from practitioners: the view is passive, meaning zero logic — forward events, obey display calls; the contract is a pair of protocols; and the presenter's view reference is `weak`, or the presenter and view controller retain each other. Close with fit: MVP suits UIKit teams avoiding a reactive stack, MVVM suits SwiftUI's binding-first world.
