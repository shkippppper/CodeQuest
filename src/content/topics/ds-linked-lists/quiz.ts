import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ll-class-vs-struct",
    type: "mcq",
    prompt: "Why must a linked list `Node` be a `class`, not a `struct`?",
    options: [
      "Classes are reference types, so multiple pointers can share and mutate the same node; a struct would copy on assignment",
      "Structs can't hold generic values",
      "Classes are faster to allocate",
      "Structs can't have optional properties",
    ],
    answer: 0,
    explanation:
      "A linked list depends on several places pointing at the *same* node so that rewiring `next` is visible everywhere. Structs are value types and copy on assignment, which would break that sharing — only a reference type (class) gives you the shared, mutable identity a node needs.",
  },
  {
    id: "ll-insert-vs-array",
    type: "mcq",
    prompt: "Compared to inserting into the middle of an Array, why is inserting into a linked list (given a pointer to the spot) O(1)?",
    options: [
      "No elements need to shift — you just rewire a couple of `next` pointers instead of moving memory",
      "Linked lists are stored contiguously so the CPU can vectorize the insert",
      "Linked lists don't actually store all the elements",
      "Because Swift compiles linked lists to arrays anyway",
    ],
    answer: 0,
    explanation:
      "Array middle-insert is O(n) because every later element must shift over in the contiguous buffer. A linked-list insert just points two `next` references at the new node — no shifting, so it's O(1) once you're already at the insertion point.",
  },
  {
    id: "ll-reverse-predict",
    type: "predict",
    prompt: "This reversal loop is buggy. What goes wrong on a 3-node list `1 -> 2 -> 3`?",
    code: `var prev: Node<Int>? = nil
var current = head
while current != nil {
    current!.next = prev   // overwritten BEFORE saving it
    let next = current!.next
    prev = current
    current = next
}`,
    options: [
      "The rest of the list is lost immediately — `next` is read AFTER `current.next` was already overwritten, so it's always `prev`, not the real next node",
      "It works fine, just less efficient",
      "It throws a runtime error",
      "It reverses only the first two nodes",
    ],
    answer: 0,
    explanation:
      "The order matters: `next` must be saved from `current!.next` **before** you overwrite `current!.next = prev`. Here the overwrite happens first, so `next` always reads back `prev` — the loop only ever sees node 1 and then `current` becomes `prev` (non-nil forever isn't quite it, but the chain to nodes 2 and 3 is severed on the very first iteration), losing the rest of the list.",
  },
  {
    id: "ll-cycle-fill",
    type: "fill",
    prompt: "The two-pointer technique for detecting a cycle in a linked list, where one pointer moves twice as fast as the other, is called Floyd's ___ and ___ algorithm.",
    answers: ["tortoise and hare", "tortoise-and-hare"],
    hint: "Named after the fable — one pointer is slow, one is fast.",
    explanation:
      "Floyd's tortoise and hare: `slow` moves one node per step, `fast` moves two. If there's a cycle they're guaranteed to meet inside it; if not, `fast` reaches `nil` first.",
  },
  {
    id: "ll-cycle-why",
    type: "mcq",
    prompt: "In cycle detection, why does `slow` (1 step) and `fast` (2 steps) MUST eventually land on the same node if a cycle exists?",
    options: [
      "The gap between them shrinks by exactly 1 node every iteration once both are inside the cycle, so it must hit 0",
      "Swift automatically detects cycles and stops the pointers",
      "They start at different nodes",
      "It's not guaranteed — sometimes they never meet",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Once both pointers are circling the same finite loop, `fast` gains one node on `slow` every iteration (moves 2 vs 1). A gap that shrinks by 1 each step and can't go negative is mathematically guaranteed to hit 0 — meaning the pointers coincide — within at most one lap of the cycle.",
  },
  {
    id: "ll-identity-fill",
    type: "fill",
    prompt: "To check whether two class references point at the exact same object (used when comparing `slow === fast`), you use the ___ operator, not `==`.",
    answers: ["identity", "==="],
    hint: "Three equals signs.",
    explanation:
      "`===` checks reference identity — are these two variables pointing at the very same instance — while `==` (if defined) compares values. Node comparisons in cycle detection need identity, since two distinct nodes could coincidentally hold equal values.",
  },
  {
    id: "ll-doubly-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about doubly linked lists.",
    options: [
      "Each node has both a `next` and a `prev` pointer",
      "The `prev` pointer should typically be `weak` to avoid a retain cycle",
      "A doubly linked list can remove itself from the list in O(1) given just that node",
      "Doubly linked lists always use less memory than singly linked lists",
    ],
    answers: [0, 1, 2],
    explanation:
      "Doubly linked nodes have both pointers, `prev` should be `weak` (otherwise two neighboring nodes strongly reference each other — a retain cycle), and a node can splice itself out in O(1) because it already knows both neighbors. The memory claim is false: the second pointer per node costs *more* memory than a singly linked list, not less.",
  },
  {
    id: "ll-remove-nth-senior",
    type: "mcq",
    prompt: "How do you remove the nth node from the end of a singly linked list in one pass, without knowing the list's length up front?",
    options: [
      "Advance a lead pointer n steps first, then move a trailing pointer and the lead pointer together until the lead hits the end; the trailing pointer is now at the node to remove",
      "You must always do two passes — first to count length, then to remove",
      "Reverse the list first, remove the nth node from the front, then reverse back",
      "It's impossible in O(n) time",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Give one pointer an n-step head start, then advance both pointers together one step at a time. When the lead pointer reaches the end, the trailing pointer is exactly n nodes behind it — at the node to remove. This is a single pass, O(n) time, O(1) space.",
  },
  {
    id: "ll-flashcard",
    type: "flashcard",
    prompt:
      "Explain singly vs doubly linked lists, why nodes must be classes, and how reversal and cycle detection work. Answer aloud, then reveal.",
    modelAnswer:
      "A linked list is built from **`Node`** objects, each holding a value and a `next` pointer to the following node; it must be a **class** (reference type) because multiple pointers need to share and rewire the same node — a struct would copy on assignment and break that sharing. A **singly linked** list only points forward (O(n) to reach a position, O(1) insert/remove once at a node); a **doubly linked** list adds a `prev` pointer for backward traversal and O(1) self-removal, at the cost of extra memory and a `weak prev` (otherwise neighboring nodes strongly reference each other, a retain cycle). **Reversal**: walk with three pointers — `prev`, `current`, `next` — saving `current.next` into `next` *before* overwriting `current.next = prev`, then advancing all three; O(n) time, O(1) space. **Cycle detection** (Floyd's tortoise and hare): a `slow` pointer moves 1 step, `fast` moves 2; if there's no cycle `fast` reaches `nil` first, if there is one the gap between them shrinks by 1 each iteration so they're guaranteed to meet — O(n) time, O(1) space, using `===` for reference identity. Related patterns: slow/fast for the middle node, n-step-lead-then-together for removing the nth-from-end node, reverse-and-compare for palindrome checks.",
    keyPoints: [
      "Node must be a class — reference sharing, not value copying",
      "Singly: forward only, O(n) to reach a node. Doubly: adds prev, weak to avoid retain cycle",
      "Reversal: save next before overwriting current.next, O(n)/O(1)",
      "Cycle detection: slow/fast pointers (Floyd's), gap shrinks by 1/iteration, O(n)/O(1)",
      "=== checks identity, not value equality",
    ],
    explanation:
      "Senior answers explain the value-vs-reference reason a Node must be a class, narrate the three-pointer reversal correctly (save-before-overwrite), and justify why Floyd's algorithm is guaranteed to terminate with a meeting point.",
  },
];

export default quiz;
