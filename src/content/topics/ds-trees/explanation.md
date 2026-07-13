## The problem: a linked list is still just one line

```swift
class Node<T> {
    var value: T
    var next: Node<T>?
    init(value: T, next: Node<T>? = nil) { self.value = value; self.next = next }
}
```

A linked list node points to exactly one other node, so the whole structure is a straight line — to find anything, you walk it end to end, O(n). A **tree** relaxes that one rule: a node can point to *more* than one other node. That branching is what lets a tree represent hierarchy — a filesystem's folders, an app's view hierarchy, a decision process — and, for the right shape of tree, turn that O(n) walk into an O(log n) one.

## Tree terminology

```swift
class TreeNode<T> {
    var value: T
    var left: TreeNode<T>?
    var right: TreeNode<T>?
    init(_ value: T) { self.value = value }
}

let leaf1 = TreeNode(4)
let leaf2 = TreeNode(6)
let mid = TreeNode(5)
mid.left = leaf1
mid.right = leaf2
let top = TreeNode(3)
top.right = mid
```

This builds:

```swift
//     3
//      \
//       5
//      / \
//     4   6
```

`top` is the **root** — the single node everything else descends from. `mid` and `leaf1`/`leaf2` are `top`'s **descendants**; `top` is their **ancestor**. `mid` is the **parent** of `leaf1` and `leaf2`; they are its **children**. Since each `TreeNode` has at most two children (`left` and `right`), this specific shape is a **binary tree**. A node with no children — `leaf1`, `leaf2` — is called a **leaf**.

Two more terms describe *where* a node sits: its **depth** is how many steps up to the root (`top` has depth 0, `mid` has depth 1, the leaves have depth 2). The tree's **height** is the depth of its deepest leaf — here, 2. Height is the number that governs how expensive a walk from root to leaf is, which is why balancing (covered later) cares about it directly.

## Traversals: the order you visit nodes

A **traversal** is a rule for the order in which you visit every node. There are four standard ones, and three of them share almost identical code — only the position of one line changes.

Start with the tree from above and build **inorder** traversal: visit left subtree, then the node itself, then right subtree.

```swift
func inorder<T>(_ node: TreeNode<T>?, _ visit: (T) -> Void) {
    guard let node = node else { return }
    inorder(node.left, visit)
    visit(node.value)
    inorder(node.right, visit)
}

inorder(top) { print($0) }
```

Trace it one step at a time. `inorder(top)` first recurses into `top.left`, which is `nil`, so that call returns immediately doing nothing. Then it visits `top` itself, printing `3`.

Next it recurses into `top.right` (`mid`), which repeats the exact same pattern one level down: visit `mid.left` (`leaf1`, printing `4`), then visit `mid` itself (`5`), then visit `mid.right` (`leaf2`, printing `6`).

Put together, the full order is `3, 4, 5, 6`.

**Preorder** and **postorder** are the same shape with `visit` moved:

```swift
func preorder<T>(_ node: TreeNode<T>?, _ visit: (T) -> Void) {
    guard let node = node else { return }
    visit(node.value)          // visit BEFORE the children
    preorder(node.left, visit)
    preorder(node.right, visit)
}

func postorder<T>(_ node: TreeNode<T>?, _ visit: (T) -> Void) {
    guard let node = node else { return }
    postorder(node.left, visit)
    postorder(node.right, visit)
    visit(node.value)          // visit AFTER the children
}

preorder(top) { print($0) }    // 3, 5, 4, 6
postorder(top) { print($0) }   // 4, 6, 5, 3
```

Preorder visits a node the moment it's reached, before descending — useful for copying a tree, since you create the parent before its children. Postorder visits a node only after both its subtrees are fully done — useful for deleting a tree bottom-up, or computing something that depends on children's results first (like subtree size or height).

The fourth traversal, **level order**, doesn't recurse at all — it visits every node one *depth* at a time, left to right, using a queue (from the stacks & queues lesson) instead of the call stack.

