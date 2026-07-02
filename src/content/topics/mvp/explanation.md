## The problem: testable UI logic without reactive binding

MVVM makes presentation logic testable, but it leans on **binding** (Combine/observation) to sync the view. In UIKit that binding is manual and sometimes heavy, and not every team wants a reactive layer. **MVP (Model-View-Presenter)** reaches the same goal — logic out of the view, fully testable — with **explicit method calls through a protocol** instead of bindings. The view is "passive": it does nothing but what the presenter tells it.

## Presenter vs ViewModel

Both extract logic from the view, but they differ in *how they talk to the view*:

- A **ViewModel** exposes **observable state** the view *binds* to; it doesn't know the view exists.
- A **Presenter** holds a **reference to the view (via a protocol)** and **calls it imperatively**: `view.showTitle("Ada")`, `view.showLoading(true)`.

So MVVM is pull/observe; MVP is push/command. The presenter drives; the view obeys.

## The passive view

The View in MVP is **passive**: it contains no presentation logic. It forwards user actions to the presenter and exposes simple "display this" methods the presenter calls. In UIKit, the view controller *is* the View — but a thin one.

```swift
final class ProfileViewController: UIViewController, ProfileView {
    var presenter: ProfilePresenter!

    override func viewDidLoad() {
        super.viewDidLoad()
        presenter.viewDidLoad()          // forward the event
    }
    @IBAction func didTapRefresh() { presenter.didTapRefresh() }

    // ProfileView methods — dumb display only
    func showTitle(_ text: String) { titleLabel.text = text }
    func showLoading(_ on: Bool) { spinner.isHidden = !on }
}
```

## Contracts/protocols

MVP is defined by a **contract** — a pair of protocols connecting presenter and view:

```swift
protocol ProfileView: AnyObject {           // what the presenter can tell the view
    func showTitle(_ text: String)
    func showLoading(_ on: Bool)
}

protocol ProfilePresenter {                 // what the view can tell the presenter
    func viewDidLoad()
    func didTapRefresh()
}

final class ProfilePresenterImpl: ProfilePresenter {
    weak var view: ProfileView?             // weak — avoid a retain cycle
    func viewDidLoad() { view?.showTitle("Ada") }
    func didTapRefresh() { /* reload, then view?.showTitle(...) */ }
}
```

Note the **`weak var view`**: the view controller owns the presenter, and the presenter refers back to the view — a strong back-reference would be a retain cycle.

## Testability

Because the presenter talks to the view only through `ProfileView`, you test it with a **mock view** — no UIKit, no bindings:

```swift
final class MockView: ProfileView {
    var titles: [String] = []
    func showTitle(_ text: String) { titles.append(text) }
    func showLoading(_ on: Bool) {}
}

func testLoadShowsTitle() {
    let view = MockView()
    let presenter = ProfilePresenterImpl()
    presenter.view = view
    presenter.viewDidLoad()
    XCTAssertEqual(view.titles, ["Ada"])
}
```

You assert on **interactions** (which view methods were called with what) rather than on observable state — a natural fit for interaction-based testing.

## MVP vs MVVM

| | MVP | MVVM |
|---|---|---|
| View sync | Presenter **calls** the view (imperative) | View **binds** to observable state |
| View→logic | Protocol reference (`view.show…`) | Data binding |
| Needs reactive layer? | No | Usually (Combine/observation) |
| Test style | Interaction (mock the view) | State (assert published values) |
| SwiftUI fit | Awkward (SwiftUI is declarative/binding-first) | Natural |

MVP shines in **UIKit** codebases that want testability without a reactive stack; **MVVM** is the natural choice in **SwiftUI**. Both beat plain MVC on separation and testability.

## The interview lens

The core distinction: *"MVP vs MVVM?"* — both pull logic out of the view for testability, but the **Presenter holds a reference to the view (through a protocol) and drives it imperatively** (`view.showTitle(...)`), whereas the **ViewModel exposes observable state the view binds to** and doesn't know the view exists. MVP needs no reactive layer; MVVM usually does. Consequently MVP is tested by **mocking the view and asserting interactions**, MVVM by asserting **state**.

Gotchas to mention: the view must be **passive** (no logic), the contract is a **pair of protocols**, and the presenter's reference to the view should be **`weak`** to avoid a retain cycle. And note fit: MVP suits UIKit; MVVM suits SwiftUI's declarative binding.
