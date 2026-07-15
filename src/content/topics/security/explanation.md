## The problem: four places your secrets leak

Picture a banking app. It holds an auth token, talks to a server, and stores the user's session. Here are four lines that all look harmless and each hands something to an attacker:

```swift
UserDefaults.standard.set(authToken, forKey: "token")   // 1
let apiKey = "sk_live_9f3a...c21"                        // 2
URLSession.shared.dataTask(with: request)                // 3
try data.write(to: fileURL)                              // 4
```

Line 1 stores the token in `UserDefaults`, which is a plain unencrypted file. **The attacker here is anyone who can read the file system** — someone with a stolen, jailbroken device, or a copy of an unencrypted device backup. They open the plist and read the token in cleartext.

Line 2 bakes the API key into the compiled app. **The attacker is anyone with the `.ipa`** — the app binary is just a zip; running `strings` on it dumps every hard-coded literal, including that key. There is no such thing as a secret hidden in the bundle.

Line 3 sends a request. **The attacker is a man-in-the-middle** — someone on the same coffee-shop Wi-Fi, or a rogue proxy, who intercepts traffic. If they can convince the app to trust their certificate, they read and rewrite everything.

Line 4 writes a file. **The attacker is a thief who steals a locked device.** If the file isn't encrypted, they pull the flash storage and read it without ever unlocking the phone.

This lesson is the defense for each one: Keychain access control (line 1), why nothing in the bundle is safe (line 2), certificate pinning and ATS (line 3), and Data Protection (line 4).

## Keychain access control: not just "put it in the Keychain"

The prior lesson (`userdefaults-keychain`) established the basic rule: secrets go in the **Keychain** — an encrypted, system-managed store — not in `UserDefaults`. This lesson goes past "use the Keychain" into *how* you control access to what's in it.

Just moving a token into the Keychain isn't the whole answer. The question that separates a senior from a junior is: **when is that encrypted item actually readable?** That's set by the `kSecAttrAccessible` attribute you pass when you write the item:

```swift
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrAccount as String: "authToken",
    kSecValueData as String: tokenData,
    kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlocked,   // the access level
]
SecItemAdd(query as CFDictionary, nil)
```

The accessibility value decides the window in which the OS will hand the decrypted bytes back to you:

- `kSecAttrAccessibleWhenUnlocked` — readable only while the device is unlocked. A background task that runs on a locked phone gets an error, not the secret. This is the default and the right choice for most tokens.
- `kSecAttrAccessibleAfterFirstUnlock` — locked at boot, but once the user unlocks *once* after a reboot, the item stays readable even when they lock the screen again. Use this for a secret a background refresh needs while the phone sits locked in a pocket.
- `kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly` — readable only while unlocked, only if a passcode is set, and never restored to a different device.

### The ...ThisDeviceOnly suffix

Any of these levels can carry a `ThisDeviceOnly` suffix, and it changes one thing: **migration.**

```swift
kSecAttrAccessibleWhenUnlockedThisDeviceOnly
```

Without the suffix, the item is included in an encrypted iCloud/iTunes backup and can be restored onto a *new* device. With `ThisDeviceOnly`, the item is welded to this specific device — it never leaves in a backup and never appears on a replacement phone. For a device-bound cryptographic key, that's exactly what you want; for a token you'd like to survive an upgrade to a new phone, it isn't.

### Requiring biometrics to read an item: SecAccessControl

The accessibility levels above gate on *device state* (locked / unlocked). To gate on *the user proving who they are*, you attach a `SecAccessControl` object instead:

```swift
let access = SecAccessControlCreateWithFlags(
    nil,
    kSecAttrAccessibleWhenUnlocked,
    .biometryCurrentSet,       // require a currently-enrolled Face ID / Touch ID
    nil
)
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrAccount as String: "authToken",
    kSecValueData as String: tokenData,
    kSecAttrAccessControl as String: access as Any,   // replaces kSecAttrAccessible
]
```

Now the OS itself won't decrypt this item until a biometric (or passcode) check passes. The prompt is presented *by the system* during the Keychain read — your code never sees the biometric result, only whether the read succeeded. The `.biometryCurrentSet` flag adds a sharp-edged bonus: if someone later enrolls a new fingerprint or face, the item is invalidated. An attacker can't add their own face and unlock your secret.

## Biometrics with LocalAuthentication

