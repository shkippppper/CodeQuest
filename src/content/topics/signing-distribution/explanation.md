## The problem: iOS won't run code it doesn't trust

Build an app for the simulator and it just runs — the simulator isn't real hardware, so iOS's trust rules don't apply. Build the exact same app for a physical iPhone and, without one extra step, it refuses to launch at all. A real device demands proof of two things before it'll run your code:

```
1. Who built this binary?          -> a certificate
2. Is this device/app allowed to run it? -> a provisioning profile
```

Everything in this lesson is the machinery that produces those two proofs.

## Certificates: proving who built the binary

A **certificate** is a cryptographic identity, issued by Apple, tied to a private key that only lives on your Mac (in Keychain). When Xcode builds a device binary, it signs it with that private key:

```
codesign --sign "Apple Development: Ada Lovelace (ABCDE12345)" MyApp.app
```

Anyone can *verify* the signature using the matching public certificate — that's how a device checks "this binary really was produced by whoever holds this identity" — but nobody can forge a new signature without the private key. Lose that private key (a wiped Mac with no backup) and you lose the ability to sign as that identity; Apple can revoke the old certificate, but you can't recover it.

There are two certificate types you'll actually touch:

```
Apple Development  -> for running on your own devices during development
Apple Distribution  -> for TestFlight and App Store builds
```

A development certificate proves "this is a build from a known developer's machine, safe to run on registered test devices." A distribution certificate is what Apple's servers themselves require before accepting an upload for TestFlight or App Store review.

## App IDs and capabilities

Before a binary can be signed for distribution, it needs an identity registered with Apple: an **App ID**, essentially your bundle identifier (`com.example.MyApp`) registered in the Apple Developer portal. This is where you also declare **capabilities** — the specific system features your app is allowed to use:

```
App ID: com.example.MyApp
Capabilities: Push Notifications, Sign in with Apple, HealthKit
```

Turn on a capability in Xcode's Signing & Capabilities tab and two things happen: an entry appears in your `.entitlements` file, and Xcode (with an active Apple Developer account) updates the App ID's registered capabilities to match. Miss this step and you'll see a specific, very literal error: the app installs but the feature silently fails, because the entitlement the binary claims doesn't match what's registered for that App ID.

Predict: you add the Push Notifications capability in Xcode, but forget to enable it on the server-side App ID configuration (which can happen with manual signing). What happens when the app tries to register for remote notifications?

Answer: registration fails at the OS level, often with a vague "no valid aps-environment entitlement" error — the local `.entitlements` file and the App ID's registered capabilities have to agree, and a mismatch surfaces as a signing failure, not a runtime bug in your code.

## Provisioning profiles: the piece that ties it together

A **provisioning profile** is the file that bundles everything above into one package Xcode embeds in the app: which App ID this is for, which certificate(s) are authorized to sign it, and — for development builds — which specific devices (by UDID) are allowed to install it.

```
Provisioning Profile: "MyApp Development"
├── App ID: com.example.MyApp
├── Certificates: [Ada's Apple Development cert]
├── Devices: [iPhone UDID 1, iPhone UDID 2]
└── Entitlements: Push Notifications, Sign in with Apple
```

At install time, the device checks the embedded profile: is my UDID on the list, does the certificate that signed this binary match one in the profile, do the entitlements the binary claims match what the profile allows? Fail any of those checks and installation is refused outright — this is the single most common "why won't this run on my phone" wall new iOS developers hit.

Distribution profiles drop the device list entirely, since TestFlight and App Store builds aren't restricted to specific hardware:

```
Development profile -> tied to specific device UDIDs, uses Apple Development cert
Ad Hoc profile        -> also device-limited, uses Apple Distribution cert, installs outside TestFlight
App Store profile      -> no device limit, uses Apple Distribution cert, required for App Store submission
```

## Automatic vs manual signing

Xcode can handle almost all of this for you. With **Automatic signing** enabled (the default for new projects), Xcode creates and renews certificates and provisioning profiles behind the scenes whenever you build, using your signed-in Apple Developer account:

```
Signing & Capabilities
  ☑ Automatically manage signing
  Team: Ada Lovelace (Personal Team)
```

This is the right default for solo developers and small teams: no manual profile downloads, no expiry surprises during local development.

**Manual signing** turns that off — you pick the exact certificate and provisioning profile yourself:

```
Signing & Capabilities
  ☐ Automatically manage signing
  Provisioning Profile: "MyApp App Store — 2026"
  Signing Certificate: "Apple Distribution: Example Inc"
```

Manual signing matters once a team grows past a couple of people, or once builds move to a CI machine that isn't logged into anyone's personal Apple ID: automatic signing needs an interactive, authenticated Xcode session to mint new profiles, which a headless CI runner doesn't have. Manual signing lets you check a specific, already-issued profile into the build pipeline (or fetch it via a tool like Fastlane's `match`) so the same exact signing identity is used every time, reproducibly.

## TestFlight: distributing to testers before the App Store

Once a build is signed with an App Store distribution profile, uploading it to App Store Connect makes it available through **TestFlight** — Apple's beta distribution platform. Two tester tiers behave differently:

```
Internal testers  -> up to 100, must be on your App Store Connect team, no review needed
External testers  -> up to 10,000, any email, first build needs a brief Beta App Review
```

Internal builds are available within minutes of processing; external builds wait on that review pass, which is lighter than full App Store review but still checks for obvious policy violations. Every TestFlight build expires 90 days after upload — testers on an expired build simply can't launch the app anymore until a fresh build is distributed.

## App Store submission

Getting from a TestFlight build to a released app is a metadata step, not a rebuild: the same `.ipa` uploaded for TestFlight is the one you submit for review, attached to a version's listing (screenshots, description, release notes) in App Store Connect.

```
1. Upload build (via Xcode Organizer, or xcodebuild + altool/notarytool in CI)
2. Attach the build to a version in App Store Connect
3. Submit for App Review
4. Apple reviews (guideline compliance, crashes, metadata accuracy)
5. Release — manually, automatically on approval, or on a scheduled date
```

App Review timelines vary, but most first decisions land within a day or two. A rejection comes back with a specific guideline number and reviewer notes — the standard workflow is to reply in Resolution Center if it's a misunderstanding, or fix and resubmit if it's a real issue, without needing to start a new version number.

## Common pitfalls

- *A provisioning profile that's expired or missing a newly added device.* Regenerate it (or let Automatic signing do so) — an expired profile fails installation with no useful runtime error.
- *Entitlements mismatch between the `.entitlements` file and the registered App ID capabilities.* Usually surfaces as a feature silently not working, not a build error.
- *Automatic signing on a CI machine with no logged-in Apple ID.* CI needs manual signing with a profile fetched ahead of time (often via Fastlane `match`), since there's no interactive session to mint one.

## Interview lens

If asked to explain code signing end to end, walk it as a chain: a certificate proves *who* built the binary, an App ID plus its capabilities defines *what* the app is allowed to do, and a provisioning profile ties a certificate, an App ID, and (for development) a device list together into one file the device checks at install time.

If asked automatic vs manual, the practical answer is: automatic for solo/small-team local development because Xcode handles renewal invisibly, manual once CI enters the picture, because CI has no interactive Apple ID session to mint new profiles — it needs a specific, pre-issued profile checked into the pipeline instead.

If the conversation turns to release process, mention that TestFlight and the App Store submission use the *same* signed build — there's no separate "release build" step — and that TestFlight builds expire after 90 days, which trips up teams that assume a beta build stays installable indefinitely.
