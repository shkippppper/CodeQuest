## The problem: location is powerful, and it costs the user

You want the weather for wherever the user is standing. So you ask for their location:

```swift
let manager = CLLocationManager()
manager.startUpdatingLocation()
```

This one call reaches for the most privacy-sensitive data an app can touch — the exact spot a person is on the planet — and it turns on the GPS chip, which is one of the biggest battery drains a phone has.

So the whole discipline of Core Location is restraint. Ask permission the honest way, request only the accuracy you actually need, and stop the moment you're done. This lesson walks through how to do each of those.

## You cannot just take the location

Run the code above with nothing else, and you get *nothing back*. The system blocks you until the user has said yes.

```swift
let manager = CLLocationManager()
manager.delegate = self
manager.requestWhenInUseAuthorization()   // shows the permission prompt
```

`requestWhenInUseAuthorization()` is what pops the system dialog asking the user to allow location *while they're using the app*. Nothing happens until you call it.

But the dialog needs a reason to show the user, and that reason lives outside your code — in a settings file called **Info.plist**, the app's property list of configuration keys. You add a key with a plain-English sentence:

```
NSLocationWhenInUseUsageDescription
  = "We use your location to show weather for where you are."
```

If that key is missing, the request silently fails — no dialog, no location, no error you'd notice. This is the number-one Core Location bug: forgetting the usage string.

## The answer arrives on a delegate, not a return value

Notice the request didn't *return* the user's choice. Permission is asynchronous — the user might tap the dialog now, or ignore it for a minute. So the answer comes back through a **delegate**, an object you hand to the manager to receive its callbacks.

```swift
func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    switch manager.authorizationStatus {
    case .authorizedWhenInUse, .authorizedAlways:
        manager.startUpdatingLocation()   // now it's safe to start
    case .denied, .restricted:
        // fall back to a manual city picker
        break
    case .notDetermined:
        break                             // haven't asked yet
    @unknown default:
        break
    }
}
```

`locationManagerDidChangeAuthorization` fires whenever the permission state changes — right after the user answers, and again if they later flip the switch in Settings. You start updating *inside* this callback, once you actually have permission, not before.

## When-In-Use vs Always

There are two levels of location permission, and they are very different asks.

**When-In-Use** lets you read location only while the app is on screen (plus a short grace period). This is what a weather app, a store locator, or a "find me on the map" feature needs.

**Always** lets the system wake your app to deliver location even when it's backgrounded or fully closed. A run-tracker that must keep recording in your pocket needs this — most apps do not.

The rule interviewers want to hear: **never ask for Always up front.** Start with When-In-Use. If you later genuinely need background delivery, call the Always request *after* you've shown the user why:

```swift
manager.requestAlwaysAuthorization()   // only after When-In-Use is granted
```

Asking for Always on first launch reads as a red flag to users and to Apple's reviewers, and it tanks your grant rate.

## The user might give you a blurry location

Since iOS 14, there's a second dimension to the permission. The user can grant your app *precise* location, or downgrade you to **approximate** location — a fuzzed position accurate to a few kilometers, enough to know the city but not the street.

You read which one you got:

```swift
switch manager.accuracyAuthorization {
case .fullAccuracy:
    break                    // exact coordinates
case .reducedAccuracy:
    break                    // fuzzed to ~city level
@unknown default:
    break
}
```

Predict this: you build a weather app and set the accuracy to the sharpest possible, `kCLLocationAccuracyBest`, because sharper sounds better. What does that cost you?

Two things. First, `Best` runs the GPS hard and drains the battery fastest — and a weather app only needs the *city*, so all that precision is wasted. Second, a privacy-minded user may hand you approximate location anyway, so your code must already handle a blurry coordinate. Reaching for `Best` bought you battery cost and bought the user nothing.

## Set the coarsest accuracy that works

`desiredAccuracy` tells the system how hard to push the hardware. It is a *hint* — the coarser you ask, the less power it burns.

```swift
manager.desiredAccuracy = kCLLocationAccuracyKilometer   // plenty for weather
```

The presets run from `kCLLocationAccuracyBest` (turn-by-turn navigation) down through `HundredMeters`, `Kilometer`, and `ThreeKilometers`. Pick the coarsest one that still makes your feature work. A ride-share pickup needs `Best`; a "restaurants near me" list is fine with `HundredMeters`.

Locations arrive on the delegate:

```swift
func locationManager(_ manager: CLLocationManager,
                     didUpdateLocations locations: [CLLocation]) {
    guard let latest = locations.last else { return }
    print(latest.coordinate.latitude, latest.coordinate.longitude)
    manager.stopUpdatingLocation()   // got what we came for — turn GPS off
}
```

`didUpdateLocations` hands you an array; the freshest fix is `.last`. And the single most important line for battery is `stopUpdatingLocation()` — the moment your screen has the fix it needs, stop. Leaving updates running in the background is how apps earn a reputation for killing battery.

### The modern async way

Newer code can skip the delegate and read locations as an async sequence:

