import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "sq-lifo-fifo",
    type: "mcq",
    prompt: "Which pair correctly matches the structure to its ordering?",
    options: [
      "Stack = LIFO (last in, first out); Queue = FIFO (first in, first out)",
      "Stack = FIFO; Queue = LIFO, because stacks remove from the front and queues from the back",
      "Both are LIFO, removing the most-recently-added item from whichever end was last touched",
      "Both are FIFO, since all linear structures process elements in arrival order",
    ],
    answer: 0,
    explanation:
      "A stack always removes the most recently pushed item (LIFO). A queue always removes the item that has been waiting longest (FIFO) — like a checkout line.",
  },
  {
    id: "sq-dequeue-array-cost",
    type: "mcq",
    prompt: "If a queue's `dequeue()` is implemented by calling `Array.removeFirst()` directly, what's the time complexity per call?",
    options: [
      "O(n), because every remaining element has to shift left to close the gap",
      "O(1), same as removing from the end, since Swift reuses the vacated slot without touching other elements",
      "O(log n), because the array uses a binary-search-style pointer to track the front",
      "O(1) amortized, same as append, since the compiler optimizes contiguous removals into a single pass",
    ],
    answer: 0,
    explanation:
      "Removing from the front of a contiguous array forces every later element to shift over by one slot — that's an O(n) operation, unlike removing from the end which is O(1).",
  },
  {
    id: "sq-headindex-predict",
    type: "predict",
    prompt: "Given this index-tracking `Queue`, what does the code print?",
    code: `var q = Queue<Int>()
q.enqueue(10)
q.enqueue(20)
q.enqueue(30)
print(q.dequeue() ?? -1)
print(q.dequeue() ?? -1)
q.enqueue(40)
print(q.dequeue() ?? -1)`,
    options: ["10, 20, 30", "30, 20, 10", "10, 20, 40", "40, 20, 10"],
    answer: 0,
    explanation:
      "A queue is FIFO regardless of internal implementation: items come out in the order they went in — 10, then 20, then 30 — even though 40 was enqueued in between the dequeues.",
  },
  {
    id: "sq-balanced-fill",
    type: "fill",
    prompt: "Checking that parentheses/brackets are properly nested (e.g. `({[]})`) is a classic use case for a ___.",
    answers: ["stack"],
    hint: "The most recently opened bracket must be the next one closed.",
    explanation:
      "A stack's LIFO order matches bracket matching exactly: the most recently opened bracket must be the next one closed, which is exactly what popping the top of a stack checks.",
  },
  {
    id: "sq-monotonic-complexity",
    type: "mcq",
    prompt: "The `dailyTemperatures` monotonic stack solution has a `for` loop containing a `while` loop. Why is the total time complexity O(n) and not O(n^2)?",
    options: [
      "Each index is pushed onto the stack exactly once and popped at most once across the whole run, so total work across all iterations of the while loop is bounded by n",
      "The while loop never actually runs more than once per outer-loop iteration in total across the entire execution, because the monotonic invariant is always satisfied after the very first check",
      "Swift's optimizer detects the amortized-bounded inner loop pattern and rewrites nested loops into a single linear pass when the inner loop's total iteration count is provably capped",
      "The algorithm is actually O(n squared), but the constant factor is small enough to be acceptable in practice for the typical input sizes encountered in this problem",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Even though the while loop is nested inside the for loop, every index enters the stack once and leaves it at most once. Summed across the entire run, the total number of pushes and pops is bounded by 2n, giving O(n) overall — amortized analysis, not per-iteration analysis.",
  },
  {
    id: "sq-monotonic-fill",
    type: "fill",
    prompt: "A stack that maintains its elements in strictly increasing or decreasing order by evicting elements before pushing a new one is called a ___ stack.",
    answers: ["monotonic"],
    hint: "The property being preserved is that the values only move in one direction.",
    explanation:
      "A monotonic stack keeps its elements sorted (increasing or decreasing) at all times by popping anything that would violate that order before pushing the new element — the standard tool for next-greater/next-smaller-element problems.",
  },
  {
    id: "sq-deque-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about a deque (double-ended queue).",
    options: [
      "It supports O(1) push and pop at both the front and the back, given a proper backing store",
      "Using only its back-push/back-pop operations makes it behave like a stack",
      "Using only its back-push/front-pop operations makes it behave like a queue",
      "A plain Swift `Array` already gives O(1) operations at both ends, front included",
    ],
    answers: [0, 1, 2],
    explanation:
      "A properly backed deque (ring buffer or doubly linked list) gives O(1) at both ends, and restricting it to one end (stack) or push-back/pop-front (queue) recovers those simpler structures. A plain `Array` is NOT O(1) at the front — `insert(at: 0)` and `removeFirst()` are both O(n) because of shifting.",
  },
  {
    id: "sq-callstack-senior",
    type: "mcq",
    prompt: "During a recursive function call, what data structure tracks which function to return to when the current call finishes?",
    options: [
      "A stack — each call pushes a new frame, and returning pops it, which is why deep recursion can overflow it",
      "A queue — calls resolve in the order they started, so the first function called is always the first to finish and return its result",
      "A hash table keyed by function name, allowing O(1) lookup of the return address for any active call",
      "A linked list traversed backward on each return, hopping from node to node until reaching the original call site",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Function calls are tracked on the call stack: each call pushes a frame (its local variables and the address to return to), and each return pops it. Recursion that goes too deep without a base case exhausts that stack — a stack overflow — which is a direct, physical consequence of the LIFO structure.",
  },
  {
    id: "sq-flashcard",
    type: "flashcard",
    prompt:
      "Explain stacks vs queues, why array-backed queues need index tracking instead of `removeFirst()`, and how a monotonic stack works. Answer aloud, then reveal.",
    modelAnswer:
      "A **stack** is LIFO — push and pop both happen at the same end, so the most recently added item comes out first; built on an `Array`'s `append`/`popLast`, both O(1) since nothing shifts. A **queue** is FIFO — items leave in the order they arrived; naively using `Array.removeFirst()` for dequeue is O(n) because every remaining element shifts left, so a real implementation tracks a `headIndex` into the array and only does an O(n) cleanup occasionally, giving amortized O(1) dequeue. A **deque** generalizes both, supporting O(1) push/pop at both ends given a proper backing store (ring buffer or doubly linked list, not a plain array). A **monotonic stack** keeps its elements sorted by evicting anything that would break the order before pushing — used for next-greater/next-smaller-element problems; even though it's written as a nested loop, each element is pushed once and popped at most once, giving O(n) total time, not O(n^2).",
    keyPoints: [
      "Stack = LIFO (append/popLast, both O(1)); Queue = FIFO",
      "Array.removeFirst() is O(n) — real queues track a headIndex for amortized O(1) dequeue",
      "Deque needs a ring buffer or linked list for true O(1) at both ends, not a plain Array",
      "Monotonic stack evicts before pushing to stay sorted; O(n) total despite the nested loop",
      "The call stack during recursion is a real-world stack — deep recursion overflows it",
    ],
    explanation:
      "A senior answer names the O(n) trap in the naive array-backed queue and can justify the O(n) (not O(n^2)) bound on monotonic stack algorithms via the push-once-pop-once argument.",
  },
];

export default quiz;
