## The problem: unit tests can't see the screen

A unit test can call `viewModel.login()` directly and check the result. But it can't tell you whether the login button is actually tappable, whether the keyboard covers the password field, or whether a real tap on the "Sign In" text does what you expect. Something has to drive the app the way a person would — tapping, typing, and reading what's on screen.

```swift
import XCTest

final class LoginUITests: XCTestCase {
    func test_tappingSignIn_showsHomeScreen() {
        let app = XCUIApplication()
        app.launch()
    }
}
```

`XCUIApplication` is a proxy object that represents your app running as a separate process. Calling `launch()` actually boots the app on the simulator or device, fresh, just like a user opening it from the home screen.

## Finding things on screen

The app is running, but the test can't see pixels — it needs to find *elements* by some identifier, the same way a screen reader would.

```swift
let emailField = app.textFields["Email"]
let passwordField = app.secureTextFields["Password"]
let signInButton = app.buttons["Sign In"]
```

Each of these is a **query** — a description of an element, not the element itself. `app.buttons["Sign In"]` says "find a button whose accessibility label or identifier is 'Sign In'", and XCUITest doesn't actually search the screen until you use the result (tap it, read its text, assert on it).

That label the query matches against is the **accessibility identifier** — a stable name UIKit/SwiftUI exposes for VoiceOver and for tests, separate from the visible text:

```swift
Button("Sign In") { viewModel.signIn() }
    .accessibilityIdentifier("signInButton")
```

```swift
let signInButton = app.buttons["signInButton"]
```

Matching on the accessibility identifier instead of the visible label is more resilient — if a designer changes "Sign In" to "Log In", the identifier-based query still finds the button. This is also exactly why every screen you want to test needs proper accessibility support: your UI tests and your VoiceOver users are, literally, using the same hooks.

Queries can be narrowed with predicates when there's no clean identifier:

```swift
let errorLabel = app.staticTexts.matching(
    NSPredicate(format: "label CONTAINS 'invalid'")
).firstMatch
```

## Acting on elements and asserting the result

Once a query resolves to a real, visible element, you can drive it:

```swift
emailField.tap()
emailField.typeText("ada@example.com")

passwordField.tap()
passwordField.typeText("hunter2")

signInButton.tap()
```

Each call simulates a real touch event or a real keystroke — the app has no idea it isn't a human tapping the glass.

Now assert on what should have happened:

```swift
XCTAssertTrue(app.staticTexts["Welcome, Ada"].waitForExistence(timeout: 5))
```

Predict: why not just write `XCTAssertTrue(app.staticTexts["Welcome, Ada"].exists)` right after the tap?

Answer: the screen transition after `signInButton.tap()` isn't instant. A network call, an animation, or a view controller push all take real time, and `exists` checks *right now* — before any of that has finished. `waitForExistence(timeout:)` polls until the element appears or the timeout expires, matching the async reality of a running app.

## Why UI tests flake, and how waits fix it

`waitForExistence` is the core defense against **flakiness** — a test that sometimes passes and sometimes fails with no code change, because it's racing against timing instead of checking a real condition.

```swift
signInButton.tap()
sleep(2)                                  // guesses at timing — fragile
XCTAssertTrue(app.staticTexts["Welcome, Ada"].exists)
```

`sleep(2)` is a guess. On a fast simulator it wastes two seconds; on a loaded CI machine two seconds might not be enough, and the test fails intermittently — the definition of flaky.

```swift
signInButton.tap()
XCTAssertTrue(app.staticTexts["Welcome, Ada"].waitForExistence(timeout: 5))   // waits exactly as long as needed
```

This polls every fraction of a second for up to 5 seconds and returns as soon as the condition is true, so a fast device finishes in milliseconds and a slow one still passes within the budget.

The same idea applies before interacting with an element, not just after:

```swift
let button = app.buttons["signInButton"]
XCTAssertTrue(button.waitForExistence(timeout: 5))
XCTAssertTrue(button.isHittable)   // on screen AND not covered by another view
button.tap()
```

