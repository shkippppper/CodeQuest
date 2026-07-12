## The problem: shipping a build and shipping a feature aren't the same thing

Once you submit a build to the App Store, it can take a day or two to review, and users update on their own schedule — some are still on a build from three versions ago. If a brand-new checkout flow turns out to be broken, "ship a fix" means going through that whole review-and-update cycle again, while broken checkout stays live the entire time.

A **feature flag** decouples those two things. It's a runtime check, guarding a feature, whose answer can change *without a new build*:

```swift
if FeatureFlags.newCheckoutEnabled {
    showNewCheckout()
} else {
    showLegacyCheckout()
}
```

Both code paths already shipped inside the same binary. Which one runs is decided by `FeatureFlags.newCheckoutEnabled` — a value that can flip from `false` to `true` (or back) on a server, taking effect for users already running the app, no App Store review required.

## Not every flag is the same kind of flag

`newCheckoutEnabled` above is a **release flag** — a temporary on/off switch that exists purely to decouple "code is merged" from "feature is live," and gets deleted once the feature fully ships. But flags serve several different jobs, and conflating them causes real problems:

```swift
enum FlagType {
    case release        // temporary: ship dark, flip on later, delete flag
    case experiment      // temporary: A/B test a hypothesis, delete after
    case permission       // long-lived: gates a paid tier or entitlement
    case ops               // long-lived: kill switch for an unstable dependency
}
```

A release flag and an **experiment flag** are both meant to be short-lived — they exist for weeks, then get deleted once the decision is made. A **permission flag** (like "is this user on the Pro plan") and an **ops flag** (like "disable the recommendations API if it's degrading") are meant to live *forever*, because the condition they check is permanent. Treating a temporary flag like a permanent one — never deleting it — is exactly how codebases end up full of dead `if` branches nobody trusts.

## Remote config: where the flag's value actually lives

`FeatureFlags.newCheckoutEnabled` has to get its `true`/`false` from somewhere at runtime. That somewhere is **remote config** — a small key-value payload the app fetches from a server, typically once at launch:

```swift
struct FeatureFlags {
    static var newCheckoutEnabled: Bool {
        RemoteConfig.shared.bool(forKey: "new_checkout_enabled", default: false)
    }
}
```

The `default: false` matters as much as the fetch itself: if the network call fails, or this is the very first launch before any fetch has completed, the app falls back to the *safe*, already-shipped behavior rather than an undefined one. A remote config fetch is just a network call — it can fail like any other, and a flag system that crashes or misbehaves on a failed fetch is worse than not having flags at all.

## Rolling a flag out gradually, not all at once

Predict: you flip `new_checkout_enabled` to `true` for 100% of users at once, and it turns out to crash on iOS 16. How many users just hit that crash?

Answer: all of them, simultaneously — the exact blast radius a feature flag was supposed to prevent. The fix is to never jump straight to 100%.

```
new_checkout_enabled:
  rollout: 5%     # day 1 — watch crash-free rate
  rollout: 25%    # day 3 — looks fine, expand
  rollout: 100%   # day 7 — fully rolled out
```

A **percentage rollout** assigns each user to "on" or "off" based on a stable hash of something like their user ID, so the same 5% of users stay in the "on" group every session — not a different random 5% each launch, which would make the experience feel broken and make crash data impossible to interpret. Watching a health metric (crash-free rate, error rate) at each step is what turns a rollout from "hope it works" into an actual safety net: if the 5% group's crash rate spikes, you flip back to 0% and only 5% of users were ever affected.

## Experiments: flags that answer a question, not just ship a feature

A rollout answers "is this safe?" An **A/B test** (also called an experiment) answers a different question — "which version actually performs better?" — by deliberately keeping two versions live at once and measuring the difference.

```swift
switch Experiment.checkoutButtonColor.variant {
case .control:  greenCheckoutButton()
case .treatment: orangeCheckoutButton()
}
```

Users are split into `control` (the existing experience) and `treatment` (the new one) — again by a stable hash, so each user consistently sees the same variant for the life of the experiment. The two groups' behavior — conversion rate, tap-through, whatever the experiment is measuring — gets compared statistically at the end.

Two design details separate a real experiment from a coin flip that happens to look scientific:

```
Sample size needed: ~2,400 users per arm
  (to detect a 5% relative lift at 95% confidence)
Guardrail metric: crash-free rate must not regress
```

**Sample size** matters because a difference measured on 40 users per arm is mostly noise — you need enough users per variant that a real effect is distinguishable from random chance, which is a calculation, not a guess. A **guardrail metric** is a second metric you watch isn't allowed to get worse — an orange button that lifts conversion 5% but doubles the crash rate is not a win, and without a guardrail, an experiment dashboard would happily report it as one.

## Cleanup: the part everyone skips

A flag's life cycle has a step people are consistently bad at:

```swift
// 1. Add the flag, ship dark
if FeatureFlags.newCheckoutEnabled { showNewCheckout() } else { showLegacyCheckout() }

// 2. Roll out to 100%, confirm it's stable

// 3. Delete the flag AND the dead branch — do not skip this
func checkout() { showNewCheckout() }
```

Step 3 is **flag debt** — the accumulation of flags that reached 100% (or 0%) months ago and were simply never removed. Each one leaves a permanent `if`/`else` in the code, doubling the number of paths a future change has to reason about, even though only one branch has run in production for months. A codebase with 200 stale flags isn't flexible — it's just hard to read, because nobody can tell which of those 200 conditions still matter without checking the remote config dashboard for each one.

The practical fix is treating "delete the flag" as part of the feature's definition of done, not an optional follow-up — some teams even set an expiration date on release and experiment flags so a stale one shows up in a report automatically instead of silently rotting.

## Common pitfalls

- **No safe default on fetch failure.** If remote config can't be reached, the app should fall back to already-shipped behavior, not crash or show an undefined state.
- **Random (not stable) variant assignment.** If a user can flip between control and treatment on different launches, both the user experience and the experiment's data are broken.
- **Never deleting flags that reached 100%.** This is how "temporary" release and experiment flags quietly become permanent flag debt.
- **Shipping an experiment with no guardrail metric.** A lift in the primary metric can hide damage to something else — crashes, latency, retention — that nobody was watching.

## Interview lens

If asked to design a feature flag system, distinguish the flag *types* up front — release, experiment, permission, ops — since they have different lifetimes and that distinction is exactly what prevents flag debt. Mentioning that release and experiment flags should have a deletion plan from day one is a senior-level signal.

If asked about rollouts specifically, describe the mechanism precisely: a **stable hash** of a user identifier decides bucket assignment so the experience is consistent across sessions, and a percentage ramp paired with a health metric is what makes it a safety net rather than a coin flip.

If the conversation turns to A/B testing, the two things interviewers listen for are sample size — do you know a small experiment is statistically meaningless — and guardrail metrics — do you know a primary-metric win can hide damage elsewhere. Both signal you've actually run an experiment, not just flipped a boolean.
