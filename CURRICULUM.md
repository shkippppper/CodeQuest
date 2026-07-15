# CodeQuest Curriculum

A complete map of the interview surface for a **mid/senior Swift / iOS engineer** (junior fundamentals included). This is a **planning document**: it lists every category, every topic, and the section headings ("paragraphs") each lesson should contain — but **not** the written content. A later session generates the actual `meta.ts` + `explanation.md` + `quiz.ts` for each topic from this outline.

## How to read this

Each topic line is:

> **Topic Title** — `slug` · _difficulty_ · _status_
> Sections: heading · heading · heading …

- **`slug`** → the folder name under `src/content/topics/<slug>/` and the URL `/learn/<slug>`.
- **_difficulty_** → `junior` | `mid` | `senior` (drives sidebar dots, filters, and Challenge bucketing).
- **_status_** → ✅ built · ⬜ not started.
- **Sections** → the `##` headings the lesson's `explanation.md` should contain, in order. These are the "paragraphs" to generate.

### Conventions every generated lesson follows
- **Writing style: `docs/STYLE_GUIDE.md`** — step-by-step code narration (code before prose, examples grow line by line, one idea per paragraph, no jargon before a plain-words definition). Exemplar: `src/content/topics/arc/explanation.md`.
- Open with the **problem** the feature solves, not the dry definition.
- Every lesson ends with an **"Interview lens"** section (what an interviewer probes for + the senior framing) — so it is implied for all topics below and not repeated each time.
- Each quiz mixes the four question types (`mcq`, `predict`, `fill`, `flashcard`).
- See `.claude/skills/author-topic/SKILL.md` for the authoring mechanics.

### Category → code mapping
The app currently ships four category ids in `src/content/types.ts` (`language`, `concurrency`, `ui`, `architecture`). This curriculum proposes a **wider set of categories** (below). Before generating topics in a new category, extend the `CategoryId` union and the `CATEGORIES` map in `src/content/types.ts` (id, label, order, blurb, icon, accent). Suggested icon/accent are noted per category; accents should stay within the sequential indigo palette or a restrained extension of it.

---

## 1. Swift Language Fundamentals
`language` · icon `Braces` — the core language every other topic builds on.

- **Variables, Constants & Type Inference** — `basics-types` · junior · ✅
  Sections: `let` vs `var` · Type inference vs annotation · Value initialization & default values · Type safety · Numeric types & conversions · Tuples
- **Optionals** — `optionals` · junior · ✅
  Sections: What is an optional · Why optionals exist · Force unwrapping · Optional binding (`if let` / `guard let`) · Nil-coalescing `??` · Optional chaining · Implicitly unwrapped optionals · Common pitfalls
- **Collections: Array, Set, Dictionary** — `collections` · junior · ✅
  Sections: Arrays · Sets & uniqueness · Dictionaries · Mutability & value semantics · Common operations (map/filter/reduce) · Choosing the right collection
- **Control Flow & Pattern Matching** — `control-flow` · junior · ✅
  Sections: `if` / `guard` / `switch` · Exhaustive switches · `where` clauses · Pattern matching with tuples & enums · Loops & control transfer · `case let` binding
- **Functions & Closures** — `functions-closures` · junior · ✅
  Sections: Function syntax & parameters · Argument labels & defaults · Variadic & inout parameters · Closures & closure syntax · Trailing closures · Escaping vs non-escaping · Capturing values · Higher-order functions
- **Enums & Associated Values** — `enums` · junior · ✅
  Sections: Basic enums & raw values · Associated values · Pattern matching enums · Recursive (`indirect`) enums · `CaseIterable` · Enums as state machines
- **Structs vs Classes (Value vs Reference)** — `value-reference` · junior · ✅
  Sections: Value vs reference semantics · Copying behavior · Identity vs equality · Mutability & `mutating` · When to choose which · Inheritance trade-offs
- **Properties** — `properties` · junior · ✅
  Sections: Stored properties · Computed properties · Property observers (`willSet`/`didSet`) · Lazy properties · Type (`static`/`class`) properties · `let` vs `var` properties
- **Initialization** — `initialization` · mid · ✅
  Sections: Designated & convenience initializers · Memberwise initializers · Failable initializers · Required initializers · Two-phase initialization · `deinit`
- **Error Handling** — `error-handling` · mid · ✅
  Sections: The `Error` protocol · `throws` / `try` / `catch` · `try?` and `try!` · `defer` · Typed throws · Result type · Errors vs optionals vs crashes
- **Strings & Characters** — `strings` · junior · ✅
  Sections: String as a value type · Characters & grapheme clusters · Unicode & scalars · String indices · Substrings & memory · Interpolation & formatting
- **Access Control** — `access-control` · mid · ✅
  Sections: Access levels (`open`→`private`) · `fileprivate` vs `private` · Module boundaries · `internal` default · Access control & testability (`@testable`)

---

## 2. Type System & Protocol-Oriented Programming
`types` · icon `Shapes` — Swift's expressive, generic, protocol-first type system.

- **Protocols & Protocol-Oriented Programming** — `protocols` · mid · ✅
  Sections: Defining protocols · Protocol conformance · Default implementations via extensions · Protocol composition · POP vs OOP · Protocols as types vs constraints
- **Generics** — `generics` · mid · ✅
  Sections: Why generics · Generic functions · Generic types · Type constraints (`where`) · Conditional conformance · Generic specialization & performance
- **Associated Types & Type Erasure** — `associated-types` · senior · ✅
  Sections: `associatedtype` · Self & associated-type requirements · The "protocol with Self" limitation · Type erasure (`AnyView`/`AnySequence`) · Building your own type eraser
- **Opaque Types & Existentials (`some` vs `any`)** — `opaque-existential` · senior · ✅
  Sections: Existential containers · `any` keyword & boxing cost · Opaque types `some` · Reverse generics · When to use which · Performance implications
