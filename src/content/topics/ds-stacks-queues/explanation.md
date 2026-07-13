## The problem: sometimes order isn't "first come, first served"

```swift
var history: [String] = []
history.append("open file")
history.append("type text")
history.append("delete line")
```

An undo button doesn't undo `"open file"` first — it undoes `"delete line"`, the most recent action. That's the opposite of how a checkout line works, where the first person in is the first person served. Two data structures capture these two opposite orderings: a **stack**, which always removes the most recently added item, and a **queue**, which always removes the oldest item. Both are usually built as a thin, restricted wrapper around an `Array` — the trick is *which* operations you allow.

## Stacks: last in, first out

A stack only allows two operations at one end, called the *top*: **push** adds an item there, **pop** removes and returns the item there. This ordering is called **LIFO** — last in, first out.

```swift
struct Stack<T> {
    private var items: [T] = []

    mutating func push(_ value: T) {
        items.append(value)
    }

    mutating func pop() -> T? {
        items.popLast()
    }

    func peek() -> T? {
        items.last
    }

    var isEmpty: Bool { items.isEmpty }
}
```

`push` calls `Array.append`, which is amortized O(1) — it writes to the end of the buffer. `pop` calls `popLast()`, which reads and removes the last element, also O(1) — no shifting, because removing from the *end* of an array doesn't move anything else.

Trace the undo example through this `Stack`:

```swift
var undoStack = Stack<String>()
undoStack.push("open file")     // [open file]
undoStack.push("type text")     // [open file, type text]
undoStack.push("delete line")   // [open file, type text, delete line]
undoStack.pop()                 // "delete line" -- top of stack
```

The last action pushed is the first one popped. That's exactly the undo behavior: the most recent change comes back first.

Predict: why does `Stack` push and pop from the *end* of the array, instead of `items.insert(value, at: 0)` and `items.removeFirst()`?

Answer: inserting or removing at index `0` is O(n) — every other element has to shift over by one slot. Working at the *end* of the array is O(1), since nothing else has to move. A stack built on the front of an array would still be correct, just needlessly slow.

Stacks show up anywhere "undo the last thing" or "match up nested pairs" matters: undo/redo, the call stack that tracks function calls during recursion, and checking balanced parentheses.

```swift
func isBalanced(_ s: String) -> Bool {
    var stack = Stack<Character>()
    let pairs: [Character: Character] = [")": "(", "]": "[", "}": "{"]

    for char in s {
        if "([{".contains(char) {
            stack.push(char)
        } else if let opener = pairs[char] {
            if stack.pop() != opener { return false }
        }
    }
    return stack.isEmpty
}

isBalanced("({[]})")   // true
isBalanced("([)]")     // false -- closes in the wrong order
```

Every opening bracket gets pushed. Every closing bracket must match whatever is currently on *top* of the stack — if `]` shows up but the top of the stack is `(`, the brackets are crossed and the string is invalid. If anything is left on the stack at the end, something never got closed.

## Queues: first in, first out

A queue only allows adding at one end and removing from the other: **enqueue** adds to the back, **dequeue** removes from the front. This ordering is called **FIFO** — first in, first out — like a checkout line.

The naive version reuses `Array` directly:

```swift
struct SlowQueue<T> {
    private var items: [T] = []

    mutating func enqueue(_ value: T) {
        items.append(value)          // O(1)
    }

    mutating func dequeue() -> T? {
        items.isEmpty ? nil : items.removeFirst()   // O(n) !!
    }
}
```

`enqueue` is fine — appending to the end is O(1). But `dequeue` calls `removeFirst()`, and removing from the *front* of an array forces every remaining element to shift left by one slot to close the gap. For a queue with thousands of items, every single dequeue pays that O(n) shifting cost.

The fix: don't actually remove from the front — just remember where the front *is*, and pay for the real cleanup only occasionally.

```swift
struct Queue<T> {
    private var items: [T] = []
    private var headIndex = 0

    mutating func enqueue(_ value: T) {
        items.append(value)
    }

    mutating func dequeue() -> T? {
        guard headIndex < items.count else { return nil }
        let value = items[headIndex]
        headIndex += 1
        if headIndex > items.count / 2 {         // reclaim wasted space
            items.removeFirst(headIndex)
            headIndex = 0
        }
        return value
    }
}
```

