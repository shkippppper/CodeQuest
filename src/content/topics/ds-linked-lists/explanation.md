## The problem: inserting in the middle of an array is expensive

```swift
var a = [1, 2, 4, 5]
a.insert(3, at: 2)   // shifts 4 and 5 over — O(n)
```

Every time you insert into the middle of an `Array`, Swift has to slide every element after it one slot to the right. For a huge array with frequent middle-insertions, that shifting adds up. A **linked list** is a data structure built to make that specific operation cheap: O(1) once you already have a pointer to the spot, because nothing has to move — you just rewire a couple of pointers.

## Building one in Swift: value vs reference

Start with the smallest possible node:

```swift
class Node<T> {
    var value: T
    var next: Node<T>?
    init(value: T, next: Node<T>? = nil) {
        self.value = value
        self.next = next
    }
}
```

A `Node` holds one piece of data and a pointer, `next`, to the node after it. Chain a few together by hand:

```swift
let third = Node(value: 3)
let second = Node(value: 2, next: third)
let first = Node(value: 1, next: second)
// first -> second -> third -> nil
```

`first.next` points at `second`, `second.next` points at `third`, and `third.next` is `nil` — that `nil` marks the end of the list.

Predict: `Node` is declared as a `class`. What would break if it were a `struct` instead?

Answer: nothing would *compile*-error, but the list would stop being a real linked list. Structs are **value types** — assigning or passing one copies it. If `second` were a struct, writing `first.next = second` would copy `second` into `first`, and any later mutation to the original `second` wouldn't be seen through `first.next`. A linked list needs many nodes to *share* and *rewire* pointers to the same objects, which only works with a **reference type** — a class, where variables point at one shared instance instead of copying it.

```swift
class LinkedList<T> {
    var head: Node<T>?

    func push(_ value: T) {
        head = Node(value: value, next: head)
    }
}
```

