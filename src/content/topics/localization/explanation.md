## The problem: your strings are stuck in English

Here's a label that shows how many items are in a cart:

```swift
let count = 3
let label = "You have " + String(count) + " items"
```

It reads fine in English. Now imagine shipping this app in French, German, or Arabic. Every one of those languages breaks this line in a different way.

Word order differs — some languages put the number after the noun. Plurals differ — "1 items" is wrong in English, and other languages have plural forms English doesn't even have. And the sentence is glued together with `+`, so a translator can't move the pieces around.

**Localization** is adapting an app to a language and region — and it's much more than swapping words. This lesson is about doing it the way the system expects, so the hard cases work for free.

## The building block: mark text for translation

The first job is to tell the system "this string is shown to a person — translate it." You don't translate at runtime yourself; you mark the string, and the system picks the right version for the user's language.

In SwiftUI, this happens automatically:

```swift
Text("Hello")
```

`Text` treats its string as translatable. On a French device it looks up "Hello" and shows "Bonjour" — you wrote nothing extra.

In plain code (no SwiftUI view), you mark it yourself with `String(localized:)`:

```swift
let greeting = String(localized: "Hello")
```

Both do the same lookup. The string you write — `"Hello"` — is the **key**: the stable identifier the system searches for. The translated string it finds — `"Bonjour"` — is the **value**. One key, many values, one per language.

## String Catalogs: one file for every language

Where do those values live? In a **String Catalog** — a file with the `.xcstrings` extension that holds every key and its translation for each language, side by side.

Picture it as a table: one row per key, one column per language.

```
key         English      French       German
"Hello"     Hello        Bonjour      Hallo
"Cancel"    Cancel       Annuler      Abbrechen
```

You don't type keys into it by hand. When you build the app, Xcode scans your code for every `Text("...")` and `String(localized:)` and **extracts** the keys into the catalog automatically. You open the catalog and fill in each column.

String Catalogs replaced the older format, a set of `Localizable.strings` files — one flat text file per language, edited by hand and easy to let drift out of sync. The catalog is one file, keeps every language together, and shows you which strings still need translating.

Migrating is gentle: old code used `NSLocalizedString("Hello", comment: "")`, and that still works and still gets extracted into the catalog. New code prefers `String(localized:)`, but you don't have to rewrite everything at once — both feed the same `.xcstrings` file.

## Pluralization: "1 items" is a bug, not a typo

Back to the cart. Predict what this shows when `count` is 1:

```swift
let count = 1
Text("You have \(count) items")
```

Answer: `You have 1 items`. The `s` is always there, because it's baked into the string. English needs "1 item" and "2 items" — two different forms.

And English is the easy case. English has two plural forms (one, other). Arabic has six (zero, one, two, few, many, other). You cannot hard-code the noun's ending and hope.

The system solves this with a **plural variation**: instead of one value for the key, you give a value *per plural category*, and the system picks the right one from the number. In a String Catalog you mark the string "vary by plural" and fill in each case:

```
count == 1   →   "You have 1 item"
other        →   "You have %lld items"
```

Now `count` of 1 shows "1 item" and `count` of 3 shows "3 items" — the system chose the form using the language's own plural rules, not yours. Arabic gets all six forms; you just fill the columns.

There's also an inline syntax for simple cases, where you describe the noun and let the system inflect it:

```swift
Text("^[\(count) item](inflect: true)")
```

The `inflect: true` tells the system to make "item" agree with `count`. Before String Catalogs, the same job was done in a separate `.stringsdict` file — an XML plist listing each plural form. The catalog absorbs that role, so you rarely touch `.stringsdict` in new code.

## Format arguments: leave holes, let translators fill them

A translated string usually has a runtime value dropped into it — a name, a count, a price. The value is a **format argument**, and the string leaves a hole for it with a specifier:

- `%@` — an object or string (a name, a title)
- `%lld` — a 64-bit integer (a count)
- `%f` — a floating-point number