Sometimes you want to run a biometric check yourself — to unlock a screen, or before showing sensitive UI — rather than binding it to a specific Keychain item. That's the **LocalAuthentication** framework, centered on `LAContext`.

Start by asking whether the check is even possible:

```swift
let context = LAContext()
var error: NSError?
let canDo = context.canEvaluatePolicy(
    .deviceOwnerAuthenticationWithBiometrics,
    error: &error
)
```

`canEvaluatePolicy` returns `false` (and fills `error`) if the device has no biometric hardware, no face/finger enrolled, or biometrics are locked out after too many failures. You check this before offering a "Unlock with Face ID" button so you don't show a button that can't work.

Then run the check:

```swift
context.evaluatePolicy(
    .deviceOwnerAuthenticationWithBiometrics,
    localizedReason: "Unlock your account"
) { success, error in
    if success {
        // proceed
    }
}
```

The `localizedReason` string is shown to the user in the system prompt, so it must be a real human sentence. There's also a policy `.deviceOwnerAuthentication` (note: no `WithBiometrics`) that falls back to the passcode if biometrics fail — use it when a passcode is an acceptable backup.

### The Info.plist string Face ID requires

Face ID has one extra requirement Touch ID doesn't: an **`NSFaceIDUsageDescription`** key in `Info.plist`. Without it, the first Face ID call crashes the app. It's the same usage-string pattern as camera or location permissions — a sentence explaining why you need it.

### Predict: does passing the Face ID check decrypt your token?

Here's the trap. You write:

```swift
context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                       localizedReason: "Unlock") { success, _ in
    if success {
        showDashboard()   // is the user's token now available?
    }
}
```

Predict: when `success` is `true`, has anything about your stored secret changed?

Answer: **no.** `evaluatePolicy` returns a plain `Bool`. It does not decrypt, fetch, or produce your token — it only tells you a face was recognized. The secret still sits in the Keychain, and you still have to go read it. Biometrics *gate* access; they don't *hold* the secret.

This matters because of the failure mode it warns against: **never let a bare boolean be the only gate.**

```swift
if biometricPassed {
    isLoggedIn = true          // WRONG — nothing was ever protected
    let token = hardcodedToken // the secret was reachable all along
}
```

If the secret was reachable without the biometric, an attacker who patches the app to skip the `if` gets straight through. The secure pattern binds the two together: put the secret in a Keychain item guarded by `SecAccessControl`, so the *only* way to get the bytes is for the biometric check to pass at the OS level. Then there's no boolean to bypass — the decryption itself depends on the check.

## Certificate and public-key pinning

ATS (next section) makes your app trust any certificate signed by a certificate authority the system trusts. That's the whole public web's trust model — and it's also the hole a man-in-the-middle crawls through. If an attacker can get *any* CA to issue a cert for your domain (or installs a corporate/malicious root on the device), the app trusts it and the "encrypted" connection is readable to them.

**Pinning** closes that: you tell the app to trust *only* your server's specific certificate or public key, ignoring the general CA system. You do it in a `URLSessionDelegate` by handling the auth challenge yourself:

```swift
func urlSession(_ session: URLSession,
                didReceive challenge: URLAuthenticationChallenge,
                completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    guard let serverTrust = challenge.protectionSpace.serverTrust,
          let cert = SecTrustGetCertificateAtIndex(serverTrust, 0) else {
        completionHandler(.cancelAuthenticationChallenge, nil)
        return
    }

    let serverKey = SecCertificateCopyKey(cert)          // the presented key
    if serverKey == myPinnedPublicKey {                  // compare to your pin
        completionHandler(.useCredential, URLCredential(trust: serverTrust))
    } else {
        completionHandler(.cancelAuthenticationChallenge, nil)   // reject
    }
}
```

When the server presents its certificate, you extract the public key and compare it against a copy you shipped inside the app. Match: proceed. Mismatch: cancel the connection. A man-in-the-middle presents a *different* key, fails the compare, and gets nothing.

### The trade-off: pinning breaks on rotation

Pinning has a real cost. Certificates expire and get rotated, typically once a year. **The day your server swaps to a new cert, every app pinning the old one stops connecting** — and you can't fix it without an App Store update, which takes days.

Two things soften this:

- **Pin the public key, not the whole certificate.** A renewed certificate often reuses the same key pair, so a key pin survives a routine renewal that a full-cert pin would break.
- **Ship a backup pin.** Pin two keys — the live one and a spare you'll rotate to next — so you can switch servers to the spare without bricking older app versions.

