## The problem: scanning everything is often unnecessary

```swift
let sorted = [1, 3, 5, 7, 9, 11, 13]
sorted.firstIndex(of: 9)   // O(n) — checks 1, 3, 5, 7, 9... one at a time
```

`firstIndex(of:)` walks the array front to back, even though it's sorted. Sorted order is information you're throwing away — every time you check the middle element, you learn which *half* the target can't be in, and you can discard that half entirely. This lesson covers binary search and its variants, and the two-pointer techniques — already introduced in the arrays lesson — that show up constantly in search-space problems.

## Binary search & variants

```swift
func binarySearch(_ a: [Int], _ target: Int) -> Int? {
    var lo = 0, hi = a.count - 1
    while lo <= hi {
        let mid = lo + (hi - lo) / 2
        if a[mid] == target { return mid }
        else if a[mid] < target { lo = mid + 1 }
        else { hi = mid - 1 }
    }
    return nil
}
```

Each iteration checks the midpoint. If it matches, done. If the midpoint is too small, the target (if present) must be to the right, so `lo` jumps past it. If too big, `hi` retreats. Either way, the remaining search range roughly halves every iteration.

Notice `mid = lo + (hi - lo) / 2` instead of the more obvious `(lo + hi) / 2`. Both give the same result mathematically, but `lo + hi` can overflow in languages with fixed-width integers when both are large — the `lo + (hi - lo) / 2` form avoids ever adding two large numbers together. Swift's `Int` is 64-bit on modern platforms, so overflow is rare in practice, but the habit is worth having and interviewers sometimes ask for it by name.

Halving the range every step means the loop runs at most log₂(n) times, so binary search is **O(log n)** — a huge win over the O(n) linear scan, but only on sorted data. Running it on unsorted input gives wrong answers silently, not an error.

### Finding a boundary instead of an exact match

A common variant: instead of "does target exist," find "the first index where some condition becomes true" — e.g. the first element ≥ target, useful for insertion points or counting.

```swift
func firstIndexGreaterOrEqual(_ a: [Int], _ target: Int) -> Int {
    var lo = 0, hi = a.count
    while lo < hi {
        let mid = lo + (hi - lo) / 2
        if a[mid] < target { lo = mid + 1 }
        else { hi = mid }
    }
    return lo
}
```

The shape changed in two ways worth noticing. `hi` starts at `a.count`, not `a.count - 1` — because the answer might be "no element qualifies, insert at the end," and that's a valid position one past the last index. And the loop condition is `lo < hi`, not `lo <= hi`, with `hi = mid` (not `mid - 1`) on the "not yet" branch — because `mid` itself might be the answer, so it can't be excluded from the range.

Predict: for `a = [1, 3, 3, 5, 7]` and `target = 3`, what does `firstIndexGreaterOrEqual` return?

Answer: trace it. `lo=0, hi=5`. mid=2, `a[2]=3`, not `< 3`, so `hi=2`. `lo=0, hi=2`, mid=1, `a[1]=3`, not `< 3`, so `hi=1`. `lo=0, hi=1`, mid=0, `a[0]=1 < 3`, so `lo=1`. `lo == hi == 1`, loop ends. Returns `1` — the *first* occurrence of `3`, not just any occurrence. This is the trick behind "find first/last occurrence of a duplicate value" questions.

### Searching a rotated sorted array

Another classic variant: an array that was sorted, then rotated at some unknown pivot, like `[4, 5, 6, 7, 0, 1, 2]`. It's no longer globally sorted, but binary search still works — at every midpoint, *one* of the two halves is guaranteed to still be sorted, and you can check which one and decide whether the target could be in it.

```swift
func searchRotated(_ a: [Int], _ target: Int) -> Int? {
    var lo = 0, hi = a.count - 1
    while lo <= hi {
        let mid = lo + (hi - lo) / 2
        if a[mid] == target { return mid }
        if a[lo] <= a[mid] {             // left half is sorted
            if a[lo] <= target, target < a[mid] { hi = mid - 1 }
            else { lo = mid + 1 }
        } else {                          // right half is sorted
            if a[mid] < target, target <= a[hi] { lo = mid + 1 }
            else { hi = mid - 1 }
        }
    }
    return nil
}
```

The new step is `if a[lo] <= a[mid]` — checking which half is sorted, since exactly one always is when there's a single rotation point. Once you know which half is sorted, a normal range check (`a[lo] <= target < a[mid]`) tells you whether the target could live there; if not, it must be in the other half. Still O(log n), just with an extra branch per step.

## Two pointers, revisited for search problems

The arrays lesson introduced **two pointers** — opposite ends closing inward on sorted data — for problems like pair-sum. That same shape answers a different class of question here: not "find one target," but "find a pair/triple satisfying a condition" across a sorted range.

```swift
func threeSum(_ nums: [Int]) -> [[Int]] {
    let a = nums.sorted()
    var result: [[Int]] = []
    for i in 0..<a.count {
        if i > 0, a[i] == a[i - 1] { continue }   // skip duplicate anchors
        var l = i + 1, r = a.count - 1
        while l < r {
            let sum = a[i] + a[l] + a[r]
            if sum == 0 {
                result.append([a[i], a[l], a[r]])
                l += 1; r -= 1
                while l < r, a[l] == a[l - 1] { l += 1 }   // skip duplicate pairs
            } else if sum < 0 { l += 1 }
            else { r -= 1 }
        }
    }
    return result
}
```

