import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "composite-what",
    type: "mcq",
    prompt: "What does the composite pattern let you do?",
    options: [
      "Treat an individual object (a leaf) and a container of objects (a composite) through the same interface",
      "Guarantee a class has only one instance",
      "Defer creation of an expensive object until first use",
      "Add behavior around a method call by wrapping it",
    ],
    answer: 0,
    explanation:
      "Composite makes leaf objects (like File) and container objects (like Folder) conform to the same interface, so client code treats 'one thing' and 'a tree of things' identically.",
  },
  {
    id: "composite-leaf-fill",
    type: "fill",
    prompt: "In a composite tree, a node with no children — like a plain File — is called a ___.",
    answers: ["leaf"],
    hint: "The opposite end of the tree from the root.",
    explanation:
      "A leaf is a node with no children. A Folder that contains other items is the composite (container) node.",
  },
  {
    id: "composite-size-predict",
    type: "predict",
    prompt: "What does `project.size` print?",
    code: `let readme = File(name: "README.md", size: 2)
let mainSwift = File(name: "main.swift", size: 5)
let sources = Folder(name: "Sources")
sources.children = [mainSwift]
let project = Folder(name: "Project")
project.children = [readme, sources]
print(project.size)`,
    options: ["7", "2", "5", "0"],
    answer: 0,
    explanation:
      "project.size sums its children: readme.size (2) plus sources.size, which itself sums its own children: mainSwift.size (5). 2 + 5 = 7. Neither Folder needed to know how deep the tree went.",
  },
  {
    id: "composite-children-type",
    type: "mcq",
    prompt: "Why is Folder's `children` property typed as `[FileSystemItem]` rather than `[File]`?",
    options: [
      "So a folder's children can be a mix of files and other folders, since both conform to the same protocol",
      "Because Swift doesn't allow arrays of structs",
      "Because File cannot be stored in an array",
      "It has no effect on what a folder can contain",
    ],
    answer: 0,
    explanation:
      "Typing children as [FileSystemItem] lets a folder hold any mix of File and Folder values, since both conform to FileSystemItem — this is what makes recursive, uniform traversal possible.",
  },
  {
    id: "composite-swiftui-mcq",
    type: "mcq",
    prompt: "How does SwiftUI's view hierarchy relate to the composite pattern?",
    options: [
      "Text is a leaf, VStack/HStack are composites, and all conform to the same View protocol so containers treat every child uniformly",
      "SwiftUI views have nothing to do with composite",
      "Only VStack conforms to View; Text does not",
      "Composite only applies to file systems, not UI frameworks",
    ],
    answer: 0,
    explanation:
      "Text is a leaf view with no children; VStack/HStack are composite nodes that delegate layout to their children. All conform to View (via 'some View'), which is exactly the leaf-and-container-share-an-interface shape of composite.",
  },
  {
    id: "composite-truths-multi",
    type: "multi",
    prompt: "Select all true statements about the composite pattern.",
    options: [
      "Operations on a composite node are typically implemented by delegating to its children recursively",
      "Client code needs a type check to know whether something is a leaf or composite for every operation, not just for descending into children",
      "A leaf conforms to the same interface as a composite node",
      "Growing the tree deeper (adding more nested folders) shouldn't require changing the size computation logic",
    ],
    answers: [0, 2, 3],
    explanation:
      "Composite operations delegate recursively (0), leaves share the composite's interface (2), and deeper trees don't require logic changes (3) — that's the payoff of the pattern. Most operations (like reading size or name) need zero type checks; only descending into children needs to distinguish leaf from composite (option 1 is false as a blanket statement).",
  },
  {
    id: "composite-leaf-methods-senior",
    type: "mcq",
    prompt: "Why is it a design smell to put `addChild(_:)` on the shared FileSystemItem interface instead of only on Folder?",
    options: [
      "A leaf type like File would have to crash or silently no-op when addChild is called, since it can't meaningfully support it",
      "Swift doesn't allow protocols to have mutating methods",
      "It would make Folder unable to conform to the protocol",
      "It has no real downside either way",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Putting child-management on the shared interface forces leaf types to fake support for an operation they can't meaningfully perform. Keep child-management on the composite type only, and share just the read-only interface across both.",
  },
  {
    id: "composite-cycle-senior",
    type: "predict",
    prompt: "🧠 A Folder's children array somehow ends up containing that same Folder (directly or through a descendant). What happens when you call `.size` on it?",
    code: `let a = Folder(name: "A")
let b = Folder(name: "B")
a.children = [b]
b.children = [a]   // cycle: a contains b contains a...
print(a.size)`,
    options: [
      "Infinite recursion — size keeps calling into children forever with no base case, typically crashing with a stack overflow",
      "Swift automatically detects the cycle and throws an error",
      "It prints 0",
      "It compiles but size silently returns nil",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The recursive size computation has no cycle detection, so a folder that (directly or indirectly) contains itself causes size to recurse forever, typically crashing with a stack overflow. Real implementations must make cycles structurally impossible or guard against them explicitly.",
  },
  {
    id: "composite-flashcard",
    type: "flashcard",
    prompt: "Explain the composite pattern: shape, why uniform treatment matters, and a real Swift example. Answer aloud, then reveal.",
    modelAnswer:
      "**Composite** is a pattern where a **leaf** (an individual object with no children, like a File) and a composite/container node (an object holding children, like a Folder) both conform to the same interface, so client code manipulates 'one item' and 'a tree of items' identically without branching on which one it has. Operations on a composite node are typically implemented by delegating to each child recursively — a Folder's `size` sums its children's `size`, and each child (whether a File or another Folder) answers the same way, so the recursion falls out naturally without the top-level code needing to know how deep the tree goes. The main design discipline is keeping child-management operations (like `addChild`) on the composite type only, not on the shared interface, so leaf types aren't forced to fake support for operations they can't meaningfully perform. The clearest everyday Swift example is SwiftUI's view hierarchy: `Text` is a leaf, `VStack`/`HStack` are composites, and all conform to `View` (via `some View`), letting a container lay out arbitrarily nested children uniformly.",
    keyPoints: [
      "Leaf and composite/container both conform to the same interface",
      "Composite operations delegate to children recursively — no depth-aware code needed",
      "Keep child-management methods off the shared interface, only on the composite type",
      "SwiftUI's View hierarchy (Text = leaf, VStack/HStack = composite) is the everyday example",
    ],
    explanation:
      "A senior answer stresses the recursive delegation mechanism, the leaf-interface design discipline, and grounds the pattern in SwiftUI rather than only the file-system textbook example.",
  },
];

export default quiz;