```swift
for try await update in CLLocationUpdate.liveUpdates() {
    if let location = update.location {
        print(location.coordinate)
        break   // one fix is enough
    }
}
```

`CLLocationUpdate.liveUpdates()` gives you the same stream of fixes, but as a `for await` loop instead of a callback. Same rules apply — read what you need and break out.

## When you barely need GPS at all

Continuous updates are the heavy option. For a lot of features you can get the phone to do the work *for* you and only wake your app occasionally.

**Significant-location-change monitoring** delivers a new location only when the user has moved a meaningful distance — roughly when they change cell towers:

```swift
manager.startMonitoringSignificantLocationChanges()
```

It leans on the cellular radio that's already on, so the GPS chip mostly stays asleep. A "remember where I parked" or coarse city-change feature can run on this for pennies of battery.

**Region monitoring** (also called geofencing) is even more targeted. You describe a circle on the map, and the system wakes your app when the user crosses its edge:

```swift
let home = CLCircularRegion(
    center: CLLocationCoordinate2D(latitude: 41.69, longitude: 44.83),
    radius: 150,                       // metres
    identifier: "home")
home.notifyOnEntry = true
home.notifyOnExit = true
manager.startMonitoring(for: home)
```

Now your delegate hears about crossings without any continuous GPS at all:

```swift
func locationManager(_ manager: CLLocationManager,
                     didEnterRegion region: CLRegion) {
    // e.g. arm "you're home" automation
}
```

The system tracks the geofence in low-power hardware and only nudges your app on enter or exit. That's how a reminder can fire "when I get to the office" without draining the phone all day.

## Turning coordinates into an address

A latitude and longitude means nothing to a user. **Reverse geocoding** turns a coordinate into a human placemark — street, city, country.

```swift
let geocoder = CLGeocoder()
let places = try await geocoder.reverseGeocodeLocation(location)
if let city = places.first?.locality {
    print(city)   // e.g. "Batumi"
}
```

`CLGeocoder` calls a network service, so it's async and rate-limited — geocode once when you need a label, not on every location update.

## Showing it on a map

MapKit draws the map. In SwiftUI the whole thing is a `Map` view.

Start with an empty map centred somewhere:

```swift
Map {
}
.mapControls {
    // zoom, compass, etc.
}
```

Drop a pin by putting a `Marker` inside:

```swift
Map {
    Marker("Hilton Batumi",
           coordinate: CLLocationCoordinate2D(latitude: 41.65, longitude: 41.64))
}
```

`Marker` is the standard balloon pin. When you want a custom view instead of the default pin, use `Annotation` and give it any SwiftUI content:

```swift
Map {
    Annotation("You", coordinate: userCoordinate) {
        Image(systemName: "star.fill").foregroundStyle(.green)
    }
}
```

To control where the camera looks, bind a **`MapCameraPosition`** — a value describing the map's viewpoint:

```swift
@State private var camera: MapCameraPosition = .automatic

var body: some View {
    Map(position: $camera) {
        UserAnnotation()          // the blue dot for the user's own location
    }
}
```

`.automatic` lets MapKit frame the content for you; `UserAnnotation()` draws the familiar blue dot — but only if you've been granted location permission, tying the whole lesson together.

## Privacy is not optional

- Your usage strings must be **honest and specific**. "We use your location to find nearby clinics" is fine; a vague "for app functionality" gets rejected in review and erodes trust.
- Handle **approximate location** as a first-class case, not an error. Many users will grant exactly that.
- **Don't log precise coordinates** to analytics or crash reports. A latitude/longitude is a person's home address. Log the city if you must log anything.

## Common pitfalls

- **Missing the Info.plist usage string.** No `NSLocationWhenInUseUsageDescription` means the prompt never appears and you get no location — silently. Always the first thing to check.
- **Requesting Always on first launch.** Ask When-In-Use first; escalate to Always only after showing why. Up-front Always crushes your grant rate.
- **Using `kCLLocationAccuracyBest` when a city would do.** Best hammers the GPS and the battery. Pick the coarsest accuracy your feature can tolerate.
- **Never calling `stopUpdatingLocation()`.** Updates left running keep the GPS awake and drain the battery. Stop as soon as you have your fix.

## Interview lens

If asked "how do you get the user's location?", lead with the permission flow, because that's what they're testing: set the delegate, call `requestWhenInUseAuthorization()`, add the `NSLocationWhenInUseUsageDescription` string to Info.plist, and start updates only inside `locationManagerDidChangeAuthorization` once you actually have consent.

The follow-up is almost always about battery. Say: I set `desiredAccuracy` to the coarsest value that works, I call `stopUpdatingLocation()` the instant I have my fix, and for background-ish needs I prefer significant-location-change or region monitoring over continuous GPS. Naming geofencing with `CLCircularRegion` shows you know the low-power path.

If they probe privacy, hit three points: never ask for Always up front, handle iOS 14 approximate accuracy as a normal case, and keep usage strings honest. If MapKit comes up, mention the SwiftUI `Map` with `Marker`/`Annotation`, a `MapCameraPosition`, and `UserAnnotation()` for the blue dot — and that it only shows once location permission is granted.
