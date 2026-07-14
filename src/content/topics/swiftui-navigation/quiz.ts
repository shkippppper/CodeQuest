import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "nav-value-based",
    type: "mcq",
    prompt: "In modern SwiftUI, what does `NavigationLink(value:)` push?",
    options: [
      "A Hashable value, which `.navigationDestination(for:)` maps to a destination view",
      "A concrete destination view instance built and allocated at the link's declaration site",
      "A UIViewController subclass that NavigationStack wraps in a hosting controller automatically",
      "A raw URL string that the stack resolves through the registered deep-link handler",
    ],
    answer: 0,
    explanation:
      "Value-based navigation pushes a `Hashable` value; a separate `.navigationDestination(for:)` renders it. This decouples links from destinations and makes navigation manipulable as data.",
  },
  {
    id: "nav-destination-role",
    type: "mcq",
    prompt: "What does `.navigationDestination(for: Item.self)` do?",
    options: [
      "Defines how a pushed value of type Item is turned into a destination view",
      "Immediately navigates to the Item screen at the moment the modifier is applied",
      "Registers a universal link or deep-link URL pattern for external navigation events",
      "Creates a new tab in the nearest enclosing TabView for the Item type",
    ],
    answer: 0,
    explanation:
      "It maps a value type to a view builder. When any `NavigationLink(value:)` (or a path append) pushes an `Item`, this closure builds the destination. Links and destinations stay decoupled.",
  },
  {
    id: "nav-path-fill",
    type: "fill",
    prompt: "Bind `NavigationStack(path: $___)` to a @State array/NavigationPath to push and pop navigation programmatically.",
    answers: ["path"],
    hint: "The parameter is literally named this.",
    explanation:
      "`NavigationStack(path: $path)` makes the stack reflect a state value. Mutating `path` (append/removeAll) drives navigation without imperative push/pop calls.",
  },
  {
    id: "nav-programmatic-predict",
    type: "predict",
    prompt: "What does `path.removeAll()` do when bound to a NavigationStack?",
    code: `@State private var path: [Route] = [.a, .b, .c]
// later:
path.removeAll()`,
    options: [
      "Pops the entire stack all the way back to the root view",
      "Pushes three additional screens on top of the existing path values",
      "Removes only the topmost screen, equivalent to calling removeLast on the array",
      "Has no effect because NavigationStack requires explicit pop() calls, not array mutations",
    ],
    answer: 0,
    explanation:
      "The stack mirrors `path`. Emptying it pops everything, returning to the root. Appending pushes; removing the last element pops one — navigation is just array manipulation.",
  },
  {
    id: "sheet-item",
    type: "mcq",
    prompt: "What does `.sheet(item: $selectedItem)` do?",
    options: [
      "Presents the sheet when the bound optional becomes non-nil, passing the value into the content",
      "Presents a sheet unconditionally exactly once at app launch, ignoring the binding value in all subsequent renders",
      "Requires a separate boolean isPresented flag to also be true in addition to the non-nil optional item binding",
      "Presents an alert-style compact modal overlay anchored to a button rather than a full sheet from the bottom edge",
    ],
    answer: 0,
    explanation:
      "The `item:` variant presents when the optional binding is non-nil and hands the unwrapped value to the builder — cleaner than a bool plus a separately stored item.",
  },
  {
    id: "nav-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about SwiftUI navigation.",
    options: [
      "Modal presentation (sheets/alerts) is driven by view state, not method calls",
      "Binding the stack to a path enables programmatic navigation",
      "`NavigationLink(value:)` requires the value to be Hashable",
      "You must call an imperative push() function to navigate",
    ],
    answers: [0, 1, 2],
    explanation:
      "State-driven modals, path-based programmatic nav, and Hashable values are all correct. There is **no** imperative `push()` — you mutate the path or use links (option 3 is false).",
  },
  {
    id: "nav-deeplink-senior",
    type: "mcq",
    prompt: "How does value+path navigation make deep linking straightforward?",
    options: [
      "Parse the URL into route value(s) and assign the path; SwiftUI renders that navigation state (even a multi-level stack)",
      "You must imperatively push each individual UIViewController in the correct order before SwiftUI's NavigationStack can take control",
      "Deep linking directly into a NavigationStack screen is simply not achievable without integrating a third-party routing library",
      "You register all URL patterns with the operating system at build time and the system resolves routing entirely on its own",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Since the stack mirrors a `path` of values, a deep link becomes: parse URL → `[Route]` → set `path`. SwiftUI builds the whole stack (e.g. list → detail). With `Codable` routes the same path also drives state restoration.",
  },
  {
    id: "nav-decoupling-senior",
    type: "mcq",
    prompt: "Why is decoupling links from destinations (value-based nav) valuable architecturally?",
    options: [
      "The source view doesn't need to know the destination view type — the same value can be pushed from anywhere and mapped centrally",
      "It measurably reduces the navigation push animation duration by entirely removing the destination-view allocation from the critical animation path",
      "It removes the need for a NavigationStack entirely, allowing any arbitrary parent container view to fully manage the push and pop lifecycle itself",
      "It permanently disables the standard system-provided back button and unconditionally requires the user to use a custom programmatic dismiss action instead",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A list pushing `Route.profile(id:)` doesn't import or construct `ProfileView` — the `.navigationDestination` (possibly defined centrally) does. This reduces coupling, supports modular apps, and centralizes routing (see the routing-architecture topic).",
  },
  {
    id: "nav-deprecated-senior",
    type: "predict",
    prompt: "🧠 Trick question — why was the old `NavigationView` + `NavigationLink(destination:)` limiting compared to NavigationStack?",
    code: `NavigationLink(destination: DetailView()) { Text("Go") }  // old style`,
    options: [
      "Destination views were eagerly tied to the link, making programmatic control, deep linking, and state restoration awkward",
      "The old destination-based API completely removed the system back button, leaving users with no way to pop back",
      "NavigationView rendered the master-detail layout only on iPad and produced entirely blank screens on all iPhone devices",
      "NavigationLink(destination:) secretly required UIKit internals under the hood and crashed inside pure SwiftUI app targets",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The old API baked the destination into the link and often built it eagerly, with no clean single source of navigation state. `NavigationStack` + value/path makes navigation data you can drive in code, deep-link into, and serialize — which the destination-based API couldn't do cleanly.",
  },
  {
    id: "nav-flashcard",
    type: "flashcard",
    prompt:
      "Explain modern SwiftUI navigation: NavigationStack, value-based nav, paths, and modals. Answer aloud, then reveal.",
    modelAnswer:
      "Modern SwiftUI navigation (**`NavigationStack`**, iOS 16+) is **data-driven**. Instead of wiring a destination view into a link, you push a **`Hashable` value** with `NavigationLink(value:)`, and a separate **`.navigationDestination(for: T.self)`** maps that value type to a destination view — **decoupling** links from destinations so the same value can be pushed anywhere and mapped centrally. Bind the stack to a **`path`** (`[Value]` or `NavigationPath`) held in `@State`, and navigation becomes **state**: `path.append(...)` pushes, `path.removeAll()` pops to root — programmatic control with no imperative `push`/`pop`. This makes **deep linking** trivial (parse a URL into route values, set the path — even building a multi-level stack) and, with `Codable` routes, **state restoration** too. **Modals are also state-driven**: `.sheet(isPresented:)`, `.sheet(item:)` (presents when an optional is non-nil, passing the value), `.alert`, `.confirmationDialog`, `.popover`. This replaces the older `NavigationView`/`NavigationLink(destination:)`, which coupled destinations to links and couldn't be driven/serialized as cleanly.",
    keyPoints: [
      "NavigationStack: push Hashable values, map with .navigationDestination(for:)",
      "Links decoupled from destinations (same value pushable anywhere)",
      "Bind to a path → programmatic push/pop via array/state mutation",
      "Deep linking & restoration = set the (Codable) path",
      "Modals are state-driven: sheet(isPresented:)/sheet(item:)/alert",
    ],
    explanation:
      "Senior answers stress value+path navigation as *state* (enabling deep links/restoration and decoupling), and contrast it with the limiting destination-based NavigationView.",
  },
];

export default quiz;
