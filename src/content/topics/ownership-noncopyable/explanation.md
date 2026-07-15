## The problem: a copy is sometimes a bug

Here's an ordinary struct that wraps an open file:

```swift
struct FileHandle {
    let fd: Int32
    func close() { /* release the OS file descriptor */ }
}
```

Now watch what value types do when you assign them:

```swift
let a = FileHandle(fd: 7)
let b = a          // a's contents are copied into b
a.close()
b.close()          // closes fd 7 a SECOND time
```

`a` and `b` are two independent copies of the same struct — same `fd: 7` inside each. So `close()` runs twice on the *same* operating-system file. That's a real bug: a double-close can corrupt unrelated files that reused that descriptor number.

The root cause is that `FileHandle` models a **unique resource** — a thing that exactly one owner should hold and release. A file handle, a lock, a database connection, a hardware buffer: for all of these, an accidental copy means two owners fighting over one resource. Value types copy freely, and here that freedom is the danger.

This lesson is about telling the compiler "this type must never be copied," and the ownership rules that come with that.

## ~Copyable: switch the copy off

By default every Swift type is copyable. You opt out with `~Copyable`:

```swift
struct FileHandle: ~Copyable {
    let fd: Int32
}
```

The `~` means "not." So `~Copyable` reads as "not copyable." The type still behaves like a normal struct in most ways — it has stored properties, methods, initializers — but the compiler now refuses to duplicate it behind your back.

Watch the earlier bug become a compiler error:

```swift
let a = FileHandle(fd: 7)
let b = a          // error: 'a' is consumed here...
print(a.fd)        // ...but used again here
```

The assignment `let b = a` no longer *copies* `a`. There is nothing to copy — copying is forbidden. So the compiler treats it as a **move** instead: the value leaves `a` and now lives in `b`. Touching `a` afterward is an error, because `a` is empty.

## One owner at a time

That move behavior is the heart of ownership. A noncopyable value has exactly **one owner** at any moment — one binding that holds it. Assignment doesn't clone the value; it hands ownership over and leaves the source unusable.

```swift
let a = FileHandle(fd: 7)   // a owns the handle
let b = a                   // ownership MOVES to b; a is now invalid
```

After that second line, `b` is the sole owner. `a` is not "a copy that's also valid" and not "nil" — it's a binding the compiler has marked as consumed, and any use of it fails to compile.

Contrast that with an ordinary copyable struct, where `let b = a` leaves *both* usable because each holds its own copy. Noncopyable types trade that convenience for a guarantee: there is never more than one live handle to the resource.

## Passing to a function: borrowing vs consuming

If assignment moves the value, how do you pass a noncopyable value into a function without losing it? You choose one of two ownership conventions on the parameter.

A **borrowing** parameter takes *temporary read access*. The function reads the value, and the caller keeps ownership the whole time:

```swift
func peek(_ f: borrowing FileHandle) {
    print(f.fd)      // may read f
}

let a = FileHandle(fd: 7)
peek(a)              // a is only borrowed...
print(a.fd)          // ...so a is still valid here
```

Think of `borrowing` as lending your book to a friend to read at the table: they use it, they hand it back, you still own it.

A **consuming** parameter *takes ownership*. The value moves into the function, and the caller can't use it afterward:

```swift
func take(_ f: consuming FileHandle) {
    // f is owned by this function now
}

let a = FileHandle(fd: 7)
take(a)              // ownership moves INTO take
print(a.fd)          // error: 'a' was consumed by the call above
```

Here you gave the book away. `take` owns `a` now; the caller's binding is dead.

### Watch a consuming call destroy the value

Give the type a `deinit` so you can see exactly when the resource is released:

```swift
struct FileHandle: ~Copyable {
    let fd: Int32
    deinit { print("closing fd \(fd)") }
}

func take(_ f: consuming FileHandle) {
    print("inside take")
}                    // f's owner (this function) ends HERE
```

