## The problem: someone has to free memory

Run this line:

```swift
let person = Person(name: "Ada")
```

Swift just carved out a chunk of memory to hold Ada. Every class instance you create takes up memory like this — and at some point, that memory has to be given back.

Give it back too early, and code that still uses Ada crashes. Never give it back, and your app slowly fills up with dead objects — a **memory leak**. In old Objective-C you managed this by hand, calling `retain` and `release` yourself, and forgetting one call meant a crash or a leak.

Swift automates the whole thing. The system is called **ARC** — Automatic Reference Counting. This lesson is about how it decides the exact moment an object dies.

## Watch an object live and die

Start with one line:

```swift
var a: Person? = Person(name: "Ada")
```

A `Person` object now exists in memory, and exactly one variable points at it: `a`. Swift keeps a hidden counter on the object — its **reference count**. Right now it reads 1.

Add a second variable:

```swift
var b = a
```

No new object was created. `b` points at the *same* Ada — classes are shared, not copied. The counter goes to 2.

Now remove the pointers one at a time:

```swift
a = nil   // counter: 1 — Ada still alive, b still points at her
b = nil   // counter: 0 — Ada is destroyed, right here
```

The instant the counter hits 0, Swift destroys the object. Not "sometime later when the system feels like it" — on that exact line.

## deinit: the object's last words

You can watch the destruction happen. Give the class a `deinit` — a method Swift calls automatically at the moment the object is destroyed:

```swift
class Person {
    let name: String
    init(name: String) { self.name = name }
    deinit { print("\(name) is gone") }
}
```

Now rerun the walk from above:

```swift
var a: Person? = Person(name: "Ada")
var b = a
a = nil          // prints nothing — count is still 1
b = nil          // prints "Ada is gone"
```

Because you can point at the exact line where destruction happens, ARC's cleanup is called **deterministic** — predictable, guaranteed timing. This matters for real resources: a `deinit` that closes a file or a network connection runs precisely when the object is released, so you know when the cleanup fires.

One practical flip side you'll use constantly when debugging: if a `deinit` you expect *never prints*, something still holds a strong reference to that object. That's your number-one leak clue.

## What counts as a reference?

The counter only tracks **strong references** — ordinary, default references that say "keep this object alive for me." All of these are strong, and each one bumps the count:

```swift
var solo = Person(name: "Ada")        // a variable: +1
let team = [solo]                     // stored in an array: +1
class Room { var occupant: Person? }
let room = Room()
room.occupant = solo                  // stored in a property: +1
```

Ada's count is now 3. She stays alive until *all three* go away — the variable is reassigned, the array is destroyed, the property is set to `nil`.

Two things that do **not** bump the count:

- `weak` and `unowned` references — special reference kinds that deliberately don't keep the object alive. They get their own lesson next.
- Value types. Structs and enums are *copied* when you assign them, so there's no shared object to count. ARC applies only to reference types: classes, actors, and closures.

## Where does ARC actually run?

Here's the part interviewers love: ARC is not a background process watching your app. There is no runtime service, no separate thread.

Instead, the **compiler** looks at your code and inserts the count-up and count-down operations for you, at compile time, at the points where references begin and end:

```swift
func demo() {
    let p = Person(name: "Ada")   // compiler inserts: count +1
    print(p.name)
}                                  // compiler inserts: count -1 → 0 → destroy
```

It's the same `retain`/`release` bookkeeping Objective-C programmers wrote by hand — the compiler just writes it now, and never forgets a call.

## ARC vs garbage collection

Many languages (Java, C#, Go) free memory differently: a **garbage collector** — a runtime process that periodically scans for objects nothing points at and sweeps them away in batches.

What does this mean in practice? Predict: in a garbage-collected language, when does an unreferenced object get destroyed?

Answer: *you can't know.* Whenever the collector next runs. Maybe milliseconds later, maybe seconds.

| | ARC | Garbage collection |
|---|---|---|
| When is the object freed? | The exact line the count hits 0 | Whenever the collector runs next |
| Runtime cost | Tiny +1/-1 operations spread through your code | Periodic scan pauses |
| Two objects pointing at each other | **Never freed** — your job to prevent | Collected automatically |

That last row is ARC's one blind spot, and it's the trade you accept for predictable timing and no pauses.

## The blind spot: objects pointing at each other

Watch the counter fail:

```swift
class Person { var pet: Dog? ;  deinit { print("person gone") } }
class Dog    { var owner: Person? ;  deinit { print("dog gone") } }

var ada: Person? = Person()   // Person count: 1
var rex: Dog?    = Dog()      // Dog count: 1
ada?.pet = rex                // Dog count: 2
rex?.owner = ada              // Person count: 2
```

Now release both variables:

```swift
ada = nil   // Person count: 1 — the Dog's `owner` property still points at her
rex = nil   // Dog count: 1 — the Person's `pet` property still points at him
```

Neither `deinit` ever prints. No variable in your code can reach these two objects anymore — but they keep *each other's* counts at 1 forever. This is a **retain cycle**, and it's the single most common memory leak in Swift. The fix (`weak` and `unowned`) is the next lesson; here it's enough to recognize the disease.

## Seeing it: the object graph

Picture every live object as a dot, and every strong reference as an arrow between dots. An object survives as long as some chain of arrows reaches it from something alive in your running code — a local variable, a global, the screen's current view controller.

A retain cycle is two dots whose arrows point at each other after every outside arrow is gone: unreachable from your code, but never freed.

You don't have to imagine this. Xcode's **Memory Graph Debugger** (the small branching icon in the debug bar) draws the real graph of your running app, so you can click a leaked object and see exactly which strong reference is keeping it alive.

## Common pitfalls

- **Expecting ARC to manage structs.** Assigning a struct copies it; there's no count. Only classes, actors, and closures are reference-counted.
- **A `deinit` that never fires.** Not an ARC bug — something still strongly references the object, usually a retain cycle. Check the Memory Graph Debugger.
- **Thinking ARC is a garbage collector.** It isn't: no runtime scanning, no pauses, and — unlike a GC — no automatic cycle cleanup.

## Interview lens

If asked "what is ARC?", the strong answer has three parts: it's *compile-time inserted* retain/release calls (not a runtime process), it counts *strong references to class instances only*, and it destroys the object *immediately* when the count hits zero, running `deinit` on that exact line.

The classic follow-up is "how is that different from garbage collection?" Say: ARC is deterministic and pause-free, but it cannot reclaim reference cycles — a tracing garbage collector can. That's why avoiding retain cycles with `weak` and `unowned` is the programmer's responsibility in Swift.

If the interviewer asks how you'd *find* a leak: mention that a `deinit` that never runs is the tell, and that the Memory Graph Debugger shows the strong reference chain keeping the object alive. Mentioning the tool signals real-world experience, not just theory.
