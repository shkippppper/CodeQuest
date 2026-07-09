## The problem: small settings need to survive an app relaunch

Try this:

```swift
var isDarkModeEnabled = true
```

Quit the app and relaunch it — `isDarkModeEnabled` is back to whatever the code says by default. A plain variable only lives in memory, and memory is wiped the moment the process ends. To remember a user's preference across launches, you need something that writes to disk.

For small, simple settings — a toggle, a username, a "has seen onboarding" flag — Foundation gives you **`UserDefaults`**, a lightweight key-value store backed by a file on disk that's automatically loaded when your app starts.

## Reading and writing with UserDefaults

```swift
UserDefaults.standard.set(true, forKey: "isDarkModeEnabled")
```

`UserDefaults.standard` is the shared default store every part of your app reads and writes through — you rarely need a second one. `.set(_:forKey:)` writes a value under a string key, and the write is persisted to disk automatically (the system batches and flushes it — you don't need to call `save()`).

Reading it back after a relaunch:

```swift
let isDarkModeEnabled = UserDefaults.standard.bool(forKey: "isDarkModeEnabled")
```

`.bool(forKey:)` reads the value back, already typed as `Bool`. Predict: what does this line return if the key was *never* set?

Answer: `false` — not a crash, not `nil`. Every typed getter (`.bool`, `.integer`, `.string`, `.array`) has a built-in default it returns when the key is missing (`false`, `0`, `nil`, `nil` respectively). That's convenient for a fresh install, but it also means a typo in the key string silently reads back a default value instead of failing loudly — worth remembering when a setting "isn't sticking."

## What UserDefaults can actually store: property-list types

`UserDefaults` doesn't store arbitrary Swift values — it can only hold what's called a **property-list type** (or "plist type"): the handful of types that Apple's plist file format understands directly.

```swift
UserDefaults.standard.set("Ada", forKey: "username")           // String
UserDefaults.standard.set(3, forKey: "loginCount")              // Int/Double
UserDefaults.standard.set(["a", "b"], forKey: "recentSearches")  // Array
UserDefaults.standard.set(["theme": "dark"], forKey: "settings") // Dictionary
```

`String`, `Int`/`Double`/`Bool`, `Data`, `Date`, `Array`, and `Dictionary` (where the values are also plist types) are the whole list. Your own custom struct — `User`, `Settings`, anything you defined — is **not** on that list.

To store a custom type, encode it to `Data` first, using the same `Codable` pipeline from the networking lessons:

```swift
struct Settings: Codable { var theme: String; var fontSize: Int }
let data = try JSONEncoder().encode(Settings(theme: "dark", fontSize: 14))
UserDefaults.standard.set(data, forKey: "settings")
```

`Data` *is* a plist type, so this works — you're just storing pre-serialized JSON bytes under the key, and decoding them back out with `JSONDecoder` on read.

## Where UserDefaults stops being the right tool

`UserDefaults` is convenient, but it has real limits that matter once an app grows past a handful of toggles.

It's **not encrypted**. Anything you store is readable on a jailbroken device or in a device backup — fine for a theme preference, wrong for a password or an API token.

It's **not for large data**. Every read of a key can involve loading the whole backing plist; storing megabytes of data (images, big arrays) slows down every access, not just that one key.

It's **not queryable**. There's no way to ask "give me every setting whose value is X" — you look values up by exact key, one at a time. For structured, related data (a list of downloaded articles, a user's saved recipes), a real persistence layer like Core Data or a SQLite-backed store is the right tool — those get their own lessons.

The rule of thumb: `UserDefaults` for small, individual settings; something else for secrets and for anything resembling a dataset.

## Keychain basics: where secrets actually belong

Since `UserDefaults` isn't encrypted, storing a password or auth token there is a real security bug — anyone with access to the device's file system can read it in plain text. Apple's answer is the **Keychain**: an encrypted, system-managed store specifically designed for small secrets — passwords, tokens, encryption keys.

The raw API is C-based and verbose — it works with dictionaries of query parameters instead of typed calls:

```swift
let query: [String: Any] = [
    kSecClass as String: kSecClassGenericPassword,
    kSecAttrAccount as String: "authToken",
    kSecValueData as String: tokenData,
]
SecItemAdd(query as CFDictionary, nil)
```

`kSecClassGenericPassword` tells the Keychain what *kind* of secret this is (there are also classes for internet passwords, certificates, and keys). `kSecAttrAccount` is the lookup key — analogous to `UserDefaults`'s string key — and `kSecValueData` is the secret itself, as `Data`. `SecItemAdd` writes the entry; there are parallel functions `SecItemCopyMatching` to read, `SecItemUpdate` to overwrite, and `SecItemDelete` to remove.

Because that raw dictionary API is easy to get wrong, most real apps wrap it in a small helper type with `save`/`load`/`delete` methods, or reach for a well-tested wrapper library — but understanding what's happening underneath (a class, an account key, and encrypted data) is what interviewers are actually probing for.

## Storing secrets securely: what goes where

The practical rule splits cleanly along one line: **is this data secret?**

```swift
UserDefaults.standard.set("dark", forKey: "theme")          // preference — UserDefaults
// Keychain.save(authToken, forKey: "authToken")             // secret — Keychain
```

A theme name, a font size, a "has completed onboarding" flag — none of these compromise the user if someone reads them. An auth token, a password, a refresh token, a biometric-unlock key — every one of these grants access to something if leaked, so all of them belong in the Keychain, never in `UserDefaults`, never in a plain file.

One more property worth knowing: unlike `UserDefaults`, Keychain data **survives an app deletion** by default. If your app relies on "reinstalling the app resets everything," a leftover Keychain entry from a previous install can silently restore an old logged-in session — something to explicitly account for (e.g. clearing Keychain on first launch after install, if that's the intended behavior).

## @AppStorage: UserDefaults wired straight into SwiftUI

Manually calling `UserDefaults.standard.set(...)` and re-reading it every time a view needs the value works, but SwiftUI has a purpose-built property wrapper that removes the boilerplate: **`@AppStorage`**.

```swift
struct SettingsView: View {
    @AppStorage("isDarkModeEnabled") var isDarkModeEnabled = false

    var body: some View {
        Toggle("Dark Mode", isOn: $isDarkModeEnabled)
    }
}
```

`@AppStorage("isDarkModeEnabled")` reads the current value from `UserDefaults.standard` under that key on first access, and every time the property is *set* — including through the `Toggle`'s binding — it writes straight back to `UserDefaults` and triggers a view update, the same way `@State` does. The default value (`= false`) is what's used the first time the key doesn't exist yet.

`@AppStorage` is sugar over exactly the `UserDefaults` calls from earlier in this lesson — same storage, same plist-type restriction, same lack of encryption. It doesn't do anything Keychain-related; a secret should never go through `@AppStorage`.

## Common pitfalls

- **Storing secrets in UserDefaults.** It's unencrypted and readable on the file system — tokens and passwords belong in the Keychain.
- **Assuming a missing key crashes or returns nil.** Typed getters return a type-specific default (`false`, `0`, empty), which can mask a typo'd key string.
- **Trying to store a custom struct directly.** Only plist types are allowed; encode custom types to `Data` with `Codable` first.
- **Forgetting Keychain data survives app deletion.** A reinstalled app can silently pick up an old session unless you handle that explicitly.

## Interview lens

If asked "where would you store X," the fast filter is: is it secret? Secrets (tokens, passwords) go in the Keychain; everything else small and simple (preferences, flags) goes in `UserDefaults`; anything large or relational goes in a real persistence layer like Core Data.

If asked about `UserDefaults` limits, name three concretely: it's unencrypted, it's not meant for large data since reads can touch the whole backing store, and it only stores property-list types — custom types need to be encoded to `Data` first.

If asked what `@AppStorage` actually is, say it's a SwiftUI property wrapper that reads and writes `UserDefaults.standard` under the hood and triggers a view update on change — it's convenience sugar, not a different storage mechanism, so all of `UserDefaults`'s limits (unencrypted, plist-types-only) still apply.