```swift
func levelOrder<T>(_ root: TreeNode<T>?) -> [T] {
    guard let root = root else { return [] }
    var result: [T] = []
    var queue: [TreeNode<T>] = [root]

    while !queue.isEmpty {
        let node = queue.removeFirst()
        result.append(node.value)
        if let l = node.left { queue.append(l) }
        if let r = node.right { queue.append(r) }
    }
    return result
}

levelOrder(top)   // [3, 5, 4, 6]
```

The queue starts holding just `top`. Each loop pops the front, records its value, and enqueues its children (if any) at the back — so the whole first depth level finishes before the next level starts. This is the tree version of breadth-first search, which the graphs lesson generalizes further.

Predict: for the tree above, does inorder or preorder change if you swap `mid.left` and `mid.right`?

Answer: both change, but differently. Inorder becomes `3, 6, 5, 4` (left-node-right still holds, but "left" is now the old right subtree) — inorder's defining property, visiting nodes left-to-right, is exactly what makes it special for BSTs, covered next. Preorder becomes `3, 5, 6, 4` — the node still comes first, only the child order flips.

## Binary search trees

A **binary search tree** (BST) adds one ordering rule on top of the plain binary tree: for every node, everything in its left subtree is smaller, and everything in its right subtree is bigger.

```swift
class BST<T: Comparable> {
    var root: TreeNode<T>?

    func insert(_ value: T) {
        root = insertHelper(root, value)
    }

    private func insertHelper(_ node: TreeNode<T>?, _ value: T) -> TreeNode<T> {
        guard let node = node else { return TreeNode(value) }
        if value < node.value {
            node.left = insertHelper(node.left, value)
        } else if value > node.value {
            node.right = insertHelper(node.right, value)
        }
        return node
    }
}

let tree = BST<Int>()
[5, 3, 8, 1, 4].forEach { tree.insert($0) }
```

Trace the inserts: `5` becomes the root. `3 < 5` goes left of `5`. `8 > 5` goes right of `5`. `1 < 5` goes left, then `1 < 3` goes left of `3`. `4 < 5` goes left, then `4 > 3` goes right of `3`.

```swift
//        5
//      /   \
//     3     8
//    / \
//   1   4
```

This is exactly why inorder traversal on a BST visits every value in sorted order — `1, 3, 4, 5, 8` — since inorder always does left, then node, then right, and the BST rule guarantees left is smaller and right is bigger at every single node.

Search follows the same left/right decision as insert, which is what makes it fast:

```swift
func search<T: Comparable>(_ node: TreeNode<T>?, _ target: T) -> Bool {
    guard let node = node else { return false }
    if target == node.value { return true }
    return target < node.value ? search(node.left, target) : search(node.right, target)
}

search(tree.root, 4)    // true
search(tree.root, 7)    // false
```

At every node, one comparison eliminates an entire subtree — searching for `4` never even looks at `8` or anything under it, because `4 < 5` rules out the whole right side in one comparison. That's the same halving idea as binary search on a sorted array, and it's why search, insert, and delete are all O(height) — which is O(log n) *if the tree stays balanced*, a condition explored below.

Deletion is the trickiest of the three, because removing a node can't just leave a hole — the BST ordering must survive. Three cases:

```swift
// Case 1: node has no children -> just remove it
// Case 2: node has one child -> replace it with that child
// Case 3: node has two children -> replace its value with its
//         INORDER SUCCESSOR (smallest value in its right subtree),
//         then delete that successor from the right subtree
```

```swift
func delete<T: Comparable>(_ node: TreeNode<T>?, _ value: T) -> TreeNode<T>? {
    guard let node = node else { return nil }
    if value < node.value {
        node.left = delete(node.left, value)
    } else if value > node.value {
        node.right = delete(node.right, value)
    } else {
        // found the node to delete
        if node.left == nil { return node.right }
        if node.right == nil { return node.left }
        // two children: find the smallest value in the right subtree
        var successor = node.right!
        while let next = successor.left { successor = next }
        node.value = successor.value
        node.right = delete(node.right, successor.value)
    }
    return node
}
```