- **Extensions** — `extensions` · junior · ✅
  Sections: Extending types · Adding computed properties & methods · Protocol conformance via extension · Constrained extensions · Organizing code with extensions
- **Property Wrappers** — `property-wrappers` · mid · ✅
  Sections: The problem they solve · `wrappedValue` · `projectedValue` (`$`) · Building a custom wrapper · Wrappers in SwiftUI (`@State`, `@Published`) · Composition & limits
- **Result Builders** — `result-builders` · senior · ✅
  Sections: What result builders do · `buildBlock` & friends · How SwiftUI's `ViewBuilder` works · Building a custom DSL · Control flow in builders
- **Key Paths** — `key-paths` · mid · ✅
  Sections: KeyPath types · Reading & writing via key paths · Key paths as functions · Dynamic member lookup · Use in generic APIs
- **Codable** — `codable` · mid · ✅
  Sections: `Encodable` / `Decodable` · Automatic synthesis · `CodingKeys` · Custom encoding/decoding · Nested & heterogeneous JSON · Dates & strategies · Error handling
- **Core Protocol Conformances** — `protocol-conformances` · mid · ✅
  Sections: `Equatable` · `Hashable` · `Comparable` · `Identifiable` · `CustomStringConvertible` · Synthesized conformance & custom implementations

---

## 3. Memory Management
`memory` · icon `MemoryStick` — ARC, ownership, and lifetime.

- **Automatic Reference Counting (ARC)** — `arc` · mid · ✅
  Sections: How ARC works · Reference counts · When objects deallocate · ARC vs garbage collection · Visualizing the object graph
- **Strong, Weak & Unowned** — `reference-types` · mid · ✅
  Sections: Strong references · `weak` & optionality · `unowned` & its danger · Choosing weak vs unowned · Lifetime guarantees
- **Retain Cycles** — `retain-cycles` · mid · ✅
  Sections: What a retain cycle is · Cycles between objects · Cycles in closures · Delegate cycles · Breaking cycles · Detecting leaks
- **Capture Lists in Closures** — `capture-lists` · mid · ✅
  Sections: How closures capture · `[weak self]` / `[unowned self]` · Capturing values vs references · The `guard let self` dance · Common mistakes
- **Value Semantics & Copy-on-Write** — `copy-on-write` · senior · ✅
  Sections: Value semantics recap · How COW works internally · `isKnownUniquelyReferenced` · Implementing COW for a custom type · Performance trade-offs
- **Memory Layout: Stack vs Heap** — `memory-layout` · senior · ✅
  Sections: Stack vs heap allocation · Where values & references live · `MemoryLayout` · Inline storage & existential boxing · Alignment & size
- **Autorelease Pools** — `autorelease` · senior · ✅
  Sections: What autorelease pools are · `@autoreleasepool` · When they matter (loops, bridging) · Interaction with ARC

---

## 4. Concurrency & Parallelism
`concurrency` · icon `Workflow` — from GCD to structured concurrency.

- **Grand Central Dispatch (GCD)** — `gcd` · mid · ✅
  Sections: Queues (serial vs concurrent) · Sync vs async dispatch · Main vs global queues · QoS & priority · Dispatch groups · Barriers · Deadlocks
- **Operations & OperationQueue** — `operations` · mid · ✅
  Sections: `Operation` vs GCD · `OperationQueue` · Dependencies · Cancellation · Custom async operations · When to prefer operations
- **async / await** — `async-await` · mid · ✅
  Sections: The problem with callbacks · `async` functions & `await` · Where you can call async code · Sequential vs parallel · Structured concurrency · Cancellation · MainActor & UI
- **Structured Concurrency (Task & TaskGroup)** — `structured-concurrency` · senior · ✅
  Sections: Task trees · `async let` · `TaskGroup` / `withTaskGroup` · Task priority & inheritance · Cancellation propagation · Unstructured `Task {}`
- **Actors & Data Isolation** — `actors` · senior · ✅
  Sections: The data-race problem · Actor isolation · `await` on actor methods · Actor reentrancy · `nonisolated` members · Global actors
- **Sendable & Data Races** — `sendable` · senior · ✅
  Sections: What `Sendable` means · Sendable value vs reference types · `@Sendable` closures · Compiler-enforced data-race safety · `@unchecked Sendable`
- **MainActor & UI Threading** — `main-actor` · mid · ✅
  Sections: Why UI is main-thread only · `@MainActor` on functions/types · `MainActor.run` · Inheriting isolation · Common threading bugs
- **AsyncSequence & AsyncStream** — `async-sequence` · senior · ✅
  Sections: `AsyncSequence` protocol · `for try await` loops · `AsyncStream` & continuations · Backpressure · Bridging delegates/notifications to streams
- **Continuations** — `continuations` · senior · ✅
  Sections: Bridging callbacks to async · `withCheckedContinuation` · `withCheckedThrowingContinuation` · Resume-exactly-once rule · Pitfalls
- **Concurrency Pitfalls** — `concurrency-pitfalls` · senior · ✅
  Sections: Race conditions · Deadlocks & priority inversion · Thread explosion · Shared mutable state · Debugging with Thread Sanitizer

---

## 5. SwiftUI
`swiftui` · icon `LayoutDashboard` — Apple's declarative UI framework.

- **Views & Declarative UI** — `swiftui-views` · junior · ✅
  Sections: The `View` protocol · `body` & view composition · Value-type views · Modifiers · `@ViewBuilder` basics · Previews
- **State Management (@State & @Binding)** — `swiftui-state` · mid · ✅
  Sections: Source of truth · `@State` · `@Binding` · `$` projected bindings · State & view identity · Local vs shared state
- **Data Flow (ObservableObject & Environment)** — `swiftui-data-flow` · mid · ✅
  Sections: `ObservableObject` & `@Published` · `@StateObject` vs `@ObservedObject` · `@EnvironmentObject` · `@Environment` values · Choosing the right wrapper
