## The problem: closures quietly keep objects alive

A closure captures the variables it uses from its surrounding scope — **by reference**, strongly, by default. That's convenient, but when an **escaping** closure captures `self` (and `self` stores the closure), you get the retain cycle from the last topic. A **capture list** — the `[ ... ]` at the start of a closure — lets you say *how* things are captured (`weak`, `unowned`, or a snapshot), which is how you break those cycles.

## How closures capture

By default a closure **captures references to** the variables it uses, so it sees later mutations and keeps referenced **objects alive** (strong capture).

```swift
func makeCounter() -> () -> Int {
    var count = 0
    return { count += 1; return count }   // captures `count` by reference → persists
}
```

For **class instances** (including `self`), that strong capture is exactly what causes cycles when the closure escapes and is stored on the object it captured.

## `[weak self]` / `[unowned self]`

A **capture list** overrides the default for named references:

```swift
button.onTap = { [weak self] in
    self?.reload()                // self is now weak Optional; no strong capture
}

timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [unowned self] _ in
    self.tick()                   // self assumed to outlive the timer (dangerous if wrong)
}
```

- **`[weak self]`** — captures `self` weakly; inside, `self` is an **optional** (auto-nils if deallocated). Safe. The default choice for escaping closures.
- **`[unowned self]`** — captures `self` non-optionally without keeping it alive; **crashes** if `self` is gone when the closure runs. Use only when `self` is guaranteed to outlive the closure.

Same relative-lifetime rule as `weak` vs `unowned` on properties.

## Capturing values vs references

You can also capture a **snapshot by value** by naming the variable in the list — it's copied **at closure-creation time**, ignoring later changes:

```swift
var x = 1
let byValue = { [x] in print(x) }   // captures the value 1 now
let byRef   = { print(x) }          // captures the reference; sees later changes
x = 99
byValue()   // 1  (snapshot)
byRef()     // 99 (live)
```

So capture lists do two jobs: set **ownership** (`weak`/`unowned`) for reference types, and take a **value snapshot** for anything you list by name.

## The `guard let self` dance

With `[weak self]`, `self` is optional inside the closure. Writing `self?.` everywhere works but gets noisy, and you may want to bail if `self` is gone. The idiom is to **re-bind** at the top:

```swift
doAsyncWork { [weak self] result in
    guard let self else { return }   // strongly holds self for the rest of this run
    self.update(result)
    self.finish()
}
```

`guard let self else { return }` (Swift 5.7+ shorthand; previously `guard let self = self`) unwraps `self` once, keeping it alive **for the duration of that closure execution** — safe and clean. This is the standard pattern for escaping closures that touch `self` multiple times.

## Common mistakes

- **Forgetting `[weak self]`** on an **escaping/stored** closure that captures `self` → retain cycle/leak.
- **Overusing `[weak self]`** on **non-escaping** closures (like `array.map { ... }`) — unnecessary; they don't cause cycles, and it just adds optionality noise.
- **`[unowned self]` where `self` can die first** → crash. Prefer `[weak self]` unless the lifetime is guaranteed.
- **Capturing `self` implicitly via a property**: `{ someProperty }` captures `self` too (to reach the property). The capture list still applies — write `[weak self] in self?.someProperty`.
- **A weak capture that unexpectedly nils mid-run**: without `guard let self`, an early `self?.a()` might run while a later `self?.b()` no-ops if `self` deallocates between them — `guard let self` avoids that inconsistency.

## The interview lens

Explain that closures **capture references strongly by default**, so an **escaping/stored** closure capturing `self` (which holds the closure) forms a retain cycle. A **capture list** (`[weak self]`/`[unowned self]`) at the closure's start changes the ownership: **`[weak self]`** makes `self` an **optional** that auto-nils (safe, the default), **`[unowned self]`** is non-optional and **crashes** if `self` is gone (use only when `self` outlives the closure).

Senior signals: the **`guard let self else { return }`** idiom to re-bind weak `self` once for a whole closure run (avoiding `self?.` sprawl and mid-run inconsistency); that capture lists also **snapshot values by value** (`[x]`); and that **non-escaping** closures generally **don't** need `[weak self]` (no cycle, so adding it is noise). The rule: `[weak self]` for escaping closures by default, `[unowned self]` only with a guaranteed lifetime.