`dequeue` doesn't shift anything on the common path — it just reads `items[headIndex]` and moves `headIndex` forward by one, an O(1) operation. The array quietly accumulates "dead" slots before `headIndex` that nobody can reach anymore. Once those dead slots make up more than half the array, one O(n) cleanup (`removeFirst(headIndex)`) drops them all at once and resets `headIndex` to `0` — but that cleanup happens rarely enough that the *average* cost per dequeue is still O(1). This is the same amortized-cost idea behind `Array.append`'s occasional resize, applied to the front instead of the back.

## Deques: both ends are fair game

A **deque** (pronounced "deck", short for double-ended queue) relaxes the stack/queue rule even further: you can push and pop from *both* ends in O(1).

```swift
struct Deque<T> {
    private var items: [T] = []

    mutating func pushFront(_ value: T) { items.insert(value, at: 0) }
    mutating func pushBack(_ value: T)  { items.append(value) }
    mutating func popFront() -> T?      { items.isEmpty ? nil : items.removeFirst() }
    mutating func popBack() -> T?       { items.isEmpty ? nil : items.removeLast() }
}
```

This naive version is misleading: `pushFront`/`popFront` still call `insert(at: 0)`/`removeFirst()`, which are O(n) on a plain `Array`, for the same shifting reason as `SlowQueue` above. A real O(1)-both-ends deque needs a ring buffer or a doubly linked list underneath — the point of the type is the *interface* (four O(1) operations at either end), and Swift's standard library doesn't ship one built-in, so interview answers usually describe the ring-buffer or linked-list backing rather than hand-waving `Array`.

A deque generalizes both structures: using only `pushBack`/`popBack` gives you a stack, and using only `pushBack`/`popFront` gives you a queue.

## The monotonic stack pattern

A **monotonic stack** is a stack that always keeps its elements in sorted order (all increasing, or all decreasing) by evicting elements that would break that order *before* pushing the new one. It's the standard trick for "find the next greater/smaller element" problems.

Build it up on a concrete goal: for each temperature in a list, find how many days until a *warmer* day.

```swift
func dailyTemperatures(_ temps: [Int]) -> [Int] {
    var result = Array(repeating: 0, count: temps.count)
    var stack: [Int] = []   // stores INDICES, kept decreasing by temperature

    for i in 0..<temps.count {
        while let last = stack.last, temps[last] < temps[i] {
            result[last] = i - last
            stack.removeLast()
        }
        stack.append(i)
    }
    return result
}
```

Walk it on `[73, 74, 75, 71]`:

```swift
// i=0 (73): stack empty, push. stack: [0]
// i=1 (74): temps[0]=73 < 74 -> pop 0, result[0] = 1-0 = 1. stack empty, push 1. stack: [1]
// i=2 (75): temps[1]=74 < 75 -> pop 1, result[1] = 2-1 = 1. stack empty, push 2. stack: [2]
// i=3 (71): temps[2]=75 < 71 is false -> keep. push 3. stack: [2, 3]
// result: [1, 1, 0, 0]
```

The stack only ever holds indices whose temperatures are in decreasing order, top to bottom being smallest. The moment a new temperature is bigger than the top of the stack, that top index has found its answer — pop it, record the distance, and keep checking the new top. Each index gets pushed once and popped at most once, so despite the nested loops this runs in O(n) total, not O(n²).

## Common pitfalls

- *Using `removeFirst()` for a queue's dequeue.* It's correct but O(n) per call on a plain array — use the index-tracking approach (or a ring buffer) for a queue that stays fast at scale.
- *Forgetting to check `isBalanced`'s final `stack.isEmpty`.* A string like `"((("` never triggers a mismatch, but it also never closes — the emptiness check at the end catches unclosed openers.
- *Popping an empty stack/queue without checking.* `pop()`/`dequeue()` return optionals here on purpose; force-unwrapping them crashes the moment the structure runs dry, which happens more often than it seems in loop-driven code.

## Interview lens

If asked to implement a queue with an array, the answer interviewers want isn't "just call `removeFirst()`" — that's O(n) per dequeue, and naming that cost (and the index-tracking or ring-buffer fix) is what separates a junior answer from a mid-level one.

The monotonic stack pattern is worth recognizing by name: any "next greater element," "next smaller element," or "largest rectangle in a histogram"-shaped question is almost always a monotonic stack in disguise, and the O(n) total-time argument (each element pushed once, popped once) is the line interviewers want to hear, since the nested `while` loop looks like O(n²) at a glance.

Also be ready to name real uses beyond "it's a common interview topic": stacks back undo/redo and the function call stack during recursion; queues back task scheduling, breadth-first traversal (covered in the trees and graphs lessons), and any producer/consumer pipeline where order of arrival must be preserved.