- **The Observation Framework (@Observable)** — `observation` · mid · ✅
  Sections: Why Observation replaced ObservableObject · `@Observable` macro · Fine-grained tracking · `@Bindable` · Migration notes
- **Layout System** — `swiftui-layout` · mid · ✅
  Sections: Stacks (H/V/Z) · The layout negotiation (proposed size) · Alignment & guides · `GeometryReader` · `Spacer` & frames · The `Layout` protocol
- **Lists & Performance** — `swiftui-lists` · mid · ✅
  Sections: `List` & `ForEach` · Identity & `id:` · Lazy stacks & grids · Diffing & reload behavior · Performance pitfalls
- **Navigation** — `swiftui-navigation` · mid · ✅
  Sections: `NavigationStack` · Value-based navigation · Programmatic navigation & paths · Sheets, popovers, alerts · Deep linking
- **View Lifecycle & Identity** — `swiftui-lifecycle` · senior · ✅
  Sections: Structural vs explicit identity · `onAppear` / `onDisappear` · `task` modifier · How SwiftUI decides to redraw · `@State` lifetime
- **Animations & Transitions** — `swiftui-animations` · mid · ✅
  Sections: Implicit vs explicit animations · `withAnimation` · Transitions · `matchedGeometryEffect` · Animatable & custom animations · Phase/keyframe animators
- **Custom Modifiers & ViewBuilders** — `swiftui-modifiers` · senior · ✅
  Sections: `ViewModifier` protocol · Reusable modifiers · `@ViewBuilder` functions · Conditional content · PreferenceKeys
- **SwiftUI ↔ UIKit Interop** — `swiftui-uikit-interop` · senior · ✅
  Sections: `UIViewRepresentable` · `UIViewControllerRepresentable` · Coordinators · Hosting SwiftUI in UIKit (`UIHostingController`) · Data flow across the boundary

---

## 6. UIKit
`uikit` · icon `AppWindow` — the imperative UI framework still core to most apps.

- **View Controller Lifecycle** — `vc-lifecycle` · junior · ✅
  Sections: `viewDidLoad` → `viewDidAppear` order · `loadView` · Appearance callbacks · Memory warnings · Container VCs
- **Auto Layout & Constraints** — `auto-layout` · mid · ✅
  Sections: Constraints & the layout engine · Intrinsic content size · Content hugging & compression resistance · Priorities · Stack views · Debugging conflicts
- **Frame vs Bounds** — `frame-bounds` · junior · ✅
  Sections: Coordinate systems · `frame` · `bounds` · `center` & transforms · When each changes
- **UITableView & UICollectionView** — `table-collection` · mid · ✅
  Sections: Data source & delegate · Cell reuse · Heights & sizing · Sections & supplementary views · Selection & editing · Performance
- **Diffable Data Sources & Compositional Layout** — `diffable-compositional` · senior · ✅
  Sections: The reload-vs-diff problem · `NSDiffableDataSourceSnapshot` · Section/item identifiers · Compositional layout (groups/sections) · Animating updates
- **Responder Chain & Events** — `responder-chain` · mid · ✅
  Sections: `UIResponder` · First responder · Hit testing · Touch event delivery · Custom event handling
- **Navigation & Coordinators (UIKit)** — `uikit-navigation` · mid · ✅
  Sections: `UINavigationController` · Modal presentation · Segues vs programmatic · The Coordinator pattern · Passing data back
- **Views & Layers (Core Animation)** — `views-layers` · mid · ✅
  Sections: View/layer relationship · `CALayer` properties · Implicit animations · `CABasicAnimation` / keyframes · Layer-backed performance
- **Gesture Recognizers** — `gestures` · junior · ✅
  Sections: Built-in recognizers · Targets & actions · Simultaneous recognition · Delegate methods · Custom gestures

---

## 7. Reactive Programming & Combine
`reactive` · icon `GitBranch` — declarative event streams.

- **Combine Fundamentals** — `combine-basics` · mid · ✅
  Sections: Publishers · Subscribers · The `Subscription` contract · `Just` / `Future` / `Deferred` · Demand & lifecycle
- **Operators** — `combine-operators` · mid · ✅
  Sections: Transforming (`map`/`flatMap`) · Filtering · Combining (`merge`/`zip`/`combineLatest`) · Error handling (`catch`/`retry`) · Debounce & throttle
- **Subjects & Multicasting** — `combine-subjects` · senior · ✅
  Sections: `PassthroughSubject` · `CurrentValueSubject` · Multicasting & `share` · Bridging imperative code · Backpressure considerations
- **Schedulers & Threading** — `combine-schedulers` · senior · ✅
  Sections: `receive(on:)` vs `subscribe(on:)` · Available schedulers · Threading mistakes · Testing with virtual time
- **Memory Management in Combine** — `combine-memory` · mid · ✅
  Sections: `AnyCancellable` · `store(in:)` · Retain cycles in sinks · `[weak self]` in operators · Cancellation
- **Combine vs async/await** — `combine-vs-async` · senior · ✅
  Sections: Streams vs single values · Bridging (`.values`) · When to choose each · Migration strategy

---

## 8. Foundation, Networking & Persistence
`foundation` · icon `Database` — the system frameworks behind data.

- **URLSession & Networking** — `urlsession` · mid · ✅
  Sections: `URLSession` & configurations · Data/Download/Upload tasks · `async` URLSession · Request building · Status codes & errors · Authentication challenges
- **REST, JSON & Codable Pipelines** — `rest-json` · mid · ✅
  Sections: Designing a request layer · Endpoint modeling · Decoding into models · Error mapping · Retry & timeout · Mocking the network
