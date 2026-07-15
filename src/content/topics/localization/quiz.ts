import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "loc-why-not-concat",
    type: "mcq",
    prompt:
      "Why is `\"You have \" + String(n) + \" items\"` a poor way to build a localized label?",
    options: [
      "It is slower than interpolation because each `+` allocates a brand-new intermediate String on the heap before the final result",
      "The glued-together pieces can't be reordered or pluralized by a translator, and word order differs across languages",
      "String concatenation with `+` is not even permitted on localized strings, so this line fails to compile in a shipped app",
      "It forces the number to render in US grouping style, which is the one and only thing that ever breaks in translation",
    ],
    answer: 1,
    explanation:
      "Concatenation freezes the word order and bakes in the plural ending. A translator gets three disconnected fragments and can't reorder them or handle plural rules. Localization needs one key with format arguments.",
  },
  {
    id: "loc-key-vs-value",
    type: "mcq",
    prompt:
      "In `Text(\"Hello\")` rendered as \"Bonjour\" on a French device, what are `\"Hello\"` and `\"Bonjour\"`?",
    options: [
      "`\"Hello\"` is the value and `\"Bonjour\"` is the key, since the key is always the language the device is currently set to",
      "Both are values; the key is a hidden numeric identifier that Xcode assigns to each string automatically during extraction",
      "`\"Hello\"` is the key the system looks up; `\"Bonjour\"` is the value it finds for French",
      "They are two independent keys, and the catalog stores a mapping row that links the first key across to the second key",
    ],
    answer: 2,
    explanation:
      "The string you write is the **key** — the stable identifier searched for. The translated string found for that language is the **value**. One key maps to many values, one per language.",
  },
  {
    id: "loc-xcstrings",
    type: "mcq",
    prompt: "What is a String Catalog (`.xcstrings`)?",
    options: [
      "A single file holding every key with a column per language, populated by Xcode extracting keys from the build",
      "A runtime cache that stores translations downloaded from the App Store the first time a user switches their device language",
      "A per-language folder of plain text files you hand-edit, one entry per line, which is the format Apple recommends today",
      "A compiler plugin that translates strings on the fly using an on-device machine-learning model bundled inside the app",
    ],
    answer: 0,
    explanation:
      "A String Catalog is one `.xcstrings` file with a language column per translation. Xcode extracts keys from your `Text(...)` and `String(localized:)` calls at build time, so the catalog stays in sync with your code.",
  },
  {
    id: "loc-migrate-fill",
    type: "fill",
    prompt:
      "The older macro `___(\"Hello\", comment: \"\")` still works and still gets extracted into a String Catalog.",
    answers: ["NSLocalizedString"],
    hint: "Starts with NS; the classic Foundation localization macro.",
    explanation:
      "`NSLocalizedString` is the legacy way to mark a string. It still compiles and still feeds the `.xcstrings` catalog, so migration is gradual — new code just prefers `String(localized:)`.",
  },
  {
    id: "loc-plural-predict",
    type: "predict",
    prompt: "With `count` equal to 1, what does this show?",
    code:
      "let count = 1\n" +
      "Text(\"You have \\(count) items\")",
    options: [
      "You have 1 items",
      "You have 1 item",
      "A compile-time error, because a count of exactly 1 needs its own separate key defined first",
      "You have 1 item(s), since Swift auto-appends the parenthesized suffix whenever a number is interpolated",
    ],
    answer: 0,
    explanation:
      "The `s` is hard-coded into the literal, so `count == 1` still prints \"1 items\". The fix is a **plural variation** in the catalog, which supplies a separate value for the `one` category.",
  },
  {
    id: "loc-plural-rules",
    type: "mcq",
    prompt: "Why can't you fix pluralization by writing your own `if count == 1` check in code?",
    options: [
      "Because Swift bans branching on a count inside any string that has been marked for localization by the compiler",
      "Because the check would run on a separate background thread and only finish long after the label was already drawn on screen",
      "Because languages have different plural categories — Arabic has six — so a one-vs-other check is wrong in many of them",
      "Because `count == 1` compares against a plain Int while the interpolated value has by then silently become a locale-formatted String",
    ],
    answer: 2,
    explanation:
      "A one-vs-other check only fits languages with two plural forms. Arabic has six (zero, one, two, few, many, other). A plural variation lets the system apply each language's own rules instead of your guess.",
  },
  {
    id: "loc-positional-senior",
    type: "mcq",
    prompt:
      "A string has two arguments: `\"%@ sent you %@\"`. Why rewrite it as `\"%1$@ sent you %2$@\"`?",
    options: [
      "The numbered form runs measurably faster at runtime because the formatter can then skip re-scanning the whole string to count its arguments",
      "Positional specifiers let a translator reorder the arguments, since some languages need the objects in the opposite order",
      "Plain `%@` only ever accepts string values, whereas the numbered `%1$@` form is strictly required before you can pass any integer argument at all",
      "Without the numbers both of the two `%@` holes would end up receiving the very same first argument, and the second value gets silently dropped",
    ],
    answer: 1,
    difficulty: "senior",
    explanation:
      "`%1$@` and `%2$@` bind each hole to a specific argument by number. A translator can then reorder them (`%2$@ ... %1$@`) to match a language's word order without touching your code.",
  },
  {
    id: "loc-currency-predict",
    type: "predict",
    prompt: "On a German device, which line correctly displays a price with the right symbol and separators?",
    code:
      "let price = 1000.50\n" +
      "let a = \"$\" + String(price)\n" +
      "let b = price.formatted(.currency(code: \"EUR\"))",
    options: [
      "`a`, because prefixing the symbol yourself is the portable approach that works identically in every region",
      "Neither, since currency formatting always requires a manually configured NumberFormatter instance set up in advance",
      "Both, as `.currency` merely appends a symbol onto the exact same hand-built US-style number that line `a` produces",
      "`b`, because `.currency` reads the locale and renders the symbol, grouping, and decimal separators correctly",
    ],
    answer: 3,
    explanation:
      "Line `a` hard-codes the dollar sign and US formatting. Line `b` uses a **format style** that reads the `Locale`, so a German device shows `1.000,50 €` — right symbol, right separators, right position.",
  },
  {
    id: "loc-leading-trailing",
    type: "fill",
    prompt:
      "To make padding flip correctly for right-to-left languages like Arabic, use `.padding(.___, 16)` instead of `.left`.",
    answers: ["leading"],
    hint: "The edge where reading starts; its opposite is 'trailing'.",
    explanation:
      "`leading` means the side reading starts on — the left in English, the right in Arabic. Using leading/trailing lets the system mirror the layout automatically; `.left` stays pinned to the physical left.",
  },
  {
    id: "loc-testing-multi",
    type: "multi",
    prompt: "Select **all** true statements about testing localization before real translations exist.",
    options: [
      "A pseudolanguage lets you exercise a locale without owning a real translation for it yet",
      "The Double-Length Pseudolanguage doubles every string to reveal labels that clip or truncate",
      "Right-to-left issues can be caught by previewing a mirrored layout rather than shipping to Arabic users first",
      "Pseudolanguages permanently replace your real translations and must be manually removed before you can release the app",
    ],
    answers: [0, 1, 2],
    explanation:
      "Pseudolanguages are throwaway test locales — they don't touch your real translations (option 4 is false). The Double-Length one exposes clipping, and mirrored previews surface right-to-left layout bugs early.",
  },
  {
    id: "loc-rtl-senior",
    type: "predict",
    prompt: "In a mirrored Arabic layout, where does this padding end up?",
    code:
      "HStack {\n" +
      "    Text(\"Favorite\")\n" +
      "}\n" +
      ".padding(.leading, 16)",
    options: [
      "Pinned to the physical left edge, because padding amounts are always measured from the screen's left regardless of language",
      "On the right edge, because leading resolves to the side reading starts on, which is the right in a right-to-left layout",
      "Split evenly across the left and right edges, since a mirrored layout distributes leading padding symmetrically for balance",
      "Removed entirely, because leading and trailing insets are ignored by the system whenever the interface is being mirrored",
    ],
    answer: 1,
    difficulty: "senior",
    explanation:
      "`leading` is the reading-start side, so it resolves to the right edge in Arabic. That is exactly why leading/trailing beat left/right — the padding follows the mirrored layout automatically.",
  },
  {
    id: "loc-flashcard",
    type: "flashcard",
    prompt:
      "Explain how you localize an app properly: marking text, String Catalogs, plurals, format arguments, locale-aware formatting, and layout. Answer aloud, then reveal.",
    modelAnswer:
      "You **mark** user-facing text for translation rather than translating by hand: `Text(\"...\")` does it automatically in SwiftUI, and `String(localized:)` does it in plain code. The string you write is the **key**; the translation found for the user's language is the **value**. Keys and values live in a **String Catalog** (`.xcstrings`) — one file with a column per language — and Xcode **extracts** the keys from your code at build time. It replaced the old `Localizable.strings` files; `NSLocalizedString` still works and still feeds the catalog, so migration is gradual. For plurals you never hard-code an ending — languages differ (English has two forms, Arabic six), so you add a **plural variation** in the catalog (or the older `.stringsdict`) and let the system pick the form from the number. Runtime values go into **format arguments** (`%@`, `%lld`), and with more than one argument you use **positional specifiers** (`%1$@`, `%2$@`) so translators can reorder them. You never format numbers, dates, or currency by hand — you use a **format style** like `price.formatted(.currency(code:))` that reads the `Locale`. And for layout you use **leading/trailing** (not left/right) so right-to-left languages mirror automatically, testing with **pseudolanguages** like Double-Length before real translations exist.",
    keyPoints: [
      "Mark text: Text(...) auto; String(localized:) in code — key vs value",
      "String Catalog (.xcstrings): one file, column per language, keys extracted at build",
      "Plurals: variation per category, not a hard-coded ending; Arabic has six forms",
      "Format arguments (%@, %lld) with positional %1$@/%2$@ so translators reorder",
      "Locale-aware formatting via format styles like .currency(code:), never by hand",
      "Layout: leading/trailing mirror for right-to-left; test with pseudolanguages",
    ],
    explanation:
      "A strong answer frames translation as a system lookup (key→value via the catalog), stresses that plurals and formatting are locale-driven not hand-rolled, and adds the layout mirroring detail for right-to-left languages.",
  },
];

export default quiz;
