import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "valueperf-stack-mcq",
    type: "mcq",
    prompt: "Why is allocating a local struct typically cheaper than allocating a local class instance?",
    options: [
      "The struct is stack-allocated (a pointer bump, freed automatically on return); the class instance requires a heap allocation plus ARC retain/release",
      "Structs skip type checking entirely",
      "Classes are always slower to initialize regardless of memory location",
      "Structs are compiled to machine code, classes are interpreted",
    ],
    answer: 0,
    explanation:
      "A local struct's inline bytes live on the stack — allocation is just bumping a pointer, and it's reclaimed automatically when the function returns. A class instance needs a heap allocation with thread-safe bookkeeping, plus ARC traffic as references to it are created and released.",
  },
  {
    id: "valueperf-struct-heap-predict",
    type: "predict",
    prompt: "Does this struct ever touch the heap?",
    code: `struct Profile {
    var age: Int
    var name: String
}
let p = Profile(age: 30, name: "Ada")`,
    options: [
      "Yes — `name`'s character storage lives on the heap even though `Profile` itself is stack-allocated",
      "No — structs never touch the heap under any circumstances",
      "Only if the struct is stored in a class",
      "Only in Release builds",
    ],
    answer: 0,
    explanation:
      "`Profile`'s own inline bytes (the Int and the String's small inline representation) can live on the stack, but `String` is buffer-backed — its character data is heap storage the struct holds a reference to. \"It's a struct\" does not mean \"no heap allocation anywhere.\"",
  },
  {
    id: "valueperf-cow-cost-fill",
    type: "fill",
    prompt: "Under copy-on-write, assignment and reads are cheap, but mutating a buffer whose reference count is above one triggers a full element-by-element ___.",
    answers: ["copy"],
    hint: "The thing COW is named after, deferred until it's actually needed.",
    explanation:
      "COW defers the real cost — copying every element — until the first mutation of a shared buffer. Reads and assignment only ever copy a reference, which is why they're cheap regardless of collection size.",
  },
  {
    id: "valueperf-cow-stray-ref-senior",
    type: "predict",
    prompt: "Why does this loop become slow, copying on every iteration instead of mutating in place?",
    code: `var data = loadBigArray()
let snapshot = data
for i in data.indices {
    data[i] *= 2
}`,
    options: [
      "`snapshot` holds an extra strong reference to the same buffer, so it's never uniquely referenced and every mutation re-copies it",
      "Array subscript assignment is always O(n) regardless of references",
      "`for i in data.indices` recomputes the whole array each iteration",
      "This code doesn't compile",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`snapshot` keeps the buffer's reference count at 2, so `isKnownUniquelyReferenced` fails on every mutation inside the loop, forcing a full copy each time instead of one copy on the first mutation — a classic COW performance cliff caused by an easy-to-miss extra reference.",
  },
  {
    id: "valueperf-existential-mcq",
    type: "mcq",
    prompt: "What does an `any Shape` existential container store for a large conforming struct that doesn't fit its small inline buffer?",
    options: [
      "A pointer to a heap-allocated copy of the value, alongside type metadata and a witness table",
      "The value is truncated to fit the inline buffer",
      "A compile error is raised",
      "Nothing — existentials only support types small enough to fit inline",
    ],
    answer: 0,
    explanation:
      "The existential container has a small fixed-size inline buffer. A value too large to fit gets boxed onto the heap instead, with the container holding a pointer to it — a hidden allocation cost that generics/`some` avoid entirely.",
  },
  {
    id: "valueperf-witness-table-fill",
    type: "fill",
    prompt: "Calling a protocol method through an `any P` value dispatches dynamically through a per-conforming-type table of function pointers called a ___ table.",
    answers: ["witness"],
    hint: "Conceptually similar to a class's vtable.",
    explanation:
      "The witness table is how an existential resolves which concrete implementation to call at runtime, since the concrete type behind `any P` isn't known at compile time — an extra indirection generics avoid.",
  },
  {
    id: "valueperf-existential-vs-generic-multi",
    type: "multi",
    prompt: "Select all true statements comparing `any Shape` to a generic `func totalArea<S: Shape>(_ shapes: [S])`.",
    options: [
      "The generic version's calls can be resolved statically and even inlined, since the concrete type is known",
      "`any Shape` dispatches through a witness table at runtime",
      "Both approaches box large values onto the heap identically",
      "`some Shape` behaves like the generic case for dispatch purposes, unlike `any Shape`",
    ],
    answers: [0, 1, 3],
    explanation:
      "Generics (and `some`) keep the concrete type known to the compiler, enabling static resolution/inlining with no witness table and no existential container at all — so there's no boxing risk either (option 2 is false; only `any` risks boxing).",
  },
  {
    id: "valueperf-specialization-senior",
    type: "mcq",
    prompt: "What does the compiler's specialization of a generic function produce?",
    options: [
      "A dedicated, fully-typed copy of the function for a specific concrete type, with no generic overhead left",
      "A runtime lookup table mapping types to implementations",
      "A boxed existential wrapping the generic parameter",
      "Nothing — Swift generics always run through type erasure at runtime",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Specialization generates a concrete-type version of a generic function's body — as if you'd hand-written it for that type — eliminating boxing and type-metadata indirection. This is why `Array.map`/`sorted(by:)` on concrete types are typically as fast as a hand-written loop.",
  },
  {
    id: "valueperf-measuring-flashcard",
    type: "flashcard",
    prompt: "Explain the full performance mechanism of Swift value types — allocation, COW, existentials, inlining/specialization — and how you'd verify each claim. Answer aloud, then reveal.",
    modelAnswer:
      "A local struct's own bytes live on the **stack** — allocation is a pointer bump, freed automatically on return, with no heap search or ARC traffic — while a class instance always needs a heap allocation plus retain/release. **Copy-on-write** keeps assignment and reads cheap by sharing a heap buffer behind an internal class reference, paying the real element-by-element copy only on the first mutation of a *shared* buffer; a forgotten extra reference (a closure capture, a snapshot variable) silently defeats this, turning a mutation loop into a full-copy-every-iteration loop. Wrapping a value behind `any P` creates an **existential container**: a small inline buffer that either holds the value directly or, if it's too large, heap-boxes it — and every call dispatches dynamically through a **witness table** rather than being resolved at compile time. A generic function (or `some P`) avoids both costs because the concrete type stays known to the compiler, letting it **inline** the call and generate a **specialized**, fully-typed version of the function with no boxing or indirection. None of this should be trusted blindly: **Instruments' Time Profiler** shows actual dispatch/CPU cost in the call tree, **Instruments' Allocations** confirms whether a 'value type' is quietly still hitting the heap, and `XCTest`'s `measure` gives a quick, repeatable before/after comparison.",
    keyPoints: [
      "Stack allocation for struct's own bytes: pointer bump, no ARC, freed on return",
      "COW: cheap assignment/reads, real copy deferred to first mutation of a shared buffer",
      "A stray extra reference defeats COW's uniqueness check, forcing repeated full copies",
      "any P: existential container boxes oversized values on the heap, dispatches via witness table",
      "Generics/some P: concrete type known statically, enables inlining and specialization",
      "Verify with Instruments Time Profiler (dispatch/CPU) and Allocations (heap traffic), XCTest measure for regressions",
    ],
    explanation:
      "A senior answer treats each performance claim as something to demonstrate with a profiler, not recite as folklore — that's the distinction between 'structs are fast' and actually explaining the four mechanisms behind it.",
  },
];

export default quiz;
