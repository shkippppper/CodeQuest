import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "graph-list-vs-matrix",
    type: "mcq",
    prompt: "Why is an adjacency list usually preferred over an adjacency matrix for a sparse graph (few edges relative to vertices)?",
    options: [
      "Memory scales with the actual number of edges, not vertices squared, so a sparse graph avoids storing mostly-empty cells",
      "Adjacency lists provide O(1) edge-existence checks by hashing neighbor sets, which matrices cannot match for large graphs",
      "Adjacency matrices cannot represent directed graphs because each cell encodes an undirected relationship between two vertices",
      "Adjacency lists are always faster than matrices for every graph operation regardless of graph density or query type",
    ],
    answer: 0,
    explanation:
      "A matrix is always n x n regardless of edge count, wasting space on a sparse graph. A list only stores real edges, at the cost of O(degree) instead of O(1) edge-existence checks -- the opposite of what's claimed in the wrong answer.",
  },
  {
    id: "graph-visited-fill",
    type: "fill",
    prompt: "Unlike tree traversal, graph traversal needs a ___ set to avoid looping forever on a cycle.",
    answers: ["visited"],
    hint: "It tracks which vertices have already been explored.",
    explanation:
      "Trees can't have cycles, so tree traversal never revisits a node by construction. Graphs can have cycles, so BFS/DFS must track visited vertices explicitly to avoid infinite loops.",
  },
  {
    id: "graph-bfs-predict",
    type: "predict",
    prompt: "Given the graph A-B, A-C, B-D, C-D (undirected), what order does BFS starting from A visit vertices in, assuming neighbors are visited in the order they appear in each adjacency list [B, C] for A?",
    code: `let adjacency: [Character: [Character]] = [
    "A": ["B", "C"],
    "B": ["A", "D"],
    "C": ["A", "D"],
    "D": ["B", "C"],
]
bfs(adjacency, start: "A")`,
    options: ["A, B, C, D", "A, B, D, C", "A, C, B, D", "A, D, B, C"],
    answer: 0,
    explanation:
      "BFS visits everything one edge away before anything two edges away. A's direct neighbors are B and C (distance 1) -- both get queued and visited before D, which is only reachable at distance 2 via B or C. Order: A, B, C, D.",
  },
  {
    id: "graph-bfs-shortest-path",
    type: "mcq",
    prompt: "Why does BFS find the shortest path (fewest edges) on an unweighted graph the first time it reaches a vertex?",
    options: [
      "BFS fully explores every vertex at distance k before exploring any vertex at distance k+1, so nothing farther away can be discovered before something closer",
      "BFS always picks the edge with the smallest weight first, which naturally orders the search by cumulative path length before allowing any deeper expansion toward the target",
      "BFS does not find shortest paths — DFS is the correct algorithm because it exhaustively explores all routes through backtracking and can compare their total edge counts to return the minimum",
      "BFS collects every possible path from source to target during traversal, then sorts them all by total edge count at the end before returning the shortest discovered route",
    ],
    answer: 0,
    explanation:
      "BFS processes vertices layer by layer using a queue: everything at distance 1 is fully queued and will be dequeued before anything at distance 2 is even discovered. That layer-by-layer guarantee is exactly why the first time BFS reaches a vertex, it's via a shortest path.",
  },
  {
    id: "graph-toposort-fill",
    type: "fill",
    prompt: "A topological sort only makes sense on a directed graph with no cycles, called a directed ___ graph, abbreviated DAG.",
    answers: ["acyclic"],
    hint: "The opposite of 'has cycles.'",
    explanation:
      "DAG = directed acyclic graph. A cycle would create a contradiction like 'A must come before B, but B must come before A,' which has no valid ordering -- so topological sort is undefined on graphs with cycles.",
  },
  {
    id: "graph-dijkstra-negative-senior",
    type: "mcq",
    prompt: "Why does Dijkstra's algorithm give wrong answers on a graph with negative edge weights?",
    options: [
      "It finalizes a vertex's shortest distance once found and never revisits it, so a later negative edge that would make an earlier path cheaper gets missed",
      "Dijkstra throws a runtime crash or assertion failure on any graph that contains even a single negative edge weight, rather than silently producing incorrect or inconsistent distance values",
      "Dijkstra does not support weighted graphs at all; it internally treats every edge as having a unit weight of 1 and ignores any weight values present in the input graph",
      "Any negative-weight edge automatically introduces a negative-weight cycle somewhere in the graph, making the concept of a shortest path undefined for every pair of vertices in that graph",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Dijkstra greedily commits to the closest unvisited vertex's distance as final. With negative weights, a path discovered later through a negative edge could actually be cheaper than the 'finalized' distance -- but Dijkstra never goes back to check. Bellman-Ford handles this correctly by relaxing all edges repeatedly.",
  },
  {
    id: "graph-cycle-directed-vs-undirected-senior",
    type: "mcq",
    prompt: "Why can't the undirected cycle-detection trick (flag a cycle if you reach a visited vertex that isn't your parent) be reused directly for directed graphs?",
    options: [
      "In a directed graph, reaching an already-visited vertex from an unrelated earlier branch isn't a cycle -- only reaching a vertex still on the CURRENT path (tracked separately, e.g. with an 'in-stack' set) is",
      "Directed graphs cannot contain cycles by definition; a directed edge from A to B can never be part of any path that eventually loops back from B to A through other directed edges",
      "The parent-exclusion trick works identically for both directed and undirected graphs without modification; simply excluding the immediate parent node is sufficient to avoid all false-positive cycle detections in directed graphs",
      "Directed graphs do not support DFS traversal at all, because directed edges can only be followed in their designated direction and backtracking during DFS requires traversing edges in reverse",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Undirected edges are stored both ways, so every edge looks like an immediate 'cycle back' unless you exclude the parent. Directed edges only go one way, so the real question is whether you've looped back to an ancestor still on your current DFS path -- which requires tracking an in-stack set, not just excluding the immediate parent.",
  },
  {
    id: "graph-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about graph traversal and algorithms.",
    options: [
      "DFS is naturally implemented with recursion or an explicit stack, matching its LIFO 'go deep first' behavior",
      "BFS is the right choice when the question is really asking about shortest path on an unweighted graph",
      "Topological sort can be built from DFS by pushing each vertex onto a stack in postorder, then reversing",
      "An adjacency matrix always uses less memory than an adjacency list, for any graph",
    ],
    answers: [0, 1, 2],
    explanation:
      "DFS's depth-first, backtrack-when-stuck behavior matches a stack/recursion naturally. BFS's layer-by-layer guarantee makes it the shortest-path tool on unweighted graphs. Topological sort via DFS postorder-then-reverse is the standard technique. The memory claim is false: an adjacency matrix is always n x n regardless of edge count, which is WORSE than a list for sparse graphs (few edges).",
  },
  {
    id: "graph-flashcard",
    type: "flashcard",
    prompt:
      "Explain graph representations, BFS vs DFS, topological sort, and the shortest-path algorithm decision tree. Answer aloud, then reveal.",
    modelAnswer:
      "A **graph** generalizes a tree by allowing any number of connections (**edges**) between vertices, with no required root and possible cycles. It's stored as an **adjacency matrix** (n x n grid, O(1) edge check, wasteful for sparse graphs) or **adjacency list** (per-vertex neighbor list, memory proportional to actual edges, the default for sparse real-world graphs). **BFS** explores layer by layer using a queue, marking vertices visited on enqueue to avoid re-queuing through cycles; because it finishes each distance layer before starting the next, the first time it reaches a vertex is via the shortest path (unweighted). **DFS** explores one path all the way down before backtracking, using recursion or a stack; it's the tool for path-existence, connectivity, and structural questions rather than shortest distance. **Topological sort** (only valid on a DAG -- directed, acyclic) runs DFS from every unvisited vertex, pushes each vertex onto a stack in postorder (after all its neighbors finish), and reverses the stack, guaranteeing dependencies come before dependents. For weighted shortest path: BFS only works unweighted; **Dijkstra** handles non-negative weights using a priority queue and greedy distance-finalization, but breaks on negative weights because it never revisits a finalized vertex; **Bellman-Ford** is slower but correct with negative weights and can detect negative cycles. **Cycle detection** differs by graph type: undirected uses a visited-but-not-parent check; directed needs an in-stack set tracking the current DFS path, since only an ancestor still on that path constitutes a real cycle.",
    keyPoints: [
      "Adjacency list for sparse graphs (most real ones); matrix for O(1) edge checks or dense graphs",
      "BFS = queue, layer by layer, finds shortest path on unweighted graphs; mark visited on enqueue",
      "DFS = stack/recursion, depth-first; used for path existence, connectivity, topological sort",
      "Topological sort: DFS postorder push, then reverse; only valid on a DAG",
      "Shortest path: BFS (unweighted) -> Dijkstra (non-negative weights) -> Bellman-Ford (negative weights allowed)",
      "Cycle detection: undirected uses parent-exclusion; directed needs an in-stack/current-path set",
    ],
    explanation:
      "A senior answer states the shortest-path decision tree unprompted (BFS/Dijkstra/Bellman-Ford) with the reason Dijkstra fails on negative weights, and correctly distinguishes the directed vs undirected cycle-detection techniques rather than treating them as interchangeable.",
  },
];

export default quiz;