`push` builds a new node whose `next` is the current `head`, then makes that new node the head. This is O(1): no shifting, just two pointer writes (the new node's `next`, and `head` itself).

## Singly vs doubly linked lists

The list above is **singly linked** — each node only knows what comes *after* it. That's enough for forward traversal, but it means you can't walk backward, and removing a node requires you to already be holding the *previous* node (so you can rewire its `next`).

A **doubly linked list** adds a second pointer, `prev`, going the other direction:

```swift
class DNode<T> {
    var value: T
    var next: DNode<T>?
    weak var prev: DNode<T>?
    init(value: T) { self.value = value }
}
```

Now every node can walk both ways, and — critically — a node can remove *itself* in O(1), because it already knows both its neighbors and can splice them together directly, without a separate search for "the node before me."

The `prev` pointer is marked `weak` on purpose. If it were a strong reference, every pair of neighboring nodes would point at each other strongly (`next` forward, `prev` backward) — a retain cycle, covered in the ARC lesson. `weak` breaks that cycle: the list is still walkable both directions, but `prev` doesn't keep a node alive on its own.

The trade-off is memory and bookkeeping: a doubly linked list stores one extra pointer per node and every insert/remove has to update two links instead of one. Swift's real-world `Array` is contiguous, not linked, for exactly this reason — arrays win on cache locality and index access, and linked lists only pay off when you need O(1) insert/remove at a known position without shifting.

## Reversal

This is the single most common linked-list interview question. Start with the goal: turn `1 -> 2 -> 3 -> nil` into `3 -> 2 -> 1 -> nil`, using O(1) extra space — no new nodes, just rewired pointers.

```swift
func reverse<T>(_ head: Node<T>?) -> Node<T>? {
    var prev: Node<T>? = nil
    var current = head
    while current != nil {
        let next = current!.next   // save before we overwrite it
        current!.next = prev       // flip the pointer
        prev = current              // advance prev
        current = next              // advance current
    }
    return prev
}
```

Walk it one node at a time on `1 -> 2 -> 3 -> nil`:

```swift
// start:  prev = nil,        current = 1 -> 2 -> 3
// step 1: next = 2;  1.next = nil;  prev = 1;  current = 2
//         list so far: nil <- 1     remaining: 2 -> 3
// step 2: next = 3;  2.next = 1;    prev = 2;  current = 3
//         list so far: nil <- 1 <- 2     remaining: 3
// step 3: next = nil; 3.next = 2;   prev = 3;  current = nil
//         list so far: nil <- 1 <- 2 <- 3
// loop ends (current == nil); return prev, which is node 3
```

The trap that catches people: writing `current!.next = prev` *before* saving `next` into a temporary. Do that and you've already overwritten the only pointer that told you where to go next — the rest of the original list becomes unreachable. Saving `next` first is what makes the rewiring safe.

This runs in O(n) time — one pass — and O(1) extra space, since it only rewires existing pointers rather than allocating new nodes.

## Cycle detection

A linked list is supposed to end in `nil`. But a bug (or an adversarial interview question) can make a node's `next` point back to an earlier node, creating a loop that never terminates:

```swift
// 1 -> 2 -> 3 -> 4 -> back to 2 (not nil!)
```

Walking this with a simple `while current != nil` loop would spin forever. The standard fix is **Floyd's cycle detection** — also called the **tortoise and hare** — using two pointers that move at different speeds:

```swift
func hasCycle<T>(_ head: Node<T>?) -> Bool {
    var slow = head
    var fast = head
    while fast != nil && fast?.next != nil {
        slow = slow?.next          // moves 1 step
        fast = fast?.next?.next    // moves 2 steps
        if slow === fast { return true }
    }
    return false
}
```

`slow` advances one node per iteration; `fast` advances two. Predict: if there's no cycle, what stops the loop? And if there is one, why must `slow` and `fast` ever land on the same node?

Answer: with no cycle, `fast` simply reaches `nil` first (it's moving twice as fast) and the loop condition fails — clean termination. With a cycle, both pointers are trapped circling the loop forever, and because `fast` gains on `slow` by exactly one node's distance every iteration, the gap between them shrinks by 1 each time — it's mathematically guaranteed to hit 0, meaning they land on the same node, within at most one full trip around the cycle.

This runs in O(n) time and O(1) extra space — no `Set` of visited nodes needed, which is the whole appeal over the "track everything I've seen" approach.

Note the `===` in `slow === fast`, not `==`. `Node` is a class, so `===` checks **identity** — are these two variables pointing at the *very same* object — rather than comparing values. That distinction is exactly the value-vs-reference point from earlier in this lesson showing up in practice.

## Common problems

A handful of patterns cover most linked-list interview questions, and they mostly reuse the two-pointer idea from cycle detection:

- **Find the middle node** — a slow/fast pair where `fast` moves twice as fast; when `fast` reaches the end, `slow` is sitting at the middle. Same shape as cycle detection, different stopping condition.
- **Detect and locate the start of a cycle** — after `slow` and `fast` meet inside a loop, resetting one pointer to `head` and advancing both one step at a time makes them meet again exactly at the cycle's starting node. It's a clever bit of pointer arithmetic worth memorizing rather than re-deriving under pressure.
- **Merge two sorted lists** — walk both lists with one pointer each, always splicing the smaller current node onto the result, exactly like the merge step of merge sort but on linked nodes instead of array slices.
- **Remove the nth node from the end** — advance one pointer `n` steps ahead first, then move both pointers together; when the lead pointer hits the end, the trailing pointer is at the node to remove. One pass, no need to know the list's length up front.
- **Detect a palindrome list** — find the middle (slow/fast), reverse the second half in place, then compare the two halves node by node.

## Common pitfalls

- **Losing the rest of the list during reversal.** Overwriting `next` before saving it into a temporary orphans everything after that node. Always save `next` first.
- **Off-by-one errors walking near the end.** `fast?.next != nil` (checking `next`, not `fast` itself) is what prevents force-unwrapping `nil` inside `fast?.next?.next`. Get the loop guard right or it crashes.
- **Forgetting `weak` on `prev` in a doubly linked list.** Two strong pointers pointing at each other (`next` and `prev`) is a textbook retain cycle — nodes leak forever once the list itself is deallocated.

## Interview lens

If asked "why use a linked list over an array?", the answer is about *where* the cost lives: arrays give O(1) index access but O(n) middle insert/remove because of shifting; linked lists flip that — O(n) to reach a position (no random access, must walk from `head`), but O(1) insert/remove once you're already at a node, because it's just pointer rewiring. Arrays also win on cache locality since their memory is contiguous, so in practice arrays are usually preferred unless you specifically need frequent middle mutation with a known pointer.

Reversal and cycle detection are both essentially guaranteed to come up. For reversal, narrate the three-pointer dance out loud (`prev`, `current`, `next`) and explicitly say you save `next` *before* overwriting `current.next` — interviewers watch for that exact bug. For cycle detection, name it as Floyd's / tortoise-and-hare, state the O(n) time / O(1) space bound, and be ready for the follow-up about finding the cycle's *start*, not just detecting one exists.

The value-vs-reference point is a favorite curveball: explain that `Node` must be a class (reference type) because nodes need to be shared and mutated through multiple pointers — a struct would copy on assignment and break the sharing a linked list depends on.