`isHittable` catches a subtler flake source: the element exists in the view hierarchy but is currently off-screen, behind a modal, or behind the keyboard. Tapping a non-hittable element throws a test failure that has nothing to do with your feature — just your test's assumptions about layout.

Other common flake sources worth naming:
- **Animations still running** — tap during a transition and the tap lands on the wrong frame. `app.waitForExistence` on the destination element sidesteps this.
- **Network calls with no mock** — a UI test that hits a real, slow, or flaky backend inherits all of that backend's flakiness. Point the app at a stub server or launch argument that fakes the response instead.
- **Shared state between tests** — a test that assumes "logged out" but ran after another test that left the app logged in. Reset state in `setUp()`.

## Keeping tests readable: the Page Object pattern

A raw UI test that queries elements inline gets unreadable fast, and a single UI redesign breaks every test that touches that screen:

```swift
func test_invalidPassword_showsError() {
    let app = XCUIApplication()
    app.launch()
    app.textFields["Email"].tap()
    app.textFields["Email"].typeText("ada@example.com")
    app.secureTextFields["Password"].tap()
    app.secureTextFields["Password"].typeText("wrong")
    app.buttons["signInButton"].tap()
    XCTAssertTrue(app.staticTexts["Invalid credentials"].waitForExistence(timeout: 5))
}
```

Every test that touches the login screen repeats these same queries. The **Page Object pattern** pulls a screen's elements and actions into one type, so tests read like a script and the queries live in exactly one place:

```swift
struct LoginScreen {
    let app: XCUIApplication

    var emailField: XCUIElement { app.textFields["Email"] }
    var passwordField: XCUIElement { app.secureTextFields["Password"] }
    var signInButton: XCUIElement { app.buttons["signInButton"] }

    @discardableResult
    func signIn(email: String, password: String) -> Self {
        emailField.tap()
        emailField.typeText(email)
        passwordField.tap()
        passwordField.typeText(password)
        signInButton.tap()
        return self
    }
}
```

The test becomes a readable sequence of intent, not implementation detail:

```swift
func test_invalidPassword_showsError() {
    let app = XCUIApplication()
    app.launch()
    LoginScreen(app: app).signIn(email: "ada@example.com", password: "wrong")

    XCTAssertTrue(app.staticTexts["Invalid credentials"].waitForExistence(timeout: 5))
}
```

If the login screen's layout changes — the password field gets a new accessibility identifier — you fix it in `LoginScreen` once, and every test that uses it keeps working.

## Common pitfalls

- **Matching on visible text instead of accessibility identifiers.** Text changes with localization and copy edits; identifiers don't. Set `.accessibilityIdentifier(...)` explicitly on interactive elements.
- **Using `sleep()` instead of `waitForExistence`.** Sleeps are always either too short (flaky) or too long (slow suite) — never both right.
- **Tapping an element that exists but isn't hittable.** Check `isHittable`, not just `exists`, when a tap mysteriously fails only sometimes.
- **Letting real network calls into UI tests.** Use launch arguments or a local stub to make responses deterministic.

## Interview lens

If asked what `XCUIApplication` is, say it launches your app as a real, separate process and drives it through the accessibility layer — the same layer VoiceOver uses — rather than calling your code directly. That's *why* UI tests are slower and more fragile than unit tests, and why good accessibility support and testability go hand in hand.

If asked how you'd stop a flaky UI test, name the two real fixes: `waitForExistence(timeout:)` instead of `sleep()`, and `isHittable` checks before tapping. Mention that non-deterministic dependencies — real network calls, shared app state between tests — are the other big source, and that launch arguments to inject fake data or reset state are the standard fix.

If asked why you'd use the Page Object pattern, the answer is maintainability: it isolates every UI test from the screen's implementation details, so a layout change means editing one page object instead of every test that touches that screen.
