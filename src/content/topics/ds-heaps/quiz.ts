import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "heap-property",
    type: "mcq",
    prompt: "What does the max-heap property actually guarantee?",
    options: [
      "Every parent is ≥ both of its children",
      "The array is fully sorted in descending order",
      "Left children are always ≥ right children",
      "Every node is ≥ all nodes in the tree below it, at any depth",
    ],
    answer: 0,
    explanation:
      "A heap only constrains parent-vs-child, not siblings or deeper descendants. `heap[1]` and `heap[2]` (siblings) can be in either order. That weaker guarantee is what makes inserts/extracts cheap compared to keeping a fully sorted structure.",
  },
  {
    id: "heap-index-math",
    type: "predict",
    prompt: "Given `heap = [9, 7, 5, 2, 1]`, what are the indices of index 1's children?",
    code: `func left(_ i: Int) -> Int { 2 * i + 1 }\nfunc right(_ i: Int) -> Int { 2 * i + 2 }`,
    options: ["3 and 4", "2 and 3", "0 and 2", "4 and 5"],
    answer: 0,
    explanation:
      "left(1) = 2*1+1 = 3, right(1) = 2*1+2 = 4. This arithmetic only works because a heap is kept complete — every level full except possibly the last, filled left to right with no gaps.",
  },
  {
    id: "heap-insert-fill",
    type: "fill",
    prompt: "Inserting into a heap appends the new value at the end of the array, then repeatedly swaps it with its parent until the property holds — this operation is called sift ___.",
    answers: ["up"],
    hint: "The new element moves toward the root.",
    explanation:
      "Sift up (also called bubble up) moves the newly appended element toward the root one swap at a time, stopping as soon as its parent is no longer smaller (max-heap) or larger (min-heap). It takes at most O(log n) swaps.",
  },
  {
    id: "heap-heapify-complexity",
    type: "mcq",
    prompt: "Building a heap from an existing array of n elements via heapify runs in what time?",
    options: [
      "O(n) — most nodes are near the bottom and sift down only a short distance",
      "O(n log n) — same as n individual inserts",
      "O(log n) — heapify only touches the root",
      "O(n²) — every node compares against every other",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Although any single siftDown call looks O(log n), the vast majority of nodes in a complete tree are near the leaves and have almost no distance to sink. Summed across all nodes, the total work is linear, not O(n log n).",
  },
  {
    id: "heap-extract-max",
    type: "predict",
    prompt: "To remove the max from a max-heap array, why not just delete index 0 directly?",
    code: `var heap = [9, 7, 5, 2, 1]\n// remove index 0 directly?`,
    options: [
      "It would leave a gap that breaks the parent/left/right index arithmetic for every other element",
      "Swift arrays don't allow removing index 0",
      "It's fine — heaps support direct removal at any index in O(1)",
      "It would only break min-heaps, not max-heaps",
    ],
    answer: 0,
    explanation:
      "The array-backed heap depends on being a complete tree with no holes for its index math to work. The fix is to swap the root with the last element, remove the (now-relocated) old max from the end, and sift the new root down into place.",
  },
  {
    id: "heap-topk-truths",
    type: "multi",
    prompt: "Select all true statements about solving 'find the K largest elements' with a heap.",
    options: [
      "You keep a min-heap capped at size K",
      "You keep a max-heap capped at size K",
      "The root of the capped heap always holds the smallest of your currently-kept top-K values",
      "Total time is roughly O(n log K), better than fully sorting when K is much smaller than n",
    ],
    answers: [0, 2, 3],
    explanation:
      "For K largest, use a min-heap of size K — the root holds your current worst kept value, so an O(1) peek tells you whether a new candidate deserves to replace it, and eviction is O(log K). Doing n of these gives O(n log K), beating an O(n log n) full sort when K is small.",
  },
  {
    id: "heap-vs-bst",
    type: "mcq",
    prompt: "Why can't you do an efficient in-order traversal to get sorted output directly from a heap the way you can from a BST?",
    options: [
      "A heap only orders parent vs. child, not left vs. right or across subtrees, so there's no left-to-right ordering to walk",
      "Heaps don't support traversal at all",
      "Heaps are stored as linked structures, not arrays, so traversal is O(n²)",
      "A heap is always deeper than a BST with the same elements",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A BST maintains a total left-less-than-node-less-than-right ordering, so in-order traversal yields sorted output. A heap only guarantees parent-vs-child extremity, so siblings and separate subtrees have no defined relative order — that's precisely the weaker, cheaper-to-maintain guarantee a heap trades for.",
  },
  {
    id: "heap-sort-complexity",
    type: "fill",
    prompt: "Heapsort's overall time complexity, combining O(n) heapify with n extractions at O(log n) each, is O(n ___ n).",
    answers: ["log"],
    hint: "Same big-picture complexity class as merge sort and quicksort's average case.",
    explanation:
      "Heapify is O(n); n extractions at O(log n) each add O(n log n). The heapify cost is dominated by the extraction cost, so the total is O(n log n) — matching merge sort and quicksort's average case, done in place.",
  },
  {
    id: "heap-flashcard",
    type: "flashcard",
    prompt:
      "Explain what a heap is, how it's stored, its core operations' complexities, and how it's used for top-K problems. Answer aloud, then reveal.",
    modelAnswer:
      "A **heap** is a complete binary tree obeying the heap property: every parent is more extreme (≥ for max-heap, ≤ for min-heap) than its children — but siblings and separate subtrees have no guaranteed order, unlike a BST. It's stored in a plain array using index arithmetic (parent = (i-1)/2, children = 2i+1 and 2i+2) instead of pointers, which only works because the tree is complete (no gaps). **Insert** appends at the end and sifts up — swapping with the parent until the property holds, O(log n). **Extract** swaps the root with the last element, removes it, and sifts the new root down past whichever child is more extreme, also O(log n). Peek at the root is O(1). Building a heap from an existing array via **heapify** — sifting down from the last non-leaf node backward to the root — is O(n) overall, not O(n log n), because most nodes are near the leaves. For top-K problems, K largest uses a min-heap capped at size K (root = worst kept value, O(log K) to evict), giving O(n log K) total; K smallest mirrors this with a max-heap. **Heapsort** heapifies (O(n)) then extracts repeatedly (O(n log n)), for O(n log n) overall.",
    keyPoints: [
      "Heap property: parent ≥ (or ≤) children only, no sibling/subtree order",
      "Array-backed via index math; requires a complete tree",
      "Insert/extract O(log n), peek O(1), heapify O(n)",
      "Top-K largest → min-heap of size K; top-K smallest → max-heap of size K",
      "Heapsort: O(n) heapify + O(n log n) extractions = O(n log n)",
    ],
    explanation:
      "A senior answer explains why heapify is O(n) despite looking like n calls to an O(log n) operation, and gets the min-heap-for-largest / max-heap-for-smallest direction right without hesitating.",
  },
];

export default quiz;