- **WebSockets & Streaming** — `websockets` · senior · ✅
  Sections: `URLSessionWebSocketTask` · Send/receive loops · Reconnection & heartbeats · Streaming with AsyncSequence · Backpressure
- **UserDefaults & Keychain** — `userdefaults-keychain` · junior · ✅
  Sections: `UserDefaults` use & limits · Property-list types · Keychain basics · Storing secrets securely · `@AppStorage`
- **File System & FileManager** — `file-system` · mid · ✅
  Sections: Sandbox directories · `FileManager` operations · URLs vs paths · Reading/writing files · File coordination & protection
- **Core Data** — `core-data` · mid · ✅
  Sections: Stack (container/context/coordinator) · Entities & relationships · Fetch requests & predicates · `NSFetchedResultsController` · Concurrency (contexts) · Migrations
- **SwiftData** — `swiftdata` · mid · ✅
  Sections: `@Model` · `ModelContainer` & `ModelContext` · Queries (`@Query`) · Relationships · Migration from Core Data · SwiftUI integration
- **SQLite & GRDB** — `sqlite` · senior · ✅
  Sections: When raw SQL beats an ORM · GRDB overview · Records & queries · Observation · Migrations · Performance
- **Caching Strategies** — `caching` · senior · ✅
  Sections: `NSCache` · Memory vs disk cache · Cache invalidation · `URLCache` & HTTP caching · LRU & eviction
- **Date, Calendar & Formatters** — `date-formatting` · junior · ✅
  Sections: `Date` as a point in time · `Calendar` & components · Time zones · `DateFormatter` & ISO8601 · The modern `FormatStyle` API · Localization

---

## 9. App Architecture
`architecture` · icon `Building2` — structuring real apps.

- **MVC & Its Problems** — `mvc` · junior · ✅
  Sections: The intended MVC · Cocoa MVC · "Massive View Controller" · Responsibilities & coupling · Why teams move beyond it
- **MVVM** — `mvvm` · mid · ✅
  Sections: Model / View / ViewModel roles · Binding the view · Testable view models · MVVM in SwiftUI vs UIKit · Pitfalls (fat view models)
- **MVP** — `mvp` · mid · ✅
  Sections: Presenter vs ViewModel · Passive view · Contracts/protocols · Testability · MVP vs MVVM
- **VIPER** — `viper` · senior · ✅
  Sections: View/Interactor/Presenter/Entity/Router · Boundaries & protocols · Routing · Trade-offs & boilerplate · When it's justified
- **Clean Architecture** — `clean-architecture` · senior · ✅
  Sections: Layers & the dependency rule · Entities & use cases · Interface adapters · Frameworks at the edge · Mapping to iOS · Pros & cons
- **The Composable Architecture (TCA)** — `tca` · senior · ✅
  Sections: State / Action / Reducer / Store · Effects & dependencies · Composition & scoping · Testing · Trade-offs
- **Unidirectional Data Flow / Redux** — `unidirectional` · senior · ✅
  Sections: Single source of truth · Actions & reducers · Side effects & middleware · Predictability & debugging · Comparison to MVVM
- **Coordinator Pattern** — `coordinator` · mid · ✅
  Sections: Why move navigation out of VCs · Coordinator hierarchy · Child coordinators · Passing data & callbacks · Coordinators in SwiftUI
- **Dependency Injection** — `dependency-injection` · mid · ✅
  Sections: Why DI · Constructor vs property vs method injection · DI containers · Service locator anti-pattern · DI for testability · Compile-time DI
- **Modularization** — `modularization` · senior · ✅
  Sections: Why modularize · Feature modules · SPM packages · Public/internal boundaries · Build-time impact · Dependency graphs
- **Routing & Navigation Architecture** — `routing-architecture` · senior · ✅
  Sections: Centralized vs decentralized routing · Deep links & URL routing · Type-safe routes · Navigation state restoration

---

## 10. SOLID & Clean Code
`solid` · icon `Ruler` — principles for maintainable code.

- **Single Responsibility Principle** — `srp` · mid · ✅
  Sections: One reason to change · Identifying responsibilities · Splitting a class · SRP in Swift types · Over-splitting risk
- **Open/Closed Principle** — `ocp` · mid · ✅
  Sections: Open for extension, closed for modification · Protocols & polymorphism · Strategy as OCP · Examples & smells
- **Liskov Substitution Principle** — `lsp` · mid · ✅
  Sections: Behavioral subtyping · Contract violations · The classic rectangle/square · LSP with protocols · Preconditions/postconditions
- **Interface Segregation Principle** — `isp` · mid · ✅
  Sections: Fat interfaces · Splitting protocols · Role interfaces · ISP in Cocoa delegates · Default implementations
- **Dependency Inversion Principle** — `dip` · mid · ✅
  Sections: Depend on abstractions · High vs low level modules · Inversion via protocols · DIP vs DI · Boundaries
- **DRY, KISS & YAGNI** — `dry-kiss-yagni` · junior · ✅
  Sections: DRY & duplication · The cost of wrong abstraction · KISS · YAGNI & speculative generality · Balancing them
- **Clean Code Practices** — `clean-code` · mid · ✅
  Sections: Naming · Small functions · Comments (when not to) · Command/query separation · Guard clauses & early return · Readability
- **Code Smells & Refactoring** — `refactoring` · senior · ✅
  Sections: Common smells · Refactoring catalog · Safe refactoring with tests · Extract method/type · Replace conditionals with polymorphism
- **Composition over Inheritance** — `composition-inheritance` · mid · ✅
  Sections: Inheritance pitfalls · Composition & protocols · Has-a vs is-a · Protocol-oriented composition · Examples
- **Law of Demeter** — `law-of-demeter` · senior · ✅
  Sections: "Don't talk to strangers" · Train-wreck calls · Tell-don't-ask · Encapsulation benefits · Pragmatic limits

---

