## The problem: the most common interview inputs

Arrays and strings show up as the input to more coding questions than anything else. The naive answer is almost always a nested loop — O(n²) — and the *good* answer almost always replaces it with one of a small number of patterns that get you to O(n) in a single pass. This lesson covers the two patterns that do most of the work — two pointers and the sliding window — plus the array and string internals you need to know to avoid hiding an O(n) cost inside a line that looks free.

## Array internals & complexity

```swift
var a = [1, 2, 3]
a[0]                 // O(1)
a.append(4)          // amortized O(1)
a.insert(0, at: 0)   // O(n)
a.contains(2)        // O(n)
```

A Swift `Array` is a **contiguous** buffer — its elements sit back-to-back in one block of memory — that grows dynamically as you add to it. That layout is why `a[0]` is O(1): the array computes an offset into the block and reads directly, no searching involved.

`append` is amortized O(1) for the reason covered in the Big-O lesson: the buffer doubles in size occasionally, and that occasional O(n) copy is spread thin across many cheap appends.

`insert(0, at: 0)` is O(n), because every existing element has to shift over by one to make room at the front. `contains` is O(n) too, for a more direct reason: without an index to check against, it has to scan element by element until it finds a match or runs out.

Two habits follow from this. When you have a choice, process from the *end* of an array (or call `reserveCapacity` up front) to avoid triggering O(n) front operations. And when you need repeated membership checks, reach for a `Set` or `Dictionary` instead of `contains` — trading the array's O(n) scan for O(1) average lookup.

## Two pointers

The **two-pointer** pattern replaces a nested loop with two indices that walk through the array together, doing the same job in a single pass.

The most common shape starts the pointers at opposite ends and walks them inward — usually on a **sorted** array:

```swift
func twoSumSorted(_ a: [Int], _ target: Int) -> (Int, Int)? {
    var l = 0, r = a.count - 1
    while l < r {
        let sum = a[l] + a[r]
        if sum == target { return (l, r) }
        else if sum < target { l += 1 }
        else { r -= 1 }
    }
    return nil
}
```

Walk through why each branch does what it does. If `sum` is too small, the only way to raise it is to bring in a bigger left value, so `l` advances. If `sum` is too big, `r` retreats to bring in a smaller right value. Because the array is sorted, each move is guaranteed to push the sum in the right direction — no backtracking needed.

This runs in O(n) time and O(1) space; a brute-force pair search would have been O(n²).

A second shape moves both pointers the *same* direction instead of toward each other: a **fast/slow** pair, where one pointer scans ahead and the other marks where to write next. That's the shape behind in-place removal, deduplication, and array reversal — you'll see it again in the in-place tricks section below.

## Sliding window

A **sliding window** keeps track of a contiguous range `[left, right]` inside the array or string, and grows or shrinks that range to satisfy some condition. It's the go-to pattern whenever a problem asks for the longest or shortest contiguous stretch with some property.

```swift
func longestUnique(_ s: [Character]) -> Int {
    var seen = Set<Character>()
    var left = 0
    var best = 0
    for right in 0..<s.count {
        while seen.contains(s[right]) {
            seen.remove(s[left])
            left += 1
        }
        seen.insert(s[right])
        best = max(best, right - left + 1)
    }
    return best
}
```

This finds the longest substring with no repeated characters. `right` grows the window by one element every iteration. The `while` loop is the *shrink* step: as long as the character `right` just landed on is already `seen` inside the window, `left` creeps forward — dropping characters off the left edge — until the duplicate is gone.

Predict: that `while` loop sits nested inside a `for` loop. Doesn't that make this O(n²)?

Answer: no, it's still O(n). `left` only ever moves forward, never back, so across the *entire* run of the function it advances at most `n` times total, no matter how many times the outer loop triggers the `while`. Each element enters the window exactly once (when `right` reaches it) and leaves it at most once (when `left` passes it) — that "enters once, leaves once" argument is exactly how you prove a sliding window is O(n) even when the code looks nested.

## In-place tricks

A lot of array problems specifically ask for **O(1) extra space** — mutate the input array itself instead of building a new one. A few recurring techniques:

- **Reverse in place** — the same two-pointers-at-opposite-ends shape from earlier, but swapping the elements at `l` and `r` instead of just comparing them.
- **Slow write-pointer, fast read-pointer** — one index scans the whole array while a second, slower index marks where the next "kept" element should be written. This is how in-place filtering and deduplication work without allocating a second array.
- **Cyclic sort / index-as-hash** — when an array holds values from a known range (say, `1...n`), you can use each value as the index it "should" live at, letting you detect duplicates or find a missing number without any extra storage.
- **Marking** — negate a value at an index, or shift it out of range, to record "I've seen this position" directly in the array instead of in a separate `Set`.

## String specifics in Swift

```swift
let s = "café"
s[0]   // compile error
```

Swift strings deliberately don't support `Int` subscripting. The reason is that a Swift `Character` is an **extended grapheme cluster** — what a human reading the screen would call "one character" can actually be built from multiple underlying Unicode values, like an accented letter or an emoji with a skin-tone modifier. That means characters aren't a fixed width, so there's no O(1) way to jump straight to "the 5th character."

Reaching a position via `String.Index` instead of an integer is still O(n) — walking the string is genuinely the only way to count grapheme clusters correctly.

```swift
let chars = Array(s)   // [Character] — O(n), done once
chars[0]                // O(1) from here on
```

For any algorithm that does repeated index-based work, the idiomatic Swift move is to convert the string to `[Character]` once — an O(n) cost you pay a single time — and then index into that array in O(1) for the rest of the algorithm.

If you're working with raw bytes or pure ASCII instead of general Unicode text, `s.utf8` gives you a fast view suited to that. And like `Array`, `String` is itself a value type with copy-on-write, so passing strings around is cheap.

## Interview lens

Start any array or string answer by naming the internals: O(1) index access, amortized O(1) append, but O(n) for front/middle insert-remove and for `contains` — which is why `contains` inside a loop and front-of-array operations are both red flags to catch in your own code before you finish writing it.

Then reach for the two patterns that turn O(n²) into O(n): two pointers — opposite ends closing inward for sorted-array pair problems, or fast/slow moving the same direction for in-place edits — and the sliding window for "longest/shortest contiguous range with property X," where the key argument is that each element enters and leaves the window at most once, so it's O(n) even though the code has a loop inside a loop.

The senior signals: knowing the O(1)-extra-space techniques by name (two-pointer reverse, slow write-pointer, index-as-hash/marking), and knowing the Swift string gotcha cold — no integer subscript, O(n) to reach a position via `String.Index`, so convert to `[Character]` once if the algorithm needs repeated indexing. The habit to say out loud: before reaching for a nested loop, ask whether two pointers or a window can do the same job in one pass.
