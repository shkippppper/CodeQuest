import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sort-lower-bound",
    type: "mcq",
    prompt: "What's the best possible worst-case time for any comparison-based sort?",
    options: [
      "O(n log n) — a combinatorial floor from needing log2(n!) comparisons to distinguish all orderings",
      "O(n) — any sort can be made linear with enough cleverness",
      "O(n²) — comparison sorts can't beat quadratic",
      "O(log n) — comparisons themselves are the bottleneck",
    ],
    answer: 0,
    explanation:
      "There are n! possible orderings, and each comparison roughly halves the remaining possibilities, so at least log2(n!) ≈ n log n comparisons are needed in the worst case. Merge sort, quicksort, and heap sort all sit at or near this floor.",
  },
  {
    id: "sort-merge-trace",
    type: "predict",
    prompt: "What does merge([1, 4], [2, 3]) return, given the standard two-pointer merge?",
    code: `func merge(_ left: [Int], _ right: [Int]) -> [Int] {\n    var result: [Int] = []\n    var i = 0, j = 0\n    while i < left.count, j < right.count {\n        if left[i] <= right[j] { result.append(left[i]); i += 1 }\n        else { result.append(right[j]); j += 1 }\n    }\n    result.append(contentsOf: left[i...])\n    result.append(contentsOf: right[j...])\n    return result\n}`,
    options: ["[1, 2, 3, 4]", "[1, 4, 2, 3]", "[2, 3, 1, 4]", "[4, 3, 2, 1]"],
    answer: 0,
    explanation:
      "Compare 1 vs 2 → take 1. Compare 4 vs 2 → take 2. Compare 4 vs 3 → take 3. Left exhausted, append remaining right (empty). Result: [1, 2, 3, 4].",
  },
  {
    id: "sort-quicksort-worst-fill",
    type: "fill",
    prompt: "Quicksort's average time is O(n log n), but its worst case — triggered by consistently picking the smallest or largest remaining element as pivot — is O(n ___).",
    answers: ["squared", "^2", "2"],
    hint: "Two characters or the word for 'to the power of 2'.",
    explanation:
      "If the pivot is always the extreme value (e.g. last element on already-sorted input), each partition only removes one element instead of roughly halving the range, giving O(n²). Randomizing the pivot avoids this in practice.",
  },
  {
    id: "sort-stability-mcq",
    type: "mcq",
    prompt: "A sort is 'stable' when...",
    options: [
      "Elements that compare as equal keep their original relative order after sorting",
      "It always runs in O(n log n)",
      "It never uses extra memory",
      "It works correctly on already-sorted input",
    ],
    answer: 0,
    explanation:
      "Stability is about tie-breaking: if two elements compare equal, a stable sort guarantees the one that appeared first in the input still appears first in the output. This matters when sorting by one field but caring about a previously-established secondary order.",
  },
  {
    id: "sort-which-stable",
    type: "multi",
    prompt: "Select all sorts from this lesson that are stable by default (without extra modification).",
    options: ["Merge sort", "Quicksort", "Heap sort"],
    answers: [0],
    explanation:
      "Merge sort is stable because merge uses <= — equal elements from the left half (which came first in the original array) are taken before equal elements from the right. Quicksort's swaps during partitioning and heap sort's swaps during sifting can both reorder equal elements, so neither is stable by default.",
  },
  {
    id: "sort-space-comparison",
    type: "predict",
    prompt: "Rank merge sort, quicksort, and heap sort by extra space used, from least to most.",
    code: `// merge sort: builds new arrays during merge\n// quicksort: sorts in place, recursion stack\n// heap sort: sorts in place within the same array`,
    options: [
      "Heap sort O(1) < quicksort O(log n) < merge sort O(n)",
      "Merge sort O(1) < quicksort O(log n) < heap sort O(n)",
      "All three use O(n) extra space",
      "Quicksort O(1) < heap sort O(log n) < merge sort O(n)",
    ],
    answer: 0,
    explanation:
      "Heap sort sorts within the original array using O(1) extra space, quicksort needs O(log n) for its recursion stack, and merge sort needs O(n) for the temporary arrays built during merging.",
  },
  {
    id: "sort-swift-introsort",
    type: "mcq",
    prompt: "What sorting strategy does Swift's standard library `sort()` actually use?",
    options: [
      "Introsort: quicksort by default, falling back to heap sort if recursion goes too deep, with insertion sort for small subarrays",
      "Pure merge sort, always O(n) extra space",
      "Pure quicksort with no worst-case protection",
      "Bubble sort for small arrays, quicksort for large ones",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Swift's sort is introsort: it gets quicksort's typical speed, but watches recursion depth and switches to heap sort if it detects the O(n²) worst case developing, guaranteeing O(n log n) overall. Insertion sort handles small ranges where its lower constant factor wins despite being O(n²) in general.",
  },
  {
    id: "sort-choose-scenario",
    type: "mcq",
    prompt: "You need to sort a huge dataset with a hard memory ceiling and cannot risk a worst-case slowdown. Which sort fits best?",
    options: [
      "Heap sort — O(n log n) guaranteed in every case, O(1) extra space",
      "Quicksort with a fixed last-element pivot — fastest on average",
      "Merge sort — O(n log n) guaranteed but needs O(n) extra space",
      "Insertion sort — simplest to implement correctly",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Heap sort is the only option here that combines a hard O(n log n) worst-case guarantee with O(1) extra space. Merge sort has the same time guarantee but fails the memory ceiling; quicksort risks O(n²) with a naive pivot.",
  },
  {
    id: "sort-flashcard",
    type: "flashcard",
    prompt:
      "Compare merge sort, quicksort, and heap sort on time, space, and stability, and explain how Swift's built-in sort combines them. Answer aloud, then reveal.",
    modelAnswer:
      "All three are **comparison sorts** bound by the O(n log n) lower bound (log2(n!) comparisons needed to distinguish orderings). **Merge sort** splits in half recursively and merges sorted halves with a two-pointer walk; it's O(n log n) in every case, needs O(n) extra space for the merge buffers, and is **stable** because merge takes the left element on ties. **Quicksort** partitions around a pivot so smaller elements land left and bigger land right, then recurses on each side; average O(n log n) with a low constant, but O(n²) worst case if the pivot is repeatedly the extreme value (mitigated by randomizing the pivot); O(log n) space for the recursion stack; not stable, since partitioning swaps can reorder equal elements. **Heap sort** heapifies in O(n) then repeatedly extracts the max into the back of the same array; O(n log n) in every case, O(1) extra space, but not stable. Swift's `sort()` is **introsort**: quicksort by default for speed, falling back to heap sort if recursion depth signals the O(n²) case, with insertion sort for small subarrays — giving quicksort's typical speed with heap sort's worst-case guarantee, at the cost of not being guaranteed stable.",
    keyPoints: [
      "O(n log n) comparison-sort lower bound applies to all three",
      "Merge sort: O(n log n) always, O(n) space, stable",
      "Quicksort: O(n log n) avg / O(n²) worst, O(log n) space, not stable",
      "Heap sort: O(n log n) always, O(1) space, not stable",
      "Swift's sort = introsort (quicksort + heap sort fallback + insertion sort for small ranges)",
    ],
    explanation:
      "A senior answer states each sort's time/space/stability precisely and explains introsort's fallback mechanism, not just that Swift 'uses quicksort.'",
  },
];

export default quiz;