## 11. Design Patterns
`patterns` · icon `Puzzle` — GoF and Cocoa patterns, in idiomatic Swift.

### Creational
- **Singleton** — `singleton` · junior · ✅
  Sections: Intent · Swift implementation · Thread safety · Why it's often an anti-pattern · Testable alternatives
- **Factory & Abstract Factory** — `factory` · mid · ✅
  Sections: Factory method · Abstract factory · Static factories in Swift · Decoupling creation · Examples
- **Builder** — `builder` · mid · ✅
  Sections: Intent · Fluent builders · Result-builder DSLs · Builder vs default args · Examples

### Structural
- **Adapter** — `adapter` · mid · ✅
  Sections: Intent · Object vs protocol adapter · Wrapping third-party APIs · Examples
- **Decorator** — `decorator` · mid · ✅
  Sections: Intent · Composition-based decoration · Protocol decorators · Examples vs subclassing
- **Facade** — `facade` · mid · ✅
  Sections: Intent · Simplifying subsystems · Facade vs API layer · Examples
- **Proxy** — `proxy` · senior · ✅
  Sections: Intent · Virtual/protection/remote proxy · Lazy loading · Examples
- **Composite** — `composite` · senior · ✅
  Sections: Intent · Tree structures · Uniform treatment · SwiftUI views as composites · Examples

### Behavioral
- **Delegate & DataSource (Cocoa)** — `delegate-pattern` · junior · ✅
  Sections: The delegation idiom · Protocols & `weak` delegates · Delegate vs closure vs Combine · DataSource separation · Multiple delegates
- **Observer** — `observer` · mid · ✅
  Sections: Intent · NotificationCenter · KVO · Combine/Observation as observer · Trade-offs
- **Strategy** — `strategy` · mid · ✅
  Sections: Intent · Protocol-based strategies · Closures as strategies · Runtime selection · Examples
- **Command** — `command` · senior · ✅
  Sections: Intent · Encapsulating actions · Undo/redo · Command queues · Examples
- **State** — `state-pattern` · senior · ✅
  Sections: Intent · State machines · Enum-driven state · State objects · Examples
- **Iterator** — `iterator` · mid · ✅
  Sections: Intent · `Sequence` & `IteratorProtocol` · Custom iterators · Lazy sequences
- **Protocol-Witness & POP Patterns** — `pop-patterns` · senior · ✅
  Sections: Protocol witnesses as values · Dependency injection via structs of closures · Testability · Trade-offs vs protocols

---

## 12. Testing & Quality
`testing` · icon `FlaskConical` — proving code works and stays working.

- **Unit Testing with XCTest** — `xctest` · mid · ✅
  Sections: Test anatomy (AAA) · Assertions · Setup/teardown · Test organization · Async expectations · What to test
- **The Swift Testing Framework** — `swift-testing` · mid · ✅
  Sections: `@Test` & `#expect` · Traits & parameterized tests · Suites · Migrating from XCTest · async support
- **Test Doubles** — `test-doubles` · mid · ✅
  Sections: Dummy/stub/spy/mock/fake · Hand-rolled doubles in Swift · Protocol-based mocking · Verifying interactions · Over-mocking
- **Test-Driven Development** — `tdd` · senior · ✅
  Sections: Red-green-refactor · Designing through tests · TDD trade-offs · Outside-in vs inside-out
- **UI Testing (XCUITest)** — `ui-testing` · mid · ✅
  Sections: `XCUIApplication` · Element queries & accessibility · Actions & assertions · Flakiness & waits · Page Object pattern
- **Snapshot Testing** — `snapshot-testing` · senior · ✅
  Sections: What snapshot tests catch · Recording & comparing · Handling device/OS variance · When snapshots hurt
- **Testing Async & Concurrent Code** — `testing-async` · senior · ✅
  Sections: Testing `async` functions · Controlling time/schedulers · Testing actors · Avoiding flakiness · Determinism
- **Test Strategy & Coverage** — `test-strategy` · senior · ✅
  Sections: The testing pyramid · What/what-not to test · Coverage as a signal not a goal · CI integration · Maintaining suites

---

## 13. Performance & Optimization
`performance` · icon `Gauge` — making apps fast and efficient.

- **Instruments & Profiling** — `instruments` · mid · ✅
  Sections: Time Profiler · Allocations & Leaks · Signposts · Reading flame graphs · Measure before optimizing
- **Leak & Retain-Cycle Debugging** — `leak-debugging` · mid · ✅
  Sections: Memory graph debugger · Leaks instrument · Common leak sources · Verifying fixes
- **Launch Time Optimization** — `launch-time` · senior · ✅
  Sections: Cold vs warm launch · Pre-main time · Dynamic libraries & dyld · Deferring work · Measuring with signposts
- **Rendering Performance & Hitches** — `rendering-performance` · senior · ✅
  Sections: The 120Hz frame budget · Offscreen rendering · Overdraw & blending · Hitch debugging · SwiftUI/UIKit specifics
- **Image Loading & Memory** — `image-performance` · mid · ✅
  Sections: Decoding cost · Downsampling · Caching · `UIImage` vs `CGImage` · Async image pipelines
- **Background Tasks & Energy** — `background-tasks` · mid · ✅
  Sections: Background modes · `BGTaskScheduler` · Energy impact · QoS choices · Network efficiency
- **Build Time Optimization** — `build-time` · senior · ✅
  Sections: Diagnosing slow builds · Type-inference cost · Module boundaries · Incremental builds · Whole-module optimization
- **Value Types & Performance** — `value-perf` · senior · ✅
  Sections: Stack allocation wins · COW costs · Existential overhead · Inlining & specialization · Measuring

---

## 14. Mobile System Design
`system-design` · icon `Network` — the senior interview round.

- **Mobile System Design Framework** — `mobile-system-design` · senior · ✅
  Sections: Clarifying requirements · Functional vs non-functional · High-level components · API contract · Data flow · Trade-off discussion · Bottlenecks
