## The problem: sorting shows up everywhere, and "just call sort()" isn't always the answer

```swift
var nums = [5, 2, 9, 1, 7]
nums.sort()   // [1, 2, 5, 7, 9]
```

In real Swift code, you almost always just call `sort()`. But interviews ask you to build sorting algorithms from scratch, compare their tradeoffs, and reason about which one fits a given constraint — fixed memory budget, huge input, needing to preserve the original order of equal elements. This lesson covers the sorts that come up most: merge sort, quicksort, and heap sort, what "comparison sort" even means, and what Swift's built-in `sort` actually does under the hood.

## Comparison sorts overview

A **comparison sort** decides the final order purely by comparing pairs of elements with `<` — no assumptions about the data's range or structure. Every sort in this lesson is a comparison sort.

```swift
[5, 2, 9].sorted(by: <)   // comparison sort: only uses <
```

That constraint has a hard floor: no comparison sort can beat O(n log n) in the worst case, no matter how clever. The argument is combinatorial — there are n! possible orderings of n elements, and each comparison can only cut the remaining possibilities roughly in half, so you need at least log₂(n!) ≈ n log n comparisons to pin down which ordering you have. Merge sort, quicksort, and heap sort all sit at or near this O(n log n) floor; the earlier O(n²) sorts (bubble, insertion, selection) don't beat it, they just have worse constants and simpler code.

There's a different family — counting sort, radix sort, bucket sort — that sidesteps the O(n log n) floor entirely by not comparing elements at all, instead exploiting known structure like "values are integers in a small range." Those are worth knowing exist, but they're outside this lesson's scope.

## Merge sort: split, sort, combine

Merge sort's idea: an array of size 1 is already sorted. Split anything bigger in half, sort each half recursively, then merge the two sorted halves back together.

```swift
func mergeSort(_ a: [Int]) -> [Int] {
    guard a.count > 1 else { return a }
    let mid = a.count / 2
    let left = mergeSort(Array(a[..<mid]))
    let right = mergeSort(Array(a[mid...]))
    return merge(left, right)
}
```

The recursion bottoms out at single-element (or empty) arrays, which are trivially sorted — that's the base case. Everything else recurses on two halves and hands off to `merge`.

```swift
func merge(_ left: [Int], _ right: [Int]) -> [Int] {
    var result: [Int] = []
    var i = 0, j = 0
    while i < left.count, j < right.count {
        if left[i] <= right[j] {
            result.append(left[i]); i += 1
        } else {
            result.append(right[j]); j += 1
        }
    }
    result.append(contentsOf: left[i...])
    result.append(contentsOf: right[j...])
    return result
}
```

`merge` walks two already-sorted arrays with two pointers, always taking the smaller of the two current fronts. Once one side runs out, the rest of the other side gets appended — it's already sorted, so no more comparisons are needed.

Predict: `merge([1, 4], [2, 3])` — what gets appended, in order?

Answer: compare 1 vs 2 → take 1. Compare 4 vs 2 → take 2. Compare 4 vs 3 → take 3. Left is exhausted, so append the rest of right: nothing left. Result: `[1, 2, 3, 4]`.

**Merge sort** runs in O(n log n) in every case — best, average, and worst — because the split-in-half-then-merge structure doesn't depend on the input's order at all. The cost is space: `merge` builds new arrays, so merge sort needs O(n) extra memory, not O(1).

## Quicksort: pick a pivot, partition around it

Quicksort takes the opposite approach: instead of splitting blindly in half, it picks one element as a **pivot**, rearranges the array so everything smaller than the pivot ends up on its left and everything bigger ends up on its right, then recurses on each side.

```swift
func quickSort(_ a: inout [Int], _ lo: Int, _ hi: Int) {
    guard lo < hi else { return }
    let p = partition(&a, lo, hi)
    quickSort(&a, lo, p - 1)
    quickSort(&a, p + 1, hi)
}
```

`partition` does the real work: pick a pivot (here, the last element), then walk the range and swap smaller elements into place ahead of a boundary index.

```swift
func partition(_ a: inout [Int], _ lo: Int, _ hi: Int) -> Int {
    let pivot = a[hi]
    var i = lo
    for j in lo..<hi {
        if a[j] < pivot {
            a.swapAt(i, j)
            i += 1
        }
    }
    a.swapAt(i, hi)
    return i
}
```

`i` tracks the boundary of "everything confirmed smaller than pivot so far." Every time `a[j]` beats the pivot, it swaps into slot `i` and `i` advances. After the loop, everything before `i` is smaller than the pivot and everything from `i` to `hi - 1` is not — so swapping the pivot itself into slot `i` puts it exactly where it belongs, with smaller values to its left and bigger ones to its right. That final index is where the pivot has "settled," which is why `quickSort` recurses on `lo..<p` and `p+1..<hi`, never touching `p` again.

Quicksort's average case is O(n log n), with a small constant that in practice often beats merge sort. But its worst case is O(n²) — if the pivot is consistently the smallest or largest remaining element (already-sorted input with a naive "always pick the last element" pivot is a classic trigger), each partition only shaves off one element instead of splitting roughly in half. Randomizing the pivot choice (or using median-of-three) makes that worst case astronomically unlikely in practice, though it's still technically possible.

