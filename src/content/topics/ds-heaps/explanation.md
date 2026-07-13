## The problem: always needing the biggest (or smallest) item, fast

Say you're processing tasks by priority, or you need the 10 highest-scoring items out of a million. Keeping a sorted array works, but every insert costs O(n) to keep it sorted. A plain unsorted array makes insert O(1), but finding the max means scanning everything — also O(n). Neither gives you a cheap answer to "what's the biggest thing right now?" *and* a cheap way to add new items.

```swift
var scores = [5, 2, 9, 1, 7]
scores.max()          // O(n) — has to check every element
scores.append(20)     // O(1) — but now max() is still O(n)
```

A **heap** is a data structure built to answer "give me the max (or min)" in O(1) and to insert or remove that max/min in O(log n) — a huge win over the O(n) alternatives above.

## The heap property

A heap is a binary tree with one rule: every parent is more extreme than its children. In a **max-heap**, every parent's value is greater than or equal to both its children's values. In a **min-heap**, every parent is less than or equal to both children.

```
        9
       / \
      7   5
     / \
    2   1
```

That's a valid max-heap: 9 ≥ 7 and 9 ≥ 5, 7 ≥ 2 and 7 ≥ 1. Notice what it *doesn't* guarantee — 7 and 5 aren't ordered relative to each other, and the tree isn't sorted left-to-right the way a binary search tree is. The heap property only constrains parent-vs-child, nothing else. That weaker guarantee is exactly what makes heaps cheap to maintain.

Because the root is always the most extreme value, reading it is O(1) — no searching needed.

## Storing the tree in an array

You could build this tree out of nodes with left/right pointers, like a real tree. Heaps almost never do that — they store the tree's values in a plain array and use arithmetic to find parents and children.

```swift
var heap = [9, 7, 5, 2, 1]
```

For the element at index `i`:

```swift
func parent(_ i: Int) -> Int { (i - 1) / 2 }
func left(_ i: Int) -> Int { 2 * i + 1 }
func right(_ i: Int) -> Int { 2 * i + 2 }
```

Check it against the tree above: index 0 is `9`, its children are at `left(0) = 1` (`7`) and `right(0) = 2` (`5`) — matches the picture. Index 1 (`7`) has children at `left(1) = 3` (`2`) and `right(1) = 4` (`1`) — also matches.

This only works because a heap is kept **complete**: every level is fully filled except possibly the last, which fills left to right with no gaps. A complete tree is exactly what lets those index formulas work — there's never a "hole" that would throw off the arithmetic. No pointers, no wasted memory for links, and the array's contiguous layout is cache-friendly.

## Inserting: add at the end, then bubble up

```swift
var heap = [9, 7, 5, 2, 1]
heap.append(8)   // [9, 7, 5, 2, 1, 8] — heap property broken: 8 > parent 5
```

`8` landed at index 5, whose parent is index 2 (`5`). Since `8 > 5`, the max-heap rule is violated. Fix it by swapping `8` up with its parent, then checking again from the new position — repeat until the parent is bigger or you hit the root.

```swift
mutating func siftUp(_ heap: inout [Int], _ i: Int) {
    var i = i
    while i > 0, heap[parent(i)] < heap[i] {
        heap.swapAt(i, parent(i))
        i = parent(i)
    }
}
```

Trace it: `8` at index 5 beats parent `5` at index 2 → swap → `[9, 7, 8, 2, 1, 5]`, `i` becomes 2. Parent of index 2 is index 0 (`9`). `9 < 8`? No, so the loop stops. One swap, and the heap is valid again.

Each swap moves the new element up one level, and a complete tree with `n` elements has height O(log n) — so **sift up** does at most O(log n) swaps.

## Extracting the max: swap with the last, remove, then bubble down

Removing the root is trickier, because you can't just delete index 0 — that would leave a hole every other index formula depends on. The trick: swap the root with the *last* element, remove that last slot (now holding the old max), then fix the new root by pushing it down.

```swift
mutating func extractMax(_ heap: inout [Int]) -> Int? {
    guard !heap.isEmpty else { return nil }
    heap.swapAt(0, heap.count - 1)
    let max = heap.removeLast()
    siftDown(&heap, 0)
    return max
}
```

`siftDown` looks at the current node's children, and if either child is bigger, swaps with the *larger* of the two (swapping with the smaller could still leave the other child bigger than the new parent):

