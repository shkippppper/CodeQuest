import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "search-binary-complexity",
    type: "mcq",
    prompt: "Why is binary search O(log n) instead of O(n)?",
    options: [
      "Each comparison discards half of the remaining search range",
      "It uses an internal hash table to jump directly to candidate positions instead of scanning",
      "It is restricted to arrays smaller than 100 elements, which are small enough to search in constant passes",
      "It caches the results of previous comparisons so each element is examined at most once across all calls",
    ],
    answer: 0,
    explanation:
      "Every check of the midpoint eliminates one entire half of the remaining range, so the range shrinks by half each iteration. Halving n repeatedly takes log2(n) steps to reach a single element.",
  },
  {
    id: "search-overflow-fill",
    type: "fill",
    prompt: "Computing the midpoint as `lo + (hi - lo) / 2` instead of `(lo + hi) / 2` avoids integer ___ when lo and hi are both large.",
    answers: ["overflow"],
    hint: "What happens when a sum exceeds the max value a fixed-width integer can hold.",
    explanation:
      "`lo + hi` can exceed the maximum representable integer if both are large, in languages/contexts with fixed-width integers. `lo + (hi - lo) / 2` computes the same midpoint without ever summing two large values.",
  },
  {
    id: "search-boundary-shape",
    type: "predict",
    prompt: "In the 'first index >= target' boundary search, why does the loop use `hi = mid` (not `mid - 1`) when the condition fails?",
    code: `while lo < hi {\n    let mid = lo + (hi - lo) / 2\n    if a[mid] < target { lo = mid + 1 }\n    else { hi = mid }\n}`,
    options: [
      "mid itself might be the answer, so excluding it from the range (mid - 1) could throw away the correct result",
      "It's a harmless typo — mid - 1 would converge to the same boundary because the sorted order makes up for the offset",
      "hi = mid forces the loop to scan the skipped half linearly, degrading the search from O(log n) to O(n)",
      "It only matters when the array contains duplicate values, which cause the boundary to shift by more than one position",
    ],
    answer: 0,
    explanation:
      "Unlike exact-match binary search where a matching mid is an immediate answer, here mid could BE the first qualifying index. Setting hi = mid keeps it in play for future iterations rather than incorrectly excluding it.",
  },
  {
    id: "search-rotated-array",
    type: "mcq",
    prompt: "Searching a rotated sorted array like [4, 5, 6, 7, 0, 1, 2] in O(log n) works because...",
    options: [
      "At every midpoint, at least one of the two halves is still fully sorted, so you can check which one and decide if the target could be in it",
      "You first un-rotate the array in O(n) by finding the pivot index, then binary search the restored sorted array normally",
      "Rotated arrays can only be searched in O(n) because the rotation breaks the precondition binary search relies on entirely",
      "You binary search the array twice — once assuming the rotation went clockwise and once assuming it went counter-clockwise — then take whichever of the two runs succeeds",
    ],
    answer: 0,
    explanation:
      "With a single rotation point, one half around any midpoint is always contiguous and sorted. Checking a[lo] <= a[mid] identifies which half that is, then a normal sorted-range check decides whether the target could be there — still O(log n), no un-rotation needed.",
  },
  {
    id: "search-fast-slow-cycle",
    type: "predict",
    prompt: "In Floyd's cycle detection, slow moves 1 step and fast moves 2 steps per iteration. Why does fast always eventually land on slow's node if a cycle exists?",
    code: `while fast != nil, fast?.next != nil {\n    slow = slow?.next\n    fast = fast?.next?.next\n}`,
    options: [
      "The gap between them inside the cycle shrinks by exactly one node per iteration, so a finite gap must eventually reach zero",
      "fast always completes exactly one full lap of the cycle before slow enters it, guaranteeing they meet at the entry node",
      "It's not guaranteed to terminate — if the cycle has an odd length, fast skips over slow on every pass and they never land on the same node",
      "slow stops moving entirely once fast enters the cycle, so fast inevitably laps it and they meet at slow's position",
    ],
    answer: 0,
    explanation:
      "Once both pointers are inside the cycle, fast gains one node of ground on slow every iteration. A gap that shrinks by exactly 1 each step cannot skip past zero, so they're guaranteed to meet.",
  },
  {
    id: "search-threesum-approach",
    type: "mcq",
    prompt: "The standard O(n²) approach to 3Sum (find all triples summing to 0) is built from which combination?",
    options: [
      "Sort the array, then fix one element and run an opposite-ends two-pointer scan on the rest",
      "A hash set alone, checked for every possible triple in O(n³) by testing all combinations exhaustively",
      "Binary search for every pair of elements, reducing the third lookup from O(n) to O(log n) for an O(n² log n) total",
      "Fast/slow pointers that traverse the sorted array and detect when three values sum within a tolerance window",
    ],
    answer: 0,
    explanation:
      "Sorting first (O(n log n)) enables an inner two-pointer scan. The outer loop fixes one element (O(n)), and for each fixed element the inward-closing two-pointer scan is O(n), giving O(n²) overall — dominated by the nested loops, not the sort.",
  },
  {
    id: "search-monotonic-truths",
    type: "multi",
    prompt: "Select all true statements about 'binary search the answer' (search-space reduction).",
    options: [
      "It requires the underlying condition to be monotonic — false for a while, then true, and never flipping back",
      "It only applies to problems that search an actual array",
      "Phrases like 'minimize/maximize X such that condition holds' are a common signal for this pattern",
      "It still achieves a logarithmic number of iterations over the range of possible answers",
    ],
    answers: [0, 2, 3],
    explanation:
      "Search-space reduction binary searches over a range of candidate answers, not necessarily an array — it just needs a monotonic check function. 'Minimize/maximize X such that...' phrasing is a strong hint, and it still runs in a logarithmic number of steps over the answer range.",
  },
  {
    id: "search-unsorted-pitfall",
    type: "mcq",
    prompt: "What happens if you run standard binary search on an unsorted array?",
    options: [
      "It silently returns a wrong answer (or a false negative) — there's no error, just incorrect results",
      "It throws a runtime exception identifying which comparison violated the sorted-order precondition",
      "It automatically detects the disorder and falls back to a full linear scan to find the target correctly",
      "It still works correctly for every input, just a constant factor slower than on a sorted array",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Binary search's correctness depends entirely on the sortedness precondition. On unsorted data, the lo/hi elimination logic can discard the half that actually contains the target, producing a wrong result with no indication anything went wrong — which is why stating the precondition out loud matters in an interview.",
  },
  {
    id: "search-flashcard",
    type: "flashcard",
    prompt:
      "Explain binary search, its boundary-search and rotated-array variants, the two-pointer/fast-slow techniques, and search-space reduction. Answer aloud, then reveal.",
    modelAnswer:
      "**Binary search** works on sorted data by checking the midpoint and discarding the half that can't contain the target, giving **O(log n)** — but only when the precondition (sorted, or monotonic) holds; unsorted input silently returns wrong answers. The boundary-search variant (find first index where a condition becomes true) uses `hi = a.count`, `lo < hi`, and `hi = mid` (not `mid-1`) since mid itself might be the answer. A rotated sorted array is still binary-searchable in O(log n) because one half around any midpoint is always sorted — check `a[lo] <= a[mid]` to find which, then range-check normally. **Two pointers** (opposite ends closing inward on sorted data) extends to problems like 3Sum: sort, fix one element, then run the pair-sum scan on the rest, O(n²) total. **Fast/slow pointers** (one node vs two nodes per step) detect cycles in linked structures — the gap shrinks by one node per iteration inside a cycle, guaranteeing a meeting — and find a list's midpoint in one pass. **Search-space reduction** generalizes binary search past arrays: whenever a condition is monotonic in some parameter (like 'can I eat all piles within H hours at speed S'), binary search over the range of possible answers instead of trying each one linearly.",
    keyPoints: [
      "Binary search: O(log n), requires sorted/monotonic data, silent failure if not",
      "Boundary search: hi = count, lo < hi, hi = mid (mid could be the answer)",
      "Rotated array: one half is always sorted at any midpoint",
      "Two pointers (opposite ends) extends to 3Sum via sort + fix + scan, O(n²)",
      "Fast/slow pointers: cycle detection and list midpoint, O(n) time O(1) space",
      "Search-space reduction: binary search over possible answers when the check is monotonic",
    ],
    explanation:
      "A senior answer states the monotonicity precondition explicitly for search-space reduction and explains why the boundary-search loop shape differs from exact-match binary search, not just that it does.",
  },
];

export default quiz;