Quicksort's other selling point: it sorts in place, needing only O(log n) extra space for the recursion stack, versus merge sort's O(n) for the merge buffers.

## Heap sort: reuse the heap you already know

The heaps lesson covers this in full — heapify the array in O(n), then repeatedly extract the max and place it at the end:

```swift
func heapSort(_ a: [Int]) -> [Int] {
    var heap = a
    for i in stride(from: heap.count / 2 - 1, through: 0, by: -1) {
        siftDown(&heap, i)
    }
    var end = heap.count - 1
    while end > 0 {
        heap.swapAt(0, end)
        siftDown(&heap, 0, upTo: end)
        end -= 1
    }
    return heap
}
```

This version calls a small variant of the heaps lesson's `siftDown` that takes an `upTo` bound instead of always looking at the whole array, so it only sifts down within the shrinking `0..<end` range — the largest values accumulate at the back of the same array, no second array needed. Heap sort's complexity is O(n log n) in every case, just like merge sort, but it needs only O(1) extra space (excluding the input itself), beating merge sort's O(n) and matching quicksort's in-place property without quicksort's O(n²) worst case risk.

## Stability

A sort is **stable** if two elements that compare as equal keep their original relative order after sorting. This matters whenever you're sorting objects by one field but care about a secondary, already-established order.

```swift
struct Player { let name: String; let score: Int }
let players = [
    Player(name: "Ana", score: 5),
    Player(name: "Bo", score: 3),
    Player(name: "Cy", score: 5),
]
players.sorted { $0.score > $1.score }
```

If this sort is stable, `Ana` stays before `Cy` in the result, because they tied on `score` and `Ana` came first in the input. If it's unstable, that relative order isn't guaranteed — `Cy` might end up before `Ana` even though nothing in the comparator said it should.

Merge sort is naturally stable: in the `merge` step above, the `<=` (not `<`) means that when `left[i]` and `right[j]` are equal, the left one — which came from the earlier half of the original array — is taken first. Quicksort as shown is *not* stable: swapping elements during partitioning can reorder equal elements relative to each other, and fixing that costs extra space or time. Heap sort is not stable either, for the same reason — sifting swaps elements without tracking original position.

## Swift's sort internals

```swift
var nums = [5, 2, 9, 1, 7]
nums.sort()                          // in-place, mutating
let sorted = nums.sorted()           // returns a new array
nums.sort { $0 > $1 }                // custom comparator, descending
```

Swift's standard library sort is **introsort**: it starts with quicksort for speed, but watches the recursion depth, and if it goes too deep — a signal the input might be triggering quicksort's O(n²) worst case — it switches to heap sort for the rest of that section, guaranteeing O(n log n) overall no matter what. For small subarrays (below a size threshold), it switches again to insertion sort, which has a lower constant factor and is faster in practice for tiny ranges despite being O(n²) in general.

That hybrid approach is why `sort()` is safe to call without worrying about adversarial input — you get quicksort's typical speed with a hard guarantee against its worst case, and Swift's own `sort` is not guaranteed to be stable. If stability matters, sort by a tiebreaker field explicitly, e.g. `sorted { ($0.score, $0.originalIndex) > ($1.score, $1.originalIndex) }`, or use `sorted(by:)` after confirming the exact guarantee for your Swift version, since standard library behavior has tightened over time.

## Choosing a sort

| Sort | Time (avg / worst) | Extra space | Stable |
|---|---|---|---|
| Merge sort | O(n log n) / O(n log n) | O(n) | Yes |
| Quicksort | O(n log n) / O(n²) | O(log n) | No |
| Heap sort | O(n log n) / O(n log n) | O(1) | No |

Reach for merge sort when stability matters or when sorting linked lists (no random access needed, and its performance doesn't depend on layout). Reach for quicksort when average-case speed and low memory matter more than worst-case guarantees, and the input isn't adversarial. Reach for heap sort when you need a hard O(n log n) worst-case guarantee *and* O(1) extra space — which is exactly why Swift's introsort falls back to it instead of degrading to O(n²) quicksort.

## Common pitfalls

Assuming any O(n log n) sort is stable — only merge sort is, by default; quicksort and heap sort are not unless specifically modified to track original position.

```swift
// naive last-element pivot on an already-sorted array
quickSort(&sortedArray, 0, sortedArray.count - 1)   // O(n²) — worst case triggered
```

Picking a fixed pivot strategy (always first or always last element) without considering that already-sorted or reverse-sorted input is a common real-world case that triggers quicksort's worst case — randomizing the pivot avoids this in practice.

Forgetting that merge sort's O(n) extra space can matter for huge inputs — it's not "free" just because the time complexity matches heap sort's.

## Interview lens

If asked to implement a sort from scratch, quicksort or merge sort are the expected defaults — know the partition scheme and the merge step cold, including how to trace through a small example by hand.

Be ready to state the O(n log n) comparison-sort lower bound and explain why, briefly — it shows you understand *why* these algorithms top out where they do, not just that they do.

When asked "which sort would you use here," lead with the actual constraint: stability needed → merge sort; tight memory and can tolerate rare worst-case risk → quicksort; need a hard worst-case guarantee with O(1) space → heap sort. Naming Swift's own introsort strategy — quicksort with a heap-sort fallback on deep recursion, insertion sort for small ranges — is a strong signal you understand these aren't just textbook exercises but production tradeoffs.
