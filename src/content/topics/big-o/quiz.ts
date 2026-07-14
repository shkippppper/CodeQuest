import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "bigo-what",
    type: "mcq",
    prompt: "What does Big-O notation describe?",
    options: [
      "How an algorithm's cost grows with input size, dropping constants and lower-order terms",
      "The exact runtime in milliseconds for a given input size on a specific, well-characterized piece of hardware",
      "The memory address of a function as recorded in the compiled binary's symbol table",
      "The number of lines of code written by the programmer before any optimization passes",
    ],
    answer: 0,
    explanation:
      "Big-O captures asymptotic growth — the dominant term as n grows, ignoring constants and hardware. `3n + 5` is O(n); it says nothing about exact milliseconds.",
  },
  {
    id: "bigo-simplify",
    type: "predict",
    prompt: "What is the Big-O of an algorithm doing `2n² + 100n + 50` operations?",
    code: `// operation count grows as 2n^2 + 100n + 50`,
    options: ["O(n²)", "O(n)", "O(2n²)", "O(n² + n)"],
    answer: 0,
    explanation:
      "Keep only the dominant term and drop constants: `2n² + 100n + 50` → **O(n²)**. For large n, the quadratic term dwarfs the rest.",
  },
  {
    id: "bigo-nested-loop",
    type: "predict",
    prompt: "What is the time complexity?",
    code: `for i in arr {
    for j in arr {
        print(i, j)
    }
}`,
    options: ["O(n²)", "O(n)", "O(log n)", "O(1)"],
    answer: 0,
    explanation:
      "Two nested loops over the same n-element array run n × n times → **O(n²)**. A nested loop over the same input is the classic quadratic signature.",
  },
  {
    id: "bigo-binary-search",
    type: "mcq",
    prompt: "What is the time complexity of binary search on a sorted array?",
    options: ["O(log n)", "O(n)", "O(n log n)", "O(1)"],
    answer: 0,
    explanation:
      "Binary search halves the search space each step, so it takes O(log n). Halving the problem each iteration is the signature of logarithmic complexity.",
  },
  {
    id: "bigo-amortized-fill",
    type: "fill",
    prompt: "`Array.append` is O(n) when the buffer resizes but ___ O(1) overall, because doublings are rare.",
    answers: ["amortized"],
    hint: "Averaged over a sequence of operations.",
    explanation:
      "Amortized analysis spreads the occasional O(n) resize-and-copy across the many cheap appends, giving an **amortized** O(1) per append.",
  },
  {
    id: "bigo-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about complexity analysis.",
    options: [
      "Space complexity should include the recursion call-stack depth",
      "Big-O keeps the dominant term and drops constants",
      "Worst case is the usual meaning of 'the' complexity",
      "An O(1) algorithm always beats an O(n) one for every input size",
    ],
    answers: [0, 1, 2],
    explanation:
      "Recursion stack counts toward space, dominant-term simplification, and worst-case default are correct. For small n, an O(n) algorithm can beat an O(1) one — Big-O is about growth, not exact runtime (option 3 is false).",
  },
  {
    id: "bigo-contains-loop-senior",
    type: "predict",
    prompt: "🧠 Trick question — what's the complexity, and how do you improve it?",
    code: `for x in a {              // n items
    if b.contains(x) {    // b is an Array
        print(x)
    }
}`,
    options: [
      "O(n·m) because Array.contains is O(m); use a Set for b to make membership O(1) → O(n)",
      "O(n) — contains is O(1) because Swift arrays maintain a hash index for fast membership checks",
      "O(log n) because Swift sorts the array under the hood before searching when contains is called",
      "O(1) because the compiler inlines the loop body and the contains call into a single pass at compile time",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`Array.contains` scans linearly (O(m)), so inside an O(n) loop it's O(n·m). Converting `b` to a `Set` makes membership O(1) average, dropping the whole thing to O(n). Spotting `contains`-in-a-loop is a classic optimization.",
  },
  {
    id: "bigo-quicksort-cases-senior",
    type: "mcq",
    prompt: "Quicksort's average vs worst-case time complexity?",
    options: [
      "O(n log n) average, O(n²) worst case (bad pivots)",
      "O(n) average because partitioning avoids comparisons, O(n log n) worst when pivots are ideal",
      "O(n²) always regardless of pivot strategy, which is why standard libraries prefer merge sort",
      "O(log n) average because only the pivot element is compared at each recursion level",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "With good pivots quicksort partitions evenly → O(n log n) average. Pathological pivots (e.g. already-sorted with a naive pivot) give unbalanced partitions → O(n²) worst case. Knowing best/avg/worst distinctions is expected.",
  },
  {
    id: "bigo-front-insert-senior",
    type: "mcq",
    prompt: "What is the complexity of `array.insert(x, at: 0)`?",
    options: [
      "O(n) — every existing element must shift over by one",
      "O(1) — insertion is always constant time because Swift arrays use a gap buffer internally",
      "O(log n) because Swift uses a sorted backing buffer and binary searches for the insertion point",
      "O(n²) because each element must re-sort itself relative to all others after the shift completes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Inserting (or removing) at the **front** of an array shifts all subsequent elements → O(n). Appending/removing at the **end** is amortized O(1). For frequent front operations, a deque or reversed processing is better.",
  },
  {
    id: "big-o-flashcard",
    type: "flashcard",
    prompt:
      "Explain Big-O: what it measures, the common classes, amortized/worst-case, and Swift gotchas. Answer aloud, then reveal.",
    modelAnswer:
      "**Big-O** describes how an algorithm's cost **grows with input size n**, keeping the **dominant term** and dropping constants/lower-order terms (`3n+5` → O(n)) — it's about asymptotic growth, not exact runtime (an O(n) algorithm can beat an O(1) one for small n). Report both **time** and **space** (space includes auxiliary structures **and** the recursion call stack). The ladder, with a source each: **O(1)** (index/dict lookup) < **O(log n)** (binary search — halving) < **O(n)** (single pass) < **O(n log n)** (good comparison sorts) < **O(n²)** (nested loops) < **O(2ⁿ)/O(n!)** (brute-force subsets/permutations). **Amortized** analysis averages over a sequence — `Array.append` is amortized O(1) because the O(n) capacity-doubling resize is rare. Distinguish **best/average/worst** case (quicksort O(n log n) avg, O(n²) worst); interviews default to **worst case**. **Swift gotchas**: `Array.contains` is O(n) (O(n²) in a loop — use a `Set` for O(1) membership), `Set`/`Dictionary` lookups are O(1) average, front insert/remove is O(n), and `String` character access is O(n) to reach a position. Habit: for any solution, state its time and space complexity and justify the dominant term.",
    keyPoints: [
      "Growth with n; keep dominant term, drop constants (asymptotic, not exact time)",
      "Ladder: O(1)<O(log n)<O(n)<O(n log n)<O(n²)<O(2ⁿ) with a source each",
      "Space includes recursion stack + auxiliary structures",
      "Amortized (append O(1)); best/avg/worst (quicksort O(n log n)/O(n²))",
      "Swift: contains O(n) (Set for O(1)); front insert O(n); Set/Dict O(1) avg",
    ],
    explanation:
      "Senior answers cover amortized append, best/avg/worst, and Swift-specific hidden costs (contains-in-a-loop, front insertion), not just the growth ladder.",
  },
];

export default quiz;
