## The problem: for-in works on arrays, but how?

This compiles and runs fine:

```swift
for number in [1, 2, 3] {
    print(number)
}
```

Now write your own type and try the same loop:

```swift
struct Stack<Element> {
    private var items: [Element] = []
    mutating func push(_ item: Element) { items.append(item) }
}

let s = Stack<Int>()
for item in s { }   // error: type 'Stack<Int>' does not conform to protocol 'Sequence'
```

`for-in` isn't special-cased for arrays. It works for *any* type that advertises "I know how to hand out my elements one at a time" — and `Stack` doesn't advertise that yet. This lesson is about the protocol that makes `for-in` work, and how to opt your own types into it.

## IteratorProtocol: one method, next()

The whole mechanism boils down to a single method:

```swift
protocol IteratorProtocol {
    associatedtype Element
    mutating func next() -> Element?
}
```

An **iterator** is any type with a `next()` method that hands back one element per call, and `nil` once there's nothing left. That's it — no index, no count, just "give me the next thing."

Build one by hand for an array of three numbers:

```swift
struct CountingIterator: IteratorProtocol {
    var current = 1
    let max = 3
    mutating func next() -> Int? {
        guard current <= max else { return nil }
        defer { current += 1 }
        return current
    }
}
```

Call it manually and watch it work:

```swift
var it = CountingIterator()
print(it.next())   // Optional(1)
print(it.next())   // Optional(2)
print(it.next())   // Optional(3)
print(it.next())   // nil — done
```

Each call mutates `current` and returns the value *before* incrementing, thanks to `defer`. Once `current` passes `max`, every future call returns `nil`.

## Sequence: what makes for-in accept a type

An iterator alone doesn't get you `for-in` — you need one more piece. **`Sequence`** is the protocol that says "I can produce an iterator on demand":

```swift
protocol Sequence {
    associatedtype Iterator: IteratorProtocol
    func makeIterator() -> Iterator
}
```

Conform `Stack` to it by returning a fresh iterator each time:

```swift
struct StackIterator<Element>: IteratorProtocol {
    var items: [Element]
    mutating func next() -> Element? {
        guard !items.isEmpty else { return nil }
        return items.removeLast()
    }
}

extension Stack: Sequence {
    func makeIterator() -> StackIterator<Element> {
        StackIterator(items: items)
    }
}
```

Now this compiles:

```swift
var s = Stack<Int>()
s.push(1); s.push(2); s.push(3)
for item in s {
    print(item)   // 3, 2, 1 — last pushed, first out
}
```

Under the hood, `for-in` desugars to exactly what you did by hand a moment ago: it calls `makeIterator()` once, then calls `next()` in a loop until it gets `nil`. Writing `for item in s` is shorthand for that loop — nothing more.

Conforming to `Sequence` is also what unlocks the free functions you already use every day on arrays — `map`, `filter`, `reduce`, `contains`, `first(where:)` — because they're all written once, generically, against `Sequence`, not reimplemented per collection type.

## Custom iterators for things that aren't collections

The elements don't need to come from a stored array at all — `next()` can compute a value on the fly. This is where iterators earn their keep: sequences that are infinite, or that would be wasteful to fully build in memory.

```swift
struct Fibonacci: Sequence, IteratorProtocol {
    var current = 0, next_ = 1
    mutating func next() -> Int? {
        defer { (current, next_) = (next_, current + next_) }
        return current
    }
}
```

Here `Fibonacci` conforms to both protocols at once — a common shortcut when the type *is* its own iterator. There's no array anywhere; each call to `next()` computes the next Fibonacci number from the previous two.

Predict before running this: what happens if you write `for n in Fibonacci() { print(n) }` with no `break`?

Answer: it never stops. `next()` always returns a value — it's an infinite sequence — so the loop runs forever unless you bail out yourself, typically with `.prefix(_:)`:

```swift
for n in Fibonacci().prefix(6) {
    print(n)   // 0, 1, 1, 2, 3, 5
}
```

`prefix` wraps the sequence and stops asking for more elements after six, which is the only reason this terminates.

## Lazy sequences: deferring the work

Chain a few operations on a plain array and something wasteful happens under the hood:

```swift
let result = [1, 2, 3, 4, 5]
    .map { n -> Int in print("map \(n)"); return n * 2 }
    .filter { n -> Bool in print("filter \(n)"); return n > 4 }
    .first!
```

Predict: how many times does "map" print before "filter" prints anything?

Answer: all five — `map` runs to completion, building a whole new 5-element array, *before* `filter` even starts. Every intermediate step allocates a full array, even though you only wanted the first matching value.

Insert `.lazy` and the order flips:

```swift
let result = [1, 2, 3, 4, 5]
    .lazy
    .map { n -> Int in print("map \(n)"); return n * 2 }
    .filter { n -> Bool in print("filter \(n)"); return n > 4 }
    .first!
// prints: map 1, filter 2, map 2, filter 4, map 3, filter 6
```

`.lazy` turns the chain into a wrapped sequence that computes elements one at a time, on demand, instead of eagerly building an intermediate array at each step. `map` runs on `1`, immediately hands that one value to `filter`, and only produces `2` if `filter` asks for it. As soon as `first` finds a match, the whole chain stops — the remaining elements of the original array are never touched.

This matters most on large or unbounded sequences: `.lazy` is the difference between transforming a million-element array three times over and transforming just the handful of elements you actually needed.

## Common pitfalls

- **Forgetting `Sequence` is single-pass by contract, even when your storage isn't.** Some iterators (like ones reading a file) can only be walked once; calling `for-in` on the same sequence value twice may not restart from the beginning unless `makeIterator()` explicitly resets state.
- **Iterating an infinite sequence without `prefix` or a `break`.** `Fibonacci()` alone in a `for-in` never terminates — always bound it.
- **Assuming `.lazy` is free.** It defers work and avoids intermediate storage, but re-evaluates the chain each time you iterate; if you need the result multiple times, materialize it once with `Array(...)`.

## Interview lens

If asked "how does `for-in` work under the hood," the concise answer is: it calls `makeIterator()` once to get an `IteratorProtocol` value, then calls `next()` in a loop until it returns `nil` — `for-in` is sugar for that loop, nothing magic.

If asked to write a custom iterable type, the two-piece answer is what interviewers are listening for: implement `next() -> Element?` on something conforming to `IteratorProtocol`, then conform the collection to `Sequence` by returning that iterator from `makeIterator()`. Mentioning that a type can conform to both protocols at once for stateful, on-the-fly sequences (like `Fibonacci`) shows you understand iterators aren't just wrappers around stored arrays.

If the conversation turns to performance, bring up `.lazy` unprompted: chaining `map`/`filter`/`reduce` on a large array builds a full intermediate array at every step, while `.lazy` computes one element through the whole chain at a time and stops as soon as the consumer (like `first` or a `break`) stops asking.
