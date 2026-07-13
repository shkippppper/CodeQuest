## The problem: searching an array doesn't scale

```swift
let seen = [17, 42, 8, 91, 3]
seen.contains(42)   // walks the array until it finds 42 -- O(n)
```

`contains` on an array has no shortcut — in the worst case it checks every element before it finds (or fails to find) the one you're after. The collections lesson already covers using `Set` and `Dictionary` for O(1) average membership checks and key lookups; this lesson is about *why* that's O(1) — the **hash table** mechanism underneath both of them.

## Hashing and buckets

Imagine the naive fix: instead of one big array you check one at a time, allocate a huge array up front and store each value at the index equal to the value itself.

```swift
var table = Array(repeating: false, count: 100)
table[42] = true
table[42]   // true -- direct index, no scanning
```

That's O(1), but it only works because the values happen to be small integers that fit as array indices. A **hash function** is what generalizes this trick to any type: it takes a value and computes a number — the **hash value** — deterministically, the same value always producing the same number.

```swift
"hello".hashValue    // some Int, e.g. -401234567891011121 (varies per run)
```

That hash value gets reduced to a small range with the remainder operator, giving an index into a fixed-size backing array:

```swift
let bucketCount = 8
let index = abs("hello".hashValue) % bucketCount   // e.g. 3
```

Each slot in that backing array is called a **bucket**. To insert `"hello"`, the hash table hashes it, reduces the hash to a bucket index, and stores the value in that bucket. To look it up later, it hashes `"hello"` again — same input, same hash, same bucket — and looks only inside that one bucket. No scanning the rest of the table.

Predict: two completely different strings, `"cat"` and `"art"`, are hashed and reduced to bucket index `3` and `3` — the same bucket. Is that a bug?

Answer: no — it's expected and unavoidable. There are far more possible strings than there are buckets, so by the pigeonhole principle multiple values *must* land in the same bucket sometimes. This is called a **collision**, and every real hash table has a strategy for handling it — covered next.

## `Hashable` in Swift

Swift's `Set` and `Dictionary` require their elements (or dictionary keys) to conform to `Hashable`, which is what supplies that hash function.

```swift
struct Point: Hashable {
    let x: Int
    let y: Int
}

let visited: Set<Point> = [Point(x: 0, y: 0), Point(x: 1, y: 1)]
visited.contains(Point(x: 0, y: 0))   // true
```

Because every stored property here (`Int`, `Int`) is already `Hashable`, the compiler synthesizes `hashValue` (and `==`, from `Equatable`, which `Hashable` requires) for free — no code needed beyond `: Hashable`.

There's a contract the compiler can't enforce for you: if two values are equal (`==`), they *must* produce the same hash. Break that — say, by hashing only `x` but comparing both `x` and `y` for equality — and the hash table breaks silently: it might hash two equal-looking values to different buckets, or worse, treat two different values as the same key because they landed in the same bucket and a broken `==` said they matched. This is why you almost never write a custom `hash(into:)` by hand unless you also carefully control `==` to match it exactly.

```swift
struct CaseInsensitiveWord: Hashable {
    let text: String

    static func == (lhs: Self, rhs: Self) -> Bool {
        lhs.text.lowercased() == rhs.text.lowercased()
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(text.lowercased())
    }
}
```

Here `==` treats `"Cat"` and `"cat"` as equal, so `hash(into:)` must also hash the lowercased text — otherwise two values that compare equal could land in different buckets and a `Set` would let both in, silently violating uniqueness.

## Collision handling

Two common strategies handle the case where two values hash to the same bucket.

**Separate chaining** turns each bucket into a small list instead of a single slot. When two values collide, both just get appended to that bucket's list.

```swift
// bucket 3: [] -> insert "cat" -> ["cat"] -> insert "art" (collides) -> ["cat", "art"]
```

Lookup now hashes to the bucket, then does a short linear scan *inside just that bucket* to find the exact match. As long as collisions stay rare, each bucket's list stays tiny, so that inner scan is effectively O(1).

**Open addressing** takes the opposite approach: no lists, one value per slot. If the computed bucket is already occupied, it probes forward (index+1, index+2, ...) until it finds an empty slot.

```swift
// bucket 3 taken by "cat" -> try bucket 4 -> empty -> "art" goes there
```

Lookup replays the same probing sequence: hash to bucket 3, see it's `"cat"` not a match, check bucket 4, find `"art"`. This avoids the extra memory of per-bucket lists but means one collision can cascade — a full bucket 4 pushes the next insert to bucket 5, and so on, which is why open-addressing tables are especially sensitive to staying spacious.

