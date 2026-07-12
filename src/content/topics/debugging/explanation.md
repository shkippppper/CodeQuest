## The problem: print statements don't scale

You add this to chase a bug:

```swift
func applyDiscount(to price: Double, code: String) -> Double {
    print("price:", price, "code:", code)   // temporary
    ...
}
```

It works, once. But now you have to remember to delete it, it only shows you *these two values at this one line*, and if the bug only happens on the 200th call with a specific `code`, you're scrolling through 199 useless print lines to find it.

Xcode ships a real debugger under the hood, **LLDB** — a program that pauses your running app at an exact line and lets you inspect and change its state interactively, no recompiling needed. This lesson is about using it instead of `print`.

## Stopping at a line: breakpoints

Click the line-number gutter next to `applyDiscount`'s first line in Xcode, and a blue arrow appears — a **breakpoint**. Run the app, call the function, and execution freezes right there, before that line runs. The app is still alive, just paused: every variable in scope is inspectable in the sidebar, exactly as it existed at that instant.

That's a plain breakpoint — it fires every single time the line executes. Two refinements make it fire only when you actually care.

### Conditional breakpoints: stop only when it matters

Right-click the breakpoint and add a condition:

```
code == "STUDENT50"
```

Now the app runs normally through 199 other discount codes and pauses only when `code` equals `"STUDENT50"` — no more manually stepping past irrelevant hits.

### Symbolic breakpoints: stop on a name, not a line

Sometimes you don't know *which line* to click — you want to break the instant a specific function is called anywhere in the app, including in a library you don't have the source for. A **symbolic breakpoint** does that by name instead of by location:

```
Symbol: -[UIViewController viewDidAppear:]
```

Add that as a symbolic breakpoint and the app pauses every time *any* view controller's `viewDidAppear` runs — useful for tracking down which screen is appearing unexpectedly, without opening a single line of your own code.

## The console: talking to the paused app

Once stopped, Xcode's debug console gives you a prompt. Two commands do almost everything.

```
(lldb) po price
99.989999999999995
```

`po` — **print object** — evaluates a Swift expression and prints its description. That trailing `.999...` is a floating-point representation quirk you'd never spot from a `print` statement buried in old console output; here it jumps out immediately.

`po` isn't limited to reading — it can run any expression, including one that changes state:

```
(lldb) expr price = 50.0
(lldb) po price
50.0
```

`expr` evaluates and executes arbitrary code in the paused context. Setting `price` to `50.0` mid-debug lets you test "what would happen if this value were different" without stopping the app, changing the source, and rerunning from scratch. `po` is actually shorthand for `expr -O --`, so both commands share the same underlying evaluator.

Predict: after running `expr price = 50.0` and then resuming, does `applyDiscount` return based on `99.99` or `50.0`?

Answer: `50.0`. `expr` mutated the real variable in the running process — the function continues with whatever value is in memory at resume time, not what the source code says.

## Moving through the paused code

A handful of buttons (or LLDB commands) control execution once stopped:

```
(lldb) next      // step over: run this line, don't enter function calls it makes
(lldb) step      // step into: if this line calls a function, go inside it
(lldb) finish     // step out: run until the current function returns
(lldb) continue   // resume normal execution until the next breakpoint
```

`next` is what you want most of the time — it treats a function call on the current line as a black box and just moves to the next line in the function you're already in. `step` is for when that black box is exactly what you're trying to debug.

## Watchpoints: catching who changes a value

A breakpoint stops on a *line*. Sometimes the bug is "this property changes to the wrong value somewhere, and I don't know which line does it" — you don't have a line to put a breakpoint on. A **watchpoint** stops execution the moment a specific piece of memory changes, no matter which line changes it.

```
(lldb) watchpoint set variable self.balance
Watchpoint 1: addr = 0x1007a4018 size = 8
```

Now run the app normally. The instant *any* code anywhere writes to `self.balance` — a typo'd assignment three files away, a race from a background thread, anything — LLDB stops and shows you exactly which line just wrote the new value. This finds the "something is silently corrupting my state" class of bug that a regular breakpoint can't, because you'd need to already know the culprit line to put a breakpoint there.

## Seeing the screen, not just the values

Some bugs aren't about a wrong value — they're about a view rendering in the wrong place, or a view you didn't expect existing at all, hidden behind another one. For that, values in a debugger sidebar don't help; you need to see the layout itself.

Xcode's **view hierarchy debugger** — triggered by the "Debug View Hierarchy" button while the app is paused (or running) — freezes the screen and renders it as a 3D exploded stack, every view pulled apart along the z-axis so overlapping views become visible as separate layers you can rotate and click through.

Click any layer in that 3D view and Xcode highlights the matching line of code that created it, along with its frame, constraints, and class name in the sidebar — turning "why is this label invisible" into "oh, it's behind this other view with the wrong z-order" in a few seconds, instead of guessing from a static screenshot.

## Common pitfalls

- **Leaving conditional breakpoints in place after the bug is fixed.** They silently slow down every run through that code path; remove them once done.
- **Forgetting `expr` mutates real state.** Setting a variable to test a branch, then forgetting you did it, can make the rest of the debugging session make no sense.
- **Reaching for `print` on a bug that needs a watchpoint.** If you don't know *which* line changes a value, no amount of print statements at guessed locations will find it as fast as one watchpoint.

## Interview lens

If asked how you'd debug an intermittent crash without an obvious repro line, the strong answer is a **conditional breakpoint** narrowed to the suspicious input, or a **watchpoint** if the bug is "some value is wrong and I don't know where it's set" — naming both shows you know the difference between "stop at a place" and "stop at a change."

If asked to explain `po` vs `expr`, say `po` is really `expr -O --` under the hood — same evaluator, `po` just formats the result as a description. The deeper point interviewers want is that both can *mutate* the running process, not just read it, which is a powerful and dangerous thing to know about.

For UI bugs, mentioning the **view hierarchy debugger** by name — and that it shows a 3D exploded view you can click through to jump to source — signals you've actually used it to fix a real layout bug, not just read the menu item exists.
