import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "singleton-three-parts",
    type: "mcq",
    prompt: "Which three pieces make a Swift singleton actually enforce 'only one instance ever'?",
    options: [
      "`static let shared`, a `private init()`, and marking the class `final`",
      "`static var shared`, a `public init()`, and marking the class `open` so subclasses can override the accessor",
      "A global variable holding the instance and a `deinit` that resets it to nil when unused",
      "A protocol extension with a default implementation that returns the same lazily cached instance each time",
    ],
    answer: 0,
    explanation:
      "`static let shared` gives one shared property, `private init()` blocks anyone outside the file from making a second instance, and `final` stops a subclass from being freely instantiated and quietly breaking the guarantee.",
  },
  {
    id: "singleton-identity-predict",
    type: "predict",
    prompt: "What does this print?",
    code: `let a = AudioSession.shared\nlet b = AudioSession.shared\nprint(a === b)`,
    options: ["true", "false", "Compile error", "nil"],
    answer: 0,
    explanation:
      "`===` checks identity — are these two variables pointing at the same object in memory. Since `.shared` always hands back the one instance, `a` and `b` are the same object, so this prints `true`.",
  },
  {
    id: "singleton-thread-safety-fill",
    type: "fill",
    prompt: "In Swift, a `static let` is initialized exactly once and is already ___-safe, even if multiple threads read it at the same moment.",
    answers: ["thread"],
    hint: "Correct behavior under concurrent access — the word interviewers listen for.",
    explanation:
      "Swift guarantees a `static let` initializes exactly once, using an internal lock for the first concurrent access. That's thread safety, and you don't write any locking code yourself to get it.",
  },
  {
    id: "singleton-no-manual-lock",
    type: "mcq",
    prompt: "You're implementing a singleton in Swift. Should you manually double-check a flag and lock a mutex around initialization, like the old Objective-C pattern?",
    options: [
      "No — `static let` already guarantees single, thread-safe initialization for free",
      "Yes — always add your own dispatch_once-style locking or the runtime may initialize the instance twice under contention",
      "Only on macOS builds; iOS provides thread-safe static initialization but macOS does not guarantee it without manual locking",
      "Only if the class has more than one stored property, since multiple properties introduce the risk of partial initialization",
    ],
    answer: 0,
    explanation:
      "That double-checked locking dance was needed in Objective-C. In Swift, `static let` gives you exactly-once, thread-safe initialization at the language level — hand-rolling a lock on top is unnecessary and a sign of not knowing the language guarantee.",
  },
  {
    id: "singleton-global-state-multi",
    type: "multi",
    prompt: "Select **all** true statements about why singletons are often criticized.",
    options: [
      "They are global mutable state reachable from anywhere in the app",
      "A type's initializer signature won't reveal that it depends on a singleton called from inside a method body",
      "Singletons make the compiler slower",
      "Tests can leak state between runs because the shared instance persists across test cases",
    ],
    answers: [0, 1, 3],
    explanation:
      "Singletons are global mutable state with hidden dependencies — you can't tell what a type needs just by reading its `init` if it silently reaches for `.shared` inside a method. Their state also persists across test runs, causing order-dependent flakiness. They have no meaningful effect on compiler speed.",
  },
  {
    id: "singleton-testability-predict",
    type: "predict",
    prompt: "This test is trying to verify AudioSession logs correctly. What's the problem with writing it this way?",
    code: `func testSetCategoryLogsChange() {\n    AudioSession.shared.setCategory(.playback)\n    // how do I check what AnalyticsLogger.shared logged?\n}`,
    options: [
      "AudioSession is hardwired to the real AnalyticsLogger.shared, so there's no way to substitute a fake logger to make assertions on",
      "Swift Testing does not permit direct access to static members from inside a test body; each must be accessed via a protocol-typed reference variable instead",
      "`.shared` is a write-once accessor — subsequent calls within the same process return nil, so any test that accesses it more than once will be unreliable",
      "The test will fail to compile because `setCategory` is declared private on AudioSession and cannot be called from outside the module boundary",
    ],
    answer: 0,
    explanation:
      "Because `AudioSession`'s code calls `AnalyticsLogger.shared` directly instead of taking a logger as a dependency, the test has no seam to inject a fake and inspect what was logged. That hardcoded reference — not the existence of a shared instance — is what makes testing hard.",
  },
  {
    id: "singleton-dependency-injection-fill",
    type: "fill",
    prompt: "The fix for a type being hardwired to a singleton is ___ ___: passing the dependency in through the initializer (often defaulting to `.shared`) instead of reaching out and grabbing the global directly.",
    answers: ["dependency injection"],
    hint: "Two words; also the name of the general technique of passing collaborators in rather than looking them up.",
    explanation:
      "Dependency injection keeps the singleton as the single source of truth in production (via a default argument) while letting tests substitute a fake that conforms to the same protocol.",
  },
  {
    id: "singleton-when-fine-senior",
    type: "mcq",
    prompt: "Apple ships `URLSession.shared`, `FileManager.default`, and `UserDefaults.standard` as singletons. Under what conditions is reaching for a singleton actually the right call?",
    options: [
      "When the underlying resource is genuinely singular at the OS level (hardware, a filesystem, a network stack), the type is stateless or its state should truly be shared everywhere, and it's still exposed in a way that can be substituted in tests",
      "Whenever any object needs to be accessed from more than one source file anywhere in the codebase, since that basic cross-file sharing requirement is entirely sufficient justification for applying the singleton pattern without any further design analysis",
      "Never under any circumstances whatsoever — Apple's own APIs like URLSession.shared and FileManager.default are now widely regarded as anti-patterns by the Swift community and Apple itself plans to deprecate them",
      "Only for types that explicitly conform to Codable, because only fully serializable value types can ever safely share mutable state across separate Swift module boundaries without causing data corruption",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The pattern fits when the resource really is singular at the system level and consumers can still substitute a fake for testing (typically via a protocol and injected default) rather than calling the concrete singleton by name everywhere. Most 'I need this everywhere' problems are better solved with plain dependency injection, not a new singleton.",
  },
  {
    id: "singleton-di-flashcard",
    type: "flashcard",
    prompt:
      "Explain how you'd implement a Swift singleton, why it's already thread-safe, and how you'd fix its testability problem without deleting the shared instance. Answer aloud, then reveal.",
    modelAnswer:
      "Implement it with `static let shared = AudioSession()`, a `private init()` so nothing outside the file can construct a second instance, and mark the class **`final`** so a subclass can't slip past the guarantee. `static let` is initialized exactly once by the Swift runtime, with an internal lock making the first concurrent access safe — this is **thread safety** you get for free, with no manual locking needed (unlike the old Objective-C double-checked-lock pattern). The real cost of singletons is that they're **global mutable state**: a type's `init` signature won't reveal it silently calls `SomeSingleton.shared` inside a method body, and tests can't substitute a fake for it — worse, singleton state leaks between test runs since it isn't reset. The fix is **dependency injection**: keep exactly one production instance, but have the consuming type depend on a protocol and accept an instance through its initializer, defaulting to `.shared` in production. Tests then pass a fake conforming to the same protocol. Genuinely singular resources — `URLSession.shared`, `FileManager.default` — are fine singletons precisely because the OS resource really is singular and they're still substitutable via protocols.",
    keyPoints: [
      "static let shared + private init() + final",
      "static let is already thread-safe — exactly-once init, no manual locking",
      "Real cost: global mutable state with hidden dependencies + cross-test state leakage",
      "Fix: dependency injection — protocol + initializer param defaulting to .shared",
      "Some singletons (URLSession.shared) are fine when the resource is genuinely singular and still testable",
    ],
    explanation:
      "A senior answer connects all three pieces: the mechanical implementation, why Swift needs no manual locking, and dependency injection as the fix that keeps the singleton without hardcoding access to it everywhere.",
  },
];

export default quiz;
