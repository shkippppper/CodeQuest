## The problem: "now" means different things to different people

```swift
let now = Date()
print(now)   // 2026-07-10 14:32:07 +0000
```

That printout looks like a normal date and time, but it's hiding something: it's in UTC, a single global time reference. Someone in Tokyo and someone in New York looking at their phones "right now" see very different clock times on their walls, even though `Date()` gave them the exact same value. Getting this wrong is one of the most common sources of real bugs in apps — a reminder that fires at the wrong hour, a message that appears to arrive before it was sent.

This lesson is about the pieces Swift and Foundation give you to handle that correctly: `Date` itself, `Calendar` for splitting it into day/month/hour, time zones for translating it to a place, and formatters for turning it into text a person can read.

## Date is a point in time, not a place on a wall

```swift
let now = Date()
```

A **`Date`** is a single point on a universal timeline, stored as the number of seconds since a fixed reference point (January 1, 2001, UTC). It has no concept of "which day," "which hour," or "which time zone" — those are all human ways of describing a point in time, and `Date` deliberately doesn't know any of them.

```swift
let inOneHour = now.addingTimeInterval(3600)     // 3600 seconds later
let secondsBetween = inOneHour.timeIntervalSince(now)   // 3600.0
```

Because a `Date` is just a number of seconds, math on it is simple arithmetic — add seconds to move forward, subtract two dates to get the interval between them. There's no "what day of the week is that" baked in; that question needs a calendar.

## Calendar turns a point in time into day, month, and hour

```swift
let calendar = Calendar.current
let components = calendar.dateComponents([.year, .month, .day, .hour], from: now)
print(components.year, components.month, components.day)
```

A **`Calendar`** is the set of rules for splitting a `Date` into human units — year, month, day, hour — and it matters which calendar, because those rules aren't universal. The Gregorian calendar most apps use has 12 months and leap years; other calendars (Hebrew, Islamic, Japanese) split time up differently.

`Calendar` also does date arithmetic that respects those rules, which raw `Date` math can't:

```swift
let tomorrow = calendar.date(byAdding: .day, value: 1, to: now)!
```

Predict: what's the difference between `calendar.date(byAdding: .day, value: 1, to: now)` and `now.addingTimeInterval(86400)` (24 hours)?

Answer: usually nothing — but on the day clocks shift for daylight saving time, `addingTimeInterval(86400)` still adds exactly 86,400 seconds and can land on the *wrong* wall-clock hour, while `calendar.date(byAdding: .day, ...)` knows the clock changed and lands on the same wall-clock time the next day. Always use `Calendar` for "add a day," not raw seconds.

Building a specific date from components works the same way, in reverse:

```swift
var components = DateComponents()
components.year = 2026; components.month = 9; components.day = 18
let conferenceDay = calendar.date(from: components)!
```

## Time zones: the same instant, different walls

```swift
let tokyo = TimeZone(identifier: "Asia/Tokyo")!
var calendarInTokyo = Calendar.current
calendarInTokyo.timeZone = tokyo

let hourInTokyo = calendarInTokyo.component(.hour, from: now)
```

A **`TimeZone`** is an offset from UTC (plus daylight saving rules) tied to a place. The same `Date` — the same instant on the universal timeline — produces a different `hour` component depending which time zone you ask the calendar to interpret it in.

This is why `Date` itself never has "a time zone" — it's the calendar's `timeZone` property that decides how to display it. Store and compare dates as plain `Date` values; only pick a time zone at the very last step, when you're about to show something to a person.

```swift
Calendar.current.timeZone            // the device's current time zone
TimeZone(identifier: "UTC")!         // a specific, fixed time zone
```

## DateFormatter and ISO8601

To turn a `Date` into text, use a formatter — never build a string by hand with `components.year`, `components.month`, etc., since that path silently skips localization and time zones.

```swift
let formatter = DateFormatter()
formatter.dateStyle = .medium
formatter.timeStyle = .short
print(formatter.string(from: now))   // "Jul 10, 2026 at 2:32 PM" (in the current locale)
```

`DateFormatter` also supports an exact pattern when you need one specific layout instead of a locale-driven style:

```swift
let custom = DateFormatter()
custom.dateFormat = "yyyy-MM-dd"
print(custom.string(from: now))   // "2026-07-10"
```

For dates exchanged with a server, the standard is **ISO8601** — a fixed, unambiguous text format like `2026-07-10T14:32:07Z` that every platform can parse the same way, unlike a locale-dependent style.

```swift
let iso = ISO8601DateFormatter()
let text = iso.string(from: now)          // "2026-07-10T14:32:07Z"
let parsed = iso.date(from: text)         // back to a Date
```

One classic performance pitfall: both `DateFormatter` and `ISO8601DateFormatter` are expensive to create. Creating a fresh one every time you format a date in a hot loop — a table view scrolling through hundreds of rows — is a measurable slowdown. Create the formatter once and reuse it.

## The modern FormatStyle API

Newer code tends to skip `DateFormatter` entirely and use `Date.FormatStyle`, which reads more like a sentence:

```swift
let text = now.formatted(date: .abbreviated, time: .shortened)
// "Jul 10, 2026 at 2:32 PM"
```

It composes: build up exactly the pieces you want instead of picking from a fixed `dateStyle`/`timeStyle` pair.

```swift
let text2 = now.formatted(
    .dateTime.year().month(.wide).day().hour().minute()
)
// "July 10, 2026 at 2:32 PM"
```

`FormatStyle` also produces relative, human-friendly phrasing without you writing the "how long ago" logic yourself:

```swift
let text3 = now.formatted(.relative(presentation: .named))
// "now" / "in 2 hours" / "yesterday", depending on the date
```

Because it's type-checked at compile time, a typo in a format style is a compiler error; a typo in a `DateFormatter`'s `dateFormat` string is a runtime bug you might not notice until QA finds it.

## Localization

Everything above already localizes for free once you use a formatter instead of hand-built strings, because `Locale` — the user's language and regional conventions — feeds into both `DateFormatter` and `FormatStyle` automatically:

```swift
let french = Locale(identifier: "fr_FR")
print(now.formatted(date: .long, time: .omitted, locale: french))
// "10 juillet 2026"
```

Locale affects more than the language: it changes month-name capitalization, whether the day or the month comes first (`7/10/26` in the US vs `10/7/26` in the UK), and even which calendar is the default. Passing `Calendar.current` and `Locale.current` (the defaults) means your dates automatically look right for every user without an if/else per country.

## Common pitfalls

- **Adding 86,400 seconds and calling it "a day."** Daylight saving time changes break this; use `Calendar.date(byAdding:)` instead.
- **Building a date string with string interpolation of components.** Skips localization and time zone handling — always go through a formatter.
- **Recreating a `DateFormatter` inside a loop.** Expensive to initialize; create it once and reuse it.
- **Assuming `Date()` carries a time zone.** It doesn't — the time zone only enters when a `Calendar` or formatter interprets it for display.

## Interview lens

If asked "how do you store a date," the answer is: store a `Date` (or its UTC representation on the server), never a formatted string and never a specific time zone — a `Date` is a single unambiguous point in time, and you only apply a time zone at the moment you display it to a user.

If asked about the daylight saving pitfall, walk through the concrete example: adding 24 hours in raw seconds versus adding one day through `Calendar` — the interviewer is checking that you know `Date` math and calendar-aware math aren't interchangeable.

If asked to compare `DateFormatter` and the modern `FormatStyle` API, mention two things: `FormatStyle` is compile-time checked and composable, while `DateFormatter` catches format-string typos only at runtime — and both are expensive to construct, so either one should be created once and reused rather than recreated per use.
