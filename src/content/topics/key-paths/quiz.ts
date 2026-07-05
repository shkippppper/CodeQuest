import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "kp-what",
    type: "mcq",
    prompt: "What is a key path like `\\User.name`?",
    options: [
      "A type-safe, first-class reference to a property, usable as a value (carrying Root and Value types)",
      "A file-system path",
      "A closure that runs immediately",
      "A string property name",
    ],
    answer: 0,
    explanation:
      "`\\Root.value` is a `KeyPath<Root, Value>` — a value you can store and pass, that the compiler understands (typed, composable). Unlike a stringly-typed name, it's fully type-checked.",
  },
  {
    id: "kp-apply",
    type: "mcq",
    prompt: "How do you read a value through a key path `kp`?",
    options: [
      "`instance[keyPath: kp]`",
      "`instance.kp`",
      "`kp(instance)` always",
      "`instance.value(kp)`",
    ],
    answer: 0,
    explanation:
      "The `[keyPath:]` subscript applies a key path: `user[keyPath: \\.name]`. For a writable key path on a mutable root, you can also assign through it.",
  },
  {
    id: "kp-writable",
    type: "mcq",
    prompt: "Which key-path type lets you WRITE to a property of a value type?",
    options: [
      "`WritableKeyPath<Root, Value>`",
      "`KeyPath<Root, Value>`",
      "`PartialKeyPath<Root>`",
      "`AnyKeyPath`",
    ],
    answer: 0,
    explanation:
      "`WritableKeyPath` supports read/write for value types (needs a mutable root). Plain `KeyPath` is read-only; `ReferenceWritableKeyPath` writes through a class reference; `PartialKeyPath`/`AnyKeyPath` are type-erased.",
  },
  {
    id: "kp-as-function-fill",
    type: "fill",
    prompt: "Since Swift 5.2 you can pass a key path where a function is expected, e.g. `users.map(\\.___)` instead of `{ $0.name }`.",
    answers: ["name"],
    hint: "The property being read in the example.",
    explanation:
      "A key path `\\Root.value` can be used where `(Root) -> Value` is expected, so `map(\\.name)` reads each element's `name` — cleaner than a closure and can't do extra work.",
  },
  {
    id: "kp-reference-writable",
    type: "predict",
    prompt: "🧠 Trick question — you have a `let` reference to a class instance. Can you write to its property via a key path?",
    code: `final class Box { var n = 0 }
let box = Box()
let kp: ReferenceWritableKeyPath<Box, Int> = \\Box.n
box[keyPath: kp] = 5`,
    options: [
      "Yes — ReferenceWritableKeyPath writes through the class reference, even on a `let`",
      "No — `let` blocks all writes",
      "Only if box is a var",
      "It won't compile",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`ReferenceWritableKeyPath` writes through a class reference. Since `let` only freezes the reference (not the object's mutable properties), you can assign `box[keyPath: kp] = 5`. A value-type `WritableKeyPath` would instead require a `var` root.",
  },
  {
    id: "kp-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about key paths.",
    options: [
      "Key paths compose to reach nested properties (`\\User.address.city`)",
      "A key path can be used where a `(Root) -> Value` function is expected",
      "`KeyPath` (non-writable) lets you assign a new value",
      "`PartialKeyPath`/`AnyKeyPath` are type-erased key paths",
    ],
    answers: [0, 1, 3],
    explanation:
      "Composition, key-path-as-function, and type-erased variants are correct. A plain `KeyPath` is **read-only** — you need `WritableKeyPath`/`ReferenceWritableKeyPath` to write (option 3 is false).",
  },
  {
    id: "kp-generic-api-senior",
    type: "predict",
    prompt: "What does `users.sorted(by: \\.id)` require of a custom `sorted(by:)` helper?",
    code: `extension Sequence {
    func sorted<V: Comparable>(by kp: KeyPath<Element, V>) -> [Element] {
        sorted { $0[keyPath: kp] < $1[keyPath: kp] }
    }
}`,
    options: [
      "The key path's Value must be Comparable, so the helper is constrained `<V: Comparable>`",
      "Nothing — any key path works for sorting",
      "The Element must be a class",
      "It must be a WritableKeyPath",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "To compare values read through the key path, the helper constrains the key path's `Value` to `Comparable`. Key paths carry `Root`/`Value` types, so the API stays fully type-checked while being parameterized by *which* property to sort on.",
  },
  {
    id: "kp-dynamic-member-senior",
    type: "mcq",
    prompt: "How does `@dynamicMemberLookup` combined with key paths give TYPE-SAFE dynamic member access?",
    options: [
      "A `subscript<V>(dynamicMember kp: KeyPath<T, V>) -> V` forwards `wrapper.prop` to `base[keyPath: \\.prop]`, checked by the key-path types",
      "It uses runtime string lookup with no checking",
      "It disables the type system",
      "It only works for Objective-C types",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A key-path `dynamicMember` subscript makes `wrapper.name` resolve to `base[keyPath: \\.name]`. Because the subscript is generic over `KeyPath<T, V>`, the compiler enforces that `name` exists on `T` and infers `V` — dynamic *syntax*, static *safety*.",
  },
  {
    id: "kp-vs-closure-senior",
    type: "mcq",
    prompt: "What advantage does `map(\\.name)` have over `map { $0.name }` besides brevity?",
    options: [
      "The key path is a pure property reference — it can't smuggle in side effects or extra logic",
      "It runs on a background thread",
      "It caches results",
      "It's the only way to map",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A key path is strictly 'read this property' — the compiler knows its exact meaning. A closure could contain arbitrary code. So `map(\\.name)` communicates intent precisely and enables APIs that reason about *which* property is used (impossible with an opaque closure).",
  },
  {
    id: "key-paths-flashcard",
    type: "flashcard",
    prompt:
      "Explain key paths: what they are, the type hierarchy, and their key uses. Answer aloud, then reveal.",
    modelAnswer:
      "A **key path** (`\\Type.property`) is a **type-safe, first-class reference to a property** — a value the compiler understands (carrying `Root` and `Value` types), composable (`\\User.address.city`) and storable, unlike an opaque closure. Capability hierarchy: **`KeyPath<Root, Value>`** (read-only), **`WritableKeyPath`** (read/write for value types, needs a `var` root), **`ReferenceWritableKeyPath`** (write through a class reference, even on a `let`), and type-erased **`PartialKeyPath`/`AnyKeyPath`**. Apply one with the **`[keyPath:]`** subscript. Key uses: (1) **as functions** — since Swift 5.2 a key path works where `(Root) -> Value` is expected, so `map(\\.name)`/`filter(\\.isActive)` read cleaner and can't hide extra logic; (2) **`@dynamicMemberLookup` + key paths** for **type-safe** dynamic member access (a `subscript<V>(dynamicMember: KeyPath<T,V>)` forwards `x.prop` to `base[keyPath: \\.prop]`, checked by the key-path types); and (3) **generic APIs parameterized by a property** (`sorted(by: \\.id)`, `sum(of: \\.price)`), staying fully type-checked because the key path carries its Root/Value types.",
    keyPoints: [
      "\\Type.property = typed, composable, first-class property reference",
      "KeyPath (read) / WritableKeyPath (value write) / ReferenceWritableKeyPath (class write)",
      "Apply via [keyPath:]; compose nested; PartialKeyPath/AnyKeyPath erased",
      "Usable as (Root)->Value functions: map(\\.name)",
      "@dynamicMemberLookup + key paths = type-safe dynamic access; generic property-parameterized APIs",
    ],
    explanation:
      "Senior answers cover the writable/reference-writable distinction, key-path-as-function, and key-path-based generic APIs / dynamic member lookup as the type-safe dynamic pattern.",
  },
];

export default quiz;
