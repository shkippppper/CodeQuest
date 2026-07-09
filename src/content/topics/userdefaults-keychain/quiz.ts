import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ud-what",
    type: "mcq",
    prompt: "What is `UserDefaults` best suited for?",
    options: [
      "Small, simple settings like preferences and flags, persisted automatically across launches",
      "Storing passwords and auth tokens securely",
      "Large binary data like images or videos",
      "Relational, queryable datasets",
    ],
    answer: 0,
    explanation:
      "`UserDefaults` is a lightweight key-value store meant for small settings — toggles, usernames, flags. It's not encrypted and not built for large or relational data.",
  },
  {
    id: "ud-missing-key-predict",
    type: "predict",
    prompt: "What does this return if 'hasSeenOnboarding' was never set?",
    code: `let seen = UserDefaults.standard.bool(forKey: "hasSeenOnboarding")
print(seen)`,
    options: [
      "false — the typed getter returns a type-specific default, not nil or a crash",
      "It crashes at runtime",
      "nil, because Bool is optional",
      "true, because unseen defaults to true",
    ],
    answer: 0,
    explanation:
      "Every typed getter has a built-in default for a missing key: `.bool` returns `false`, `.integer` returns `0`, `.string`/`.array` return `nil`. This can silently mask a typo'd key.",
  },
  {
    id: "ud-plist-fill",
    type: "fill",
    prompt: "UserDefaults can only store a handful of types Apple calls ___ types — String, Int/Double/Bool, Data, Date, Array, and Dictionary.",
    answers: ["property-list", "property list", "plist"],
    hint: "Named after the file format UserDefaults is backed by.",
    explanation:
      "Property-list (plist) types are the only ones UserDefaults can store directly. A custom struct isn't one of them — encode it to Data (e.g. with Codable/JSONEncoder) first.",
  },
  {
    id: "ud-limits-multi",
    type: "multi",
    prompt: "Select all true statements about UserDefaults' limitations.",
    options: [
      "It is not encrypted, so it should never store secrets like tokens or passwords",
      "It is not designed for large amounts of data",
      "It supports querying for values matching a condition, like a database",
      "It can only store property-list types directly",
    ],
    answers: [0, 1, 3],
    explanation:
      "UserDefaults is unencrypted and not built for large data, and it only accepts plist types directly. It has no query capability — you look values up by exact key only, one at a time.",
  },
  {
    id: "ud-keychain-mcq",
    type: "mcq",
    prompt: "Why does an auth token belong in the Keychain instead of UserDefaults?",
    options: [
      "The Keychain is encrypted and specifically designed for secrets; UserDefaults is plain, unencrypted storage readable on the file system",
      "The Keychain is faster to read from",
      "UserDefaults cannot store Data values",
      "There's no real difference; either works equally well",
    ],
    answer: 0,
    explanation:
      "The Keychain is Apple's encrypted, system-managed store for small secrets. UserDefaults stores values in plain, unencrypted form — fine for a theme preference, a real security risk for a token.",
  },
  {
    id: "ud-secclass-fill",
    type: "fill",
    prompt: "In the raw Keychain query dictionary, the key that tells the system what *kind* of secret you're storing (e.g. a generic password) is ___.",
    answers: ["kSecClass"],
    hint: "Starts with kSec, paired with a value like kSecClassGenericPassword.",
    explanation:
      "`kSecClass` (paired with a value like `kSecClassGenericPassword`) tells the Keychain what category of item is being stored — there are separate classes for internet passwords, certificates, and keys too.",
  },
  {
    id: "ud-appstorage-predict",
    type: "predict",
    prompt: "What happens when the user toggles this switch?",
    code: `struct SettingsView: View {
    @AppStorage("isDarkModeEnabled") var isDarkModeEnabled = false
    var body: some View {
        Toggle("Dark Mode", isOn: $isDarkModeEnabled)
    }
}`,
    options: [
      "The new value is written to UserDefaults.standard under the key \"isDarkModeEnabled\", and the view updates like it would with @State",
      "Nothing is persisted — @AppStorage only reads once at launch",
      "It writes to the Keychain instead of UserDefaults",
      "It throws a runtime error because Bool isn't a plist type",
    ],
    answer: 0,
    explanation:
      "@AppStorage is sugar over UserDefaults: setting the property writes straight back to UserDefaults.standard under the given key and triggers a SwiftUI view update, just like @State would.",
  },
  {
    id: "ud-reinstall-senior",
    type: "predict",
    prompt: "A user deletes and reinstalls the app. What's the surprising behavior regarding stored auth data?",
    code: `// App stored the auth token in the Keychain before deletion
// User reinstalls the app expecting a clean logged-out state`,
    options: [
      "The Keychain entry survives app deletion by default, so the reinstalled app can silently pick up the old session unless the app explicitly clears it",
      "Both UserDefaults and Keychain data are always wiped on deletion",
      "The Keychain automatically clears itself after 30 days",
      "Reinstalling always forces a fresh Keychain regardless of prior data",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Unlike UserDefaults (wiped with the app's sandbox on deletion), Keychain data persists across app deletion by default. Apps that expect 'reinstall = clean state' need to explicitly clear Keychain entries, often on first launch after install.",
  },
  {
    id: "ud-flashcard",
    type: "flashcard",
    prompt: "Explain how you'd decide where to store a given piece of app data — preference, custom object, or secret — and why. Answer aloud, then reveal.",
    modelAnswer:
      "The first filter is: **is it secret?** Tokens, passwords, and anything that grants access belong in the **Keychain** — an encrypted, system-managed store, accessed via a raw dictionary-based API (`kSecClass`, `kSecAttrAccount`, `kSecValueData`) usually wrapped in a small helper. Everything else small and non-secret — a theme, a flag, a font size — goes in **`UserDefaults`**, a plain-text key-value store automatically persisted to disk. UserDefaults can only hold **property-list types** directly (String, Int/Double/Bool, Data, Date, Array, Dictionary); a custom struct must be **`Codable`**-encoded to `Data` first. UserDefaults is also unsuited for **large or relational data** — every access can touch the whole backing store, and there's no query capability, so a real dataset belongs in Core Data or similar. In SwiftUI, **`@AppStorage`** is convenience sugar directly over `UserDefaults.standard` — same storage, same limits, triggers a view update on change. One gotcha: unlike UserDefaults, **Keychain data survives app deletion** by default, so a reinstalled app can silently resurrect an old session unless that's explicitly handled.",
    keyPoints: [
      "Secret vs non-secret is the primary filter: Keychain vs UserDefaults",
      "UserDefaults only stores plist types directly; custom types need Codable → Data",
      "UserDefaults isn't for large/relational data — no query support",
      "@AppStorage is sugar over UserDefaults.standard, same limits apply",
      "Keychain data survives app deletion; UserDefaults does not",
    ],
    explanation:
      "A strong answer leads with the secret/non-secret decision, then covers the plist-type restriction, UserDefaults' scale limits, what @AppStorage really is, and the app-deletion persistence gotcha.",
  },
];

export default quiz;
