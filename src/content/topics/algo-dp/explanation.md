## The problem: naive recursion that recomputes the same thing millions of times

```swift
func climbStairs(_ n: Int) -> Int {
    if n <= 2 { return n }
    return climbStairs(n - 1) + climbStairs(n - 2)
}
climbStairs(5)   // 8
```

This answers "how many distinct ways can you climb `n` stairs, taking 1 or 2 steps at a time?" It's correct — but call `climbStairs(40)` and it takes noticeably long. This lesson is about why, and about the two techniques — memoization and tabulation — that turn recursion like this from exponential time into linear time, plus the handful of patterns that let you recognize when a problem needs this treatment at all.

## Recursion & base cases

Every recursive function needs a **base case** — an input small enough to answer directly, without recursing further, so the recursion has somewhere to stop.

```swift
func climbStairs(_ n: Int) -> Int {
    if n <= 2 { return n }   // base case: 1 stair = 1 way, 2 stairs = 2 ways
    return climbStairs(n - 1) + climbStairs(n - 2)
}
```

`n <= 2` is the base case here: with 1 stair there's exactly 1 way to climb it (a single step), and with 2 stairs there are exactly 2 ways (two single steps, or one double step) — both answered directly, no further recursion needed. For any bigger `n`, the last move onto the top stair was either a 1-step (from stair `n-1`) or a 2-step (from stair `n-2`), so the total ways is the sum of the ways to reach each of those — the **recurrence relation**, the equation relating a problem's answer to the answers of smaller versions of itself.

To see why this is slow, draw the call tree for `climbStairs(5)`:

```
climbStairs(5)
├── climbStairs(4)
│   ├── climbStairs(3)
│   │   ├── climbStairs(2)
│   │   └── climbStairs(1)
│   └── climbStairs(2)
└── climbStairs(3)
    ├── climbStairs(2)
    └── climbStairs(1)
```

Look at `climbStairs(3)` — it appears twice, as a child of both `climbStairs(5)` and `climbStairs(4)`, and each copy re-triggers its own full subtree. `climbStairs(2)` appears three times. As `n` grows, the number of repeated calls explodes: this tree has roughly `2^n` nodes total, so naive recursion here is O(2ⁿ) — exponential time, for a problem whose answer is just a sum of two smaller answers.

The fix doesn't change the recurrence at all. It changes whether repeated work gets redone or reused.

## Memoization: remember what you've already computed

**Memoization** caches the result of each call the first time it's computed, keyed by its input, so any later call with the same input returns instantly instead of recursing again.

```swift
func climbStairs(_ n: Int, _ memo: inout [Int: Int]) -> Int {
    if n <= 2 { return n }
    if let cached = memo[n] { return cached }
    let result = climbStairs(n - 1, &memo) + climbStairs(n - 2, &memo)
    memo[n] = result
    return result
}
```

Two new lines do all the work. `if let cached = memo[n] { return cached }` checks the cache before doing any recursion — if this exact `n` was already solved, skip straight to the answer. `memo[n] = result` stores the answer right before returning it, so the next time this `n` comes up, that check succeeds.

Retrace `climbStairs(5)` with this version: `climbStairs(3)` still gets *called* twice, but the second call hits the cache instead of re-expanding its whole subtree. Every distinct value of `n` from `1` to the original input now gets computed exactly once.

That collapses the complexity from O(2ⁿ) down to O(n) time — one unit of work per distinct `n` — at the cost of O(n) extra space for the memo dictionary (plus the recursion's own O(n) call stack, which memoization doesn't remove).

Predict: if you called `climbStairs(5, &memo)` and then, reusing the same `memo`, called `climbStairs(3, &memo)`, how much new work happens on the second call?

Answer: none. `memo[3]` was already filled in while computing `climbStairs(5)`, so the second call hits the cache on its very first check and returns immediately.

## Tabulation: build the answer bottom-up instead of top-down

Memoization still recurses — it's top-down, starting at `n` and working toward the base case, caching along the way. **Tabulation** flips the direction: start at the base case and iteratively build up to `n`, filling a table (usually an array) in order, with no recursion or call stack at all.

```swift
func climbStairs(_ n: Int) -> Int {
    if n <= 2 { return n }
    var table = [Int](repeating: 0, count: n + 1)
    table[1] = 1
    table[2] = 2
    for i in 3...n {
        table[i] = table[i - 1] + table[i - 2]
    }
    return table[n]
}
```

`table[1]` and `table[2]` are seeded with the same base-case values used before. The loop then walks forward from `3` to `n`, and `table[i] = table[i-1] + table[i-2]` is the exact same recurrence relation as the recursive version — just read left-to-right instead of expressed as a function call. Because `table[i-1]` and `table[i-2]` are always filled in before `table[i]` is computed, every lookup is already available; nothing is ever recomputed.

This is also O(n) time, matching memoization, but the space story is different: no call stack, since there's no recursion, just the O(n) table.

### Shrinking the table

Look closely at the loop: `table[i]` only ever depends on `table[i-1]` and `table[i-2]` — never anything further back. That means the full table isn't actually necessary; two variables suffice.

```swift
func climbStairs(_ n: Int) -> Int {
    if n <= 2 { return n }
    var prev2 = 1, prev1 = 2
    for _ in 3...n {
        let current = prev1 + prev2
        prev2 = prev1
        prev1 = current
    }
    return prev1
}
```

This drops space to O(1) — a genuine improvement over both memoization and the full table, and a common follow-up question once you've shown the tabulated version: "can you reduce the space?" Not every DP problem allows this — it only works when each state depends on a small, fixed number of previous states, not on the whole history.

## Comparing the three approaches

