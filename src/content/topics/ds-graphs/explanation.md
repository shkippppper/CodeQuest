## The problem: trees can't represent everything

```swift
class TreeNode<T> {
    var value: T
    var left: TreeNode<T>?
    var right: TreeNode<T>?
}
```

A tree has one root and every node has exactly one parent — that shape can't represent a friend network where "who follows whom" loops back on itself, or a road map where two cities connect both ways, or a build system where one package depends on several others which depend on some of the same shared packages. A **graph** generalizes trees by dropping both restrictions: any node (called a **vertex**) can connect to any number of others via a connection called an **edge**, and there's no required root or single parent.

```swift
// A --- B
// |     |
// C --- D
```

Four vertices, four edges, and — unlike a tree — a cycle: A to B to D to C back to A.

## Representations: matrix vs list

The two standard ways to store a graph in code trade memory for lookup speed.

An **adjacency matrix** is a grid where `matrix[i][j]` is `true` (or a weight) if there's an edge from vertex `i` to vertex `j`.

```swift
// vertices: 0=A, 1=B, 2=C, 3=D
let matrix: [[Bool]] = [
    [false, true,  true,  false],  // A -> B, A -> C
    [true,  false, false, true],   // B -> A, B -> D
    [true,  false, false, true],   // C -> A, C -> D
    [false, true,  true,  false],  // D -> B, D -> C
]
matrix[0][1]   // true -- is there an edge A -> B?
```

Checking whether an edge exists is O(1) — one array lookup. But the matrix is `n × n` regardless of how many edges actually exist, so a graph with 1,000 vertices and only 2,000 edges still allocates a million cells, almost all `false`.

An **adjacency list** stores, for each vertex, only the vertices it actually connects to.

```swift
let adjacency: [Character: [Character]] = [
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A", "D"],
    "D": ["B", "C"],
]
adjacency["A"]!.contains("B")   // true -- is there an edge A -> B? O(degree of A)
```

Memory is proportional to the actual number of edges, not vertices squared — for a **sparse** graph (few edges relative to possible edges), this is far cheaper. The trade-off: checking whether a *specific* edge exists means scanning one vertex's list, O(degree of that vertex), instead of one O(1) matrix lookup. Most real-world graphs (social networks, road maps, dependency graphs) are sparse, which is why adjacency lists are the default choice in interviews unless told otherwise.

One more distinction cuts across both representations: a graph is **directed** if edges only go one way (A → B doesn't imply B → A, like a one-way street or "follows" on social media) or **undirected** if every edge is mutual (like the A/B/C/D example above, where every connection is listed both ways).

## Breadth-first search (BFS)

**BFS** explores a graph one distance-layer at a time — everything 1 edge away, then everything 2 edges away, and so on. It's the exact same queue-driven shape as level-order tree traversal, generalized to handle cycles.

```swift
func bfs(_ graph: [Character: [Character]], start: Character) -> [Character] {
    var visited: Set<Character> = [start]
    var queue: [Character] = [start]
    var order: [Character] = []

    while !queue.isEmpty {
        let current = queue.removeFirst()
        order.append(current)
        for neighbor in graph[current] ?? [] {
            if !visited.contains(neighbor) {
                visited.insert(neighbor)
                queue.append(neighbor)
            }
        }
    }
    return order
}

bfs(adjacency, start: "A")   // [A, B, C, D]
```

The one line that wasn't needed in a tree traversal is `visited`. Trees can't have cycles, so a tree traversal never revisits a node by construction. A graph can: without `visited`, `A → B → A → B → ...` would loop forever. Marking a vertex visited *the moment it's enqueued* (not when it's dequeued) is what prevents the same vertex from being queued twice through two different paths before either gets processed.

Predict: in the graph above, if you started BFS from `A` but used a plain `Array` for `queue` and called `removeFirst()`, would the *output order* differ from using a proper O(1) dequeue structure?

Answer: no — the order would be identical either way; `removeFirst()` on an array is just a slower way (O(n) per call) to get the same FIFO behavior described in the stacks & queues lesson. Correctness doesn't change, only performance on large graphs.

BFS's headline property: on an unweighted graph, the first time BFS reaches a vertex, it has found the *shortest path* to it, measured in number of edges — because BFS finishes an entire distance-layer before starting the next one, nothing farther away can be discovered first.

## Depth-first search (DFS)

