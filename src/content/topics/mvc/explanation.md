## The problem: where does the code go?

Every app has data, a way to show it, and logic connecting the two. **MVC (Model-View-Controller)** is the oldest answer and the one Apple's UIKit is built around. Understanding it — including *why* it so often turns into an unmaintainable mess — is the foundation for every other architecture, which all exist largely as reactions to MVC's shortcomings.

## The intended MVC

In the textbook (Smalltalk) version, the three roles are cleanly separated:

- **Model** — the data and business logic. Knows nothing about the UI.
- **View** — what's on screen. Dumb; just displays and reports user actions.
- **Controller** — the mediator: it updates the view from the model and the model from user input.

Crucially, in classic MVC the **Model notifies the View** of changes (often via observers), and the View is fully decoupled from the Model. The controller is thin glue.

## Cocoa MVC

Apple's UIKit variant rearranges this. The `UIViewController` sits in the middle and **owns the views**, and the Model and View are kept apart — they communicate *through* the controller. In practice the view (`UIView`/storyboard) and controller are tightly bound (the controller has outlets to its views, manages their lifecycle, handles their events).

```swift
class ProfileViewController: UIViewController {
    var user: User            // model
    @IBOutlet var nameLabel: UILabel!   // view
    // controller wires them together
    func render() { nameLabel.text = user.name }
}
```

That View↔Controller coupling is by design, but it's also where trouble starts.

## "Massive View Controller"

Because the controller is the only place wired to both the view and the model, everything gravitates there. A real-world `UIViewController` ends up doing:

- view lifecycle (`viewDidLoad`, layout)
- networking and parsing
- data source / delegate methods
- formatting and presentation logic
- navigation
- business rules

The result is the infamous **"Massive View Controller"** — files thousands of lines long that are impossible to test (logic is entangled with UIKit), hard to reuse, and terrifying to change. MVC didn't *tell* you to put all that in the controller; it just didn't give you anywhere else to put it.

## Responsibilities & coupling

The root issue is **too few roles for too many responsibilities**, plus **tight coupling to UIKit**. The controller imports `UIKit`, references concrete views, and mixes presentation with business logic — so you can't unit-test the logic without spinning up a view hierarchy. There's no dedicated home for "presentation logic" (formatting a date, deciding a button's enabled state) or for "navigation," so both land in the controller.

## Why teams move beyond it

Other patterns exist to **extract responsibilities out of the controller** and **decouple logic from UIKit** so it can be tested:

- **MVVM** adds a *ViewModel* to hold presentation logic and state, testable in isolation.
- **MVP** adds a *Presenter* driving a passive view via a protocol.
- **VIPER / Clean** split further into interactors, routers, use cases.
- **Coordinators** pull navigation out of the controller.

None of these are magic — they trade boilerplate for testability and separation. MVC is still perfectly fine for simple screens; the problem is only when a controller accumulates unrelated jobs.

## The interview lens

The classic: *"What's wrong with MVC on iOS?"* The honest answer isn't "MVC is bad" — it's that **Cocoa MVC gives the view controller too many responsibilities and couples it tightly to UIKit**, so controllers balloon into untestable "Massive View Controllers." Name the specific jobs that pile up (networking, data source, formatting, navigation, business logic) and that the entanglement with UIKit is what blocks unit testing.

Then show range: every other architecture is a **reaction** to this — MVVM/MVP extract presentation logic into a testable object, Coordinators extract navigation, VIPER/Clean go further. Bonus for noting that classic Smalltalk MVC (Model notifies View directly) differs from Cocoa MVC (everything through the controller), and that MVC is still the right, low-ceremony choice for genuinely simple screens.
