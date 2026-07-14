import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "tree-terms-mcq",
    type: "mcq",
    prompt: "In a binary tree, what is a node with no children called?",
    options: ["A leaf", "A root", "An ancestor", "A sibling"],
    answer: 0,
    explanation:
      "A leaf is a node with no children. The root is the single top-level node everything descends from; ancestors/descendants describe relationships along a path, not a specific position.",
  },
  {
    id: "tree-inorder-predict",
    type: "predict",
    prompt: "Given this tree, what does inorder traversal print?",
    code: `//        5
//      /   \\
//     3     8
//    / \\
//   1   4

inorder(root) { print($0) }`,
    options: ["1, 3, 4, 5, 8", "5, 3, 1, 4, 8", "1, 4, 3, 8, 5", "5, 3, 8, 1, 4"],
    answer: 0,
    explanation:
      "Inorder visits left subtree, then node, then right subtree. On a valid BST this always produces values in sorted order: 1, 3, 4, 5, 8 -- inorder's defining property and the reason it's used to verify or sort a BST.",
  },
  {
    id: "tree-traversal-fill",
    type: "fill",
    prompt: "The traversal that visits a node BEFORE its children (node, then left, then right) is called ___ traversal.",
    answers: ["preorder", "pre-order"],
    hint: "The prefix tells you when the node itself is visited relative to its children.",
    explanation:
      "Preorder visits the node first, then recurses left, then right -- useful for copying a tree since the parent is created before its children. Postorder is the reverse (children before node); inorder is left-node-right.",
  },
  {
    id: "tree-bst-search-complexity",
    type: "mcq",
    prompt: "Why is search on a balanced BST O(log n) instead of O(n)?",
    options: [
      "Each comparison at a node eliminates an entire subtree, halving the remaining search space at every step",
      "BSTs cache all previous search results, so repeated queries reuse prior comparisons instead of re-traversing the tree",
      "BST nodes are stored in a sorted array underneath, giving binary-search performance automatically without extra traversal",
      "It's actually O(n); O(log n) is a common misconception that applies only to perfectly balanced trees with a special structure",
    ],
    answer: 0,
    explanation:
      "At every node, comparing the target against the node's value rules out one whole subtree (everything smaller or everything bigger) in a single step -- the same halving idea as binary search on a sorted array, giving O(height), which is O(log n) when the tree is balanced.",
  },
  {
    id: "tree-degenerate-fill",
    type: "fill",
    prompt: "Inserting already-sorted values into a plain BST with no rebalancing makes the tree degenerate into a ___ (a straight line), giving O(n) height.",
    answers: ["linked list"],
    hint: "It's a data structure covered in an earlier lesson -- a straight chain of single-child nodes.",
    explanation:
      "Sorted input makes every new value go the same direction (all right, or all left), so the tree becomes a single chain -- structurally identical to a linked list -- with height n instead of log n, and every operation degrades to O(n).",
  },
  {
    id: "tree-delete-two-children",
    type: "mcq",
    prompt: "When deleting a BST node that has two children, what's the correct approach?",
    options: [
      "Replace the node's value with its inorder successor (smallest value in its right subtree), then delete that successor from its original position",
      "Remove the node and leave both children as disconnected orphaned subtrees, relying on ARC to eventually reclaim them from memory",
      "Always promote the left child to take the deleted node's place, then re-insert every node from the right subtree individually starting from the new root",
      "Delete the entire subtree rooted at that node along with all its descendants, since reconnecting two separate children to a single parent slot is structurally impossible",
    ],
    answer: 0,
    explanation:
      "You can't simply remove a two-child node without orphaning a subtree. The inorder successor (leftmost node of the right subtree) is guaranteed to fit the ordering rule in the deleted node's place, and since it's leftmost it has at most one child, reducing its own removal to the easy one-child or no-child case.",
  },
  {
    id: "tree-balancing-senior",
    type: "mcq",
    prompt: "What guarantee does a self-balancing tree (AVL, red-black) provide that a plain BST doesn't?",
    options: [
      "Height stays O(log n) regardless of insertion order, by performing rotations after inserts/deletes that would otherwise unbalance the tree",
      "It guarantees O(1) search regardless of tree size, by maintaining a hash index alongside the pointer structure for constant-time lookups",
      "It eliminates the need for a comparison operator on stored values, because the tree's structure encodes order without directly comparing keys",
      "It automatically sorts data faster than any comparison-based structure, beating the O(n log n) lower bound through structural reuse of earlier insertions",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A self-balancing tree does extra bookkeeping on every insert/delete -- checking balance and applying local rotations when needed -- to guarantee height stays logarithmic no matter what order values arrive in, so operations stay O(log n) even on already-sorted input that would degrade a plain BST to O(n).",
  },
  {
    id: "tree-traversal-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about tree traversals.",
    options: [
      "Preorder, inorder, and postorder are all typically implemented with recursion (or an explicit stack)",
      "Level order traversal typically uses a queue, not the call stack",
      "Inorder traversal on a BST always visits values in sorted order",
      "Postorder is the right choice when you need to process a node before either of its children",
    ],
    answers: [0, 1, 2],
    explanation:
      "Preorder/inorder/postorder are naturally recursive (or stack-based); level order uses a queue to go depth by depth, matching breadth-first search. Inorder-on-BST-equals-sorted is a core property. The last option is backwards: postorder processes a node AFTER both children (useful for bottom-up work like deletion), not before -- that's preorder's job.",
  },
  {
    id: "tree-flashcard",
    type: "flashcard",
    prompt:
      "Explain the four traversal orders, the BST ordering property, why balance matters, and the general recursion pattern for tree problems. Answer aloud, then reveal.",
    modelAnswer:
      "A **binary tree** node has up to two children, `left` and `right`; a node with none is a **leaf**, and the top node is the **root**. The three recursive traversals share one shape with `visit` moved: **preorder** (node, left, right) visits before descending, useful for copying; **postorder** (left, right, node) visits after both children are done, useful for bottom-up work like deletion or computing subtree size; **inorder** (left, node, right) visits left-to-right, and on a **binary search tree** always yields sorted order because the BST rule guarantees left-subtree-smaller, right-subtree-bigger at every node. **Level order** uses a queue instead of recursion, visiting one depth at a time -- the tree analog of breadth-first search. BST search/insert/delete are all O(height): each comparison eliminates a whole subtree, so height O(log n) gives O(log n) operations, but a plain BST fed already-sorted input degenerates into a straight line (height O(n)) -- which is exactly what self-balancing trees (AVL, red-black) prevent, via rotations that keep height logarithmic regardless of insertion order. Deleting a two-child node requires promoting its inorder successor (leftmost node of the right subtree) rather than just removing it, to avoid orphaning a subtree. The general recursion pattern: define a base case for `nil`, trust that recursive calls already correctly solve smaller subtrees, and combine left/right results at the current node.",
    keyPoints: [
      "Preorder/inorder/postorder differ only in when 'visit' happens relative to left/right recursion",
      "Inorder on a BST = sorted order, because left is always smaller and right always bigger",
      "Level order uses a queue (BFS shape), not the call stack",
      "BST operations are O(height); unbalanced (e.g. sorted-input) BSTs degrade to O(n)",
      "Deleting a two-child node: promote the inorder successor, then delete it from its original spot",
    ],
    explanation:
      "A senior answer connects height directly to complexity, explains why sorted input is the adversarial case for a plain BST, and can name that self-balancing trees fix it via rotations without needing to implement them.",
  },
];

export default quiz;
