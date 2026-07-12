import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sd-cert-purpose",
    type: "mcq",
    prompt: "What does a code signing certificate prove?",
    options: [
      "Which developer identity (backed by a private key) produced the binary",
      "That the app has no bugs",
      "That the app is under a certain file size",
      "Which devices are allowed to install the app",
    ],
    answer: 0,
    explanation:
      "A certificate is a cryptographic identity tied to a private key kept in Keychain. Signing with it proves who built the binary; it doesn't say anything about which devices can install it — that's the provisioning profile's job.",
  },
  {
    id: "sd-dev-vs-dist-cert",
    type: "mcq",
    prompt: "What's the difference between an Apple Development and an Apple Distribution certificate?",
    options: [
      "Development is for running on your own registered devices; Distribution is required for TestFlight/App Store builds",
      "They're interchangeable",
      "Distribution certificates never expire; Development ones expire yearly",
      "Development certificates are issued per-device, Distribution per-team",
    ],
    answer: 0,
    explanation:
      "An Apple Development certificate signs builds for local testing on registered devices. Apple's servers require an Apple Distribution certificate before accepting a build for TestFlight or App Store submission.",
  },
  {
    id: "sd-profile-fill",
    type: "fill",
    prompt: "The file that bundles an App ID, authorized certificates, and (for development) allowed device UDIDs into one package Xcode embeds in the app is called a provisioning ___.",
    answers: ["profile", "provisioning profile"],
    hint: "Checked by the device at install time.",
    explanation:
      "A provisioning profile ties together the App ID, the authorized signing certificate(s), and for development builds, a device allow-list. The device validates all of this at install time.",
  },
  {
    id: "sd-entitlement-mismatch-predict",
    type: "predict",
    prompt: "You enable Push Notifications in Xcode's Signing & Capabilities, but the server-side App ID was never updated to include it (common with manual signing). What happens at runtime?",
    code: `// UIApplication.shared.registerForRemoteNotifications()
// entitlements claim push, but App ID doesn't have it registered`,
    options: [
      "Registration fails, often with a missing aps-environment entitlement error — the entitlements and the App ID's registered capabilities disagree",
      "It works exactly the same, just delayed by a day",
      "The app crashes on launch",
      "Xcode refuses to compile",
    ],
    answer: 0,
    explanation:
      "The local `.entitlements` file must match what's registered for the App ID in the Apple Developer portal. A mismatch surfaces as a signing/entitlement failure at runtime, not a compiler error.",
  },
  {
    id: "sd-profile-types-multi",
    type: "multi",
    prompt: "Select **all** true statements about provisioning profile types.",
    options: [
      "A Development profile is tied to specific device UDIDs",
      "An App Store profile has no device limit",
      "An Ad Hoc profile uses an Apple Development certificate",
      "An App Store profile uses an Apple Distribution certificate",
    ],
    answers: [0, 1, 3],
    explanation:
      "Development and Ad Hoc profiles are both device-limited, but Ad Hoc uses an Apple **Distribution** certificate (not Development) since it's meant for distributing outside TestFlight to a fixed device list. App Store profiles drop the device limit entirely.",
  },
  {
    id: "sd-auto-vs-manual",
    type: "mcq",
    prompt: "Why does manual signing typically replace automatic signing once a project moves to CI?",
    options: [
      "Automatic signing needs an interactive, authenticated Apple ID session to mint profiles, which a headless CI runner doesn't have",
      "Automatic signing is slower than manual signing",
      "CI systems can't read .entitlements files",
      "Apple disables automatic signing for any build not run on a personal Mac",
    ],
    answer: 0,
    explanation:
      "Automatic signing relies on Xcode being logged into a Developer account interactively to create/renew certificates and profiles on the fly. CI has no such session, so it needs manual signing with a pre-issued profile — often fetched via a tool like Fastlane's `match`.",
  },
  {
    id: "sd-testflight-tiers",
    type: "mcq",
    prompt: "What's the key difference between TestFlight internal and external testers?",
    options: [
      "External testers require a Beta App Review for the first build; internal testers don't",
      "Internal testers can number in the thousands; external is capped at 100",
      "External testers need to be on the App Store Connect team",
      "There's no functional difference",
    ],
    answer: 0,
    explanation:
      "Internal testers (up to 100, on the App Store Connect team) get builds within minutes with no review. External testers (up to 10,000, any email) wait on a lighter Beta App Review before the first build becomes available.",
  },
  {
    id: "sd-testflight-expiry-senior",
    type: "predict",
    prompt: "A tester installed a TestFlight build 95 days ago and hasn't updated since. What happens when they try to launch the app?",
    code: `// TestFlight build uploaded 95 days ago, no newer build distributed`,
    options: [
      "The app can no longer launch — every TestFlight build expires 90 days after upload",
      "It launches normally, TestFlight builds never expire",
      "It prompts for an App Store purchase",
      "It silently downgrades to a cached version",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "TestFlight builds expire exactly 90 days after upload. Past that window the app won't launch for testers until a fresh build is distributed — a detail teams often forget when a beta test runs longer than expected.",
  },
  {
    id: "sd-flashcard",
    type: "flashcard",
    prompt:
      "Explain the code signing chain from certificate to App Store release. Answer aloud, then reveal.",
    modelAnswer:
      "A **certificate** is a cryptographic identity backed by a private key in Keychain, proving *who* built a binary — Apple Development certs for local device testing, Apple Distribution certs for TestFlight/App Store. An **App ID** registers the app's bundle identifier with Apple and declares its **capabilities** (Push Notifications, Sign in with Apple, etc.); enabling a capability in Xcode must match what's registered for the App ID, or the entitlement silently fails at runtime. A **provisioning profile** ties a certificate, an App ID, and — for development/Ad Hoc profiles — a list of device UDIDs into one file the device validates at install time; App Store profiles skip the device list since there's no hardware restriction. **Automatic signing** lets Xcode mint and renew all of this using an interactive, logged-in Apple Developer session — the right default solo/small-team choice. **Manual signing** hands control to a specific pre-issued certificate and profile, which is required once CI enters the picture, since CI has no interactive session to create new profiles (tools like Fastlane `match` distribute a shared, pre-issued signing identity instead). Once a build is signed with an App Store distribution profile and uploaded, it becomes available to **TestFlight** testers (internal instantly, external after a lightweight Beta App Review, all builds expiring after 90 days) and the exact same build is what gets attached to a version and submitted for full App Review before release.",
    keyPoints: [
      "Certificate = who built it (private key in Keychain); Development vs Distribution",
      "App ID + capabilities must match the .entitlements file or features silently fail",
      "Provisioning profile ties cert + App ID + device list (dev/Ad Hoc only) together",
      "Automatic signing needs an interactive Apple ID session; CI needs manual signing",
      "Same signed build goes to TestFlight and App Store submission; TestFlight builds expire in 90 days",
    ],
    explanation:
      "A senior answer chains certificate -> App ID/capabilities -> provisioning profile -> distribution channel as one coherent proof-of-trust pipeline, and calls out why CI forces manual signing.",
  },
];

export default quiz;
