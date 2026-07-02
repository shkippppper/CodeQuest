## The problem: two frameworks, one app

No real app is 100% SwiftUI. You need a `MKMapView`, a `WKWebView`, a mature third-party UIKit control, or a camera controller SwiftUI doesn't wrap — and existing apps embed new SwiftUI screens into a UIKit navigation stack. SwiftUI provides **bridges in both directions**: `UIViewRepresentable`/`UIViewControllerRepresentable` to put UIKit **inside** SwiftUI, and `UIHostingController` to put SwiftUI **inside** UIKit.

## `UIViewRepresentable`

Conform to **`UIViewRepresentable`** to wrap a `UIView` as a SwiftUI view. You implement two required methods:

```swift
struct WebView: UIViewRepresentable {
    let url: URL
    func makeUIView(context: Context) -> WKWebView {
        WKWebView()                       // create the UIKit view once
    }
    func updateUIView(_ webView: WKWebView, context: Context) {
        webView.load(URLRequest(url: url)) // push SwiftUI state → UIKit
    }
}
```

- **`makeUIView`** — called **once** to create the view.
- **`updateUIView`** — called whenever SwiftUI state the wrapper depends on changes; this is where you sync SwiftUI → UIKit.

Then `WebView(url: ...)` is usable anywhere like any SwiftUI view.

## `UIViewControllerRepresentable`

Same idea for a whole **`UIViewController`** (image picker, camera, a complex existing screen): implement `makeUIViewController` and `updateUIViewController`.

```swift
struct ImagePicker: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIImagePickerController { ... }
    func updateUIViewController(_ vc: UIImagePickerController, context: Context) { }
}
```

## Coordinators

UIKit talks back through **delegates and target-action**, which are objects — but a SwiftUI `Representable` is a value type. The **Coordinator** is the bridge: a class you create in `makeCoordinator()` that acts as the UIKit view's delegate and forwards events back into SwiftUI (updating bindings, calling closures).

```swift
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        init(_ parent: ImagePicker) { self.parent = parent }
        func imagePickerController(_ p: UIImagePickerController,
                                   didFinishPickingMediaWithInfo info: [...: Any]) {
            parent.image = info[.originalImage] as? UIImage   // UIKit event → SwiftUI binding
        }
    }
}
```

SwiftUI creates the coordinator and hands it to you via `context.coordinator` so you can set it as the delegate in `makeUIView(Controller)`.

## Hosting SwiftUI in UIKit (`UIHostingController`)

The reverse bridge: **`UIHostingController`** wraps a SwiftUI `View` in a `UIViewController` you can push, present, or embed in a UIKit hierarchy.

```swift
let host = UIHostingController(rootView: ProfileView(user: user))
navigationController?.pushViewController(host, animated: true)
```

This is how teams **adopt SwiftUI incrementally** in an existing UIKit app — build a screen in SwiftUI, host it, and push it from the existing flow.

## Data flow across the boundary

Keep data flowing the SwiftUI way across the bridge:

- **SwiftUI → UIKit (down)**: pass values into the `Representable`'s properties; apply them in `updateUIView(Controller)` when they change.
- **UIKit → SwiftUI (up)**: the **Coordinator** receives delegate/callback events and writes back to a **`@Binding`** or calls a closure — so the SwiftUI source of truth updates.
- **`@Binding`** is the typical conduit for two-way values (like the picked image); closures for one-off events.

Avoid doing heavy work or creating the UIKit object in `updateUIView` (it runs repeatedly) — create in `make…` once, update incrementally.

## The interview lens

Name the three bridges: **`UIViewRepresentable`** (wrap a `UIView`) and **`UIViewControllerRepresentable`** (wrap a `UIViewController`) put UIKit **inside** SwiftUI via `make…` (create once) + `update…` (sync SwiftUI state → UIKit on change); **`UIHostingController`** puts SwiftUI **inside** UIKit, the standard path for **incremental SwiftUI adoption**.

The senior crux is the **Coordinator**: because `Representable`s are value types but UIKit communicates via **delegate/target-action objects**, you create a Coordinator class in `makeCoordinator()` to be the delegate and forward UIKit events **back into SwiftUI** (writing to a `@Binding`/closure). Summarize data flow: **down** via representable properties applied in `update…`, **up** via the Coordinator into a binding — and remember `make…` runs once while `update…` runs repeatedly (don't rebuild the view there).
