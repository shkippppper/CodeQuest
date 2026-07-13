import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "dp-naive-complexity",
    type: "mcq",
    prompt: "The naive recursive climbStairs(n) = climbStairs(n-1) + climbStairs(n-2) runs in what time?",
    options: [
      "O(2ⁿ) — the call tree branches into two calls at every level, with massive repeated work",
      "O(n) — each call only does constant work",
      "O(n²) — nested iteration",
      "O(log n) — the problem halves each time",
    ],
    answer: 0,
    explanation:
      "Every call spawns two more calls until the base case, and the same sub-inputs (like n-2) get fully recomputed from scratch across different branches. That repeated, un-cached branching gives an exponential O(2ⁿ) call tree.",
  },
  {
    id: "dp-base-case-fill",
    type: "fill",
    prompt: "The input small enough for a recursive function to answer directly, without recursing further, is called the ___ case.",
    answers: ["base"],
    hint: "It's where the recursion stops.",
    explanation:
      "Every recursive function needs a base case — without one, the recursion never terminates. In climbStairs, n <= 2 is answered directly with no further recursive calls.",
  },
  {
    id: "dp-memo-order",
    type: "predict",
    prompt: "This memoized function has a bug. What's wrong?",
    code: `func climbStairs(_ n: Int, _ memo: inout [Int: Int]) -> Int {\n    if n <= 2 { return n }\n    let result = climbStairs(n - 1, &memo) + climbStairs(n - 2, &memo)\n    if let cached = memo[n] { return cached }\n    memo[n] = result\n    return result\n}`,
    options: [
      "The cache check happens after the recursive calls already ran, so it never prevents the expensive recursion — only the second visit's own subtree, not this call's work",
      "There's no bug, this is a correct and efficient memoized version",
      "memo should be an array, not a dictionary",
      "The base case is wrong",
    ],
    answer: 0,
    explanation:
      "Checking the cache must happen BEFORE recursing, so a previously-computed value short-circuits the recursive calls entirely. Checking after computing result means the recursive calls for n-1 and n-2 already ran unconditionally, defeating the point of caching for this call.",
  },
  {
    id: "dp-memoization-complexity",
    type: "mcq",
    prompt: "After correctly memoizing climbStairs, what's the new time and space complexity?",
    options: [
      "O(n) time, O(n) space for the memo (plus O(n) recursion stack)",
      "O(1) time and space — memoization makes it instant",
      "O(n) time, O(1) space — memoization removes the need for storage",
      "Still O(2ⁿ) time, just with less memory",
    ],
    answer: 0,
    explanation:
      "Each distinct value of n from 1 to the input gets computed exactly once and cached, giving O(n) time. The memo dictionary holds O(n) entries, and the recursive calls still use an O(n) call stack — memoization doesn't remove that.",
  },
  {
    id: "dp-tabulation-vs-memo",
    type: "multi",
    prompt: "Select all true statements comparing memoization and tabulation.",
    options: [
      "Memoization is top-down (starts at n, recurses toward the base case); tabulation is bottom-up (starts at the base case, iterates up to n)",
      "Tabulation avoids the recursion call stack entirely",
      "Both approaches have the same time complexity for climbStairs: O(n)",
      "Memoization always uses less memory than tabulation",
    ],
    answers: [0, 1, 2],
    explanation:
      "Memoization recurses top-down with caching; tabulation iterates bottom-up with no recursion, so no call stack. Both are O(n) time for climbStairs. Memory isn't always in memoization's favor — tabulation's table can often be space-reduced further (e.g. to O(1)) than a memoized recursive version, which still carries call-stack overhead.",
  },
  {
    id: "dp-space-reduction",
    type: "predict",
    prompt: "Why can climbStairs's tabulated O(n) table be reduced to O(1) space using just two variables?",
    code: `for i in 3...n {\n    table[i] = table[i - 1] + table[i - 2]\n}`,
    options: [
      "table[i] only ever depends on the two immediately preceding entries, never anything further back",
      "Swift arrays automatically compress repeated values",
      "It can't actually be reduced — that would change the answer",
      "Because n is always small in practice",
    ],
    answer: 0,
    explanation:
      "Since the recurrence only reaches back two positions, only those two most recent values need to be kept at any time — the rest of the table is never read again. Tracking just prev1 and prev2 in variables replaces the full array. This only works when each state depends on a small, fixed number of prior states.",
  },
  {
    id: "dp-recognize-signals",
    type: "multi",
    prompt: "Select all signals that a problem is a good candidate for dynamic programming.",
    options: [
      "The problem asks for a minimum, maximum, or count of ways, rather than listing every possibility",
      "The naive recursive solution has overlapping subproblems — the same smaller input gets solved repeatedly",
      "The problem has optimal substructure — the best overall answer can be built from optimal answers to subproblems",
      "The problem involves any recursive function, regardless of whether subproblems repeat",
    ],
    answers: [0, 1, 2],
    explanation:
      "Asking for an optimal value/count (not an enumeration), overlapping subproblems, and optimal substructure are the classic DP signals. Plain recursion without overlapping subproblems (like standard binary search) doesn't benefit from memoization — DP isn't warranted just because recursion is present.",
  },
  {
    id: "dp-2d-lcs",
    type: "mcq",
    prompt: "In the longest common subsequence table, why does table[i][j] pull from table[i-1][j-1] when a[i-1] == b[j-1]?",
    options: [
      "A matching character extends the best subsequence found using one fewer character from each string, so add 1 to the diagonal neighbor's answer",
      "It's an arbitrary convention with no deeper reason",
      "table[i-1][j-1] always holds the global maximum for the whole table",
      "Matching characters should be ignored entirely",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "If the current characters match, they can both be part of a common subsequence, extending whatever subsequence was found using one fewer character from each string — hence table[i-1][j-1] + 1. When they don't match, the best comes from dropping one character from either string: max(table[i-1][j], table[i][j-1]).",
  },
  {
    id: "dp-flashcard",
    type: "flashcard",
    prompt:
      "Explain the progression from naive recursion to memoization to tabulation using climbStairs, and how to recognize a DP problem. Answer aloud, then reveal.",
    modelAnswer:
      "Naive recursive `climbStairs(n) = climbStairs(n-1) + climbStairs(n-2)` has a **base case** (n <= 2) and a **recurrence relation** connecting each answer to two smaller ones, but re-solves the same sub-inputs repeatedly across branches — **overlapping subproblems** — giving O(2ⁿ) time. **Memoization** adds a cache dictionary checked before recursing and filled after computing, so each distinct n is solved once: O(n) time, O(n) memo space plus O(n) call stack. **Tabulation** flips this bottom-up: seed the base cases in an array, then iterate forward filling `table[i] = table[i-1] + table[i-2]` — same recurrence, no recursion, O(n) time and O(n) space, reducible to O(1) since each state only depends on the two immediately preceding ones (this reduction only applies when the recurrence reaches back a small, fixed number of states). Recognize DP by: the problem asks for an optimum/count (not enumeration); the naive recursion has overlapping subproblems (same smaller input solved repeatedly); and it has **optimal substructure** (the whole answer builds directly from optimal sub-answers). Common shapes: 1D sequence DP (climbStairs, house robber), 2D grid/string DP (longest common subsequence, edit distance), and knapsack-style DP (subset/capacity problems).",
    keyPoints: [
      "Base case + recurrence relation define the recursive structure",
      "Overlapping subproblems is why naive recursion is exponential",
      "Memoization: top-down, cache before recursing pays off, O(n) time",
      "Tabulation: bottom-up, iterative, no call stack, sometimes reducible to O(1) space",
      "Optimal substructure + overlapping subproblems + asks for optimum/count = DP signal",
    ],
    explanation:
      "A senior answer connects overlapping subproblems and optimal substructure explicitly to why memoization/tabulation work, rather than just describing the code mechanically.",
  },
];

export default quiz;