```swift
mutating func siftDown(_ heap: inout [Int], _ i: Int) {
    var i = i
    while true {
        var largest = i
        if left(i) < heap.count, heap[left(i)] > heap[largest] { largest = left(i) }
        if right(i) < heap.count, heap[right(i)] > heap[largest] { largest = right(i) }
        if largest == i { break }
        heap.swapAt(i, largest)
        i = largest
    }
}
```

Predict: for `heap = [1, 7, 5, 2, 9]` (the old last element `1` just got moved to the root), what does `siftDown` do first?

Answer: it compares `heap[0] = 1` against its children `heap[1] = 7` and `heap[2] = 5`. `7` is larger, so `largest` becomes 1, and `1` swaps with `7` — giving `[7, 1, 5, 2, 9]`. Then `i` becomes 1, and the loop repeats from there, comparing `1` against *its* children (`2` and `9`) and swapping again. It keeps sinking until it's bigger than both children or has none.

Like `siftUp`, `siftDown` follows one root-to-leaf path, so it's also O(log n).

## Building a heap from scratch: heapify

You could build a heap by inserting elements one at a time — n inserts at O(log n) each is O(n log n). There's a faster way.

```swift
func heapify(_ a: [Int]) -> [Int] {
    var heap = a
    for i in stride(from: heap.count / 2 - 1, through: 0, by: -1) {
        siftDown(&heap, i)
    }
    return heap
}
```

This starts at the last *non-leaf* node — `heap.count / 2 - 1`, since everything after that index is a leaf with no children to violate the property against — and calls `siftDown` on every node working backward to the root. Leaves are skipped entirely because a single node with no children is trivially a valid heap on its own.

This runs in O(n) overall, not O(n log n). The intuition: most nodes in a complete tree are near the bottom, where `siftDown` has almost no distance to travel — only the few nodes near the root can sink O(log n) levels, and there are far fewer of those. The math works out to a linear total, even though any single call looks like O(log n).

## Implementing a heap in Swift

Time to package everything into one reusable type. The earlier `siftUp`/`siftDown` were hardcoded for a max-heap (using `<` and `>` directly). Generalize them by storing a comparison closure that decides which of two elements belongs "on top" — pass `>` for a max-heap, `<` for a min-heap.

Start with just the storage and that closure:

```swift
struct Heap<T> {
    private var items: [T] = []
    private let areInOrder: (T, T) -> Bool   // true if first should be "on top"

    init(_ areInOrder: @escaping (T, T) -> Bool) {
        self.areInOrder = areInOrder
    }

    var isEmpty: Bool { items.isEmpty }
    var peek: T? { items.first }   // the root — the most extreme element
}
```

Insert is the earlier "append, then bubble up", except the comparison now goes through `areInOrder` instead of a hardcoded `<`:

```swift
    mutating func insert(_ value: T) {
        items.append(value)
        siftUp(items.count - 1)
    }

    private mutating func siftUp(_ i: Int) {
        var i = i
        while i > 0, areInOrder(items[i], items[(i - 1) / 2]) {
            items.swapAt(i, (i - 1) / 2)
            i = (i - 1) / 2
        }
    }
```

Extract is the earlier "swap root with the last slot, remove it, bubble down":

```swift
    mutating func extract() -> T? {
        guard !items.isEmpty else { return nil }
        items.swapAt(0, items.count - 1)
        let top = items.removeLast()
        if !items.isEmpty { siftDown(0) }
        return top
    }
```

And `siftDown`, likewise routed through `areInOrder` — it swaps toward whichever child belongs on top:

```swift
    private mutating func siftDown(_ i: Int) {
        var i = i
        while true {
            var top = i
            let l = 2 * i + 1, r = 2 * i + 2
            if l < items.count, areInOrder(items[l], items[top]) { top = l }
            if r < items.count, areInOrder(items[r], items[top]) { top = r }
            if top == i { break }
            items.swapAt(i, top)
            i = top
        }
    }
```

Those four blocks are all members of the same `struct Heap<T>` — split apart here only to narrate each piece. `areInOrder(a, b)` returning `a > b` gives a max-heap; `a < b` gives a min-heap. Everything above — `siftUp`, `siftDown`, `heapify` via repeated `insert` — becomes one implementation that serves both.

```swift
var maxHeap = Heap<Int>(>)
maxHeap.insert(5); maxHeap.insert(9); maxHeap.insert(2)
maxHeap.peek       // 9

var minHeap = Heap<Int>(<)
minHeap.insert(5); minHeap.insert(9); minHeap.insert(2)
minHeap.peek       // 2
```

