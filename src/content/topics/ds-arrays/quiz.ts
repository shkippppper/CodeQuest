import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "arr-index-complexity",
    type: "mcq",
    prompt: "What is the complexity of `a[i]` (index access) and `a.insert(x, at: 0)`?",
    options: [
      "Index access O(1); front insert O(n) (elements shift)",
      "Both O(1), because Swift arrays use a deque-style ring buffer that supports O(1) operations at both ends",
      "Both O(n), because Swift arrays must traverse to the target position for any access or modification",
      "Index O(n) due to grapheme-cluster encoding; front insert O(1) because the buffer head pointer simply decrements",
    ],
    answer: 0,
    explanation:
      "Arrays are contiguous, so index access is O(1). Inserting at the front shifts every subsequent element → O(n). Appending at the end is amortized O(1).",
  },
  {
    id: "arr-two-pointer-sorted",
    type: "mcq",
    prompt: "For 'find a pair summing to target' in a SORTED array, what's the optimal approach?",
    options: [
      "Two pointers from both ends, moving inward based on the sum — O(n) time, O(1) space",
      "Nested loops checking every possible pair — O(n squared) time, O(1) space",
      "Binary search for the complement of each element — O(n log n) time, O(1) space",
      "Sort the already-sorted array again, then scan with a single pointer from left to right",
    ],
    answer: 0,
    explanation:
      "With a sorted array, move `left`/`right` inward: if the sum is too small advance `left`, too big retreat `right`. That's O(n) time and O(1) space — better than the O(n²) brute force or O(n log n) with a hash for unsorted.",
  },
  {
    id: "arr-window-fill",
    type: "fill",
    prompt: "The pattern that maintains a contiguous [left, right] range and grows/shrinks it for 'longest substring with property X' is the sliding ___.",
    answers: ["window"],
    hint: "sliding ___.",
    explanation:
      "A sliding window expands `right` to include elements and advances `left` to shrink when the constraint breaks — ideal for longest/shortest contiguous subarray/substring problems.",
  },
  {
    id: "arr-window-complexity",
    type: "predict",
    prompt: "🧠 Trick question — a sliding-window solution has a `for` loop containing a `while` loop. Is it O(n²)?",
    code: `for right in 0..<n {
    while windowInvalid { left += 1 }   // inner while
    // update answer
}`,
    options: [
      "No — each element enters and leaves the window at most once, so total work is O(n)",
      "Yes — nested loops are always O(n squared) regardless of how the inner loop's iteration count is bounded across the outer loop",
      "It is O(n log n) because the while loop performs a binary-search-style halving of the remaining window on each inner iteration",
      "It depends purely on the data distribution; worst-case inputs can force the inner while loop to reset left to 0 on every outer iteration",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Despite the nested `while`, `left` only ever advances forward and never resets, so across the whole run it moves at most n times total. Each element is added once and removed once → **O(n)** amortized, not O(n²). This is a classic misread.",
  },
  {
    id: "arr-contains-loop",
    type: "predict",
    prompt: "What's the complexity, and the fix?",
    code: `for x in a {            // n items
    if seen.contains(x) { ... }   // seen is an Array
    seen.append(x)
}`,
    options: [
      "O(n²) because Array.contains is O(n); use a Set for O(1) membership → O(n)",
      "O(n), because Array.contains uses a hash-based shortcut in Swift and runs in O(1) on average",
      "O(n log n), because Swift sorts the seen array internally before each contains call to enable binary search",
      "O(1), because the compiler inlines and eliminates the seen array entirely when the loop body is simple enough",
    ],
    answer: 0,
    explanation:
      "`Array.contains` is a linear scan, so inside the loop it's O(n²). Using a `Set` for `seen` makes membership O(1) average, dropping the whole thing to O(n).",
  },
  {
    id: "arr-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about arrays & strings in Swift.",
    options: [
      "Array index access is O(1)",
      "Two pointers can turn some O(n²) problems into O(n) with O(1) space",
      "You can subscript a Swift String with an Int",
      "Converting a String to [Character] gives O(1) indexed access",
    ],
    answers: [0, 1, 3],
    explanation:
      "O(1) indexing, two-pointer O(n) solutions, and `[Character]` for O(1) access are correct. You **cannot** `Int`-subscript a `String` (option 3 is false) — that's why you convert to `[Character]` for algorithm work.",
  },
  {
    id: "arr-string-array-senior",
    type: "mcq",
    prompt: "Why convert a Swift `String` to `[Character]` before running an index-heavy algorithm?",
    options: [
      "Strings aren't Int-indexable and reaching a position is O(n); [Character] gives O(1) random access",
      "Converting to [Character] uses significantly less memory than keeping the String, because Character values are stored as fixed-width scalars",
      "Swift Strings cannot be iterated with a for-in loop without first converting them to a Character array",
      "Converting to [Character] makes the underlying storage mutable in place, whereas String values are always copy-on-write and cannot be modified at a subscript",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Because a `Character` is a variable-width grapheme cluster, `String` uses `String.Index` and O(n) to reach an arbitrary position — you can't do `s[i]`. Converting to `Array(s)` once (O(n)) lets you index in O(1) for the rest of the algorithm.",
  },
  {
    id: "arr-inplace-senior",
    type: "mcq",
    prompt: "You must remove duplicates from a sorted array with O(1) extra space. Which technique?",
    options: [
      "A slow write-pointer and a fast scan pointer (two pointers, same direction), overwriting in place",
      "Copy the array elements into a Set, then copy back into the array, using O(n) extra space for the intermediate Set",
      "Sort the already-sorted array again from scratch, which causes duplicates to cluster before removal",
      "Use recursion with memoization, caching each unique value seen so far to avoid allocating a separate output array",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Keep a slow pointer marking the last unique position; a fast pointer scans, and when it finds a new value you write it just after the slow pointer. This dedups in place with O(1) extra space — the standard fast/slow two-pointer in-place edit.",
  },
  {
    id: "arr-index-as-hash-senior",
    type: "mcq",
    prompt: "For an array of n values each in 1...n, how can you find a duplicate with O(1) extra space?",
    options: [
      "Use each value as an index and mark that slot (e.g. negate it); a slot already marked reveals a duplicate",
      "Sort the array first, then scan for adjacent equal values — but sorting requires O(n log n) time even with O(1) extra space",
      "Use a Set to track seen values — O(n) time but O(n) extra space, since there is no O(1)-space solution for this problem",
      "It is impossible to detect duplicates in O(n) time with O(1) extra space; any correct solution requires at least O(log n) additional memory",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The index-as-hash / marking trick: because values map to valid indices, visiting index `abs(value)-1` and negating it records 'seen'; encountering an already-negative slot means that value repeated. It finds duplicates in O(n) time and O(1) extra space by using the array itself as the hash.",
  },
  {
    id: "ds-arrays-flashcard",
    type: "flashcard",
    prompt:
      "Explain array complexity plus the two-pointer and sliding-window patterns (and the Swift string gotcha). Answer aloud, then reveal.",
    modelAnswer:
      "A Swift **`Array`** is a contiguous COW buffer: **O(1)** index, **amortized O(1)** end-append, but **O(n)** front/middle insert-remove and **O(n)** `contains`/`firstIndex` — so avoid `contains`-in-a-loop (use a **`Set`** for O(1) membership) and front operations. Two patterns turn O(n²) brute forces into O(n): **two pointers** — opposite ends moving inward on a **sorted** array (e.g. pair-sum: too small → advance left, too big → retreat right; O(n)/O(1)), or **fast/slow same-direction** for in-place edits (dedup with a slow write-pointer, reverse by swapping ends); and the **sliding window** — maintain a contiguous `[left, right]` range, grow `right` to include elements and advance `left` to shrink when the constraint breaks, for longest/shortest contiguous subarray/substring problems. A window with an inner `while` is still **O(n)** because `left` only advances (each element enters/leaves once) — a common misread. **In-place O(1)-space** tricks: two-pointer reverse, slow write-pointer filtering, and index-as-hash/marking (use values as indices to find duplicates/missing). **Swift string gotcha**: no `Int` subscript and O(n) index access (grapheme clusters), so convert to **`[Character]`** once for O(1) indexing in algorithms.",
    keyPoints: [
      "Array: O(1) index, amortized O(1) append, O(n) front/middle & contains",
      "Two pointers: opposite-ends (sorted) or fast/slow (in-place) → O(n)/O(1)",
      "Sliding window: grow right, shrink left; each element enters/leaves once → O(n)",
      "In-place: two-pointer reverse, slow write-pointer, index-as-hash/marking",
      "Swift String: no Int subscript, O(n) index → convert to [Character] for O(1)",
    ],
    explanation:
      "Senior answers explain why a windowed for+while is O(n), give in-place O(1)-space tricks, and cite the [Character] conversion for O(1) string indexing.",
  },
];

export default quiz;
