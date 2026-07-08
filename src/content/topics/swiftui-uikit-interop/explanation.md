## The problem: two frameworks, one app

You're building a SwiftUI screen and you need a web view:

```swift
struct HelpScreen: View {
    var body: some View {
        WKWebView()   // ❌ does not compile — WKWebView is not a View
    }
}
```

SwiftUI has no web view. No map view as capable as `MKMapView`, no camera controller, no wrapper for that mature third-party UIKit control your app depends on. And the reverse problem is everywhere too: most real apps are UIKit at the core, and new SwiftUI screens have to slot into an existing UIKit navigation stack.

No real app is 100% SwiftUI. So SwiftUI ships bridges in both directions: representable protocols to put UIKit *inside* SwiftUI, and a hosting controller to put SwiftUI *inside* UIKit. This lesson walks both bridges, plus the piece that trips everyone up — how events flow back.

## Wrapping a UIView for SwiftUI

Fix the broken code by conforming to **UIViewRepresentable** — the protocol that turns a `UIView` into a SwiftUI view:

```swift
struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        WKWebView()                          // create the UIKit view — once
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        webView.load(URLRequest(url: url))   // push SwiftUI state → UIKit
    }
}
```

Two required methods, two distinct jobs.

`makeUIView` runs once, when SwiftUI first needs the view. It creates the UIKit object.

`updateUIView` runs every time SwiftUI state the wrapper depends on changes. This is where you sync SwiftUI → UIKit: read the struct's properties, apply them to the view.

Now `WebView(url: helpURL)` drops into any SwiftUI body like a native view.

### Predict: the url changes — how many times does makeUIView run?

The parent re-renders with a different `url`. What gets called?

Answer: `makeUIView` runs zero more times. SwiftUI keeps the `WKWebView` it already made and calls `updateUIView` with the new state. Create once, update many — burn that split into memory, because violating it is the classic interop performance bug.

## Wrapping a whole view controller

Some UIKit things aren't views but entire view controllers — the image picker, the camera, a complex legacy screen. Same idea, different protocol:

```swift
struct ImagePicker: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIImagePickerController {
        UIImagePickerController()
    }
    func updateUIViewController(_ vc: UIImagePickerController, context: Context) { }
}
```

**UIViewControllerRepresentable** mirrors its sibling exactly: `make` creates once, `update` syncs on change. Everything else in this lesson applies to both.

## The bridge back: Coordinators

So far data flows one way — SwiftUI into UIKit. But the image picker needs to tell SwiftUI "the user picked this photo". How does UIKit talk back?

UIKit's answer to callbacks is delegates and target-action — patterns that require an *object* to receive the messages. Our `ImagePicker` struct is a value: it's copied and recreated constantly, so it can't be anyone's delegate.

The solution is the **Coordinator**: a class you create for exactly this purpose. It lives as long as the UIKit view does, acts as its delegate, and forwards events back into SwiftUI.

Build it in three steps. First, declare what SwiftUI wants back — a binding:

```swift
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
```

Second, create the coordinator and make it the delegate:

```swift
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator   // SwiftUI made it, hands it to you here
        return picker
    }
```

SwiftUI calls `makeCoordinator` before `make…`, then exposes the instance as `context.coordinator` so you can wire it up.

Third, implement the delegate methods inside the coordinator and write back to SwiftUI:

```swift
    final class Coordinator: NSObject,
        UIImagePickerControllerDelegate, UINavigationControllerDelegate {

        let parent: ImagePicker
        init(_ parent: ImagePicker) { self.parent = parent }

        func imagePickerController(_ p: UIImagePickerController,
                didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            parent.image = info[.originalImage] as? UIImage
            // UIKit delegate event → SwiftUI binding. The circle closes.
        }
    }
}
```

The user picks a photo, UIKit fires the delegate method, the coordinator writes to `parent.image`, the `@Binding` updates SwiftUI's source of truth, and every SwiftUI view reading it re-renders. UIKit event in, SwiftUI update out.

## The other direction: SwiftUI inside UIKit

Now flip the whole problem. You have a UIKit app, and you built one new screen in SwiftUI. How do you push it?

```swift
let host = UIHostingController(rootView: ProfileView(user: user))
navigationController?.pushViewController(host, animated: true)
```

**UIHostingController** wraps any SwiftUI `View` in a plain `UIViewController`. Push it, present it modally, embed it as a child — UIKit doesn't know or care that SwiftUI is inside.

This one class is how teams adopt SwiftUI incrementally: build the next screen in SwiftUI, host it, push it from the existing UIKit flow. No rewrite required.

## Data flow across the boundary, summarized

Keep the flow SwiftUI-shaped even at the border. Down and up work differently:

```swift
struct WebView: UIViewRepresentable {
    let url: URL              // DOWN: plain property, applied in updateUIView
    @Binding var canGoBack: Bool   // UP: coordinator writes here from a delegate
    var onFinish: () -> Void       // UP: closure for one-off events
}
```

Downstream — SwiftUI to UIKit — you pass values in as properties and apply them in `update…` when they change.

Upstream — UIKit to SwiftUI — the coordinator receives delegate calls and either writes to a `@Binding` or calls a closure. Bindings suit two-way values like the picked image; closures suit one-shot events like "loading finished".

One discipline rule: never create the UIKit object or do heavy work in `update…`. It runs on every relevant state change — sometimes very often. Create in `make…` once; update incrementally.

## Common pitfalls

- **Rebuilding the UIKit view in `updateUIView`.** `update…` runs repeatedly; creating views or doing expensive work there wrecks performance. Create in `make…`, mutate in `update…`.
- **Trying to make the representable struct the delegate.** It's a value type — it can't be. That's precisely what the Coordinator class exists for.
- **Forgetting to assign the coordinator as delegate.** `makeCoordinator` alone does nothing; you must set `picker.delegate = context.coordinator` in `make…`, or events go nowhere.
- **Bypassing bindings and mutating UIKit state directly from SwiftUI.** Keep one source of truth on the SwiftUI side; push it down in `update…`.

## Interview lens

If asked "how do SwiftUI and UIKit interoperate?", name all three bridges up front: `UIViewRepresentable` wraps a `UIView`, `UIViewControllerRepresentable` wraps a `UIViewController` — both put UIKit inside SwiftUI — and `UIHostingController` goes the other way, putting SwiftUI inside UIKit. Add that the hosting controller is the standard path for incremental SwiftUI adoption in existing apps; interviewers asking this usually have exactly that migration on their team.

Explain the make/update split precisely, because it's the follow-up: `make…` runs once to create, `update…` runs on every relevant state change to sync SwiftUI state into the UIKit object — so never build the view in `update…`.

The senior differentiator is the Coordinator, and specifically the *why*: representables are value types, but UIKit communicates through delegate and target-action objects, so you create a Coordinator class in `makeCoordinator()` to receive those events and forward them into SwiftUI via a `@Binding` or closure. Candidates who can only recite the methods miss this reasoning — giving it unprompted is the tell.

Close with the data-flow summary if there's room: down through representable properties applied in `update…`, up through the coordinator into a binding. One clean sentence each direction.
