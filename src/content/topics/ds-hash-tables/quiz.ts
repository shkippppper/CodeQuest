import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "ht-why-fast",
    type: "mcq",
    prompt: "Why does a hash table give O(1) average lookup instead of O(n)?",
    options: [
      "The key is hashed and reduced to a bucket index, so lookup only inspects that one bucket instead of scanning every element",
      "It secretly keeps the data sorted and binary searches it",
      "It caches the last 10 lookups",
      "Swift compiles Dictionary lookups directly into machine code with no runtime cost",
    ],
    answer: 0,
    explanation:
      "Hashing the key deterministically computes which bucket it lives in, so lookup jumps straight there instead of scanning the whole structure — that's the whole mechanism behind O(1) average performance.",
  },
  {
    id: "ht-collision-fill",
    type: "fill",
    prompt: "When two different values hash to the same bucket, that's called a ___.",
    answers: ["collision"],
    hint: "One word — it describes two values 'crashing into' the same bucket.",
    explanation:
      "A collision happens whenever two distinct values are reduced to the same bucket index. It's unavoidable in general (more possible values than buckets), so every hash table needs a strategy to handle it.",
  },
  {
    id: "ht-chaining-vs-open",
    type: "mcq",
    prompt: "What's the key difference between separate chaining and open addressing for collision handling?",
    options: [
      "Chaining stores a small list per bucket so colliding values coexist there; open addressing stores one value per slot and probes forward to the next empty slot on collision",
      "Chaining is only for Dictionary, open addressing only for Set",
      "Open addressing uses linked lists; chaining uses arrays",
      "They're two names for the exact same technique",
    ],
    answer: 0,
    explanation:
      "Separate chaining turns each bucket into a mini-list that grows as collisions occur. Open addressing keeps one value per slot and, on collision, probes subsequent slots until it finds a free one — trading extra list allocations for better memory locality but faster degradation as the table fills.",
  },
  {
    id: "ht-hash-eq-contract",
    type: "predict",
    prompt: "This type breaks the Hashable contract. What goes wrong when it's used in a Set?",
    code: `struct Bad: Hashable {
    let x: Int
    let y: Int
    static func == (l: Bad, r: Bad) -> Bool {
        l.x == r.x && l.y == r.y
    }
    func hash(into hasher: inout Hasher) {
        hasher.combine(x)   // ignores y!
    }
}
var s: Set<Bad> = []
s.insert(Bad(x: 1, y: 1))
s.insert(Bad(x: 1, y: 2))
print(s.count)`,
    options: [
      "It's unpredictable in principle, but here both insert fine and count prints 2 -- they hash to the same bucket but are correctly distinguished by == inside it",
      "It always crashes",
      "The second insert silently does nothing",
      "It always prints 1, deduping the two different values",
    ],
    answer: 0,
    explanation:
      "The two values ARE equal under == only if x and y both match, and here y differs, so they are genuinely distinct elements -- both get stored. They happen to hash to the same bucket (since hash ignores y), causing a collision, but the Set still resolves it correctly via == inside that bucket. The real danger of this bug shows up when it causes equal values to be missed or lookups to behave inconsistently at scale -- the contract violation is latent, not an immediate crash.",
  },
  {
    id: "ht-load-factor-fill",
    type: "fill",
    prompt: "The ratio of stored elements to the number of buckets in a hash table is called its ___ factor.",
    answers: ["load"],
    hint: "It measures how 'full' the table is.",
    explanation:
      "Load factor = elements / bucket count. As it climbs, collisions become more frequent, which is why hash tables resize (grow the bucket array and re-insert everything) once load factor crosses a threshold.",
  },
  {
    id: "ht-resize-amortized",
    type: "mcq",
    prompt: "A hash table resize re-hashes and re-inserts every element into a bigger backing array -- an O(n) operation. Why doesn't this make every insert O(n)?",
    options: [
      "Resizes happen rarely (only when load factor crosses a threshold), so the O(n) cost is spread thin across many O(1) inserts, keeping the amortized cost per insert O(1)",
      "Resizing is actually O(1), not O(n)",
      "Swift performs resizes on a background thread so they don't count",
      "It does make every insert O(n) -- there's no way around it",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "This is the same amortized-cost reasoning as Array.append's occasional buffer growth: an expensive O(n) operation that happens rarely enough, relative to the number of cheap operations between occurrences, doesn't change the average per-operation cost.",
  },
  {
    id: "ht-worst-case-multi",
    type: "multi",
    prompt: "Select **all** true statements about hash table worst-case behavior.",
    options: [
      "A poorly designed hash function that clusters many values into few buckets can degrade lookup to O(n)",
      "A custom hash(into:) that always hashes to the same value would collapse every bucket into one giant list",
      "Hash tables are always O(1) no matter what, by definition",
      "Worst-case behavior is why interviewers sometimes ask you to state average vs worst case separately",
    ],
    answers: [0, 1, 3],
    explanation:
      "Hash tables are O(1) on AVERAGE, not always -- a bad hash function (including a constant one, the worst case) can force every value into the same bucket, degrading every operation to a linear scan, O(n). Knowing this distinction is exactly what interviewers probe for.",
  },
  {
    id: "ht-twosum-senior",
    type: "mcq",
    prompt: "The two-sum problem (find two numbers in an array that sum to a target) has an O(n^2) brute force checking every pair. How does a Dictionary bring it to O(n)?",
    options: [
      "Walk the array once, and for each number look up whether its complement (target - number) was already stored in the Dictionary; if so you're done, otherwise store the current number and its index",
      "Sort the array first, which alone makes it O(n)",
      "Dictionaries can search all pairs simultaneously in hardware",
      "It can't be done better than O(n^2)",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Instead of nested loops checking every pair, one pass stores each number's index as you go and checks, for each new number, whether its complement was already seen -- an O(1) average Dictionary lookup replacing an O(n) inner scan, giving O(n) total.",
  },
  {
    id: "ht-flashcard",
    type: "flashcard",
    prompt:
      "Explain how a hash table achieves O(1) average operations, the two collision strategies, and what breaks if Hashable is implemented incorrectly. Answer aloud, then reveal.",
    modelAnswer:
      "A hash table computes a **hash value** for each key via a hash function, then reduces that hash to an index into a fixed-size array of **buckets**; lookup re-hashes the key and jumps straight to its bucket instead of scanning everything, giving O(1) average time. Because more possible keys exist than buckets, **collisions** (two keys landing in the same bucket) are unavoidable, handled either by **separate chaining** (each bucket holds a small list, colliding values coexist there) or **open addressing** (one value per slot, probing forward to the next free slot on collision). As the **load factor** (elements / bucket count) grows, collisions increase, so the table periodically resizes -- an O(n) re-insert of everything -- but rarely enough that the amortized cost per insert stays O(1). Swift's `Hashable` requires that equal values (`==`) produce equal hashes; breaking that contract (e.g. a custom `hash(into:)` that ignores a property used in `==`) causes unpredictable Set/Dictionary behavior. Worst case is O(n) if hashing clusters values badly -- average and worst case are different numbers, and interviewers often check you know that.",
    keyPoints: [
      "Hash function -> bucket index -> O(1) average lookup by only checking one bucket",
      "Collisions handled by chaining (list per bucket) or open addressing (probe for next free slot)",
      "Load factor rising triggers an O(n) resize, but amortized cost per insert stays O(1)",
      "Equal values (==) must produce equal hashes, or Set/Dictionary behavior breaks",
      "Worst case degrades to O(n) with a bad hash function -- average != worst case",
    ],
    explanation:
      "A senior answer distinguishes average vs worst case unprompted, names both collision strategies with their trade-offs, and explains the Hashable/Equatable contract precisely rather than just saying 'implement Hashable.'",
  },
];

export default quiz;
