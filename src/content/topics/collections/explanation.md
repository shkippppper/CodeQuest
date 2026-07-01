## The problem: picking the right container

You almost never store just one thing. You store a list of users, a set of seen ids, a lookup from key to value. Swift gives you three workhorse collections — `Array`, `Set`, and `Dictionary` — and choosing the wrong one turns an O(1) lookup into an O(n) scan, or lets duplicates sneak in where you needed uniqueness. Knowing their guarantees is table-stakes.

All three are **generic value types** (structs), so they're copied on assignment and made cheap by copy-on-write.

## Arrays

An `Array` is an **ordered** collection that allows duplicates and gives fast index access.

```swift
var scores = [10, 20, 30]
scores.append(40)
scores[0] = 99
print(scores)          // [99, 20, 30, 40]
print(scores.count)    // 4
print(scores.first ?? -1) // 99
```

- Access by index is O(1); `append` is amortized O(1).
- Inserting or removing at the front is O(n) — everything after shifts.
- `contains(_:)` is O(n): an array has to look at each element.
- Subscripting out of range **crashes**; use `first`, `last`, or `indices.contains(i)` to stay safe.

## Sets and uniqueness

A `Set` is an **unordered** collection of **unique** elements with fast membership tests. Its elements must be `Hashable`.

```swift
var seen: Set<String> = ["a", "b"]
seen.insert("a")        // no-op — already present
print(seen.contains("b")) // true  (O(1) average)
print(seen.count)         // 2
```

Sets shine for "have I seen this?" checks and for set algebra:

```swift
let a: Set = [1, 2, 3]
let b: Set = [2, 3, 4]
print(a.union(b))        // {1, 2, 3, 4}
print(a.intersection(b)) // {2, 3}
print(a.subtracting(b))  // {1}
```

If order matters, a `Set` is the wrong tool — iteration order is not guaranteed.

## Dictionaries

A `Dictionary` maps unique **keys** to **values**. Keys must be `Hashable`; lookup, insert, and delete are O(1) on average.

```swift
var ages = ["Ada": 36, "Alan": 41]
ages["Grace"] = 85       // insert
ages["Ada"] = 37         // update

// Subscript returns an OPTIONAL — the key may be missing
let a = ages["Ada"]      // Int?  -> Optional(37)
let missing = ages["Bob"] // nil

// Supply a default to get a non-optional
let count = ages["Bob", default: 0] // 0
```

The optional return is the #1 thing interviewers probe: `dict[key]` is `Value?`, and force-unwrapping it (`dict[key]!`) crashes on a missing key.

## Mutability and value semantics

`let` makes an entire collection immutable — you can't append, insert, or reassign elements. `var` makes it mutable.

```swift
let fixed = [1, 2, 3]
// fixed.append(4)   // ❌ compile error

var flexible = [1, 2, 3]
flexible.append(4)    // ok
```

Because collections are value types, assigning one copies it:

```swift
var original = [1, 2, 3]
var copy = original
copy.append(4)
print(original) // [1, 2, 3] — unaffected
```

Copy-on-write means that copy was free until `append` triggered the actual duplication of the buffer.

## Common operations: map, filter, reduce

These three higher-order functions replace most manual loops and are everywhere in idiomatic Swift.

```swift
let nums = [1, 2, 3, 4, 5]

let doubled = nums.map { $0 * 2 }          // [2, 4, 6, 8, 10]
let evens = nums.filter { $0 % 2 == 0 }    // [2, 4]
let total = nums.reduce(0, +)              // 15
```

- **`map`** transforms every element, returning a new array of the same length.
- **`filter`** keeps only elements passing a test.
- **`reduce`** collapses the collection into a single value from an initial seed.
- **`compactMap`** maps and drops `nil`s; **`flatMap`** flattens nested collections.

They chain, and because collections are values, each step returns a fresh collection without touching the original.

## Choosing the right collection

- Need **order** and/or **duplicates**, or index access? → **Array**.
- Need **uniqueness** and fast "contains" checks, order irrelevant? → **Set**.
- Need to **look things up by a key**? → **Dictionary**.

A quick tell: if you find yourself calling `array.contains(...)` inside a loop, you probably want a `Set` (turning O(n·m) into O(n)).

## The interview lens

Two questions come up constantly. First, *"What does `dictionary[key]` return?"* — an **optional**, because the key might be absent; reach for `["key", default: x]` or `if let` instead of `!`. Second, *"Array vs Set — when would you switch?"* — when you only care about membership and uniqueness, not order; a `Set` turns O(n) `contains` into O(1) average and dedupes for free.

Bonus points for mentioning that all three are **value types with copy-on-write**, so passing a big array around is cheap until someone mutates it, and for knowing that `Set`/`Dictionary` keys must be `Hashable`.
