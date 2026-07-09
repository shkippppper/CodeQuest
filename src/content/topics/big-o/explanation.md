## The problem: comparing algorithms without a stopwatch

Two people write different solutions to the same problem. How do you know whose is better?

```swift
func containsDuplicate(_ nums: [Int]) -> Bool {
    for i in 0..<nums.count {
        for j in (i+1)..<nums.count {
            if nums[i] == nums[j] { return true }
        }
    }
    return false
}
```

Timing this on your laptop tells you almost nothing — a faster machine, a smaller input, a different compiler all change the number, but none of them change whether this function scales. **Big-O notation** describes how a function's cost grows as the input grows, independent of hardware. It's the shared vocabulary of every coding interview: you're expected to state the time and space cost of anything you write, and to know when one approach beats another as the input gets big.

## Time vs space complexity

Two different costs to track for the same function.

**Time complexity** is how the number of operations grows as the input size — usually called *n* — grows. In `containsDuplicate` above, the inner loop runs roughly *n* times for each of the outer loop's *n* iterations, for about *n²* comparisons total.

**Space complexity** is how much *extra* memory the function needs, again as *n* grows. "Extra" means auxiliary structures you allocate — arrays, sets, dictionaries — plus the call stack if the function recurses; it doesn't usually count the input itself. `containsDuplicate` allocates nothing new, so its space complexity is constant no matter how big `nums` gets.

## Common classes

Big-O writes both of these costs as a function of *n*, but throws away the details that don't matter at scale. Take `3n + 5` operations — as *n* gets huge, the `+5` becomes irrelevant, and even the `3` matters less than the fact that cost scales linearly at all. Big-O calls both `3n + 5` and plain `n` simply O(n): it keeps only the dominant term and drops constants and lower-order terms.

This is why Big-O describes **asymptotic growth**, not an exact runtime — a technically-O(n) algorithm can beat an O(1) one for small *n* if the constant factor is bad enough. The comparison only becomes meaningful once *n* is large.

From cheapest to most expensive, with typical sources:

- **O(1)** constant — array index, dictionary lookup, arithmetic. Cost doesn't change with *n*.
- **O(log n)** logarithmic — binary search, balanced-tree operations. Each step throws away half the remaining problem.
- **O(n)** linear — a single pass over the input, like `containsDuplicate`'s outer loop alone.
- **O(n log n)** linearithmic — efficient comparison sorts: merge sort, heap sort, quicksort on average.
- **O(n²)** quadratic — nested loops over the same input, like `containsDuplicate` above.
- **O(2ⁿ)** exponential and **O(n!)** factorial — brute-force enumeration of every subset or every ordering; naive recursion with no memoization.

Predict: `containsDuplicate` has a loop nested inside a loop. What's its time complexity?

Answer: O(n²). For each of the *n* elements the outer loop visits, the inner loop scans roughly the rest of the array — a nested loop over the same input is the signature of quadratic cost.

A pattern worth internalizing: a nested loop over the same collection is usually O(n²); cutting the problem in half each step is O(log n); doing a linear amount of work at each of *log n* levels — like merge sort's split-then-merge — is O(n log n).

## Amortized analysis

Some operations are cheap almost every time, but occasionally expensive. Watch `Array.append`:

```swift
var xs: [Int] = []
for i in 0..<8 { xs.append(i) }
```

Most of these calls are O(1) — Swift just writes the new element into space it already reserved. But every so often the backing buffer is full, and Swift has to allocate a new, bigger buffer and copy every existing element into it — an O(n) operation.

Spread that occasional O(n) copy across all the cheap appends that came before it, and the *average* cost per append works out to O(1). This is called **amortized** complexity: not "every single call is O(1)," but "the cost per call, averaged over a long sequence of calls, is O(1)." That's why `Array.append` is described as amortized O(1) rather than plain O(1). If you know the final size ahead of time, calling `reserveCapacity` upfront avoids the repeated copies entirely.

## Best, average, and worst case

The same algorithm can cost differently depending on what data it's handed, not just how big the data is.

Quicksort's **worst case** — its upper bound, and what interviewers usually mean when they say just "the complexity" — is O(n²), triggered by consistently bad pivot choices, like always picking an already-sorted array's first element. Its **average case**, over typical random inputs, is O(n log n).

Insertion sort shows the opposite end: its **best case** — the lower bound, the friendliest possible input — is O(n), reached when the array is already sorted and every element needs only one comparison.

Default to stating the worst case unless the interviewer asks otherwise; it's the guarantee that holds no matter what data shows up.

One notation nuance worth knowing: Big-O technically means an *upper* bound (grows no faster than); Θ ("theta") means a *tight* bound; Ω ("omega") means a *lower* bound. In interviews, people say "O(n)" loosely to mean the tight worst-case bound — that's fine, just know the distinction exists if you're pressed on it.

## Analyzing Swift code

Some of Swift's cleanest-looking one-liners hide a cost that only shows up under a profiler or a careful read.

```swift
if array.contains(target) { ... }
```

`contains` on an `Array` is O(n) — it looks at elements one by one until it finds a match or runs out. Call that inside a loop over the same array, and you've built an O(n²) algorithm without a single visible nested loop.

```swift
if set.contains(target) { ... }
```

Swap the `Array` for a `Set`, and the same check becomes O(1) average, because a `Set` finds values by hash instead of scanning.

A few more costs worth knowing cold:

- **`Set`/`Dictionary`** lookup and insert are O(1) *average* (hashing), but O(n) worst case under adversarial hash collisions.
- **`array.insert(at: 0)`** and **`removeFirst()`** are O(n) — every remaining element has to shift over. Appending or removing at the *end* is amortized O(1).
- **`String`** isn't indexable by `Int`; walking to a character position is O(n).
- Chaining `map`/`filter` adds a separate O(n) pass for each call — usually fine, but the passes add up and are worth counting.
- **Recursion** adds O(depth) to space complexity for the call stack, even if the function allocates nothing else.

## Interview lens

Define Big-O as *how cost grows with input size* — you keep only the dominant term and drop constants and lower-order terms. Be fluent reciting the ladder from cheapest to worst: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ), with one source memorized for each — index, binary search, single pass, a good sort, a nested loop, brute-force subsets.

Always state *both* time and space, and remember space includes auxiliary structures *and* the recursion call stack, not just the input. Default to worst case unless asked otherwise.

The signals that separate a junior answer from a senior one: knowing that "amortized O(1)" and "O(1)" aren't the same claim (`Array.append` is amortized O(1) because of occasional buffer doublings), giving best/average/worst separately for something like quicksort (O(n log n) average, O(n²) worst), and spotting hidden costs in idiomatic-looking Swift — `contains` inside a loop silently becomes O(n²) unless you reach for a `Set`, and front-of-array operations are O(n) even though they read like one clean line. The habit that signals seniority: state the time and space complexity of your solution out loud, unprompted, and explain which term dominates.