- **Designing a Feed / Timeline** — `design-feed` · senior · ✅
  Sections: Requirements · Pagination & prefetch · Caching & freshness · Media handling · Offline & optimistic updates · Scroll performance
- **Designing an Image-Loading Library** — `design-image-loader` · senior · ✅
  Sections: API surface · In-memory & disk cache · Cancellation · Decoding & downsampling · Prefetch · Concurrency model
- **Designing Offline-First Sync** — `design-offline-sync` · senior · ✅
  Sections: Local source of truth · Sync engine · Conflict resolution · Change tracking · Retry & idempotency · Consistency
- **Designing a Chat / Messaging System** — `design-chat` · senior · ✅
  Sections: Realtime transport · Message ordering & delivery state · Local persistence · Sync & pagination · Presence & typing · Offline
- **Designing a Networking Layer** — `design-networking-layer` · senior · ✅
  Sections: Request abstraction · Auth & token refresh · Retry/backoff · Caching · Error model · Testability
- **Pagination Strategies** — `pagination` · mid · ✅
  Sections: Offset vs cursor · Prefetch triggers · Deduplication · Error/empty states · Cache coherence
- **Caching & Data Consistency** — `system-caching` · senior · ✅
  Sections: Cache layers · Invalidation strategies · Staleness vs freshness · Single source of truth · Cache-aside vs write-through
- **API Design & Versioning** — `api-design` · senior · ✅
  Sections: Resource modeling · Pagination & filtering contracts · Error contracts · Versioning strategies · Backward compatibility
- **Push Notifications Architecture** — `push-notifications` · mid · ✅
  Sections: APNs flow · Token registration · Payloads & silent push · Notification service/content extensions · Reliability

---

## 15. Tooling & Ecosystem
`tooling` · icon `Wrench` — the build/ship pipeline.

- **Swift Package Manager** — `spm` · mid · ✅
  Sections: `Package.swift` manifest · Targets & products · Dependencies & resolution · Local vs remote packages · Resources & plugins
- **Xcode Build System** — `xcode-build` · mid · ✅
  Sections: Targets, schemes & configurations · Build settings & `.xcconfig` · Build phases · Workspaces · Common build errors
- **Provisioning, Signing & Distribution** — `signing-distribution` · mid · ✅
  Sections: Certificates & profiles · App IDs & capabilities · TestFlight · App Store submission · Automatic vs manual signing
- **CI/CD** — `ci-cd` · senior · ✅
  Sections: Pipeline stages · Fastlane · GitHub Actions · Test & build automation · Code signing in CI · Release automation
- **Linting & Formatting** — `linting` · junior · ✅
  Sections: SwiftLint · SwiftFormat · Custom rules · Pre-commit hooks · Enforcing in CI
- **Debugging** — `debugging` · mid · ✅
  Sections: Breakpoints (symbolic/conditional) · LLDB commands · `po` / `expr` · View hierarchy debugger · Watchpoints
- **Crash Reporting & Analytics** — `crash-analytics` · mid · ✅
  Sections: Symbolication & dSYMs · Crash report anatomy · Tools (Crashlytics/Sentry) · Privacy · Actionable analytics
- **Feature Flags & A/B Testing** — `feature-flags` · senior · ✅
  Sections: Flag types · Remote config · Rollout strategies · Experiment design · Cleanup & flag debt

---

## 16. Computer Science Fundamentals
`cs-fundamentals` · icon `Binary` — data structures & algorithms (coding rounds).

- **Big-O & Complexity Analysis** — `big-o` · junior · ✅
  Sections: Time vs space complexity · Common classes · Amortized analysis · Best/avg/worst case · Analyzing Swift code
- **Arrays & Strings** — `ds-arrays` · junior · ✅
  Sections: Array internals & complexity · Two pointers · Sliding window · In-place tricks · String specifics in Swift
- **Linked Lists** — `ds-linked-lists` · mid · ✅
  Sections: Singly vs doubly · Building one in Swift (value vs reference) · Reversal · Cycle detection · Common problems
- **Stacks & Queues** — `ds-stacks-queues` · junior · ✅
  Sections: Stack operations & uses · Queue & deque · Implementations in Swift · Monotonic stack · Examples
- **Hash Tables** — `ds-hash-tables` · mid · ✅
  Sections: Hashing & buckets · `Hashable` in Swift · Collision handling · Complexity · Set/Dictionary problems
- **Trees & Binary Search Trees** — `ds-trees` · mid · ✅
  Sections: Tree terminology · Traversals (in/pre/post/level) · BST operations · Balancing (overview) · Recursion patterns
- **Graphs & Traversal** — `ds-graphs` · senior · ✅
  Sections: Representations (matrix/list) · BFS · DFS · Topological sort · Shortest path (overview) · Cycle detection
- **Heaps & Priority Queues** — `ds-heaps` · senior · ✅
  Sections: Heap property · Build/insert/extract · Implementing in Swift · Top-K problems · Heapsort
- **Sorting Algorithms** — `algo-sorting` · mid · ✅
  Sections: Comparison sorts overview · Merge/quick/heap sort · Stability · Swift's `sort` internals · Choosing a sort
- **Searching & Two Pointers** — `algo-searching` · mid · ✅
  Sections: Binary search & variants · Two pointers · Fast/slow pointers · Search-space reduction
- **Recursion & Dynamic Programming** — `algo-dp` · senior · ✅
  Sections: Recursion & base cases · Memoization · Tabulation · Common DP patterns · Recognizing DP problems
- **Concurrency Primitives (CS)** — `cs-concurrency` · senior · ✅
  Sections: Locks & mutexes · Semaphores · Atomicity · Deadlock/livelock/starvation · Producer-consumer

---

## 17. Modern additions (2026 batch)

