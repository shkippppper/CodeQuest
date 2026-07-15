## The problem: a pretty view nobody can use

Here's a custom "favorite" control — a heart drawn with an image:

```swift
Image(systemName: heart ? "heart.fill" : "heart")
    .onTapGesture { heart.toggle() }
```

It looks great. Now imagine a user who can't see the screen. They rely on **VoiceOver** — a screen reader built into iOS that speaks the interface aloud and lets them drive it by touch and gesture instead of by looking.

VoiceOver lands on this heart and says… "heart, image." It's not announced as a button. There's no hint that tapping toggles a favorite. To a blind user, this beautiful control is nearly useless.

Now imagine a different user with low vision. They've cranked the system text size up to the largest setting so they can read anything. But you hard-coded the font:

```swift
Text("Welcome").font(.system(size: 15))
```

That text stays 15 points forever. For them, it's a blurry line they can't read.

Accessibility fixes both. It's the work of exposing your UI to assistive technologies and letting your content adapt to each user's needs. It's a professional duty — and in many markets (the US ADA, the EU EN 301 549) a legal requirement for apps of a certain reach.

## The accessibility tree

When VoiceOver runs, it does *not* read your raw view hierarchy. It reads a parallel structure called the **accessibility tree** — a list of **accessibility elements**, each a small package of text and metadata describing one thing the user can interact with.

Think of two trees side by side. On the left, your visual views: stacks, images, shapes. On the right, the accessibility tree: a flat-ish sequence of elements VoiceOver walks through one swipe at a time.

Most standard controls populate that tree for free. A SwiftUI `Button("Save")` automatically becomes an element that reads "Save, button." The trouble starts with *custom* views — a tappable image, a shape you drew, a gesture on a `Rectangle`. Those often show up as bare elements with no useful description, or don't show up at all.

So the core job is: make sure every meaningful thing on screen has a good element in that tree, and make sure decorative junk stays out of it.

### Predict: what does VoiceOver read for a plain image?

```swift
Image("profile_avatar_2x")
```

You gave this image no accessibility text. What does VoiceOver announce when it lands on it?

Answer: it reads the **image's file name** — something like "profile avatar 2x." That's almost never what you want the user to hear. It's the clearest sign that an image needs a real label, which is the next section.

## Label, value, hint, traits

Each accessibility element carries up to four pieces of information. VoiceOver speaks them in a fixed order, so knowing what each one means tells you exactly what the user will hear.

**Label** — a short name for the element. This is the *what*. In SwiftUI you set it with `.accessibilityLabel`:

```swift
Image(systemName: "heart.fill")
    .accessibilityLabel("Favorite")
```

Now VoiceOver says "Favorite" instead of the SF Symbol name. A good label is a noun or short phrase, capitalized like a title, with no control-type words baked in — say "Favorite", not "Favorite button" (the trait adds "button" for you).

**Value** — the element's current state, when that state can change. This is the *how much* / *what setting*. Set it with `.accessibilityValue`:

```swift
Slider(value: $volume, in: 0...100)
    .accessibilityLabel("Volume")
    .accessibilityValue("\(Int(volume)) percent")
```

VoiceOver reads "Volume, 50 percent." The label names the control; the value reports where it's set right now.

**Hint** — a longer sentence explaining what happens if you act on the element. This is the *what will happen*. Set it with `.accessibilityHint`:

```swift
Image(systemName: heart ? "heart.fill" : "heart")
    .accessibilityLabel("Favorite")
    .accessibilityAddTraits(.isButton)
    .accessibilityHint("Double tap to add this article to your favorites")
```

VoiceOver speaks the hint last, and only after a short pause, because it's supplementary. The user can even turn hints off, so never put essential information only in a hint.

**Traits** — flags describing the element's *kind* and *state*: is it a button, a header, selected, disabled? Add them with `.accessibilityAddTraits`:

```swift
.accessibilityAddTraits(.isButton)     // spoken as "… button"
.accessibilityAddTraits(.isHeader)     // helps users jump between sections
.accessibilityAddTraits([.isButton, .isSelected])
```

The `.isButton` trait is why VoiceOver appends "button" and offers a double-tap. Traits are how the *whole heart* finally announces as "Favorite, button" with a "double tap to…" hint — a control a blind user can actually operate.

Put the four together for our slider from the intro:

```swift
CustomDial(value: $brightness)
    .accessibilityLabel("Brightness")        // what it is
    .accessibilityValue("\(Int(brightness))%")  // where it's set
    .accessibilityAddTraits(.isButton)       // what kind of thing
    .accessibilityHint("Swipe up or down to adjust")  // what to do
```

UIKit has the exact same four ideas as plain properties on any `UIView`: `accessibilityLabel`, `accessibilityValue`, `accessibilityHint`, and `accessibilityTraits`. The names and the meaning carry straight over.

## Making five views read as one

Here's a card built from several views:

```swift
HStack {
    Image("avatar")
    VStack {
        Text("Ada Lovelace")
        Text("Software Engineer")
    }
    Spacer()
    Image(systemName: "chevron.right")
}
```

By default VoiceOver treats this as several separate elements. The user swipes and hears "avatar, image"… swipe… "Ada Lovelace"… swipe… "Software Engineer"… swipe… "chevron." Four stops for one logical thing. It's exhausting.

Collapse it into a single element with `.accessibilityElement(children: .combine)`:

```swift
HStack { /* … same as above … */ }
    .accessibilityElement(children: .combine)
```

