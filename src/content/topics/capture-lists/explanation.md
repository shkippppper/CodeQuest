## The problem: the closure that wouldn't let go

Last lesson's sneakiest cycle, one more time:

```swift
class ViewModel {
    var onChange: (() -> Void)?
    func reload() {}

    func setup() {
        onChange = { self.reload() }   // self → onChange → self. Leak.
    }
}
```

The fix was `[weak self]`. This lesson is about that bracket — what closures capture by default, every way the bracket can change it, and the idioms around it.

## How closures capture by default

Strip away classes for a moment. Watch a closure hang on to a local variable:

```swift
func makeCounter() -> () -> Int {
    var count = 0
    return { count += 1; return count }
}
```

`count` is a local variable of `makeCounter`. It should die when the function returns — but:

```swift
let counter = makeCounter()   // makeCounter has returned; count "should" be gone
counter()                     // 1
counter()                     // 2 — count is alive, and remembers
```

The closure *captured* `count`: it holds a reference to the variable itself, not a copy of its value. Captured variables live as long as the closure does, and the closure sees every later mutation.

Now the crucial consequence. When the thing captured is a class instance — including `self` — that capture is a strong reference, exactly like a stored property. A stored **escaping** closure — one that outlives the function call, saved for later — that captures `self` is one half of a retain cycle. If `self` stores the closure, the circle closes.

## The capture list changes the rules

A **capture list** is the bracketed list at the very start of a closure. It says *how* to capture each thing it names:

```swift
button.onTap = { [weak self] in
    self?.reload()
}
```

`[weak self]` captures `self` weakly: the closure no longer keeps `self` alive, and inside the body `self` is an *optional* that auto-nils if the object is deallocated. Same weak semantics as the reference-types lesson — just applied to a capture.

The other option:

```swift
timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [unowned self] _ in
    self.tick()   // non-optional — but crashes if self is already gone
}
```

`[unowned self]` also refuses to keep `self` alive, but stays non-optional and never nils. If the closure runs after `self` is deallocated: crash. The decision rule is the one you already know from properties — `weak` when `self` might die first, `unowned` only when `self` provably outlives the closure.

For escaping closures, the default habit is `[weak self]`.

## Capture lists can also snapshot values

The bracket has a second, less famous job. Name a variable *without* `weak` or `unowned`, and the closure copies its current value at creation time:

```swift
var x = 1
let byValue = { [x] in print(x) }   // copies x — right now, while x is 1
let byRef   = { print(x) }          // captures the variable itself
x = 99
```

Predict: what do `byValue()` and `byRef()` print?

Answer: `1` and `99`. The listed capture froze `x` at closure-creation time; the default capture watched the variable and saw the later write.

So the capture list does two jobs: it sets *ownership* — `weak`/`unowned` — for class references, and it takes a **value snapshot** for anything listed bare.

## The guard let self dance

Back to `[weak self]`. Inside the closure, `self` is optional, and sprinkling `self?.` everywhere is noisy. But the real problem is subtler than noise:

```swift
doAsyncWork { [weak self] result in
    self?.stepOne()    // runs — self is alive here
    // …self gets deallocated on another thread…
    self?.stepTwo()    // silently skipped — half the work done, half not
}
```

Each `self?.` re-checks independently, so `self` can vanish *between* two lines. The closure ends up half-executed.

The idiom that fixes both problems:

```swift
doAsyncWork { [weak self] result in
    guard let self else { return }   // one check, then self is strong for this run
    self.stepOne()
    self.stepTwo()                   // guaranteed to run if stepOne did
}
```

`guard let self else { return }` unwraps the weak `self` once, holding it strongly *for the duration of that single execution*. Either the whole body runs, or none of it does. The short spelling is Swift 5.7+; older code wrote `guard let self = self else { return }` — same meaning.

This is the standard shape for any escaping closure that touches `self` more than once.

## Common mistakes

- **Forgetting `[weak self]` on a stored escaping closure.** The quiet retain cycle from last lesson — the object never deinits.
- **Adding `[weak self]` to non-escaping closures.** `array.map { self.transform($0) }` runs and finishes inside the call; no cycle is possible. The annotation just adds optional noise.
- **`[unowned self]` where `self` can die first.** An async callback firing after the screen closes is the classic crash. Prefer `[weak self]` unless the lifetime is a guarantee, not a hope.
- **Capturing `self` implicitly through a property.** `{ someProperty }` still captures `self` — reaching the property requires it. The capture list applies all the same: write `[weak self]` and `self?.someProperty`.
- **Skipping `guard let self` in multi-step closures.** Scattered `self?.` calls can execute a random prefix of the body if `self` dies mid-run — the inconsistency bug from above.

## Interview lens

Start with the default: closures capture the variables they use by reference, strongly — so a stored escaping closure that captures `self`, on an object that stores the closure, is a retain cycle. Then present the capture list as the control knob: `[weak self]` makes `self` an auto-nilling optional, safe and the sensible default; `[unowned self]` is non-optional and crashes if `self` is gone, so it demands a provable lifetime guarantee.

The senior signals interviewers listen for: the `guard let self else { return }` idiom — one unwrap that holds `self` for the whole execution, avoiding both `self?.` sprawl and the half-executed-closure bug; the fact that capture lists also snapshot values by copy, so `[x]` freezes `x` at creation time; and knowing that non-escaping closures don't need any of this, because they can't outlive the call.

If pressed for a rule, give the compact one: escaping closures get `[weak self]` by default, `[unowned self]` only with a guaranteed lifetime, non-escaping closures get nothing.