Eighteen topics added after the original backlog was fully built, covering newer language features and interview surfaces not in the first pass. All ✅ built. Slotted into existing categories via `order`.

- **Swift Macros** — `swift-macros` · language · senior · ✅
  Sections: The boilerplate problem · Freestanding vs attached · Macro roles · Where the implementation lives (two-module split) · Additive-only · Syntax not values
- **Ownership & Noncopyable Types** — `ownership-noncopyable` · memory · senior · ✅
  Sections: The copy problem · `~Copyable` · consuming/borrowing · Unique ownership · When to reach for it
- **Regex & RegexBuilder** — `regex` · language · mid · ✅
  Sections: Stringly-typed parsing pain · Regex literals · `RegexBuilder` DSL · Captures · `Regex` in the stdlib APIs
- **Variadic Generics (Parameter Packs)** — `variadic-generics` · types · senior · ✅
  Sections: The arity problem · Parameter packs · `repeat`/`each` · Real use cases · Limits
- **Distributed Actors** — `distributed-actors` · concurrency · senior · ✅
  Sections: Actors across a network · `distributed` keyword · Actor systems & transports · Location transparency · Errors & serialization
- **Objective-C Interop** — `objc-interop` · language · senior · ✅
  Sections: Mixed codebases · Bridging headers · `@objc`/`dynamic` · Bridged types · Nullability & lightweight generics
- **Accessibility** — `accessibility` · ui · mid · ✅
  Sections: Who it's for · VoiceOver & traits · Dynamic Type · SwiftUI accessibility modifiers · Auditing
- **Localization** — `localization` · foundation · mid · ✅
  Sections: Hardcoded strings problem · String catalogs · Pluralization · Formatters & locale · RTL & layout
- **Security & Keychain** — `security` · foundation · senior · ✅
  Sections: Where secrets go · Keychain basics · App Transport Security · Data Protection · Common mistakes
- **WidgetKit** — `widgetkit` · ui · mid · ✅
  Sections: What widgets are · Timeline provider · Snapshot vs timeline · Sizes & deep links · Limits
- **App Intents** — `app-intents` · ui · mid · ✅
  Sections: Exposing app actions · `AppIntent` · Parameters & Siri · Shortcuts · App Shortcuts vs intents
- **StoreKit 2** — `storekit` · foundation · mid · ✅
  Sections: In-app purchase model · Products & purchase · Transactions & entitlements · Verification · Subscriptions
- **Deep Linking** — `deep-linking` · architecture · mid · ✅
  Sections: The routing problem · URL schemes vs Universal Links · Parsing & routing · SwiftUI navigation · Testing
- **Core Location** — `core-location` · foundation · mid · ✅
  Sections: Location basics · Authorization · Accuracy & battery · Region monitoring · Background updates
- **Local Notifications** — `local-notifications` · foundation · junior · ✅
  Sections: What they are · Requesting permission · Scheduling triggers · Content & actions · Handling delivery
- **GraphQL** — `graphql` · foundation · senior · ✅
  Sections: Over/under-fetching · Query/mutation/subscription · Schema · Apollo & codegen · Caching · Errors · vs REST
- **Dependency Managers** — `dependency-managers` · tooling · mid · ✅
  Sections: Reusing code without copying · CocoaPods · Carthage · SPM · Versioning & lockfiles · Trade-offs
- **Core Graphics & Custom Drawing** — `core-graphics` · ui · senior · ✅
  Sections: When no view fits · The context · Paths · Fill/stroke · Flipped coordinates · Transforms & state · Image rendering · Performance · Canvas

---

## 18. SQL & Databases

The first curriculum of a second **subject** (see `docs/subjects-and-sql-plan.md`). Standard SQL with SQLite/PostgreSQL dialect notes and iOS tie-ins (SQLite/Core Data/SwiftData). 31 topics across 8 `sql-*` categories. All ✅ built.

### SQL Foundations (`sql-foundations`)
- **What a Relational Database Is** — `sql-what-is-rdb` · sql-foundations · junior · ✅
  Sections: The same fact copied everywhere · A table is a spreadsheet with rules · Split the data, link by id · Why "relational" · Fixed schema · Where NoSQL fits
- **Tables, Rows & Keys** — `sql-tables-keys` · sql-foundations · junior · ✅
  Sections: Which row do you mean · Primary key · Foreign keys · Referential integrity · Composite keys
- **The Shape of SQL** — `sql-language-shape` · sql-foundations · junior · ✅
  Sections: Five jobs · DDL · DML · DQL · TCL · DCL · The whole map
- **Data Types** — `sql-data-types` · sql-foundations · junior · ✅
  Sections: A column must know what it holds · Whole numbers · Exact vs approximate · Text · Dates/booleans · Dialects
- **NULL & Three-Valued Logic** — `sql-null` · sql-foundations · mid · ✅
  Sections: We don't know yet · Not zero/blank · Comparisons give UNKNOWN · IS NULL · NULL in AND/OR · NULL in aggregates · COALESCE

### Querying (`sql-querying`)
- **SELECT & WHERE** — `sql-select-where` · sql-querying · junior · ✅
  Sections: A table has more than you want · SELECT · WHERE · AND/OR · Missing values · iOS tie-in
- **ORDER BY, LIMIT & DISTINCT** — `sql-order-limit` · sql-querying · junior · ✅
  Sections: No promised order · ORDER BY · Tie-breakers · LIMIT · OFFSET paging · DISTINCT
- **Operators: LIKE, IN, BETWEEN** — `sql-operators` · sql-querying · mid · ✅
  Sections: WHERE needs more than equals · BETWEEN · IN · LIKE · Case & escaping · Combining
- **CASE Expressions** — `sql-case` · sql-querying · mid · ✅
  Sections: A value that depends on a condition · Searched CASE · ELSE/NULL · Simple CASE · CASE anywhere · Conditional counting

