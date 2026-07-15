import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sec-hardcoded-key",
    type: "mcq",
    prompt:
      "You put `let apiKey = \"sk_live_9f3a...\"` in your Swift source. How exposed is that key in the shipped app?",
    options: [
      "Fully exposed — the `.ipa` is a zip and running `strings` on the binary dumps the literal",
      "Safe as long as the source repository itself is kept private and the build is done on a trusted machine",
      "Encrypted automatically because Xcode obfuscates all string literals inside the compiled release binary",
      "Only reachable by someone who can attach a debugger to the live running process on a jailbroken phone",
    ],
    answer: 0,
    explanation:
      "There is no secret in a bundle. The compiled app ships every string literal in cleartext; `strings` on the extracted binary reveals it. Real secrets are issued by the server after auth, never baked in.",
  },
  {
    id: "sec-accessible-default",
    type: "mcq",
    prompt:
      "Which `kSecAttrAccessible` level lets a background task read a Keychain item while the phone sits locked in a pocket, but keeps it locked until the first unlock after a reboot?",
    options: [
      "`kSecAttrAccessibleAfterFirstUnlock`",
      "`kSecAttrAccessibleWhenUnlocked`, since it stays available the whole time the device has been powered on at least once",
      "`kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly`, which additionally refuses to ever migrate the item to a replacement device",
      "`kSecAttrAccessibleAlways`, because it removes every lock-state restriction on when the encrypted bytes can be read",
    ],
    answer: 0,
    explanation:
      "`AfterFirstUnlock` is locked at boot but readable — even on a locked screen — once the user unlocks once. That's the right level for a background refresh that must run while the phone is locked. `WhenUnlocked` would fail on the locked screen.",
  },
  {
    id: "sec-thisdeviceonly",
    type: "mcq",
    prompt: "What does adding the `ThisDeviceOnly` suffix to an accessibility level change?",
    options: [
      "The item is excluded from encrypted backups and never restored onto a different or replacement device",
      "The item can only be read after the user has explicitly passed a Face ID or Touch ID biometric verification prompt",
      "The item is automatically deleted from the Keychain the moment the app that created it is removed from the device",
      "The item becomes readable by any other app from the same developer that shares the identical Keychain access group",
    ],
    answer: 0,
    explanation:
      "`ThisDeviceOnly` welds the item to this device: it's kept out of iCloud/iTunes backups and never migrates to a new phone. It says nothing about biometrics, app deletion, or sharing groups.",
  },
  {
    id: "sec-biometric-decrypt",
    type: "predict",
    prompt:
      "`evaluatePolicy` reports `success == true`. Has your stored auth token been decrypted or fetched by this call?",
    code:
      "context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,\n" +
      "                       localizedReason: \"Unlock\") { success, _ in\n" +
      "    if success {\n" +
      "        // is the token available right here?\n" +
      "    }\n" +
      "}",
    options: [
      "No — it returns only a `Bool`; the secret still sits in the Keychain and you must go read it",
      "Yes, the matching Keychain item is decrypted and passed into the completion handler's second argument",
      "Yes, but only for items that were written with the `kSecAttrAccessibleWhenUnlocked` accessibility level",
      "No, and moreover the call permanently invalidates the token until a fresh passcode entry re-enrolls it",
    ],
    answer: 0,
    explanation:
      "Biometrics *gate*, they don't *store*. `evaluatePolicy` hands back a plain `Bool` — nothing about your secret changes. You still perform a separate Keychain read to get the bytes.",
  },
  {
    id: "sec-only-gate",
    type: "predict",
    prompt: "Why is this a security bug even though the Face ID check runs?",
    code:
      "if biometricPassed {\n" +
      "    isLoggedIn = true\n" +
      "    let token = hardcodedToken\n" +
      "}",
    options: [
      "The secret is reachable without the check, so patching out the `if` bypasses the whole thing",
      "`biometricPassed` should have been declared with `let` rather than `var` to prevent later reassignment",
      "The check should use `.deviceOwnerAuthentication` so that a device passcode can serve as the fallback path",
      "Face ID results are asynchronous, so `biometricPassed` is read before the evaluation has actually finished running",
    ],
    answer: 0,
    explanation:
      "A bare boolean gate protects nothing: the token is present regardless of the check, so an attacker who patches out the `if` walks right in. The fix binds the secret to a `SecAccessControl`-guarded Keychain item, so decryption itself requires the biometric.",
  },
  {
    id: "sec-canevaluate-fill",
    type: "fill",
    prompt:
      "Before offering an \"Unlock with Face ID\" button, you call `LAContext`'s ___ method to confirm biometrics are available and enrolled.",
    answers: ["canEvaluatePolicy"],
    hint: "It's the check you run *before* `evaluatePolicy`.",
    explanation:
      "`canEvaluatePolicy(_:error:)` returns `false` (and fills the error) when there's no biometric hardware, nothing enrolled, or biometrics are locked out — so you don't show a button that can't work.",
  },
  {
    id: "sec-faceid-plist-fill",
    type: "fill",
    prompt:
      "Face ID requires an `___` key in Info.plist; without it the first Face ID call crashes the app.",
    answers: ["NSFaceIDUsageDescription"],
    hint: "Same NS...UsageDescription pattern as camera and location.",
    explanation:
      "`NSFaceIDUsageDescription` is the usage-string key Face ID needs. It's the same permission-string pattern as `NSCameraUsageDescription` — a human sentence explaining why the app uses it.",
  },
  {
    id: "sec-pinning-tradeoff",
    type: "mcq",
    prompt:
      "Your app pins the server's full certificate. What is the main operational risk of this?",
    options: [
      "When the server rotates to a new certificate, pinned app versions stop connecting until an App Store update ships",
      "Certificate pinning silently disables App Transport Security, so all other endpoints fall back to plain cleartext HTTP",
      "Pinning forces every request through a single shared TLS session, which becomes a throughput bottleneck under load",
      "The pinned certificate has to be fetched from the server on launch, adding a blocking round-trip before any real request",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A full-cert pin breaks the day the cert is rotated — older apps can't connect until an update ships (days). Mitigate by pinning the *public key* (survives a renewal that reuses the key pair) and shipping a backup pin.",
  },
  {
    id: "sec-pinning-mitigations",
    type: "multi",
    prompt: "Select **all** techniques that reduce the risk of pinning breaking on certificate rotation.",
    options: [
      "Pin the public key instead of the whole certificate",
      "Ship a backup pin for a spare key you can rotate to",
      "Add `NSAllowsArbitraryLoads` so a failed pin falls back to plain HTTP",
      "Disable the `URLSessionDelegate` challenge handler in release builds",
    ],
    answers: [0, 1],
    explanation:
      "Public-key pinning survives a renewal that reuses the key pair, and a backup pin lets you switch servers without bricking old apps. Falling back to cleartext HTTP or disabling the check in release would defeat pinning entirely.",
  },
  {
    id: "sec-ats-smell",
    type: "mcq",
    prompt:
      "You find `NSAllowsArbitraryLoads` set to `true` in a shipping app's Info.plist. What does that tell you?",
    options: [
      "ATS is switched off entirely, re-allowing cleartext HTTP — a smell an App Store reviewer will question",
      "The app has enabled certificate pinning for every domain it connects to across the whole network stack",
      "TLS 1.3 is being required globally, which is a stricter posture than the platform's normal default settings",
      "Background URLSession downloads are permitted to continue running even while the device screen is locked",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`NSAllowsArbitraryLoads` turns ATS off and re-permits plain HTTP. It's a code smell — some endpoint is cleartext or weak-TLS. A narrow per-domain exception can be defensible; a blanket one almost never is.",
  },
  {
    id: "sec-flashcard",
    type: "flashcard",
    prompt:
      "A reviewer asks how you secure an iOS app's token, network traffic, and on-disk files. Walk through Keychain access control, biometrics, pinning, ATS, and Data Protection. Answer aloud, then reveal.",
    modelAnswer:
      "**Token:** store it in the **Keychain**, not `UserDefaults`, and set a `kSecAttrAccessible` level to control *when* it's readable — `WhenUnlocked` for most tokens, `AfterFirstUnlock` when a background task needs it on a locked device — plus `ThisDeviceOnly` to keep it out of backups. To require the user prove identity, attach a `SecAccessControl` with `.biometryCurrentSet` so the OS won't decrypt the item until Face ID/Touch ID passes. **Biometrics:** `LocalAuthentication`'s `LAContext` — `canEvaluatePolicy` to check availability, then `evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)`. Key point: biometrics **gate**, they don't **store** — `evaluatePolicy` returns a `Bool`, so never let a bare `isLoggedIn` be the only gate; bind the secret to a `SecAccessControl`-guarded item instead. Face ID needs `NSFaceIDUsageDescription` in Info.plist. **Traffic:** ATS enforces HTTPS/TLS 1.2+ by default; any `NSAllowsArbitraryLoads` exception is a smell. Add **pinning** in a `URLSessionDelegate` to trust only your server's key and defeat MITM — but pin the **public key** and ship a **backup pin**, because pinning breaks on cert rotation. **Files:** **Data Protection** encrypts per-file — `.complete` (readable only while unlocked) vs `completeUntilFirstUserAuthentication` (readable across a session after first unlock). And never hard-code secrets or log tokens; on a jailbroken device the only real defense is that short-lived secrets aren't on the device at all.",
    keyPoints: [
      "Keychain + kSecAttrAccessible level (WhenUnlocked / AfterFirstUnlock); ThisDeviceOnly excludes backups",
      "SecAccessControl (.biometryCurrentSet) makes decryption require a biometric",
      "Biometrics gate, don't store: evaluatePolicy returns a Bool — never a lone isLoggedIn gate",
      "NSFaceIDUsageDescription required in Info.plist for Face ID",
      "ATS enforces HTTPS by default; NSAllowsArbitraryLoads is a smell",
      "Pinning defeats MITM but breaks on rotation — pin the public key, ship a backup pin",
      "Data Protection: .complete vs completeUntilFirstUserAuthentication",
    ],
    explanation:
      "A senior answer ties each threat to a defense, stresses that biometrics gate rather than store, and names the pinning trade-off (rotation) with its mitigation.",
  },
];

export default quiz;
