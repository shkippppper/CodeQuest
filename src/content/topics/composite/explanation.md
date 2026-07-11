## The problem: a file browser has two kinds of things

A file system has files and folders. A folder can contain files, or other folders, which can contain more folders, and so on — arbitrarily deep. Now write a function that computes total size:

```swift
struct File {
    let name: String
    let size: Int
}

struct Folder {
    let name: String
    var files: [File]
    var subfolders: [Folder]
}
```

Computing a folder's total size means adding up its own files' sizes, *plus* recursively asking every subfolder for its total, which asks its subfolders, and so on. Every piece of code that needs to walk this structure — total size, search by name, count of items — has to branch on "is this a `File` or a `Folder`?" at every level. That branching, repeated at every call site, is the problem this lesson solves.

## Giving files and folders the same shape

The fix is to make `File` and `Folder` conform to one shared interface, so calling code never has to ask which one it has:

```swift
protocol FileSystemItem {
    var name: String { get }
    var size: Int { get }
}

struct File: FileSystemItem {
    let name: String
    let size: Int
}
```

A plain `File` already satisfies this trivially — its own `size` *is* the answer. Now make `Folder` conform too:

```swift
final class Folder: FileSystemItem {
    let name: String
    var children: [FileSystemItem] = []

    init(name: String) { self.name = name }

    var size: Int {
        children.reduce(0) { $0 + $1.size }
    }
}
```

Look closely at `children`: it's `[FileSystemItem]`, not `[File]` — a folder's children can be files *or* other folders, because both conform to the same protocol. And `size` doesn't check what each child is; it just calls `.size` on every child and sums the results.

This is the **composite** pattern: a structure where an individual object (`File`, a **leaf** — a node with no children) and a container of objects (`Folder`, a **composite** node) both implement the same interface, so client code treats "one thing" and "a tree of things" identically.

## Watching the recursion actually work

Build a small tree:

```swift
let readme = File(name: "README.md", size: 2)
let mainSwift = File(name: "main.swift", size: 5)

let sources = Folder(name: "Sources")
sources.children = [mainSwift]

let project = Folder(name: "Project")
project.children = [readme, sources]
```

`project` contains one file (`readme`) and one folder (`sources`), and `sources` contains one file (`mainSwift`). Now ask for the total size:

```swift
print(project.size)   // ?
```

Predict before reading on: what number prints, and how does `size` actually arrive at it?

Answer: `7`. `project.size` sums its children: `readme.size` (2, a leaf — direct answer) plus `sources.size`. But `sources.size` isn't stored anywhere — it's computed the same way, by summing *its* children: just `mainSwift.size` (5). So `project.size` = 2 + 5 = 7, and neither `Folder` needed to know how deep its subfolders went. The recursion falls naturally out of every node calling `.size` on its children without caring what kind they are.

## Uniform treatment is the whole point

Grow the tree one more level — a folder inside `sources`:

```swift
let tests = Folder(name: "Tests")
tests.children = [File(name: "AppTests.swift", size: 3)]
sources.children = [mainSwift, tests]
```

`project.size` still just works — now returning `10` — without a single line of the `size` computation changing. That's the practical payoff of the pattern: code written against `FileSystemItem` doesn't get more complicated as the tree gets deeper. A function that prints every item's name recursively is just as uniform:

```swift
func printTree(_ item: FileSystemItem, indent: String = "") {
    print(indent + item.name)
    if let folder = item as? Folder {
        for child in folder.children {
            printTree(child, indent: indent + "  ")
        }
    }
}
```

Notice this function *does* need one type check — `as? Folder` — to know whether to recurse into children. That's expected: a leaf has no children to walk, so something has to distinguish "keep going" from "stop here." What composite buys you is that everything *else* (computing `size`, reading `name`) needed zero type checks — only the act of descending into children needs to know which nodes are composites.

## SwiftUI views are a composite tree

This pattern isn't confined to file systems — it's the exact shape of every SwiftUI view hierarchy. `Text("Hi")` is a leaf. `VStack { ... }` is a composite: it holds child views and, when SwiftUI asks it to lay itself out, it delegates by asking each child to lay itself out too.

```swift
var body: some View {
    VStack {
        Text("Title")
        HStack {
            Text("Left")
            Text("Right")
        }
    }
}
```

`VStack` doesn't know or care that one of its children is an `HStack` containing two more `Text` views rather than a single leaf — it treats every child uniformly as "a `View`, ask it to render." The `some View` return type is doing real work here: it lets a `VStack`, an `HStack`, and a `Text` all satisfy the same `View` protocol despite radically different internal shapes, exactly the way `File` and `Folder` both satisfy `FileSystemItem`. This is why you can nest SwiftUI views arbitrarily deep and every container — `List`, `ScrollView`, `Group` — still composes correctly: they're all composite nodes over the same leaf-or-container abstraction.

## Common pitfalls

- **Making the leaf type support child-management methods it can't meaningfully implement.** If `FileSystemItem` required an `addChild(_:)` method, `File` would have to either crash or silently no-op when called — a sign the interface is asking leaves to pretend they're composites. Keep child-management (`children`, `addChild`) on the composite type only, and share just the read-only interface (`name`, `size`) across both.
- **Recomputing expensive aggregates on every access.** `size` here recomputes the whole subtree on every call; for a large real file system you'd cache it and invalidate on mutation — the pattern doesn't dictate performance, only structure.
- **Deep recursion without a base case check.** A composite tree with a cycle (a folder somehow containing itself) recurses forever; real implementations should either make cycles structurally impossible or guard against them explicitly.

## Interview lens

If asked to define composite, describe the shape precisely: leaf objects and container objects both conform to one shared interface, so client code manipulates "a single item" and "a tree of items" through the exact same API, and operations on a container are typically implemented by delegating to its children recursively.

If asked why this matters, point at the alternative: without a shared interface, every piece of code that walks the structure needs its own `if file / else if folder` branching, repeated at every call site and every level of nesting. Composite moves that branching into one place — deciding whether to recurse into children — instead of scattering it everywhere.

If asked for a real-world example beyond file systems, SwiftUI's view hierarchy is the strongest one to reach for: `some View` lets `Text`, `VStack`, `HStack`, and every custom view conform to the same protocol, so a container view lays out arbitrarily nested children without ever needing to know their concrete types — naming this shows you recognize the pattern in code you write daily, not just in a textbook diagram.
