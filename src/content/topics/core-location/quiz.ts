import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "cl-missing-plist",
    type: "mcq",
    prompt:
      "You call `requestWhenInUseAuthorization()` but no permission dialog ever appears and you receive no location. What is the most likely cause?",
    options: [
      "The `NSLocationWhenInUseUsageDescription` usage string is missing from Info.plist, so the request silently fails",
      "The device simulator has GPS hardware disabled and must be replaced by a physical iPhone before any dialog can appear",
      "The manager's `desiredAccuracy` was left unset, which the system treats as a request it is unable to fulfil at all",
      "The call must be made from a background thread, and running it on the main thread suppresses the permission prompt entirely",
    ],
    answer: 0,
    explanation:
      "Without `NSLocationWhenInUseUsageDescription` in Info.plist there is no reason string to show, so the system suppresses the dialog with no error. It's the classic first bug to check.",
  },
  {
    id: "cl-when-in-use-vs-always",
    type: "mcq",
    prompt: "What does **Always** authorization allow that **When-In-Use** does not?",
    options: [
      "The system can wake or relaunch your app to deliver location even when it's backgrounded or closed",
      "It unlocks full precise accuracy, whereas When-In-Use is permanently capped at the reduced approximate tier",
      "It removes the need to add any usage-description string to Info.plist for that particular permission level",
      "It lets you read the location synchronously as a return value instead of waiting for a delegate callback",
    ],
    answer: 0,
    explanation:
      "**Always** permits background delivery — the system can wake your app for location updates or region crossings even when it isn't on screen. When-In-Use only works while the app is in the foreground.",
  },
  {
    id: "cl-never-always-upfront",
    type: "mcq",
    prompt: "Why is requesting **Always** authorization on first launch discouraged?",
    options: [
      "Users and App Review see an up-front Always ask as a red flag, so grant rates drop; request When-In-Use first and escalate later",
      "The Always request is technically forbidden before any location has been sampled, so the call is guaranteed to throw at runtime",
      "Always authorization can only ever be granted from within the iOS Settings app and never through an in-app dialog on launch",
      "Requesting Always disables significant-location-change monitoring, which most background features depend on to function properly",
    ],
    answer: 0,
    explanation:
      "Ask for the least you need: When-In-Use first, then request Always only after you've shown the user why. Asking for Always up front hurts trust and your grant rate.",
  },
  {
    id: "cl-auth-callback-fill",
    type: "fill",
    prompt:
      "The delegate method `locationManagerDidChange___(_:)` fires whenever the app's location permission state changes.",
    answers: ["Authorization", "authorization"],
    hint: "It's about the user's permission status.",
    explanation:
      "`locationManagerDidChangeAuthorization(_:)` is where you inspect `authorizationStatus` and start updates once permission is actually granted.",
  },
  {
    id: "cl-accuracy-battery-predict",
    type: "predict",
    prompt:
      "A weather app that only needs the user's city sets this. What's the real consequence?",
    code:
      "manager.desiredAccuracy = kCLLocationAccuracyBest\n" +
      "manager.startUpdatingLocation()",
    options: [
      "It drains the battery running GPS hard for precision the feature never uses, and the user may grant approximate anyway",
      "It fails to compile, because `kCLLocationAccuracyBest` is only valid when Always authorization has already been granted",
      "It forces the user's permission dialog to re-appear on every launch until they explicitly choose precise over approximate",
      "It rounds the returned coordinate to the nearest city automatically, so the extra accuracy is discarded before delivery",
    ],
    answer: 0,
    explanation:
      "`Best` pushes the GPS chip hard and burns battery for precision a city-level app never needs. And a privacy-minded user may hand you approximate location regardless, so the precision buys nothing.",
  },
  {
    id: "cl-did-update-locations",
    type: "predict",
    prompt:
      "Inside `didUpdateLocations`, which line is the freshest fix, and what should follow once you have it?",
    code:
      "func locationManager(_ m: CLLocationManager,\n" +
      "                     didUpdateLocations locations: [CLLocation]) {\n" +
      "    let fix = locations.___\n" +
      "    // use fix, then ...\n" +
      "}",
    options: [
      "`.last`, then call `stopUpdatingLocation()` to turn the GPS off now that you have the fix",
      "`.first`, then leave updates running so the array keeps growing with every subsequent movement sample",
      "`.max()`, then request Always authorization so the same fix can continue arriving in the background too",
      "`.average`, then call `startMonitoringSignificantLocationChanges()` to smooth the reported coordinate over time",
    ],
    answer: 0,
    explanation:
      "The array is ordered oldest-to-newest, so `.last` is the freshest fix. The moment you have what you need, call `stopUpdatingLocation()` — leaving GPS on is a top battery drain.",
  },
  {
    id: "cl-approximate-accuracy",
    type: "mcq",
    prompt:
      "Since iOS 14, a user can grant only reduced accuracy. How should your code treat `accuracyAuthorization == .reducedAccuracy`?",
    options: [
      "As a normal, supported case — the coordinate is fuzzed to roughly city level, so design the feature to work with that",
      "As a temporary error state that you clear by immediately re-issuing `requestWhenInUseAuthorization()` a second time",
      "As equivalent to a full denial, since a reduced-accuracy coordinate cannot be used for any meaningful map display",
      "As a signal to silently switch the manager over to significant-location-change monitoring until full accuracy returns",
    ],
    answer: 0,
    explanation:
      "Reduced accuracy is a first-class outcome, not an error: you get a coordinate fuzzed to about city level. Many privacy-minded users choose it, so your feature must handle it gracefully.",
  },
  {
    id: "cl-region-monitoring-senior",
    type: "mcq",
    prompt:
      "Why is region monitoring with a `CLCircularRegion` far cheaper on battery than `startUpdatingLocation()`?",
    options: [
      "The system tracks the geofence in low-power hardware and only wakes your app on an enter/exit crossing — no continuous GPS",
      "It caches the last known coordinate and replays it on a timer, so the GPS chip is never actually powered on at all",
      "It runs the GPS at full power but batches every reading into a single nightly delivery to amortize the cost",
      "It offloads all location work to Apple's servers, which compute crossings remotely and push them down via silent notifications",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Geofences are handled by low-power hardware that only nudges your app when the user crosses a region boundary. There's no continuous GPS, which is what makes 'remind me when I arrive' cheap.",
  },
  {
    id: "cl-privacy-multi",
    type: "multi",
    prompt: "Select **all** genuinely good Core Location privacy practices.",
    options: [
      "Write honest, specific usage strings describing exactly why you need location",
      "Handle approximate (reduced) accuracy as a normal case rather than an error",
      "Avoid logging precise coordinates to analytics or crash reports",
      "Request Always authorization on first launch so you never have to ask twice",
    ],
    answers: [0, 1, 2],
    explanation:
      "Honest usage strings, treating approximate location as normal, and not logging precise coordinates are all correct. Requesting Always up front (option 4) is the anti-pattern — ask When-In-Use first.",
  },
  {
    id: "cl-flashcard",
    type: "flashcard",
    prompt:
      "Walk through getting the user's location responsibly: the permission flow, accuracy-vs-battery, low-power alternatives, and MapKit display. Answer aloud, then reveal.",
    modelAnswer:
      "**Permission first.** Set the manager's `delegate`, call `requestWhenInUseAuthorization()`, and add `NSLocationWhenInUseUsageDescription` to Info.plist (missing it means the dialog never shows). The answer arrives asynchronously in `locationManagerDidChangeAuthorization`, where you inspect `authorizationStatus` and start updates only once granted. Two tiers: **When-In-Use** (foreground only) vs **Always** (background/relaunch) — never ask for Always up front; escalate later. Since iOS 14 the user may grant **reduced/approximate** accuracy (`accuracyAuthorization`), which you must handle as a normal case. **Accuracy vs battery:** set `desiredAccuracy` to the coarsest preset that works (`Best` drains fastest), read fixes in `didUpdateLocations` (freshest is `.last`) or via the async `CLLocationUpdate.liveUpdates()` sequence, and call `stopUpdatingLocation()` the instant you have your fix. **Low-power paths:** significant-location-change monitoring and region monitoring (geofencing with `CLCircularRegion`) let the system wake your app on movement or enter/exit without continuous GPS. `CLGeocoder.reverseGeocodeLocation` turns a coordinate into an address placemark. **MapKit:** a SwiftUI `Map { }` holds `Marker`/`Annotation`, a `MapCameraPosition` controls the camera, and `UserAnnotation()` draws the blue dot once permission is granted. **Privacy:** honest usage strings, handle approximate, never log precise coordinates.",
    keyPoints: [
      "Delegate + requestWhenInUseAuthorization() + Info.plist usage string; answer via locationManagerDidChangeAuthorization",
      "When-In-Use vs Always; never request Always up front",
      "iOS 14 reduced/approximate accuracy is a normal case to handle",
      "Coarsest desiredAccuracy that works; stopUpdatingLocation() as soon as you have the fix",
      "Low-power: significant-change and region monitoring (CLCircularRegion geofences)",
      "MapKit Map with Marker/Annotation, MapCameraPosition, UserAnnotation blue dot",
    ],
    explanation:
      "A strong answer leads with the permission flow and Info.plist string, stresses coarsest-accuracy plus stopping updates for battery, names geofencing as the low-power path, and ends with honest usage strings and not logging precise coordinates.",
  },
];

export default quiz;
