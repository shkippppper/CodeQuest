## The problem: reusing code without copying files

You want to use a networking library someone else wrote. The naive way:

```text
1. Download the library's source.
2. Drag the .swift files into your project.
3. Next month, a bug is fixed upstream — repeat by hand.
```

This falls apart fast. You have no record of *which version* you copied, updating means re-dragging files, and a library that itself depends on two other libraries turns into a manual scavenger hunt.

A **dependency manager** automates all of it: it fetches the library, records the exact version, pulls in *its* dependencies too, and wires everything into your build. iOS has had three of them — CocoaPods, Carthage, and Swift Package Manager. This lesson is about how each works and which to reach for.

## CocoaPods: centralized and deeply integrated

The oldest and, for years, the most popular. You describe dependencies in a text file called a **Podfile**:

```ruby
target 'MyApp' do
  pod 'Alamofire', '~> 5.8'
end
```

Then you run one command:

```text
pod install
```

CocoaPods downloads Alamofire's source, downloads anything Alamofire itself needs, and generates a `.xcworkspace` that stitches your app and the pods together. From then on you open the **workspace**, not the plain `.xcodeproj`.

Two traits define CocoaPods. It's **centralized**: pod names are looked up in a shared master index (the CocoaPods "trunk" spec repo). And it's **invasive** — it generates and modifies project files and a workspace to wire everything up. That deep integration is convenient but means CocoaPods is heavily involved in your build. It's built in Ruby, so it lives outside Xcode as a separate tool you install.

## Carthage: decentralized and hands-off

Carthage took the opposite philosophy. You list dependencies in a `Cartfile`:

```text
github "Alamofire/Alamofire" ~> 5.8
```

It's **decentralized**: notice you point straight at a GitHub repo, not a name in a central index. There's no master registry to publish to.

Then:

```text
carthage update
```

Carthage checks out the source and **builds it into prebuilt frameworks** — and then stops. It does *not* touch your project. You manually drag the built `.framework` files in and add a build phase yourself.

The trade is clear. Carthage is minimal and non-invasive — it never rewrites your project file, so there's nothing to conflict or corrupt. But you do more setup by hand, and you own the manual linking step. That "does less, touches nothing" stance is why some teams preferred it.

## Swift Package Manager: first-party and built in

**Swift Package Manager** (SPM) is Apple's own manager, and it's built directly into Xcode — no separate tool to install. Dependencies live in a `Package.swift` manifest (SPM has its own lesson covering that manifest in depth):

```swift
dependencies: [
    .package(url: "https://github.com/Alamofire/Alamofire", from: "5.8.0")
]
```

In Xcode you add a package by URL and it resolves, downloads, and links everything for you.

Why did SPM win for new projects? It's **native**: no Ruby, no generated workspace to juggle, and dependency resolution is integrated into the tool you already use. Apple maintains it, so it tracks new Swift versions immediately. For a project starting today, SPM is the default, and most libraries now ship SPM support.

## Versioning is the same idea everywhere

All three speak **semantic versioning** — a `MAJOR.MINOR.PATCH` scheme where a bump in each part signals how big the change is. You express what range you'll accept:

```text
~> 5.8      # CocoaPods/Carthage: 5.8 and up, but below 6.0
from: 5.8.0 # SPM: 5.8.0 and up, but below 6.0
```

And all three write a **lockfile** — a file recording the *exact* resolved versions so every teammate and CI machine builds against identical dependencies:

```text
Podfile.lock        (CocoaPods)
Cartfile.resolved   (Carthage)
Package.resolved    (SPM)
```

Predict: two developers clone the repo a week apart, and a dependency shipped a new patch in between. Do they get the same version?

Answer: yes — *if the lockfile is committed*. The lockfile pins the resolved version, so both check out exactly what's recorded, not "whatever's newest." Committing it is what makes builds reproducible.

## The trade-offs that decide it

The managers differ most in **how they deliver code** and **how much they touch your project**.

| | CocoaPods | Carthage | SPM |
|---|---|---|---|
| Registry | Centralized index | Decentralized (git URLs) | Decentralized (git URLs) |
| Touches your project? | Yes — generates a workspace | No — you link manually | Yes — integrated in Xcode |
| Code delivery | Compiles pod source in your build | Prebuilt frameworks | Compiles source (cached) |
| Extra tooling | Ruby gem | Separate binary | Built into Xcode |

Build-time is a real consideration: CocoaPods compiles pod source as part of your build, while Carthage's prebuilt frameworks can keep incremental builds faster. But the ecosystem has consolidated: new projects default to SPM, plenty of legacy apps still carry CocoaPods, and Carthage is niche today. Many teams migrating off CocoaPods do it precisely to drop the extra Ruby tooling and the workspace.

## Common pitfalls

- **Not committing the lockfile.** Without `Podfile.lock` / `Cartfile.resolved` / `Package.resolved` in git, teammates and CI can silently resolve different versions.
- **Opening the `.xcodeproj` with CocoaPods.** After `pod install` you must open the generated `.xcworkspace`, or the pods aren't linked.
- **Expecting Carthage to wire itself in.** It only builds frameworks; adding them and the build phase is your manual job.
- **Assuming a library supports your manager.** Not every pod is an SPM package (though most now are) — check before you commit to one.

## Interview lens

If asked to compare the three, anchor on two axes: centralized-vs-decentralized, and how invasive each is. CocoaPods is centralized and invasive (generates a workspace, compiles pod source, needs Ruby). Carthage is decentralized and hands-off (builds prebuilt frameworks, never touches your project, more manual). SPM is Apple's first-party manager built into Xcode — decentralized, native, no extra tooling.

Expect "which would you pick today?" Say SPM for anything new — it's native, needs no Ruby or workspace, and tracks Swift releases immediately — while acknowledging many real codebases still run CocoaPods and that migrating is common.

A detail that signals experience: mention the lockfile (`Podfile.lock` / `Cartfile.resolved` / `Package.resolved`) and that committing it is what makes builds reproducible across the team and CI. If pushed on build time, note that Carthage's prebuilt frameworks avoid recompiling dependencies, unlike CocoaPods' source compilation.
