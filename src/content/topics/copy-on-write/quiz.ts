import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "cow-what",
    type: "mcq",
    prompt: "What does copy-on-write (COW) achieve?",
    options: [
      "Value semantics with lazy copying — copies share storage until a mutation forces a real copy",
      "Automatic garbage collection that reclaims heap buffers by tracing all reachable references from the stack and global roots",
      "Making structs behave like classes by giving them identity and reference semantics when passed across function boundaries",
      "Copying the full buffer eagerly on every assignment so each variable always owns an independent, unshared copy of the data",
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
      "At (A) — the assignment, because Swift eagerly copies all value types to ensure each variable has independent storage",
      "At (B) — the read, because accessing a shared buffer requires uniquifying it first to prevent concurrent modification",
      "Never — the runtime reuses the original buffer for all variables indefinitely, regardless of any mutations applied",
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
      "It secretly is a class at the ABI level, with the struct syntax being purely cosmetic sugar that the compiler strips during lowering",
      "It disables value semantics entirely and behaves as a reference type until the optimizer can prove no aliasing exists",
      "It copies element-by-element on every read to ensure that a subsequent mutation on the original never affects the copy",
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
      "O(n) — every subscript read copies the entire buffer to a private shadow so the original is never accidentally mutated",
      "It crashes at runtime with an exclusive-access violation because two variables simultaneously hold the shared buffer",
      "It depends on the element type — value-type elements are read freely but reference-type elements trigger a uniqueness check first",
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
      "append is always O(n) regardless of uniqueness, because the runtime must scan the entire buffer to find the insertion point",
      "Arrays cannot be mutated at all after they have been captured by any closure, even a non-escaping one in the same scope",
      "It is a known compiler bug in the Swift optimizer that incorrectly inserts a copy when a closure captures an array variable",
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
      "Always mutate box directly without any uniqueness check, relying on the caller to ensure no other variable shares the box",
      "Convert the struct to a class so ARC manages the single storage object and all mutations are automatically in-place",
      "Call deinit on the old box explicitly, then replace it with a fresh Box containing a copy of the previous data before mutating",
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
      "Swift loops automatically disable COW for the duration of a for or while body to prevent unnecessary copies per iteration",
      "It always mutates in place because the loop variable is the sole owner of the array and no other reference can exist during iteration",
      "Reads inside the loop trigger a copy of the buffer each time they access an element via subscript on a shared array",
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