The two-children case is the one worth narrating out loud: you can't just delete a node with two children, because you'd orphan one of its subtrees. Instead, borrow a value that's guaranteed to fit in its place — the smallest value bigger than everything in the left subtree, which is the leftmost node of the right subtree, called the **inorder successor**. Copy that value up, then delete the (now-duplicated) successor from where it originally was — and the successor itself has at most one child (it's the leftmost node, so it has no left child), which reduces that deletion to the easy case 1 or 2.

## Balancing, in overview

Every BST operation above runs in O(height). The problem: nothing stops a BST from becoming a straight line.

```swift
let sorted = BST<Int>()
[1, 2, 3, 4, 5].forEach { sorted.insert($0) }
```

Each new value is bigger than everything before it, so every insert goes right, right, right — the tree degenerates into a linked list with height 5, not the roughly-log₂(5) ≈ 2.3 height a bushy tree would have. Search, insert, and delete all become O(n) in this shape — the exact problem trees were supposed to avoid.

A **self-balancing tree** — AVL trees and red-black trees are the two classic examples — fixes this by doing extra bookkeeping on every insert/delete: after the ordinary BST insert, it checks whether the tree became too lopsided and, if so, performs a **rotation** (a local restructuring that shuffles a few pointers to shorten one side and lengthen the other) to restore balance. The guarantee those extra rotations buy is that height stays O(log n) no matter what order values arrive in, so every operation stays O(log n) instead of degrading to O(n) on already-sorted input.

The full mechanics of AVL and red-black rotations are their own deep topic and rarely asked to be implemented from scratch in an interview — what matters here is recognizing *why* balancing exists (a plain BST can degrade to O(n) on adversarial or sorted input) and being able to name that a self-balancing structure fixes it by keeping height logarithmic through rotations.

## Recursion patterns

Nearly every tree function above shares one shape: check the base case (`node == nil`), do something with the current node, and recurse into the children — trusting that the recursive call already correctly solves the smaller subtree. This trust — assuming the recursive call just works on smaller input, without mentally unrolling the whole call stack — is what makes tree recursion tractable.

A second common shape *combines* results from both children rather than just visiting nodes:

```swift
func height<T>(_ node: TreeNode<T>?) -> Int {
    guard let node = node else { return -1 }   // empty tree has height -1
    return 1 + max(height(node.left), height(node.right))
}

func isBalanced<T>(_ node: TreeNode<T>?) -> Bool {
    guard let node = node else { return true }
    let diff = abs(height(node.left) - height(node.right))
    return diff <= 1 && isBalanced(node.left) && isBalanced(node.right)
}
```

`height` trusts that `height(node.left)` and `height(node.right)` are already correct for the subtrees, and just combines them: one plus the taller side. `isBalanced` reuses `height` the same way, checking the two subtree heights don't differ by more than 1 at *every* node, not just the root — a tree can look balanced at the top while being lopsided three levels down.

## Common pitfalls

- *Forgetting the base case.* Every tree recursion needs `guard let node = node else { return ... }` (or equivalent) — skip it and a `nil` child crashes instead of quietly ending that branch.
- *Deleting a two-child node by just nulling it out.* That orphans an entire subtree. Always promote the inorder successor (or predecessor) and delete it from its original spot.
- *Assuming a BST is automatically balanced.* Inserting already-sorted data degrades a plain BST to a linked list, O(n) height. If input order isn't controlled, a self-balancing tree (or sorting + building from the middle out) is the real fix.

## Interview lens

If asked to implement a traversal, get preorder/inorder/postorder right cold — they're the same three lines with `visit` in a different position, and mixing them up under pressure is a common tell. Know inorder's special property by heart: inorder on a BST always yields sorted order, which is the fastest way to verify a tree is a valid BST or to get its values sorted without a separate sort.

For BST operations, narrate the O(height) reasoning explicitly — search/insert/delete are all O(log n) *only if the tree is balanced*, and a sorted-input BST degrading to O(n) is a favorite follow-up question. You don't need to implement AVL rotations from memory, but you should be able to say *why* they exist and that the guarantee is height staying O(log n) regardless of insertion order.

When solving a new tree problem, default first to the "trust the recursion" framing: define what the function returns for a subtree, write the base case, then combine the left and right results — `height` and `isBalanced` above are the template most tree problems reduce to.
