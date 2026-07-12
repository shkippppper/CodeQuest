import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "crash-raw-addresses",
    type: "mcq",
    prompt: "A raw crash report frame shows `0x0000000104a2c3e0` instead of a function name and line number. Why?",
    options: [
      "The crashed app was a compiled binary; source names and locations are gone by the time it crashes on-device",
      "The crash reporting SDK failed to install correctly",
      "The device ran out of memory to store the trace",
      "This only happens in Debug builds, never Release",
    ],
    answer: 0,
    explanation:
      "By the time a compiled binary crashes on a real device, there's no source information left — just raw memory addresses. Symbolication is what maps them back.",
  },
  {
    id: "crash-dsym-fill",
    type: "fill",
    prompt: "A ___ file maps a compiled build's addresses back to original source file names and line numbers.",
    answers: ["dSYM", "dsym"],
    hint: "Debug symbol file, generated per build by Xcode.",
    explanation:
      "A dSYM must match the *exact* build that produced the crash — a dSYM from a different build won't correctly map that crash's addresses.",
  },
  {
    id: "crash-dsym-mismatch-predict",
    type: "predict",
    prompt: "You archive build v3.2.0 and its dSYM, but only keep the dSYM from v3.2.1. A crash report comes in from a user still on v3.2.0. What happens when you try to symbolicate it?",
    code: `// only v3.2.1's dSYM is available; crash report is from v3.2.0`,
    options: [
      "It can't be correctly symbolicated — the addresses won't reliably map to the right source locations",
      "It symbolicates perfectly since dSYMs are version-agnostic",
      "Xcode automatically regenerates the missing dSYM from source",
      "The crash tool falls back to the app's App Store listing for symbols",
    ],
    answer: 0,
    explanation:
      "Each dSYM matches one specific build's compiled layout. Without the matching v3.2.0 dSYM, that crash's addresses stay effectively unreadable.",
  },
  {
    id: "crash-exception-type",
    type: "mcq",
    prompt: "A crash report shows `EXC_BAD_ACCESS` with subtype address `0x0000000000000008`. What does the near-zero address suggest?",
    options: [
      "A likely nil-messaging bug — nil is address zero and method tables sit at small fixed offsets from it",
      "The device is critically low on memory",
      "A network timeout occurred",
      "A SwiftLint rule was violated at runtime",
    ],
    answer: 0,
    explanation:
      "`EXC_BAD_ACCESS` means invalid memory access; a near-zero fault address is a classic sign of calling into a nil object under the hood.",
  },
  {
    id: "crash-thread-multi",
    type: "multi",
    prompt: "Select all true statements about a full crash report's thread listing.",
    options: [
      "It lists every thread running at the time of the crash, not just the crashed one",
      "'Thread 0 Crashed' marks which thread to read for the actual failure",
      "Other threads' state is always irrelevant noise and can be ignored",
      "Seeing what another thread was doing can help explain race-condition crashes",
    ],
    answers: [0, 1, 3],
    explanation:
      "All threads are listed for context; the crashed thread is marked explicitly. Other threads aren't always irrelevant — races between threads are a common root cause (option 2 is false).",
  },
  {
    id: "crash-tools",
    type: "fill",
    prompt: "Two of the most common third-party crash reporting SDKs, mentioned in this lesson, are Crashlytics and ___.",
    answers: ["Sentry"],
    hint: "Not a Google/Firebase product.",
    explanation:
      "Crashlytics (Google/Firebase) and Sentry both catch crashes on-device and upload reports automatically on the next launch with connectivity.",
  },
  {
    id: "crash-privacy-senior",
    type: "predict",
    prompt: "🧠 A developer adds `Crashlytics.crashlytics().setCustomValue(user.email, forKey: \"user\")` to help identify affected users. What's the concern?",
    code: `Crashlytics.crashlytics().setCustomValue(user.email, forKey: "user")`,
    options: [
      "It ships PII to a third-party vendor's servers without disclosure/consent — use a hashed/anonymized identifier instead",
      "There's no concern, custom values are always encrypted automatically",
      "setCustomValue doesn't accept strings, so this would fail to compile",
      "Crashlytics blocks PII automatically at the SDK level",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A crash report is data leaving the device to a third-party vendor. An email is PII under regulations like GDPR — prefer an anonymized/hashed user reference so you can still correlate repeat crashes without exposing real identity.",
  },
  {
    id: "crash-signature-actionable",
    type: "mcq",
    prompt: "A dashboard shows 'applyDiscount crashed 1,204 times, 890 users, since v3.2.0' instead of 1,204 raw stack traces. What made this possible?",
    options: [
      "Grouping reports by a crash signature — a hash of the top stack frames — that collapses duplicates into one distinct issue",
      "Manual review of every single crash report by an engineer",
      "Deleting older crash reports to reduce clutter",
      "Turning off symbolication to simplify the trace",
    ],
    answer: 0,
    explanation:
      "Crash tools compute a signature from the top frames so structurally identical crashes collapse into one issue with an affected-user/occurrence count — this is what makes the data prioritizable.",
  },
  {
    id: "crash-flashcard",
    type: "flashcard",
    prompt: "Explain the pipeline from a raw on-device crash to an actionable, prioritized bug. Answer aloud, then reveal.",
    modelAnswer:
      "A crashed binary produces raw memory addresses with no source info. A **dSYM** — generated per build and matching that *exact* build — is used to **symbolicate** the report, mapping addresses back to real function names, files, and line numbers. The report's **exception type** (e.g. `EXC_BAD_ACCESS`) and subtype address hint at the cause — a near-zero address usually means a nil-messaging bug. Crash SDKs like **Crashlytics** and **Sentry** catch crashes on real devices and upload them automatically on next launch, letting you attach custom metadata and breadcrumbs via calls like `setCustomValue`/`log` — but anything attached is data leaving the device, so PII like emails should be replaced with hashed identifiers to respect privacy (GDPR etc.). Finally, tools group raw reports by a **crash signature** (a hash of top stack frames) into distinct issues with occurrence and affected-user counts, which is what turns a pile of traces into a prioritized, **actionable** list — and lets you confirm a fix actually drove the count to zero after shipping.",
    keyPoints: [
      "dSYM matches one exact build; without it, that build's crashes stay unreadable",
      "Symbolication turns addresses into function/file/line",
      "Exception type + subtype address hint at root cause (near-zero = nil messaging)",
      "Crashlytics/Sentry auto-upload on next launch; custom metadata is PII-sensitive",
      "Crash signature grouping turns raw traces into prioritized, actionable issues",
    ],
    explanation:
      "Senior answers connect dSYM management discipline to privacy discipline to prioritization — not just 'symbolication exists.'",
  },
];

export default quiz;
