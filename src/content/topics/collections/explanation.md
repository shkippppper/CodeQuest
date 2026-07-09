## The problem: picking the right container

Real programs rarely store just one value — a list of users, a set of ids you've already seen, a lookup from a key to a value. Swift gives you three workhorse collections for this: `Array`, `Set`, and `Dictionary`. Pick the wrong one, and an O(1) lookup silently becomes an O(n) scan, or duplicates sneak in where you needed uniqueness.

```swift
var scores = [10, 20, 30]
```

That line already tells you something the type system won't say out loud: `scores` is a **value type** — a struct, not a class — so assigning it to another variable copies it, not shares it. All three collections in this lesson share that property, and Swift makes the copy cheap with **copy-on-write**: the actual duplication only happens the moment one of the copies is mutated.

## Arrays

Keep going with `scores`:

```swift
var scores = [10, 20, 30]
scores.append(40)
scores[0] = 99
print(scores)              // [99, 20, 30, 40]
print(scores.count)        // 4
print(scores.first ?? -1)  // 99
```

An `Array` is an **ordered** collection: elements keep the position you put them in, duplicates are allowed, and you can jump straight to any index.

That direct index access is O(1) — `scores[0]` doesn't scan anything, it computes an offset. `append` is amortized O(1): the buffer occasionally has to grow and copy, but that cost is spread thin across many cheap appends.

Not everything is cheap, though. Inserting or removing at the *front* is O(n), because every element after it has to shift over by one. And `contains(_:)` is O(n) too — an array has no shortcut, it has to check elements one at a time until it finds a match.

One more thing worth knowing before it bites you: subscripting out of range crashes.

```swift
scores[10]   // fatal error: array index out of range
```

Use `scores.first`, `scores.last`, or `scores.indices.contains(i)` to check safely instead.

## Sets and uniqueness

Predict: what happens if you insert `"a"` twice into a set that already contains it?

```swift
var seen: Set<String> = ["a", "b"]
seen.insert("a")
print(seen.count)   // 2
```

Answer: nothing — the second `insert("a")` is a silent no-op. A `Set` is an **unordered** collection where every element is guaranteed **unique**; inserting a duplicate just does nothing.

```swift
print(seen.contains("b"))   // true, O(1) average
```

That `contains` check is the whole reason to reach for a `Set`: instead of scanning like an array, it hashes the value and jumps straight to where it would live, so membership tests are O(1) on average. That's also why every element has to be **`Hashable`** — Swift needs a way to compute that hash.

Sets also give you set algebra out of the box:

```swift
let a: Set = [1, 2, 3]
let b: Set = [2, 3, 4]
print(a.union(b))         // {1, 2, 3, 4}
print(a.intersection(b))  // {2, 3}
print(a.subtracting(b))   // {1}
```

The trade-off: if the order you inserted things in matters, a `Set` is the wrong tool. Iteration order is not guaranteed.

## Dictionaries

```swift
var ages = ["Ada": 36, "Alan": 41]
ages["Grace"] = 85   // insert
ages["Ada"] = 37      // update
```

A `Dictionary` maps unique keys to values — think of it as a `Set` of keys, each one additionally carrying a value. Keys must be `Hashable` for the same reason `Set` elements must be; lookup, insert, and delete are all O(1) on average.

Here's the detail that trips people up:

```swift
let a = ages["Ada"]       // Int?  -> Optional(37)
let missing = ages["Bob"] // nil
```

Subscripting a dictionary returns an **optional**, not the value directly, because the key you asked for might not be there. Force-unwrapping that (`ages["Bob"]!`) crashes the instant a key is missing — which is exactly why this is the #1 thing interviewers probe about dictionaries.

The clean way to sidestep the optional when you have a sensible fallback:

```swift
let count = ages["Bob", default: 0]   // 0
```

## Mutability and value semantics

`let` versus `var` controls the whole collection, not individual elements:

```swift
let fixed = [1, 2, 3]
// fixed.append(4)   // compile error — fixed is a `let`

var flexible = [1, 2, 3]
flexible.append(4)   // fine
```

A `let` array can't be appended to, inserted into, or reassigned — the entire collection is locked. `var` allows all of it.

Because these are value types, assigning one to another variable copies it:

```swift
var original = [1, 2, 3]
var copy = original
copy.append(4)
print(original)   // [1, 2, 3] — unaffected by copy's append
```

`copy` and `original` look like they share memory right after the assignment, and for a moment they do. Copy-on-write means the actual duplication of the underlying buffer is deferred until the first mutation — here, `copy.append(4)`. Up to that line, the assignment was free.

## Common operations: map, filter, reduce

Three higher-order functions replace most manual loops in idiomatic Swift.

```swift
let nums = [1, 2, 3, 4, 5]
let doubled = nums.map { $0 * 2 }
print(doubled)   // [2, 4, 6, 8, 10]
```

**`map`** transforms every element and returns a new collection the same length as the original.

```swift
let evens = nums.filter { $0 % 2 == 0 }
print(evens)   // [2, 4]
```

**`filter`** keeps only the elements that pass a test you give it, dropping the rest.

```swift
let total = nums.reduce(0, +)
print(total)   // 15
```

**`reduce`** collapses the whole collection into a single value, starting from a seed (`0` here) and combining it with each element in turn.

Two more worth knowing: **`compactMap`** works like `map` but drops any `nil` results, and **`flatMap`** flattens a collection of collections into one. All of these chain together, and because collections are values, each step in the chain produces a fresh collection without touching the one before it.

## Choosing the right collection

Three questions settle it:

- Need order, duplicates, or direct index access? Reach for **Array**.
- Need uniqueness and fast "have I seen this?" checks, with order irrelevant? Reach for **Set**.
- Need to look things up by a key? Reach for **Dictionary**.

A concrete tell: if you catch yourself calling `array.contains(...)` inside a loop, that's an O(n·m) pattern hiding behind clean-looking code — swapping the array for a `Set` turns it into O(n).

## Interview lens

Two questions come up in almost every interview that touches collections. First: "What does `dictionary[key]` return?" The answer is an optional, because the key might not be there — reach for `["key", default: x]` or `if let` instead of force-unwrapping. Second: "When would you use a `Set` instead of an `Array`?" — whenever you only care about membership and uniqueness, not order; it turns an O(n) `contains` into O(1) average and dedupes for free along the way.

Worth mentioning even if not asked: all three collections are value types with copy-on-write, so passing a large array around is cheap right up until someone mutates their copy, and both `Set` elements and `Dictionary` keys have to be `Hashable`.