This is the pair-sum two-pointer scan from before, wrapped in an outer loop that fixes one element (`a[i]`) and runs the inward-closing scan on the rest. Sorting first (O(n log n)) is what makes the inner two-pointer scan possible at all. The two `if ... a[i] == a[i-1]` and `while ... a[l] == a[l-1]` checks aren't new logic — they just skip over duplicate values so the same triple doesn't get added twice, which is the kind of edge case interviewers expect you to catch unprompted.

Total complexity: O(n log n) for the sort, plus O(n²) for the outer loop times the inner O(n) scan — so O(n²) overall, dominated by the nested pointers, not the sort.

## Fast/slow pointers

The arrays lesson's fast/slow pair moved in the same direction to overwrite an array in place. The same shape, applied differently, is the standard way to detect a **cycle** in a linked structure — does following `.next` repeatedly ever loop back on itself instead of reaching the end?

```swift
func hasCycle(_ head: Node?) -> Bool {
    var slow = head
    var fast = head
    while fast != nil, fast?.next != nil {
        slow = slow?.next
        fast = fast?.next?.next
    }
    return fast != nil
}
```

`slow` advances one node per step; `fast` advances two. If there's no cycle, `fast` reaches the end (`nil`) first, and the loop exits normally. If there *is* a cycle, `fast` is racing around a loop faster than `slow` — think of two runners on a circular track at different speeds — and it's a matter of time before `fast` laps `slow` and they land on the same node. This trick has a name: **Floyd's cycle detection**, sometimes called the "tortoise and hare."

Predict: why does `fast` (moving 2 steps) always eventually catch `slow` (moving 1 step) inside a cycle, rather than skipping past it forever?

Answer: every step, the gap between them (measured going around the cycle) shrinks by exactly one node, since `fast` gains one step of ground per iteration. A shrinking gap that starts as some finite number of nodes must eventually hit zero — they land on the same node — it can't skip over a gap of size 1 because it only closes the gap by exactly 1 each time.

The same fast/slow shape finds the **middle of a linked list** in one pass — when `fast` reaches the end, `slow` is sitting at the midpoint, since it has covered exactly half the distance.

## Search-space reduction

Binary search's real idea generalizes past sorted arrays: whenever a problem has a monotonic condition — some property that's `false` for a while and then flips to `true` (or vice versa) and never flips back — you can binary search over the space of *possible answers*, not just over array indices.

```swift
func minEatingSpeed(_ piles: [Int], _ hoursLimit: Int) -> Int {
    func hoursNeeded(_ speed: Int) -> Int {
        piles.reduce(0) { $0 + (($1 + speed - 1) / speed) }
    }
    var lo = 1, hi = piles.max() ?? 1
    while lo < hi {
        let mid = lo + (hi - lo) / 2
        if hoursNeeded(mid) <= hoursLimit { hi = mid }
        else { lo = mid + 1 }
    }
    return lo
}
```

There's no array being searched here — `lo` and `hi` bound a *range of possible eating speeds*, and `hoursNeeded(speed)` is monotonic: as speed increases, hours needed only ever decreases or stays flat, never increases. That monotonic relationship is exactly what makes binary search valid — checking the midpoint speed tells you whether every faster speed would also work, letting you discard half the remaining speeds every step, same as searching an array.

This pattern — "binary search the answer" — is the search-space reduction interviewers are checking for: recognizing that a problem isn't literally about an array, but has the same halve-and-discard structure underneath.

## Common pitfalls

Running binary search on unsorted data — it won't crash, it'll just silently return a wrong answer, which is worse than an obvious failure.

```swift
var lo = 0, hi = a.count - 1   // off-by-one risk: should hi be count or count-1?
```

Mixing up the boundary-search variant's `hi = a.count` / `lo < hi` shape with the exact-match variant's `hi = a.count - 1` / `lo <= hi` shape — they look similar but aren't interchangeable; picking the wrong one causes off-by-one bugs at the edges.

Forgetting to guard against `nil` on both `fast` and `fast?.next` in the cycle-detection loop — checking only `fast != nil` before advancing `fast = fast?.next?.next` risks force-stepping past the end.

## Interview lens

State binary search's precondition out loud before writing code: the data (or the answer space) must be sorted or monotonic, or the technique is invalid — interviewers listen for whether you check this rather than assume it.

For "find first/last occurrence" or "insertion point" questions, use the boundary-search shape (`lo < hi`, `hi = mid`) rather than bolting extra logic onto the exact-match shape — it's cleaner and less bug-prone, and naming it shows you've seen the pattern before.

When a problem says "minimize/maximize X such that condition Y holds," listen for the words "at least" or "at most" — that's usually a signal condition Y is monotonic in X, meaning you can binary search the answer space directly instead of trying every value.

For linked-list problems, reach for fast/slow pointers by default whenever the phrase "cycle," "middle," or "kth from the end" appears — it's O(n) time and O(1) space, beating any approach that needs a second data structure to track visited nodes or count length first.