### Aggregation & Grouping (`sql-aggregation`)
- **GROUP BY & Aggregates** — `sql-group-by` · sql-aggregation · mid · ✅
  Sections: Many rows into one · Aggregates over the table · GROUP BY · The SELECT-column rule · Multiple columns · NULL groups
- **HAVING vs WHERE** — `sql-having` · sql-aggregation · mid · ✅
  Sections: Filtering on a total · Two filters two moments · Execution order · Use both · HAVING without an aggregate
- **Window Functions** — `sql-window-functions` · sql-aggregation · senior · ✅
  Sections: A group total but keep every row · OVER · PARTITION BY · Running totals · Ranking · Where windows sit

### Joins & Sets (`sql-joins`)
- **INNER & OUTER Joins** — `sql-inner-outer-joins` · sql-joins · mid · ✅
  Sections: The answer in two tables · INNER JOIN · LEFT JOIN · RIGHT/FULL OUTER · Anti-join · Row multiplication
- **Self & Cross Joins** — `sql-self-cross-joins` · sql-joins · mid · ✅
  Sections: Relationships inside one table · Self join & aliases · Cross join · Cartesian product · Accidental cross join
- **UNION, INTERSECT & EXCEPT** — `sql-set-operations` · sql-joins · mid · ✅
  Sections: Combining two result sets · UNION · UNION ALL · INTERSECT · EXCEPT · Set ops vs joins

### Subqueries & CTEs (`sql-subqueries`)
- **Subqueries** — `sql-subqueries` · sql-subqueries · mid · ✅
  Sections: The filter is itself a query · Scalar · IN list · Derived tables · Independent vs correlated
- **Correlated Subqueries** — `sql-correlated-subqueries` · sql-subqueries · senior · ✅
  Sections: Compared to its own group · Spot the correlation · Independent vs correlated · EXISTS · NOT EXISTS
- **Common Table Expressions** — `sql-ctes` · sql-subqueries · mid · ✅
  Sections: Nested subqueries unreadable · WITH · Reuse · Chaining · CTE vs subquery
- **Recursive CTEs** — `sql-recursive-ctes` · sql-subqueries · senior · ✅
  Sections: How deep does it go · Anchor + recursive member · Level by level · Termination · Generating sequences

### Schema Design (DDL) (`sql-ddl`)
- **CREATE, ALTER & DROP** — `sql-create-alter-drop` · sql-ddl · junior · ✅
  Sections: A place for data · CREATE TABLE · ALTER TABLE · DROP TABLE · DROP vs DELETE vs TRUNCATE · Auto-commit
- **Constraints** — `sql-constraints` · sql-ddl · mid · ✅
  Sections: Keeping bad data out · NOT NULL · DEFAULT · UNIQUE · CHECK · PK/FK · Table-level
- **Normalization** — `sql-normalization` · sql-ddl · senior · ✅
  Sections: Redundancy breeds contradictions · The three anomalies · 1NF · 2NF · 3NF · Denormalization
- **ER Modeling & Relationships** — `sql-er-modeling` · sql-ddl · mid · ✅
  Sections: From things to tables · Entities & relationships · One-to-many · One-to-one · Many-to-many · Reading into keys

### DML & Transactions (`sql-dml-transactions`)
- **INSERT, UPDATE & DELETE** — `sql-insert-update-delete` · sql-dml-transactions · junior · ✅
  Sections: Reading isn't enough · INSERT · UPDATE · The dangerous omission · DELETE · Upsert
- **Transactions & ACID** — `sql-acid` · sql-dml-transactions · mid · ✅
  Sections: Two writes that must both happen · BEGIN/COMMIT/ROLLBACK · Atomicity · Consistency · Isolation · Durability · Auto-commit
- **Isolation Levels** — `sql-isolation-levels` · sql-dml-transactions · senior · ✅
  Sections: Isolation isn't free · Three anomalies · The four levels · The trade-off
- **Locking & Deadlocks** — `sql-locking-deadlocks` · sql-dml-transactions · senior · ✅
  Sections: Two writers one row · Shared vs exclusive · Waiting · Deadlock · Detection · Prevention

### Indexing & Performance (`sql-indexing`)
- **Indexes & B-Trees** — `sql-indexes` · sql-indexing · mid · ✅
  Sections: Finding a needle · Sorted lookup structure · The B-tree · Primary keys pre-indexed · Indexing foreign keys
- **EXPLAIN & Query Plans** — `sql-explain` · sql-indexing · senior · ✅
  Sections: Is my query using the index · EXPLAIN · Seq vs Index Scan · The plan tree · EXPLAIN ANALYZE
- **When Indexes Hurt** — `sql-index-tradeoffs` · sql-indexing · senior · ✅
  Sections: Why not index every column · Write cost · Storage · Selectivity · What defeats an index · Composite column order
- **SQL vs NoSQL** — `sql-vs-nosql` · sql-indexing · senior · ✅
  Sections: Is relational always the answer · Relational strengths · NoSQL families · Scaling · CAP · Polyglot persistence

---

## Implementation checklist (for the generation session)

1. Extend `CategoryId` and the `CATEGORIES` map in `src/content/types.ts` with the new categories used above (label, order, blurb, icon, accent). Keep accents within the sequential palette.
2. For each topic, create `src/content/topics/<slug>/` with `meta.ts`, `explanation.md`, `quiz.ts` per `.claude/skills/author-topic/SKILL.md`.
3. Use the **Sections** list as the `##` headings of `explanation.md`; always append an **Interview lens** section.
4. Set `order` per category so topics sort sensibly (roughly the order listed here).
5. ✅ topics (`optionals`, `async-await`) already exist — skip or revise, don't duplicate.

> Counts: 16 categories, ~150 topics. Treat this as a backlog — generate by category, prioritizing the areas most relevant to the target role.