The `.combine` strategy merges the children's labels into one. Now a single swipe lands on the whole card and VoiceOver reads "Ada Lovelace, Software Engineer" as one element. The decorative chevron and avatar fold in quietly.

Sometimes you want to drop the children's text entirely and write your own:

```swift
VStack { /* rating stars drawn as shapes */ }
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("Rating: 4 out of 5 stars")
```

The `.ignore` strategy hides the child elements and lets you supply one clean label — far better than hearing "star, star, star, star, star, outline."

Rule of thumb: combine when the pieces together *are* the content; ignore-and-relabel when the pieces are visual and you can say it better in one phrase.

## Dynamic Type: text that grows with the user

**Dynamic Type** is the system feature that lets a user pick their preferred text size in Settings, and have every well-behaved app honor it. Someone with low vision picks a large size; the whole UI's text scales up to match.

Your job is to opt in. The single most important rule: use a **text style**, not a fixed point size.

```swift
Text("Welcome").font(.body)        // scales with the user's setting
```

A text style like `.body`, `.headline`, `.caption`, or `.title` is a *semantic* size — "body text," "a heading" — that iOS maps to real points based on the user's preference. Compare the broken version:

```swift
Text("Welcome").font(.system(size: 15))   // frozen at 15pt forever
```

That hard-coded 15 never moves. Prefer text styles everywhere and most of your typography scales automatically.

### Scaling values that aren't text

Text isn't the only thing that should grow. An icon beside body text, or padding around it, should scale too — otherwise a huge word sits next to a tiny 16-point icon. Reach for `@ScaledMetric`:

```swift
struct Row: View {
    @ScaledMetric var iconSize: CGFloat = 24

    var body: some View {
        Image(systemName: "star")
            .frame(width: iconSize, height: iconSize)
    }
}
```

`@ScaledMetric` takes your base value (24 at the default text size) and scales it by the same factor Dynamic Type applies to text. Bump the system size up and the icon grows in step with the words next to it.

### Supporting the very largest sizes

Beyond the normal range, iOS offers five **accessibility text sizes** that go much bigger. At those sizes a tidy horizontal row can overflow and clip. The senior move is to notice when you're at an accessibility size and reflow:

```swift
struct Badge: View {
    @Environment(\.dynamicTypeSize) var size

    var body: some View {
        if size.isAccessibilitySize {
            VStack { Image(systemName: "bolt"); Text("Fast") }  // stack vertically
        } else {
            HStack { Image(systemName: "bolt"); Text("Fast") }  // side by side
        }
    }
}
```

Reading `\.dynamicTypeSize` from the environment lets you check `isAccessibilitySize` and switch an `HStack` to a `VStack` so nothing clips. Test at the largest setting — that's where layouts break.

## Other must-knows

A few smaller rules that come up constantly:

- **Hide decoration.** A purely visual divider or background flourish should not be a VoiceOver stop. Mark it `.accessibilityHidden(true)` so it's removed from the tree entirely.

```swift
Image("decorative_swoosh").accessibilityHidden(true)
```

- **Reduce Motion.** Some users get motion sickness from large animations. Check `\.accessibilityReduceMotion` and swap a big slide/zoom for a quick cross-fade when it's on.

- **Contrast.** Text needs enough contrast against its background to be legible — the common bar is a 4.5:1 ratio for normal text. Light-gray-on-white captions are the usual offender.

- **Hit targets.** Any tappable control should be at least **44 by 44 points**. A 20-point icon-button is easy to see but hard to hit, especially with a motor impairment. Pad it out to 44.

None of these need much code; they're mostly habits.

## Testing it for real

Three tools, cheapest first:

The **Accessibility Inspector** (in Xcode's Developer Tools menu) points at your running app and shows each element's label, value, hint, and traits. Great for a quick "does this control expose the right text?" check without touching your device.

The **Accessibility Audit** — a button inside the Inspector — scans the current screen and flags issues automatically: missing labels, low contrast, hit targets under 44 points, clipped text. Run it on every screen before you ship; it catches the obvious misses in seconds.

But nothing replaces **turning VoiceOver on and using the app blind.** Enable it on a real device (Settings › Accessibility › VoiceOver, or triple-click the side button), then try to complete a real task — sign in, favorite an article, check out — without looking at the screen. Painful the first time, and the fastest way to feel what your users feel.

## Interview lens

If asked "how does VoiceOver work?", lead with the accessibility tree: VoiceOver reads a parallel tree of accessibility elements, not your raw views, so your job is to make sure every meaningful view has a good element and decorative ones are hidden.

Expect a follow-up on the four properties. Say it crisply: **label** is what the element is, **value** is its current state, **hint** is what will happen if you act on it, and **traits** describe its kind (button, header) and state (selected, disabled). Mention that VoiceOver speaks them in that order and that hints can be turned off, so nothing essential lives only in a hint.

For Dynamic Type, the one-liner that signals experience: "use text styles like `.body`, never fixed point sizes, and `@ScaledMetric` for non-text values." Bonus points for knowing the largest accessibility sizes exist and that you check `isAccessibilitySize` to reflow layouts so text doesn't clip.

If they ask how you'd verify accessibility, name all three: the Accessibility Inspector to read element metadata, the Xcode Accessibility Audit to auto-flag issues, and — the answer that lands — actually turning VoiceOver on and completing a task without looking. Interviewers are checking whether you treat accessibility as a real, tested part of the work or an afterthought.