Swift's actual `Dictionary`/`Set` implementation uses a form of open addressing internally, but the interview-relevant point is knowing both strategies exist and being able to explain the trade-off: chaining handles high collision rates more gracefully (each bucket just grows a little), while open addressing has better memory locality (no extra list allocations) but degrades faster as the table fills up.

## Load factor and resizing

The **load factor** is the ratio of stored elements to bucket count. A table with 80 elements and 100 buckets has a load factor of 0.8.

```swift
var scores: [String: Int] = [:]
for i in 0..<1000 {
    scores["key\(i)"] = i   // triggers resizes as the table fills
}
```

As load factor climbs, collisions get more frequent — more buckets are already occupied, so both chaining lists grow longer and open-addressing probes run longer. Once load factor crosses a threshold (commonly around 0.7), the table **resizes**: allocate a bigger backing array (often double the size), then re-insert every existing element, because each element's bucket index depends on `bucketCount` and that number just changed.

That resize is O(n) — a real, one-time cost — but like `Array.append`'s occasional buffer growth, it happens rarely enough relative to the number of cheap inserts that the *amortized* cost per insert stays O(1).

## Complexity

| Operation | Average | Worst case |
|---|---|---|
| Insert | O(1) | O(n) |
| Lookup | O(1) | O(n) |
| Delete | O(1) | O(n) |

The worst case only shows up when hashing goes wrong — either a poor hash function that clusters many values into the same few buckets, or (rarer, but real) an adversary who crafts inputs specifically designed to collide, degrading every bucket into one long list to scan linearly. In ordinary use with a reasonable `Hashable` conformance, O(1) average is the number to reason with.

## Set and Dictionary problems

The collections lesson covers `Set`/`Dictionary` syntax and everyday usage; the pattern worth internalizing here is that a hash table turns an O(n) "have I seen this?" scan into an O(1) one, which is the single most common way to shave an O(n²) brute-force interview solution down to O(n).

```swift
func firstDuplicate(_ nums: [Int]) -> Int? {
    var seen = Set<Int>()
    for n in nums {
        if seen.contains(n) { return n }
        seen.insert(n)
    }
    return nil
}
```

Instead of comparing every pair of numbers (O(n²)), one pass with a `Set` remembers everything already seen and checks membership in O(1) average — O(n) total.

```swift
func twoSum(_ nums: [Int], _ target: Int) -> (Int, Int)? {
    var indexOf: [Int: Int] = [:]
    for (i, n) in nums.enumerated() {
        let complement = target - n
        if let j = indexOf[complement] { return (j, i) }
        indexOf[n] = i
    }
    return nil
}
```

Same trick with a `Dictionary`: instead of checking every pair to see if two numbers sum to `target` (O(n²)), remember every number's index as you go, and for each new number check whether its complement was already seen — O(1) average lookup, O(n) total.

## Common pitfalls

- *Breaking the `==`/hash contract.* If two values are `==` but hash differently (or vice versa via a mismatched custom `hash(into:)`), `Set`/`Dictionary` behavior becomes unpredictable — duplicates may sneak in, or valid lookups may silently fail.
- *Assuming worst-case O(n) can't happen.* It's rare with Swift's built-in hashing, but a pathological custom `hash(into:)` (e.g. always returning the same constant) collapses every operation to O(n) by forcing every value into one bucket.
- *Reaching for `Array.contains` in a loop instead of a `Set`.* That's an O(n·m) pattern — hoist the "have I seen this" check into a `Set` built once, and it drops to O(n + m).

## Interview lens

If asked "how does a `Dictionary` get O(1) lookup," the answer is the hashing pipeline: hash the key, reduce it to a bucket index, look only in that bucket, with collisions resolved by chaining or open addressing and a rare O(n) resize keeping the *average* cost O(1) even as the table grows.

The single highest-leverage pattern for coding interviews is spotting an O(n²) brute force with a nested "check every pair" or "scan the array again inside a loop," and replacing the inner scan with a `Set` or `Dictionary` built during a single pass — `twoSum` and `firstDuplicate` above are the canonical shape of that trick, and most "optimize this" follow-up questions are asking for exactly this swap.

Be ready to state the worst-case honestly rather than claim everything is O(1): a hash table degrades to O(n) if the hash function clusters values badly, and interviewers sometimes probe whether you know that average-case and worst-case are different numbers.