**DFS** explores as far as possible down one path before backtracking, instead of spreading out layer by layer. It's written recursively — or with an explicit stack, since "go deep, then come back" is exactly LIFO behavior.

```swift
func dfs(_ graph: [Character: [Character]], start: Character, visited: inout Set<Character>, order: inout [Character]) {
    visited.insert(start)
    order.append(start)
    for neighbor in graph[start] ?? [] {
        if !visited.contains(neighbor) {
            dfs(graph, start: neighbor, visited: &visited, order: &order)
        }
    }
}

var visited: Set<Character> = []
var order: [Character] = []
dfs(adjacency, start: "A", visited: &visited, order: &order)
order   // [A, B, D, C]
```

Trace it: start at `A`, mark visited, record it. Look at `A`'s neighbors, `[B, C]` — go to `B` first, all the way down, before ever looking at `C`. At `B`, mark visited, record it, look at `B`'s neighbors `[A, D]` — `A` is already visited, so skip it, go to `D`. At `D`, mark visited, record it, look at `D`'s neighbors `[B, C]` — `B` visited, skip; go to `C`. At `C`, mark visited, record it, look at `C`'s neighbors `[A, D]` — both visited, nothing left to do, backtrack all the way up. Final order: `A, B, D, C`.

Same `visited` guard as BFS, same reason — without it, cycles cause infinite recursion. The difference from BFS is purely *which* neighbor gets explored next: BFS explores every neighbor before going deeper into any of them (queue, FIFO); DFS commits to one neighbor and goes all the way down before trying the next (stack/recursion, LIFO).

DFS is the natural fit whenever the question is about *paths* or *structure* rather than *shortest distance*: does a path exist at all between two vertices, is the whole graph connected, does a cycle exist, or — covered next — what order do dependent tasks need to run in.

## Topological sort

A **topological sort** orders the vertices of a directed graph so that every edge points from earlier in the order to later — the natural fit for "which tasks must happen before which," like a build system's package dependencies or a course prerequisite chain.

```swift
// shirt -> jacket   (put shirt on before jacket)
// pants -> jacket
// pants -> shoes
let deps: [String: [String]] = [
    "shirt": ["jacket"],
    "pants": ["jacket", "shoes"],
    "jacket": [],
    "shoes": [],
]
```

This only makes sense on a **directed acyclic graph** (DAG) — directed, and without cycles, since a cycle would mean "shirt before jacket before shirt," an impossible ordering to satisfy.

The DFS-based approach: run DFS from every unvisited vertex, and each time a vertex finishes exploring *all* of its neighbors (the postorder moment from the trees lesson — process after children are done), push it onto a stack. Reverse the stack at the end.

```swift
func topologicalSort(_ graph: [String: [String]]) -> [String] {
    var visited: Set<String> = []
    var stack: [String] = []

    func visit(_ node: String) {
        guard !visited.contains(node) else { return }
        visited.insert(node)
        for neighbor in graph[node] ?? [] {
            visit(neighbor)
        }
        stack.append(node)   // postorder: push AFTER all neighbors are done
    }

    for node in graph.keys {
        visit(node)
    }
    return stack.reversed()
}

topologicalSort(deps)   // e.g. [pants, shirt, shoes, jacket] -- both valid orders satisfy the constraint
```

Why does pushing in postorder and reversing work? A vertex only gets pushed once *everything it points to* has already finished and been pushed — so on the stack, dependencies always end up above (later-pushed than) the things that depend on them. Reversing flips that so dependencies come first, which is the correct build order.

## Shortest path, in overview

Plain BFS finds the shortest path in an **unweighted** graph — every edge counts as one step. Real-world graphs often have **weighted** edges (a road's distance, a flight's cost), where the fewest-edges path isn't necessarily the cheapest one.

**Dijkstra's algorithm** solves shortest path on a weighted graph with non-negative weights. Instead of a plain queue, it uses a priority queue (covered in the heaps lesson) that always expands the *currently closest* unvisited vertex next, and it relaxes each neighbor's distance — updating it if going through the current vertex would be cheaper than the best distance found so far. If some edge weights are negative, Dijkstra can give wrong answers (it never reconsiders a vertex once finalized), and the **Bellman-Ford algorithm** is the fix — slower, O(V·E) instead of Dijkstra's roughly O(E log V), but correct with negative weights and able to detect a negative-weight cycle, which would make "shortest path" undefined in the first place.