In real Swift code, you'd usually reach for `Foundation`'s or a library's heap, or model a **priority queue** — a queue where items come out in priority order instead of insertion order — directly on top of this `Heap` type. A priority queue *is* a heap; the terms are often used interchangeably in interviews.

## Top-K problems

A frequent interview shape: "find the K largest (or smallest) elements out of n." The heap-based approach beats sorting the whole array when K is much smaller than n.

For the K *largest* elements, counterintuitively, you use a min-heap of size K:

```swift
func topKLargest(_ nums: [Int], _ k: Int) -> [Int] {
    var minHeap = Heap<Int>(<)
    for n in nums {
        minHeap.insert(n)
        if minHeap.extract() != nil, minHeap.isEmpty == false {}
    }
    return []
}
```

That sketch is wrong on purpose — walk through why a min-heap, not a max-heap, is the right tool here. You want to keep the K biggest values seen so far, and cheaply discard the smallest one whenever a bigger candidate shows up. A min-heap capped at size K puts the *smallest of your current top-K* at the root, so checking "should this new number replace my worst kept value?" is an O(1) peek, and evicting it is O(log K).

```swift
func topKLargest(_ nums: [Int], _ k: Int) -> [Int] {
    var minHeap = Heap<Int>(<)
    for n in nums {
        minHeap.insert(n)
        if minHeap.items.count > k {
            _ = minHeap.extract()
        }
    }
    return minHeap.items
}
```

(This assumes `items` is exposed for illustration; a real API would add a `count` property.) Each of the n numbers does one O(log K) insert and at most one O(log K) extract, so the total is O(n log K) — better than sorting everything, which is O(n log n), whenever K is small relative to n.

The mirror-image rule: for the K *smallest* elements, use a max-heap of size K, for the same reason — the root holds the worst (largest) of your kept values, ready to be evicted.

## Heapsort

Heapify turns building a heap into O(n). Repeatedly extracting the max gives you the elements in descending order, one O(log n) extraction at a time.

```swift
func heapSort(_ a: [Int]) -> [Int] {
    var heap = a
    for i in stride(from: heap.count / 2 - 1, through: 0, by: -1) {
        siftDown(&heap, i)
    }
    var result: [Int] = []
    while !heap.isEmpty {
        heap.swapAt(0, heap.count - 1)
        result.append(heap.removeLast())
        if !heap.isEmpty { siftDown(&heap, 0) }
    }
    return result.reversed()
}
```

Heapify costs O(n). Then n extractions at O(log n) each cost O(n log n). Total: **O(n log n)**, matching merge sort and quicksort's average case, and it does the sort in place with O(1) extra space if you reuse the freed slots at the end of the array instead of appending to a separate `result` — a detail the sorting-algorithms lesson covers when comparing it against merge sort's O(n) extra space.

## Common pitfalls

Forgetting a heap is not fully sorted — only the root is guaranteed extreme, so `heap[1]` and `heap[2]` could be in either order relative to each other.

```swift
var heap = [9, 5, 7, 2, 1]
heap[1] > heap[2]   // 5 > 7 is false — sibling order isn't guaranteed
```

Using a max-heap when a min-heap was needed (or vice versa) for top-K problems — remember it's the *opposite* extreme you keep at the root, since you're evicting your current worst kept value.

Assuming `siftDown` only needs to compare with one child — always compare with *both* children and swap with the larger (max-heap) or smaller (min-heap) one, or the heap property can end up violated one level down.

## Interview lens

When a problem mentions "K largest/smallest," "top K," "kth largest," or "merge K sorted lists," say "heap" immediately — it's usually the intended data structure, and naming it fast is a strong signal.

Know the complexities cold: O(log n) insert/extract, O(1) peek, O(n) to build from an existing array via heapify (not O(n log n) — be ready to explain the "most nodes are near the bottom" argument if pushed), and O(n log n) for heapsort overall.

For top-K, state the counterintuitive part out loud: K largest uses a *min*-heap capped at size K, because you need fast access to your current *worst* kept value to know when to evict it. Getting that backwards is a common mistake interviewers watch for.

If asked to implement one live, the array-backed version with `parent`/`left`/`right` index math is what's expected — don't reach for actual tree nodes with pointers unless asked specifically to compare the two approaches.