Pinning is a senior-level trade: you're buying strong MITM protection at the price of an operational obligation to manage key rotation carefully.

## App Transport Security (ATS)

ATS is the baseline the pinning section builds on. Since iOS 9, **HTTPS is enforced by default** — a plain `http://` request is blocked by the OS before it leaves the app, and the connection must also use TLS 1.2+ with strong ciphers. You get transport encryption for free just by using `https://` URLs.

You *can* poke holes in ATS with `Info.plist` exceptions:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

`NSAllowsArbitraryLoads` turns ATS off entirely and re-allows cleartext HTTP. Treat any ATS exception as a **code smell**: it means some endpoint is either plain HTTP or using weak TLS, and it's a line an App Store reviewer will question. A narrow per-domain exception for one legacy server is sometimes defensible; a blanket `NSAllowsArbitraryLoads` almost never is.

## Data Protection: files encrypted with the device

The Keychain handles small secrets. For *files* you write to disk, iOS has **Data Protection** — hardware-backed encryption tied to the device passcode, applied per-file via a protection class:

```swift
try data.write(to: fileURL, options: .completeFileProtection)
```

`.completeFileProtection` maps to the **`.complete`** class: the file's contents are encrypted and *only decryptable while the device is unlocked*. Lock the screen and the encryption key is evicted from memory — even your own app can't read the file until the user unlocks again. This is the strongest class, right for genuinely sensitive documents.

The looser class is **`.completeUntilFirstUserAuthentication`** (the system default for most files):

```swift
try data.write(to: fileURL, options: .completeUnlessOpen)   // one of several classes
```

`completeUntilFirstUserAuthentication` keeps the file encrypted at rest but, once the user unlocks the device *once* after boot, leaves it readable for the rest of that session even when the screen locks. It's the pragmatic default — a background process can still work on a locked-in-pocket phone — but it protects a stolen powered-off device rather than a stolen-while-locked one. The choice is the same tension as the Keychain accessibility levels: `.complete` is stricter but blocks background access; `completeUntilFirstUserAuthentication` is friendlier to background work but readable across a locked session.

## Common pitfalls

- **Hard-coding secrets in source.** `let key = "sk_live_..."` ships in the binary; `strings` on the `.ipa` dumps it. Real secrets come from the server after authentication, never baked into the app.
- **Logging tokens.** `print(authToken)` or a crash-reporter breadcrumb sends the secret to console logs and third-party dashboards. Never log credentials, even in DEBUG.
- **Trusting all certs in DEBUG and shipping it.** A delegate that returns `.useCredential` unconditionally (added to test against a self-signed dev server) is a total MITM hole if it survives into release. Guard it behind `#if DEBUG` at minimum, ideally delete it.
- **Treating a jailbreak as impossible.** On-device protections assume the OS is honest. On a jailbroken device that assumption is gone — so the strongest defense is that the *secret itself* isn't on the device (server-issued, short-lived tokens), not a jailbreak-detection check the attacker can also patch out.
- **A bare `isLoggedIn` boolean as the only gate.** If the secret is reachable without the biometric-guarded Keychain read, patching out the check bypasses everything.

## Interview lens

If asked "how do you store a token securely," don't stop at "the Keychain." Go one level deeper: name a `kSecAttrAccessible` level and say *why* (`WhenUnlocked` for most tokens, `AfterFirstUnlock` when a background task needs it on a locked device), and mention `ThisDeviceOnly` to keep it out of backups. That specificity is the tell that you've actually shipped this.

For biometrics, the point interviewers fish for is that **biometrics gate, they don't store.** `evaluatePolicy` returns a `Bool` — it doesn't hand you the secret. The secure design binds the two by guarding the Keychain item with `SecAccessControl`, so the decryption itself requires the check; a bare `isLoggedIn = true` after a Face ID success is the classic wrong answer.

On pinning, lead with the threat (MITM defeats CA trust) and *immediately* name the trade-off — it breaks on cert rotation — plus the mitigation: pin the public key and ship a backup pin. Knowing the downside is what marks the senior answer.

If they ask about ATS or Data Protection, keep it crisp: ATS enforces HTTPS/TLS by default and any `Info.plist` exception is a smell; Data Protection encrypts files with `.complete` (readable only while unlocked) versus `completeUntilFirstUserAuthentication` (readable across a session after the first unlock). Both are the same lock-state trade you saw in the Keychain levels.