The interview-relevant summary: unweighted → BFS; weighted, non-negative → Dijkstra; weighted, possibly negative → Bellman-Ford. Full priority-queue-driven implementation of Dijkstra is a natural follow-up in a senior interview, but knowing which tool fits which constraint is the first thing to get right.

## Cycle detection

Whether a cycle exists depends on whether the graph is directed, and the two cases need different logic.

For an **undirected** graph, DFS with a simple twist works: if you ever reach an already-visited vertex that isn't the one you just came from, there's a cycle.

```swift
func hasCycleUndirected(_ graph: [Character: [Character]], _ node: Character, _ parent: Character?, _ visited: inout Set<Character>) -> Bool {
    visited.insert(node)
    for neighbor in graph[node] ?? [] {
        if !visited.contains(neighbor) {
            if hasCycleUndirected(graph, neighbor, node, &visited) { return true }
        } else if neighbor != parent {
            return true   // reached a visited node that isn't where we came from
        }
    }
    return false
}
```

The `parent` check matters because an undirected edge A—B is stored both ways (A's neighbor list contains B, and B's contains A) — without excluding `parent`, every single edge would look like a cycle back to where you just came from.

For a **directed** graph, that trick doesn't work — you need to distinguish "visited earlier, in a totally different branch" from "visited right now, still on the current path back to me," because only the second one is an actual cycle.

```swift
func hasCycleDirected(_ graph: [Character: [Character]], _ node: Character, _ visited: inout Set<Character>, _ inStack: inout Set<Character>) -> Bool {
    visited.insert(node)
    inStack.insert(node)
    for neighbor in graph[node] ?? [] {
        if !visited.contains(neighbor) {
            if hasCycleDirected(graph, neighbor, &visited, &inStack) { return true }
        } else if inStack.contains(neighbor) {
            return true   // neighbor is an ancestor on the CURRENT path -- a cycle
        }
    }
    inStack.remove(node)   // done exploring this node's branch, take it off the current path
    return false
}
```

`inStack` tracks only the vertices on the current DFS path from the root down to where you are right now — it's added when you enter a node and removed when you finish exploring all of that node's branches. A neighbor that's `visited` but *not* in `inStack` was fully explored in some earlier, unrelated branch — no cycle. A neighbor that's `visited` *and* in `inStack` is an ancestor still on your current path — you've looped back, a real cycle.

## Common pitfalls

- *Forgetting `visited` entirely.* Unlike trees, graphs can have cycles — skip the visited check and BFS/DFS can loop forever.
- *Marking BFS nodes visited on dequeue instead of enqueue.* If two different vertices both point to the same unvisited neighbor, and that neighbor isn't marked visited until it's dequeued, it can be added to the queue twice before either processing happens — wasted work, and in some variants, incorrect distances.
- *Using the undirected cycle check (parent-exclusion) on a directed graph, or vice versa.* They solve genuinely different problems — directed cycle detection needs the `inStack` "currently on this path" tracking; the simpler parent check is specific to undirected edges being stored both ways.
- *Reaching for Dijkstra on a graph with negative edge weights.* It will run and return an answer — just possibly a wrong one, since it never revisits a vertex once finalized. Bellman-Ford is the correct tool there.

## Interview lens

Start every graph problem by naming the representation choice out loud — adjacency list for sparse graphs (the common case), matrix only if the graph is dense or you need O(1) edge-existence checks — and whether the graph is directed or undirected, weighted or not; that framing alone signals you're thinking about the right trade-offs before writing code.

BFS versus DFS is usually decided by what the question is really asking: shortest path or "closest" anything on an unweighted graph means BFS; anything about paths existing, connectivity, structure, or ordering (topological sort) means DFS. Stating that reason out loud, rather than picking one arbitrarily, is what interviewers are listening for.

For weighted shortest path, know the decision tree cold: BFS if unweighted, Dijkstra if weighted with non-negative edges, Bellman-Ford if negative edges are possible — and be able to say *why* Dijkstra breaks on negative weights (it finalizes a vertex's distance and never reconsiders it, so a later negative edge that would've made an earlier path cheaper gets missed).

Cycle detection is a favorite because it's easy to get subtly wrong: the undirected parent-exclusion trick does not generalize to directed graphs, and mixing them up under pressure is exactly the kind of bug interviewers are trained to look for.
