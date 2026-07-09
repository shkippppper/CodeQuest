import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "date-what-is-date",
    type: "mcq",
    prompt: "What does a Swift Date value actually represent?",
    options: [
      "A single point on a universal timeline, with no inherent time zone",
      "A formatted string like \"July 10, 2026\"",
      "A day-of-week and hour tied to the device's time zone",
      "A calendar entry with year, month, and day fields",
    ],
    answer: 0,
    explanation:
      "`Date` stores seconds since a fixed reference point — a single unambiguous instant. It has no year/month/day/time-zone of its own; those come from interpreting it with a `Calendar`.",
  },
  {
    id: "date-calendar-fill",
    type: "fill",
    prompt: "To split a Date into year, month, day, and hour, you use a ___, since Date itself has no concept of those units.",
    answers: ["calendar"],
    hint: "Also the type used for date arithmetic that respects rules like leap years.",
    explanation:
      "`Calendar` provides both decomposition (`dateComponents`) and arithmetic (`date(byAdding:)`) that understand calendar rules a raw `Date` doesn't.",
  },
  {
    id: "date-dst-predict",
    type: "predict",
    prompt: "On the day clocks shift for daylight saving time, what's the difference between these two ways of getting 'tomorrow, same time'?",
    code: `let a = now.addingTimeInterval(86_400)\nlet b = calendar.date(byAdding: .day, value: 1, to: now)!`,
    options: [
      "a can land on the wrong wall-clock hour since it adds exactly 86,400 seconds; b lands on the correct wall-clock time because Calendar accounts for the clock change",
      "They always produce the same result",
      "b is always wrong and a is always correct",
      "Both ignore daylight saving time equally",
    ],
    answer: 0,
    explanation:
      "Raw seconds don't know about clock shifts. `Calendar.date(byAdding:)` is aware of daylight saving transitions and keeps the wall-clock time consistent; adding 86,400 seconds directly does not.",
  },
  {
    id: "date-timezone-mcq",
    type: "mcq",
    prompt: "Why does Date() never 'have' a time zone?",
    options: [
      "Because a Date is a single point in time; the time zone only matters when a Calendar or formatter interprets it for display",
      "Because time zones were removed from Foundation",
      "Because Date always assumes UTC display",
      "Because every Date is automatically localized on creation",
    ],
    answer: 0,
    explanation:
      "The time zone is applied at the last step — when a `Calendar` or formatter converts the instant into human units for a specific place. The underlying `Date` value itself is time-zone agnostic.",
  },
  {
    id: "date-formatter-multi",
    type: "multi",
    prompt: "Select all true statements about DateFormatter and ISO8601DateFormatter.",
    options: [
      "Both are relatively expensive to create and should be reused rather than recreated in a loop",
      "ISO8601 produces a fixed, unambiguous text format usable across platforms",
      "Building a date string by interpolating dateComponents fields is equivalent to using a formatter",
      "DateFormatter's dateFormat pattern lets you specify an exact custom layout",
    ],
    answers: [0, 1, 3],
    explanation:
      "Formatters are costly to construct (reuse them), ISO8601 is the standard for unambiguous cross-platform exchange, and `dateFormat` supports exact custom patterns. Hand-interpolating components skips localization and time zone handling — it is not equivalent.",
  },
  {
    id: "date-formatstyle-fill",
    type: "fill",
    prompt: "The modern, composable, compile-time-checked alternative to DateFormatter, used as Date.___, produces text via calls like .formatted(date:time:).",
    answers: ["formatstyle", "format style"],
    hint: "Two words, or one type name: Date.FormatStyle.",
    explanation:
      "`Date.FormatStyle` (accessed via `.formatted(...)`) is checked at compile time and composes pieces like `.year()`, `.month()`, unlike `DateFormatter`'s runtime-checked string patterns.",
  },
  {
    id: "date-formatstyle-vs-formatter-senior",
    type: "mcq",
    prompt: "What's a key advantage of Date.FormatStyle over DateFormatter's dateFormat string pattern?",
    options: [
      "A typo in a FormatStyle call is caught at compile time; a typo in a dateFormat pattern string is only caught at runtime, if at all",
      "FormatStyle doesn't support localization",
      "DateFormatter is always faster",
      "FormatStyle can't produce relative phrasing like 'yesterday'",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`dateFormat` is just a string, so Swift can't catch mistakes in it. `FormatStyle`'s method-chain API is type-checked, so malformed usage is a compile error instead of a silent runtime bug. It also supports `.relative(presentation:)` for phrasing like 'in 2 hours'.",
  },
  {
    id: "date-locale-senior",
    type: "predict",
    prompt: "Two users in different countries call now.formatted(date: .abbreviated, time: .shortened) on the exact same Date, with no locale override. What differs in the output?",
    code: `now.formatted(date: .abbreviated, time: .shortened)\n// user A: US device\n// user B: UK device`,
    options: [
      "The text layout differs (e.g. month/day order, AM/PM vs 24-hour) because the formatter uses each device's current Locale automatically",
      "Nothing differs — formatting is locale-independent",
      "Only the language of month names can differ, never the layout",
      "It throws an error unless a Locale is passed explicitly",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Formatters default to `Locale.current`, which encodes regional conventions — date component order, 12/24-hour clocks, separators — so the same `Date` renders differently per device without any extra code.",
  },
  {
    id: "date-flashcard",
    type: "flashcard",
    prompt: "Explain how Date, Calendar, TimeZone, and formatters divide responsibility, and why that separation matters. Answer aloud, then reveal.",
    modelAnswer:
      "A **`Date`** is a single point on a universal timeline stored as seconds from a fixed reference — it carries no day/month/hour and no time zone. A **`Calendar`** turns that instant into human units (year, month, day, hour) according to a specific calendar's rules, and does calendar-aware arithmetic like 'add a day' correctly across daylight saving transitions, unlike adding raw seconds. A **`TimeZone`** is the offset-from-UTC-plus-DST-rules for a place; it's set on the `Calendar` (or formatter) used to interpret a `Date`, never on the `Date` itself — that's why the same instant can show a different hour in Tokyo versus New York. Formatters (`DateFormatter`, `ISO8601DateFormatter`, or the modern `Date.FormatStyle`) are the only correct way to turn a `Date` into text, since they apply `Locale` conventions (language, ordering, 12/24-hour) automatically — hand-built strings from components skip all of that. The practical rule: store and compare plain `Date` values, and only bring in a time zone and locale at the final step of displaying to a person.",
    keyPoints: [
      "Date = point in time only, no calendar/time-zone knowledge",
      "Calendar decomposes into units and does calendar-aware arithmetic (handles DST correctly)",
      "TimeZone lives on the Calendar/formatter, not on Date, so the same instant differs per place",
      "Formatters (DateFormatter/ISO8601/FormatStyle) apply Locale automatically — never hand-build date strings",
      "Store/compare Date; only localize and time-zone-ify at the display step",
    ],
    explanation:
      "A strong answer keeps the responsibilities cleanly separated — instant, decomposition, place, and text — and ties it back to the concrete daylight-saving and locale examples rather than a generic 'Foundation handles dates'.",
  },
];

export default quiz;