```swift
String(localized: "Welcome, \(name)")
```

Under the hood the extracted key is `"Welcome, %@"`, and the value `name` fills the `%@` at runtime.

Now the subtle part. Suppose a string has two arguments:

```
"%@ sent you %@"      // "Ada sent you a photo"
```

Some languages need the objects in the *opposite* order — verb first, or the recipient before the sender. If the translator can't reorder the holes, the sentence is wrong. So the system supports **positional specifiers** that number each argument:

```
"%1$@ sent you %2$@"
```

`%1$@` always means the first argument, `%2$@` the second, no matter where they sit in the sentence. A translator can now write `%2$@ ... %1$@` and swap them safely. Whenever a string has more than one argument, use positional forms so translators can reorder freely.

## Locale-aware formatting: never build a date by hand

A `Locale` is the user's language-and-region settings — it decides how numbers, dates, and currency should look. `1,000.50` in the US is `1.000,50` in Germany.

So this is a trap:

```swift
let priceText = "$" + String(price)   // wrong outside the US
```

It hard-codes the dollar sign and US number formatting. A German user paying in euros sees the wrong symbol and the wrong separators.

Instead, ask the value to format itself with a **format style** — a description of *how* to present a value that reads the current `Locale` for you:

```swift
let priceText = price.formatted(.currency(code: "EUR"))
```

On a US device this gives `€1,000.50`; on a German device, `1.000,50 €` — right symbol, right separators, right position, all from the locale. Numbers work the same way with `.number`, and dates have their own format styles (covered in the date-formatting lesson) — the rule is identical: describe the value, let the locale render it.

## Right-to-left and layout: don't hard-code sides

Arabic and Hebrew read right to left. The whole interface mirrors: the back button, the navigation, the text alignment all flip to the other side.

This breaks if you think in "left" and "right". Use **leading** and **trailing** instead — "leading" means the side where reading starts, "trailing" where it ends. In a left-to-right language leading is the left; in Arabic it becomes the right, automatically.

```swift
HStack {
    Image(systemName: "star")
    Text("Favorite")
}
.padding(.leading, 16)   // flips to the right edge in Arabic — correct
```

Had you written `.padding(.left, 16)`, the padding would stay pinned to the physical left even in a mirrored layout, and the design would look broken.

You don't need to speak Arabic to catch these bugs. Xcode offers **pseudolanguages** — fake locales that stress-test your UI. The **Double-Length Pseudolanguage** repeats every string so it's twice as long, exposing labels that get clipped or truncated once real translations arrive. Run your app in one before you ever hand a string to a translator.

## Common pitfalls

- **Concatenating sentences with `+`.** `"You have " + n + " items"` can't be reordered or pluralized. Use one key with format arguments.
- **Hard-coding plural endings.** A trailing `s` breaks at `count == 1` and doesn't exist in many languages. Use a plural variation.
- **Formatting numbers, dates, or currency by hand.** Manual separators and symbols are wrong outside your locale. Use a format style.
- **Thinking in left/right.** Physical sides don't mirror. Use leading/trailing so right-to-left layouts flip for free.

## Interview lens

If asked how you localize an app, don't say "I translate the strings." Say you *mark* user-facing text — `Text(...)` in SwiftUI, `String(localized:)` in code — and Xcode extracts the keys into a **String Catalog** (`.xcstrings`), the modern one-file replacement for `Localizable.strings`. That framing shows you know translation is a system lookup, not manual swapping.

Expect a follow-up on plurals. Say that languages have different plural rules — English has two forms, Arabic six — so you never hard-code a noun's ending; you use a plural variation in the catalog (or the older `.stringsdict`) and let the system pick the form from the number.

If they probe deeper, mention two senior details: positional specifiers (`%1$@`, `%2$@`) so translators can reorder arguments, and locale-aware formatting via format styles like `.currency(code:)` instead of hand-built strings. And for layout, that you use leading/trailing so right-to-left languages mirror automatically, and test with pseudolanguages before real translations exist.
