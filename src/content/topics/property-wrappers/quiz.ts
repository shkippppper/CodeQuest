import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "pw-purpose",
    type: "mcq",
    prompt: "What is a property wrapper?",
    options: [
      "A @propertyWrapper type with a `wrappedValue` that packages reusable get/set logic, attached via @Name",
      "A way to make a property lazy by deferring its initialization until the first access, similar to a stored computed property",
      "A protocol that grants equality comparison between instances of the same type",
      "A closure stored in a property, called on every read to simulate custom getter logic",
    ],
    answer: 0,
    explanation:
      "A property wrapper factors reusable access logic into a type (with `wrappedValue`). Attaching `@Wrapper` to a property runs that logic transparently on read/write while the property still reads like a normal value.",
  },
  {
    id: "wrappedvalue-required",
    type: "mcq",
    prompt: "What member must every property wrapper provide?",
    options: [
      "`wrappedValue`",
      "`projectedValue`",
      "`body`",
      "`init(from:)`",
    ],
    answer: 0,
    explanation:
      "`wrappedValue` is required — its getter/setter is the access logic. `projectedValue` (the `$` value) is optional.",
  },
  {
    id: "projectedvalue-dollar-fill",
    type: "fill",
    prompt: "A wrapper's optional secondary value, accessed with the `___` prefix, is the projectedValue.",
    answers: ["$"],
    hint: "One symbol.",
    explanation:
      "`$name` returns the wrapper's `projectedValue`. In SwiftUI, `@State`'s projectedValue is a `Binding`, which is why `$count` gives a binding to pass to controls.",
  },
  {
    id: "clamped-predict",
    type: "predict",
    prompt: "What is `p.health` after this?",
    code: `@propertyWrapper struct Clamped {
    private var v: Int; let r: ClosedRange<Int>
    init(wrappedValue: Int, _ r: ClosedRange<Int>) { self.r = r; v = min(max(wrappedValue, r.lowerBound), r.upperBound) }
    var wrappedValue: Int { get { v } set { v = min(max(newValue, r.lowerBound), r.upperBound) } }
}
struct P { @Clamped(0...100) var health = 100 }
var p = P()
p.health = 250`,
    options: ["100", "250", "0", "150"],
    answer: 0,
    explanation:
      "The setter clamps to the range, so assigning `250` stores `100` (the upper bound). The property behaves like a normal `Int` at the use site while the wrapper enforces the range on every write.",
  },
  {
    id: "swiftui-wrappers",
    type: "mcq",
    prompt: "Which of these is a property wrapper?",
    options: [
      "`@State`",
      "`@escaping`",
      "`@MainActor`",
      "`@objc`",
    ],
    answer: 0,
    explanation:
      "`@State` (and `@Published`, `@Binding`, `@AppStorage`, `@Environment`) are property wrappers. `@escaping`/`@MainActor`/`@objc` are different kinds of attributes, not property wrappers.",
  },
  {
    id: "pw-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about property wrappers.",
    options: [
      "`init(wrappedValue:)` enables the `@Wrapper var x = default` syntax",
      "A wrapper adds a hidden stored instance to the enclosing type",
      "`$name` accesses the projectedValue",
      "Property wrappers can be applied where stored properties aren't allowed (e.g. in an extension)",
    ],
    answers: [0, 1, 2],
    explanation:
      "The init syntax, hidden stored instance, and `$` projectedValue are correct. Because a wrapper introduces a **stored** property, it can't be used where stored properties aren't allowed (option 3 is false).",
  },
  {
    id: "state-binding-senior",
    type: "mcq",
    prompt: "Why does `$count` give you a `Binding` in SwiftUI?",
    options: [
      "`@State`'s projectedValue is a `Binding`, and `$` accesses the projectedValue",
      "SwiftUI adds a special compiler rule that turns any `$` prefix into a two-way binding automatically",
      "Because count is an Int, and all Int properties automatically project a Binding when prefixed with `$`",
      "It doesn't — $count is the same underlying value, just accessed through a syntactic shortcut",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`@State` is a property wrapper whose `wrappedValue` is the value and whose `projectedValue` is a `Binding`. `$count` returns that projectedValue (the binding), which you pass to `TextField`, etc. Understanding wrappers explains the whole `$` mechanism.",
  },
  {
    id: "pw-stored-limit-senior",
    type: "predict",
    prompt: "🧠 Trick question — why can't you use `@Clamped` on a property declared in an extension?",
    code: `extension Player {
    @Clamped(0...100) var mana = 100   // in an extension
}`,
    options: [
      "A property wrapper introduces a hidden STORED property, and extensions can't add stored properties",
      "Clamped isn't declared in the same module as Player, so the compiler rejects the cross-module application",
      "Extensions ban all property wrappers by name due to a Swift language restriction on attribute annotations",
      "It works fine — extensions support property wrappers as long as the wrapper is defined in the same file",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Applying a wrapper desugars into a hidden stored wrapper instance plus a computed accessor. Since **extensions can't add stored properties**, you can't apply a property wrapper there — the same limitation that blocks stored properties in extensions.",
  },
  {
    id: "pw-lazy-conflict-senior",
    type: "mcq",
    prompt: "Which combination is NOT allowed?",
    options: [
      "A property that is both `lazy` and wrapped by a property wrapper",
      "A wrapper that exposes both a wrappedValue and an optional projectedValue for the `$` prefix",
      "A property wrapper whose wrappedValue type is a generic type parameter constrained to some protocol",
      "A property wrapper applied to a stored property inside a struct rather than a class",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A wrapped property manages its own storage/initialization, which conflicts with `lazy` (and `@NSCopying`), so you can't combine them. Wrappers can be generic, expose a projectedValue, and be used in structs.",
  },
  {
    id: "property-wrappers-flashcard",
    type: "flashcard",
    prompt:
      "Explain property wrappers: wrappedValue, projectedValue, and their limits. Answer aloud, then reveal.",
    modelAnswer:
      "A **property wrapper** is a `@propertyWrapper` type that packages **reusable get/set logic** into a value, attached to a property with `@Name`. The required **`wrappedValue`** property's getter/setter is the logic that runs on access — at the use site the property reads/writes like its plain value, but the compiler desugars it into a hidden stored wrapper instance plus a computed accessor delegating to `wrappedValue`. An optional **`projectedValue`** is a *second* value accessed with the **`$`** prefix (extra API): SwiftUI's `@State` projects a **`Binding`**, which is why `$count` is a binding. Provide an **`init(wrappedValue:...)`** to enable `@Wrapper var x = default` and pass configuration. SwiftUI is built on wrappers (`@State`, `@Published`, `@Binding`, `@AppStorage`, `@Environment`). Limits: a wrapper introduces a **hidden stored property**, so it can't be used where stored properties aren't allowed (e.g. in an extension) and **can't combine with `lazy`/`@NSCopying`**; wrappers can **compose** (`@A @B`) but with careful ordering.",
    keyPoints: [
      "@propertyWrapper type with required wrappedValue = reusable access logic",
      "Use site reads like the plain value; desugars to a hidden stored wrapper + accessor",
      "projectedValue via $ (e.g. @State projects a Binding → why $x is a binding)",
      "init(wrappedValue:) enables @Wrapper var x = default + config",
      "Adds a stored property (not allowed in extensions); can't be lazy; composes with care",
    ],
    explanation:
      "Senior answers connect $ to projectedValue (State→Binding), note wrappers ARE how @State etc. work, and cite the hidden-stored-property limit (no extensions, no lazy).",
  },
];

export default quiz;