| Approach | Time | Space | Style |
|---|---|---|---|
| Naive recursion | O(2ⁿ) | O(n) stack | Top-down, no caching |
| Memoization | O(n) | O(n) + O(n) stack | Top-down, cached |
| Tabulation | O(n) | O(n), or O(1) if reducible | Bottom-up, iterative |

Memoization is usually the easier first pass in an interview — it's the naive recursive solution with two lines added, so it's fast to write and hard to get wrong. Tabulation is generally preferred for the final answer once time allows, since it avoids recursion-depth limits on very large inputs and often allows the space optimization above.

## Common DP patterns

Most DP interview problems are a variation on a small number of shapes. Recognizing which shape applies is usually harder than writing the code once you know it.

1D sequence DP — `climbStairs` above is the template: `table[i]` depends on a fixed number of earlier entries in a single array. House robber (max sum of non-adjacent elements) and the maximum subarray problem fit here too.

```swift
// House robber: table[i] = max(skip house i, rob house i)
func rob(_ nums: [Int]) -> Int {
    var prev2 = 0, prev1 = 0
    for n in nums {
        let current = max(prev1, prev2 + n)
        prev2 = prev1
        prev1 = current
    }
    return prev1
}
```

Each house is either robbed (its value plus the best total from two houses back, since adjacent houses can't both be robbed) or skipped (the best total from one house back). That "take it or don't" choice at each step, folded into a running max, is the same shape as `climbStairs`'s sum — just a different combining operation.

2D grid/string DP — `table[i][j]` depends on neighbors in a 2D table, common for grid paths (unique paths through a grid moving only right/down) and string comparison problems (longest common subsequence, edit distance).

```swift
// Longest common subsequence: table[i][j] = LCS of first i chars of a, first j of b
func lcs(_ a: String, _ b: String) -> Int {
    let a = Array(a), b = Array(b)
    var table = [[Int]](repeating: [Int](repeating: 0, count: b.count + 1), count: a.count + 1)
    for i in 1...a.count {
        for j in 1...b.count {
            if a[i - 1] == b[j - 1] {
                table[i][j] = table[i - 1][j - 1] + 1
            } else {
                table[i][j] = max(table[i - 1][j], table[i][j - 1])
            }
        }
    }
    return table[a.count][b.count]
}
```

`table[i][j]` holds the answer for the first `i` characters of `a` against the first `j` characters of `b`. If the current characters match, extend the diagonal neighbor's answer by one. If they don't, take the best of ignoring one character from either string — `table[i-1][j]` or `table[i][j-1]`. The base row and column (index 0) are implicitly all zeros, matching "an empty string shares nothing with anything."

Knapsack-style DP — choosing a subset of items under a capacity constraint, where `table[i][capacity]` tracks the best value achievable using the first `i` items within that capacity. This shape underlies subset-sum and partition-equal-subset problems too.

## Recognizing DP problems

A few signals, in rough order of reliability:

The problem asks for an optimal value — a minimum, maximum, or a count of ways — rather than "list every possibility." "Find the minimum cost," "how many distinct ways," "what's the longest" are DP phrasings; "list all subsets" usually is not (that's typically backtracking instead).

The naive recursive solution has **overlapping subproblems** — the same smaller input gets solved repeatedly across different branches of the recursion tree, exactly like `climbStairs(3)` showing up twice in the tree above. If every recursive call has a genuinely distinct input, memoization buys nothing, and DP isn't the right tool.

The problem has **optimal substructure** — the optimal answer to the whole problem can be built directly from optimal answers to its subproblems, without needing to reconsider choices already made. `climbStairs(n)`'s answer only needs the *counts* for `n-1` and `n-2`, not the specific paths that achieved them — that's optimal substructure.

When both signals are present, sketch the recurrence relation first — in words, "the answer for state X equals some combination of the answers for smaller states" — before writing any code. Getting the recurrence right is most of the problem; translating it into memoized recursion or a tabulated loop is comparatively mechanical once the recurrence is correct.

## Common pitfalls

Writing the memoized recursive version but forgetting to check the cache *before* recursing (checking after does no good — the expensive calls already happened).

```swift
let result = climbStairs(n - 1, &memo) + climbStairs(n - 2, &memo)
if let cached = memo[n] { return cached }   // checked too late — already recursed
```

Assuming every recursive problem is DP — if subproblems don't overlap (each recursive call has a genuinely unique input, like a plain binary search), memoization adds bookkeeping overhead for zero benefit.

Reducing a table to O(1) space too early, before the tabulated version is working and correct — verify the full table version first, then reduce, so a space-optimization bug doesn't get tangled up with a logic bug.

## Interview lens

Walk the progression out loud, in order: state the brute-force recursion and its recurrence relation, identify the overlapping subproblems (point at the repeated node in the call tree if you can sketch one), add memoization, then offer to convert to tabulation. That sequence itself is a strong signal, independent of whether you finish the space optimization.

When asked "can this be O(1) space instead of O(n)," check whether the recurrence only reaches back a fixed, small number of previous states — if `table[i]` only ever needs `table[i-1]` and `table[i-2]`, two variables replace the array; if it needs the whole history, it can't be reduced that way.

For 2D problems, say the state out loud before coding: "`table[i][j]` represents the answer for the first `i` elements of A and the first `j` elements of B" (or whatever the problem's two dimensions are) — naming the state clearly is what keeps the transition logic (the recurrence) from turning into guesswork.

If you're stuck recognizing whether a problem is DP at all, ask out loud whether smaller versions of the problem overlap when you recurse — that's the one signal worth checking first, before pattern-matching to "looks like a grid problem" or "looks like a string problem."
