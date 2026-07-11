import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "instruments-what",
    type: "mcq",
    prompt: "What does Instruments do?",
    options: [
      "Attaches to your running app and records what it's actually doing, so you can measure instead of guess",
      "Automatically rewrites slow code",
      "Only checks for compiler warnings",
      "Runs your unit tests faster",
    ],
    answer: 0,
    explanation:
      "Instruments is Xcode's profiling app. It attaches to a running app and records real data (CPU samples, allocations, custom markers) so you can find the actual bottleneck instead of guessing.",
  },
  {
    id: "instruments-launch",
    type: "fill",
    prompt: "You open Instruments from Xcode with Product → Profile, or the keyboard shortcut Cmd+___.",
    answers: ["i"],
    hint: "Single letter.",
    explanation: "Cmd+I profiles the current scheme, building in release-like conditions and opening the Instruments template picker.",
  },
  {
    id: "instruments-self-vs-total",
    type: "predict",
    prompt: "In the Time Profiler call tree, which column tells you the actual function to fix first?",
    code: `Function          Self Weight   Total Weight
loadFeed()             2.1 ms        89.7 ms
sorted(by:)            45.2 ms       45.2 ms
fetchPosts()            1.0 ms       42.4 ms`,
    options: [
      "Self Weight — sorted(by:) is where CPU time is actually spent, not the wrapper functions calling it",
      "Total Weight — loadFeed() is highest so it's the bottleneck",
      "Neither, you should look at object count instead",
      "Total Weight, because it includes everything",
    ],
    answer: 0,
    explanation:
      "**Self time** is time spent inside the function's own code, excluding what it calls. `sorted(by:)` has the highest self weight, so that's the actual hot code — `loadFeed()`'s high total weight just reflects that it called something slow.",
  },
  {
    id: "instruments-template-match",
    type: "mcq",
    prompt: "You want to know which of your app's objects are never being freed after a screen closes. Which Instruments template fits?",
    options: [
      "Allocations (or Leaks alongside it) — tracks live object counts and flags reference cycles",
      "Time Profiler — it shows memory too",
      "Signposts — it's for CPU only",
      "Network instrument",
    ],
    answer: 0,
    explanation:
      "Allocations tracks every object created and freed, including a live \"# Living\" count. Leaks specifically flags reference cycles ARC can't free on its own. Time Profiler answers a CPU question, not a memory one.",
  },
  {
    id: "instruments-signpost-purpose",
    type: "mcq",
    prompt: "Why add a custom signpost instead of relying on Time Profiler's samples alone?",
    options: [
      "Time Profiler shows anonymous stretches of samples; a signpost names a region of your own logic so Instruments can show it as a labeled interval",
      "Signposts replace the need for Time Profiler entirely",
      "Signposts make the app run faster",
      "Signposts are required for the app to compile in Release",
    ],
    answer: 0,
    explanation:
      "os_signpost lets you mark begin/end points around code you care about (like \"Decode Feed\"), so the recording shows a named bar you can line up against the raw CPU samples.",
  },
  {
    id: "instruments-flame-graph",
    type: "fill",
    prompt: "In a flame graph, a wide block means a function consumed a lot of sampled time; a ___ stack means deep call nesting at that moment.",
    answers: ["tall"],
    hint: "The opposite dimension from wide.",
    explanation: "Width represents sampled time; height represents call-stack depth at that moment. Tall + wide together point at a deeply nested, expensive call path.",
  },
  {
    id: "instruments-truths-multi",
    type: "multi",
    prompt: "Select all true statements about profiling with Instruments.",
    options: [
      "You should profile a Release-configuration build, not a Debug build",
      "Self time and total time always show the same number",
      "A rising '# Living' object count after leaving a screen suggests something is retaining those objects",
      "You should capture a baseline measurement before changing code, then measure again after",
    ],
    answers: [0, 2, 3],
    explanation:
      "Debug builds skip optimizations and misrepresent real performance, so profile Release. Self and total time usually differ (option 1 is false — self excludes callees). Rising living counts and before/after measurement are both core workflow points.",
  },
  {
    id: "instruments-methodology-senior",
    type: "predict",
    prompt: "A senior engineer rewrites `sorted(by:)` to a supposedly faster comparator, feels the app is smoother, and ships it without reprofiling. What's the gap in this workflow?",
    code: `// change made, app "feels" smoother, no new Instruments recording taken`,
    options: [
      "No new measurement was taken after the change, so there's no evidence the fix actually reduced the self time that was measured before",
      "Nothing — feeling smoother is good enough evidence",
      "sorted(by:) can never be a bottleneck",
      "Instruments can only be run once per app lifetime",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Measuring before a change tells you what's actually slow; measuring after tells you whether the fix worked or just moved the bottleneck. \"Feels faster\" isn't a number you can compare against the baseline.",
  },
  {
    id: "instruments-flashcard",
    type: "flashcard",
    prompt: "Explain how you'd use Instruments to diagnose a stuttering screen, from opening the tool to confirming a fix. Answer aloud, then reveal.",
    modelAnswer:
      "Open **Instruments** via Product → Profile so the app builds in release-like conditions, then pick the template matching the question: **Time Profiler** for CPU, **Allocations**/**Leaks** for memory. Record, reproduce the slow interaction, stop recording, then read the call tree sorted by **Self time** — the highest self-time row is the actual hot function, not a wrapper with high total time. For app-specific context Time Profiler can't infer on its own, add **Signposts** (`os_signpost` begin/end) around the code region you care about so it shows as a labeled interval next to the CPU samples. The **flame graph** view makes this visual: width shows sampled time, height shows call-stack depth, and you can click to zoom into a subtree. The whole exercise only counts if you measure before touching code (baseline) and measure again after the fix, comparing the same self-time number — never trust \"feels faster.\"",
    keyPoints: [
      "Profile a Release build via Product -> Profile",
      "Match the template to the question: Time Profiler (CPU) vs Allocations/Leaks (memory)",
      "Sort call tree by self time, not total time, to find the real hot function",
      "Signposts label custom regions of app logic on the timeline",
      "Flame graph: width = time, height = call depth",
      "Always measure a baseline before changing code and re-measure after",
    ],
    explanation:
      "A senior answer connects the full loop: pick the right template, read self time correctly, use signposts for app-specific context, and always close the loop by re-measuring after a fix.",
  },
];

export default quiz;