Now predict: with this call, in what order do the two lines print?

```swift
let a = FileHandle(fd: 7)
take(a)
print("after take")
```

Answer:

```output
inside take
closing fd 7
after take
```

`take` became the owner, so when `take` returns, the value has no owner left and its `deinit` fires *right there* — before `after take`. The resource is released the moment the last owner's lifetime ends.

## The consume operator: end a binding on purpose

Sometimes you want to move a value out and mark the old binding dead *without* passing it to a `consuming` function. The `consume` operator does exactly that:

```swift
let a = FileHandle(fd: 7)
let b = consume a    // explicitly move a's value into b; a is now invalid
print(a.fd)          // error: 'a' was consumed by 'consume a'
```

`consume a` ends `a`'s lifetime and yields its value, which you move into `b`. It's the explicit form of the move that assignment did implicitly earlier — spelling it out makes the intent obvious and lets you end a value's life at a precise point.

## deinit on a struct

Notice something the earlier snippets slipped in: `FileHandle` is a **struct** with a `deinit`. Ordinary copyable structs cannot have a `deinit` — because they're copied around, there's no single "last owner" whose death should trigger cleanup.

A noncopyable struct *can* have a `deinit`, precisely because it has exactly one owner:

```swift
struct FileHandle: ~Copyable {
    let fd: Int32
    deinit { close(fd) }     // runs when the single owner's lifetime ends
}
```

When the sole owner goes away — a binding leaves scope, a `consuming` function returns, or you `consume` it — the `deinit` runs at that exact point. That gives you **deterministic** cleanup (you can name the line where it happens) for value types, which previously only classes could get. A file closes, a lock releases, a connection tears down, right when the owner dies — no leaks, no double-frees.

## When to reach for it

Noncopyable types are a specialist tool, not a new default. Reach for `~Copyable` when:

- **You wrap a unique resource** — a file descriptor, a mutex, a socket, a buffer of hardware memory — where a stray copy would mean two owners releasing the same thing.
- **You want to forbid copies for correctness** — the type semantically represents *the one and only* instance of something, and duplicating it should be a compile error, not a silent bug.
- **You're chasing performance** — moving a large value is just handing over ownership; suppressing copies avoids duplicating its storage on every assignment.

For everyday value types — a `Point`, a `User`, a `Color` — you *want* free copying, and `~Copyable` would only get in your way. Use it where uniqueness is part of the type's meaning.

## Common pitfalls

- **Using a value after it moved.** `let b = a` (or a `consuming` call, or `consume a`) leaves `a` invalid; touching it is a compile error. Fix: read from the new owner instead.
- **Choosing `consuming` when you only needed to read.** If the function just inspects the value, make the parameter `borrowing` so the caller keeps ownership.
- **Expecting a plain struct's `deinit` to work.** Only `~Copyable` structs may have a `deinit`. On a copyable struct it won't compile.
- **Reaching for `~Copyable` on ordinary data.** If copies aren't a bug, suppressing them just makes the type harder to use. Save it for unique resources.

## Interview lens

If asked "what is a noncopyable type?", lead with the problem: some values model a *unique resource*, and an accidental copy — two owners closing one file — is a bug. `~Copyable` tells the compiler to forbid the implicit copy, so assignment *moves* the value and leaves the source unusable. One owner at a time.

The expected follow-up is "borrowing vs consuming." Say: a `borrowing` parameter is temporary read access with the caller keeping ownership; a `consuming` parameter takes ownership, so the caller can't use the value afterward and the value's `deinit` can fire when that function ends. Mention the `consume` operator as the explicit way to end a binding's lifetime and move the value out.

If they push on why it matters, hit deterministic cleanup: a noncopyable struct can have a `deinit` (copyable structs can't), so a resource is released at the exact point its single owner dies — the value-type equivalent of ARC's timing guarantee, without the reference counting.
