## Where does this line of code go?

Here's a screen that shows a user's profile. Somewhere, this line has to live:

```swift
nameLabel.text = user.name
```

On the left, a UI object. On the right, a data object. Some piece of code has to connect them — and *where that connecting code goes* is the entire subject of app architecture.

**MVC** — Model-View-Controller — is the oldest answer, and the one Apple's UIKit is built around. Understanding it, including *why* it so often collapses into a mess, is the foundation for every other architecture you'll meet: they all exist largely as reactions to MVC's failure modes.

## The textbook version: three clean roles

MVC divides code into three roles. In the original design — from the Smalltalk language, decades before iOS — they look like this:

- **Model** — the data and the business rules. Knows nothing about any UI.
- **View** — what's on screen. Dumb: it displays things and reports user actions.
- **Controller** — the mediator. It updates the model from user input, and it's thin glue.

The detail people forget: in classic MVC, the *model notifies the view directly* when it changes, usually through an observer mechanism — the view subscribes to model changes and redraws itself. The controller barely does anything.

Model and view are fully decoupled, the controller is small, and everyone's happy. That is *not* the MVC you'll write on iOS.

## Apple's version: the controller owns everything

Cocoa MVC rearranges the triangle. The `UIViewController` sits in the middle, and the model and view never talk directly — everything flows *through* the controller:

```swift
class ProfileViewController: UIViewController {
    var user: User                       // the model
    @IBOutlet var nameLabel: UILabel!    // the view

    func render() {
        nameLabel.text = user.name       // the controller connects them
    }
}
```

Notice how physically close the view is to the controller: the controller holds outlets to its views, creates them, lays them out, receives their button taps, manages their lifecycle. In Cocoa, the view and controller are effectively welded together — that's by design.

The model stays separate. But the *only* object wired to both the model and the view is the controller. Keep that fact in mind; it's about to matter.

## Watch a controller grow

Start with the honest minimum. Every screen needs its lifecycle handled:

```swift
class ProfileViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        render()
    }
}
```

The profile comes from a server. Predict: where does the networking code go — the model, the view, or here?

Answer: here. The controller is the only object that knows both when the screen appeared *and* which views need the data. So it grows:

```swift
    override func viewDidLoad() {
        super.viewDidLoad()
        URLSession.shared.dataTask(with: profileURL) { data, _, _ in
            self.user = try? JSONDecoder().decode(User.self, from: data!)
            DispatchQueue.main.async { self.render() }
        }.resume()
    }
```

The screen has a list of the user's posts. Table views need a data source and delegate — and the controller is the object standing right there:

```swift
extension ProfileViewController: UITableViewDataSource, UITableViewDelegate {
    func tableView(_ tv: UITableView, numberOfRowsInSection s: Int) -> Int { posts.count }
    func tableView(_ tv: UITableView, cellForRowAt ip: IndexPath) -> UITableViewCell { /* ... */ }
}
```

The design wants "joined 2 years ago" instead of a raw date. That's formatting — presentation logic — and there's no role for it, so:

```swift
    func render() {
        nameLabel.text = user.name
        joinedLabel.text = "Joined " + relativeFormatter.string(for: user.joinDate)!
        followButton.isEnabled = user.id != currentUserID   // a business rule, too
    }
```

Tapping a post opens a detail screen. Navigation has no role either, so:

```swift
    func tableView(_ tv: UITableView, didSelectRowAt ip: IndexPath) {
        let vc = PostDetailViewController(post: posts[ip.row])
        navigationController?.pushViewController(vc, animated: true)
    }
```

Count the jobs this one class now holds: view lifecycle, networking and parsing, table data source and delegate, formatting, a business rule, and navigation. Six responsibilities — and this is a *simple* screen.

## Massive View Controller

Scale that pattern to a real screen and you get the infamous **Massive View Controller** — files thousands of lines long that nobody wants to touch.

The nickname is a joke on the acronym, but the pain is real. Everything gravitates to the controller for the same reason at every step above: it's the only object wired to both sides, and MVC gives the leftover jobs nowhere else to live.

Be fair to the pattern: MVC never *told* you to put networking and formatting in the controller. It just defined three roles for what turns out to be six-plus jobs — and the extra jobs all landed on the mediator.

## Why you can't test any of it

Here's the deeper cost. Say you want to unit-test one bit of logic — the follow button's enabled state:

```swift
followButton.isEnabled = user.id != currentUserID
```

That rule lives inside a `UIViewController`, welded to a `UIButton` outlet. To execute it you must instantiate the controller, load its view hierarchy, and trigger the lifecycle — a heavyweight UIKit setup to test one boolean.

This is the root issue stated plainly: too few roles for too many responsibilities, plus *tight coupling to UIKit*. The controller imports UIKit, references concrete views, and mixes presentation logic with business logic — so no logic can be tested without dragging a view hierarchy along.

And notice which two jobs had no home at all: presentation logic — formatting dates, deciding a button's state — and navigation. Every architecture that came after MVC is essentially an answer to "give those jobs a home."

## The escape routes

Each successor pattern extracts specific responsibilities out of the controller and away from UIKit, so they become testable:

- *MVVM* adds a ViewModel — a plain object holding presentation logic and state, testable with no UI.
- *MVP* adds a Presenter that drives a deliberately dumb view through a protocol.
- *VIPER* and Clean Architecture split further, into interactors, routers, and use cases.
- *Coordinators* pull just the navigation out into dedicated flow objects.

Each has its own lesson ahead. None of them is magic — every one trades extra boilerplate for testability and separation.

And the mature take: MVC is still perfectly fine for genuinely simple screens. A static settings page doesn't need a ViewModel. The problem was never the pattern's existence — it's a controller quietly accumulating six unrelated jobs.

## Common pitfalls

- **Treating "MVC is bad" as the lesson.** The precise claim is that *Cocoa* MVC overloads the view controller and couples it to UIKit. Simple screens are still fine as plain MVC.
- **Confusing classic MVC with Cocoa MVC.** In Smalltalk MVC the model notifies the view directly; in Cocoa everything routes through the controller, and view and controller are welded together.
- **Testing controller logic by spinning up view hierarchies.** If a test needs `loadViewIfNeeded()` to check a boolean, that's the coupling problem itself — the logic belongs outside the controller.

## Interview lens

The classic question is "what's wrong with MVC on iOS?" Don't answer "MVC is bad" — that's junior. Say that Cocoa MVC gives the view controller too many responsibilities and couples it tightly to UIKit, so controllers balloon into untestable Massive View Controllers. Then list the actual jobs that pile up: lifecycle, networking, table data source, formatting, business rules, navigation. Naming the specific jobs is what makes the answer land.

Point at the mechanism, not just the symptom: the controller is the only object wired to both model and view, and MVC gives presentation logic and navigation no home of their own — so everything defaults to the controller, and the UIKit entanglement is what blocks unit testing.

Then show range: every later architecture is a reaction to this. MVVM and MVP extract presentation logic into a testable object, Coordinators extract navigation, VIPER and Clean go further. Two closers that read as senior: classic Smalltalk MVC differs from Cocoa MVC — the model notified the view directly, the controller was thin — and MVC remains the right, low-ceremony choice for genuinely simple screens.
