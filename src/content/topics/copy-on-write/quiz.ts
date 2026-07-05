import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "cow-what",
    type: "mcq",
    prompt: "What does copy-on-write (COW) achieve?",
    options: [
      "Value semantics with lazy copying — copies share storage until a mutation forces a real copy",
      "Automatic garbage collection",
      "Making structs into classes",
      "Copying eagerly on every assignment",
    ],
    answer: 0,
    explanation:
      "COW lets value types behave as if copied while sharing the underlying buffer until someone mutates it — so you get value-semantics safety at reference-copy (O(1)) cost until the first write.",
  },
  {
    id: "cow-when-copies",
    type: "predict",
    prompt: "At which step is the buffer actually duplicated?",
    code: `var a = [1, 2, 3]
var b = a       // (A)
_ = b[0]        // (B)
b.append(4)     // (C)`,
    options: [
      "At (C) — the first mutation of the shared buffer",
      "At (A) — the assignment",
      "At (B) — the read",
      "Never",
    ],
    answer: 0,
    explanation:
      "Assignment (A) shares the buffer; reads (B) are free. The O(n) copy happens at the first **mutation** (C), when the runtime sees the buffer isn't uniquely referenced.",
  },
  {
    id: "cow-mechanism-fill",
    type: "fill",
    prompt: "The function that tells whether a class reference is the sole owner (so mutation is safe) is `isKnownUniquely___(&ref)`.",
    answers: ["Referenced", "isKnownUniquelyReferenced"],
    hint: "isKnownUniquely____.",
    explanation:
      "`isKnownUniquelyReferenced(&ref)` returns `true` when the reference is the only strong one. COW uses it to mutate in place when unique and copy first when shared.",
  },
  {
    id: "cow-storage",
    type: "mcq",
    prompt: "How can a value type like Array implement COW at all?",
    options: [
      "Its elements live in a heap buffer behind an internal class reference; copying the struct copies just the reference",
      "It secretly is a class",
      "It disables value semantics",
      "It copies element-by-element on read",
    ],
    answer: 0,
    explanation:
      "The collection wraps its buffer in an internal reference type. Copying the value copies only that reference (O(1)); the buffer is shared until a mutation triggers a duplicate — the essence of COW.",
  },
  {
    id: "cow-reads-free",
    type: "mcq",
    prompt: "What is the cost of reading from a COW collection that shares its buffer with another copy?",
    options: [
      "Free — reads never trigger a copy",
      "O(n) — every read copies",
      "It crashes",
      "It depends on the element type",
    ],
    answer: 0,
    explanation:
      "Reads don't mutate, so they never break sharing — they're free regardless of how many copies share the buffer. Only mutations of a shared buffer pay the copy.",
  },
  {
    id: "cow-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about COW.",
    options: [
      "Passing a large array is O(1) until someone mutates it",
      "`isKnownUniquelyReferenced` lets code mutate in place when the reference is unique",
      "You can implement COW for a custom struct by wrapping storage in a class",
      "COW copies the buffer eagerly on every assignment",
    ],
    answers: [0, 1, 2],
    explanation:
      "O(1) passing, uniqueness-based in-place mutation, and custom COW are correct. COW copies **lazily** (on first mutation), not eagerly (option 3 is false).",
  },
  {
    id: "cow-extra-ref-senior",
    type: "predict",
    prompt: "🧠 Trick question — you mutate an array you expected to modify in place, but it triggers a full copy anyway. Likely cause?",
    code: `var data = [Int](repeating: 0, count: 1_000_000)
let closure = { print(data.count) }   // captures data → extra reference
data.append(1)                        // expected in-place, but copies. Why?`,
    options: [
      "The closure holds another strong reference to the buffer, so it's not uniquely referenced — the mutation copies",
      "append is always O(n)",
      "Arrays can't be mutated after capture",
      "It's a compiler bug",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The closure captured `data`, so its buffer now has more than one reference. When you `append`, `isKnownUniquelyReferenced` is false, so COW makes a full O(n) copy before mutating — a subtle performance cliff caused by an unexpected extra reference.",
  },
  {
    id: "cow-custom-senior",
    type: "mcq",
    prompt: "To implement COW for a custom value type wrapping a class `Box`, what must a mutating method do first?",
    options: [
      "Check `isKnownUniquelyReferenced(&box)` and copy the Box if it's shared, then mutate",
      "Always mutate box directly",
      "Convert the struct to a class",
      "Call deinit on the old box",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Before mutating shared storage you must ensure uniqueness: if `isKnownUniquelyReferenced(&box)` is false, replace `box` with a fresh copy, then mutate. Otherwise you'd corrupt another value that shares the same Box — breaking value semantics.",
  },
  {
    id: "cow-loop-senior",
    type: "mcq",
    prompt: "Why can mutating a COW array in a loop be a performance trap if the buffer is shared?",
    options: [
      "Each mutation may re-copy the buffer if it keeps becoming non-unique — turning O(n) work into O(n²)-ish",
      "Loops disable COW",
      "It always mutates in place",
      "Reads inside the loop copy",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "If something keeps the buffer shared, each mutation triggers a fresh copy. In the worst case repeated copies during a loop blow up the cost. Remove the extra reference (so it's uniquely referenced) and use `reserveCapacity` to keep mutations in place.",
  },
  {
    id: "copy-on-write-flashcard",
    type: "flashcard",
    prompt:
      "Explain copy-on-write: the mechanism, isKnownUniquelyReferenced, and the performance gotcha. Answer aloud, then reveal.",
    modelAnswer:
      "**Copy-on-write (COW)** gives value types **value semantics with lazy copying**. Swift's collections (`Array`/`Dictionary`/`Set`/`String`) store elements in a **heap buffer behind an internal class reference**, so copying the value type copies only that **reference** (**O(1)**) — copies **share** the buffer. **Reads are always free**; the buffer is **duplicated only on the first mutation of a shared copy**, so passing large arrays around is cheap until someone writes. The deciding mechanism is **`isKnownUniquelyReferenced(&ref)`**, which returns whether a class reference is the sole owner: the runtime **mutates in place when unique** and **copies first when shared**. You can implement COW for a **custom** value type by wrapping storage in a class and, in each `mutating` method, checking `isKnownUniquelyReferenced` and copying the storage if it's shared before mutating. The **performance gotcha**: an unexpected **extra strong reference** (e.g. a closure capturing the array, or another variable) makes the buffer non-unique, so a mutation you assumed was in-place triggers a full **O(n) copy** — and doing that repeatedly in a loop can blow up cost. Reads are free, copies are lazy, and the cost lands at the first write to shared storage.",
    keyPoints: [
      "Value semantics + lazy copy: share buffer via internal class ref, copy struct = copy ref (O(1))",
      "Reads free; buffer duplicated only on first mutation of a shared copy",
      "isKnownUniquelyReferenced decides mutate-in-place vs copy-first",
      "Custom COW: wrap storage in a class, check uniqueness before mutating",
      "Gotcha: extra reference (closure capture) → non-unique → mutation forces O(n) copy",
    ],
    explanation:
      "Senior answers describe the buffer-behind-a-class mechanism, isKnownUniquelyReferenced, custom-COW implementation, and the extra-reference performance cliff.",
  },
];

export default quiz;
