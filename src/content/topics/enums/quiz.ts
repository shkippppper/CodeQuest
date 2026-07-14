import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "enum-raw-autoincrement",
    type: "predict",
    prompt: "What does this print?",
    code: `enum Planet: Int {
    case mercury = 1, venus, earth
}
print(Planet.earth.rawValue)`,
    options: ["3", "2", "0", "Compile error"],
    answer: 0,
    explanation:
      "Integer raw values **auto-increment** from the last one you set. `mercury = 1`, so `venus = 2` and `earth = 3`.",
  },
  {
    id: "enum-init-rawvalue-optional",
    type: "mcq",
    prompt: "What is the type of `Suit(rawValue: \"hearts\")` for `enum Suit: String { case hearts, spades }`?",
    options: ["`Suit`", "`Suit?`", "`String`", "`String?`"],
    answer: 1,
    explanation:
      "`init(rawValue:)` is **failable** — it returns `Suit?` because the supplied raw value might not match any case. You must unwrap the result before using it.",
  },
  {
    id: "enum-raw-vs-associated",
    type: "mcq",
    prompt: "Which statement about enum case values is correct?",
    options: [
      "A case can have both a raw value and associated values, letting you attach extra data while keeping a fixed backing literal for serialization",
      "A case can have a raw value OR associated values, but not both",
      "Only classes can have associated values, because value types don't support the heap allocation required to store arbitrary payloads",
      "Associated values must all be the same type across cases, since the enum's backing storage has a single fixed layout for every variant",
    ],
    answer: 1,
    explanation:
      "A case has **either** a raw value (a fixed backing literal) **or** associated values (data attached at creation), never both. Different cases can carry completely different associated-value types.",
  },
  {
    id: "enum-exhaustive-fill",
    type: "fill",
    prompt: "A `switch` over an enum must be ___ — cover every case (or add a `default`) or it won't compile.",
    answers: ["exhaustive", "exhaustive."],
    hint: "Same word you'd use for a complete, leave-nothing-out search.",
    explanation:
      "Swift requires switches to be **exhaustive**. The payoff: add a new case later and every non-exhaustive switch becomes a compile error, pointing you at the code to update.",
  },
  {
    id: "enum-associated-extract",
    type: "predict",
    prompt: "What is printed?",
    code: `enum Barcode { case qr(String); case upc(Int) }
let code = Barcode.qr("SWIFT")
if case .qr(let value) = code {
    print(value)
}`,
    options: ["SWIFT", "qr", "nil", "Compile error"],
    answer: 0,
    explanation:
      "`if case .qr(let value) = code` matches the `.qr` case and binds its associated value to `value`, printing `SWIFT`. `if case` is the lightweight way to match one case without a full `switch`.",
  },
  {
    id: "enum-powers-multi",
    type: "multi",
    prompt: "Select **all** capabilities Swift enums have that C-style enums typically lack.",
    options: [
      "Cases can carry associated values of any type",
      "They can conform to protocols and have methods",
      "The compiler enforces exhaustive matching",
      "They can be subclassed to add cases",
    ],
    answers: [0, 1, 2],
    explanation:
      "Swift enums support associated values, protocol conformance/methods, and exhaustive matching. They **cannot** be subclassed — enums (like structs) don't support inheritance, so option 3 is false.",
  },
  {
    id: "enum-caseiterable-fill",
    type: "fill",
    prompt: "Conform an enum to ___ and the compiler synthesizes an `allCases` collection of every case.",
    answers: ["CaseIterable", "CaseIterable protocol"],
    hint: "A protocol name — 'Case' + a word meaning 'loopable'.",
    explanation:
      "`CaseIterable` synthesizes `allCases`. It's auto-synthesized only for enums **without** associated values, since those cases aren't a finite enumerable set.",
  },
  {
    id: "enum-indirect-why",
    type: "predict",
    prompt: "Why does this fail to compile as written, and which keyword fixes it?",
    code: `enum Expr {
    case value(Int)
    case add(Expr, Expr)
}`,
    options: [
      "It recursively contains itself; mark it `indirect`",
      "Enums can't store `Int` as associated values; the payload must be a raw value declared on the enum type itself",
      "It needs `@frozen` to tell the compiler the case list is fixed so it can determine the total size at compile time",
      "It needs to conform to `CaseIterable` so the compiler can enumerate all possible values and calculate a concrete size",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A case that stores the enum's own type gives the value unknown/infinite size. `indirect` tells the compiler to box the recursive payload behind a pointer (heap), making the layout finite. You can mark the whole enum `indirect` or just the recursive case.",
  },
  {
    id: "enum-unknown-default",
    type: "mcq",
    prompt: "You `switch` over a **non-frozen** enum from another module that may add cases in future OS versions. What keeps the switch exhaustive today yet future-proof?",
    options: [
      "`@unknown default:` — handles current cases but warns (not errors) when new ones appear",
      "A plain `default:` that silently absorbs all new cases without any warning, meaning newly added cases are handled by whatever logic you wrote for the catch-all",
      "Marking your switch `@frozen`, which prevents the library from adding new cases and guarantees today's exhaustive list can never expand in future OS versions",
      "Nothing — you can't switch over another module's enum at all; you must use a series of `if case` checks to avoid the exhaustiveness requirement entirely",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Resilient (non-frozen) library enums can gain cases across versions. `@unknown default:` lets you stay exhaustive for known cases while getting a compile-time **warning** — not a hard error, and not the silent swallow of a plain `default:` — when the library adds a case you haven't handled.",
  },
  {
    id: "enum-associated-equatable",
    type: "mcq",
    prompt: "Given `enum Res: Equatable { case ok(Int); case fail(String) }`, how does `==` come to exist?",
    options: [
      "Swift synthesizes it automatically because every associated value type is itself `Equatable`",
      "Enums with associated values can never be `Equatable`, because the compiler cannot safely compare payloads of differing types across cases without a hand-written implementation",
      "`==` works even without declaring `Equatable`, because Swift implicitly compares enum cases using their tag bits and associated storage at runtime",
      "You must always implement `==` by hand for associated-value enums, since the compiler only synthesizes `Equatable` for enums that have no associated values at all",
    ],
    answer: 0,
    difficulty: "mid",
    explanation:
      "Declare the conformance and Swift **synthesizes** `==` as long as all associated value types are `Equatable` (`Int` and `String` are). You only hand-write it when synthesis isn't possible or you need custom equality. The same synthesis applies to `Hashable`.",
  },
  {
    id: "enum-no-stored-props-trick",
    type: "mcq",
    prompt: "🧠 Trick question — which is TRUE about what an `enum` can hold?",
    options: [
      "It can have methods and computed properties, but NOT stored instance properties",
      "It can have stored instance properties just like a struct, as long as they are initialized in a custom init that runs after the case is set",
      "It cannot define any methods at all, because enums are pure value containers with no behavior of their own",
      "It can inherit stored properties from a superclass, since enums support single-inheritance just like classes when annotated with the correct attribute",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Enums can have methods, `static` members, and *computed* instance properties — but **no stored instance properties**. An enum instance's only storage is *which case it is* plus that case's associated values. People frequently try to add a stored `var` to an enum and are surprised it won't compile.",
  },
  {
    id: "enum-state-machine-flashcard",
    type: "flashcard",
    prompt:
      "You're asked to model a screen that can be loading, loaded (with data), or failed (with an error). What do you reach for, and why? Answer aloud, then reveal.",
    modelAnswer:
      "Use an **enum with associated values**: `enum LoadState { case idle; case loading; case loaded([Item]); case failed(Error) }`. An enum holds exactly one case at a time, so you can't be simultaneously loading *and* failed — the type makes those illegal combinations **unrepresentable**. Compare a struct with `isLoading`/`data`/`error` fields, where nothing stops all three being set at once. You then handle state with an exhaustive `switch`, and adding a new state later produces compile errors everywhere you need to update.",
    keyPoints: [
      "Enum with associated values per state",
      "Only one case active at a time — no contradictory flags",
      "\"Make illegal states unrepresentable\"",
      "Exhaustive switch to render each state",
      "New case → compile errors guide the update",
    ],
    explanation:
      "The senior signal is the phrase 'make illegal states unrepresentable' and contrasting the enum against a bag-of-optionals struct that permits contradictory combinations.",
  },
];

export default quiz;
