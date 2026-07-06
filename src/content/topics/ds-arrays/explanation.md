## The problem: the most common interview inputs

Arrays and strings are the input to the majority of coding questions. The naive answer is usually a nested loop (O(n²)); the *good* answer almost always uses one of a few patterns — **two pointers** or a **sliding window** — to get to O(n). Knowing array internals (so you avoid hidden O(n) operations) plus these two patterns covers a huge fraction of array/string problems.

## Array internals & complexity

A Swift `Array` is a **contiguous, dynamically-sized** buffer. Consequences:

- **Index access `a[i]`** — **O(1)** (direct offset).
- **Append at the end** — **amortized O(1)** (capacity doubles occasionally).
- **Insert/remove at the front or middle** — **O(n)** (elements shift).
- **`contains` / `firstIndex(of:)`** — **O(n)** (linear scan).
- Arrays are **value types with copy-on-write** — copies are O(1) until mutation.

Design tip: process from the **end** (or use `reserveCapacity`) to avoid O(n) front operations; reach for a `Set`/`Dictionary` when you need O(1) membership instead of `contains`.

## Two pointers

The **two-pointer** pattern uses two indices moving through the array to replace a nested loop with a single pass. Common variants:

- **Opposite ends → middle** (often on a **sorted** array): e.g. "find a pair summing to target" — move `left`/`right` inward based on the current sum.

```swift
func twoSumSorted(_ a: [Int], _ target: Int) -> (Int, Int)? {
    var l = 0, r = a.count - 1
    while l < r {
        let sum = a[l] + a[r]
        if sum == target { return (l, r) }
        else if sum < target { l += 1 }   // need bigger → advance left
        else { r -= 1 }                    // need smaller → retreat right
    }
    return nil
}   // O(n) time, O(1) space
```

- **Same direction (fast/slow)** — one pointer scans, another marks where to write (in-place removal/dedup, reversing).

Two pointers turn many O(n²) brute forces into O(n) with O(1) extra space.

## Sliding window

A **sliding window** maintains a contiguous range `[left, right]` and expands/contracts it to satisfy a condition — ideal for "longest/shortest substring/subarray with property X". You grow `right` to include elements, and advance `left` to shrink when the window violates the constraint.

```swift
// longest substring without repeating characters
func longestUnique(_ s: [Character]) -> Int {
    var seen = Set<Character>(); var left = 0; var best = 0
    for right in 0..<s.count {
        while seen.contains(s[right]) {   // shrink until valid
            seen.remove(s[left]); left += 1
        }
        seen.insert(s[right])
        best = max(best, right - left + 1)
    }
    return best
}   // O(n) time (each element enters/leaves once)
```

Each element enters and leaves the window at most once, so the window is **O(n)** despite the nested `while` — a common point of confusion.

## In-place tricks

Many problems ask for **O(1) extra space**, mutating the array directly:

- **Reverse in place** with two pointers swapping ends inward.
- **Remove/overwrite** with a slow write-pointer while a fast pointer scans (in-place filtering).
- **Cyclic sort / index-as-hash** — for arrays of values in a known range, use the value as an index to detect duplicates/missing numbers without extra space.
- **Marking** — negate or offset values to record "seen" state in the array itself.

## String specifics in Swift

Swift strings are **not** `Int`-indexable and a `Character` is an extended grapheme cluster (variable width), so:

- You **can't** write `s[i]` — reaching a position via `String.Index` is **O(n)**.
- For heavy index-based algorithm work, convert to **`Array(s)`** (`[Character]`) once (O(n)), then index in **O(1)** — the idiomatic way to do string DS&A in Swift.
- For byte/ASCII work, `s.utf8` gives a fast view. `String` is a value type with COW like arrays.

## The interview lens

Start with **array internals**: O(1) index, amortized O(1) append, but **O(n) front/middle insert-remove** and **O(n) `contains`** — so avoid `contains`-in-a-loop (use a `Set`) and front operations. Then the two patterns that turn O(n²) into O(n): **two pointers** (opposite-ends on sorted arrays for pair problems; fast/slow for in-place edits) and the **sliding window** (longest/shortest contiguous range with a property — grow `right`, shrink `left`; each element enters/leaves once → O(n)).

Senior signals: **in-place O(1)-space** techniques (two-pointer reverse, slow write-pointer, index-as-hash/marking), and the **Swift string gotcha** — no `Int` subscript and O(n) index access, so convert to **`[Character]`** for O(1) indexing in algorithms. The habit: before nesting loops, ask "can two pointers or a window do this in one pass?"
