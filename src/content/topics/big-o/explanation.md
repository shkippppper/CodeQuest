## The problem: comparing algorithms without a stopwatch

"Which is faster?" can't be answered by timing one run — it depends on the machine, the input, the compiler. **Big-O notation** describes how an algorithm's cost **grows as the input grows**, independent of hardware. It's the shared language of every coding interview: you're expected to state the **time and space complexity** of anything you write and to know when one approach dominates another.

## Time vs space complexity

- **Time complexity** — how the number of operations grows with input size *n*.
- **Space complexity** — how the **extra** memory grows with *n* (usually excluding the input itself; count auxiliary structures and the recursion call stack).

Big-O captures the **dominant term** as *n* grows and **drops constants and lower-order terms**: `3n + 5` is `O(n)`; `2n² + 100n` is `O(n²)`. It describes **asymptotic growth**, not exact runtime — an `O(n)` algorithm can beat an `O(1)` one for small *n*, but for large *n* the growth rate wins.

## Common classes

From fastest-growing-slowest to worst, with typical sources:

- **O(1)** constant — array index, dictionary lookup, arithmetic.
- **O(log n)** logarithmic — binary search, balanced-tree operations (halving the problem each step).
- **O(n)** linear — a single pass over the input.
- **O(n log n)** linearithmic — efficient comparison sorts (merge/heap/quicksort average).
- **O(n²)** quadratic — nested loops over the input (naive pair comparisons).
- **O(2ⁿ)** exponential / **O(n!)** factorial — brute-force subsets/permutations, naive recursion without memoization.

A key intuition: a **nested loop** over the same input is usually O(n²); **halving** the search space each step is O(log n); doing linear work at each of log n levels is O(n log n).

## Amortized analysis

Some operations are usually cheap but occasionally expensive; **amortized** complexity averages the cost over a sequence. The classic example is **`Array.append`**: most appends are O(1), but when the backing buffer is full the array **doubles** its capacity and copies everything (O(n)). Because doublings are rare, the **amortized** cost per append is **O(1)** — the occasional O(n) copy is spread across the many cheap appends. Use `reserveCapacity` to avoid the copies when the size is known.

## Best / average / worst case

The same algorithm can have different complexities depending on the input:

- **Worst case** — the upper bound (what interviewers usually mean by "the" complexity). Quicksort is O(n²) worst case (bad pivots).
- **Average case** — expected over typical inputs. Quicksort is O(n log n) average.
- **Best case** — the lower bound. Insertion sort is O(n) best case (already sorted).

Note **Big-O is an upper bound** (grows *no faster than*), while Θ (theta) means *tight* bound and Ω (omega) a lower bound — but in interviews "O(n)" is used loosely to mean the tight worst-case bound.

## Analyzing Swift code

Watch for hidden costs behind clean-looking Swift:

- **`array.contains(x)`** is **O(n)** — inside a loop over the array it's **O(n²)**; switch to a `Set` for O(1) membership.
- **`Set`/`Dictionary`** lookup/insert are **O(1) average** (hashing), O(n) worst case with adversarial collisions.
- **`array.insert(at: 0)` / `removeFirst()`** are **O(n)** (elements shift); appending/removing at the end is amortized O(1).
- **`String`** isn't `Int`-indexable and character access is O(n) to reach a position.
- Chained `map`/`filter` each add an O(n) pass (usually fine, but count them).
- **Recursion** adds O(depth) space for the call stack — count it toward space complexity.

## The interview lens

Define Big-O as **how cost grows with input size**, dropping constants/lower-order terms to keep the **dominant** term — and be fluent in the ladder **O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)** with a source for each (index, binary search, single pass, good sort, nested loop, brute-force subsets). State both **time and space** (count auxiliary structures **and** recursion stack), and default to **worst case** unless asked otherwise.

Senior signals: **amortized** analysis (`Array.append` is amortized O(1) via capacity doubling), best/avg/**worst** distinctions (quicksort O(n log n) avg / O(n²) worst), and spotting **hidden costs in Swift** — `contains` in a loop is O(n²) (use a `Set`), front insertion/removal is O(n), Set/Dict lookups are O(1) average. The crisp habit: for any solution, say its time and space complexity out loud and justify the dominant term.
